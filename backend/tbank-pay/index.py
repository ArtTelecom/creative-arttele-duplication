import json
import os
import time
import hashlib
import re
import ssl
import socket
import http.client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request
import urllib.error

TBANK_INIT_URL = "https://securepay.tinkoff.ru/v2/Init"

RUSSIAN_ROOT_CA_PEM = """-----BEGIN CERTIFICATE-----
MIIFwjCCA6qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwcDELMAkGA1UEBhMCUlUx
PzA9BgNVBAoMNlRoZSBNaW5pc3RyeSBvZiBEaWdpdGFsIERldmVsb3BtZW50IGFu
ZCBDb21tdW5pY2F0aW9uczEgMB4GA1UEAwwXUnVzc2lhbiBUcnVzdGVkIFJvb3Qg
Q0EwHhcNMjIwMzAxMjEwNDE1WhcNMzIwMjI3MjEwNDE1WjBwMQswCQYDVQQGEwJS
VTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwgRGV2ZWxvcG1lbnQg
YW5kIENvbW11bmljYXRpb25zMSAwHgYDVQQDDBdSdXNzaWFuIFRydXN0ZWQgUm9v
dCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMfFOZ8pUAL3+r2n
qqE0Zp52selXsKGFYoG0GM5bwz1bSFtCt+AZQMhkWQheI3poZAToYJu69pHLKS6Q
XBiwBC1cvzYmUYKMYZC7jE5YhEU2bSL0mX7NaMxMDmH2/NwuOVRj8OImVa5s1F4U
zn4Kv3PFlDBjjSjXKVY9kmjUBsXQrIHeaqmUIsPIlNWUnimXS0I0abExqkbdrXbX
YwCOXhOO2pDUx3ckmJlCMUGacUTnylyQW2VsJIyIGA8V0xzdaeUXg0VZ6ZmNUr5Y
Ber/EAOLPb8NYpsAhJe2mXjMB/J9HNsoFMBFJ0lLOT/+dQvjbdRZoOT8eqJpWnVD
U+QL/qEZnz57N88OWM3rabJkRNdU/Z7x5SFIM9FrqtN8xewsiBWBI0K6XFuOBOTD
4V08o4TzJ8+Ccq5XlCUW2L48pZNCYuBDfBh7FxkB7qDgGDiaftEkZZfApRg2E+M9
G8wkNKTPLDc4wH0FDTijhgxR3Y4PiS1HL2Zhw7bD3CbslmEGgfnnZojNkJtcLeBH
BLa52/dSwNU4WWLubaYSiAmA9IUMX1/RpfpxOxd4Ykmhz97oFbUaDJFipIggx5sX
ePAlkTdWnv+RWBxlJwMQ25oEHmRguNYf4Zr/Rxr9cS93Y+mdXIZaBEE0KS2iLRqa
OiWBki9IMQU4phqPOBAaG7A+eP8PAgMBAAGjZjBkMB0GA1UdDgQWBBTh0YHlzlpf
BKrS6badZrHF+qwshzAfBgNVHSMEGDAWgBTh0YHlzlpfBKrS6badZrHF+qwshzAS
BgNVHRMBAf8ECDAGAQH/AgEEMA4GA1UdDwEB/wQEAwIBhjANBgkqhkiG9w0BAQsF
AAOCAgEAALIY1wkilt/urfEVM5vKzr6utOeDWCUczmWX/RX4ljpRdgF+5fAIS4vH
tmXkqpSCOVeWUrJV9QvZn6L227ZwuE15cWi8DCDal3Ue90WgAJJZMfTshN4OI8cq
W9E4EG9wglbEtMnObHlms8F3CHmrw3k6KmUkWGoa+/ENmcVl68u/cMRl1JbW2bM+
/3A+SAg2c6iPDlehczKx2oa95QW0SkPPWGuNA/CE8CpyANIhu9XFrj3RQ3EqeRcS
AQQod1RNuHpfETLU/A2gMmvn/w/sx7TB3W5BPs6rprOA37tutPq9u6FTZOcG1Oqj
C/B7yTqgI7rbyvox7DEXoX7rIiEqyNNUguTk/u3SZ4VXE2kmxdmSh3TQvybfbnXV
4JbCZVaqiZraqc7oZMnRoWrXRG3ztbnbes/9qhRGI7PqXqeKJBztxRTEVj8ONs1d
WN5szTwaPIvhkhO3CO5ErU2rVdUr89wKpNXbBODFKRtgxUT70YpmJ46VVaqdAhOZ
D9EUUn4YaeLaS8AjSF/h7UkjOibNc4qVDiPP+rkehFWM66PVnP1Msh93tc+taIfC
EYVMxjh8zNbFuoc7fzvvrFILLe7ifvEIUqSVIC/AzplM/Jxw7buXFeGP1qVCBEHq
391d/9RAfaZ12zkwFsl+IKwE/OZxW8AHa9i1p4GO0YSNuczzEm4=
-----END CERTIFICATE-----
"""

