// ===================== Сверка цен сохранённой сметы =====================
//
// «Отправил предложение, клиент вернулся через три месяца» — самый частый случай,
// когда смету надо актуализировать. Калькулятор пересобирает состав по текущему
// каталогу при каждом открытии, то есть цены обновляются сами. Плохо другое: он
// делает это молча, и монтажник не знает, изменилось ли что-нибудь и на сколько.
//
// Кнопка «Цены» в «Моих объектах» отвечает на этот вопрос, ничего не меняя:
// сравнивает цены, с которыми смета ушла клиенту, с сегодняшними и показывает
// построчно, что подорожало. Дальше человек решает сам — открыть смету с новыми
// ценами или оставить как есть.
//
// Откуда берутся старые цены (по убыванию точности):
//   1. слепок в самой смете (app.capturePriceSnapshot при отправке клиенту);
//   2. снимок отправленной сметы в shared_invoices;
//   3. ниоткуда — у смет, отправленных до появления слепка, состав не сохранён,
//      и сравнивать не с чем. Честно об этом говорим.
//
// Отдельным файлом, а не в app.js: тот правят сразу несколько сессий.
const Reprice = {

    // Ниже этого порога считаем, что цена не изменилась: округления каталога
    // дают копеечные расхождения, а «подорожало на 3 ₽» только пугает.
    MIN_RUB: 100,

    open: async function (estimateId) {
        if (!estimateId) return;
        let row = null;
        try {
            const { data, error } = await supabaseClient.from('estimates')
                .select('id, project_name, created_at, eq_sum, snap:calc_data->priceSnapshot, share:calc_data->>shared_invoice_id')
                .eq('id', estimateId).maybeSingle();
            if (error) throw error;
            row = data;
        } catch (e) {
            app.alert('Не удалось получить смету. Попробуйте позже.', 'Сверка цен');
            return;
        }
        if (!row) { app.alert('Смета не найдена.', 'Сверка цен'); return; }

        let items = null, when = null;
        if (row.snap && row.snap.prices) {
            when = row.snap.at || row.created_at;
            items = Object.keys(row.snap.prices).map(art => ({
                art: art,
                name: (row.snap.names && row.snap.names[art]) || art,
                was: row.snap.prices[art],
                q: (row.snap.qty && row.snap.qty[art]) || 1
            }));
        } else if (row.share) {
            try {
                const { data } = await supabaseClient.from('shared_invoices')
                    .select('created_at, eq:items->equipment').eq('id', row.share).maybeSingle();
                if (data && Array.isArray(data.eq)) {
                    when = data.created_at;
                    items = data.eq.map(it => ({
                        art: String((it && (it.originalId || it.id)) || ''),
                        name: (it && it.name) || '',
                        was: Number(it && it.price) || 0,
                        q: Number(it && it.q) || 1
                    })).filter(x => x.art && x.was && x.art.indexOf('custom_collapsed_') !== 0);
                }
            } catch (e) { items = null; }
        }

        if (!items || !items.length) {
            app.alert('Состав этой сметы не сохранён — так бывает у смет, отправленных до августа 2026 года. '
                + 'Откройте её: цены пересчитаются по сегодняшнему каталогу.', 'Сверка цен');
            return;
        }
        this.show(row, items, when);
    },

    show: function (row, items, when) {
        const price = app.catalogPriceIndex();
        const avail = app.catalogAvailabilityIndex();
        const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;');
        const num = (n) => Math.round(Math.abs(n)).toLocaleString('ru-RU');

    // Один и тот же артикул в разных местах системы получает суффикс места:
        // SVB-0002-200025_coil, SFT-0041-000034_dhw. В каталоге таких ключей нет,
        // поэтому при промахе отрезаем суффикс и ищем по самому артикулу.
        const lookup = (art, idx) => {
            if (idx[art] !== undefined) return idx[art];
            const base = String(art).split('_')[0];
            return base !== art ? idx[base] : undefined;
        };

        // ...но не всегда цена базового артикула про то же самое. Труба в смете
        // посчитана за бухту (22 000 ₽), а в каталоге лежит за метр (220 ₽); хомут
        // в смете штучный, в каталоге упаковкой. Разница в разы — это разные
        // единицы, а не подорожание, и сравнивать их нельзя: получится «смета
        // подешевела на 8%» там, где не изменилось ничего.
        //
        // Настоящее движение цен за месяцы измеряется процентами, поэтому всё, что
        // отличается больше чем впятеро, считаем несравнимым и говорим об этом.
        const comparable = (was, now) => {
            if (!was || !now) return false;
            const k = now / was;
            return k >= 0.2 && k <= 5;
        };

        let wasAll = 0, nowAll = 0, gone = 0;
        const changed = [], order = [];
        items.forEach(it => {
            const now = lookup(it.art, price);
            if (now === undefined) { gone++; return; }        // позиции больше нет в каталоге
            if (!comparable(it.was, now)) { gone++; return; }  // цены в разных единицах
            wasAll += it.was * it.q;
            nowAll += now * it.q;
            if (Math.abs(now - it.was) * it.q >= this.MIN_RUB) {
                changed.push({ ...it, now: now, diff: (now - it.was) * it.q, pct: (now - it.was) / it.was * 100 });
            }
            if (lookup(it.art, avail) === 'on_order') order.push(it);
        });
        changed.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

        const total = nowAll - wasAll;
        const pct = wasAll ? total / wasAll * 100 : 0;
        const whenStr = when ? new Date(when).toLocaleDateString('ru-RU') : '';

        const head = Math.abs(total) < this.MIN_RUB
            ? `<div style="font-size:14px; font-weight:700; color:#10B981; margin-bottom:4px;">Цены не изменились</div>
               <div style="font-size:12.5px; color:var(--text-sec);">Предложение можно отправлять как есть.</div>`
            : `<div style="font-size:14px; font-weight:700; color:${total > 0 ? '#EF4444' : '#10B981'}; margin-bottom:4px;">
                   Оборудование ${total > 0 ? 'подорожало' : 'подешевело'} на ${num(total)} ₽
                   (${total > 0 ? '+' : '−'}${Math.abs(pct).toFixed(1).replace('.', ',')}%)
               </div>
               <div style="font-size:12.5px; color:var(--text-sec);">
                   Было ${num(wasAll)} ₽${whenStr ? ' на ' + esc(whenStr) : ''}, стало ${num(nowAll)} ₽ сегодня.
               </div>`;

        const rows = changed.slice(0, 25).map(c => `
            <div style="display:flex; align-items:center; gap:10px; padding:6px 0; border-bottom:1px solid var(--border);">
                <div style="min-width:0; flex:1;">
                    <b style="font-size:12.5px; color:var(--text-main);">${esc(c.name)}</b>
                    <br><small style="color:var(--text-sec);">${esc(c.art)} · ${num(c.was)} → ${num(c.now)} ₽${c.q > 1 ? ' × ' + num(c.q) : ''}</small>
                </div>
                <b style="flex:0 0 auto; font-size:12.5px; color:${c.diff > 0 ? '#EF4444' : '#10B981'};">
                    ${c.diff > 0 ? '+' : '−'}${num(c.diff)} ₽</b>
            </div>`).join('');

        const notes = [];
        if (changed.length > 25) notes.push('Показаны 25 самых заметных из ' + changed.length + '.');
        if (gone) notes.push(gone + ' ' + app.plural(gone, 'позицию', 'позиции', 'позиций')
            + ' сверить не удалось: их больше нет в каталоге либо цена в смете и в каталоге указана в разных единицах (бухта против метра).');
        if (order.length) notes.push('Под заказ сейчас ' + order.length + ' ' + app.plural(order.length, 'позиция', 'позиции', 'позиций')
            + ': ' + order.slice(0, 3).map(x => esc(x.name || x.art)).join(', ') + (order.length > 3 ? ' и другие' : '')
            + '. Их можно заменить в самой смете кнопкой «Аналог».');

        app.showPlainModal('Сверка цен · ' + esc(row.project_name || 'Без названия'),
            `<div style="border:1px solid var(--border); border-radius:10px; padding:12px 14px; margin-bottom:10px;">${head}</div>`
            + (rows ? `<p class="lk-hint" style="margin:0 0 4px;">Что изменилось:</p>${rows}` : '')
            + (notes.length ? `<p style="font-size:11px; color:var(--text-sec); margin-top:10px; line-height:1.5;">${notes.join('<br>')}</p>` : '')
            + `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
                   <button type="button" class="custom-modal-btn" style="flex:1 1 200px; width:auto;"
                       onclick="app.closePlainModal(); app.loadSingleEstimate('${esc(row.id)}')">
                       Открыть по сегодняшним ценам</button>
               </div>
               <p style="font-size:11px; color:var(--text-sec); margin-top:8px; line-height:1.5;">
                   Сверка ничего не меняет. Открытая смета пересчитается по сегодняшнему каталогу —
                   отправьте её клиенту заново, и новые цены станут согласованными.
               </p>`);
    }
};
