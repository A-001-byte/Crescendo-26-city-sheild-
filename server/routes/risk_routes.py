# pyright: reportMissingImports=false, reportAttributeAccessIssue=false
# pylint: disable=import-error
import logging
import os
import sys
import importlib
import eventlet
from datetime import datetime, timezone
from flask import Blueprint, jsonify

_server_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

_services_dir = os.path.join(_server_dir, "services")
if _services_dir not in sys.path:
    sys.path.insert(0, _services_dir)

from utils.cache import get_cached_risk
from utils.constants import WARD_LIST

logger = logging.getLogger(__name__)

risk_bp = Blueprint("risk", __name__)


def _persist_analytics_async(config_module, analytics_store, city_payload, nlp_signals, nlp_result, oil_data):
    try:
        analytics_store.persist_snapshot_bundle(
            city=config_module.config.CITY,
            city_payload=city_payload,
            oil_data=oil_data,
            sentiment=nlp_signals["sentiment"],
        )
        analytics_store.persist_events(nlp_result.get("all_analyses", []))
    except Exception as exc:
        logger.warning("Failed to persist analytics payload in risk route: %s", exc)


def _calculate_live_risk_payload():
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
    risk_payload = risk_calculator.calculate_risk(
        nlp_signals=nlp_signals,
        oil_data=oil_data,
        use_mock_data=False,
    )
    city_payload = risk_calculator.calculate_city_risk_score(
        nlp_signals=nlp_signals,
        oil_data=oil_data,
        use_mock_data=False,
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

    return risk_payload


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
                "fuel": base["fuel"],
                "food": base["food"],
                "transport": base["transport"],
                "power": base["power"],
            }

        response = {
            "scores": ward_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "ward"
        }

        return jsonify(response)
    except Exception as e:
        logger.error("Error in /api/risk/ward-scores: %s", e)
        return jsonify({"error": str(e)}), 500
