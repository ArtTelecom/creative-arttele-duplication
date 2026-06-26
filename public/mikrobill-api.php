<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'mikrobill');
define('DB_USER', 'root');
define('DB_PASS', '');
define('API_KEY', 'CHANGE_ME_TO_RANDOM_SECRET_KEY');

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'ping') {
    echo json_encode(['ok' => true, 'time' => date('Y-m-d H:i:s')]);
    exit;
}

$headers = getallheaders();
$apiKey = '';
foreach ($headers as $k => $v) {
    if (strtolower($k) === 'x-api-key') {
        $apiKey = $v;
        break;
    }
}

if ($apiKey !== API_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid API key']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

function detectTable($pdo, $variants) {
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $tablesLower = array_map('strtolower', $tables);
    foreach ($variants as $v) {
        $idx = array_search(strtolower($v), $tablesLower);
        if ($idx !== false) {
            return $tables[$idx];
        }
    }
    return null;
}

function getColumns($pdo, $table) {
    $stmt = $pdo->query("DESCRIBE `$table`");
    $cols = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cols[] = strtolower($row['Field']);
    }
    return $cols;
}

function findColumn($columns, $variants) {
    foreach ($variants as $v) {
        if (in_array(strtolower($v), $columns)) {
            return $v;
        }
    }
    return null;
}

function getBody() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    if (is_array($data)) return $data;
    parse_str($raw, $parsed);
    return $parsed;
}

function formatBytes($bytes) {
    if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' GB';
    if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
    if ($bytes >= 1024) return round($bytes / 1024, 2) . ' KB';
    return $bytes . ' B';
}

if ($action === 'auth') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'POST required']);
        exit;
    }

    $body = getBody();
    $login = isset($body['login']) ? trim($body['login']) : '';
    $password = isset($body['password']) ? $body['password'] : '';

    if (!$login || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Login and password required']);
        exit;
    }

    $usersTable = detectTable($pdo, ['users', 'user', 'abonents', 'abonent', 'clients', 'accounts']);
    if (!$usersTable) {
        http_response_code(500);
        echo json_encode(['error' => 'Users table not found']);
        exit;
    }

    $cols = getColumns($pdo, $usersTable);
    $colUser = findColumn($cols, ['user', 'login', 'username', 'name', 'account']);
    $colPass = findColumn($cols, ['password', 'pass', 'passwd', 'pwd']);
    $colFio = findColumn($cols, ['fio', 'fio_name', 'fullname', 'full_name', 'realname', 'real_name', 'name']);
    $colAccount = findColumn($cols, ['account', 'contract', 'dogovor', 'account_id', 'uid']);
    $colDeposit = findColumn($cols, ['deposit', 'balance', 'money', 'summa']);
    $colCredit = findColumn($cols, ['credit', 'credit_limit']);
    $colBlocked = findColumn($cols, ['blocked', 'block', 'status', 'disabled', 'active']);

    if (!$colUser || !$colPass) {
        http_response_code(500);
        echo json_encode(['error' => 'Cannot detect user/password columns', 'columns' => $cols]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM `$usersTable` WHERE `$colUser` = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid login or password']);
        exit;
    }

    $storedPass = $user[$colPass];
    $valid = false;

    if (md5($password) === $storedPass) {
        $valid = true;
    } elseif ($password === $storedPass) {
        $valid = true;
    } elseif (function_exists('password_verify') && password_verify($password, $storedPass)) {
        $valid = true;
    }

    if (!$valid) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid login or password']);
        exit;
    }

    $token = md5($login . time() . API_KEY . mt_rand());

    $result = [
        'token' => $token,
        'user' => [
            'login' => $user[$colUser],
            'fio' => $colFio ? ($user[$colFio] ?? '') : '',
            'account' => $colAccount ? ($user[$colAccount] ?? '') : '',
            'deposit' => $colDeposit ? floatval($user[$colDeposit] ?? 0) : 0,
            'credit' => $colCredit ? floatval($user[$colCredit] ?? 0) : 0,
            'blocked' => $colBlocked ? $user[$colBlocked] : 0,
        ],
    ];

    echo json_encode($result);
    exit;
}