_SSL_CTX = None


def _ssl_context():
    global _SSL_CTX
    if _SSL_CTX is None:
        ctx = ssl.create_default_context()
        try:
            ctx.load_verify_locations(cadata=RUSSIAN_ROOT_CA_PEM)
        except Exception as e:
            print(f"[TBANK] root CA load failed: {e}")
        _SSL_CTX = ctx
    return _SSL_CTX

JOURNAL_SCHEMA = "t_p33656588_creative_arttele_dup"


def _cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }


def _tb_str(v) -> str:
    """Приводит значение к строке по правилам Т-Банк: булевы — как 'true'/'false' в нижнем регистре."""
    if isinstance(v, bool):
        return "true" if v else "false"
    return str(v)


def _make_token(params: dict, password: str) -> str:
    """Формирует подпись Token по правилам Т-Банк: только корневые скалярные поля + Password, сортировка по ключу, конкатенация значений, SHA-256."""
    items = {}
    for k, v in params.items():
        if isinstance(v, (dict, list)):
            continue
        if v is None:
            continue
        items[k] = v
    items["Password"] = password
    concat = "".join(_tb_str(items[k]) for k in sorted(items.keys()))
    return hashlib.sha256(concat.encode("utf-8")).hexdigest()


def _http_post_json(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20, context=_ssl_context()) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"Success": False, "Message": f"HTTP {e.code}", "Details": e.read().decode("utf-8", "ignore")}
    except Exception as e:
        return {"Success": False, "Message": str(e)}


def _detect_table(cur, variants):
    cur.execute("SHOW TABLES")
    tables = [row[0] for row in cur.fetchall()]
    lower = {t.lower(): t for t in tables}
    for v in variants:
        if v.lower() in lower:
            return lower[v.lower()]
    return None


def _columns(cur, table):
    cur.execute(f"SHOW COLUMNS FROM `{table}`")
    return [row[0].lower() for row in cur.fetchall()]


def _find_col(cols, variants):
    cl = [c.lower() for c in cols]
    for v in variants:
        if v.lower() in cl:
            return v
    return None


def _dbtest() -> dict:
    """Проверяет подключение к БД MikroBill и показывает определённые таблицы/колонки (без зачисления)."""
    import pymysql

    host = os.environ.get("MIKROBILL_DB_HOST", "").strip()
    name = os.environ.get("MIKROBILL_DB_NAME", "").strip()
    user = os.environ.get("MIKROBILL_DB_USER", "").strip()
    passwd = os.environ.get("MIKROBILL_DB_PASS", "")
    if not host or not name or not user:
        return {"ok": False, "error": "MIKROBILL_DB_* secrets not set"}
    try:
        conn = pymysql.connect(host=host, user=user, password=passwd, database=name,
                               charset="utf8mb4", connect_timeout=10)
    except Exception as e:
        return {"ok": False, "error": f"DB connect failed: {e}"}
    try:
        with conn.cursor() as cur:
            users_table = _detect_table(cur, ["users", "user", "abonents", "abonent", "clients", "accounts"])
            pay_table = _detect_table(cur, ["payments", "pays", "pay", "payment", "oplata", "finance"])
            ucols = _columns(cur, users_table) if users_table else []
            return {
                "ok": True,
                "users_table": users_table,
                "user_col": _find_col(ucols, ["user", "login", "username", "name", "account"]),
                "deposit_col": _find_col(ucols, ["deposit", "balance", "money", "summa"]),
                "pay_table": pay_table,
            }
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        try:
            conn.close()
        except Exception:
            pass


