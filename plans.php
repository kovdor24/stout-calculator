<?php
/**
 * Хранилище подложек планов этажей.
 *
 * Подложка — это фото или скан плана, 100–700 КБ на этаж. Раньше она жила
 * только в localStorage браузера: не переживала чистку кэша, не открывалась
 * на втором устройстве и упиралась в лимит хранилища на третьем этаже.
 *
 * Мимо Supabase — сознательно: его egress уже выбран на две трети при
 * четырёх десятках пользователей, а здесь свободно 12 ГБ и трафик не
 * тарифицируется. В Supabase вместе со сметой уезжает только разметка
 * (зоны, масштаб, радиаторы) — это единицы килобайт.
 *
 * Структура: plans/<ключ проекта>/<этаж>-<хеш>.jpg
 *                                /owner.json      кто загрузил
 *
 * Ключ проекта — 32 шестнадцатеричных знака, генерируется калькулятором и
 * едет в смете. По нему же подложку забирает клиент, открывший ссылку, —
 * поэтому GET отвечает без авторизации: угадать 128-битный ключ нельзя, а
 * требовать вход от заказчика мы не можем. Заливать и удалять — только с
 * живой сессией Supabase.
 *
 * Имя файла содержит хеш содержимого: перерисовал план — имя другое, и
 * можно кэшировать навсегда, не боясь показать старую картинку.
 *
 * Действия:
 *   GET  ?k=<ключ>&n=<файл>            отдать подложку
 *   GET  ?k=<ключ>&list=1              какие файлы есть у проекта
 *   POST {action:'put',  key, floor, ext, data}   залить (нужен токен)
 *   POST {action:'drop', key[, floor]}            удалить (нужен токен)
 */

error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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

$PLANS_DIR   = __DIR__ . '/plans';
$MAX_BYTES   = 4 * 1024 * 1024;          // потолок на одну подложку
$MAX_FLOORS  = 12;                        // этажей на проект
$MAX_TOTAL   = 8 * 1024 * 1024 * 1024;    // общий потолок раздела, из 12 ГБ диска
// Срок хранения: объект, к плану которого столько не прикасались, удаляется
// сам. Смета живёт в Supabase и остаётся, пропадает только подложка — если
// заказчик вернётся позже, план придётся загрузить заново.
$RETENTION_DAYS = 90;

const SUPABASE_HOST = 'https://ahanbwugsmcyvrwbmtlx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gcMJ-PvJmKavObbnePFGZQ_O-pu5O2p';
const SUPER_ADMIN_EMAILS = ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'];

/** Ответ ошибкой в том же виде, что и у остальных наших скриптов. */
function fail($code, $msg) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

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

/** Та же логика, что getAdminRole() в app.js: владелец либо admin/viewer. */
function isAllowedAdmin($email, $token) {
    if (in_array($email, SUPER_ADMIN_EMAILS, true)) return true;
    $rows = supabaseGet('/rest/v1/users?select=account_type&email=eq.' . rawurlencode($email), $token);
    $type = $rows[0]['account_type'] ?? null;
    return in_array($type, ['admin', 'viewer'], true);
}

/** Ключ проекта: 32 знака hex и ничего больше — он же имя папки. */
function validKey($k) {
    return is_string($k) && preg_match('/^[a-f0-9]{32}$/', $k);
}

/** Имя подложки: «этаж-хеш.расширение», как его выдал put. */
function validName($n) {
    return is_string($n) && preg_match('/^\d{1,2}-[a-f0-9]{8}\.(jpg|webp|png)$/', $n);
}

/**
 * Занятый объём — счётчиком в файле, а не обходом дерева: папок с проектами
 * со временем станут тысячи, и пересчитывать их на каждой загрузке накладно.
 * Счётчика нет (первый запуск или потёрли) — считаем один раз и запоминаем.
 */
function usagePath() { return __DIR__ . '/plans/_usage.json'; }

function dirBytes($dir) {
    $sum = 0;
    foreach (scandir($dir) ?: [] as $e) {
        if ($e === '.' || $e === '..') continue;
        $p = "$dir/$e";
        if (is_dir($p)) $sum += dirBytes($p);
        elseif (is_file($p)) $sum += filesize($p);
    }
    return $sum;
}

