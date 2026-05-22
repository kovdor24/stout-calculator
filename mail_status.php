<?php
/**
 * Обработчик отправки уведомлений о статусе КП на Email
 * Возвращает строго JSON. Любые ошибки подавляются для чистоты вывода.
 */

error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json; charset=UTF-8");

$json = file_get_contents("php://input");
$data = json_decode($json, true);

if (!$data || empty($data['to'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Некорректные данные или отсутствует email получателя"]);
    exit;
}

$to = trim($data['to']);
$projectName = $data['projectName'] ?? 'Без названия';
$statusText = $data['statusText'] ?? 'Изменен';
$comment = $data['comment'] ?? '';
$invoiceUrl = $data['invoiceUrl'] ?? '';

$subject = "Статус КП: " . $projectName . " — " . $statusText;

// Тело письма
$message = "Уведомление об изменении статуса коммерческого предложения\n";
$message .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$message .= "🏠 Объект: " . $projectName . "\n";
$message .= "⚡ Новый статус: " . $statusText . "\n";

if (!empty($comment)) {
    $message .= "✍ Комментарий клиента:\n";
    $message .= "   " . $comment . "\n";
}

$message .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$message .= "🔗 Ссылка на коммерческое предложение:\n";
$message .= "   " . $invoiceUrl . "\n";
$message .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
$message .= "Письмо сгенерировано автоматически.";

// Заголовки
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type: text/plain; charset=UTF-8" . "\r\n";
$headers .= "From: HeatCalc Robot <noreply@heatcalc.ru>" . "\r\n";

if (!function_exists('mail')) {
    echo json_encode(["status" => "error", "message" => "Функция mail() отключена или недоступна на этом сервере. Пожалуйста, обратитесь к хостинг-провайдеру."]);
    exit;
}

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Функция mail() на сервере вернула ошибку."]);
}
?>
