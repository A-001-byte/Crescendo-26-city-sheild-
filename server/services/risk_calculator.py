import logging
import os
import time
import json
import random
from collections import defaultdict, deque
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)

_HISTORY_TTL_SECONDS = 24 * 60 * 60
_HISTORY_MIN_INTERVAL_SECONDS = 5 * 60
_score_history = defaultdict(lambda: deque())

# Mock functions as per the user's context description
# In a real scenario, these would be imported from their respective modules.

def get_nlp_signals():
    """
    Mock function to simulate fetching NLP signals.
    In the actual implementation, this would be:
    from services.nlp_engine import get_nlp_signals
    """
    return {
        "sentiment": random.uniform(-0.8, 0.2),  # Simulate a generally negative sentiment
        "keyword_score": random.uniform(0, 8)
    }

def get_oil_price():
    """
    Mock function to simulate fetching the current oil price.
    In the actual implementation, this would be:
    from services.oil_tracker import get_oil_prices
    And we would extract the current price from the returned dictionary.
    """
    # Simulate a volatile oil price environment
    return random.uniform(85.0, 110.0)

def normalize_score(score: float) -> float:
    """Clamp a score between 1 and 10 and keep a single decimal of precision."""
    clamped_score = max(1.0, min(10.0, float(score)))
    return round(clamped_score, 2)

def apply_floor(score, minimum=2):
    """
    Applies a minimum floor to a score.
    """
    return max(score, minimum)

def generate_alerts(scores: dict) -> list:
    """
    Generates a list of alert messages based on risk score thresholds.
    """
    alerts = []
    if scores.get("fuel", 0) >= 8:
        alerts.append("CRITICAL: Fuel risk has reached a critical level. Expect shortages.")
    elif scores.get("fuel", 0) >= 6:
        alerts.append("WARNING: Fuel risk is high. Monitor supply chains closely.")

    if scores.get("transport", 0) >= 7:
        alerts.append("WARNING: Transport and logistics are under strain. Delays are likely.")

    if scores.get("food", 0) > 7:
        alerts.append("ALERT: Food supply risk is elevated. Consider pre-emptive stock checks.")
        
    if not alerts:
        alerts.append("All systems stable. No immediate alerts.")
        
    return alerts

def predict_trend(scores: dict) -> dict:
    """
    Provides a simple trend prediction based on current score levels.
    """
    # This is a simplified logic. A real implementation would use historical data.
    average_score = sum(scores.values()) / len(scores) if scores else 0
    
    if average_score >= 7:
        return {"label": "Increasing", "description": "Risk levels are trending upwards significantly."}
    elif average_score >= 5:
        return {"label": "Slightly Increasing", "description": "Risk levels are showing a slight upward trend."}
    else:
        return {"label": "Stable", "description": "Risk levels are currently stable."}

def get_primary_risk(scores: dict) -> dict:
    """
    Identifies the category with the highest risk score.
    """
    if not scores:
        return {"category": "None", "value": 0}

    primary_category = max(scores, key=lambda category: float(scores.get(category, 0)))
    return {
        "category": primary_category,
        "value": scores[primary_category]
    }

def generate_recommendation(primary_risk_category: str) -> str:
    """
    Generates a short, actionable recommendation based on the primary risk.
    """
    if primary_risk_category == "fuel":
        return "Focus on securing fuel supply chains and managing reserves."
    elif primary_risk_category == "transport":
        return "Reinforce logistics and transportation networks to prevent bottlenecks."
    elif primary_risk_category == "food":
        return "Verify food stock levels and distribution channels."
    elif primary_risk_category == "power":
        return "Coordinate with power grid operators to ensure stability."
    else:
        return "Monitor all systems and maintain standard operational procedures."

def predict_48h(scores: dict, oil_trend_rising: bool = False) -> dict:
    """Predict how risk scores will change in the next 48 hours."""
    prediction = {}
    for key, value in scores.items():
        if value >= 8:
            pred = min(10, value + 1)
        elif value <= 3:
            pred = value
        else:
            pred = min(10, value + 0.5)
        if oil_trend_rising:
            pred = min(10, pred + 0.5)
        prediction[key] = pred
    return prediction


