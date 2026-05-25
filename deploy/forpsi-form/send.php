<?php
declare(strict_types=1);

$recipient = 'adam@vratasnabl.cz';
$siteUrl = 'https://www.vratasnabl.cz/';
$thankYouUrl = 'https://www.vratasnabl.cz/dekujeme.html';
$allowedOrigins = [
    'https://www.vratasnabl.cz',
    'https://vratasnabl.cz',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    if (!in_array($origin, $allowedOrigins, true)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => false, 'message' => 'Origin is not allowed']);
        exit;
    }

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$expectsJson = strpos($accept, 'application/json') !== false || strpos($contentType, 'application/json') !== false;

function respond(int $status, array $payload, bool $expectsJson, string $thankYouUrl): void
{
    http_response_code($status);

    if ($expectsJson) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload);
        exit;
    }

    if (($payload['success'] ?? false) === true) {
        header('Location: ' . $thankYouUrl, true, 303);
        exit;
    }

    header('Content-Type: text/html; charset=UTF-8');
    echo '<!doctype html><html lang="cs"><meta charset="utf-8"><title>Formular nelze odeslat</title>';
    echo '<body><h1>Formular nelze automaticky odeslat</h1><p>Zavolejte prosim 777 286 310 nebo napiste na adam@vratasnabl.cz.</p></body></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Only POST is allowed'], $expectsJson, $thankYouUrl);
}

$rawInput = file_get_contents('php://input') ?: '';
$data = [];

if (strpos($contentType, 'application/json') !== false) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
} else {
    $data = $_POST;
}

$field = static function (string $key, int $maxLength = 4000) use ($data): string {
    $value = $data[$key] ?? '';
    if (is_array($value)) {
        $value = implode(', ', $value);
    }

    $value = trim((string) $value);
    $value = str_replace(["\r", "\0"], '', $value);

    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return substr($value, 0, $maxLength);
};

$headerValue = static function (string $value, int $maxLength = 180): string {
    $value = trim($value);
    $value = str_replace(["\r", "\n", "\0"], ' ', $value);
    $value = preg_replace('/\s+/', ' ', $value) ?? $value;

    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return substr($value, 0, $maxLength);
};

if ($field('_honey', 200) !== '') {
    respond(200, ['success' => true, 'message' => 'Ignored'], $expectsJson, $thankYouUrl);
}

$startedAt = (int) $field('form_started_at', 20);
if ($startedAt > 0) {
    $elapsedMs = (int) floor(microtime(true) * 1000) - $startedAt;
    if ($elapsedMs >= 0 && $elapsedMs < 2500) {
        respond(400, ['success' => false, 'message' => 'Form was submitted too quickly'], $expectsJson, $thankYouUrl);
    }
}

$name = $field('name', 120);
$phone = $field('phone', 80);
$email = $field('email', 180);
$location = $field('location', 160);
$service = $field('service', 140);
$message = $field('message', 4000);
$submittedFrom = $field('submitted_from', 260);

if ($name === '' || $phone === '' || $message === '') {
    respond(422, ['success' => false, 'message' => 'Name, phone and message are required'], $expectsJson, $thankYouUrl);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['success' => false, 'message' => 'Invalid e-mail'], $expectsJson, $thankYouUrl);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/vrata_form_' . hash('sha256', $ip . date('YmdH')) . '.txt';
$currentCount = 0;
if (is_file($rateFile)) {
    $currentCount = (int) @file_get_contents($rateFile);
}

if ($currentCount >= 8) {
    respond(429, ['success' => false, 'message' => 'Too many submissions'], $expectsJson, $thankYouUrl);
}

@file_put_contents($rateFile, (string) ($currentCount + 1), LOCK_EX);

$subject = 'Poptavka z webu Vrata Snabl';
if ($service !== '') {
    $subject .= ' - ' . $headerValue($service, 90);
}

$lines = [
    'Nova poptavka z webu Vrata Snabl',
    '',
    'Jmeno: ' . $name,
    'Telefon: ' . $phone,
    'E-mail: ' . ($email !== '' ? $email : 'neuveden'),
    'Lokalita: ' . ($location !== '' ? $location : 'neuvedena'),
    'Sluzba: ' . ($service !== '' ? $service : 'neuvedena'),
    '',
    'Zprava:',
    $message,
    '',
    'Zdroj: ' . ($submittedFrom !== '' ? $submittedFrom : $siteUrl),
    'Cas: ' . date('c'),
    'IP: ' . $ip,
];

$body = implode("\n", $lines);
$from = 'Vrata Snabl <adam@vratasnabl.cz>';
$replyTo = $email !== '' ? $headerValue($email, 180) : $recipient;
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . $from,
    'Reply-To: ' . $replyTo,
    'X-Mailer: Vrata Snabl website form',
];

$sent = mail($recipient, $subject, $body, implode("\n", $headers));

if (!$sent) {
    respond(500, ['success' => false, 'message' => 'Mail could not be sent'], $expectsJson, $thankYouUrl);
}

respond(200, ['success' => true, 'message' => 'Inquiry sent'], $expectsJson, $thankYouUrl);
