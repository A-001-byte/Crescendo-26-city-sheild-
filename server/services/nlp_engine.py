import json
import os
import sys
import logging
import hashlib
from typing import Dict, List, Any
from datetime import datetime

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Fake news filter (BERT-based) — loaded lazily
# ---------------------------------------------------------------------------
_root_services = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "services"))
if _root_services not in sys.path:
    sys.path.append(_root_services)  # append so server/services/ keeps priority

def _annotate_and_filter_articles(articles: List[Dict]) -> List[Dict]:
    """
    Run BERT fake news classifier on each article text (title + description + content).
    Adds bert_confidence (0-1) and bert_label ('REAL'/'FAKE') to each article.
    Falls back to original articles if model cannot be loaded.
    """
    try:
        from fake_news_filter import classify_text, normalize_label_confidence, map_credibility_score, REAL_THRESHOLD
    except Exception as exc:
        logger.warning("Fake news model unavailable: %s — skipping BERT", exc)
        return articles

    annotated = []
    for article in articles:
        text = _build_news_text(article)
        if not text:
            annotated.append({**article, "bert_confidence": None, "bert_label": None, "bert_verified": False})
            continue

        try:
            result = classify_text(text)
            is_real, confidence = normalize_label_confidence(result.get("label"), result.get("score", 0.0))
            mapped_confidence = round(map_credibility_score(is_real, confidence), 4)
            bert_label = "REAL" if is_real else "FAKE"
            bert_verified = is_real and confidence >= REAL_THRESHOLD
            annotated.append({
                **article,
                "bert_confidence": mapped_confidence,
                "bert_label": bert_label,
                "bert_verified": bert_verified,
            })
        except Exception as exc:
            logger.warning("BERT failed on article '%s': %s — skipping", (article.get("title") or "")[:50], exc)
            annotated.append({**article, "bert_confidence": None, "bert_label": None, "bert_verified": False})

    return annotated

# ---------------------------------------------------------------------------
# Load crisis keyword lexicon
# ---------------------------------------------------------------------------
_LEXICON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "keyword_lexicon.json")

try:
    with open(_LEXICON_PATH, "r", encoding="utf-8") as f:
        CRISIS_LEXICON: Dict[str, float] = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    logger.warning("Could not load keyword_lexicon.json: %s — using built-in defaults", e)
    CRISIS_LEXICON = {
        "blockade": 0.9, "embargo": 0.85, "sanctions": 0.8, "shortage": 0.85,
        "disruption": 0.8, "conflict": 0.75, "missile": 0.9, "strike": 0.7,
        "shutdown": 0.8, "rationing": 0.9, "hoarding": 0.7, "panic buying": 0.85,
        "price surge": 0.75, "supply chain": 0.6, "crude oil": 0.65,
        "strait of hormuz": 0.95, "opec cut": 0.8, "pipeline attack": 0.9,
        "power outage": 0.85, "grid failure": 0.9, "coal shortage": 0.8,
        "wheat ban": 0.8, "food inflation": 0.7, "export restriction": 0.75,
        "cyclone": 0.8, "flood": 0.75, "drought": 0.7,
        "war": 0.95, "invasion": 0.95, "military escalation": 0.9,
    }

# ---------------------------------------------------------------------------
# Service keyword mapping (loaded from data file)
# ---------------------------------------------------------------------------
_SERVICE_KEYWORDS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "service_keywords.json")


