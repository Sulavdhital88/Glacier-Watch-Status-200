#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

// ============================================================
// GEAR 360
// ============================================================

#define CAMERA_SSID       "Gear 360(39A4)"
#define CAMERA_PASSWORD   "70410773"
#define CAMERA_IP         "192.168.43.1"
#define CAMERA_PORT       8888

// ============================================================
// N8R8
// ============================================================

uint8_t BROADCAST_MAC[] = {
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF
};

// ============================================================
// MEMORY
// ============================================================

#define IMAGE_BUFFER_SIZE   5000000
#define GALLERY_BUFFER_SIZE 20000

uint8_t *imageBuffer = nullptr;
char *galleryBuffer = nullptr;

size_t currentImageSize = 0;

// ============================================================
// ESP-NOW PROTOCOL
// ============================================================

#define PACKET_START 1
#define PACKET_DATA  2
#define PACKET_END   3
#define PACKET_ACK   4

#define CHUNK_SIZE       240
#define DATA_PKT_MAX_SIZE 247

#define ACK_START 0
#define ACK_DATA  1
#define ACK_END   2

#define ACK_TIMEOUT 500
#define MAX_RETRIES 8

// ============================================================
// ESP-NOW STATE
// ============================================================

volatile bool ackReceived = false;
volatile uint8_t ackType = 255;
volatile uint32_t ackChunk = 0;

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

// ============================================================
// LITTLE-ENDIAN HELPERS
// ============================================================

void writeU32(uint8_t *buf, uint32_t value)
{
  buf[0] = value & 0xFF;
  buf[1] = (value >> 8) & 0xFF;
  buf[2] = (value >> 16) & 0xFF;
  buf[3] = (value >> 24) & 0xFF;
}

uint32_t readU32(const uint8_t *buf)
{
  return
    ((uint32_t)buf[0]) |
    ((uint32_t)buf[1] << 8) |
    ((uint32_t)buf[2] << 16) |
    ((uint32_t)buf[3] << 24);
}

void writeU16(uint8_t *buf, uint16_t value)
{
  buf[0] = value & 0xFF;
  buf[1] = (value >> 8) & 0xFF;
}

// ============================================================
// URL ENCODING
// ============================================================

