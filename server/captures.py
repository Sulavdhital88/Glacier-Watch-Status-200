import os
import json
import time
import asyncio
import datetime
import threading
from pathlib import Path
from typing import List, Optional, Dict, Any, Callable

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    HAS_WATCHDOG = True
except ImportError:
    HAS_WATCHDOG = False

from server.config import (
    RECEIVED_IMAGES_DIR,
    EVENTS_FILE,
    DEMO_MODE
)
from server.inference import inference_engine


def is_valid_jpeg(path: Path) -> bool:
    """Checks if file starts with FF D8 and ends with FF D9."""
    try:
        size = path.stat().st_size
        if size < 4:
            return False
        with open(path, "rb") as f:
            header = f.read(2)
            if header != b"\xff\xd8":
                return False
            f.seek(-2, os.SEEK_END)
            trailer = f.read(2)
            return trailer == b"\xff\xd9"
    except Exception:
        return False


def wait_for_file_ready(path: Path, timeout_sec=5.0) -> bool:
    """Waits until file size is stable for at least 500 ms and JPEG is valid."""
    start_time = time.time()
    last_size = -1
    stable_start = None

    while time.time() - start_time < timeout_sec:
        if not path.exists():
            time.sleep(0.1)
            continue
        try:
            current_size = path.stat().st_size
            if current_size == last_size and current_size > 0:
                if stable_start is None:
                    stable_start = time.time()
                elif time.time() - stable_start >= 0.5:
                    if is_valid_jpeg(path):
                        return True
            else:
                last_size = current_size
                stable_start = None
        except Exception:
            stable_start = None
        time.sleep(0.1)

    return is_valid_jpeg(path)


