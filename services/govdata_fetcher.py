# services/govdata_fetcher.py
# CityShield Government Data Fetcher
# Responsibility: Fetch India commodity price data from data.gov.in and return a supply score.

import os
import requests

_GOVDATA_API_KEY = os.environ.get("GOVDATA_API_KEY", "579b464db66ec23bdd000001548d39482160445a55f6a76120fa3454")
if not _GOVDATA_API_KEY:
    raise EnvironmentError(
        "GOVDATA_API_KEY environment variable is not set. "
        "Export it before running: export GOVDATA_API_KEY=your_key_here"
    )

GOVDATA_URL = (
    "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    f"?api-key={_GOVDATA_API_KEY}"
    "&format=json&limit=10"
)


def get_supply_score() -> float:
    """
    Fetches commodity price records from data.gov.in.
    Scores based on average modal price in INR.
    Fallback: 3.0 if API fails or no records.
    """
    print("[CityShield] Fetching commodity prices from data.gov.in...")
    try:
        response = requests.get(GOVDATA_URL, timeout=10)
        response.raise_for_status()
        data = response.json()

        records = data.get("records", [])
        prices = [float(r["modal_price"]) for r in records if "modal_price" in r]
        avg_price = sum(prices) / len(prices) if prices else 0

        if not prices:
            print("No price records found.")
            print("Supply Risk Score    : 3.0  (Fallback)\n")
            return 3.0

        print("\nTop 5 Commodity Prices Today:")
        for i, r in enumerate(records[:5], 1):
            commodity = r.get("commodity", "Unknown")
            price     = r.get("modal_price", "N/A")
            print(f"  {i}. {commodity:<14} - Rs{price}/quintal")

        if avg_price > 100:
            score = 8.0
            label = "HIGH  (Commodity prices above normal)"
            flag  = "WARNING"
        elif avg_price > 85:
            score = 5.0
            label = "MODERATE"
            flag  = "CAUTION"
        elif avg_price > 70:
            score = 3.0
            label = "NORMAL"
            flag  = "OK"
        else:
            score = 1.0
            label = "LOW"
            flag  = "OK"

        print(f"\nAverage Modal Price  : Rs{avg_price:.2f}/quintal")
        print(f"Supply Risk Score    : {score:.1f}  [{flag}]  {label}\n")
        return score

    except Exception:
        print("API request failed.")
        print("Supply Risk Score    : 3.0  (Fallback)\n")
        return 3.0