def get_prediction_summary(current: dict, predicted: dict) -> dict:
    """Return a nuanced trend label for each score category."""
    summary = {}
    for key in current:
        diff = predicted[key] - current[key]
        if diff >= 1:
            summary[key] = "increasing rapidly"
        elif diff > 0:
            summary[key] = "increasing"
        elif diff == 0:
            summary[key] = "stable"
        else:
            summary[key] = "slightly decreasing"
    return summary


def _compute_confidence(keyword_score: float, oil_impact: float) -> str:
    """Derive signal confidence from keyword strength and oil price deviation."""
    if keyword_score >= 6 and oil_impact >= 0.3:
        return "high"
    if keyword_score >= 4 or oil_impact >= 0.2:
        return "medium"
    return "low"


def _parse_nlp_inputs(nlp_signals):
    """
    Extract sentiment and keyword score from NLP payload.

    Handles two input shapes:
      - Root-level pipeline:  {"sentiment": float, "keyword_score": float, ...}
      - server analyze_batch: {"avg_severity": float, "service_signals": {...}, ...}
    """
    sentiment = None
    keyword_score = None

    if not isinstance(nlp_signals, dict):
        return sentiment, keyword_score

    # --- sentiment ---
    try:
        if nlp_signals.get("sentiment") is not None:
            sentiment = float(nlp_signals["sentiment"])
        elif nlp_signals.get("avg_severity") is not None:
            # avg_severity is 0-1 (higher = more alarming); map to negative sentiment
            sentiment = -(float(nlp_signals["avg_severity"]))
    except (TypeError, ValueError):
        sentiment = None

    # --- keyword_score ---
    # Only read from explicit keyword_score field; do NOT derive from avg_severity
    # (avg_severity is already consumed by sentiment above — double-counting inflates risk).
    try:
        if nlp_signals.get("keyword_score") is not None:
            keyword_score = float(nlp_signals["keyword_score"])
    except (TypeError, ValueError):
        keyword_score = None

    return sentiment, keyword_score


def _parse_oil_price(oil_data):
    """Extract a current price from known oil payload keys."""
    if not isinstance(oil_data, dict):
        return None

    for key in ("brent_current", "current_price", "price", "wti_current"):
        raw_value = oil_data.get(key)
        if raw_value is not None:
            try:
                return float(raw_value)
            except (TypeError, ValueError):
                continue

    return None


def _normalize_city(city: str | None) -> str:
    return (city or "").strip().lower()


def _record_history(city: str, scores: dict, overall: float) -> None:
    if not city:
        return

    now = time.time()
    bucket = _score_history[city]

    if bucket and (now - bucket[-1]["epoch"]) < _HISTORY_MIN_INTERVAL_SECONDS:
        bucket[-1] = {
            "epoch": now,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "scores": scores,
            "overall_crs": overall,
            "score": overall,
        }
    else:
        bucket.append({
            "epoch": now,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "scores": scores,
            "overall_crs": overall,
            "score": overall,
        })

    while bucket and (now - bucket[0]["epoch"]) > _HISTORY_TTL_SECONDS:
        bucket.popleft()


def get_last_24h_scores(city: str | None, hours: int = 24) -> list[dict]:
    city_key = _normalize_city(city)
    if not city_key:
        return []

    hours = max(1, min(int(hours), 48))
    cutoff = time.time() - (hours * 60 * 60)
    bucket = _score_history.get(city_key, deque())
    return [
        {k: v for k, v in entry.items() if k != "epoch"}
        for entry in bucket
        if entry.get("epoch", 0) >= cutoff
    ]


