import os
import logging
import requests

logger = logging.getLogger(__name__)

# Set FAST2SMS_API_KEY in your environment or .env file — never hardcode credentials.
_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
# Comma-separated recipient numbers (no country code prefix), e.g. "9876543210,9123456789"
_TEAM_NUMBERS = os.getenv("CRISIS_ALERT_NUMBERS", "")

_SMS_URL = "https://www.fast2sms.com/dev/bulkV2"


def send_crisis_alert(zone: str, service: str, score: int) -> dict:
    """
    Send an SMS crisis alert via Fast2SMS.

    Requires env vars:
        FAST2SMS_API_KEY      — Fast2SMS authorization key
        CRISIS_ALERT_NUMBERS  — comma-separated recipient numbers (no +91)

    Returns the parsed JSON response from the API, or an error dict on failure.
    """
    if not _API_KEY:
        logger.error("FAST2SMS_API_KEY is not set — cannot send SMS")
        return {"return": False, "error": "API key not configured"}

    if not _TEAM_NUMBERS:
        logger.error("CRISIS_ALERT_NUMBERS is not set — no recipients configured")
        return {"return": False, "error": "No recipients configured"}

    message = (
        f"CityShield Alert! {zone} zone - {service} risk is HIGH "
        f"(Score: {score}/10). Take precautions immediately."
    )

    payload = {
        "route": "q",
        "message": message,
        "language": "english",
        "flash": 0,
        "numbers": _TEAM_NUMBERS,
    }
    headers = {"authorization": _API_KEY}

    try:
        response = requests.post(_SMS_URL, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        result = response.json()
    except requests.exceptions.RequestException as exc:
        logger.error("SMS request failed: %s", exc)
        return {"return": False, "error": str(exc)}
    except ValueError as exc:
        logger.error("SMS response parse error: %s", exc)
        return {"return": False, "error": "Invalid JSON response"}

    if result.get("return") is True:
        logger.info("SMS sent successfully to %s — zone=%s service=%s score=%d",
                    _TEAM_NUMBERS, zone, service, score)
    else:
        logger.warning("SMS send failed: %s", result)

    return result
