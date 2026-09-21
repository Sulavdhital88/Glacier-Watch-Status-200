import time
import math
import random
import datetime
import threading
from typing import List, Dict, Any, Optional, Callable
from server.config import THRESHOLDS, SENSOR_MODE, DEMO_MODE


class SensorManager:
    def __init__(self):
        self._lock = threading.RLock()
        self.water_history: List[Dict[str, Any]] = []
        self.seismic_history: List[Dict[str, Any]] = []
        self.seismic_events: List[Dict[str, Any]] = []
        self.last_water_reading: Optional[Dict[str, Any]] = None
        self.last_seismic_reading: Optional[Dict[str, Any]] = None

        self.water_baseline = float(THRESHOLDS["water_level"]["normal_baseline"])
        self.seismic_baseline = float(THRESHOLDS["seismic"]["baseline"])
        self.offline_timeout = float(THRESHOLDS["health"]["sensor_offline_timeout_seconds"])

        # Active demo overrides
        self._sim_earthquake_until = 0.0
        self._sim_rapid_rise_active = False
        self._sim_water_level = self.water_baseline

        self._running = False
        self._sim_thread = None
        self.ws_broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None

        # Seed initial history so charts have context at startup
        self._seed_initial_history()

    def set_ws_callback(self, cb: Callable[[Dict[str, Any]], Any]):
        self.ws_broadcast_callback = cb

    def _seed_initial_history(self):
        """Generates realistic past 24h history at 1-min intervals."""
        now = time.time()
        for i in range(240, 0, -1):
            t = now - (i * 60)
            iso_t = datetime.datetime.fromtimestamp(t, tz=datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

            # Water level: gentle sine drift around 121 cm
            w_val = round(self.water_baseline + 1.2 * math.sin(i / 15.0) + random.uniform(-0.3, 0.3), 1)
            self.water_history.append({
                "timestamp": iso_t,
                "time_epoch": t,
                "value": w_val,
                "source": "simulated"
            })

            # Seismic: background microtremors 1.2 - 2.8 mg
            s_val = round(self.seismic_baseline + random.uniform(-0.8, 1.2), 1)
            self.seismic_history.append({
                "timestamp": iso_t,
                "time_epoch": t,
                "value": max(0.2, s_val),
                "source": "simulated"
            })

        if self.water_history:
            self.last_water_reading = self.water_history[-1]
            self._sim_water_level = self.last_water_reading["value"]
        if self.seismic_history:
            self.last_seismic_reading = self.seismic_history[-1]

    def start(self):
        self._running = True
        if SENSOR_MODE == "simulated" or DEMO_MODE:
            self._sim_thread = threading.Thread(target=self._simulation_loop, daemon=True)
            self._sim_thread.start()

    def stop(self):
        self._running = False

    def ingest_reading(self, sensor_type: str, value: float, source: str = "device", timestamp_str: Optional[str] = None):
        """Ingests a real or simulated reading."""
        now = time.time()
        iso_time = timestamp_str or datetime.datetime.fromtimestamp(now, tz=datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        reading = {
            "timestamp": iso_time,
            "time_epoch": now,
            "value": round(float(value), 2),
            "source": source
        }

        with self._lock:
            if sensor_type == "water_level":
                self.water_history.append(reading)
                # Keep up to 2000 points (~33 hours at 1/min)
                if len(self.water_history) > 2000:
                    self.water_history.pop(0)
                self.last_water_reading = reading
            elif sensor_type == "seismic":
                self.seismic_history.append(reading)
                if len(self.seismic_history) > 2000:
                    self.seismic_history.pop(0)
                self.last_seismic_reading = reading
                self._check_seismic_event(reading)

        # Broadcast sensor update over WS
        if self.ws_broadcast_callback:
            try:
                self.ws_broadcast_callback({
                    "type": "sensor",
                    "data": {
                        "sensor_type": sensor_type,
                        "reading": reading,
                        "latest": self.get_latest_summary()
                    }
                })
            except Exception as e:
                print(f"[SensorManager] Broadcast error: {e}")

    def _check_seismic_event(self, reading: Dict[str, Any]):
        """Checks if a seismic reading constitutes a shaking event."""
        val = reading["value"]
        tremor_thresh = float(THRESHOLDS["seismic"]["tremor_threshold"])
        strong_thresh = float(THRESHOLDS["seismic"]["strong_threshold"])

        if val >= tremor_thresh:
            level = "strong" if val >= strong_thresh else "tremor"
            now = reading["time_epoch"]

            # If recent event in last 30s, update peak
            if self.seismic_events and (now - self.seismic_events[-1].get("_last_epoch", 0) < 30.0):
                ev = self.seismic_events[-1]
                if val > ev["peak_mg"]:
                    ev["peak_mg"] = val
                    ev["level"] = level
                ev["duration_seconds"] = int(now - ev["_start_epoch"]) + 1
                ev["_last_epoch"] = now
            else:
                new_ev = {
                    "id": f"seis_{int(now)}",
                    "started_at": reading["timestamp"],
                    "peak_mg": val,
                    "level": level,
                    "duration_seconds": 1,
                    "_start_epoch": now,
                    "_last_epoch": now
                }
                self.seismic_events.append(new_ev)
                if len(self.seismic_events) > 50:
                    self.seismic_events.pop(0)

    def _simulation_loop(self):
        """Simulates periodic telemetry updates every 2 seconds."""
        step = 0
        while self._running:
            time.sleep(2.0)
            now = time.time()
            step += 1

            # 1. Seismic telemetry
            if now < self._sim_earthquake_until:
                # Strong earthquake activity
                s_val = round(55.0 + random.uniform(-10.0, 20.0), 1)
            else:
                # Background microtremors
                s_val = round(self.seismic_baseline + random.uniform(-1.0, 1.5), 1)
                s_val = max(0.2, s_val)

            self.ingest_reading("seismic", s_val, source="simulated")

            # 2. Water level telemetry
            if self._sim_rapid_rise_active:
                # Rising rapidly at ~2.5 to 3.5 cm/min -> ~0.08 to 0.12 cm per 2s
                self._sim_water_level += random.uniform(0.08, 0.14)
            else:
                # Natural slight drift
                self._sim_water_level += random.uniform(-0.02, 0.02)
                # Keep near baseline
                if self._sim_water_level < self.water_baseline - 5:
                    self._sim_water_level += 0.05
                elif self._sim_water_level > self.water_baseline + 5:
                    self._sim_water_level -= 0.05

            self.ingest_reading("water_level", round(self._sim_water_level, 1), source="simulated")

    def get_water_rate_of_rise(self) -> float:
        """Computes rate of rise in cm/min over the last 5 minutes."""
        with self._lock:
            if len(self.water_history) < 2:
                return 0.0
            now = time.time()
            cutoff = now - 300.0  # 5 minutes ago
            recent_readings = [r for r in self.water_history if r.get("time_epoch", 0) >= cutoff]
            if len(recent_readings) < 2:
                recent_readings = self.water_history[-10:]

            t_start = recent_readings[0]["time_epoch"]
            t_end = recent_readings[-1]["time_epoch"]
            dt_minutes = (t_end - t_start) / 60.0

            if dt_minutes <= 0.1:
                return 0.0

            dw = recent_readings[-1]["value"] - recent_readings[0]["value"]
            rate = dw / dt_minutes
            return round(rate, 2)

    def get_latest_summary(self) -> Dict[str, Any]:
        with self._lock:
            now = time.time()

            # Water status
            water_online = False
            water_val = 0.0
            water_source = "simulated"
            water_last_seen = None
            if self.last_water_reading:
                water_val = self.last_water_reading["value"]
                water_source = self.last_water_reading["source"]
                water_last_seen = self.last_water_reading["timestamp"]
                water_online = (now - self.last_water_reading.get("time_epoch", 0)) <= self.offline_timeout

            rate_of_rise = self.get_water_rate_of_rise()
            watch_w = float(THRESHOLDS["water_level"]["watch_threshold"])
            danger_w = float(THRESHOLDS["water_level"]["danger_threshold"])
            danger_rate = float(THRESHOLDS["water_level"]["danger_rate_of_rise"])

            water_state = "normal"
            if water_val >= danger_w or rate_of_rise >= danger_rate:
                water_state = "danger"
            elif water_val >= watch_w:
                water_state = "watch"

            # Seismic status
            seismic_online = False
            seismic_val = 0.0
            seismic_source = "simulated"
            seismic_last_seen = None
            if self.last_seismic_reading:
                seismic_val = self.last_seismic_reading["value"]
                seismic_source = self.last_seismic_reading["source"]
                seismic_last_seen = self.last_seismic_reading["timestamp"]
                seismic_online = (now - self.last_seismic_reading.get("time_epoch", 0)) <= self.offline_timeout

            tremor_s = float(THRESHOLDS["seismic"]["tremor_threshold"])
            strong_s = float(THRESHOLDS["seismic"]["strong_threshold"])

            shaking_level = "quiet"
            seismic_state = "normal"
            if seismic_val >= strong_s:
                shaking_level = "strong"
                seismic_state = "danger"
            elif seismic_val >= tremor_s:
                shaking_level = "tremor"
                seismic_state = "watch"

            return {
                "water_level": {
                    "value_cm": water_val,
                    "rate_of_rise_cm_min": rate_of_rise,
                    "state": water_state,
                    "status": "online" if water_online else "offline",
                    "source": water_source,
                    "last_seen": water_last_seen,
                    "thresholds": {
                        "baseline": THRESHOLDS["water_level"]["normal_baseline"],
                        "watch": watch_w,
                        "danger": danger_w,
                        "danger_rate": danger_rate
                    }
                },
                "seismic": {
                    "peak_mg": seismic_val,
                    "shaking_level": shaking_level,
                    "state": seismic_state,
                    "status": "online" if seismic_online else "offline",
                    "source": seismic_source,
                    "last_seen": seismic_last_seen,
                    "thresholds": {
                        "baseline": THRESHOLDS["seismic"]["baseline"],
                        "tremor": tremor_s,
                        "strong": strong_s
                    }
                }
            }

    def get_history(self, sensor_type: str, time_range: str = "1h") -> Dict[str, Any]:
        """Returns filtered history points and threshold lines."""
        range_seconds_map = {
            "15m": 15 * 60,
            "1h": 60 * 60,
            "6h": 6 * 3600,
            "24h": 24 * 3600
        }
        duration = range_seconds_map.get(time_range, 3600)
        cutoff = time.time() - duration

        with self._lock:
            if sensor_type == "water_level":
                points = [
                    {"timestamp": r["timestamp"], "value": r["value"], "source": r["source"]}
                    for r in self.water_history
                    if r.get("time_epoch", 0) >= cutoff
                ]
                return {
                    "sensor_type": "water_level",
                    "range": time_range,
                    "unit": "cm",
                    "points": points,
                    "thresholds": THRESHOLDS["water_level"]
                }
            elif sensor_type == "seismic":
                points = [
                    {"timestamp": r["timestamp"], "value": r["value"], "source": r["source"]}
                    for r in self.seismic_history
                    if r.get("time_epoch", 0) >= cutoff
                ]
                return {
                    "sensor_type": "seismic",
                    "range": time_range,
                    "unit": "mg",
                    "points": points,
                    "thresholds": THRESHOLDS["seismic"]
                }
            return {"error": "Unknown sensor type"}

    def get_events(self) -> List[Dict[str, Any]]:
        with self._lock:
            # Return cleaned events newest first
            cleaned = []
            for ev in reversed(self.seismic_events):
                cleaned.append({
                    "id": ev["id"],
                    "started_at": ev["started_at"],
                    "peak_mg": ev["peak_mg"],
                    "level": ev["level"],
                    "duration_seconds": ev["duration_seconds"]
                })
            return cleaned

    def trigger_demo_scenario(self, scenario: str):
        with self._lock:
            if scenario == "earthquake":
                self._sim_earthquake_until = time.time() + 25.0  # 25 seconds strong shaking
                print("[SensorManager] Demo scenario triggered: Earthquake for 25s")
            elif scenario == "rapid_water_rise":
                self._sim_rapid_rise_active = True
                print("[SensorManager] Demo scenario triggered: Rapid Water Rise")
            elif scenario == "reset":
                self._sim_earthquake_until = 0.0
                self._sim_rapid_rise_active = False
                self._sim_water_level = self.water_baseline
                print("[SensorManager] Demo scenarios reset to baseline")


sensor_manager = SensorManager()