if ($action === 'user_info') {
    $login = isset($_GET['login']) ? trim($_GET['login']) : '';
    if (!$login) {
        http_response_code(400);
        echo json_encode(['error' => 'login parameter required']);
        exit;
    }

    $usersTable = detectTable($pdo, ['users', 'user', 'abonents', 'abonent', 'clients', 'accounts']);
    if (!$usersTable) {
        http_response_code(500);
        echo json_encode(['error' => 'Users table not found']);
        exit;
    }

    $cols = getColumns($pdo, $usersTable);
    $colUser = findColumn($cols, ['user', 'login', 'username', 'name', 'account']);
    $colFio = findColumn($cols, ['fio', 'fio_name', 'fullname', 'full_name', 'realname', 'real_name', 'name']);
    $colAccount = findColumn($cols, ['account', 'contract', 'dogovor', 'account_id', 'uid']);
    $colDeposit = findColumn($cols, ['deposit', 'balance', 'money', 'summa']);
    $colCredit = findColumn($cols, ['credit', 'credit_limit']);
    $colBlocked = findColumn($cols, ['blocked', 'block', 'status', 'disabled', 'active']);
    $colTarif = findColumn($cols, ['tarif', 'tariff', 'tarif_id', 'tariff_id', 'plan', 'tp']);
    $colSpeed = findColumn($cols, ['speed', 'speed_in', 'rate']);
    $colAddress = findColumn($cols, ['address', 'addr', 'street']);
    $colPhone = findColumn($cols, ['phone', 'tel', 'mobile', 'telephone']);
    $colEmail = findColumn($cols, ['email', 'mail', 'e_mail']);
    $colDateConnect = findColumn($cols, ['date_connect', 'date_create', 'created', 'created_at', 'regdate', 'reg_date', 'date_reg']);

    $stmt = $pdo->prepare("SELECT * FROM `$usersTable` WHERE `$colUser` = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $tarifName = '';
    $tarifSpeed = '';
    $tarifCost = '';

    if ($colTarif && isset($user[$colTarif])) {
        $tarifsTable = detectTable($pdo, ['tarifs', 'tariff', 'tariffs', 'plans', 'tp']);
        if ($tarifsTable) {
            $tarifCols = getColumns($pdo, $tarifsTable);
            $tColName = findColumn($tarifCols, ['name', 'tarif', 'tariff', 'title', 'plan']);
            $tColSpeed = findColumn($tarifCols, ['speed', 'speed_in', 'rate', 'speedin']);
            $tColCost = findColumn($tarifCols, ['cost', 'price', 'summa', 'amount', 'fee']);
            $tColId = findColumn($tarifCols, ['id', 'name', 'tarif', 'tariff']);

            if ($tColId) {
                $tstmt = $pdo->prepare("SELECT * FROM `$tarifsTable` WHERE `$tColId` = ?");
                $tstmt->execute([$user[$colTarif]]);
                $tarif = $tstmt->fetch(PDO::FETCH_ASSOC);
                if ($tarif) {
                    $tarifName = $tColName ? ($tarif[$tColName] ?? '') : ($user[$colTarif] ?? '');
                    $tarifSpeed = $tColSpeed ? ($tarif[$tColSpeed] ?? '') : '';
                    $tarifCost = $tColCost ? ($tarif[$tColCost] ?? '') : '';
                }
            }
        }
        if (!$tarifName) {
            $tarifName = $user[$colTarif];
        }
    }

    if (!$tarifSpeed && $colSpeed) {
        $tarifSpeed = $user[$colSpeed] ?? '';
    }

    $result = [
        'login' => $user[$colUser],
        'fio' => $colFio ? ($user[$colFio] ?? '') : '',
        'account' => $colAccount ? ($user[$colAccount] ?? '') : '',
        'deposit' => $colDeposit ? floatval($user[$colDeposit] ?? 0) : 0,
        'credit' => $colCredit ? floatval($user[$colCredit] ?? 0) : 0,
        'blocked' => $colBlocked ? $user[$colBlocked] : 0,
        'tarif' => $tarifName,
        'speed' => $tarifSpeed,
        'tarif_cost' => $tarifCost,
        'address' => $colAddress ? ($user[$colAddress] ?? '') : '',
        'phone' => $colPhone ? ($user[$colPhone] ?? '') : '',
        'email' => $colEmail ? ($user[$colEmail] ?? '') : '',
        'date_connect' => $colDateConnect ? ($user[$colDateConnect] ?? '') : '',
    ];

    echo json_encode($result);
    exit;
}

if ($action === 'payments') {
    $login = isset($_GET['login']) ? trim($_GET['login']) : '';
    if (!$login) {
        http_response_code(400);
        echo json_encode(['error' => 'login parameter required']);
        exit;
    }

    $payTable = detectTable($pdo, ['payments', 'pays', 'pay', 'payment', 'oplata', 'finance']);
    if (!$payTable) {
        echo json_encode(['payments' => [], 'notice' => 'Payments table not found']);
        exit;
    }

    $cols = getColumns($pdo, $payTable);
    $colUser = findColumn($cols, ['user', 'login', 'username', 'uid', 'account', 'client']);
    $colDate = findColumn($cols, ['date', 'datetime', 'date_pay', 'pay_date', 'created', 'time', 'timestamp']);
    $colSum = findColumn($cols, ['sum', 'summa', 'amount', 'money', 'value']);
    $colType = findColumn($cols, ['type', 'method', 'pay_type', 'payment_type', 'source']);
    $colComment = findColumn($cols, ['comment', 'comments', 'note', 'notes', 'description', 'descr']);

    if (!$colUser) {
        echo json_encode(['payments' => [], 'notice' => 'Cannot detect user column in payments table', 'columns' => $cols]);
        exit;
    }

    $select = ["`$colUser`"];
    if ($colDate) $select[] = "`$colDate`";
    if ($colSum) $select[] = "`$colSum`";
    if ($colType) $select[] = "`$colType`";
    if ($colComment) $select[] = "`$colComment`";

    $orderBy = $colDate ? "ORDER BY `$colDate` DESC" : "";
    $sql = "SELECT " . implode(', ', $select) . " FROM `$payTable` WHERE `$colUser` = ? $orderBy LIMIT 50";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$login]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $payments = [];
    foreach ($rows as $row) {
        $payments[] = [
            'date' => $colDate ? ($row[$colDate] ?? '') : '',
            'sum' => $colSum ? floatval($row[$colSum] ?? 0) : 0,
            'type' => $colType ? ($row[$colType] ?? '') : '',
            'comment' => $colComment ? ($row[$colComment] ?? '') : '',
        ];
    }

    echo json_encode(['payments' => $payments]);
    exit;
}

