#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

// ============================================================
// GEAR 360
// ============================================================

#define CAMERA_SSID "Gear 360(39A4)"

// ============================================================
// N16R8 MAC
// ============================================================

uint8_t n16Mac[6] = { 0, 0, 0, 0, 0, 0 };
bool n16PeerAdded = false;
volatile bool pendingPeerAdd = false;     

// ============================================================
// PACKETS
// ============================================================

#define PACKET_START 1
#define PACKET_DATA  2
#define PACKET_END   3
#define PACKET_ACK   4

#define ACK_START 0
#define ACK_DATA  1
#define ACK_END   2

#define CHUNK_SIZE 240
#define DATA_PKT_MAX_SIZE 247

// ============================================================
// MEMORY
// ============================================================

#define IMAGE_BUFFER_SIZE 5000000

uint8_t *imageBuffer = nullptr;
uint8_t *chunkMap = nullptr;

size_t expectedImageSize = 0;
uint32_t expectedChunks = 0;
uint16_t senderChunkSize = 0;

uint32_t receivedChunks = 0;
size_t receivedImageBytes = 0;
uint32_t senderCRC = 0;

volatile bool packetWaiting = false;
uint8_t incomingPacket[DATA_PKT_MAX_SIZE];
int incomingPacketLength = 0;
portMUX_TYPE packetMux = portMUX_INITIALIZER_UNLOCKED;

// ============================================================
// USB PROTOCOL
// ============================================================

#define USB_MAGIC "GWIM"
#define USB_READY 0x52
#define USB_ACK   0x41
#define USB_BLOCK_SIZE 32768

// ============================================================
// CRC32
// ============================================================

uint32_t crc32(const uint8_t *data, size_t length)
{
  uint32_t crc = 0xFFFFFFFF;
  for (size_t i = 0; i < length; i++)
  {
    crc ^= data[i];
    for (int j = 0; j < 8; j++)
    {
      if (crc & 1)
        crc = (crc >> 1) ^ 0xEDB88320;
      else
        crc >>= 1;
    }
  }
  return ~crc;
}

void writeU32(uint8_t *buf, uint32_t value)
{
  buf[0] = value & 0xFF;
  buf[1] = (value >> 8) & 0xFF;
  buf[2] = (value >> 16) & 0xFF;
  buf[3] = (value >> 24) & 0xFF;
}

uint32_t readU32(const uint8_t *buf)
{
  return ((uint32_t)buf[0]) | ((uint32_t)buf[1] << 8) | ((uint32_t)buf[2] << 16) | ((uint32_t)buf[3] << 24);
}

uint16_t readU16(const uint8_t *buf)
{
  return ((uint16_t)buf[0]) | ((uint16_t)buf[1] << 8);
}

// ============================================================
// ADD N16 PEER
// ============================================================

bool addN16Peer(const uint8_t *mac)
{
  if (esp_now_is_peer_exist(mac))
  {
    n16PeerAdded = true;
    return true;
  }

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, mac, 6);
  peerInfo.channel = WiFi.channel();
  peerInfo.encrypt = false;

  esp_err_t result = esp_now_add_peer(&peerInfo);
  if (result == ESP_OK || result == ESP_ERR_ESPNOW_EXIST)
  {
    n16PeerAdded = true;
    Serial.println("[N8-ESPNOW] N16R8 PEER ADDED.");
    return true;
  }

  Serial.println("[N8-ESPNOW] Failed to add N16 peer.");
  return false;
}

// ============================================================
// ACK
// ============================================================

void sendAck(uint8_t ackKind, uint32_t chunkNumber)
{
  if (!n16PeerAdded) return;
  uint8_t packet[6];
  packet[0] = PACKET_ACK;
  packet[1] = ackKind;
  writeU32(&packet[2], chunkNumber);
  esp_now_send(n16Mac, packet, sizeof(packet));
}

// ============================================================
// ESP-NOW CALLBACKS
// ============================================================

void onDataSent(const wifi_tx_info_t *tx_info, esp_now_send_status_t status)
{
}

void onDataRecv(const esp_now_recv_info_t *info, const uint8_t *data, int len)
{
  if (len <= 0) return;

  if (!n16PeerAdded && !pendingPeerAdd)
  {
    memcpy(n16Mac, info->src_addr, 6);
    pendingPeerAdd = true;
  }

  if (len > DATA_PKT_MAX_SIZE) return;

  portENTER_CRITICAL_ISR(&packetMux);
  if (!packetWaiting)
  {
    memcpy(incomingPacket, data, len);
    incomingPacketLength = len;
    packetWaiting = true;
  }
  portEXIT_CRITICAL_ISR(&packetMux);
}

