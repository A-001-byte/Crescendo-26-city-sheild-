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

def calculate_risk():
    """
    Calculates the city risk score by combining NLP signals and oil price data.

    The calculation process is as follows:
    1.  Fetches NLP sentiment and keyword scores.
    2.  Fetches the current oil price.
    3.  Computes an 'oil_impact' factor based on deviation from a baseline price.
    4.  Calculates a 'base_risk' from the NLP signals with adjusted weights.
    5.  Combines base_risk and oil_impact to generate category-specific scores
        (fuel, transport, food, power) with reduced impact strength.
    6.  Normalizes all final scores to an integer range of 1-10.
    7.  Returns a dictionary of the calculated category scores.
    """
    # 1. Import dependencies (or in this case, get data from mock functions)
    nlp_signals = get_nlp_signals()
    current_price = get_oil_price()

    sentiment = nlp_signals["sentiment"]
    keyword_score = nlp_signals["keyword_score"]

    # 2. Define baseline
    baseline_price = 70.0

    # 3. Compute oil impact
    oil_impact = (current_price - baseline_price) / baseline_price

    # 4. Adjust base risk formula
    base_risk = (-sentiment * 3) + (keyword_score * 0.7)

    # 5. Create category-wise scores with reduced oil impact strength
    fuel = base_risk + (oil_impact * 2)
    transport = base_risk + (oil_impact * 1.5)
    food = base_risk + (oil_impact * 1)
    power = base_risk + (oil_impact * 1)

    # 6. Normalize all scores to range 1–10
    normalized_scores = {
        "fuel": normalize_score(fuel),
        "food": normalize_score(food),
        "transport": normalize_score(transport),
        "power": normalize_score(power)
    }
    
    # 7. Print debug values
    print("--- Debug Values ---")
    print(f"Oil Price: {current_price:.2f}")
    print(f"Oil Impact: {oil_impact:.2f}")
    print(f"Sentiment: {sentiment:.2f}")
    print(f"Keyword Score: {keyword_score:.2f}")
    print(f"Base Risk: {base_risk:.2f}")
    print("--------------------")


    # 8. Return output
    return normalized_scores

# 9. Add a test block
if __name__ == "__main__":
    print("Calculating CityShield Risk Scores...")
    risk_scores = calculate_risk()
    print("\n--- Final Scores ---")
    print(json.dumps(risk_scores, indent=2))
    print("--------------------")

