// Ретранслятор к Gemini API.
//
// Зачем: Google не обслуживает Gemini с российских IP — прокси на Beget получает
// в ответ 400 FAILED_PRECONDITION "User location is not supported for the API use".
// Edge Functions выполняются на инфраструктуре Deno вне РФ, поэтому запрос проходит.
//
// Почему именно Supabase, а не Cloudflare Worker: маршрут Beget → Supabase уже
// проверен в проде — через него работает вся авторизация (см. supabaseProxyFetch
// в app.js). Браузер до Supabase в РФ действительно не всегда дотягивается, но
// сюда ходит не браузер, а сервер Beget.
//
// Цепочка целиком: браузер → proxy.heatcalc.ru/gemini_proxy.php → эта функция → Google.
// Ключ Gemini живёт в PHP на Beget и приходит сюда в теле запроса; функция его
// не хранит. Доступ закрыт общим секретом RELAY_TOKEN, иначе это был бы открытый
// прокси к Google за счёт нашей квоты Supabase.

const GOOGLE_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Белый список моделей дублирует такой же список в gemini_proxy.php: PHP может быть
// обновлён не синхронно с функцией, и мы не хотим, чтобы через ретранслятор гоняли
// произвольные модели.
const ALLOWED_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Relay-Token",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // trim с обеих сторон: секрет вводится в многострочное поле дашборда Supabase,
  // где к значению легко прицепляется перенос строки при копировании. Без этого
  // пароль не совпадает, а причина никак не видна снаружи.
  const expectedToken = (Deno.env.get("RELAY_TOKEN") ?? "").trim();
  if (!expectedToken) {
    // Fail closed: без настроенного секрета функция не работает вовсе.
    return json({ error: "RELAY_TOKEN не задан в секретах функции" }, 500);
  }
  const providedToken = (req.headers.get("x-relay-token") ?? "").trim();
  if (providedToken !== expectedToken) {
    // Длины сравнить безопасно — сам секрет не раскрываем, но сразу видно,
    // потерялся ли он по дороге или отличается содержимым.
    return json({
      error: "Forbidden",
      hint: `в секрете ${expectedToken.length} символов, пришло ${providedToken.length}`,
    }, 403);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Тело запроса должно быть JSON" }, 400);
  }

  const apiKey = payload?.apiKey;
  if (!apiKey) return json({ error: "Не передан apiKey" }, 400);

  const model = payload?.model;
  if (payload?.action !== "models" && !ALLOWED_MODELS.includes(model)) {
    return json({ error: `Модель "${model}" не в белом списке ретранслятора` }, 400);
  }

  // Диагностика: список моделей, реально доступных этому ключу. Пригодится,
  // когда Google в очередной раз закроет текущую модель.
  const isModelList = payload?.action === "models";
  // Страховка по длине ответа. Смета на полсотни позиций не влезает в 8192 токена,
  // а модели 3.x тратят часть того же бюджета на рассуждения — в итоге JSON
  // обрывается на полуслове и не парсится. Потолок задан в gemini_proxy.php, но
  // правка там требует похода на хостинг, поэтому подстраховываемся здесь.
  const MIN_OUTPUT_TOKENS = 65536;
  if (!isModelList) {
    const body = payload.body ?? {};
    body.generationConfig = body.generationConfig ?? {};
    if ((body.generationConfig.maxOutputTokens ?? 0) < MIN_OUTPUT_TOKENS) {
      body.generationConfig.maxOutputTokens = MIN_OUTPUT_TOKENS;
    }
    payload.body = body;
  }

  const url = isModelList
    ? `${GOOGLE_BASE}/models?key=${apiKey}`
    : `${GOOGLE_BASE}/models/${model}:generateContent?key=${apiKey}`;

  try {
    const upstream = await fetch(url, {
      method: isModelList ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: isModelList ? undefined : JSON.stringify(payload.body ?? {}),
      // Распознавание фото — это долго. Ставим потолок выше, чем у чата,
      // но не бесконечный, чтобы зависший запрос не держал воркер.
      signal: AbortSignal.timeout(110_000),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" },
    });
  } catch (e) {
    return json({ error: "Запрос к Gemini не прошёл: " + String(e) }, 502);
  }
});
