<?php
/**
 * fetch_corsi.php — Script temporaneo per esportare i corsi da MySQL Serverplan
 * Da caricare nella root di grecolatinovivo.it (o in una sottocartella)
 * URL di accesso: https://www.grecolatinovivo.it/fetch_corsi.php?key=GLV2024export
 *
 * IMPORTANTE: elimina questo file dopo l'uso!
 */

// Chiave di sicurezza minimale — cambiala se vuoi
define('SECRET_KEY', 'GLV2024export');

if (($_GET['key'] ?? '') !== SECRET_KEY) {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

$host = 'localhost';
$db   = 'ytgrecol_grecolatinovivo';
$user = 'ytgrecol';
$pass = 'storkobCukdiv9';
$charset = 'utf8mb4';

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Recupera TUTTI i corsi senza filtri — includiamo tutto, filtriamo lato portale
    $stmt = $pdo->query("
        SELECT
            IDC,
            titolo,
            sottotitolo,
            descrizione,
            stato,
            num,
            tipo,
            img_copertina,
            NEW_PREZZO,
            gratis,
            ordine,
            data,
            lingua,
            livello
        FROM corsi
        ORDER BY lingua ASC, ordine ASC, IDC ASC
    ");

    $corsi = $stmt->fetchAll();

    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    echo json_encode([
        'success' => true,
        'count'   => count($corsi),
        'corsi'   => $corsi,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
