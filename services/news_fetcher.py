# services/news_fetcher.py
# CityShield News Fetcher
# Responsibility: Fetch live headlines from NewsAPI with fallback to mock data.

import requests

NEWSAPI_KEY = "aa02239960f24c318f4beae91c419ade"

MOCK_HEADLINES = [
    "Oil prices surge amid geopolitical tensions",
    "Fuel shortage reported in multiple regions",
    "OPEC cuts production again",
    "Flood warning issued for coastal cities",
    "Nuclear plant inspection raises concerns",
]


def get_news_headlines() -> list[str]:
    """
    Fetches up to 10 latest English headlines from NewsAPI matching the query.
    Falls back to MOCK_HEADLINES if the API call fails for any reason.
    """
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "oil OR fuel OR OPEC OR shortage OR crisis OR war OR sanctions OR flood OR nuclear OR blackout",
            "language": "en",
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

        if headlines:
            return headlines[:10]

        return MOCK_HEADLINES

    except Exception:
        return MOCK_HEADLINES