def _credit_to_billing(login: str, amount: float, order_id: str) -> dict:
    """Зачисляет платёж напрямую в БД MikroBill (MySQL): увеличивает баланс абонента и пишет запись в историю платежей."""
    import pymysql

    host = os.environ.get("MIKROBILL_DB_HOST", "").strip()
    name = os.environ.get("MIKROBILL_DB_NAME", "").strip()
    user = os.environ.get("MIKROBILL_DB_USER", "").strip()
    passwd = os.environ.get("MIKROBILL_DB_PASS", "")
    if not host or not name or not user:
        return {"ok": False, "error": "MIKROBILL_DB_* secrets not set"}

    try:
        conn = pymysql.connect(
            host=host, user=user, password=passwd, database=name,
            charset="utf8mb4", connect_timeout=10, autocommit=False,
        )
    except Exception as e:
        return {"ok": False, "error": f"DB connect failed: {e}"}

    try:
        with conn.cursor() as cur:
            users_table = _detect_table(cur, ["users", "user", "abonents", "abonent", "clients", "accounts"])
            if not users_table:
                return {"ok": False, "error": "users table not found"}

            ucols = _columns(cur, users_table)
            col_user = _find_col(ucols, ["user", "login", "username", "name", "account"])
            col_deposit = _find_col(ucols, ["deposit", "balance", "money", "summa"])
            if not col_user or not col_deposit:
                return {"ok": False, "error": "user/deposit columns not detected"}

            pay_table = _detect_table(cur, ["payments", "pays", "pay", "payment", "oplata", "finance"])

            # Защита от двойного зачисления по order_id в комментарии
            if pay_table:
                pcols = _columns(cur, pay_table)
                p_comment = _find_col(pcols, ["comment", "comments", "note", "notes", "description", "descr"])
                if p_comment:
                    cur.execute(
                        f"SELECT COUNT(*) FROM `{pay_table}` WHERE `{p_comment}` LIKE %s",
                        (f"%{order_id}%",),
                    )
                    if int(cur.fetchone()[0]) > 0:
                        conn.commit()
                        return {"ok": True, "already_paid": True, "order_id": order_id}

            cur.execute(f"SELECT `{col_deposit}` FROM `{users_table}` WHERE `{col_user}` = %s", (login,))
            row = cur.fetchone()
            if not row:
                return {"ok": False, "error": f"user '{login}' not found"}

            old_balance = float(row[0] or 0)
            new_balance = old_balance + amount
            cur.execute(
                f"UPDATE `{users_table}` SET `{col_deposit}` = %s WHERE `{col_user}` = %s",
                (new_balance, login),
            )

            if pay_table:
                pcols = _columns(cur, pay_table)
                p_user = _find_col(pcols, ["user", "login", "username", "uid", "account", "client"])
                p_date = _find_col(pcols, ["date", "datetime", "date_pay", "pay_date", "created", "time", "timestamp"])
                p_sum = _find_col(pcols, ["sum", "summa", "amount", "money", "value"])
                p_type = _find_col(pcols, ["type", "method", "pay_type", "payment_type", "source"])
                p_comment = _find_col(pcols, ["comment", "comments", "note", "notes", "description", "descr"])

                fields, places, values = [], [], []
                if p_user:
                    fields.append(f"`{p_user}`"); places.append("%s"); values.append(login)
                if p_date:
                    fields.append(f"`{p_date}`"); places.append("NOW()")
                if p_sum:
                    fields.append(f"`{p_sum}`"); places.append("%s"); values.append(amount)
                if p_type:
                    fields.append(f"`{p_type}`"); places.append("%s"); values.append("Т-Банк")
                if p_comment:
                    fields.append(f"`{p_comment}`"); places.append("%s"); values.append(f"Онлайн-оплата Т-Банк [{order_id}]")

                if fields:
                    cur.execute(
                        f"INSERT INTO `{pay_table}` ({', '.join(fields)}) VALUES ({', '.join(places)})",
                        tuple(values),
                    )

        conn.commit()
        return {"ok": True, "login": login, "amount": amount, "old_balance": old_balance, "new_balance": new_balance, "order_id": order_id}
    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        return {"ok": False, "error": str(e)}
    finally:
        try:
            conn.close()
        except Exception:
            pass


MIKROBILL_CREDIT_URL = "https://functions.poehali.dev/f2c8bb7d-33bd-4950-bcd7-7f4c5f5fbfdd?action=credit"


