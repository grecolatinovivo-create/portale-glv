<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

$key = isset($_GET['key']) ? $_GET['key'] : '';
if ($key !== 'GLV2024lezioni') {
    http_response_code(403);
    echo json_encode(array('error' => 'Forbidden'));
    exit;
}

$host    = '31.11.39.51';
$db_name = 'Sql1555180_1';
$user    = 'Sql1555180';
$pass    = 'Database15mila!';

header('Content-Type: application/json; charset=utf-8');

try {
    $dsn = "mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $stmt   = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $result = array('ok' => true, 'table_count' => count($tables), 'tables' => array());

    foreach ($tables as $table) {
        $cols    = $pdo->query("DESCRIBE `" . $table . "`")->fetchAll(PDO::FETCH_COLUMN);
        $preview = $pdo->query("SELECT * FROM `" . $table . "` LIMIT 3")->fetchAll();
        $count   = $pdo->query("SELECT COUNT(*) FROM `" . $table . "`")->fetchColumn();
        $result['tables'][$table] = array(
            'rows'    => (int)$count,
            'columns' => $cols,
            'preview' => $preview,
        );
    }

    echo json_encode($result);

} catch (Exception $e) {
    echo json_encode(array('error' => $e->getMessage()));
}
