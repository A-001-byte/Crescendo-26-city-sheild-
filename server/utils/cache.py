import time
import copy
from utils.constants import CACHE_TTL_SECONDS

_cache = {
    "data": None,
    "timestamp": 0
}


def get_cached_risk(calculate_fn):
    """
    Returns cached risk engine result if still fresh.
    Otherwise calls calculate_fn(), caches the result, and returns it.
    Does NOT alter the engine output in any way.
    """
    now = time.time()

    if _cache["data"] is not None and (now - _cache["timestamp"]) < CACHE_TTL_SECONDS:
        return copy.deepcopy(_cache["data"])

    result = calculate_fn()
    _cache["data"] = copy.deepcopy(result)
    _cache["timestamp"] = now
    return result


def invalidate_risk_cache():
    """Force clear the cache (useful after scheduled broadcasts)."""
    _cache["data"] = None
    _cache["timestamp"] = 0
