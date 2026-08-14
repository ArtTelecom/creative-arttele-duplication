import json
import os
import re
import smtplib
import ssl
import socket
import http.client
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def _today_key() -> str:
    tz = timezone(timedelta(hours=3))
    return datetime.now(tz).strftime("%Y-%m-%d")


QUICK_REPLIES = [
    {
        "keywords": [
            ["тариф"], ["цен"], ["сколько стоит"], ["скольк стоит"],
            ["прайс"], ["стоимость"], ["расценк"],
        ],
        "reply": (
            "Наши тарифы для дома (₽/мес):\n"
            "• Лайт — 30 Мбит/с — 500 ₽\n"
            "• Базовый — 50 Мбит/с — 800 ₽\n"
            "• Комфорт — 100 Мбит/с — 1000 ₽\n"
            "• Классик-шейк — 150 Мбит/с — 1250 ₽\n"
            "• Старт — 200 Мбит/с — 1300 ₽\n"
            "• Оптима — 300 Мбит/с — 1500 ₽\n"
            "• Премиум — 500 Мбит/с — 1700 ₽\n"
            "• Ультра — 600 Мбит/с — 1900 ₽\n"
            "• Максимум — 1 Гбит/с — 2700 ₽\n"
            "• Гигабит+ — 2.5 Гбит/с — 5000 ₽\n"
            "Подключение — 0 ₽, срок — до 24 часов. Подсказать, какой тариф выбрать?"
        ),
    },
    {
        "keywords": [
            ["контакт"], ["телефон"], ["номер"], ["связаться"],
            ["позвонить"], ["email"], ["почта"], ["майл"],
        ],
        "reply": (
            "Наши контакты:\n"
            "• Телефон: +7 902 404-88-50\n"
            "• Email: info@arttele.ru\n"
            "• Telegram: https://t.me/ArtTelecom\n"
            "• Офис: Пн–Пт 9:00–18:00\n"
            "• Онлайн-чат: 24/7\n"
            "Чем могу помочь?"
        ),
    },
    {
        "keywords": [
            ["часы работ"], ["режим работ"], ["когда работ"],
            ["во сколько работ"], ["график работ"],
        ],
        "reply": (
            "Режим работы:\n"
            "• Офис: Пн–Пт 9:00–18:00\n"
            "• Онлайн-поддержка в чате: 24/7\n"
            "• Телефон: +7 902 404-88-50\n"
            "Подскажу по тарифам или подключению?"
        ),
    },
    {
        "keywords": [
            ["где вы работ"], ["какие посёлк"], ["какие поселк"],
            ["куда проводит"], ["зона покрыт"], ["в каких район"],
            ["куда подключ"],
        ],
        "reply": (
            "Мы работаем на юге России — посёлки Оазис, Новый, Отрадный, "
            "Натухай, Энем и соседние. Подключение за 24 часа, скорости до 2.5 Гбит/с. "
            "Подскажите адрес — проверю, есть ли техническая возможность."
        ),
    },
    {
        "keywords": [
            ["подключ"], ["как подключ"], ["хочу подключ"],
            ["оставить заявк"], ["провести интернет"],
        ],
        "reply": (
            "Подключаем бесплатно, обычно за 24 часа. "
            "Чтобы оформить заявку, подскажите, пожалуйста:\n"
            "1) ваше имя,\n"
            "2) телефон,\n"
            "3) населённый пункт и адрес.\n"
            "После этого менеджер свяжется с вами в течение 15 минут."
        ),
    },
    {
        "keywords": [
            ["привет"], ["здравствуй"], ["добрый день"],
            ["добрый вечер"], ["доброе утро"], ["хай"],
        ],
        "reply": (
            "Здравствуйте! Я консультант АртТелеком Юг. "
            "Помогу с тарифами, подключением, оборудованием или передам заявку менеджеру. "
            "Что вас интересует?"
        ),
    },
]