def _credit_via_kassa(login: str, amount: float, order_id: str) -> dict:
    """Зачисляет платёж на счёт абонента через кассу MikroBill (функция mikrobill-scraper)."""
    key = os.environ.get("MIKROBILL_API_KEY", "")
    if not key:
        return {"ok": False, "error": "MIKROBILL_API_KEY not set"}
    payload = {
        "action": "credit",
        "login": login,
        "amount": amount,
        "comment": f"Онлайн-оплата Т-Банк [{order_id}]",
        "key": key,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        MIKROBILL_CREDIT_URL, data=data,
        headers={"Content-Type": "application/json", "X-Internal-Key": key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"ok": False, "error": f"HTTP {e.code}", "details": e.read().decode("utf-8", "ignore")[:300]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


TELEGRAM_HOST = "api.telegram.org"
TELEGRAM_FALLBACK_IPS = ["149.154.167.220", "149.154.167.197", "149.154.175.50"]
TELEGRAM_CONNECT_TIMEOUT = 3


def _telegram_hosts() -> list:
    """Адреса Telegram API: сначала заведомо рабочие IP, затем имя.
    Нужно потому, что часть адресов Telegram из облака недоступна."""
    hosts = list(TELEGRAM_FALLBACK_IPS)
    hosts.append(TELEGRAM_HOST)
    return hosts


def _notify_telegram(login: str, amount: float, order_id: str, credit_result: dict) -> None:
    """Отправляет уведомление об успешной оплате в Telegram-канал.
    Не влияет на приём платежа: любые ошибки только логируются."""
    token = os.environ.get("TELEGRAM_PAY_BOT_TOKEN", "") or os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_PAY_CHAT_ID", "") or "-1003901236056"
    if not token or not chat_id:
        print("[TBANK] telegram notify skipped: token/chat_id not set")
        return
    ok = bool(credit_result.get("ok"))
    balance = credit_result.get("balance_before", "")
    balance_after = credit_result.get("balance_after", "")
    account = str(credit_result.get("account", "") or "").strip()
    fio = str(credit_result.get("fio", "") or "").strip()
    if ok:
        text = "✅ Оплата зачислена\n\n"
    else:
        text = (
            "🔴🔴🔴 ВНИМАНИЕ! ЗАЧИСЛЕНИЕ НЕ ПРОШЛО 🔴🔴🔴\n"
            "Деньги приняты банком, но НЕ попали на счёт абонента.\n"
            "❗ Требуется зачислить платёж ВРУЧНУЮ.\n\n"
        )
    text += f"👤 Абонент: {fio or login}\n"
    if account and account != login:
        text += f"📄 Договор: {account}\n"
    when = time.strftime("%d.%m.%Y %H:%M", time.gmtime(time.time() + 3 * 3600))
    text += (
        f"💳 Сумма: {amount:.2f} ₽\n"
        f"🕒 Дата и время: {when} (МСК)\n"
        f"🧾 Заказ: {order_id}"
    )
    if balance:
        text += f"\n💰 Баланс до пополнения: {balance} ₽"
    if balance_after:
        text += f"\n💵 Баланс после пополнения: {balance_after} ₽"
    if not ok and credit_result.get("error"):
        text += f"\n❗ Ошибка: {credit_result.get('error')}"
    payload = json.dumps({"chat_id": chat_id, "text": text}).encode("utf-8")
    last_err = ""
    for host in _telegram_hosts():
        try:
            raw = socket.create_connection((host, 443), timeout=TELEGRAM_CONNECT_TIMEOUT)
            sock = ssl.create_default_context().wrap_socket(raw, server_hostname=TELEGRAM_HOST)
            conn = http.client.HTTPSConnection(TELEGRAM_HOST, 443, timeout=6)
            conn.sock = sock
            conn.request(
                "POST", f"/bot{token}/sendMessage", body=payload,
                headers={"Content-Type": "application/json", "Host": TELEGRAM_HOST},
            )
            resp = conn.getresponse()
            body = resp.read().decode("utf-8", "ignore")
            conn.close()
            if resp.status == 200:
                print(f"[TBANK] telegram notify sent via {host}: {body[:150]}")
                return
            print(f"[TBANK] telegram notify HTTP {resp.status} via {host}: {body[:150]}")
            if resp.status < 500:
                return
            last_err = f"HTTP {resp.status}"
        except Exception as e:
            last_err = f"{host}: {e}"
            print(f"[TBANK] telegram notify failed via {host}: {e}")
    print(f"[TBANK] telegram notify GAVE UP: {last_err}")


PAY_EMAIL_TO = "art888018@mail.ru"


def _smtp_host_for(email: str) -> str:
    """Подбирает почтовый сервер по домену отправителя."""
    domain = email.split("@")[-1].lower() if "@" in email else ""
    if domain in ("mail.ru", "bk.ru", "inbox.ru", "list.ru", "internet.ru"):
        return "smtp.mail.ru"
    if domain in ("yandex.ru", "ya.ru", "yandex.com"):
        return "smtp.yandex.ru"
    if domain in ("gmail.com", "googlemail.com"):
        return "smtp.gmail.com"
    return "smtp.mail.ru"


def _notify_email(login: str, amount: float, order_id: str, credit_result: dict) -> None:
    """Дублирует уведомление об оплате на почту.
    Не влияет на приём платежа: любые ошибки только логируются."""
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    email_to = os.environ.get("PAY_EMAIL_TO") or os.environ.get("EMAIL_TO") or PAY_EMAIL_TO
    recipients = [a.strip() for a in re.split(r"[,;\s]+", email_to) if a.strip()]
    if not smtp_user or not smtp_pass or not recipients:
        print("[TBANK] email notify skipped: SMTP не настроен")
        return
    ok = bool(credit_result.get("ok"))
    account = str(credit_result.get("account", "") or "").strip()
    fio = str(credit_result.get("fio", "") or "").strip()
    balance = credit_result.get("balance_before", "")
    balance_after = credit_result.get("balance_after", "")
    when = time.strftime("%d.%m.%Y %H:%M", time.gmtime(time.time() + 3 * 3600))
    if ok:
        subject = f"Оплата зачислена: {fio or login} — {amount:.2f} ₽"
        head = '<h2 style="color:#059669;margin:0 0 4px;">Оплата зачислена</h2>'
    else:
        subject = f"ВНИМАНИЕ! Зачисление не прошло: {fio or login} — {amount:.2f} ₽"
        head = ('<h2 style="color:#dc2626;margin:0 0 4px;">Зачисление НЕ прошло</h2>'
                '<p style="color:#dc2626;font-size:14px;margin:0;">Деньги приняты банком, '
                'но НЕ попали на счёт абонента. Требуется зачислить платёж вручную.</p>')
    rows = [("Абонент", fio or login)]
    if account and account != login:
        rows.append(("Договор", account))
    rows.append(("Сумма", f"{amount:.2f} ₽"))
    rows.append(("Дата и время", f"{when} (МСК)"))
    rows.append(("Заказ", order_id))
    if balance:
        rows.append(("Баланс до пополнения", f"{balance} ₽"))
    if balance_after:
        rows.append(("Баланс после пополнения", f"{balance_after} ₽"))
    if not ok and credit_result.get("error"):
        rows.append(("Ошибка", str(credit_result.get("error"))[:200]))
    trs = "".join(
        f'<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:200px;">{k}:</td>'
        f'<td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">{v}</td></tr>'
        for k, v in rows
    )
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'
        'background:#f9fafb;padding:24px;border-radius:12px;">'
        f'{head}'
        '<p style="color:#6b7280;margin-top:4px;font-size:14px;">АртТелеком Юг — онлайн-оплата Т-Банк</p>'
        '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">'
        f'<table style="width:100%;border-collapse:collapse;">{trs}</table>'
        '</div>'
    )
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(html, "html", "utf-8"))
    smtp_host = os.environ.get("SMTP_HOST") or _smtp_host_for(smtp_user)
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, recipients, msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, recipients, msg.as_string())
        print(f"[TBANK] email notify sent to {recipients} via {smtp_host}:{smtp_port}")
    except Exception as e:
        print(f"[TBANK] email notify failed ({smtp_host}:{smtp_port}): {type(e).__name__}: {str(e)[:200]}")


