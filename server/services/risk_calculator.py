import logging
import os
import random
import json
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)

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

def normalize_score(score: float) -> int:
    """
    Clamps a score between 1 and 10 and rounds it to the nearest integer.
    """
    # Final clamp to ensure score is within 1-10 range
    clamped_score = max(1.0, min(10.0, score))
    return round(clamped_score)

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

def _parse_nlp_inputs(nlp_signals):
    """Extract sentiment and keyword score from NLP payload."""
    sentiment = None
    keyword_score = None

    if not isinstance(nlp_signals, dict):
        return sentiment, keyword_score

    try:
        raw_sentiment = nlp_signals.get("sentiment")
        if raw_sentiment is not None:
            sentiment = float(raw_sentiment)
    except (TypeError, ValueError):
        sentiment = None

    try:
        raw_keyword = nlp_signals.get("keyword_score")
        raw_avg_severity = nlp_signals.get("avg_severity")
        if raw_keyword is not None:
            keyword_score = float(raw_keyword)
        elif raw_avg_severity is not None:
            keyword_score = float(raw_avg_severity)
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


def calculate_risk(nlp_signals=None, oil_data=None, use_mock_data=False):
    """
    Calculates the city risk score and generates actionable intelligence.

    The calculation process is as follows:
    1.  Fetches NLP sentiment and keyword scores.
    2.  Applies a floor to the keyword score to ensure minimum signal strength.
    3.  Fetches the current oil price.
    4.  Computes a non-negative 'oil_impact' factor.
    5.  Calculates a 'base_risk' with strengthened sentiment impact.
    6.  Combines base_risk and oil_impact to generate category scores.
    7.  Applies a minimum score floor.
    8.  Normalizes all final scores to an integer range of 1-10.
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

    # 3. Add keyword floor to ensure minimum signal strength
    keyword_score = max(keyword_score, 2)

    # 4. Define baselines
    price_baseline = 70.0
    baseline_risk = 2.8

    # 5. Compute oil impact
    oil_impact = max(0, (current_price - price_baseline) / price_baseline)

    # 6. Calculate base risk with tuned sentiment/keyword scaling
    base_risk = baseline_risk + (-sentiment * 3.0) + (keyword_score * 0.55)

    # 7. Create category-wise scores
    fuel = base_risk * 1.0 + (oil_impact * 2.8)
    transport = base_risk * 0.95 + (oil_impact * 2.4)
    food = base_risk * 0.9 + (oil_impact * 1.6)
    power = base_risk * 0.85 + (oil_impact * 1.2)

    # 8. Apply minimum floor
    fuel = apply_floor(fuel)
    transport = apply_floor(transport)
    food = apply_floor(food)
    power = apply_floor(power)

    # 9. Normalize all service scores (public output)
    normalized_scores = {
        "fuel": normalize_score(fuel),
        "food": normalize_score(food),
        "transport": normalize_score(transport),
        "power": normalize_score(power),
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
        "scores": normalized_scores,
        "alerts": alerts,
        "trend": trend,
        "primary_risk": primary_risk,
        "recommendation": recommendation
    }


def _alert_level_from_score(score: float) -> str:
    if score <= 3:
        return "green"
    if score <= 5:
        return "yellow"
    if score <= 7:
        return "orange"
    return "red"


def _load_wards() -> list:
    wards_path = os.path.join(os.path.dirname(__file__), "..", "data", "pune_wards.json")
    try:
        with open(wards_path, "r", encoding="utf-8") as f:
            wards = json.load(f)
            return [w.get("name", "") for w in wards if w.get("name")]
    except (FileNotFoundError, json.JSONDecodeError, OSError) as exc:
        logger.error("Failed to load wards from %s: %s", wards_path, exc)
        return []


def calculate_city_risk_score(nlp_signals=None, oil_data=None, use_mock_data=False, include_wards=True):
    """Compatibility wrapper used by existing routes/app code."""
    result = calculate_risk(nlp_signals=nlp_signals, oil_data=oil_data, use_mock_data=use_mock_data)
    scores = result.get("scores", {})
    component_keys = ["fuel", "food", "transport", "power"]
    base_values = [scores.get(k, 1) for k in component_keys]
    overall = round(sum(base_values) / len(base_values), 2)
    clamped_overall = max(1, min(10, overall))

    ward_scores = {}
    if include_wards:
        for ward in _load_wards():
            ward_scores[ward] = clamped_overall

    return {
        "overall_crs": clamped_overall,
        "alert_level": _alert_level_from_score(clamped_overall),
        "scores": {k: scores.get(k, 1) for k in component_keys},
        "sentiment": scores.get("sentiment", 0),
        "alerts": result.get("alerts", []),
        "trend": result.get("trend", {}),
        "primary_risk": result.get("primary_risk", {}),
        "recommendation": result.get("recommendation", ""),
        "ward_scores": ward_scores,
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


def get_historical_scores(days: int = 7):
    """Compatibility wrapper that returns demo historical records."""
    return generate_mock_historical_scores(days=days)


def get_ward_score(ward_name: str):
    city = calculate_city_risk_score(use_mock_data=True)
    ward_scores = city.get("ward_scores", {})
    if ward_name not in ward_scores:
        return None

    return {
        "ward": ward_name,
        "score": ward_scores[ward_name],
        "overall_crs": city.get("overall_crs", 1),
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

