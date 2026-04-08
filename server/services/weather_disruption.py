import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import requests

from config import config

logger = logging.getLogger(__name__)

_WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
_GEO_CACHE: Dict[str, Dict[str, Any]] = {}
WEATHER_CACHE_TTL_SECONDS = 600
GEO_CACHE_TTL_SECONDS = 24 * 60 * 60

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


def _iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clamp(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    return max(min_val, min(max_val, value))


def _normalize_city(city: Optional[str]) -> str:
    raw = (city or "").strip()
    if raw:
        return raw
    return config.CITY


def _get_cached(cache: Dict[str, Dict[str, Any]], key: str, ttl_seconds: int):
    entry = cache.get(key)
    if not entry:
        return None
    if (time.time() - entry["timestamp"]) >= ttl_seconds:
        return None
    return entry["data"]


def _set_cached(cache: Dict[str, Dict[str, Any]], key: str, data: Any):
    cache[key] = {"data": data, "timestamp": time.time()}


def _geocode_city(city: str) -> Dict[str, Any]:
    cached = _get_cached(_GEO_CACHE, city, GEO_CACHE_TTL_SECONDS)
    if cached:
        return cached

    resp = requests.get(
        GEOCODE_URL,
        params={"name": city, "count": 1, "language": "en", "format": "json"},
        timeout=8,
    )
    resp.raise_for_status()
    data = resp.json()
    results = data.get("results") or []
    if not results:
        raise ValueError(f"City '{city}' not found in Open-Meteo geocoding")

    top = results[0]
    payload = {
        "name": top.get("name", city),
        "latitude": float(top["latitude"]),
        "longitude": float(top["longitude"]),
        "country": top.get("country"),
        "admin1": top.get("admin1"),
    }

    _set_cached(_GEO_CACHE, city, payload)
    return payload


def _describe_weather(code: Optional[int]) -> str:
    if code is None:
        return "Unknown"
    mapping = {
        0: "Clear",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail",
    }
    return mapping.get(code, "Unknown")


def _to_float(value: Any) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: Any) -> Optional[int]:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _code_severity(code: Optional[int]) -> float:
    if code is None:
        return 0.0
    if code in {95, 96, 99}:
        return 0.9
    if code in {65, 67, 75, 82, 86}:
        return 0.7
    if code in {61, 63, 71, 73, 80, 81, 85}:
        return 0.5
    if code in {51, 53, 55, 56, 57, 45, 48}:
        return 0.3
    return 0.0


def get_weather_disruption(city: Optional[str]) -> Dict[str, Any]:
    city_name = _normalize_city(city)
    cached = _get_cached(_WEATHER_CACHE, city_name.lower(), WEATHER_CACHE_TTL_SECONDS)
    if cached:
        return cached

    location = _geocode_city(city_name)

    resp = requests.get(
        WEATHER_URL,
        params={
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "current": "temperature_2m,precipitation,wind_speed_10m,weather_code",
            "timezone": "UTC",
        },
        timeout=8,
    )
    resp.raise_for_status()
    payload = resp.json()
    current = payload.get("current") or {}

    temperature = current.get("temperature_2m")
    wind_speed = current.get("wind_speed_10m")
    precipitation = current.get("precipitation")
    weather_code = current.get("weather_code")

    temperature = _to_float(temperature)
    wind_speed = _to_float(wind_speed)
    precipitation = _to_float(precipitation)
    weather_code = _to_int(weather_code)

    heat_index = _clamp((temperature - 30) / 8.0) if temperature is not None else 0.0
    cold_index = _clamp((12 - temperature) / 8.0) if temperature is not None and temperature < 12 else 0.0
    wind_index = _clamp((wind_speed - 5) / 18.0) if wind_speed is not None else 0.0
    precip_index = _clamp(precipitation / 10.0) if precipitation is not None else 0.0
    code_index = _clamp(_code_severity(weather_code))

    disruption_index = _clamp(
        (heat_index * 0.35)
        + (cold_index * 0.2)
        + (wind_index * 0.2)
        + (precip_index * 0.2)
        + (code_index * 0.15)
    )

    drivers = []
    if heat_index >= 0.15:
        drivers.append({"key": "heat", "score": round(heat_index, 2), "detail": f"Temp {temperature:.1f}C" if temperature is not None else "Temp NA"})
    if cold_index >= 0.15:
        drivers.append({"key": "cold", "score": round(cold_index, 2), "detail": f"Temp {temperature:.1f}C" if temperature is not None else "Temp NA"})
    if wind_index >= 0.15:
        drivers.append({"key": "wind", "score": round(wind_index, 2), "detail": f"Wind {wind_speed:.1f} km/h" if wind_speed is not None else "Wind NA"})
    if precip_index >= 0.15:
        drivers.append({"key": "rain", "score": round(precip_index, 2), "detail": f"Rain {precipitation:.1f} mm" if precipitation is not None else "Rain NA"})
    if code_index >= 0.15:
        drivers.append({"key": "storm", "score": round(code_index, 2), "detail": _describe_weather(weather_code)})

    drivers = sorted(drivers, key=lambda d: d["score"], reverse=True)

    affected_services = []
    if wind_index >= 0.2 or precip_index >= 0.2 or code_index >= 0.3:
        affected_services.append("logistics")
    if heat_index >= 0.3 or cold_index >= 0.3:
        affected_services.append("power")
    if precip_index >= 0.3:
        affected_services.append("food")

    data = {
        "city": city_name.lower(),
        "location": location,
        "current": {
            "temperature_c": temperature,
            "wind_speed_kph": wind_speed,
            "precipitation_mm": precipitation,
            "weather_code": weather_code,
            "description": _describe_weather(weather_code),
        },
        "disruption_index": round(disruption_index, 3),
        "drivers": drivers,
        "affected_services": affected_services,
        "source": "open-meteo",
        "timestamp": _iso_now(),
    }

    _set_cached(_WEATHER_CACHE, city_name.lower(), data)
    return data
