# services/yahoo_fetcher.py
# CityShield Yahoo Finance Fetcher
# Responsibility: Fetch crude oil price and return a market severity score.

import yfinance as yf


def get_market_score() -> float:
    """
    Fetches the latest crude oil price (CL=F) in USD, converts to INR per litre,
    and returns a market severity score based on Rs/litre thresholds.
    Fallback: 4.0 if fetch fails.
    """
    print("[CityShield] Fetching live crude oil price...")
    try:
        ticker = yf.Ticker("CL=F")
        data = ticker.history(period="1d")

        if data.empty:
            print("Crude Oil Price  : Unavailable")
            print("Market Risk Score: 4.0  (Fallback)\n")
            return 4.0

        usd_price = float(data["Close"].iloc[-1])
        price_inr_per_litre = (usd_price * 83.5) / 159

        if price_inr_per_litre > 55:
            score = 8.0
            label = "HIGH  (Above Rs55/litre threshold)"
            flag  = "WARNING"
        elif price_inr_per_litre > 45:
            score = 5.0
            label = "MODERATE  (Above Rs45/litre threshold)"
            flag  = "CAUTION"
        elif price_inr_per_litre > 35:
            score = 3.0
            label = "NORMAL  (Above Rs35/litre threshold)"
            flag  = "OK"
        else:
            score = 1.0
            label = "LOW  (Below Rs35/litre threshold)"
            flag  = "OK"

        print(f"Crude Oil Price  : ${usd_price:.2f} USD/barrel")
        print(f"Indian Rate      : Rs{price_inr_per_litre:.2f}/litre")
        print(f"Market Risk Score: {score:.1f}  [{flag}]  {label}\n")
        return score

    except Exception:
        print("Crude Oil Price  : Unavailable")
        print("Market Risk Score: 4.0  (Fallback)\n")
        return 4.0
