// Отправка пуш-уведомлений на телефоны через Firebase Cloud Messaging.
//
// Вызывается из приложения сразу после того, как строка записана в базу — тем же
// приёмом, что и дублирование на email (sendNotificationEmail в app.js).
//
// ГЛАВНОЕ ПРО БЕЗОПАСНОСТЬ: функция НЕ принимает от приложения ни текст, ни список
// получателей — только вид события и id строки. Кому и что отправлять, она выясняет
// сама, перечитывая строку из базы под сервисным ключом. Принимай она текст и адресата
// от клиента — любой авторизованный пользователь смог бы разослать что угодно кому
// угодно, подделав запрос в консоли браузера.
//
// Verify JWT выключен: сессия проверяется внутри функции — и не для всех событий.
// Ответ клиента на смету (shared_invoice) приходит со страницы, открытой по ссылке
// БЕЗ входа в аккаунт, проверять там нечего. Пропуском служит сам идентификатор
// ссылки: кто его знает — тот и так видит смету целиком, ничего нового отправитель
// уведомления не получает. Адресат при этом берётся из базы, а не из запроса.
//
// Секреты (Edge Function Secrets):
//   FCM_SERVICE_ACCOUNT — json сервисного аккаунта Firebase целиком, одной строкой

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
};

// Тот же список, что в app.js (app.isAdminEmail) и в политиках manager_chat_messages.
// Меняется в одном месте — не забыть поменять и здесь.
const ADMIN_EMAILS = [
  "kovdorekb@gmail.com",
  "kovdor24@yandex.ru",
  "dima24ba@gmail.com",
];

// События по смете, ради которых стоит будить телефон. Черновики (calculated, saved)
// и технические отметки сюда не входят — их у активного монтажника сотни в день.
const INVOICE_EVENT_TITLES: Record<string, string> = {
  confirmed: "Клиент согласовал смету",
  rejected: "Клиент отклонил смету",
  needs_revision: "Клиент просит доработать смету",
  invoice_issued: "Счёт выставлен",
  invoice_requested: "Запрошен счёт",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" },
  });