bool getIncomingPacket(uint8_t *buffer, int &len)
{
  bool available = false;
  portENTER_CRITICAL(&packetMux);
  if (packetWaiting)
  {
    memcpy(buffer, incomingPacket, incomingPacketLength);
    len = incomingPacketLength;
    packetWaiting = false;
    available = true;
  }
  portEXIT_CRITICAL(&packetMux);
  return available;
}

void resetImageState()
{
  expectedImageSize = 0;
  expectedChunks = 0;
  senderChunkSize = 0;
  receivedChunks = 0;
  receivedImageBytes = 0;
  senderCRC = 0;
  if (chunkMap)
  {
    free(chunkMap);
    chunkMap = nullptr;
  }
}

// ============================================================
// HANDLE PACKETS
// ============================================================

void handleStart(const uint8_t *packet, int len)
{
  if (len < 11) return;
  
  expectedImageSize = readU32(&packet[1]);
  expectedChunks = readU32(&packet[5]);
  senderChunkSize = readU16(&packet[9]);

  Serial.println("\n[N8-ESPNOW] START PACKET RECEIVED");
  
  if (expectedImageSize == 0 || expectedImageSize > IMAGE_BUFFER_SIZE)
  {
    Serial.println("[N8-ESPNOW] Invalid image size!");
    return;
  }

  uint32_t maxPossibleChunks = (IMAGE_BUFFER_SIZE / CHUNK_SIZE) + 2;
  if (expectedChunks == 0 || expectedChunks > maxPossibleChunks)
  {
    Serial.println("[N8-ESPNOW] Invalid chunk count!");
    return;
  }

  if (chunkMap) free(chunkMap);
  chunkMap = (uint8_t *)malloc(expectedChunks);
  if (!chunkMap)
  {
    Serial.println("[N8-ESPNOW] Chunk map allocation FAILED!");
    return;
  }
  memset(chunkMap, 0, expectedChunks);

  receivedChunks = 0;
  receivedImageBytes = 0;
  senderCRC = 0;
  
  sendAck(ACK_START, 0);
}

void handleData(const uint8_t *packet, int len)
{
  if (len < 7) return;
  uint32_t chunkNumber = readU32(&packet[1]);
  uint16_t dataLength = readU16(&packet[5]);

  if (dataLength > CHUNK_SIZE || 7 + dataLength > len || chunkNumber >= expectedChunks) return;

  size_t offset = (size_t)chunkNumber * senderChunkSize;
  if (offset + dataLength > expectedImageSize) return;

  if (chunkMap[chunkNumber])
  {
    sendAck(ACK_DATA, chunkNumber);
    return;
  }

  memcpy(&imageBuffer[offset], &packet[7], dataLength);
  chunkMap[chunkNumber] = 1;
  receivedChunks++;
  receivedImageBytes += dataLength;
  
  sendAck(ACK_DATA, chunkNumber);
}

bool handleEnd(const uint8_t *packet, int len)
{
  if (len < 13) return false;
  size_t imageSize = readU32(&packet[1]);
  uint32_t totalChunks = readU32(&packet[5]);
  senderCRC = readU32(&packet[9]);

  Serial.println("\n[N8-ESPNOW] END PACKET RECEIVED");

  if (imageSize != expectedImageSize || totalChunks != expectedChunks)
  {
    Serial.println("[N8-ESPNOW] SIZE MISMATCH!");
    return false;
  }

  for (uint32_t i = 0; i < expectedChunks; i++)
  {
    if (!chunkMap[i])
    {
      Serial.print("[N8-ESPNOW] MISSING CHUNK: ");
      Serial.println(i);
      return false;
    }
  }

  bool jpegStart = imageBuffer[0] == 0xFF && imageBuffer[1] == 0xD8;
  bool jpegEnd = imageBuffer[expectedImageSize - 2] == 0xFF && imageBuffer[expectedImageSize - 1] == 0xD9;

  if (!jpegStart || !jpegEnd)
  {
    Serial.println("[N8-JPEG] JPEG MARKERS INVALID");
    return false;
  }

  uint32_t reconstructedCRC = crc32(imageBuffer, expectedImageSize);
  
  Serial.print("[N8-JPEG] CRC32: 0x");
  Serial.println(reconstructedCRC, HEX);

  if (senderCRC != reconstructedCRC)
  {
    Serial.println("[N8-JPEG] CRC MISMATCH!");
    return false;
  }

  Serial.println("[N8-JPEG] IMAGE RECEIVED SUCCESSFULLY!");
  return true;
}

// ============================================================
// USB TRANSFER
// ============================================================