def _db():
    """Подключение к журналу. None — если база не настроена."""
    dsn = os.environ.get("DATABASE_URL", "")
    if not dsn:
        return None
    try:
        import psycopg2
        return psycopg2.connect(dsn)
    except Exception as e:
        print(f"[TBANK] db connect failed: {e}")
        return None


def _sq(v) -> str:
    return "'" + str(v).replace("'", "''") + "'"


def _already_credited(order_id: str) -> bool:
    """Защита от двойного зачисления: заказ уже успешно проведён в кассу?"""
    if not order_id:
        return False
    conn = _db()
    if conn is None:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT 1 FROM {JOURNAL_SCHEMA}.payments "
                f"WHERE order_id = {_sq(order_id)} AND credited LIMIT 1"
            )
            return cur.fetchone() is not None
    except Exception as e:
        print(f"[TBANK] credited-check failed order={order_id}: {e}")
        return False
    finally:
        conn.close()


RETRY_DELAYS_MIN = [1, 5, 15, 60, 180, 360]
MAX_RETRY_ATTEMPTS = len(RETRY_DELAYS_MIN)


def _queue_retry(order_id: str, login: str, amount: float, payment_id: str, error: str) -> None:
    """Ставит платёж в очередь повторного зачисления (касса была недоступна)."""
    conn = _db()
    if conn is None:
        print(f"[TBANK] retry not queued (no db) order={order_id}")
        return
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {JOURNAL_SCHEMA}.credit_retries "
                "(order_id, login, amount, payment_id, last_error, next_try_at) VALUES ("
                f"{_sq(order_id)}, {_sq(login)}, {amount or 0}, {_sq(payment_id)}, "
                f"{_sq(error[:300])}, now() + interval '{RETRY_DELAYS_MIN[0]} minutes') "
                "ON CONFLICT (order_id) DO UPDATE SET "
                "status = 'pending', last_error = EXCLUDED.last_error, updated_at = now()"
            )
        conn.commit()
        print(f"[TBANK] retry queued order={order_id} amount={amount}")
    except Exception as e:
        print(f"[TBANK] retry queue failed order={order_id}: {e}")
    finally:
        conn.close()


