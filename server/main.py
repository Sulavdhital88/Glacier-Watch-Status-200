import os
import io
import time
import json
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field

from server.config import (
    BASE_DIR,
    DEMO_MODE,
    SMS_MODE,
    SENSOR_MODE,
    RECEIVED_IMAGES_DIR,
    CONFIDENCE_LOW,
    INGEST_TOKEN,
    SERIAL_ENABLED,
    SERIAL_PORT,
    SERIAL_BAUD
)
from server.inference import inference_engine
from server.captures import captures_manager
from server.sensors import sensor_manager
from server.situation import evaluate_situation
from server.alerts import alert_manager, AlertRequest, log_audit_event
from server.esp_receiver import esp_receiver


# Active WebSocket connections
active_websockets: List[WebSocket] = []
ws_lock = asyncio.Lock()


main_loop: Optional[asyncio.AbstractEventLoop] = None


async def broadcast_ws_message(msg: Dict[str, Any]):
    """Broadcasts a JSON message to all connected WebSocket clients."""
    async with ws_lock:
        to_remove = []
        for ws in active_websockets:
            try:
                await ws.send_json(msg)
            except Exception:
                to_remove.append(ws)
        for ws in to_remove:
            if ws in active_websockets:
                active_websockets.remove(ws)


def sync_ws_broadcast_hook(msg: Dict[str, Any]):
    """Thread-safe bridge to schedule WS broadcast from background threads."""
    global main_loop
    if main_loop and main_loop.is_running():
        try:
            asyncio.run_coroutine_threadsafe(broadcast_ws_message(msg), main_loop)
            return
        except Exception as e:
            print(f"[Main] Error in sync_ws_broadcast_hook: {e}")
    try:
        loop = asyncio.get_running_loop()
        if loop.is_running():
            asyncio.run_coroutine_threadsafe(broadcast_ws_message(msg), loop)
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global main_loop
    main_loop = asyncio.get_running_loop()
    print(f"[GlacierWatch] Captured main event loop: {main_loop}")

    print("[GlacierWatch] Starting server subsystems...")
    captures_manager.set_ws_callback(sync_ws_broadcast_hook)
    sensor_manager.set_ws_callback(sync_ws_broadcast_hook)
    alert_manager.set_ws_callback(sync_ws_broadcast_hook)

    captures_manager.start()
    sensor_manager.start()
    if SERIAL_ENABLED:
        esp_receiver.start()
    print("[GlacierWatch] Server subsystems started successfully.")

    yield

    # Shutdown
    print("[GlacierWatch] Shutting down server subsystems...")
    if SERIAL_ENABLED:
        esp_receiver.stop()
    captures_manager.stop()
    sensor_manager.stop()
    inference_engine.stop_worker()
    print("[GlacierWatch] Shutdown complete.")


