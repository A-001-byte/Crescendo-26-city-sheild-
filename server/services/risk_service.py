from utils.risk_utils import classify_risk

def compute_overall(scores_dict: dict) -> dict:
    """Computes the overall average risk score, ignoring non-score metrics."""
    score_sum = 0
    count = 0
    for key, value in scores_dict.items():
        if key != "sentiment" and isinstance(value, (int, float)):
            score_sum += value
            count += 1
            
    if count == 0:
        return {"score": 0, "level": "LOW"}
        
    avg_score = round(score_sum / count)
    return {
        "score": avg_score,
        "level": classify_risk(avg_score)
    }

def transform_scores(scores: dict) -> dict:
    """Transforms raw scores into classified format, ignoring non-score fields like 'sentiment', and adds an overall aggregated risk."""
    transformed = {}
    for key, value in scores.items():
        if key == "sentiment":
            transformed[key] = value
            continue
            
        transformed[key] = {
            "score": value,
            "level": classify_risk(value)
        }
        
    # Append the aggregated overall risk
    transformed["overall"] = compute_overall(scores)
    
    return transformed

def transform_city_response(engine_output: dict) -> dict:
    """Applies classification transformation to city-level risk response."""
    if "scores" in engine_output:
        engine_output["scores"] = transform_scores(engine_output["scores"])
    return engine_output

def transform_ward_response(ward_data: dict) -> dict:
    """Applies classification transformation to each ward's data."""
    transformed_wards = {}
    for ward, metrics in ward_data.items():
        transformed_wards[ward] = transform_scores(metrics)
    return transformed_wards
