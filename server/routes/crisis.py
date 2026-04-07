import logging
from flask import Blueprint, jsonify, request

logger = logging.getLogger(__name__)

crisis_bp = Blueprint("crisis", __name__)


@crisis_bp.route("/api/crisis/score", methods=["GET"])
def get_crisis_score():
    """
    GET /api/crisis/score
    Calculate and return the current City Risk Score.
    """
    try:
        from services.news_fetcher import fetch_crisis_news
        from services.nlp_engine import analyze_batch
        from services.oil_tracker import get_oil_prices
        from services.risk_calculator import calculate_city_risk_score

        articles = fetch_crisis_news()
        nlp_result = analyze_batch(articles)
        oil_data = get_oil_prices()
        crs_result = calculate_city_risk_score(
            nlp_signals=nlp_result,
            oil_data=oil_data,
        )

        return jsonify({
            "success": True,
            "data": crs_result,
        }), 200

    except Exception as exc:
        logger.exception("Error calculating crisis score: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@crisis_bp.route("/api/crisis/score/history", methods=["GET"])
def get_crisis_history():
    """
    GET /api/crisis/score/history?days=7
    Return historical CRS scores for the past N days.
    """
    try:
        days = int(request.args.get("days", 7))
        days = max(1, min(days, 30))  # clamp to 1-30

        from services.risk_calculator import get_historical_scores
        history = get_historical_scores(days=days)

        return jsonify({
            "success": True,
            "data": history,
            "days": days,
        }), 200

    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'days' parameter"}), 400
    except Exception as exc:
        logger.exception("Error fetching crisis history: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@crisis_bp.route("/api/crisis/score/ward/<ward_name>", methods=["GET"])
def get_ward_score(ward_name: str):
    """
    GET /api/crisis/score/ward/<ward_name>
    Return detailed CRS breakdown for a specific ward.
    """
    try:
        from services.risk_calculator import get_ward_score

        result = get_ward_score(ward_name)
        if result is None:
            return jsonify({
                "success": False,
                "error": f"Ward '{ward_name}' not found. Check /api/city/wards for valid ward names.",
            }), 404

        return jsonify({
            "success": True,
            "data": result,
        }), 200

    except Exception as exc:
        logger.exception("Error fetching ward score for %s: %s", ward_name, exc)
        return jsonify({"success": False, "error": str(exc)}), 500
