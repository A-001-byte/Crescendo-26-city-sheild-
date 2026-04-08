import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import requests

from config import config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory cache
# ---------------------------------------------------------------------------
_city_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 600


CITY_MODIFIERS: Dict[str, Dict[str, float]] = {
    "mumbai": {
        "fuel": 1.1,
        "food": 1.05,
        "power": 1.05,
        "transport": 1.15,
    },
    "pune": {
        "fuel": 1.0,
        "food": 1.0,
        "power": 1.0,
        "transport": 1.0,
    },
    "delhi": {
        "fuel": 1.05,
        "food": 1.05,
        "power": 1.1,
        "transport": 1.1,
    },
}


SIMULATED_BASELINES: Dict[str, Dict[str, float]] = {
    "mumbai": {
        "fuel_supply_index": 0.28,
        "food_supply_index": 0.22,
        "power_status": 0.24,
        "logistics_status": 0.38,
    },
    "pune": {
        "fuel_supply_index": 0.2,
        "food_supply_index": 0.2,
        "power_status": 0.2,
        "logistics_status": 0.25,
    },
    "delhi": {
        "fuel_supply_index": 0.24,
        "food_supply_index": 0.26,
        "power_status": 0.3,
        "logistics_status": 0.28,
    },
}


def _normalize_city(city: Optional[str]) -> str:
    return (city or "").strip().lower()


def _iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clamp(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    return max(min_val, min(max_val, value))


def get_city_modifiers(city: Optional[str]) -> Dict[str, float]:
    key = _normalize_city(city)
    return CITY_MODIFIERS.get(key, {
        "fuel": 1.0,
        "food": 1.0,
        "power": 1.0,
        "transport": 1.0,
    })


def fetch_city_data(city: Optional[str]) -> Dict[str, Any]:
    key = _normalize_city(city)
    if not key:
        key = _normalize_city(config.CITY)

    cached = _city_cache.get(key)
    now = time.time()
    if cached and (now - cached.get("timestamp", 0)) < CACHE_TTL_SECONDS:
        return cached["data"]

    data = None
    if config.OPENWEATHER_KEY:
        try:
            data = _fetch_from_openweather(key)
        except Exception as exc:
            logger.warning("OpenWeather fetch failed for %s: %s", key, exc)

    if data is None:
        data = _simulate_city_data(key)

    _city_cache[key] = {"data": data, "timestamp": now}
    return data


def _fetch_from_openweather(city: str) -> Dict[str, Any]:
    params = {
        "q": city,
        "appid": config.OPENWEATHER_KEY,
        "units": "metric",
    }
    resp = requests.get(config.OPENWEATHER_BASE_URL, params=params, timeout=config.OPENWEATHER_TIMEOUT)
    resp.raise_for_status()
    payload = resp.json()

    main = payload.get("main", {})
    wind = payload.get("wind", {})
    weather = payload.get("weather") or []
    visibility = payload.get("visibility")

    temp_c = float(main.get("temp")) if main.get("temp") is not None else None
    wind_mps = float(wind.get("speed")) if wind.get("speed") is not None else None

    weather_id = None
    if weather:
        weather_id = weather[0].get("id")

    heat_index = 0.0
    if temp_c is not None and temp_c >= 32:
        heat_index = _clamp((temp_c - 32) / 10.0)

    storm_index = 0.0
    if isinstance(weather_id, int):
        group = weather_id // 100
        if group == 2:
            storm_index = 0.7
        elif group in (3, 5):
            storm_index = 0.5
        elif group == 6:
            storm_index = 0.6
        elif group == 7:
            storm_index = 0.4

    wind_index = 0.0
    if wind_mps is not None:
        if wind_mps >= 15:
            wind_index = 0.6
        elif wind_mps >= 10:
            wind_index = 0.4
        elif wind_mps >= 7:
            wind_index = 0.2

    visibility_index = 0.0
    if isinstance(visibility, (int, float)) and visibility < 3000:
        visibility_index = 0.4

    power_status = _clamp(max(heat_index, storm_index * 0.8))
    logistics_status = _clamp(max(storm_index, wind_index, visibility_index))
    food_supply_index = _clamp((storm_index * 0.6) + (heat_index * 0.4))
    fuel_supply_index = _clamp((logistics_status * 0.6) + (wind_index * 0.4))

    return {
        "city": city,
        "fuel_supply_index": fuel_supply_index,
        "food_supply_index": food_supply_index,
        "power_status": power_status,
        "logistics_status": logistics_status,
        "weather": {
            "temp_c": temp_c,
            "wind_mps": wind_mps,
            "weather_id": weather_id,
            "visibility": visibility,
        },
        "source": "openweather",
        "timestamp": _iso_now(),
    }


def _simulate_city_data(city: str) -> Dict[str, Any]:
    baseline = SIMULATED_BASELINES.get(city, {
        "fuel_supply_index": 0.22,
        "food_supply_index": 0.22,
        "power_status": 0.22,
        "logistics_status": 0.22,
    })

    return {
        "city": city,
        **baseline,
        "source": "simulated",
        "timestamp": _iso_now(),
    }


def invalidate_city_cache() -> None:
    _city_cache.clear()
