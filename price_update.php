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
$UPDATE_KEY = 'terem2026';   // ключ для ручного запуска через браузер (задать на сервере)
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

/**
 * Уже собранный индекс той же версии пересобирать незачем.
 *
 * Исключение — принудительный запуск: price_update.php?key=…&force=1.
 * Без него правку разбора нельзя проверить до выхода нового прайса, а
 * узнать о поломке через месяц, когда индекс уже перезаписан, — плохой
 * способ. Индекс при этом не затирается вслепую: старый файл сохраняется
 * рядом как price_index.prev.json, чтобы можно было вернуться.
 */
$force = !$isCli && ($_GET['force'] ?? '') === '1';
if (file_exists($OUT_FILE)) {
    $cur = json_decode(@file_get_contents($OUT_FILE), true);
    if (($cur['version'] ?? '') === $version && !$force) {
        logmsg("индекс версии $version уже собран, выходим");
        exit(0);
    }
    if ($force) {
        @copy($OUT_FILE, __DIR__ . '/price_index.prev.json');
        logmsg('принудительная пересборка; прежний индекс (' .
            count($cur['items'] ?? []) . ' поз.) сохранён в price_index.prev.json');
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

    /**
     * Заголовок таблицы.
     *
     * Раньше искали строго слово «Артикул» — и теряли 25 листов, где колонка
     * называется «Код» или «Арт.», а также листы, где артикула нет вовсе.
     * Шапкой считаем строку, в которой есть либо колонка артикула, либо пара
     * «наименование + цена»: без этой пары товар всё равно не собрать, а с
     * ней лист годится, даже если кода в нём нет.
     */
    // Границу слова через \b здесь не поставить: для PCRE кириллица не «слово»,
    // и «/^артикул\b/u» не срабатывает даже на строке «Артикул». Проверяем
    // явно, что дальше не идёт продолжение слова.
    $reArt   = '/^\s*(артикул|код|арт\.?|номенклатура)(?![а-яё])/ui';
    $reName  = '/наименование|описание|модель|товар/ui';
    $rePrice = '/цена|ррц|стоимость/ui';

    $hi = -1;
    foreach ($rows as $i => $r) {
        $hasArt = $hasName = $hasPrice = false;
        foreach ($r as $v) {
            $t = trim((string)$v);
            if (preg_match($reArt, $t)) $hasArt = true;
            if (preg_match($reName, $t)) $hasName = true;
            if (preg_match($rePrice, $t) && !preg_match('/скид/ui', $t)) $hasPrice = true;
        }
        if ($hasArt || ($hasName && $hasPrice)) { $hi = $i; break; }
    }
    if ($hi < 0) { $skipped++; continue; }

    $hdr = $rows[$hi];
    $cArt = $cPrice = $cName = $cSize = null;
    foreach ($hdr as $col => $v) {
        $t = trim((string)$v);
        if ($cArt === null && preg_match($reArt, $t)) $cArt = $col;
        if ($cName === null && preg_match($reName, $t)) $cName = $col;
        if ($cSize === null && preg_match('/размер|типоразмер/ui', $t)) $cSize = $col;
        if (preg_match($rePrice, $t) && !preg_match('/скид/ui', $t)) {
            // «Цена с НДС, РУБ» приоритетнее, чем в евро.
            if ($cPrice === null || preg_match('/руб/ui', $t)) $cPrice = $col;
        }
    }
    // Без цены лист бесполезен. Без артикула — нет: искать умеем и по названию.
    if (!$cPrice) continue;

    /**
     * Проверка колонки артикула ПО ДАННЫМ.
     *
     * В половине листов первая колонка — «Изображение»/«Внешний вид», и шапка
     * подписана со сдвигом: «Артикул» стоит над колонкой B, а сами коды лежат
     * в A. Генератор читал пустую B, отбрасывал каждую строку и молча терял
     * весь лист — так пропали «STOUT Крепежная система», «Walraven»,
     * «Управляющая автоматика» и ещё 54 листа. Поэтому колонку, названную в
     * шапке, сверяем с товарными строками и при необходимости ищем настоящую.
     */
    $probe = [];
    $seenRows = 0;
    for ($i = $hi + 1; $i < count($rows) && $seenRows < 40; $i++) {
        if (!is_numeric($rows[$i][$cPrice] ?? null)) continue;
        $seenRows++;
        foreach ($rows[$i] as $col => $v) {
            $t = trim((string)$v);
            // Код товара: короткий, без пробелов, не цена и не название.
            if ($t === '' || $col === $cPrice || $col === $cName) continue;
            if (mb_strlen($t) > 30 || preg_match('/\s/u', $t)) continue;
            $probe[$col] = ($probe[$col] ?? 0) + 1;
        }
    }
    $artFilled = $cArt ? ($probe[$cArt] ?? 0) : 0;
    if ($seenRows > 0 && $artFilled * 2 < $seenRows) {
        arsort($probe);
        $bestCol = key($probe);
        if ($bestCol !== null && ($probe[$bestCol] ?? 0) * 2 >= $seenRows) $cArt = $bestCol;
    }

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
        // Позиция без артикула — всё равно позиция: подбор умеет искать по
        // названию, и «Лён сантехнический коса 200 г» полезен в смете даже
        // без кода. Раньше такие строки выбрасывались целиком.
        $name = $cName ? trim((string)($r[$cName] ?? '')) : '';
        if ($name === '') {
            $size = $cSize ? trim((string)($r[$cSize] ?? '')) : '';
            $name = trim($section . ' ' . $size);
        }
        /**
         * Если названия нет или в нём оказался сам артикул — собираем его из
         * соседних колонок строки.
         *
         * Так устроен лист «Энергофлекс»: колонки идут «18 | 18/4-11 | синий |
         * EFXT0180411SUPRS | цена», и колонки «наименование» там нет вовсе.
         * В индекс попадал артикул вместо названия, и найти такую позицию по
         * названию было нечем — при том что в смете её пишут словами.
         */
        if ($name === '' || $name === $art) {
            $parts = [];
            foreach ($r as $col => $v) {
                if ($col === $cPrice || $col === $cArt) continue;
                $t = trim(preg_replace('/\s+/u', ' ', (string)$v));
                if ($t === '' || $t === $art || is_numeric($t)) continue;
                if (mb_strlen($t) > 60) continue;
                $parts[] = $t;
            }
            $built = trim($section . ' ' . implode(' ', array_slice($parts, 0, 4)));
            if (mb_strlen($built) >= 3) $name = $built;
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
// У позиций без артикула ключом служит название: иначе все они схлопнулись бы
// в одну строку с пустым кодом.
$seen = [];
$uniq = [];
foreach ($items as $it) {
    $k = ($it['a'] !== '' ? $it['a'] : $it['n']) . '|' . $it['p'];
    if (isset($seen[$k])) continue;
    $seen[$k] = 1;
    $uniq[] = $it;
}

if (count($uniq) < 1000) {
    fail('позиций получилось подозрительно мало (' . count($uniq) . ') — прежний индекс не трогаем');
}

/**
 * Сборка не должна молча обеднить индекс.
 *
 * Ровно так он и потерял треть прайса: разбор ломался на половине листов, а
 * скрипт бодро рапортовал «готово». Порог в тысячу позиций такое не ловит —
 * нужно сравнение с тем, что уже работает. Четверть потери считаем аварией:
 * поставщик мог убрать линейку, но не четверть ассортимента разом.
 */
$prevCount = isset($cur['items']) ? count($cur['items']) : 0;
if ($prevCount > 0 && count($uniq) < $prevCount * 0.75) {
    fail('позиций стало заметно меньше: ' . count($uniq) . ' против ' . $prevCount .
         ' — похоже на сбой разбора, прежний индекс не трогаем');
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