def _mark_retry_done(order_id: str, ok: bool, attempts: int, error: str) -> None:
    conn = _db()
    if conn is None:
        return
    try:
        with conn.cursor() as cur:
            if ok:
                cur.execute(
                    f"UPDATE {JOURNAL_SCHEMA}.credit_retries SET status = 'done', "
                    f"attempts = {attempts}, last_error = '', updated_at = now() "
                    f"WHERE order_id = {_sq(order_id)}"
                )
            elif attempts >= MAX_RETRY_ATTEMPTS:
                cur.execute(
                    f"UPDATE {JOURNAL_SCHEMA}.credit_retries SET status = 'failed', "
                    f"attempts = {attempts}, last_error = {_sq(error[:300])}, updated_at = now() "
                    f"WHERE order_id = {_sq(order_id)}"
                )
            else:
                delay = RETRY_DELAYS_MIN[min(attempts, MAX_RETRY_ATTEMPTS - 1)]
                cur.execute(
                    f"UPDATE {JOURNAL_SCHEMA}.credit_retries SET attempts = {attempts}, "
                    f"last_error = {_sq(error[:300])}, updated_at = now(), "
                    f"next_try_at = now() + interval '{delay} minutes' "
                    f"WHERE order_id = {_sq(order_id)}"
                )
        conn.commit()
    except Exception as e:
        print(f"[TBANK] retry update failed order={order_id}: {e}")
    finally:
        conn.close()


def _process_retries() -> dict:
    """Добивает платежи, которые не удалось зачислить: берёт созревшие из очереди."""
    conn = _db()
    if conn is None:
        return {"ok": False, "error": "no db"}
    rows = []
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT order_id, login, amount, payment_id, attempts "
                f"FROM {JOURNAL_SCHEMA}.credit_retries "
                "WHERE status = 'pending' AND next_try_at <= now() "
                "ORDER BY next_try_at LIMIT 10"
            )
            rows = cur.fetchall()
    except Exception as e:
        conn.close()
        return {"ok": False, "error": str(e)}
    conn.close()

    done, failed, skipped = 0, 0, 0
    for order_id, login, amount, payment_id, attempts in rows:
        amount = float(amount or 0)
        attempts = int(attempts or 0) + 1
        if _already_credited(order_id):
            _mark_retry_done(order_id, True, attempts, "")
            skipped += 1
            continue
        result = _credit_via_kassa(login, amount, order_id)
        ok = bool(result.get("ok"))
        print(f"[TBANK] retry #{attempts} order={order_id} -> ok={ok}")
        _journal_payment(order_id, login, amount, "RETRY", str(payment_id or ""), result, "")
        _mark_retry_done(order_id, ok, attempts, str(result.get("error", "")))
        if ok:
            _notify_telegram(login, amount, order_id, result)
            done += 1
        elif attempts >= MAX_RETRY_ATTEMPTS:
            failed += 1
    return {"ok": True, "processed": len(rows), "credited": done,
            "failed": failed, "skipped": skipped}


def _journal_payment(order_id: str, login: str, amount: float, status: str,
                     payment_id: str, credit_result: dict, raw_body: str) -> None:
    """Пишет запись о каждом уведомлении банка в журнал платежей (PostgreSQL).
    Не влияет на приём платежа: любые ошибки только логируются."""
    dsn = os.environ.get("DATABASE_URL", "")
    if not dsn:
        print("[TBANK] journal skipped: DATABASE_URL not set")
        return
    cr = credit_result or {}
    credited = bool(cr.get("ok"))
    account = str(cr.get("account", "") or "")
    fio = str(cr.get("fio", "") or "")
    balance_before = str(cr.get("balance_before", "") or "")
    balance_after = str(cr.get("balance_after", "") or "")
    error = str(cr.get("error", "") or "")

    def esc(v):
        return "'" + str(v).replace("'", "''") + "'"

    try:
        import psycopg2
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {JOURNAL_SCHEMA}.payments "
                    "(order_id, login, account, fio, amount, bank_status, payment_id, "
                    "credited, balance_before, balance_after, error, raw_body) VALUES ("
                    f"{esc(order_id)}, {esc(login)}, {esc(account)}, {esc(fio)}, "
                    f"{amount if amount else 0}, {esc(status)}, {esc(payment_id)}, "
                    f"{'TRUE' if credited else 'FALSE'}, {esc(balance_before)}, "
                    f"{esc(balance_after)}, {esc(error)}, {esc(raw_body[:4000])})"
                )
            conn.commit()
            print(f"[TBANK] journal saved order={order_id} status={status} credited={credited}")
        finally:
            conn.close()
    except Exception as e:
        print(f"[TBANK] journal failed order={order_id}: {e}")


