import json
import os
import time
import hashlib
import urllib.request
import urllib.error

TBANK_INIT_URL = "https://securepay.tinkoff.ru/v2/Init"


def _cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }


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
    concat = "".join(str(items[k]) for k in sorted(items.keys()))
    return hashlib.sha256(concat.encode("utf-8")).hexdigest()


def _http_post_json(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"Success": False, "Message": f"HTTP {e.code}", "Details": e.read().decode("utf-8", "ignore")}
    except Exception as e:
        return {"Success": False, "Message": str(e)}


def _credit_to_billing(login: str, amount: float, order_id: str) -> dict:
    """Зачисляет платёж на счёт абонента через PHP-модуль mikrobill-api.php (action=pay)."""
    api_url = os.environ.get("MIKROBILL_API_URL", "")
    api_key = os.environ.get("MIKROBILL_API_KEY", "")
    if not api_url or not api_key:
        return {"ok": False, "error": "MIKROBILL_API_URL/KEY not set"}

    sep = "&" if "?" in api_url else "?"
    url = f"{api_url}{sep}action=pay"
    body = json.dumps({
        "login": login,
        "amount": amount,
        "order_id": order_id,
        "comment": "Онлайн-оплата Т-Банк",
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "X-Api-Key": api_key,
    }, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"ok": False, "error": str(e)}


def handler(event, context):
    """Оплата Т-Банком: создание платёжной ссылки (action=create) и приём webhook от банка (action=notify) с зачислением на счёт абонента."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors(), "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    cors = _cors()

    terminal_key = os.environ.get("TBANK_TERMINAL_KEY", "")
    password = os.environ.get("TBANK_PASSWORD", "")

    if action == "create":
        if not terminal_key or not password:
            return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "Эквайринг не настроен"})}

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

        init_params = {
            "TerminalKey": terminal_key,
            "Amount": amount_kop,
            "OrderId": order_id,
            "Description": f"Пополнение лицевого счёта {login}",
        }
        if notify_url:
            init_params["NotificationURL"] = notify_url
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

    if action == "notify":
        raw = event.get("body") or "{}"
        try:
            data = json.loads(raw)
        except Exception:
            return {"statusCode": 200, "headers": cors, "body": "OK"}

        recv_token = data.get("Token", "")
        check = {k: v for k, v in data.items() if k != "Token"}
        expected = _make_token(check, password)
        if recv_token != expected:
            print(f"[TBANK] bad token order={data.get('OrderId')}")
            return {"statusCode": 200, "headers": cors, "body": "OK"}

        status = data.get("Status", "")
        order_id = str(data.get("OrderId", ""))
        if status == "CONFIRMED" and order_id:
            login = order_id.rsplit("-", 1)[0]
            extra = data.get("DATA") or {}
            if isinstance(extra, dict) and extra.get("login"):
                login = extra["login"]
            amount = float(data.get("Amount", 0)) / 100.0
            result = _credit_to_billing(login, amount, order_id)
            print(f"[TBANK] credit login={login} amount={amount} order={order_id} -> {result}")

        return {"statusCode": 200, "headers": cors, "body": "OK"}

    return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Unknown action"})}


def funcurl_self(event) -> str:
    """Возвращает публичный URL этой же функции для NotificationURL, добавляя ?action=notify."""
    headers = event.get("headers") or {}
    host = headers.get("Host") or headers.get("host") or ""
    rc = event.get("requestContext") or {}
    domain = rc.get("domainName") or host
    path = rc.get("path") or "/"
    if not domain:
        return ""
    return f"https://{domain}{path}?action=notify"
