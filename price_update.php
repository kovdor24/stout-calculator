<?php
/**
 * Ежемесячная пересборка индекса прайс-листа ТЕРЕМ.
 *
 * Запускается планировщиком Beget раз в месяц. Что делает:
 *   1. Открывает страницу списка прайсов и находит свежую ссылку. Прямой
 *      адрес файла предсказать нельзя — в нём случайный хеш, который
 *      меняется при каждой публикации, поэтому ссылку каждый раз ищем.
 *   2. Скачивает xlsx (около 90 МБ).
 *   3. Достаёт из архива ТОЛЬКО нужный XML. Девять десятых файла — это
 *      картинки товаров, их не трогаем: иначе не хватит ни памяти, ни времени.
 *   4. Собирает price_index.json и удаляет скачанный файл.
 *
 * Индекс отдаётся браузеру через price_index.php.
 *
 * Ручной запуск для проверки: price_update.php?key=<UPDATE_KEY>
 */

set_time_limit(0);
ini_set('memory_limit', '512M');

// Самый большой лист прайса — около 9 МБ. На стандартных лимитах PCRE разбор
// такого листа обрывается МОЛЧА: preg_match_all возвращает false, и лист
// выпадает из индекса без единой ошибки в логе. Поднимаем пределы заранее.
ini_set('pcre.backtrack_limit', '50000000');
ini_set('pcre.recursion_limit', '50000000');

// === КОНФИГУРАЦИЯ ===
$LIST_URL   = 'https://www.teremopt.ru/products/pricelist/';
$FILE_MASK  = '/Prays_list_\d{2}\.\d{4}\.xlsx/i';   // общий прайс, не ПромАрматура
$OUT_FILE   = __DIR__ . '/price_index.json';
$LOG_FILE   = __DIR__ . '/price_update.log';
$UPDATE_KEY = 'CHANGE_ME';   // ключ для ручного запуска через браузер (задать на сервере)
// ====================

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    header('Content-Type: text/plain; charset=utf-8');
    if (($_GET['key'] ?? '') !== $UPDATE_KEY || $UPDATE_KEY === 'CHANGE_ME') {
        http_response_code(403);
        exit("Укажите правильный key в адресе. Ключ задаётся в price_update.php.\n");
    }
}

function logmsg($m) {
    global $LOG_FILE;
    $line = date('Y-m-d H:i:s') . '  ' . $m . "\n";
    @file_put_contents($LOG_FILE, $line, FILE_APPEND);
    echo $line;
}

function fail($m) { logmsg('ОШИБКА: ' . $m); exit(1); }

// ---------------------------------------------------------------------------
// 1. Поиск свежей ссылки
// ---------------------------------------------------------------------------

function httpGet($url, $toFile = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 900);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 HeatCalc price updater');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    if ($toFile) {
        $fp = fopen($toFile, 'wb');
        if (!$fp) fail("не открыть файл для записи: $toFile");
        curl_setopt($ch, CURLOPT_FILE, $fp);
        $ok = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        fclose($fp);
        if (!$ok) fail("скачивание не удалось: $err");
        return filesize($toFile);
    }

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $body = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if ($body === false) fail("страница не открылась: $err");
    return $body;
}

logmsg('--- запуск обновления прайса ---');

// Чистка архива распознанных смет. Делаем на каждом запуске (в том числе в
// дни, когда прайс не менялся), чтобы папка не росла бесконечно. Удаляем
// папки-дни старше срока. Срок сознательно большой — сметы для проверки.
$ARCHIVE_DIR  = __DIR__ . '/archive';
$ARCHIVE_DAYS = 120;   // хранить последние ~4 месяца
if (is_dir($ARCHIVE_DIR)) {
    $edge = date('Y-m-d', time() - $ARCHIVE_DAYS * 86400);
    foreach (glob($ARCHIVE_DIR . '/20??-??-??', GLOB_ONLYDIR) as $dir) {
        if (basename($dir) < $edge) {
            foreach (glob($dir . '/*') as $f) @unlink($f);
            @rmdir($dir);
            logmsg('архив: удалён старый день ' . basename($dir));
        }
    }
}

$html = httpGet($LIST_URL);

