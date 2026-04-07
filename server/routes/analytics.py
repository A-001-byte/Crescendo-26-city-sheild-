import logging
from flask import Blueprint, jsonify, request

from db.postgres import is_db_enabled
from services.analytics_store import (
    fetch_alert_volume,
    fetch_distribution,
    fetch_events,
    fetch_trends,
)

logger = logging.getLogger(__name__)

analytics_bp = Blueprint("analytics", __name__)


def _db_disabled_response():
    return jsonify({
        "success": False,
        "error": "Database is not configured. Set NEON_DATABASE_URL.",
    }), 503


@analytics_bp.route("/api/analytics/trends", methods=["GET"])
def get_analytics_trends():
    if not is_db_enabled():
        return _db_disabled_response()

    try:
        limit = int(request.args.get("limit", 200))
        city = request.args.get("city")

        rows = fetch_trends(limit=limit, city=city)
        return jsonify({"success": True, "data": rows}), 200
    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'limit' parameter"}), 400
    except Exception as exc:
        logger.exception("Error in /api/analytics/trends: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@analytics_bp.route("/api/analytics/events", methods=["GET"])
def get_analytics_events():
    if not is_db_enabled():
        return _db_disabled_response()

    try:
        limit = int(request.args.get("limit", 100))

        rows = fetch_events(limit=limit)
        return jsonify({"success": True, "data": rows}), 200
    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'limit' parameter"}), 400
    except Exception as exc:
        logger.exception("Error in /api/analytics/events: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@analytics_bp.route("/api/analytics/distribution", methods=["GET"])
def get_analytics_distribution():
    if not is_db_enabled():
        return _db_disabled_response()

    try:
        limit = int(request.args.get("limit", 200))
        city = request.args.get("city")

        rows = fetch_distribution(limit=limit, city=city)
        return jsonify({"success": True, "data": rows}), 200
    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'limit' parameter"}), 400
    except Exception as exc:
        logger.exception("Error in /api/analytics/distribution: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@analytics_bp.route("/api/analytics/alerts", methods=["GET"])
def get_analytics_alerts():
    if not is_db_enabled():
        return _db_disabled_response()

    try:
        hours = int(request.args.get("hours", 168))

        rows = fetch_alert_volume(hours=hours)
        total = sum(int(r.get("count", 0)) for r in rows)

        return jsonify({
            "success": True,
            "data": rows,
            "total": total,
        }), 200
    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'hours' parameter"}), 400
    except Exception as exc:
        logger.exception("Error in /api/analytics/alerts: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