if ($action === 'traffic') {
    $login = isset($_GET['login']) ? trim($_GET['login']) : '';
    if (!$login) {
        http_response_code(400);
        echo json_encode(['error' => 'login parameter required']);
        exit;
    }

    $statTable = detectTable($pdo, ['statistic', 'statistics', 'sessions', 'session', 'traffic', 'accounting', 'radacct']);
    if (!$statTable) {
        echo json_encode(['traffic' => [], 'notice' => 'Traffic/statistics table not found']);
        exit;
    }

    $cols = getColumns($pdo, $statTable);
    $colUser = findColumn($cols, ['user', 'login', 'username', 'uid', 'account', 'client']);
    $colDate = findColumn($cols, ['date', 'datetime', 'start', 'start_time', 'acctstarttime', 'time', 'timestamp', 'day']);
    $colIn = findColumn($cols, ['bytes_in', 'input', 'acctinputoctets', 'download', 'incoming', 'in_bytes', 'rx', 'recv']);
    $colOut = findColumn($cols, ['bytes_out', 'output', 'acctoutputoctets', 'upload', 'outgoing', 'out_bytes', 'tx', 'sent']);

    if (!$colUser) {
        echo json_encode(['traffic' => [], 'notice' => 'Cannot detect user column in traffic table', 'columns' => $cols]);
        exit;
    }

    $dateExpr = $colDate ? "DATE(`$colDate`)" : "'unknown'";
    $inExpr = $colIn ? "SUM(`$colIn`)" : "0";
    $outExpr = $colOut ? "SUM(`$colOut`)" : "0";

    $dateFilter = $colDate ? "AND `$colDate` >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)" : "";

    $sql = "SELECT $dateExpr as day, $inExpr as bytes_in, $outExpr as bytes_out FROM `$statTable` WHERE `$colUser` = ? $dateFilter GROUP BY day ORDER BY day DESC LIMIT 30";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$login]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $traffic = [];
    foreach ($rows as $row) {
        $traffic[] = [
            'date' => $row['day'],
            'bytes_in' => intval($row['bytes_in']),
            'bytes_out' => intval($row['bytes_out']),
            'in_formatted' => formatBytes(intval($row['bytes_in'])),
            'out_formatted' => formatBytes(intval($row['bytes_out'])),
        ];
    }

    echo json_encode(['traffic' => $traffic]);
    exit;
}