function readUsage($plansDir) {
    $raw = @file_get_contents(usagePath());
    $data = $raw ? json_decode($raw, true) : null;
    if (isset($data['bytes'])) return (int)$data['bytes'];
    $bytes = is_dir($plansDir) ? dirBytes($plansDir) : 0;
    @file_put_contents(usagePath(), json_encode(['bytes' => $bytes]), LOCK_EX);
    return $bytes;
}

function bumpUsage($plansDir, $delta) {
    $bytes = max(0, readUsage($plansDir) + $delta);
    $raw = json_decode(@file_get_contents(usagePath()), true);
    $swept = is_array($raw) ? ($raw['swept_at'] ?? 0) : 0;
    @file_put_contents(usagePath(), json_encode(['bytes' => $bytes, 'swept_at' => $swept]), LOCK_EX);
}

/**
 * Что лежит в папке одного объекта: подложки по этажам, владелец, общий вес
 * и дата последнего касания — по ней считается срок хранения.
 */
function projectInfo($plansDir, $key) {
    $dir = "$plansDir/$key";
    $files = [];
    $bytes = 0;
    $touched = 0;
    foreach (scandir($dir) ?: [] as $f) {
        if (!validName($f)) continue;
        $sz = filesize("$dir/$f");
        $mt = filemtime("$dir/$f");
        $bytes += $sz;
        $touched = max($touched, $mt);
        $files[] = [
            'floor' => (int)strstr($f, '-', true),
            'name'  => $f,
            'bytes' => $sz,
            'mtime' => date('c', $mt),
        ];
    }
    if (!$files) return null;
    usort($files, function ($a, $b) { return $a['floor'] - $b['floor']; });
    $owner = json_decode(@file_get_contents("$dir/owner.json"), true);
    return [
        'key'       => $key,
        'owner'     => is_array($owner) ? ($owner['email'] ?? null) : null,
        'createdAt' => is_array($owner) ? ($owner['created_at'] ?? null) : null,
        'files'     => $files,
        'bytes'     => $bytes,
        'touchedAt' => date('c', $touched),
        'ageDays'   => (int)floor((time() - $touched) / 86400),
    ];
}

/**
 * Удаление объектов, к которым давно не прикасались.
 *
 * Возраст считаем по самой свежей подложке в папке: пока монтажник
 * перерисовывает план, объект живой. Папка без подложек (остался один
 * owner.json) убирается заодно.
 */
function sweepOld($plansDir, $days) {
    $edge = time() - $days * 86400;
    $removed = 0; $freed = 0;
    foreach (scandir($plansDir) ?: [] as $key) {
        if (!validKey($key)) continue;
        $dir = "$plansDir/$key";
        $info = projectInfo($plansDir, $key);
        if ($info === null) {
            // Пустая папка: сносим, если и owner.json давно не трогали.
            if (@filemtime("$dir/owner.json") > $edge) continue;
            @unlink("$dir/owner.json");
            @rmdir($dir);
            continue;
        }
        if (strtotime($info['touchedAt']) > $edge) continue;
        foreach ($info['files'] as $f) {
            if (@unlink("$dir/" . $f['name'])) { $removed++; $freed += $f['bytes']; }
        }
        @unlink("$dir/owner.json");
        @rmdir($dir);
    }
    return ['removed' => $removed, 'freedBytes' => $freed];
}

/**
 * Автоочистка без внешнего планировщика.
 *
 * Отдельный крон на Beget заводить не стали: подложки появляются только
 * когда кто-то их заливает, и тогда же уместно подмести старые. Чаще раза
 * в сутки не метём — обход папок недёшев, а спешить тут некуда.
 */
function autoSweep($plansDir, $days) {
    $raw = json_decode(@file_get_contents(usagePath()), true);
    $swept = is_array($raw) ? (int)($raw['swept_at'] ?? 0) : 0;
    if (time() - $swept < 86400) return;
    $res = sweepOld($plansDir, $days);
    $bytes = max(0, readUsage($plansDir) - $res['freedBytes']);
    @file_put_contents(usagePath(),
        json_encode(['bytes' => $bytes, 'swept_at' => time()]), LOCK_EX);
}

