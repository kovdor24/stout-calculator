// Заменяет неработающий mail_status.php (GitHub Pages не исполняет PHP, письмо
// никогда не уходило). Принимает тот же JSON, что invoice.html отправлял в PHP,
// и реально шлёт письмо через REST API уже используемого в проекте EmailJS-аккаунта.
//
// ВАЖНО: в настройках EmailJS-аккаунта (Account → Security) должна быть включена
// опция "Allow non-browser requests" — иначе EmailJS блокирует серверные вызовы
// без Origin-заголовка браузера как потенциальный спам/abuse.

const EMAILJS_SERVICE_ID = "service_o11b4ej";
const EMAILJS_TEMPLATE_ID = "template_lg1zol9";
const EMAILJS_PUBLIC_KEY = "-m4N93pTqMlCfuBpT";
const ADMIN_EMAIL = "kovdor24@yandex.ru";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json().catch(() => null);
    if (!data || !data.to) {
      return new Response(
        JSON.stringify({ status: "error", message: "Некорректные данные или отсутствует email получателя" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" } },
      );
    }

    const to = String(data.to).trim();
    const projectName = data.projectName || "Без названия";
    const statusText = data.statusText || "Изменён";
    const comment = data.comment || "";
    const invoiceUrl = data.invoiceUrl || "";
    // История статусов (invoice_events) теперь пишется напрямую из браузера клиента
    // (invoice.html, logInvoiceEventDirect) до вызова этой функции — синхронно, с
    // видимой ошибкой, а не фоном отсюда без проверки результата.

    let message = `Объект: ${projectName}\nСтатус: ${statusText}\n`;
    if (comment) message += `\nКомментарий клиента:\n${comment}\n`;
    message += `\nСсылка: ${invoiceUrl}`;

    const templateParams = {
      to_email: to,
      email_subject: `Статус КП: ${projectName} — ${statusText}`,
      project_name: projectName,
      calc_id: "N/A",
      user_name: "Клиент",
      user_phone: "—",
      user_email: "—",
      user_city: "—",
      user_status: statusText,
      area: 0,
      region: 100,
      boiler_type: "—",
      total_sum: "—",
      equipment_list: message,
      view_url: invoiceUrl,
    };

    // В строгом режиме (после включения "Allow non-browser requests") EmailJS
    // дополнительно требует Private Key — хранится в секретах Supabase, не в коде
    const privateKey = Deno.env.get("EMAILJS_PRIVATE_KEY");

    const sendVia = (params: Record<string, unknown>) =>
      fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          accessToken: privateKey,
          template_params: params,
        }),
      });

    const emailjsResp = await sendVia(templateParams);

    // Копия админу — всегда, независимо от того, привязан ли монтажник к менеджеру
    if (to.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      sendVia({ ...templateParams, to_email: ADMIN_EMAIL, email_subject: `[Админ] ${templateParams.email_subject}` })
        .catch((e) => console.error("Admin cc failed:", e));
    }

    if (!emailjsResp.ok) {
      const errText = await emailjsResp.text();
      return new Response(
        JSON.stringify({ status: "error", message: "EmailJS: " + errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" } },
      );
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ status: "error", message: "Proxy request failed: " + String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json; charset=UTF-8" } },
    );
  }
});
