import os
import json
import time
import base64
import socket

def handler(event: dict, context) -> dict:
    """
    Эндпоинт для замера скорости интернета.
    GET /?action=ping — возвращает метку времени для замера пинга
    GET /?action=download&size=5 — отдаёт N МБ случайных данных (base64) для замера скорости скачивания
    POST /?action=upload — принимает данные и возвращает размер + время для замера скорости отдачи
    GET /?action=resolve&host=arttele.ru — резолвит домен в IP (диагностика: локальный или внешний адрес)
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
    }

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'ping')

    if action == 'ping':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'ts': time.time(), 'ok': True})
        }

    if action == 'resolve':
        host = (params.get('host') or '').strip()
        result = {'host': host, 'ip': None, 'is_local': None}
        if host:
            try:
                ip = socket.gethostbyname(host)
                result['ip'] = ip
                result['is_local'] = (
                    ip.startswith('10.') or ip.startswith('192.168.') or
                    any(ip.startswith('172.' + str(n) + '.') for n in range(16, 32))
                )
            except OSError as e:
                result['error'] = str(e)
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(result)}

    if action == 'download':
        # Размер в МБ (по умолчанию 10 МБ)
        try:
            size_mb = min(int(params.get('size', '10')), 32)
        except ValueError:
            size_mb = 10

        size_bytes = size_mb * 1024 * 1024
        # Генерируем случайные байты — имитация реального трафика
        chunk = os.urandom(min(size_bytes, 65536))
        # Повторяем чанк до нужного размера
        repeats = size_bytes // len(chunk)
        data = chunk * repeats
        encoded = base64.b64encode(data).decode('ascii')

        return {
            'statusCode': 200,
            'headers': {**headers, 'Content-Type': 'application/octet-stream'},
            'body': encoded,
            'isBase64Encoded': True,
        }

    if action == 'upload':
        body = event.get('body', '')
        if event.get('isBase64Encoded'):
            received_bytes = len(base64.b64decode(body))
        else:
            received_bytes = len(body.encode('utf-8')) if body else 0

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'received_bytes': received_bytes,
                'ts': time.time(),
                'ok': True
            })
        }

    return {
        'statusCode': 400,
        'headers': headers,
        'body': json.dumps({'error': 'unknown action'})
    }