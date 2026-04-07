CREATE TABLE IF NOT EXISTS risk_snapshots (
    id BIGSERIAL PRIMARY KEY,
    city TEXT NOT NULL,
    ward TEXT,
    fuel NUMERIC(6, 2) NOT NULL,
    food NUMERIC(6, 2) NOT NULL,
    transport NUMERIC(6, 2) NOT NULL,
    power NUMERIC(6, 2) NOT NULL,
    overall NUMERIC(6, 2) NOT NULL,
    oil_price NUMERIC(10, 2),
    sentiment NUMERIC(6, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_city_ward_created_at
    ON risk_snapshots(city, ward, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_created_at
    ON risk_snapshots(created_at DESC);

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    headline TEXT NOT NULL,
    sentiment NUMERIC(6, 4),
    severity TEXT NOT NULL,
    services TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_created_at
    ON events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_severity_created_at
    ON events(severity, created_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity_created_at
    ON alerts(severity, created_at DESC);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users(created_at DESC);

-- ---------------------------------------------------------------------------
-- Time-series retention and optional partition maintenance helpers
-- ---------------------------------------------------------------------------
-- NOTE:
-- 1) Current MVP tables above remain plain tables for compatibility.
-- 2) If/when converted to RANGE-partitioned parents on created_at,
--    create_monthly_partition(...) and drop_old_partitions(...) can manage them.
-- 3) cleanup_old_analytics_data(...) provides retention even before partitioning.

CREATE OR REPLACE FUNCTION create_monthly_partition(parent_table TEXT, for_date DATE)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    month_start DATE := date_trunc('month', for_date)::date;
    month_end DATE := (date_trunc('month', for_date) + interval '1 month')::date;
    partition_name TEXT := format('%s_%s', parent_table, to_char(month_start, 'YYYYMM'));
    parent_is_partitioned BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_partitioned_table p
        JOIN pg_class c ON c.oid = p.partrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = parent_table
    ) INTO parent_is_partitioned;

    IF NOT parent_is_partitioned THEN
        RETURN;
    END IF;

    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L);',
        partition_name,
        parent_table,
        month_start,
        month_end
    );
END;
$$;

CREATE OR REPLACE FUNCTION drop_old_partitions(parent_table TEXT, keep_months INTEGER DEFAULT 3)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_suffix TEXT := to_char(date_trunc('month', now()) - make_interval(months => keep_months), 'YYYYMM');
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT c.relname AS partition_name
        FROM pg_inherits i
        JOIN pg_class p ON p.oid = i.inhparent
        JOIN pg_namespace pn ON pn.oid = p.relnamespace
        JOIN pg_class c ON c.oid = i.inhrelid
        JOIN pg_namespace cn ON cn.oid = c.relnamespace
        WHERE pn.nspname = 'public'
          AND cn.nspname = 'public'
          AND p.relname = parent_table
    LOOP
        IF rec.partition_name ~ ('^' || parent_table || '_[0-9]{6}$')
           AND right(rec.partition_name, 6) < cutoff_suffix THEN
            EXECUTE format('DROP TABLE IF EXISTS %I;', rec.partition_name);
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(retention_days INTEGER DEFAULT 90)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM risk_snapshots WHERE created_at < now() - make_interval(days => retention_days);
    DELETE FROM events WHERE created_at < now() - make_interval(days => retention_days);
    DELETE FROM alerts WHERE created_at < now() - make_interval(days => retention_days);

    PERFORM drop_old_partitions('risk_snapshots', 3);
    PERFORM drop_old_partitions('events', 3);
    PERFORM drop_old_partitions('alerts', 3);
END;
$$;

-- Example scheduling (if pg_cron extension is enabled):
-- SELECT cron.schedule('cityshield_retention', '15 2 * * *', $$SELECT cleanup_old_analytics_data(90);$$);