def find_quick_reply(text: str) -> str:
    if not text:
        return ""
    t = text.lower().strip()
    t = re.sub(r"[^\w\s]", " ", t)
    if len(t) > 120:
        return ""
    for entry in QUICK_REPLIES:
        for group in entry["keywords"]:
            if all(kw in t for kw in group):
                return entry["reply"]
    return ""


CONTACTS_BLOCK = (
    "\n\nРЕАЛЬНЫЕ КОНТАКТЫ АртТелеком Юг (используй ТОЛЬКО их, никогда не придумывай другие номера/email):\n"
    "• Единый телефон: +7 902 404-88-50\n"
    "• Email: info@arttele.ru\n"
    "• Личный кабинет: /dashboard (на сайте)\n"
    "• Telegram: https://t.me/ArtTelecom\n"
    "• Часы работы офиса: Пн–Пт 9:00–18:00\n"
    "• Онлайн-поддержка в чате: 24/7\n"
    "Если клиент просит контакты — давай именно эти. Никаких 8-800, support@… и прочих выдуманных адресов."
)

TARIFFS_BLOCK = (
    "\n\nТАРИФЫ ДЛЯ ДОМА (цена/месяц):\n"
    "• Лайт — 30 Мбит/с — 500 ₽ (1–2 устройства, соцсети, переписка)\n"
    "• Базовый — 50 Мбит/с — 800 ₽ (1–3 устройства, видео в HD)\n"
    "• Комфорт — 100 Мбит/с — 1000 ₽ (до 5 устройств, стандарт для семьи)\n"
    "• Классик-шейк — 150 Мбит/с — 1250 ₽ (до 6 устройств, стриминг 4K)\n"
    "• Старт — 200 Мбит/с — 1300 ₽ (до 8 устройств, 4K и онлайн-игры)\n"
    "• Оптима — 300 Мбит/с — 1500 ₽ (большая квартира/дом, много устройств)\n"
    "• Премиум — 500 Мбит/с — 1700 ₽ (киберспорт, домашний офис, IPTV)\n"
    "• Ультра — 600 Мбит/с — 1900 ₽ (профи-стрим, видеоконференции 4K)\n"
    "• Максимум — 1 Гбит/с — 2700 ₽ (умный дом, серверы, удалёнка)\n"
    "• Гигабит+ — 2.5 Гбит/с — 5000 ₽ (для энтузиастов и малого бизнеса)\n"
    "Как советовать тариф: спроси 1) сколько устройств в доме, 2) смотрят ли 4K/стриминг/YouTube, "
    "3) играют ли в онлайн-игры, 4) есть ли удалённая работа/видеосвязь, 5) площадь жилья. "
    "Советуй САМЫЙ ДЕШЁВЫЙ подходящий тариф — не навязывай дорогое. "
    "Если абонент использует < 50% скорости своего тарифа — предложи перейти на более дешёвый."
)