def _load_service_keywords() -> Dict[str, List[str]]:
    try:
        with open(_SERVICE_KEYWORDS_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if not isinstance(raw, dict):
            raise ValueError("service_keywords.json must be an object")
        cleaned: Dict[str, List[str]] = {}
        for key, values in raw.items():
            if not isinstance(values, list):
                continue
            cleaned[key] = [str(v).lower() for v in values if str(v).strip()]
        return cleaned
    except Exception as exc:
        logger.warning("Could not load service_keywords.json: %s — using defaults", exc)
        return {
            "fuel": [
                "oil", "crude", "petrol", "diesel", "lpg", "gas", "opec", "hormuz",
                "refinery", "pipeline", "brent", "wti", "fuel", "petroleum", "kerosene",
                "energy", "barrel", "tanker", "drilling", "rig",
            ],
            "power": [
                "electricity", "grid", "coal", "power plant", "outage", "solar", "energy",
                "blackout", "load shedding", "thermal", "hydroelectric", "nuclear power",
                "voltage", "substation", "transmission", "distribution",
            ],
            "food": [
                "wheat", "rice", "food", "grain", "crop", "agriculture", "famine",
                "export ban", "harvest", "fertilizer", "food inflation", "vegetable",
                "pulse", "sugar", "dairy", "edible oil", "onion", "tomato", "potato",
                "ration", "buffer stock", "nafed",
            ],
            "logistics": [
                "shipping", "port", "freight", "supply chain", "transport", "road",
                "railway", "container", "truck", "highway", "border", "customs",
                "warehouse", "distribution", "cargo", "fleet", "transit", "import",
                "export", "trade route",
            ],
        }


SERVICE_KEYWORDS: Dict[str, List[str]] = _load_service_keywords()

# India-relevant location and entity terms
INDIA_TERMS = [
    "india", "indian", "mumbai", "delhi", "pune", "bangalore", "chennai",
    "hyderabad", "kolkata", "gujarat", "maharashtra", "rajasthan", "up",
    "bpcl", "hpcl", "ioc", "ongc", "msedcl", "cea", "ndtv", "et",
    "rupee", "inr", "jnpt", "nhava sheva", "mundra", "paradip",
    "vizag", "visakhapatnam", "mangaluru", "navi mumbai",
]

# Initialise VADER once
_vader = SentimentIntensityAnalyzer()


def _build_event_id(article: Dict[str, Any]) -> str:
    seed = article.get("url") or f"{article.get('title', '')}-{article.get('published_at', '')}"
    if not seed:
        seed = json.dumps(article, sort_keys=True)
    digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12]
    return f"evt-{digest}"


def _build_news_text(article: Dict[str, Any]) -> str:
    title = article.get("title") or ""
    description = article.get("description") or ""
    content = article.get("content") or ""

    if "[+" in content and content.endswith("]"):
        content = content.split("[+", 1)[0].strip()

    parts = [title.strip(), description.strip(), content.strip()]
    return " ".join([p for p in parts if p])


def _score_services(combined_text: str) -> List[str]:
    if not combined_text:
        return []

    service_scores: Dict[str, float] = {}
    for service, keywords in SERVICE_KEYWORDS.items():
        hits = [kw for kw in keywords if kw and kw in combined_text]
        if not hits:
            continue
        weights = [CRISIS_LEXICON.get(kw, 0.6) for kw in hits]
        service_scores[service] = sum(weights) / len(weights)

    if not service_scores:
        return []

    threshold = 0.25
    affected = [svc for svc, score in service_scores.items() if score >= threshold]
    if not affected:
        affected = [max(service_scores, key=service_scores.get)]
    return affected


# ---------------------------------------------------------------------------
# Core analysis functions
# ---------------------------------------------------------------------------

def analyze_article(article: Dict[str, Any]) -> Dict[str, Any]:
    """
    Full NLP analysis pipeline for a single article.

    Steps:
    1. VADER sentiment on title + description
    2. Crisis keyword matching -> keyword_score
    3. Service category classification
    4. India relevance check
    5. Combined severity computation
    6. Crisis level categorisation
    """
    title: str = article.get("title") or ""
    description: str = article.get("description") or ""
    content: str = article.get("content") or ""

    combined_text = f"{title} {description} {content}".lower()
    short_text = f"{title} {description}".lower()

    # Step 1: VADER sentiment
    scores = _vader.polarity_scores(short_text if short_text.strip() else combined_text)
    vader_compound: float = scores["compound"]
    vader_negative: float = scores["neg"]

    # Step 2: Keyword matching
    matched_keywords: List[str] = []
    keyword_weights: List[float] = []

    for kw, weight in CRISIS_LEXICON.items():
        if kw.lower() in combined_text:
            matched_keywords.append(kw)
            keyword_weights.append(weight)

    if keyword_weights:
        # Use weighted average of top-5 matched keywords
        top_weights = sorted(keyword_weights, reverse=True)[:5]
        keyword_score = sum(top_weights) / len(top_weights)
    else:
        keyword_score = 0.0

    # Step 3: Service classification (keyword scoring)
    affected_services = _score_services(combined_text)
    print("SERVICES:", affected_services)

    # Step 4: India relevance
    india_hits = sum(1 for term in INDIA_TERMS if term in combined_text)
    india_relevance = min(1.0, india_hits / 3.0)  # saturates at 3+ hits

    # Step 5: Combined severity
    # Weights: vader_neg 30%, keyword_score 50%, india_relevance 20%
    combined_severity = (
        (vader_negative * 0.30)
        + (keyword_score * 0.50)
        + (india_relevance * 0.20)
    )
    combined_severity = round(min(1.0, combined_severity), 4)

    # Step 6: Crisis level
    if combined_severity < 0.3:
        crisis_level = "low"
    elif combined_severity < 0.5:
        crisis_level = "moderate"
    elif combined_severity < 0.7:
        crisis_level = "high"
    else:
        crisis_level = "critical"

    # Summary (first 150 chars of description or title)
    summary_src = description if description else title
    summary = summary_src[:150].strip()

    event_id = _build_event_id(article)

    return {
        "id": event_id,
        "title": title,
        "source": article.get("source", "Unknown"),
        "published_at": article.get("published_at", ""),
        "url": article.get("url", ""),
        "vader_compound": round(vader_compound, 4),
        "vader_negative": round(vader_negative, 4),
        "keyword_score": round(keyword_score, 4),
        "matched_keywords": matched_keywords,
        "affected_services": affected_services,
        "india_relevance": round(india_relevance, 4),
        "combined_severity": combined_severity,
        "crisis_level": crisis_level,
        "severity": crisis_level,
        "summary": summary,
    }


