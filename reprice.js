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
//   3. даты цен в каталоге — у смет, которые клиенту не отправляли: состава того
//      дня нет, но видно, каким позициям прайс переписал цену после сохранения.
//      Это ответ на «почему», без «сколько», и так о нём и говорим.
//
// Отдельным файлом, а не в app.js: тот правят сразу несколько сессий.
const Reprice = {

    // Ниже этого порога считаем, что цена не изменилась: округления каталога
    // дают копеечные расхождения, а «подорожало на 3 ₽» только пугает.
    MIN_RUB: 100,

    /**
     * opts — от плашки «цены изменились» в калькуляторе: { bill, savedAt }.
     * Смета там уже открыта, её состав пересчитан по сегодняшнему каталогу, и
     * если слепка цен у неё нет, объяснить разницу можно хотя бы по датам
     * прайса (showByDates). Из списка «Мои объекты» состава нет — оттуда зовут
     * без opts, и такая смета честно остаётся без разбора.
     */
    open: async function (estimateId, opts) {
        if (!estimateId) return;
        let row = null;
        try {
            const { data, error } = await supabaseClient.from('estimates')
                .select('id, project_name, created_at, eq_sum, snap:calc_data->priceSnapshot, share:calc_data->>shared_invoice_id, eqDisc:calc_data->>eqDiscount, wkDisc:calc_data->>worksDiscount')
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

        // Скидка (или наценка) монтажника — та, с которой смета уходила клиенту.
        // У слепка она своя, у смет постарше её нет — берём из настроек расчёта.
        const disc = {
            eq: Number((row.snap && row.snap.eqDiscount !== undefined) ? row.snap.eqDiscount : row.eqDisc) || 0,
            wk: Number((row.snap && row.snap.worksDiscount !== undefined) ? row.snap.worksDiscount : row.wkDisc) || 0
        };

        if (!items || !items.length) {
            if (opts && opts.bill && opts.bill.length) {
                this.showByDates(row, opts.bill, opts.savedAt || row.created_at, disc);
                return;
            }
            app.alert('Состав этой сметы не сохранён — так бывает у смет, отправленных до августа 2026 года. '
                + 'Откройте её: цены пересчитаются по сегодняшнему каталогу.', 'Сверка цен');
            return;
        }
        this.show(row, items, when, disc);
    },

    /**
     * Строка про скидку монтажника. Наценка (eqDiscount < 0) показана зелёным
     * «+X%» — монтажник берёт сверх прайса; скидка красным «−X%» — уступает.
     * Знак читается со стороны сметы, а не кошелька клиента.
     */
    discountNote: function (disc) {
        const part = (v, what) => {
            if (!v) return '';
            const up = v < 0;
            return `<span style="color:${up ? '#10B981' : '#EF4444'}; font-weight:700;">`
                + `${up ? '+' : '−'}${Math.abs(v)}%</span>`
                + ` <span style="color:var(--text-sec);">${up ? 'наценка' : 'скидка'} на ${what}</span>`;
        };
        const bits = [part(disc && disc.eq, 'оборудование'), part(disc && disc.wk, 'работы')].filter(Boolean);
        return bits.length ? `<div style="font-size:12px; margin-top:6px;">${bits.join(' · ')}</div>` : '';
    },

    // Кнопки «открыть смету» под сверкой. Со скидкой смета откроется такой же,
    // какой её видел клиент; без скидки — по чистому прайсу, чтобы монтажник
    // решил, гасить подорожание своей уступкой или нет.
    openButtons: function (rowId, disc) {
        const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;');
        const has = !!(disc && (disc.eq || disc.wk));
        const word = has && (disc.eq < 0 || disc.wk < 0) && !(disc.eq > 0 || disc.wk > 0) ? 'наценкой' : 'скидкой';
        return `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
                   <button type="button" class="custom-modal-btn" style="flex:1 1 200px; width:auto;"
                       onclick="app.closePlainModal(); app.loadSingleEstimate('${esc(rowId)}')">
                       ${has ? 'Открыть с прежней ' + word : 'Открыть по сегодняшним ценам'}</button>
                   ${has ? `<button type="button" class="custom-modal-btn" style="flex:1 1 200px; width:auto; background:transparent; color:var(--text-sec); border:1px solid var(--border);"
                       onclick="app.closePlainModal(); app.loadEstimateWithoutDiscount('${esc(rowId)}')">
                       Открыть без ${word === 'наценкой' ? 'наценки' : 'скидки'}</button>` : ''}
               </div>`;
    },

    // Один и тот же артикул в разных местах системы получает суффикс места:
    // SVB-0002-200025_coil, SFT-0041-000034_dhw. В каталоге таких ключей нет,
    // поэтому при промахе отрезаем суффикс и ищем по самому артикулу.
    lookup: function (art, idx) {
        if (idx[art] !== undefined) return idx[art];
        const base = String(art).split('_')[0];
        return base !== art ? idx[base] : undefined;
    },

    /**
     * Объяснение для смет без слепка цен — тех, что сохраняли, но клиенту не
     * отправляли и не печатали. Цен того дня у них нет нигде: в базе лежат одни
     * итоговые суммы. Зато у каждой позиции каталога есть дата, которой помечена
     * её цена, — показываем строки, чью цену прайс переписал уже после
     * сохранения. Саму разницу не называем, её взять неоткуда, только
     * сегодняшнюю стоимость этих строк.
     */
    showByDates: function (row, bill, when, disc) {
        const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;');
        const num = (n) => Math.round(Math.abs(n)).toLocaleString('ru-RU');
        const at = when ? new Date(when) : null;
        if (!at || isNaN(at.getTime())) {
            app.alert('У этой сметы не сохранились ни цены того дня, ни его дата — сравнивать не с чем.', 'Сверка цен');
            return;
        }

        const dates = app.catalogPriceDateIndex();
        const rows = [];
        let sumAll = 0, dated = 0;
        bill.forEach(it => {
            // Снятые галочкой опции не входят в сумму оборудования — не входят и сюда
            if (!it || it.isOpt) return;
            const art = String(it.originalId || it.id || '');
            const d = art ? this.lookup(art, dates) : undefined;
            if (!d) return;
            dated++;
            const t = new Date(d);
            if (isNaN(t.getTime()) || t.getTime() <= at.getTime()) return;
            const sum = Number(it.sum) || (Number(it.price) || 0) * (Number(it.q) || 1);
            sumAll += sum;
            rows.push({ name: it.name || art, art: art, at: t, sum: sum, price: Number(it.price) || 0, q: Number(it.q) || 1 });
        });

        const whenStr = at.toLocaleDateString('ru-RU');
        if (!rows.length) {
            app.alert('Цены позиций этой сметы каталог не обновлял с ' + whenStr
                + '. Значит, сумма изменилась не из-за прайса, а из-за правок в самой смете — или из-за позиций, которых в каталоге больше нет.', 'Сверка цен');
            return;
        }
        rows.sort((a, b) => b.sum - a.sum);

        const list = rows.slice(0, 25).map(r => `
            <div style="display:flex; align-items:center; gap:10px; padding:6px 0; border-bottom:1px solid var(--border);">
                <div style="min-width:0; flex:1;">
                    <b style="font-size:12.5px; color:var(--text-main);">${esc(r.name)}</b>
                    <br><small style="color:var(--text-sec);">${esc(r.art)} · цена от ${esc(r.at.toLocaleDateString('ru-RU'))} · ${num(r.price)} ₽${r.q > 1 ? ' × ' + num(r.q) : ''}</small>
                </div>
                <b style="flex:0 0 auto; font-size:12.5px; color:var(--text-main);">${num(r.sum)} ₽</b>
            </div>`).join('');

        const notes = [];
        if (rows.length > 25) notes.push('Показаны 25 самых весомых из ' + rows.length + '.');
        if (disc && disc.eq) notes.push('Цены строк показаны со скидкой (наценкой) монтажника — как в самой смете.');
        notes.push('Справа — сегодняшняя стоимость строки, а не разница: старых цен у этой сметы нет. '
            + 'Чтобы в следующий раз было точное «было → стало», отправьте смету клиенту или напечатайте её — '
            + 'в этот момент калькулятор запоминает цены.');

        app.showPlainModal('Сверка цен · ' + esc(row.project_name || 'Без названия'),
            `<div style="border:1px solid var(--border); border-radius:10px; padding:12px 14px; margin-bottom:10px;">
                <div style="font-size:14px; font-weight:700; color:var(--text-main); margin-bottom:4px;">
                    Цены той сметы не сохранились
                </div>
                <div style="font-size:12.5px; color:var(--text-sec);">
                    Зато видно, каким позициям прайс переписал цену уже после ${esc(whenStr)}:
                    ${rows.length} ${app.plural(rows.length, 'позиция', 'позиции', 'позиций')} из ${dated}.
                    Разница набежала на них.
                </div>
                ${this.discountNote(disc)}
             </div>`
            + `<p class="lk-hint" style="margin:0 0 4px;">Цену обновляли после сохранения:</p>${list}`
            + `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0 0; font-size:13px;">
                <b style="color:var(--text-main);">Сегодня эти позиции стоят</b>
                <b style="color:var(--text-main);">${num(sumAll)} ₽</b>
               </div>`
            + `<p style="font-size:11px; color:var(--text-sec); margin-top:10px; line-height:1.5;">${notes.join('<br>')}</p>`
            + ((disc && (disc.eq || disc.wk)) ? this.openButtons(row.id, disc) : ''));
    },

    show: function (row, items, when, disc) {
        const price = app.catalogPriceIndex();
        const avail = app.catalogAvailabilityIndex();
        const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;');
        const num = (n) => Math.round(Math.abs(n)).toLocaleString('ru-RU');

        // Артикул с суффиксом места ищем по общему правилу — см. Reprice.lookup
        const lookup = (art, idx) => this.lookup(art, idx);

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

        // Цены в смете — уже со скидкой (наценкой) монтажника, в каталоге —
        // прайсовые. Сравнивать их напрямую нельзя: смета со скидкой 15%
        // объявлялась бы подорожавшей на те же 15%, хотя прайс не двигался.
        // Приводим сегодняшнюю цену к деньгам сметы — тем, что видит клиент.
        const eqDisc = (disc && Number(disc.eq)) || 0;
        const asBill = (p) => eqDisc ? Math.round(p * (1 - eqDisc / 100)) : p;

        let wasAll = 0, nowAll = 0, gone = 0;
        const changed = [], order = [];
        items.forEach(it => {
            const raw = lookup(it.art, price);
            const now = raw === undefined ? undefined : asBill(raw);
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
        const discHtml = this.discountNote(disc);
        const discHint = discHtml
            ? `<p style="font-size:11px; color:var(--text-sec); margin-top:8px; line-height:1.5;">
                   Суммы посчитаны с этой скидкой — как их видит клиент.</p>`
            : '';

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
            `<div style="border:1px solid var(--border); border-radius:10px; padding:12px 14px; margin-bottom:10px;">${head}${discHtml}</div>`
            + (rows ? `<p class="lk-hint" style="margin:0 0 4px;">Что изменилось:</p>${rows}` : '')
            + (notes.length ? `<p style="font-size:11px; color:var(--text-sec); margin-top:10px; line-height:1.5;">${notes.join('<br>')}</p>` : '')
            + discHint
            + this.openButtons(row.id, disc)
            + `<p style="font-size:11px; color:var(--text-sec); margin-top:8px; line-height:1.5;">
                   Сверка ничего не меняет. Открытая смета пересчитается по сегодняшнему каталогу —
                   отправьте её клиенту заново, и новые цены станут согласованными.
               </p>`);
    }
};