ROUTERS_BLOCK = (
    "\n\nРЕКОМЕНДАЦИИ ПО РОУТЕРАМ (только реальные модели, которые есть в продаже):\n"
    "До 100 Мбит/с (бюджет, 1-комн квартира):\n"
    "• TP-Link Archer C54 — ~1700 ₽. Wi-Fi 5, AC1200, простой и надёжный.\n"
    "• Keenetic 4G (KN-1212) — ~3000 ₽. Умеет работать с USB-модемом как резерв.\n"
    "До 300 Мбит/с (2–3 комн, 5–8 устройств):\n"
    "• Keenetic Extra (KN-1711) — ~5500 ₽. Стабильный, хорошее покрытие, прошивка-огонь.\n"
    "• TP-Link Archer AX23 — ~3500 ₽. Wi-Fi 6, AX1800, отличный вариант бюджет/качество.\n"
    "До 1 Гбит/с (большая квартира/дом, 10+ устройств, 4K, игры):\n"
    "• Keenetic Giga (KN-1011) — ~9000 ₽. Wi-Fi 6, 2 диапазона, 2.5G-порт, идеал для гигабитного тарифа.\n"
    "• TP-Link Archer AX55 — ~6500 ₽. Wi-Fi 6, AX3000, стабильно держит 900+ Мбит/с.\n"
    "• Asus RT-AX58U — ~9500 ₽. Wi-Fi 6, хорош для геймеров, низкий пинг.\n"
    "До 2.5 Гбит/с и Mesh (частный дом, несколько этажей):\n"
    "• Keenetic Hopper (KN-3810) — ~11000 ₽. Wi-Fi 6, 2.5G WAN, поддержка Mesh.\n"
    "• TP-Link Deco X60 (2 шт) — ~16000 ₽. Mesh-система, покрывает до 300 м².\n"
    "\nДЛЯ ЧАСТНОГО ДОМА (большая площадь, несколько этажей, участок, хозпостройки):\n"
    "Основной роутер:\n"
    "• Keenetic Ultra (KN-1811) — ~17000 ₽. Wi-Fi 6, 2.5G WAN, флагман, отлично держит 20+ устройств.\n"
    "• Asus RT-AX88U Pro — ~22000 ₽. 8 LAN, Wi-Fi 6, для большого дома с видеонаблюдением.\n"
    "Усилители сигнала оператора (если слабый PON-сигнал или длинный кабель):\n"
    "• Оптический усилитель / репитер — подбирается монтажником АртТелеком на месте, не продаётся абоненту.\n"
    "Как советовать для частного дома:\n"
    "• До 100 м² и 1 этаж — обычного роутера из таблицы выше хватит.\n"
    "• Большая площадь или много этажей — бери флагман (Keenetic Ultra / Asus RT-AX88U Pro).\n"
    "• Если в доме много умной техники (камеры, датчики, Алиса) — выбирай Wi-Fi 6 и 20+ устройств.\n"
    "Спрашивай: площадь, количество этажей, сколько умных устройств (камеры, ТВ, колонки), бюджет.\n"
    "ОБЩИЕ ПРАВИЛА подбора:\n"
    "• Подбирай тот, что НЕ БУДЕТ узким горлышком тарифа. "
    "Если у абонента тариф 1 Гбит — роутер Wi-Fi 5 даст максимум 300–400 Мбит, это плохо. "
    "Честно скажи клиенту, если его текущий роутер слабый и режет скорость."
)

