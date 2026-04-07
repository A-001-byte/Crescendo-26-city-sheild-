import logging
from typing import Any, Dict, Iterable, List, Optional

from werkzeug.security import generate_password_hash

from db.postgres import ensure_schema, execute_write, fetch_all, fetch_one, is_db_enabled

logger = logging.getLogger(__name__)


def _normalize_severity(value: Optional[str]) -> str:
    if not value:
        return "MEDIUM"

    normalized = value.strip().lower()
    if normalized in {"critical", "high"}:
        return "HIGH"
    if normalized in {"moderate", "medium"}:
        return "MEDIUM"
    return "LOW"


def _to_float(value: Any, fallback: Optional[float] = None) -> Optional[float]:
    try:
        if value is None:
            return fallback
        return float(value)
    except (TypeError, ValueError):
        return fallback


def persist_risk_snapshot(
    *,
    city: str,
    ward: Optional[str],
    fuel: float,
    food: float,
    transport: float,
    power: float,
    overall: float,
    oil_price: Optional[float],
    sentiment: Optional[float],
) -> None:
    if not is_db_enabled():
        return

    ensure_schema()

    query = """
        INSERT INTO risk_snapshots
            (city, ward, fuel, food, transport, power, overall, oil_price, sentiment)
        SELECT
            %s, %s, %s, %s, %s, %s, %s, %s, %s
        WHERE NOT EXISTS (
            SELECT 1
            FROM risk_snapshots
            WHERE city = %s
              AND COALESCE(ward, '') = COALESCE(%s, '')
              AND created_at >= NOW() - INTERVAL '2 minutes'
        );
    """

    execute_write(
        query,
        (
            city,
            ward,
            fuel,
            food,
            transport,
            power,
            overall,
            oil_price,
            sentiment,
            city,
            ward,
        ),
    )


def persist_snapshot_bundle(
    *,
    city: str,
    city_payload: Dict[str, Any],
    oil_data: Optional[Dict[str, Any]] = None,
    sentiment: Optional[float] = None,
) -> None:
    if not is_db_enabled():
        return

    scores = city_payload.get("scores", {})
    oil_price = _to_float((oil_data or {}).get("brent_current"), None)
    overall = _to_float(city_payload.get("overall_crs"), 0.0) or 0.0

    fuel = _to_float(scores.get("fuel"), 0.0) or 0.0
    food = _to_float(scores.get("food"), 0.0) or 0.0
    transport = _to_float(scores.get("transport"), 0.0) or 0.0
    power = _to_float(scores.get("power"), 0.0) or 0.0

    persist_risk_snapshot(
        city=city,
        ward=None,
        fuel=fuel,
        food=food,
        transport=transport,
        power=power,
        overall=overall,
        oil_price=oil_price,
        sentiment=sentiment,
    )

    ward_scores = city_payload.get("ward_scores", {})
    if isinstance(ward_scores, dict):
        for ward_name, ward_overall in ward_scores.items():
            ward_val = _to_float(ward_overall, overall)
            if ward_val is None:
                ward_val = overall
            persist_risk_snapshot(
                city=city,
                ward=str(ward_name),
                fuel=fuel,
                food=food,
                transport=transport,
                power=power,
                overall=ward_val,
                oil_price=oil_price,
                sentiment=sentiment,
            )


def persist_events(analyzed_events: Iterable[Dict[str, Any]]) -> None:
    if not is_db_enabled():
        return

    ensure_schema()

    query = """
        INSERT INTO events
            (source, headline, sentiment, severity, services)
        SELECT
            %s, %s, %s, %s, %s
        WHERE NOT EXISTS (
            SELECT 1
            FROM events
            WHERE source = %s
              AND headline = %s
              AND created_at >= NOW() - INTERVAL '30 minutes'
        );
    """

    for event in analyzed_events:
        source = str(event.get("source") or "Unknown")
        headline = str(event.get("title") or "")
        if not headline:
            continue

        sentiment = _to_float(event.get("vader_compound"), 0.0)
        severity = _normalize_severity(event.get("crisis_level"))
        services = event.get("affected_services") or []
        if not isinstance(services, list):
            services = []

        execute_write(
            query,
            (source, headline, sentiment, severity, services, source, headline),
        )


