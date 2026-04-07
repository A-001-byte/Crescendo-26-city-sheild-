import json
import logging
import os
from flask import Blueprint, jsonify

logger = logging.getLogger(__name__)

city_bp = Blueprint("city", __name__)

_WARDS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "pune_wards.json")
_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "service_weights.json")


# ---------------------------------------------------------------------------
# Mock infrastructure data — 25 fuel stations + 12 hospitals in Pune
# ---------------------------------------------------------------------------
FUEL_STATIONS = [
    {"id": "FS001", "name": "HP Petrol Pump - Kothrud",         "ward": "Kothrud",       "lat": 18.5046, "lng": 73.8077, "type": "HPCL", "operational": True},
    {"id": "FS002", "name": "BPCL Filling Station - Hadapsar",  "ward": "Hadapsar",      "lat": 18.4988, "lng": 73.9387, "type": "BPCL", "operational": True},
    {"id": "FS003", "name": "IOC Pump - Shivajinagar",          "ward": "Shivajinagar",  "lat": 18.5308, "lng": 73.8474, "type": "IOC",  "operational": True},
    {"id": "FS004", "name": "HP Fuel Station - Aundh",          "ward": "Aundh",         "lat": 18.5590, "lng": 73.8078, "type": "HPCL", "operational": True},
    {"id": "FS005", "name": "BPCL Pump - Baner",                "ward": "Baner",         "lat": 18.5590, "lng": 73.7850, "type": "BPCL", "operational": True},
    {"id": "FS006", "name": "IOC Station - Hinjewadi",          "ward": "Hinjewadi",     "lat": 18.5904, "lng": 73.7384, "type": "IOC",  "operational": True},
    {"id": "FS007", "name": "HP Pump - Wakad",                  "ward": "Wakad",         "lat": 18.5997, "lng": 73.7601, "type": "HPCL", "operational": True},
    {"id": "FS008", "name": "BPCL Station - Pimpri",            "ward": "Pimpri",        "lat": 18.6209, "lng": 73.8004, "type": "BPCL", "operational": True},
    {"id": "FS009", "name": "IOC Pump - Chinchwad",             "ward": "Chinchwad",     "lat": 18.6280, "lng": 73.7990, "type": "IOC",  "operational": True},
    {"id": "FS010", "name": "HP Station - Kharadi",             "ward": "Kharadi",       "lat": 18.5516, "lng": 73.9464, "type": "HPCL", "operational": True},
    {"id": "FS011", "name": "BPCL Pump - Viman Nagar",          "ward": "Viman Nagar",   "lat": 18.5679, "lng": 73.9143, "type": "BPCL", "operational": True},
    {"id": "FS012", "name": "IOC Station - Koregaon Park",      "ward": "Koregaon Park", "lat": 18.5362, "lng": 73.8938, "type": "IOC",  "operational": True},
    {"id": "FS013", "name": "HP Pump - Swargate",               "ward": "Swargate",      "lat": 18.5023, "lng": 73.8625, "type": "HPCL", "operational": True},
    {"id": "FS014", "name": "BPCL Station - Katraj",            "ward": "Katraj",        "lat": 18.4535, "lng": 73.8640, "type": "BPCL", "operational": True},
    {"id": "FS015", "name": "IOC Pump - Deccan",                "ward": "Deccan",        "lat": 18.5162, "lng": 73.8419, "type": "IOC",  "operational": True},
    {"id": "FS016", "name": "HP Station - Hadapsar South",      "ward": "Hadapsar",      "lat": 18.4921, "lng": 73.9502, "type": "HPCL", "operational": True},
    {"id": "FS017", "name": "BPCL Pump - Kothrud West",         "ward": "Kothrud",       "lat": 18.4983, "lng": 73.7982, "type": "BPCL", "operational": False},
    {"id": "FS018", "name": "IOC Station - Pimpri North",       "ward": "Pimpri",        "lat": 18.6312, "lng": 73.8102, "type": "IOC",  "operational": True},
    {"id": "FS019", "name": "HP Pump - Hinjewadi Phase 2",      "ward": "Hinjewadi",     "lat": 18.5958, "lng": 73.7280, "type": "HPCL", "operational": True},
    {"id": "FS020", "name": "BPCL Station - Baner Road",        "ward": "Baner",         "lat": 18.5615, "lng": 73.7793, "type": "BPCL", "operational": True},
    {"id": "FS021", "name": "IOC Pump - Chinchwad East",        "ward": "Chinchwad",     "lat": 18.6189, "lng": 73.8082, "type": "IOC",  "operational": True},
    {"id": "FS022", "name": "HP Station - Wakad East",          "ward": "Wakad",         "lat": 18.5940, "lng": 73.7700, "type": "HPCL", "operational": True},
    {"id": "FS023", "name": "BPCL Pump - Aundh West",           "ward": "Aundh",         "lat": 18.5660, "lng": 73.7988, "type": "BPCL", "operational": True},
    {"id": "FS024", "name": "IOC Station - Katraj South",       "ward": "Katraj",        "lat": 18.4452, "lng": 73.8710, "type": "IOC",  "operational": True},
    {"id": "FS025", "name": "HP Pump - Kharadi IT Park",        "ward": "Kharadi",       "lat": 18.5560, "lng": 73.9510, "type": "HPCL", "operational": True},
]

