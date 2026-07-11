<?php
/**
 * Proxy for EmailJS (api.emailjs.com).
 * Тот же приём, что и в supabase_proxy.php: у части пользователей в РФ провайдер блокирует/
 * дросселирует зарубежные сервисы, из-за чего браузер не может достучаться до api.emailjs.com
 * напрямую. Браузер обращается к этому скрипту на своём же домене, а сервер хостинга уже сам
 * идёт в EmailJS напрямую по своей сети.
 *
 * Целевой хост захардкожен, путь фиксированный (email/send) — тело запроса приходит от
 * клиента как есть и пробрасывается без изменений.
 */

error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

$body = file_get_contents('php://input');

$ch = curl_init('https://api.emailjs.com/api/v1.0/email/send');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    echo json_encode(["error" => "Proxy request failed: " . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
