import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional

import requests

from config import config

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory cache
# ---------------------------------------------------------------------------
_news_cache: Dict = {"data": None, "timestamp": 0}
_gdelt_cache: Dict = {"data": None, "timestamp": 0}

# ---------------------------------------------------------------------------
# Hardcoded fallback articles — realistic, India-focused supply-chain events
# ---------------------------------------------------------------------------
_days = lambda n: (datetime.utcnow() - timedelta(days=n)).strftime("%Y-%m-%dT%H:%M:%SZ")

FALLBACK_ARTICLES = [
    {
        "title": "Strait of Hormuz Tensions Spike as Iran Seizes Oil Tanker",
        "source": "Reuters",
        "published_at": _days(0),
        "description": (
            "Iran's Revolutionary Guard seized a commercial oil tanker in the Strait of Hormuz, "
            "raising fears of a major disruption to global crude oil shipments. "
            "Around 20% of world oil supply passes through the strait."
        ),
        "content": (
            "Tehran confirmed the seizure citing 'violations of maritime law'. "
            "Brent crude surged 4.2% on the news. India, which imports 85% of its crude oil needs, "
            "faces significant exposure. Refineries in Jamnagar and Chennai are monitoring the situation."
        ),
        "url": "https://reuters.com/article/hormuz-tanker-seizure",
        "relevance_keywords": ["strait of hormuz", "blockade", "crude oil", "disruption"]
    },
    {
        "title": "OPEC+ Announces Surprise 1 Million Barrel/Day Output Cut",
        "source": "Bloomberg",
        "published_at": _days(1),
        "description": (
            "OPEC+ members agreed to cut production by an additional 1 million barrels per day "
            "starting next month, pushing Brent crude above $90 for the first time this year."
        ),
        "content": (
            "Saudi Arabia led the push for deeper cuts to support oil prices. "
            "India's petroleum ministry called an emergency meeting to assess impact on fuel prices. "
            "Petrol and diesel prices in India are likely to rise by ₹3–5 per litre if the situation persists. "
            "The opec cut has caught markets off guard."
        ),
        "url": "https://bloomberg.com/article/opec-cut-production",
        "relevance_keywords": ["opec cut", "crude oil", "price surge", "shortage"]
    },
    {
        "title": "India's Coal Shortage Worsens, Power Plants at 4-Day Stock",
        "source": "Economic Times",
        "published_at": _days(1),
        "description": (
            "Coal stocks at thermal power plants across India have fallen to a critical 4-day level, "
            "triggering fears of widespread power outages in multiple states."
        ),
        "content": (
            "The Central Electricity Authority warned that 56 of India's 173 thermal power plants "
            "have critically low coal inventories. Maharashtra, UP, and Rajasthan are worst affected. "
            "The coal shortage is partly due to heavy monsoon disrupting supply chain logistics. "
            "Grid failure risk is elevated in southern and western India including Pune."
        ),
        "url": "https://economictimes.com/coal-shortage-power-plants",
        "relevance_keywords": ["coal shortage", "power outage", "grid failure", "shortage", "India"]
    },
    {
        "title": "Russia-Ukraine War: Wheat Export Ban Threatens Global Food Supply",
        "source": "BBC News",
        "published_at": _days(2),
        "description": (
            "Ukraine has suspended wheat exports following renewed Russian military strikes on port "
            "infrastructure at Odessa, disrupting a key global grain supply corridor."
        ),
        "content": (
            "Ukraine accounts for 10% of global wheat exports. The wheat ban and shipping disruption "
            "are already driving food inflation in import-dependent nations. India, which recently "
            "imposed its own wheat export restriction to protect domestic supply, could see domestic "
            "prices spike if import alternatives dry up. Food inflation in India rose 6.8% last month."
        ),
        "url": "https://bbc.com/news/ukraine-wheat-export-ban",
        "relevance_keywords": ["wheat ban", "war", "food inflation", "export restriction", "disruption"]
    },
    {
        "title": "India Fuel Shortage: Petrol Pumps in Maharashtra Report Supply Gaps",
        "source": "The Hindu",
        "published_at": _days(2),
        "description": (
            "Several petrol pumps across Maharashtra, including parts of Pune district, reported "
            "supply delays of 24–48 hours amid rising crude oil import costs and logistical bottlenecks."
        ),
        "content": (
            "Fuel distributors cited the price surge in international crude markets as the primary cause. "
            "HPCL and BPCL have been directed to prioritize supply to urban centers. "
            "Panic buying was observed at some stations in Hadapsar, Katraj, and Hinjewadi areas. "
            "The fuel crisis could worsen if the Hormuz situation escalates further."
        ),
        "url": "https://thehindu.com/india-fuel-shortage-maharashtra",
        "relevance_keywords": ["fuel crisis", "shortage", "panic buying", "India", "Maharashtra"]
    },
    {
        "title": "Middle East Military Escalation Rattles Oil Markets",
        "source": "Reuters",
        "published_at": _days(2),
        "description": (
            "Military escalation between Israel and Iran-backed groups has prompted risk premium "
            "pricing in oil futures markets, with Brent crude hitting $91.50 per barrel."
        ),
        "content": (
            "Analysts at Goldman Sachs warn that sustained military escalation could push Brent to $110 "
            "if shipping through the Persian Gulf is materially disrupted. "
            "India's oil import bill could swell by $20 billion annually at those levels. "
            "The geopolitical tension is also affecting LPG and naphtha procurement chains."
        ),
        "url": "https://reuters.com/middle-east-military-escalation-oil",
        "relevance_keywords": ["military escalation", "conflict", "crude oil", "disruption", "missile"]
    },
    {
        "title": "Global Shipping Container Shortage Hits India's Supply Chains",
        "source": "Financial Times",
        "published_at": _days(3),
        "description": (
            "A critical shortage of shipping containers at major Indian ports has caused freight "
            "rates to surge 180%, severely impacting import timelines for essential goods."
        ),
        "content": (
            "Ports at Nhava Sheva, Chennai, and Mundra are experiencing container shortage of over 40%. "
            "Supply chain disruptions are delaying imports of edible oils, fertilizers, and electronics. "
            "The logistics bottleneck is expected to ease only in 6–8 weeks, logistics experts say. "
            "India's just-in-time supply chain model is particularly vulnerable to such freight surge events."
        ),
        "url": "https://ft.com/global-shipping-container-shortage",
        "relevance_keywords": ["container shortage", "supply chain", "freight surge", "disruption", "India"]
    },
    {
        "title": "India Power Grid Faces Record Demand as Summer Heatwave Intensifies",
        "source": "NDTV",
        "published_at": _days(3),
        "description": (
            "India's power grid is under severe strain with peak demand hitting 230 GW, "
            "surpassing the previous record, as an intense heatwave grips northern and western India."
        ),
        "content": (
            "The National Load Despatch Centre issued an emergency alert for load shedding protocols. "
            "Maharashtra, Gujarat, and Rajasthan face 4–6 hours of daily power cuts. "
            "Pune's grid is operating at 97% capacity. Air conditioning load has pushed demand to historic highs. "
            "Power outage warnings have been issued for industrial areas in Hinjewadi and Pimpri-Chinchwad."
        ),
        "url": "https://ndtv.com/india-power-grid-demand-heatwave",
        "relevance_keywords": ["power outage", "grid failure", "heatwave", "India", "Pune"]
    },
    {
        "title": "Red Sea Attacks: Shipping Disruption Adds 3 Weeks to Cargo Transit",
        "source": "Bloomberg",
        "published_at": _days(4),
        "description": (
            "Houthi missile attacks in the Red Sea have forced major shipping lines to reroute "
            "around the Cape of Good Hope, adding 3 weeks and significant cost to cargo journeys."
        ),
        "content": (
            "Maersk, MSC, and CMA CGM have all announced Red Sea route suspensions. "
            "The rerouting adds $1 million in fuel costs per voyage. "
            "India's oil imports from the Middle East and food grain imports from Eastern Europe "
            "are both impacted by the shipping disruption. "
            "Insurance rates for vessels transiting the Gulf of Aden have tripled."
        ),
        "url": "https://bloomberg.com/red-sea-attacks-shipping-disruption",
        "relevance_keywords": ["missile", "disruption", "shipping lane", "supply chain", "strike"]
    },
    {
        "title": "India LPG Prices Rise 12% as Import Costs Surge",
        "source": "Economic Times",
        "published_at": _days(4),
        "description": (
            "Liquefied petroleum gas prices for commercial cylinders in India have risen 12% this "
            "month following a sharp increase in Saudi Aramco's contract prices and higher freight costs."
        ),
        "content": (
            "Commercial LPG cylinder prices now stand at ₹1,890 per unit, impacting restaurants, "
            "small businesses, and healthcare facilities. Residential LPG prices are partially "
            "shielded by subsidies but the subsidy burden on government has increased significantly. "
            "An lpg shortage in rural Maharashtra was reported last week."
        ),
        "url": "https://economictimes.com/india-lpg-prices-surge",
        "relevance_keywords": ["shortage", "price surge", "India", "fuel crisis", "supply chain"]
    },
    {
        "title": "Pakistan Sanctions Could Disrupt India's Western Border Trade",
        "source": "The Hindu",
        "published_at": _days(5),
        "description": (
            "Escalating sanctions and border tensions between India and Pakistan have raised concerns "
            "about disruption to cross-border trade routes used for agricultural goods and raw materials."
        ),
        "content": (
            "Trade at the Attari-Wagah border has halved in the past two weeks. "
            "Certain vegetables, spices, and dry fruits that transit through Pakistan face supply disruption. "
            "The embargo on direct trade has pushed importers to seek costlier alternative routes. "
            "Food inflation in border states like Punjab and Rajasthan has already ticked up."
        ),
        "url": "https://thehindu.com/pakistan-sanctions-india-trade",
        "relevance_keywords": ["sanctions", "embargo", "disruption", "food inflation", "India"]
    },
    {
        "title": "Cyclone Alert: Bay of Bengal Storm to Impact Odisha, Andhra Coasts",
        "source": "NDTV",
        "published_at": _days(5),
        "description": (
            "A severe cyclonic storm forming in the Bay of Bengal is expected to make landfall "
            "on the Odisha and Andhra Pradesh coasts within 48 hours, threatening lives and supply chains."
        ),
        "content": (
            "The India Meteorological Department issued a red alert for coastal districts. "
            "Port operations at Vishakhapatnam and Paradip have been suspended. "
            "The cyclone is expected to disrupt coal and iron ore shipments affecting thermal power plants "
            "and steel mills downstream. Supply chain experts warn of a 10-day disruption to eastern India "
            "logistics networks."
        ),
        "url": "https://ndtv.com/cyclone-alert-bay-of-bengal",
        "relevance_keywords": ["cyclone", "disruption", "supply chain", "port closure", "India"]
    },
    {
        "title": "OPEC Meeting: Saudi Arabia to Maintain Output Cuts Through Q3",
        "source": "Reuters",
        "published_at": _days(6),
        "description": (
            "Saudi Arabia confirmed it will extend voluntary crude oil output cuts of 1 million "
            "barrels per day through the third quarter, keeping global supply tight."
        ),
        "content": (
            "The decision was widely expected after recent OPEC+ discussions in Vienna. "
            "Analysts say the move will keep Brent crude above $85 per barrel through summer. "
            "Indian refiners are scrambling to lock in alternative supply from Russia, the US, and West Africa. "
            "The sustained opec cut will increase India's oil import bill by an estimated $8 billion this year."
        ),
        "url": "https://reuters.com/opec-saudi-output-cuts-q3",
        "relevance_keywords": ["opec cut", "crude oil", "shortage", "supply chain", "India"]
    },
    {
        "title": "India Wheat Stock Falls to 5-Year Low Amid Climate Disruptions",
        "source": "Business Standard",
        "published_at": _days(6),
        "description": (
            "India's wheat stocks in government warehouses have fallen to their lowest level in five years "
            "due to a poor harvest caused by unusual heat stress during the grain filling stage."
        ),
        "content": (
            "Food Corporation of India reported buffer stock at 28 million tonnes, well below the "
            "norm of 41 million tonnes. The government has suspended wheat exports to protect domestic supply. "
            "Food inflation in urban centers including Pune, Mumbai, and Delhi is rising. "
            "A drought in parts of Madhya Pradesh and Rajasthan could worsen the situation further."
        ),
        "url": "https://business-standard.com/india-wheat-stock-low",
        "relevance_keywords": ["wheat ban", "food shortage", "drought", "food inflation", "India"]
    },
    {
        "title": "Iran-Israel Conflict Risk Puts Middle East Oil Supply on Edge",
        "source": "Bloomberg",
        "published_at": _days(7),
        "description": (
            "Direct military confrontation between Iran and Israel remains a tail risk that "
            "could trigger an immediate blockade of the Strait of Hormuz, analysts warn."
        ),
        "content": (
            "A Brookings Institution scenario analysis shows a Hormuz blockade could cut global oil "
            "supply by 30% within weeks. India would face severe fuel rationing within 60 days. "
            "The Ministry of Petroleum has directed state oil companies to accelerate strategic "
            "reserve filling at underground caverns in Mangaluru, Padur, and Visakhapatnam. "
            "The conflict risk is the single biggest factor in current crude oil volatility."
        ),
        "url": "https://bloomberg.com/iran-israel-conflict-oil-supply",
        "relevance_keywords": ["conflict", "blockade", "strait of hormuz", "war", "rationing", "India"]
    },
    {
        "title": "India's Renewable Energy Grid Struggles with Intermittency During Peak Load",
        "source": "Economic Times",
        "published_at": _days(0),
        "description": (
            "India's rapidly expanding solar and wind capacity is struggling to meet peak evening "
            "demand, requiring thermal backup that is constrained by the ongoing coal shortage."
        ),
        "content": (
            "Grid operators are relying on emergency imports from Bhutan and Nepal to manage frequency. "
            "The power outage risk is highest between 6 PM and 10 PM in major cities. "
            "Pune's electricity distribution company (MSEDCL) has activated demand response protocols "
            "to avoid unplanned blackouts. Industrial consumers in Hinjewadi IT park have been asked "
            "to shift high-load operations to off-peak hours."
        ),
        "url": "https://economictimes.com/india-renewable-grid-peak-load",
        "relevance_keywords": ["power outage", "coal shortage", "grid failure", "India", "Pune", "shortage"]
    },
    {
        "title": "Sanctions on Russia Redirect India's Discounted Oil Flows",
        "source": "Reuters",
        "published_at": _days(1),
        "description": (
            "Western sanctions on Russia are complicating India's ability to secure discounted "
            "Russian crude, with payment settlements and shipping logistics facing new hurdles."
        ),
        "content": (
            "Indian refineries have been purchasing Russian Urals at $10–15 discount to Brent, "
            "but new G7 sanctions are tightening payment routes through UAE intermediaries. "
            "If the sanctions close these channels, India must revert to buying OPEC crude at market prices. "
            "This could add significant pressure on domestic fuel prices and inflation."
        ),
        "url": "https://reuters.com/russia-sanctions-india-oil",
        "relevance_keywords": ["sanctions", "crude oil", "disruption", "supply chain", "India"]
    },
    {
        "title": "Port Workers Strike at Jawaharlal Nehru Port Causes Cargo Backlog",
        "source": "The Hindu",
        "published_at": _days(3),
        "description": (
            "A 48-hour strike by port workers at JNPT (Nhava Sheva) has created a major cargo "
            "backlog, with over 200 vessels waiting to berth, impacting imports across sectors."
        ),
        "content": (
            "The strike was called over wage disputes and working conditions. "
            "The shutdown at JNPT, India's largest container port, has delayed shipments of "
            "consumer goods, chemicals, and food items. The logistics disruption is expected to "
            "take 7–10 days to clear even after the strike ends. "
            "Supply chain experts warn of short-term hoarding behavior in Mumbai and Pune."
        ),
        "url": "https://thehindu.com/jnpt-port-workers-strike",
        "relevance_keywords": ["shutdown", "disruption", "supply chain", "hoarding", "port closure"]
    },
    {
        "title": "India's Food Price Inflation Hits 8.5% as Vegetable Prices Spike",
        "source": "Business Standard",
        "published_at": _days(4),
        "description": (
            "Consumer food price inflation in India accelerated to 8.5% in the latest reading, "
            "driven by a 45% spike in vegetable prices following unseasonal rains and supply disruptions."
        ),
        "content": (
            "Onion prices in Pune wholesale markets doubled in two weeks. "
            "Tomato and potato prices are also significantly elevated. "
            "The food inflation surge is partly attributed to disrupted logistics from Maharashtra's "
            "flooding and transport strikes in Nashik. The government has released buffer stocks "
            "of onion and potato from NAFED reserves to cool prices."
        ),
        "url": "https://business-standard.com/india-food-price-inflation",
        "relevance_keywords": ["food inflation", "disruption", "shortage", "India", "Pune", "flood"]
    },
    {
        "title": "Asia Oil Demand Surges as China Reopening Boosts Consumption",
        "source": "Bloomberg",
        "published_at": _days(5),
        "description": (
            "China's full economic reopening is driving a surge in Asian oil demand, adding "
            "pressure to already tight global crude supplies and pushing prices higher."
        ),
        "content": (
            "Chinese crude imports hit a record 12.5 million barrels per day in the latest data. "
            "This demand surge, combined with OPEC production cuts, has pushed Brent crude to multi-year highs. "
            "India is now competing with China for the same pool of discounted Russian and West African crude. "
            "The price surge is being transmitted directly to India's fuel import bill."
        ),
        "url": "https://bloomberg.com/asia-oil-demand-china-reopening",
        "relevance_keywords": ["crude oil", "price surge", "supply chain", "shortage", "opec cut"]
    }
]


