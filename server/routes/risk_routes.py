import logging
from datetime import datetime, timezone
from flask import Blueprint, jsonify
from services.risk_calculator import calculate_risk
from services.news_fetcher import fetch_crisis_news
from services.nlp_engine import analyze_batch
from services.oil_tracker import get_oil_prices
from utils.cache import get_cached_risk
from utils.constants import WARD_LIST
import random

logger = logging.getLogger(__name__)

risk_bp = Blueprint("risk", __name__)


def _calculate_live_risk_payload():
    """Build risk output from live upstream sources (no implicit mock fallback)."""
    articles = fetch_crisis_news()
    nlp_result = analyze_batch(articles)
    oil_data = get_oil_prices()
    return calculate_risk(nlp_signals=nlp_result, oil_data=oil_data, use_mock_data=False)


@risk_bp.route("/api/risk/city-score", methods=["GET"])
def get_city_score():
    try:
        result = get_cached_risk(_calculate_live_risk_payload)
        logger.info("API HIT: /api/risk/city-score")

        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        return jsonify(result)
    except Exception as e:
        logger.error("Error in /api/risk/city-score: %s", e)
        return jsonify({"error": str(e)}), 500


@risk_bp.route("/api/risk/ward-scores", methods=["GET"])
def get_ward_scores():
    try:
        result = get_cached_risk(_calculate_live_risk_payload)
        logger.info("API HIT: /api/risk/ward-scores")
        base = result["scores"]

        ward_data = {}

        for ward in WARD_LIST:
            ward_data[ward] = {
                "fuel": max(1, min(10, base["fuel"] + random.choice([-1, 0, 1]))),
                "food": max(1, min(10, base["food"] + random.choice([-1, 0, 1]))),
                "transport": max(1, min(10, base["transport"] + random.choice([-1, 0, 1]))),
                "power": max(1, min(10, base["power"] + random.choice([-1, 0, 1])))
            }

        response = {
            "wards": ward_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "city-base"
        }

        return jsonify(response)
    except Exception as e:
        logger.error("Error in /api/risk/ward-scores: %s", e)
        return jsonify({"error": str(e)}), 500
