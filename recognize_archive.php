<?php
/**
 * Архив распознанных смет.
 *
 * После применения распознавания браузер присылает сюда три вещи: оригинал
 * файла (фото/pdf/xlsx), результат разбора и метку «кто и когда». Всё это
 * складывается в папку с датой на диске Beget — чтобы потом можно было
 * открыть и сверить: что прислали против того, что система распознала.
 *
 * Специально мимо Supabase: его egress — узкое место, а здесь свободно 12 ГБ.
 *
 * Структура: archive/ГГГГ-ММ-ДД/ЧЧММСС_пользователь.(jpg|pdf|...)
 *                              /ЧЧММСС_пользователь.json   (результат + мета)
 *
 * Папка archive/ закрыта от публичного доступа .htaccess — смотреть только
 * через файловый менеджер Beget.
 */

error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$ARCHIVE_DIR = __DIR__ . '/archive';
$MAX_BYTES   = 25 * 1024 * 1024;   // потолок на один файл сметы

$body = file_get_contents('php://input');
if (strlen($body) > $MAX_BYTES + 4 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Слишком большой запрос']);
    exit;
}

$req = json_decode($body, true);
if (!$req || !isset($req['result'])) {
    http_response_code(400);
    echo json_encode(['error' => "Нужно поле 'result'"]);
    exit;
}

// Готовим папку дня. Первый заход в archive/ ставит защиту от чтения снаружи.
if (!is_dir($ARCHIVE_DIR)) {
    @mkdir($ARCHIVE_DIR, 0755, true);
    @file_put_contents($ARCHIVE_DIR . '/.htaccess', "Deny from all\n");
    @file_put_contents($ARCHIVE_DIR . '/index.html', '');   // на случай, если Deny не сработает
}
$day = $ARCHIVE_DIR . '/' . date('Y-m-d');
if (!is_dir($day)) @mkdir($day, 0755, true);

// Имя файла: время + логин, очищенный до безопасных символов.
$user = preg_replace('/[^a-zA-Z0-9_.@-]/', '_', (string)($req['user'] ?? 'anon'));
$user = substr($user, 0, 40);
$base = date('His') . '_' . $user;

// Оригинал файла приходит base64. Расширение — из присланного вида файла.
$saved = [];
if (!empty($req['file']) && !empty($req['fileData'])) {
    $ext = preg_replace('/[^a-z0-9]/', '', strtolower((string)($req['fileExt'] ?? 'bin')));
    if ($ext === '' || strlen($ext) > 5) $ext = 'bin';
    $raw = base64_decode($req['fileData'], true);
    if ($raw !== false && strlen($raw) <= $MAX_BYTES) {
        $fname = "$base.$ext";
        if (@file_put_contents("$day/$fname", $raw) !== false) $saved[] = $fname;
    }
}

// Результат распознавания + метаданные — отдельным JSON рядом с файлом.
$meta = [
    'saved_at' => date('c'),
    'user'     => $req['user'] ?? null,
    'source'   => $req['source'] ?? null,      // вид файла: image/xlsx/pdf/...
    'fileName' => $req['fileName'] ?? null,
    'mode'     => $req['mode'] ?? null,         // add | new
    'result'   => $req['result'],              // распознанные и подобранные строки
];
$jname = "$base.json";
@file_put_contents("$day/$jname", json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode([
    'ok'    => true,
    'day'   => date('Y-m-d'),
    'files' => array_merge($saved, [$jname]),
], JSON_UNESCAPED_UNICODE);
