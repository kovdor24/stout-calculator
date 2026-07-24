<?php
/**
 * Отдача индекса прайс-листа браузеру.
 *
 * Файл price_index.json собирает price_update.php по расписанию. Напрямую
 * его отдавать нельзя: сайт живёт на heatcalc.ru, а файл — на
 * proxy.heatcalc.ru, и без CORS браузер запрос отклонит.
 *
 * Заодно здесь сжатие и кэширование: индекс около мегабайта и меняется
 * раз в месяц, поэтому его незачем качать при каждом открытии вкладки.
 */

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$file = __DIR__ . '/price_index.json';

if (!file_exists($file)) {
    http_response_code(404);
    echo json_encode([
        'error' => 'Индекс ещё не собран. Запустите price_update.php.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$mtime = filemtime($file);
$etag = '"' . md5($mtime . filesize($file)) . '"';

header('ETag: ' . $etag);
header('Cache-Control: public, max-age=86400');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');

// Браузер уже держит актуальную версию — отдавать мегабайт заново не нужно.
$since = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
if (trim($since) === $etag) {
    http_response_code(304);
    exit;
}

if (!ob_start('ob_gzhandler')) ob_start();
readfile($file);