def fetch_crisis_news(keywords: Optional[List[str]] = None) -> List[Dict]:
    """
    Fetch crisis-related news articles.
    Uses NewsAPI if key is configured, otherwise returns hardcoded fallback data.
    Results are cached for NEWS_CACHE_TTL seconds.
    """
    now = time.time()
    if _news_cache["data"] is not None and (now - _news_cache["timestamp"]) < config.NEWS_CACHE_TTL:
        logger.debug("Returning cached news data")
        return _news_cache["data"]

    if config.NEWSAPI_KEY:
        try:
            articles = _fetch_from_newsapi(keywords)
            _news_cache["data"] = articles
            _news_cache["timestamp"] = now
            return articles
        except Exception as exc:
            logger.warning("NewsAPI fetch failed: %s — falling back to sample data", exc)

    # Use fallback data
    articles = list(FALLBACK_ARTICLES)
    _news_cache["data"] = articles
    _news_cache["timestamp"] = now
    return articles


def _fetch_from_newsapi(keywords: Optional[List[str]] = None) -> List[Dict]:
    """Call the real NewsAPI."""
    default_keywords = [
        "oil price", "fuel shortage", "OPEC", "Strait of Hormuz",
        "India supply chain", "power outage India", "coal shortage",
        "wheat export", "food inflation India", "shipping disruption"
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
        articles.append({
            "title": art.get("title", ""),
            "source": art.get("source", {}).get("name", "Unknown"),
            "published_at": art.get("publishedAt", ""),
            "description": art.get("description", ""),
            "content": art.get("content", ""),
            "url": art.get("url", ""),
            "relevance_keywords": [],
        })
    return articles


def fetch_gdelt_events(theme: str = "CRISIS", country: str = "IN") -> List[Dict]:
    """
    Fetch events from GDELT API.
    Falls back to sample events if unavailable.
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
        logger.warning("GDELT fetch failed: %s — using sample data", exc)

    sample_events = _get_sample_gdelt_events()
    _gdelt_cache["data"] = sample_events
    _gdelt_cache["timestamp"] = now
    return sample_events


def _fetch_from_gdelt(theme: str, country: str) -> List[Dict]:
    """Call the real GDELT API."""
    params = {
        "query": f"theme:{theme} sourcecountry:{country}",
        "mode": "artlist",
        "maxrecords": 25,
        "format": "json",
    }
    resp = requests.get(config.GDELT_BASE_URL, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    events = []
    for art in data.get("articles", []):
        events.append({
            "title": art.get("title", ""),
            "url": art.get("url", ""),
            "source": art.get("domain", "Unknown"),
            "published_at": art.get("seendate", ""),
            "tone": art.get("tone", 0),
        })
    return events


def _get_sample_gdelt_events() -> List[Dict]:
    """Realistic sample GDELT events."""
    base_time = datetime.utcnow()
    return [
        {
            "title": "India Oil Ministry Emergency Meeting on Supply Disruption",
            "url": "https://example-news.com/india-oil-ministry",
            "source": "thehindu.com",
            "published_at": (base_time - timedelta(hours=2)).strftime("%Y%m%dT%H%M%SZ"),
            "tone": -4.5,
        },
        {
            "title": "Hormuz Tanker Seizure Sends Shockwaves Through Asian Markets",
            "url": "https://example-news.com/hormuz-tanker",
            "source": "reuters.com",
            "published_at": (base_time - timedelta(hours=5)).strftime("%Y%m%dT%H%M%SZ"),
            "tone": -6.2,
        },
        {
            "title": "India Coal Imports Surge as Domestic Shortage Deepens",
            "url": "https://example-news.com/india-coal-imports",
            "source": "economictimes.com",
            "published_at": (base_time - timedelta(hours=8)).strftime("%Y%m%dT%H%M%SZ"),
            "tone": -3.8,
        },
        {
            "title": "Wheat Prices in India Up 22% After Global Supply Shock",
            "url": "https://example-news.com/wheat-prices-india",
            "source": "business-standard.com",
            "published_at": (base_time - timedelta(hours=12)).strftime("%Y%m%dT%H%M%SZ"),
            "tone": -5.1,
        },
        {
            "title": "Maharashtra Power Cuts Extended as Grid Strain Continues",
            "url": "https://example-news.com/maharashtra-power-cuts",
            "source": "ndtv.com",
            "published_at": (base_time - timedelta(hours=18)).strftime("%Y%m%dT%H%M%SZ"),
            "tone": -4.9,
        },
    ]


def invalidate_news_cache() -> None:
    """Force cache invalidation on next fetch."""
    _news_cache["timestamp"] = 0
    _gdelt_cache["timestamp"] = 0
