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
    elif action == 'speed_history':
        return handle_speed_history(event, cors)
    elif action == 'ping':
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'status': 'ok'})}
    else:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Unknown action'})}


def handle_news(event, cors):
    """Получает список объявлений (новостей) из MikroBill через api.php?action=GET_NEWS.

    Формат ответа: записи разделены '*//*', поля внутри — '||'.
    Колонки: 0=id, 1=timestamp(unix), 2=title, 3=text, 4=visible_flag, 5=views
    """
    import datetime as _dt
    params = event.get('queryStringParameters') or {}
    try:
        limit = int(params.get('limit', '0') or 0)
    except Exception:
        limit = 0

    raw = ''
    try:
        s = kassa_session()
        r = s.get(KASSA_URL + '/api.php?action=GET_NEWS', timeout=15)
        r.encoding = 'utf-8'
        raw = r.text or ''
        print(f"[MIKROBILL] GET_NEWS len={len(raw)}")
    except Exception as e:
        print(f"[MIKROBILL] news fetch error: {e}")
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'news': []}, ensure_ascii=False)}

    news = []
    # Если касса вернула логин-форму вместо данных
    if 'chaiserlogin' in raw or 'chaiserpassword' in raw:
        print("[MIKROBILL] news: kassa session not authorized")
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'news': []}, ensure_ascii=False)}

    items = [chunk for chunk in raw.split('*//*') if chunk and '||' in chunk]
    for chunk in items:
        cols = chunk.split('||')
        if len(cols) < 6:
            continue
        try:
            ts = int(cols[1])
        except Exception:
            ts = 0
        title = (cols[2] or '').strip()
        text = (cols[3] or '').strip()
        visible = (cols[4] or '').strip()
        if visible == '0':
            continue
        if not title and not text:
            continue
        if ts > 0:
            try:
                date = _dt.datetime.fromtimestamp(ts).strftime('%d.%m.%Y')
            except Exception:
                date = ''
        else:
            date = ''
        # Декодируем спец-символы и переводы строк
        text = text.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\r\n', '\n')
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<[^>]+>', '', text).strip()
        title = re.sub(r'<[^>]+>', '', title).strip()
        news.append({'date': date, 'title': title or 'Объявление', 'text': text, 'ts': ts})

    # Сортируем по времени, свежие первыми
    news.sort(key=lambda x: x.get('ts', 0), reverse=True)
    for n in news:
        n.pop('ts', None)

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

    Тянем value2=0/1/2 + usrstat.php ПАРАЛЛЕЛЬНО (4 потока),
    чтобы не ждать суммы 4×10s, а уложиться в ~10s максимум.
    Результаты объединяем в порядке приоритета: 0 → 1 → 2 → usrstat.
    """
    from concurrent.futures import ThreadPoolExecutor

    quoted = requests.utils.quote(login)
    tasks = [
        ('0', KASSA_URL + '/api.php?action=GET_USER_INFO&value=' + quoted + '&value2=0'),
        ('1', KASSA_URL + '/api.php?action=GET_USER_INFO&value=' + quoted + '&value2=1'),
        ('2', KASSA_URL + '/api.php?action=GET_USER_INFO&value=' + quoted + '&value2=2'),
        ('usrstat', KASSA_URL + '/usrstat.php?client=' + quoted),
    ]

    def fetch(item):
        tag, url = item
        try:
            r = session.get(url, timeout=10)
            r.encoding = 'utf-8'
            return tag, _parse_kv_from_html(r.text), None
        except Exception as e:
            return tag, {}, str(e)

    results = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        for tag, data, err in pool.map(fetch, tasks):
            if err:
                print(f"[MIKROBILL] {tag} error: {err}")
            else:
                print(f"[MIKROBILL] user={login} {tag} keys={list(data.keys())}")
            results[tag] = data

    merged = {}
    for tag in ('0', '1', '2', 'usrstat'):
        for k, v in results.get(tag, {}).items():
            if k not in merged or not merged.get(k):
                merged[k] = v

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

    # Только один URL — самый рабочий
    base_urls = [
        f'http://lk.arttele.ru/payments.php?date1={date1}&date2={date2}&records=99999',
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
                # Декодируем умно: пробуем оба варианта (utf-8 и cp1251),
                # выбираем тот, где БОЛЬШЕ валидной русской кириллицы.
                content = r.content or b''
                try:
                    html_utf = content.decode('utf-8', errors='replace')
                except Exception:
                    html_utf = ''
                try:
                    html_cp = content.decode('cp1251', errors='replace')
                except Exception:
                    html_cp = ''

                def _ru_score(s):
                    if not s:
                        return -1
                    # «Хорошие» русские буквы — нижний/верхний регистр базовой кириллицы
                    good = sum(1 for ch in s if ('\u0430' <= ch <= '\u044f') or ('\u0410' <= ch <= '\u042f') or ch in 'ёЁ')
                    # «Подозрительные» одиночные Р / С (типичный признак cp1251-в-utf8 mojibake)
                    bad = sum(1 for ch in s if ch in 'РђСЂСѓРѕРµРёРЅРєР»РјРЅРѕРіРґРјРЅРѕРїСЂСЃС')
                    return good - bad
                score_utf = _ru_score(html_utf)
                score_cp = _ru_score(html_cp)
                if score_cp >= score_utf and html_cp:
                    html = html_cp
                    r.encoding = 'cp1251'
                else:
                    html = html_utf or html_cp
                    if r.apparent_encoding:
                        r.encoding = r.apparent_encoding
            except Exception as e:
                print(f"[LK] payments {method} {url} error: {e}")
                continue

            print(f"[LK] payments {method} {url} status={r.status_code} len={len(html)} enc={r.encoding}")
            if len(html) < 500:
                continue
            if 'name="pass"' in html or 'name="login"' in html:
                continue

            # Прямой URL — sub-запросы не нужны
            extra_html_blobs = [html]

            # Месяц словом → номер
            months_ru = {
                'январ': 1, 'феврал': 2, 'март': 3, 'апрел': 4, 'мая': 5, 'мае': 5, 'май': 5,
                'июн': 6, 'июл': 7, 'август': 8, 'сентябр': 9, 'октябр': 10, 'ноябр': 11, 'декабр': 12,
            }

            def parse_lk_date(text):
                """'18 Апреля 00:58' или '01.04.2026 12:30' → 'DD.MM.YYYY HH:MM'."""
                t = text.strip().lower()
                # формат с цифрами (на всякий случай)
                m = re.search(r'(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?', t)
                if m:
                    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
                    if y < 100:
                        y += 2000
                    h = m.group(4) or '00'
                    mi = m.group(5) or '00'
                    return f"{d:02d}.{mo:02d}.{y} {int(h):02d}:{int(mi):02d}"
                # формат "18 Апреля 00:58"
                m = re.search(r'(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?(?:\s+(\d{1,2}):(\d{2}))?', t)
                if m:
                    d = int(m.group(1))
                    mon_word = m.group(2)
                    mo = 0
                    for k, v in months_ru.items():
                        if mon_word.startswith(k):
                            mo = v
                            break
                    if mo:
                        y = int(m.group(3)) if m.group(3) else _dt.date.today().year
                        h = m.group(4) or '00'
                        mi = m.group(5) or '00'
                        return f"{d:02d}.{mo:02d}.{y} {int(h):02d}:{int(mi):02d}"
                return ''

            for blob in extra_html_blobs:
                tr_blocks = re.findall(r'<tr[^>]*>(.*?)</tr>', blob, re.IGNORECASE | re.DOTALL)
                print(f"[LK] regex tr_blocks={len(tr_blocks)}")
                _dbg_count = 0
                for tr_idx, tr_html in enumerate(tr_blocks):
                    cell_html = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr_html, re.IGNORECASE | re.DOTALL)
                    if _dbg_count < 4 and len(cell_html) >= 3:
                        _preview_cells = []
                        for _c in cell_html[:8]:
                            _t = re.sub(r'<[^>]+>', ' ', _c)
                            _t = re.sub(r'\s+', ' ', _t).strip()
                            _preview_cells.append(_t[:60])
                        print(f"[LK] dbg row#{tr_idx} cells={len(cell_html)}: {_preview_cells}")
                        _dbg_count += 1
                    if len(cell_html) < 3:
                        continue

                    # Текстовые версии ячеек + raw HTML (для иконок)
                    cells = []
                    raws = []
                    for c in cell_html:
                        raws.append(c)
                        text = re.sub(r'<[^>]+>', ' ', c)
                        text = (text.replace('&nbsp;', ' ').replace('&amp;', '&')
                                    .replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
                                    .replace('\xa0', ' '))
                        text = re.sub(r'\s+', ' ', text).strip()
                        cells.append(text)

                    # Ищем колонку с датой
                    date_str = ''
                    date_idx = -1
                    for i, cell in enumerate(cells):
                        d = parse_lk_date(cell)
                        if d:
                            date_str = d
                            date_idx = i
                            break
                    if not date_str:
                        continue

                    # Ищем тип операции по иконке (fa-plus-circle / fa-minus-circle / fa-envelope-open)
                    op_type = ''
                    for raw in raws:
                        m = re.search(r'fa-(plus[a-z\-]*|minus[a-z\-]*|envelope[a-z\-]*|arrow-(?:up|down)[a-z\-]*|wallet|money[a-z\-]*)', raw, re.IGNORECASE)
                        if m:
                            op_type = m.group(1).lower()
                            break

                    # Ищем сумму — первая числовая ячейка после даты
                    amount_val = None
                    amount_idx = -1
                    for i in range(date_idx + 1, len(cells)):
                        cell = cells[i]
                        # отбрасываем явный «баланс: ...» если он стоит как label, но числа тоже подходят
                        m = re.search(r'(-?\+?\d+(?:[.,]\d{1,2})?)', cell)
                        if not m:
                            continue
                        try:
                            v = float(m.group(1).replace(',', '.'))
                        except Exception:
                            continue
                        if abs(v) < 0.01:
                            continue
                        # Пропускаем ячейки, где число — это явно баланс (в LK обычно есть data-html="Баланс")
                        amount_val = v
                        amount_idx = i
                        break
                    if amount_val is None:
                        continue

                    # Баланс — следующая числовая ячейка после суммы
                    balance_str = ''
                    for i in range(amount_idx + 1, len(cells)):
                        m = re.search(r'(-?\+?\d+(?:[.,]\d{1,2})?)', cells[i])
                        if m:
                            try:
                                balance_str = f"{float(m.group(1).replace(',', '.')):.2f}"
                                break
                            except Exception:
                                pass

                    # Комментарий — последняя текстовая ячейка без числа в одиночестве
                    comment_str = ''
                    for i in range(len(cells) - 1, max(amount_idx, date_idx), -1):
                        cell = cells[i]
                        if not cell:
                            continue
                        # пропускаем чисто числовые/денежные ячейки
                        if re.fullmatch(r'\s*-?\+?\d+(?:[.,]\d{1,2})?\s*(?:руб\.?)?\s*', cell, re.IGNORECASE):
                            continue
                        if 'баланс' in cell.lower() and len(cell) < 30:
                            continue
                        if len(cell) >= 2:
                            comment_str = cell
                            break

                    is_payment = 'plus' in op_type or 'arrow-up' in op_type or 'wallet' in op_type or 'money' in op_type
                    is_charge = 'envelope' in op_type or 'minus' in op_type or 'arrow-down' in op_type
                    # Если иконки нет — определяем по знаку суммы
                    if not is_payment and not is_charge:
                        is_payment = amount_val > 0
                        is_charge = amount_val < 0

                    payments.append({
                        'date': date_str,
                        'amount': f"{amount_val:.2f}",
                        'comment': comment_str[:300],
                        'balance_after': balance_str,
                        'type': 'payment' if is_payment else ('charge' if is_charge else 'other'),
                    })

                if payments:
                    # Считаем платежи по 100 руб для отладки
                    p100 = [p for p in payments if p.get('amount') == '100.00']
                    print(f"[LK] regex parsed={len(payments)} p100_count={len(p100)}")
                    print(f"[LK] first 5 payments: {[(p['date'], p['amount'], p.get('balance_after')) for p in payments[:5]]}")
                    break

            if payments:
                print(f"[LK] payments found via {method} {url} = {len(payments)}")
                break
        if payments:
            break

    # Дедуп ТОЛЬКО строго идентичных строк — балансы after разные → платежи разные
    seen = set()
    uniq = []
    for p in payments:
        key = (p.get('date', ''), p.get('amount', ''), p.get('comment', ''), p.get('balance_after', ''))
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

    # Месяцы для парсинга формата "18 Апреля 00:58"
    months_ru = {
        'январ': 1, 'феврал': 2, 'март': 3, 'апрел': 4, 'мая': 5, 'мае': 5, 'май': 5,
        'июн': 6, 'июл': 7, 'август': 8, 'сентябр': 9, 'октябр': 10, 'ноябр': 11, 'декабр': 12,
    }

    def parse_kassa_date(text):
        t = text.strip().lower()
        m = re.search(r'(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?', t)
        if m:
            d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if y < 100:
                y += 2000
            h = m.group(4) or '00'
            mi = m.group(5) or '00'
            return f"{d:02d}.{mo:02d}.{y} {int(h):02d}:{int(mi):02d}"
        m = re.search(r'(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?(?:\s+(\d{1,2}):(\d{2}))?', t)
        if m:
            d = int(m.group(1))
            mon_word = m.group(2)
            mo = 0
            for k, v in months_ru.items():
                if mon_word.startswith(k):
                    mo = v
                    break
            if mo:
                import datetime as _dt
                y = int(m.group(3)) if m.group(3) else _dt.date.today().year
                h = m.group(4) or '00'
                mi = m.group(5) or '00'
                return f"{d:02d}.{mo:02d}.{y} {int(h):02d}:{int(mi):02d}"
        return ''

    for method, url, data in all_attempts:
        html = try_request(url, method, data)
        if not html:
            continue

        has_money_marker = ('финансов' in html.lower() or 'moneyslist' in html.lower()
                            or 'комментар' in html.lower())

        print(f"[MIKROBILL] payments {method} url={url} html_len={len(html)} marker={has_money_marker}")

        # Ищем все ссылки/onclick содержащие money/finans/payment
        money_links = re.findall(r'(?:href|src|onclick|action)\s*=\s*["\']([^"\']*(?:money|finans|payment|stat|report|history)[^"\']*)["\']', html, re.IGNORECASE)
        print(f"[MIKROBILL] money_links={money_links[:10]}")
        # Ищем JS вызовы типа open/load/show с строкой
        js_calls = re.findall(r'(?:open|load|show|get)\s*\(\s*["\']([a-zA-Z][\w\.\-/]+\.php[^"\']*)["\']', html, re.IGNORECASE)
        print(f"[MIKROBILL] js_calls={js_calls[:10]}")

        # Regex по сырому HTML (надёжнее BeautifulSoup)
        tr_blocks = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.IGNORECASE | re.DOTALL)
        print(f"[MIKROBILL] kassa tr_blocks={len(tr_blocks)}")
        debug_dump = 0
        sample_dumped = 0
        for tr_html in tr_blocks:
            cell_html = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr_html, re.IGNORECASE | re.DOTALL)
            if sample_dumped < 3 and len(cell_html) >= 3:
                sample_dumped += 1
                print(f"[MIKROBILL] kassa sample tr (cells={len(cell_html)}): {tr_html[:600]!r}")
            if len(cell_html) < 3:
                continue

            cells = []
            for c in cell_html:
                text = re.sub(r'<[^>]+>', ' ', c)
                text = (text.replace('&nbsp;', ' ').replace('&amp;', '&')
                            .replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
                            .replace('\xa0', ' '))
                text = re.sub(r'\s+', ' ', text).strip()
                cells.append(text)

            # Пропускаем строку-заголовок
            if any('сумма' in c.lower() or 'дата' in c.lower() or 'время' in c.lower() for c in cells if len(c) < 30):
                # Может быть это header — проверим по наличию даты
                if not any(parse_kassa_date(c) for c in cells):
                    continue

            # Дата
            date_str = ''
            date_idx = -1
            for i, cell in enumerate(cells):
                d = parse_kassa_date(cell)
                if d:
                    date_str = d
                    date_idx = i
                    break
            if not date_str:
                continue

            # Сумма — первая клетка с числом != балансом (берём первое число после даты)
            amount_str = ''
            amount_idx = -1
            for i, cell in enumerate(cells):
                if i == date_idx:
                    continue
                m = re.search(r'-?\d+(?:[.,]\d+)?', cell)
                if not m:
                    continue
                try:
                    val = float(m.group(0).replace(',', '.'))
                except Exception:
                    continue
                if abs(val) >= 0.01:
                    amount_str = f"{val:.2f}"
                    amount_idx = i
                    break
            if not amount_str:
                continue

            # Баланс — следующее число
            balance_str = ''
            for i, cell in enumerate(cells):
                if i in (date_idx, amount_idx):
                    continue
                m = re.search(r'-?\d+(?:[.,]\d+)?', cell)
                if m:
                    try:
                        balance_str = f"{float(m.group(0).replace(',', '.')):.2f}"
                        break
                    except Exception:
                        pass

            # Комментарий — последняя длинная клетка
            comment_str = ''
            for i in range(len(cells) - 1, -1, -1):
                if i in (date_idx, amount_idx):
                    continue
                cell = cells[i]
                if len(cell) > 3 and not re.fullmatch(r'-?\d+(?:[.,]\d+)?', cell):
                    comment_str = cell
                    break

            if debug_dump < 3:
                print(f"[MIKROBILL] kassa row: date={date_str} amount={amount_str} bal={balance_str} cmt={comment_str[:60]}")
                debug_dump += 1

            payments.append({
                'date': date_str,
                'amount': amount_str,
                'comment': comment_str[:300],
                'balance_after': balance_str,
            })

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


def kassa_get_daystat_payments(session, login, months_back=24):
    """Тянет платежи из daystat.php (помесячно) — fallback для абонентов,
    у которых usrstat.php не отдаёт таблицу финотчёта.
    """
    import datetime as _dt
    payments = []
    today = _dt.date.today()
    headers_req = {'User-Agent': 'Mozilla/5.0', 'Referer': KASSA_URL + '/usrstat.php'}

    months_ru = {
        'январ': 1, 'феврал': 2, 'март': 3, 'апрел': 4, 'мая': 5, 'мае': 5, 'май': 5,
        'июн': 6, 'июл': 7, 'август': 8, 'сентябр': 9, 'октябр': 10, 'ноябр': 11, 'декабр': 12,
    }

    def parse_d(text, default_year):
        t = (text or '').strip().lower()
        m = re.search(r'(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?', t)
        if m:
            d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if y < 100:
                y += 2000
            h = m.group(4) or '00'
            mi = m.group(5) or '00'
            return f"{d:02d}.{mo:02d}.{y} {int(h):02d}:{int(mi):02d}"
        m = re.search(r'(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?(?:\s+(\d{1,2}):(\d{2}))?', t)
        if m:
            d = int(m.group(1))
            mon_word = m.group(2)
            mo = 0
            for k, v in months_ru.items():
                if mon_word.startswith(k):
                    mo = v
                    break
            if mo:
                y = int(m.group(3)) if m.group(3) else default_year
                h = m.group(4) or '00'
                mi = m.group(5) or '00'
                return f"{d:02d}.{mo:02d}.{y} {int(h):02d}:{int(mi):02d}"
        # Просто число — день месяца
        m = re.match(r'^\s*(\d{1,2})\s*$', t)
        if m:
            return f"{int(m.group(1)):02d}.??.{default_year} 00:00"
        return ''

    # Собираем (year, month) на N месяцев назад
    pairs = []
    y, mo = today.year, today.month
    for _ in range(months_back):
        pairs.append((y, mo))
        mo -= 1
        if mo == 0:
            mo = 12
            y -= 1

    for year, month in pairs:
        url = f"{KASSA_URL}/daystat.php?year={year}&month={month}&client={requests.utils.quote(login)}"
        try:
            r = session.get(url, headers=headers_req, timeout=15)
            r.encoding = 'utf-8'
            html = r.text or ''
        except Exception as e:
            print(f"[DAYSTAT] {url} error: {e}")
            continue
        if len(html) < 200 or 'chaiserlogin' in html:
            continue

        # Ищем суммы оплат в строках. У daystat обычно есть колонки:
        # день/дата, входящий трафик, исходящий трафик, абонплата, оплата, баланс, комментарий
        tr_blocks = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.IGNORECASE | re.DOTALL)
        for tr_html in tr_blocks:
            cell_html = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', tr_html, re.IGNORECASE | re.DOTALL)
            if len(cell_html) < 3:
                continue
            cells = []
            for c in cell_html:
                t = re.sub(r'<[^>]+>', ' ', c)
                t = (t.replace('&nbsp;', ' ').replace('&amp;', '&').replace('\xa0', ' '))
                t = re.sub(r'\s+', ' ', t).strip()
                cells.append(t)
            # Пропускаем строку-заголовок
            joined_low = ' '.join(cells).lower()
            if 'сумма' in joined_low and not any(re.search(r'\d{2}[./\-]\d{2}', c) for c in cells):
                continue
            if 'итого' in joined_low or 'всего' in joined_low:
                continue

            date_str = ''
            date_idx = -1
            for i, cell in enumerate(cells):
                d = parse_d(cell, year)
                if d and not d.startswith('??'):
                    date_str = d.replace('??', f"{month:02d}")
                    date_idx = i
                    break
                if d:
                    date_str = d.replace('??', f"{month:02d}")
                    date_idx = i
            if not date_str:
                continue

            # Ищем сумму платежа — берём положительное число > 10 (не трафик в Мб с дробями)
            # Платёж — это число в колонках после даты
            amount_str = ''
            amount_idx = -1
            for i, cell in enumerate(cells):
                if i == date_idx:
                    continue
                # игнорим явные «Мб/Кб»
                if 'мб' in cell.lower() or 'кб' in cell.lower() or 'gb' in cell.lower():
                    continue
                m = re.fullmatch(r'\s*-?\+?(\d+(?:[.,]\d{1,2})?)\s*(?:руб\.?)?\s*', cell, re.IGNORECASE)
                if not m:
                    continue
                try:
                    val = float(m.group(1).replace(',', '.'))
                except Exception:
                    continue
                if val < 1:
                    continue
                amount_str = f"{val:.2f}"
                amount_idx = i
                break
            if not amount_str:
                continue

            balance_str = ''
            for i, cell in enumerate(cells):
                if i in (date_idx, amount_idx):
                    continue
                m = re.fullmatch(r'\s*-?\d+(?:[.,]\d{1,2})?\s*', cell)
                if m:
                    try:
                        balance_str = f"{float(cell.replace(',', '.').strip()):.2f}"
                        break
                    except Exception:
                        pass

            comment_str = ''
            for i in range(len(cells) - 1, -1, -1):
                if i in (date_idx, amount_idx):
                    continue
                if len(cells[i]) > 4 and not re.fullmatch(r'-?\d+(?:[.,]\d+)?', cells[i]):
                    comment_str = cells[i]
                    break

            payments.append({
                'date': date_str,
                'amount': amount_str,
                'comment': comment_str[:300],
                'balance_after': balance_str,
                'type': 'payment',
            })

    # Дедуп
    seen = set()
    uniq = []
    for p in payments:
        key = (p.get('date', ''), p.get('amount', ''))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(p)

    def _sk(p):
        m = re.match(r'(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?', p.get('date', ''))
        if not m:
            return (0,)
        return (int(m.group(3)), int(m.group(2)), int(m.group(1)),
                int(m.group(4) or 0), int(m.group(5) or 0))
    uniq.sort(key=_sk, reverse=True)

    print(f"[DAYSTAT] payments count={len(uniq)} login={login}")
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

    # ПРОВЕРКА ВЛАДЕЛЬЦА СЕССИИ: грузим главную ЛК и убеждаемся,
    # что HTML принадлежит именно этому абоненту. Сравниваем с договором,
    # ФИО, телефоном, логином — любое надёжное совпадение подтверждает сессию.
    session_owner_ok = False
    candidates = []
    for v in [user.get('account'), user.get('login'), login,
              user.get('phone'), user.get('name')]:
        if v and isinstance(v, str):
            v_clean = v.strip()
            if len(v_clean) >= 4:
                candidates.append(v_clean)
    try:
        idx = lk_session.get('http://lk.arttele.ru/index.php', timeout=10)
        if idx.apparent_encoding:
            idx.encoding = idx.apparent_encoding
        idx_html = idx.text or ''
        for c in candidates:
            if c and c in idx_html:
                session_owner_ok = True
                print(f"[LK] session owner verified by '{c}'")
                break
        if not session_owner_ok:
            print(f"[LK] session owner mismatch: none of {candidates} found in index.php")
    except Exception as e:
        print(f"[LK] index check error: {e}")

    # Платежи берём ТОЛЬКО если уверены, что сессия принадлежит этому абоненту
    payments = []
    if session_owner_ok:
        try:
            payments = lk_get_payments(lk_session, login)
        except Exception as e:
            print(f"[LK] payments error: {e}")
        # Фолбек 1: если LK ничего не вернул — пробуем кассу через kassa-сессию
        if not payments:
            try:
                kassa_uid = (found or {}).get('uid', '') if isinstance(found, dict) else ''
                payments = kassa_get_payments(session, login, kassa_uid)
                print(f"[KASSA] fallback payments count={len(payments)} login={login}")
            except Exception as e:
                print(f"[KASSA] fallback payments error: {e}")
        # Фолбек 2: помесячный обход daystat.php
        if not payments:
            try:
                payments = kassa_get_daystat_payments(session, login)
                print(f"[DAYSTAT] fallback payments count={len(payments)} login={login}")
            except Exception as e:
                print(f"[DAYSTAT] fallback error: {e}")
    else:
        print(f"[LK] skip payments — session not verified for login={login}")

    user['payments'] = payments

    # Сохраняем точку текущей скорости для истории
    try:
        save_speed_point(login, info.get('тек. скорость', ''))
    except Exception as e:
        print(f"[SPEED] save error: {e}")

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps(user, ensure_ascii=False)}


def _db_conn():
    """Открывает соединение к Postgres. Использует SIMPLE QUERY protocol."""
    import psycopg2
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise RuntimeError('DATABASE_URL not set')
    return psycopg2.connect(dsn)


def parse_speed_kbps(raw):
    """Парсит '98 / 938 Кбит/с.' → (98, 938) в кбит/с.

    Поддерживает Кбит/с и Мбит/с. Возвращает (in_kbps, out_kbps) либо None.
    """
    if not raw or not isinstance(raw, str):
        return None
    s = raw.strip().lower().replace(',', '.')
    m = re.search(r'(-?\d+(?:\.\d+)?)\s*/\s*(-?\d+(?:\.\d+)?)\s*(кбит|мбит|kbit|mbit)?', s)
    if not m:
        return None
    try:
        a = float(m.group(1))
        b = float(m.group(2))
    except Exception:
        return None
    unit = m.group(3) or 'кбит'
    if unit.startswith('м') or unit.startswith('m'):
        a *= 1000
        b *= 1000
    return int(round(a)), int(round(b))


def save_speed_point(login, raw_speed):
    """Сохраняет точку скорости в БД."""
    if not login:
        return
    parsed = parse_speed_kbps(raw_speed)
    if not parsed:
        return
    in_kbps, out_kbps = parsed
    # Не пишем нули если оба нулевые (мусор)
    if in_kbps == 0 and out_kbps == 0:
        return
    # Экранируем логин для simple query (только цифры/буквы)
    safe_login = re.sub(r"[^\w\-+@.]", '', login)[:64]
    if not safe_login:
        return
    conn = None
    try:
        conn = _db_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO speed_history (login, in_kbps, out_kbps) "
            f"VALUES ('{safe_login}', {in_kbps}, {out_kbps})"
        )
        conn.commit()
        cur.close()
    finally:
        if conn:
            conn.close()


def handle_speed_history(event, cors):
    """История скорости абонента за последние 24 часа."""
    params = event.get('queryStringParameters') or {}
    login = (params.get('login', '') or '').strip()
    hours = params.get('hours', '24')
    try:
        hours_int = max(1, min(168, int(hours)))
    except Exception:
        hours_int = 24
    if not login:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'login required'})}

    safe_login = re.sub(r"[^\w\-+@.]", '', login)[:64]
    if not safe_login:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid login'})}

    points = []
    conn = None
    try:
        conn = _db_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT ts, in_kbps, out_kbps FROM speed_history "
            f"WHERE login = '{safe_login}' AND ts > NOW() - INTERVAL '{hours_int} hours' "
            f"ORDER BY ts ASC"
        )
        for row in cur.fetchall():
            ts, in_kbps, out_kbps = row
            points.append({
                'ts': ts.isoformat() if ts else '',
                'in_kbps': int(in_kbps or 0),
                'out_kbps': int(out_kbps or 0),
            })
        cur.close()
    except Exception as e:
        print(f"[SPEED] history error: {e}")
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': str(e)})}
    finally:
        if conn:
            conn.close()

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'points': points, 'hours': hours_int}, ensure_ascii=False)}