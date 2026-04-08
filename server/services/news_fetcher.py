import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional

import requests

from config import config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory cache
# ---------------------------------------------------------------------------
_news_cache: Dict = {"data": None, "timestamp": 0}
_gdelt_cache: Dict = {"data": None, "timestamp": 0}


def _to_iso_utc(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _normalize_iso_timestamp(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    raw = value.strip()
    if not raw:
        return None

    try:
        if raw.endswith("Z"):
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        else:
            dt = datetime.fromisoformat(raw)
        return _to_iso_utc(dt)
    except ValueError:
        return None


def _normalize_gdelt_timestamp(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    raw = value.strip()
    if not raw:
        return None

    try:
        if "T" in raw and raw.endswith("Z"):
            dt = datetime.strptime(raw, "%Y%m%dT%H%M%SZ")
            return _to_iso_utc(dt.replace(tzinfo=timezone.utc))
        if raw.isdigit() and len(raw) >= 14:
            dt = datetime.strptime(raw[:14], "%Y%m%d%H%M%S")
            return _to_iso_utc(dt.replace(tzinfo=timezone.utc))
    except ValueError:
        return None

    return _normalize_iso_timestamp(raw)


def fetch_crisis_news(keywords: Optional[List[str]] = None) -> List[Dict]:
    """
    Fetch crisis-related news articles.
    Uses NewsAPI if key is configured, otherwise returns empty list.
    Results are cached for NEWS_CACHE_TTL seconds.
    """
    now = time.time()
    if _news_cache["data"] is not None and (now - _news_cache["timestamp"]) < config.NEWS_CACHE_TTL:
        logger.debug("Returning cached news data")
        return _news_cache["data"]

    if not config.NEWSAPI_KEY:
        logger.warning("NEWSAPI_KEY not set; falling back to GDELT fetch")
        try:
            gdelt_events = fetch_gdelt_events(theme="CRISIS", country=config.COUNTRY_CODE or "IN")
            normalized = [
                {
                    "title": e.get("title") or "",
                    "source": e.get("source") or "Unknown",
                    "published_at": e.get("published_at"),
                    "description": e.get("description", ""),
                    "content": e.get("content", ""),
                    "url": e.get("url") or "",
                    "relevance_keywords": [],
                }
                for e in gdelt_events
                if e.get("title") and e.get("url")
            ]
            _news_cache["data"] = normalized
            _news_cache["timestamp"] = now
            return normalized
        except Exception as exc:
            logger.warning("GDELT fallback failed: %s", exc)
            _news_cache["data"] = []
            _news_cache["timestamp"] = now
            return []

    try:
        articles = _fetch_from_newsapi(keywords)
        _news_cache["data"] = articles
        _news_cache["timestamp"] = now
        return articles
    except Exception as exc:
        logger.warning("NewsAPI fetch failed: %s", exc)
        _news_cache["data"] = []
        _news_cache["timestamp"] = now
        return []


def _fetch_from_newsapi(keywords: Optional[List[str]] = None) -> List[Dict]:
    """Call the real NewsAPI."""
    default_keywords = [
        "oil price",
        "fuel shortage",
        "OPEC",
        "Strait of Hormuz",
        "India supply chain",
        "power outage India",
        "coal shortage",
        "wheat export",
        "food inflation India",
        "shipping disruption",
    ]
    query_terms = keywords if keywords else default_keywords
    query = " OR ".join(f'"{k}"' for k in query_terms[:5])  # API limit

    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 20,
        "apiKey": config.NEWSAPI_KEY,
    }

    resp = requests.get(config.NEWSAPI_BASE_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    articles = []
    for art in data.get("articles", []):
        published_at = _normalize_iso_timestamp(art.get("publishedAt"))
        title = art.get("title") or ""
        url = art.get("url") or ""
        if not title or not url or not published_at:
            continue
        articles.append({
            "title": title,
            "source": art.get("source", {}).get("name", "Unknown"),
            "published_at": published_at,
            "description": art.get("description") or "",
            "content": art.get("content") or "",
            "url": url,
            "relevance_keywords": [],
        })
    return articles


def fetch_gdelt_events(theme: str = "CRISIS", country: str = "IN") -> List[Dict]:
    """
    Fetch events from GDELT API.
    Returns empty list if unavailable.
    """
    now = time.time()
    if _gdelt_cache["data"] is not None and (now - _gdelt_cache["timestamp"]) < config.NEWS_CACHE_TTL:
        return _gdelt_cache["data"]

    try:
        events = _fetch_from_gdelt(theme, country)
        _gdelt_cache["data"] = events
        _gdelt_cache["timestamp"] = now
        return events
    except Exception as exc:
        logger.warning("GDELT fetch failed: %s", exc)
        _gdelt_cache["data"] = []
        _gdelt_cache["timestamp"] = now
        return []


def _fetch_from_gdelt(theme: str, country: str) -> List[Dict]:
    """Call the real GDELT API."""
    params = {
        "query": f"theme:{theme} sourcecountry:{country}",
        "mode": "artlist",
        "maxrecords": 25,
        "format": "json",
    }
    resp = requests.get(config.GDELT_BASE_URL, params=params, timeout=config.GDELT_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    events = []
    for art in data.get("articles", []):
        published_at = _normalize_gdelt_timestamp(art.get("seendate"))
        title = art.get("title") or ""
        # Map all possible link fields to url
        url = (
            art.get("url")
            or art.get("source_url")
            or art.get("news_url")
            or art.get("link")
            or ""
        )
        if not title or not url or not published_at:
            continue
        events.append({
            "title": title,
            "url": url,
            "source": art.get("domain", "Unknown"),
            "published_at": published_at,
            "tone": art.get("tone", 0),
        })
    return events


def invalidate_news_cache() -> None:
    """Force cache invalidation on next fetch."""
    _news_cache["timestamp"] = 0
    _gdelt_cache["timestamp"] = 0
