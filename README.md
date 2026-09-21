# GlacierWatch 🏔️
### AI-Assisted Glacial Lake Outburst Flood (GLOF) Monitoring & Early-Warning System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![PyTorch](https://img.shields.io/badge/AI%2FML-PyTorch%20MobileNetV2-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org)
[![Agentic AI](https://img.shields.io/badge/Agent-Autonomous%20Reasoning-purple?logo=openai&logoColor=white)](#-autonomous-monitoring-agent-glacier-agent)
[![ESP32-S3](https://img.shields.io/badge/Hardware-ESP32--S3%20(ESP--NOW)-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**GlacierWatch** is a low-cost, multi-tier environmental monitoring, autonomous reasoning, and early-warning system designed for remote, high-altitude glacial lake basins in the Himalayas.

Because glacial moraines lack cellular towers, grid electricity, and commercial internet connectivity, GlacierWatch combines an ad-hoc 2.4 GHz optical transceiver link, edge microcontrollers, lightweight deep learning computer vision, an **autonomous multi-signal Agentic AI decision layer**, and a human-in-the-loop incident response console.

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
[PyTorch MobileNetV2 Vision Engine] (The "Eyes")
       │  (3-Class Lake State Classification: DECREASING, NORMAL, RISING)
       ▼
[GlacierWatch Monitoring Agent] (The "Brain") ◄── [Hydro & Seismic Sensors]
       │  (Cross-Correlates Optical Anomaly + Water Rise + Tremors + History)
       │  (Escalates State: MONITORING ➔ REVIEW_REQUIRED)
       ▼
[Unified FastAPI Server + WebSocket Event Stream]
       │  (Real-Time State Push, Telemetry APIs, Audit Logger)
       ▼
[React 18 + Leaflet GIS Operations Console] ──────➔ [Android SMS Gateway]
  ├── /       (Main Dashboard: 2x2 Grid + Alerts)     (Alerts to Basin Residents)
  └── /agent  (Glacier Agent Cockpit & Audit Trail)
```

---

## 🤖 Autonomous Monitoring Agent (Glacier Agent)

While the computer vision model acts as the **eyes** (detecting surface shifts in water boundaries), the **GlacierWatch Monitoring Agent** acts as the **brain** — determining what action to take when an anomaly occurs.

### Why Agentic AI?
In disaster management, **a single camera frame must never trigger a public evacuation alarm.** Lens glare, drifting cloud shadows, or falling scree could produce false positives. The agent solves this by executing an autonomous reasoning cycle:

```
OBSERVE ──➔ ANALYZE ──➔ CORRELATE ──➔ DECIDE ──➔ ACT (HUMAN-IN-THE-LOOP)
```

1. **Observe (Vision Perception)**:
   - Receives classification output (`NORMAL`, `RISING`, `DECREASING`) and confidence metric from MobileNetV2.
2. **Analyze & Filter**:
   - If `NORMAL` or `DECREASING` $\rightarrow$ maintains routine `MONITORING`.
   - If `RISING` but confidence $< 75\%$ $\rightarrow$ transitions to `UNCERTAIN` (requests additional captures).
   - If `RISING` with confidence $\ge 75\%$ $\rightarrow$ triggers multi-hazard cross-referencing.
3. **Correlate (Multi-Signal Telemetry)**:
   - Cross-examines hydrological pressure transducers (current lake level, rate of rise $\Delta\text{m}$).
   - Queries regional seismic accelerometers (detecting earthquake tremors $\ge 4.0\text{ M}$ that could cause moraine dam breach).
   - Matches against historical Himalayan GLOF analogue records.
4. **Decide (Risk Synthesis)**:
   - When optical rise is confirmed by sensor telemetry, the agent autonomously escalates to **`REVIEW_REQUIRED`** (High Risk).
5. **Act (Human-in-the-Loop Safety)**:
   - Formulates a complete evidence dossier on the dashboard and arms the emergency broadcast system.
   - **Safety Guardrail**: The AI will **never** dispatch an SMS broadcast autonomously; an operator must review and confirm the action.

### Agent State Machine

```
MONITORING ──➔ UNCERTAIN ──➔ INVESTIGATING ──➔ REVIEW_REQUIRED ──➔ VERIFIED ──➔ ALERT_SENT
                                                       │
                                                       └──➔ DISMISSED ──➔ (MONITORING)
```

| State | Definition | Risk Level | Autonomous Next Action |
| :--- | :--- | :--- | :--- |
| `MONITORING` | Lake surface and sensors within nominal baseline | LOW | Continue scheduled observation |
| `UNCERTAIN` | Visual anomaly detected with low confidence ($<75\%$) | MEDIUM | Increase capture frequency |
| `INVESTIGATING` | High-confidence optical shift; sensor confirmation pending | MEDIUM | Cross-query sensor telemetry |
| `REVIEW_REQUIRED`| Multi-signal confirmation (Visual + Hydro + Seismic) | **HIGH** | Trigger visual alert & request operator review |
| `VERIFIED` | Duty officer confirmed authentic threat | **HIGH** | Arm emergency SMS broadcast |
| `ALERT_SENT` | Evacuation broadcast dispatched to downstream towers | **CRITICAL** | Monitor flood transit times |
| `DISMISSED` | False alarm cleared by operator | LOW | Reset evidence & return to monitoring |

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
4. **Agentic Multi-Hazard Correlation**:
   - Synthesizes computer vision, hydrological transducers, seismic stations, and historical basin analogues.
   - Maintains a timestamped immutable activity audit log for transparency and accountability.
5. **Contextual GIS Mapping (Leaflet + OpenStreetMap)**:
   - Traces the exact river drainage path along the Langtang Khola canyon through downstream settlements (*Kyanjin*, *Ghora Tabela*, *Lama Hotel*, *Bamboo*, *Syabrubesi*).
   - Dynamically calculates that **2,450 residents** live directly along the immediate riverside basin.
6. **Human-Verified Emergency Alerting**:
   - Strict Human-in-the-Loop (HITL) safety: the agent recommends, but humans verify and dispatch.
   - Multi-lingual cellular SMS dispatching (English, Nepali, Sherpa) through Android SMS gateway bridges.

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
│   ├── src/
│   │   ├── components/         # Metric cards, GIS map, Agent cockpit widgets
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx    # Primary 2x2 Operations Grid
│   │   │   └── GlacierAgentPage.jsx # Dedicated Agent Cockpit & Audit Trail
│   │   └── services/api.js     # REST & WebSocket client layer
│   ├── dist/                   # Production-compiled bundle (served by FastAPI)
│   ├── package.json
│   └── vite.config.js
├── models/                     # Deep learning weights
│   └── glacierwatch_model.pth  # Fine-tuned PyTorch MobileNetV2 checkpoint (~9.1 MB)
├── received_images/            # Ingested optical frames from field units
├── scripts/                    # Utility scripts (offline inference tester, etc.)
│   ├── predict.py
│   └── receive_esp_image.py
├── server/                     # Backend application (FastAPI, Uvicorn, WebSockets)
│   ├── agent.py                # GlacierWatch Agent (State machine, multi-signal reasoning)
│   ├── alerts.py               # Human confirmation dispatcher
│   ├── captures.py             # Watchdog directory observer & manager
│   ├── config.py               # Environment configuration
│   ├── data/                   # Supporting telemetry & historical events
│   │   ├── water_levels.json   # Hydro telemetry (simulated lake level & surge)
│   │   ├── earthquake.json     # Seismic telemetry (tremor magnitude & proximity)
│   │   └── historical_events.json # Historical basin analogue records
│   ├── esp_receiver.py         # Background serial receiver thread
│   ├── inference.py            # PyTorch inference engine
│   └── main.py                 # FastAPI routing, REST APIs & WebSocket endpoints
├── sms.py                      # Sanitized SMS dispatch script
├── requirements.txt            # Python dependencies
├── start_server.bat            # One-click Windows runner
└── README.md                   # System documentation
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Python 3.10+** (tested on 3.11, 3.12, 3.14)
- **Node.js 18+** *(optional, only needed if modifying frontend source code; production distribution is pre-compiled in `frontend/dist/`)*

### 2. Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Sulavdhital88/Glacier-Watch-Status-200.git
   cd Glacier-Watch-Status-200
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
- View the primary observation grid at `/`.
- View the autonomous reasoning dossier and scenario evaluator at `/agent`.

---

## 🛠️ Hardware Flashing (ESP32-S3)

Detailed instructions are available in [esp32/README.md](esp32/README.md).

1. Install **Arduino IDE** with the **ESP32 by Espressif** board package (v2.0.11+ or v3.x).
2. Configure board options:
   - **Board**: `ESP32S3 Dev Module`
   - **USB CDC On Boot**: `Enabled`
   - **PSRAM**: `OPI PSRAM`
   - **Flash Size**: `16MB` for N16R8, `8MB` for N8R8
3. Open `esp32/N16R8/N16R8.ino`, configure Wi-Fi credentials for your camera AP, and upload to the transmitter board.
4. Open `esp32/N8R8/N8R8.ino` and upload to the receiver board.
5. Connect the receiver board to the computer via USB (default port `COM4`).

---

## 🛡️ Scientific & Operational Guardrails

1. **AI Is Advisory Only**: Glacial lake outbursts are complex geotechnical phenomena. Computer vision detections represent visual surface anomalies, never definitive GLOF declarations. Public warnings require manual human verification.
2. **Multi-Signal Cross-Validation**: The agent cross-references visual triggers with hydrological pressure transducers and seismic accelerometers before formulating an alert dossier.
3. **Probability Transparency**: The user interface always surfaces the full probability distribution (`DECREASING`, `NORMAL`, `RISING`) alongside reasoning timelines to prevent over-reliance on a single metric.

---

## 📄 License & Acknowledgments

Developed for the Sunway Hackathon. Released under the MIT License.
Special thanks to environmental researchers, open-source maintainers of PyTorch, FastAPI, and Leaflet, and the Himalayan disaster monitoring communities.