// --- Доступ к FCM ----------------------------------------------------------

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const pemToDer = (pem: string) => {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const raw = atob(body);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

// Токен доступа живёт час. Держим его в памяти инстанса: функция вызывается на каждое
// сообщение, а выпуск токена — это лишний поход к Google и лишняя секунда задержки.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getFcmAccessToken(sa: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value;

  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = enc({ alg: "RS256", typ: "JWT" }) + "." + enc({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = unsigned + "." + b64url(new Uint8Array(sig));

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok || !data || !data.access_token) {
    console.error("FCM: не получен токен доступа", resp.status, data);
    throw new Error("Не удалось авторизоваться в сервисе уведомлений");
  }

  cachedToken = { value: data.access_token, expiresAt: now + (data.expires_in || 3600) };
  return cachedToken.value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const saRaw = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!supabaseUrl || !serviceKey || !saRaw) {
      console.error("send-push: не заданы переменные окружения");
      return json({ error: "Сервис не настроен" }, 500);
    }

    let sa: { client_email: string; private_key: string; project_id: string };
    try {
      sa = JSON.parse(saRaw);
    } catch {
      console.error("send-push: FCM_SERVICE_ACCOUNT не разбирается как json");
      return json({ error: "Сервис не настроен" }, 500);
    }

    const rest = {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
    };
    const get = async (path: string) => {
      const r = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: rest });
      if (!r.ok) return null;
      return await r.json().catch(() => null);
    };

    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason || "");
    const rowId = String(body.id || "");
    if (!reason || !rowId) return json({ error: "Не указано событие" }, 400);

    // Ответ клиента приходит со страницы без входа — сессии там нет и быть не может.
    // Остальные события отправляет авторизованный пользователь, и мы обязаны знать кто:
    // иначе нельзя проверить, что он уведомляет по своему сообщению, а не по чужому.
    const needsAuth = reason !== "shared_invoice";
    let callerId = "";
    let isAdmin = false;

    if (needsAuth) {
      const userToken = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!userToken) return json({ error: "Нет токена" }, 401);

      const meResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { apikey: serviceKey, Authorization: "Bearer " + userToken },
      });
      const me = await meResp.json().catch(() => null);
      if (!meResp.ok || !me || !me.id) return json({ error: "Сессия не подтверждена" }, 401);

      isAdmin = ADMIN_EMAILS.includes(String(me.email || "").toLowerCase());

      // Кто вызвал — в терминах таблицы users (id там свой, не равен auth.uid)
      const callerRows = await get(`users?auth_user_id=eq.${encodeURIComponent(me.id)}&select=id,email&limit=1`);
      const callerRow = Array.isArray(callerRows) && callerRows[0] ? callerRows[0] : null;
      if (!callerRow) return json({ error: "Профиль не найден" }, 403);
      callerId = String(callerRow.id);
    }

    // --- Кому и что отправляем — решаем здесь, по строке из базы ------------

    let recipientUserIds: string[] = [];
    let title = "";
    let text = "";
    const payload: Record<string, string> = { reason };

    if (reason === "manager_chat") {
      const rows = await get(
        `manager_chat_messages?id=eq.${encodeURIComponent(rowId)}&select=installer_user_id,manager_user_id,sender_user_id,sender_name,text,attachments&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return json({ error: "Сообщение не найдено" }, 404);

      // Уведомляем только по своему сообщению — чужую переписку дёргать нельзя
      if (String(row.sender_user_id) !== callerId) {
        return json({ error: "Чужое сообщение" }, 403);
      }

      const other = String(row.sender_user_id) === String(row.installer_user_id)
        ? row.manager_user_id
        : row.installer_user_id;
      recipientUserIds = [String(other)];
      title = row.sender_name || "Новое сообщение";
      text = row.text || (Array.isArray(row.attachments) && row.attachments.length ? "Вложение" : "Новое сообщение");
      payload.open = "chat";
    } else if (reason === "broadcast") {
      const rows = await get(
        `messages?id=eq.${encodeURIComponent(rowId)}&select=sender_id,recipient_id,text,sender_name&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return json({ error: "Сообщение не найдено" }, 404);
      if (String(row.sender_id) !== callerId) {
        return json({ error: "Чужое сообщение" }, 403);
      }

      if (row.recipient_id) {
        recipientUserIds = [String(row.recipient_id)];
      } else {
        // Рассылка всем — только администратору. У обычного пользователя строки без
        // получателя взяться неоткуда, но проверка дешевле последствий ошибки.
        if (!isAdmin) return json({ error: "Рассылка недоступна" }, 403);
        recipientUserIds = [];
      }
      title = row.sender_name || "Сообщение от администратора";
      text = row.text || "";
      payload.open = "messages";
    } else if (reason === "invoice_event") {
      const rows = await get(
        `invoice_events?id=eq.${encodeURIComponent(rowId)}&select=calc_id,event,project_name&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return json({ error: "Событие не найдено" }, 404);

      const knownTitle = INVOICE_EVENT_TITLES[String(row.event)];
      if (!knownTitle) return json({ status: "skipped", reason: "event-not-notifiable" });

      // Уведомляем хозяина сметы, а не того, кто нажал кнопку: клиент открывает
      // ссылку без входа, и его действие должно разбудить телефон монтажника.
      const est = await get(
        `estimates?calc_id=eq.${encodeURIComponent(String(row.calc_id))}&select=user_id&limit=1`,
      );
      const owner = Array.isArray(est) && est[0] ? est[0].user_id : null;
      if (!owner) return json({ status: "skipped", reason: "owner-unknown" });

      recipientUserIds = [String(owner)];
      title = knownTitle;
      text = row.project_name ? `Объект: ${row.project_name}` : "Смета изменила статус";
      payload.open = "orders";
      payload.calcId = String(row.calc_id);
    } else if (reason === "shared_invoice") {
      // Клиент открыл ссылку и согласовал смету или отправил замечания.
      // Статус читаем из базы, а не из запроса: иначе по чужой ссылке можно было бы
      // прислать монтажнику «смета согласована», ничего не согласовывая.
      const rows = await get(
        `shared_invoices?id=eq.${encodeURIComponent(rowId)}&select=user_id,object_info&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return json({ error: "Смета не найдена" }, 404);

      const info = row.object_info || {};
      const status = String(info.status || "");
      if (status !== "confirmed" && status !== "needs_revision") {
        return json({ status: "skipped", reason: "status-not-notifiable" });
      }
      if (!row.user_id) return json({ status: "skipped", reason: "owner-unknown" });

      recipientUserIds = [String(row.user_id)];
      title = status === "confirmed" ? "Клиент согласовал смету" : "Клиент просит доработать смету";
      const objectName = info.project_name || info.object_name || "";
      text = objectName ? `Объект: ${objectName}` : "Откройте смету, чтобы посмотреть ответ";
      payload.open = "orders";
    } else {
      return json({ error: "Неизвестное событие" }, 400);
    }

    // Себе уведомление не шлём — телефон отправителя и так знает, что произошло
    if (callerId) {
      recipientUserIds = recipientUserIds.filter((id) => String(id) !== callerId);
    }

    // --- Достаём адреса устройств ------------------------------------------

    let tokenRows: Array<{ id: string; token: string }> | null;
    if (recipientUserIds.length === 0 && reason === "broadcast") {
      tokenRows = await get(`push_tokens?select=id,token&user_id=neq.${encodeURIComponent(callerId)}`);
    } else if (recipientUserIds.length === 0) {
      return json({ status: "skipped", reason: "no-recipients" });
    } else {
      const list = recipientUserIds.map((id) => `"${id}"`).join(",");
      tokenRows = await get(`push_tokens?select=id,token&user_id=in.(${encodeURIComponent(list)})`);
    }

    if (!Array.isArray(tokenRows) || tokenRows.length === 0) {
      return json({ status: "ok", sent: 0, reason: "no-devices" });
    }

    // --- Отправка ----------------------------------------------------------

    const accessToken = await getFcmAccessToken(sa);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    let sent = 0;
    const deadTokenIds: string[] = [];

    await Promise.all(tokenRows.map(async (row) => {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: row.token,
            notification: { title, body: text.slice(0, 240) },
            data: payload,
            android: {
              priority: "high",
              notification: { channel_id: "heatcalc", sound: "default" },
            },
          },
        }),
      });

      if (resp.ok) {
        sent++;
        return;
      }

      // Приложение удалили или переустановили — адрес больше не существует.
      // Такие строки чистим, иначе таблица копит мусор и каждая рассылка
      // тратит время на заведомо мёртвые адреса.
      if (resp.status === 404 || resp.status === 400) {
        deadTokenIds.push(row.id);
      } else {
        console.error("FCM отказал:", resp.status, await resp.text());
      }
    }));

    if (deadTokenIds.length) {
      const list = deadTokenIds.map((id) => `"${id}"`).join(",");
      await fetch(`${supabaseUrl}/rest/v1/push_tokens?id=in.(${encodeURIComponent(list)})`, {
        method: "DELETE",
        headers: rest,
      }).catch(() => {});
    }

    return json({ status: "ok", sent, cleaned: deadTokenIds.length });
  } catch (e) {
    console.error("send-push crashed:", e);
    return json({ error: "Не удалось отправить уведомление" }, 500);
  }
});
