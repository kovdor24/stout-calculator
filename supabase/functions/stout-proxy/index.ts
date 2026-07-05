// CORS-прокси для profi-stout API — заменяет неработающий stout_proxy.php
// (GitHub Pages не исполняет PHP). Пробрасывает запросы на profi-stout
// server-side, чтобы обойти CORS-блокировку в браузере.

const TARGET_BASE = "https://profi-stout.promo-online.pro/api/";
const ALLOWED_REQUEST_HEADERS = ["content-type", "x-token", "authorization"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Token, Authorization, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const targetPath = url.searchParams.get("path") || "";
  if (!targetPath) {
    return new Response(JSON.stringify({ error: "Missing path parameter" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const targetUrl = TARGET_BASE + targetPath.replace(/^\/+/, "");

  const forwardHeaders = new Headers();
  for (const [key, value] of req.headers.entries()) {
    if (ALLOWED_REQUEST_HEADERS.includes(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  try {
    const body = (req.method === "POST" || req.method === "PUT")
      ? await req.text()
      : undefined;

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Proxy request failed: " + String(e) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