if ($action === 'tariffs') {
    $tarifsTable = detectTable($pdo, ['tarifs', 'tariff', 'tariffs', 'plans', 'tp']);
    if (!$tarifsTable) {
        echo json_encode(['tariffs' => [], 'notice' => 'Tariffs table not found']);
        exit;
    }

    $cols = getColumns($pdo, $tarifsTable);
    $colName = findColumn($cols, ['name', 'tarif', 'tariff', 'title', 'plan']);
    $colSpeed = findColumn($cols, ['speed', 'speed_in', 'rate', 'speedin']);
    $colCost = findColumn($cols, ['cost', 'price', 'summa', 'amount', 'fee']);
    $colActive = findColumn($cols, ['active', 'status', 'enabled', 'visible']);

    $select = [];
    if ($colName) $select[] = "`$colName`";
    if ($colSpeed) $select[] = "`$colSpeed`";
    if ($colCost) $select[] = "`$colCost`";
    if ($colActive) $select[] = "`$colActive`";

    if (empty($select)) {
        $select[] = '*';
    }

    $where = '';
    if ($colActive) {
        $where = "WHERE `$colActive` = 1 OR `$colActive` = 'yes' OR `$colActive` = 'active'";
    }

    $sql = "SELECT " . implode(', ', $select) . " FROM `$tarifsTable` $where";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $tariffs = [];
    foreach ($rows as $row) {
        $tariffs[] = [
            'name' => $colName ? ($row[$colName] ?? '') : '',
            'speed' => $colSpeed ? ($row[$colSpeed] ?? '') : '',
            'cost' => $colCost ? floatval($row[$colCost] ?? 0) : 0,
        ];
    }

    echo json_encode(['tariffs' => $tariffs]);
    exit;
}