def _build_contract_metrics(analyses: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Build the strict NLP -> risk engine contract.

    Returns exactly:
    {
        "sentiment": float,      # -1 to +1
        "keyword_score": float   # 0 to 10
    }
    """
    if not analyses:
        return {
            "sentiment": 0.0,
            "keyword_score": 0.0,
        }

    avg_sentiment = sum(a.get("vader_compound", 0.0) for a in analyses) / len(analyses)
    avg_keyword_weight = sum(a.get("keyword_score", 0.0) for a in analyses) / len(analyses)

    sentiment = max(-1.0, min(1.0, avg_sentiment))
    keyword_score = max(0.0, min(10.0, avg_keyword_weight * 10.0))

    return {
        "sentiment": round(sentiment, 4),
        "keyword_score": round(keyword_score, 4),
    }


def analyze_batch(articles: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Strict risk-engine payload.

    Returns exactly:
    {
        "sentiment": float,
        "keyword_score": float
    }
    """
    articles = _annotate_and_filter_articles(articles)
    analyses = [analyze_article(a) for a in articles]
    return _build_contract_metrics(analyses)


def analyze_batch_detailed(articles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze a list of articles and aggregate results by service category.

    Returns:
        sentiment: aggregated VADER compound score in [-1, 1]
        keyword_score: aggregated keyword score in [0, 10]
        service_signals: per-service aggregated metrics
        critical_events: articles with crisis_level == "critical"
        high_events: articles with crisis_level == "high"
        avg_severity: mean combined_severity across all articles
        timestamp: ISO-format UTC time of analysis
    """
    articles = _annotate_and_filter_articles(articles)
    # Merge bert fields into each analysis result
    analyses = [
        {**analyze_article(a), "bert_confidence": a.get("bert_confidence"), "bert_label": a.get("bert_label")}
        for a in articles
    ]

    # Initialise service aggregation
    service_data: Dict[str, Dict] = {
        svc: {"scores": [], "keywords": [], "count": 0}
        for svc in SERVICE_KEYWORDS
    }

    for analysis in analyses:
        for svc in analysis["affected_services"]:
            if svc in service_data:
                service_data[svc]["scores"].append(analysis["combined_severity"])
                service_data[svc]["keywords"].extend(analysis["matched_keywords"])
                service_data[svc]["count"] += 1

    service_signals: Dict[str, Dict] = {}
    for svc, data in service_data.items():
        if data["scores"]:
            avg_score = sum(data["scores"]) / len(data["scores"])
        else:
            avg_score = 0.0

        # Top keywords by frequency
        kw_freq: Dict[str, int] = {}
        for kw in data["keywords"]:
            kw_freq[kw] = kw_freq.get(kw, 0) + 1
        top_keywords = sorted(kw_freq, key=lambda k: kw_freq[k], reverse=True)[:5]

        service_signals[svc] = {
            "score": round(avg_score, 4),
            "article_count": data["count"],
            "top_keywords": top_keywords,
        }

    critical_events = [a for a in analyses if a["crisis_level"] == "critical"]
    high_events = [a for a in analyses if a["crisis_level"] == "high"]

    if analyses:
        avg_severity = sum(a["combined_severity"] for a in analyses) / len(analyses)
    else:
        avg_severity = 0.0

    contract = _build_contract_metrics(analyses)

    return {
        "sentiment": contract["sentiment"],
        "keyword_score": contract["keyword_score"],
        "service_signals": service_signals,
        "critical_events": critical_events,
        "high_events": high_events,
        "all_analyses": analyses,
        "total_articles": len(analyses),
        "avg_severity": round(avg_severity, 4),
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


if __name__ == "__main__":
    sample_articles = [
        {
            "title": "OPEC cut triggers fuel concerns in India",
            "description": "Crude prices rise and supply chain disruption risk grows.",
            "content": "Analysts warn of shortage and logistics pressure in Pune.",
        }
    ]
    nlp_output = analyze_batch(sample_articles)
    print(nlp_output)
