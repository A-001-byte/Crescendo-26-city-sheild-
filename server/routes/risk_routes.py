from flask import Blueprint, jsonify
from services.risk_calculator import calculate_risk
from services.risk_service import transform_city_response, transform_ward_response
import random

risk_bp = Blueprint("risk", __name__)

@risk_bp.route("/api/risk/city-score", methods=["GET"])
def get_city_score():
    try:
        result = calculate_risk()
        print("API HIT: /city-score")
        
        transformed_result = transform_city_response(result)
        
        print(transformed_result)
        return jsonify(transformed_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@risk_bp.route("/api/risk/ward-scores", methods=["GET"])
def get_ward_scores():
    try:
        result = calculate_risk()
        print("API HIT: /ward-scores")
        base = result["scores"]

        wards = ["Baner", "Hinjewadi", "Kothrud", "Shivajinagar"]
        
        ward_data = {}
        
        for ward in wards:
            ward_data[ward] = {
                "fuel": max(1, min(10, base["fuel"] + random.choice([-1, 0, 1]))),
                "food": max(1, min(10, base["food"] + random.choice([-1, 0, 1]))),
                "transport": max(1, min(10, base["transport"] + random.choice([-1, 0, 1]))),
                "power": max(1, min(10, base["power"] + random.choice([-1, 0, 1]))),
                "sentiment": base["sentiment"]
            }

        transformed_ward_data = transform_ward_response(ward_data)

        return jsonify(transformed_ward_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