def calculate_risk(nlp_signals=None, oil_data=None, use_mock_data=False, city: str | None = None):
    """
    Calculates the city risk score and generates actionable intelligence.

    The calculation process is as follows:
    1.  Fetches NLP sentiment and keyword scores.
    2.  Applies a floor to the keyword score to ensure minimum signal strength.
    3.  Fetches the current oil price.
    4.  Computes a non-negative 'oil_impact' factor.
    5.  Calculates a 'base_risk' with strengthened sentiment impact.
    6.  Combines base_risk and oil_impact to generate category scores.
    7.  Applies city modifiers and public data factors.
    8.  Normalizes all final scores to a 1-10 range.
    9.  Generates alerts, trend predictions, and recommendations.
    10. Returns a composite dictionary with all intelligence layers.
    """
    # 1. Resolve inputs from provided live payloads first
    sentiment, keyword_score = _parse_nlp_inputs(nlp_signals)
    current_price = _parse_oil_price(oil_data)

    # 2. Only use local mocks when explicitly enabled
    if use_mock_data:
        if sentiment is None or keyword_score is None:
            default_nlp = get_nlp_signals()
            if sentiment is None:
                sentiment = default_nlp["sentiment"]
            if keyword_score is None:
                keyword_score = default_nlp["keyword_score"]
        if current_price is None:
            current_price = get_oil_price()

    if sentiment is None or keyword_score is None or current_price is None:
        raise ValueError("Missing required live inputs: nlp_signals(sentiment/keyword_score) and oil_data(current price)")

    city_key = _normalize_city(city)
    if not city_key:
        try:
            from config import config
            city_key = _normalize_city(config.CITY)
        except Exception:
            city_key = "pune"

    try:
        import importlib

        try:
            public_data_module = importlib.import_module("public_data")
        except Exception:
            public_data_module = importlib.import_module("services.public_data")

        public_data = public_data_module.fetch_city_data(city_key)
        city_modifiers = public_data_module.get_city_modifiers(city_key)
    except Exception as exc:
        logger.warning("Public data unavailable for %s: %s", city_key, exc)
        public_data = {
            "fuel_supply_index": 0.0,
            "food_supply_index": 0.0,
            "power_status": 0.0,
            "logistics_status": 0.0,
            "source": "unavailable",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        city_modifiers = {
            "fuel": 1.0,
            "food": 1.0,
            "power": 1.0,
            "transport": 1.0,
        }

    # 3. Add keyword floor to ensure minimum signal strength
    keyword_score = max(keyword_score, 2)

    # 4. Define baselines
    price_baseline = 70.0
    baseline_risk = 2.5

    # 5. Compute oil impact
    oil_impact = max(0, (current_price - price_baseline) / price_baseline)

    # 5b. Detect oil trend from payload for 48h prediction
    oil_trend_rising = False
    if isinstance(oil_data, dict):
        trend_7d = oil_data.get("trend_7d")
        if isinstance(trend_7d, str) and trend_7d.lower() in ("rising", "up", "increasing"):
            oil_trend_rising = True
        elif isinstance(trend_7d, (int, float)) and trend_7d > 0:
            oil_trend_rising = True

    # 6. Calculate base risk with reduced multipliers for realistic range
    base_risk = baseline_risk + (-sentiment * 2.5) + (keyword_score * 0.45)

    # 7. Create category-wise base scores (oil multipliers reduced ~25–30%)
    base_scores = {
        "fuel": base_risk * 1.0 + (oil_impact * 2.0),
        "transport": base_risk * 0.95 + (oil_impact * 1.7),
        "food": base_risk * 0.9 + (oil_impact * 1.1),
        "power": base_risk * 0.85 + (oil_impact * 0.85),
    }

    # 8. Apply city modifiers + public data factors
    public_factors = {
        "fuel": 1 + (float(public_data.get("fuel_supply_index", 0.0)) * 0.4),
        "food": 1 + (float(public_data.get("food_supply_index", 0.0)) * 0.4),
        "power": 1 + (float(public_data.get("power_status", 0.0)) * 0.4),
        "transport": 1 + (float(public_data.get("logistics_status", 0.0)) * 0.4),
    }

    adjusted_scores = {}
    for key, value in base_scores.items():
        modifier = float(city_modifiers.get(key, 1.0))
        factor = float(public_factors.get(key, 1.0))
        adjusted_scores[key] = apply_floor(value * modifier * factor)

    # 9. Normalize all service scores (public output)
    normalized_scores = {
        "fuel": normalize_score(adjusted_scores["fuel"]),
        "food": normalize_score(adjusted_scores["food"]),
        "transport": normalize_score(adjusted_scores["transport"]),
        "power": normalize_score(adjusted_scores["power"]),
    }

    # Keep sentiment internal for downstream intelligence logic.
    _internal_scores = {
        **normalized_scores,
        "sentiment": sentiment,
    }

    # 10. Generate intelligence features
    alerts = generate_alerts(normalized_scores)
    trend = predict_trend(_internal_scores)
    primary_risk = get_primary_risk(_internal_scores)
    recommendation = generate_recommendation(primary_risk["category"])
    confidence = _compute_confidence(keyword_score, oil_impact)
    prediction = predict_48h(normalized_scores, oil_trend_rising=oil_trend_rising)
    prediction_summary = get_prediction_summary(normalized_scores, prediction)

    # Print debug values
    print("--- Debug Values ---")
    print(f"Oil Price: {current_price:.2f}")
    print(f"Oil Impact: {oil_impact:.2f}")
    print(f"Sentiment: {sentiment:.2f}")
    print(f"Keyword Score (after floor): {keyword_score:.2f}")
    print(f"Base Risk: {base_risk:.2f}")
    print("--------------------")

    # 11. Return updated format
    return {
        "city": city_key,
        "scores": normalized_scores,
        "alerts": alerts,
        "trend": trend,
        "primary_risk": primary_risk,
        "recommendation": recommendation,
        "prediction_48h": prediction,
        "prediction_summary": prediction_summary,
        "confidence": confidence,
        "public_data": public_data,
        "city_modifiers": city_modifiers,
    }


def _alert_level_from_score(score: float) -> str:
    if score <= 3:
        return "green"
    if score <= 5:
        return "yellow"
    if score <= 7:
        return "orange"
    return "red"


def _ward_data_path(city: str | None) -> str:
    city_key = _normalize_city(city) or "pune"
    return os.path.join(os.path.dirname(__file__), "..", "data", f"{city_key}_wards.json")


def _load_ward_profiles(city: str | None) -> list[dict]:
    for city_key in [_normalize_city(city) or "pune", "pune"]:
        wards_path = _ward_data_path(city_key)
        try:
            with open(wards_path, "r", encoding="utf-8") as f:
                wards = json.load(f)
                if isinstance(wards, list):
                    return [w for w in wards if isinstance(w, dict) and w.get("name")]
        except (FileNotFoundError, json.JSONDecodeError, OSError) as exc:
            logger.warning("Failed to load wards from %s: %s", wards_path, exc)
    return []


def _load_wards(city: str | None = None) -> list:
    return [w.get("name", "") for w in _load_ward_profiles(city) if w.get("name")]


def _blend_ward_score(base_score: float, profile_score) -> float:
    try:
        base = float(base_score)
    except (TypeError, ValueError):
        base = 1.0

    if profile_score is None:
        return normalize_score(base)

    try:
        profile = float(profile_score)
    except (TypeError, ValueError):
        return normalize_score(base)

    return normalize_score((base * 0.7) + (profile * 0.3))


def calculate_city_risk_score(
    nlp_signals=None,
    oil_data=None,
    use_mock_data=False,
    include_wards=True,
    city: str | None = None,
):
    """Compatibility wrapper used by existing routes/app code."""
    result = calculate_risk(
        nlp_signals=nlp_signals,
        oil_data=oil_data,
        use_mock_data=use_mock_data,
        city=city,
    )
    scores = result.get("scores", {})
    component_keys = ["fuel", "food", "transport", "power"]
    base_values = [scores.get(k, 1) for k in component_keys]
    overall = round(sum(base_values) / len(base_values), 2)
    clamped_overall = max(1, min(10, overall))
    city_key = _normalize_city(result.get("city"))

    ward_scores = {}
    ward_service_scores = {}
    if include_wards:
        ward_profiles = _load_ward_profiles(city_key)

        if ward_profiles:
            for ward_profile in ward_profiles:
                ward_name = ward_profile.get("name")
                if not ward_name:
                    continue

                fuel = _blend_ward_score(scores.get("fuel", clamped_overall), ward_profile.get("fuel_score"))
                food = _blend_ward_score(scores.get("food", clamped_overall), ward_profile.get("food_score"))
                transport = _blend_ward_score(scores.get("transport", clamped_overall), ward_profile.get("logistics_score"))
                power = _blend_ward_score(scores.get("power", clamped_overall), ward_profile.get("power_score"))

                ward_service_scores[ward_name] = {
                    "fuel": fuel,
                    "food": food,
                    "transport": transport,
                    "power": power,
                }
                ward_scores[ward_name] = round((fuel + food + transport + power) / 4, 2)
        else:
            for ward in _load_wards(city_key):
                ward_scores[ward] = clamped_overall
                ward_service_scores[ward] = {
                    "fuel": scores.get("fuel", clamped_overall),
                    "food": scores.get("food", clamped_overall),
                    "transport": scores.get("transport", clamped_overall),
                    "power": scores.get("power", clamped_overall),
                }

    if city_key:
        _record_history(city_key, scores, clamped_overall)

    return {
        "city": city_key,
        "overall_crs": clamped_overall,
        "score": clamped_overall,
        "alert_level": _alert_level_from_score(clamped_overall),
        "scores": {k: scores.get(k, 1) for k in component_keys},
        "sentiment": scores.get("sentiment", 0),
        "alerts": result.get("alerts", []),
        "trend": result.get("trend", {}),
        "primary_risk": result.get("primary_risk", {}),
        "recommendation": result.get("recommendation", ""),
        "prediction_48h": result.get("prediction_48h", {}),
        "prediction_summary": result.get("prediction_summary", {}),
        "confidence": result.get("confidence", "medium"),
        "public_data": result.get("public_data", {}),
        "city_modifiers": result.get("city_modifiers", {}),
        "ward_scores": ward_scores,
        "ward_service_scores": ward_service_scores,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


def generate_mock_historical_scores(days: int = 7):
    """
    Generate synthetic historical CRS records for demo use.

    This function intentionally calls calculate_city_risk_score repeatedly,
    so returned records are mock data and not persisted history.
    """
    history = []
    days = max(1, min(int(days), 30))
    for i in range(days):
        current = calculate_city_risk_score(use_mock_data=True, include_wards=False)
        history.append({
            "date": (datetime.utcnow() - timedelta(days=(days - i - 1))).strftime("%Y-%m-%d"),
            "overall_crs": current.get("overall_crs", 1),
            "alert_level": current.get("alert_level", "green"),
        })
    return history


def get_historical_scores(hours: int = 24, city: str | None = None):
    """Return historical CRS records for the past N hours."""
    return get_last_24h_scores(city, hours=hours)


def get_ward_score(ward_name: str, city: str | None = None):
    from .news_fetcher import fetch_crisis_news
    from .nlp_engine import analyze_batch
    from .oil_tracker import get_oil_prices

    articles = fetch_crisis_news()
    nlp_result = analyze_batch(articles)
    oil_data = get_oil_prices()

    city_result = calculate_city_risk_score(
        nlp_signals=nlp_result,
        oil_data=oil_data,
        city=city,
        include_wards=True,
    )
    ward_scores = city_result.get("ward_scores", {})
    if ward_name not in ward_scores:
        return None

    return {
        "ward": ward_name,
        "score": ward_scores[ward_name],
        "overall_crs": city_result.get("overall_crs", 1),
        "alert_level": _alert_level_from_score(ward_scores[ward_name]),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

# Add a test block
if __name__ == "__main__":
    print("Calculating CityShield Risk Scores...")
    risk_output = calculate_risk(use_mock_data=True)
    print("\n--- Final Output ---")
    print(json.dumps(risk_output, indent=2))
    print("--------------------")

