// Отмена регистрации через Google для пользователей из РФ.
//
// Кнопки Google в окне входа у российских посетителей нет, но сессия может
// возникнуть иначе: сохранённый в браузере вход, прямая ссылка на OAuth, старая
// закладка. Тогда браузер вызывает эту функцию, и она удаляет только что
// созданную запись в auth.users — иначе email остался бы занят и человек не смог
// бы зарегистрироваться ни по почте, ни через Яндекс ID.
//
// Главная защита: аккаунт удаляется ТОЛЬКО если у него нет профиля в таблице
// users, то есть он действительно новый. Действующие аккаунты не трогаются.
//
// Verify JWT выключен: токен пользователя проверяется внутри функции.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, authorization",
};

// Администраторам вход через Google разрешён, их аккаунты не удаляем ни при каких условиях
const ADMIN_EMAILS = [
  "kovdorekb@gmail.com",
  "kovdor24@yandex.ru",
  "dima24ba@gmail.com",
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Сервер не настроен" }, 500);
    }

    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return json({ error: "Нет токена" }, 401);
    }

    // Проверяем токен и узнаём, кто это
    const meResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: "Bearer " + token },
    });
    const me = await meResp.json().catch(() => null);
    if (!meResp.ok || !me || !me.id) {
      return json({ error: "Сессия не подтверждена" }, 401);
    }

    const email = String(me.email || "").toLowerCase();
    if (ADMIN_EMAILS.includes(email)) {
      return json({ status: "skipped", reason: "admin" });
    }

    const isGoogle = (me.app_metadata && me.app_metadata.provider === "google") ||
      (Array.isArray(me.identities) && me.identities.some((i: { provider?: string }) => i && i.provider === "google"));
    if (!isGoogle) {
      return json({ status: "skipped", reason: "not-google" });
    }

    const restHeaders = {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
    };

    // Есть ли у аккаунта профиль? Если да — это действующий пользователь, не удаляем.
    const byAuth = await fetch(
      `${supabaseUrl}/rest/v1/users?auth_user_id=eq.${encodeURIComponent(me.id)}&select=id&limit=1`,
      { headers: restHeaders },
    );
    if (!byAuth.ok) {
      return json({ error: "Не удалось проверить профиль" }, 500);
    }
    const authRows = await byAuth.json().catch(() => null);
    if (Array.isArray(authRows) && authRows.length > 0) {
      return json({ status: "skipped", reason: "existing-profile" });
    }

    if (email) {
      const byEmail = await fetch(
        `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
        { headers: restHeaders },
      );
      if (!byEmail.ok) {
        return json({ error: "Не удалось проверить профиль" }, 500);
      }
      const emailRows = await byEmail.json().catch(() => null);
      if (Array.isArray(emailRows) && emailRows.length > 0) {
        return json({ status: "skipped", reason: "existing-profile-email" });
      }
    }

    const delResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${me.id}`, {
      method: "DELETE",
      headers: restHeaders,
    });
    if (!delResp.ok) {
      const errText = await delResp.text();
      console.error("revoke delete failed:", delResp.status, errText);
      return json({ error: "Не удалось отменить регистрацию" }, 500);
    }

    return json({ status: "revoked" });
  } catch (e) {
    console.error("revoke-google-signup crashed:", e);
    return json({ error: String(e) }, 500);
  }
});