if (!preg_match_all('/href="([^"]+\.xlsx)"/i', $html, $m)) {
    fail('на странице не найдено ни одной ссылки на xlsx');
}
$link = null;
foreach ($m[1] as $href) {
    if (preg_match($FILE_MASK, $href)) { $link = $href; break; }
}
if (!$link) fail('не найдена ссылка вида Prays_list_MM.YYYY.xlsx');

if (strpos($link, 'http') !== 0) {
    $link = 'https://www.teremopt.ru' . $link;
}
preg_match('/Prays_list_(\d{2}\.\d{4})/i', $link, $vm);
$version = $vm[1] ?? date('m.Y');
logmsg("найден прайс версии $version");

// Уже собранный индекс той же версии пересобирать незачем.
if (file_exists($OUT_FILE)) {
    $cur = json_decode(@file_get_contents($OUT_FILE), true);
    if (($cur['version'] ?? '') === $version) {
        logmsg("индекс версии $version уже собран, выходим");
        exit(0);
    }
}

// ---------------------------------------------------------------------------
// 2. Скачивание
// ---------------------------------------------------------------------------

$tmp = sys_get_temp_dir() . '/teremprice_' . $version . '.xlsx';
logmsg('скачиваю...');
$size = httpGet($link, $tmp);
logmsg('скачано ' . round($size / 1024 / 1024, 1) . ' МБ');

// ---------------------------------------------------------------------------
// 3. Разбор xlsx
// ---------------------------------------------------------------------------

$zip = new ZipArchive();
if ($zip->open($tmp) !== true) fail('архив не открывается');

