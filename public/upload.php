<?php
// Приёмник для замера скорости отдачи (upload) теста скорости.
// Читает тело запроса и сразу отвечает, НИЧЕГО не сохраняя на диск.
// Данные никуда не пишутся — нужен только факт приёма потока байт.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Читаем и отбрасываем тело потоком, считаем принятые байты.
$received = 0;
$in = fopen('php://input', 'rb');
if ($in) {
    while (!feof($in)) {
        $chunk = fread($in, 65536);
        if ($chunk === false) break;
        $received += strlen($chunk);
    }
    fclose($in);
} else {
    // запасной вариант, если поток недоступен
    $received = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
}

echo json_encode(['ok' => true, 'received_bytes' => $received]);
