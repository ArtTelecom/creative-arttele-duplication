ALTER TABLE t_p33656588_creative_arttele_dup.locations
    ADD COLUMN IF NOT EXISTS tariffs JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Общая линейка тарифов для всех районов, кроме Плодородного
UPDATE t_p33656588_creative_arttele_dup.locations SET tariffs = '[
{"name":"Лайт","speed":"30","price":"500","color":"blue","popular":false,"features":["30 Мбит/с","Безлимит","Поддержка 24/7"]},
{"name":"Базовый","speed":"50","price":"800","color":"blue","popular":false,"features":["50 Мбит/с","Безлимит","Поддержка 24/7"]},
{"name":"Комфорт","speed":"100","price":"1000","color":"blue","popular":false,"features":["100 Мбит/с","Безлимит","Поддержка 24/7"]},
{"name":"Старт","speed":"200","price":"1300","color":"green","popular":false,"features":["200 Мбит/с","Безлимит","Поддержка 24/7"]},
{"name":"Оптима","speed":"300","price":"1500","color":"green","popular":true,"features":["300 Мбит/с","Безлимит","Поддержка 24/7","__social__"]},
{"name":"Премиум","speed":"500","price":"1700","color":"purple","popular":false,"features":["500 Мбит/с","Безлимит","Поддержка 24/7","__social__"]},
{"name":"Ультра","speed":"600","price":"1900","color":"purple","popular":false,"features":["600 Мбит/с","Безлимит","Поддержка 24/7","__social__"]},
{"name":"Максимум","speed":"1000","price":"2700","color":"purple","popular":false,"features":["1 Гбит/с","Безлимит","Поддержка 24/7","__social__"]},
{"name":"Гигабит+","speed":"2500","price":"5000","color":"purple","popular":false,"badge":"Для ИП и ООО","features":["2.5 Гбит/с","Безлимит","Приоритетная поддержка","Только для ИП и ООО","__social__"]}
]'::jsonb
WHERE slug <> 'plodorodniy';

-- Плодородный — свои тарифы
UPDATE t_p33656588_creative_arttele_dup.locations SET tariffs = '[
{"name":"Комфорт","speed":"100","price":"1250","color":"blue","popular":false,"features":["100 Мбит/с","Безлимит","Поддержка 24/7"]},
{"name":"Старт","speed":"200","price":"1400","color":"green","popular":false,"features":["200 Мбит/с","Безлимит","Поддержка 24/7"]},
{"name":"Оптима","speed":"300","price":"1600","color":"green","popular":true,"features":["300 Мбит/с","Безлимит","Поддержка 24/7","__social__"]},
{"name":"Премиум","speed":"500","price":"1800","color":"purple","popular":false,"features":["500 Мбит/с","Безлимит","Поддержка 24/7","__social__"]}
]'::jsonb
WHERE slug = 'plodorodniy';