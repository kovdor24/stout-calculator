<?php
/**
 * PHP Proxy for Gemini API.
 * Принимает сообщения и состояние сметы от клиента, добавляет API-ключ
 * и делает запрос к Google AI Studio.
 *
 * Два режима (поле "mode" в запросе):
 *   'chat'      — ИИ-помощник по смете (режим по умолчанию, обратная совместимость
 *                 со старым контрактом: {messages, systemInstruction}).
 *   'recognize' — распознавание рукописных/сканированных смет (вкладка «3. Распознавание»).
 *                 Отличается моделью, temperature=0 и увеличенным таймаутом: разбор
 *                 фото занимает заметно больше времени, чем текстовый чат.
 *
 * Ключ живёт только здесь. Клиент его не видит, поэтому прокси открыт наружу —
 * отсюда лимит запросов по IP и лимит размера тела: иначе чужой сайт сможет
 * бесплатно ходить в Gemini за наш счёт.
 */

error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// === КОНФИГУРАЦИЯ ===
// Вставьте ваш API-ключ Gemini сюда. Получить его можно бесплатно в Google AI Studio.
$GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

// Модели по режимам. Flash хорошо читает русский рукописный текст и стоит дёшево.
// ВАЖНО: Google закрывает старые модели для новых ключей (так умер gemini-2.5-flash).
// Поэтому клиент может прислать своё имя модели — но только из белого списка ниже,
// иначе открытый прокси станет способом гонять через наш ключ что угодно.
$MODELS = [
    'chat'      => 'gemini-3.5-flash',
    'recognize' => 'gemini-3.5-flash',
];

$ALLOWED_MODELS = [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-3.5-flash',
    'gemini-flash-latest',
];

// Ретранслятор. Напрямую в Google этот сервер ходить не может: Google не обслуживает
// запросы с российских IP и отвечает 400 FAILED_PRECONDITION "User location is not
// supported". Поэтому запрос уходит в Supabase Edge Function, которая выполняется
// вне РФ (маршрут Beget → Supabase уже проверен — через него работает авторизация).
// RELAY_TOKEN должен совпадать с секретом RELAY_TOKEN в настройках функции.
$RELAY_URL   = 'https://ahanbwugsmcyvrwbmtlx.supabase.co/functions/v1/gemini-relay';
$RELAY_TOKEN = 'YOUR_RELAY_TOKEN';

// Лимиты по режимам: [запросов в час с одного IP, максимальный размер тела в байтах, таймаут в секундах].
// У распознавания тело большое (base64-картинка), но запросов мало; у чата наоборот.
//
// Таймаут распознавания должен быть БОЛЬШЕ, чем у ретранслятора (135 с в
// gemini-relay/index.ts), иначе curl обрывает связь раньше, чем функция успеет
// объяснить причину, и монтажник видит «лист не прочитан» без подробностей.
// Вся цепочка: браузер 155 с → здесь 145 с → ретранслятор 135 с.
$LIMITS = [
    'chat'      => ['rate' => 120, 'bytes' => 512 * 1024,      'timeout' => 30],
    'recognize' => ['rate' => 30,  'bytes' => 8 * 1024 * 1024, 'timeout' => 145],
];
// ====================

