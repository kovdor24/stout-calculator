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
// и остальные технические отметки сюда не входят — их у активного монтажника сотни
// в день.
const INVOICE_EVENT_TITLES: Record<string, string> = {
  opened: "Клиент открыл смету",
  confirmed: "Клиент согласовал смету",
  rejected: "Клиент отклонил смету",
  needs_revision: "Клиент просит доработать смету",
  invoice_requested: "Запрошен счёт",
  invoice_issued: "Счёт выставлен",
  paid: "Оплата подтверждена",
};

// Кому идёт уведомление. По умолчанию — хозяину сметы (монтажнику): почти все
// события делает кто-то другой, а ждёт их он.
//
// Исключение одно: запрос счёта. Его нажимает сам монтажник, и уведомлять его же
// бессмысленно — ждёт этого менеджер дистрибьютора, который счёт и выставляет.
// Раньше событие числилось уведомляемым, но адресатом получался автор сметы,
// то есть сам вызвавший, и уведомление отфильтровывалось как «себе не шлём»:
// менеджер не узнавал о запросе никогда.
const TO_MANAGER = new Set(["invoice_requested"]);

// О чём сообщает страница сметы, открытая по ссылке БЕЗ входа в аккаунт: всё это
// действия самого заказчика. Пропуском служит знание идентификатора события —
// та же оговорка, что у shared_invoice ниже: кто его знает, тот и так видит смету.
// Остальные события (счёт выставлен, оплачено, отклонено) ставит человек из
// админки, и там сессия обязательна.
const CLIENT_EVENTS = new Set(["opened", "confirmed", "needs_revision", "invoice_requested"]);