/** Общие строки: в xlsx текст ячеек вынесен в отдельную таблицу. */
$shared = [];
$xml = $zip->getFromName('xl/sharedStrings.xml');
if ($xml !== false) {
    preg_match_all('/<si>(.*?)<\/si>/s', $xml, $sm);
    foreach ($sm[1] as $si) {
        preg_match_all('/<t[^>]*>(.*?)<\/t>/s', $si, $tm);
        $shared[] = html_entity_decode(implode('', $tm[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
    unset($xml, $sm);
}
logmsg('общих строк: ' . count($shared));

/** Соответствие «имя листа → файл внутри архива». */
$rels = [];
$rx = $zip->getFromName('xl/_rels/workbook.xml.rels');
preg_match_all('/Id="(rId\d+)"[^>]*Target="([^"]+)"/', $rx, $rm);
foreach ($rm[1] as $i => $id) $rels[$id] = $rm[2][$i];

$sheets = [];
$wb = $zip->getFromName('xl/workbook.xml');
preg_match_all('/<sheet [^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"/', $wb, $wm);
foreach ($wm[1] as $i => $name) {
    $t = $rels[$wm[2][$i]] ?? null;
    if ($t) $sheets[] = ['name' => html_entity_decode($name, ENT_QUOTES | ENT_XML1, 'UTF-8'),
                         'file' => 'xl/' . ltrim($t, '/')];
}
logmsg('листов: ' . count($sheets));

/** Разбор одного листа в массив строк вида [колонка => значение]. */
function parseSheet($xmlStr, $shared, $sheetName = '') {
    $rows = [];
    if (preg_match_all('/<row[^>]*>(.*?)<\/row>/s', $xmlStr, $rm) === false) {
        // Явно сообщаем о срыве разбора: тихо потерянный лист — худший исход.
        // preg_last_error_msg() есть только с PHP 8 — на 7.x берём код.
        $why = function_exists('preg_last_error_msg')
            ? preg_last_error_msg()
            : ('код ошибки PCRE ' . preg_last_error());
        logmsg('лист «' . $sheetName . '» не разобран: ' . $why);
        return [];
    }
    foreach ($rm[1] as $r) {
        preg_match_all('/<c r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/s', $r, $cm, PREG_SET_ORDER);
        $cells = [];
        foreach ($cm as $c) {
            if (!preg_match('/<v>(.*?)<\/v>/s', $c[3], $vm)) continue;
            $v = $vm[1];
            $cells[$c[1]] = (strpos($c[2], 't="s"') !== false)
                ? ($shared[(int)$v] ?? '')
                : $v;
        }
        if ($cells) $rows[] = $cells;
    }
    return $rows;
}

$items = [];
$skipped = 0;

foreach ($sheets as $s) {
    if (preg_match('/^Оглавление/ui', $s['name'])) continue;
    $xmlStr = $zip->getFromName($s['file']);
    if ($xmlStr === false) continue;
    $rows = parseSheet($xmlStr, $shared, $s['name']);
    unset($xmlStr);

    // Заголовок таблицы ищем по слову «Артикул».
    $hi = -1;
    foreach ($rows as $i => $r) {
        foreach ($r as $v) {
            if (preg_match('/^артикул/ui', trim((string)$v))) { $hi = $i; break 2; }
        }
    }
    if ($hi < 0) { $skipped++; continue; }

    $hdr = $rows[$hi];
    $cArt = $cPrice = $cName = $cSize = null;
    foreach ($hdr as $col => $v) {
        $t = trim((string)$v);
        if ($cArt === null && preg_match('/^артикул/ui', $t)) $cArt = $col;
        if ($cName === null && preg_match('/наименование|описание|модель/ui', $t)) $cName = $col;
        if ($cSize === null && preg_match('/размер|типоразмер/ui', $t)) $cSize = $col;
        if (preg_match('/цена/ui', $t) && !preg_match('/скид/ui', $t)) {
            // «Цена с НДС, РУБ» приоритетнее, чем в евро.
            if ($cPrice === null || preg_match('/руб/ui', $t)) $cPrice = $col;
        }
    }
    if (!$cArt || !$cPrice) continue;

    $section = '';
    $n = count($rows);
    for ($i = $hi + 1; $i < $n; $i++) {
        $r = $rows[$i];
        $price = $r[$cPrice] ?? null;
        $art = trim((string)($r[$cArt] ?? ''));

        if (!is_numeric($price)) {
            // Заголовок раздела: короткая строка без двоеточий и техописаний.
            $first = trim((string)($r[$cArt] ?? ($r['A'] ?? ($r['B'] ?? ''))));
            $clean = trim(preg_replace('/\s+/u', ' ', $first));
            if ($clean !== '' && mb_strlen($clean) > 3 && mb_strlen($clean) < 80
                && !preg_match('/[:;]\s*$/u', $clean)
                && !preg_match('/^артикул|информац|внимание|примечан|условия|доставк/ui', $clean)) {
                $section = $clean;
            }
            continue;
        }
        if ($art === '') continue;

        $name = $cName ? trim((string)($r[$cName] ?? '')) : '';
        if ($name === '') {
            $size = $cSize ? trim((string)($r[$cSize] ?? '')) : '';
            $name = trim($section . ' ' . $size);
        }
        if ($name === '') $name = $section !== '' ? $section : $art;
        $name = trim(preg_replace('/\s+/u', ' ', $name));
        if (mb_strlen($name) < 3) continue;

        $p = round((float)$price, 2);
        if ($p <= 0) continue;

        $items[] = ['a' => $art, 'n' => mb_substr($name, 0, 110), 'p' => $p, 's' => $s['name']];
    }
    unset($rows);
}

$zip->close();
@unlink($tmp);
logmsg('листов без заголовка: ' . $skipped);

// Дубли по паре «артикул + цена» — один и тот же товар в разных таблицах.
$seen = [];
$uniq = [];
foreach ($items as $it) {
    $k = $it['a'] . '|' . $it['p'];
    if (isset($seen[$k])) continue;
    $seen[$k] = 1;
    $uniq[] = $it;
}

if (count($uniq) < 1000) {
    fail('позиций получилось подозрительно мало (' . count($uniq) . ') — прежний индекс не трогаем');
}

$json = json_encode(
    ['version' => $version, 'built' => date('Y-m-d'), 'items' => $uniq],
    JSON_UNESCAPED_UNICODE
);

// Пишем через временный файл: если запись оборвётся, старый индекс уцелеет.
$tmpOut = $OUT_FILE . '.tmp';
file_put_contents($tmpOut, $json);
rename($tmpOut, $OUT_FILE);

logmsg('готово: ' . count($uniq) . ' позиций, ' . round(strlen($json) / 1024) . ' КБ, версия ' . $version);
