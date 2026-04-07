# pyright: reportMissingImports=false, reportAttributeAccessIssue=false
import logging
import sys
import os

# Ensure server/ directory is on sys.path so imports resolve correctly
# when running `python app.py` from the server/ directory.
_server_dir = os.path.dirname(os.path.abspath(__file__))
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SocketIO instance (created before the app so blueprints can import it)
# ---------------------------------------------------------------------------
socketio = SocketIO()


def create_app() -> Flask:
    """Application factory."""
    app = Flask(__name__)

    # Load config
    from config import config
    app.config["SECRET_KEY"] = config.SECRET_KEY
    app.config["DEBUG"] = config.DEBUG

    # CORS
    CORS(app)

    @app.before_request
    def log_api_hit():
        if request.path.startswith("/api"):
            print("API HIT")

    # SocketIO
    socketio.init_app(
        app,
        cors_allowed_origins="*",
        async_mode="eventlet",
        logger=False,
        engineio_logger=False,
    )

    # ------------------------------------------------------------------
    # Register blueprints
    # ------------------------------------------------------------------
    from routes.crisis import crisis_bp
    from routes.events import events_bp
    from routes.alerts import alerts_bp
    from routes.city import city_bp
    from routes.risk_routes import risk_bp
    from routes.auth import auth_bp

    app.register_blueprint(crisis_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(city_bp)
    app.register_blueprint(risk_bp)
    app.register_blueprint(auth_bp)

    # ------------------------------------------------------------------
    # Root health-check
    # ------------------------------------------------------------------
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "service": "CityShield API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/api/city/config",
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    # ------------------------------------------------------------------
    # Error handlers
    # ------------------------------------------------------------------
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found", "message": str(e)}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed", "message": str(e)}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

    # ------------------------------------------------------------------
    # SocketIO events
    # ------------------------------------------------------------------
    @socketio.on("connect")
    def handle_connect():
        logger.info("Client connected: %s", getattr(socketio, 'transport', 'unknown'))
        try:
            snapshot = _build_snapshot()
            emit("initial_data", snapshot)
        except Exception as exc:
            logger.warning("Could not send initial data on connect: %s", exc)

    @socketio.on("disconnect")
    def handle_disconnect():
        logger.info("Client disconnected")

    @socketio.on("request_update")
    def handle_update_request():
        """Client explicitly requests a fresh data push."""
        try:
            snapshot = _build_snapshot()
            emit("update", snapshot)
        except Exception as exc:
            logger.warning("Error handling request_update: %s", exc)
            emit("error", {"message": "Failed to fetch update"})

    @socketio.on("subscribe_ward")
    def handle_ward_subscribe(data):
        """Client subscribes to updates for a specific ward."""
        ward = data.get("ward", "") if isinstance(data, dict) else ""
        try:
            from services.risk_calculator import get_ward_score
            result = get_ward_score(ward)
            if result:
                emit("ward_update", {"ward": ward, "data": result})
            else:
                emit("error", {"message": f"Ward '{ward}' not found"})
        except Exception as exc:
            logger.warning("Error in subscribe_ward for %s: %s", ward, exc)

    # ------------------------------------------------------------------
    # APScheduler — refresh every 15 minutes
    # ------------------------------------------------------------------
    _start_scheduler(app)

    return app


def _build_snapshot() -> dict:
    """Collect current CRS, oil, and signal data for a WebSocket push."""
    from services import news_fetcher, nlp_engine, oil_tracker, risk_calculator

    articles = news_fetcher.fetch_crisis_news()
    nlp_detailed = nlp_engine.analyze_batch_detailed(articles)
    nlp_result = {
        "sentiment": nlp_detailed["sentiment"],
        "keyword_score": nlp_detailed["keyword_score"],
    }
    oil_data = oil_tracker.get_oil_prices()
    crs_result = risk_calculator.calculate_city_risk_score(
        nlp_signals=nlp_result,
        oil_data=oil_data,
    )

    return {
        "crs": crs_result,
        "oil": oil_data,
        "signals": {
            "service_signals": nlp_detailed["service_signals"],
            "critical_events": nlp_detailed["critical_events"],
            "avg_severity": nlp_detailed["avg_severity"],
            "timestamp": nlp_detailed["timestamp"],
        },
    }


def broadcast_update() -> None:
    """
    Scheduled job: fetch fresh data and broadcast to all connected clients.
    Called by APScheduler every 15 minutes.
    """
    try:
        logger.info("Scheduled broadcast: fetching fresh data...")

        # Invalidate caches to force fresh fetch
        from services import news_fetcher, oil_tracker

        news_fetcher.invalidate_news_cache()
        oil_tracker.invalidate_oil_cache()

        snapshot = _build_snapshot()
        socketio.emit("update", snapshot)
        logger.info(
            "Broadcast complete. CRS=%.2f, alert=%s",
            snapshot["crs"]["overall_crs"],
            snapshot["crs"]["alert_level"],
        )
    except Exception as exc:
        logger.error("Scheduled broadcast failed: %s", exc)


def _start_scheduler(app: Flask) -> None:
    """Start the APScheduler background scheduler."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from config import config

        scheduler = BackgroundScheduler(daemon=True)
        scheduler.add_job(
            broadcast_update,
            "interval",
            minutes=config.REFRESH_INTERVAL_MINUTES,
            id="broadcast_update",
            replace_existing=True,
        )
        scheduler.start()
        logger.info(
            "Scheduler started — broadcasting every %d minutes",
            config.REFRESH_INTERVAL_MINUTES,
        )
    except Exception as exc:
        logger.warning("Could not start scheduler: %s", exc)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
app = create_app()

if __name__ == "__main__":
    from config import config

    logger.info("Starting CityShield server on port 5000 (debug=%s)", config.DEBUG)
    socketio.run(
        app,
        debug=config.DEBUG,
        host="0.0.0.0",
        port=5000,
        use_reloader=False,  # disable reloader to avoid double-scheduler
    )