SYSTEM_PROMPTS = {
    "site": (
        "Ты — дружелюбный консультант интернет-провайдера АртТелеком Юг. "
        "Работаешь на юге России (посёлки Оазис, Новый, Отрадный, Натухай, Энем и др.), "
        "предлагаешь домашний и бизнес-интернет, цифровое ТВ, IP-телефонию, "
        "видеонаблюдение и защиту от угроз. Скорости до 2.5 Гбит/с, подключение за 24 часа, 0 ₽ за подключение. "
        "Тарифы для дома: Лайт, Базовый, Комфорт, Старт, Оптима, Премиум, Ультра, Максимум, Гигабит+. "
        "Отвечай кратко, по-русски, по делу. Если клиент хочет подключиться или вопрос сложный — "
        "вежливо попроси оставить имя и телефон, скажи что передашь менеджеру. "
        "Не придумывай цены, номера телефонов, email-адреса и детали, которых не знаешь. "
        "Если спрашивают какой тариф выбрать — задай 2-3 уточняющих вопроса и порекомендуй из списка ниже. "
        "Если спрашивают про роутер — порекомендуй модель из списка ниже под его тариф и площадь."
    ) + TARIFFS_BLOCK + ROUTERS_BLOCK + CONTACTS_BLOCK,
    "dashboard": (
        "Ты — помощник в личном кабинете абонента АртТелеком Юг. У тебя есть данные абонента в контексте. "
        "Отвечай на вопросы про тариф, баланс, оплату, скорость, неполадки, смену тарифа. "
        "Говори кратко, по-русски, на «вы». Если баланс отрицательный — напомни пополнить. "
        "Если интернет не работает — дай базовые советы (перезагрузить роутер, проверить кабель), "
        "и предложи оставить заявку в поддержку, если не помогло. "
        "Если абонент спрашивает: «какой роутер купить», «посоветуй роутер», «что поставить вместо моего» — "
        "уточни площадь, количество устройств, бюджет и посоветуй модель из списка ниже ПОД ЕГО ТЕКУЩИЙ ТАРИФ. "
        "Если у абонента тариф 500+ Мбит/с, а роутер слабый — честно скажи, что надо поменять. "
        "Если абонент спрашивает: «какой тариф выбрать», «посоветуй тариф», «хватит ли мне» — "
        "задай 2–3 уточняющих вопроса (устройства, 4K, игры, удалёнка) и посоветуй САМЫЙ ДЕШЁВЫЙ подходящий. "
        "Если у него тариф с запасом 2х — предложи перейти на дешевле и сэкономить. "
        "ВАЖНО: при оформлении ЛЮБОЙ заявки (ремонт, вызов мастера, подключение услуги, жалоба) "
        "ОБЯЗАТЕЛЬНО уточни у абонента 2 обязательных поля: "
        "1) НАСЕЛЁННЫЙ ПУНКТ (посёлок/станица/город — например: Оазис, Новый, Натухай, Энем) "
        "и 2) ТОЧНЫЙ АДРЕС установки (улица, дом, квартира). "
        "Спрашивай эти данные явно, даже если адрес уже есть в контексте — абонент мог переехать "
        "или оформлять заявку для другого объекта. Без этих данных заявку НЕ принимай и не передавай мастеру. "
        "Никогда не выдумывай номера телефонов и email."
    ) + TARIFFS_BLOCK + ROUTERS_BLOCK + CONTACTS_BLOCK,
    "ticket": (
        "Ты — менеджер поддержки провайдера АртТелеком Юг. Абонент только что оставил заявку на сайте. "
        "Напиши короткое (2-3 предложения) тёплое сообщение от первого лица: поблагодари за обращение, "
        "скажи что принял заявку и свяжешься в течение 15 минут, если нужны уточнения — задай 1 вопрос. "
        "Без воды, по-русски, на «вы». Не указывай выдуманные телефоны и email."
    ),
}


