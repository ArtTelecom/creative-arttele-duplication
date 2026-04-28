CREATE TABLE IF NOT EXISTS speed_history (
    id BIGSERIAL PRIMARY KEY,
    login TEXT NOT NULL,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    in_kbps INTEGER NOT NULL DEFAULT 0,
    out_kbps INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_speed_history_login_ts ON speed_history (login, ts DESC);