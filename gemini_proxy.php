<?php
/**
 * PHP Proxy for Gemini API.
 * Принимает сообщения и состояние сметы от клиента, добавляет API-ключ
 * и делает запрос к Google AI Studio.
 */

error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// === КОНФИКУРАЦИЯ ===
// Вставьте ваш API-ключ Gemini сюда. Получить его можно бесплатно в Google AI Studio.
$GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; 
$MODEL_NAME = 'gemini-2.5-flash'; // или 'gemini-1.5-flash'
// ====================

if ($GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    // Если ключ еще не задан, возвращаем понятную ошибку
    http_response_code(400);
    echo json_encode([
        "error" => "Пожалуйста, настройте API-ключ Gemini ($GEMINI_API_KEY) в файле gemini_proxy.php на сервере."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$body = file_get_contents('php://input');
$requestData = json_decode($body, true);

if (!$requestData || !isset($requestData['messages'])) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid request. 'messages' parameter is required."], JSON_UNESCAPED_UNICODE);
    exit;
}

// Формируем payload для Gemini API
$geminiPayload = [
    "contents" => $requestData['messages'],
    "generationConfig" => [
        "responseMimeType" => "application/json"
    ]
];

// Если передан системный промпт
if (isset($requestData['systemInstruction'])) {
    $geminiPayload["systemInstruction"] = [
        "parts" => [
            ["text" => $requestData['systemInstruction']]
        ]
    ];
}

$url = "https://generativelanguage.googleapis.com/v1beta/models/" . $MODEL_NAME . ":generateContent?key=" . $GEMINI_API_KEY;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($geminiPayload));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    echo json_encode(["error" => "Gemini API request failed: " . curl_error($ch)], JSON_UNESCAPED_UNICODE);
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
