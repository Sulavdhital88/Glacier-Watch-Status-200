import json
import time
import datetime
import threading
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional, Callable
from pydantic import BaseModel, Field

from server.config import AUDIT_FILE, TOWERS_FILE, SMS_MODE, BASE_DIR
from server.captures import captures_manager
from server.sms.mock import MockSmsProvider
from server.sms.live_stub import LiveSmsProvider

# Look for sms.py inside the repository's esp32 folder first, with absolute fallback
candidate_sms_paths = [
    BASE_DIR / "esp32" / "sms.py",
    Path(r"C:\Users\lenovo\Desktop\ESP\ESP\sms.py"),
]
SMS_SCRIPT_PATH = next((p for p in candidate_sms_paths if p.exists()), candidate_sms_paths[0])


def run_external_sms_script(message: str = "Alert", recipient: str = "+9779761888995"):
    """Launches the external sms.py script asynchronously in a background thread."""
    if not SMS_SCRIPT_PATH.exists():
        print(f"[AlertManager] sms.py not found at {SMS_SCRIPT_PATH}")
        return

    def _worker():
        try:
            print(f"[AlertManager] Executing SMS script {SMS_SCRIPT_PATH} (to: {recipient})...")
            res = subprocess.run(
                [sys.executable, str(SMS_SCRIPT_PATH), message, recipient],
                capture_output=True,
                text=True,
                timeout=25
            )
            print(f"[AlertManager] sms.py finished with returncode {res.returncode}")
            if res.stdout:
                print(f"[AlertManager] sms.py output:\n{res.stdout.strip()}")
            if res.stderr:
                print(f"[AlertManager] sms.py stderr:\n{res.stderr.strip()}")
        except Exception as e:
            print(f"[AlertManager] Error executing sms.py: {e}")

    threading.Thread(target=_worker, daemon=True).start()


def log_audit_event(operator: str, action: str, details: Dict[str, Any]):
    """Appends an event to server/data/audit.jsonl."""
    record = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "operator": operator,
        "action": action,
        "details": details
    }
    try:
        with open(AUDIT_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception as e:
        print(f"[Audit] Failed to write audit log: {e}")


class AlertRequest(BaseModel):
    tower_ids: List[str] = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    languages: List[str] = Field(default=["en"])
    basis: str = Field(...)  # 'verified_lake_event' | 'sensor_event' | 'drill'
    operator: str = Field(..., min_length=1)
    confirmed: bool = Field(...)
    event_id: Optional[str] = None
    recipient: Optional[str] = None


class AlertManager:
    def __init__(self):
        self.alerts_history: List[Dict[str, Any]] = []
        self._lock = threading.RLock()
        self._counter = 0
        self.towers: List[Dict[str, Any]] = []
        self._load_towers()
        self.sms_provider = LiveSmsProvider() if SMS_MODE == "live" else MockSmsProvider()
        self.ws_broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None

    def set_ws_callback(self, cb: Callable[[Dict[str, Any]], Any]):
        self.ws_broadcast_callback = cb

    def _load_towers(self):
        if TOWERS_FILE.exists():
            try:
                with open(TOWERS_FILE, "r", encoding="utf-8") as f:
                    self.towers = json.load(f)
            except Exception as e:
                print(f"[AlertManager] Error loading towers.json: {e}")
                self.towers = []

    def get_towers(self) -> List[Dict[str, Any]]:
        return self.towers

    def get_alerts(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(reversed(self.alerts_history))

    def validate_send_request(self, req: AlertRequest) -> tuple[bool, Optional[str]]:
        if not req.confirmed:
            return False, "Alert confirmation is required (confirmed: true)."
        if not req.operator or not req.operator.strip():
            return False, "Operator name is required."
        if req.basis not in ["verified_lake_event", "sensor_event", "drill"]:
            return False, f"Invalid basis '{req.basis}'. Must be 'verified_lake_event', 'sensor_event', or 'drill'."
        if not req.tower_ids:
            return False, "At least one cell tower must be selected."
        if not req.message or not req.message.strip():
            return False, "Message text cannot be empty."

        # Tower validation
        known_tower_ids = {t["id"] for t in self.towers}
        for tid in req.tower_ids:
            if tid not in known_tower_ids:
                return False, f"Unknown tower ID: {tid}"

        # Verified lake event validation
        if req.basis == "verified_lake_event":
            if not req.event_id:
                return False, "An event_id is required when basis is 'verified_lake_event'."
            cap = captures_manager.get_by_id(req.event_id)
            if not cap:
                return False, f"Capture event '{req.event_id}' not found."
            verif = cap.get("verification")
            if not verif or verif.get("decision") != "hazard_confirmed":
                return False, f"Capture event '{req.event_id}' does not have a verified 'hazard_confirmed' status."

        return True, None

    async def send_alert(self, req: AlertRequest) -> Dict[str, Any]:
        is_valid, err_msg = self.validate_send_request(req)
        if not is_valid:
            raise ValueError(err_msg)

        selected_towers = [t for t in self.towers if t["id"] in req.tower_ids]
        est_recipients = sum(t.get("est_recipients", 0) for t in selected_towers)

        # Progress callback for WebSocket
        async def on_progress(p_data: Dict[str, Any]):
            if self.ws_broadcast_callback:
                try:
                    self.ws_broadcast_callback({
                        "type": "alert_progress",
                        "data": p_data
                    })
                except Exception as e:
                    print(f"[AlertManager] Alert progress WS broadcast error: {e}")

        # Trigger external sms.py directly on physical/local SMS gateway
        target_num = req.recipient or (selected_towers[0].get("recipient") if selected_towers else "+9779761888995") or "+9779761888995"
        run_external_sms_script(message=req.message, recipient=target_num)

        # Send via provider
        result = await self.sms_provider.send_alert(
            towers=selected_towers,
            message=req.message,
            languages=req.languages,
            basis=req.basis,
            operator=req.operator,
            progress_callback=on_progress,
            recipient_number=req.recipient
        )

        with self._lock:
            self._counter += 1
            alert_id = f"alt_{self._counter:04d}"
            alert_entry = {
                "id": alert_id,
                "sent_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "operator": req.operator,
                "basis": req.basis,
                "event_id": req.event_id,
                "recipient": req.recipient,
                "tower_ids": req.tower_ids,
                "tower_names": [t["name"] for t in selected_towers],
                "est_recipients": est_recipients,
                "mode": SMS_MODE,
                "message": req.message,
                "languages": req.languages,
                "status": "delivered",
                "provider_result": result
            }
            self.alerts_history.append(alert_entry)

        # Audit log
        log_audit_event(
            operator=req.operator,
            action="SEND_ALERT",
            details={
                "alert_id": alert_id,
                "basis": req.basis,
                "recipient": req.recipient,
                "tower_ids": req.tower_ids,
                "est_recipients": est_recipients,
                "mode": SMS_MODE,
                "event_id": req.event_id
            }
        )

        return alert_entry


alert_manager = AlertManager()
