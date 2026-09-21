# GlacierWatch 🏔️
### AI-Assisted Glacial Lake Outburst Flood (GLOF) Monitoring & Early-Warning System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![PyTorch](https://img.shields.io/badge/AI%2FML-PyTorch%20MobileNetV2-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org)
[![ESP32-S3](https://img.shields.io/badge/Hardware-ESP32--S3%20(ESP--NOW)-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**GlacierWatch** is a low-cost, multi-tier environmental monitoring and early-warning prototype designed for remote, high-altitude glacial lake basins in the Himalayas.

Because glacial moraines lack cellular towers, grid electricity, and commercial internet connectivity, GlacierWatch combines an ad-hoc 2.4 GHz optical transceiver link, edge microcontrollers, lightweight deep learning computer vision, and a human-in-the-loop incident response console.

---

## 🏛️ System Architecture

```
[Samsung Gear 360 Camera]
       │  (Local Wi-Fi HTTP API / rawcmd shutter trigger)
       ▼
[ESP32-S3 N16R8 Transmitter] (Field Unit at Moraine Crest)
       │  (ESP-NOW 2.4 GHz, 240-byte chunks + hardware ACK)
       ▼
[ESP32-S3 N8R8 Receiver] (Base Station Unit)
       │  (USB CDC Serial @ 2,000,000 baud with "GWIM" framing)
       ▼
[PC Ingestion Engine] (`esp32/receive_image.py` / `server/esp_receiver.py`)
       │  (IEEE 802.3 CRC32 Verification + Pillow JPEG deep decode)
       ▼
[Watchdog Observer + PyTorch MobileNetV2 Inference]
       │  (3-Class Lake State Classification: DECREASING, NORMAL, RISING)
       ▼
[Unified FastAPI Server + WebSocket Event Stream]
       │  (Real-Time State Push, Telemetry APIs, Audit Logger)
       ▼
[React 18 + Leaflet GIS + Tailwind CSS Dashboard] ───➔ [Android SMS Gateway]
(Human Operator Verification & Map Route)             (Alerts to Basin Residents)
```

---

## 🚀 Key Features

1. **Router-Free Edge Radio Link (ESP-NOW)**:
   - Slices and transmits high-resolution JPEG imagery across moraine terrain using connectionless 2.4 GHz 802.11 action frames.
   - Squeezes multi-megabyte captures into resource-constrained microcontrollers via **8 MB Octal PSRAM** memory mapping and a 240-byte chunk bitmap.
2. **High-Speed 2,000,000 Baud Serial Stream**:
   - Streams reconstructed JPEGs from the receiver to the base-station PC in ~1–2 seconds via custom **"GWIM"** (GlacierWatch Image) block flow control.
3. **Computer Vision Classification (MobileNetV2)**:
   - Evaluates lake margin boundary shifts into 3 actionable states: `DECREASING`, `NORMAL`, and `RISING`.
   - Optimized for rapid CPU inference (~30–50 ms latency) without requiring bulky GPU hardware at field stations.
   - Achieves **93.48% validation accuracy** on held-out test frames.
4. **Contextual GIS Mapping (Leaflet + OpenStreetMap)**:
   - Traces the exact river drainage path along the Langtang Khola canyon through downstream settlements (*Kyanjin*, *Ghora Tabela*, *Lama Hotel*, *Bamboo*, *Syabrubesi*).
   - Dynamically calculates that **2,450 residents** live directly along the immediate riverside basin.
5. **Human-Verified Emergency Alerting**:
   - Adheres to the principle that **the AI never broadcasts autonomously**.
   - Requires explicit human operator confirmation before dispatching SMS alerts through local Android SMS gateways.
6. **Multi-Hazard Sensor Scalability**:
   - Architectural provisions for hydrological transducers, triaxial accelerometers, ambient temperature, snowpack depth, and rainfall pluviometers.

---

## 📂 Repository Layout

```text
glacier watch github/
├── esp32/                      # Microcontroller firmware and serial tools
│   ├── N16R8/                  # Transmitter code (Gear 360 Wi-Fi + ESP-NOW sender)
│   │   └── N16R8.ino
│   ├── N8R8/                   # Receiver code (ESP-NOW listener + USB 2M baud streamer)
│   │   └── N8R8.ino
│   ├── receive_image.py        # Standalone Python USB serial ingestion client
│   ├── sms.py                  # Android SMS Gateway HTTP bridge script
│   └── README.md               # Embedded flashing and pinout guide
├── frontend/                   # Web operations console (React 18, Vite, Tailwind CSS)
│   ├── public/                 # Static assets and regional SVG maps
│   ├── src/                    # Components, pages, GIS config, API layer
│   ├── dist/                   # Production-compiled bundle (served by FastAPI)
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── models/                     # Deep learning weights
│   └── glacierwatch_model.pth  # Fine-tuned PyTorch MobileNetV2 checkpoint (~9.1 MB)
├── received_images/            # Ingested optical frames from field units
├── scripts/                    # Helper tools (offline inference tester, etc.)
│   ├── predict.py
│   └── receive_esp_image.py
├── server/                     # Backend application (FastAPI, Uvicorn, WebSockets)
│   ├── config/                 # Hazard thresholds (water level, seismic limits)
│   ├── data/                   # Cell tower registry, events, and audit logs
│   ├── sms/                    # Live Android & mock SMS provider drivers
│   ├── alerts.py               # Human confirmation dispatcher
│   ├── captures.py             # Watchdog directory observer & manager
│   ├── config.py               # Environment configuration
│   ├── esp_receiver.py         # Background serial receiver thread
│   ├── inference.py            # PyTorch inference engine
│   └── main.py                 # FastAPI routing & WebSocket endpoints
├── .env.example                # Template environment variables
├── .gitignore                  # Git ignore definitions
├── requirements.txt            # Python dependencies
├── start_server.bat            # One-click Windows runner
└── README.md                   # System documentation
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** (tested on 3.11 & 3.12)
- **Node.js 18+** *(optional, only needed if modifying frontend source code; production distribution is pre-compiled in `frontend/dist/`)*

### 2. Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-org>/glacier-watch.git
   cd glacier-watch
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On Linux / macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment settings:
   ```bash
   cp .env.example .env
   ```

### 3. Launching the Console
Simply execute the launcher script:
```bat
start_server.bat
```
*Or run manually via Uvicorn:*
```bash
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```
Open your browser and navigate to **`http://127.0.0.1:8000/`**.

---

## 🛠️ Hardware Flashing (ESP32-S3)

Detailed instructions are available in [esp32/README.md](esp32/README.md).

1. Install **Arduino IDE** with the **ESP32 by Espressif** board package (v2.0.11+ or v3.x).
2. Configure board options:
   - **Board**: `ESP32S3 Dev Module`
   - **USB CDC On Boot**: `Enabled`
   - **PSRAM**: `OPI PSRAM`
   - **Flash Size**: `16MB` for N16R8, `8MB` for N8R8
3. Open `esp32/N16R8/N16R8.ino`, verify Wi-Fi credentials for your camera AP, and upload to the transmitter board.
4. Open `esp32/N8R8/N8R8.ino` and upload to the receiver board.
5. Connect the receiver board to the computer via USB (default port `COM4`).

---

## 🛡️ Scientific & Operational Guardrails

1. **AI Is Advisory Only**: Glacial lake outbursts are complex geotechnical phenomena. Computer vision detections represent visual surface anomalies, never definitive GLOF declarations. Public warnings require manual human verification.
2. **Probability Transparency**: The user interface always surfaces the raw 3-class distribution (`DECREASING`, `NORMAL`, `RISING`) to prevent over-reliance on single confidence scores.
3. **Multi-Signal Cross-Validation**: High-confidence visual triggers prompt operators to inspect hydrological water level gauges and seismic accelerometers before initiating community evacuation dispatches.

---

## 📄 License & Acknowledgments

Developed for the Sunway Hackathon. Released under the MIT License.
Special thanks to environmental researchers, open-source maintainers of PyTorch, FastAPI, and Leaflet, and the Himalayan disaster monitoring communities.