String urlEncode(const String &input)
{
  String output;

  const char *hex = "0123456789ABCDEF";

  for (size_t i = 0; i < input.length(); i++)
  {
    char c = input[i];

    if (
      (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      (c >= '0' && c <= '9') ||
      c == '-' ||
      c == '_' ||
      c == '.' ||
      c == '~'
    )
    {
      output += c;
    }
    else
    {
      output += '%';
      output += hex[(c >> 4) & 0x0F];
      output += hex[c & 0x0F];
    }
  }

  return output;
}

// ============================================================
// SEND COMMAND TO GEAR 360
// ============================================================

bool sendCameraCommand(const String &command)
{
  WiFiClient client;

  Serial.print("[CAMERA] Sending: ");
  Serial.println(command);

  if (!client.connect(CAMERA_IP, CAMERA_PORT))
  {
    Serial.println("[CAMERA] HTTP connection FAILED");
    return false;
  }

  String encoded = urlEncode(command);

  String request =
    "GET /cgi-bin/execute?rawcmd=" +
    encoded +
    " HTTP/1.0\r\n"
    "Host: " + String(CAMERA_IP) + ":" + String(CAMERA_PORT) + "\r\n"
    "Connection: close\r\n\r\n";

  client.print(request);

  unsigned long start = millis();

  while (!client.available())
  {
    if (millis() - start > 3000)
    {
      client.stop();
      Serial.println("[CAMERA] Response timeout");
      return false;
    }

    delay(10);
  }

  String response = client.readStringUntil('\n');

  Serial.print("[CAMERA] Response: ");
  Serial.println(response);

  client.stop();

  return true;
}

// ============================================================
// TAKE PHOTO
// ============================================================

bool takePhoto()
{
  Serial.println();
  Serial.println("================================");
  Serial.println("[CAMERA] TAKING HDR PHOTO");
  Serial.println("================================");

  // IMPORTANT:
  // HDR is NOT configured here.
  //
  // The camera must already be manually set to HDR
  // using the physical camera buttons.

  if (!sendCameraCommand("st key click s2"))
  {
    Serial.println("[CAMERA] Shutter command FAILED");
    return false;
  }

  Serial.println("[CAMERA] Shutter command sent");

  // Give HDR processing/stitching time to finish.
  Serial.println("[CAMERA] Waiting 12 seconds...");
  delay(12000);

  return true;
}

// ============================================================
// FIND LATEST IMAGE
// ============================================================

String findLatestImage()
{
  WiFiClient client;

  Serial.println();
  Serial.println("[GALLERY] Finding latest image...");

  if (!client.connect(CAMERA_IP, CAMERA_PORT))
  {
    Serial.println("[GALLERY] Connection FAILED");
    return "";
  }

  String request =
    "GET /cgi-bin/gallery?filedir=/sdcard/DCIM/100PHOTO HTTP/1.0\r\n"
    "Host: " + String(CAMERA_IP) + ":" + String(CAMERA_PORT) + "\r\n"
    "Connection: close\r\n\r\n";

  client.print(request);

  size_t pos = 0;

  unsigned long lastData = millis();

  while (client.connected() || client.available())
  {
    uint8_t buf[512];

    while (client.available())
    {
      int bytesRead = client.read(buf, sizeof(buf));

      if (bytesRead > 0)
      {
        lastData = millis();

        for (int i = 0; i < bytesRead; i++)
        {
          if (pos < GALLERY_BUFFER_SIZE - 1)
          {
            galleryBuffer[pos++] = (char)buf[i];
          }
        }
      }
    }

    if (millis() - lastData > 5000)
      break;

    delay(1);
  }

  galleryBuffer[pos] = '\0';

  client.stop();

  Serial.print("[GALLERY] Response size: ");
  Serial.println(pos);

  int latestNumber = -1;
  String latestFile = "";

  char *p = galleryBuffer;

  while ((p = strstr(p, "SAM_")) != nullptr)
  {
    int number = 0;
    int digits = 0;

    while (
      p[4 + digits] >= '0' &&
      p[4 + digits] <= '9'
    )
    {
      number =
        number * 10 +
        (p[4 + digits] - '0');

      digits++;
    }

    if (
      digits > 0 &&
      p[4 + digits] == '.' &&
      p[4 + digits + 1] == 'J' &&
      p[4 + digits + 2] == 'P' &&
      p[4 + digits + 3] == 'G'
    )
    {
      if (number > latestNumber)
      {
        latestNumber = number;

        latestFile =
          String(p).substring(
            0,
            4 + digits + 4
          );
      }
    }

    p += 4;
  }

  if (latestFile.length() > 0)
  {
    Serial.print("[GALLERY] Latest image: ");
    Serial.println(latestFile);
  }
  else
  {
    Serial.println("[GALLERY] No JPEG found");
  }

  return latestFile;
}

// ============================================================
// DOWNLOAD JPEG
// ============================================================

bool downloadImage(const String &filename)
{
  WiFiClient client;

  Serial.println();
  Serial.println("[JPEG] Downloading:");
  Serial.println(filename);

  if (!client.connect(CAMERA_IP, CAMERA_PORT))
  {
    Serial.println("[JPEG] HTTP connection FAILED");
    return false;
  }

  String path =
    "/cgi-bin/gallery?imfile=/sdcard/DCIM/100PHOTO/" +
    filename;

  String request =
    "GET " + path + " HTTP/1.0\r\n"
    "Host: " + String(CAMERA_IP) + ":" + String(CAMERA_PORT) + "\r\n"
    "Connection: close\r\n\r\n";

  client.print(request);

  size_t stored = 0;

  bool jpegStarted = false;

  uint8_t previousByte = 0;

  unsigned long lastData = millis();

  while (client.connected() || client.available())
  {
    uint8_t buf[2048];

    while (client.available())
    {
      int bytesRead = client.read(buf, sizeof(buf));

      if (bytesRead <= 0)
        continue;

      lastData = millis();

      for (int i = 0; i < bytesRead; i++)
      {
        uint8_t b = buf[i];

        // Find JPEG FF D8
        if (!jpegStarted)
        {
          if (
            previousByte == 0xFF &&
            b == 0xD8
          )
          {
            jpegStarted = true;

            if (stored + 2 <= IMAGE_BUFFER_SIZE)
            {
              imageBuffer[stored++] = 0xFF;
              imageBuffer[stored++] = 0xD8;
            }

            Serial.println("[JPEG] JPEG START FOUND!");
          }
        }
        else
        {
          if (stored < IMAGE_BUFFER_SIZE)
          {
            imageBuffer[stored++] = b;
          }
          else
          {
            Serial.println("[JPEG] BUFFER FULL");
            client.stop();
            return false;
          }
        }

        previousByte = b;
      }
    }

    if (millis() - lastData > 5000)
    {
      Serial.println("[JPEG] Stream timeout");
      break;
    }

    delay(1);
  }

  client.stop();

  if (!jpegStarted)
  {
    Serial.println("[JPEG] JPEG START NOT FOUND");
    return false;
  }

  // Find JPEG end FF D9
  size_t actualSize = stored;

  bool jpegFinished = false;

  while (actualSize >= 2)
  {
    if (
      imageBuffer[actualSize - 2] == 0xFF &&
      imageBuffer[actualSize - 1] == 0xD9
    )
    {
      jpegFinished = true;
      break;
    }

    actualSize--;
  }

  if (!jpegFinished)
  {
    Serial.println("[JPEG] JPEG END NOT FOUND");
    return false;
  }

  currentImageSize = actualSize;

  Serial.print("[JPEG] Final size: ");
  Serial.print(currentImageSize);
  Serial.println(" bytes");

  if (currentImageSize < 100)
  {
    Serial.println("[JPEG] Image too small");
    return false;
  }

  uint32_t crc =
    crc32(imageBuffer, currentImageSize);

  Serial.print("[JPEG] CRC32: 0x");
  Serial.println(crc, HEX);

  return true;
}

// ============================================================
// ESP-NOW CALLBACKS
// ============================================================

void onDataSent(
  const wifi_tx_info_t *tx_info,
  esp_now_send_status_t status
)
{
}

void onDataRecv(
  const esp_now_recv_info_t *info,
  const uint8_t *data,
  int len
)
{
  if (len < 6)
    return;

  if (data[0] != PACKET_ACK)
    return;

  ackType = data[1];

  ackChunk =
    readU32(&data[2]);

  ackReceived = true;
}

// ============================================================
// WAIT FOR ACK
// ============================================================

bool waitForAck(
  uint8_t expectedType,
  uint32_t expectedChunk
)
{
  ackReceived = false;

  unsigned long start = millis();

  while (millis() - start < ACK_TIMEOUT)
  {
    if (ackReceived)
    {
      if (
        ackType == expectedType &&
        ackChunk == expectedChunk
      )
      {
        return true;
      }

      ackReceived = false;
    }

    delay(1);
  }

  return false;
}

// ============================================================
// SEND START PACKET
// ============================================================

bool sendStartPacket(
  size_t imageSize,
  uint32_t totalChunks
)
{
  uint8_t packet[11];

  packet[0] = PACKET_START;

  writeU32(
    &packet[1],
    imageSize
  );

  writeU32(
    &packet[5],
    totalChunks
  );

  writeU16(
    &packet[9],
    CHUNK_SIZE
  );

  for (
    int attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  )
  {
    ackReceived = false;

    esp_now_send(
      BROADCAST_MAC,
      packet,
      sizeof(packet)
    );

    if (
      waitForAck(
        ACK_START,
        0
      )
    )
    {
      return true;
    }

    Serial.print("[ESP-NOW] START retry ");
    Serial.println(attempt);
  }

  return false;
}

// ============================================================
// SEND DATA CHUNK
// ============================================================

bool sendDataChunk(
  uint32_t chunkNumber,
  const uint8_t *data,
  uint16_t length
)
{
  uint8_t packet[DATA_PKT_MAX_SIZE];

  packet[0] = PACKET_DATA;

  writeU32(
    &packet[1],
    chunkNumber
  );

  writeU16(
    &packet[5],
    length
  );

  memcpy(
    &packet[7],
    data,
    length
  );

  uint16_t packetLength =
    7 + length;

  for (
    int attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  )
  {
    ackReceived = false;

    esp_now_send(
      BROADCAST_MAC,
      packet,
      packetLength
    );

    if (
      waitForAck(
        ACK_DATA,
        chunkNumber
      )
    )
    {
      return true;
    }
  }

  return false;
}

// ============================================================
// SEND END PACKET
// ============================================================

bool sendEndPacket(
  size_t imageSize,
  uint32_t totalChunks,
  uint32_t sourceCRC
)
{
  uint8_t packet[13];

  packet[0] = PACKET_END;

  writeU32(
    &packet[1],
    imageSize
  );

  writeU32(
    &packet[5],
    totalChunks
  );

  writeU32(
    &packet[9],
    sourceCRC
  );

  for (
    int attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  )
  {
    ackReceived = false;

    esp_now_send(
      BROADCAST_MAC,
      packet,
      sizeof(packet)
    );

    if (
      waitForAck(
        ACK_END,
        0
      )
    )
    {
      return true;
    }

    Serial.print("[ESP-NOW] END retry ");
    Serial.println(attempt);
  }

  return false;
}

// ============================================================
// SEND IMAGE
// ============================================================

bool sendImage()
{
  if (currentImageSize == 0)
    return false;

  uint32_t totalChunks =
    (currentImageSize + CHUNK_SIZE - 1)
    / CHUNK_SIZE;

  uint32_t sourceCRC =
    crc32(
      imageBuffer,
      currentImageSize
    );

  Serial.println();
  Serial.println("[ESP-NOW] SENDING IMAGE");
  Serial.print("[ESP-NOW] Size: ");
  Serial.println(currentImageSize);
  Serial.print("[ESP-NOW] Chunks: ");
  Serial.println(totalChunks);

  // START
  if (
    !sendStartPacket(
      currentImageSize,
      totalChunks
    )
  )
  {
    Serial.println("[ESP-NOW] START FAILED");
    return false;
  }

  // DATA
  for (
    uint32_t chunk = 0;
    chunk < totalChunks;
    chunk++
  )
  {
    size_t offset =
      (size_t)chunk * CHUNK_SIZE;

    size_t remaining =
      currentImageSize - offset;

    uint16_t length =
      remaining > CHUNK_SIZE
      ? CHUNK_SIZE
      : remaining;

    if (
      !sendDataChunk(
        chunk,
        &imageBuffer[offset],
        length
      )
    )
    {
      Serial.print("[ESP-NOW] FAILED CHUNK: ");
      Serial.println(chunk);

      return false;
    }
  }

  // END
  if (
    !sendEndPacket(
      currentImageSize,
      totalChunks,
      sourceCRC
    )
  )
  {
    Serial.println("[ESP-NOW] END FAILED");
    return false;
  }

  Serial.println("[ESP-NOW] IMAGE SENT SUCCESSFULLY!");

  return true;
}

// ============================================================
// ESP-NOW INITIALIZATION
// ============================================================

bool initESPNow()
{
  if (esp_now_init() != ESP_OK)
  {
    Serial.println("[ESP-NOW] INIT FAILED");
    return false;
  }

  esp_now_register_send_cb(onDataSent);
  esp_now_register_recv_cb(onDataRecv);

  esp_now_peer_info_t peerInfo = {};

  memcpy(
    peerInfo.peer_addr,
    BROADCAST_MAC,
    6
  );

  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (
    esp_now_add_peer(&peerInfo) != ESP_OK
  )
  {
    Serial.println("[ESP-NOW] PEER ADD FAILED");
    return false;
  }

  Serial.println("[ESP-NOW] READY");

  return true;
}

// ============================================================
// CONNECT TO GEAR 360
// ============================================================

bool connectCamera()
{
  if (WiFi.status() == WL_CONNECTED)
    return true;

  Serial.println();
  Serial.println("[CAMERA] CONNECTING TO GEAR 360...");

  WiFi.disconnect(true);

  delay(100);

  WiFi.mode(WIFI_STA);

  WiFi.setSleep(false);

  WiFi.begin(
    CAMERA_SSID,
    CAMERA_PASSWORD,
    6
  );

  unsigned long start = millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - start < 15000
  )
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("[CAMERA] WIFI FAILED");
    return false;
  }

  Serial.println("[CAMERA] CONNECTED!");

  Serial.print("[CAMERA] N16 IP: ");
  Serial.println(WiFi.localIP());

  // NO HDR COMMAND
  // NO ISO COMMAND
  // NO EV COMMAND
  // NO CAMERA SETTING COMMAND

  return initESPNow();
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(2000);

  Serial.println();
  Serial.println("================================");
  Serial.println(" GLACIERWATCH N16R8");
  Serial.println(" GEAR 360 HDR TEST");
  Serial.println("================================");

  if (!psramFound())
  {
    Serial.println("[MEMORY] PSRAM NOT FOUND");
    return;
  }

  Serial.println("[MEMORY] PSRAM FOUND");

  imageBuffer =
    (uint8_t *)ps_malloc(
      IMAGE_BUFFER_SIZE
    );

  galleryBuffer =
    (char *)ps_malloc(
      GALLERY_BUFFER_SIZE
    );

  if (
    imageBuffer == nullptr ||
    galleryBuffer == nullptr
  )
  {
    Serial.println("[MEMORY] PSRAM ALLOCATION FAILED");
    return;
  }

  Serial.println("[MEMORY] BUFFERS READY");

  while (!connectCamera())
  {
    delay(5000);
  }
}