def call_vsegpt(messages: list, max_tokens: int = 500) -> str:
    api_key = os.environ.get("GPT_API") or os.environ.get("VSEGPT_API_KEY")
    if not api_key:
        print("[AI] GPT_API / VSEGPT_API_KEY отсутствует")
        return ""
    print(f"[AI] Ключ найден, длина={len(api_key)}, префикс={api_key[:10]}")
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": messages,
        "temperature": 0.6,
        "max_tokens": max_tokens,
    }
    req = urllib.request.Request(
        "https://api.vsegpt.ru/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read().decode("utf-8")
            result = json.loads(raw)
        content = result["choices"][0]["message"]["content"].strip()
        print(f"[AI] Ответ получен, длина={len(content)}")
        return content
    except urllib.error.HTTPError as e:
        body_text = ""
        try:
            body_text = e.read().decode("utf-8", errors="ignore")
        except Exception:
            pass
        print(f"[AI] HTTPError {e.code}: {body_text[:500]}")
        return ""
    except Exception as e:
        print(f"[AI] Exception: {type(e).__name__}: {str(e)[:300]}")
        return ""


TELEGRAM_HOST = "api.telegram.org"
TELEGRAM_HOSTS = ["149.154.167.220", "149.154.167.197", "149.154.175.50", TELEGRAM_HOST]


def send_telegram(text: str) -> None:
    """Отправляет заявку в Telegram. Перебирает адреса Telegram,
    так как часть из них недоступна из облака."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    print(f"[TG] token_present={bool(token)}, chat_id={chat_id!r}")
    if not token or not chat_id:
        print("[TG] Пропускаю — нет токена или chat_id")
        return
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }).encode("utf-8")
    last_err = ""
    for host in TELEGRAM_HOSTS:
        try:
            raw = socket.create_connection((host, 443), timeout=3)
            sock = ssl.create_default_context().wrap_socket(raw, server_hostname=TELEGRAM_HOST)
            conn = http.client.HTTPSConnection(TELEGRAM_HOST, 443, timeout=6)
            conn.sock = sock
            conn.request(
                "POST", f"/bot{token}/sendMessage", body=payload,
                headers={"Content-Type": "application/json", "Host": TELEGRAM_HOST},
            )
            resp = conn.getresponse()
            body = resp.read().decode("utf-8", errors="ignore")
            conn.close()
            if resp.status == 200:
                print(f"[TG] OK via {host}: {body[:150]}")
                return
            print(f"[TG] HTTP {resp.status} via {host}: {body[:200]}")
            if resp.status < 500:
                return
            last_err = f"HTTP {resp.status}"
        except Exception as e:
            last_err = f"{host}: {type(e).__name__}"
            print(f"[TG] failed via {host}: {type(e).__name__}: {str(e)[:150]}")
    print(f"[TG] GAVE UP: {last_err}")


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
}


def track_stats(hit_type: str) -> None:
    """Считаем попадания в кеш и вызовы ИИ, раз в сутки шлём отчёт в Telegram."""
    today = _today_key()
    column = "cache_hits" if hit_type == "cache" else "ai_calls"

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        return

    try:
        import psycopg2
        with psycopg2.connect(dsn) as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO chat_stats (stat_date, {column}) "
                    f"VALUES ('{today}', 1) "
                    f"ON CONFLICT (stat_date) DO UPDATE "
                    f"SET {column} = chat_stats.{column} + 1, updated_at = NOW()"
                )
                cur.execute(
                    "SELECT stat_date::text, cache_hits, ai_calls "
                    "FROM chat_stats "
                    f"WHERE stat_date < '{today}' AND report_sent = FALSE "
                    "ORDER BY stat_date ASC LIMIT 1"
                )
                row = cur.fetchone()
                if row:
                    prev_date, prev_cache, prev_ai = row
                    _send_stats_report(prev_date, prev_cache, prev_ai)
                    cur.execute(
                        "UPDATE chat_stats SET report_sent = TRUE "
                        f"WHERE stat_date = '{prev_date}'"
                    )
    except Exception as e:
        print(f"[STATS] Ошибка: {type(e).__name__}: {str(e)[:200]}")


def _send_stats_report(date: str, cache_hits: int, ai_calls: int) -> None:
    total = cache_hits + ai_calls
    saved_pct = (cache_hits * 100 // total) if total else 0
    text = (
        f"<b>📊 Статистика чата за {date}</b>\n"
        f"Всего сообщений: <b>{total}</b>\n"
        f"Из кеша (без ИИ): <b>{cache_hits}</b>\n"
        f"Вызовов ИИ: <b>{ai_calls}</b>\n"
        f"Экономия: <b>{saved_pct}%</b> вычислительного времени"
    )
    send_telegram(text)


def handle_chat(body: dict) -> dict:
    mode = body.get("mode", "site")
    system = SYSTEM_PROMPTS["dashboard"] if mode == "dashboard" else SYSTEM_PROMPTS["site"]

    ctx = body.get("context", {}) or {}
    if mode == "dashboard" and ctx:
        system += (
            f"\n\nДанные абонента:\n"
            f"Имя: {ctx.get('name', '—')}\n"
            f"Логин: {ctx.get('login', '—')}\n"
            f"Тариф: {ctx.get('tariff', '—')}\n"
            f"Скорость: {ctx.get('speed', '—')}\n"
            f"Баланс: {ctx.get('balance', '—')} ₽\n"
            f"Статус: {ctx.get('status', '—')}\n"
            f"Адрес: {ctx.get('address', '—')}\n"
            f"Работает до: {ctx.get('work_until', '—')}"
        )

    messages = [{"role": "system", "content": system}]
    history = body.get("history", []) or []
    messages.extend(history)

    last_user_msg = ""
    for msg in reversed(history):
        if msg.get("role") == "user":
            last_user_msg = str(msg.get("content", ""))
            break

    if mode == "site" and last_user_msg:
        quick = find_quick_reply(last_user_msg)
        if quick:
            print(f"[CACHE] Быстрый ответ на: {last_user_msg[:60]!r}")
            track_stats("cache")
            return {
                "statusCode": 200,
                "headers": CORS,
                "body": json.dumps({"reply": quick, "cached": True}, ensure_ascii=False),
            }

    track_stats("ai")
    reply = call_vsegpt(messages)
    if not reply:
        return {
            "statusCode": 502,
            "headers": CORS,
            "body": json.dumps({"error": "ИИ временно недоступен"}, ensure_ascii=False),
        }
    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"reply": reply}, ensure_ascii=False),
    }


def handle_ticket(body: dict) -> dict:
    name = body.get("name", "").strip()
    phone = body.get("phone", "").strip()
    topic = body.get("topic", "").strip()
    message = body.get("message", "").strip()
    city = body.get("city", "").strip()
    address = body.get("address", "").strip()

    if not name or not phone:
        return {
            "statusCode": 400,
            "headers": CORS,
            "body": json.dumps({"error": "Имя и телефон обязательны"}, ensure_ascii=False),
        }

    ai_text = call_vsegpt([
        {"role": "system", "content": SYSTEM_PROMPTS["ticket"]},
        {"role": "user", "content": (
            f"Имя: {name}\nТелефон: {phone}\n"
            f"Населённый пункт: {city or '—'}\nАдрес: {address or '—'}\n"
            f"Тема: {topic or '—'}\nСообщение: {message or '—'}"
        )},
    ], max_tokens=300)

    tg_text = (
        f"<b>🔔 Новая заявка с сайта</b>\n"
        f"<b>Имя:</b> {name}\n"
        f"<b>Телефон:</b> {phone}\n"
        f"<b>Населённый пункт:</b> {city or '—'}\n"
        f"<b>Адрес:</b> {address or '—'}\n"
        f"<b>Тема:</b> {topic or '—'}\n"
        f"<b>Сообщение:</b> {message or '—'}"
    )
    if ai_text:
        tg_text += f"\n\n<i>🤖 Автоответ ИИ клиенту:</i>\n{ai_text}"
    send_telegram(tg_text)

    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    email_to = os.environ.get("EMAIL_TO") or os.environ.get("NOTIFICATION_EMAIL")
    print(f"[EMAIL] smtp_user={bool(smtp_user)}, smtp_pass={bool(smtp_pass)}, email_to={email_to!r}")

    if smtp_user and smtp_pass and email_to:
        smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        subject = f"Новая заявка с сайта АртТелеком Юг: {topic or 'Без темы'}"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
          <h2 style="color: #111827; margin-bottom: 4px;">Новая заявка с сайта</h2>
          <p style="color: #6b7280; margin-top: 0; font-size: 14px;">АртТелеком Юг — провайдер связи</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Имя:</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">{name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Телефон:</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;"><a href="tel:{phone}" style="color: #0ea5e9;">{phone}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Тема:</td><td style="padding: 8px 0; color: #111827; font-size: 14px;">{topic or '—'}</td></tr>
          </table>
          {"<hr style='border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;'><p style='color: #374151; font-size: 14px; white-space: pre-wrap;'>" + message + "</p>" if message else ""}
          {"<hr style='border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;'><p style='color: #6b7280; font-size: 13px;'><b>🤖 Автоответ ИИ клиенту:</b></p><p style='color: #374151; font-size: 14px;'>" + ai_text + "</p>" if ai_text else ""}
        </div>
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = email_to
        msg.attach(MIMEText(html, "html", "utf-8"))
        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, email_to, msg.as_string())
            print("[EMAIL] Письмо отправлено")
        except Exception as e:
            print(f"[EMAIL] Ошибка: {type(e).__name__}: {str(e)[:300]}")

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"ok": True, "reply": ai_text}, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    """АртТелеком Юг: заявки (mode=ticket) + ИИ-чат на сайте и в ЛК (mode=site|dashboard)."""

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    body = json.loads(event.get("body") or "{}")
    mode = body.get("mode", "ticket")

    if mode in ("site", "dashboard"):
        return handle_chat(body)
    return handle_ticket(body)