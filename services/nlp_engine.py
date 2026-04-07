# services/nlp_engine.py
# CityShield NLP Input Pipeline
# Responsibility: Convert news headlines into structured signals (sentiment + keyword_score)
# Does NOT contain any risk logic.

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from news_fetcher import get_news_headlines


# ---------------------------------------------------------------------------
# 2. SENTIMENT ANALYSIS  (VADER)
# ---------------------------------------------------------------------------

_analyzer = SentimentIntensityAnalyzer()

def get_sentiment(headlines: list[str]) -> float:
    """
    Returns the average VADER compound sentiment score across all headlines.
    Range: -1.0 (most negative) to +1.0 (most positive).
    """
    if not headlines:
        return 0.0

    scores = [_analyzer.polarity_scores(h)["compound"] for h in headlines]
    return sum(scores) / len(scores)


# ---------------------------------------------------------------------------
# 3. KEYWORD SCORING
# ---------------------------------------------------------------------------

KEYWORDS: dict[str, float] = {
    "war":      3.5,
    "crisis":   3.5,
    "shortage": 3.0,
    "sanctions": 2.5,
    "opec":     1.5,
    "surge":    2.0,
    "nuke":     4.0,
    "nuclear":  4.0,
    "flood":    3.0,
    "attack":   3.0,
    "blackout": 3.0,
}

def get_keyword_score(headlines: list[str]) -> float:
    """
    Scans headlines for weighted keywords and returns the cumulative score.
    Higher score = more high-impact terms present in the news.
    """
    score = 0.0
    for headline in headlines:
        text_lower = headline.lower()
        for word, weight in KEYWORDS.items():
            if word in text_lower:
                score += weight
    return score


# ---------------------------------------------------------------------------
# 4. FINAL NLP SIGNAL FUNCTION  — this is what the risk engine calls
# ---------------------------------------------------------------------------

def get_nlp_signals() -> dict:
    """
    Entry point for the risk engine.

    Returns:
        {
            "sentiment":     float  # -1.0 to +1.0
            "keyword_score": float  # 0 to ~N (unbounded, higher = more alarming)
        }
    """
    headlines = get_news_headlines()

    return {
        "sentiment":     get_sentiment(headlines),
        "keyword_score": get_keyword_score(headlines),
    }


# ---------------------------------------------------------------------------
# Quick smoke-test  (python nlp_engine.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    signals = get_nlp_signals()
    print("=== NLP Signals ===")
    print(f"  sentiment     : {signals['sentiment']:.4f}")
    print(f"  keyword_score : {signals['keyword_score']:.1f}")
