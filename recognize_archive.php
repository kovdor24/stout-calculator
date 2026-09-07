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

$ARCHIVE_DIR = __DIR__ . '/archive';
$MAX_BYTES   = 25 * 1024 * 1024;   // потолок на один файл сметы

/**
 * Проверка доступа к архиву — та же сессия Supabase, что и в самом
 * калькуляторе (см. app.js: getAdminRole/hasAdminAccess).
 *
 * Токен из заголовка Authorization отправляется в Supabase Auth за email
 * владельца сессии, а роль проверяется тем же правилом, что на клиенте:
 * три захардкоженных владельческих адреса, либо account_type админ/просмотр
 * в таблице users. Ключ, публичный в app.js (тот же, что уже используется
 * для обычных запросов к Supabase), не секрет — сама Supabase-защита живёт
 * в токене сессии и в проверке роли.
 */
const SUPABASE_HOST = 'https://ahanbwugsmcyvrwbmtlx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gcMJ-PvJmKavObbnePFGZQ_O-pu5O2p';
const SUPER_ADMIN_EMAILS = ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'];

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

/**
 * Персональные лимиты распознаваний, файлом рядом с архивом.
 *
 * Специально не в Supabase: миграция ради одного числа на пользователя не
 * стоит того, а файл здесь же, рядом с самими распознаваниями, по которым
 * лимит и считается.
 */
const LIMIT_DEFAULT = 50;

function limitsPath() { return __DIR__ . '/archive/limits.json'; }
function accessPath() { return __DIR__ . '/archive/access.json'; }

/**
 * Ключ для еженедельного разбора промахов подбора.
 *
 * Сводку читает не человек в браузере, а задача по расписанию: сессии
 * Supabase у неё нет и быть не может. Отдавать сводку всем подряд нельзя —
 * в ней строки чужих смет, — поэтому отдельный ключ, и только на чтение
 * сводки: ни архива, ни файлов, ни удаления он не открывает.
 *
 * Заводит его администратор кнопкой в админке; здесь он только хранится.
 */
function reportKeyPath() { return __DIR__ . '/archive/report_key.txt'; }

function readReportKey() {
    $k = @file_get_contents(reportKeyPath());
    return is_string($k) ? trim($k) : '';
}

/** Сравнение постоянного времени: чтобы ключ нельзя было подобрать по задержке. */
function reportKeyValid($given) {
    $key = readReportKey();
    if ($key === '' || !is_string($given) || $given === '') return false;
    return hash_equals($key, trim($given));
}

/**
 * Кому открыты платные инструменты.
 *
 * Распознавание — двумя списками: поимённо (логин или email монтажника) и по
 * регионам, так дистрибьютору можно включить инструмент целой области, не
 * перебирая людей вручную. Администраторам доступ не нужен: он у них всегда.
 *
 * Проектирование (листы проекта, редактор планов) лежит отдельным разделом
 * design и добавляет третий список — по дистрибьюторам: их монтажники часто
 * разбросаны по регионам, и включать инструмент удобнее сразу всей компании.
 * Ключи распознавания остались на верхнем уровне, чтобы старые калькуляторы,
 * которые ещё не обновились, читали свой доступ как прежде.
 */
function emptyFeature() {
    return ['users' => [], 'regions' => [], 'dists' => []];
}

function readAccess() {
    $raw = @file_get_contents(accessPath());
    $data = $raw ? json_decode($raw, true) : null;
    if (!is_array($data)) $data = [];
    $design = is_array($data['design'] ?? null) ? $data['design'] : [];
    return [
        'users'   => is_array($data['users'] ?? null) ? $data['users'] : [],
        'regions' => is_array($data['regions'] ?? null) ? $data['regions'] : [],
        'dists'   => is_array($data['dists'] ?? null) ? $data['dists'] : [],
        'design'  => [
            'users'   => is_array($design['users'] ?? null) ? $design['users'] : [],
            'regions' => is_array($design['regions'] ?? null) ? $design['regions'] : [],
            'dists'   => is_array($design['dists'] ?? null) ? $design['dists'] : [],
        ],
    ];
}

