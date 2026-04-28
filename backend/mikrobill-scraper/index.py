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


def lk_get_payments(lk_session, login):
    """Парсит историю платежей из ЛК абонента (lk.arttele.ru), куда абонент входит сам.

    Сессия lk_session уже залогинена под этим абонентом. Пробуем разные пути,
    которые в типовых ЛК отвечают за финансовый отчёт.
    """
    import datetime as _dt
    payments = []

    today = _dt.date.today()
    date1 = (today - _dt.timedelta(days=365 * 2)).strftime('%d.%m.%Y')
    date2 = today.strftime('%d.%m.%Y')

    # Прямой URL финансовой страницы с историей платежей
    base_urls = [
        'http://lk.arttele.ru/payments.php',
        'http://lk.arttele.ru/index.php?menu=payments',
    ]

    date_re = re.compile(r'\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?')
    amount_re_loose = re.compile(r'(-?\+?\d+(?:[.,]\d+)?)')

    def parse_money_table(table):
        """Простой и надёжный парсер: ищем строки, где есть дата И число (сумма).

        Заголовок не обязателен — если в строке есть дата + сумма, считаем платежом.
        """
        result = []
        rows = table.find_all('tr')
        if len(rows) < 1:
            return result

        # Определяем индекс колонки "дата" из заголовка, если есть
        header_cells = [c.get_text(' ', strip=True).lower() for c in rows[0].find_all(['th', 'td'])]
        date_col = -1
        amount_col = -1
        balance_col = -1
        comment_col = -1
        for i, h in enumerate(header_cells):
            if date_col < 0 and ('дата' in h or 'врем' in h):
                date_col = i
            elif amount_col < 0 and 'сумма' in h:
                amount_col = i
            elif balance_col < 0 and 'баланс' in h:
                balance_col = i
            elif comment_col < 0 and ('коммент' in h or 'примеч' in h or 'описан' in h or 'назнач' in h):
                comment_col = i

        debug_count = 0
        for tr in rows:
            cells = [td.get_text(' ', strip=True).replace('\xa0', ' ') for td in tr.find_all(['td', 'th'])]
            if len(cells) < 2:
                continue

            # Ищем дату в любой клетке (приоритет — известная колонка date_col)
            date_str = ''
            date_cell_idx = -1
            if 0 <= date_col < len(cells):
                dm = date_re.search(cells[date_col])
                if dm:
                    date_str = dm.group(0)
                    date_cell_idx = date_col
            if not date_str:
                for i, cell in enumerate(cells):
                    dm = date_re.search(cell)
                    if dm:
                        date_str = dm.group(0)
                        date_cell_idx = i
                        break
            if not date_str:
                continue

            # Ищем сумму. Приоритет — amount_col, иначе ищем число в клетках кроме клетки с датой
            amount_str = ''
            if 0 <= amount_col < len(cells) and amount_col != date_cell_idx:
                m = re.search(r'-?\+?\d+(?:[.,]\d+)?', cells[amount_col])
                if m:
                    try:
                        if abs(float(m.group(0).replace(',', '.').replace('+', ''))) >= 0.01:
                            amount_str = m.group(0)
                    except Exception:
                        pass
            if not amount_str:
                for i, cell in enumerate(cells):
                    if i == date_cell_idx:
                        continue
                    m = re.search(r'-?\+?\d+(?:[.,]\d+)?', cell)
                    if not m:
                        continue
                    try:
                        val = float(m.group(0).replace(',', '.').replace('+', ''))
                    except Exception:
                        continue
                    if abs(val) >= 0.01:
                        amount_str = m.group(0)
                        amount_col_idx = i
                        break

            if not amount_str:
                continue

            balance_str = cells[balance_col] if 0 <= balance_col < len(cells) else ''
            comment_str = cells[comment_col] if 0 <= comment_col < len(cells) else ''
            if not comment_str:
                # последняя длинная клетка — обычно примечание
                for cell in reversed(cells):
                    if cell and not date_re.search(cell) and not re.fullmatch(r'-?\+?\d+(?:[.,]\d+)?', cell.strip()):
                        comment_str = cell
                        break

            if debug_count < 2:
                print(f"[LK] parsed row cells={cells} -> date={date_str} amount={amount_str} comment={comment_str[:50]}")
                debug_count += 1

            result.append({
                'date': date_str,
                'amount': amount_str.replace(',', '.').replace('+', ''),
                'comment': (comment_str or '')[:300],
                'balance_after': balance_str,
            })
        return result

    headers_req = {'User-Agent': 'Mozilla/5.0', 'Referer': 'http://lk.arttele.ru/'}

    for url in base_urls:
        for method, params in [
            ('GET', None),
            ('GET', {'date1': date1, 'date2': date2, 'records': '99999'}),
        ]:
            try:
                if method == 'POST':
                    r = lk_session.post(url, data=params or {}, headers=headers_req, timeout=15)
                else:
                    full_url = url
                    if params:
                        sep = '&' if '?' in url else '?'
                        full_url = url + sep + '&'.join(f'{k}={requests.utils.quote(v)}' for k, v in params.items())
                    r = lk_session.get(full_url, headers=headers_req, timeout=15)
                # Пробуем сначала apparent_encoding (cp1251), потом utf-8
                if r.apparent_encoding:
                    r.encoding = r.apparent_encoding
                html = r.text or ''
                if len(html) < 5000:
                    # вдруг не угадал — пробуем cp1251
                    try:
                        html = r.content.decode('cp1251', errors='ignore')
                    except Exception:
                        pass
            except Exception as e:
                print(f"[LK] payments {method} {url} error: {e}")
                continue

            print(f"[LK] payments {method} {url} status={r.status_code} len={len(html)} enc={r.encoding}")
            if len(html) < 500:
                continue
            if 'name="pass"' in html or 'name="login"' in html:
                continue

            # Проверяем наличие iframe/ссылок на «настоящую» страницу с историей
            iframe_match = re.search(r'<iframe[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
            link_targets = re.findall(r'(?:href|src|action)=["\']([^"\']*(?:money|payment|finance|stat|report)[^"\']*)["\']', html, re.IGNORECASE)
            print(f"[LK] iframe={iframe_match.group(1) if iframe_match else None} links={link_targets[:8]}")

            # Если есть iframe — грузим его
            target_urls = []
            if iframe_match:
                iframe_src = iframe_match.group(1)
                if iframe_src.startswith('http'):
                    target_urls.append(iframe_src)
                else:
                    target_urls.append('http://lk.arttele.ru/' + iframe_src.lstrip('/'))
            for lt in link_targets[:10]:
                if lt.startswith('http'):
                    target_urls.append(lt)
                elif lt.startswith('/'):
                    target_urls.append('http://lk.arttele.ru' + lt)
                else:
                    target_urls.append('http://lk.arttele.ru/' + lt)

            # Если нашли потенциальные внутренние ссылки — загружаем их и парсим
            extra_html_blobs = [html]
            for tu in target_urls[:5]:
                try:
                    rr = lk_session.get(tu, headers=headers_req, timeout=10)
                    if rr.apparent_encoding:
                        rr.encoding = rr.apparent_encoding
                    extra_html = rr.text or ''
                    if len(extra_html) < 5000:
                        extra_html = rr.content.decode('cp1251', errors='ignore')
                    print(f"[LK] sub GET {tu} status={rr.status_code} len={len(extra_html)}")
                    if len(extra_html) > 500:
                        extra_html_blobs.append(extra_html)
                except Exception as e:
                    print(f"[LK] sub error {tu}: {e}")

            # Парсим сырой HTML через regex — надёжнее BeautifulSoup на кривом markup
            for blob in extra_html_blobs:
                tr_blocks = re.findall(r'<tr[^>]*>(.*?)</tr>', blob, re.IGNORECASE | re.DOTALL)
                print(f"[LK] regex tr_blocks={len(tr_blocks)}")
                debug_dumped = False
                for tr_html in tr_blocks:
                    cell_html = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr_html, re.IGNORECASE | re.DOTALL)
                    if not cell_html:
                        cell_html = re.split(r'<br\s*/?>', tr_html, flags=re.IGNORECASE)
                    if not debug_dumped:
                        debug_dumped = True
                        print(f"[LK] sample tr (cells={len(cell_html)}): {tr_html[:500]!r}")
                    cells = []
                    for c in cell_html:
                        text = re.sub(r'<[^>]+>', ' ', c)
                        text = (text.replace('&nbsp;', ' ').replace('&amp;', '&')
                                    .replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
                                    .replace('\xa0', ' '))
                        text = re.sub(r'\s+', ' ', text).strip()
                        if text:
                            cells.append(text)
                    if len(cells) < 2:
                        continue

                    date_str = ''
                    date_idx = -1
                    for i, cell in enumerate(cells):
                        dm = date_re.search(cell)
                        if dm:
                            date_str = dm.group(0)
                            date_idx = i
                            break
                    if not date_str:
                        continue

                    amount_str = ''
                    amount_idx = -1
                    for i, cell in enumerate(cells):
                        if i == date_idx:
                            continue
                        m = re.search(r'-?\+?\d+(?:[.,]\d+)?', cell)
                        if not m:
                            continue
                        try:
                            val = float(m.group(0).replace(',', '.').replace('+', ''))
                        except Exception:
                            continue
                        if abs(val) >= 0.5:
                            amount_str = m.group(0)
                            amount_idx = i
                            break
                    if not amount_str:
                        continue

                    comment_str = ''
                    for i in range(len(cells) - 1, -1, -1):
                        if i in (date_idx, amount_idx):
                            continue
                        cell = cells[i]
                        if re.fullmatch(r'-?\+?\d+(?:[.,]\d+)?', cell):
                            continue
                        if len(cell) > 2:
                            comment_str = cell
                            break

                    balance_str = ''
                    for i, cell in enumerate(cells):
                        if i in (date_idx, amount_idx):
                            continue
                        if re.fullmatch(r'-?\+?\d+(?:[.,]\d+)?', cell):
                            balance_str = cell
                            break

                    payments.append({
                        'date': date_str,
                        'amount': amount_str.replace(',', '.').replace('+', ''),
                        'comment': comment_str[:300],
                        'balance_after': balance_str,
                    })

                if payments:
                    print(f"[LK] regex parsed={len(payments)}")
                    break

            if payments:
                print(f"[LK] payments found via {method} {url} = {len(payments)}")
                break
        if payments:
            break

    seen = set()
    uniq = []
    for p in payments:
        key = (p.get('date', ''), p.get('amount', ''), p.get('comment', '')[:40])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(p)

    def _sort_key(p):
        m = re.match(r'(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?', p.get('date', ''))
        if not m:
            return (0,)
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        h = int(m.group(4) or 0)
        mi = int(m.group(5) or 0)
        s = int(m.group(6) or 0)
        return (y, mo, d, h, mi, s)
    uniq.sort(key=_sort_key, reverse=True)

    print(f"[LK] payments count={len(uniq)} login={login}")
    return uniq[:200]


