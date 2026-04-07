import time
import logging
from typing import Dict, Any

import requests

from config import config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory cache
# ---------------------------------------------------------------------------
_oil_cache: Dict = {"data": None, "timestamp": 0}

# ---------------------------------------------------------------------------
# Hardcoded realistic fallback — reflects high oil price environment
# ---------------------------------------------------------------------------
FALLBACK_OIL_DATA = {
    "brent_current": 91.40,
    "brent_prev_close": 88.55,
    "brent_change_pct": 3.22,
    "wti_current": 87.80,
    "wti_prev_close": 85.10,
    "wti_change_pct": 3.17,
    "trend_7d": [82.10, 83.40, 84.90, 86.20, 87.55, 88.55, 91.40],
    "volatility_index": 28.5,
    "supply_impact": "high",
    "opec_compliance_pct": 94.2,
    "india_import_basket": 89.20,
    "strategic_reserve_days": 9.5,
    "last_updated": None,
    "source": "fallback",
}


def _fetch_from_yfinance() -> Dict[str, Any]:
    """Fetch live crude oil price from Yahoo Finance (CL=F = WTI front-month)."""
    from datetime import datetime
    import yfinance as yf

    hist = yf.Ticker("CL=F").history(period="8d")
    if hist.empty or len(hist) < 2:
        raise ValueError("yfinance returned no data for CL=F")

    wti_current = float(hist["Close"].iloc[-1])
    wti_prev = float(hist["Close"].iloc[-2])
    change_pct = ((wti_current - wti_prev) / wti_prev * 100) if wti_prev else 0.0
    trend_7d = [round(float(v), 2) for v in hist["Close"].tail(7).tolist()]

    brent_current = round(wti_current * 1.04, 2)
    brent_prev = round(wti_prev * 1.04, 2)
    volatility = _calculate_volatility(trend_7d)
    supply_impact = "high" if abs(change_pct) > 2.5 or brent_current > 90 else "moderate"

    return {
        "brent_current": brent_current,
        "brent_prev_close": brent_prev,
        "brent_change_pct": round(change_pct, 2),
        "wti_current": round(wti_current, 2),
        "wti_prev_close": round(wti_prev, 2),
        "wti_change_pct": round(change_pct, 2),
        "trend_7d": trend_7d,
        "volatility_index": volatility,
        "supply_impact": supply_impact,
        "opec_compliance_pct": 94.2,
        "india_import_basket": round(brent_current * 0.977, 2),
        "strategic_reserve_days": 9.5,
        "last_updated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "yfinance",
    }


def get_oil_prices() -> Dict[str, Any]:
    """
    Retrieve current oil price data.
    Priority: yfinance (no key needed) → Alpha Vantage → hardcoded fallback.
    Results are cached for OIL_CACHE_TTL seconds.
    """
    now = time.time()
    if _oil_cache["data"] is not None and (now - _oil_cache["timestamp"]) < config.OIL_CACHE_TTL:
        logger.debug("Returning cached oil data")
        return _oil_cache["data"]

    # 1. Try yfinance first — no API key required
    try:
        data = _fetch_from_yfinance()
        _oil_cache["data"] = data
        _oil_cache["timestamp"] = now
        logger.info("Oil price fetched from yfinance: brent=%.2f", data["brent_current"])
        return data
    except Exception as exc:
        logger.warning("yfinance oil fetch failed: %s", exc)

    # 2. Try Alpha Vantage if key is set
    if config.ALPHA_VANTAGE_KEY:
        try:
            data = _fetch_from_alpha_vantage()
            _oil_cache["data"] = data
            _oil_cache["timestamp"] = now
            return data
        except Exception as exc:
            logger.warning("Alpha Vantage fetch failed: %s — using fallback data", exc)

    from datetime import datetime
    data = dict(FALLBACK_OIL_DATA)
    data["last_updated"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    _oil_cache["data"] = data
    _oil_cache["timestamp"] = now
    return data


def _fetch_from_alpha_vantage() -> Dict[str, Any]:
    """
    Fetch Brent Crude price from Alpha Vantage.
    Tries BRENT commodity symbol.
    """
    from datetime import datetime

    params_brent = {
        "function": "BRENT",
        "interval": "daily",
        "apikey": config.ALPHA_VANTAGE_KEY,
    }

    resp = requests.get(config.ALPHA_VANTAGE_BASE_URL, params=params_brent, timeout=10)
    resp.raise_for_status()
    brent_data = resp.json()

    series = brent_data.get("data", [])
    if not series or len(series) < 2:
        raise ValueError("Insufficient data from Alpha Vantage")

    # series is newest-first
    brent_current = float(series[0]["value"])
    brent_prev = float(series[1]["value"])
    brent_change_pct = ((brent_current - brent_prev) / brent_prev) * 100

    trend_7d = []
    for entry in reversed(series[:7]):
        try:
            trend_7d.append(float(entry["value"]))
        except (KeyError, ValueError):
            pass

    volatility = _calculate_volatility(trend_7d)
    supply_impact = "high" if abs(brent_change_pct) > 2.5 or brent_current > 90 else "moderate"

    return {
        "brent_current": round(brent_current, 2),
        "brent_prev_close": round(brent_prev, 2),
        "brent_change_pct": round(brent_change_pct, 2),
        "wti_current": round(brent_current * 0.961, 2),
        "wti_prev_close": round(brent_prev * 0.961, 2),
        "wti_change_pct": round(brent_change_pct, 2),
        "trend_7d": [round(v, 2) for v in trend_7d],
        "volatility_index": round(volatility, 1),
        "supply_impact": supply_impact,
        "opec_compliance_pct": 94.2,
        "india_import_basket": round(brent_current * 0.977, 2),
        "strategic_reserve_days": 9.5,
        "last_updated": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "alpha_vantage",
    }


def _calculate_volatility(prices: list) -> float:
    """Simple volatility calculation based on standard deviation of returns."""
    if len(prices) < 2:
        return 20.0

    returns = []
    for i in range(1, len(prices)):
        if prices[i - 1] != 0:
            ret = (prices[i] - prices[i - 1]) / prices[i - 1] * 100
            returns.append(ret)

    if not returns:
        return 20.0

    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / len(returns)
    std_dev = variance ** 0.5

    # Scale to a 0-100 VIX-like index
    return round(min(std_dev * 10, 100), 1)


def get_oil_price_impact_on_fuel_score(oil_data: Dict[str, Any]) -> float:
    """
    Returns a fuel score multiplier (0.0–1.0) based on current oil conditions.
    Higher oil prices and volatility increase the score boost.
    """
    brent = oil_data.get("brent_current", 70.0)
    change_pct = oil_data.get("brent_change_pct", 0.0)
    volatility = oil_data.get("volatility_index", 20.0)

    # Base impact from price level (normalized: $60 = 0.0 boost, $100 = 1.0 boost)
    price_impact = max(0.0, min(1.0, (brent - 60.0) / 40.0))

    # Change rate impact
    change_impact = max(0.0, min(1.0, abs(change_pct) / 10.0))

    # Volatility impact
    vol_impact = max(0.0, min(1.0, volatility / 50.0))

    combined = (price_impact * 0.5) + (change_impact * 0.3) + (vol_impact * 0.2)
    return round(combined, 3)


def invalidate_oil_cache() -> None:
    """Force cache invalidation on next fetch."""
    _oil_cache["timestamp"] = 0
