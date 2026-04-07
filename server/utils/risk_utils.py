def classify_risk(score: int) -> str:
    """
    Classifies risk score (0-10) into LOW, MEDIUM, or HIGH.
    - 0-3  -> LOW
    - 4-7  -> MEDIUM
    - 8-10 -> HIGH
    Returns LOW for invalid or missing inputs and clamps score to 0-10.
    """
    try:
        # Check if the score is a number and not missing/None
        if score is None or isinstance(score, bool):
            return "LOW"
            
        score_val = float(score)
    except (ValueError, TypeError):
        return "LOW"
        
    clamped_score = max(0, min(10, int(score_val)))
    
    if clamped_score <= 3:
        return "LOW"
    elif clamped_score <= 7:
        return "MEDIUM"
    else:
        return "HIGH"