HOSPITALS = [
    {"id": "H001", "name": "Ruby Hall Clinic",             "ward": "Shivajinagar",  "lat": 18.5314, "lng": 73.8847, "beds": 500, "level": "tertiary",   "backup_fuel_hours": 72},
    {"id": "H002", "name": "KEM Hospital Pune",            "ward": "Deccan",        "lat": 18.5123, "lng": 73.8460, "beds": 650, "level": "tertiary",   "backup_fuel_hours": 96},
    {"id": "H003", "name": "Jehangir Hospital",            "ward": "Shivajinagar",  "lat": 18.5302, "lng": 73.8836, "beds": 300, "level": "tertiary",   "backup_fuel_hours": 48},
    {"id": "H004", "name": "Deenanath Mangeshkar Hospital","ward": "Kothrud",       "lat": 18.5077, "lng": 73.8168, "beds": 450, "level": "tertiary",   "backup_fuel_hours": 72},
    {"id": "H005", "name": "Aundh District Hospital",      "ward": "Aundh",         "lat": 18.5620, "lng": 73.8120, "beds": 350, "level": "secondary",  "backup_fuel_hours": 60},
    {"id": "H006", "name": "PCMC Central Hospital",        "ward": "Pimpri",        "lat": 18.6179, "lng": 73.8009, "beds": 500, "level": "secondary",  "backup_fuel_hours": 72},
    {"id": "H007", "name": "Sahyadri Hospital Hadapsar",   "ward": "Hadapsar",      "lat": 18.5021, "lng": 73.9282, "beds": 280, "level": "secondary",  "backup_fuel_hours": 48},
    {"id": "H008", "name": "Inamdar Multispeciality Hospital","ward":"Fatima Nagar", "lat": 18.5160, "lng": 73.9090, "beds": 200, "level": "secondary",  "backup_fuel_hours": 36},
    {"id": "H009", "name": "Medipoint Hospital Aundh",     "ward": "Aundh",         "lat": 18.5642, "lng": 73.8044, "beds": 150, "level": "secondary",  "backup_fuel_hours": 48},
    {"id": "H010", "name": "Columbia Asia Kharadi",        "ward": "Kharadi",       "lat": 18.5487, "lng": 73.9417, "beds": 200, "level": "secondary",  "backup_fuel_hours": 54},
    {"id": "H011", "name": "Lotus Hospital Katraj",        "ward": "Katraj",        "lat": 18.4590, "lng": 73.8671, "beds": 120, "level": "primary",    "backup_fuel_hours": 24},
    {"id": "H012", "name": "Hinjewadi Emergency Clinic",   "ward": "Hinjewadi",     "lat": 18.5922, "lng": 73.7403, "beds": 80,  "level": "primary",    "backup_fuel_hours": 18},
]