bool waitForPCByte(uint8_t expected, unsigned long timeout)
{
  unsigned long start = millis();
  while (millis() - start < timeout)
  {
    if (Serial.available())
    {
      if (Serial.read() == expected) return true;
    }
    delay(1);
  }
  return false;
}

bool sendImageToPC()
{
  Serial.write((const uint8_t *)USB_MAGIC, 4);
  
  uint8_t sizeBytes[4];
  writeU32(sizeBytes, expectedImageSize);
  Serial.write(sizeBytes, 4);
  Serial.flush();

  if (!waitForPCByte(USB_READY, 10000)) return false;

  size_t offset = 0;
  while (offset < expectedImageSize)
  {
    size_t remaining = expectedImageSize - offset;
    uint16_t blockLength = remaining > USB_BLOCK_SIZE ? USB_BLOCK_SIZE : remaining;
    
    uint8_t lengthBytes[2];
    lengthBytes[0] = blockLength & 0xFF;
    lengthBytes[1] = (blockLength >> 8) & 0xFF;
    
    Serial.write(lengthBytes, 2);
    Serial.write(&imageBuffer[offset], blockLength);
    Serial.flush();

    if (!waitForPCByte(USB_ACK, 5000)) return false;
    offset += blockLength;
  }

  uint32_t finalCRC = crc32(imageBuffer, expectedImageSize);
  uint8_t crcPacket[5];
  crcPacket[0] = 'C';
  writeU32(&crcPacket[1], finalCRC);
  Serial.write(crcPacket, 5);
  Serial.flush();

  if (!waitForPCByte(USB_ACK, 5000)) return false;
  
  return true;
}

// ============================================================
// SETUP
// ============================================================

int findGear360Channel()
{
  WiFi.mode(WIFI_STA);
  delay(100);

  while (true)
  {
    Serial.println("\n[N8-WIFI] Scanning for networks...");
    int networks = WiFi.scanNetworks(false, true);

    bool found = false;
    int foundChannel = 6;

    if (networks == 0)
    {
      Serial.println("  -> No networks found at all!");
    }
    else if (networks < 0)
    {
      Serial.print("  -> Scan failed with error code: ");
      Serial.println(networks);
    }
    
    for (int i = 0; i < networks; i++)
    {
      String ssid = WiFi.SSID(i);
      int channel = WiFi.channel(i);
      int rssi = WiFi.RSSI(i);

      Serial.print("  -> ");
      Serial.print(ssid);
      Serial.print(" (CH ");
      Serial.print(channel);
      Serial.print(", RSSI ");
      Serial.print(rssi);
      Serial.println(")");

      if (ssid == CAMERA_SSID)
      {
        foundChannel = channel;
        found = true;
      }
    }

    WiFi.scanDelete();

    if (found)
    {
      Serial.print("\n[N8-WIFI] GEAR 360 FOUND ON CHANNEL ");
      Serial.println(foundChannel);
      Serial.println("[N8-WIFI] Ready to receive images!");
      return foundChannel;
    }
    else
    {
      Serial.println("\n[N8-WIFI] GEAR 360 NOT FOUND.");
      Serial.println("Retrying in 3 seconds...");
      delay(3000);
    }
  }
}

void setup()
{
  Serial.begin(2000000);
  delay(2000);

  if (psramFound())
  {
    imageBuffer = (uint8_t *)ps_malloc(IMAGE_BUFFER_SIZE);
  }

  int channel = findGear360Channel();
  esp_wifi_set_channel(channel, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() == ESP_OK)
  {
    esp_now_register_send_cb(onDataSent);
    esp_now_register_recv_cb(onDataRecv);
  }
}

void loop()
{
  if (pendingPeerAdd)
  {
    addN16Peer(n16Mac);
    pendingPeerAdd = false;
  }

  uint8_t packet[DATA_PKT_MAX_SIZE];
  int len = 0;

  if (getIncomingPacket(packet, len))
  {
    uint8_t type = packet[0];
    
    if (type == PACKET_START) handleStart(packet, len);
    else if (type == PACKET_DATA) handleData(packet, len);
    else if (type == PACKET_END)
    {
      if (handleEnd(packet, len))
      {
        sendAck(ACK_END, 0);
        delay(100);
        
        bool usbOK = sendImageToPC();
        
        Serial.println();
        if (usbOK) Serial.println("[N8-USB] TRANSFER COMPLETE.");
        else Serial.println("[N8-USB] TRANSFER FAILED.");
        
        resetImageState();
      }
      else
      {
        Serial.println("\n[N8-ESPNOW] IMAGE REJECTED.");
        resetImageState();
      }
    }
  }
  delay(1);
}