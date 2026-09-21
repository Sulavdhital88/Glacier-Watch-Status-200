import os
from pathlib import Path
import yaml
from dotenv import load_dotenv

# Load .env
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
SMS_MODE = os.getenv("SMS_MODE", "mock").lower()
SENSOR_MODE = os.getenv("SENSOR_MODE", "simulated").lower()
RECEIVED_IMAGES_DIR = Path(os.getenv("RECEIVED_IMAGES_DIR", "received_images"))
if not RECEIVED_IMAGES_DIR.is_absolute():
    RECEIVED_IMAGES_DIR = BASE_DIR / RECEIVED_IMAGES_DIR

MODEL_PATH = Path(os.getenv("MODEL_PATH", "models/glacierwatch_model.pth"))
if not MODEL_PATH.is_absolute():
    MODEL_PATH = BASE_DIR / MODEL_PATH

CONFIDENCE_LOW = float(os.getenv("CONFIDENCE_LOW", "0.70"))
INGEST_TOKEN = os.getenv("INGEST_TOKEN", "")

# ESP Serial Hardware Settings
SERIAL_ENABLED = os.getenv("SERIAL_ENABLED", "false").lower() == "true"
SERIAL_PORT = os.getenv("SERIAL_PORT", "COM4")
SERIAL_BAUD = int(os.getenv("SERIAL_BAUD", "2000000"))

# SMS Gateway Settings
raw_endpoints = os.getenv(
    "SMS_GATEWAY_ENDPOINTS",
    "http://<SMS_GATEWAY_IP>:8082/message"
)
SMS_GATEWAY_ENDPOINTS = [ep.strip() for ep in raw_endpoints.split(",") if ep.strip()]
SMS_AUTH_TOKEN = os.getenv("SMS_AUTH_TOKEN", "YOUR_SMS_GATEWAY_TOKEN")
SMS_RECIPIENT_NUMBER = os.getenv("SMS_RECIPIENT_NUMBER", "+97798XXXXXXXX")

DATA_DIR = BASE_DIR / "server" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
EVENTS_FILE = DATA_DIR / "events.jsonl"
AUDIT_FILE = DATA_DIR / "audit.jsonl"
TOWERS_FILE = DATA_DIR / "towers.json"

THRESHOLDS_FILE = BASE_DIR / "server" / "config" / "thresholds.yaml"

def load_thresholds():
    if THRESHOLDS_FILE.exists():
        with open(THRESHOLDS_FILE, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {
        "water_level": {
            "unit": "cm",
            "normal_baseline": 120.0,
            "watch_threshold": 140.0,
            "danger_threshold": 180.0,
            "danger_rate_of_rise": 2.0
        },
        "seismic": {
            "unit": "mg",
            "baseline": 2.0,
            "tremor_threshold": 15.0,
            "strong_threshold": 50.0
        },
        "health": {
            "sensor_offline_timeout_seconds": 30
        },
        "confidence": {
            "low_threshold": 0.70
        },
        "situation": {
            "coincidence_window_minutes": 30
        }
    }

THRESHOLDS = load_thresholds()
