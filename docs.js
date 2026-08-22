// ===================== Документы к смете =====================
//
// Договор бытового подряда, спецификация, смета работ и акт сдачи-приёмки.
// Собираются из готового расчёта: состав оборудования и работ уже посчитан
// калькулятором, реквизиты исполнителя лежат в настройках аккаунта, данные
// заказчика монтажник вводит один раз на объект — и они едут вместе со сметой.
//
// Почему бытовой подряд, а не обычный: заказчик — гражданин, заказывающий работы
// для личных нужд. Это § 2 главы 37 ГК РФ (ст. 730–739) плюс закон «О защите прав
// потребителей». Отсюда обязательные вещи, которых нет в самодельных договорах:
// цена и способ её определения (ст. 709), сроки начала и окончания (ст. 708),
// гарантийный срок (ст. 722), порядок приёмки (ст. 720).
//
// Цена по умолчанию ТВЁРДАЯ. Так же считает и закон, если в договоре не сказано
// иное (п. 4 ст. 709 ГК РФ), — то есть монтажник, не разобравшись, всё равно берёт
// риск на себя, только молча. Здесь это сказано вслух и подпёрто пунктом про
// дополнительные работы: появился объём — подписали отдельное соглашение.
//
// Отдельным файлом, а не в app.js: тот правят сразу несколько сессий, и каждая
// правка там стоит разбора конфликтов.
const Docs = {

    // Значения по умолчанию для формы. Хранятся в расчёте (app.state.contract),
    // поэтому уезжают в облако вместе со сметой и возвращаются при её открытии.
    DEFAULTS: {
        number: '',
        date: '',
        city: '',
        clientName: '',
        clientPassport: '',
        clientAddress: '',
        clientPhone: '',
        objectAddress: '',
        dateStart: '',
        dateEnd: '',
        prepay: 50,
        warrantyMonths: 24,
        offerDays: 14,
        materialsBy: 'contractor',   // чьи материалы: contractor | client
        priceKind: 'firm',           // firm — твёрдая, approx — приблизительная
        execKind: 'self',            // self — самозанятый, ip — ИП, ooo — организация
        signer: ''
    },

    // Чей расчёт обслуживаем. null — открытый сейчас в калькуляторе; иначе
    // { calcId, snap } — снимок сметы, ушедшей клиенту.
    //
    // Снимок важнее текущего расчёта: договор должен повторять то, что клиент видел
    // и с чем согласился, а калькулятор пересобирает смету по сегодняшнему каталогу
    // и к моменту подписания показал бы другие цифры.
    _ctx: null,

    // Ключ хранения данных договора. У открытой сметы они лежат в самом расчёте и
    // уезжают с ним в облако; у заказа из кабинета — отдельной записью по номеру
    // расчёта, чтобы не затирать то, над чем человек работает прямо сейчас.
    storeKey: function () {
        return this._ctx ? ('docs_contract_' + this._ctx.calcId) : null;
    },

    read: function () {
        const key = this.storeKey();
        if (!key) return app.state.contract || {};
        try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; }
    },

    data: function () {
        const st = app.state;
        const d = Object.assign({}, this.DEFAULTS, this.read());
        const snap = this._ctx && this._ctx.snap;
        // Подставляем то, что можно взять из расчёта, не перетирая введённое руками
        if (!d.date) d.date = new Date().toISOString().slice(0, 10);
        const num = this._ctx ? this._ctx.calcId : st.calc_id;
        if (!d.number && num) d.number = String(num);
        const name = snap ? ((snap.object_info || {}).projectName || '') : st.projectName;
        if (!d.objectAddress && name) d.objectAddress = name;
        if (!d.city) {
            const c = (app.companyDetails() || {}).city;
            if (c) d.city = c;
        }
        return d;
    },

    save: function (patch) {
        const next = Object.assign({}, this.data(), patch || {});
        const key = this.storeKey();
        if (key) {
            try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) { }
        } else {
            app.state.contract = next;
            app.saveState();
        }
    },

    // Состав документов: из снимка, если открыт заказ, иначе из текущего расчёта
    eqList: function () {
        const snap = this._ctx && this._ctx.snap;
        if (snap) return (snap.items && snap.items.equipment) || [];
        return app.currentEquipmentList || [];
    },

    worksList: function () {
        const snap = this._ctx && this._ctx.snap;
        if (snap) return (snap.items && snap.items.works) || [];
        return app.currentWorksList || [];
    },

    /**
     * Документы к отправленной смете. Вызывается из карточки раздела «Заказы и счета»:
     * до отправки, печати или запроса счёта договор подписывать не с чем.
     */
    openForOrder: async function (calcId, shareId) {
        this._ctx = null;
        if (!shareId) {
            // Снимка нет: смету не отправляли клиенту, а просто распечатали или
            // запросили по ней счёт. Состав в облаке не хранится — но если этот же
            // расчёт сейчас открыт в калькуляторе, собрать документы есть из чего.
            if (String(app.state.calc_id || '') === String(calcId)) { this.open(); return; }
            // Смету можно поднять из облака и собрать документы из неё. Спрашиваем: это
            // заменит расчёт, открытый сейчас, а там может быть несохранённая работа.
            let row = null;
            try {
                const { data } = await supabaseClient.from('estimates')
                    .select('id').eq('calc_data->>calc_id', String(calcId)).limit(1).maybeSingle();
                row = data;
            } catch (e) { row = null; }
            if (!row) {
                app.alert('Состав этой сметы не найден ни в облаке, ни в открытом расчёте. '
                    + 'Откройте смету и соберите документы из неё.', 'Документы');
                return;
            }
            const ok = await app.confirm('Чтобы собрать документы, нужно открыть эту смету. '
                + 'Расчёт, открытый сейчас, будет заменён. Продолжить?');
            if (!ok) return;
            await app.loadSingleEstimate(row.id);
            this.open();
            return;
        }
        let snap = null;
        try {
            const { data, error } = await supabaseClient.from('shared_invoices')
                .select('created_at, items, object_info, totals').eq('id', shareId).maybeSingle();
            if (error) throw error;
            snap = data;
        } catch (e) {
            app.alert('Не удалось получить отправленную клиенту смету. Попробуйте позже.', 'Документы');
            return;
        }
        if (!snap || !snap.items) {
            app.alert('Отправленной клиенту сметы не нашлось — собирать документы не из чего.', 'Документы');
            return;
        }
        this._ctx = { calcId: String(calcId), snap: snap };
        this.open();
    },

    // ---------- вспомогательное ----------

    esc: function (s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    money: function (v) {
        return Math.round(Number(v) || 0).toLocaleString('ru-RU') + ' руб.';
    },

    dateRu: function (iso) {
        if (!iso) return '«___» ____________ 20__ г.';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return this.esc(iso);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    },

    // Сумма прописью — для акта и договора она обязательна по обычаю делового
    // оборота, а в первичном документе ещё и снимает споры о цифре.
    words: function (n) {
        n = Math.round(Number(n) || 0);
        if (!n) return 'ноль рублей 00 копеек';
        const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
            'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
            'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
        const onesF = ones.slice();
        onesF[1] = 'одна'; onesF[2] = 'две';
        const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
        const huns = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
        const plural = (x, a, b, c) => {
            const m10 = x % 10, m100 = x % 100;
            if (m100 >= 11 && m100 <= 14) return c;
            if (m10 === 1) return a;
            if (m10 >= 2 && m10 <= 4) return b;
            return c;
        };
        const trio = (x, female) => {
            const list = female ? onesF : ones;
            const out = [];
            if (Math.floor(x / 100)) out.push(huns[Math.floor(x / 100)]);
            const rest = x % 100;
            if (rest < 20) { if (rest) out.push(list[rest]); }
            else {
                out.push(tens[Math.floor(rest / 10)]);
                if (rest % 10) out.push(list[rest % 10]);
            }
            return out.join(' ');
        };
        const parts = [];
        const mln = Math.floor(n / 1000000);
        const th = Math.floor((n % 1000000) / 1000);
        const rub = n % 1000;
        if (mln) parts.push(trio(mln) + ' ' + plural(mln, 'миллион', 'миллиона', 'миллионов'));
        if (th) parts.push(trio(th, true) + ' ' + plural(th, 'тысяча', 'тысячи', 'тысяч'));
        if (rub) parts.push(trio(rub));
        const s = parts.join(' ').replace(/\s+/g, ' ').trim();
        return s.charAt(0).toUpperCase() + s.slice(1) + ' ' + plural(n, 'рубль', 'рубля', 'рублей') + ' 00 копеек';
    },

    // Реквизиты исполнителя из настроек аккаунта. Там они одним куском текста —
    // в документ уходят как есть: разбирать чужую строку на ИНН и расчётный счёт
    // регулярками надёжнее не станет, а ошибётся — в договоре.
    contractor: function () {
        const cc = app.companyDetails() || {};
        const u = app.state.tgUser || {};
        const fio = [u.last_name, u.first_name, u.middle_name].filter(Boolean).join(' ');
        return {
            name: cc.name || fio || '',
            address: cc.address || '',
            bank: cc.bank || '',
            phone: u.phone || '',
            email: u.email || '',
            fio: fio
        };
    },

    // Из чего состоит объект — для предмета договора
    subject: function () {
        // У снимка настроек объекта нет — что монтировали, видно по разделам сметы
        if (this._ctx && this._ctx.snap) {
            const txt = this.eqList().concat(this.worksList())
                .map(i => String((i && (i.sectionTitle || i.group)) || '')).join(' ').toLowerCase();
            const parts = [];
            if (/отоплен|радиатор|котёл|котел|тёплый пол|теплый пол/.test(txt)) parts.push('системы отопления');
            if (/водоснабж/.test(txt)) parts.push('системы водоснабжения');
            if (/канализац/.test(txt)) parts.push('системы канализации');
            if (/вентиляц/.test(txt)) parts.push('системы вентиляции');
            return parts.length ? parts.join(', ') : 'инженерных систем';
        }
        const st = app.state;
        const parts = [];
        if ((st.systems || []).length) parts.push('системы отопления');
        if (st.water) parts.push('системы водоснабжения');
        if (st.sewer) parts.push('системы канализации');
        if (st.ventilationEnabled) parts.push('системы вентиляции');
        if (!parts.length) parts.push('инженерных систем');
        return parts.join(', ');
    },

    sums: function () {
        const snap = this._ctx && this._ctx.snap;
        if (snap) {
            const sum = (list) => (list || []).reduce((a, i) => a + (Number(i && i.sum) || 0), 0);
            const eq = sum(this.eqList());
            const works = sum(this.worksList());
            return { eq: eq, works: works, total: eq + works };
        }
        const eq = Number(app.lastEqSum) || 0;
        const works = Number(app.lastWorksSum) || 0;
        return { eq: eq, works: works, total: eq + works };
    },

    // ---------- окно с формой ----------

    open: function () {
        const d = this.techData();
        const hint = d.hint;
        const f = (k) => this.esc(d[k]);
        const old = document.getElementById('docs_modal_overlay');
        if (old) old.remove();
        const wrap = document.createElement('div');
        wrap.id = 'docs_modal_overlay';
        wrap.className = 'custom-modal-overlay';
        wrap.onclick = (e) => { if (e.target === wrap) Docs.close(); };
        const inp = (k, label, type, extra) => `
            <label style="display:block; margin-bottom:8px;">
                <span style="display:block; font-size:11.5px; color:var(--text-sec); margin-bottom:3px;">${label}</span>
                <input type="${type || 'text'}" id="doc_${k}" value="${f(k)}" ${extra || ''}
                    style="width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px;
                           background:var(--bg); color:var(--text-main); font:inherit; font-size:13px;">
            </label>`;
        wrap.innerHTML = `
            <div class="custom-modal" style="max-width:640px; padding:26px 24px; text-align:left;">
                <span class="auth-modal-close" onclick="Docs.close()" style="top:6px; right:8px; padding:10px 14px;">&times;</span>
                <div class="custom-modal-title" style="font-size:18px; margin-bottom:4px;">Документы к смете</div>
                <div class="custom-modal-text" style="margin-bottom:14px;">
                    Договор бытового подряда, спецификация, смета работ и акт сдачи-приёмки.
                    ${this._ctx
                        ? 'Состав и цены взяты из сметы № ' + this.esc(this._ctx.calcId) + ', отправленной клиенту.'
                        : 'Заполните данные один раз — они сохранятся вместе с расчётом.'}
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0 12px;">
                    ${inp('number', 'Номер договора')}
                    ${inp('date', 'Дата договора', 'date')}
                    ${inp('city', 'Город подписания')}
                    ${inp('objectAddress', 'Адрес объекта')}
                </div>

                <div style="font-size:12px; font-weight:700; color:var(--text-main); margin:10px 0 6px;">Заказчик</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0 12px;">
                    ${inp('clientName', 'ФИО полностью')}
                    ${inp('clientPhone', 'Телефон')}
                    ${inp('clientPassport', 'Паспорт: серия, номер, кем и когда выдан')}
                    ${inp('clientAddress', 'Адрес регистрации')}
                </div>

                <div style="font-size:12px; font-weight:700; color:var(--text-main); margin:10px 0 6px;">Условия</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0 12px;">
                    ${inp('dateStart', 'Начало работ', 'date')}
                    ${inp('dateEnd', 'Окончание работ', 'date')}
                    ${inp('prepay', 'Аванс, %', 'number', 'min="0" max="100"')}
                    ${inp('warrantyMonths', 'Гарантия на работы, мес.', 'number', 'min="0"')}
                    ${inp('offerDays', 'Цена действительна, дней', 'number', 'min="0"')}
                    ${inp('signer', 'Кто подписывает (ФИО)')}
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0 12px; margin-top:6px;">
                    <label style="display:block;">
                        <span style="display:block; font-size:11.5px; color:var(--text-sec); margin-bottom:3px;">Цена</span>
                        <select id="doc_priceKind" style="width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main); font:inherit; font-size:13px;">
                            <option value="firm"${d.priceKind === 'firm' ? ' selected' : ''}>Твёрдая — доплаты не будет</option>
                            <option value="approx"${d.priceKind === 'approx' ? ' selected' : ''}>Приблизительная — с предупреждением</option>
                        </select>
                    </label>
                    <label style="display:block;">
                        <span style="display:block; font-size:11.5px; color:var(--text-sec); margin-bottom:3px;">Материалы</span>
                        <select id="doc_materialsBy" style="width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main); font:inherit; font-size:13px;">
                            <option value="contractor"${d.materialsBy === 'contractor' ? ' selected' : ''}>Подрядчика</option>
                            <option value="client"${d.materialsBy === 'client' ? ' selected' : ''}>Заказчика</option>
                        </select>
                    </label>
                    <label style="display:block;">
                        <span style="display:block; font-size:11.5px; color:var(--text-sec); margin-bottom:3px;">Кто исполнитель</span>
                        <select id="doc_execKind" style="width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main); font:inherit; font-size:13px;">
                            <option value="self"${d.execKind === 'self' ? ' selected' : ''}>Самозанятый (НПД)</option>
                            <option value="ip"${d.execKind === 'ip' ? ' selected' : ''}>Индивидуальный предприниматель</option>
                            <option value="ooo"${d.execKind === 'ooo' ? ' selected' : ''}>Организация</option>
                        </select>
                    </label>
                </div>

                <div style="font-size:12px; font-weight:700; color:var(--text-main); margin:10px 0 6px;">Испытания и скрытые работы</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0 12px;">
                    <label style="display:block; margin-bottom:8px;">
                        <span style="display:block; font-size:11.5px; color:var(--text-sec); margin-bottom:3px;">Какую систему испытывали</span>
                        <select id="doc_techSystem" onchange="Docs.onSystemChange(this.value)"
                            style="width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main); font:inherit; font-size:13px;">
                            <option value="heating"${d.techSystem === 'heating' ? ' selected' : ''}>Отопление</option>
                            <option value="ufh"${d.techSystem === 'ufh' ? ' selected' : ''}>Тёплый пол</option>
                            <option value="water"${d.techSystem === 'water' ? ' selected' : ''}>Водоснабжение</option>
                        </select>
                    </label>
                    ${inp('techDate', 'Дата испытания', 'date')}
                    ${inp('techWorkPressure', 'Рабочее давление, МПа')}
                    ${inp('techTestPressure', 'Испытательное давление, МПа')}
                    ${inp('techHold', 'Выдержка, мин')}
                    ${inp('techDrop', 'Допустимое падение, МПа')}
                </div>
                <p style="font-size:11px; line-height:1.45; color:var(--text-sec); margin:0 0 8px;">
                    ${this.esc(hint.rule)}. Если изготовитель трубы требует другого — ставьте его значения,
                    они главнее общего правила.
                </p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0 12px;">
                    ${inp('hiddenFrom', 'Скрытые работы: с', 'date')}
                    ${inp('hiddenTo', 'Скрытые работы: по', 'date')}
                </div>
                ${inp('hiddenWorks', 'Что скрывается (если пусто — стандартная формулировка)')}

                <p style="font-size:11px; line-height:1.5; color:var(--text-sec); margin:12px 0 0;">
                    Шаблоны составлены по § 2 главы 37 ГК РФ (бытовой подряд) и закону «О защите прав
                    потребителей». Это типовые формы: стороны вправе изменить любой пункт.
                    Перед регулярным применением покажите документы своему юристу.
                </p>

                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:14px;">
                    <button type="button" class="custom-modal-btn" style="flex:1 1 180px; width:auto;"
                        onclick="Docs.print('contract')">Договор с приложениями</button>
                    <button type="button" class="custom-modal-btn" style="flex:1 1 140px; width:auto;"
                        onclick="Docs.print('act')">Акт сдачи-приёмки</button>
                    <button type="button" class="custom-modal-btn" style="flex:1 1 150px; width:auto;"
                        onclick="Docs.print('warranty')">Гарантийный талон</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                    <button type="button" class="custom-modal-btn custom-modal-close" style="flex:1 1 120px; width:auto; margin:0;"
                        onclick="Docs.printTech('pressure')">Опрессовка</button>
                    <button type="button" class="custom-modal-btn custom-modal-close" style="flex:1 1 120px; width:auto; margin:0;"
                        onclick="Docs.printTech('hidden')">Скрытые работы</button>
                    <button type="button" class="custom-modal-btn custom-modal-close" style="flex:1 1 100px; width:auto; margin:0;"
                        onclick="Docs.printTech('flush')">Промывка</button>
                    <button type="button" class="custom-modal-btn custom-modal-close" style="flex:1 1 130px; width:auto; margin:0;"
                        onclick="Docs.printTech('heat')">Прогрев</button>
                </div>
                <button type="button" class="custom-modal-btn custom-modal-close" style="margin-top:8px;"
                    onclick="Docs.close()">Закрыть</button>
            </div>`;
        document.body.appendChild(wrap);
        setTimeout(() => { wrap.classList.add('active'); if (app.syncModalOverlayClass) app.syncModalOverlayClass(); }, 20);
    },

    // Переключили систему — подставляем её значения по СП, но только если поля
    // не трогали руками: чужие цифры затирать нельзя.
    onSystemChange: function (sys) {
        const hint = this.PRESSURE_HINT[sys];
        if (!hint) return;
        const prev = this.PRESSURE_HINT[(app.state.contract || {}).techSystem || 'heating'] || {};
        const set = (id, was, now) => {
            const el = document.getElementById(id);
            if (el && (!el.value || el.value === was)) el.value = now;
        };
        set('doc_techWorkPressure', prev.work, hint.work);
        set('doc_techTestPressure', prev.test, hint.test);
        set('doc_techHold', prev.hold, hint.hold);
        this.collect();
    },

    close: function () {
        this.collect();
        const wrap = document.getElementById('docs_modal_overlay');
        if (!wrap) return;
        wrap.classList.remove('active');
        setTimeout(() => {
            wrap.remove();
            this._ctx = null;   // дальше снова обслуживаем открытый расчёт
            if (app.syncModalOverlayClass) app.syncModalOverlayClass();
        }, 300);
    },

    // Собирает введённое из формы в расчёт
    collect: function () {
        const wrap = document.getElementById('docs_modal_overlay');
        if (!wrap) return this.data();
        const patch = {};
        Object.keys(Object.assign({}, this.DEFAULTS, this.TECH_DEFAULTS)).forEach(k => {
            const el = document.getElementById('doc_' + k);
            if (el) patch[k] = el.value;
        });
        this.save(patch);
        return this.data();
    },

    // ---------- документы ----------

    print: function (kind) {
        const d = this.collect();
        const missing = [];
        if (!d.clientName) missing.push('ФИО заказчика');
        if (!d.objectAddress) missing.push('адрес объекта');
        if (missing.length) {
            app.alert('Заполните: ' + missing.join(', ') + '. Без этого документ не имеет силы.', 'Документы');
            return;
        }
        const html = kind === 'act' ? this.buildAct(d)
            : (kind === 'warranty' ? this.buildWarrantyDoc() : this.buildContract(d));
        const w = window.open('', '_blank');
        if (!w) { app.alert('Браузер заблокировал новое окно. Разрешите всплывающие окна для сайта.', 'Документы'); return; }
        w.document.write(html);
        w.document.close();
        // Печать вызываем после отрисовки, иначе часть браузеров печатает пустой лист
        setTimeout(() => { try { w.focus(); w.print(); } catch (e) { } }, 400);
    },

    styles: function () {
        return `<style>
            @page { size: A4; margin: 18mm 15mm; }
            body { font: 11pt/1.45 "Times New Roman", serif; color: #000; margin: 0; }
            h1 { font-size: 13pt; text-align: center; margin: 0 0 4mm; }
            h2 { font-size: 11pt; margin: 5mm 0 2mm; }
            .head { display: flex; justify-content: space-between; font-size: 10.5pt; margin-bottom: 6mm; }
            p { margin: 0 0 2mm; text-align: justify; }
            .n { margin: 0 0 1.5mm; text-align: justify; }
            table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 3mm 0; }
            th, td { border: 1px solid #000; padding: 1.5mm 2mm; vertical-align: top; }
            th { background: #eee; font-weight: bold; text-align: center; }
            td.num, th.num { text-align: right; white-space: nowrap; }
            td.c { text-align: center; }
            .sign { display: flex; justify-content: space-between; gap: 10mm; margin-top: 8mm; }
            .sign div { width: 48%; font-size: 10pt; }
            .line { border-bottom: 1px solid #000; height: 6mm; margin-bottom: 1mm; }
            .page { page-break-before: always; }
            .small { font-size: 9pt; color: #333; }
        </style>`;
    },

    buildContract: function (d) {
        const e = this.esc.bind(this);
        const c = this.contractor();
        const s = this.sums();
        const firm = d.priceKind === 'firm';
        const mats = d.materialsBy === 'contractor' ? 'Подрядчика' : 'Заказчика';
        const offerUntil = (() => {
            const base = d.date ? new Date(d.date) : new Date();
            base.setDate(base.getDate() + (parseInt(d.offerDays, 10) || 0));
            return this.dateRu(base.toISOString().slice(0, 10));
        })();
        const npd = d.execKind === 'self'
            ? `<p class="n">2.7. Подрядчик применяет специальный налоговый режим «Налог на профессиональный доход» и при получении оплаты формирует и передаёт Заказчику чек в порядке ст. 14 Федерального закона от 27.11.2018 № 422-ФЗ.</p>`
            : '';

        return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
            <title>Договор № ${e(d.number)}</title>${this.styles()}</head><body>

        <h1>ДОГОВОР БЫТОВОГО ПОДРЯДА № ${e(d.number) || '____'}</h1>
        <div class="head"><span>${e(d.city) || '_______________'}</span><span>${this.dateRu(d.date)}</span></div>

        <p>${e(c.name) || '_______________________________'}${c.fio && c.name !== c.fio ? ', в лице ' + e(d.signer || c.fio) : ''},
        именуемый в дальнейшем «Подрядчик», с одной стороны, и гражданин(ка) ${e(d.clientName)},
        именуемый в дальнейшем «Заказчик», с другой стороны, совместно именуемые «Стороны»,
        заключили настоящий Договор о нижеследующем.</p>

        <h2>1. Предмет Договора</h2>
        <p class="n">1.1. Подрядчик обязуется по заданию Заказчика выполнить работы по монтажу ${e(this.subject())}
        на объекте по адресу: ${e(d.objectAddress)}, а Заказчик обязуется создать Подрядчику необходимые условия
        для выполнения работ, принять их результат и уплатить обусловленную цену.</p>
        <p class="n">1.2. Перечень оборудования и материалов определён Спецификацией (Приложение № 1),
        состав и объём работ — Сметой на работы (Приложение № 2). Приложения являются
        неотъемлемой частью настоящего Договора.</p>
        <p class="n">1.3. Работы выполняются из материалов ${mats}.</p>
        <p class="n">1.4. Работы выполняются для личных, семейных, домашних нужд Заказчика, не связанных
        с осуществлением предпринимательской деятельности. К отношениям Сторон применяются
        § 2 главы 37 Гражданского кодекса РФ и Закон РФ от 07.02.1992 № 2300-1 «О защите прав потребителей».</p>

        <h2>2. Цена работ и порядок расчётов</h2>
        <p class="n">2.1. Цена по настоящему Договору является <b>${firm ? 'твёрдой' : 'приблизительной'}</b>
        и составляет ${this.money(s.total)} (${this.words(s.total)}), в том числе стоимость оборудования и материалов
        ${this.money(s.eq)}, стоимость работ ${this.money(s.works)}.</p>
        ${firm
            ? `<p class="n">2.2. Твёрдая цена не подлежит изменению, в том числе при отклонении фактического объёма
               работ от предусмотренного Приложениями, за исключением случая, предусмотренного п. 6 ст. 709
               Гражданского кодекса РФ (существенное возрастание стоимости материалов и услуг третьих лиц,
               которое нельзя было предусмотреть при заключении Договора).</p>`
            : `<p class="n">2.2. При возникновении необходимости в проведении дополнительных работ и по этой причине
               в существенном превышении приблизительной цены Подрядчик обязан своевременно предупредить об
               этом Заказчика (п. 5 ст. 709 Гражданского кодекса РФ). Заказчик вправе отказаться от Договора,
               уплатив Подрядчику цену за выполненную часть работ.</p>`}
        <p class="n">2.3. Дополнительные работы, оборудование и материалы, не вошедшие в Приложения,
        выполняются и оплачиваются только на основании подписанного Сторонами дополнительного соглашения.
        Устные договорённости об изменении цены и объёма работ юридической силы не имеют.</p>
        <p class="n">2.4. Заказчик уплачивает аванс в размере ${e(String(d.prepay || 0))}% цены Договора
        (${this.money(s.total * (parseFloat(d.prepay) || 0) / 100)}) в течение 3 (трёх) рабочих дней с даты
        подписания Договора. Окончательный расчёт производится в течение 5 (пяти) рабочих дней с даты
        подписания Акта сдачи-приёмки выполненных работ.</p>
        <p class="n">2.5. Цена, указанная в п. 2.1, действительна до ${offerUntil}. По истечении указанного срока
        цена подлежит пересогласованию Сторонами в связи с изменением стоимости оборудования и материалов.</p>
        <p class="n">2.6. Все расчёты производятся в рублях Российской Федерации.</p>
        ${npd}

        <h2>3. Сроки выполнения работ</h2>
        <p class="n">3.1. Начало работ — ${this.dateRu(d.dateStart)}, окончание работ — ${this.dateRu(d.dateEnd)}
        (ст. 708 Гражданского кодекса РФ).</p>
        <p class="n">3.2. Сроки продлеваются соразмерно времени, в течение которого Заказчик не исполнял свои
        обязанности по п. 4.2 настоящего Договора (доступ на объект, готовность помещений, обеспечение
        электроснабжением и водоснабжением, уплата аванса).</p>

        <h2>4. Обязанности Сторон</h2>
        <p class="n">4.1. Подрядчик обязуется: выполнить работы в соответствии с Приложениями и требованиями
        СП 73.13330.2016 «Внутренние санитарно-технические системы зданий», СП 60.13330 «Отопление,
        вентиляция и кондиционирование воздуха», инструкций изготовителей оборудования; провести испытания
        смонтированных систем; освидетельствовать скрытые работы до их закрытия; передать Заказчику
        документы изготовителей и сведения о правилах эксплуатации (ст. 736 ГК РФ); вывезти строительный
        мусор, образовавшийся при производстве работ.</p>
        <p class="n">4.2. Заказчик обязуется: обеспечить беспрепятственный доступ на объект в согласованное время;
        обеспечить готовность помещений к производству работ, наличие электроснабжения и водоснабжения;
        принять результат работ в порядке раздела 5; оплатить работы в порядке раздела 2.</p>
        <p class="n">4.3. Заказчик уведомлён, что качество теплоносителя и водопроводной воды влияет на срок
        службы оборудования, и обязуется соблюдать переданные ему правила эксплуатации.</p>

        <h2>5. Сдача и приёмка работ</h2>
        <p class="n">5.1. По завершении работ Подрядчик передаёт Заказчику результат работ по Акту
        сдачи-приёмки выполненных работ (ст. 720 Гражданского кодекса РФ).</p>
        <p class="n">5.2. Трубопроводы и иные элементы, скрываемые конструкциями пола, стен и потолка,
        предъявляются Заказчику до их закрытия и оформляются актом освидетельствования скрытых работ.
        Заказчик, не явившийся для освидетельствования после письменного уведомления, лишается права
        ссылаться на недостатки таких работ, которые могли быть выявлены при осмотре.</p>
        <p class="n">5.3. Смонтированные системы подвергаются испытанию на герметичность в порядке
        СП 73.13330.2016 с оформлением соответствующего акта.</p>
        <p class="n">5.4. Заказчик обязан в течение 5 (пяти) рабочих дней с даты получения Акта подписать его
        либо направить мотивированный отказ с перечнем недостатков. При непоступлении подписанного Акта
        и мотивированного отказа в указанный срок работы считаются принятыми.</p>

        <h2>6. Гарантия</h2>
        <p class="n">6.1. Гарантийный срок на выполненные работы составляет ${e(String(d.warrantyMonths || 0))} месяцев
        с даты подписания Акта сдачи-приёмки (ст. 722 Гражданского кодекса РФ).</p>
        <p class="n">6.2. Гарантия на оборудование и материалы предоставляется их изготовителями в сроки и на
        условиях, указанных в паспортах и гарантийных талонах, передаваемых Заказчику.</p>
        <p class="n">6.3. Гарантия не распространяется на недостатки, возникшие вследствие: нарушения Заказчиком
        правил эксплуатации; вмешательства в систему третьих лиц; отсутствия предусмотренного изготовителем
        технического обслуживания; ненадлежащего качества теплоносителя или водопроводной воды; перебоев
        и скачков напряжения в электросети; замерзания системы при отключении энергоснабжения;
        механических повреждений; обстоятельств непреодолимой силы.</p>
        <p class="n">6.4. Требования Заказчика, связанные с недостатками работ, рассматриваются в порядке
        ст. 29 и 30 Закона РФ «О защите прав потребителей».</p>

        <h2>7. Ответственность Сторон</h2>
        <p class="n">7.1. За нарушение сроков выполнения работ Подрядчик уплачивает Заказчику неустойку в
        размере, установленном п. 5 ст. 28 Закона РФ «О защите прав потребителей».</p>
        <p class="n">7.2. За нарушение сроков оплаты Заказчик уплачивает Подрядчику неустойку в размере 0,1%
        от неуплаченной суммы за каждый день просрочки, но не более 10% от цены Договора.</p>
        <p class="n">7.3. Риск случайной гибели материалов и оборудования до приёмки результата работ несёт
        предоставившая их Сторона (ст. 705 Гражданского кодекса РФ).</p>

        <h2>8. Заключительные положения</h2>
        <p class="n">8.1. Договор вступает в силу с даты подписания и действует до полного исполнения
        обязательств Сторонами.</p>
        <p class="n">8.2. Заказчик даёт согласие на обработку своих персональных данных, указанных в разделе 9,
        в целях исполнения настоящего Договора, в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ
        «О персональных данных». Согласие действует до его отзыва.</p>
        <p class="n">8.3. Споры разрешаются путём переговоров, а при недостижении согласия — в суде.
        Заказчик вправе предъявить иск по своему выбору в соответствии со ст. 17 Закона РФ
        «О защите прав потребителей».</p>
        <p class="n">8.4. Договор составлен в двух экземплярах, имеющих равную юридическую силу,
        по одному для каждой из Сторон.</p>
        <p class="n">8.5. Приложения: № 1 «Спецификация оборудования и материалов», № 2 «Смета на работы».</p>

        <h2>9. Адреса, реквизиты и подписи Сторон</h2>
        <table><tr>
            <td style="width:50%;"><b>ПОДРЯДЧИК</b><br>${e(c.name)}<br>${e(c.address).replace(/\n/g, '<br>')}<br>
                ${e(c.bank).replace(/\n/g, '<br>')}<br>${c.phone ? 'тел.: ' + e(c.phone) + '<br>' : ''}${c.email ? e(c.email) : ''}</td>
            <td style="width:50%;"><b>ЗАКАЗЧИК</b><br>${e(d.clientName)}<br>
                ${d.clientPassport ? 'Паспорт: ' + e(d.clientPassport) + '<br>' : ''}
                ${d.clientAddress ? 'Адрес: ' + e(d.clientAddress) + '<br>' : ''}
                ${d.clientPhone ? 'тел.: ' + e(d.clientPhone) : ''}</td>
        </tr><tr>
            <td><div class="line"></div><span class="small">${e(d.signer || c.fio || '')} / подпись</span></td>
            <td><div class="line"></div><span class="small">${e(d.clientName)} / подпись</span></td>
        </tr></table>

        ${this.buildSpec(d, c)}
        ${this.buildWorks(d, c)}
        </body></html>`;
    },

    // Приложение № 1 — оборудование
    buildSpec: function (d, c) {
        const e = this.esc.bind(this);
        const list = this.eqList();
        const s = this.sums();
        const rows = list.map((it, i) => `
            <tr>
                <td class="c">${i + 1}</td>
                <td>${e(it.name)}</td>
                <td class="c">${e(it.displaySku || '')}</td>
                <td class="c">${e(it.brand || '')}</td>
                <td class="c">${e(it.unit || 'шт')}</td>
                <td class="num">${e(String(it.q))}</td>
                <td class="num">${this.money(it.price)}</td>
                <td class="num">${this.money(it.sum)}</td>
            </tr>`).join('');
        return `<div class="page">
            <h1>Приложение № 1 к Договору № ${e(d.number) || '____'} от ${this.dateRu(d.date)}</h1>
            <h1 style="margin-bottom:5mm;">СПЕЦИФИКАЦИЯ ОБОРУДОВАНИЯ И МАТЕРИАЛОВ</h1>
            <p class="n">Объект: ${e(d.objectAddress)}</p>
            <table>
                <tr><th>№</th><th>Наименование</th><th>Артикул</th><th>Бренд</th><th>Ед.</th>
                    <th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th></tr>
                ${rows || '<tr><td colspan="8" class="c">Оборудование не выбрано</td></tr>'}
                <tr><td colspan="7"><b>Итого</b></td><td class="num"><b>${this.money(s.eq)}</b></td></tr>
            </table>
            <p class="small">Оборудование поставляется в соответствии с настоящей Спецификацией. Замена позиций
            на аналогичные по техническим характеристикам допускается по письменному согласованию Сторон.</p>
            <div class="sign">
                <div><div class="line"></div><span class="small">Подрядчик</span></div>
                <div><div class="line"></div><span class="small">Заказчик</span></div>
            </div>
        </div>`;
    },

    // Приложение № 2 — работы
    buildWorks: function (d, c) {
        const e = this.esc.bind(this);
        const list = this.worksList();
        const s = this.sums();
        const rows = list.map((it, i) => `
            <tr>
                <td class="c">${i + 1}</td>
                <td>${e(it.name)}</td>
                <td class="c">${e(it.unit || '')}</td>
                <td class="num">${e(String(it.q != null ? it.q : ''))}</td>
                <td class="num">${this.money(it.price)}</td>
                <td class="num">${this.money(it.sum)}</td>
            </tr>`).join('');
        return `<div class="page">
            <h1>Приложение № 2 к Договору № ${e(d.number) || '____'} от ${this.dateRu(d.date)}</h1>
            <h1 style="margin-bottom:5mm;">СМЕТА НА РАБОТЫ</h1>
            <p class="n">Объект: ${e(d.objectAddress)}</p>
            <table>
                <tr><th>№</th><th>Наименование работ</th><th>Ед.</th>
                    <th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th></tr>
                ${rows || '<tr><td colspan="6" class="c">Работы не выбраны</td></tr>'}
                <tr><td colspan="5"><b>Итого</b></td><td class="num"><b>${this.money(s.works)}</b></td></tr>
            </table>
            <div class="sign">
                <div><div class="line"></div><span class="small">Подрядчик</span></div>
                <div><div class="line"></div><span class="small">Заказчик</span></div>
            </div>
        </div>`;
    },



    // ===================== Гарантийный талон =====================
    //
    // Две гарантии, и путать их нельзя.
    //
    // На РАБОТЫ отвечает монтажник — это его собственное обязательство, ст. 722 ГК РФ,
    // срок он назначает сам.
    //
    // На ОБОРУДОВАНИЕ срок назначает изготовитель. Но из этого не следует, что
    // монтажник в стороне: работа из его материала означает, что за качество этого
    // материала он отвечает как продавец (ст. 704 и 733 ГК РФ, ст. 35 закона
    // «О защите прав потребителей»). Клиент по закону придёт к нему, а он уже
    // разбирается с поставщиком. Написать в талоне «за оборудование отвечает завод,
    // я ни при чём» нельзя — такое условие ничтожно (ст. 16 ЗоЗПП).
    //
    // Сроки берём из справочника, собранного из паспортов STOUT и ROMMER
    // (warranty.js, сборщик warranty_build.js). Где срока нет —
    // пишем «по паспорту изготовителя», а не выдумываем: обещание в талоне,
    // которого изготовитель не давал, обернётся против монтажника.

    warrantyMonthsFor: function (item) {
        if (typeof WARRANTY_DB === 'undefined' || !WARRANTY_DB) return null;
        const art = String((item && (item.displaySku || item.originalId || item.id)) || '').trim();
        if (!art) return null;
        const exact = WARRANTY_DB.byArticle[art];
        if (exact !== undefined) return { months: exact, exact: true };
        const fam = art.split('-').slice(0, 2).join('-');
        const byFam = WARRANTY_DB.byFamily[fam];
        if (byFam !== undefined) return { months: byFam, exact: false };
        return null;
    },

    monthsWords: function (m) {
        if (m % 12 === 0) {
            const y = m / 12;
            const w = (y % 10 === 1 && y % 100 !== 11) ? 'год' : ((y % 10 >= 2 && y % 10 <= 4 && (y % 100 < 10 || y % 100 >= 20)) ? 'года' : 'лет');
            return y + ' ' + w;
        }
        return m + ' мес.';
    },

    buildWarrantyDoc: function () {
        const d = this.data();
        const e = this.esc.bind(this);
        const c = this.contractor();
        const list = this.eqList();

        // Одинаковые сроки сводим в строки таблицы по позициям сметы, а не по
        // артикулам: клиенту важно, что именно у него стоит.
        let known = 0, unknown = 0;
        const rows = list.map(it => {
            if (!it) return '';
            const art = String(it.displaySku || it.originalId || it.id || '');
            if (art.indexOf('custom_collapsed_') === 0) return '';
            const w = this.warrantyMonthsFor(it);
            if (w) known++; else unknown++;
            return `<tr>
                <td>${e(it.name || art)}</td>
                <td class="c">${e(art)}</td>
                <td class="c">${e(it.brand || '')}</td>
                <td class="c">${w ? this.monthsWords(w.months) : 'по паспорту'}</td>
            </tr>`;
        }).filter(Boolean).join('');

        return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
            <title>Гарантийный талон</title>${this.styles()}</head><body>

        <h1>ГАРАНТИЙНЫЙ ТАЛОН</h1>
        <div class="head"><span>к договору № ${e(d.number) || '____'} от ${this.dateRu(d.date)}</span>
            <span>${e(d.city) || ''}</span></div>
        <p class="n"><b>Объект:</b> ${e(d.objectAddress)}</p>
        <p class="n"><b>Заказчик:</b> ${e(d.clientName)}</p>
        <p class="n"><b>Исполнитель:</b> ${e(c.name)}${c.phone ? ', тел.: ' + e(c.phone) : ''}</p>

        <h2>1. Гарантия на монтажные работы</h2>
        <p class="n">1.1. Исполнитель гарантирует качество выполненных монтажных работ в течение
        <b>${e(String(d.warrantyMonths || 0))} месяцев</b> с даты подписания акта сдачи-приёмки
        (ст. 722 Гражданского кодекса РФ).</p>
        <p class="n">1.2. В течение гарантийного срока Исполнитель безвозмездно устраняет недостатки
        выполненных им работ: негерметичность выполненных соединений, ошибки монтажа и подключения,
        неправильную настройку оборудования.</p>

        <h2>2. Гарантия изготовителей на оборудование</h2>
        <p class="n">2.1. Сроки установлены изготовителями оборудования. Паспорта и гарантийные
        документы переданы Заказчику вместе с оборудованием.</p>
        <table>
            <tr><th>Наименование</th><th>Артикул</th><th>Бренд</th><th>Гарантия</th></tr>
            ${rows || '<tr><td colspan="4" class="c">Оборудование не выбрано</td></tr>'}
        </table>
        <p class="small">Срок указан по паспорту изготовителя. «По паспорту» означает, что срок
        смотрите в паспорте изделия: он передан вам вместе с оборудованием.
        Учтено позиций со сроком: ${known}${unknown ? `, без срока в справочнике: ${unknown}` : ''}.</p>
        <p class="n">2.2. Гарантийный срок исчисляется с даты продажи оборудования, но не может
        выходить за пределы срока, установленного изготовителем.</p>
        <p class="n">2.3. <b>Куда обращаться.</b> По недостаткам оборудования, поставленного
        Исполнителем, Заказчик вправе обратиться непосредственно к Исполнителю: работа выполнена из
        его материала, и за качество этого материала он отвечает по правилам об ответственности
        продавца (ст. 704 и 733 Гражданского кодекса РФ, ст. 35 Закона РФ «О защите прав
        потребителей»). Исполнитель самостоятельно ведёт вопрос с поставщиком и изготовителем.</p>

        <h2>3. Условия сохранения гарантии</h2>
        <p class="n">Гарантия действует при соблюдении Заказчиком следующих условий:</p>
        <p class="n">3.1. Соблюдение правил эксплуатации, изложенных в паспортах изготовителей.</p>
        <p class="n">3.2. Проведение предусмотренного изготовителем технического обслуживания
        (для газового и электрического котла — не реже одного раза в год).</p>
        <p class="n">3.3. Качество теплоносителя и водопроводной воды соответствует требованиям
        изготовителей оборудования.</p>
        <p class="n">3.4. Отсутствие вмешательства в систему третьих лиц: любые работы по изменению,
        достройке или ремонту системы выполняются с уведомлением Исполнителя.</p>
        <p class="n">3.5. Электроснабжение объекта соответствует требованиям паспортов оборудования;
        при перебоях и скачках напряжения оборудование защищено стабилизатором.</p>
        <p class="n">3.6. Система не размораживалась: при отключении энергоснабжения зимой
        теплоноситель из системы должен быть слит либо обеспечен незамерзающий теплоноситель.</p>

        <h2>4. Порядок обращения</h2>
        <p class="n">4.1. О выявленном недостатке Заказчик сообщает Исполнителю по телефону
        ${c.phone ? e(c.phone) : '_______________'}${c.email ? ' или на ' + e(c.email) : ''}.</p>
        <p class="n">4.2. Исполнитель приступает к устранению недостатка в согласованный с Заказчиком
        срок. Требования, связанные с недостатками, рассматриваются в порядке ст. 29 и 30 Закона РФ
        «О защите прав потребителей».</p>
        <p class="n">4.3. Гарантия не распространяется на недостатки, возникшие вследствие нарушения
        условий раздела 3, механических повреждений и обстоятельств непреодолимой силы.</p>

        <table style="margin-top:6mm;"><tr>
            <td style="width:50%;"><b>ИСПОЛНИТЕЛЬ</b><br>${e(c.name)}</td>
            <td style="width:50%;"><b>ЗАКАЗЧИК</b><br>${e(d.clientName)}</td>
        </tr><tr>
            <td><div class="line"></div><span class="small">${e(d.signer || c.fio || '')} / подпись</span></td>
            <td><div class="line"></div><span class="small">талон получил, паспорта на оборудование переданы</span></td>
        </tr></table>
        </body></html>`;
    },

    // ===================== Технические акты =====================
    //
    // То, чего в самодельных договорах нет никогда, а в споре решает всё: испытания
    // и скрытые работы. Порядок и требования — СП 73.13330.2016 «Внутренние
    // санитарно-технические системы зданий» (актуализированный СНиП 3.05.01-85).
    //
    // Самый ценный из них — акт освидетельствования скрытых работ: как только стяжка
    // залита, доказать, что уложено под ней, больше нечем.

    TECH_DEFAULTS: {
        techSystem: 'heating',      // heating | ufh | water
        techWorkPressure: '',       // рабочее давление, МПа
        techTestPressure: '',       // испытательное, МПа
        techHold: '',               // выдержка, мин
        techDrop: '0,02',           // допустимое падение, МПа
        techDate: '',
        techClientRep: '',          // кто принимал со стороны заказчика
        hiddenWorks: '',            // что именно скрывается
        hiddenFrom: '',
        hiddenTo: ''
    },

    SYSTEM_NAMES: {
        heating: 'система отопления',
        ufh: 'система напольного отопления (тёплый пол)',
        water: 'система внутреннего водоснабжения'
    },

    // Требования СП 73.13330.2016 по видам систем. Числа — значения по умолчанию,
    // монтажник правит их под паспорт трубы: у тёплого пола изготовитель часто
    // задаёт своё испытательное давление, и оно главнее общего правила.
    PRESSURE_HINT: {
        heating: { work: '0,2', test: '0,3', hold: '10',
            rule: 'п. 7.6 СП 73.13330.2016: гидростатическое давление 1,5 рабочего, но не менее 0,2 МПа в самой низкой точке; выдержка 10 мин, падение не более 0,02 МПа' },
        ufh: { work: '0,3', test: '0,6', hold: '30',
            rule: 'испытание по инструкции изготовителя трубы; при отсутствии указаний — 1,5 рабочего давления, выдержка не менее 30 мин' },
        water: { work: '0,3', test: '0,45', hold: '10',
            rule: 'п. 7.4 СП 73.13330.2016: давление 1,5 рабочего; выдержка 10 мин, падение не более 0,05 МПа' }
    },

    techData: function () {
        const d = this.data();
        const t = Object.assign({}, this.TECH_DEFAULTS, app.state.contract || {});
        if (!t.techDate) t.techDate = new Date().toISOString().slice(0, 10);
        const hint = this.PRESSURE_HINT[t.techSystem] || this.PRESSURE_HINT.heating;
        if (!t.techWorkPressure) t.techWorkPressure = hint.work;
        if (!t.techTestPressure) t.techTestPressure = hint.test;
        if (!t.techHold) t.techHold = hint.hold;
        return Object.assign({}, d, t, { hint: hint });
    },

    // Шапка, общая у всех технических актов
    techHead: function (t, title) {
        const e = this.esc.bind(this);
        const c = this.contractor();
        return `<h1>${title}</h1>
        <div class="head"><span>Объект: ${e(t.objectAddress)}</span><span>${this.dateRu(t.techDate)}</span></div>
        <p class="n">Комиссия в составе представителя Подрядчика ${e(t.signer || c.fio || c.name)}
        и Заказчика ${e(t.clientName)} составила настоящий акт о нижеследующем.</p>`;
    },

    techSign: function (t) {
        const e = this.esc.bind(this);
        const c = this.contractor();
        return `<div class="sign">
            <div><div class="line"></div><span class="small">Подрядчик: ${e(t.signer || c.fio || c.name)}</span></div>
            <div><div class="line"></div><span class="small">Заказчик: ${e(t.clientName)}</span></div>
        </div>`;
    },

    // Опрессовка — гидростатическое испытание на герметичность
    buildPressureAct: function () {
        const t = this.techData();
        const e = this.esc.bind(this);
        const sys = this.SYSTEM_NAMES[t.techSystem] || this.SYSTEM_NAMES.heating;
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
            <title>Акт гидростатического испытания</title>${this.styles()}</head><body>
        ${this.techHead(t, 'АКТ ГИДРОСТАТИЧЕСКОГО ИСПЫТАНИЯ НА ГЕРМЕТИЧНОСТЬ')}
        <p class="n">1. К испытанию предъявлена смонтированная ${e(sys)} по договору
        № ${e(t.number) || '____'} от ${this.dateRu(t.date)}.</p>
        <p class="n">2. Испытание проведено гидростатическим методом в соответствии с требованиями
        СП 73.13330.2016 «Внутренние санитарно-технические системы зданий».</p>
        <table>
            <tr><th style="width:60%;">Показатель</th><th>Значение</th></tr>
            <tr><td>Рабочее давление системы, МПа</td><td class="c">${e(t.techWorkPressure)}</td></tr>
            <tr><td>Испытательное давление, МПа</td><td class="c">${e(t.techTestPressure)}</td></tr>
            <tr><td>Время выдержки под испытательным давлением, мин</td><td class="c">${e(t.techHold)}</td></tr>
            <tr><td>Падение давления за время выдержки, МПа, не более</td><td class="c">${e(t.techDrop)}</td></tr>
        </table>
        <p class="n">3. Требование: ${e(t.hint.rule)}.</p>
        <p class="n">4. При осмотре в течение всего времени выдержки течей, разрывов, нарушений
        герметичности соединений, а также видимых остаточных деформаций труб, арматуры и приборов
        не обнаружено.</p>
        <p class="n">5. <b>Заключение:</b> ${e(sys)} испытание на герметичность выдержала и признана
        годной к эксплуатации.</p>
        ${this.techSign(t)}
        </body></html>`;
    },

    // Скрытые работы — самый важный акт для монтажника
    buildHiddenAct: function () {
        const t = this.techData();
        const e = this.esc.bind(this);
        const what = t.hiddenWorks
            || 'прокладка трубопроводов системы отопления в конструкции пола (под стяжкой) и в штрабах стен, укладка контуров напольного отопления, теплоизоляция трубопроводов';
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
            <title>Акт освидетельствования скрытых работ</title>${this.styles()}</head><body>
        ${this.techHead(t, 'АКТ ОСВИДЕТЕЛЬСТВОВАНИЯ СКРЫТЫХ РАБОТ')}
        <p class="n">1. К освидетельствованию предъявлены следующие работы: ${e(what)}.</p>
        <p class="n">2. Работы выполнены по договору № ${e(t.number) || '____'} от ${this.dateRu(t.date)}
        в период с ${this.dateRu(t.hiddenFrom)} по ${this.dateRu(t.hiddenTo)}.</p>
        <p class="n">3. При выполнении работ применены материалы и изделия, указанные в Спецификации
        (Приложение № 1 к договору). Документы изготовителей о качестве переданы Заказчику.</p>
        <p class="n">4. Работы выполнены в соответствии с проектными решениями, требованиями
        СП 73.13330.2016 и инструкциями изготовителей примененных материалов. Трубопроводы,
        подлежащие закрытию, испытаны на герметичность до закрытия — см. акт гидростатического
        испытания.</p>
        <p class="n">5. Отклонений от предусмотренных решений не выявлено. Дефектов и повреждений
        не обнаружено.</p>
        <p class="n">6. <b>Разрешается</b> производство последующих работ по закрытию перечисленных
        конструкций (устройство стяжки, заделка штраб, зашивка коробов).</p>
        <p class="n" style="margin-top:3mm;"><i>Заказчик уведомлён, что после закрытия конструкций
        осмотр указанных работ невозможен, и подтверждает, что предъявленные работы им осмотрены.</i></p>
        ${this.techSign(t)}
        </body></html>`;
    },

    // Промывка системы
    buildFlushAct: function () {
        const t = this.techData();
        const e = this.esc.bind(this);
        const sys = this.SYSTEM_NAMES[t.techSystem] || this.SYSTEM_NAMES.heating;
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
            <title>Акт промывки системы</title>${this.styles()}</head><body>
        ${this.techHead(t, 'АКТ ПРОМЫВКИ СИСТЕМЫ')}
        <p class="n">1. Произведена промывка смонтированной ${e(sys)} по договору
        № ${e(t.number) || '____'} от ${this.dateRu(t.date)}.</p>
        <p class="n">2. Промывка выполнена до полного осветления промывочной воды в соответствии
        с требованиями СП 73.13330.2016.</p>
        <p class="n">3. Фильтры и грязевики после промывки очищены, запорная арматура проверена
        на полный ход.</p>
        <p class="n">4. <b>Заключение:</b> система промыта и подготовлена к заполнению теплоносителем
        и пусконаладочным работам.</p>
        ${this.techSign(t)}
        </body></html>`;
    },

    // Тепловое испытание на равномерность прогрева. Проводится в отопительный сезон
    // либо при искусственном прогреве — снимает претензии «дальняя комната холодная».
    buildHeatAct: function () {
        const t = this.techData();
        const e = this.esc.bind(this);
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
            <title>Акт теплового испытания</title>${this.styles()}</head><body>
        ${this.techHead(t, 'АКТ ТЕПЛОВОГО ИСПЫТАНИЯ СИСТЕМЫ ОТОПЛЕНИЯ<br>НА РАВНОМЕРНОСТЬ ПРОГРЕВА')}
        <p class="n">1. Произведено тепловое испытание смонтированной системы отопления по договору
        № ${e(t.number) || '____'} от ${this.dateRu(t.date)}.</p>
        <p class="n">2. Испытание выполнено в соответствии с СП 73.13330.2016 при температуре
        теплоносителя в подающем трубопроводе не ниже 60 °C в течение 7 часов.</p>
        <p class="n">3. Все отопительные приборы и контуры напольного отопления прогреваются
        равномерно, циркуляция теплоносителя обеспечена во всех ветвях системы, воздух из системы
        удалён. Регулирующая арматура и автоматика работают исправно.</p>
        <p class="n">4. <b>Заключение:</b> система отопления тепловое испытание выдержала,
        прогрев равномерный, система принята в эксплуатацию.</p>
        ${this.techSign(t)}
        </body></html>`;
    },

    printTech: function (kind) {
        const d = this.collect();
        if (!d.objectAddress) {
            app.alert('Заполните адрес объекта в разделе «Документы».', 'Акты');
            return;
        }
        const map = {
            pressure: () => this.buildPressureAct(),
            hidden: () => this.buildHiddenAct(),
            flush: () => this.buildFlushAct(),
            heat: () => this.buildHeatAct()
        };
        const build = map[kind];
        if (!build) return;
        const w = window.open('', '_blank');
        if (!w) { app.alert('Браузер заблокировал новое окно. Разрешите всплывающие окна для сайта.', 'Акты'); return; }
        w.document.write(build());
        w.document.close();
        setTimeout(() => { try { w.focus(); w.print(); } catch (e) { } }, 400);
    },

    // Акт сдачи-приёмки. Обязательные реквизиты первичного документа —
    // ст. 9 Федерального закона от 06.12.2011 № 402-ФЗ «О бухгалтерском учёте».
    buildAct: function (d) {
        const e = this.esc.bind(this);
        const c = this.contractor();
        const s = this.sums();
        const today = new Date().toISOString().slice(0, 10);
        return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
            <title>Акт сдачи-приёмки по договору № ${e(d.number)}</title>${this.styles()}</head><body>

        <h1>АКТ СДАЧИ-ПРИЁМКИ ВЫПОЛНЕННЫХ РАБОТ</h1>
        <h1 style="margin-bottom:5mm;">к Договору бытового подряда № ${e(d.number) || '____'} от ${this.dateRu(d.date)}</h1>
        <div class="head"><span>${e(d.city) || '_______________'}</span><span>${this.dateRu(today)}</span></div>

        <p>${e(c.name) || '_______________________________'}, именуемый в дальнейшем «Подрядчик», с одной стороны,
        и гражданин(ка) ${e(d.clientName)}, именуемый в дальнейшем «Заказчик», с другой стороны,
        составили настоящий Акт о нижеследующем.</p>

        <p class="n">1. Подрядчик выполнил, а Заказчик принял работы по монтажу ${e(this.subject())}
        на объекте по адресу: ${e(d.objectAddress)}, в объёме, предусмотренном Приложениями № 1 и № 2
        к Договору.</p>

        <table>
            <tr><th>№</th><th>Наименование</th><th class="num">Сумма</th></tr>
            <tr><td class="c">1</td><td>Оборудование и материалы по Спецификации (Приложение № 1)</td>
                <td class="num">${this.money(s.eq)}</td></tr>
            <tr><td class="c">2</td><td>Монтажные работы по Смете (Приложение № 2)</td>
                <td class="num">${this.money(s.works)}</td></tr>
            <tr><td colspan="2"><b>Итого к оплате</b></td><td class="num"><b>${this.money(s.total)}</b></td></tr>
        </table>

        <p class="n">2. Всего выполнено работ и передано оборудования на сумму ${this.money(s.total)}
        (${this.words(s.total)}).</p>
        <p class="n">3. Смонтированные системы испытаны на герметичность, работоспособность проверена.
        Заказчику переданы паспорта и гарантийные документы изготовителей оборудования, а также сведения
        о правилах эксплуатации (ст. 736 Гражданского кодекса РФ).</p>
        <p class="n">4. Работы выполнены в полном объёме и в срок. Заказчик претензий по объёму, качеству
        и срокам выполнения работ не имеет.</p>
        <p class="n">5. Гарантийный срок на выполненные работы — ${e(String(d.warrantyMonths || 0))} месяцев
        с даты подписания настоящего Акта.</p>
        <p class="n">6. Настоящий Акт составлен в двух экземплярах, имеющих равную юридическую силу,
        по одному для каждой из Сторон.</p>

        <table style="margin-top:6mm;"><tr>
            <td style="width:50%;"><b>ПОДРЯДЧИК</b><br>${e(c.name)}<br>${e(c.address).replace(/\n/g, '<br>')}</td>
            <td style="width:50%;"><b>ЗАКАЗЧИК</b><br>${e(d.clientName)}<br>${d.clientPhone ? 'тел.: ' + e(d.clientPhone) : ''}</td>
        </tr><tr>
            <td><div class="line"></div><span class="small">${e(d.signer || c.fio || '')} / подпись</span></td>
            <td><div class="line"></div><span class="small">${e(d.clientName)} / подпись</span></td>
        </tr></table>
        </body></html>`;
    }
};
