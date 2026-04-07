import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # API Keys
    NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
    ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")
    TWILIO_SID = os.getenv("TWILIO_SID", "")
    TWILIO_AUTH = os.getenv("TWILIO_AUTH", "")

    # Flask settings
    SECRET_KEY = os.getenv("FLASK_SECRET", "cityshield-dev-secret-key-2024")
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXP_MINUTES = int(os.getenv("JWT_EXP_MINUTES", "1440"))

    # External API base URLs
    GDELT_BASE_URL = os.getenv(
        "GDELT_BASE_URL",
        "https://api.gdeltproject.org/api/v2/doc/doc"
    )
    NEWSAPI_BASE_URL = os.getenv(
        "NEWSAPI_BASE_URL",
        "https://newsapi.org/v2/everything"
    )
    ALPHA_VANTAGE_BASE_URL = os.getenv(
        "ALPHA_VANTAGE_BASE_URL",
        "https://www.alphavantage.co/query"
    )
    GDELT_TIMEOUT = float(os.getenv("GDELT_TIMEOUT", "10"))

    # Cache TTLs (seconds)
    NEWS_CACHE_TTL = int(os.getenv("NEWS_CACHE_TTL", "900"))   # 15 minutes
    OIL_CACHE_TTL = int(os.getenv("OIL_CACHE_TTL", "1800"))   # 30 minutes

    # City config
    CITY = os.getenv("CITY", "Pune")
    COUNTRY_CODE = os.getenv("COUNTRY_CODE", "IN")

    # Scheduler
    REFRESH_INTERVAL_MINUTES = int(os.getenv("REFRESH_INTERVAL_MINUTES", "15"))

    # Model warm-up — set PREWARM_BERT=false to skip (e.g. in test environments)
    PREWARM_BERT = os.getenv("PREWARM_BERT", "true").lower() in ("true", "1", "yes")

    # PostgreSQL (Neon)
    NEON_DATABASE_URL = os.getenv("NEON_DATABASE_URL", os.getenv("DATABASE_URL", ""))
    DB_POOL_MIN_CONN = int(os.getenv("DB_POOL_MIN_CONN", "1"))
    DB_POOL_MAX_CONN = int(os.getenv("DB_POOL_MAX_CONN", "5"))

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")


config = Config()
