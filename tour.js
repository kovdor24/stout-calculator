// ===================== Режим обучения =====================
//
// Ведёт человека по всему пути: площадь → регион → котёл → система отопления →
// смета → работы → сохранение → ссылка клиенту или печать. Каждый шаг подсвечивает
// свой элемент и объясняет словами, зачем он нужен.
//
// Зачем это вообще: по журналу видно, что из 42 заведённых аккаунтов 18 не сделали
// ни одной сметы, и у 17 из них нет ни одного события — люди не «посчитали и не
// сохранили», а не посчитали ничего. Окно быстрого старта даёт готовую смету одним
// касанием, но не объясняет, что с ней делать дальше; обучение как раз про «дальше».
//
// Живёт отдельным файлом, а не внутри app.js, намеренно: app.js правят сразу
// несколько человек, и любая мелочь там даётся ценой разбора конфликтов. Здесь же
// всё своё — разметка, стили и логика, а в index.html уходит только галочка.
const Tour = {

    // Ключи в localStorage: включён ли режим и на каком шаге остановились.
    // Шаг храним, чтобы обучение пережило перезагрузку страницы — а она случится
    // обязательно, человек будет пробовать кнопки.
    LS_ON: 'tour_on',
    LS_STEP: 'tour_step',

    // Шаги. sel — либо строка для querySelector, либо функция, возвращающая элемент
    // (нужна там, где подсветить надо не сам переключатель, а блок вокруг него).
    // done — необязательное условие «человек это сделал»; если оно выполнилось, шаг
    // переключается сам, без нажатия «Дальше». Шаг, чей элемент не найден или скрыт,
    // пропускается: половина блоков появляется только при своих настройках.
    STEPS: [
        {
            key: 'quick',
            sel: '#quick_start_row',
            title: 'Быстрый старт',
            text: 'Если хочется сразу увидеть готовую смету — возьмите типовой объект отсюда, а потом поправьте под свой. Или заполняйте параметры сами, шаг за шагом.',
            done: () => app.state.area > 0
        },
        {
            key: 'area',
            sel: '#blk_main_area',
            title: 'Площадь дома',
            text: 'Главное число расчёта: от него зависят теплопотери, мощность котла, число радиаторов и длина трубы. Тяните ползунок или впишите площадь руками.',
            done: () => app.state.area > 0
        },
        {
            key: 'region',
            sel: '#reg_tabs',
            // Регион и стены живут под тумблером «Параметры объекта» и по умолчанию
            // закрыты. Раньше шаг молча пропускался — обучение проскакивало мимо двух
            // настроек, которые сильнее всего двигают мощность котла. Открываем сами.
            before: () => {
                const box = document.getElementById('chk_fast_obj_params');
                if (box && !box.checked && box.offsetParent) { box.checked = true; app.toggleFastObjectParams(true); }
            },
            title: 'Регион и город',
            text: 'Задаёт расчётную зимнюю температуру. Сибирь и Юг при одной площади дают разную мощность котла. Ниже можно выбрать конкретный город — так точнее.'
        },
        {
            key: 'mat',
            sel: '#mat_tabs',
            title: 'Стены',
            text: 'Насколько дом держит тепло. «Тёплый» — утеплённый каркас или газоблок с утеплителем, «Холодный» — старый дом без утепления. Если знаете состав стен, включите «Параметры объекта» и задайте слои.'
        },
        {
            key: 'fuel',
            sel: () => document.getElementById('fuel_gas') && document.getElementById('fuel_gas').closest('.control-item'),
            title: 'Тип котла',
            text: 'Газ или электричество. Для электрического ещё спросим про выделенную мощность и тариф — по ним считается стоимость отопления за сезон.'
        },
        {
            key: 'sys',
            sel: () => document.getElementById('sys_rad') && document.getElementById('sys_rad').closest('.control-item'),
            title: 'Чем греем',
            text: 'Радиаторы, тёплый пол или и то и другое. Для пола дальше появятся поля площади по этажам и шаг укладки трубы.',
            done: () => (app.state.systems || []).length > 0
        },
        {
            key: 'hw',
            sel: () => document.getElementById('chk_hw') && document.getElementById('chk_hw').closest('.control-item'),
            title: 'Горячая вода',
            text: 'Включите, если нужен бойлер. Объём подберётся по числу проживающих, а в смету добавится обвязка бойлера и, если попросите, рециркуляция.'
        },
        {
            key: 'eq',
            sel: '#tab_equipment',
            title: 'Смета готова',
            text: 'Здесь подобранное оборудование: котёл, бойлер, радиаторы, трубы, автоматика. Любую позицию можно заменить, убрать или задать своё количество — расчёт пересоберётся.'
        },
        {
            key: 'works',
            sel: '#tab_works',
            title: 'Монтажные работы',
            text: 'Вторая вкладка — работы с объёмами и расценками. Свои цены на монтаж задаются один раз в личном кабинете и подставляются во все сметы.',
            done: () => app.state.viewMode === 'works'
        },
        {
            key: 'total',
            // Строка итога, а не панель вокруг: closest('.panel') брал всю смету
            // целиком — подсветка в пол-экрана, и карточка подсказки неминуемо на неё
            // наезжала. Со скидкой берём и блок скидки, он прямо над итогом.
            sel: () => {
                const disc = document.getElementById('discount_block');
                if (disc && disc.offsetParent) return disc.parentElement;
                const t = document.getElementById('total_sum');
                return t && t.parentElement;
            },
            title: 'Итог и ваша наценка',
            text: 'Ползунок скидки и наценки меняет цену оборудования для клиента: рекомендованная цена остаётся у вас перед глазами, а в документ уходит ваша.'
        },
        {
            key: 'save',
            sel: '#btn_save_main',
            title: 'Сохранить',
            text: 'Смета уйдёт в облако и откроется на любом устройстве под вашим аккаунтом. Без этого расчёт живёт только в этом браузере.'
        },
        {
            key: 'send',
            sel: () => {
                const share = document.getElementById('btn_share_trigger');
                if (share && share.offsetParent) return share;
                return document.getElementById('btn_print_trigger');
            },
            title: 'Отдать клиенту',
            text: 'Ссылка открывает смету у клиента в браузере — он посмотрит её с телефона, согласует или попросит правки, а вы увидите это у себя. «Печать» делает тот же документ на бумагу или в PDF.',
            last: true
        }
    ],

    _step: 0,
    _timer: null,

    active: function () {
        try { return localStorage.getItem(this.LS_ON) === '1'; } catch (e) { return false; }
    },

    // Галочка в панели параметров
    toggle: function (on) {
        try { localStorage.setItem(this.LS_ON, on ? '1' : '0'); } catch (e) { }
        if (on) {
            this._step = this._savedStep();
            this.start();
        } else {
            this.stop();
        }
    },

    _savedStep: function () {
        try {
            const n = parseInt(localStorage.getItem(this.LS_STEP) || '0', 10);
            return (isNaN(n) || n < 0 || n >= this.STEPS.length) ? 0 : n;
        } catch (e) { return 0; }
    },

    // Восстановление после перезагрузки страницы
    init: function () {
        const box = document.getElementById('chk_tour');
        if (box) box.checked = this.active();
        if (this.active()) {
            this._step = this._savedStep();
            this.start();
        }
    },

    start: function () {
        this.injectStyles();
        this.show();
        if (this._timer) clearInterval(this._timer);
        // Полсекунды — компромисс: реакция на действие человека ощущается сразу,
        // а нагрузки нет. Следим за двумя вещами: не выполнил ли он шаг сам и не
        // уехал ли подсвеченный элемент после перерисовки сметы.
        this._timer = setInterval(() => this.tick(), 500);
    },

    stop: function () {
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        this.clearSpot();
        const card = document.getElementById('tour_card');
        if (card) card.remove();
        const box = document.getElementById('chk_tour');
        if (box) box.checked = false;
    },

    finish: function () {
        try { localStorage.setItem(this.LS_STEP, '0'); } catch (e) { }
        this._step = 0;
        this.toggle(false);
    },

    next: function () {
        if (this._step >= this.STEPS.length - 1) { this.finish(); return; }
        this._step++;
        this.save();
        this.show();
    },

    prev: function () {
        if (this._step <= 0) return;
        this._step--;
        this.save();
        this.show();
    },

    save: function () {
        try { localStorage.setItem(this.LS_STEP, String(this._step)); } catch (e) { }
    },

    target: function (step) {
        const s = step || this.STEPS[this._step];
        if (!s) return null;
        let el = null;
        try { el = typeof s.sel === 'function' ? s.sel() : document.querySelector(s.sel); } catch (e) { return null; }
        // offsetParent === null означает, что элемент или его родитель скрыты. Такой
        // шаг показывать нечестно: подсветка легла бы в пустоту.
        if (!el || (!el.offsetParent && getComputedStyle(el).position !== 'fixed')) return null;
        return el;
    },

    clearSpot: function () {
        document.querySelectorAll('.tour-spot').forEach(e => e.classList.remove('tour-spot'));
    },

    show: function () {
        // Пропускаем шаги, которым нечего подсветить, и те, что уже выполнены
        let guard = 0;
        while (guard++ < this.STEPS.length) {
            const s = this.STEPS[this._step];
            if (!s) { this.finish(); return; }
            // Шаг может сам открыть свёрнутый блок — иначе подсвечивать нечего
            if (s.before) { try { s.before(); } catch (e) { } }
            const el = this.target(s);
            const alreadyDone = s.done && !s.last && (() => { try { return s.done(); } catch (e) { return false; } })();
            if (el && !alreadyDone) break;
            if (this._step >= this.STEPS.length - 1) { this.finish(); return; }
            this._step++;
        }
        this.save();
        const step = this.STEPS[this._step];
        const el = this.target(step);
        if (!el) { this.finish(); return; }

        this.clearSpot();
        el.classList.add('tour-spot');
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }

        let card = document.getElementById('tour_card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'tour_card';
            document.body.appendChild(card);
        }
        const n = this._step + 1, total = this.STEPS.length;
        card.innerHTML =
            '<div class="tour-card-head">' +
            '<span class="tour-card-num">Шаг ' + n + ' из ' + total + '</span>' +
            '<span class="tour-card-x" onclick="Tour.finish()" title="Выключить обучение">&times;</span>' +
            '</div>' +
            '<div class="tour-card-title">' + step.title + '</div>' +
            '<div class="tour-card-text">' + step.text + '</div>' +
            '<div class="tour-card-btns">' +
            (this._step > 0 ? '<button type="button" class="tour-btn tour-btn-ghost" onclick="Tour.prev()">Назад</button>' : '') +
            '<button type="button" class="tour-btn" onclick="Tour.next()">' + (step.last ? 'Готово' : 'Дальше') + '</button>' +
            '</div>';
        this.place(card, el);
    },

    // Размещение карточки. На узком экране — полосой снизу: считать координаты
    // рядом с элементом там негде, а промахнуться мимо экрана легко.
    place: function (card, el) {
        // Низ экрана может быть занят баннером cookie (он лежит выше всего и на
        // телефоне съедает 165 пикселей). Прятать его на всё время обучения нельзя —
        // это может быть надолго, — поэтому просто не заезжаем на него.
        const busy = this.bottomBusy();
        const narrow = window.innerWidth < 760;
        if (narrow) {
            card.className = 'tour-card tour-card-bottom';
            card.style.left = ''; card.style.top = '';
            card.style.bottom = (busy + 10) + 'px';
            return;
        }
        card.style.bottom = '';
        card.className = 'tour-card';
        const b = el.getBoundingClientRect();
        const w = card.offsetWidth || 320;
        const h = card.offsetHeight || 160;
        const gap = 12;
        let left = b.left + b.width / 2 - w / 2;
        let top = b.bottom + gap;
        // Не помещается снизу — ставим сверху; не помещается и там — прижимаем к низу экрана
        const floor = window.innerHeight - busy;
        if (top + h > floor - 8) {
            const above = b.top - gap - h;
            top = above > 8 ? above : Math.max(8, floor - h - 8);
        }
        left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
        card.style.left = Math.round(left) + 'px';
        card.style.top = Math.round(top) + 'px';
    },

    // Сколько снизу занято чужим: сейчас это баннер cookie, но если появится ещё
    // что-то прижатое к низу, добавлять сюда.
    bottomBusy: function () {
        const banner = document.querySelector('.hc-cookie-banner');
        if (!banner) return 0;
        if (getComputedStyle(banner).display === 'none') return 0;
        const r = banner.getBoundingClientRect();
        if (r.bottom < window.innerHeight - 40) return 0;
        return Math.round(r.height) + 8;
    },

    tick: function () {
        if (!this.active()) { this.stop(); return; }
        const step = this.STEPS[this._step];
        if (!step) { this.finish(); return; }
        // Человек сделал то, о чём шаг — двигаемся дальше сами
        if (step.done && !step.last) {
            let done = false;
            try { done = !!step.done(); } catch (e) { done = false; }
            if (done) { this.next(); return; }
        }
        // Смета перерисовалась, элемент уехал или исчез — поправляем подсветку
        const el = this.target(step);
        if (!el) { this.show(); return; }
        if (!el.classList.contains('tour-spot')) { this.clearSpot(); el.classList.add('tour-spot'); }
        const card = document.getElementById('tour_card');
        if (card) this.place(card, el);
    },

    injectStyles: function () {
        if (document.getElementById('tour_styles')) return;
        const st = document.createElement('style');
        st.id = 'tour_styles';
        st.textContent = `
.tour-spot {
    outline: 2px solid var(--primary);
    outline-offset: 3px;
    border-radius: 10px;
    animation: tour-pulse 1.6s ease-in-out infinite;
}
@keyframes tour-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.35); }
    50% { box-shadow: 0 0 0 7px rgba(99, 102, 241, 0); }
}
.tour-card {
    position: fixed;
    z-index: 60000000;
    width: 320px;
    max-width: calc(100vw - 16px);
    background: var(--surface);
    color: var(--text-main);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
    padding: 14px 16px 12px;
}
body.dark-mode .tour-card { background: #1E1E1E; border-color: #333333; }
.tour-card-bottom {
    left: 8px !important;
    right: 8px;
    width: auto;
    top: auto !important;
    bottom: 10px;
}
.tour-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.tour-card-num { font-size: 11px; font-weight: 700; letter-spacing: 0.3px; color: var(--primary); text-transform: uppercase; }
.tour-card-x { font-size: 22px; line-height: 1; color: var(--text-sec); cursor: pointer; padding: 4px 8px; margin: -4px -8px 0 0; }
.tour-card-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.tour-card-text { font-size: 12.5px; line-height: 1.5; color: var(--text-sec); }
.tour-card-btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
.tour-btn {
    font: inherit; font-size: 13px; font-weight: 700;
    padding: 8px 16px; min-height: 36px; border-radius: 8px;
    border: none; background: var(--primary); color: #fff; cursor: pointer;
}
.tour-btn-ghost { background: transparent; color: var(--text-sec); border: 1px solid var(--border); }
@media print { .tour-card, .tour-spot { display: none !important; outline: none !important; } }
`;
        document.head.appendChild(st);
    }
};

// Обучение поднимаем после калькулятора: шаги читают app.state, и до его
// инициализации им нечего показывать.
window.addEventListener('load', () => {
    setTimeout(() => { try { Tour.init(); } catch (e) { console.warn('[Tour]', e); } }, 1200);
});
