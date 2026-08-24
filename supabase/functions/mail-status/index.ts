// Заменяет неработающий mail_status.php (GitHub Pages не исполняет PHP, письмо
// никогда не уходило). Принимает тот же JSON, что invoice.html отправлял в PHP,
// и реально шлёт письмо через REST API уже используемого в проекте EmailJS-аккаунта.
//
// ВАЖНО: в настройках EmailJS-аккаунта (Account → Security) должна быть включена
// опция "Allow non-browser requests" — иначе EmailJS блокирует серверные вызовы
// без Origin-заголовка браузера как потенциальный спам/abuse.

const EMAILJS_SERVICE_ID = "service_o11b4ej";
// Шаблон «Запрос счёта». Раньше письма о статусах шли через него же, а он свёрстан
// под анкету объекта: имя, телефон, город, площадь, сумма. У события статуса этих
// данных нет — функция подставляла заглушки, и монтажнику приходило письмо с шапкой
// «Запрос счёта», номером расчёта «N/A» и прочерками во всех полях. Оставлен
// запасным вариантом: пока шаблон статусов не заведён, письма всё же уходят.
const EMAILJS_TEMPLATE_INVOICE = "template_lg1zol9";
// Шаблон под события сметы: объект, статус, комментарий, ссылка — и ничего лишнего.
// Заводится в кабинете EmailJS (Email Templates → Create New Template), сюда
// вписывается его ID.
const EMAILJS_TEMPLATE_STATUS = "ЗАМЕНИТЬ_НА_ID_ШАБЛОНА";
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

    const calcId = data.calcId ? String(data.calcId) : "";

    let message = `Объект: ${projectName}\nСтатус: ${statusText}\n`;
    if (comment) message += `\nКомментарий клиента:\n${comment}\n`;
    message += `\nСсылка: ${invoiceUrl}`;

    const subject = `${statusText} — ${projectName}`;

    // Параметры шаблона статусов: только то, что у события действительно есть.
    // Пустых значений не шлём — вместо «Телефон: —» в письме просто не будет строки.
    const statusParams = {
      to_email: to,
      email_subject: subject,
      project_name: projectName,
      calc_id: calcId || "—",
      status_title: statusText,
      comment: comment || "—",
      view_url: invoiceUrl,
      message: message,
    };

    // Запасной набор — для старого шаблона «Запрос счёта», если шаблон статусов
    // ещё не заведён. Заглушки здесь и делали письмо «пустым», но это лучше,
    // чем не отправить монтажнику ничего.
    const invoiceParams = {
      to_email: to,
      email_subject: `Статус КП: ${projectName} — ${statusText}`,
      project_name: projectName,
      calc_id: calcId || "N/A",
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

    const sendVia = (templateId: string, params: Record<string, unknown>) =>
      fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: templateId,
          user_id: EMAILJS_PUBLIC_KEY,
          accessToken: privateKey,
          template_params: params,
        }),
      });

    // Шаблон статусов заведён? Если ID ещё не вписан — сразу идём старым путём.
    const hasStatusTemplate = EMAILJS_TEMPLATE_STATUS.startsWith("template_");
    let templateId = hasStatusTemplate ? EMAILJS_TEMPLATE_STATUS : EMAILJS_TEMPLATE_INVOICE;
    let params: Record<string, unknown> = hasStatusTemplate ? statusParams : invoiceParams;

    let emailjsResp = await sendVia(templateId, params);

    // Шаблон удалён или ID вписан с опечаткой: EmailJS отвечает «template ID not
    // found». Письмо в этом случае важнее его вида — повторяем по старому шаблону.
    if (!emailjsResp.ok && hasStatusTemplate) {
      const errText = await emailjsResp.clone().text();
      if (/template/i.test(errText) && /not found/i.test(errText)) {
        console.error("Шаблон статусов не найден, отправляю по старому:", errText);
        templateId = EMAILJS_TEMPLATE_INVOICE;
        params = invoiceParams;
        emailjsResp = await sendVia(templateId, params);
      }
    }

    // Копия админу — всегда, независимо от того, привязан ли монтажник к менеджеру
    if (to.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      sendVia(templateId, { ...params, to_email: ADMIN_EMAIL, email_subject: `[Админ] ${params.email_subject}` })
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