// Насколько свежим должно быть событие, о котором сообщает анонимная страница.
// Она зовёт функцию через секунды после записи; всё, что старше, — это повтор
// чужого идентификатора, а не новость. Без этой проверки один и тот же id можно
// было бы звать сколько угодно раз и слать людям уведомление за уведомлением.
const EVENT_FRESH_MS = 10 * 60 * 1000;

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
    // Сообщения и статусы отправляет авторизованный пользователь, и мы обязаны знать
    // кто: иначе нельзя проверить, что он уведомляет по своему сообщению, а не по
    // чужому.
    //
    // invoice_event — посередине: часть событий сметы делает менеджер из админки (там
    // сессия есть и проверяется ниже, внутри ветки), а «клиент открыл смету» пишет та
    // же анонимная страница по ссылке. Поэтому здесь токен не требуем, а требуем его
    // внутри ветки — для всех событий, кроме открытия.
    const needsAuth = reason !== "shared_invoice" && reason !== "invoice_event";
    let callerId = "";
    let isAdmin = false;

    // Возвращает null, если сессия в порядке, иначе — готовый ответ с отказом.
    // Вынесено в функцию, потому что invoice_event проверяет сессию не здесь, а
    // внутри своей ветки: там решение зависит от вида события.
    const verifyCaller = async () => {
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
      return null;
    };

    if (needsAuth) {
      const denied = await verifyCaller();
      if (denied) return denied;
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
    } else if (reason === "installer_reply") {
      // Ответ монтажника администрации. Раньше о нём сообщали письмом на каждый из
      // трёх админских адресов — это съедало месячный лимит почтовой службы. Теперь
      // будим телефон, а письмо остаётся только напоминанием через двое суток
      // (remindAdminAboutStaleReply в app.js).
      const rows = await get(
        `messages?id=eq.${encodeURIComponent(rowId)}&select=sender_id,type,text,sender_name&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return json({ error: "Сообщение не найдено" }, 404);
      if (String(row.sender_id) !== callerId) {
        return json({ error: "Чужое сообщение" }, 403);
      }
      // Только ответы: письма и объявления рассылает админ, у них своё событие
      if (String(row.type) !== "reply") {
        return json({ status: "skipped", reason: "not-a-reply" });
      }

      // Адресат — вся администрация: ответ уходит «администрации» (recipient_id пуст),
      // а не конкретному человеку, и заранее неизвестно, кто из них сейчас за панелью.
      const orExpr = ADMIN_EMAILS.map((e) => `email.ilike.${e}`).join(",");
      const adminRows = await get(`users?or=(${encodeURIComponent(orExpr)})&select=id`);
      recipientUserIds = Array.isArray(adminRows) ? adminRows.map((r) => String(r.id)) : [];
      if (!recipientUserIds.length) return json({ status: "skipped", reason: "admins-not-registered" });

      // Имя монтажника подписью в шторке уведомлений: sender_name заполнен только у
      // сотрудников, поэтому обычному человеку берём имя из его профиля.
      let who = String(row.sender_name || "").trim();
      if (!who) {
        const senderRows = await get(
          `users?id=eq.${encodeURIComponent(String(row.sender_id))}&select=username,email,last_name,first_name&limit=1`,
        );
        const s = Array.isArray(senderRows) && senderRows[0] ? senderRows[0] : null;
        who = s
          ? ([s.last_name, s.first_name].filter(Boolean).join(" ") || s.username || s.email || "Монтажник")
          : "Монтажник";
      }

      title = `Ответ: ${who}`;
      text = row.text || "Новый ответ монтажника";
      payload.open = "messages";
    } else if (reason === "invoice_event") {
      const rows = await get(
        `invoice_events?id=eq.${encodeURIComponent(rowId)}&select=calc_id,event,project_name,created_at&limit=1`,
      );
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return json({ error: "Событие не найдено" }, 404);

      const event = String(row.event);
      const knownTitle = INVOICE_EVENT_TITLES[event];
      if (!knownTitle) return json({ status: "skipped", reason: "event-not-notifiable" });

      // Кто зовёт: человек из админки (есть токен) или страница клиента (токена
      // нет и быть не может). Проверку сессии делаем здесь, а не наверху, потому
      // что ответ зависит от вида события.
      const hasToken = !!(req.headers.get("Authorization") || "").trim();
      if (hasToken) {
        const denied = await verifyCaller();
        if (denied) return denied;
      } else {
        if (!CLIENT_EVENTS.has(event)) return json({ error: "Нет токена" }, 401);
        const age = Date.now() - new Date(String(row.created_at || "")).getTime();
        if (!isFinite(age) || age > EVENT_FRESH_MS) {
          return json({ status: "skipped", reason: "event-not-fresh" });
        }
      }

      // Об открытии сообщаем только ПЕРВОМ: клиент открывает смету с телефона,
      // потом с компьютера, потом показывает жене — каждое устройство пишет свою
      // отметку (в браузере её гасит localStorage, но он у каждого свой).
      // Монтажнику важен факт «дошло», а не счётчик просмотров.
      if (event === "opened") {
        const firstRows = await get(
          `invoice_events?calc_id=eq.${encodeURIComponent(String(row.calc_id))}` +
          `&event=eq.opened&select=id&order=created_at.asc&limit=1`,
        );
        const first = Array.isArray(firstRows) && firstRows[0] ? String(firstRows[0].id) : "";
        if (first && first !== rowId) {
          return json({ status: "skipped", reason: "not-first-open" });
        }
      }

      // Хозяин сметы — монтажник. Он адресат почти всех событий: их делает кто-то
      // другой (клиент открыл, менеджер выставил), а ждёт их он.
      const est = await get(
        `estimates?calc_id=eq.${encodeURIComponent(String(row.calc_id))}&select=user_id&limit=1`,
      );
      const owner = Array.isArray(est) && est[0] ? est[0].user_id : null;
      if (!owner) return json({ status: "skipped", reason: "owner-unknown" });

      // Что именно открыли. У монтажника в работе десяток смет и столько же
      // разосланных ссылок; «Клиент открыл смету» без объекта и номера расчёта не
      // говорит, к какой из них идти и кому звонить. Номер расчёта — то же число,
      // что стоит в карточке заказа и в самой ссылке.
      const objectName = String(row.project_name || "").trim();
      const calcNo = String(row.calc_id || "").trim();
      const whatOpened = [
        objectName && objectName !== "Без названия" ? `Объект: ${objectName}` : "",
        calcNo ? `расчёт № ${calcNo}` : "",
      ].filter(Boolean).join(" · ");

      if (TO_MANAGER.has(event)) {
        // Ищем менеджера дистрибьютора, к которому привязан монтажник. Берём и
        // менеджера, и директора: у части дистрибьюторов заполнен только второй,
        // и тогда запрос счёта не увидел бы никто.
        const ownerRows = await get(`users?id=eq.${encodeURIComponent(String(owner))}&select=distributor_id&limit=1`);
        const distId = Array.isArray(ownerRows) && ownerRows[0] ? ownerRows[0].distributor_id : null;
        if (!distId) return json({ status: "skipped", reason: "no-distributor" });

        const distRows = await get(
          `distributors?id=eq.${encodeURIComponent(String(distId))}&select=manager_email,director_email&limit=1`,
        );
        const dist = Array.isArray(distRows) && distRows[0] ? distRows[0] : null;
        const emails = [dist?.manager_email, dist?.director_email]
          .map((e) => String(e || "").trim().toLowerCase())
          .filter(Boolean);
        if (!emails.length) return json({ status: "skipped", reason: "no-manager-email" });

        // Адрес в базе может быть записан с заглавными буквами, поэтому ищем
        // регистронезависимо: in.() такого не умеет, а or=(...) умеет.
        const orExpr = emails.map((e) => `email.ilike.${e}`).join(",");
        const mgrRows = await get(`users?or=(${encodeURIComponent(orExpr)})&select=id`);
        const mgrIds = Array.isArray(mgrRows) ? mgrRows.map((r) => String(r.id)) : [];
        if (!mgrIds.length) return json({ status: "skipped", reason: "manager-not-registered" });

        recipientUserIds = mgrIds;
        text = whatOpened || "Монтажник запросил счёт";
        payload.open = "kanban";
      } else {
        recipientUserIds = [String(owner)];
        text = whatOpened || "Смета изменила статус";
        payload.open = "orders";
      }

      title = knownTitle;
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
      // Та же подпись, что у событий сметы: по какой именно ссылке пришёл ответ.
      // Страница пишет объект в projectName; project_name/object_name остались от
      // прежних версий записи и встречаются в старых строках.
      const objectName = String(info.projectName || info.project_name || info.object_name || "").trim();
      const calcNo = String(info.sequence_id || "").trim();
      text = [
        objectName && objectName !== "Без названия" ? `Объект: ${objectName}` : "",
        calcNo ? `расчёт № ${calcNo}` : "",
      ].filter(Boolean).join(" · ") || "Откройте смету, чтобы посмотреть ответ";
      payload.open = "orders";
      if (calcNo) payload.calcId = calcNo;
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
