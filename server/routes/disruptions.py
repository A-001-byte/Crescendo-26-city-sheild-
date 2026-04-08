import logging
from flask import Blueprint, jsonify, request

logger = logging.getLogger(__name__)

disruptions_bp = Blueprint("disruptions", __name__)


@disruptions_bp.route("/api/disruptions/weather", methods=["GET"])
def get_weather_disruption():
    try:
        from services.weather_disruption import get_weather_disruption
        from config import config as _config

        city = request.args.get("city") or _config.CITY
        data = get_weather_disruption(city)

        return jsonify({
            "success": True,
            "data": data,
        }), 200

    except Exception as exc:
        logger.exception("Error fetching weather disruption: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