// ============================================================
// LOOP
// ============================================================

void loop()
{
  // ----------------------------------------------------------
  // 1. Make sure Gear 360 is connected
  // ----------------------------------------------------------

  if (!connectCamera())
  {
    delay(5000);
    return;
  }

  // ----------------------------------------------------------
  // 2. Take photo
  //
  // IMPORTANT:
  // Camera should already be manually set to HDR.
  // The ONLY command sent here is:
  //
  // st key click s2
  // ----------------------------------------------------------

  if (!takePhoto())
  {
    delay(10000);
    return;
  }

  // ----------------------------------------------------------
  // 3. Find newest image
  // ----------------------------------------------------------

  String filename =
    findLatestImage();

  if (filename.length() == 0)
  {
    Serial.println("[PIPELINE] No image found");
    delay(10000);
    return;
  }

  // ----------------------------------------------------------
  // 4. Download image
  // ----------------------------------------------------------

  if (!downloadImage(filename))
  {
    Serial.println("[PIPELINE] Download failed");
    delay(10000);
    return;
  }

  // ----------------------------------------------------------
  // 5. Send image to N8R8
  // ----------------------------------------------------------

  if (sendImage())
  {
    Serial.println();
    Serial.println("================================");
    Serial.println(" FULL PIPELINE COMPLETE");
    Serial.println("================================");
  }
  else
  {
    Serial.println("[PIPELINE] ESP-NOW transfer failed");
  }

  // Wait before next shot
  delay(15000);
}