function fail($code, $message) {
    http_response_code($code);
    echo json_encode(["error" => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Настроечные ошибки монтажнику ни о чём не говорят, а имена ключей и моделей
// в них — лишнее для чужих глаз. Наружу нейтральный текст, подробности в лог.
if ($GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    error_log('gemini_proxy: API key not configured');
    fail(400, "Сервис распознавания не настроен. Сообщите администратору.");
}

if ($RELAY_TOKEN === 'YOUR_RELAY_TOKEN') {
    error_log('gemini_proxy: RELAY_TOKEN not configured');
    fail(400, "Сервис распознавания не настроен. Сообщите администратору.");
}

/**
 * Отправка в ретранслятор. Все обращения к Google идут только отсюда:
 * напрямую с российского IP Google отвечает FAILED_PRECONDITION.
 */
function relay($url, $token, $payload, $timeout) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Relay-Token: ' . $token,
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        $err = curl_error($ch);
        $timedOut = (curl_errno($ch) === CURLE_OPERATION_TIMEDOUT);
        curl_close($ch);
        error_log('gemini_proxy: relay failed: ' . $err);
        // Наружу — без имён узлов и текста curl. Признак таймаута отдаём полем
        // code: по нему клиент понимает, что стоит взять другую модель.
        http_response_code(502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'code'  => $timedOut ? 'timeout' : 'upstream',
            'error' => $timedOut
                ? 'Сервис распознавания не ответил вовремя.'
                : 'Сервис распознавания недоступен.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo $response;
    exit;
}

// Диагностика: ?action=models вернёт список моделей, доступных именно этому ключу.
// Нужен, когда Google в очередной раз закроет текущую модель — чтобы не гадать имя.
// Проверяется до разбора тела: открывается обычным GET прямо из браузера.
if (($_GET['action'] ?? '') === 'models') {
    relay($RELAY_URL, $RELAY_TOKEN, [
        'apiKey' => $GEMINI_API_KEY,
        'action' => 'models',
    ], 30);
}

$body = file_get_contents('php://input');
$requestData = json_decode($body, true);

if (!$requestData || !isset($requestData['messages'])) {
    fail(400, "Invalid request. 'messages' parameter is required.");
}

$mode = ($requestData['mode'] ?? 'chat') === 'recognize' ? 'recognize' : 'chat';
$limits = $LIMITS[$mode];

if (strlen($body) > $limits['bytes']) {
    $mb = round($limits['bytes'] / 1024 / 1024, 1);
    fail(413, "Файл слишком большой. Максимум {$mb} МБ — уменьшите разрешение фото.");
}

/**
 * Лимит запросов по IP. Счётчики лежат в системной temp-папке: отдельная БД ради
 * этого не нужна, а после перезагрузки сервера сброс счётчиков не страшен.
 * Окно скользящее по часу.
 */
function checkRateLimit($mode, $maxPerHour) {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ip = trim(explode(',', $ip)[0]);
    $file = sys_get_temp_dir() . '/hc_gemini_rl_' . $mode . '_' . md5($ip) . '.json';

    $now = time();
    $hits = [];
    if (is_readable($file)) {
        $stored = json_decode(@file_get_contents($file), true);
        if (is_array($stored)) $hits = $stored;
    }
    // Оставляем только попадания за последний час.
    $hits = array_values(array_filter($hits, function ($t) use ($now) {
        return is_int($t) && $t > $now - 3600;
    }));

    if (count($hits) >= $maxPerHour) {
        $retryAfter = max(1, ($hits[0] + 3600) - $now);
        header('Retry-After: ' . $retryAfter);
        fail(429, "Слишком много запросов. Лимит: {$maxPerHour} в час. Попробуйте через " . ceil($retryAfter / 60) . " мин.");
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
}

checkRateLimit($mode, $limits['rate']);

// Формируем payload для Gemini API
$generationConfig = ["responseMimeType" => "application/json"];

if ($mode === 'recognize') {
    // Распознавание должно быть воспроизводимым: один и тот же снимок обязан давать
    // один и тот же разбор, иначе калибровать промпт невозможно.
    $generationConfig["temperature"] = 0;
    $generationConfig["maxOutputTokens"] = 8192;

    // Потолок «думания». gemini-3.5-flash — thinking-модель: на длинном или
    // неоднозначном входе она рассуждает по минуте, браузер всё это время
    // держит соединение, и оно рвётся (наблюдалось как «Failed to fetch»).
    // Ограничение бюджета делает ответ быстрым и предсказуемым по времени.
    // Полностью выключить думание у моделей 3-го поколения нельзя, только
    // ограничить бюджетом в токенах.
    $generationConfig["thinkingConfig"] = ["thinkingBudget" => 2048];
}

$geminiPayload = [
    "contents" => $requestData['messages'],
    "generationConfig" => $generationConfig,
];

// Если передан системный промпт
if (isset($requestData['systemInstruction'])) {
    $geminiPayload["systemInstruction"] = [
        "parts" => [
            ["text" => $requestData['systemInstruction']]
        ]
    ];
}

$model = $MODELS[$mode];
if (!empty($requestData['model']) && in_array($requestData['model'], $ALLOWED_MODELS, true)) {
    $model = $requestData['model'];
}

relay($RELAY_URL, $RELAY_TOKEN, [
    'apiKey' => $GEMINI_API_KEY,
    'model'  => $model,
    'body'   => $geminiPayload,
], $limits['timeout']);
