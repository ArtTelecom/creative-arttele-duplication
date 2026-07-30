-- ТВ-тарифы (интернет+ТВ)
CREATE TABLE IF NOT EXISTS t_p33656588_creative_arttele_dup.tv_tariffs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    internet TEXT NOT NULL DEFAULT '',
    price TEXT NOT NULL DEFAULT '',
    channels TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'blue',
    popular BOOLEAN NOT NULL DEFAULT FALSE,
    promo TEXT NOT NULL DEFAULT '',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO t_p33656588_creative_arttele_dup.tv_tariffs (name, internet, price, channels, color, popular, promo, features, sort_order) VALUES
('Старт + ТВ','50','1100','120','blue',FALSE,'', '["50 Мбит/с","120 каналов HD","Wink — фильмы и сериалы","Поддержка 24/7"]',1),
('Оптима + ТВ','100','1350','200','green',FALSE,'Приставка бесплатно 3 мес', '["100 Мбит/с","200 каналов HD/4K","Wink — Premium подписка","ТВ-приставка в аренду","Поддержка 24/7"]',2),
('Оптима+ + ТВ','150','1600','250','green',TRUE,'Первый месяц — 1 ₽', '["150 Мбит/с","250 каналов HD/4K","Wink — Premium + Детский","ТВ-приставка в аренду","Поддержка 24/7","__social__"]',3),
('Комфорт + ТВ','200','1750','300','purple',FALSE,'Приставка в подарок', '["200 Мбит/с","300 каналов HD/4K","Wink — Ultra подписка","ТВ-приставка в подарок","Запись эфира 7 дней","Поддержка 24/7"]',4),
('Про + ТВ','300','1950','350','purple',FALSE,'', '["300 Мбит/с","350 каналов HD/4K","Wink — Ultra + Спорт","ТВ-приставка 4K в подарок","Запись эфира 14 дней","Поддержка 24/7"]',5),
('Максимум + ТВ','500','2200','450','purple',FALSE,'Скидка 20% первые 3 мес', '["500 Мбит/с","450+ каналов HD/4K","Wink — Весь контент","ТВ-приставка 4K в подарок","Запись эфира 30 дней","Мультирум — 2 ТВ","Поддержка 24/7"]',6);

-- Услуги на главной
CREATE TABLE IF NOT EXISTS t_p33656588_creative_arttele_dup.services (
    id BIGSERIAL PRIMARY KEY,
    icon TEXT NOT NULL DEFAULT 'Zap',
    title TEXT NOT NULL,
    descr TEXT NOT NULL DEFAULT '',
    tag TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'blue',
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO t_p33656588_creative_arttele_dup.services (icon, title, descr, tag, color, sort_order) VALUES
('Zap','Домашний интернет','Оптоволокно прямо в квартиру. Скорость до 1 Гбит/с без скачков и обрывов — смотрите, играйте, работайте.','До 1 Гбит/с','blue',1),
('Building2','Бизнес-интернет','Выделенный канал с гарантированной скоростью и SLA 99.9%. Персональный менеджер и приоритетная поддержка.','SLA 99.9%','green',2),
('Tv','Цифровое ТВ','450+ каналов в HD и 4K качестве. Запись эфира, пауза и перемотка прямого эфира на любом устройстве.','450+ каналов','purple',3),
('Phone','IP-телефония','Городской номер, бесплатные звонки внутри сети, конференц-связь и детализация в личном кабинете.','Безлимит внутри','blue',4),
('Shield','Антивирус и защита','Защита от вирусов, фишинга и нежелательной рекламы на уровне сети. Работает на всех устройствах.','Всегда включён','green',5),
('Wifi','Wi-Fi роутер','Современный роутер Wi-Fi 6 в аренду или подарок при подключении к тарифу Максимум.','Wi-Fi 6','purple',6);

-- Настройки сайта (контакты и общие тексты)
CREATE TABLE IF NOT EXISTS t_p33656588_creative_arttele_dup.site_settings (
    skey TEXT PRIMARY KEY,
    svalue TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO t_p33656588_creative_arttele_dup.site_settings (skey, svalue, label, sort_order) VALUES
('phone','+7 902 404-88-50','Телефон',1),
('phone_sub','Бесплатно по России','Подпись у телефона',2),
('email','art888018@mail.ru','Электронная почта',3),
('company','АртТелеком Юг','Название компании',4)
ON CONFLICT (skey) DO NOTHING;