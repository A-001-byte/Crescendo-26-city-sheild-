# services/nlp_engine.py
# CityShield NLP Input Pipeline
# Responsibility: Convert news headlines into structured signals (sentiment + keyword_score)
# Does NOT contain any risk logic.

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from news_fetcher import get_news_headlines
from gdelt_fetcher import get_gdelt_score
from yahoo_fetcher import get_market_score
from govdata_fetcher import get_supply_score


# ---------------------------------------------------------------------------
# 2. SENTIMENT ANALYSIS  (VADER)
# ---------------------------------------------------------------------------

_analyzer = SentimentIntensityAnalyzer()

def _sentiment_label(score: float) -> str:
    if score >= 0.05:
        return "Positive"
    elif score <= -0.05:
        return "Negative"
    else:
        return "Neutral"

def _avg_label(score: float) -> str:
    if score >= 0.3:
        return "Positive"
    elif score >= 0.05:
        return "Slightly Positive"
    elif score <= -0.3:
        return "Negative"
    elif score <= -0.05:
        return "Slightly Negative"
    else:
        return "Neutral"

def get_sentiment(headlines: list[str]) -> float:
    """
    Returns the average VADER compound sentiment score across all headlines.
    Range: -1.0 (most negative) to +1.0 (most positive).
    """
    if not headlines:
        return 0.0

    print("[CityShield] Running Sentiment Analysis on headlines...\n")
    scores = []
    for i, h in enumerate(headlines, 1):
        score = _analyzer.polarity_scores(h)["compound"]
        label = _sentiment_label(score)
        sign  = "+" if score >= 0 else ""
        short = h[:45] + ("..." if len(h) > 45 else "")
        print(f"  {i:>2}. {short:<48} | Score: {sign}{score:.2f}  ({label})")
        scores.append(score)

    avg = sum(scores) / len(scores)
    sign = "+" if avg >= 0 else ""
    print(f"\nAverage Sentiment Score: {sign}{avg:.2f}  -> {_avg_label(avg)}\n")
    return avg


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
    print("[CityShield] Scanning for Crisis Keywords...")
    score = 0.0
    hits = []
    for headline in headlines:
        text_lower = headline.lower()
        for word, weight in KEYWORDS.items():
            if word in text_lower:
                score += weight
                hits.append((word, weight))

    if hits:
        for word, weight in hits:
            print(f'  "{word}"  detected  ->  +{weight} points')
    else:
        print("  No crisis keywords detected.")

    print(f"\nTotal Keyword Risk Score: {score:.1f}\n")
    return score


# ---------------------------------------------------------------------------
# 4. STAGE HELPER
# ---------------------------------------------------------------------------

def _run_stage(stage_name: str, fn, fallback, *args, **kwargs):
    """
    Calls fn(*args, **kwargs), returns its result on success.
    On any exception, logs the stage name + error and returns fallback.
    """
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        print(f"[CityShield] Stage '{stage_name}' failed: {e} — using fallback ({fallback})")
        return fallback


# ---------------------------------------------------------------------------
# 5. FINAL NLP SIGNAL FUNCTION  — this is what the risk engine calls
# ---------------------------------------------------------------------------

def get_nlp_signals() -> dict:
    """
    Entry point for the risk engine.

    Returns:
        {
            "sentiment":     float  # -1.0 to +1.0
            "keyword_score": float  # 0 to ~N (unbounded, higher = more alarming)
            "gdelt_score":   float  # GDELT India event severity
            "market_score":  float  # crude oil price severity
            "supply_score":  float  # gov commodity supply score
        }
    """
    try:
        headlines     = _run_stage("news_fetch",    get_news_headlines,  [])
        sentiment     = _run_stage("sentiment",     get_sentiment,       0.0,  headlines)
        keyword_score = _run_stage("keyword_score", get_keyword_score,   0.0,  headlines)
        gdelt_score   = _run_stage("gdelt",         get_gdelt_score,     5.0)
        market_score  = _run_stage("market",        get_market_score,    4.0)
        supply_score  = _run_stage("supply",        get_supply_score,    3.0)

        return {
            "sentiment":     sentiment,
            "keyword_score": keyword_score,
            "gdelt_score":   gdelt_score,
            "market_score":  market_score,
            "supply_score":  supply_score,
        }

    except Exception as e:
        print(f"[CityShield] NLP pipeline failed: {e} — using fallback")
        return {
            "sentiment":     -0.3,
            "keyword_score": 5.0,
            "gdelt_score":   5.0,
            "market_score":  4.0,
            "supply_score":  3.0,
        }


# ---------------------------------------------------------------------------
# Quick smoke-test  (python nlp_engine.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    signals = get_nlp_signals()

    def _flag(val, high=7.0, med=4.0):
        if val >= high:   return "[WARNING]  HIGH"
        if val >= med:    return "[CAUTION]  MODERATE"
        return ""

    sent_label = _avg_label(signals["sentiment"])
    gdelt_note = "  (Fallback)" if signals["gdelt_score"] == 5.0 else ""

    print("==========================================")
    print("         FINAL CITY RISK SIGNALS          ")
    print("==========================================")
    sign = "+" if signals["sentiment"] >= 0 else ""
    print(f"  Mood Score (Sentiment)   : {sign}{signals['sentiment']:.2f}  ({sent_label})")
    print(f"  Keyword Risk Score       : {signals['keyword_score']:.1f}  {_flag(signals['keyword_score'])}")
    print(f"  Crisis Events (GDELT)    : {signals['gdelt_score']:.1f}{gdelt_note}  {_flag(signals['gdelt_score'])}")
    print(f"  Oil Market Score         : {signals['market_score']:.1f}  {_flag(signals['market_score'])}")
    print(f"  Supply/Commodity Score   : {signals['supply_score']:.1f}  {_flag(signals['supply_score'])}")
    print("==========================================")
