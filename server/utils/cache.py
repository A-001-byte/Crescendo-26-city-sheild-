import time
import copy
from utils.constants import CACHE_TTL_SECONDS

_cache = {}


def _get_bucket(cache_key: str):
    key = cache_key or "default"
    if key not in _cache:
        _cache[key] = {"data": None, "timestamp": 0}
    return _cache[key]


def get_cached_risk(calculate_fn, cache_key: str = "default"):
    """
    Returns cached risk engine result if still fresh.
    Otherwise calls calculate_fn(), caches the result, and returns it.
    Does NOT alter the engine output in any way.
    """
    now = time.time()

    bucket = _get_bucket(cache_key)
    if bucket["data"] is not None and (now - bucket["timestamp"]) < CACHE_TTL_SECONDS:
        return copy.deepcopy(bucket["data"])

    result = calculate_fn()
    bucket["data"] = copy.deepcopy(result)
    bucket["timestamp"] = now
    return result


def invalidate_risk_cache():
    """Force clear the cache (useful after scheduled broadcasts)."""
    _cache.clear()
