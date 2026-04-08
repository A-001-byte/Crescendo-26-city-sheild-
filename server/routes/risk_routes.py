# pyright: reportMissingImports=false, reportAttributeAccessIssue=false
# pylint: disable=import-error
import logging
import os
import sys
import importlib
import eventlet
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request

_server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

_services_dir = os.path.join(_server_dir, "services")
if _services_dir not in sys.path:
    sys.path.insert(0, _services_dir)

from utils.cache import get_cached_risk

logger = logging.getLogger(__name__)

risk_bp = Blueprint("risk", __name__)


def _persist_analytics_async(config_module, analytics_store, city_payload, nlp_signals, nlp_result, oil_data):
    try:
        city_name = city_payload.get("city") or config_module.config.CITY
        analytics_store.persist_snapshot_bundle(
            city=city_name,
            city_payload=city_payload,
            oil_data=oil_data,
            sentiment=nlp_signals["sentiment"],
        )
        analytics_store.persist_events(nlp_result.get("all_analyses", []))
    except Exception as exc:
        logger.warning("Failed to persist analytics payload in risk route: %s", exc)


def _calculate_live_risk_payload(city: str, include_wards: bool = False):
    """Build risk output from live upstream sources (no implicit mock fallback)."""
    risk_calculator = importlib.import_module("risk_calculator")
    news_fetcher = importlib.import_module("news_fetcher")
    nlp_engine = importlib.import_module("nlp_engine")
    oil_tracker = importlib.import_module("oil_tracker")
    analytics_store = importlib.import_module("analytics_store")
    config_module = importlib.import_module("config")

    articles = news_fetcher.fetch_crisis_news()
    nlp_result = nlp_engine.analyze_batch_detailed(articles)
    nlp_signals = {
        "sentiment": nlp_result["sentiment"],
        "keyword_score": nlp_result["keyword_score"],
    }
    oil_data = oil_tracker.get_oil_prices()
    city_payload = risk_calculator.calculate_city_risk_score(
        nlp_signals=nlp_signals,
        oil_data=oil_data,
        use_mock_data=False,
        include_wards=include_wards,
        city=city,
    )

    # Best-effort non-blocking persistence for analytics tab data.
    try:
        eventlet.spawn_n(
            _persist_analytics_async,
            config_module,
            analytics_store,
            city_payload,
            nlp_signals,
            nlp_result,
            oil_data,
        )
    except Exception as exc:
        logger.warning("Failed to schedule analytics persistence in risk route: %s", exc)

    return city_payload


@risk_bp.route("/api/risk/city-score", methods=["GET"])
def get_city_score():
    try:
        from config import config as _config
        city = request.args.get("city") or _config.CITY
        city_key = str(city).strip().lower()
        result = get_cached_risk(lambda: _calculate_live_risk_payload(city_key), cache_key=f"city-score:{city_key}")
        logger.info("API HIT: /api/risk/city-score")

        result["timestamp"] = datetime.now(timezone.utc).isoformat()
        result["city"] = city_key
        return jsonify(result)
    except Exception as e:
        logger.error("Error in /api/risk/city-score: %s", e)
        return jsonify({"error": str(e)}), 500


@risk_bp.route("/api/risk/ward-scores", methods=["GET"])
def get_ward_scores():
    try:
        from config import config as _config
        city = request.args.get("city") or _config.CITY
        city_key = str(city).strip().lower()
        result = get_cached_risk(
            lambda: _calculate_live_risk_payload(city_key, include_wards=True),
            cache_key=f"ward-scores:{city_key}",
        )
        logger.info("API HIT: /api/risk/ward-scores")
        base = result.get("scores", {})
        ward_service_scores = result.get("ward_service_scores")
        ward_data = {}

        if isinstance(ward_service_scores, dict) and ward_service_scores:
            for ward_name, services in ward_service_scores.items():
                ward_data[ward_name] = {
                    "fuel": float(services.get("fuel", base.get("fuel", 1))),
                    "food": float(services.get("food", base.get("food", 1))),
                    "transport": float(services.get("transport", base.get("transport", 1))),
                    "power": float(services.get("power", base.get("power", 1))),
                }
        else:
            ward_names = list((result.get("ward_scores") or {}).keys())
            if not ward_names:
                ward_names = ["All Wards"]

            for ward_name in ward_names:
                ward_data[ward_name] = {
                    "fuel": float(base.get("fuel", 1)),
                    "food": float(base.get("food", 1)),
                    "transport": float(base.get("transport", 1)),
                    "power": float(base.get("power", 1)),
                }

        response = {
            "scores": ward_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "ward",
            "city": city_key,
        }

        return jsonify(response)
    except Exception as e:
        logger.error("Error in /api/risk/ward-scores: %s", e)
        return jsonify({"error": str(e)}), 500


@risk_bp.route("/api/risk/city-score/history", methods=["GET"])
def get_city_score_history():
    try:
        risk_calculator = importlib.import_module("risk_calculator")
        from config import config as _config

        city = request.args.get("city") or _config.CITY
        city_key = str(city).strip().lower()
        hours = int(request.args.get("hours", 24))
        hours = max(1, min(hours, 48))

        history = risk_calculator.get_last_24h_scores(city_key, hours=hours)

        return jsonify({
            "success": True,
            "data": history,
            "city": city_key,
            "hours": hours,
        }), 200

    except ValueError:
        return jsonify({"success": False, "error": "Invalid 'hours' parameter"}), 400
    except Exception as exc:
        logger.exception("Error fetching city score history: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
