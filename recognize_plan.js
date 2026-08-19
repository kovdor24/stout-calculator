/**
 * Распознавание планов этажей — вторая специальность вкладки «3. Распознать
 * смету».
 *
 * Смета и план — разные документы с разным результатом: из сметы выходят
 * позиции с артикулами, из плана — помещения для расчёта по комнатам
 * (название, площадь, этаж, окна, наружные стены). Поэтому у плана свои
 * правила для модели, свой экран проверки и свой перенос — в state.rooms
 * подробного расчёта, а не в userAddedEq.
 *
 * Общее с распознаванием сметы берётся из RecognizeUI как есть: загрузка и
 * подготовка снимков, запрос к модели с перебором и ожиданием (askModel),
 * починка JSON (parseModelJson), индикатор хода, отметки на миниатюрах,
 * лимит запросов и архив. Здесь только то, что относится к плану.
 *
 * Как сюда попадают: либо монтажник сам выбрал «План этажа» на экране
 * загрузки, либо модель, разбирая лист по правилам сметы, ответила
 * {"docKind":"floor_plan"} — тогда RecognizeUI сам переключается сюда.
 */

const RecognizePlan = {

    CACHE_KEY: 'rec_plans_v1',
    CACHE_MAX: 40,

    /**
     * Границы высоты потолка — те же, что у ползунков inp_h1/inp_h2 в
     * index.html. Прочитанное с листа «H=2580» ниже нижней границы, и
     * ползунок такое значение не покажет; ужимаем к границе.
     */
    H_MIN: 2.7,
    H_MAX: 5.0,

    _rows: [],       // помещения на экране проверки, они же правятся
    _sheets: [],     // сведения по листам: этаж, потолок, итог экспликации
    _warning: '',    // что не прочиталось — показывается над таблицей
    _undo: null,     // снимок комнат расчёта до применения — для отката
    _calls: 0,       // сколько запросов стоило это распознавание
    _fromCache: 0,

    reset() {
        this._rows = [];
        this._sheets = [];
        this._warning = '';
        this._calls = 0;
        this._fromCache = 0;
    },

    /** Ответ модели — про план, а не про смету. */
    isPlanResult(parsed) {
        if (!parsed || typeof parsed !== 'object') return false;
        if (parsed.docKind === 'floor_plan') return true;
        return Array.isArray(parsed.rooms) && parsed.rooms.length > 0
            && !(Array.isArray(parsed.items) && parsed.items.length);
    },

    // ------------------------------------------------------------------
    // Память по листам — как у сметы (RecognizeUI.rememberSheet), но своя:
    // разбор по правилам плана и по правилам сметы — разные ответы на один и
    // тот же снимок, и класть их в одну память нельзя.
    // ------------------------------------------------------------------

    promptVersion() {
        if (this._promptV) return this._promptV;
        const s = String(typeof FLOOR_PLAN_PROMPT !== 'undefined' ? FLOOR_PLAN_PROMPT : '');
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        this._promptV = String(h);
        return this._promptV;
    },

    readCache() {
        try {
            const raw = localStorage.getItem(this.CACHE_KEY);
            const data = raw ? JSON.parse(raw) : null;
            return (data && typeof data === 'object') ? data : {};
        } catch (e) { return {}; }
    },

    cached(b64) {
        const key = RecognizeUI.sheetKey(b64);
        if (!key) return null;
        const rec = this.readCache()[key];
        if (!rec || rec.v !== this.promptVersion() || !rec.data) return null;
        return rec.data;
    },

    remember(b64, parsed) {
        const key = RecognizeUI.sheetKey(b64);
        if (!key || !parsed || !Array.isArray(parsed.rooms)) return;
        try {
            const all = this.readCache();
            all[key] = { v: this.promptVersion(), at: Date.now(), data: parsed };
            const keys = Object.keys(all).sort((a, b) => (all[b].at || 0) - (all[a].at || 0));
            for (const k of keys.slice(this.CACHE_MAX)) delete all[k];
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(all));
        } catch (e) {
            try { localStorage.removeItem(this.CACHE_KEY); } catch (e2) { /* память необязательна */ }
        }
    },

    // ------------------------------------------------------------------
    // Разбор листов
    // ------------------------------------------------------------------

    /**
     * Номер этажа по имени файла: «1 этаж.pdf», «План 2-го этажа.jpg»,
     * «Цоколь.png». Файлы с планами почти всегда так и названы, а на самом
     * листе подпись этажа бывает мелкой или её нет вовсе.
     */
    floorHint(name) {
        const s = String(name || '').toLowerCase();
        if (!s) return null;
        // Страница многостраничного PDF: имя файла описывает весь документ
        // («Дом 2 этажа.pdf»), а не эту страницу.
        if (/стр\./.test(s)) return null;
        if (/подвал|цокол|техподпол/.test(s)) return 0;
        if (/мансард|чердак/.test(s)) return 2;
        let m = s.match(/(?:^|[^\d])(\d)\s*(?:-?\s*(?:й|го|ый|ой|ий))?\s*эт/);
        if (m) return +m[1];
        // \w в JS кириллицу не видит — буквы перечисляем явно.
        m = s.match(/эт[а-яё]*[\s._-]*(\d)(?!\d)/);
        if (m) return +m[1];
        if (/перв/.test(s)) return 1;
        if (/втор/.test(s)) return 2;
        if (/трет/.test(s)) return 3;
        return null;
    },

    /** Этаж расчёта: калькулятор знает только первый и второй. */
    calcFloor(raw) {
        const n = parseInt(raw, 10);
        if (isNaN(n)) return 1;
        return n >= 2 ? 2 : 1;
    },

    num(v) {
        if (v === null || v === undefined || v === '') return null;
        const n = parseFloat(String(v).replace(',', '.').replace(/[^\d.\-]/g, ''));
        return isNaN(n) ? null : n;
    },

    /**
     * Название — с большой буквы и без хвостов. Модель иногда возвращает
     * «спальня» или «Спальня 8,2 м2» — площадь у нас в своей колонке.
     */
    cleanName(s) {
        let n = String(s || '').replace(/\s+/g, ' ').trim();
        n = n.replace(/\s*[\d.,]+\s*(м²|м2|кв\.?\s*м|m2)\s*$/i, '').trim();
        // Номер помещения, прилипший к названию («101 Спальня», «3. Кухня»).
        n = n.replace(/^\d{1,3}[.)]?\s+(?=[^\d])/, '').trim();
        if (!n) return 'Помещение';
        return n.charAt(0).toUpperCase() + n.slice(1);
    },

    /** Один разобранный лист -> сведения о листе и строки помещений. */
    normalizeSheet(parsed, i, fileName, sheetsTotal) {
        const hint = this.floorHint(fileName);
        let raw = this.num(parsed.floor);
        if (raw === null) raw = hint;
        // Этаж не подписан нигде: у одного листа это первый этаж, у пачки —
        // порядок листов. Монтажник поправит в шапке листа.
        let floorGuessed = false;
        if (raw === null) { raw = sheetsTotal > 1 ? i + 1 : 1; floorGuessed = true; }
        raw = Math.round(raw);

        const ceilingH = this.num(parsed.ceilingH);
        const sheet = {
            i,
            name: fileName || '',
            label: parsed.floorLabel ? String(parsed.floorLabel).trim() : '',
            floorRaw: raw,
            floor: this.calcFloor(raw),
            floorGuessed,
            ceilingH: (ceilingH > 1.8 && ceilingH < 8) ? Math.round(ceilingH * 100) / 100 : null,
            totalArea: this.num(parsed.totalArea),
            unclear: Array.isArray(parsed.unclear) ? parsed.unclear.map(String).filter(Boolean) : [],
        };

        const rows = (Array.isArray(parsed.rooms) ? parsed.rooms : []).map(r => {
            r = r || {};
            let area = this.num(r.area);
            const w = this.num(r.w), l = this.num(r.l);
            let areaSrc = r.areaSrc || null;
            if (!(area > 0) && w > 0 && l > 0) { area = w * l; areaSrc = 'dims'; }
            if (area > 0) area = Math.round(area * 100) / 100; else area = null;

            const rFloorRaw = this.num(r.floor);
            const ownFloor = rFloorRaw !== null && Math.round(rFloorRaw) !== raw;
            const fr = ownFloor ? Math.round(rFloorRaw) : raw;

            let windows = this.num(r.windows);
            windows = windows === null ? null : Math.max(0, Math.round(windows));
            let pan = this.num(r.panoramic);
            pan = pan === null ? 0 : Math.max(0, Math.round(pan));
            if (windows !== null) pan = Math.min(pan, windows);

            let outer = this.num(r.outerWalls);
            outer = (outer !== null && outer >= 1 && outer <= 3) ? Math.round(outer) : null;

            const orient = /^(N|NE|E|SE|S|SW|W|NW)$/.test(String(r.orient || '')) ? r.orient : null;
            const heated = r.heated !== false;
            const conf = this.num(r.confidence);

            return {
                _sheet: i,
                _sel: heated && area > 0,
                num: r.num ? String(r.num).trim() : '',
                name: this.cleanName(r.name),
                nameGuessed: !!r.nameGuessed,
                area,
                areaSrc,
                dims: (w > 0 && l > 0) ? `${this.fmt(w)}×${this.fmt(l)}` : '',
                windows,
                panoramic: pan,
                outerWalls: outer,
                orient,
                doubleHeight: !!r.doubleHeight,
                heated,
                floorRaw: fr,
                floor: this.calcFloor(fr),
                ownFloor,
                confidence: conf === null ? 1 : conf,
                note: r.note ? String(r.note).trim() : '',
            };
        });

        // Безымянные помещения нумеруем, иначе в расчёте будет пять строк
        // «Помещение» подряд и не понять, какая из них какая.
        const generic = rows.filter(r => /^помещение$/i.test(r.name));
        if (generic.length > 1) generic.forEach((r, k) => { r.name = `Помещение ${k + 1}`; });

        return { sheet, rows };
    },

    fmt(n) {
        return (Math.round(n * 100) / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    },

    /**
     * Полистный разбор планов. Каждый лист — свой запрос, как у сметы;
     * упавший лист не отменяет остальные.
     *
     * Возвращает { sheets, rows, warnings, failed, quotaHit }.
     */
    async run(imgs, names) {
        const ui = RecognizeUI;
        const sheets = [], rows = [], warnings = [], failed = [];
        let quotaHit = false;
        this._calls = 0;
        this._fromCache = 0;
        ui._sheetsTotal = imgs.length;
        ui._sheetsDone = 0;
        ui._itemsSoFar = 0;

        for (let i = 0; i < imgs.length; i++) {
            const name = names && names[i] ? names[i] : '';
            try {
                let parsed = this.cached(imgs[i]);
                if (parsed) {
                    this._fromCache++;
                    ui.setStatus(`Лист ${i + 1} из ${imgs.length} — из памяти`);
                } else {
                    ui.setStatus(imgs.length > 1
                        ? `Читаю план, лист ${i + 1} из ${imgs.length}…`
                        : 'Читаю план этажа…');
                    const before = ui._apiCalls || 0;
                    const data = await ui.askModel([
                        { text: 'Разбери этот план этажа по правилам. ' +
                                (imgs.length > 1 ? `Это лист ${i + 1} из ${imgs.length}. ` : '') +
                                (name ? `Имя файла: «${name.replace(/[«»"]/g, '')}» — оно может подсказывать номер этажа. ` : '') +
                                'Верни только JSON.' },
                        { inline_data: { mime_type: 'image/jpeg', data: imgs[i] } },
                    ], FLOOR_PLAN_PROMPT);
                    this._calls += (ui._apiCalls || 0) - before;
                    const cand = data?.candidates?.[0];
                    const text = cand?.content?.parts?.[0]?.text;
                    if (!text) throw new Error('пустой ответ');
                    parsed = ui.parseModelJson(text, cand.finishReason);
                    if (ui._parseWarning) warnings.push(`лист ${i + 1}: ${ui._parseWarning}`);
                    if (!ui._parseWarning && this.isPlanResult(parsed)) this.remember(imgs[i], parsed);
                }

                if (!this.isPlanResult(parsed)) {
                    // Лист не план: счёт, фасад, фото. Отдельная ошибка на весь
                    // разбор, только если планов не нашлось вовсе.
                    failed.push(i + 1);
                    ui.markSheet(i, 'fail');
                    warnings.push(`лист ${i + 1}: это не план этажа — помещений на нём не нашлось`);
                    continue;
                }

                const n = this.normalizeSheet(parsed, i, name, imgs.length);
                sheets.push(n.sheet);
                rows.push(...n.rows);
                if (!n.rows.length) warnings.push(`лист ${i + 1}: помещений не прочитано`);

                ui._sheetsDone++;
                ui._itemsSoFar = rows.length;
                ui.markSheet(i, 'done');
            } catch (e) {
                failed.push(i + 1);
                ui.markSheet(i, 'fail');
                if (e.quota) {
                    quotaHit = true;
                    for (let k = i + 1; k < imgs.length; k++) ui.markSheet(k, 'fail');
                    warnings.push(e.message);
                    break;
                }
                warnings.push(`лист ${i + 1} не прочитан: ${ui.cleanError(e.message).split('\n')[0]}`);
            }
        }

        if (!rows.length) {
            throw new Error(sheets.length
                ? 'На плане не удалось прочитать ни одного помещения.\n' + warnings.join('\n')
                : (failed.length === imgs.length && !quotaHit && warnings.every(w => /не план этажа/.test(w))
                    ? 'На листе не нашлось ни сметы, ни плана этажа. Нужен план: чертёж, скан или эскиз с помещениями.'
                    : 'Не удалось прочитать план.\n' + warnings.join('\n')));
        }
        ui.setStatus('');
        return { sheets, rows, warnings, failed, quotaHit };
    },

    // ------------------------------------------------------------------
    // Шаг 2 — проверка помещений
    // ------------------------------------------------------------------

    startReview(res) {
        this._sheets = res.sheets || [];
        this._rows = res.rows || [];
        this._warning = (res.warnings || []).join(' · ');
        RecognizeUI.progressStop();
        RecognizeUI.step(2);
        RecognizeUI.setHead('plan');
        this.renderReview();
    },

    esc(s) {
        return String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    },

    /** Что не так со строкой — коротко, для колонки примечаний. */
    rowNotes(r) {
        const notes = [];
        if (!(r.area > 0)) notes.push('площадь не прочитана — впишите');
        else if (r.areaSrc === 'estimate') notes.push('площадь оценена по пропорциям — проверьте');
        else if (r.areaSrc === 'dims' && r.dims) notes.push(`по размерам ${r.dims}`);
        if (r.nameGuessed) notes.push('название предположено по обстановке');
        if (!r.heated) notes.push('неотапливаемое');
        if (r.doubleHeight) notes.push('второй свет');
        if (r.ownFloor) notes.push(`на плане это ${r.floorRaw}-й уровень`);
        if (r.windows === null) notes.push('окна не разобраны — поставлено 1');
        if (r.confidence < 0.5 && r.area > 0 && r.areaSrc !== 'estimate') notes.push('прочитано неуверенно');
        if (r.note) notes.push(r.note);
        return notes;
    },

    floorTitle(s) {
        if (s.label) return s.label;
        if (s.floorRaw === 0) return 'подвал / цоколь';
        return `${s.floorRaw}-й этаж${s.floorGuessed ? ' (этаж не подписан)' : ''}`;
    },

    renderReview() {
        const esc = this.esc;
        const fmt = (n) => this.fmt(n);
        const cell = v => (v === null || v === undefined) ? '' : v;

        const chosen = this._rows.filter(r => r._sel);
        const chosenArea = chosen.reduce((s, r) => s + (r.area > 0 ? r.area : 0), 0);
        const noArea = chosen.filter(r => !(r.area > 0)).length;
        const maxA = (typeof app !== 'undefined' && app.MAX_AREA) || 360;

        // Сводка над таблицей: сколько взято и укладываемся ли в предел расчёта.
        let sumCls = 'ok', sumIco = '✓', sumText, sumSub = '';
        if (!chosen.length) {
            sumCls = 'warn'; sumIco = '!';
            sumText = 'Ни одно помещение не отмечено';
            sumSub = 'Отметьте галочками помещения, которые пойдут в расчёт по комнатам.';
        } else if (chosenArea > maxA) {
            sumCls = 'bad'; sumIco = '!';
            sumText = `Отмечено ${chosen.length} ${RecognizeUI.plural(chosen.length, 'помещение', 'помещения', 'помещений')} · ${fmt(chosenArea)} м²`;
            sumSub = `Расчёт рассчитан максимум на ${maxA} м² — снимите часть помещений (например, подвал или гараж) или уменьшите площади.`;
        } else {
            sumText = `Отмечено ${chosen.length} ${RecognizeUI.plural(chosen.length, 'помещение', 'помещения', 'помещений')} · ${fmt(chosenArea)} м²`;
            const f1 = chosen.filter(r => r.floor !== 2).length, f2 = chosen.length - f1;
            sumSub = (f2 ? `1-й этаж: ${f1}, 2-й этаж: ${f2}. ` : '') +
                (noArea ? `У ${noArea} ${RecognizeUI.plural(noArea, 'помещения', 'помещений', 'помещений')} нет площади — впишите её или снимите отметку. `
                    : 'Проверьте названия, площади и окна — по ним считаются теплопотери и подбираются приборы.');
            if (noArea) sumCls = 'warn', sumIco = '!';
        }

        const floorOpt = (v, cur) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${v}-й</option>`;
        const outerOpt = (v, t, cur) => `<option value="${v}" ${String(cur ?? '') === String(v) ? 'selected' : ''}>${t}</option>`;

        const body = this._sheets.map(s => {
            const sRows = this._rows.map((r, n) => ({ r, n })).filter(x => x.r._sheet === s.i);
            const readArea = sRows.reduce((a, x) => a + (x.r.area > 0 ? x.r.area : 0), 0);

            // Сверка с итогом экспликации — как сверка с итогом счёта у сметы:
            // расхождение значит потерянное или лишнее помещение.
            let check = '';
            if (s.totalArea > 0) {
                const d = readArea - s.totalArea;
                check = Math.abs(d) < 0.5
                    ? `<span class="rec-plan-ok">экспликация ${fmt(s.totalArea)} м² — прочитано столько же ✓</span>`
                    : `<span class="rec-plan-warn">экспликация ${fmt(s.totalArea)} м², прочитано ${fmt(readArea)} м² — ${
                        d < 0 ? 'возможно, помещение пропущено' : 'возможно, помещение задвоено'}</span>`;
            }

            const head = `<tr class="rec-plan-group"><td colspan="10">
                <div class="rec-plan-group-row">
                  <b>${this._sheets.length > 1 ? `Лист ${s.i + 1} · ` : ''}${esc(this.floorTitle(s))}</b>
                  ${s.name ? `<span class="rec-art">${esc(s.name)}</span>` : ''}
                  <label>Этаж в расчёте:
                    <select class="rec-f rec-plan-sel" onchange="RecognizePlan.setSheetFloor(${s.i}, this.value)">
                      ${floorOpt(1, s.floor)}${floorOpt(2, s.floor)}
                    </select></label>
                  <label>Потолок:
                    <input class="rec-f rec-plan-h" type="number" step="0.1" min="${this.H_MIN}" max="${this.H_MAX}"
                           value="${s.ceilingH ? esc(s.ceilingH) : ''}" placeholder="как в расчёте"
                           onchange="RecognizePlan.setSheetH(${s.i}, this.value)"> м</label>
                  ${check}
                  ${sRows.length ? '' : '<span class="rec-plan-warn">помещений не прочитано</span>'}
                </div>
                ${s.unclear.length ? `<div class="rec-art">Не разобрано: ${esc(s.unclear.join('; '))}</div>` : ''}
              </td></tr>`;

            const trs = sRows.map(({ r, n }) => {
                const notes = this.rowNotes(r);
                const cls = !(r.area > 0) ? 'rec-nomatch'
                    : (r.areaSrc === 'estimate' ? 'rec-plan-est' : '');
                return `<tr class="${cls}">
                  <td><input type="checkbox" ${r._sel ? 'checked' : ''}
                             onchange="RecognizePlan.sel(${n}, this.checked)"></td>
                  <td class="rec-raw">${esc(r.num)}</td>
                  <td><input class="rec-f" value="${esc(r.name)}"
                             onchange="RecognizePlan.set(${n},'name',this.value)"></td>
                  <td><input class="rec-f rec-f-s" type="number" step="0.1" min="0" value="${esc(cell(r.area))}"
                             onchange="RecognizePlan.set(${n},'area',this.value)"></td>
                  <td><input class="rec-f rec-f-s" type="number" step="1" min="0" value="${r.windows === null ? 1 : r.windows}"
                             onchange="RecognizePlan.set(${n},'windows',this.value)"></td>
                  <td><input class="rec-f rec-f-s" type="number" step="1" min="0" value="${r.panoramic}"
                             onchange="RecognizePlan.set(${n},'panoramic',this.value)"></td>
                  <td><select class="rec-f" onchange="RecognizePlan.set(${n},'outerWalls',this.value)">
                        ${outerOpt('', 'авто', r.outerWalls)}${outerOpt(1, '1', r.outerWalls)}${outerOpt(2, '2', r.outerWalls)}${outerOpt(3, '3', r.outerWalls)}
                      </select></td>
                  <td><select class="rec-f" onchange="RecognizePlan.set(${n},'floor',this.value)">
                        ${floorOpt(1, r.floor)}${floorOpt(2, r.floor)}
                      </select></td>
                  <td class="rec-plan-notes">${notes.map(t => `<div>${esc(t)}</div>`).join('')}</td>
                  <td class="rec-acts"><button onclick="RecognizePlan.del(${n})" title="Убрать строку">✕</button></td>
                </tr>`;
            }).join('');

            return head + trs;
        }).join('');

        const st = (typeof app !== 'undefined' && app.state) || {};
        const hasRooms = !!(st.detailedRooms && Array.isArray(st.rooms) && st.rooms.length);
        const disabled = (!chosen.length || noArea || chosenArea > maxA) ? 'disabled' : '';

        document.getElementById('rec_body').innerHTML = `
          ${this._warning ? `<div class="rec-err">${esc(this._warning)}</div>` : ''}
          <div class="rec-tcheck ${sumCls}">
            <div class="rec-tcheck-ico">${sumIco}</div>
            <div><div>${sumText}</div><div class="rec-tcheck-sub">${sumSub}</div></div>
          </div>
          <div class="rec-toolbar">
            <button class="rec-btn-g" onclick="RecognizePlan.selAll(true)">Отметить все</button>
            <button class="rec-btn-g" onclick="RecognizePlan.selAll(false)">Снять все</button>
            <button class="rec-btn-g" onclick="RecognizePlan.selHeated()">Только отапливаемые</button>
            <div class="rec-tb-right">
              <button class="rec-btn-g" onclick="RecognizeUI.resetAll()">↩ Другой файл</button>
            </div>
          </div>
          <div class="rec-tablewrap">
            <table class="rec-table rec-plan-table">
              <colgroup><col style="width:30px"><col style="width:46px"><col style="width:190px">
                <col style="width:92px"><col style="width:62px"><col style="width:84px">
                <col style="width:92px"><col style="width:66px"><col><col style="width:34px"></colgroup>
              <thead><tr>
                <th><input type="checkbox" ${chosen.length && chosen.length === this._rows.length ? 'checked' : ''}
                           title="Отметить все / снять все"
                           onchange="RecognizePlan.selAll(this.checked)"></th>
                <th>№</th><th>Помещение</th><th>Площадь, м²</th><th>Окон</th>
                <th title="Витражи от пола, окна выше 2 м или шире 2,5 м — под них подбирается конвектор">Из них панорамных</th>
                <th title="Сколько стен помещения выходят на улицу — влияет на теплопотери">Наружных стен</th>
                <th>Этаж</th><th>Примечание</th><th></th>
              </tr></thead>
              <tbody>${body}</tbody>
            </table>
          </div>
          <div class="rec-foot">
            <div class="rec-total">В расчёт: <b>${chosen.length}</b> ${RecognizeUI.plural(chosen.length, 'помещение', 'помещения', 'помещений')}, ${fmt(chosenArea)} м²</div>
            ${hasRooms
                ? `<button class="calc-dialog-btn calc-dialog-btn-cancel" ${disabled} onclick="RecognizePlan.apply('new')">Заменить комнаты расчёта</button>
                   <button class="calc-dialog-btn calc-dialog-btn-confirm" ${disabled} onclick="RecognizePlan.apply('add')">Добавить к комнатам</button>`
                : `<button class="calc-dialog-btn calc-dialog-btn-confirm" ${disabled} onclick="RecognizePlan.apply('new')">В расчёт по комнатам</button>`}
          </div>`;
    },

    // ------------------------------------------------------------------
    // Правки на экране проверки
    // ------------------------------------------------------------------

    set(i, field, val) {
        const r = this._rows[i];
        if (!r) return;
        if (field === 'name') r.name = this.cleanName(val);
        else if (field === 'area') {
            const n = this.num(val);
            r.area = n > 0 ? Math.round(n * 100) / 100 : null;
            // Вписанная руками площадь — уже не оценка и не «не прочитано».
            r.areaSrc = r.area ? 'manual' : r.areaSrc;
            if (r.area > 0 && r.heated && !r._sel) r._sel = true;
        }
        else if (field === 'windows') {
            const n = this.num(val);
            r.windows = n === null ? 1 : Math.max(0, Math.round(n));
            r.panoramic = Math.min(r.panoramic, r.windows);
        }
        else if (field === 'panoramic') {
            const n = this.num(val);
            r.panoramic = Math.max(0, Math.round(n || 0));
            if (r.windows === null) r.windows = 1;
            if (r.panoramic > r.windows) r.windows = r.panoramic;
        }
        else if (field === 'outerWalls') {
            const n = parseInt(val, 10);
            r.outerWalls = (n >= 1 && n <= 3) ? n : null;
        }
        else if (field === 'floor') {
            r.floor = this.calcFloor(val);
            r.floorRaw = r.floor;
            r.ownFloor = false;
        }
        this.renderReview();
    },

    sel(i, v) { if (this._rows[i]) { this._rows[i]._sel = !!v; this.renderReview(); } },
    selAll(v) { this._rows.forEach(r => r._sel = !!v); this.renderReview(); },
    selHeated() { this._rows.forEach(r => r._sel = r.heated && r.area > 0); this.renderReview(); },
    del(i) { this._rows.splice(i, 1); this.renderReview(); },

    /** Этаж всем помещениям листа разом: один лист — один этаж. */
    setSheetFloor(si, val) {
        const s = this._sheets.find(x => x.i === si);
        if (!s) return;
        s.floor = this.calcFloor(val);
        s.floorRaw = s.floor;
        s.floorGuessed = false;
        this._rows.forEach(r => {
            if (r._sheet !== si || r.ownFloor) return;
            r.floor = s.floor;
            r.floorRaw = s.floor;
        });
        this.renderReview();
    },

    setSheetH(si, val) {
        const s = this._sheets.find(x => x.i === si);
        if (!s) return;
        const n = this.num(val);
        s.ceilingH = (n > 1.8 && n < 8) ? Math.round(n * 100) / 100 : null;
        this.renderReview();
    },

    // ------------------------------------------------------------------
    // Шаг 3 — в расчёт по комнатам
    // ------------------------------------------------------------------

    /**
     * Комната калькулятора из строки проверки. Поля те же, что создаёт
     * app.addRoom, плюс уточнения, которые есть только у плана: число
     * наружных стен, сторона света, второй свет.
     */
    toCalcRoom(r, id, st) {
        const win = r.windows === null ? 1 : r.windows;
        const width = (typeof app.getDefaultWindowWidth === 'function')
            ? app.getDefaultWindowWidth(r.area) : 1.5;
        const windows = [];
        for (let k = 0; k < win; k++) {
            windows.push({ id: id + k + 1, width, isPan: k < r.panoramic });
        }
        // Радиаторы — всегда, тёплый пол — если он включён в объекте и уместен в
        // помещении (санузел, кухня, жилая — да, кладовая и котельная — нет).
        const sys = ['rad'];
        const wantsTp = (st.systems || []).includes('tp') &&
            (typeof app.roomWantsUfh !== 'function' || app.roomWantsUfh({ name: r.name }));
        if (wantsTp) sys.push('tp');

        const room = { id, name: r.name, area: r.area, floor: r.floor, sys, windows };
        if (r.outerWalls) room.outerWalls = r.outerWalls;
        if (r.orient) room.orient = r.orient;
        if (r.doubleHeight) room.doubleHeight = true;
        return room;
    },

    async apply(mode) {
        if (typeof app === 'undefined') return;
        const st = app.state;
        const chosen = this._rows.filter(r => r._sel);
        if (!chosen.length) { app.alert('Отметьте хотя бы одно помещение.'); return; }

        const noArea = chosen.filter(r => !(r.area > 0));
        if (noArea.length) {
            app.alert('У отмеченных помещений нет площади: ' +
                noArea.map(r => r.name).join(', ') + '. Впишите площадь или снимите отметку.');
            return;
        }

        const hasRooms = !!(st.detailedRooms && Array.isArray(st.rooms) && st.rooms.length);
        const keep = (mode === 'add' && hasRooms) ? st.rooms : [];
        const total = keep.reduce((s, r) => s + (parseFloat(r.area) || 0), 0) +
            chosen.reduce((s, r) => s + r.area, 0);
        const maxA = app.MAX_AREA || 360;
        // Расчёт рассчитан максимум на MAX_AREA, и syncRoomsToState при переборе
        // молча ужал бы ВСЕ комнаты пропорционально — площади разошлись бы с
        // планом. Не применяем.
        if (total > maxA) {
            app.alert(`С этими помещениями площадь дома выходит ${this.fmt(total)} м², а расчёт рассчитан максимум на ${maxA} м². Снимите часть помещений или уменьшите площади.`);
            return;
        }

        if (mode === 'new' && hasRooms) {
            const ok = await app.confirm('Комнаты текущего расчёта будут заменены помещениями с плана. Продолжить?');
            if (!ok) return;
        }

        // Расчёт по комнатам требует входа. Проверяем до того, как трогать
        // состояние: окно входа при полуперенесённых комнатах — худший вариант.
        if (!st.detailedRooms && typeof app.checkAccess === 'function' && !app.checkAccess('pro')) return;

        RecognizeUI.step(3);
        this.archive(mode, chosen);

        // Снимок для отката: перенос трогает комнаты, этажность и высоты, и
        // откатывать это по одному полю нельзя.
        this._undo = JSON.parse(JSON.stringify({
            rooms: st.rooms || [], floors: st.floors, h1: st.h1, h2: st.h2,
            detailedRooms: st.detailedRooms, area: st.area, tp1: st.tp1, tp2: st.tp2,
            win: st.win, systems: st.systems || [], ufhZones: st.ufhZones,
            showDetailedRoomsPanel: st.showDetailedRoomsPanel,
        }));

        const base = Date.now();
        const rooms = chosen.map((r, i) => this.toCalcRoom(r, base + i * 1000, st));

        st.rooms = keep.concat(rooms);
        st.floors = st.rooms.some(r => r.floor === 2) ? 2 : 1;
        if (st.floors === 1) st.tp2 = 0;

        // Высота потолка с листа — в высоту этажа расчёта. Лист подвала,
        // попавший на первый этаж, не должен перебивать лист самого первого
        // этажа: предпочитаем лист, чей номер совпадает с этажом расчёта.
        [1, 2].forEach(f => {
            const used = this._sheets.filter(s => s.ceilingH > 0 &&
                chosen.some(r => r._sheet === s.i && r.floor === f));
            if (!used.length) return;
            const s = used.find(x => x.floorRaw === f) || used[0];
            const h = Math.min(this.H_MAX, Math.max(this.H_MIN, Math.round(s.ceilingH * 10) / 10));
            if (f === 1) st.h1 = h; else st.h2 = h;
        });

        // Площадь объекта — по комнатам: иначе включение подробного режима
        // сгенерировало бы шаблонные комнаты поверх наших.
        st.area = Math.round(total * 10) / 10;

        if (!st.detailedRooms) {
            app.toggleDetailedRooms(true);
            if (!st.detailedRooms) {
                // Не включился — нет входа. Возвращаем как было.
                this.undoApply(true);
                return;
            }
        }
        // Второй свет: высоту помещения считаем от высоты этажа, как это делает
        // toggleRoomDoubleHeight — но уже после того, как известны h1/h2.
        st.rooms.forEach(r => {
            if (r.doubleHeight && !r.customHeight && typeof app.getRoomHeightBounds === 'function') {
                const b = app.getRoomHeightBounds(r);
                r.customHeight = Math.min(b.hMax, Math.max(b.hMin, Math.round(b.normalH * 2 * 10) / 10));
            }
        });
        st.showDetailedRoomsPanel = true;
        const chkPanel = document.getElementById('chk_detailed_rooms_toggle');
        if (chkPanel) chkPanel.checked = true;

        app.syncRoomsToState();
        if (typeof app.autoCalcZones === 'function') app.autoCalcZones();
        app.syncUI();
        app.render();
        if (typeof app.saveState === 'function') app.saveState();

        // Вкладка должна открыться чистой в следующий раз.
        RecognizeUI.dropDraft();
        RecognizeUI.clearFileState();
        RecognizeUI._rows = [];
        this.reset();
        const panel = document.getElementById('panel_recognize');
        if (panel) panel.innerHTML = '';
        RecognizeUI.close();
        this.showRooms();

        const f2 = rooms.filter(r => r.floor === 2).length;
        const parts = [`В расчёт ${mode === 'add' ? 'добавлено' : 'перенесено'} помещений: ${rooms.length}` +
            (f2 ? ` (1-й этаж: ${rooms.length - f2}, 2-й этаж: ${f2})` : '')];
        parts.push(`Площадь по комнатам: ${this.fmt(st.area)} м²`);
        const hs = this._undo && (this._undo.h1 !== st.h1 || this._undo.h2 !== st.h2);
        if (hs) parts.push(`Высота потолка взята с плана: ${st.h1}${st.floors === 2 ? ' / ' + st.h2 : ''} м`);
        app.alert(parts.join('\n') +
            '\n\nПроверьте окна и системы отопления в карточках комнат. ' +
            'Вернуть комнаты как было — кнопка «↶ Вернуть комнаты» во вкладке распознавания.');
    },

    /** Показать карточки комнат: расчёт по комнатам открыт, лента у первой карточки. */
    showRooms() {
        try {
            if (app.isMobileLayout && app.isMobileLayout() && app.state.mobTab !== 'inputs') {
                app.state.mobTab = 'inputs';
                if (typeof app.syncMobileUI === 'function') app.syncMobileUI();
            }
            const blk = document.getElementById('blk_detailed_calc');
            if (blk) blk.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) { /* прокрутка необязательна */ }
    },

    /** Откат переноса: комнаты, этажность и высоты — как до применения. */
    async undoApply(silent) {
        if (!this._undo || typeof app === 'undefined') return;
        if (!silent && !await app.confirm('Вернуть комнаты расчёта такими, какими они были до переноса с плана?')) return;
        const u = this._undo;
        const st = app.state;
        st.rooms = u.rooms;
        st.floors = u.floors;
        st.h1 = u.h1; st.h2 = u.h2;
        st.detailedRooms = u.detailedRooms;
        st.area = u.area; st.tp1 = u.tp1; st.tp2 = u.tp2; st.win = u.win;
        st.systems = u.systems; st.ufhZones = u.ufhZones;
        st.showDetailedRoomsPanel = u.showDetailedRoomsPanel;
        this._undo = null;
        const chkD = document.getElementById('chk_detailed_rooms');
        if (chkD) chkD.checked = !!st.detailedRooms;
        const chkPanel = document.getElementById('chk_detailed_rooms_toggle');
        if (chkPanel) chkPanel.checked = !!st.showDetailedRoomsPanel;
        app.syncRoomsToState();
        if (typeof app.autoCalcZones === 'function') app.autoCalcZones();
        app.syncUI();
        app.render();
        if (typeof app.saveState === 'function') app.saveState();
        const u2 = document.getElementById('rec_undo_plan');
        if (u2) u2.style.display = 'none';
        if (!silent) app.alert('Комнаты расчёта возвращены.');
    },

    /**
     * Архив на Beget — тот же, что у смет: по нему считается месячный лимит
     * запросов, и распознавание плана стоит их так же. Имя файла помечаем
     * словом «план», чтобы в админке такая запись не выглядела сметой без
     * единой подобранной позиции.
     */
    async archive(mode, chosen) {
        try {
            const ui = RecognizeUI;
            const urow = (typeof app.accessUserRow === 'function')
                ? (app.accessUserRow() || {}) : (app._currentUserRow || {});
            const payload = {
                user: ui.userKey(),
                region: urow.region || '',
                distributorId: urow.distributor_id || (app.state && app.state.distributorId) || '',
                source: 'floor_plan',
                fileName: 'План этажа · ' + (ui._fileName || ''),
                mode: 'plan-' + mode,
                counts: {
                    recognized: this._rows.length,
                    applied: chosen.length,
                    replaced: 0, fromMemory: 0, noMatch: 0,
                },
                calcId: app.state.calc_id || null,
                projectName: app.state.projectName || '',
                calls: this._calls || 0,
                fromCache: this._fromCache || 0,
                sheets: this._sheets.map(s => ({
                    i: s.i, label: s.label, floor: s.floorRaw, ceilingH: s.ceilingH, totalArea: s.totalArea,
                })),
                result: this._rows.map(r => ({
                    num: r.num, name: r.name, area: r.area, areaSrc: r.areaSrc, floor: r.floor,
                    windows: r.windows, panoramic: r.panoramic, outerWalls: r.outerWalls,
                    heated: r.heated, applied: !!r._sel,
                })),
            };
            const shot = ui._img || (ui._imgs && ui._imgs[0]);
            if (shot) { payload.file = true; payload.fileExt = 'jpg'; payload.fileData = shot; }
            await fetch('https://proxy.heatcalc.ru/recognize_archive.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            console.warn('План не заархивирован:', e.message);
        }
    },
};

/**
 * Правила разбора плана этажа. Каждое правило закрывает конкретную ошибку,
 * которую модель делает на реальных планах: печатных чертежах с экспликацией
 * и эскизах в клетку, где кроме названий и «12 м2» ничего нет.
 */
const FLOOR_PLAN_PROMPT = `Ты разбираешь ПЛАНЫ ЭТАЖЕЙ жилых домов и квартир (Россия): чертежи из проекта, сканы, фотографии и эскизы, нарисованные от руки на бумаге или в клетку. Цель — список помещений этажа для расчёта отопления: название, площадь, этаж, окна, наружные стены.

Верни СТРОГО JSON по схеме. Никакого текста вне JSON. Дробные числа пиши с точкой (13.77), без единиц измерения. Кавычки внутри строк не используй.

СХЕМА:
{
  "docKind": "floor_plan" | "other",
  "floorLabel": "как подписан этаж на листе (План 1-го этажа, Мансарда, Цокольный этаж) или null",
  "floor": число или null,
  "ceilingH": высота потолка в метрах или null,
  "hasTable": true | false,
  "totalArea": итог экспликации в м² или null,
  "rooms": [{
    "num": "101" или null,
    "name": "Спальня",
    "nameGuessed": false,
    "area": 13.77 или null,
    "areaSrc": "table" | "label" | "dims" | "estimate" | null,
    "w": 3.5 или null,
    "l": 4.0 или null,
    "windows": число или null,
    "panoramic": число,
    "outerWalls": 0 | 1 | 2 | 3 | null,
    "orient": "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | null,
    "doubleHeight": false,
    "heated": true,
    "floor": число или null,
    "confidence": 0.0-1.0,
    "note": "пояснение, если что-то неясно"
  }],
  "unclear": ["что не удалось прочитать"]
}

ПРАВИЛА:

1. НЕ ПЛАН. Если на изображении не план этажа (список материалов, счёт, фасад, разрез, схема отопления, фотография комнаты) — верни {"docKind":"other","rooms":[]} и больше ничего.

2. ЭТАЖ. Номер этажа бери из подписи листа: «План 1 этажа», «1-й этаж», «Первый этаж» -> 1; «второй», «2 эт.» -> 2; «подвал», «цокольный», «0 этаж» -> 0; «мансарда», «мансардный» -> этаж НАД верхним полным (в доме с одним этажом — 2, с двумя — 3). Номера помещений вида 101–114 означают первый этаж, 201–2xx — второй, 001–0xx — подвал. Имя файла в запросе — тоже подсказка («1 этаж.pdf»). Ничего этого нет -> floor=null, не угадывай.
   Если на ОДНОМ листе нарисовано несколько этажей или отдельным контуром показано помещение другого уровня («Мансарда 8,2 м2» поверх кухни) — у такого помещения проставь своё "floor", у остальных оставь null (возьмётся общий этаж листа).

3. ЭКСПЛИКАЦИЯ ВАЖНЕЕ ЧЕРТЕЖА. Если на листе есть таблица «Экспликация помещений» (№, наименование, площадь) — список помещений и площади бери из неё (areaSrc="table"), а чертёж используй для окон и наружных стен: помещение с номером на плане ищи по тому же номеру в таблице. Число строк таблицы = число помещений. Итог таблицы (например «177,87») верни в totalArea как напечатан. НЕ СКЛАДЫВАЙ площади сам: по итогу проверяется, все ли помещения прочитаны, и посчитанная тобой сумма эту проверку обесценивает. Итога нет -> null.

4. ПЛОЩАДЬ. Подписана в помещении («19,16 м2», «S=12», «12 кв.м») -> area, areaSrc="label". Подписаны только размеры помещения («4х3,5», «4000х3500» в миллиметрах, размерные цепочки вдоль стен) -> area = произведение в метрах, areaSrc="dims", w и l заполни. Есть только общие габариты дома, размеры по осям или сетка клеток — оцени площадь помещения по его доле в плане (или по клеткам, если известен размер клетки), areaSrc="estimate", confidence не выше 0.5. Не по чему оценить -> area=null. Запятая в числе — десятичный разделитель: «13,77» -> 13.77. Не путай площадь с номером помещения и с высотой (H=2700).

5. НАЗВАНИЕ. Пиши как подписано, раскрывая сокращения: «С/у», «сан.узел», «сануз.» -> «Санузел»; «Кух.» -> «Кухня»; «Гост.» -> «Гостиная»; «Спал.», «Сп.» -> «Спальня»; «Дет.» -> «Детская»; «Каб.» -> «Кабинет»; «Гард.» -> «Гардеробная»; «Кор.» -> «Коридор»; «Прих.» -> «Прихожая»; «Кот.» -> «Котельная»; «Терр.» -> «Терраса»; «Кл.», «Клад.» -> «Кладовая». Название с площадью в одной подписи («Спальня 8,2 м2») — в name только слово. Не подписано — предположи по обстановке и поставь nameGuessed=true: ванна или душ -> «Ванная»; унитаз и раковина без ванны -> «Санузел»; кровать -> «Спальня»; плита, мойка, кухонный гарнитур -> «Кухня»; диван, кресла, телевизор -> «Гостиная»; кухонный гарнитур и диван в одном помещении -> «Кухня-гостиная»; письменный стол -> «Кабинет»; автомобиль -> «Гараж»; котёл, бойлер -> «Котельная»; лестница и проходное помещение -> «Холл»; шкафы вдоль стен -> «Гардеробная»; помещение при входе -> «Прихожая». Обстановки нет и понять нельзя -> «Помещение».

6. ОКНА. Считай проёмы с остеклением в НАРУЖНЫХ стенах помещения: на чертеже это разрыв толстой стены с тонкими линиями рамы, на эскизе — двойная линия, разрыв в наружной стене или пометка «окно». Остеклённую дверь на террасу или балкон считай окном. Дверь в соседнее помещение — не окно; вентканалы, ниши и дымоходы — не окна. Угловое или составное окно считай одним. panoramic — сколько из этих окон панорамные: витраж от пола до потолка, окно выше 2 м или шире 2,5 м. Окон не видно и понять нельзя -> windows=null (не 0). Помещение внутри дома без наружных стен -> windows=0.

7. НАРУЖНЫЕ СТЕНЫ. outerWalls — сколько сторон помещения выходят на улицу (0–3). Стена к неотапливаемой террасе, крыльцу, холодной веранде или гаражу — тоже наружная. Не понятно по чертежу -> null.

8. СТОРОНА СВЕТА. orient заполняй ТОЛЬКО если на листе есть стрелка севера или роза ветров: румб, куда смотрит наружная стена помещения (у угловой — средний). Стрелки нет -> null: «верх листа» сам по себе не север.

9. ОТАПЛИВАЕМОСТЬ. heated=false у террас, крылец, балконов, лоджий, открытых веранд, навесов, холодных тамбуров и неотапливаемых чердаков — но в список их включи, решать будет монтажник. Гараж, котельная, кладовая, тамбур внутри тёплого контура — heated=true.

10. ВТОРОЙ СВЕТ. Пометки «второй свет», «2 света», «двусветное» — doubleHeight=true у этого помещения. Это не отдельное помещение.

11. ВЫСОТА ПОТОЛКА. Подпись «H=2700», «h=2,7», «Высота этажа 3,0 м» -> ceilingH в метрах (2.7). Несколько разных (H=2580 и H2=3000) — бери основную, остальное в unclear. Нет подписи -> null.

12. НЕ ВЫДУМЫВАЙ. Не читается — null и пояснение в note или unclear. Не добавляй помещений, которых нет на листе; не дели помещение на части по мебели; лестничную клетку, если она подписана отдельным помещением, включи как «Лестница». Цветные рамки, стрелки, размерные линии, штриховка и подписи поверх плана — пометки, а не стены и не помещения. Один и тот же номер помещения — одно помещение.

13. ПОРЯДОК. Помещения перечисляй в порядке экспликации, а без неё — по номерам, затем слева направо и сверху вниз.`;

window.RecognizePlan = RecognizePlan;
