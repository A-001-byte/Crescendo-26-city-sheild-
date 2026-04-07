import logging
from flask import Blueprint, jsonify, request

logger = logging.getLogger(__name__)

events_bp = Blueprint("events", __name__)


@events_bp.route("/api/events/latest", methods=["GET"])
def get_latest_events():
    """
    GET /api/events/latest?limit=20
    Fetch and NLP-analyze the latest crisis news articles.
    """
    try:
        limit = int(request.args.get("limit", 20))
        limit = max(1, min(limit, 50))

        from services.news_fetcher import fetch_crisis_news
        from services.nlp_engine import analyze_batch_detailed

        articles = fetch_crisis_news()
        result = analyze_batch_detailed(articles[:limit])

        return jsonify({
            "success": True,
            "data": {
                "articles": result["all_analyses"][:limit],
                "total": result["total_articles"],
                "avg_severity": result["avg_severity"],
                "timestamp": result["timestamp"],
            },
        }), 200

    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'limit' parameter"}), 400
    except Exception as exc:
        logger.exception("Error fetching latest events: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@events_bp.route("/api/events/oil", methods=["GET"])
def get_oil_data():
    """
    GET /api/events/oil
    Return current oil price data and supply impact metrics.
    """
    try:
        from services.oil_tracker import get_oil_prices

        oil_data = get_oil_prices()

        return jsonify({
            "success": True,
            "data": oil_data,
        }), 200

    except Exception as exc:
        logger.exception("Error fetching oil data: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@events_bp.route("/api/events/signals", methods=["GET"])
def get_service_signals():
    """
    GET /api/events/signals
    Return aggregated NLP service signals from current news batch.
    """
    try:
        from services.news_fetcher import fetch_crisis_news
        from services.nlp_engine import analyze_batch_detailed

        articles = fetch_crisis_news()
        result = analyze_batch_detailed(articles)

        return jsonify({
            "success": True,
            "data": {
                "service_signals": result["service_signals"],
                "critical_events": result["critical_events"],
                "high_events": result["high_events"],
                "total_articles": result["total_articles"],
                "avg_severity": result["avg_severity"],
                "timestamp": result["timestamp"],
            },
        }), 200

    except Exception as exc:
        logger.exception("Error fetching service signals: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@events_bp.route("/api/events/gdelt", methods=["GET"])
def get_gdelt_events():
    """
    GET /api/events/gdelt?theme=CRISIS&country=IN
    Return GDELT event data.
    """
    try:
        theme = request.args.get("theme", "CRISIS")
        country = request.args.get("country", "IN")

        from services.news_fetcher import fetch_gdelt_events

        events = fetch_gdelt_events(theme=theme, country=country)

        return jsonify({
            "success": True,
            "data": events,
            "count": len(events),
        }), 200

    except Exception as exc:
        logger.exception("Error fetching GDELT events: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
