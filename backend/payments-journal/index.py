import json
import os
import urllib.request
import urllib.error

JOURNAL_SCHEMA = "t_p33656588_creative_arttele_dup"
MIKROBILL_CREDIT_URL = "https://functions.poehali.dev/f2c8bb7d-33bd-4950-bcd7-7f4c5f5fbfdd?action=credit"


def _cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Login, X-Admin-Password",
        "Content-Type": "application/json",
    }


def _credit_via_kassa(login, amount, order_id):
    """Зачисляет платёж на счёт абонента через кассу MikroBill (функция mikrobill-scraper)."""
    key = os.environ.get("MIKROBILL_API_KEY", "")
    if not key:
        return {"ok": False, "error": "MIKROBILL_API_KEY not set"}
    payload = {
        "action": "credit",
        "login": login,
        "amount": amount,
        "comment": f"Ручное зачисление (журнал) [{order_id}]",
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


def handler(event, context):
    """Закрытый журнал платежей: проверяет логин/пароль владельца и возвращает список всех платежей из базы (успешные, возвраты, ошибки зачисления)."""
    method = event.get("httpMethod", "GET")
    cors = _cors()
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    headers = event.get("headers") or {}
    login = headers.get("X-Admin-Login") or headers.get("x-admin-login") or ""
    password = headers.get("X-Admin-Password") or headers.get("x-admin-password") or ""

    body = {}
    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}") or {}
        except Exception:
            body = {}
    if not login:
        login = body.get("login", "")
        password = body.get("password", "")

    real_login = os.environ.get("PAYMENTS_ADMIN_LOGIN", "").strip()
    real_pass = os.environ.get("PAYMENTS_ADMIN_PASSWORD", "").strip()
    login = str(login).strip()
    password = str(password).strip()
    if not real_login or not real_pass:
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "Доступ не настроен"})}
    if login != real_login or password != real_pass:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}

    dsn = os.environ.get("DATABASE_URL", "")
    if not dsn:
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "База недоступна"})}

    import psycopg2

    action = body.get("action", "")
    if action == "manual_credit":
        try:
            pay_id = int(body.get("id", 0))
        except (TypeError, ValueError):
            pay_id = 0
        if not pay_id:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Не указан платёж"})}

        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT login, amount, order_id, credited FROM {JOURNAL_SCHEMA}.payments WHERE id = {pay_id}"
                )
                row = cur.fetchone()
                if not row:
                    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Платёж не найден"})}
                p_login, p_amount, p_order, p_credited = row
                if p_credited:
                    return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Платёж уже зачислен"})}

                result = _credit_via_kassa(p_login, float(p_amount or 0), p_order or f"manual-{pay_id}")
                ok = bool(result.get("ok"))
                err = str(result.get("error", "") or "").replace("'", "''")
                bb = str(result.get("balance_before", "") or "").replace("'", "''")
                ba = str(result.get("balance_after", "") or "").replace("'", "''")
                if ok:
                    cur.execute(
                        f"UPDATE {JOURNAL_SCHEMA}.payments SET credited = TRUE, error = '', "
                        f"balance_before = '{bb}', balance_after = '{ba}' WHERE id = {pay_id}"
                    )
                    conn.commit()
                    return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}
                else:
                    cur.execute(
                        f"UPDATE {JOURNAL_SCHEMA}.payments SET error = '{err}' WHERE id = {pay_id}"
                    )
                    conn.commit()
                    return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": False, "error": result.get("error", "Не удалось зачислить")}, ensure_ascii=False)}
        finally:
            conn.close()

    params = event.get("queryStringParameters") or {}
    try:
        limit = min(int(params.get("limit", 200)), 1000)
    except (TypeError, ValueError):
        limit = 200

    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, order_id, login, account, fio, amount, bank_status, "
                "credited, balance_before, balance_after, error, "
                "to_char(created_at + interval '3 hours', 'DD.MM.YYYY HH24:MI') "
                f"FROM {JOURNAL_SCHEMA}.payments ORDER BY created_at DESC LIMIT {limit}"
            )
            rows = cur.fetchall()
            cur.execute(
                f"SELECT COUNT(*), COALESCE(SUM(amount) FILTER (WHERE credited), 0), "
                f"COUNT(*) FILTER (WHERE NOT credited AND bank_status IN ('CONFIRMED','AUTHORIZED')) "
                f"FROM {JOURNAL_SCHEMA}.payments"
            )
            total_cnt, total_sum, failed_cnt = cur.fetchone()
    finally:
        conn.close()

    items = [{
        "id": r[0],
        "order_id": r[1],
        "login": r[2],
        "account": r[3],
        "fio": r[4],
        "amount": float(r[5] or 0),
        "bank_status": r[6],
        "credited": bool(r[7]),
        "balance_before": r[8],
        "balance_after": r[9],
        "error": r[10],
        "created_at": r[11],
    } for r in rows]

    return {"statusCode": 200, "headers": cors, "body": json.dumps({
        "items": items,
        "summary": {
            "total": int(total_cnt or 0),
            "total_sum": float(total_sum or 0),
            "failed": int(failed_cnt or 0),
        },
    }, ensure_ascii=False)}