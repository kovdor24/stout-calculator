<?php
/**
 * Supabase Reverse Proxy in PHP
 * Routes all client-side Supabase requests through the server to bypass ISP blockages in Russia.
 */

// Enable error logging but disable display to ensure clean JSON/text output
error_reporting(0);
ini_set('display_errors', 0);

// CORS Headers for seamless browser integration
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header("Access-Control-Expose-Headers: *");

// Intercept preflight OPTIONS request and terminate early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Ensure cURL is installed and enabled
if (!extension_loaded('curl')) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "cURL extension is not enabled on this PHP server."]);
    exit;
}

// Fallback for older PHP versions or specific server configurations lacking getallheaders()
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            } elseif ($name == 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            }
        }
        return $headers;
    }
}

// Parse request URI path and query string after "supabase_proxy.php"
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$proxySegment = 'supabase_proxy.php';
$pos = strpos($requestUri, $proxySegment);

if ($pos !== false) {
    $pathAndQuery = substr($requestUri, $pos + strlen($proxySegment));
} else {
    // If not found in URI, check path info
    $pathAndQuery = $_SERVER['PATH_INFO'] ?? '/';
    if (!empty($_SERVER['QUERY_STRING'])) {
        $pathAndQuery .= '?' . $_SERVER['QUERY_STRING'];
    }
}

// Forward to direct Supabase REST/Auth API
$supabaseBaseUrl = 'https://ahanbwugsmcyvrwbmtlx.supabase.co';
$targetUrl = $supabaseBaseUrl . $pathAndQuery;

// Extract and forward critical headers required by Supabase API
$headersToSend = [];
$hasApiKey = false;
$hasAuth = false;

foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    if (in_array($lowerName, ['apikey', 'authorization', 'content-type', 'prefer', 'x-client-info', 'range', 'if-none-match'])) {
        $headersToSend[] = "$name: $value";
        if ($lowerName === 'apikey') {
            $hasApiKey = true;
        }
        if ($lowerName === 'authorization') {
            $hasAuth = true;
        }
    }
}

// Fallback public anon key if missing (critical for full-page OAuth redirects)
$anonKey = 'sb_publishable_gcMJ-PvJmKavObbnePFGZQ_O-pu5O2p';
if (!$hasApiKey) {
    $headersToSend[] = "apikey: $anonKey";
}
if (!$hasAuth) {
    $headersToSend[] = "Authorization: Bearer $anonKey";
}

// Initialize cURL session
$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headersToSend);
curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30-second timeout
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

// Forward request body if applicable
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute request
$response = curl_exec($ch);

if ($response === false) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(502);
    echo json_encode(["status" => "error", "message" => "Failed to reach Supabase API: " . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$resHeaders = substr($response, 0, $headerSize);
$resBody = substr($response, $headerSize);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Set outgoing response code
http_response_code($httpCode);

// Forward response headers back to client
$headerLines = explode("\r\n", $resHeaders);
foreach ($headerLines as $line) {
    if (empty($line)) continue;
    if (stripos($line, 'HTTP/') === 0) continue;
    
    $lowerLine = strtolower($line);
    // Ignore hop-by-hop headers
    if (stripos($lowerLine, 'transfer-encoding:') === 0) continue;
    if (stripos($lowerLine, 'content-length:') === 0) continue;
    if (stripos($lowerLine, 'connection:') === 0) continue;
    if (stripos($lowerLine, 'keep-alive:') === 0) continue;
    
    header($line);
}

// Output target response body
echo $resBody;
