import logging
import os
from contextlib import contextmanager
from typing import Any, Iterable, Optional

import psycopg2
from psycopg2.pool import ThreadedConnectionPool

logger = logging.getLogger(__name__)

_pool: Optional[ThreadedConnectionPool] = None
_schema_initialized = False


def _get_database_url() -> str:
    return os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL") or ""


def is_db_enabled() -> bool:
    return bool(_get_database_url().strip())


def _init_pool() -> Optional[ThreadedConnectionPool]:
    global _pool

    if _pool is not None:
        return _pool

    db_url = _get_database_url().strip()
    if not db_url:
        logger.warning("NEON_DATABASE_URL/DATABASE_URL not configured; DB features disabled")
        return None

    minconn = int(os.getenv("DB_POOL_MIN_CONN", "1"))
    maxconn = int(os.getenv("DB_POOL_MAX_CONN", "5"))

    _pool = ThreadedConnectionPool(minconn=minconn, maxconn=maxconn, dsn=db_url)
    logger.info("PostgreSQL pool initialized (min=%d max=%d)", minconn, maxconn)
    return _pool


@contextmanager
def get_connection():
    pool = _init_pool()
    if pool is None:
        raise RuntimeError("Database is not configured")

    conn = pool.getconn()
    try:
        yield conn
    finally:
        pool.putconn(conn)


def ensure_schema() -> bool:
    global _schema_initialized

    if _schema_initialized:
        return True

    if not is_db_enabled():
        return False

    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(schema_sql)
        conn.commit()

    _schema_initialized = True
    logger.info("Database schema ensured")
    return True


def execute_write(query: str, params: Optional[Iterable[Any]] = None) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rowcount = cur.rowcount
        conn.commit()
        return rowcount


def fetch_all(query: str, params: Optional[Iterable[Any]] = None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]

    return [dict(zip(columns, row)) for row in rows]


def fetch_one(query: str, params: Optional[Iterable[Any]] = None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            if row is None:
                return None
            columns = [desc[0] for desc in cur.description]

    return dict(zip(columns, row))
