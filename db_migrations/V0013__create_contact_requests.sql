CREATE TABLE IF NOT EXISTS t_p33656588_creative_arttele_dup.contact_requests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'site',
    ai_reply TEXT NOT NULL DEFAULT '',
    telegram_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_error TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_created
    ON t_p33656588_creative_arttele_dup.contact_requests (created_at DESC);
