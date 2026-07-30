CREATE TABLE IF NOT EXISTS t_p33656588_creative_arttele_dup.payments (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT,
    login TEXT,
    account TEXT,
    fio TEXT,
    amount NUMERIC(12,2),
    bank_status TEXT,
    payment_id TEXT,
    credited BOOLEAN DEFAULT FALSE,
    balance_before TEXT,
    balance_after TEXT,
    error TEXT,
    raw_body TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_login ON t_p33656588_creative_arttele_dup.payments (login);
CREATE INDEX IF NOT EXISTS idx_payments_order ON t_p33656588_creative_arttele_dup.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON t_p33656588_creative_arttele_dup.payments (created_at DESC);