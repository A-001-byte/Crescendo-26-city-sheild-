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