def persist_alert(message: str, severity: str, category: str) -> None:
    if not is_db_enabled():
        return

    ensure_schema()

    query = """
        INSERT INTO alerts (message, severity, category)
        SELECT %s, %s, %s
        WHERE NOT EXISTS (
            SELECT 1
            FROM alerts
            WHERE message = %s
              AND severity = %s
              AND category = %s
              AND created_at >= NOW() - INTERVAL '5 minutes'
        );
    """

    norm_severity = _normalize_severity(severity)
    execute_write(
        query,
        (message, norm_severity, category, message, norm_severity, category),
    )


def create_user(name: str, phone: str, email: str, password: str, is_active: bool = True) -> Dict[str, Any]:
    if not is_db_enabled():
        raise RuntimeError("Database is not configured")

    ensure_schema()

    password_hash = generate_password_hash(password)

    query = """
        INSERT INTO users (name, phone, email, password_hash, is_active)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, name, phone, email, is_active, created_at;
    """

    row = fetch_one(query, (name, phone, email, password_hash, is_active))
    if row is None:
        raise RuntimeError("Failed to create user")

    return row


def fetch_trends(limit: int = 200, city: Optional[str] = None) -> List[Dict[str, Any]]:
    ensure_schema()

    limit = max(1, min(int(limit), 1000))

    if city:
        query = """
            SELECT
                created_at,
                overall,
                oil_price
            FROM risk_snapshots
            WHERE ward IS NULL
              AND city = %s
            ORDER BY created_at DESC
            LIMIT %s;
        """
        rows = fetch_all(query, (city, limit))
    else:
        query = """
            SELECT
                created_at,
                overall,
                oil_price
            FROM risk_snapshots
            WHERE ward IS NULL
            ORDER BY created_at DESC
            LIMIT %s;
        """
        rows = fetch_all(query, (limit,))

    return list(reversed(rows))


def fetch_events(limit: int = 100) -> List[Dict[str, Any]]:
    ensure_schema()

    limit = max(1, min(int(limit), 500))

    query = """
        SELECT
            id,
            source,
            headline,
            sentiment,
            severity,
            services,
            created_at
        FROM events
        ORDER BY created_at DESC
        LIMIT %s;
    """
    return fetch_all(query, (limit,))


def fetch_distribution(limit: int = 200, city: Optional[str] = None) -> List[Dict[str, Any]]:
    ensure_schema()

    limit = max(1, min(int(limit), 1000))

    if city:
        query = """
            SELECT
                created_at,
                AVG(fuel) AS fuel,
                AVG(food) AS food,
                AVG(transport) AS transport,
                AVG(power) AS power,
                AVG(overall) AS overall
            FROM risk_snapshots
            WHERE city = %s
              AND ward IS NULL
            GROUP BY created_at
            ORDER BY created_at DESC
            LIMIT %s;
        """
        rows = fetch_all(query, (city, limit))
    else:
        query = """
            SELECT
                created_at,
                AVG(fuel) AS fuel,
                AVG(food) AS food,
                AVG(transport) AS transport,
                AVG(power) AS power,
                AVG(overall) AS overall
            FROM risk_snapshots
            WHERE ward IS NULL
            GROUP BY created_at
            ORDER BY created_at DESC
            LIMIT %s;
        """
        rows = fetch_all(query, (limit,))

    return list(reversed(rows))


def fetch_alert_volume(hours: int = 168) -> List[Dict[str, Any]]:
    ensure_schema()

    hours = max(1, min(int(hours), 24 * 90))

    query = """
        SELECT
            severity,
            COUNT(*) AS count
        FROM alerts
        WHERE created_at >= NOW() - (%s || ' hours')::INTERVAL
        GROUP BY severity
        ORDER BY count DESC;
    """
    return fetch_all(query, (hours,))
