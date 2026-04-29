CREATE TABLE IF NOT EXISTS nodes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL,
    area VARCHAR(255) DEFAULT '',
    note TEXT DEFAULT '',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS node_checks (
    id SERIAL PRIMARY KEY,
    node_id INTEGER NOT NULL,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    online BOOLEAN NOT NULL,
    latency_ms INTEGER DEFAULT NULL,
    error TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_node_checks_node_time ON node_checks(node_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS node_state (
    node_id INTEGER PRIMARY KEY,
    online BOOLEAN NOT NULL DEFAULT TRUE,
    last_online_at TIMESTAMPTZ DEFAULT NOW(),
    last_check_at TIMESTAMPTZ DEFAULT NOW(),
    fail_streak INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT NULL
);