app = FastAPI(
    title="GlacierWatch Operator API",
    description="Backend bridge for camera inference, multi-hazard sensors, and human-in-the-loop SMS alerting",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class VerificationPayload(BaseModel):
    decision: str = Field(..., description="'hazard_confirmed' or 'no_hazard'")
    corrected_label: Optional[str] = None
    operator: str = Field(..., min_length=1)
    note: Optional[str] = None


class SensorIngestReading(BaseModel):
    type: str = Field(..., description="'water_level' or 'seismic'")
    value: float
    timestamp: Optional[str] = None
    source: Optional[str] = "device"


class DemoTriggerPayload(BaseModel):
    scenario: str = Field(..., description="'earthquake' | 'rapid_water_rise' | 'reset'")


# --- API Routes ---

@app.get("/api/status")
async def get_status():
    latest_cap = captures_manager.get_latest()
    last_capture_time = latest_cap["received_at"] if latest_cap else None
    serial_connected = (
        esp_receiver._ser is not None and esp_receiver._ser.is_open
        if SERIAL_ENABLED else False
    )

    return {
        "status": "healthy",
        "demo_mode": DEMO_MODE,
        "sms_mode": SMS_MODE,
        "sensor_mode": SENSOR_MODE,
        "serial_enabled": SERIAL_ENABLED,
        "serial_port": SERIAL_PORT,
        "serial_connected": serial_connected,
        "confidence_low_threshold": CONFIDENCE_LOW,
        "last_capture_time": last_capture_time,
        "server_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_captures": len(captures_manager.captures)
    }


@app.get("/api/captures/latest")
async def get_latest_capture():
    cap = captures_manager.get_latest()
    return cap


@app.get("/api/captures")
async def get_recent_captures(limit: int = Query(24, ge=1, le=200)):
    return captures_manager.get_recent(limit=limit)


@app.get("/media/received/{filename}")
async def get_received_image(filename: str):
    # Protect against path traversal
    safe_name = Path(filename).name
    file_path = RECEIVED_IMAGES_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Image {safe_name} not found")
    return FileResponse(file_path, media_type="image/jpeg")


@app.get("/api/captures/{id}/model-input.jpg")
async def get_model_input_image(id: str):
    cap = captures_manager.get_by_id(id)
    if not cap:
        raise HTTPException(status_code=404, detail=f"Capture {id} not found")

    filename = cap.get("filename")
    file_path = RECEIVED_IMAGES_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Image file {filename} not found")

    try:
        img_bytes = inference_engine.generate_model_input_image_bytes(file_path)
        return Response(content=img_bytes, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating model input view: {e}")


@app.post("/api/captures/{id}/verification")
async def verify_capture(id: str, payload: VerificationPayload):
    if payload.decision not in ["hazard_confirmed", "no_hazard"]:
        raise HTTPException(status_code=400, detail="Decision must be 'hazard_confirmed' or 'no_hazard'")

    updated = captures_manager.record_verification(
        cap_id=id,
        decision=payload.decision,
        corrected_label=payload.corrected_label,
        operator=payload.operator,
        note=payload.note
    )

    if not updated:
        raise HTTPException(status_code=404, detail=f"Capture event {id} not found")

    log_audit_event(
        operator=payload.operator,
        action="VERIFY_CAPTURE",
        details={
            "capture_id": id,
            "decision": payload.decision,
            "corrected_label": payload.corrected_label,
            "note": payload.note
        }
    )

    return updated


@app.get("/api/sensors/latest")
async def get_sensors_latest():
    return sensor_manager.get_latest_summary()


@app.get("/api/sensors/history")
async def get_sensors_history(
    type: str = Query(..., description="'water_level' or 'seismic'"),
    range: str = Query("1h", description="'15m' | '1h' | '6h' | '24h'")
):
    if type not in ["water_level", "seismic"]:
        raise HTTPException(status_code=400, detail="Sensor type must be 'water_level' or 'seismic'")
    return sensor_manager.get_history(type, range)


@app.get("/api/sensors/events")
async def get_seismic_events():
    return sensor_manager.get_events()


@app.post("/api/sensors/ingest")
async def ingest_sensor_data(
    payload: List[SensorIngestReading] | SensorIngestReading
):
    items = payload if isinstance(payload, list) else [payload]
    for item in items:
        if item.type not in ["water_level", "seismic"]:
            raise HTTPException(status_code=400, detail=f"Invalid sensor type: {item.type}")
        sensor_manager.ingest_reading(
            sensor_type=item.type,
            value=item.value,
            source=item.source or "device",
            timestamp_str=item.timestamp
        )
    return {"status": "success", "ingested_count": len(items)}


@app.get("/api/situation")
async def get_situation():
    return evaluate_situation()


@app.get("/api/towers")
async def get_towers():
    return alert_manager.get_towers()


@app.post("/api/alerts/send")
async def send_alert(req: AlertRequest):
    try:
        res = await alert_manager.send_alert(req)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending alert: {e}")


@app.get("/api/alerts")
async def get_alerts_log():
    return alert_manager.get_alerts()


@app.post("/api/demo/trigger")
async def trigger_demo(payload: DemoTriggerPayload):
    if not DEMO_MODE:
        raise HTTPException(status_code=403, detail="Demo triggers are only allowed when DEMO_MODE is true")

    if payload.scenario not in ["earthquake", "rapid_water_rise", "reset"]:
        raise HTTPException(status_code=400, detail="Scenario must be 'earthquake', 'rapid_water_rise', or 'reset'")

    sensor_manager.trigger_demo_scenario(payload.scenario)

    log_audit_event(
        operator="demo_user",
        action="DEMO_TRIGGER",
        details={"scenario": payload.scenario}
    )

    return {"status": "triggered", "scenario": payload.scenario}


# --- GlacierWatch Monitoring Agent Endpoints ---

from server.agent import monitoring_agent

class AgentVerifyRequest(BaseModel):
    operator: str = "Duty Officer"
    notes: Optional[str] = ""

class AgentDismissRequest(BaseModel):
    operator: str = "Duty Officer"
    reason: Optional[str] = ""

class AgentScenarioRequest(BaseModel):
    scenario: str

class AgentAnalyzeRequest(BaseModel):
    prediction: Optional[str] = "RISING"
    confidence: Optional[float] = 0.954
    water_level: Optional[float] = None
    water_level_change: Optional[float] = None
    earthquake_mag: Optional[float] = None


@app.get("/api/agent/state")
async def get_agent_state():
    return monitoring_agent.get_state()


@app.post("/api/agent/analyze")
async def analyze_agent_incident(req: AgentAnalyzeRequest):
    updated = monitoring_agent.analyze_incident(
        prediction=req.prediction or "RISING",
        confidence=req.confidence if req.confidence is not None else 0.954,
        water_level=req.water_level,
        water_level_change=req.water_level_change,
        earthquake_mag=req.earthquake_mag
    )
    sync_ws_broadcast_hook({"type": "agent_state", "data": updated})
    return updated


@app.post("/api/agent/verify")
async def verify_agent_incident(req: AgentVerifyRequest):
    updated = monitoring_agent.verify_incident(operator=req.operator, notes=req.notes or "")
    sync_ws_broadcast_hook({"type": "agent_state", "data": updated})
    return updated


@app.post("/api/agent/dismiss")
async def dismiss_agent_incident(req: AgentDismissRequest):
    updated = monitoring_agent.dismiss_incident(operator=req.operator, reason=req.reason or "")
    sync_ws_broadcast_hook({"type": "agent_state", "data": updated})
    return updated


@app.post("/api/agent/scenario")
async def set_agent_scenario(req: AgentScenarioRequest):
    updated = monitoring_agent.set_demo_scenario(req.scenario)
    sync_ws_broadcast_hook({"type": "agent_state", "data": updated})
    return updated


@app.get("/api/agent/history")
async def get_agent_history():
    hist_path = DATA_DIR / "historical_events.json"
    if hist_path.exists():
        try:
            with open(hist_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Main] Error reading historical_events.json: {e}")
    return []


# --- WebSocket Endpoint ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    async with ws_lock:
        active_websockets.append(websocket)
    try:
        # Send initial state snapshot
        await websocket.send_json({
            "type": "status",
            "data": {
                "status": "connected",
                "demo_mode": DEMO_MODE,
                "sms_mode": SMS_MODE,
                "sensor_mode": SENSOR_MODE
            }
        })
        # Send initial agent state snapshot
        await websocket.send_json({
            "type": "agent_state",
            "data": monitoring_agent.get_state()
        })
        # Keep connection open and receive any client ping
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        async with ws_lock:
            if websocket in active_websockets:
                active_websockets.remove(websocket)


# --- Static frontend serving (Single-process deployment) ---
frontend_dist = BASE_DIR / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    @app.exception_handler(404)
    async def spa_404_fallback(request, exc):
        if not request.url.path.startswith(("/api", "/media", "/ws")):
            index_path = frontend_dist / "index.html"
            if index_path.exists():
                return FileResponse(index_path)
        return Response(content="Not Found", status_code=404)

    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
