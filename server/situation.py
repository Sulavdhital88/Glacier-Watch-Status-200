import time
from typing import Dict, Any, List
from server.config import THRESHOLDS
from server.captures import captures_manager
from server.sensors import sensor_manager


def evaluate_situation() -> Dict[str, Any]:
    """
    Evaluates multi-hazard inputs (camera/lake state, water level, seismic activity).
    Returns situation state: 'Calm', 'Watch', or 'Review now' along with explanatory reasons.
    """
    reasons: List[str] = []
    abnormal_inputs = set()

    # 1. Evaluate Lake State
    latest_capture = captures_manager.get_latest()
    lake_label = None
    lake_state = "NORMAL"
    if latest_capture and "prediction" in latest_capture:
        # If human verification corrected label, use it; otherwise use prediction label
        verif = latest_capture.get("verification")
        if verif and verif.get("corrected_label"):
            lake_label = verif["corrected_label"]
        else:
            lake_label = latest_capture["prediction"].get("label", "NORMAL")

        lake_state = lake_label
        if lake_label in ["RISING", "DECREASING"]:
            abnormal_inputs.add("lake_state")
            reasons.append(f"Lake visual state classified as {lake_label}")

    # 2. Evaluate Water Level
    sensor_summary = sensor_manager.get_latest_summary()
    water_info = sensor_summary.get("water_level", {})
    water_val = water_info.get("value_cm", 120.0)
    rate_of_rise = water_info.get("rate_of_rise_cm_min", 0.0)

    watch_w = float(THRESHOLDS["water_level"]["watch_threshold"])
    danger_w = float(THRESHOLDS["water_level"]["danger_threshold"])
    danger_rate = float(THRESHOLDS["water_level"]["danger_rate_of_rise"])

    water_critical = False
    if water_val >= danger_w:
        abnormal_inputs.add("water_level")
        water_critical = True
        reasons.append(f"Water level critical ({water_val:.1f} cm >= danger threshold {danger_w} cm)")
    elif rate_of_rise >= danger_rate:
        abnormal_inputs.add("water_level")
        water_critical = True
        reasons.append(f"Rapid water rise rate ({rate_of_rise:.1f} cm/min >= {danger_rate} cm/min)")
    elif water_val >= watch_w:
        abnormal_inputs.add("water_level")
        reasons.append(f"Water level in watch band ({water_val:.1f} cm >= {watch_w} cm)")

    # 3. Evaluate Seismic
    seismic_info = sensor_summary.get("seismic", {})
    seismic_val = seismic_info.get("peak_mg", 0.0)
    shaking_level = seismic_info.get("shaking_level", "quiet")

    tremor_s = float(THRESHOLDS["seismic"]["tremor_threshold"])
    strong_s = float(THRESHOLDS["seismic"]["strong_threshold"])

    seismic_strong = False
    if seismic_val >= strong_s or shaking_level == "strong":
        abnormal_inputs.add("seismic")
        seismic_strong = True
        reasons.append(f"Strong seismic ground acceleration ({seismic_val:.1f} mg >= {strong_s} mg)")
    elif seismic_val >= tremor_s or shaking_level == "tremor":
        abnormal_inputs.add("seismic")
        reasons.append(f"Seismic tremor detected ({seismic_val:.1f} mg >= {tremor_s} mg)")

    # Check recent seismic events (within 30m)
    recent_events = sensor_manager.get_events()
    had_recent_strong_shaking = any(e.get("level") == "strong" for e in recent_events[:5])

    # Rule decisions:
    # Review now:
    # - 2 or more independent inputs abnormal within window
    # - OR water rate of rise / level above danger threshold
    # - OR strong shaking followed by lake state change
    if (len(abnormal_inputs) >= 2 or
        water_critical or
        (had_recent_strong_shaking and lake_state in ["RISING", "DECREASING"])):
        status = "Review now"
        if not reasons:
            reasons.append("Multiple multi-hazard anomalies detected concurrently")
    elif len(abnormal_inputs) == 1:
        status = "Watch"
    else:
        status = "Calm"
        reasons = ["All monitored hazard parameters within nominal operational limits"]

    return {
        "status": status,
        "reasons": reasons,
        "abnormal_inputs": list(abnormal_inputs),
        "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "summary": {
            "lake_state": lake_state,
            "water_level_cm": water_val,
            "water_rate_cm_min": rate_of_rise,
            "seismic_peak_mg": seismic_val,
            "shaking_level": shaking_level
        }
    }
