import logging
from flask import Blueprint, jsonify, request

logger = logging.getLogger(__name__)

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alerts", methods=["GET"])
def get_alerts():
    """
    GET /api/alerts?severity=all
    Return alert history, optionally filtered by severity.
    """
    try:
        severity = request.args.get("severity", "all")

        from services.alert_dispatcher import get_alert_history

        history = get_alert_history(severity_filter=severity)

        return jsonify({
            "success": True,
            "data": history,
            "count": len(history),
            "filter": severity,
        }), 200

    except Exception as exc:
        logger.exception("Error fetching alert history: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@alerts_bp.route("/api/alerts/dispatch", methods=["POST"])
def dispatch_alert():
    """
    POST /api/alerts/dispatch
    Body: { ward, message, severity, channels }
    Dispatch an alert to a ward.
    """
    try:
        body = request.get_json(silent=True) or {}

        ward = body.get("ward")
        message = body.get("message")
        severity = body.get("severity", "moderate")
        channels = body.get("channels", ["sms", "app"])

        if not ward:
            return jsonify({"success": False, "error": "Missing required field: 'ward'"}), 400
        if not message:
            return jsonify({"success": False, "error": "Missing required field: 'message'"}), 400

        valid_severities = {"low", "moderate", "high", "critical"}
        if severity not in valid_severities:
            return jsonify({
                "success": False,
                "error": f"Invalid severity. Must be one of: {sorted(valid_severities)}",
            }), 400

        valid_channels = {"sms", "app", "email", "public_address", "radio", "tv"}
        invalid_channels = [c for c in channels if c not in valid_channels]
        if invalid_channels:
            return jsonify({
                "success": False,
                "error": f"Invalid channels: {invalid_channels}. Valid: {sorted(valid_channels)}",
            }), 400

        from services.alert_dispatcher import dispatch_alert as do_dispatch

        result = do_dispatch(ward=ward, message=message, severity=severity, channels=channels)

        return jsonify({
            "success": True,
            "data": result,
        }), 201

    except Exception as exc:
        logger.exception("Error dispatching alert: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@alerts_bp.route("/api/alerts/templates", methods=["GET"])
def get_templates():
    """
    GET /api/alerts/templates
    Return alert message templates organized by trigger level.
    """
    try:
        from services.alert_dispatcher import get_alert_templates

        templates = get_alert_templates()

        return jsonify({
            "success": True,
            "data": templates,
        }), 200

    except Exception as exc:
        logger.exception("Error fetching alert templates: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
