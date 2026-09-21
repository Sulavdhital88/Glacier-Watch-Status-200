# GlacierWatch — ESP32 Firmware & Hardware Bridge

This directory contains the embedded C++ firmware and serial bridge scripts for the physical edge data acquisition pipeline.

---

## Hardware Architecture

```
[Samsung Gear 360 Camera]
       │ (WiFi HTTP rawcmd shutter trigger & JPEG pull)
       ▼
[ESP32-S3 N16R8 Transmitter] (Field unit at moraine crest)
       │ (ESP-NOW 2.4 GHz, 240-byte chunks + Stop-and-Wait ACK)
       ▼
[ESP32-S3 N8R8 Receiver] (Base station unit)
       │ (USB CDC Serial @ 2,000,000 baud with "GWIM" framing)
       ▼
[PC / Edge Ingestion Engine] (`receive_image.py` / `server/esp_receiver.py`)
       │ (CRC32 Check + Pillow JPEG validation ➔ received_images/)
       ▼
[MobileNetV2 Classifier + FastAPI Console]
```

---

## Directory Contents

| Path | Description |
|---|---|
| `N16R8/N16R8.ino` | Firmware for the **Transmitter ESP32-S3** (16MB Flash, 8MB PSRAM). Connects to Samsung Gear 360 over Wi-Fi, fetches the optical capture into PSRAM, packetizes it into 240-byte chunks, and broadcasts via ESP-NOW with frame-level ACK retries. |
| `N8R8/N8R8.ino` | Firmware for the **Receiver ESP32-S3** (8MB Flash, 8MB PSRAM). Listens on ESP-NOW, dynamically registers transmitter MAC, reassembles chunks in PSRAM, verifies full CRC32, and streams the JPEG over USB Serial using the `GWIM` protocol. |
| `receive_image.py` | Standalone Python serial ingestion client that connects to the receiver on `COM4` @ `2,000,000` baud, validates framing and CRC32, decodes with Pillow, and writes to disk. |
| `sms.py` | Emergency broadcast script interfacing with a local Android SMS Gateway HTTP service. |

---

## Flashing Instructions (Arduino IDE / ESP-IDF)

### 1. Board & Toolchain Configuration
- **Board**: `ESP32S3 Dev Module`
- **USB CDC On Boot**: `Enabled`
- **CPU Frequency**: `240 MHz (WiFi)`
- **Core Debug Level**: `None` (or `Info` for bench testing)
- **Flash Mode**: `QIO 80MHz`

### 2. Memory Settings
- **N16R8 (Transmitter)**:
  - **Flash Size**: `16MB (128Mb)`
  - **Partition Scheme**: `16M Flash (3MB APP / 9.9MB FATFS)`
  - **PSRAM**: `OPI PSRAM` (Enabled)
- **N8R8 (Receiver)**:
  - **Flash Size**: `8MB (64Mb)`
  - **Partition Scheme**: `8M with spiffs`
  - **PSRAM**: `OPI PSRAM` (Enabled)

---

## Serial Protocols & Specifications

- **Radio**: 2.4 GHz ESP-NOW (802.11 Action Frames, router-free)
- **Chunk Size**: 240 bytes payload + 7-byte metadata header
- **Integrity**: Hardware IEEE 802.3 CRC32
- **USB CDC Baud Rate**: `2,000,000` (2 Mbps)
- **USB Magic Word**: `GWIM` (GlacierWatch Image)