def kassa_get_payments(session, login, uid=''):
    """Берёт «Финансовый отчёт» абонента из MikroBill.

    Финансовый отчёт лежит в блоке #moneyslist на usrstat.php?client=...&option2=2,
    но появляется только при передаче дат через GET (date1, date2).
    Колонки: Время | Логин | Сумма | Валюта | Баланс | Комментарий | Кассир.
    """
    import datetime as _dt
    payments = []

    # Период — последние 24 месяца, чтоб точно поймать всё
    today = _dt.date.today()
    date1 = (today - _dt.timedelta(days=365 * 2)).strftime('%d.%m.%Y')
    date2 = today.strftime('%d.%m.%Y')

    # Кандидаты для параметра client — финотчёт работает через короткий UID (типа hVKeyxMZ),
    # но и login/uid тоже пробуем на случай если редирект сработает
    candidates = []
    for v in (uid, login):
        if v and v not in candidates:
            candidates.append(v)

    base_params = (
        '&option2=2&date1=' + requests.utils.quote(date1)
        + '&date2=' + requests.utils.quote(date2)
        + '&records=99999'
    )
    # Только usrstat.php — другие пути все возвращают 146 байт
    urls = []
    for c in candidates:
        q_client = requests.utils.quote(c)
        urls.append(KASSA_URL + '/usrstat.php?client=' + q_client + base_params)

    date_re = re.compile(r'\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?')
    amount_re = re.compile(r'^-?\+?\d+(?:[.,]\d+)?$')

    def parse_money_table(table):
        """Парсит таблицу финансового отчёта (Время|Логин|Сумма|Валюта|Баланс|Комментарий|Кассир)."""
        result = []
        rows = table.find_all('tr')
        if len(rows) < 2:
            return result
        header_cells = [c.get_text(' ', strip=True).lower() for c in rows[0].find_all(['th', 'td'])]
        # Должны быть знакомые колонки
        has_time = any('врем' in h or 'дата' in h for h in header_cells)
        has_amount = any('сумма' in h for h in header_cells)
        if not (has_time and has_amount):
            return result

        idx = {'time': -1, 'login': -1, 'amount': -1, 'currency': -1,
               'balance': -1, 'comment': -1, 'cashier': -1}
        for i, h in enumerate(header_cells):
            if idx['time'] < 0 and ('врем' in h or 'дата' in h):
                idx['time'] = i
            elif idx['login'] < 0 and ('логин' in h or 'login' in h):
                idx['login'] = i
            elif idx['amount'] < 0 and 'сумма' in h:
                idx['amount'] = i
            elif idx['currency'] < 0 and 'валют' in h:
                idx['currency'] = i
            elif idx['balance'] < 0 and 'баланс' in h:
                idx['balance'] = i
            elif idx['comment'] < 0 and ('коммент' in h or 'примеч' in h or 'описан' in h or 'назнач' in h):
                idx['comment'] = i
            elif idx['cashier'] < 0 and ('касс' in h or 'оператор' in h or 'плательщ' in h):
                idx['cashier'] = i

        for tr in rows[1:]:
            cells = [td.get_text(' ', strip=True) for td in tr.find_all('td')]
            if len(cells) < 3:
                continue

            def get(key):
                i = idx.get(key, -1)
                return cells[i] if 0 <= i < len(cells) else ''

            time_raw = get('time')
            amount_raw = get('amount').replace(' ', '').replace('\xa0', '')

            dm = date_re.search(time_raw)
            am = amount_re.match(amount_raw) if amount_raw else None
            if not dm or not am:
                continue

            comment_parts = []
            c = get('comment')
            if c:
                comment_parts.append(c)
            cashier = get('cashier')
            if cashier:
                comment_parts.append(cashier)

            result.append({
                'date': dm.group(0),
                'amount': am.group(0).replace(',', '.'),
                'comment': ' · '.join(comment_parts)[:300],
                'balance_after': get('balance'),
            })
        return result

    headers_req = {
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': KASSA_URL + '/usrstat.php',
        'User-Agent': 'Mozilla/5.0',
    }

    # Шаг 0: загружаем usrstat.php по login и пытаемся вытащить «короткий» внутренний UID
    # из ссылок/инпутов на странице — он понадобится для финансового отчёта
    try:
        first_url = KASSA_URL + '/usrstat.php?client=' + requests.utils.quote(login)
        first_html = session.get(first_url, headers=headers_req, timeout=15).text
        first_html = first_html if isinstance(first_html, str) else ''
        # Ищем UID в формате client=XXXXXX в ссылках, action, hidden inputs
        uid_matches = re.findall(r'client=([A-Za-z0-9]{6,16})', first_html)
        # фильтруем — это не должно быть длинным числом-телефоном
        short_uid_extracted = ''
        for u in uid_matches:
            if u == login or u == uid:
                continue
            if u.isdigit() and len(u) > 10:
                continue
            short_uid_extracted = u
            break
        if not short_uid_extracted:
            # Иногда UID в onclick типа open('hVKeyxMZ')
            m = re.search(r"['\"]([A-Za-z][A-Za-z0-9]{5,12})['\"]", first_html)
            if m and m.group(1).lower() not in ('option2', 'records', 'submit', 'usrstat'):
                short_uid_extracted = m.group(1)
        if short_uid_extracted:
            print(f"[MIKROBILL] extracted short uid = {short_uid_extracted!r}")
            if short_uid_extracted not in candidates:
                candidates.insert(0, short_uid_extracted)
                # Перестраиваем urls с новым кандидатом
                urls = []
                for c in candidates:
                    q_client = requests.utils.quote(c)
                    urls.append(KASSA_URL + '/usrstat.php?client=' + q_client + base_params)
    except Exception as e:
        print(f"[MIKROBILL] short uid extract error: {e}")

    def try_request(url, method='GET', data=None):
        try:
            if method == 'POST':
                r = session.post(url, data=data or {}, headers=headers_req, timeout=20)
            else:
                r = session.get(url, headers=headers_req, timeout=20)
            r.encoding = 'utf-8'
            return r.text
        except Exception as e:
            print(f"[MIKROBILL] payments fetch error {method} {url}: {e}")
            return ''

    all_attempts = [('GET', u, None) for u in urls]

    for method, url, data in all_attempts:
        html = try_request(url, method, data)
        if not html:
            continue

        # признак, что на странице вообще есть таблица отчёта
        has_money_marker = ('финансов' in html.lower() or 'moneyslist' in html.lower()
                            or 'комментар' in html.lower())

        print(f"[MIKROBILL] payments {method} url={url} html_len={len(html)} marker={has_money_marker}")
        soup = BeautifulSoup(html, 'html.parser')

        # 1) Блок #moneyslist
        money_block = soup.find(id='moneyslist') or soup.select_one('.center2#moneyslist') or soup.select_one('.center2')
        if money_block:
            for table in money_block.find_all('table'):
                payments.extend(parse_money_table(table))

        # 2) Любые таблицы страницы
        if not payments:
            for table in soup.find_all('table'):
                payments.extend(parse_money_table(table))

        if payments:
            print(f"[MIKROBILL] payments found via {method} {url} = {len(payments)}")
            break

    # Дедуп по дате+сумме
    seen = set()
    uniq = []
    for p in payments:
        key = (p.get('date', ''), p.get('amount', ''), p.get('comment', '')[:40])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(p)

    # Сортируем по дате (новые сверху)
    def _sort_key(p):
        m = re.match(r'(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?', p.get('date', ''))
        if not m:
            return (0,)
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        h = int(m.group(4) or 0)
        mi = int(m.group(5) or 0)
        s = int(m.group(6) or 0)
        return (y, mo, d, h, mi, s)
    uniq.sort(key=_sort_key, reverse=True)

    print(f"[MIKROBILL] payments count={len(uniq)} login={login}")
    return uniq[:200]


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

    # Сначала пробуем ЛК-сессию абонента (lk.arttele.ru) — там не нужен короткий UID
    payments = []
    try:
        payments = lk_get_payments(lk_session, login)
    except Exception as e:
        print(f"[LK] payments error: {e}")

    if not payments:
        payments = kassa_get_payments(session, login, found.get('uid', ''))

    user['payments'] = payments

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps(user, ensure_ascii=False)}