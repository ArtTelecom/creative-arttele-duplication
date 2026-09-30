-- Временная проверочная запись: убеждаемся, что раздел «Зависшие» показывает данные.
-- Удаляется следующей миграцией сразу после проверки.
INSERT INTO t_p33656588_creative_arttele_dup.credit_retries
  (order_id, login, amount, payment_id, attempts, status, last_error, next_try_at)
VALUES
  ('SELFTEST-ui-check', 'SELFTEST', 1.00, '', 2, 'pending',
   'The read operation timed out', now() + interval '5 minutes')
ON CONFLICT (order_id) DO NOTHING;
