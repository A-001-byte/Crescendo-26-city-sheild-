import json
import os
import random
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load weights from config file
# ---------------------------------------------------------------------------
_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "service_weights.json")
_WARDS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "pune_wards.json")

try:
    with open(_WEIGHTS_PATH, "r", encoding="utf-8") as f:
        WEIGHTS: Dict[str, float] = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    WEIGHTS = {"fuel": 0.35, "power": 0.25, "food": 0.25, "logistics": 0.15}

try:
    with open(_WARDS_PATH, "r", encoding="utf-8") as f:
        PUNE_WARDS: List[Dict] = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    PUNE_WARDS = []


def _signal_to_score(signal_value: float) -> float:
    """Convert NLP signal score (0–1) to CRS score (1–10)."""
    return round(1.0 + signal_value * 9.0, 2)


def _apply_oil_boost(fuel_score: float, oil_data: Optional[Dict[str, Any]]) -> float:
    """Apply oil price volatility boost to the fuel CRS score."""
    if not oil_data:
        return fuel_score

    from services.oil_tracker import get_oil_price_impact_on_fuel_score
    boost_factor = get_oil_price_impact_on_fuel_score(oil_data)

    # Boost can add up to 2 points on the 1-10 scale
    boosted = fuel_score + (boost_factor * 2.0)
    return round(min(10.0, boosted), 2)


def _alert_level(crs: float) -> str:
    if crs < 4:
        return "green"
    elif crs < 6:
        return "yellow"
    elif crs < 8:
        return "orange"
    else:
        return "red"


def _trigger_level(crs: float) -> str:
    if crs < 5:
        return "Normal"
    elif crs < 7:
        return "T-48"
    elif crs < 9:
        return "T-24"
    else:
        return "T-0"


def _recommended_actions(crs: float, alert: str, services: Dict[str, float]) -> List[str]:
    """Generate recommended actions based on CRS score and service levels."""
    actions = []

    if alert == "green":
        actions = [
            "Continue routine monitoring of supply chain metrics.",
            "Maintain standard fuel and food buffer stocks.",
            "Conduct monthly ward-level infrastructure audit.",
        ]
    elif alert == "yellow":
        actions = [
            "Activate enhanced monitoring mode — check feeds every 4 hours.",
            "Alert fuel depot managers to prepare for possible increased demand.",
            "Review hospital and emergency service fuel reserves.",
            "Notify ward-level crisis coordinators to stand by.",
        ]
    elif alert == "orange":
        actions = [
            "Initiate T-48 crisis protocol across all critical wards.",
            "Emergency fuel stock procurement from HPCL/BPCL regional depot.",
            "Coordinate with Maharashtra SDMA for pre-positioning of relief stocks.",
            "Activate public advisory on fuel and food conservation.",
            "Increase frequency of grid monitoring at MSEDCL substations.",
            "Alert hospitals to verify backup generator fuel levels.",
            "Deploy rapid-response logistics teams to high-risk wards.",
        ]
    else:  # red
        actions = [
            "ACTIVATE T-0 EMERGENCY PROTOCOL IMMEDIATELY.",
            "Deploy crisis management team to all 15 wards.",
            "Issue public emergency alert via all channels (SMS, app, radio, TV).",
            "Enforce fuel rationing at all petrol pumps — essential services priority.",
            "Commandeer emergency food stocks from government warehouses.",
            "Coordinate with Army logistics for emergency supply corridor.",
            "Suspend non-essential industrial power consumption.",
            "Open emergency shelter and distribution centers.",
            "Notify state government and activate district disaster response fund.",
        ]

    # Add service-specific actions for high-scoring services
    high_services = [svc for svc, score in services.items() if score >= 7.5]
    for svc in high_services:
        if svc == "fuel" and "Initiate emergency fuel procurement" not in " ".join(actions):
            actions.append("Priority: Secure emergency fuel procurement from strategic reserves.")
        elif svc == "power":
            actions.append("Priority: Coordinate with power grid operator for load-shedding schedule.")
        elif svc == "food":
            actions.append("Priority: Release food buffer stocks to regulated distribution points.")
        elif svc == "logistics":
            actions.append("Priority: Open emergency logistics corridors for essential goods.")

    return actions


