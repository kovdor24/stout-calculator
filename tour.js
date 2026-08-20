// ===================== Режим обучения =====================
//
// Ведёт человека по всему пути: площадь → котёл → система отопления → смета →
// работы → сохранение → ссылка клиенту или печать. Каждый шаг подсвечивает свой
// элемент, объясняет словами, зачем он нужен, и показывает пальцем, что сделать.
//
// Регион, город и стены из обучения убраны намеренно: у них есть рабочие значения
// по умолчанию, смета считается и без них, а лежат они под свёрнутым тумблером
// «Параметры объекта» — обучение приходилось разворачивать его самому и тратить
// два шага из двенадцати на то, без чего первый расчёт прекрасно получается.
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
    // Отметка «человек решил сам». Без неё нельзя отличить выключенное обучение от
    // ещё не заданного: новичку мы включаем подсказки сами, и без этой отметки они
    // возвращались бы после каждой перезагрузки тому, кто их выключил.
    LS_CHOICE: 'tour_choice',

    // Шаги. sel — либо строка для querySelector, либо функция, возвращающая элемент
    // (нужна там, где подсветить надо не сам переключатель, а блок вокруг него).
    // done — необязательное условие «человек это сделал»; если оно выполнилось, шаг
    // переключается сам, без нажатия «Дальше». Шаг, чей элемент не найден или скрыт,
    // пропускается: половина блоков появляется только при своих настройках.
    // anim — ролик в карточке, показывает жест: потянуть, нажать, выбрать (см. reel).
    STEPS: [
        {
            // Первым шагом рассказываем про сам режим: до этого человек видел
            // карточку с подсказкой, но не понимал, откуда она взялась и как её
            // убрать — крестик выключает обучение молча, а найти кнопку в шапке
            // потом уже никто не догадывался.
            key: 'tour',
            // На телефоне кнопка обучения лежит в свёрнутом меню шапки (её блок
            // .header-main-controls там скрыт целиком), подсветить её нечем —
            // показываем на самой кнопке меню, а текст говорит про оба случая.
            sel: () => {
                const b = document.getElementById('btn_tour');
                if (b && b.offsetParent) return b;
                return document.querySelector('.menu-toggle-btn');
            },
            title: 'Это режим обучения',
            text: 'Калькулятор подсветит нужный элемент и объяснит, зачем он, — так по всему пути до готовой сметы. Включает и выключает подсказки кнопка со шапочкой выпускника в шапке сайта (на телефоне — внутри меню ☰). Крестик на карточке тоже выключает обучение; передумаете — нажмите кнопку ещё раз, и оно продолжится с того же места.',
            anim: { type: 'press', label: '🎓 Обучение' }
        },
        {
            // Ряд иконок в шапке объясняли только всплывающие подсказки, а их надо
            // сначала догадаться навести. Отсюда и вопрос «зачем эти кнопки».
            // Ролика у шага нет намеренно: текст и так длинный, шесть кнопок одним
            // жестом не покажешь, а карточка от этого росла бы на пол-экрана.
            key: 'header',
            sel: () => {
                const row = document.querySelector('.header-main-controls');
                if (row && row.offsetParent) return row;
                return document.querySelector('.menu-toggle-btn');
            },
            title: 'Кнопки в шапке',
            text: 'Слева направо: конверт — сообщения и уведомления; дискета — сохранить смету в облако; стрелки «‹ ›» — открыть смету по коду, которым с вами поделились; круговая стрелка — сбросить расчёт и начать с чистого листа; луна — светлая или тёмная тема; кубок — ваши баллы и место в рейтинге. Наведите на любую — подскажет, что делает. На телефоне весь ряд спрятан в меню ☰.'
        },
        {
            key: 'quick', mob: 'output',
            sel: '#quick_start_row',
            title: 'Быстрый старт',
            text: 'Если хочется сразу увидеть готовую смету — возьмите типовой объект отсюда, а потом поправьте под свой. Или заполняйте параметры сами, шаг за шагом.',
            anim: { type: 'press', label: '🏠 Типовой объект' },
            done: () => app.state.area > 0
        },
        {
            // Подсвечиваем .control-item вокруг вкладок, а не сами вкладки: у
            // .mode-selector-tabs своя рамка, и вторая рамка подсветки вплотную к ней
            // читалась как дефект вёрстки.
            key: 'mode', mob: 'inputs',
            sel: () => {
                const t = document.querySelector('.mode-selector-tabs');
                return t && t.closest('.control-item');
            },
            title: 'Быстрый или подробный',
            text: 'Быстрый считает дом целиком: одна площадь, один регион, один материал стен. Этого хватает, чтобы за минуту подобрать котёл и получить смету на согласование. Подробный разбирает дом по комнатам — у каждой своя площадь, окна, сторона света и вентиляция; теплопотери выходят честнее, и радиаторы обычно крупнее на 20–30 %. Начинайте с быстрого, переключайтесь, когда смета идёт в работу. Подробный доступен после входа в аккаунт.',
            anim: { type: 'pick', a: 'Быстрый', b: 'Подробный' }
        },
        {
            key: 'area', mob: 'inputs',
            sel: '#blk_main_area',
            title: 'Площадь дома',
            text: 'Главное число расчёта: от него зависят теплопотери, мощность котла, число радиаторов и длина трубы. Тяните ползунок или впишите площадь руками.',
            anim: { type: 'drag' },
            done: () => app.state.area > 0
        },
        {
            // Сам тумблер, а не его содержимое: разворачивать блок за человека —
            // это ещё два шага про регион и стены, которые из обучения убрали
            // намеренно (см. шапку файла). Здесь объясняем, зачем туда заходить.
            key: 'objparams', mob: 'inputs',
            sel: '#blk_fast_obj_params_toggle_wrap',
            title: 'Зачем менять параметры объекта',
            text: 'Под этим тумблером — регион, город, материал стен и окна. По умолчанию стоит Сибирь и стандартные стены: с запасом, чтобы смета получилась даже у того, кто ничего не трогал. Но именно отсюда берутся теплопотери, а из них — мощность котла и число секций радиаторов. Для Юга этот запас лишний и клиент переплатит, для холодного каркасника его не хватит и дом не прогреется. Найдите свой город и выберите стены — расчёт станет вашим, а не усреднённым.',
            anim: { type: 'toggle', label: 'Параметры объекта' }
        },
        {
            key: 'fuel', mob: 'inputs',
            sel: () => document.getElementById('fuel_gas') && document.getElementById('fuel_gas').closest('.control-item'),
            title: 'Тип котла',
            text: 'Газ или электричество. Для электрического ещё спросим про выделенную мощность и тариф — по ним считается стоимость отопления за сезон.',
            anim: { type: 'pick', a: 'Электро', b: 'Газ' }
        },
        {
            key: 'sys', mob: 'inputs',
            sel: () => document.getElementById('sys_rad') && document.getElementById('sys_rad').closest('.control-item'),
            title: 'Чем греем',
            text: 'Радиаторы, тёплый пол или и то и другое. Для пола дальше появятся поля площади по этажам и шаг укладки трубы.',
            anim: { type: 'pick', a: 'Радиаторы', b: 'Тёплый пол' },
            done: () => (app.state.systems || []).length > 0
        },
        {
            key: 'hw', mob: 'inputs',
            sel: () => document.getElementById('chk_hw') && document.getElementById('chk_hw').closest('.control-item'),
            title: 'Горячая вода',
            text: 'Включите, если нужен бойлер. Объём подберётся по числу проживающих, а в смету добавится обвязка бойлера и, если попросите, рециркуляция.',
            anim: { type: 'toggle', label: 'Горячая вода' }
        },
        {
            key: 'eq', mob: 'output',
            sel: '#tab_equipment',
            title: 'Смета готова',
            text: 'Здесь подобранное оборудование: котёл, бойлер, радиаторы, трубы, автоматика. Любую позицию можно заменить, убрать или задать своё количество — расчёт пересоберётся.',
            anim: { type: 'rows' }
        },
        {
            key: 'works', mob: 'output',
            sel: '#tab_works',
            title: 'Монтажные работы',
            text: 'Вторая вкладка — работы с объёмами и расценками. Свои цены на монтаж задаются один раз в личном кабинете и подставляются во все сметы.',
            anim: { type: 'pick', a: 'Оборудование', b: 'Работы' },
            done: () => app.state.viewMode === 'works'
        },
        {
            key: 'total', mob: 'output',
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
            text: 'Ползунок скидки и наценки меняет цену оборудования для клиента: рекомендованная цена остаётся у вас перед глазами, а в документ уходит ваша.',
            anim: { type: 'drag' }
        },
        {
            // На телефоне кнопка сохранения уезжает в свёрнутое меню шапки вместе со
            // всем рядом .header-main-controls, и шаг молча пропускался: обучение на
            // узком экране вообще не говорило, что смету надо сохранить, — а это
            // ровно то место, где расчёт перестаёт жить в одном браузере.
            key: 'save', mob: 'output',
            sel: () => {
                const b = document.getElementById('btn_save_main');
                if (b && b.offsetParent) return b;
                return document.querySelector('.menu-toggle-btn');
            },
            title: 'Сохранить',
            text: 'Смета уйдёт в облако и откроется на любом устройстве под вашим аккаунтом. Без этого расчёт живёт только в этом браузере. Кнопка — дискета в шапке сайта; на телефоне она внутри меню ☰.',
            anim: { type: 'press', label: 'Сохранить' }
        },
        {
            // Панели нет у гостя и на телефоне (см. .lk-rail в style.css) — шаг там
            // пропустится сам, как и любой другой со скрытым элементом.
            key: 'rail',
            sel: '#lk_rail',
            title: 'Меню разделов слева',
            text: 'Отсюда открывается всё ваше: «Объекты» — сохранённые сметы, «Заказы» — выставленные счета, «Прайс» — свои цены на монтаж, «Замены» — своё оборудование. «Реквизиты» и «Менеджер» заполняются один раз и сами подставляются в документы. Любой раздел открывается рядом со сметой, расчёт при этом никуда не денется. А саму панель можно перетащить за верхний хват наверх — разделы лягут лентой под шапкой; блоки внутри тоже переставляются.',
            anim: { type: 'press', label: 'Объекты' }
        },
        {
            key: 'send', mob: 'output',
            sel: () => {
                const share = document.getElementById('btn_share_trigger');
                if (share && share.offsetParent) return share;
                return document.getElementById('btn_print_trigger');
            },
            title: 'Отдать клиенту',
            text: 'Ссылка открывает смету у клиента в браузере — он посмотрит её с телефона, согласует или попросит правки, а вы увидите это у себя. «Скачать» делает тот же документ в PDF или Excel.',
            anim: { type: 'press', label: 'Ссылка для клиента' },
            last: true
        }
    ],

    _step: 0,
    _timer: null,

    active: function () {
        try { return localStorage.getItem(this.LS_ON) === '1'; } catch (e) { return false; }
    },

    // Человек сам решил, нужны ему подсказки или нет: нажал кнопку в шапке, закрыл
    // карточку крестиком или дошёл до конца. С этого момента за него не решаем.
    userChose: function () {
        try { return localStorage.getItem(this.LS_CHOICE) === '1'; } catch (e) { return false; }
    },

    rememberChoice: function () {
        try { localStorage.setItem(this.LS_CHOICE, '1'); } catch (e) { }
    },

    toggle: function (on) {
        try { localStorage.setItem(this.LS_ON, on ? '1' : '0'); } catch (e) { }
        if (on) {
            this._step = this._savedStep();
            this.start();
        } else {
            this.stop();
        }
        this.syncButton();
    },

    // Кнопка в шапке сайта (#btn_tour)
    toggleFromButton: function () {
        this.rememberChoice();
        this.toggle(!this.active());
    },

    // Вид кнопки: включённый режим подсвечен, подсказка объясняет, что будет по нажатию
    syncButton: function () {
        const btn = document.getElementById('btn_tour');
        if (!btn) return;
        const on = this.active();
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.title = on
            ? 'Режим обучения включён: подсказки на каждом шаге. Нажмите, чтобы выключить'
            : 'Режим обучения: подсказки на каждом шаге';
    },

    // Умолчание для тех, кто ещё не решал сам: новичку подсказки включаем, а тому,
    // у кого сметы уже сохранены, — нет, он и так знает, куда нажимать. Есть ли
    // сохранённые объекты, выясняет app.decideNewcomerDefaults (один запрос-счётчик
    // и только пока выбор не сделан). Зовут отсюда только вошедшего: у гостя смет
    // нет по определению, и обучение ему на входе не включаем.
    // Переключаем всегда, без проверки «а не в этом ли состоянии уже находимся»:
    // проверка сверялась с записью в localStorage, а она может разойтись с тем, что
    // на экране (запись потёрли, а карточка обучения осталась висеть) — и тогда
    // выключение молча ничего не выключало.
    applyDefault: function (hasObjects) {
        if (this.userChose()) return;
        this.toggle(!hasObjects);
    },

    _savedStep: function () {
        try {
            const n = parseInt(localStorage.getItem(this.LS_STEP) || '0', 10);
            return (isNaN(n) || n < 0 || n >= this.STEPS.length) ? 0 : n;
        } catch (e) { return 0; }
    },

    // Восстановление после перезагрузки страницы
    init: function () {
        this.syncButton();
        if (this.active()) {
            this._step = this._savedStep();
            this.start();
            return;
        }
        // Сами подсказки больше никому не включаем на входе. Гостю — потому что до
        // входа в аккаунт половина шагов ведёт в окно авторизации: и «Сохранить», и
        // разделы кабинета, и подробный режим расчёта. Вошедшему — потому что первым
        // делом ему показывают окно быстрого старта, а обучение включится после
        // него: этим занимается app.decideNewcomerDefaults и позовёт applyDefault
        // сам. Кнопка в шапке при этом работает всегда, в том числе у гостя: нажал —
        // значит хочет.
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
        this.syncButton();
    },

    // Крестик на карточке и конец последнего шага. И то и другое — решение человека,
    // поэтому сами подсказки ему больше не включаем.
    finish: function () {
        try { localStorage.setItem(this.LS_STEP, '0'); } catch (e) { }
        this._step = 0;
        this.rememberChoice();
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

    // Ролик в карточке: показывает жест, который ждут от человека на этом шаге —
    // потянуть ползунок, щёлкнуть тумблер, выбрать вкладку, нажать кнопку. Словами
    // «тяните ползунок» объясняется хуже, чем одной картинкой, где палец тянет.
    //
    // Рисуется на CSS, а не гифками: гифку пришлось бы держать в двух темах (на
    // тёмном фоне светлая подложка ролика режет глаз), она весит сотни килобайт на
    // каждый шаг и мылится на телефоне. Здесь же вся анимация — три прямоугольника
    // и курсор, который ходит по одним и тем же ключевым кадрам.
    HAND: '<svg class="ta-hand-i" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
        '<path d="M5 2.5l13.5 7.8-6 1.6-3 6.6z" fill="#fff" stroke="#111827" stroke-width="1.3" stroke-linejoin="round"/></svg>',

    reel: function (a) {
        if (!a || !a.type) return '';
        const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const hand = c => '<span class="ta-hand ' + c + '">' + this.HAND + '</span>';
        let inner = '';
        if (a.type === 'drag') {
            inner = '<div class="ta-track"><div class="ta-fill"></div><div class="ta-knob"></div>' +
                hand('ta-hand-drag') + '</div>';
        } else if (a.type === 'toggle') {
            inner = '<span class="ta-cap">' + esc(a.label || '') + '</span>' +
                '<span class="ta-switch"><i></i></span><span class="ta-ring ta-ring-sw"></span>' +
                hand('ta-hand-sw');
        } else if (a.type === 'pick') {
            inner = '<div class="ta-tabs"><span class="ta-tab">' + esc(a.a || '') + '</span>' +
                '<span class="ta-tab ta-tab-2">' + esc(a.b || '') + '</span></div>' + hand('ta-hand-pick');
        } else if (a.type === 'press') {
            inner = '<span class="ta-btn">' + esc(a.label || '') + '</span>' +
                '<span class="ta-ring ta-ring-btn"></span>' + hand('ta-hand-press');
        } else if (a.type === 'rows') {
            inner = '<div class="ta-rows"><i></i><i></i><i></i><i></i></div>';
        } else {
            return '';
        }
        return '<div class="tour-anim tour-anim-' + a.type + '" aria-hidden="true">' + inner + '</div>';
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

    // Вкладка телефона: 'inputs' — параметры, 'output' — смета. На широком экране
    // обе колонки на месте и переключать нечего.
    mobTab: function (which) {
        try {
            if (!app.isMobileLayout || !app.isMobileLayout()) return;
            if ((app.state.mobTab || 'inputs') === which) return;
            app.switchMobileTab(which);
        } catch (e) { }
    },

    clearSpot: function () {
        document.querySelectorAll('.tour-spot').forEach(e => e.classList.remove('tour-spot'));
    },

    // Пока на экране окно быстрого старта, подсказки прячем. Оба окна лежат поверх
    // сметы, перекрывают друг друга и вместе читаются как одна каша — а выбрать
    // типовой объект человек в этот момент всё равно не может, карточка обучения
    // закрывает половину списка. Окно закроют — tick вернёт карточку сам.
    blocked: function () {
        return !!document.getElementById('quick_start_overlay');
    },

    hideCard: function () {
        this.clearSpot();
        const card = document.getElementById('tour_card');
        if (card) card.style.display = 'none';
    },

    show: function () {
        if (this.blocked()) { this.hideCard(); return; }
        // Пропускаем шаги, которым нечего подсветить, и те, что уже выполнены
        let guard = 0;
        while (guard++ < this.STEPS.length) {
            const s = this.STEPS[this._step];
            if (!s) { this.finish(); return; }
            // Шаг может сам открыть свёрнутый блок — иначе подсвечивать нечего
            if (s.before) { try { s.before(); } catch (e) { } }
            let el = this.target(s);
            // На телефоне параметры и смета живут на разных вкладках, и половина
            // шагов оказывалась в скрытой: обучение обрывалось на «Горячей воде»,
            // не показав ни сметы, ни работ, ни отправки клиенту. Переключаем
            // вкладку только когда иначе шаг пришлось бы пропустить — чтобы не
            // выдёргивать человека, если он сам ушёл посмотреть другое.
            if (!el && s.mob) { this.mobTab(s.mob); el = this.target(s); }
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
        // Прокрутка мгновенная, а не плавная: задача шага — показать элемент, и
        // анимация тут не украшение, а лишний способ не доехать. Плавная прокрутка
        // считается композитором и в части окружений (свёрнутая вкладка, часть
        // встроенных браузеров) не двигается вовсе — подсветка оставалась за экраном.
        try { el.scrollIntoView({ behavior: 'auto', block: 'center' }); } catch (e) { }

        let card = document.getElementById('tour_card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'tour_card';
            document.body.appendChild(card);
        }
        // Карточку могли спрятать на время окна быстрого старта — возвращаем
        card.style.display = '';
        const n = this._step + 1, total = this.STEPS.length;
        card.innerHTML =
            '<div class="tour-card-head">' +
            '<span class="tour-card-num">Шаг ' + n + ' из ' + total + '</span>' +
            '<span class="tour-card-x" onclick="Tour.finish()" title="Выключить обучение">&times;</span>' +
            '</div>' +
            '<div class="tour-card-title">' + step.title + '</div>' +
            '<div class="tour-card-text">' + step.text + '</div>' +
            this.reel(step.anim) +
            '<div class="tour-card-btns">' +
            (this._step > 0 ? '<button type="button" class="tour-btn tour-btn-ghost" onclick="Tour.prev()">Назад</button>' : '') +
            '<button type="button" class="tour-btn" onclick="Tour.next()">' + (step.last ? 'Готово' : 'Дальше') + '</button>' +
            '</div>';
        this.place(card, el);
        // На узком экране карточка — полоса снизу, и подсвеченный блок, выведенный
        // ровно в центр, оказывался наполовину под ней. Досдвигаем страницу так,
        // чтобы он остался над карточкой.
        if (window.innerWidth < 760) this.keepClear(el, card);
    },

    keepClear: function (el, card) {
        const a = card.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        let shift = 0;
        if (card.classList.contains('tour-card-atop')) {
            // Карточка сверху — элемент должен оказаться ниже неё
            const floor = a.bottom + 12;
            if (r.top < floor) shift = r.top - floor;
        } else {
            const room = a.top - 12;
            if (r.bottom > room) shift = (r.height >= room - 60) ? (r.top - 70) : (r.bottom - room);
        }
        if (Math.abs(shift) > 2) window.scrollBy(0, Math.round(shift));
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
            // Элемент у самого низа страницы (кнопки печати, тумблеры в конце панели)
            // прокруткой из-под нижней полосы не вытащить — там уже конец документа.
            // В этом случае полосу поднимаем наверх экрана.
            const r = el.getBoundingClientRect();
            const low = r.top + r.height / 2 > window.innerHeight * 0.5;
            card.className = 'tour-card tour-card-bottom' + (low ? ' tour-card-atop' : '');
            card.style.left = ''; card.style.top = '';
            card.style.bottom = low ? '' : (busy + 10) + 'px';
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
        if (this.blocked()) { this.hideCard(); return; }
        const step = this.STEPS[this._step];
        if (!step) { this.finish(); return; }
        // Человек сделал то, о чём шаг — двигаемся дальше сами
        if (step.done && !step.last) {
            let done = false;
            try { done = !!step.done(); } catch (e) { done = false; }
            if (done) { this.next(); return; }
        }
        // Карточки ещё нет или её спрятало окно быстрого старта, а его уже закрыли —
        // собираем шаг заново, иначе подсказка не вернётся до следующего действия
        const shown = document.getElementById('tour_card');
        if (!shown || shown.style.display === 'none') { this.show(); return; }
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
.tour-card-atop {
    top: 10px !important;
    bottom: auto !important;
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

/* ---------- Ролик с жестом ---------- */
.tour-anim {
    position: relative;
    height: 62px;
    margin: 12px 0 2px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface-light);
    overflow: hidden;
}
body.dark-mode .tour-anim { background: #171717; border-color: #333333; }
.ta-hand { position: absolute; left: 0; top: 0; line-height: 0; pointer-events: none; z-index: 3; }
.ta-hand-i { filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35)); }
.ta-ring {
    position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px;
    border: 2px solid var(--primary); border-radius: 50%; opacity: 0; z-index: 2;
}

/* Тянем ползунок */
.ta-track { position: absolute; left: 16%; right: 16%; top: 50%; height: 6px; margin-top: -3px; border-radius: 3px; background: var(--border); }
.ta-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: var(--primary); animation: ta-fill 3.2s ease-in-out infinite; }
.ta-knob {
    position: absolute; top: 50%; width: 16px; height: 16px; margin: -8px 0 0 -8px;
    border-radius: 50%; background: var(--primary); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    animation: ta-slide 3.2s ease-in-out infinite;
}
.ta-hand-drag { top: 4px; margin-left: -3px; animation: ta-slide 3.2s ease-in-out infinite; }
@keyframes ta-fill { 0%, 8% { width: 10%; } 55%, 72% { width: 80%; } 100% { width: 10%; } }
@keyframes ta-slide { 0%, 8% { left: 10%; } 55%, 72% { left: 80%; } 100% { left: 10%; } }

/* Щёлкаем тумблером */
.ta-cap { position: absolute; left: 16px; top: 50%; margin-top: -8px; font-size: 12px; font-weight: 600; color: var(--text-sec); }
.ta-switch {
    position: absolute; right: 18px; top: 50%; margin-top: -11px;
    width: 42px; height: 22px; border-radius: 11px; background: var(--border);
    animation: ta-sw 2.8s ease-in-out infinite;
}
.ta-switch i {
    position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
    background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    animation: ta-sw-knob 2.8s ease-in-out infinite;
}
.ta-ring-sw { right: 24px; top: 50%; left: auto; animation: ta-ring 2.8s ease-in-out infinite; }
.ta-hand-sw { right: 16px; left: auto; top: 50%; animation: ta-tap 2.8s ease-in-out infinite; }
@keyframes ta-sw { 0%, 42% { background: var(--border); } 52%, 100% { background: var(--primary); } }
@keyframes ta-sw-knob { 0%, 42% { left: 3px; } 52%, 100% { left: 23px; } }
@keyframes ta-tap {
    0% { transform: translate(16px, 16px); }
    38% { transform: translate(2px, 3px); }
    48%, 58% { transform: translate(0, 0); }
    78%, 100% { transform: translate(16px, 16px); }
}
@keyframes ta-ring {
    0%, 44% { opacity: 0; transform: scale(0.5); }
    52% { opacity: 0.55; transform: scale(0.8); }
    72%, 100% { opacity: 0; transform: scale(1.35); }
}

/* Выбираем из двух */
.ta-tabs { position: absolute; left: 14px; right: 14px; top: 14px; bottom: 14px; display: flex; gap: 6px; }
.ta-tab {
    flex: 1; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; text-align: center; padding: 0 4px;
    border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface); color: var(--text-sec);
}
body.dark-mode .ta-tab { background: #1E1E1E; border-color: #3A3A3A; }
.ta-tab-2 { animation: ta-pick 3s ease-in-out infinite; }
.ta-hand-pick { left: 50%; top: 50%; animation: ta-pick-hand 3s ease-in-out infinite; }
@keyframes ta-pick {
    0%, 46% { border-color: var(--border); box-shadow: none; }
    56%, 100% { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); }
}
@keyframes ta-pick-hand {
    0% { transform: translate(-46px, 18px); }
    44% { transform: translate(14px, 2px); }
    54%, 66% { transform: translate(12px, 0); }
    100% { transform: translate(-46px, 18px); }
}

/* Нажимаем кнопку */
.ta-btn {
    position: absolute; left: 16px; right: 16px; top: 50%; margin-top: -16px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 8px; background: var(--primary); color: #fff;
    font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden;
    animation: ta-press 2.6s ease-in-out infinite;
}
.ta-ring-btn { left: 50%; top: 50%; animation: ta-ring 2.6s ease-in-out infinite; }
.ta-hand-press { left: 50%; top: 50%; animation: ta-tap 2.6s ease-in-out infinite; }
@keyframes ta-press { 0%, 42% { transform: scale(1); } 52% { transform: scale(0.965); } 64%, 100% { transform: scale(1); } }

/* Смета собирается строками */
.ta-rows { position: absolute; left: 16px; right: 16px; top: 12px; bottom: 12px; display: flex; flex-direction: column; justify-content: space-between; }
.ta-rows i { display: block; height: 6px; border-radius: 3px; background: var(--border); opacity: 0; animation: ta-row 3s ease-in-out infinite; }
.ta-rows i:nth-child(1) { width: 78%; animation-delay: 0s; }
.ta-rows i:nth-child(2) { width: 62%; animation-delay: 0.22s; }
.ta-rows i:nth-child(3) { width: 88%; animation-delay: 0.44s; }
.ta-rows i:nth-child(4) { width: 46%; background: var(--primary); animation-delay: 0.66s; }
@keyframes ta-row {
    0% { opacity: 0; transform: translateX(-10px); }
    18%, 76% { opacity: 1; transform: translateX(0); }
    94%, 100% { opacity: 0; transform: translateX(-10px); }
}

/* Человек попросил систему не двигать картинки — показываем ролик статичным кадром */
@media (prefers-reduced-motion: reduce) {
    .tour-anim *, .tour-spot { animation: none !important; }
    .ta-rows i { opacity: 1; }
}
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
