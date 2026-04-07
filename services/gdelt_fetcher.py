# services/gdelt_fetcher.py
# CityShield GDELT Fetcher
# Responsibility: Fetch recent GDELT events for India and return a severity score.

import requests

GDELT_URL = (
    "http://api.gdeltproject.org/api/v2/doc/doc"
    "?query=India%20crisis%20OR%20flood%20OR%20protest%20OR%20shortage%20OR%20attack"
    "&mode=artlist&maxrecords=10&format=json"
)


def get_gdelt_score() -> float:
    """
    Fetches recent GDELT articles filtered to India crisis events.
    Returns severity score = min(count * 1.5, 10.0).
    Fallback: 5.0 if API fails or returns empty.
    """
    print("[CityShield] Fetching India crisis events from GDELT...")
    try:
        response = requests.get(GDELT_URL, timeout=10)
        response.raise_for_status()
        data = response.json()

        count = len(data.get("articles", []))

        if count == 0:
            print("Crisis Events Found: 0  ->  No articles returned by GDELT.")
            print("GDELT Risk Score: 5.0  (No data — default score applied)\n")
            return 5.0

        score = min(count * 1.5, 10.0)
        print(f"Crisis Events Found: {count}  ->  GDELT Risk Score: {score:.1f}\n")
        return score

    except Exception:
        print("Crisis Events Found: N/A")
        print("Note: Score 5.0 means API timed out, fallback value used.\n")
        return 5.0