if ($action === 'pay') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'POST required']);
        exit;
    }

    $body = getBody();
    $login = isset($body['login']) ? trim($body['login']) : '';
    $amount = isset($body['amount']) ? floatval($body['amount']) : 0;
    $orderId = isset($body['order_id']) ? trim($body['order_id']) : '';
    $comment = isset($body['comment']) ? trim($body['comment']) : 'Онлайн-оплата Т-Банк';

    if (!$login || $amount <= 0 || !$orderId) {
        http_response_code(400);
        echo json_encode(['error' => 'login, amount, order_id required']);
        exit;
    }

    $usersTable = detectTable($pdo, ['users', 'user', 'abonents', 'abonent', 'clients', 'accounts']);
    if (!$usersTable) {
        http_response_code(500);
        echo json_encode(['error' => 'Users table not found']);
        exit;
    }

    $ucols = getColumns($pdo, $usersTable);
    $colUser = findColumn($ucols, ['user', 'login', 'username', 'name', 'account']);
    $colDeposit = findColumn($ucols, ['deposit', 'balance', 'money', 'summa']);
    if (!$colUser || !$colDeposit) {
        http_response_code(500);
        echo json_encode(['error' => 'Cannot detect user/deposit columns', 'columns' => $ucols]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM `$usersTable` WHERE `$colUser` = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $payTable = detectTable($pdo, ['payments', 'pays', 'pay', 'payment', 'oplata', 'finance']);

    // Защита от двойного зачисления: ищем платёж с таким order_id в комментарии
    if ($payTable) {
        $pcols = getColumns($pdo, $payTable);
        $pColComment = findColumn($pcols, ['comment', 'comments', 'note', 'notes', 'description', 'descr']);
        if ($pColComment) {
            $dupStmt = $pdo->prepare("SELECT COUNT(*) FROM `$payTable` WHERE `$pColComment` LIKE ?");
            $dupStmt->execute(['%' . $orderId . '%']);
            if (intval($dupStmt->fetchColumn()) > 0) {
                echo json_encode(['ok' => true, 'already_paid' => true, 'order_id' => $orderId]);
                exit;
            }
        }
    }

    try {
        $pdo->beginTransaction();

        $oldBalance = floatval($user[$colDeposit] ?? 0);
        $newBalance = $oldBalance + $amount;
        $upd = $pdo->prepare("UPDATE `$usersTable` SET `$colDeposit` = ? WHERE `$colUser` = ?");
        $upd->execute([$newBalance, $login]);

        if ($payTable) {
            $pcols = getColumns($pdo, $payTable);
            $pColUser = findColumn($pcols, ['user', 'login', 'username', 'uid', 'account', 'client']);
            $pColDate = findColumn($pcols, ['date', 'datetime', 'date_pay', 'pay_date', 'created', 'time', 'timestamp']);
            $pColSum = findColumn($pcols, ['sum', 'summa', 'amount', 'money', 'value']);
            $pColType = findColumn($pcols, ['type', 'method', 'pay_type', 'payment_type', 'source']);
            $pColComment = findColumn($pcols, ['comment', 'comments', 'note', 'notes', 'description', 'descr']);

            $insCols = [];
            $insVals = [];
            $insParams = [];
            if ($pColUser) { $insCols[] = "`$pColUser`"; $insVals[] = '?'; $insParams[] = $login; }
            if ($pColDate) { $insCols[] = "`$pColDate`"; $insVals[] = 'NOW()'; }
            if ($pColSum) { $insCols[] = "`$pColSum`"; $insVals[] = '?'; $insParams[] = $amount; }
            if ($pColType) { $insCols[] = "`$pColType`"; $insVals[] = '?'; $insParams[] = 'Т-Банк'; }
            if ($pColComment) { $insCols[] = "`$pColComment`"; $insVals[] = '?'; $insParams[] = $comment . ' [' . $orderId . ']'; }

            if (!empty($insCols)) {
                $insSql = "INSERT INTO `$payTable` (" . implode(', ', $insCols) . ") VALUES (" . implode(', ', $insVals) . ")";
                $insStmt = $pdo->prepare($insSql);
                $insStmt->execute($insParams);
            }
        }

        $pdo->commit();
        echo json_encode([
            'ok' => true,
            'login' => $login,
            'amount' => $amount,
            'old_balance' => $oldBalance,
            'new_balance' => $newBalance,
            'order_id' => $orderId,
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Payment failed: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action', 'available_actions' => ['ping', 'auth', 'user_info', 'payments', 'traffic', 'tariffs', 'pay']]);