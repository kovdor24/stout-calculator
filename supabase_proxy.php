<?php
/**
 * Proxy for Supabase (Auth + REST + RPC).
 * У части пользователей в РФ провайдер блокирует/дросселирует Cloudflare, за которым стоит
 * Supabase — из-за этого браузер не может достучаться до *.supabase.co напрямую ("Нет связи
 * с сервером" при полностью исправном проекте). Браузер обращается к этому скрипту на своём же
 * домене (блокировка по домену/SNI supabase.co сюда не применяется), а сервер хостинга уже сам
 * идёт в Supabase напрямую по своей сети.
 *
 * Целевой хост захардкожен — path приходит от клиента, но домен назначения подменить нельзя (защита от SSRF).
 */

error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Expose-Headers: Content-Range, X-Total-Count");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            } elseif ($name === 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            } elseif ($name === 'CONTENT_LENGTH') {
                $headers['Content-Length'] = $value;
            }
        }
        return $headers;
    }
}

$path = $_GET['path'] ?? '';
if ($path === '' || $path[0] !== '/') {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid path parameter"]);
    exit;
}

$SUPABASE_HOST = 'https://ahanbwugsmcyvrwbmtlx.supabase.co';
$url = $SUPABASE_HOST . $path;

$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents('php://input');

$forwardHeaderNames = ['apikey', 'authorization', 'content-type', 'prefer', 'range', 'range-unit', 'accept', 'accept-profile', 'content-profile', 'x-client-info'];
$requestHeaders = [];
foreach (getallheaders() as $name => $value) {
    if (in_array(strtolower($name), $forwardHeaderNames, true)) {
        $requestHeaders[] = "$name: $value";
    }
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

if (in_array($method, ['POST', 'PATCH', 'PUT', 'DELETE'], true) && $body !== '') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    echo json_encode(["error" => "Proxy request failed: " . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$rawHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);
curl_close($ch);

$passthroughHeaders = ['content-type', 'content-range', 'x-total-count'];
foreach (explode("\r\n", $rawHeaders) as $line) {
    if (strpos($line, ':') === false) continue;
    list($name, $value) = explode(':', $line, 2);
    if (in_array(strtolower(trim($name)), $passthroughHeaders, true)) {
        header(trim($name) . ':' . $value);
    }
}

http_response_code($httpCode);
echo $responseBody;