// ─── Обзор для админки: все объекты с подложками ─────────────────────────
// Отдельной веткой до проверки ключа: здесь ключа и нет, зато нужна роль.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['admin'])) {
    header('Content-Type: application/json; charset=utf-8');
    $token = bearerToken();
    $email = tokenEmail($token);
    if (!$email || !isAllowedAdmin($email, $token)) fail(403, 'Доступ только для администраторов');

    $projects = [];
    $total = 0;
    foreach (scandir($PLANS_DIR) ?: [] as $key) {
        if (!validKey($key)) continue;
        $info = projectInfo($PLANS_DIR, $key);
        if (!$info) continue;
        $total += $info['bytes'];
        $projects[] = $info;
    }
    // Самые заброшенные сверху: их и чистят в первую очередь.
    usort($projects, function ($a, $b) { return $b['ageDays'] - $a['ageDays']; });

    echo json_encode([
        'ok' => true,
        'retentionDays' => $RETENTION_DAYS,
        'totalBytes' => $total,
        'projects' => $projects,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ─── Чтение: сама подложка либо список файлов проекта ────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $key = (string)($_GET['k'] ?? '');
    if (!validKey($key)) fail(400, 'Неверный ключ проекта');
    $dir = "$PLANS_DIR/$key";

    if (!empty($_GET['list'])) {
        header('Content-Type: application/json; charset=utf-8');
        $files = [];
        foreach (scandir($dir) ?: [] as $f) {
            if (validName($f)) $files[] = $f;
        }
        echo json_encode(['ok' => true, 'files' => $files], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $name = (string)($_GET['n'] ?? '');
    if (!validName($name)) fail(400, 'Неверное имя файла');
    $path = "$dir/$name";
    if (!is_file($path)) fail(404, 'Подложка не найдена');

    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $types = ['jpg' => 'image/jpeg', 'webp' => 'image/webp', 'png' => 'image/png'];
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($path));
    // Хеш содержимого зашит в имя: этот файл больше никогда не изменится,
    // значит браузеру незачем и переспрашивать.
    header('Cache-Control: public, max-age=31536000, immutable');
    header('ETag: "' . $name . '"');
    if (trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === '"' . $name . '"') {
        http_response_code(304);
        exit;
    }
    readfile($path);
    exit;
}

// ─── Запись и удаление: только с живой сессией ───────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Метод не поддерживается');

header('Content-Type: application/json; charset=utf-8');

$req = json_decode(file_get_contents('php://input'), true);
if (!is_array($req)) fail(400, 'Ожидается JSON');

$token = bearerToken();
$email = tokenEmail($token);
if (!$email) fail(403, 'Нужен вход в учётную запись');

$action = (string)($req['action'] ?? '');

// ─── Очистка из админки ──────────────────────────────────────────────────
// Не привязана к одному объекту, поэтому идёт до проверки ключа: либо
// «всё старше N дней», либо поимённо выбранные объекты.
if ($action === 'purge') {
    if (!isAllowedAdmin($email, $token)) fail(403, 'Доступ только для администраторов');

    $keys = is_array($req['keys'] ?? null) ? $req['keys'] : null;
    if ($keys !== null) {
        $removed = 0; $freed = 0;
        foreach ($keys as $k) {
            if (!validKey($k)) continue;
            $info = projectInfo($PLANS_DIR, $k);
            if (!$info) continue;
            foreach ($info['files'] as $f) {
                if (@unlink("$PLANS_DIR/$k/" . $f['name'])) { $removed++; $freed += $f['bytes']; }
            }
            @unlink("$PLANS_DIR/$k/owner.json");
            @rmdir("$PLANS_DIR/$k");
        }
        $res = ['removed' => $removed, 'freedBytes' => $freed];
    } else {
        // Ноль дней означает «за всё время», а не «старше сегодняшнего».
        $days = isset($req['olderThanDays']) ? max(0, (int)$req['olderThanDays']) : $RETENTION_DAYS;
        $res = sweepOld($PLANS_DIR, $days);
    }
    bumpUsage($PLANS_DIR, -$res['freedBytes']);
    echo json_encode(array_merge(['ok' => true], $res), JSON_UNESCAPED_UNICODE);
    exit;
}

$key = (string)($req['key'] ?? '');
if (!validKey($key)) fail(400, 'Неверный ключ проекта');

$dir = "$PLANS_DIR/$key";
$ownerFile = "$dir/owner.json";

/** Папку проекта заводит тот, кто первым залил в неё подложку. */
function ownerOf($ownerFile) {
    $data = json_decode(@file_get_contents($ownerFile), true);
    return is_array($data) ? ($data['email'] ?? null) : null;
}

$owner = ownerOf($ownerFile);
if ($owner !== null && $owner !== $email && !in_array($email, SUPER_ADMIN_EMAILS, true)) {
    fail(403, 'Планы этого объекта принадлежат другому пользователю');
}

if ($action === 'put') {
    $floor = (int)($req['floor'] ?? 0);
    if ($floor < 1 || $floor > $MAX_FLOORS) fail(400, 'Неверный номер этажа');

    $ext = preg_replace('/[^a-z]/', '', strtolower((string)($req['ext'] ?? 'jpg')));
    if (!in_array($ext, ['jpg', 'webp', 'png'], true)) fail(400, 'Неверный формат файла');

    $raw = base64_decode((string)($req['data'] ?? ''), true);
    if ($raw === false || $raw === '') fail(400, 'Пустой файл');
    if (strlen($raw) > $MAX_BYTES) fail(413, 'Файл больше 4 МБ — уменьшите разрешение плана');

    if (readUsage($PLANS_DIR) + strlen($raw) > $MAX_TOTAL) {
        fail(507, 'Хранилище планов заполнено, обратитесь к администратору');
    }

    // Первый заход в plans/ закрывает раздел от прямого чтения: файлы отдаём
    // только этим скриптом, по ключу проекта.
    if (!is_dir($PLANS_DIR)) {
        @mkdir($PLANS_DIR, 0755, true);
        @file_put_contents($PLANS_DIR . '/.htaccess', "Deny from all\n");
        @file_put_contents($PLANS_DIR . '/index.html', '');
    }
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) fail(500, 'Не удалось создать папку проекта');

    $name = $floor . '-' . substr(md5($raw), 0, 8) . '.' . $ext;
    $freed = 0;
    // Прежние подложки этого этажа больше не нужны: разметка ссылается на
    // новое имя, а старый файл остался бы висеть мёртвым грузом.
    foreach (scandir($dir) ?: [] as $f) {
        if (!validName($f) || $f === $name) continue;
        if ((int)strstr($f, '-', true) !== $floor) continue;
        $sz = filesize("$dir/$f");
        if (@unlink("$dir/$f")) $freed += $sz;
    }

    $path = "$dir/$name";
    $existed = is_file($path) ? filesize($path) : 0;
    if (@file_put_contents($path, $raw) === false) fail(500, 'Не удалось сохранить подложку');

    if ($owner === null) {
        @file_put_contents($ownerFile, json_encode([
            'email' => $email, 'created_at' => date('c'),
        ], JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
    bumpUsage($PLANS_DIR, strlen($raw) - $existed - $freed);
    // Раз в сутки заодно подметаем заброшенные объекты — планировщик для
    // этого не нужен, место занимают ровно те, кто сюда и пишет.
    autoSweep($PLANS_DIR, $RETENTION_DAYS);

    echo json_encode([
        'ok' => true, 'file' => $name, 'bytes' => strlen($raw),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'drop') {
    // Без floor — весь объект (сброс расчёта), с floor — один этаж.
    $floor = isset($req['floor']) ? (int)$req['floor'] : null;
    $removed = 0; $freed = 0;
    foreach (scandir($dir) ?: [] as $f) {
        if (!validName($f)) continue;
        if ($floor !== null && (int)strstr($f, '-', true) !== $floor) continue;
        $sz = filesize("$dir/$f");
        if (@unlink("$dir/$f")) { $removed++; $freed += $sz; }
    }
    if ($floor === null) {
        @unlink($ownerFile);
        @rmdir($dir);
    }
    bumpUsage($PLANS_DIR, -$freed);
    echo json_encode(['ok' => true, 'removed' => $removed, 'freedBytes' => $freed], JSON_UNESCAPED_UNICODE);
    exit;
}

fail(400, 'Неизвестное действие');
