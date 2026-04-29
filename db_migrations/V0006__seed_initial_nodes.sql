INSERT INTO nodes (name, host, area, note, enabled) VALUES
  ('Биллинг', 'lk.arttele.ru', 'Сервер', 'Личный кабинет и API', TRUE),
  ('PON34-2', '10.34.102.1', 'Район 34', 'OLT/PON порт', FALSE),
  ('PON34-4', '10.34.104.1', 'Район 34', 'OLT/PON порт', FALSE),
  ('PON36-4', '10.36.104.1', 'Район 36', 'OLT/PON порт', FALSE)
ON CONFLICT (name) DO NOTHING;