# Оплата Т-Банком — статус и что доделать

## Текущее состояние
Онлайн-оплата ОТКЛЮЧЕНА на фронте — показывается баннер «Онлайн-оплата временно недоступна»
(`src/pages/dashboard/PaymentBanner.tsx`). Вся серверная логика готова и сохранена.

## Что уже готово (работает)
- **Backend `backend/tbank-pay/index.py`**:
  - `action=create` — создание платёжной ссылки Т-Банк (Init API + подпись Token). ✅ Проверено.
  - `action=notify` — приём webhook от банка. ✅ Уведомления доходят, подпись проходит (статусы AUTHORIZED/CONFIRMED).
  - `action=diag` — диагностика секретов.
  - `action=dbtest` — проверка подключения к БД MikroBill.
  - `_credit_to_billing()` — зачисление напрямую в БД MikroBill (MySQL, PyMySQL): UPDATE баланса + INSERT в историю, защита от дублей по order_id.
- **Секреты заведены**: TBANK_TERMINAL_KEY, TBANK_PASSWORD (заполнены).
- **Notification URL** (прописать в кабинете Т-Банка):
  `https://functions.poehali.dev/740464df-96c9-4053-b7ad-d737892f97ca?action=notify`
- **Готовый PHP-модуль** `public/mikrobill-api.php` (запасной вариант через HTTP, не используется сейчас) — есть action=pay.

## Что осталось доделать (для запуска)
Выбрать способ зачисления денег на счёт абонента:

### Вариант А (выбран) — прямое подключение к БД MikroBill
1. Заполнить секреты (в прошлый раз НЕ сохранились — нужно ввести и нажать сохранить):
   - MIKROBILL_DB_HOST (внешний адрес сервера БД, напр. lk.arttele.ru)
   - MIKROBILL_DB_NAME (обычно mikrobill)
   - MIKROBILL_DB_USER (напр. root)
   - MIKROBILL_DB_PASS
2. Проверить подключение: открыть в браузере
   `https://functions.poehali.dev/740464df-96c9-4053-b7ad-d737892f97ca?action=dbtest`
   - `{"ok":true, users_table, deposit_col, pay_table}` → база на связи.
   - `DB connect failed` → порт MySQL (3306) закрыт фаерволом для внешних подключений → открыть доступ ИЛИ выбрать вариант Б/В.

### Вариант Б — PHP-модуль на сервере
Залить `public/mikrobill-api.php` на сервер lk.arttele.ru, вписать DB_NAME/DB_USER/DB_PASS/API_KEY,
проверить `?action=ping`. Тогда вернуть в `_credit_to_billing` вызов по HTTP (MIKROBILL_API_URL + MIKROBILL_API_KEY).

### Вариант В — эмуляция кассира
Логиниться в кассу MikroBill (KASSA_LOGIN/KASSA_PASS) и отправлять форму «внести платёж» —
если такая форма в кассе существует. Нужно изучить страницу внесения платежа в кассе.

## Как вернуть оплату на фронт (когда зачисление заработает)
1. `src/pages/dashboard/PaymentBanner.tsx` — вернуть форму оплаты (сумма + кнопка «Оплатить»,
   POST на `tbank-pay?action=create` с login/amount/email/phone/return_url).
2. `src/pages/dashboard/DashboardTabsTop.tsx` — передать в PaymentBanner login/email/phone.
3. `src/pages/DashboardPage.tsx` — вернуть обработку `?paid=` и показ `PaymentSuccess`.
4. Компонент `src/pages/dashboard/PaymentSuccess.tsx` — уже есть в проекте.

(Старые версии этих файлов с оплатой — в истории git, коммиты до 43708f8.)

## Идеи на потом
- Уведомление в Telegram о каждой успешной оплате (бот уже подключён: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).
- Кнопка «Я оплатил — проверить платёж» (опрос статуса в Т-Банке как подстраховка на случай несработавшего webhook).