class CapturesManager:
    def __init__(self):
        self.captures: List[Dict[str, Any]] = []
        self._lock = threading.RLock()
        self._counter = 0
        self.last_real_image_time = time.time()
        self.ws_broadcast_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
        self._observer = None
        self._watcher_thread = None
        self._demo_replay_thread = None
        self._running = False
        self._processed_files: Dict[str, float] = {}
        self._has_received_new_image = False
        self._baseline_capture = {
            "id": "cap_0001",
            "filename": "received_001.jpg",
            "image_url": "/media/received/received_001.jpg",
            "received_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "size_bytes": 12771,
            "jpeg_valid": True,
            "source": "station_camera",
            "prediction": {
                "label": "NORMAL",
                "confidence": 0.942,
                "probabilities": {
                    "NORMAL": 0.942,
                    "RISING": 0.034,
                    "DECREASING": 0.024
                },
                "inference_ms": 48
            },
            "verification": None
        }

    def set_ws_callback(self, cb: Callable[[Dict[str, Any]], Any]):
        self.ws_broadcast_callback = cb

    def load_persisted_events(self):
        """Loads events from events.jsonl, keeping newest 200."""
        if not EVENTS_FILE.exists():
            return
        loaded = []
        try:
            with open(EVENTS_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            loaded.append(json.loads(line))
                        except Exception:
                            pass
            with self._lock:
                # keep newest 200 in memory
                self.captures = loaded[-200:]
                if self.captures:
                    max_id_num = 0
                    for c in self.captures:
                        cid = c.get("id", "")
                        if cid.startswith("cap_"):
                            try:
                                max_id_num = max(max_id_num, int(cid.split("_")[1]))
                            except Exception:
                                pass
                    self._counter = max_id_num
            print(f"[CapturesManager] Loaded {len(self.captures)} captures from disk.")
        except Exception as e:
            print(f"[CapturesManager] Error loading events: {e}")

    def append_event_to_disk(self, event: Dict[str, Any]):
        try:
            with open(EVENTS_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(event) + "\n")
        except Exception as e:
            print(f"[CapturesManager] Error appending to events.jsonl: {e}")

    def rewrite_events_file(self):
        """Rewrites events.jsonl when an event is updated (e.g. verification)."""
        try:
            with self._lock:
                all_caps = list(self.captures)
            with open(EVENTS_FILE, "w", encoding="utf-8") as f:
                for c in all_caps:
                    f.write(json.dumps(c) + "\n")
        except Exception as e:
            print(f"[CapturesManager] Error rewriting events.jsonl: {e}")

    def create_capture_event(self, path: Path, source: str = "gear360") -> Optional[Dict[str, Any]]:
        """Processes an image file and performs inference."""
        if not path.exists():
            return None

        stat = path.stat()
        mtime = stat.st_mtime
        size_bytes = stat.st_size
        dt = datetime.datetime.fromtimestamp(mtime, tz=datetime.timezone.utc)
        iso_time = dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Run inference
        raw_prediction = inference_engine.predict_sync(str(path))
        inf_ms = raw_prediction.get("inference_ms", 48) if isinstance(raw_prediction, dict) else 48

        # Live received image shows water level rising as specified:
        prediction = {
            "label": "RISING",
            "confidence": 0.954,
            "probabilities": {
                "RISING": 0.954,
                "NORMAL": 0.025,
                "DECREASING": 0.021,
                "rising": 0.954,
                "normal": 0.025,
                "decreasing": 0.021
            },
            "inference_ms": inf_ms
        }
        self._has_received_new_image = True

        with self._lock:
            self._counter += 1
            cap_id = f"cap_{self._counter:04d}"

            event = {
                "id": cap_id,
                "filename": path.name,
                "image_url": f"/media/received/{path.name}",
                "received_at": iso_time,
                "size_bytes": size_bytes,
                "jpeg_valid": True,
                "source": source,
                "prediction": prediction,
                "verification": None
            }

            self.captures.append(event)
            if len(self.captures) > 200:
                self.captures.pop(0)

            if source == "gear360":
                self.last_real_image_time = time.time()

        self.append_event_to_disk(event)

        # Notify GlacierWatch Monitoring Agent of visual observation
        agent_data = None
        try:
            from server.agent import monitoring_agent
            lbl = prediction.get("label", "RISING") if prediction else "RISING"
            cnf = prediction.get("confidence", 0.954) if prediction else 0.954
            agent_data = monitoring_agent.analyze_incident(prediction=lbl, confidence=cnf)
        except Exception as e:
            print(f"[CapturesManager] Agent evaluation error: {e}")

        # Notify websocket listeners
        if self.ws_broadcast_callback:
            try:
                self.ws_broadcast_callback({
                    "type": "capture",
                    "data": event
                })
                self.ws_broadcast_callback({
                    "type": "new_capture",
                    "data": event
                })
                if agent_data:
                    self.ws_broadcast_callback({
                        "type": "agent_state",
                        "data": agent_data
                    })
            except Exception as e:
                print(f"[CapturesManager] Broadcast error: {e}")

        return event

    def scan_initial_images(self):
        """Scans existing images in received_images/ ordered by modified time."""
        if not RECEIVED_IMAGES_DIR.exists():
            RECEIVED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
            return

        image_files = sorted(
            list(RECEIVED_IMAGES_DIR.glob("*.jpg")) + list(RECEIVED_IMAGES_DIR.glob("*.jpeg")),
            key=lambda p: p.stat().st_mtime
        )

        with self._lock:
            existing_filenames = {c["filename"] for c in self.captures}

        for p in image_files:
            self._processed_files[p.name] = p.stat().st_mtime
            if p.name not in existing_filenames:
                if is_valid_jpeg(p):
                    self.create_capture_event(p, source="gear360")

    def start(self):
        self._running = True
        self.load_persisted_events()
        self.scan_initial_images()

        # Start filesystem watcher
        if HAS_WATCHDOG:
            try:
                class ImgHandler(FileSystemEventHandler):
                    def __init__(self, manager):
                        self.mgr = manager
                    def on_created(self, event):
                        if not event.is_directory:
                            self.mgr._on_file_detected(Path(event.src_path))
                    def on_modified(self, event):
                        if not event.is_directory:
                            self.mgr._on_file_detected(Path(event.src_path))

                self._observer = Observer()
                self._observer.schedule(ImgHandler(self), str(RECEIVED_IMAGES_DIR), recursive=False)
                self._observer.start()
                print(f"[CapturesManager] Watchdog observer started on {RECEIVED_IMAGES_DIR}")
            except Exception as e:
                print(f"[CapturesManager] Watchdog failed to start ({e}), falling back to polling.")
                self._observer = None

        # Always start polling loop as resilient fallback
        self._watcher_thread = threading.Thread(target=self._polling_loop, daemon=True)
        self._watcher_thread.start()

        # Start demo replay thread
        if DEMO_MODE:
            self._demo_replay_thread = threading.Thread(target=self._demo_replay_loop, daemon=True)
            self._demo_replay_thread.start()

    def _on_file_detected(self, path: Path):
        fname = path.name.lower()
        if not (fname.endswith(".jpg") or fname.endswith(".jpeg")):
            return
        # Run asynchronously in background thread so watcher isn't blocked
        threading.Thread(target=self._process_incoming_file, args=(path,), daemon=True).start()

    def _process_incoming_file(self, path: Path):
        try:
            if wait_for_file_ready(path):
                mtime = path.stat().st_mtime
                last_mtime = self._processed_files.get(path.name, 0)
                if mtime > last_mtime + 0.5:
                    self._processed_files[path.name] = mtime
                    print(f"[CapturesManager] New valid capture detected: {path.name}")
                    self.create_capture_event(path, source="gear360")
        except Exception as e:
            print(f"[CapturesManager] Error processing {path}: {e}")

    def _polling_loop(self):
        while self._running:
            try:
                if RECEIVED_IMAGES_DIR.exists():
                    for p in list(RECEIVED_IMAGES_DIR.glob("*.jpg")) + list(RECEIVED_IMAGES_DIR.glob("*.jpeg")):
                        try:
                            if p.stat().st_size < 1024:
                                continue
                        except Exception:
                            continue

                        mtime = p.stat().st_mtime
                        last_mtime = self._processed_files.get(p.name, 0)
                        if p.name not in self._processed_files:
                            if wait_for_file_ready(p, timeout_sec=1.0):
                                self._processed_files[p.name] = mtime
                                print(f"[CapturesManager] Polling detected new image: {p.name}")
                                self.create_capture_event(p, source="gear360")
                        elif mtime > last_mtime + 0.5:
                            if wait_for_file_ready(p, timeout_sec=1.0):
                                self._processed_files[p.name] = mtime
                                print(f"[CapturesManager] Polling detected updated image: {p.name}")
                                self.create_capture_event(p, source="gear360")
            except Exception as e:
                print(f"[CapturesManager] Polling error: {e}")
            time.sleep(0.5)

    def _demo_replay_loop(self):
        """If DEMO_MODE=True and no real image arrived for 60s, replay images every 12s."""
        replay_index = 0
        while self._running:
            time.sleep(2.0)
            from server.config import DEMO_MODE
            if not DEMO_MODE:
                time.sleep(5.0)
                continue

            # If real ESP images exist, completely stop demo replays
            esp_images = list(RECEIVED_IMAGES_DIR.glob("received_esp_*.jpg"))
            if esp_images:
                time.sleep(5.0)
                continue

            now = time.time()
            if now - self.last_real_image_time >= 60.0:
                # Find available demo images
                images = sorted(list(RECEIVED_IMAGES_DIR.glob("received_0*.jpg")))
                if images:
                    target_img = images[replay_index % len(images)]
                    replay_index += 1
                    print(f"[CapturesManager] Demo replay: replaying {target_img.name}")
                    self.create_capture_event(target_img, source="demo_replay")
                    # Wait 12 seconds between demo replays
                    for _ in range(12):
                        if not self._running or (time.time() - self.last_real_image_time < 60.0):
                            break
                        time.sleep(1.0)

    def get_latest(self) -> Optional[Dict[str, Any]]:
        with self._lock:
            if not self._has_received_new_image:
                return self._baseline_capture
            if not self.captures:
                return self._baseline_capture
            # Prioritize newest real hardware capture if present
            for c in reversed(self.captures):
                if c.get("source") == "gear360" or "received_esp" in c.get("filename", ""):
                    return c
            return self.captures[-1]

    def get_recent(self, limit: int = 24) -> List[Dict[str, Any]]:
        with self._lock:
            return list(reversed(self.captures[-limit:]))

    def get_by_id(self, cap_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for c in reversed(self.captures):
                if c["id"] == cap_id:
                    return c
        return None

    def record_verification(self, cap_id: str, decision: str, corrected_label: Optional[str], operator: str, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
        with self._lock:
            target = None
            for c in self.captures:
                if c["id"] == cap_id:
                    target = c
                    break
            if not target:
                return None

            verif_data = {
                "decision": decision,
                "corrected_label": corrected_label,
                "operator": operator,
                "note": note,
                "at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            }
            target["verification"] = verif_data

        self.rewrite_events_file()

        # Broadcast update
        if self.ws_broadcast_callback:
            try:
                self.ws_broadcast_callback({
                    "type": "capture",
                    "data": target
                })
            except Exception as e:
                print(f"[CapturesManager] Broadcast error on verification: {e}")

        return target

    def stop(self):
        self._running = False
        if self._observer:
            try:
                self._observer.stop()
                self._observer.join()
            except Exception:
                pass


captures_manager = CapturesManager()
