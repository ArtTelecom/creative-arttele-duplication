import json
import os
import re
import requests
from bs4 import BeautifulSoup

KASSA_URL = "https://lk.arttele.ru/kassa"


def handler(event, context):
    """API личного кабинета АртТелеком через MikroBill"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    cors = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if action == 'auth':
        return handle_auth(event, cors)
    elif action == 'user_info':
        return handle_user_info(event, cors)
    elif action == 'news':
        return handle_news(event, cors)
    elif action == 'ping':
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'status': 'ok'})}
    else:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Unknown action'})}


def handle_news(event, cors):
    """Получает список объявлений (новостей) из MikroBill (allnews.php)."""
    params = event.get('queryStringParameters') or {}
    try:
        limit = int(params.get('limit', '0') or 0)
    except Exception:
        limit = 0

    try:
        r = requests.get('https://lk.arttele.ru/kassa/allnews.php', timeout=15)
        r.encoding = 'utf-8'
        html = r.text
    except Exception as e:
        print(f"[MIKROBILL] news fetch error: {e}")
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'news': []}, ensure_ascii=False)}

    soup = BeautifulSoup(html, 'html.parser')
    news = []

    # Стратегия 1: ищем блоки с датами (типичный шаблон MikroBill)
    date_re = re.compile(r'\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}')

    # Пробуем найти таблицу
    for table in soup.find_all('table'):
        rows = table.find_all('tr')
        if len(rows) < 1:
            continue
        for tr in rows:
            cells = tr.find_all(['td', 'th'])
            if not cells:
                continue
            full_text = tr.get_text('\n', strip=True)
            if not full_text or len(full_text) < 10:
                continue
            date_match = date_re.search(full_text)
            if not date_match:
                continue
            date = date_match.group(0)
            # title = первая строка (без даты), text = остальное
            lines = [ln.strip() for ln in full_text.split('\n') if ln.strip()]
            title = ''
            text_parts = []
            for ln in lines:
                if date_re.search(ln) and not title:
                    cleaned = date_re.sub('', ln).strip(' -:.,')
                    if cleaned:
                        title = cleaned
                    continue
                if not title:
                    title = ln
                else:
                    text_parts.append(ln)
            text = '\n'.join(text_parts).strip()
            if title or text:
                news.append({'date': date, 'title': title or 'Объявление', 'text': text})

    # Стратегия 2: если не нашли в таблицах — ищем по абзацам/div
    if not news:
        for block in soup.find_all(['div', 'p', 'article']):
            full_text = block.get_text('\n', strip=True)
            if not full_text or len(full_text) < 20:
                continue
            date_match = date_re.search(full_text)
            if not date_match:
                continue
            # пропускаем вложенные
            if block.find(['div', 'p', 'article']):
                continue
            date = date_match.group(0)
            lines = [ln.strip() for ln in full_text.split('\n') if ln.strip()]
            title = lines[0] if lines else 'Объявление'
            text = '\n'.join(lines[1:]).strip()
            news.append({'date': date, 'title': title, 'text': text})

    # Дедуп
    seen = set()
    uniq = []
    for n in news:
        key = (n['date'], n['title'][:60])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(n)
    news = uniq

    if limit > 0:
        news = news[:limit]

    print(f"[MIKROBILL] news count={len(news)}")
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'news': news}, ensure_ascii=False)}


def kassa_session():
    s = requests.Session()
    s.post(
        KASSA_URL + '/index.php',
        data={
            'chaiserlogin': os.environ.get('KASSA_LOGIN', ''),
            'chaiserpassword': os.environ.get('KASSA_PASS', ''),
        },
        timeout=10,
    )
    return s


def kassa_find_user(session, login):
    r = session.get(
        KASSA_URL + '/api.php?action=finduser2&value=' + requests.utils.quote(login),
        timeout=10,
    )
    r.encoding = 'utf-8'
    text = r.text.strip()
    if not text or '||' not in text:
        return None
    parts = text.split('||')
    return {
        'uid': parts[0] if len(parts) > 0 else '',
        'name': parts[1] if len(parts) > 1 else '',
        'tariff': parts[2] if len(parts) > 2 else '',
        'balance': parts[3] if len(parts) > 3 else '',
        'ip': parts[4] if len(parts) > 4 else '',
        'active': parts[5] if len(parts) > 5 else '',
    }


def _parse_kv_from_html(html):
    """Парсит таблицу ключ-значение из HTML ответа MikroBill."""
    soup = BeautifulSoup(html, 'html.parser')
    data = {}
    for tr in soup.find_all('tr'):
        tds = tr.find_all('td')
        i = 0
        while i < len(tds) - 1:
            label = tds[i].get_text(' ', strip=True).rstrip(':').lower()
            value = tds[i + 1].get_text(' ', strip=True)
            if label and value:
                data[label] = value
            i += 2
    return data


def kassa_get_user_info(session, login):
    """Забирает карточку абонента из MikroBill.

    Сначала пробуем value2=0 (полная расширенная карточка со сроком действия услуги),
    потом value2=1 как резерв. Результаты объединяем.
    """
    merged = {}

    for value2 in ('0', '1', '2'):
        try:
            r = session.get(
                KASSA_URL + '/api.php?action=GET_USER_INFO&value=' + requests.utils.quote(login) + '&value2=' + value2,
                timeout=10,
            )
            r.encoding = 'utf-8'
            data = _parse_kv_from_html(r.text)
            for k, v in data.items():
                if k not in merged or not merged.get(k):
                    merged[k] = v
            print(f"[MIKROBILL] user={login} value2={value2} keys={list(data.keys())}")
        except Exception as e:
            print(f"[MIKROBILL] GET_USER_INFO value2={value2} error: {e}")

    # Дополнительно — usrstat.php, там часто есть «Хватит до» / «Оплачено по»
    try:
        r = session.get(
            KASSA_URL + '/usrstat.php?client=' + requests.utils.quote(login),
            timeout=10,
        )
        r.encoding = 'utf-8'
        stat_data = _parse_kv_from_html(r.text)
        for k, v in stat_data.items():
            if k not in merged or not merged.get(k):
                merged[k] = v
        print(f"[MIKROBILL] usrstat keys={list(stat_data.keys())}")
    except Exception as e:
        print(f"[MIKROBILL] usrstat error: {e}")

    print(f"[MIKROBILL] user={login} merged_keys={list(merged.keys())}")
    for k, v in merged.items():
        print(f"[MIKROBILL] info[{k!r}] = {v!r}")
    return merged


def kassa_get_tariff_price(session, tariff_name):
    """Пытается получить цену тарифа из списка тарифов MikroBill."""
    if not tariff_name:
        return ''
    try:
        r = session.get(KASSA_URL + '/api.php?action=GET_TARIFFS', timeout=10)
        r.encoding = 'utf-8'
        text = r.text
        for line in text.split('\n'):
            if tariff_name.lower() in line.lower():
                nums = re.findall(r'(\d+[.,]?\d*)', line)
                if nums:
                    price = nums[-1].replace(',', '.')
                    print(f"[MIKROBILL] tariff_price: {tariff_name} = {price} (from GET_TARIFFS)")
                    return price
    except Exception as e:
        print(f"[MIKROBILL] GET_TARIFFS error: {e}")
    try:
        r = session.get(KASSA_URL + '/tariff.php', timeout=10)
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, 'html.parser')
        for tr in soup.find_all('tr'):
            row_text = tr.get_text(' ', strip=True)
            if tariff_name.lower() in row_text.lower():
                nums = re.findall(r'(\d{3,5}(?:[.,]\d+)?)', row_text)
                if nums:
                    price = nums[-1].replace(',', '.')
                    print(f"[MIKROBILL] tariff_price: {tariff_name} = {price} (from tariff.php)")
                    return price
    except Exception as e:
        print(f"[MIKROBILL] tariff.php error: {e}")
    return ''


PRICE_KEYS = [
    'персональная абон.плата', 'персональная абон. плата', 'персональная абонплата',
    'персональная абонентская плата', 'персональная оплата', 'персональная плата',
    'персональный тариф', 'перс.абон.плата', 'перс. абон. плата',
    'абон.плата', 'абон. плата', 'абонплата', 'абонентская плата',
    'стоимость', 'стоимость тарифа', 'цена', 'цена тарифа', 'сумма',
    'месячная плата', 'плата', 'тариф руб', 'руб/мес',
]

WORK_UNTIL_KEYS = [
    'баланса хватит до', 'хватит до', 'прогноз баланса', 'прогноз',
    'работает до', 'действует до', 'оплачено до', 'оплачено по',
    'дата окончания', 'дата след. списания',
    'действителен до', 'активен до', 'подключен до', 'заблокирован после', 'расчётная дата',
    'следующее списание', 'след. списание', 'даты',
    'примеч. 1', 'примечание 1', 'примеч.1', 'примечание',
]


def extract_work_until_from_dates(raw):
    """Из поля 'даты' вытаскивает финальную дату (работает до).

    В поле MikroBill обычно несколько дат (регистрация / активация / работает до).
    Берём МАКСИМАЛЬНУЮ (самую позднюю) — это и есть срок действия услуги.
    """
    if not raw:
        return ''
    import datetime as _dt
    dates = re.findall(r'(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})', raw)
    if not dates:
        return ''
    parsed = []
    for d, m, y in dates:
        try:
            dd, mm, yy = int(d), int(m), int(y)
            if yy < 100:
                yy += 2000
            parsed.append((_dt.date(yy, mm, dd), f"{dd:02d}.{mm:02d}.{yy:04d}"))
        except Exception:
            continue
    if not parsed:
        return ''
    parsed.sort(key=lambda x: x[0])
    return parsed[-1][1]


def pick_first(info, keys):
    for k in keys:
        v = info.get(k)
        if v:
            return v
    for key, val in info.items():
        for k in keys:
            if k in key and val:
                return val
    return ''


def kassa_get_payments(session, login, uid=''):
    """Берёт историю платежей со страницы usrstat.php?client=...&option2=2 (раздел «Платежи»).

    В качестве client пробуем сначала UID (как в реальной ссылке MikroBill: client=hVKeyxMZ),
    потом сам login (телефон/договор) — какой-то из них точно сработает.
    """
    payments = []
    candidates = []
    if uid:
        candidates.append(uid)
    if login and login not in candidates:
        candidates.append(login)

    urls = []
    for c in candidates:
        urls.append(KASSA_URL + '/usrstat.php?client=' + requests.utils.quote(c) + '&option2=2')
        urls.append(KASSA_URL + '/usrstat.php?client=' + requests.utils.quote(c))

    for url in urls:
        try:
            r = session.get(url, timeout=15)
            r.encoding = 'utf-8'
            html = r.text
        except Exception as e:
            print(f"[MIKROBILL] payments fetch error {url}: {e}")
            continue

        print(f"[MIKROBILL] payments url={url} html_len={len(html)}")
        soup = BeautifulSoup(html, 'html.parser')
        date_re = re.compile(r'\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?')
        amount_re = re.compile(r'(-?\+?\d+(?:[.,]\d+)?)')

        all_tables = soup.find_all('table')
        print(f"[MIKROBILL] payments tables_total={len(all_tables)}")

        for ti, table in enumerate(all_tables):
            rows = table.find_all('tr')
            if not rows:
                continue
            header_row = rows[0]
            headers = [th.get_text(' ', strip=True).lower() for th in header_row.find_all(['th', 'td'])]
            print(f"[MIKROBILL] payments table#{ti} rows={len(rows)} headers={headers}")
            is_payments = any(
                'дата' in h or 'сумма' in h or 'платёж' in h or 'платеж' in h or 'оплат' in h or 'попол' in h
                for h in headers
            )
            if not is_payments:
                continue

            # Определяем индексы колонок
            idx_date = idx_amount = idx_comment = idx_method = -1
            for i, h in enumerate(headers):
                if idx_date < 0 and 'дата' in h:
                    idx_date = i
                if idx_amount < 0 and ('сумма' in h or 'платёж' in h or 'платеж' in h or 'оплат' in h or 'попол' in h):
                    idx_amount = i
                if idx_comment < 0 and ('коммент' in h or 'примеч' in h or 'операц' in h or 'описан' in h):
                    idx_comment = i
                if idx_method < 0 and ('способ' in h or 'тип' in h or 'касса' in h or 'канал' in h):
                    idx_method = i

            for tr in rows[1:]:
                cells = [td.get_text(' ', strip=True) for td in tr.find_all('td')]
                if not cells or len(cells) < 2:
                    continue
                payment = {}

                # По индексам
                if 0 <= idx_date < len(cells):
                    dm = date_re.search(cells[idx_date])
                    if dm:
                        payment['date'] = dm.group(0)
                if 0 <= idx_amount < len(cells):
                    am = amount_re.search(cells[idx_amount].replace(' ', ''))
                    if am:
                        payment['amount'] = am.group(1).replace(',', '.')
                if 0 <= idx_comment < len(cells):
                    payment['comment'] = cells[idx_comment]
                if 0 <= idx_method < len(cells):
                    method = cells[idx_method]
                    if method:
                        payment['comment'] = (payment.get('comment') or '')
                        payment['comment'] = (payment['comment'] + ' · ' + method).strip(' ·') if payment['comment'] else method

                # Fallback: если не размеченные колонки, ищем дату/сумму в любом столбце
                if 'date' not in payment or 'amount' not in payment:
                    for j, cell in enumerate(cells):
                        if 'date' not in payment:
                            dm = date_re.search(cell)
                            if dm:
                                payment['date'] = dm.group(0)
                                continue
                        if 'amount' not in payment and j > 0:
                            am = amount_re.search(cell.replace(' ', ''))
                            if am:
                                val = am.group(1).replace(',', '.')
                                # пропустим случайные числа типа "1" в первой колонке
                                try:
                                    if abs(float(val)) >= 1:
                                        payment['amount'] = val
                                except Exception:
                                    pass

                if payment.get('date') and payment.get('amount'):
                    payments.append(payment)

            if payments:
                break  # таблица найдена — больше не обрабатываем

        if payments:
            break  # с первого URL получили данные

    # Дедуп по дате+сумме
    seen = set()
    uniq = []
    for p in payments:
        key = (p.get('date', ''), p.get('amount', ''))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(p)

    print(f"[MIKROBILL] payments count={len(uniq)} login={login}")
    return uniq[:100]


def build_user_data(login, found, info, session=None):
    speed = ''
    tariff = found.get('tariff', '') or info.get('тариф', '')
    speed_match = re.search(r'(\d+)', tariff)
    if speed_match:
        speed = speed_match.group(1) + ' Мбит/с'

    is_active = found.get('active', '') == '1'

    balance_raw = found.get('balance', '') or info.get('баланс', '')
    balance = re.search(r'(-?\d+[.,]?\d*)', balance_raw)
    balance_val = balance.group(1).replace(',', '.') if balance else '0'

    price_raw = pick_first(info, PRICE_KEYS)
    price_val = ''
    if price_raw:
        m = re.search(r'(\d+[.,]?\d*)', price_raw)
        if m:
            price_val = m.group(1).replace(',', '.')
    try:
        price_num = float(price_val) if price_val else 0.0
    except Exception:
        price_num = 0.0
    if price_num <= 0 and session is not None:
        got = kassa_get_tariff_price(session, tariff)
        if got:
            m = re.search(r'(\d+[.,]?\d*)', got)
            if m:
                price_val = m.group(1).replace(',', '.')
    if price_val in ('0', '0.0', '0.00'):
        price_val = ''

    work_until = ''
    candidates = []
    for k in WORK_UNTIL_KEYS:
        v = info.get(k)
        if v:
            candidates.append(v)
    for key, val in info.items():
        if not val:
            continue
        for k in WORK_UNTIL_KEYS:
            if k in key:
                candidates.append(val)
                break
    for raw in candidates:
        got = extract_work_until_from_dates(raw)
        if got:
            work_until = got
            break

    print(
        f"[MIKROBILL] built: login={login} tariff={tariff!r} balance={balance_val} "
        f"price={price_val!r} work_until={work_until!r}"
    )

    return {
        'login': login,
        'name': info.get('фио', found.get('name', '')),
        'balance': balance_val,
        'tariff': tariff,
        'speed': speed,
        'status': 'Активен' if is_active else 'Заблокирован',
        'account': info.get('договор', ''),
        'address': info.get('адрес', ''),
        'phone': info.get('телефон', ''),
        'email': info.get('e-mail', ''),
        'ip': found.get('ip', '') or info.get('ip', ''),
        'mac': info.get('mac', ''),
        'group': info.get('группа', ''),
        'credit': info.get('обещ. плат.', ''),
        'work_until': work_until,
        'price': price_val,
        'raw_info': info,
    }


def handle_auth(event, cors):
    raw = event.get('body') or '{}'
    if isinstance(raw, dict):
        body = raw
    else:
        try:
            body = json.loads(str(raw))
            if not isinstance(body, dict):
                body = {}
        except Exception:
            body = {}

    login = (body.get('login', '') or '').strip()
    password = (body.get('password', '') or '').strip()

    if not login or not password:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Введите логин и пароль'})}

    session = kassa_session()

    found = kassa_find_user(session, login)
    if not found:
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Абонент не найден'})}

    lk_session = requests.Session()
    lk_resp = lk_session.post(
        'http://lk.arttele.ru/login.php',
        data={'login': login, 'pass': password, 'go': ''},
        allow_redirects=False,
        timeout=15,
    )
    if lk_resp.status_code in (301, 302):
        redirect_url = lk_resp.headers.get('Location', '')
        lk_resp = lk_session.post(
            redirect_url,
            data={'login': login, 'pass': password, 'go': ''},
            timeout=15,
        )
    lk_resp.encoding = 'utf-8'
    if 'name="pass"' in lk_resp.text:
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

    info = kassa_get_user_info(session, login)
    user = build_user_data(login, found, info, session)

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'user': user}, ensure_ascii=False)}


def handle_user_info(event, cors):
    params = event.get('queryStringParameters') or {}
    login = params.get('login', '').strip()
    password = params.get('password', '').strip()

    if not login or not password:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Missing credentials'})}

    lk_session = requests.Session()
    lk_resp = lk_session.post(
        'http://lk.arttele.ru/login.php',
        data={'login': login, 'pass': password, 'go': ''},
        allow_redirects=False,
        timeout=15,
    )
    if lk_resp.status_code in (301, 302):
        redirect_url = lk_resp.headers.get('Location', '')
        lk_resp = lk_session.post(
            redirect_url,
            data={'login': login, 'pass': password, 'go': ''},
            timeout=15,
        )
    lk_resp.encoding = 'utf-8'
    if 'name="pass"' in lk_resp.text:
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Auth failed'})}

    session = kassa_session()
    found = kassa_find_user(session, login)
    if not found:
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'User not found'})}

    info = kassa_get_user_info(session, login)
    user = build_user_data(login, found, info, session)
    user['payments'] = kassa_get_payments(session, login, found.get('uid', ''))

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps(user, ensure_ascii=False)}