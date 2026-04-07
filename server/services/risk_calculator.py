import random
import json

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
        
    primary_category = max(scores, key=scores.get)
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

def calculate_risk():
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
    # 1. Import dependencies
    nlp_signals = get_nlp_signals()
    current_price = get_oil_price()

    sentiment = nlp_signals["sentiment"]
    keyword_score = nlp_signals["keyword_score"]

    # 2. Add keyword floor to ensure minimum signal strength
    keyword_score = max(keyword_score, 2)

    # 3. Define baselines
    price_baseline = 70.0
    baseline_risk = 3

    # 4. Compute oil impact
    oil_impact = max(0, (current_price - price_baseline) / price_baseline)

    # 5. Calculate base risk with strengthened sentiment impact
    base_risk = baseline_risk + (-sentiment * 5) + (keyword_score * 1.2)

    # 6. Create category-wise scores
    fuel = base_risk * 1.2 + (oil_impact * 3.5)
    transport = base_risk * 1.1 + (oil_impact * 3)
    food = base_risk * 0.9 + (oil_impact * 2)
    power = base_risk * 0.8 + (oil_impact * 1.5)

    # 7. Apply minimum floor
    fuel = apply_floor(fuel)
    transport = apply_floor(transport)
    food = apply_floor(food)
    power = apply_floor(power)

    # 8. Normalize all scores
    normalized_scores = {
        "fuel": normalize_score(fuel),
        "food": normalize_score(food),
        "transport": normalize_score(transport),
        "power": normalize_score(power)
    }
    
    # 9. Generate intelligence features
    alerts = generate_alerts(normalized_scores)
    trend = predict_trend(normalized_scores)
    primary_risk = get_primary_risk(normalized_scores)
    recommendation = generate_recommendation(primary_risk["category"])

    # Print debug values
    print("--- Debug Values ---")
    print(f"Oil Price: {current_price:.2f}")
    print(f"Oil Impact: {oil_impact:.2f}")
    print(f"Sentiment: {sentiment:.2f}")
    print(f"Keyword Score (after floor): {keyword_score:.2f}")
    print(f"Base Risk: {base_risk:.2f}")
    print("--------------------")

    # 10. Return updated format
    return {
        "scores": normalized_scores,
        "alerts": alerts,
        "trend": trend,
        "primary_risk": primary_risk,
        "recommendation": recommendation
    }

# Add a test block
if __name__ == "__main__":
    print("Calculating CityShield Risk Scores...")
    risk_output = calculate_risk()
    print("\n--- Final Output ---")
    print(json.dumps(risk_output, indent=2))
    print("--------------------")

