<?php
/**
 * Пароли монтажников — копия для администратора.
 *
 * Зачем вообще: монтажники забывают пароль и пишут в поддержку. Сбросить его
 * можно и без этого файла, но человеку тогда нужно ходить по ссылкам из почты,
 * которую он часто и не помнит. Проще продиктовать тот пароль, который он сам
 * когда-то придумал. Supabase так не умеет: у себя он хранит не пароль, а его
 * необратимый отпечаток — по нему можно проверить введённое, но не восстановить.
 * Поэтому копию складываем сами, в тот момент, когда пароль проходит через
 * браузер: при регистрации, при входе и при смене пароля в кабинете.
 *
 * Специально НЕ в Supabase: таблица users открыта на чтение по публичному
 * ключу, который лежит прямо в app.js, — пароли туда класть нельзя. Здесь
 * файл лежит в archive/, закрытой .htaccess от веба, и отдаётся только по
 * проверке админской роли.
 *
 * Запись:  POST  { "password": "..." }  + Authorization: Bearer <токен сессии>
 *          Email берём не из тела запроса, а из токена — иначе кто угодно мог
 *          бы записать себе чужой адрес и потом прочитать его как «свой».
 * Чтение:  GET ?email=...              + Authorization: Bearer <токен админа>
 *          Только владелец или account_type = admin. Наблюдателю (viewer) и
 *          менеджеру дистрибьютора пароли не показываем: им хватает своей
 *          части панели, а чужой пароль — не та вещь, которую раздают «на
 *          посмотреть».
 */

error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

const SUPABASE_HOST = 'https://ahanbwugsmcyvrwbmtlx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gcMJ-PvJmKavObbnePFGZQ_O-pu5O2p';
const SUPER_ADMIN_EMAILS = ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'];

/** Рядом с архивом распознаваний: та же папка уже закрыта .htaccess. */
function credsPath() { return __DIR__ . '/archive/creds.json'; }

function bearerToken() {
    foreach (getallheaders() as $name => $value) {
        if (strtolower($name) === 'authorization' && stripos($value, 'Bearer ') === 0) {
            return trim(substr($value, 7));
        }
    }
    return null;
}

function supabaseGet($path, $token) {
    $ch = curl_init(SUPABASE_HOST . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . SUPABASE_ANON_KEY,
        'Authorization: Bearer ' . $token,
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($resp === false || $code >= 400) return null;
    return json_decode($resp, true);
}

/** Email владельца токена, только если сессия у Supabase живая. */
function tokenEmail($token) {
    if (!$token) return null;
    $user = supabaseGet('/auth/v1/user', $token);
    $email = $user['email'] ?? null;
    return $email ? strtolower($email) : null;
}

/** Читать пароли может владелец или полноценный админ — но не viewer/manager. */
function isAllowedAdmin($email, $token) {
    if (in_array($email, SUPER_ADMIN_EMAILS, true)) return true;
    $rows = supabaseGet('/rest/v1/users?select=account_type&email=eq.' . rawurlencode($email), $token);
    return ($rows[0]['account_type'] ?? null) === 'admin';
}

function readCreds() {
    $raw = @file_get_contents(credsPath());
    $data = $raw ? json_decode($raw, true) : null;
    return is_array($data) ? $data : [];
}

function writeCreds($data) {
    $dir = dirname(credsPath());
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    // Подстраховка на случай, если папку создали не мы: без этого файла архив
    // (а вместе с ним и пароли) открывается прямой ссылкой из браузера.
    if (!file_exists($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Deny from all\n");
    @file_put_contents(credsPath(), json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

function fail($code, $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

$token = bearerToken();
$email = tokenEmail($token);
if (!$email) fail(401, 'Нет действующей сессии');

// ─── Запись: свой собственный пароль ────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $password = is_array($body) ? (string)($body['password'] ?? '') : '';
    if ($password === '' || mb_strlen($password) > 200) fail(400, 'Пустой пароль');

    $creds = readCreds();
    $creds[$email] = [
        'password'   => $password,
        'updated_at' => gmdate('c'),
        // откуда пришло: регистрация / вход / смена пароля в кабинете
        'source'     => in_array(($body['source'] ?? ''), ['signup', 'login', 'change'], true) ? $body['source'] : 'login',
    ];
    writeCreds($creds);
    echo json_encode(['ok' => true]);
    exit;
}

// ─── Чтение: пароль конкретного пользователя, только админу ─────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isAllowedAdmin($email, $token)) fail(403, 'Недостаточно прав');

    $target = strtolower(trim($_GET['email'] ?? ''));
    if ($target === '') fail(400, 'Не указан email');

    $rec = readCreds()[$target] ?? null;
    if (!$rec) {
        echo json_encode(['found' => false]);
        exit;
    }
    echo json_encode([
        'found'      => true,
        'password'   => $rec['password'],
        'updated_at' => $rec['updated_at'] ?? null,
        'source'     => $rec['source'] ?? null,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

fail(405, 'Метод не поддерживается');
