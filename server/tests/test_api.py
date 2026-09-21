import pytest
from fastapi.testclient import TestClient
from server.main import app
from server.config import THRESHOLDS

client = TestClient(app)


def test_status_endpoint():
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "demo_mode" in data
    assert "sms_mode" in data


def test_towers_endpoint():
    res = client.get("/api/towers")
    assert res.status_code == 200
    towers = res.json()
    assert len(towers) >= 8
    assert towers[0]["id"] == "TOW-01"
    assert "est_recipients" in towers[0]


def test_sensors_endpoint():
    res = client.get("/api/sensors/latest")
    assert res.status_code == 200
    data = res.json()
    assert "water_level" in data
    assert "seismic" in data
    assert data["water_level"]["status"] in ["online", "offline"]


def test_sensors_history():
    res = client.get("/api/sensors/history?type=water_level&range=1h")
    assert res.status_code == 200
    data = res.json()
    assert data["sensor_type"] == "water_level"
    assert len(data["points"]) > 0


def test_situation_endpoint():
    res = client.get("/api/situation")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["Calm", "Watch", "Review now"]
    assert "reasons" in data


def test_alert_send_rejections():
    # 1. Reject without confirmed: true
    res = client.post("/api/alerts/send", json={
        "tower_ids": ["TOW-01"],
        "message": "Test alert",
        "languages": ["en"],
        "basis": "drill",
        "operator": "Pashupati",
        "confirmed": False
    })
    assert res.status_code in [400, 422]

    # 2. Reject without operator
    res = client.post("/api/alerts/send", json={
        "tower_ids": ["TOW-01"],
        "message": "Test alert",
        "languages": ["en"],
        "basis": "drill",
        "operator": "",
        "confirmed": True
    })
    assert res.status_code in [400, 422]

    # 3. Reject verified_lake_event without valid event_id
    res = client.post("/api/alerts/send", json={
        "tower_ids": ["TOW-01"],
        "message": "Test alert",
        "languages": ["en"],
        "basis": "verified_lake_event",
        "operator": "Pashupati",
        "confirmed": True,
        "event_id": "nonexistent_cap"
    })
    assert res.status_code == 400


def test_drill_alert_send_success():
    res = client.post("/api/alerts/send", json={
        "tower_ids": ["TOW-01", "TOW-02"],
        "message": "This is a GlacierWatch test message. No action is needed.",
        "languages": ["en"],
        "basis": "drill",
        "operator": "Operator Ramesh",
        "confirmed": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "delivered"
    assert len(data["tower_ids"]) == 2
    assert data["est_recipients"] > 0
