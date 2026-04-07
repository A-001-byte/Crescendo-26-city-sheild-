import logging
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Alert templates by trigger level
# ---------------------------------------------------------------------------
ALERT_TEMPLATES = {
    "T-48": {
        "label": "T-48: 48-Hour Pre-Crisis Alert",
        "fuel": (
            "ADVISORY (T-48): Fuel supply stress detected in {ward}. "
            "Current buffer: {buffer_hours} hours. Conserve fuel usage. "
            "Avoid non-essential travel. Monitor official updates."
        ),
        "power": (
            "ADVISORY (T-48): Power grid load elevated in {ward}. "
            "Possible scheduled outages 18:00–22:00. Charge devices and "
            "prepare backup power for essential equipment."
        ),
        "food": (
            "ADVISORY (T-48): Food supply chain under moderate stress in {ward}. "
            "No immediate shortage. Maintain 3-day household food stocks as precaution."
        ),
        "logistics": (
            "ADVISORY (T-48): Transport and supply chain disruption detected. "
            "Delivery timelines for essential goods may be affected in {ward}. "
            "Stock 2-day household essentials."
        ),
        "general": (
            "ADVISORY (T-48 — {ward}): City Risk Score has elevated to YELLOW. "
            "Monitor official channels. No immediate action required. "
            "CRS: {crs}/10 | Alert: YELLOW | Time: {timestamp}"
        ),
    },
    "T-24": {
        "label": "T-24: 24-Hour Crisis Warning",
        "fuel": (
            "WARNING (T-24): Fuel shortage imminent in {ward}. "
            "Petrol pumps may be restricted to essential vehicles only within 24 hours. "
            "Fill tanks immediately. Ration personal fuel use."
        ),
        "power": (
            "WARNING (T-24): Power grid at critical capacity in {ward}. "
            "Planned load shedding 4–6 hours/day starting tomorrow. "
            "Charge essential devices NOW. Activate backup generators."
        ),
        "food": (
            "WARNING (T-24): Food supply shortage warning for {ward}. "
            "Government distribution centers activating. Limit panic buying. "
            "Maintain 5-day household food stocks."
        ),
        "logistics": (
            "WARNING (T-24): Major logistics disruption in {ward}. "
            "Supply deliveries suspended. Emergency goods corridors being established. "
            "Conserve all essential supplies."
        ),
        "general": (
            "WARNING (T-24 — {ward}): City Risk Score elevated to ORANGE. "
            "Crisis protocols activating. Follow official directives. "
            "CRS: {crs}/10 | Alert: ORANGE | Time: {timestamp}"
        ),
    },
    "T-0": {
        "label": "T-0: Immediate Crisis Protocol",
        "fuel": (
            "EMERGENCY (T-0): CRITICAL FUEL SHORTAGE in {ward}. "
            "Fuel rationing NOW in effect. Essential services only. "
            "Report to ward crisis center for emergency fuel tokens."
        ),
        "power": (
            "EMERGENCY (T-0): GRID FAILURE IMMINENT in {ward}. "
            "Extended blackouts expected. Switch to backup power. "
            "Emergency shelters with power available at {ward} community hall."
        ),
        "food": (
            "EMERGENCY (T-0): CRITICAL FOOD SHORTAGE in {ward}. "
            "Emergency food distribution at ward office. Bring ID. "
            "Rationing: 2kg grain + 1L oil per family per week."
        ),
        "logistics": (
            "EMERGENCY (T-0): SUPPLY CHAIN COLLAPSE in {ward}. "
            "Emergency logistics corridor operational. "
            "Priority delivery to hospitals, fuel depots, and food centers only."
        ),
        "general": (
            "EMERGENCY (T-0 — {ward}): CRITICAL CRISIS THRESHOLD REACHED. "
            "Full emergency protocol activated. Follow all official directives immediately. "
            "CRS: {crs}/10 | Alert: RED | Time: {timestamp}"
        ),
    },
}