@city_bp.route("/api/city/wards", methods=["GET"])
def get_wards():
    """
    GET /api/city/wards
    Return all ward data with current risk scores.
    """
    try:
        with open(_WARDS_PATH, "r", encoding="utf-8") as f:
            wards = json.load(f)

        # Optionally enrich with live ward scores
        try:
            from services.risk_calculator import calculate_city_risk_score, get_ward_score
            from services.news_fetcher import fetch_crisis_news
            from services.nlp_engine import analyze_batch
            from services.oil_tracker import get_oil_prices

            articles = fetch_crisis_news()
            nlp_result = analyze_batch(articles)
            oil_data = get_oil_prices()
            crs = calculate_city_risk_score(nlp_signals=nlp_result, oil_data=oil_data)
            live_ward_scores = crs.get("ward_scores", {})
        except Exception:
            live_ward_scores = {}

        enriched = []
        for ward in wards:
            ward_copy = dict(ward)
            live_score = live_ward_scores.get(ward["name"])
            if live_score is not None:
                ward_copy["live_risk_score"] = live_score
            enriched.append(ward_copy)

        return jsonify({
            "success": True,
            "data": enriched,
            "count": len(enriched),
        }), 200

    except FileNotFoundError:
        return jsonify({"success": False, "error": "Ward data file not found"}), 500
    except Exception as exc:
        logger.exception("Error fetching wards: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@city_bp.route("/api/city/infrastructure", methods=["GET"])
def get_infrastructure():
    """
    GET /api/city/infrastructure
    Return fuel stations and hospitals with locations.
    """
    try:
        fuel_operational = sum(1 for s in FUEL_STATIONS if s["operational"])
        hosp_total = len(HOSPITALS)
        total_beds = sum(h["beds"] for h in HOSPITALS)

        return jsonify({
            "success": True,
            "data": {
                "fuel_stations": FUEL_STATIONS,
                "hospitals": HOSPITALS,
                "summary": {
                    "total_fuel_stations": len(FUEL_STATIONS),
                    "operational_fuel_stations": fuel_operational,
                    "offline_fuel_stations": len(FUEL_STATIONS) - fuel_operational,
                    "total_hospitals": hosp_total,
                    "total_hospital_beds": total_beds,
                    "hospitals_by_level": {
                        "tertiary": sum(1 for h in HOSPITALS if h["level"] == "tertiary"),
                        "secondary": sum(1 for h in HOSPITALS if h["level"] == "secondary"),
                        "primary": sum(1 for h in HOSPITALS if h["level"] == "primary"),
                    },
                },
            },
        }), 200

    except Exception as exc:
        logger.exception("Error fetching infrastructure: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@city_bp.route("/api/city/config", methods=["GET"])
def get_city_config():
    """
    GET /api/city/config
    Return city configuration and system parameters.
    """
    try:
        with open(_WEIGHTS_PATH, "r", encoding="utf-8") as f:
            weights = json.load(f)
    except Exception:
        weights = {"fuel": 0.35, "power": 0.25, "food": 0.25, "logistics": 0.15}

    config_data = {
        "city": "Pune",
        "state": "Maharashtra",
        "country": "India",
        "country_code": "IN",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "population": 3700000,
        "ward_count": 15,
        "service_weights": weights,
        "alert_thresholds": {
            "green": {"min": 0, "max": 3.99},
            "yellow": {"min": 4.0, "max": 5.99},
            "orange": {"min": 6.0, "max": 7.99},
            "red": {"min": 8.0, "max": 10.0},
        },
        "trigger_thresholds": {
            "Normal": {"min": 0, "max": 4.99},
            "T-48": {"min": 5.0, "max": 6.99},
            "T-24": {"min": 7.0, "max": 8.99},
            "T-0": {"min": 9.0, "max": 10.0},
        },
        "refresh_interval_minutes": 15,
        "data_sources": ["NewsAPI", "GDELT", "Alpha Vantage", "Manual"],
        "version": "1.0.0",
    }

    return jsonify({
        "success": True,
        "data": config_data,
    }), 200
