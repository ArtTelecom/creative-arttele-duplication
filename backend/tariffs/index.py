import json
import os

SCHEMA = "t_p33656588_creative_arttele_dup"


def _cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Login, X-Admin-Password",
        "Content-Type": "application/json",
    }


def _row_to_tariff(r):
    return {
        "id": r[0],
        "kind": r[1],
        "name": r[2],
        "speed": r[3],
        "price": r[4],
        "popular": bool(r[5]),
        "color": r[6],
        "sla": r[7],
        "features": r[8] if isinstance(r[8], list) else json.loads(r[8] or "[]"),
    }


def _check_admin(event, body):
    headers = event.get("headers") or {}
    login = (headers.get("X-Admin-Login") or headers.get("x-admin-login") or body.get("login", "")).strip()
    password = (headers.get("X-Admin-Password") or headers.get("x-admin-password") or body.get("password", "")).strip()
    real_login = os.environ.get("PAYMENTS_ADMIN_LOGIN", "").strip()
    real_pass = os.environ.get("PAYMENTS_ADMIN_PASSWORD", "").strip()
    return bool(real_login) and login == real_login and password == real_pass


def _esc(v):
    return "'" + str(v).replace("'", "''") + "'"


def _row_to_location(r):
    return {
        "id": r[0],
        "slug": r[1],
        "name": r[2],
        "description": r[3],
        "available": bool(r[4]),
        "promos": r[5] if isinstance(r[5], list) else json.loads(r[5] or "[]"),
        "tariffs": r[6] if isinstance(r[6], list) else json.loads(r[6] or "[]"),
    }


def handler(event, context):
    """Тарифы: публичное чтение списка (GET) и сохранение из личного кабинета владельца по логину/паролю (POST action=save)."""
    method = event.get("httpMethod", "GET")
    cors = _cors()
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    dsn = os.environ.get("DATABASE_URL", "")
    if not dsn:
        return {"statusCode": 500, "headers": cors, "body": json.dumps({"error": "База недоступна"})}

    import psycopg2

    body = {}
    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}") or {}
        except Exception:
            body = {}
    action = body.get("action", "")

    # ── Публичное чтение тарифов ──
    if method == "GET" or action == "list":
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, kind, name, speed, price, popular, color, sla, features "
                    f"FROM {SCHEMA}.tariffs ORDER BY kind, sort_order, id"
                )
                rows = cur.fetchall()
        finally:
            conn.close()
        home = [_row_to_tariff(r) for r in rows if r[1] == "home"]
        business = [_row_to_tariff(r) for r in rows if r[1] == "business"]
        return {"statusCode": 200, "headers": cors, "body": json.dumps(
            {"home": home, "business": business}, ensure_ascii=False)}

    # ── Публичное чтение районов ──
    if action == "list_locations":
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, slug, name, description, available, promos, tariffs "
                    f"FROM {SCHEMA}.locations ORDER BY sort_order, id"
                )
                rows = cur.fetchall()
        finally:
            conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps(
            {"locations": [_row_to_location(r) for r in rows]}, ensure_ascii=False)}

    # ── Сохранение районов (только владелец) ──
    if action == "save_locations":
        if not _check_admin(event, body):
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}
        items = body.get("items", [])
        if not isinstance(items, list):
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Нет данных"})}
        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                for it in items:
                    try:
                        lid = int(it.get("id", 0))
                    except (TypeError, ValueError):
                        lid = 0
                    if not lid:
                        continue
                    name = _esc(it.get("name", ""))
                    desc = _esc(it.get("description", ""))
                    available = "TRUE" if it.get("available") else "FALSE"
                    promos = it.get("promos", [])
                    if not isinstance(promos, list):
                        promos = []
                    promos_json = _esc(json.dumps(promos, ensure_ascii=False))
                    tariffs = it.get("tariffs", [])
                    if not isinstance(tariffs, list):
                        tariffs = []
                    tariffs_json = _esc(json.dumps(tariffs, ensure_ascii=False))
                    cur.execute(
                        f"UPDATE {SCHEMA}.locations SET name={name}, description={desc}, "
                        f"available={available}, promos={promos_json}::jsonb, "
                        f"tariffs={tariffs_json}::jsonb, updated_at=now() WHERE id={lid}"
                    )
            conn.commit()
        finally:
            conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    # ── Сохранение тарифов (только владелец) ──
    if action == "save":
        if not _check_admin(event, body):
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}

        items = body.get("items", [])
        if not isinstance(items, list):
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Нет данных"})}

        esc = _esc

        conn = psycopg2.connect(dsn)
        try:
            with conn.cursor() as cur:
                for it in items:
                    try:
                        tid = int(it.get("id", 0))
                    except (TypeError, ValueError):
                        tid = 0
                    if not tid:
                        continue
                    name = esc(it.get("name", ""))
                    speed = esc(it.get("speed", ""))
                    price = esc(it.get("price", ""))
                    color = esc(it.get("color", "blue"))
                    sla = esc(it.get("sla", ""))
                    popular = "TRUE" if it.get("popular") else "FALSE"
                    feats = it.get("features", [])
                    if not isinstance(feats, list):
                        feats = []
                    feats_json = esc(json.dumps(feats, ensure_ascii=False))
                    cur.execute(
                        f"UPDATE {SCHEMA}.tariffs SET name={name}, speed={speed}, price={price}, "
                        f"color={color}, sla={sla}, popular={popular}, features={feats_json}::jsonb, "
                        f"updated_at=now() WHERE id={tid}"
                    )
            conn.commit()
        finally:
            conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Unknown action"})}