# ---------------------------------------------------------------------------
# Hardcoded alert history
# ---------------------------------------------------------------------------
def _make_history_entry(
    hours_ago: float,
    ward: str,
    severity: str,
    trigger: str,
    service: str,
    message: str,
    channels: List[str],
    sent: int,
) -> Dict[str, Any]:
    ts = (datetime.utcnow() - timedelta(hours=hours_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")
    delivered = math.floor(sent * 0.90)
    read = math.floor(delivered * 0.70)
    return {
        "id": f"ALT-{abs(hash(ts + ward)) % 90000 + 10000}",
        "timestamp": ts,
        "ward": ward,
        "trigger_level": trigger,
        "service": service,
        "severity": severity,
        "message": message,
        "channels": channels,
        "delivery_stats": {
            "sent": sent,
            "delivered": delivered,
            "read": read,
            "delivery_rate_pct": round((delivered / sent) * 100, 1),
            "read_rate_pct": round((read / sent) * 100, 1),
        },
        "status": "delivered",
    }


ALERT_HISTORY = [
    _make_history_entry(
        0.5, "Hinjewadi", "critical", "T-0", "fuel",
        "EMERGENCY (T-0): CRITICAL FUEL SHORTAGE in Hinjewadi. Fuel rationing NOW in effect.",
        ["sms", "app", "public_address"], 18500,
    ),
    _make_history_entry(
        1.2, "Hadapsar", "high", "T-24", "fuel",
        "WARNING (T-24): Fuel shortage imminent in Hadapsar. Fill tanks immediately.",
        ["sms", "app"], 42000,
    ),
    _make_history_entry(
        2.0, "Chinchwad", "high", "T-24", "power",
        "WARNING (T-24): Power grid at critical capacity in Chinchwad. Load shedding 4–6 hrs/day.",
        ["sms", "app", "email"], 35500,
    ),
    _make_history_entry(
        3.5, "Katraj", "high", "T-24", "logistics",
        "WARNING (T-24): Major logistics disruption in Katraj. Supply deliveries suspended.",
        ["sms", "app"], 32000,
    ),
    _make_history_entry(
        5.0, "Pimpri", "high", "T-24", "fuel",
        "WARNING (T-24): Fuel shortage warning in Pimpri. Ration personal fuel use.",
        ["sms", "app"], 38000,
    ),
    _make_history_entry(
        7.0, "Wakad", "moderate", "T-48", "food",
        "ADVISORY (T-48): Food supply chain under moderate stress in Wakad. Maintain 3-day household stocks.",
        ["app", "email"], 21000,
    ),
    _make_history_entry(
        9.0, "Hinjewadi", "high", "T-24", "power",
        "WARNING (T-24): Grid at critical load in Hinjewadi IT Park. Planned 6-hr outage scheduled.",
        ["sms", "app", "email", "public_address"], 19500,
    ),
    _make_history_entry(
        12.0, "Kothrud", "moderate", "T-48", "fuel",
        "ADVISORY (T-48): Fuel supply stress detected in Kothrud. Conserve fuel usage.",
        ["sms", "app"], 31000,
    ),
    _make_history_entry(
        14.0, "Aundh", "moderate", "T-48", "logistics",
        "ADVISORY (T-48): Transport disruption in Aundh. Essential goods delivery delayed by 24–48 hrs.",
        ["app"], 27500,
    ),
    _make_history_entry(
        18.0, "All Wards", "critical", "T-0", "general",
        "EMERGENCY (T-0 — All Wards): City CRS reached 8.7/10. Full emergency protocol activated.",
        ["sms", "app", "public_address", "radio", "tv"], 325000,
    ),
    _make_history_entry(
        22.0, "Hadapsar", "high", "T-24", "power",
        "WARNING (T-24): Power grid strain in Hadapsar industrial zone. Backup generators advised.",
        ["sms", "app"], 42000,
    ),
    _make_history_entry(
        26.0, "Swargate", "moderate", "T-48", "food",
        "ADVISORY (T-48): Food price surge in Swargate market area. Government stocks being released.",
        ["sms", "app"], 24000,
    ),
    _make_history_entry(
        30.0, "Katraj", "moderate", "T-48", "fuel",
        "ADVISORY (T-48): Fuel buffer at 32 hours in Katraj. Non-essential vehicle use discouraged.",
        ["sms", "app"], 32000,
    ),
    _make_history_entry(
        36.0, "Baner", "moderate", "T-48", "logistics",
        "ADVISORY (T-48): Shipping delays affecting Baner commercial district. Anticipate 3-day delivery lag.",
        ["app", "email"], 23000,
    ),
    _make_history_entry(
        42.0, "Pimpri", "high", "T-24", "food",
        "WARNING (T-24): Food shortage warning for Pimpri. Emergency distribution center open at ward office.",
        ["sms", "app", "public_address"], 38000,
    ),
    _make_history_entry(
        48.0, "Shivajinagar", "moderate", "T-48", "power",
        "ADVISORY (T-48): Grid load 95% in Shivajinagar. Possible load shedding 19:00–21:00.",
        ["sms", "app"], 18500,
    ),
    _make_history_entry(
        54.0, "Deccan", "low", "Normal", "general",
        "INFORMATION: Routine system check complete. All Deccan ward metrics within normal range.",
        ["app"], 14500,
    ),
    _make_history_entry(
        60.0, "Kharadi", "moderate", "T-48", "fuel",
        "ADVISORY (T-48): Fuel supply stress in Kharadi tech corridor. EV charging prioritized.",
        ["sms", "app", "email"], 19500,
    ),
    _make_history_entry(
        72.0, "Chinchwad", "high", "T-24", "logistics",
        "WARNING (T-24): Port closure affecting Chinchwad auto parts supply chain. Production delays likely.",
        ["sms", "app", "email"], 35500,
    ),
    _make_history_entry(
        84.0, "Viman Nagar", "low", "Normal", "general",
        "INFORMATION: Supply metrics stable in Viman Nagar. Airport cargo flows normal.",
        ["app"], 16500,
    ),
]


def dispatch_alert(
    ward: str,
    message: str,
    severity: str,
    channels: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Dispatch an alert to a ward via specified channels.
    Logs the dispatch and returns mock delivery statistics.
    """
    if channels is None:
        channels = ["sms", "app"]

    logger.info(
        "Dispatching %s alert to %s via %s: %s",
        severity.upper(), ward, channels, message[:80]
    )

    # Estimate population reach based on ward
    ward_pops = {w["name"]: w["population"] for w in []}
    # Try to find population from wards data
    try:
        import json, os
        wards_path = os.path.join(os.path.dirname(__file__), "..", "data", "pune_wards.json")
        with open(wards_path, "r") as f:
            wards = json.load(f)
        ward_pops = {w["name"]: w["population"] for w in wards}
    except Exception:
        ward_pops = {}

    population = ward_pops.get(ward, 250000)

    # Estimate reach: SMS reaches 60%, app reaches 40%, each channel independent
    channel_reach = {"sms": 0.60, "app": 0.40, "email": 0.35, "public_address": 0.25, "radio": 0.45, "tv": 0.55}
    total_reach_factor = 1.0
    for ch in channels:
        reach = channel_reach.get(ch, 0.3)
        total_reach_factor = total_reach_factor * (1.0 - reach)
    effective_reach = 1.0 - total_reach_factor

    sent = int(population * effective_reach)
    delivered = math.floor(sent * 0.90)
    read = math.floor(delivered * 0.70)

    ts = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    alert_id = f"ALT-{abs(hash(ts + ward + severity)) % 90000 + 10000}"

    result = {
        "success": True,
        "alert_id": alert_id,
        "ward": ward,
        "severity": severity,
        "channels": channels,
        "message": message,
        "timestamp": ts,
        "delivery_stats": {
            "sent": sent,
            "delivered": delivered,
            "read": read,
            "delivery_rate_pct": round((delivered / max(sent, 1)) * 100, 1),
            "read_rate_pct": round((read / max(sent, 1)) * 100, 1),
        },
        "status": "dispatched",
    }

    logger.info("Alert %s dispatched: sent=%d, delivered=%d", alert_id, sent, delivered)
    return result


def get_alert_templates() -> Dict[str, Any]:
    """Return alert templates organized by trigger level."""
    return {
        trigger: {
            "label": data["label"],
            "templates": {
                service: text
                for service, text in data.items()
                if service != "label"
            }
        }
        for trigger, data in ALERT_TEMPLATES.items()
    }


def get_alert_history(severity_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Return alert history, optionally filtered by severity.

    Parameters
    ----------
    severity_filter : "low", "moderate", "high", "critical", or "all" / None for all
    """
    if not severity_filter or severity_filter.lower() == "all":
        return ALERT_HISTORY

    return [
        alert for alert in ALERT_HISTORY
        if alert["severity"].lower() == severity_filter.lower()
    ]
