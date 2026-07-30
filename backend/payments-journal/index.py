import json
import os

JOURNAL_SCHEMA = "t_p33656588_creative_arttele_dup"


def _cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Login, X-Admin-Password",
        "Content-Type": "application/json",
    }


def handler(event, context):
    """Закрытый журнал платежей: проверяет логин/пароль владельца и возвращает список всех платежей из базы (успешные, возвраты, ошибки зачисления)."""
    method = event.get("httpMethod", "GET")
    cors = _cors()
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    headers = event.get("headers") or {}
    login = headers.get("X-Admin-Login") or headers.get("x-admin-login") or ""
    password = headers.get("X-Admin-Password") or headers.get("x-admin-password") or ""

    if not login and method == "POST":
        try:
            b = json.loads(event.get("body") or "{}")
            login = b.get("login", "")
            password = b.get("password", "")
        except Exception:
            pass

    real_login = os.environ.get("PAYMENTS_ADMIN_LOGIN", "")
    real_pass = os.environ.get("PAYMENTS_ADMIN_PASSWORD", "")
    if not real_login or not real_pass:
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "Доступ не настроен"})}
    if login != real_login or password != real_pass:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}

    dsn = os.environ.get("DATABASE_URL", "")
    if not dsn:
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "База недоступна"})}

    params = event.get("queryStringParameters") or {}
    try:
        limit = min(int(params.get("limit", 200)), 1000)
    except (TypeError, ValueError):
        limit = 200

    import psycopg2
    conn = psycopg2.connect(dsn)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, order_id, login, account, fio, amount, bank_status, "
                "credited, balance_before, balance_after, error, "
                "to_char(created_at AT TIME ZONE 'Europe/Moscow', 'DD.MM.YYYY HH24:MI') "
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
