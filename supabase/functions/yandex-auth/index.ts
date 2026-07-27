// Вход через Яндекс ID. Яндекса нет в списке OAuth-провайдеров Supabase, поэтому
// эта функция работает мостиком: браузер присылает временный код от Яндекса, мы
// меняем его на данные пользователя, создаём (или находим) его в auth.users и
// возвращаем одноразовую ссылку входа. Браузер переходит по ней — Supabase отдаёт
// обычную сессию, дальше всё работает как при входе через Google.
//
// Секреты (Edge Functions → Secrets): YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY подставляются Supabase автоматически.
//
// Verify JWT для этой функции должен быть выключен: её вызывает ещё не
// авторизованный посетитель.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
};

// Куда разрешено возвращать пользователя после входа. Без этого списка функцию
// можно было бы использовать для угона сессии: подсунуть свой redirect_uri и
// получить ссылку входа, ведущую на чужой сайт.
const ALLOWED_ORIGINS = [
  "https://heatcalc.ru",
  "https://www.heatcalc.ru",
  "https://terem24.github.io",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" },
  });

// Удаляет аккаунт-дубль на указанной почте, но только если он заведомо пустой:
// тариф base и ни одной сметы. Любые сомнения — возвращаем false и не удаляем.
async function removeEmptyDuplicate(
  email: string,
  currentAuthId: string,
  supabaseUrl: string,
  serviceKey: string,
): Promise<boolean> {
  const restHeaders = {
    apikey: serviceKey,
    Authorization: "Bearer " + serviceKey,
    "Content-Type": "application/json",
  };

  const rowsResp = await fetch(
    `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,auth_user_id,account_type`,
    { headers: restHeaders },
  );
  if (!rowsResp.ok) return false;
  const rows = await rowsResp.json().catch(() => null);
  if (!Array.isArray(rows) || rows.length !== 1) return false;

  const dup = rows[0];
  // Свой же аккаунт не трогаем ни при каких условиях
  if (!dup.auth_user_id || String(dup.auth_user_id) === String(currentAuthId)) return false;
  if (dup.account_type && dup.account_type !== "base") return false;

  const estResp = await fetch(
    `${supabaseUrl}/rest/v1/estimates?user_id=eq.${encodeURIComponent(dup.id)}&select=id&limit=1`,
    { headers: restHeaders },
  );
  if (!estResp.ok) return false;
  const estimates = await estResp.json().catch(() => null);
  if (!Array.isArray(estimates) || estimates.length > 0) return false;

  const delAuth = await fetch(`${supabaseUrl}/auth/v1/admin/users/${dup.auth_user_id}`, {
    method: "DELETE",
    headers: restHeaders,
  });
  if (!delAuth.ok) {
    console.error("duplicate auth user delete failed:", delAuth.status, await delAuth.text());
    return false;
  }

  await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(dup.id)}`, {
    method: "DELETE",
    headers: restHeaders,
  }).catch((e) => console.error("duplicate profile row delete failed:", e));

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("YANDEX_CLIENT_ID");
    const clientSecret = Deno.env.get("YANDEX_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret || !supabaseUrl || !serviceKey) {
      return json({ error: "Сервер не настроен: нет ключей Яндекса или Supabase" }, 500);
    }

    const body = await req.json().catch(() => null);
    const code = body && body.code ? String(body.code) : "";
    const redirectUri = body && body.redirect_uri ? String(body.redirect_uri) : "";
    // "login" — обычный вход; "link" — перевод уже открытого аккаунта на Яндекс ID
    const mode = (body && body.mode === "link") ? "link" : "login";
    if (!code || !redirectUri) {
      return json({ error: "Не передан код авторизации" }, 400);
    }

    // redirect_uri обязан совпадать с тем, что браузер отправлял в Яндекс, но
    // принимаем только свои адреса
    let origin = "";
    try {
      origin = new URL(redirectUri).origin;
    } catch (_e) {
      return json({ error: "Некорректный redirect_uri" }, 400);
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "Недопустимый адрес возврата" }, 403);
    }

    // 1. Код → токен доступа Яндекса
    const tokenResp = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenResp.json().catch(() => null);
    if (!tokenResp.ok || !tokenData || !tokenData.access_token) {
      console.error("Yandex token error:", tokenResp.status, tokenData);
      return json({ error: "Яндекс не подтвердил вход. Попробуйте ещё раз." }, 401);
    }

    // 2. Токен → данные пользователя
    const infoResp = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: "OAuth " + tokenData.access_token },
    });
    const info = await infoResp.json().catch(() => null);
    if (!infoResp.ok || !info || !info.id) {
      console.error("Yandex info error:", infoResp.status, info);
      return json({ error: "Не удалось получить данные из Яндекс ID" }, 502);
    }

    const email = String(
      info.default_email || (Array.isArray(info.emails) && info.emails[0]) || "",
    ).trim().toLowerCase();
    if (!email) {
      return json({
        error: "В вашем Яндекс ID нет адреса почты — войдите по email или через Google",
      }, 400);
    }

    const fullName = String(
      info.real_name ||
      [info.last_name, info.first_name].filter(Boolean).join(" ") ||
      info.display_name ||
      email.split("@")[0],
    ).trim();

    const avatarUrl = (info.default_avatar_id && !info.is_avatar_empty)
      ? `https://avatars.yandex.net/get-yapic/${info.default_avatar_id}/islands-200`
      : "";

    // Яндекс может вернуть дату с нулями в неизвестных частях ("0000-11-04")
    const birthDate = (typeof info.birthday === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(info.birthday) && !info.birthday.startsWith("0000"))
      ? info.birthday
      : "";

    const phone = (info.default_phone && info.default_phone.number)
      ? String(info.default_phone.number)
      : "";

    const adminHeaders = {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
    };

    // 3-Л. Режим привязки: пользователь уже вошёл (обычно через Google) и переводит
    // свой аккаунт на Яндекс ID. Второй аккаунт не создаём — меняем email у текущего,
    // поэтому сметы, тариф и настройки остаются на месте.
    if (mode === "link") {
      const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token) {
        return json({ error: "Нужен вход в аккаунт для привязки Яндекс ID" }, 401);
      }
      const meResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { apikey: serviceKey, Authorization: "Bearer " + token },
      });
      const me = await meResp.json().catch(() => null);
      if (!meResp.ok || !me || !me.id) {
        return json({ error: "Сессия не подтверждена — войдите заново и повторите" }, 401);
      }

      const currentEmail = String(me.email || "").toLowerCase();
      const mergedMeta = {
        ...(me.user_metadata || {}),
        provider_hint: "yandex",
        yandex_id: String(info.id),
        ru_login_migrated: true,
      };

      const updateUser = (payload: Record<string, unknown>) =>
        fetch(`${supabaseUrl}/auth/v1/admin/users/${me.id}`, {
          method: "PUT",
          headers: adminHeaders,
          body: JSON.stringify(payload),
        });

      // Почта в Яндексе та же, что в аккаунте — менять нечего, просто помечаем
      if (currentEmail === email) {
        const markResp = await updateUser({ user_metadata: mergedMeta });
        if (!markResp.ok) {
          console.error("mark migrated failed:", markResp.status, await markResp.text());
          return json({ error: "Не удалось сохранить настройку входа" }, 500);
        }
        return json({ status: "linked", email, merged: false });
      }

      let updResp = await updateUser({
        email,
        email_confirm: true,
        user_metadata: mergedMeta,
      });

      if (!updResp.ok) {
        const errText = await updResp.text();
        const conflict = /already|exists|registered|duplicate/i.test(errText) ||
          updResp.status === 422 || updResp.status === 409;
        if (!conflict) {
          console.error("email change failed:", updResp.status, errText);
          return json({ error: "Не удалось перевести аккаунт на Яндекс ID" }, 500);
        }

        // На эту почту уже есть аккаунт. Если он пустой (без смет и без PRO) —
        // это почти всегда случайный дубль, удаляем его и повторяем перевод.
        // Если в нём есть данные — молча ничего не сливаем, объяснять решение
        // должен пользователь.
        const removed = await removeEmptyDuplicate(email, me.id, supabaseUrl, serviceKey);
        if (!removed) {
          return json({
            error: "На адрес " + email + " уже зарегистрирован другой аккаунт, и в нём есть сметы. " +
              "Войдите в него отдельно или напишите в поддержку, чтобы перенести данные.",
          }, 409);
        }

        updResp = await updateUser({
          email,
          email_confirm: true,
          user_metadata: mergedMeta,
        });
        if (!updResp.ok) {
          console.error("email change retry failed:", updResp.status, await updResp.text());
          return json({ error: "Не удалось перевести аккаунт на Яндекс ID" }, 500);
        }
        return json({ status: "linked", email, merged: true });
      }

      return json({ status: "linked", email, merged: false });
    }

    // 3. Создаём пользователя. Если такой email уже зарегистрирован (через нашу
    // форму или Google) — Supabase вернёт ошибку, и это нормально: человек войдёт
    // в свой существующий аккаунт, дубль не появится.
    const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          avatar_url: avatarUrl,
          first_name: info.first_name || "",
          last_name: info.last_name || "",
          birth_date: birthDate,
          phone,
          provider_hint: "yandex",
          yandex_id: String(info.id),
        },
      }),
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      const alreadyExists = createResp.status === 422 ||
        /already been registered|already registered|already exists/i.test(errText);
      if (!alreadyExists) {
        console.error("Create user failed:", createResp.status, errText);
        return json({ error: "Не удалось создать аккаунт: " + errText }, 500);
      }
    }

    // 4. Одноразовая ссылка входа (письмо при этом не отправляется)
    const linkResp = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        type: "magiclink",
        email,
        redirect_to: redirectUri,
      }),
    });
    const linkData = await linkResp.json().catch(() => null);
    const actionLink = linkData && (linkData.action_link || (linkData.properties && linkData.properties.action_link));
    if (!linkResp.ok || !actionLink) {
      console.error("generate_link failed:", linkResp.status, linkData);
      return json({ error: "Не удалось выдать сессию входа" }, 500);
    }

    return json({ action_link: actionLink });
  } catch (e) {
    console.error("yandex-auth crashed:", e);
    return json({ error: "Ошибка входа через Яндекс: " + String(e) }, 500);
  }
});