def handler(event, context):
    """Оплата Т-Банком: создание платёжной ссылки (action=create) и приём webhook от банка (action=notify) с зачислением на счёт абонента."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors(), "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    if not action and method == "POST":
        try:
            _b = json.loads(event.get("body") or "{}")
            if isinstance(_b, dict):
                action = _b.get("action", "")
        except Exception:
            action = ""
    cors = _cors()

    terminal_key = os.environ.get("TBANK_TERMINAL_KEY", "")
    password = os.environ.get("TBANK_PASSWORD", "")

    raw_body = event.get("body") or ""
    looks_like_notify = False
    if method == "POST" and raw_body:
        try:
            _peek = json.loads(raw_body)
            if isinstance(_peek, dict) and "OrderId" in _peek and "Status" in _peek:
                looks_like_notify = True
        except Exception:
            looks_like_notify = False

    print(f"[TBANK] request method={method} action='{action}' notify_guess={looks_like_notify} has_key={bool(terminal_key)} has_pass={bool(password)}")

    if looks_like_notify and action != "notify":
        action = "notify"

    if action == "diag":
        return {"statusCode": 200, "headers": cors, "body": json.dumps({
            "has_terminal_key": bool(terminal_key),
            "has_password": bool(password),
            "has_db_host": bool(os.environ.get("MIKROBILL_DB_HOST", "")),
            "has_db_name": bool(os.environ.get("MIKROBILL_DB_NAME", "")),
            "has_db_user": bool(os.environ.get("MIKROBILL_DB_USER", "")),
            "has_db_pass": bool(os.environ.get("MIKROBILL_DB_PASS", "")),
            "notify_url": funcurl_self(event),
        })}

    if action == "dbtest":
        return {"statusCode": 200, "headers": cors, "body": json.dumps(_dbtest())}

    if action == "test_notify":
        _test_data = {"ok": True, "balance_before": "1000.00", "balance_after": "1010.00",
                      "account": "0000301", "fio": "Тестовый Абонент"}
        _test_order = "test-" + str(int(time.time()))
        _notify_telegram("ТЕСТ", 10.0, _test_order, _test_data)
        _notify_email("ТЕСТ", 10.0, _test_order, _test_data)
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True, "message": "Тестовое уведомление отправлено, проверьте Telegram"})}

    if action == "create":
        if not terminal_key or not password:
            return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "Эквайринг не настроен"})}

        # Страховка без планировщика: любая новая оплата попутно добивает
        # зависшие платежи из очереди.
        try:
            _process_retries()
        except Exception as e:
            print(f"[TBANK] piggyback retry failed: {e}")

        body = json.loads(event.get("body") or "{}")
        login = str(body.get("login", "")).strip()
        try:
            amount = float(body.get("amount", 0))
        except (TypeError, ValueError):
            amount = 0
        email = str(body.get("email", "")).strip()
        phone = str(body.get("phone", "")).strip()

        if not login or amount < 1:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажите логин и сумму от 1 ₽"})}

        order_id = f"{login}-{int(time.time())}"
        amount_kop = int(round(amount * 100))

        notify_url = funcurl_self(event)
        return_url = str(body.get("return_url", "")).strip()

        init_params = {
            "TerminalKey": terminal_key,
            "Amount": amount_kop,
            "OrderId": order_id,
            "Description": f"Пополнение лицевого счёта {login}",
        }
        if notify_url:
            init_params["NotificationURL"] = notify_url
        if return_url:
            sep = "&" if "?" in return_url else "?"
            init_params["SuccessURL"] = f"{return_url}{sep}paid={order_id}&amount={amount:.0f}"
            init_params["FailURL"] = f"{return_url}{sep}payfail=1"
        token = _make_token(init_params, password)
        init_params["Token"] = token

        receipt_items = [{
            "Name": f"Услуги связи (счёт {login})",
            "Price": amount_kop,
            "Quantity": 1.00,
            "Amount": amount_kop,
            "Tax": "none",
            "PaymentMethod": "full_payment",
            "PaymentObject": "service",
        }]
        receipt = {"Taxation": "usn_income", "Items": receipt_items}
        if email:
            receipt["Email"] = email
        elif phone:
            receipt["Phone"] = phone
        else:
            receipt["Email"] = "noreply@arttele.ru"
        init_params["Receipt"] = receipt
        init_params["DATA"] = {"login": login}

        resp = _http_post_json(TBANK_INIT_URL, init_params)
        if resp.get("Success") and resp.get("PaymentURL"):
            return {"statusCode": 200, "headers": cors, "body": json.dumps({
                "pay_url": resp["PaymentURL"],
                "order_id": order_id,
                "payment_id": resp.get("PaymentId"),
            })}
        return {"statusCode": 502, "headers": cors, "body": json.dumps({
            "error": resp.get("Message") or "Банк отклонил запрос",
            "details": resp.get("Details", ""),
        })}

    if action == "retry":
        return {"statusCode": 200, "headers": cors,
                "body": json.dumps(_process_retries(), ensure_ascii=False)}

    if action == "retry_status":
        conn = _db()
        if conn is None:
            return {"statusCode": 200, "headers": cors,
                    "body": json.dumps({"ok": False, "error": "no db"})}
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT status, count(*), coalesce(sum(amount), 0) "
                    f"FROM {JOURNAL_SCHEMA}.credit_retries GROUP BY status"
                )
                stats = {r[0]: {"count": int(r[1]), "amount": float(r[2])}
                         for r in cur.fetchall()}
        finally:
            conn.close()
        return {"statusCode": 200, "headers": cors,
                "body": json.dumps({"ok": True, "queue": stats}, ensure_ascii=False)}

    if action == "notify":
        raw = event.get("body") or "{}"
        try:
            data = json.loads(raw)
        except Exception as e:
            print(f"[TBANK] notify bad json: {e} raw={raw[:200]}")
            return {"statusCode": 200, "headers": cors, "body": "OK"}

        status = data.get("Status", "")
        order_id = str(data.get("OrderId", ""))
        payment_id = str(data.get("PaymentId", "") or "")
        print(f"[TBANK] notify status={status} order={order_id} success={data.get('Success')}")

        recv_token = data.get("Token", "")
        check = {k: v for k, v in data.items() if k != "Token"}
        expected = _make_token(check, password)
        if recv_token != expected:
            print(f"[TBANK] bad token order={order_id} recv={recv_token[:12]}... exp={expected[:12]}...")
            return {"statusCode": 200, "headers": cors, "body": "OK"}

        login = order_id.rsplit("-", 1)[0] if order_id else ""
        extra = data.get("DATA") or {}
        if isinstance(extra, dict) and extra.get("login"):
            login = extra["login"]
        amount = float(data.get("Amount", 0)) / 100.0

        if status in ("CONFIRMED", "AUTHORIZED") and order_id:
            # Защита от повторного зачисления: банк шлёт уведомление дважды
            # (AUTHORIZED и CONFIRMED), плюс возможны ретраи на стороне банка.
            if _already_credited(order_id):
                print(f"[TBANK] duplicate skipped order={order_id} status={status}")
                return {"statusCode": 200, "headers": cors, "body": "OK"}

            result = _credit_via_kassa(login, amount, order_id)
            print(f"[TBANK] credit login={login} amount={amount} order={order_id} -> {result}")
            # Касса не ответила — ставим в очередь, деньги не теряются
            if not result.get("ok"):
                _queue_retry(order_id, login, amount, payment_id, str(result.get("error", "")))
            # Уведомление в Telegram — только на финальном статусе CONFIRMED,
            # чтобы не приходило два сообщения (на AUTHORIZED и на CONFIRMED)
            if status == "CONFIRMED":
                _notify_telegram(login, amount, order_id, result)
                _notify_email(login, amount, order_id, result)
                _journal_payment(order_id, login, amount, status, payment_id, result, raw)
        else:
            print(f"[TBANK] notify ignored status={status}")
            _journal_payment(order_id, login, amount, status, payment_id, {}, raw)

        return {"statusCode": 200, "headers": cors, "body": "OK"}

    return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Unknown action"})}


SELF_URL = "https://functions.poehali.dev/740464df-96c9-4053-b7ad-d737892f97ca"


def funcurl_self(event) -> str:
    """Возвращает публичный URL этой же функции для NotificationURL, добавляя ?action=notify.

    Используем постоянный публичный URL функции, т.к. за прокси служебные
    заголовки отдают голый домен Yandex Cloud без ID функции.
    """
    return f"{SELF_URL}?action=notify"