function writeAccess($data) {
    @file_put_contents(accessPath(), json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

function readLimits() {
    $raw = @file_get_contents(limitsPath());
    $data = $raw ? json_decode($raw, true) : null;
    return is_array($data) ? $data : [];
}

function writeLimits($data) {
    @file_put_contents(limitsPath(), json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

/**
 * Сколько ЗАПРОСОВ к модели израсходовал пользователь с начала месяца.
 *
 * Раньше считались запуски: один разбор сметы — одна единица лимита. С
 * полистным разбором это перестало отражать расход: смета на три листа стоит
 * трёх-четырёх запросов, и лимит «50 в месяц» мог означать и 50 запросов, и
 * 200 — как повезёт с числом страниц. Считаем то, что реально тратится.
 *
 * Записи, сделанные до этой правки, поля calls не имеют — они засчитываются
 * как один запрос, ровно как и считались тогда.
 */
function usedThisMonth($archiveDir, $user) {
    $used = 0;
    $prefix = date('Y-m');   // папки названы датой, месяц — это префикс
    foreach (scandir($archiveDir) ?: [] as $day) {
        if (strpos($day, $prefix) !== 0) continue;
        foreach (scandir("$archiveDir/$day") ?: [] as $f) {
            if (substr($f, -5) !== '.json') continue;
            $meta = json_decode(@file_get_contents("$archiveDir/$day/$f"), true);
            if (!is_array($meta) || ($meta['user'] ?? null) !== $user) continue;
            $calls = isset($meta['calls']) ? (int)$meta['calls'] : 1;
            $used += max(1, $calls);
        }
    }
    return $used;
}

/**
 * Обрезка и понижение регистра, не режущие кириллицу пополам.
 *
 * Обычные substr/strtolower считают байты и русский текст ломают, а mbstring
 * есть не на всяком хостинге. Поэтому одна точка входа: где расширение есть —
 * работает оно, где нет — регулярка по символам Юникода.
 */
function uSub($s, $start, $len) {
    if (function_exists('mb_substr')) return mb_substr((string)$s, $start, $len, 'UTF-8');
    $chars = preg_split('//u', (string)$s, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    return implode('', array_slice($chars, $start, $len));
}

function uLower($s) {
    if (function_exists('mb_strtolower')) return mb_strtolower((string)$s, 'UTF-8');
    // Латиница средствами ядра, кириллица — таблицей: strtolower её не знает.
    $s = strtolower((string)$s);
    $up = ['А','Б','В','Г','Д','Е','Ё','Ж','З','И','Й','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю','Я'];
    $lo = ['а','б','в','г','д','е','ё','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я'];
    return str_replace($up, $lo, $s);
}

/**
 * Производители, которых умеем узнавать в строках чужих смет.
 *
 * Зачем. Строка сметы — единственное место, где видно, ЧЕМ монтажник собирает
 * систему на самом деле. Wordstat показывает, что люди ищут; отгрузки
 * дистрибьютора — что он продал; а здесь лежит то, что монтажник выписал себе
 * в закупку, своим почерком. Это и есть ответ на вопрос, кого мы вытесняем.
 *
 * Слева — как марку пишут в смете (включая кириллицу и слитные написания),
 * справа — общее имя, под которым она попадёт в сводку. Свои марки помечены
 * отдельно: в отчёте они нужны не рядом с чужими, а против них.
 *
 * Двухбуквенные и слишком общие сокращения сюда не берём: «LD», «RM» и
 * подобные ловят половину словаря. Лучше не увидеть марку, чем насчитать её
 * там, где её нет.
 */
function brandDictionary() {
    $own = ['stout' => 'STOUT', 'rommer' => 'ROMMER'];
    $foreign = [
        'valtec' => 'Valtec', 'rehau' => 'Rehau', 'рехау' => 'Rehau', 'ре-ха' => 'Rehau',
        'royal thermo' => 'Royal Thermo', 'royalthermo' => 'Royal Thermo',
        'baxi' => 'Baxi', 'бакси' => 'Baxi', 'henco' => 'Henco', 'giacomini' => 'Giacomini',
        'tiemme' => 'Tiemme', 'ostendorf' => 'Ostendorf', 'остендорф' => 'Ostendorf',
        'grohe' => 'Grohe', 'tecofi' => 'Tecofi', 'zota' => 'Zota', 'зота' => 'Zota',
        'thermex' => 'Thermex', 'термекс' => 'Thermex',
        'herz' => 'Herz', 'герц' => 'Herz',
        'energoflex' => 'Energoflex', 'энергофлекс' => 'Energoflex',
        'energofloor' => 'Energoflex', 'energoprof' => 'Energoprof',
        'pro aqua' => 'Pro Aqua', 'proaqua' => 'Pro Aqua', 'про аква' => 'Pro Aqua',
        'fv-plast' => 'FV-Plast', 'fv plast' => 'FV-Plast', 'wavin' => 'Wavin',
        'uponor' => 'Uponor', 'oventrop' => 'Oventrop', 'danfoss' => 'Danfoss', 'данфосс' => 'Danfoss',
        'luxor' => 'Luxor', 'itap' => 'Itap', 'icma' => 'Icma', 'caleffi' => 'Caleffi',
        'watts' => 'Watts', 'emmeti' => 'Emmeti', 'bugatti' => 'Bugatti',
        'vaillant' => 'Vaillant', 'вайлант' => 'Vaillant', 'navien' => 'Navien', 'навьен' => 'Navien',
        'protherm' => 'Protherm', 'buderus' => 'Buderus', 'viessmann' => 'Viessmann',
        'ariston' => 'Ariston', 'ferroli' => 'Ferroli', 'rinnai' => 'Rinnai',
        'sinikon' => 'Sinikon', 'синикон' => 'Sinikon', 'политэк' => 'Политэк', 'политек' => 'Политэк',
        'ростерм' => 'Ростерм', 'rosterm' => 'Ростерм', 'pipelife' => 'Pipelife',
        'flexcon' => 'Flexcon', 'airfix' => 'Airfix', 'reflex' => 'Reflex',
        'wilo' => 'Wilo', 'вило' => 'Wilo', 'grundfos' => 'Grundfos', 'грундфос' => 'Grundfos',
        'stenoflex' => 'Стенофлекс', 'стенофлекс' => 'Стенофлекс',
        'k-flex' => 'K-Flex', 'kflex' => 'K-Flex', 'thermaflex' => 'Thermaflex',
        'gappo' => 'Gappo', 'neptun' => 'Neptun', 'нептун' => 'Neptun',
        'gidrolock' => 'Gidrolock', 'гидролок' => 'Gidrolock',
        'elsen' => 'Elsen', 'эльзен' => 'Elsen',
        'uni-fitt' => 'Uni-Fitt', 'unifitt' => 'Uni-Fitt', 'profactor' => 'Profactor',
        'viega' => 'Viega', 'sanha' => 'Sanha', 'tece' => 'TECE',
        'honeywell' => 'Honeywell', 'esbe' => 'Esbe', 'meibes' => 'Meibes',
        'rosma' => 'Росма', 'росма' => 'Росма', 'unipak' => 'Unipak',
        'ekoplastik' => 'Ekoplastik', 'pilsa' => 'Pilsa', 'tebo' => 'Tebo',
        'walraven' => 'Walraven', 'sanext' => 'Sanext', 'alterplast' => 'Alterplast',
        'aquatech' => 'Aquatech', 'maincor' => 'Maincor', 'sti' => 'STI',
        'tim' => 'TIM', 'vieir' => 'Vieir', 'far' => 'FAR', 'mvi' => 'MVI',
        'aquaflax' => 'Aquaflax', 'сантехмастер' => 'Сантехмастер',
    ];
    return ['own' => $own, 'foreign' => $foreign];
}

/**
 * Марка названа в строке, а не примерещилась внутри слова.
 *
 * Простой strpos ловит «far» в «фарфор» и «tim» в «optimal», а таких строк в
 * сметах хватает. Поэтому найденное слово ещё проверяется на границы: слева и
 * справа от него не должно быть буквы или цифры.
 */
function brandMentioned($haystack, $alias) {
    if (strpos($haystack, $alias) === false) return false;   // дешёвая отсечка
    $re = '/(?<![\p{L}\p{N}])' . preg_quote($alias, '/') . '(?![\p{L}\p{N}])/u';
    return (bool)preg_match($re, $haystack);
}

/** Строка сметы, приведённая к виду, в котором одинаковые склеиваются. */
function normalizeRawLine($raw) {
    $s = uLower($raw);
    $s = str_replace('ё', 'е', $s);
    $s = preg_replace('/^\s*\d+\s*[.)]\s*/u', '', $s);                     // «12. » в начале
    $s = preg_replace('/[-–—]?\s*\d+(?:[.,]\d+)?\s*(?:шт|штук\w*|компл\w*|пар\w*|м2|м\.?п\.?|мп|м)\.?\s*$/u', '', $s);
    $s = preg_replace('/\s+/u', ' ', $s);
    return trim($s);
}

/** Чей артикул подобрался: свой каталог, второй бренд или строка прайса. */
function articleOwner($id) {
    $s = (string)$id;
    if ($s === '') return null;
    if (preg_match('/^S[A-Z]{2}[- ]/', $s)) return 'STOUT';
    if (preg_match('/^R[A-Z]{2}[- ]/', $s)) return 'ROMMER';
    return 'прайс';
}

/**
 * Артикул, которым он быть не может.
 *
 * Два случая, оба из разбора живого архива: вместо артикула подставилась цена
 * («2131.5», «13085.67») и вместо артикула подставилось слово («Италия»).
 * Причина не здесь, а в сборке прайс-индекса, где у части листов колонка
 * артикула съезжает. Но заметить это можно только отсюда, поэтому считаем.
 */
function looksBrokenArticle($id) {
    $s = trim((string)$id);
    if ($s === '') return false;
    if (preg_match('/^\d+[.,]\d+$/', $s)) return true;          // цена
    if (preg_match('/[\p{Cyrillic}]/u', $s)) return true;       // слово по-русски
    return false;
}

/**
 * Сводка по всему архиву: регионы, марки, промахи подбора.
 *
 * Пересчитывается не чаще раза в час и кладётся рядом с архивом: обход
 * пятисот разборов — это полминуты работы диска, а вкладку админки открывают
 * подряд по десять раз. ?force=1 пересобирает немедленно.
 */
function archiveSummary($archiveDir, $days, $force = false) {
    $cachePath = $archiveDir . '/summary.json';
    $ttl = 3600;
    if (!$force && is_file($cachePath)) {
        $cached = json_decode(@file_get_contents($cachePath), true);
        if (is_array($cached) && ($cached['days'] ?? null) === $days
            && (time() - (int)($cached['builtTs'] ?? 0)) < $ttl) {
            $cached['cached'] = true;
            return $cached;
        }
    }

    $dict = brandDictionary();
    $edge = date('Y-m-d', time() - $days * 86400);

    $totals = ['records' => 0, 'plans' => 0, 'estimates' => 0, 'lines' => 0,
        'unmatched' => 0, 'manual' => 0, 'fromMemory' => 0, 'repeats' => 0,
        'calls' => 0, 'fromCache' => 0, 'broken' => 0, 'noQty' => 0,
        // Строки, про которые подбор знает точно: своего такого нет вовсе.
        'sysMiss' => 0];
    $months = []; $regions = []; $regionUsers = []; $users = [];
    $brandHits = []; $picked = ['STOUT' => 0, 'ROMMER' => 0, 'прайс' => 0];
    $types = []; $missRaw = ['unparsed' => [], 'nomatch' => []];
    $manualRaw = []; $brokenRaw = []; $seen = [];

    $dirs = is_dir($archiveDir) ? scandir($archiveDir, SCANDIR_SORT_DESCENDING) : [];
    foreach ($dirs as $day) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) || $day < $edge) continue;
        foreach (scandir("$archiveDir/$day") ?: [] as $f) {
            if (substr($f, -5) !== '.json') continue;
            $meta = json_decode(@file_get_contents("$archiveDir/$day/$f"), true);
            if (!is_array($meta)) continue;

            $totals['records']++;
            $user = (string)($meta['user'] ?? '');
            $region = trim((string)($meta['region'] ?? ''));
            if ($region === '') $region = 'без региона';
            $month = substr((string)($meta['saved_at'] ?? $day), 0, 7);
            if ($user !== '') $users[$user] = 1;

            $totals['calls'] += (int)($meta['calls'] ?? 0);
            $totals['fromCache'] += (int)($meta['fromCache'] ?? 0);

            if (!isset($months[$month])) $months[$month] = ['records' => 0, 'lines' => 0, 'unmatched' => 0, 'calls' => 0, 'plans' => 0];
            if (!isset($regions[$region])) $regions[$region] = ['records' => 0, 'lines' => 0, 'unmatched' => 0, 'plans' => 0, 'users' => 0];
            $months[$month]['records']++;
            $months[$month]['calls'] += (int)($meta['calls'] ?? 0);
            $regions[$region]['records']++;
            if ($user !== '') $regionUsers[$region][$user] = 1;

            // План этажа — не смета: строк материалов в нём нет, и мешать его
            // с закупкой нельзя. Считаем отдельной цифрой.
            if (($meta['source'] ?? '') === 'floor_plan' || strpos((string)($meta['mode'] ?? ''), 'plan') === 0) {
                $totals['plans']++; $months[$month]['plans']++; $regions[$region]['plans']++;
                continue;
            }
            $totals['estimates']++;

            $result = is_array($meta['result'] ?? null) ? $meta['result'] : [];

            // Та же смета, загруженная второй раз. Считаем по первым строкам:
            // повтор сжигает лимит и задваивает статистику, а в архиве таких
            // пар заметно больше, чем можно было ожидать.
            $sig = $user . '|' . count($result);
            foreach (array_slice($result, 0, 5) as $l) $sig .= '|' . uSub((string)($l['raw'] ?? ''), 0, 40);
            $sig = md5($sig);
            if (isset($seen[$sig])) $totals['repeats']++;
            $seen[$sig] = 1;

            // Марку засчитываем один раз на смету, а не на каждую строку:
            // иначе одна закупка труб Ostendorf на сто позиций перевесит
            // десять смет других монтажников.
            $inThis = [];

            foreach ($result as $line) {
                if (!is_array($line)) continue;
                $totals['lines']++; $months[$month]['lines']++; $regions[$region]['lines']++;

                $raw = (string)($line['raw'] ?? '');
                $type = (string)($line['type'] ?? '');
                if ($type === '') $type = 'без типа';
                $matched = is_array($line['matched'] ?? null) ? $line['matched'] : null;
                $id = $matched ? (string)($matched['id'] ?? '') : '';

                if (!isset($types[$type])) $types[$type] = ['n' => 0, 'miss' => 0];
                $types[$type]['n']++;

                $qty = $line['qty'] ?? null;
                if ($qty === null || $qty === '') $totals['noQty']++;

                $norm = normalizeRawLine($raw);

                if ($id === '') {
                    $totals['unmatched']++; $months[$month]['unmatched']++;
                    $regions[$region]['unmatched']++; $types[$type]['miss']++;
                    if ($norm !== '') {
                        /**
                         * Две разные беды, и лечатся они по-разному.
                         *
                         * «Не разобрали» — модель не поняла, ЧТО это: тип
                         * остался общим («прочее») или его нет вовсе. Каталог
                         * тут ни при чём, чинится словарём типов и правилами
                         * разбора.
                         *
                         * «Разобрали, но не нашли» — предмет опознан, а
                         * артикула нет. Это прямой запрос на пополнение
                         * каталога, и самый ценный его случай — когда подбор
                         * знает, что своего такого нет вовсе (sysMiss).
                         */
                        $sysMiss = (string)($line['sysMiss'] ?? '');
                        $generic = ($type === 'прочее' || $type === 'без типа');
                        $bucket = $generic ? 'unparsed' : 'nomatch';
                        $key = uSub($norm, 0, 70);
                        if (!isset($missRaw[$bucket][$key])) {
                            $missRaw[$bucket][$key] = ['raw' => $key, 'n' => 0, 'type' => $type,
                                'sysMiss' => $sysMiss ?: null, 'regions' => []];
                        }
                        $missRaw[$bucket][$key]['n']++;
                        $missRaw[$bucket][$key]['regions'][$region] = 1;
                        if ($sysMiss) {
                            $missRaw[$bucket][$key]['sysMiss'] = $sysMiss;
                            $totals['sysMiss']++;
                        }
                    }
                } else {
                    $owner = articleOwner($id);
                    if ($owner !== null) $picked[$owner] = ($picked[$owner] ?? 0) + 1;
                    if (looksBrokenArticle($id)) {
                        $totals['broken']++;
                        $key = uSub($norm, 0, 50) . ' → ' . $id;
                        if (!isset($brokenRaw[$key])) $brokenRaw[$key] = ['raw' => uSub($norm, 0, 50), 'id' => $id, 'n' => 0];
                        $brokenRaw[$key]['n']++;
                    }
                }

                if (!empty($line['manual'])) {
                    $totals['manual']++;
                    $key = uSub($norm, 0, 60) . ' → ' . $id;
                    if (!isset($manualRaw[$key])) $manualRaw[$key] = [
                        'raw' => uSub($norm, 0, 60), 'id' => $id,
                        'name' => uSub((string)($matched['name'] ?? ''), 0, 70),
                        'n' => 0, 'regions' => [],
                    ];
                    $manualRaw[$key]['n']++;
                    $manualRaw[$key]['regions'][$region] = 1;
                }
                if (!empty($line['fromMem'])) $totals['fromMemory']++;

                // Поиск марок идёт по той же нормализованной строке.
                $hay = ' ' . $norm . ' ';
                foreach (['own', 'foreign'] as $kind) {
                    foreach ($dict[$kind] as $alias => $name) {
                        if (isset($inThis[$name])) continue;
                        if (brandMentioned($hay, $alias)) $inThis[$name] = $kind;
                    }
                }
            }

            foreach ($inThis as $name => $kind) {
                if (!isset($brandHits[$name])) $brandHits[$name] = ['name' => $name, 'own' => $kind === 'own', 'n' => 0, 'regions' => []];
                $brandHits[$name]['n']++;
                $brandHits[$name]['regions'][$region] = ($brandHits[$name]['regions'][$region] ?? 0) + 1;
            }
        }
    }

    foreach ($regions as $r => $_) $regions[$r]['users'] = count($regionUsers[$r] ?? []);

    // Сортировки и обрезка: в браузер уезжает верхушка каждого списка, а не
    // весь архив. Полностью он всё равно не нужен — там длинный хвост из
    // единичных строк.
    $byN = function ($a, $b) { return $b['n'] - $a['n']; };
    $brands = array_values($brandHits); usort($brands, $byN);
    $cut = function ($bag, $limit) use ($byN) {
        $rows = array_values($bag);
        usort($rows, $byN);
        $rows = array_slice($rows, 0, $limit);
        foreach ($rows as $i => $r) $rows[$i]['regions'] = array_keys($r['regions']);
        return $rows;
    };
    $noMatch = $cut($missRaw['nomatch'], 80);
    $unparsed = $cut($missRaw['unparsed'], 80);
    // Общий список остаётся для тех, кто читал сводку до разделения: старая
    // вкладка админки ждёт topMissing и без него показала бы пустоту.
    $miss = $cut($missRaw['nomatch'] + $missRaw['unparsed'], 60);
    $manual = array_values($manualRaw); usort($manual, $byN); $manual = array_slice($manual, 0, 40);
    foreach ($manual as $i => $m) $manual[$i]['regions'] = array_keys($m['regions']);
    $broken = array_values($brokenRaw); usort($broken, $byN); $broken = array_slice($broken, 0, 30);

    $typeList = [];
    foreach ($types as $t => $v) $typeList[] = ['type' => $t, 'n' => $v['n'], 'miss' => $v['miss']];
    usort($typeList, function ($a, $b) { return $b['miss'] - $a['miss'] ?: $b['n'] - $a['n']; });
    $typeList = array_slice($typeList, 0, 30);

    ksort($months);
    $totals['users'] = count($users);

    $out = [
        'ok' => true, 'cached' => false, 'days' => $days,
        'builtAt' => date('c'), 'builtTs' => time(),
        'totals' => $totals, 'months' => $months, 'regions' => $regions,
        'brands' => $brands, 'picked' => $picked, 'types' => $typeList,
        'topMissing' => $miss, 'topManual' => $manual, 'brokenArticles' => $broken,
        // Раздельно: что не разобрали и что разобрали, но не нашли.
        'topNoMatch' => $noMatch, 'topUnparsed' => $unparsed,
    ];
    @file_put_contents($cachePath, json_encode($out, JSON_UNESCAPED_UNICODE), LOCK_EX);
    return $out;
}

/**
 * Остаток распознаваний. Отвечает без авторизации: это нужно самому
 * монтажнику перед отправкой сметы, и секрета в числе нет.
 */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['quota'])) {
    $user = (string)($_GET['user'] ?? '');
    $limits = readLimits();
    $limit = isset($limits[$user]) ? (int)$limits[$user] : LIMIT_DEFAULT;
    $used = is_dir($ARCHIVE_DIR) ? usedThisMonth($ARCHIVE_DIR, $user) : 0;
    echo json_encode([
        'ok' => true, 'user' => $user,
        'limit' => $limit, 'used' => $used, 'left' => max(0, $limit - $used),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Списки доступа. Без авторизации: калькулятор спрашивает их при запуске,
 * чтобы понять, показывать ли монтажнику вкладку распознавания.
 */
/**
 * Сводка по ключу — для еженедельного разбора промахов подбора.
 *
 * Стоит выше проверки администратора намеренно: у задачи по расписанию нет
 * сессии Supabase. Ключ открывает ровно одно — эту сводку.
 */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['summary']) && !empty($_GET['key'])) {
    if (!reportKeyValid($_GET['key'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Неверный ключ отчёта']);
        exit;
    }
    $days = max(1, min(730, (int)($_GET['days'] ?? 365)));
    echo json_encode(archiveSummary($ARCHIVE_DIR, $days, !empty($_GET['force'])), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && !empty($_GET['access'])) {
    echo json_encode(array_merge(['ok' => true], readAccess()), JSON_UNESCAPED_UNICODE);
    exit;
}

/** Чтение архива: ?list=1 — список записей, ?get=день/файл — сам файл. */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = bearerToken();
    $email = tokenEmail($token);
    if (!$email || !isAllowedAdmin($email, $token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Доступ только для администраторов']);
        exit;
    }

    // --- Отдача одного файла (оригинал сметы или её разбор) ---------------
    if (!empty($_GET['get'])) {
        // Только «день/имя», никаких переходов вверх по дереву.
        $rel = (string)$_GET['get'];
        if (!preg_match('~^\d{4}-\d{2}-\d{2}/[A-Za-z0-9_.@-]+$~', $rel)) {
            http_response_code(400);
            echo json_encode(['error' => 'Неверное имя файла']);
            exit;
        }
        $path = "$ARCHIVE_DIR/$rel";
        if (!is_file($path)) {
            http_response_code(404);
            echo json_encode(['error' => 'Файл не найден']);
            exit;
        }
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $types = [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
            'webp' => 'image/webp', 'pdf' => 'application/pdf', 'json' => 'application/json',
        ];
        $type = $types[$ext] ?? 'application/octet-stream';
        // Картинки и PDF открываются в браузере, остальное скачивается.
        $inline = isset($types[$ext]) && $ext !== 'json' ? 'inline' : 'attachment';
        if ($ext === 'json') $inline = 'inline';

        header('Content-Type: ' . $type);
        header('Content-Length: ' . filesize($path));
        header('Content-Disposition: ' . $inline . '; filename="' . basename($path) . '"');
        readfile($path);
        exit;
    }

    // --- Сколько места занимает архив --------------------------------------
    // Оригиналы (фото, PDF) и разборы (json) считаем отдельно: чистить имеет
    // смысл первые, вторые весят копейки и нужны для сверки распознавания.
    if (!empty($_GET['stats'])) {
        $originals = 0; $originalsBytes = 0; $jsons = 0; $jsonBytes = 0;
        $dirs = is_dir($ARCHIVE_DIR) ? scandir($ARCHIVE_DIR) : [];
        foreach ($dirs as $day) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) continue;
            foreach (scandir("$ARCHIVE_DIR/$day") ?: [] as $f) {
                $path = "$ARCHIVE_DIR/$day/$f";
                if (!is_file($path)) continue;
                $size = filesize($path);
                if (substr($f, -5) === '.json') { $jsons++; $jsonBytes += $size; }
                else { $originals++; $originalsBytes += $size; }
            }
        }
        echo json_encode([
            'ok' => true,
            'originals' => $originals, 'originalsBytes' => $originalsBytes,
            'jsons' => $jsons, 'jsonBytes' => $jsonBytes,
            // Диск хостинга: на Beget это общий раздел сервера, а не квота
            // аккаунта, поэтому в админке подписан отдельно от размера архива.
            'diskTotal' => @disk_total_space(__DIR__) ?: null,
            'diskFree'  => @disk_free_space(__DIR__) ?: null,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // --- Сводка по архиву ---------------------------------------------------
    // Списком этого не собрать. В ответе ?list=1 от каждой записи приезжают
    // только счётчики и ручные замены, а бренды, типы и промахи лежат внутри
    // разборов — по файлу на запись. Пятьдесят восемь браузер ещё прочитает,
    // пятьсот уже нет: это полсотни мегабайт по сети ради двух десятков чисел.
    //
    // Поэтому считает сервер, здесь же, рядом с файлами, и отдаёт готовое.
    if (!empty($_GET['summary'])) {
        $days = max(1, min(730, (int)($_GET['days'] ?? 365)));
        echo json_encode(archiveSummary($ARCHIVE_DIR, $days, !empty($_GET['force'])), JSON_UNESCAPED_UNICODE);
        exit;
    }

    // --- Список распознаваний ---------------------------------------------
    $days = max(1, min(365, (int)($_GET['days'] ?? 90)));
    $limit = max(1, min(500, (int)($_GET['limit'] ?? 200)));

    $rows = [];
    $dirs = is_dir($ARCHIVE_DIR) ? scandir($ARCHIVE_DIR, SCANDIR_SORT_DESCENDING) : [];
    $edge = date('Y-m-d', time() - $days * 86400);

    foreach ($dirs as $day) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) || $day < $edge) continue;
        $files = scandir("$ARCHIVE_DIR/$day", SCANDIR_SORT_DESCENDING) ?: [];

        // Записи опознаём по json-файлу разбора: рядом с ним лежит оригинал
        // с тем же именем, но другим расширением.
        foreach ($files as $f) {
            if (substr($f, -5) !== '.json') continue;
            $meta = json_decode(@file_get_contents("$ARCHIVE_DIR/$day/$f"), true);
            if (!is_array($meta)) continue;

            $base = substr($f, 0, -5);
            $attached = [];
            // Размер считаем по оригиналам: именно они занимают диск, и
            // по нему в админке видно, какие записи стоит чистить первыми.
            $bytes = 0;
            foreach ($files as $g) {
                if ($g === $f || strpos($g, $base . '.') !== 0) continue;
                $attached[] = "$day/$g";
                $bytes += (int)@filesize("$ARCHIVE_DIR/$day/$g");
            }

            $result = is_array($meta['result'] ?? null) ? $meta['result'] : [];
            $counts = is_array($meta['counts'] ?? null) ? $meta['counts'] : [];

            // Строки, подобранные монтажником ВРУЧНУЮ. Это единственное место,
            // где он сообщает то, чего калькулятор знать не может: как именно
            // его поставщик называет наш товар. Отдаём их прямо в списке, а не
            // прячем в разборе: иначе сводку «что правят чаще всего» пришлось
            // бы собирать, открывая каждую запись по одной.
            //
            // Ограничение сверху — на случай сметы, где переподобрано всё:
            // список читается целиком на каждое открытие вкладки.
            $manual = [];
            foreach ($result as $line) {
                if (!is_array($line) || empty($line['manual'])) continue;
                $matched = is_array($line['matched'] ?? null) ? $line['matched'] : [];
                $manual[] = [
                    'raw'  => uSub((string)($line['raw'] ?? ''), 0, 120),
                    'id'   => $matched['id'] ?? null,
                    'name' => uSub((string)($matched['name'] ?? ''), 0, 120),
                ];
                if (count($manual) >= 40) break;
            }

            $rows[] = [
                'id'          => "$day/$f",
                'day'         => $day,
                'savedAt'     => $meta['saved_at'] ?? null,
                'user'        => $meta['user'] ?? null,
                'region'      => $meta['region'] ?? null,
                'distributorId' => $meta['distributorId'] ?? null,
                'source'      => $meta['source'] ?? null,
                'fileName'    => $meta['fileName'] ?? null,
                'mode'        => $meta['mode'] ?? null,
                'calcId'      => $meta['calcId'] ?? null,
                'projectName' => $meta['projectName'] ?? null,
                // Запросов к модели: по ним считается лимит, и в таблице
                // админки видно, почему у монтажника «10 распознаваний» съели
                // сорок единиц — многолистные сметы.
                'calls'       => isset($meta['calls']) ? (int)$meta['calls'] : null,
                'fromCache'   => isset($meta['fromCache']) ? (int)$meta['fromCache'] : null,
                'recognized'  => $counts['recognized'] ?? count($result),
                'applied'     => $counts['applied'] ?? null,
                'replaced'    => $counts['replaced'] ?? null,
                'fromMemory'  => $counts['fromMemory'] ?? null,
                'manual'      => $manual,
                'files'       => $attached,
                'bytes'       => $bytes,
                'json'        => "$day/$f",
            ];
            if (count($rows) >= $limit) break 2;
        }
    }

    echo json_encode(['ok' => true, 'rows' => $rows], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body = file_get_contents('php://input');
if (strlen($body) > $MAX_BYTES + 4 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Слишком большой запрос']);
    exit;
}

$req = json_decode($body, true);

/**
 * Очистка архива из админки.
 *
 * Отдельная ветка POST — приём смет от монтажников остаётся без авторизации
 * (его шлёт браузер каждого пользователя), а удаление доступно только
 * администратору по той же сессии, что и чтение.
 *
 * scope=originals убирает только оригиналы (фото, PDF) — они и занимают диск,
 * а разбор рядом остаётся, и запись в админке никуда не пропадает.
 * scope=all стирает записи целиком, вместе с разборами.
 */
if (is_array($req) && !empty($req['action'])) {
    $token = bearerToken();
    $email = tokenEmail($token);
    if (!$email || !isAllowedAdmin($email, $token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Доступ только для администраторов']);
        exit;
    }
    // Изменение персонального лимита монтажника.
    if ($req['action'] === 'setLimit') {
        $user = (string)($req['user'] ?? '');
        if ($user === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Не указан пользователь']);
            exit;
        }
        $limits = readLimits();
        // Пустое значение возвращает пользователя к общему лимиту.
        if ($req['limit'] === null || $req['limit'] === '') unset($limits[$user]);
        else $limits[$user] = max(0, (int)$req['limit']);
        writeLimits($limits);
        echo json_encode(['ok' => true, 'user' => $user,
            'limit' => $limits[$user] ?? LIMIT_DEFAULT], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Включение и выключение инструмента — человеку, дистрибьютору или региону.
    // feature: '' (распознавание, как было) либо 'design' (проектирование).
    if ($req['action'] === 'setAccess') {
        $access = readAccess();
        $enabled = !empty($req['enabled']);
        $feature = ($req['feature'] ?? '') === 'design' ? 'design' : '';
        $kindRaw = $req['kind'] ?? 'user';
        $kind = $kindRaw === 'region' ? 'regions' : ($kindRaw === 'dist' ? 'dists' : 'users');
        $names = is_array($req['names'] ?? null) ? $req['names'] : [(string)($req['name'] ?? '')];

        foreach ($names as $name) {
            $name = trim((string)$name);
            if ($name === '') continue;
            // Выключение записывается как false, а не удаляется. Иначе
            // «выключено» неотличимо от «никогда не настраивали», а это разные
            // вещи: администратору инструменты открыты ПО УМОЛЧАНИЮ, и снятый
            // ему доступ обязан пережить перезагрузку. Для всех остальных
            // отсутствие записи по-прежнему означает «выключено».
            if ($feature === 'design') {
                $access['design'][$kind][$name] = $enabled;
            } else {
                $access[$kind][$name] = $enabled;
            }
        }
        writeAccess($access);
        echo json_encode(array_merge(['ok' => true], $access), JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Все лимиты разом — для таблицы в админке.
    /**
     * Ключ для еженедельного разбора: показать существующий или завести новый.
     *
     * Заводится один раз и живёт дальше: перевыпуск нужен, только если ключ
     * куда-то утёк. Поэтому новый выдаётся лишь по явному renew — иначе
     * повторное открытие вкладки ломало бы уже настроенную задачу.
     */
    if ($req['action'] === 'reportKey') {
        $key = readReportKey();
        if ($key === '' || !empty($req['renew'])) {
            $key = bin2hex(random_bytes(24));
            // Папка архива появляется с первой присланной сметой, а ключ могут
            // завести раньше — тогда её ещё нет.
            if (!is_dir($ARCHIVE_DIR)) {
                @mkdir($ARCHIVE_DIR, 0755, true);
                @file_put_contents($ARCHIVE_DIR . '/.htaccess', "Deny from all\n");
            }
            @file_put_contents(reportKeyPath(), $key, LOCK_EX);
            @chmod(reportKeyPath(), 0600);
        }
        echo json_encode(['ok' => true, 'key' => $key], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($req['action'] === 'limits') {
        echo json_encode(['ok' => true, 'default' => LIMIT_DEFAULT, 'limits' => readLimits()], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($req['action'] !== 'purge') {
        http_response_code(400);
        echo json_encode(['error' => 'Неизвестное действие']);
        exit;
    }

    $scope = ($req['scope'] ?? 'originals') === 'all' ? 'all' : 'originals';
    $olderThan = isset($req['olderThanDays']) ? max(0, (int)$req['olderThanDays']) : null;
    $ids = is_array($req['ids'] ?? null) ? $req['ids'] : null;
    // Ноль дней означает «за всё время», а не «старше сегодняшнего дня»:
    // иначе сегодняшние записи оставались бы нетронутыми.
    $edge = ($olderThan === null || $olderThan === 0)
        ? null
        : date('Y-m-d', time() - $olderThan * 86400);

    $removed = 0; $freed = 0;
    $dirs = is_dir($ARCHIVE_DIR) ? scandir($ARCHIVE_DIR) : [];

    foreach ($dirs as $day) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) continue;
        if ($edge !== null && $day >= $edge) continue;   // свежие не трогаем

        foreach (scandir("$ARCHIVE_DIR/$day") ?: [] as $f) {
            $path = "$ARCHIVE_DIR/$day/$f";
            if (!is_file($path)) continue;

            $isJson = substr($f, -5) === '.json';
            if ($scope === 'originals' && $isJson) continue;   // разбор бережём

            // Точечное удаление: id записи — это её json, оригиналы лежат
            // рядом под тем же именем.
            if ($ids !== null) {
                $base = $isJson ? substr($f, 0, -5) : pathinfo($f, PATHINFO_FILENAME);
                if (!in_array("$day/$base.json", $ids, true)) continue;
            }

            $size = filesize($path);
            if (@unlink($path)) { $removed++; $freed += $size; }
        }
        // Пустую папку дня оставлять незачем.
        @rmdir("$ARCHIVE_DIR/$day");
    }

    // Сводка посчитана по тому, чего уже нет. Сносим её здесь же: иначе час
    // после чистки дашборд показывал бы удалённые записи как живые.
    @unlink($ARCHIVE_DIR . '/summary.json');

    echo json_encode(['ok' => true, 'removed' => $removed, 'freedBytes' => $freed], JSON_UNESCAPED_UNICODE);
    exit;
}

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
    'saved_at'    => date('c'),
    'user'        => $req['user'] ?? null,
    'source'      => $req['source'] ?? null,    // вид файла: image/xlsx/pdf/...
    'fileName'    => $req['fileName'] ?? null,
    'mode'        => $req['mode'] ?? null,      // add | new
    // Регион и дистрибьютор монтажника. Лежат в списках доступа, а не здесь,
    // и раньше в запись не попадали — из-за чего архив нельзя было разрезать
    // по регионам: кто прислал смету, видно, а откуда он — нет.
    'region'      => $req['region'] ?? null,
    'distributorId' => $req['distributorId'] ?? null,
    // Счётчики для вкладки «Распознавание» в админке: сколько строк
    // распознано, сколько ушло в смету, сколько монтажник заменил вручную.
    'counts'      => $req['counts'] ?? null,
    // Расход запросов к модели. Браузер присылает его с самого появления
    // полистного разбора, а вот сюда, в запись, число не попадало — и
    // usedThisMonth(), который специально научили считать запросы, у каждой
    // записи видел пустоту и засчитывал единицу. Смета на четыре листа стоила
    // столько же, сколько снятая на телефон одна страница, и лимит «50 в
    // месяц» снова ничего не означал.
    //
    // fromCache рядом: сколько листов ответила не модель, а повторный разбор
    // уже виденного файла. В лимит они не идут, но по ним видно, насколько
    // кэш экономит запросы.
    'calls'       => isset($req['calls']) ? (int)$req['calls'] : null,
    'fromCache'   => isset($req['fromCache']) ? (int)$req['fromCache'] : null,
    'calcId'      => $req['calcId'] ?? null,    // по нему админка открывает расчёт
    'projectName' => $req['projectName'] ?? null,
    'result'      => $req['result'],            // распознанные и подобранные строки
];
$jname = "$base.json";
@file_put_contents("$day/$jname", json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo json_encode([
    'ok'    => true,
    'day'   => date('Y-m-d'),
    'files' => array_merge($saved, [$jname]),
], JSON_UNESCAPED_UNICODE);
