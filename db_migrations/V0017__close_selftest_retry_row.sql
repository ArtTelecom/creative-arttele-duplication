-- Закрываем проверочную запись: раздел «Зависшие» проверен, данные отображались корректно.
-- Статус 'done' скрывает её из админки (там показываются только status <> 'done').
UPDATE t_p33656588_creative_arttele_dup.credit_retries
SET status = 'done', last_error = '', updated_at = now()
WHERE order_id = 'SELFTEST-ui-check';
