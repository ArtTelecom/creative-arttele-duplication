-- Журнал попыток зачисления с защитой от повторного зачисления одного заказа.
-- Уникальный индекс гарантирует: у одного order_id может быть только ОДНО успешное зачисление.
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_credit_per_order
  ON t_p33656588_creative_arttele_dup.payments (order_id)
  WHERE credited;

-- Очередь повторов: строка появляется, когда касса недоступна.
CREATE TABLE IF NOT EXISTS t_p33656588_creative_arttele_dup.credit_retries (
  id            bigserial PRIMARY KEY,
  order_id      text NOT NULL UNIQUE,
  login         text NOT NULL,
  amount        numeric(12,2) NOT NULL,
  payment_id    text DEFAULT '',
  attempts      int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending',
  last_error    text DEFAULT '',
  next_try_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_retries_due
  ON t_p33656588_creative_arttele_dup.credit_retries (next_try_at)
  WHERE status = 'pending';