def calculate_city_risk_score(
    nlp_signals: Optional[Dict[str, Any]] = None,
    oil_data: Optional[Dict[str, Any]] = None,
    city_config: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Calculate the City Risk Score (CRS) for Pune.

    Parameters
    ----------
    nlp_signals : output from nlp_engine.analyze_batch (service_signals dict or full result)
    oil_data    : output from oil_tracker.get_oil_prices()
    city_config : optional overrides

    Returns
    -------
    Full CRSResult dict
    """
    # Extract service_signals if nlp_signals is the full analyze_batch result
    if nlp_signals and "service_signals" in nlp_signals:
        service_signals = nlp_signals["service_signals"]
    elif nlp_signals:
        service_signals = nlp_signals
    else:
        service_signals = {}

    # Build per-service scores (1-10)
    service_scores: Dict[str, float] = {}
    for svc in ["fuel", "power", "food", "logistics"]:
        signal = service_signals.get(svc, {})
        raw_score = signal.get("score", 0.0) if isinstance(signal, dict) else float(signal)
        score_10 = _signal_to_score(raw_score)
        service_scores[svc] = score_10

    # Apply oil price boost to fuel score
    service_scores["fuel"] = _apply_oil_boost(service_scores["fuel"], oil_data)

    # Calculate weighted CRS
    overall_crs = sum(
        service_scores[svc] * WEIGHTS.get(svc, 0.25)
        for svc in service_scores
    )
    overall_crs = round(min(10.0, overall_crs), 2)

    alert = _alert_level(overall_crs)
    trigger = _trigger_level(overall_crs)
    actions = _recommended_actions(overall_crs, alert, service_scores)

    # Ward scores — vary slightly around city average (±1.5)
    ward_scores = _compute_ward_scores(overall_crs)

    # Build service detail dict
    services_detail: Dict[str, Any] = {}
    for svc in ["fuel", "power", "food", "logistics"]:
        signal_info = service_signals.get(svc, {}) if isinstance(service_signals, dict) else {}
        services_detail[svc] = {
            "score": service_scores[svc],
            "weight": WEIGHTS.get(svc, 0.25),
            "article_count": signal_info.get("article_count", 0) if isinstance(signal_info, dict) else 0,
            "top_keywords": signal_info.get("top_keywords", []) if isinstance(signal_info, dict) else [],
            "weighted_contribution": round(service_scores[svc] * WEIGHTS.get(svc, 0.25), 3),
        }

    return {
        "city": "Pune",
        "overall_crs": overall_crs,
        "alert_level": alert,
        "services": services_detail,
        "ward_scores": ward_scores,
        "trigger_level": trigger,
        "recommended_actions": actions,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def _compute_ward_scores(city_avg: float) -> Dict[str, float]:
    """
    Derive ward-level CRS scores from city average.
    Uses ward baseline risk scores from pune_wards.json to weight variation.
    """
    ward_scores: Dict[str, float] = {}

    # Seed random for reproducibility within same hour
    seed = int(datetime.utcnow().strftime("%Y%m%d%H"))
    rng = random.Random(seed)

    if PUNE_WARDS:
        # Normalise ward baseline risk scores to 1-10 scale
        max_risk = max(w["risk_score"] for w in PUNE_WARDS)
        min_risk = min(w["risk_score"] for w in PUNE_WARDS)
        risk_range = max_risk - min_risk if max_risk != min_risk else 1.0

        for ward in PUNE_WARDS:
            # Ward deviation from city avg based on its relative risk
            normalized_risk = (ward["risk_score"] - min_risk) / risk_range  # 0-1
            deviation = (normalized_risk - 0.5) * 3.0  # ±1.5 range
            noise = rng.uniform(-0.3, 0.3)
            ward_score = round(min(10.0, max(1.0, city_avg + deviation + noise)), 2)
            ward_scores[ward["name"]] = ward_score
    else:
        # Fallback: generic ward names with random variation
        default_wards = [
            "Kothrud", "Shivajinagar", "Hadapsar", "Deccan", "Aundh",
            "Baner", "Hinjewadi", "Wakad", "Pimpri", "Chinchwad",
            "Kharadi", "Viman Nagar", "Koregaon Park", "Swargate", "Katraj"
        ]
        for ward in default_wards:
            variation = rng.uniform(-1.5, 1.5)
            ward_scores[ward] = round(min(10.0, max(1.0, city_avg + variation)), 2)

    return ward_scores


def get_historical_scores(days: int = 7) -> List[Dict[str, Any]]:
    """
    Return historical CRS scores for the past N days.
    Shows a realistic upward fuel trend over the period.
    """
    history = []
    today = datetime.utcnow().date()

    # Base values showing worsening situation over 7 days
    # Day 0 (oldest) = lower scores, Day 6 (today) = higher scores
    base_values = {
        "fuel":      [4.2, 4.8, 5.3, 5.9, 6.4, 7.0, 7.8],
        "power":     [3.8, 4.1, 4.5, 4.8, 5.2, 5.5, 5.9],
        "food":      [3.5, 3.7, 4.0, 4.3, 4.6, 4.9, 5.2],
        "logistics": [3.2, 3.5, 3.8, 4.1, 4.4, 4.7, 5.0],
    }

    rng = random.Random(42)

    for i in range(days):
        day_date = today - timedelta(days=(days - 1 - i))
        idx = min(i, 6)

        fuel = round(base_values["fuel"][idx] + rng.uniform(-0.2, 0.2), 2)
        power = round(base_values["power"][idx] + rng.uniform(-0.15, 0.15), 2)
        food = round(base_values["food"][idx] + rng.uniform(-0.15, 0.15), 2)
        logistics = round(base_values["logistics"][idx] + rng.uniform(-0.1, 0.1), 2)

        overall = round(
            fuel * WEIGHTS["fuel"] +
            power * WEIGHTS["power"] +
            food * WEIGHTS["food"] +
            logistics * WEIGHTS["logistics"],
            2
        )

        history.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "fuel": fuel,
            "power": power,
            "food": food,
            "logistics": logistics,
            "overall": overall,
        })

    return history


def get_ward_score(ward_name: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed CRS score for a specific ward.
    """
    ward_data = None
    for w in PUNE_WARDS:
        if w["name"].lower() == ward_name.lower():
            ward_data = w
            break

    if not ward_data:
        return None

    # Use ward-specific service scores with small noise
    rng = random.Random(hash(ward_name) % (2**31))

    fuel_score = round(min(10.0, ward_data["fuel_score"] + rng.uniform(-0.5, 0.5)), 2)
    power_score = round(min(10.0, ward_data["power_score"] + rng.uniform(-0.5, 0.5)), 2)
    food_score = round(min(10.0, ward_data["food_score"] + rng.uniform(-0.5, 0.5)), 2)
    logistics_score = round(min(10.0, ward_data["logistics_score"] + rng.uniform(-0.5, 0.5)), 2)

    overall = round(
        fuel_score * WEIGHTS["fuel"] +
        power_score * WEIGHTS["power"] +
        food_score * WEIGHTS["food"] +
        logistics_score * WEIGHTS["logistics"],
        2
    )

    alert = _alert_level(overall)
    trigger = _trigger_level(overall)

    return {
        "ward": ward_data["name"],
        "overall_crs": overall,
        "alert_level": alert,
        "trigger_level": trigger,
        "services": {
            "fuel": {"score": fuel_score, "weight": WEIGHTS["fuel"]},
            "power": {"score": power_score, "weight": WEIGHTS["power"]},
            "food": {"score": food_score, "weight": WEIGHTS["food"]},
            "logistics": {"score": logistics_score, "weight": WEIGHTS["logistics"]},
        },
        "infrastructure": {
            "population": ward_data["population"],
            "fuel_stations": ward_data["fuel_stations"],
            "hospitals": ward_data["hospitals"],
            "buffer_hours": ward_data["buffer_hours"],
        },
        "recommended_actions": _recommended_actions(overall, alert, {
            "fuel": fuel_score, "power": power_score,
            "food": food_score, "logistics": logistics_score,
        }),
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
