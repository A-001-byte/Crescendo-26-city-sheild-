# services/news_fetcher.py
# CityShield News Fetcher
# Responsibility: Fetch live headlines from NewsAPI with fallback to mock data.

import requests

NEWSAPI_KEY = "aa02239960f24c318f4beae91c419ade"

TRUSTED_DOMAINS = (
    "reuters.com,bbc.com,thehindu.com,ndtv.com,"
    "economictimes.indiatimes.com,livemint.com,businessstandard.com"
)

MOCK_HEADLINES = [
    "Oil prices surge amid geopolitical tensions",
    "Fuel shortage reported in multiple regions",
    "OPEC cuts production again",
    "Flood warning issued for coastal cities",
    "Nuclear plant inspection raises concerns",
]


def get_news_headlines() -> list[str]:
    """
    Fetches up to 10 latest English headlines from trusted sources via NewsAPI.
    Falls back to MOCK_HEADLINES if the API call fails for any reason.
    """
    print("[CityShield] Fetching live news headlines...")
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "oil OR fuel OR OPEC OR shortage OR crisis OR war OR sanctions OR flood OR nuclear OR blackout",
            "language": "en",
            "domains": TRUSTED_DOMAINS,
            "sortBy": "publishedAt",
            "pageSize": 10,
            "apiKey": NEWSAPI_KEY,
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        headlines = [
            article["title"]
            for article in data.get("articles", [])
            if article.get("title")
        ]

        if not headlines:
            headlines = MOCK_HEADLINES
            suffix = " (mock)"
        else:
            headlines = headlines[:10]
            suffix = ""

        print("\nHeadlines Retrieved:")
        for i, h in enumerate(headlines, 1):
            print(f"  {i}. {h}")
        print(f"\nTotal Headlines Fetched: {len(headlines)}{suffix}\n")
        return headlines

    except Exception:
        print("\nHeadlines Retrieved: (mock data — API unavailable)")
        for i, h in enumerate(MOCK_HEADLINES, 1):
            print(f"  {i}. {h}")
        print(f"\nTotal Headlines Fetched: {len(MOCK_HEADLINES)} (mock)\n")
        return MOCK_HEADLINES
