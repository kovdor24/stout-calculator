/**
 * Распознавание рукописных смет — интерфейс (бета, только для админов).
 *
 * Сделано мастером на весь экран, а не вкладкой рядом с «1. Оборудование»
 * и «2. Монтажные работы». Те вкладки — виды одной сметы, они отвечают на
 * вопрос «что внутри». Распознавание — действие с началом и концом:
 * загрузил, проверил, применил, вернулся в смету к подсвеченным строкам.
 *
 * Логика подбора живёт в recognize_match.js, перенос в смету — в
 * app.applyRecognized(). Здесь только интерфейс.
 */

const RecognizeUI = {

    PROXY: 'https://proxy.heatcalc.ru/gemini_proxy.php',

    ADD_HINT: 'Добавить ещё файлы для распознавания: фото, PDF, Excel, Word или HTML',

    // Отдельного списка админов здесь нет намеренно: он уже есть в
    // app.getAdminRole(), который смотрит и в _currentUserRow, и в
    // state.tgUser. Дубль приводил к тому, что «Админка» была видна,
    // а эта кнопка нет — вход заполняет не всегда одно и то же поле.

    _img: null,        // подготовленная картинка в base64
    _rows: [],         // распознанное, оно же правится пользователем
    _undo: [],
    _catIndex: null,
    _busy: false,

    // Кому открыто распознавание: списки приходят с сервера один раз при
    // запуске (loadAccess) и лежат здесь, потому что isAllowed() вызывается
    // на каждой отрисовке и ждать сеть не может.
    _access: null,

    isAllowed() {
        if (typeof app === 'undefined') return false;
        // Отладочный ключ: ?recognize=1 показывает кнопку без проверки роли.
        // Нужен, когда надо посмотреть мастер до того, как авторизация
        // успела заполнить данные пользователя.
        try {
            if (new URLSearchParams(location.search).get('recognize') === '1') return true;
        } catch (e) { /* location недоступен — не мешаем работе */ }

        // Администратору инструмент открыт по умолчанию, остальным — нет.
        // Но личная отметка сильнее: снятый в админке доступ приходит с сервера
        // как явное false и перебивает и должность, и доступ компании/региона.
        const acc = this._access;
        // Тот же источник данных о пользователе, что и у проектирования
        // (app.accessUserRow): один _currentUserRow заполняется только после
        // загрузки смет из облака, и на свежей странице логин выходил пустым —
        // личная отметка не находилась и вкладка не появлялась, хотя админ
        // её включил.
        const row = (typeof app.accessUserRow === 'function') ? app.accessUserRow() : (app._currentUserRow || {});
        const login = (row.email || row.username || '').toLowerCase();
        const own = (typeof app.accessFlagFor === 'function')
            ? app.accessFlagFor(acc && acc.users, login)
            : undefined;
        if (own !== undefined) return own;

        if (typeof app.hasFeatureRoleAccess === 'function' && app.hasFeatureRoleAccess()) return true;

        if (!acc) return false;
        const region = row.region || '';
        const dist = row.distributor_id || (app.state && app.state.distributorId);
        if (dist && (acc.dists || {})[dist]) return true;
        return !!(region && acc.regions && acc.regions[region]);
    },

    /**
     * Загрузка списков доступа. Молча пропускаем сбой: без списков вкладка
     * просто не появится. Списки те же, что у проектирования, поэтому берём
     * их через app — один запрос на страницу вместо двух одинаковых.
     */
    async loadAccess() {
        try {
            const data = (typeof app !== 'undefined' && typeof app.loadAccessLists === 'function')
                ? await app.loadAccessLists()
                : await (await fetch('https://proxy.heatcalc.ru/recognize_archive.php?access=1')).json();
            if (data && data.ok) {
                this._access = { users: data.users || {}, regions: data.regions || {}, dists: data.dists || {} };
                this.syncButton();
            }
        } catch (e) {
            console.warn('Списки доступа к распознаванию не получены:', e.message);
        }
    },

    /** Показ вкладки. Вызывается из app.syncUI() при каждой отрисовке. */
    syncButton() {
        const tab = document.getElementById('tab_recognize');
        if (tab) tab.style.display = this.isAllowed() ? '' : 'none';
    },

    /** Откат последнего применения — убирает разом все добавленные строки. */
    async undoApply() {
        if (!app._recognizeUndo) return;
        if (!await app.confirm('Убрать из сметы все позиции, добавленные распознаванием?')) return;
        app.undoRecognized();
        app.alert('Распознанные позиции убраны из сметы.');
    },

    // ------------------------------------------------------------------
    // Окно мастера
    // ------------------------------------------------------------------

    /**
     * Встраивание во вкладку «3. Распознавание».
     *
     * Вызывается при каждом переключении на вкладку, поэтому состояние
     * не сбрасывается: если монтажник ушёл посмотреть смету и вернулся,
     * его правки на шаге проверки должны остаться на месте.
     */
    mountInline(container) {
        if (!container) return;

        if (!document.getElementById('rec_body')) {
            container.innerHTML = `
              <div class="rec-panel">
                <div class="rec-head">
                  <div>
                    <div class="rec-title"><span id="rec_title_text">Распознавание рукописной сметы</span>
                      <span class="rec-beta">бета</span></div>
                    <div class="rec-steps">
                      <span class="rec-step on" data-s="1">1. Загрузка</span>
                      <span class="rec-step" data-s="2">2. Проверка</span>
                      <span class="rec-step" data-s="3" id="rec_step3">3. В смету</span>
                    </div>
                  </div>
                  <div class="rec-head-btns">
                    <button class="rec-btn-g" id="rec_undo_apply"
                            style="display:none" onclick="RecognizeUI.undoApply()">
                      ↶ Отменить прошлое распознавание</button>
                    <button class="rec-btn-g" id="rec_undo_plan"
                            style="display:none" onclick="RecognizePlan.undoApply()">
                      ↶ Вернуть комнаты</button>
                  </div>
                </div>
                <div class="rec-body" id="rec_body"></div>
              </div>`;

            this._onPaste = (e) => {
                // Вставка работает, только пока вкладка открыта и мы на шаге загрузки.
                if (app.state.viewMode !== 'recognize' || this._rows.length) return;
                if (typeof RecognizePlan !== 'undefined' && RecognizePlan._rows.length) return;

                // Поле ввода важнее: если курсор в нём, человек вставляет текст
                // туда, а не в распознавание.
                const t = e.target;
                if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;

                const cd = e.clipboardData;
                if (!cd) return;

                const it = [...(cd.items || [])].find(i => i.type.startsWith('image/'));
                if (it) { this.handleFile(it.getAsFile()); return; }

                /**
                 * Текст из письма или таблицы — такой же источник сметы, как файл.
                 * Оборачиваем его в File и отдаём тому же разбору, что и загруженный
                 * .html/.txt — отдельного пути для вставки не заводим.
                 *
                 * HTML берём в первую очередь: в нём сохранилась разбивка по колонкам,
                 * а в text/plain колонки часто уже слиплись в одну строку.
                 */
                let html = '';
                let plain = '';
                try { html = cd.getData('text/html') || ''; } catch (_) {}
                try { plain = cd.getData('text/plain') || ''; } catch (_) {}
                const src = html.trim() ? html : plain;
                if (!src || !src.trim()) return;

                e.preventDefault();
                const asHtml = !!html.trim();
                this.handleFile(new File(
                    [src],
                    asHtml ? 'вставленный текст.html' : 'вставленный текст.txt',
                    { type: asHtml ? 'text/html' : 'text/plain' }
                ));
            };
            document.addEventListener('paste', this._onPaste);

            this.renderUpload();
            this.loadPriceIndex();
        }

        const u = document.getElementById('rec_undo_apply');
        if (u) u.style.display = app._recognizeUndo ? '' : 'none';
        const up = document.getElementById('rec_undo_plan');
        if (up) up.style.display = (typeof RecognizePlan !== 'undefined' && RecognizePlan._undo) ? '' : 'none';
    },

    /** Возврат к смете после применения. */
    close() {
        app.setViewMode('equipment');
    },

    // ------------------------------------------------------------------
    // Что на файле: смета или план этажа
    //
    // Один и тот же экран загрузки принимает и то и другое, но разбираются
    // они разными правилами и уходят в разные места: смета — в позиции,
    // план — в комнаты подробного расчёта (RecognizePlan). Переключатель
    // на экране загрузки говорит, что грузят; в положении «Смета» лист всё
    // равно опознаётся автоматически — модель, увидев план вместо сметы,
    // отвечает docKind=floor_plan, и разбор сам уходит в план.
    // ------------------------------------------------------------------

    _docKind: 'auto',   // 'auto' — смета с автоопознанием плана, 'plan' — план этажа

    setDocKind(kind) {
        this._docKind = kind === 'plan' ? 'plan' : 'auto';
        this.syncDocKind();
    },

    /** Переключатель, подписи зоны загрузки и шапки — по выбранному виду. */
    syncDocKind() {
        const plan = this._docKind === 'plan';
        document.querySelectorAll('#rec_kind .rec-tab').forEach(b => {
            b.classList.toggle('on', (b.dataset.k === 'plan') === plan);
        });
        const t = document.querySelector('#rec_drop .rec-drop-t');
        const s = document.querySelector('#rec_drop .rec-drop-s');
        const ico = document.querySelector('#rec_drop .rec-drop-ico');
        if (t) t.textContent = plan ? 'Перетащите план этажа сюда' : 'Перетащите смету сюда';
        if (s) s.textContent = plan
            ? 'чертёж, скан, фото или эскиз от руки · PDF или картинка · один лист — один этаж, несколько этажей грузите несколькими файлами · или нажмите для выбора · или вставьте снимок через Ctrl+V'
            : 'фото, PDF, Excel, Word или HTML · или нажмите для выбора · или вставьте скриншот или текст через Ctrl+V';
        if (ico) ico.textContent = plan ? '📐' : '📄';
        const st = document.getElementById('rec_status');
        if (st && !this._img && !(this._imgs && this._imgs.length) && !this._text && !(this._docs && this._docs.length)) {
            st.textContent = plan ? 'Планы этажей: PDF, фото, сканы, эскизы' : 'Фото и сканы, а также PDF, Excel, Word, HTML';
        }
        this.setHead(plan ? 'plan' : 'estimate');
    },

    /** Заголовок мастера и подпись третьего шага — по тому, что разбираем. */
    setHead(kind) {
        const plan = kind === 'plan';
        const t = document.getElementById('rec_title_text');
        if (t) t.textContent = plan ? 'Распознавание плана этажа' : 'Распознавание рукописной сметы';
        const s3 = document.getElementById('rec_step3');
        if (s3) s3.textContent = plan ? '3. В расчёт' : '3. В смету';
    },

    /**
     * Индекс прайс-листа — около мегабайта, поэтому грузится лениво и только
     * при первом открытии вкладки. В обычной работе калькулятора он не нужен
     * и трафик не расходует.
     *
     * Если файла нет, распознавание продолжает работать по каталогу: прайс
     * лишь расширяет поиск, а не заменяет его.
     */
    async loadPriceIndex() {
        if (this._priceLoaded || typeof RecognizeMatch === 'undefined') return;
        this._priceLoaded = true;

        // Сначала сервер: там индекс пересобирается по расписанию из свежего
        // прайса. Файл в проекте — запасной вариант на случай, когда прокси
        // недоступен или обновление ещё не настроено.
        const sources = [
            'https://proxy.heatcalc.ru/price_index.php',
            'price_index.json',
        ];

        for (const url of sources) {
            try {
                const r = await fetch(url);
                if (!r.ok) throw new Error('HTTP ' + r.status);
                const idx = await r.json();
                if (!idx.items || !idx.items.length) throw new Error('пустой индекс');

                RecognizeMatch.setPriceIndex(idx.items);
                this._priceItems = idx.items;
                this._priceVersion = idx.version || '';
                this._catIndex = null;   // пул ручного поиска пересоберётся с прайсом
                // Карта «артикул → позиция» строится из того же пула. Без
                // сброса запомненная замена на позицию из прайса не нашлась
                // бы и подставилась сохранённой ценой — прошлогодней.
                this._catById = null;
                console.info(`Прайс-лист ${idx.version}: ${idx.items.length} позиций (${url})`);
                return;
            } catch (e) {
                console.warn('Прайс-лист не загружен из ' + url + ':', e.message);
            }
        }
        console.warn('Поиск идёт только по каталогу.');
    },

    step(n) {
        document.querySelectorAll('.rec-step').forEach(el => {
            el.classList.toggle('on', +el.dataset.s <= n);
        });
    },

    // ------------------------------------------------------------------
    // Шаг 1 — загрузка
    // ------------------------------------------------------------------

    renderUpload() {
        this.step(1);
        document.getElementById('rec_body').innerHTML = `
          ${this.draftBanner()}
          <div class="rec-kind" id="rec_kind">
            <span class="rec-kind-l">Что загружаете:</span>
            <button class="rec-tab on" data-k="auto" onclick="RecognizeUI.setDocKind('auto')"
                    title="Список материалов и работ: рукописный, счёт поставщика, КП">📋 Смету</button>
            <button class="rec-tab" data-k="plan" onclick="RecognizeUI.setDocKind('plan')"
                    title="План этажа: помещения с плана уйдут в расчёт по комнатам">📐 План этажа</button>
          </div>
          <div class="rec-drop" id="rec_drop">
            <div class="rec-drop-ico">📄</div>
            <div class="rec-drop-t">Перетащите смету сюда</div>
            <div class="rec-drop-s">фото, PDF, Excel, Word или HTML · или нажмите для выбора · или вставьте скриншот или текст через Ctrl+V</div>
          </div>
          <div class="rec-prev-row" id="rec_prev_wrap">
            <div class="rec-prev-wrap">
              <img id="rec_prev" class="rec-prev" alt="">
              <button class="rec-prev-turn" title="Повернуть снимок"
                      onclick="RecognizeUI.rotateSingle()">⟳</button>
              <button class="rec-prev-del" title="Убрать файл"
                      onclick="RecognizeUI.clearFile()">✕</button>
            </div>
            <button class="rec-add-tile" title="${this.ADD_HINT}"
                    onclick="RecognizeUI.pickMore()">+</button>
          </div>
          <div class="rec-actions">
            <button class="calc-dialog-btn calc-dialog-btn-confirm" id="rec_go"
                    style="display:none" disabled>Распознать</button>
            <span class="rec-status" id="rec_status">Фото и сканы, а также PDF, Excel, Word, HTML</span>
            <span class="rec-status" id="rec_quota" style="margin-left:auto"></span>
          </div>`;

        // Остаток на месяц подтягиваем сразу: лучше увидеть его до того,
        // как монтажник сфотографировал и загрузил смету.
        this.showQuota();
        this.syncDocKind();

        const drop = document.getElementById('rec_drop');
        drop.onclick = () => this.pickFiles(files => this.handleFiles(files));
        drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
        drop.ondragleave = () => drop.classList.remove('over');
        drop.ondrop = e => {
            e.preventDefault();
            drop.classList.remove('over');
            const files = [...e.dataTransfer.files];
            if (files.length) this.handleFiles(files);
        };
        document.getElementById('rec_go').onclick = () => this.run();
    },

    /** Диалог выбора файлов. Поле одноразовое: создали, спросили, убрали. */
    pickFiles(onPicked) {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = (typeof RecognizeFiles !== 'undefined') ? RecognizeFiles.ACCEPT : 'image/*';
        inp.multiple = true;   // многостраничная смета — несколько фото сразу
        inp.style.display = 'none';
        document.body.appendChild(inp);
        inp.onchange = e => {
            const files = [...e.target.files];
            inp.remove();
            if (files.length) onPicked(files);
        };
        inp.click();
    },

    /** Докладываем листы к уже загруженным, не начиная заново. */
    pickMore() {
        this.pickFiles(files => (this._docs && this._docs.length)
            ? this.addDocs(files)
            : this.addSheets(files));
    },

    /**
     * Добавление листов к уже загруженным.
     *
     * Один загруженный лист при этом переезжает в общий список: разницы между
     * «первым» и «дослатым» листом нет, все они страницы одной сметы.
     */
    async addSheets(files) {
        const start = this._imgs && this._imgs.length ? this._imgs.slice() : (this._img ? [this._img] : []);
        const added = [];
        let skipped = 0;

        this.setGoReady(false);

        for (const f of files) {
            const kind = RecognizeFiles ? RecognizeFiles.kindOf(f) : 'image';
            this.setStatus(`Готовлю лист ${start.length + added.length + 1}…`);

            if (kind === 'image') {
                const b = await this.prepareToBase64(f);
                if (b) added.push(b); else skipped++;
                continue;
            }

            // Документ дослать листом можно только картинками: текст и фото
            // в одном запросе не соединить, а сканы страниц — те же листы.
            try {
                const r = await RecognizeFiles.extract(f, (m) => this.setStatus(m),
                    { forceImages: this._docKind === 'plan' });
                if (r.images && r.images.length) {
                    r.images.forEach((b, k) => this.noteImgName(b,
                        r.images.length > 1 ? `${f.name} — стр. ${k + 1}` : f.name));
                    added.push(...r.images);
                }
                else skipped++;
            } catch (e) {
                skipped++;
            }
        }

        if (!added.length) {
            this.setGoReady(!!(start.length));
            this.setStatus(skipped
                ? 'Дослать листом можно фото или скан. Файл с текстом распознаётся отдельно — уберите загруженное и выберите его.'
                : 'Ничего не добавлено.');
            return;
        }

        this._imgs = start.concat(added);
        this._img = null;
        this._text = '';
        this._docs = [];
        this._fileKind = 'image';
        this._fileName = `${this._imgs.length} листов`;

        const dl = document.getElementById('rec_docs');
        if (dl) dl.style.display = 'none';
        this.showImagesPreview();
        this.setGoReady(true);

        const dups = this.duplicates().size;
        this.setStatus(`${this._imgs.length} листов готовы — можно распознавать все вместе` +
            (skipped ? ` · не удалось добавить: ${skipped}` : '') +
            (dups ? ` · повторов: ${dups}` : ''));
    },

    /** Удаление листа из набора по крестику на миниатюре. */
    removeSheet(i) {
        if (!this._imgs) return;
        this._imgs.splice(i, 1);
        if (!this._imgs.length) { this.clearFile(); return; }
        this._fileName = `${this._imgs.length} листов`;
        this.showImagesPreview();
        this.setStatus(`${this._imgs.length} ${this._imgs.length === 1 ? 'лист готов' : 'листов готовы'} — можно распознавать`);
    },

    /**
     * Зона «Перетащите смету сюда» нужна, только пока грузить нечего.
     * С уже загруженным файлом она ничего не добавляет, зато отодвигает
     * миниатюры и кнопку «Распознать» вниз за край экрана.
     */
    syncDrop() {
        const drop = document.getElementById('rec_drop');
        if (!drop) return;
        const has = !!this._img || !!(this._imgs && this._imgs.length) || !!this._text;
        drop.style.display = has ? 'none' : '';
    },

    /** Сброс загруженного: вернуться к пустой зоне и выбрать другой файл. */
    clearFile() {
        this.clearFileState();

        const wrap = document.getElementById('rec_prev_wrap');
        if (wrap) wrap.style.display = 'none';
        const box = document.getElementById('rec_imgs');
        if (box) box.style.display = 'none';
        const dup = document.getElementById('rec_dup');
        if (dup) dup.remove();
        const frame = document.getElementById('rec_frame');
        if (frame) frame.remove();
        const fnote = document.getElementById('rec_filenote');
        if (fnote) fnote.remove();
        const dl = document.getElementById('rec_docs');
        if (dl) dl.style.display = 'none';
        const err = document.querySelector('#rec_body .rec-err');
        if (err) err.remove();
        this.setGoReady(false);
        this.setStatus('Фото и сканы, а также PDF, Excel, Word, HTML');
        this.syncDrop();
    },

    /**
     * Полный сброс распознавания: вернуться к пустой загрузке.
     *
     * clearFile() убирает только загруженный файл, а разобранные строки живут
     * дальше. Само же состояние разбора лежит на RecognizeUI, а НЕ в app.state,
     * поэтому «Сбросить всё» в шапке его не касалось вовсе: монтажник сбрасывал
     * объект, возвращался во вкладку распознавания и видел там прежнюю смету
     * с прежним файлом. Отсюда и вопрос «почему сброс не реагирует».
     *
     * Прайс-индекс не трогаем: он весит около мегабайта, качается один раз за
     * сессию и к конкретному разбору отношения не имеет.
     *
     * silent — сброс без вопроса. Так его зовёт app.reset(): там монтажник уже
     * подтвердил, что начинает расчёт заново, и второй вопрос подряд лишний.
     */
    async resetAll(silent) {
        // На середине разбора сбрасывать нечего и опасно: ответ модели придёт
        // в уже очищенное состояние.
        if (this._busy) return;
        const planRows = (typeof RecognizePlan !== 'undefined') ? RecognizePlan._rows.length : 0;
        const hasWork = !!(this._rows && this._rows.length) || !!this._img ||
            !!(this._imgs && this._imgs.length) || !!this._text || !!planRows;
        // Состояние уже пустое, а таблица на экране осталась — так бывает
        // после сброса объекта из шапки. Спрашивать не о чем, очищать нечего:
        // просто возвращаем экран загрузки.
        if (!hasWork) { this.resetScreen(); return; }
        if (!silent && !await app.confirm(
            'Сбросить распознавание? Разобранные строки и загруженный файл будут очищены.')) return;

        this.clearFileState();
        // Сброс — это явная просьба начать с чистого листа, и предлагать
        // после неё «продолжить разбор» было бы издевательством.
        this.dropDraft();

        this._rows = [];
        this._skipped = [];
        this._onlyBad = false;
        this._profile = null;
        this._sys = null;
        this._sysFromModel = null;
        this._undo = [];
        this._tab = 'eq';
        this._ourWorks = null;
        this._analogOn = false;
        this._analogSaved = 0;
        this._deep = 0;
        this._mergeInfo = '';
        this._parseWarning = '';
        this._failedSheets = [];
        this._apiCalls = 0;
        this._fromCache = 0;
        this._cmpDiscount = null;
        this._cmpApplyDiscount = false;
        if (typeof RecognizePlan !== 'undefined') RecognizePlan.reset();

        this.resetScreen();
    },

    /**
     * Экран после сброса.
     *
     * Вкладка открыта — рисуем загрузку. Закрыта — стираем разметку панели
     * целиком: mountInline собирает её заново, только когда rec_body нет.
     *
     * Раньше здесь стояла проверка «перерисовываем, только если монтажник
     * сейчас на этой вкладке» — и сброс объекта из шапки в неё же и попадал:
     * app.reset() переключает вид на смету ДО того, как доходит до
     * распознавания. Состояние чистилось, а таблица прошлого разбора
     * оставалась висеть в разметке и показывалась при следующем открытии
     * вкладки. Кнопка «Сбросить распознавание» на ней тоже молчала:
     * сбрасывать было уже нечего.
     */
    resetScreen() {
        if (app.state.viewMode === 'recognize' && document.getElementById('rec_body')) {
            this.renderUpload();
            return;
        }
        const panel = document.getElementById('panel_recognize');
        if (panel) panel.innerHTML = '';
    },

    /** Поля загруженного файла — без обращения к разметке экрана загрузки. */
    clearFileState() {
        this._img = null;
        this._imgs = null;
        this._file = null;
        this._text = '';
        this._docs = [];
        this._fileName = '';
        this._fileKind = null;
        this._imgWarn = null;   // замечания по кадру относились к тем снимкам
        this._fileNote = '';    // и замечание о неполном чтении — тоже
    },

    /**
     * Кнопка «Распознать» показывается только когда есть что распознавать:
     * пустая неактивная кнопка на чистом экране лишь предлагает нажать на то,
     * что нажать нельзя.
     */
    setGoReady(ready) {
        const go = document.getElementById('rec_go');
        if (!go) return;
        go.style.display = ready ? '' : 'none';
        go.disabled = !ready;
    },

    /**
     * Ужимаем до 1600px по длинной стороне. Почерк на этом разрешении читается,
     * а запрос остаётся в пределах лимита прокси и не висит минуту.
     * Файл никуда не сохраняется — ни на сервер, ни в Supabase.
     */
    /**
     * Приём файла любого поддерживаемого вида.
     *
     * У Excel, Word, PDF и HTML текст уже есть внутри — его достаточно
     * извлечь и отправить в тот же промпт. Через распознавание картинки
     * такие файлы гонять незачем: это дороже, медленнее и добавляет ошибок
     * чтения там, где текст известен точно.
     */
    /**
     * Несколько листов сразу.
     *
     * Многостраничная рукописная смета фотографируется по листам. Все
     * картинки уходят в ОДИН запрос — так модель видит смету целиком и
     * понимает систему по всем листам сразу (сквозная нумерация, канализация
     * на одном листе и полипропилен на другом различаются в контексте).
     * Смешивать картинки и документы в одной загрузке нет смысла — если
     * попали разные виды, берём только картинки, а иначе первый файл.
     */
    async handleFiles(files) {
        const images = files.filter(f => RecognizeFiles && RecognizeFiles.kindOf(f) === 'image');
        if (images.length > 1) {
            this._text = '';
            this._docs = [];
            this._img = null;
            this._imgs = [];
            this._files = images;
            this._fileKind = 'image';
            this._fileName = `${images.length} листов`;
            this.setGoReady(false);
            const dl = document.getElementById('rec_docs');
            if (dl) dl.style.display = 'none';
            for (let i = 0; i < images.length; i++) {
                this.setStatus(`Готовлю лист ${i + 1} из ${images.length}…`);
                this._imgs.push(await this.prepareToBase64(images[i]));
            }
            this.showImagesPreview();
            this.setGoReady(true);
            this.setStatus(`${images.length} листов готовы — можно распознавать все вместе`);
            return;
        }

        await this.handleFile(files[0]);

        // Несколько файлов с текстом сразу: смету часто выгружают двумя-тремя
        // файлами. Первый уже разобран выше, остальные докладываем тем же
        // способом, что и по кнопке «+».
        const rest = files.slice(1);
        if (!rest.length) return;
        if (this._docs && this._docs.length) return this.addDocs(rest);
        // Первый файл мог лечь и одним снимком (_img), и пачкой страниц
        // (_imgs — многостраничный PDF). Раньше проверялся только первый
        // случай, и второй файл при многостраничном первом молча терялся:
        // два плана этажей, а разобран один.
        if (this._img || (this._imgs && this._imgs.length)) return this.addSheets(rest);
    },

    // ------------------------------------------------------------------
    // Подготовка снимка
    //
    // Всё, что происходит с фотографией между «выбрал файл» и «отправил на
    // распознавание». Три вещи, и каждая когда-то стоила разбора:
    //
    //   РАЗВОРОТ. Телефон пишет ориентацию меткой в файле, а не в пикселях.
    //     Через <img> + drawImage холст берёт пиксели как они лежат, и смета,
    //     снятая боком, уезжала боком: модель читала её так же, как прочитал
    //     бы человек, повернув голову, — то есть плохо.
    //   РАЗМЕР. Ужимаем до IMG_MAX по длинной стороне: больше не помогает
    //     разбору, а вес запроса и время ожидания растут.
    //   КАДР. Тёмный, мелкий или размытый снимок разбирается плохо, и сказать
    //     об этом надо ДО того, как потрачен запрос из месячного лимита.
    // ------------------------------------------------------------------

    IMG_MAX: 1600,

    /** Ключ снимка для заметок о кадре. Тот же приём, что у поиска дублей. */
    imgKey(b) {
        const s = String(b || '');
        return s.length + ':' + s.slice(0, 48) + s.slice(-48);
    },

    frameHintsOf(b) {
        return (this._imgWarn && this._imgWarn.get(this.imgKey(b))) || null;
    },

    /**
     * Имя файла у снимка. Нужно плану этажа: «1 этаж.pdf» подсказывает номер
     * этажа, а на самом листе подпись бывает мелкой или её нет. Ключ — от
     * содержимого, как у заметок о кадре: снимки удаляют, переставляют и
     * поворачивают, и параллельный массив имён разъехался бы.
     */
    noteImgName(b, name) {
        if (!b || !name) return;
        if (!this._imgNames) this._imgNames = new Map();
        this._imgNames.set(this.imgKey(b), String(name));
    },

    imgNameOf(b) {
        return (this._imgNames && this._imgNames.get(this.imgKey(b))) || '';
    },

    /**
     * Раскодировать файл с учётом метки поворота.
     *
     * createImageBitmap с imageOrientation разворачивает снимок ещё до
     * отрисовки. Где его нет — обычный путь через <img>: хуже, но работает.
     */
    async decodeImage(file) {
        if (typeof createImageBitmap === 'function') {
            try {
                return await createImageBitmap(file, { imageOrientation: 'from-image' });
            } catch (e) { /* старый браузер — ниже обычный путь */ }
        }
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('картинка не прочиталась'));
            img.src = URL.createObjectURL(file);
        });
    },

    /** Ужать и при необходимости повернуть. Возвращает холст. */
    drawScaled(src, turn) {
        const w0 = src.width, h0 = src.height;
        const k = Math.min(1, this.IMG_MAX / Math.max(w0, h0));
        const w = Math.round(w0 * k), h = Math.round(h0 * k);
        const swap = (turn === 90 || turn === 270);

        const c = document.createElement('canvas');
        c.width = swap ? h : w;
        c.height = swap ? w : h;
        const ctx = c.getContext('2d');
        if (turn) {
            ctx.translate(c.width / 2, c.height / 2);
            ctx.rotate(turn * Math.PI / 180);
            ctx.drawImage(src, -w / 2, -h / 2, w, h);
        } else {
            ctx.drawImage(src, 0, 0, w, h);
        }
        return c;
    },

    /**
     * Что не так с кадром.
     *
     * Меряем по середине снимка — там, где на фотографии сметы находится
     * текст, а не стол и не пальцы. Резкость считаем долей пикселей с резким
     * перепадом яркости: у чёткого снимка бумаги с текстом такие есть всегда,
     * у смазанного их нет вовсе. Средний перепад для этого не годится — на
     * почти белом листе с редкими строчками он низкий и у резкого снимка.
     */
    // Пороги подобраны на пробных кадрах листа с текстом, а не на глаз:
    //   яркость середины кадра — 245 у нормального снимка, 160 при заметном
    //     недосвете (ещё читается), 135 при сильном (уже плохо). Граница 140;
    //   доля резких перепадов — 0.033 у чёткого снимка против нуля при
    //     размытии всего в два пикселя. Граница 0.004 стоит на порядок ниже
    //     чёткого: лучше промолчать о слабой нерезкости, чем ругать хороший
    //     кадр, который монтажник и так видит своими глазами.
    /**
     * Про РАЗМЕР кадра не предупреждаем вовсе.
     *
     * Порог был 1100 (брали под рукописный лист), потом 600. Оба раза он
     * срабатывал на снимках, которые читались без единой ошибки: скан 514×683
     * дал 21 позицию из 21, фотография экрана 480×360 — все четыре строки.
     * Число пикселей по стороне ничего не говорит о том, читается ли текст:
     * это зависит от того, какая часть кадра занята строкой, а не от кадра.
     * Предупреждение, которое дважды подряд оказалось ложным, монтажник
     * перестаёт читать — и пропустит настоящее, про темноту и смаз. Их и
     * оставляем: они меряют сам снимок, а не его размер.
     */
    FRAME_DARK: 140,          // средняя яркость 0..255
    FRAME_EDGE_STEP: 40,      // перепад, который считаем «резким краем»
    FRAME_EDGE_MIN: 0.004,    // доля таких пикселей у чёткого снимка

    frameHints(canvas) {
        const hints = [];
        try {
            // Центральный кусок: и быстрее, и по делу.
            const side = Math.min(600, canvas.width, canvas.height);
            const x = Math.round((canvas.width - side) / 2);
            const y = Math.round((canvas.height - side) / 2);
            const d = canvas.getContext('2d').getImageData(x, y, side, side).data;

            let sum = 0, edges = 0, n = 0;
            const gray = new Uint8Array(side * side);
            for (let i = 0, p = 0; i < d.length; i += 4, p++) {
                const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
                gray[p] = g;
                sum += g;
            }
            const mean = sum / gray.length;

            for (let row = 0; row < side; row++) {
                for (let col = 1; col < side; col++) {
                    const p = row * side + col;
                    if (Math.abs(gray[p] - gray[p - 1]) > this.FRAME_EDGE_STEP) edges++;
                    n++;
                }
            }

            if (mean < this.FRAME_DARK) hints.push('темновато — при съёмке добавьте света');
            if (n && edges / n < this.FRAME_EDGE_MIN) {
                hints.push('снимок нерезкий — переснимите, это дешевле переделки сметы');
            }
        } catch (e) {
            // getImageData падает на «запятнанном» холсте. Подсказка — вещь
            // необязательная, ронять из-за неё подготовку снимка нельзя.
            return hints;
        }
        return hints;
    },

    /**
     * Выбранные файлы -> готовые снимки в base64, без единого касания экрана
     * загрузки. Картинка ужимается, PDF рисуется страницами (для плана —
     * всегда, даже если внутри есть текст).
     *
     * Нужна дочитыванию этажа: там листы докладывают уже на экране проверки,
     * где ни зоны загрузки, ни миниатюр, ни кнопки «Распознать» нет.
     */
    async prepareImages(files, onStatus) {
        const imgs = [];
        let skipped = 0;
        for (const f of files) {
            const kind = (typeof RecognizeFiles !== 'undefined') ? RecognizeFiles.kindOf(f) : 'image';
            if (onStatus) onStatus(`Готовлю ${f.name}…`);

            if (kind === 'image') {
                const b = await this.prepareToBase64(f);   // имя файла запоминает он сам
                if (b) imgs.push(b); else skipped++;
                continue;
            }
            if (!kind) { skipped++; continue; }

            try {
                const r = await RecognizeFiles.extract(f, (m) => { if (onStatus) onStatus(m); },
                    { forceImages: true });
                if (r.images && r.images.length) {
                    r.images.forEach((b, k) => this.noteImgName(b,
                        r.images.length > 1 ? `${f.name} — стр. ${k + 1}` : f.name));
                    imgs.push(...r.images);
                } else skipped++;
            } catch (e) {
                console.warn('Файл не прочитан:', f.name, e.message);
                skipped++;
            }
        }
        return { imgs, skipped };
    },

    /** Ужать картинку до base64 без показа — для пакетной загрузки. */
    async prepareToBase64(file) {
        try {
            const src = await this.decodeImage(file);
            const c = this.drawScaled(src, 0);
            const b = c.toDataURL('image/jpeg', 0.85).split(',')[1];

            const hints = this.frameHints(c);
            if (!this._imgWarn) this._imgWarn = new Map();
            this._imgWarn.set(this.imgKey(b), hints);
            this.noteImgName(b, file.name);
            if (src.close) src.close();
            return b;
        } catch (e) {
            return null;
        }
    },

    /**
     * Поворот листа на четверть по часовой.
     *
     * Метки EXIF на снимке может не быть вовсе — например, когда смету
     * прислали в мессенджере, а он её перекодировал. Тогда развернуть кадр
     * может только человек, и делать это до отправки дешевле, чем разбирать
     * лежащую на боку смету.
     */
    async rotateSheet(i) {
        const list = this._imgs || [];
        const b = list[i];
        if (!b) return;
        const turned = await this.turnBase64(b);
        if (!turned) return;
        list[i] = turned;
        this.showImagesPreview();
    },

    async rotateSingle() {
        if (!this._img) return;
        const turned = await this.turnBase64(this._img);
        if (!turned) return;
        this._img = turned;
        const prev = document.getElementById('rec_prev');
        if (prev) prev.src = 'data:image/jpeg;base64,' + turned;
        this.showFrameHints();
    },

    turnBase64(b) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const c = this.drawScaled(img, 90);
                const out = c.toDataURL('image/jpeg', 0.85).split(',')[1];
                // Заметки о кадре переносим на новый снимок: поворот меняет
                // ориентацию, но не резкость и не свет.
                if (!this._imgWarn) this._imgWarn = new Map();
                this._imgWarn.set(this.imgKey(out), this._imgWarn.get(this.imgKey(b)) || []);
                this.noteImgName(out, this.imgNameOf(b));
                resolve(out);
            };
            img.onerror = () => resolve(null);
            img.src = 'data:image/jpeg;base64,' + b;
        });
    },

    /**
     * Замечание о самом файле: что-то из него в разбор не попало.
     *
     * Показывается на экране загрузки и повторяется на экране проверки —
     * там, где монтажник сверяет строки. Одного показа мало: между загрузкой
     * и проверкой проходит минута ожидания, и предупреждение забывается.
     */
    showFileNote() {
        const host = document.getElementById('rec_body');
        if (!host || !this._fileNote) return;
        let box = document.getElementById('rec_filenote');
        if (!box) {
            box = document.createElement('div');
            box.id = 'rec_filenote';
            box.className = 'rec-frame';
            const actions = host.querySelector('.rec-actions');
            if (actions) host.insertBefore(box, actions); else host.appendChild(box);
        }
        box.innerHTML = `<b>Файл прочитан не полностью</b><div>${
            String(this._fileNote).replace(/[&<>]/g, '')}</div>`;
    },

    /** Строка с замечаниями по кадру под миниатюрами. */
    showFrameHints() {
        const host = document.getElementById('rec_body');
        if (!host) return;
        let box = document.getElementById('rec_frame');
        const list = (this._imgs && this._imgs.length) ? this._imgs : (this._img ? [this._img] : []);

        const lines = [];
        list.forEach((b, i) => {
            const h = this.frameHintsOf(b);
            if (h && h.length) {
                lines.push((list.length > 1 ? `Лист ${i + 1}: ` : '') + h.join(' · '));
            }
        });

        if (!lines.length) { if (box) box.remove(); return; }
        if (!box) {
            box = document.createElement('div');
            box.id = 'rec_frame';
            box.className = 'rec-frame';
            const actions = host.querySelector('.rec-actions');
            if (actions) host.insertBefore(box, actions); else host.appendChild(box);
        }
        box.innerHTML = `<b>Проверьте кадр</b> — распознать можно и так, но ошибок будет больше.
            <div>${lines.map(l => `<div>${l.replace(/[&<>]/g, '')}</div>`).join('')}</div>`;
    },

    /** Ряд миниатюр загруженных листов. */
    showImagesPreview() {
        const wrap = document.getElementById('rec_prev_wrap');
        if (wrap) wrap.style.display = 'none';
        let box = document.getElementById('rec_imgs');
        if (!box) {
            box = document.createElement('div');
            box.id = 'rec_imgs';
            box.className = 'rec-imgs';
            const host = document.getElementById('rec_body');
            const actions = host && host.querySelector('.rec-actions');
            if (actions) host.insertBefore(box, actions); else if (host) host.appendChild(box);
        }
        const dups = this.duplicates();
        box.innerHTML = (this._imgs || []).map((b, i) => {
            const first = dups.get(i);
            return `<div class="rec-thumb${first === undefined ? '' : ' dup'}"${
                first === undefined ? '' : ` title="Тот же лист, что и №${first + 1}"`}>
               <img src="data:image/jpeg;base64,${b}" alt="лист ${i + 1}"><span>${i + 1}</span>
               ${first === undefined ? '' : '<em class="rec-dup-tag">дубль</em>'}
               ${(this.frameHintsOf(b) || []).length ? '<em class="rec-frame-tag" title="Есть замечания по кадру — смотрите под миниатюрами">кадр</em>' : ''}
               <button class="rec-thumb-turn" title="Повернуть лист"
                       onclick="RecognizeUI.rotateSheet(${i})">⟳</button>
               <button class="rec-thumb-del" title="Убрать лист"
                       onclick="RecognizeUI.removeSheet(${i})">✕</button></div>`;
        }).join('') +
            `<button class="rec-add-tile" title="${this.ADD_HINT}"
                     onclick="RecognizeUI.pickMore()">+</button>`;
        box.style.display = 'flex';
        this.showDupNote(dups, box);
        this.showFrameHints();
        this.syncDrop();
    },

    /**
     * Поиск повторно загруженных листов.
     *
     * Сравниваем подготовленные картинки: один и тот же файл после ужатия
     * даёт байт в байт одинаковый base64, а разные снимки одной бумаги —
     * нет. Так дубль ловится независимо от имени файла.
     *
     * Возвращает Map: индекс повтора -> индекс первого такого же листа.
     */
    duplicates() {
        const seen = new Map();
        const dups = new Map();
        (this._imgs || []).forEach((b, i) => {
            if (!b) return;
            // Ключ короткий, чтобы не гонять мегабайтные строки в хэш,
            // а полное сравнение делается только при совпадении ключа.
            const key = b.length + ':' + b.slice(0, 48) + b.slice(-48);
            const first = seen.get(key);
            if (first !== undefined && this._imgs[first] === b) dups.set(i, first);
            else if (first === undefined) seen.set(key, i);
        });
        return dups;
    },

    /** Предупреждение о дублях с кнопкой «убрать повторы». */
    showDupNote(dups, box) {
        let note = document.getElementById('rec_dup');
        if (!dups.size) { if (note) note.remove(); return; }

        if (!note) {
            note = document.createElement('div');
            note.id = 'rec_dup';
            note.className = 'rec-dupnote';
            box.parentNode.insertBefore(note, box.nextSibling);
        }
        const list = [...dups.entries()]
            .map(([i, first]) => `лист ${i + 1} = лист ${first + 1}`).join(', ');
        note.innerHTML = `<span>Похоже, один и тот же файл загружен дважды: ${list}.
            Дубли подсвечены — распознавать их повторно не нужно.</span>
          <button class="rec-btn-g" onclick="RecognizeUI.removeDuplicates()">Убрать повторы (${dups.size})</button>`;
    },

    /** Удаление повторов: остаётся первый экземпляр каждого листа. */
    removeDuplicates() {
        const dups = this.duplicates();
        if (!dups.size) return;
        this._imgs = this._imgs.filter((_, i) => !dups.has(i));
        this._fileName = `${this._imgs.length} листов`;
        this.showImagesPreview();
        this.setStatus(`Повторы убраны · ${this._imgs.length} ${
            this._imgs.length === 1 ? 'лист' : 'листов'} — можно распознавать`);
    },

    async handleFile(file) {
        this._img = null;
        this._imgs = null;
        this._text = '';
        this._docs = [];
        this._fileName = file.name || '';
        this._file = file;              // держим оригинал для архива
        const oldImgs = document.getElementById('rec_imgs');
        if (oldImgs) oldImgs.style.display = 'none';
        const oldDocs = document.getElementById('rec_docs');
        if (oldDocs) oldDocs.style.display = 'none';
        const oldDup = document.getElementById('rec_dup');
        if (oldDup) oldDup.remove();
        const oldPrev = document.getElementById('rec_prev_wrap');
        if (oldPrev) oldPrev.style.display = 'none';

        if (typeof RecognizeFiles === 'undefined') { this.prepare(file); return; }

        const kind = RecognizeFiles.kindOf(file);
        this._fileKind = kind;
        if (!kind) {
            this.setStatus('Формат не поддерживается. Нужны фото, PDF, Excel, Word или HTML.');
            return;
        }
        if (kind === 'image') { this.prepare(file); return; }

        this.setGoReady(false);

        try {
            // План этажа читается только как картинка: текстовый слой чертежа
            // — это размерные цепочки и подписи, а не помещения.
            const r = await RecognizeFiles.extract(file, (m) => this.setStatus(m),
                { forceImages: this._docKind === 'plan' });

            // Читатель файла мог взять не всё — например, у PDF есть потолок
            // страниц. Молчать об этом нельзя: неполная смета выглядит ровно
            // как полная, и заметить пропажу монтажнику не по чему.
            this._fileNote = r.note || '';
            if (this._fileNote) this.showFileNote();

            if (r.images && r.images.length) {
                r.images.forEach((b, k) => this.noteImgName(b,
                    r.images.length > 1 ? `${file.name} — стр. ${k + 1}` : file.name));
            }

            if (r.images && r.images.length > 1) {
                /**
                 * Многостраничный скан — это листы сметы, все до одного.
                 *
                 * Раньше отсюда бралась ТОЛЬКО первая страница: «возьму первую
                 * из 17» — и семнадцатистраничная спецификация превращалась в
                 * одну. Разбор по листам в калькуляторе есть и работает (им же
                 * пользуется кнопка «+»), просто этот путь его не звал.
                 */
                this._imgs = r.images;
                this._img = null;
                this._fileKind = 'image';
                const dl = document.getElementById('rec_docs');
                if (dl) dl.style.display = 'none';
                this.showImagesPreview();
                this.setStatus(`${r.images.length} ${
                    this.plural(r.images.length, 'страница', 'страницы', 'страниц')
                    } PDF готовы — распознаю их как листы сметы`);
            } else if (r.images && r.images.length) {
                // Одна страница: обычный путь с превью снимка.
                this._img = r.images[0];
                const prev = document.getElementById('rec_prev');
                const wrap = document.getElementById('rec_prev_wrap');
                if (prev) prev.src = 'data:image/jpeg;base64,' + this._img;
                if (wrap) wrap.style.display = 'flex';
                this.syncDrop();
                this.setStatus('Страница PDF готова — распознаю как изображение');
            } else if (r.text) {
                this._docs = [{ name: file.name || 'файл', kind, file, text: this.trimText(r.text) }];
                this.syncDocs();
                this.showDocsPreview();
                this.setStatus(this.docsStatus());
            } else {
                this.setStatus('В файле не нашлось ни текста, ни страниц для распознавания.');
                return;
            }
            this.setGoReady(true);
        } catch (e) {
            this.setStatus('');
            const body = document.getElementById('rec_body');
            if (body) {
                const err = document.createElement('div');
                err.className = 'rec-err';
                err.textContent = 'Не удалось прочитать файл: ' + e.message;
                body.appendChild(err);
            }
        }
    },

    /**
     * Отсечение шума и ограничение размера.
     *
     * Полное КП из калькулятора начинается с расчёта теплопотерь: десятки
     * строк «Требуются X Вт, подобран Y Вт, запас Z%». Для распознавания это
     * мусор, а модель на нём думает так долго, что упирается в таймаут
     * ретранслятора. Отрезаем всё до таблицы оборудования по её заголовку,
     * а остаток ещё и ограничиваем по длине.
     */
    /**
     * Потолок объёма текста.
     *
     * Раньше стоял на 24 000 символов, потому что всё уходило одним запросом
     * и больше в него не помещалось. Теперь длинный текст режется на части
     * (splitText), и предел задаёт не запрос, а месячный лимит монтажника:
     * каждая часть стоит одного обращения к распознаванию.
     */
    trimText(text) {
        const MAX = this.TEXT_CHUNK * this.TEXT_MAX_CHUNKS;

        // Заголовок таблицы оборудования: «# НАИМЕНОВАНИЕ … КОЛ … СУММА».
        // Всё выше него — расчётная часть, она не нужна.
        const m = text.match(/(наименовани[ея][\s\S]{0,60}?(кол|сумм|цена))/i);
        if (m && m.index > 200) {
            text = text.slice(m.index);
        }

        if (text.length > MAX) {
            // Хвост документа оставляем всегда: там стоит итоговая сумма, по
            // которой сверяется полнота разбора. Обрезка «по первые N символов»
            // выбрасывала именно её, и на длинной смете — там, где строка
            // теряется чаще всего, — проверять было нечем.
            const TAIL = 1500;
            text = text.slice(0, MAX - TAIL) +
                '\n[середина документа обрезана по длине; ниже — его конец]\n' +
                text.slice(-TAIL);
        }
        return text;
    },

    // ------------------------------------------------------------------
    // Файлы с готовым текстом: PDF, Excel, Word, HTML
    //
    // Показываем не сам извлечённый текст, а плитку файла — такую же, как
    // миниатюра фото. Простыня моноширинного текста ничего не даёт: править
    // её нельзя, читать незачем, а занимает она весь экран и отодвигает
    // кнопку «Распознать». Плитка отвечает на единственный нужный вопрос —
    // что загружено и прочиталось ли оно.
    // ------------------------------------------------------------------

    DOC_ICONS: {
        pdf:  { label: 'PDF',  color: '#ef4444' },
        xlsx: { label: 'XLS',  color: '#16a34a' },
        xls:  { label: 'XLS',  color: '#16a34a' },
        docx: { label: 'DOC',  color: '#2563eb' },
        html: { label: 'HTML', color: '#f59e0b' },
        text: { label: 'TXT',  color: '#64748b' },
    },

    /** Плитки загруженных файлов и кнопка «+». */
    showDocsPreview() {
        const wrap = document.getElementById('rec_prev_wrap');
        if (wrap) wrap.style.display = 'none';
        const imgs = document.getElementById('rec_imgs');
        if (imgs) imgs.style.display = 'none';

        let box = document.getElementById('rec_docs');
        if (!box) {
            box = document.createElement('div');
            box.id = 'rec_docs';
            box.className = 'rec-imgs';
            const host = document.getElementById('rec_body');
            const actions = host && host.querySelector('.rec-actions');
            if (actions) host.insertBefore(box, actions); else if (host) host.appendChild(box);
        }

        box.innerHTML = (this._docs || []).map((d, i) => {
            const ic = this.DOC_ICONS[d.kind] || this.DOC_ICONS.text;
            const lines = d.text.split('\n').length;
            const name = d.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            return `<div class="rec-doc" title="${name}">
               <div class="rec-doc-ic" style="background:${ic.color}">${ic.label}</div>
               <div class="rec-doc-name">${name}</div>
               <div class="rec-doc-sub">${lines} ${this.plural(lines, 'строка', 'строки', 'строк')}</div>
               <button class="rec-thumb-del" title="Убрать файл"
                       onclick="RecognizeUI.removeDoc(${i})">✕</button></div>`;
        }).join('') +
            `<button class="rec-add-tile" title="${this.ADD_HINT}"
                     onclick="RecognizeUI.pickMore()">+</button>`;
        box.style.display = 'flex';
        this.syncDrop();
    },

    plural(n, one, few, many) {
        const a = Math.abs(n) % 100, b = a % 10;
        if (a > 10 && a < 20) return many;
        if (b > 1 && b < 5) return few;
        return b === 1 ? one : many;
    },

    /**
     * Сборка общего текста из загруженных файлов.
     *
     * Несколько файлов уходят в ОДИН запрос: это части одной сметы, и модель
     * должна видеть их вместе. Заголовок с именем ставим только когда файлов
     * больше одного — при единственном он лишняя строка в промпте.
     */
    syncDocs() {
        const MAX = 24000;
        const docs = this._docs || [];
        let text = docs.length > 1
            ? docs.map(d => `[Файл: ${d.name}]\n${d.text}`).join('\n\n')
            : (docs[0] ? docs[0].text : '');
        if (text.length > MAX) text = text.slice(0, MAX) + '\n[текст обрезан — распознаётся начало сметы]';

        this._text = text;
        this._fileKind = docs.length ? docs[0].kind : null;
        this._file = docs.length ? docs[0].file : null;      // оригинал для архива
        this._fileName = docs.length === 1
            ? docs[0].name
            : `${docs.length} ${this.plural(docs.length, 'файл', 'файла', 'файлов')}`;
    },

    docsStatus() {
        const docs = this._docs || [];
        const lines = docs.reduce((s, d) => s + d.text.split('\n').length, 0);
        if (docs.length === 1) {
            return `${docs[0].name}: извлечено ${lines} ${
                this.plural(lines, 'строка', 'строки', 'строк')} текста, можно распознавать`;
        }
        return `${docs.length} ${this.plural(docs.length, 'файл готов', 'файла готовы', 'файлов готовы')} · ` +
            `${lines} ${this.plural(lines, 'строка', 'строки', 'строк')} текста — можно распознавать все вместе`;
    },

    /** Докладываем файлы с текстом к уже загруженным. */
    async addDocs(files) {
        this.setGoReady(false);
        let skipped = 0;

        for (const f of files) {
            const kind = RecognizeFiles ? RecognizeFiles.kindOf(f) : null;
            // Фото к тексту не подмешать: это разные виды запроса.
            if (!kind || kind === 'image') { skipped++; continue; }
            this.setStatus(`Читаю ${f.name}…`);
            try {
                const r = await RecognizeFiles.extract(f, (m) => this.setStatus(m));
                if (r.text) this._docs.push({ name: f.name || 'файл', kind, file: f, text: this.trimText(r.text) });
                else skipped++;
            } catch (e) {
                skipped++;
            }
        }

        this.syncDocs();
        this.showDocsPreview();
        this.setGoReady(!!this._text);
        this.setStatus(this.docsStatus() +
            (skipped ? ` · не удалось добавить: ${skipped} (фото и сканы к файлу с текстом не добавляются)` : ''));
    },

    /** Удаление файла из набора по крестику на плитке. */
    removeDoc(i) {
        if (!this._docs) return;
        this._docs.splice(i, 1);
        if (!this._docs.length) { this.clearFile(); return; }
        this.syncDocs();
        this.showDocsPreview();
        this.setStatus(this.docsStatus());
    },

    async prepare(file) {
        let src;
        try {
            src = await this.decodeImage(file);
        } catch (e) {
            this.setStatus('Картинка не прочиталась — попробуйте другой файл.');
            return;
        }

        const c = this.drawScaled(src, 0);
        const url = c.toDataURL('image/jpeg', 0.85);
        this._img = url.split(',')[1];

        if (!this._imgWarn) this._imgWarn = new Map();
        this._imgWarn.set(this.imgKey(this._img), this.frameHints(c));
        this.noteImgName(this._img, file.name);
        if (src.close) src.close();

        const prev = document.getElementById('rec_prev');
        const wrap = document.getElementById('rec_prev_wrap');
        if (prev) prev.src = url;
        if (wrap) wrap.style.display = 'flex';
        this.syncDrop();
        // Убираем плитки файлов, если до этого грузили файл с текстом.
        const dl = document.getElementById('rec_docs');
        if (dl) dl.style.display = 'none';
        this.showFrameHints();
        this.setGoReady(true);
        this.setStatus(`${c.width}×${c.height}, ~${Math.round(this._img.length / 1365)} КБ — можно распознавать`);
    },

    setStatus(t) {
        const el = document.getElementById('rec_status');
        if (el) el.textContent = t;
    },

    // ------------------------------------------------------------------
    // Индикатор хода работы
    //
    // Распознавание занимает десятки секунд, и без обратной связи пауза
    // выглядит зависанием. Показываем этапы: что уже сделано, что идёт
    // сейчас, и сколько прошло секунд.
    // ------------------------------------------------------------------

    // Этапы разные для картинки и для текста: у файла с готовым текстом нет
    // ни подготовки изображения, ни чтения почерка.
    STAGES_IMG: [
        'Готовим изображение',
        'Читаем рукописный текст',
        'Ищем позиции в каталоге',
        'Проставляем цены и разделы',
    ],
    STAGES_TEXT: [
        'Отправляем текст',
        'Разбираем позиции',
        'Ищем в каталоге',
        'Проставляем цены и разделы',
    ],
    // План этажа: ни каталога, ни цен — помещения, площади, окна.
    STAGES_PLAN: [
        'Готовим изображение',
        'Читаем план: помещения и площади',
        'Считаем окна и наружные стены',
        'Собираем комнаты для расчёта',
    ],

    /** kind: true — текст, 'plan' — план этажа, иначе снимок сметы. */
    progressStart(kind) {
        this.STAGES = kind === 'plan' ? this.STAGES_PLAN : (kind ? this.STAGES_TEXT : this.STAGES_IMG);
        this._tips = kind === 'plan' ? this.TIPS_PLAN : this.TIPS;
        const host = document.getElementById('rec_body');
        if (!host) return;
        const box = document.createElement('div');
        box.className = 'rec-progress';
        box.id = 'rec_progress';
        box.innerHTML = `
          <div class="rec-pbar"><div class="rec-pfill" id="rec_pfill"></div></div>
          <div class="rec-pstages">
            ${this.STAGES.map((s, i) =>
              `<div class="rec-pstage" id="rec_st${i}"><span class="dot"></span><span>${s}</span></div>`
            ).join('')}
          </div>
          <div class="rec-elapsed" id="rec_elapsed">0 с</div>`;
        host.appendChild(box);

        this._t0 = Date.now();
        this._tipAt = 0;
        this._timer = setInterval(() => this.tickProgress(), 1000);
        this.tickProgress();

        this.progressTo(0);
    },

    /**
     * Что показывать, пока идёт разбор.
     *
     * Ожидание в полторы минуты нечем занять, и пустой счётчик секунд его
     * только удлиняет. Показываем, что происходит на самом деле, и чего это
     * стоило бы вручную — цифры настоящие: столько позиций в прайсе, столько
     * строк уже прочитано. Технические подробности («модель занята, беру
     * запасную», «дольше обычного») монтажнику не адресованы: он на них
     * повлиять не может, а тревогу они добавляют.
     */
    TIPS: [
        () => 'Разбираю почерк — это самая долгая часть',
        function () {
            const n = (this._priceItems || []).length;
            return n ? `Сверяю с прайсом: ${n.toLocaleString('ru-RU')} позиций` : 'Сверяю с каталогом';
        },
        () => 'Ищу артикулы в прайсе — руками это самое долгое',
        function () {
            return this._sheetsDone
                ? `Прочитано листов: ${this._sheetsDone} из ${this._sheetsTotal}`
                : 'Читаю таблицу: наименования, количество, размеры';
        },
        () => 'Различаю ВР и НР, диаметр и резьбу — их легко перепутать',
        function () {
            const n = this._itemsSoFar || 0;
            return n ? `Уже разобрано позиций: ${n}` : 'Определяю систему: полипропилен, пресс или аксиал';
        },
        // Каждая строка описывает работу, которая действительно идёт: пересчёт
        // упаковок делает packPipes, сведение артикулов — applyRecognized,
        // сверку цены с документом — priceGuard. Придумывать занятость, которой
        // нет, нельзя: монтажник сверяет подсказки с результатом.
        () => 'Сравниваю проходы и резьбы с каталогом',
        () => 'Пересчитываю метры в бухты, штанги и упаковки',
        () => 'Подбираю замены там, где они выгоднее',
        () => 'Свожу одинаковые артикулы в одну строку',
        () => 'Проверяю, где цена разошлась с документом',
        () => 'Раскладываю позиции по разделам сметы',
        () => 'Проставляю цены из свежего прайса',
    ],

    // Подсказки для плана — о том, что действительно делается с планом.
    TIPS_PLAN: [
        () => 'Читаю план: стены, помещения, подписи площадей',
        function () {
            return this._sheetsDone
                ? `Прочитано листов: ${this._sheetsDone} из ${this._sheetsTotal}`
                : 'Ищу экспликацию помещений — таблица точнее подписей на чертеже';
        },
        () => 'Считаю окна в наружных стенах — под них встанут приборы',
        function () {
            const n = this._itemsSoFar || 0;
            return n ? `Уже прочитано помещений: ${n}` : 'Определяю, сколько стен помещения выходят на улицу';
        },
        () => 'Различаю террасы и крыльца — их греть не надо',
        () => 'Смотрю подпись высоты потолка и номер этажа',
        () => 'Собираю помещения для расчёта по комнатам',
    ],

    tickProgress() {
        const el = document.getElementById('rec_elapsed');
        if (!el) return;
        const sec = Math.round((Date.now() - this._t0) / 1000);

        // Подсказку меняем раз в пять секунд: чаще — мельтешит, реже — успевает
        // надоесть.
        const tips = this._tips || this.TIPS;
        const idx = Math.floor(sec / 5) % tips.length;
        if (idx !== this._tipAt || !el.dataset.ready) {
            this._tipAt = idx;
            el.dataset.ready = '1';
            let tip;
            try { tip = tips[idx].call(this); } catch (e) { tip = ''; }
            const done = this._itemsSoFar || 0;
            // Ручной ввод строки в смету — поиск в прайсе, артикул, цена,
            // количество. Сорок секунд на позицию: оценка по нижней границе.
            const saved = done ? Math.round(done * 40 / 60) : 0;
            el.innerHTML = `<span class="rec-tip">${tip}</span>` +
                `<span class="rec-tip-sec">${sec} с</span>` +
                (saved >= 2 ? `<span class="rec-tip-save">вручную было бы ~${this.handTime(saved)}</span>` : '');
        } else {
            const s = el.querySelector('.rec-tip-sec');
            if (s) s.textContent = sec + ' с';
        }
    },

    progressTo(n) {
        // Индикатор мог не запускаться — тогда и обновлять нечего.
        if (!Array.isArray(this.STAGES)) return;
        this.STAGES.forEach((_, i) => {
            const el = document.getElementById('rec_st' + i);
            if (!el) return;
            el.classList.toggle('done', i < n);
            el.classList.toggle('now', i === n);
        });
        const fill = document.getElementById('rec_pfill');
        if (fill) fill.style.width = Math.round((n / this.STAGES.length) * 100) + '%';
    },

    progressStop() {
        // Длительность запоминаем до сброса — она идёт в строку итога.
        if (this._t0) this._elapsed = Date.now() - this._t0;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        const box = document.getElementById('rec_progress');
        if (box) box.remove();
    },

    // ------------------------------------------------------------------
    // Запрос к распознаванию
    // ------------------------------------------------------------------

    /** Логин, под которым распознавания попадают в архив и считается лимит. */
    userKey() {
        // Тот же порядок полей, что у ключа в админке (recognitionUserKey):
        // сначала email, потом ник. Раньше при незагруженном _currentUserRow
        // сюда попадал ник из профиля, и лимит считался под другим именем,
        // чем то, которому админ его выставил.
        const row = (typeof app.accessUserRow === 'function') ? app.accessUserRow() : (app._currentUserRow || {});
        return (row.email || row.username || '').trim() || 'admin';
    },

    /**
     * Остаток распознаваний на месяц.
     *
     * Запросы к языковой модели не бесплатны, поэтому у каждого монтажника
     * свой месячный лимит (меняется в админке). Администраторов не ограничиваем:
     * им инструмент нужен как раз для проверки и отладки распознавания.
     *
     * Если сервер лимитов недоступен, распознавание не блокируем — падать
     * из-за необязательной проверки нельзя.
     */
    async checkQuota() {
        if (typeof app.hasAdminAccess === 'function' && app.hasAdminAccess()) return null;
        try {
            const url = 'https://proxy.heatcalc.ru/recognize_archive.php?quota=1&user=' +
                encodeURIComponent(this.userKey());
            const r = await fetch(url);
            const data = await r.json();
            return data && data.ok ? data : null;
        } catch (e) {
            console.warn('Лимит распознаваний не проверен:', e.message);
            return null;
        }
    },

    /** Подпись «осталось N из M» на экране загрузки. */
    async showQuota() {
        const el = document.getElementById('rec_quota');
        if (!el) return;
        const q = await this.checkQuota();
        if (!q) return;   // админ либо сервер лимитов промолчал
        el.textContent = `Запросов к распознаванию в этом месяце: ${q.used} из ${q.limit}, осталось ${q.left}`;
        if (q.left <= 3) el.style.color = q.left === 0 ? '#EF4444' : '#F59E0B';
    },

    async run() {
        // Работаем либо с картинкой (фото, скан), либо с текстом (Excel, Word,
        // PDF с текстовым слоем, HTML). Что именно — определил handleFile.
        const hasImgs = this._img || (this._imgs && this._imgs.length);
        if ((!hasImgs && !this._text) || this._busy) return;

        const quota = await this.checkQuota();
        if (quota && quota.left <= 0) {
            this.setStatus('');
            const body = document.getElementById('rec_body');
            if (body) {
                const err = document.createElement('div');
                err.className = 'rec-err';
                err.textContent = `Лимит запросов к распознаванию на этот месяц исчерпан: ${quota.used} из ${quota.limit}. ` +
                    'Лимит обновится первого числа. Если нужно больше — напишите администратору.';
                body.appendChild(err);
            }
            return;
        }

        this._busy = true;
        const go = document.getElementById('rec_go');
        if (go) go.disabled = true;
        this.setStatus('');
        // Итоги прошлого разбора сбрасываем здесь, а не в startReview: там они
        // уже заполнены сведением листов и затирать их нельзя.
        this._sysFromModel = null;
        this._mergeInfo = '';
        this._apiCalls = 0;
        this._fromCache = 0;
        this.progressStart(this._docKind === 'plan' ? 'plan' : !!this._text);

        try {
            this.progressTo(1);

            // План этажа выбран руками — сразу по правилам плана, без
            // попытки прочитать лист как смету.
            if (this._docKind === 'plan') {
                await this.runPlan();
                this._busy = false;
                if (go) go.disabled = false;
                return;
            }

            /**
             * Несколько листов разбираются ПО ОДНОМУ, отдельными запросами.
             *
             * Раньше все листы уходили в один запрос — так модель видела смету
             * целиком и лучше понимала сквозную нумерацию. Но на счёте
             * поставщика в сто с лишним позиций она перестала укладываться в
             * отведённое время, и распознавание обрывалось целиком: «слишком
             * долго, попробуйте смету попроще». Полистно каждый запрос втрое
             * короче, виден прогресс, а сбой на одном листе не отменяет
             * остальные. Сквозной контекст при этом теряется мало: систему
             * трубопровода калькулятор всё равно определяет по объединённому
             * списку, а не по одному листу.
             */
            if (!this._text && this._imgs && this._imgs.length > 1) {
                const res = await this.runBySheets();
                // Первый же лист оказался планом этажа — всю пачку читаем
                // как планы, по своим правилам.
                if (res.floorPlan) {
                    await this.runPlan(true);
                    this._busy = false;
                    if (go) go.disabled = false;
                    return;
                }
                this.progressTo(2);
                this.startReview(res);
                this._busy = false;
                if (go) go.disabled = false;
                return;
            }

            // Длинный текст разбираем по частям — по той же причине, по
            // которой фотографии идут полистно: одним запросом такой ответ не
            // успевает вернуться.
            if (this._text && this._text.length > this.TEXT_ONE_SHOT) {
                const chunks = this.splitText(this._text);
                if (chunks.length > 1) {
                    const res = await this.runByChunks(chunks);
                    this.progressTo(2);
                    this.startReview(res);
                    this._busy = false;
                    if (go) go.disabled = false;
                    return;
                }
            }

            // Из текстового файла картинку не шлём: текст в запросе точнее и
            // дешевле, модель не тратит зрение на то, что уже прочитано.
            let parts;
            if (this._text) {
                parts = [{ text: 'Разбери эту смету по правилам. Верни только JSON, без пояснений до и после него. Это текст, извлечённый из файла:\n\n' + this._text }];
            } else {
                parts = [
                    { text: 'Разбери эту смету по правилам. Верни только JSON.' },
                    { inline_data: { mime_type: 'image/jpeg', data: this._img || this._imgs[0] } },
                ];
            }

            // Модели пробуются по очереди: если основная перегружена на
            // стороне Google («high demand»), автоматически берём запасную.
            // Все три в белом списке прокси, менять сервер не нужно.
            const data = await this.askModel(parts);

            const cand = data?.candidates?.[0];
            const text = cand?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Разбор вернулся пустым — в документе не нашлось строк сметы.');

            const parsed = this.parseModelJson(text, cand.finishReason);

            // На снимке не смета, а план этажа: модель сказала об этом сама.
            // Читаем его как план — по своим правилам и в свой экран проверки.
            if (!this._text && typeof RecognizePlan !== 'undefined' && RecognizePlan.isPlanResult(parsed)) {
                await this.runPlan(true);
                this._busy = false;
                if (go) go.disabled = false;
                return;
            }

            this.progressTo(2);
            this.startReview(parsed);
        } catch (e) {
            this.progressStop();
            this.setStatus('');
            const body = document.getElementById('rec_body');
            if (body) {
                const err = document.createElement('div');
                err.className = 'rec-err';
                err.textContent = e.message;
                body.appendChild(err);
            }
        }
        this._busy = false;
        if (go) go.disabled = false;
    },

    /**
     * План этажа: те же снимки — по правилам плана.
     *
     * auto — сюда пришли не по переключателю, а потому что модель опознала
     * план в том, что грузили как смету. Тогда индикатор хода уже идёт со
     * ступенями сметы («ищем в каталоге»), и его надо перезапустить со
     * ступенями плана — иначе он врёт о том, что происходит.
     */
    async runPlan(auto) {
        if (typeof RecognizePlan === 'undefined') {
            throw new Error('Разбор планов этажей не загрузился. Обновите страницу.');
        }
        if (this._text || (this._docs && this._docs.length)) {
            throw new Error('План этажа читается с фото, скана или PDF-чертежа, а из этого файла ' +
                'взят текст, а не изображение. Excel, Word и HTML для плана не подходят; ' +
                'если это PDF — уберите файл крестиком, выберите «План этажа» и загрузите его снова.');
        }
        const imgs = (this._imgs && this._imgs.length) ? this._imgs : (this._img ? [this._img] : []);
        if (!imgs.length) throw new Error('Нет снимка для распознавания.');

        if (auto) {
            this.progressStop();
            this.progressStart('plan');
            this.setStatus('Похоже, это план этажа — читаю его как план');
        }
        this.progressTo(1);
        RecognizePlan.reset();
        const res = await RecognizePlan.run(imgs, imgs.map(b => this.imgNameOf(b)));
        this.progressTo(2);
        RecognizePlan.startReview(res);
    },

    /**
     * Один запрос к распознаванию с перебором моделей.
     *
     * Модели пробуются по очереди: если основная перегружена на стороне Google
     * («high demand»), автоматически берём запасную. Все три в белом списке
     * прокси, менять сервер не нужно.
     */
    /** Пауза. Ожидание дешевле лишнего запроса. */
    wait(ms) {
        return new Promise((r) => setTimeout(r, ms));
    },

    /**
     * Один запрос к распознаванию: ожидание вместо перебора.
     *
     * Ответы 429 и 503 у Google почти всегда значат «слишком часто», а не
     * «эта модель сломалась». Прежний код на такой ответ сразу брал следующую
     * модель — и один лист превращался в три запроса, которые упирались в тот
     * же лимит частоты и жгли его дальше. Теперь ждём и повторяем ТОЙ ЖЕ
     * моделью; если Google подсказал, сколько ждать, слушаем его. На другую
     * модель переходим, только когда ожидание не помогло.
     */
    RETRY_WAITS: [4000, 12000, 25000],

    /**
     * Обезличивание технических ошибок.
     *
     * Монтажник пересылает скриншот ошибки заказчику и в поддержку, и в нём не
     * должно быть ни названия языковой модели, ни английских исключений вида
     * «TimeoutError: Signal timed out» — по ним всё равно ничего не сделать.
     * Настоящий текст остаётся в консоли и в логах сервера.
     *
     * Правила на старые формулировки нужны, пока не обновлены прокси и
     * ретранслятор: сообщение придёт от них в прежнем виде, и вычистить его
     * может только клиент.
     */
    ERR_CLEAN: [
        [/Запрос к \S+ не прошёл:\s*TimeoutError:\s*Signal timed out\.?/gi,
            'Сервис распознавания не ответил вовремя.'],
        [/Запрос к \S+ не прошёл:?\s*/gi, 'Сервис распознавания недоступен. '],
        [/Не удалось связаться с ретранслятором:.*/gi, 'Сервис распознавания недоступен.'],
        [/TimeoutError:\s*Signal timed out\.?/gi, 'превышено время ожидания'],
        [/Модель "[^"]*" не в белом списке[^.]*\.?/gi, 'Сервис распознавания настроен неверно.'],
    ],

    /**
     * Слова, которых в сообщении для монтажника быть не должно.
     *
     * Подставлять вместо них «сервис распознавания» по одному слову нельзя:
     * выходит «сервис распознавания вернула пустой ответ». Если после
     * фразовых правил такое слово всё ещё в тексте — значит формулировка нам
     * незнакома, и честнее отдать общий текст целиком.
     *
     * Границу слова задаём просмотром вперёд: \b в JS кириллицу не видит.
     */
    ERR_VENDOR_RE: /модел[ьия](?![а-яё])|gemini|google/i,

    /** Общий ответ там, где показывать нечего: подробности всё равно в консоли. */
    ERR_GENERIC: 'Сервис распознавания не смог обработать лист. Попробуйте ещё раз.',

    cleanError(msg) {
        let s = String(msg == null ? '' : msg);
        for (const [re, to] of this.ERR_CLEAN) s = s.replace(re, to);
        // Замены могли встать подряд («…распознавания сервис распознавания…»).
        s = s.replace(/(сервис распознавания)(\s+\1)+/gi, '$1')
            .replace(/[ \t]{2,}/g, ' ').trim();
        // Уцелевшая латиница — это остаток чужого стека вроде «is not found for
        // API version v1beta». Монтажнику он не поможет, а выглядит как сбой
        // калькулятора; отдаём общий текст. Так же поступаем с названиями
        // поставщика и словом «модель».
        if (/[A-Za-z]{3,}/.test(s) || this.ERR_VENDOR_RE.test(s)) return this.ERR_GENERIC;
        return s || this.ERR_GENERIC;
    },

    async askModel(parts, systemPrompt) {
        const MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview'];

        for (let mi = 0; mi < MODELS.length; mi++) {
            for (let attempt = 0; ; attempt++) {
                // Считаем ЗАПРОСЫ, а не запуски: по ним живёт лимит у Google и
                // по ним же считается расход монтажника. Неудачная попытка тоже
                // тратит квоту, поэтому увеличиваем счётчик до ответа.
                this._apiCalls = (this._apiCalls || 0) + 1;
                const resp = await this.fetchRetry({
                    mode: 'recognize',
                    model: MODELS[mi],
                    systemInstruction: systemPrompt || RECOGNIZE_PROMPT,
                    messages: [{ role: 'user', parts }],
                });
                const parsed = JSON.parse(resp);
                if (!parsed.error) return parsed;

                const msg = typeof parsed.error === 'string'
                    ? parsed.error : parsed.error.message || '';

                /**
                 * Суточный лимит стоит НА МОДЕЛЬ, а не на ключ.
                 *
                 * У бесплатного тарифа это 20 запросов в сутки на каждую
                 * модель. Поэтому исчерпанная квота — повод сразу взять
                 * следующую модель, а не ждать: ожидание тут не поможет,
                 * счётчик обнулится только на следующие сутки. Модели
                 * кончились все — значит на сегодня действительно всё.
                 */
                if (/plan and billing|exceeded your current quota/i.test(msg)) {
                    if (mi < MODELS.length - 1) break;   // к следующей модели
                    const err = new Error('Суточный лимит запросов исчерпан по всем моделям. ' +
                        'Он обнулится в начале следующих суток. ' +
                        'Уже прочитанные листы сохранены — их не придётся читать заново.');
                    err.quota = true;
                    throw err;
                }

                /**
                 * Ретранслятор сдался по времени («TimeoutError: Signal timed
                 * out»). Ждать и повторять ТОЙ ЖЕ моделью бессмысленно: лист
                 * не успел разобраться из-за своей плотности, а не из-за
                 * загрузки Google, и второй раз не успеет так же. Зато
                 * следующая модель в списке заметно быстрее — плотный лист у
                 * неё обычно проходит. Раньше такая ошибка не подходила под
                 * «временные» и роняла лист сразу, без единой попытки.
                 */
                // code приходит от прокси и ретранслятора машинным признаком:
                // текст ошибки мы обезличиваем, и различать по нему таймаут
                // больше нельзя. Разбор текста оставлен на переходный период,
                // пока сервер отдаёт сообщения в прежнем виде.
                if (parsed.code === 'timeout' ||
                    /timed out|timeouterror|timeout|не ответил вовремя/i.test(msg)) {
                    if (mi < MODELS.length - 1) break;   // к следующей модели
                    throw new Error(
                        'Лист не успел разобраться за отведённое время.\n' +
                        'Так бывает с очень плотными листами. Нажмите «Дочитать листы» ' +
                        'или переснимите этот лист двумя фотографиями — по половине на каждой.');
                }

                const busy = /high demand|overload|unavailable|503|429|too many requests|resource has been exhausted/i
                    .test(msg);
                if (!busy) {
                    // В консоль — как есть, монтажнику — обезличенно.
                    console.warn('Распознавание, ответ сервиса:', msg);
                    throw new Error(this.cleanError(msg));
                }

                if (attempt < this.RETRY_WAITS.length) {
                    // Google обычно называет паузу сам — «retryDelay: 27s».
                    const hint = (msg.match(/retry\w*delay["'\s:]+(\d+)/i) || [])[1];
                    const ms = hint ? Math.min(+hint * 1000 + 1000, 40000)
                        : this.RETRY_WAITS[attempt];
                    await this.wait(ms);
                    continue;   // повторяем ТОЙ ЖЕ моделью
                }

                // Ожидание не помогло: пробуем следующую модель, а на последней
                // сдаёмся. Смена модели — внутренняя кухня, монтажнику про неё
                // знать незачем.
                if (mi === MODELS.length - 1) {
                    throw new Error('Распознавание сейчас перегружено. ' +
                        'Подождите пару минут и попробуйте снова — ' +
                        'уже прочитанные листы сохранены.');
                }
                break;
            }
        }
        throw new Error('Сервис распознавания не ответил. Попробуйте ещё раз.');
    },

    /**
     * Полистный разбор многостраничной сметы.
     *
     * Каждый лист — свой запрос. Если один лист не прочитался, остальные не
     * теряются: его номер попадает в предупреждение, а работа продолжается.
     * Полный отказ — только когда не прочитался ни один лист.
     */
    // ------------------------------------------------------------------
    // Разбор длинного текста по частям
    //
    // Фотографии разбираются полистно давно, а текстовый файл до сих пор
    // уходил одним запросом целиком — и на настоящем КП это не работало.
    // Дело не во входе: 25 тысяч символов модель принимает спокойно. Дело в
    // ВЫХОДЕ: на смету в две с половиной сотни позиций надо вернуть такой же
    // огромный JSON, а он отдаётся по строчке, и в отведённые полторы минуты
    // ответ не укладывается. Монтажник получал «слишком долго» и не получал
    // ничего — при том что четверть файла до модели даже не доехала.
    //
    // Режем так же, как листы: по частям, по очереди, с показом хода работы.
    // Сбой на одной части не отменяет остальные, повторный прогон берёт
    // разобранное из памяти, а сводящий проход склеивает строки на стыках.
    // ------------------------------------------------------------------

    TEXT_CHUNK: 7000,        // символов на один запрос
    TEXT_ONE_SHOT: 9000,     // короче этого режем зря — уходит одним запросом
    TEXT_MAX_CHUNKS: 12,     // каждый кусок стоит запроса из месячного лимита

    /**
     * Нарезка текста на части.
     *
     * Границы страниц (их ставит читатель PDF) — лучшее место для разреза:
     * позиция сметы редко переползает со страницы на страницу. Если страница
     * сама больше куска, режем по строкам, но никогда не посреди строки:
     * половина названия не опознаётся ни там, ни там.
     */
    splitText(text) {
        const out = [];
        let cur = '';
        const flush = () => { if (cur.trim()) out.push(cur.trim()); cur = ''; };
        const add = (piece, sep) => {
            if (cur && (cur.length + piece.length) > this.TEXT_CHUNK) flush();
            cur += (cur ? sep : '') + piece;
        };

        for (const page of String(text || '').split('\f')) {
            if (page.length <= this.TEXT_CHUNK) { add(page, '\n'); continue; }
            flush();
            for (const line of page.split('\n')) add(line, '\n');
        }
        flush();
        return out;
    },

    /**
     * Разбор по частям. Устроен как полистный: та же память, тот же показ
     * хода работы, то же сведение в конце.
     */
    async runByChunks(chunks) {
        const items = [];
        const skipped = [];
        const warnings = [];
        const docTotals = [];
        let quotaHit = false;

        this._sheetsTotal = chunks.length;
        this._sheetsDone = 0;
        this._itemsSoFar = 0;
        this._fromCache = 0;

        for (let i = 0; i < chunks.length; i++) {
            try {
                let parsed = this.cachedSheet(chunks[i]);
                if (parsed) {
                    this._fromCache++;
                    this.setStatus(`Часть ${i + 1} из ${chunks.length} — из памяти`);
                } else {
                    this.setStatus(`Разбираю часть ${i + 1} из ${chunks.length}…`);
                    const data = await this.askModel([{
                        text: `Разбери эту смету по правилам. Это ЧАСТЬ ${i + 1} из ${chunks.length} ` +
                            'одного документа, текст извлечён из файла. Разбирай только те строки, ' +
                            'которые здесь есть: продолжение придёт отдельно, выдумывать его не надо.\n\n' +
                            chunks[i],
                    }]);
                    const cand = data?.candidates?.[0];
                    const text = cand?.content?.parts?.[0]?.text;
                    if (!text) throw new Error('пустой ответ');

                    parsed = this.parseModelJson(text, cand.finishReason);
                    if (this._parseWarning) warnings.push(`часть ${i + 1}: ${this._parseWarning}`);
                    if (!this._parseWarning) this.rememberSheet(chunks[i], parsed);
                }

                for (const it of (parsed.items || [])) items.push({ ...it, _sheet: i });
                for (const s of (parsed.skipped || [])) skipped.push(s);

                this.mergeDocTotals(docTotals, this.docTotalsOf(parsed));

                this._sheetsDone++;
                this._itemsSoFar = items.length;
            } catch (e) {
                if (e.quota) {
                    quotaHit = true;
                    warnings.push(e.message);
                    break;
                }
                warnings.push(`часть ${i + 1} не разобрана: ${
                    this.cleanError(e.message).split('\n')[0]}`);
            }
        }

        if (!items.length) {
            throw new Error('Не удалось разобрать ни одну часть документа.\n' + warnings.join('\n'));
        }

        const done = this._sheetsDone === chunks.length;
        const merged = quotaHit ? { items } : await this.mergeSheets(items, chunks.length);
        if (merged.warning) warnings.push(merged.warning);

        this._parseWarning = warnings.join(' · ');
        this.setStatus('');
        return {
            items: merged.items, skipped,
            // Сверять итог с суммой строк можно только когда прочитано всё:
            // при пропущенной части расхождение объясняется ею.
            docTotals: done ? docTotals : [],
        };
    },

    async runBySheets() {
        const imgs = this._imgs;
        const items = [];
        const skipped = [];
        const failed = [];
        const warnings = [];

        this._sheetsTotal = imgs.length;
        this._sheetsDone = 0;
        this._itemsSoFar = 0;
        this._failedSheets = [];
        this._fromCache = 0;
        let quotaHit = false;
        const docTotals = [];

        for (let i = 0; i < imgs.length; i++) {
            try {
                // Этот лист уже разбирали — берём готовое и не тратим запрос.
                let parsed = this.cachedSheet(imgs[i]);
                if (parsed) {
                    this._fromCache++;
                    this.setStatus(`Лист ${i + 1} из ${imgs.length} — из памяти`);
                } else {
                    this.setStatus(`Читаю лист ${i + 1} из ${imgs.length}…`);
                    const data = await this.askModel([
                        { text: `Разбери эту смету по правилам. Это лист ${i + 1} из ${imgs.length}. ` +
                                'Верни только JSON.' },
                        { inline_data: { mime_type: 'image/jpeg', data: imgs[i] } },
                    ]);
                    const cand = data?.candidates?.[0];
                    const text = cand?.content?.parts?.[0]?.text;
                    if (!text) throw new Error('пустой ответ');

                    parsed = this.parseModelJson(text, cand.finishReason);
                    if (this._parseWarning) warnings.push(`лист ${i + 1}: ${this._parseWarning}`);

                    /**
                     * На листе план этажа, а не смета. Пока ни одной позиции не
                     * прочитано — это пачка планов: отдаём её целиком разбору
                     * планов (он прочитает листы своими правилами). Если
                     * позиции уже есть, план затесался среди листов сметы —
                     * пропускаем его с пометкой, смету он не ломает.
                     * В память листов такой ответ не кладём: из неё
                     * возвращаются только items, и лист выглядел бы пустой
                     * сметой, а не планом.
                     */
                    if (typeof RecognizePlan !== 'undefined' && RecognizePlan.isPlanResult(parsed)) {
                        if (!items.length) return { floorPlan: true };
                        failed.push(i + 1);
                        this._failedSheets.push(i);
                        this.markSheet(i, 'fail');
                        warnings.push(`лист ${i + 1} — план этажа, а не смета: пропущен, распознайте его отдельно`);
                        continue;
                    }
                    // Запоминаем только чистый разбор: спасённый из битого
                    // ответа неполон, и подсовывать его потом молча нельзя.
                    if (!this._parseWarning) this.rememberSheet(imgs[i], parsed);
                }

                // Помечаем, с какого листа строка: по этому видно стыки страниц.
                for (const it of (parsed.items || [])) items.push({ ...it, _sheet: i });
                for (const s of (parsed.skipped || [])) skipped.push(s);

                // Итогов в документе может быть несколько: КП часто делится на
                // «Итого к оплате» по оборудованию и по монтажу. Собираем все —
                // выбирать между ними будет сверка.
                this.mergeDocTotals(docTotals, this.docTotalsOf(parsed));

                // Лист готов — отмечаем его галочкой и обновляем счётчики,
                // из которых складываются подсказки в строке ожидания.
                this._sheetsDone++;
                this._itemsSoFar = items.length;
                this.markSheet(i, 'done');
            } catch (e) {
                failed.push(i + 1);
                this._failedSheets.push(i);
                this.markSheet(i, 'fail');

                // Квота кончилась — остальные листы читать нечем. Прекращаем
                // сразу: каждый следующий запрос всё равно вернёт ту же ошибку,
                // а лимит тратится и на неудачные попытки.
                if (e.quota) {
                    quotaHit = true;
                    for (let k = i + 1; k < imgs.length; k++) {
                        this._failedSheets.push(k);
                        this.markSheet(k, 'fail');
                    }
                    warnings.push(e.message);
                    break;
                }
                warnings.push(`лист ${i + 1} не прочитан: ${
                    this.cleanError(e.message).split('\n')[0]}`);
            }
        }

        if (!items.length && failed.length) {
            throw new Error('Не удалось прочитать ни один лист.\n' + warnings.join('\n'));
        }

        // Сводящий проход: листы разобраны порознь, связи между ними — нет.
        // При исчерпанной квоте его не делаем: это ещё один запрос, а лимита
        // уже нет — и сводить пока нечего, часть листов не прочитана.
        const merged = quotaHit ? { items } : await this.mergeSheets(items, imgs.length);
        if (merged.warning) warnings.push(merged.warning);

        this._parseWarning = warnings.join(' · ');
        this.setStatus('');
        // Найденный итог помним отдельно: дочитывание упавших листов начнёт
        // с него, иначе итог, стоявший на прочитанном листе, потерялся бы.
        this._sheetsDocTotals = docTotals;

        // Сверять итог с суммой строк можно только тогда, когда прочитаны все
        // листы: при упавшем листе расхождение объясняется им, а не потерей
        // строки, и пугать монтажника нечем.
        return {
            items: merged.items, skipped,
            docTotals: failed.length ? [] : docTotals,
        };
    },

    /**
     * Дочитывание листов, которые не прочитались.
     *
     * Когда лимит запросов кончился на середине, гонять всю смету заново
     * нельзя: прочитанные листы стоили квоты, и тратить её на них второй раз
     * незачем. Читаем только упавшие, дописываем позиции к уже разобранным и
     * пересобираем проверку. Разобранное при неудаче не теряется.
     */
    async retryFailedSheets() {
        const left = (this._failedSheets || []).slice();
        if (!left.length || this._busy) return;

        this._busy = true;
        const rows = this._rows.slice();
        const added = [];
        const stillFailed = [];
        let warning = '';
        const docTotals = (this._sheetsDocTotals || []).slice();

        this.setStatus('');
        this.progressStart(false);
        this.progressTo(1);

        for (const i of left) {
            this.setStatus(`Дочитываю лист ${i + 1}…`);
            try {
                const data = await this.askModel([
                    { text: `Разбери эту смету по правилам. Это лист ${i + 1} из ${
                        this._sheetsTotal}. Верни только JSON.` },
                    { inline_data: { mime_type: 'image/jpeg', data: this._imgs[i] } },
                ]);
                const cand = data?.candidates?.[0];
                const text = cand?.content?.parts?.[0]?.text;
                if (!text) throw new Error('пустой ответ');
                const parsed = this.parseModelJson(text, cand.finishReason);
                for (const it of (parsed.items || [])) added.push(it);
                this.mergeDocTotals(docTotals, this.docTotalsOf(parsed));
                this.markSheet(i, 'done');
            } catch (e) {
                stillFailed.push(i);
                this.markSheet(i, 'fail');
                if (e.quota) {
                    warning = e.message;
                    for (const k of left) if (k > i && !stillFailed.includes(k)) stillFailed.push(k);
                    break;
                }
                warning = `лист ${i + 1} не прочитан: ${
                    this.cleanError(e.message).split('\n')[0]}`;
            }
        }

        this._failedSheets = stillFailed;
        this._parseWarning = warning;
        this._sheetsDocTotals = docTotals;
        this.progressStop();
        this._busy = false;

        if (!added.length) { this.renderReview(); return; }
        // Новые позиции проходят тот же путь, что и при первом разборе.
        this.startReview({
            items: rows.concat(added), skipped: this._skipped || [],
            // Все листы наконец прочитаны — сверка с итогом снова осмысленна.
            docTotals: stillFailed.length ? [] : docTotals,
        });
    },

    // ------------------------------------------------------------------
    // Память по листам
    //
    // Один и тот же счёт распознают по многу раз: проверяют подбор, правят
    // каталог, пробуют снова. Каждый прогон стоил запросов к модели, хотя
    // картинки не менялись ни на байт. Разобранный лист складываем под ключ
    // от самой картинки — повторный прогон того же файла не стоит ничего.
    //
    // Хранится в localStorage: разбор листа это несколько килобайт, а лимит
    // хранилища около пяти мегабайт. Держим последние SHEET_CACHE_MAX листов,
    // вытесняя самые давние.
    // ------------------------------------------------------------------

    SHEET_CACHE_KEY: 'rec_sheets_v1',
    SHEET_CACHE_MAX: 40,

    /**
     * Ключ листа — от содержимого картинки.
     *
     * Тот же приём, что и в поиске дублей при загрузке: длина плюс края
     * строки. Гонять мегабайтный base64 через хэш незачем, а совпадение
     * длины и обоих краёв у разных снимков не встречается.
     */
    sheetKey(b64) {
        if (!b64) return '';
        return b64.length + ':' + b64.slice(0, 64) + b64.slice(-64);
    },

    readSheetCache() {
        try {
            const raw = localStorage.getItem(this.SHEET_CACHE_KEY);
            const data = raw ? JSON.parse(raw) : null;
            return (data && typeof data === 'object') ? data : {};
        } catch (e) { return {}; }
    },

    /** Разбор листа из памяти. Промпт изменился — старые записи не годятся. */
    cachedSheet(b64) {
        const key = this.sheetKey(b64);
        if (!key) return null;
        const rec = this.readSheetCache()[key];
        if (!rec || rec.v !== this.promptVersion()) return null;
        return { items: rec.items || [], skipped: rec.skipped || [] };
    },

    rememberSheet(b64, parsed) {
        const key = this.sheetKey(b64);
        if (!key || !parsed || !Array.isArray(parsed.items)) return;
        try {
            const all = this.readSheetCache();
            all[key] = {
                v: this.promptVersion(),
                at: Date.now(),
                items: parsed.items,
                skipped: parsed.skipped || [],
            };
            // Вытесняем самые давние, чтобы не упереться в предел хранилища.
            const keys = Object.keys(all).sort((a, b) => (all[b].at || 0) - (all[a].at || 0));
            for (const k of keys.slice(this.SHEET_CACHE_MAX)) delete all[k];
            localStorage.setItem(this.SHEET_CACHE_KEY, JSON.stringify(all));
        } catch (e) {
            // Переполнилось хранилище — память необязательна, работаем без неё.
            try { localStorage.removeItem(this.SHEET_CACHE_KEY); } catch (e2) { /* и так сойдёт */ }
        }
    },

    /**
     * Отпечаток правил разбора. Меняется вместе с промптом — иначе после
     * правки правил в смету поедут разборы, сделанные по старым.
     */
    promptVersion() {
        if (this._promptV) return this._promptV;
        const s = String(typeof RECOGNIZE_PROMPT !== 'undefined' ? RECOGNIZE_PROMPT : '');
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        this._promptV = String(h);
        return this._promptV;
    },

    /**
     * Отметка листа прямо на миниатюре: готов или не прочитался.
     *
     * На трёх листах разбор идёт больше минуты, и без отметки непонятно, что
     * вообще происходит и сколько осталось. Галочка на самой картинке отвечает
     * на это без слов.
     */
    markSheet(i, state) {
        const box = document.getElementById('rec_imgs');
        if (!box) return;
        const thumb = box.querySelectorAll('.rec-thumb')[i];
        if (thumb) thumb.classList.add(state === 'fail' ? 'sheet-fail' : 'sheet-done');
    },

    /**
     * Сведение листов воедино.
     *
     * Полистный разбор надёжен, но каждый лист модель видит в отрыве от
     * остальных, и теряется ровно то, ради чего листы раньше слали вместе:
     * строка, начатая на одном листе и продолженная на другом; шапка таблицы,
     * повторённая на каждой странице; один и тот же фитинг, названный на
     * разных листах по-разному; система трубопровода, которую видно только по
     * смете целиком.
     *
     * Поэтому делаем второй проход — уже без картинок, по одному тексту. Он
     * дешёвый и быстрый, а главное: модель возвращает НЕ весь список заново, а
     * только правки к нему. Полный список на сто с лишним позиций она снова не
     * успела бы отдать, да и переписывать уже прочитанное незачем.
     *
     * Проход необязательный: не получилось — работаем с тем, что разобрано.
     */
    /**
     * Сведение листов своими силами, без запроса к модели.
     *
     * Из пяти вещей, которые ищет сводящий проход, четыре видно и так.
     * Систему калькулятор считает сам. Повтор шапки узнаётся по словам:
     * «наименование», «кол-во», «итого» — и по отсутствию количества и цены.
     * Дубль на стыке — это когда последняя строка листа слово в слово
     * повторена первой строкой следующего. Единый тип уже приводит
     * normalizeType. Модель нужна только для переноса строки, и то не всегда.
     *
     * Возвращает { plan, suspect }: план правок и признак того, что стык
     * выглядит оборванным и без модели его не разобрать.
     */
    HEADER_RE: /^(наименование|товар|№|n[оo]?\s*п\/п|итого|всего|продолжение|стр\.?\s*\d|лист\s*\d)/i,

    mergeLocal(items) {
        const plan = { merge: [], retype: [], drop: [] };
        let suspect = false;
        const norm = (s) => String(s || '').toLowerCase().replace(/[^а-яёa-z0-9]/g, '');
        const qtyOf = (r) => (Number(r.qty) || 0) + (Number(r.qtyExtra) || 0);

        // Идём по строкам, помня последнюю ОСТАВЛЕННУЮ: между строками стыка
        // почти всегда стоит повторённая шапка, и сравнивать надо через неё.
        let prev = null;

        for (let i = 0; i < items.length; i++) {
            const r = items[i];
            const raw = String(r.raw || '').trim();

            // Шапка таблицы и служебные строки: ни количества, ни предмета.
            if (!qtyOf(r) && this.HEADER_RE.test(raw)) { plan.drop.push(i); continue; }

            if (prev && prev.row._sheet !== r._sheet) {
                // Стык страниц. Строка, напечатанная дважды, — это «продолжение».
                if (norm(prev.row.raw) && norm(prev.row.raw) === norm(raw)) {
                    plan.drop.push(i);
                    continue;
                }
                // Верхняя строка оборвана (количества нет), нижняя начинается
                // со строчной буквы — похоже на перенос, а его без модели
                // не разобрать.
                if (!qtyOf(prev.row) && /^[а-яё]/.test(raw)) suspect = true;
            }
            prev = { row: r, i };
        }
        return { plan, suspect };
    },

    async mergeSheets(items, sheets) {
        if (items.length < 2) return { items };

        // Сначала своими силами: шапки и дубли на стыке видно без модели.
        const local = this.mergeLocal(items);
        if (local.plan.drop.length) {
            const res = this.applyMergePlan(items, local.plan);
            items = res.items;
        }
        // Переносы строк — единственное, чего локальные правила не разбирают.
        // Нет подозрительных стыков — запрос не нужен вовсе.
        if (!local.suspect) return { items };

        this.setStatus('Свожу листы вместе…');

        const list = items.map((it, i) =>
            `${i}. ${String(it.raw || '').slice(0, 90)}` +
            (it.type && it.type !== 'прочее' ? ` [${it.type}]` : '')).join('\n');

        try {
            const data = await this.askModel(
                [{ text: `Листов: ${sheets}. Строки:\n${list}` }], MERGE_PROMPT);
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) return { items };

            const plan = this.parseModelJson(text, data.candidates[0].finishReason);
            return this.applyMergePlan(items, plan);
        } catch (e) {
            // Сведение — уточнение, а не условие работы: молча продолжаем.
            console.warn('Сведение листов не выполнено:', e.message);
            return { items, warning: 'листы не сведены — проверьте строки на стыках страниц' };
        }
    },

    /** Применение правок сведения к разобранным строкам. */
    applyMergePlan(items, plan) {
        if (!plan || typeof plan !== 'object') return { items };
        const out = items.map(r => ({ ...r }));
        const drop = new Set();
        let changed = 0;

        // Продолжение строки с предыдущего листа: текст дописывается к началу,
        // количество берём то, которое вообще названо.
        for (const pair of (plan.merge || [])) {
            const a = out[pair[0]], b = out[pair[1]];
            if (!a || !b || drop.has(pair[1])) continue;
            a.raw = `${a.raw || ''} ${b.raw || ''}`.replace(/\s+/g, ' ').trim();
            if (!a.qty && b.qty) a.qty = b.qty;
            // Цена из документа приходит той половиной строки, где уцелела
            // колонка: при переносе на следующий лист это чаще нижняя.
            if (!a.price && b.price) a.price = b.price;
            if (!a.sum && b.sum) a.sum = b.sum;
            if (!a.type || a.type === 'прочее') a.type = b.type;
            drop.add(pair[1]);
            changed++;
        }

        // Один и тот же предмет, названный на разных листах по-разному.
        for (const t of (plan.retype || [])) {
            const r = out[t && t.i];
            if (!r || !t.type) continue;
            r.type = t.type;
            changed++;
        }

        // Повторы шапок и строки, продублированные на стыке страниц.
        for (const i of (plan.drop || [])) {
            if (out[i]) { drop.add(i); changed++; }
        }

        const kept = out.filter((_, i) => !drop.has(i));
        this._mergeInfo = changed
            ? `сведение листов: правок ${changed}` + (drop.size ? `, убрано строк ${drop.size}` : '')
            : '';
        // Система, увиденная по смете целиком, — подсказка для подбора.
        if (plan.system && ['ppr', 'ss', 'mp', 'pex'].includes(plan.system)) {
            this._sysFromModel = plan.system;
        }
        return { items: kept };
    },

    /**
     * Разбор ответа модели.
     *
     * Строгий JSON.parse здесь ломался на ровном месте: модель пишет дюймы
     * как есть — «Кран 1/2" - 2шт», — и незакрытая кавычка внутри строки
     * рушит весь ответ целиком. Терять из-за одной строки распознавание всей
     * сметы нельзя, поэтому разбор идёт тремя заходами: как есть, с починкой
     * кавычек, и по одной позиции — последнее спасает и обрезанный по длине
     * ответ, от которого раньше не оставалось ничего.
     */
    parseModelJson(text, finishReason) {
        this._parseWarning = '';   // предупреждение относится только к этому разбору

        // Модель иногда заворачивает ответ в markdown-блок.
        let src = String(text || '').trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/```\s*$/, '');

        /**
         * Всё, что снаружи фигурных скобок, — не смета, а болтовня модели.
         *
         * Раньше хвост отрезался только вместе с началом (условие first > 0): если
         * ответ начинался сразу с «{», а после закрывающей скобки шла хоть одна
         * строка пояснения или остаток markdown-забора, разбор целиком падал
         * и смета собиралась позициями — с красным предупреждением о формате,
         * хотя ни одной строки на самом деле не потерялось.
         */
        const first = src.indexOf('{');
        const last = src.lastIndexOf('}');
        if (first >= 0 && last > first) src = src.slice(first, last + 1);

        try {
            return JSON.parse(src);
        } catch (e) { /* пробуем починить */ }

        const repaired = this.repairJson(src);
        try {
            const ok = JSON.parse(repaired);
            console.warn('Ответ модели починен перед разбором.');
            return ok;
        } catch (e) { /* собираем по позициям */ }

        const items = this.salvageItems(repaired);
        if (items.length) {
            // Предупреждение ниже говорит только «что-то не так». Что именно — видно
            // лишь в сыром ответе, и без него причину приходится угадывать.
            console.warn('Разбор по позициям, сырой ответ модели:', text);
            this._parseWarning = finishReason === 'MAX_TOKENS'
                ? `Ответ обрезан по длине — разобрано ${items.length} позиций, конец сметы мог не попасть.`
                : `Ответ пришёл с ошибкой формата — разобрано ${items.length} позиций, часть строк могла потеряться.`;
            return { items, skipped: [] };
        }

        throw new Error(finishReason === 'MAX_TOKENS'
            ? 'Ответ обрезан по длине — попробуйте снять смету двумя фото по половине'
            : 'Ответ пришёл в неожиданном виде и восстановить его не удалось.');
    },

    /**
     * Починка ответа модели до валидного JSON.
     *
     * Модель ломает формат четырьмя способами, и все четыре встретились на
     * реальных сметах:
     *   «"raw": "Кран 1/2" - 2шт»  — дюймы обрывают строку;
     *   «"thread": 3/4»            — дробь без кавычек, парсер видит число 3
     *                                 и спотыкается о «/» (та самая ошибка
     *                                 «Expected ',' or '}' after property value»);
     *   «"threadType": ВР»         — слово без кавычек;
     *   запятая перед «}» и сырой перенос строки внутри значения.
     *
     * Идём по символам, помня, внутри строки мы или снаружи: только так
     * можно отличить дюймы в тексте от настоящей закрывающей кавычки.
     */
    repairJson(src) {
        let out = '', i = 0, inStr = false, esc = false;
        const n = src.length;

        // Запятая перед закрывающей скобкой — частый хвост у сгенерированного
        // JSON, для парсера это ошибка.
        const dropTrailingComma = () => {
            let j = out.length - 1;
            while (j >= 0 && /\s/.test(out[j])) j--;
            if (j >= 0 && out[j] === ',') out = out.slice(0, j) + out.slice(j + 1);
        };

        while (i < n) {
            const ch = src[i];

            if (inStr) {
                if (esc) { out += ch; esc = false; i++; continue; }
                if (ch === '\\') { out += ch; esc = true; i++; continue; }
                if (ch === '\n') { out += '\\n'; i++; continue; }
                if (ch === '\r') { i++; continue; }
                if (ch === '\t') { out += '\\t'; i++; continue; }
                if (ch === '"') {
                    // Закрывающая кавычка — только если дальше разделитель JSON.
                    if (/^\s*([,:}\]]|$)/.test(src.slice(i + 1))) { inStr = false; out += ch; }
                    else out += '\\"';
                    i++; continue;
                }
                out += ch; i++; continue;
            }

            if (ch === '"') { inStr = true; out += ch; i++; continue; }
            if (ch === '}' || ch === ']') { dropTrailingComma(); out += ch; i++; continue; }
            if (ch !== ':') { out += ch; i++; continue; }

            // Значение после двоеточия: строку, объект и массив пропускаем,
            // остальное читаем целиком и при необходимости берём в кавычки.
            out += ch; i++;
            while (i < n && /\s/.test(src[i])) { out += src[i]; i++; }
            const c = src[i];
            if (c === undefined || c === '"' || c === '{' || c === '[') continue;

            let j = i;
            while (j < n && !/[,}\]\n]/.test(src[j])) j++;
            const token = src.slice(i, j).trim();
            if (!token) continue;

            const isLiteral = /^(true|false|null)$/i.test(token);
            const isNumber = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(token);
            out += (isLiteral || isNumber) ? token : JSON.stringify(token);
            i = j;
        }
        return out;
    },

    /** Сбор уцелевших позиций по одной — когда весь объект уже не собрать. */
    salvageItems(src) {
        const items = [];
        const re = /\{[^{}]*\}/g;
        let m;
        while ((m = re.exec(src))) {
            try {
                const o = JSON.parse(m[0]);
                if (o && (o.raw || o.type)) items.push(o);
            } catch (e) { /* эту позицию не спасти */ }
        }
        return items;
    },

    /**
     * Запрос к распознаванию с повтором.
     *
     * Повтор нужен, потому что хостинг прокси иногда обрывает связь на пустом
     * месте — но повторять запрос, который завис по таймауту, бессмысленно:
     * он завис из-за размера или сложности входа, и второй раз зависнет так же.
     * Поэтому свой таймаут, и по нему — сразу понятная ошибка, а не три круга
     * ожидания.
     *
     * Бюджеты по цепочке убывают, иначе первым сдаётся не тот, кто знает
     * причину: браузер 155 с → gemini_proxy.php 145 с → gemini-relay 135 с.
     * Меняете одно звено — правьте всю тройку, «лист не прочитан» без
     * подробностей берётся ровно отсюда.
     */
    async fetchRetry(payload, attempts = 3) {
        let last;
        for (let i = 1; i <= attempts; i++) {
            const ctrl = new AbortController();
            // Свой таймаут держим БОЛЬШЕ серверного: иначе браузер сдавался
            // первым и вместо внятной ошибки от сервера монтажник видел
            // «слишком долго».
            const timer = setTimeout(() => ctrl.abort(), 155000);
            try {
                const r = await fetch(this.PROXY, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: ctrl.signal,
                });
                clearTimeout(timer);
                return await r.text();
            } catch (e) {
                clearTimeout(timer);
                last = e;
                // Прервались по своему таймауту — повторять нет смысла.
                if (e.name === 'AbortError') {
                    throw new Error(
                        'Распознавание заняло слишком долго и было прервано.\n' +
                        'Скорее всего, в файле слишком много текста — попробуйте смету попроще ' +
                        'или снимите её фотографией.');
                }
                if (i < attempts) {
                    /**
                     * О повторе монтажнику не сообщаем.
                     *
                     * «Сервер не ответил (попытка 1 из 3)» пугало на ровном
                     * месте: обрыв на стороне хостинга — обычное дело, повтор
                     * почти всегда проходит, а повлиять на это всё равно
                     * нельзя. Экран при этом не замирает: полоса хода работы и
                     * подсказки идут по своему таймеру. Если не выйдет и с
                     * третьей попытки — будет обычная понятная ошибка ниже.
                     */
                    console.warn(`Распознавание, повтор ${i} из ${attempts}:`, e.message);
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }
        if (last) console.warn('Распознавание, сеть:', last.message);
        throw new Error('Сервер распознавания не отвечает. Попробуйте через минуту.');
    },

    // ------------------------------------------------------------------
    // Шаг 2 — проверка
    // ------------------------------------------------------------------

    // ------------------------------------------------------------------
    // Черновик проверки
    //
    // Разбор живёт в памяти вкладки, и до сих пор любое обновление страницы
    // стирало его целиком. Запросы к модели при этом сберегал кэш листов, а
    // вот полчаса ручной правки — ничто: закрыл вкладку, задел F5, сел
    // аккумулятор — и разбирай заново.
    //
    // Храним рядом с кэшем листов, под логином монтажника. Сам подбор в
    // черновик не пишется: товар каталога тянет за собой ссылки на аналоги и
    // в JSON не укладывается, да и не нужен — при возврате подбор считается
    // заново, на сегодняшнем каталоге и сегодняшних ценах. Записаны только
    // РЕШЕНИЯ человека: выбранный артикул, выбранная расценка, правки полей.
    // ------------------------------------------------------------------

    DRAFT_KEY: 'rec_draft_v1',
    DRAFT_DAYS: 14,          // дольше черновик уже никому не нужен
    DRAFT_MAX_CHARS: 2000000,

    draftKey() { return this.DRAFT_KEY + ':' + this.userKey(); },

    /** Поля строки, которые в черновик не идут: это ссылки на каталог. */
    DRAFT_SKIP: ['_m', '_w', '_item', '_roll', '_rolledInto', '_sel',
        'alts', 'alternatives', 'rommer', 'comfort'],

    draftRow(r) {
        const out = {};
        for (const k in r) {
            if (this.DRAFT_SKIP.includes(k)) continue;
            const v = r[k];
            // Всё, что осталось объектом, — это ссылка на позицию каталога.
            // Массивы (dims) пропускаем: они из чисел.
            if (v && typeof v === 'object' && !Array.isArray(v)) continue;
            out[k] = v;
        }
        // Ручные решения храним артикулом и названием расценки: сам товар
        // подставится из каталога, с сегодняшней ценой.
        if (r._locked && r._m && r._m.item && r._m.item.id != null) out._mId = String(r._m.item.id);
        if (r._wLocked) out._wName = (r._w && r._w.work) ? r._w.work.name : '';
        return out;
    },

    saveDraft() {
        // Пишем не на каждый клик: перерисовка идёт после любой правки, а
        // смета на полторы сотни строк — это сотни килобайт JSON.
        clearTimeout(this._draftTimer);
        this._draftTimer = setTimeout(() => this.saveDraftNow(), 800);
    },

    saveDraftNow() {
        if (!this._rows || !this._rows.length) return;
        try {
            const data = {
                at: Date.now(),
                rows: this._rows.map(r => this.draftRow(r)),
                skipped: this._skipped || [],
                docTotals: this._docTotals || [],
                parseWarning: this._parseWarning || '',
                mergeInfo: this._mergeInfo || '',
                deep: this._deep || 0,
                fileName: this._fileName || '',
                fileKind: this._fileKind || '',
                sys: this._sys || null,
                profile: this._profile || null,
                tab: this._tab || 'eq',
                onlyBad: !!this._onlyBad,
                useDocPrices: this._useDocPrices,
                useOurWorkPrices: this._useOurWorkPrices,
            };
            const json = JSON.stringify(data);
            // Гигантскую смету лучше не сохранить вовсе, чем выбить из
            // хранилища кэш листов: он бережёт запросы к модели, а они
            // считаются по лимиту.
            if (json.length > this.DRAFT_MAX_CHARS) return;
            localStorage.setItem(this.draftKey(), json);
        } catch (e) {
            console.warn('Черновик разбора не сохранён:', e.message);
        }
    },

    readDraft() {
        try {
            const raw = localStorage.getItem(this.draftKey());
            if (!raw) return null;
            const d = JSON.parse(raw);
            if (!d || !Array.isArray(d.rows) || !d.rows.length) return null;
            if (Date.now() - (d.at || 0) > this.DRAFT_DAYS * 86400000) {
                this.dropDraft();
                return null;
            }
            return d;
        } catch (e) { return null; }
    },

    dropDraft() {
        clearTimeout(this._draftTimer);
        try { localStorage.removeItem(this.draftKey()); } catch (e) { /* и так сойдёт */ }
    },

    /** Предложение вернуться к незаконченному разбору. Показывается на шаге загрузки. */
    draftBanner() {
        const d = this.readDraft();
        if (!d) return '';
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const when = new Date(d.at).toLocaleString('ru-RU',
            { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const n = d.rows.length;
        const hand = d.rows.filter(r => r._mId).length;

        return `<div class="rec-draft">
            <div>
              <b>Незаконченный разбор от ${when}</b>
              <div class="rec-art">${d.fileName ? esc(d.fileName) + ' · ' : ''}${n} ${
            this.plural(n, 'строка', 'строки', 'строк')}${
            hand ? ` · ${hand} подобрано вручную` : ''}</div>
            </div>
            <span class="rec-tb-right">
              <button class="calc-dialog-btn calc-dialog-btn-confirm"
                      onclick="RecognizeUI.restoreDraft()">Продолжить разбор</button>
              <button class="rec-btn-g" onclick="RecognizeUI.forgetDraft()">Убрать</button>
            </span>
          </div>`;
    },

    forgetDraft() {
        this.dropDraft();
        this.renderUpload();
    },

    /**
     * Возврат к незаконченному разбору.
     *
     * Подбор пересчитывается заново: пока черновик лежал, каталог мог
     * пополниться, а цены — смениться, и подставлять сохранённые было бы
     * хуже, чем посчитать. Сохраняются ровно решения человека — выбранный
     * артикул и выбранная расценка.
     */
    restoreDraft() {
        const d = this.readDraft();
        if (!d) { this.renderUpload(); return; }

        this._skipped = d.skipped || [];
        this._docTotals = Array.isArray(d.docTotals) ? d.docTotals : [];
        this._parseWarning = d.parseWarning || '';
        this._mergeInfo = d.mergeInfo || '';
        this._deep = d.deep || 0;
        this._fileName = d.fileName || '';
        this._fileKind = d.fileKind || '';
        this._sys = d.sys || null;
        this._profile = d.profile || null;
        this._tab = d.tab || 'eq';
        this._onlyBad = !!d.onlyBad;
        this._useDocPrices = d.useDocPrices;
        this._useOurWorkPrices = d.useOurWorkPrices;
        this._undo = [];
        this._analogOn = false;
        this._analogSaved = 0;
        this._ourWorks = null;
        this._missOff = {};

        this._rows = d.rows.map(r => {
            const row = { ...r, _sel: false };
            const id = row._mId, wName = row._wName;
            delete row._mId;
            delete row._wName;

            if (this.looksLikeWork(row)) {
                // Расценка, выбранная руками. Пустое имя — тоже решение
                // человека: «эту работу с нашим прайсом не сравнивать».
                if (wName !== undefined) {
                    const w = wName ? this.ourWorks().find(x => x.name === wName) : null;
                    row._w = w ? { work: w, extra: [], score: 1 } : null;
                    row._wLocked = true;
                } else {
                    row._w = this.matchWork(row);
                }
                row._m = null;
                return row;
            }

            if (id) {
                const it = this.memResolve({ id });
                if (it && it.name) {
                    row._m = { item: it, score: 1, alternatives: [] };
                    row._locked = true;
                    return row;
                }
                // Позиции больше нет ни в каталоге, ни в прайсе — честнее
                // подобрать заново, чем оставить строку с пустым артикулом.
            }
            row._locked = false;
            this.rematch(row);
            return row;
        });

        this.refreshSuggestions();
        this.step(2);
        this.renderReview();
    },

    startReview(res) {
        const items = res.items || [];
        this._skipped = res.skipped || [];
        // Итог, НАПЕЧАТАННЫЙ в документе. По нему проверяется, все ли строки
        // прочитаны: пропущенную в середине счёта позицию иначе не увидеть
        // ни монтажнику, ни нам.
        this._docTotals = this.docTotalsOf(res);

        // Замечание о неполно прочитанном файле должно доехать до экрана
        // проверки: там монтажник сверяет строки, и знать, что часть файла
        // до разбора не дошла, ему нужно именно там.
        if (this._fileNote) {
            this._parseWarning = [this._fileNote, this._parseWarning].filter(Boolean).join(' · ');
        }
        if (typeof RecognizeMatch !== 'undefined') {
            RecognizeMatch.setPprBrand(app.state.pprSystemBrand || 'proaqua');
        }

        this._rows = items.map(i => ({ ...i, _sel: false, _locked: false }));
        this._rows.forEach(r => { if (this.looksLikeWork(r)) r.kind = 'work'; });
        this.roundQty();
        this.inheritRepeats();
        this.inheritDocSections();

        // Тип показываем в том виде, в каком его понял подбор. Модель нет-нет
        // да и напишет его латиницей («kran_ppr»), и в таблице это выглядело
        // как незнакомый калькулятору тип, хотя дело только в раскладке.
        if (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.typeOf) {
            this._rows.forEach(r => {
                const t = RecognizeMatch.typeOf(r);
                if (t && t !== (r.type || '').toLowerCase()) r.type = t;
            });
        }

        // Система трубопровода определяется по смете целиком и дальше служит
        // подсказкой для каждой строки: «водорозетка 16» или «муфта 25» сами
        // о системе молчат, и без этого в аксиальной смете подбирался
        // пресс-фитинг, а в полипропиленовой — нержавейка.
        const profileOfSystem = () => {
            if (typeof RecognizeMatch === 'undefined' || !RecognizeMatch.systemProfile) return null;
            const p = RecognizeMatch.systemProfile(this._rows);
            /**
             * Систему, увиденную моделью по смете ЦЕЛИКОМ, берём тогда, когда
             * по самим строкам её определить не удалось. Именно этот вывод
             * терялся при полистном разборе: труба может стоять на первом
             * листе, а фитинги под неё — на третьем, и по отдельному листу
             * система не читается. Собственный подсчёт по строкам точнее и
             * поэтому имеет приоритет.
             */
            if (p && !p.main && this._sysFromModel) p.main = this._sysFromModel;
            return p;
        };

        // Подбор в два прохода. Первый нужен, чтобы у строк появились названия
        // из каталога: рукописное «Комби 25х3/4» о системе молчит, а
        // «Муфта комбинированная ВР PP-R 25х3/4» — нет. По ним профиль сметы
        // становится точным, и второй проход уже подбирает фитинги под ту
        // трубу, которая в смете действительно есть.
        this._sys = profileOfSystem();
        this._rows.forEach(r => this.rematch(r));
        this._sys = profileOfSystem();
        this._rows.forEach(r => this.rematch(r));

        this.progressTo(3);
        // Раздел определяем по смете целиком, а не по одной строке: муфта
        // 25х3/4 одинаково уместна и в водоснабжении, и в обвязке радиаторов,
        // а вот список из радиаторов, насоса и полипропилена уже говорит, что
        // это отопление. Где признак всё же неоднозначен, guessSection честно
        // возвращает sure=false, и строка помечается «раздел под вопросом».
        this._profile = (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.profileOf)
            ? RecognizeMatch.profileOf(this._rows) : null;

        this._undo = [];
        this._tab = 'eq';            // открываем всегда с оборудования
        this._onlyBad = false;       // новая смета показывается целиком
        this._ourWorks = null;       // прайс монтажа мог смениться между разборами
        this._analogOn = false;      // новое распознавание — режим аналогов сброшен
        this._analogSaved = 0;
        this._deep = 0;
        // Ниже девяноста процентов смета получается дырявой, и монтажнику
        // придётся добивать её руками. Прежде чем показывать такой результат,
        // прогоняем неподобранные строки ещё раз, с ослабленными правилами.
        this.deepPass();

        // Раздел считаем ПОСЛЕ углублённого прохода: он опирается на найденный
        // артикул, а строка, подобранная только там, до этого момента ничем не
        // отличалась от нераспознанной и уезжала не в свой раздел.
        this._rows.forEach(r => {
            if (typeof RecognizeMatch === 'undefined') return;
            const g = RecognizeMatch.guessSection(r, this._profile);
            r.section = g.section;
            r.sectionGroup = g.group || null;
            r._sectionSure = g.sure;
        });
        // Рекомендации считаются по метражу («труба 50 м — 12 стыков»),
        // поэтому пересчёт метров в штанги идёт строго после них.
        this.refreshSuggestions();
        this.packPipes();
        this.progressStop();
        this.step(2);
        this.renderReview();
    },

    /**
     * Пересчёт рекомендаций. Делается после каждой правки: удалили строку —
     * рекомендация могла появиться, добавили — исчезнуть.
     */
    refreshSuggestions() {
        if (typeof RecognizeMatch === 'undefined' || !RecognizeMatch.suggest) {
            this._sugg = [];
            return;
        }
        this._sugg = RecognizeMatch.suggest(this._rows, this._sys).map(s => {
            // Часть рекомендаций называет артикул прямо (насос к группе, узел
            // подключения радиатора) — подбирать его заново незачем.
            s.match = s.row._item
                ? { item: s.row._item, score: 1, alternatives: [] }
                : RecognizeMatch.matchItem(s.row, this._sys);
            return s;
        });
    },

    /** Принятие рекомендации: строка становится обычной позицией сметы. */
    addSuggestion(i) {
        const s = (this._sugg || [])[i];
        if (!s) return;
        this.snap();
        // Раздел считается по подобранному артикулу, а у строки рекомендации он
        // лежит отдельно (s.match) — без него рекомендация уехала бы в
        // «Нераспознанные».
        const g = RecognizeMatch.guessSection({ ...s.row, _m: s.match || null }, this._profile);
        this._rows.push({
            ...s.row,
            raw: 'Рекомендация: ' + s.reason,
            kind: 'equipment',
            confidence: 1,
            note: s.note,
            section: g.section,
            sectionGroup: g.group || null,
            _sectionSure: g.sure,
            _sel: false,
            _locked: false,
            _m: s.match || null,
        });
        this.refreshSuggestions();
        this.renderReview();
    },

    /**
     * Замена системы трубопровода целиком.
     *
     * Меняется не только труба: диаметры пересчитываются ПО ПРОХОДУ (ППР 32
     * это нержавейка 28, а не 32), у гнущихся труб часть углов не нужна вовсе,
     * а число стыковых муфт зависит от того, штангами труба идёт или бухтой.
     * Всё это уже умеет RecognizeMatch.convert — здесь только применение
     * к строкам проверки и откат по кнопке «Отменить».
     */
    convertSystem(toSys) {
        if (!toSys || !this._rows.length || typeof RecognizeMatch === 'undefined') return;

        const from = (this._sys && this._sys.main) || RecognizeMatch.detectSystem(this._rows);
        if (from === toSys) return;

        this.snap();
        const converted = RecognizeMatch.convert(this._rows, from, toSys);

        // convert() возвращает подбор в поле match — интерфейс проверки читает _m.
        this._rows = converted.map(r => {
            // Замена, запомненная для прежней системы, к новой не относится:
            // написание строки не изменилось, а предмет — да.
            const row = { ...r, _m: r.match || null, _sel: false, _locked: false, _noMem: true };
            delete row._fromMem;
            delete row.match;
            if (r._note) row.note = [r.note, r._note].filter(Boolean).join('; ');
            return row;
        });

        this._sys = RecognizeMatch.systemProfile(this._rows);
        this._rows.forEach(r => {
            const g = RecognizeMatch.guessSection(r, this._profile);
            r.section = g.section;
            r.sectionGroup = g.group || null;
            r._sectionSure = g.sure;
        });
        this.refreshSuggestions();
        this.renderReview();
    },

    /**
     * Раздел документа протягивается вниз по строкам.
     *
     * Модель отмечает заголовком первую строку раздела и дальше про него
     * молчит — так же, как молчит бумага: заголовок «Водоснабжение» написан
     * один раз, а относится ко всему, что под ним. Дотягиваем его до
     * следующего заголовка, иначе разделитель в таблице появился бы раз и
     * потерялся.
     *
     * Отдельно приводим номер позиции к строке: в документе он бывает и «12»,
     * и «2.7», и «А-4», а сравнивать его надо как текст.
     */
    inheritDocSections() {
        let cur = null;
        this._rows.forEach(r => {
            const s = String(r.docSection == null ? '' : r.docSection).trim();
            if (s) cur = s;
            r.docSection = cur;
            const no = String(r.docNo == null ? '' : r.docNo).trim();
            r.docNo = no || null;
        });
    },

    /**
     * «Такого у нас нет» — словами, а не пустой строкой.
     *
     * Подбор ставит пометку _sysMiss, когда подходящее по словам и размеру
     * нашлось только в ЧУЖОМ материале, а в своём такой позиции не оказалось:
     * полипропиленовой муфты 40×1¼ у нас, например, нет вовсе. Про такую
     * строку известно не «не нашли», а «не существует», и разница в том, что
     * делать дальше: искать руками бесполезно, надо ставить свою цену.
     */
    sysMissText(sys) {
        const label = (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.systemLabel)
            ? RecognizeMatch.systemLabel(sys) : '';
        return label
            ? `у нас нет ${label} в этом размере`
            : 'такой позиции у нас нет';
    },

    /**
     * Заголовок раздела документа отдельной строкой таблицы.
     *
     * Экран проверки читают рядом с исходной сметой, строка за строкой.
     * Разделы на бумаге — главные ориентиры в этой сверке: без них список из
     * полутора сотен позиций не с чем сопоставить.
     */
    docSectionRow(title, cols) {
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        return `<tr class="rec-docsec"><td colspan="${cols}">${esc(title)}</td></tr>`;
    },

    /**
     * Заголовок перед строкой, если с прошлой строкой раздел сменился.
     *
     * Состояние держит вызывающий (state.last) — заголовок ставится перед
     * первой ВИДИМОЙ строкой раздела, а не перед первой вообще: при фильтре
     * «только проблемные» половина строк не рисуется, и заголовки висели бы
     * над пустотой.
     */
    docSectionHead(r, cols, state) {
        const sec = (r && r.docSection) ? String(r.docSection) : '';
        if (!sec || sec === state.last) return '';
        state.last = sec;
        return this.docSectionRow(sec, cols);
    },

    /**
     * Строка без наименования — повтор предыдущей позиции.
     *
     * Одинаковые фитинги в рукописной смете пишут списком: наименование стоит
     * один раз, а ниже идут только размеры — «ф32 х 20 - 2шт», «— 25х20».
     * Сама по себе такая строка не опознаётся: в ней нет предмета. Берём его
     * у строки выше — ровно это монтажник и имел в виду, ставя кавычки.
     */
    inheritRepeats() {
        // Строка начинается с размера: кавычки, прочерки и номер позиции
        // перед ним ничего не меняют.
        const bare = /^["'«»\-–—\s№\d.)]*(?:[фfdØø]\s*)?\d{2,3}\s*(?:[хx]|$|\s|-)/i;
        // Тип берём тот же, что увидит подбор: он умеет вывести его из текста
        // («Комби 25х3/4» — комбинированная муфта), а поле type может быть пустым.
        const typeOf = r => (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.typeOf)
            ? RecognizeMatch.typeOf(r) : (r.type || '').toLowerCase();
        let prev = null;

        this._rows.forEach(r => {
            const t = typeOf(r);
            if (t && t !== 'прочее') { prev = { row: r, type: t }; return; }
            if (!prev || !bare.test(String(r.raw || ''))) return;
            r.type = prev.type;
            if (!r.threadType) r.threadType = prev.row.threadType;
            r._inherited = prev.row.raw || '';
        });
    },

    /**
     * Количество — целым числом.
     *
     * В сметах метраж пишут с половинками: «607,5 м.п.», «1192,5». Половина
     * метра трубы или изоляции не покупается и не монтируется, а в таблице
     * такое число ещё и не помещается в колонку — видно «607,». Округляем
     * вверх, как и остаток штанги: недостача материала хуже излишка.
     */
    roundQty() {
        this._rows.forEach(r => {
            ['qty', 'qtyExtra'].forEach(f => {
                const v = Number(r[f]);
                if (v > 0 && v !== Math.floor(v)) r[f] = Math.ceil(v);
            });
        });
    },

    /**
     * Метры трубы — в штанги.
     *
     * Полипропилен и нержавейку в каталоге продают штангами, и цена стоит за
     * штангу. В смете трубу пишут метрами, поэтому «50 м» без пересчёта
     * умножалось на цену четырёхметровой штанги — труба дорожала вчетверо.
     * Остаток округляем вверх: половину штанги не купить.
     *
     * Делается один раз, при первом показе проверки: дальше монтажник правит
     * уже штуки, и повторно пересчитывать их нельзя.
     */
    packPipes() {
        this._rows.forEach(r => {
            const m = r._m;
            if (!m || r._packed) return;
            const qty = (Number(r.qty) || 0) + (Number(r.qtyExtra) || 0);
            if (!qty) return;

            if (m.pack && r.unit === 'м') {
                r._meters = qty;
                r._packed = m.pack;
                r._packNote = `${qty} м → штанги по ${m.pack} м`;
                r.qty = Math.ceil(qty / m.pack);
                r.qtyExtra = 0;
                r.unit = 'шт';
                return;
            }

            /**
             * Квадратные метры — в рулоны.
             *
             * «Подложка для теплого пола 3 мм / 25 м × 1.2 м (30 м²)» стоит в
             * каталоге 2 668 ₽ за РУЛОН, а в смете её пишут площадью: «150 м2».
             * Сто пятьдесят умножалось на цену рулона — 400 185 ₽ вместо
             * 13 340 ₽ за пять рулонов. Ошибка в тридцать раз, и попадает она
             * прямо в печатную смету клиенту.
             */
            const area = (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.packArea)
                ? RecognizeMatch.packArea(m.item && m.item.name) : null;
            if (area && /^(м2|м²|кв\.?\s*м)$/i.test(String(r.unit || '').trim())) {
                r._area = qty;
                r._packed = area;
                r._packNote = `${qty} м² → рулоны по ${area} м²`;
                r.qty = Math.ceil(qty / area);
                r.qtyExtra = 0;
                r.unit = 'шт';
                return;
            }

            /**
             * Штуки — в упаковки.
             *
             * Мелочёвку поставщик отгружает штуками, а каталог продаёт
             * упаковками: «Скобы якорные (Кассета 25 шт)» стоят 109 ₽ за
             * кассету, и шесть тысяч скоб из счёта давали 654 000 ₽ вместо
             * 26 000 ₽. Пересчитываем, только когда количество заведомо
             * штучное — втрое больше упаковки: «2 шт» при упаковке 100 это
             * две упаковки, а не две штуки.
             */
            const per = (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.packSize)
                ? RecognizeMatch.packSize(m.item && m.item.name) : null;

            /**
             * …но только там, где в смете написаны ШТУКИ.
             *
             * «Скоба якорная, кассета для трекера … (30шт в кассете) — 100
             * компл.» считает уже кассеты, и делить их на 25 нельзя: в смету
             * попадали четыре кассеты вместо ста. Единица измерения строки —
             * единственное, что отличает «шесть тысяч скоб» от «ста кассет»,
             * и раньше она не смотрелась вовсе.
             */
            const countsPacks = /компл|кассет|упак|набор|пач|рулон|бухт|^уп\.?$/i
                .test(String(r.unit || '').trim());

            /**
             * Фасовки разного размера.
             *
             * «Скоба якорная, кассета … (30шт в кассете) — 100 компл.» это три
             * тысячи скоб, а каталожная кассета идёт по 25 штук: честно нужно
             * 120 кассет, а не 100. Пока своя фасовка строки не читалась, смета
             * недосчитывала пятую часть — мало заметно глазом и заметно в
             * деньгах.
             *
             * Считаем только когда обе фасовки названы и они разные: равные
             * пересчитывать нечего, а неназванную выдумывать нельзя.
             */
            const own = (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.packSize)
                ? RecognizeMatch.packSize(r.raw) : null;
            if (per && countsPacks && own && own !== per) {
                r._packs = qty;
                r._packed = per;
                r._packNote = `${qty} × ${own} шт → упаковки по ${per} шт`;
                r.qty = Math.ceil(qty * own / per);
                r.qtyExtra = 0;
                r.unit = 'шт';
                return;
            }

            if (per && !countsPacks && qty >= per * 3) {
                r._pieces = qty;
                r._packed = per;
                r._packNote = `${qty} шт → упаковки по ${per} шт`;
                r.qty = Math.ceil(qty / per);
                r.qtyExtra = 0;
                r.unit = 'шт';
            }
        });
    },

    /**
     * Углублённый проход по неподобранным строкам.
     *
     * Запускается сам, когда обычный подбор взял меньше 90 % строк. Правила
     * ослаблены: предмет может стоять не в начале названия каталога, хватает
     * одного совпавшего слова, порог ниже. Такие находки идут с оценкой не
     * выше 60 % и отдельной пометкой — это подсказка, а не подбор, и сверить
     * их обязательно. Ничего не портит: строки, у которых артикул уже есть,
     * не трогаются.
     */
    deepPass() {
        if (typeof RecognizeMatch === 'undefined' || !RecognizeMatch.matchByName) return;
        const total = this._rows.length;
        if (!total) return;
        const found = this._rows.filter(r => r._m).length;
        if (found / total >= 0.9) return;

        let added = 0;
        for (const r of this._rows) {
            if (r._m || r._locked) continue;
            // Ослабленные правила и работы — худшее сочетание: «Монтаж
            // котельной» находил «Монтажную гильзу» именно здесь.
            if (this.looksLikeWork(r)) continue;
            const m = RecognizeMatch.matchByName(r, { deep: true });
            if (!m) continue;
            r._m = m;
            r._deep = true;
            added++;
        }
        this._deep = added;
    },

    /**
     * Разбор строк, оставшихся без артикула.
     *
     * «Нет в каталоге» ничего не объясняет: непонятно, дописывать позицию в
     * каталог или это расходник, которого у поставщика нет вовсе. Считаем
     * причины и показываем сводку — по ней видно, где предел прайса, а где
     * недоработка подбора.
     */
    missAnalysis() {
        if (typeof RecognizeMatch === 'undefined' || !RecognizeMatch.explainMiss) return null;
        const miss = this._rows.filter(r => !r._m && r.kind !== 'work');
        if (!miss.length) return null;

        const groups = { noHave: [], notInBase: [], weak: [], noWords: [], noType: [] };
        for (const r of miss) {
            // Про строку с пометкой подбора известно точно: подходящее есть
            // только в чужом материале, своего нет. Разбирать причину заново
            // незачем — ответ уже получен на самом подборе.
            if (r._sysMiss) { groups.noHave.push({ row: r, info: null }); continue; }
            let e;
            try { e = RecognizeMatch.explainMiss(r); } catch (err) { e = null; }
            const key = (e && groups[e.reason]) ? e.reason : 'noType';
            groups[key].push({ row: r, info: e });
        }
        return { total: miss.length, groups };
    },

    /**
     * Монтажная работа, а не товар.
     *
     * Модель размечает это полем kind, но в счёте поставщика работы идут одним
     * списком с материалами, и она нет-нет да и назовёт «Монтаж радиатора»
     * оборудованием. Дальше строка уходила в подбор и цеплялась за «Монтажную
     * гильзу 16»: у слова «монтаж» общее начало с «монтажной», а углублённый
     * проход разрешает предмету стоять где угодно в названии. Тринадцать строк
     * работ на четверть миллиона получали артикул за 109 ₽ и уезжали в смету
     * гильзами.
     *
     * Подстраховка ловит действие в начале строки. «Монтажная планка» и
     * «Монтажный комплект» — предметы, поэтому проверяем ровно слово целиком,
     * а не приставку.
     */
    WORK_RE: /^\s*(монтаж|демонтаж|установка|укладка|прокладка|опрессовка|пусконаладка|штробление|сборка|наладка|разводка|доставка|подъём|подъем)(\s|$|[.,:;])/i,

    looksLikeWork(row) {
        if (!row) return false;
        if (row.kind === 'work') return true;
        return this.WORK_RE.test(String(row.raw || ''));
    },

    // ------------------------------------------------------------------
    // Подбор монтажной работы по НАШЕМУ прайсу
    //
    // Работы в каталоге товаров искать бессмысленно, но у нас есть свой
    // прайс-лист монтажа — WORK_PRICE_CATALOG, тот же, что показывается в
    // личном кабинете. По нему и сравниваем: чужая смета говорит, во сколько
    // работу оценил конкурент, наш прайс — во сколько её считаем мы.
    //
    // Подбор по словам, а не по точному совпадению: у нас «Монтаж радиатора
    // отопления», в счёте «Монтаж радиатора», и это одно и то же.
    // ------------------------------------------------------------------

    /**
     * Слова, которые есть почти в каждом названии работы и потому ничего не
     * различают. «Монтаж» стоит и в нашем прайсе, и в чужом счёте — считать
     * его совпадением значит признать похожими все работы разом.
     */
    WORK_STOP: new Set([
        'монтаж', 'монтажа', 'установка', 'установки', 'подключение', 'сборка',
        'работы', 'работ', 'включая', 'также', 'систем', 'системы', 'система',
        'шт', 'компл', 'комплект', 'точка', 'пара',
    ]),

    /**
     * Слова строки, приведённые к основе.
     *
     * Сначала снимаем падежное окончание, потом обрезаем до шести букв.
     * Одной обрезки мало: «ввода» и «ввод» дали бы разные начала. Одного
     * снятия окончаний тоже — «водорозеток» и «водорозетки» расходятся на
     * беглой гласной. Шесть букв, а не четыре: на четырёх «водорозетки» и
     * «водонагреватель» сливаются в «водо», и монтаж водорозеток
     * сопоставлялся с монтажом бойлера.
     */
    workStem(w) {
        const s = w.replace(/(иями|ями|ами|иях|ях|ах|ого|его|ому|ему|ыми|ими|ой|ей|ая|яя|ое|ее|ые|ие|ый|ий|ом|ем|ов|ев|ам|ям|ю|я|ы|и|у|о|е|ь|а)$/, '');
        const base = s.length >= 3 ? s : w;
        return base.length > 6 ? base.slice(0, 6) : base;
    },

    workWords(s) {
        const out = new Set();
        String(s || '').toLowerCase().replace(/ё/g, 'е')
            .replace(/[^а-яa-z0-9]+/g, ' ').split(' ')
            .forEach(w => {
                if (w.length < 3 || this.WORK_STOP.has(w)) return;
                out.add(this.workStem(w));
            });
        return out;
    },

    /**
     * Прямые соответствия «их формулировка → наша расценка».
     *
     * Подбор по словам решает не всё: в чужих КП работы называют укрупнённо и
     * своими словами, а у нас прайс подробный. «Монтаж тёплого пола (включая
     * монтаж утеплителя)» — это две наши расценки сразу, «Монтаж водорозеток» —
     * наша «Точка присоединения ХВС», где кроме розетки посчитаны и трубы.
     * Ни то, ни другое по совпадению слов не выводится.
     *
     * Таблица короткая и пополняемая: сюда стоит дописывать формулировки по
     * мере того, как они встречаются в реальных КП. Порядок важен — проверка
     * идёт сверху вниз, первое совпадение выигрывает.
     *
     * plus — работы, которые чужая строка включает в себя дополнительно. Они
     * учитываются только если прямо названы в самой строке.
     */
    // ВНИМАНИЕ: \w и \b в JS — только латиница, на кириллице они молча не
    // срабатывают. Внутри русского слова пишем [а-яё]*, а не \w*: на \w*
    // шаблон «тепл\w*\s*пол» не совпал с «тёплого пола», и монтаж тёплого
    // пола сопоставлялся с монтажом одного лишь утеплителя.
    WORK_ALIASES: [
        { all: [/тепл[а-яё]*\s*пол/i], work: 'Монтаж труб водяного тёплого пола',
          plus: [{ re: /утеплител/i, work: 'Монтаж утеплителя для укладки ТП' }] },
        { all: [/утеплител/i], work: 'Монтаж утеплителя для укладки ТП' },
        { all: [/коллектор/i, /водоснабж|хвс|вод[аыуе]/i], work: 'Установка и подключение коллектора системы водоснабжения' },
        { all: [/коллектор/i, /радиатор|отоплен|групп/i], work: 'Монтаж коллектора радиаторов' },
        { all: [/водорозет/i], work: 'Точка присоединения ХВС (монтаж трубопроводов, водорозетки)' },
        { all: [/радиатор/i], work: 'Монтаж радиатора отопления' },
        { all: [/конвектор/i], work: 'Монтаж внутрипольного конвектора' },
        { all: [/полотенцесушител/i], work: 'Монтаж водяного полотенцесушителя с обвязкой' },
        { all: [/канализац/i], work: 'Монтаж труб канализации (без метража)' },
        { all: [/инсталляц|унитаз/i], work: 'Монтаж инсталляции унитаза' },
        { all: [/дымоход|коаксиал/i], work: 'Монтаж коаксиального дымохода' },
        { all: [/ввод/i, /вод/i], work: 'Ввод воды в дом (греющий кабель, теплоизоляция)' },
        { all: [/незамерзающ|уличн/i, /кран/i], work: 'Монтаж незамерзающего уличного крана' },
        { all: [/скважинн/i, /насос/i], work: 'Монтаж скважинного насоса (опуск, оголовок, автоматика)' },
        { all: [/насосн/i, /групп/i], work: 'Монтаж насосной группы' },
        { all: [/гидрострелк|гидравлическ[а-яё]*\s*стрелк/i], work: 'Монтаж гидравлической стрелки' },
        { all: [/бойлер|водонагреват/i], work: 'Монтаж водонагревателя / бойлера' },
        // «котел(?![ья])» отсекает «котельную»: она начинается так же, но это
        // не котёл, а помещение, и работа там совсем другая.
        { all: [/газов/i, /котл|котёл|котел(?![ья])/i], work: 'Монтаж газового котла' },
        { all: [/электрическ/i, /котл|котёл|котел(?![ья])/i], work: 'Mонтаж электрического котла' },
        { all: [/опрессовк/i], work: 'Опрессовка котельной' },
        { all: [/пусконаладк/i], work: 'Пусконаладка котельной' },
        { all: [/сервопривод/i], work: 'Монтаж сервоприводов' },
        { all: [/термостат/i], work: 'Монтаж термостатов' },
        { all: [/стабилизатор/i], work: 'Монтаж стабилизатора напряжения' },
        { all: [/фильтрац|big\s*blue|колб/i], work: 'Монтаж системы фильтрации Big Blue (колбы + картриджи)' },
    ],

    /** Наш прайс работ с учётом персональных цен монтажника. */
    ourWorks() {
        if (typeof WORK_PRICE_CATALOG === 'undefined') return [];
        if (this._ourWorks) return this._ourWorks;
        this._ourWorks = WORK_PRICE_CATALOG.map(w => ({
            name: w.name,
            unit: w.unit,
            group: w.group,
            price: this.ourWorkPrice(w.name, w.price),
            words: this.workWords(w.name),
        }));
        return this._ourWorks;
    },

    /**
     * Наша цена работы: сначала правка в этой смете, потом персональный
     * прайс монтажника, и только затем цена по умолчанию — тот же порядок,
     * что и в addToWorks() при расчёте сметы.
     */
    ourWorkPrice(name, base) {
        const st = (typeof app !== 'undefined' && app.state) || {};
        if (st.customWorks && st.customWorks[name] !== undefined) return Number(st.customWorks[name]) || 0;
        if (typeof app !== 'undefined' && app.wp) return Number(app.wp(name, base)) || 0;
        return Number(base) || 0;
    },

    /**
     * Насколько наша работа похожа на строку из документа.
     *
     * Мера Дайса по общим основам: доля совпавших от суммы длин. Она не
     * поощряет наши длинные названия («Точка присоединения ХВС (монтаж
     * трубопроводов, водорозетки)») за то, что в них много слов.
     *
     * Планка высокая, и совпасть должно не меньше двух слов. Дешевле не
     * сопоставить работу вовсе, чем сопоставить неверно: строка «Монтаж труб
     * отопления, 250 м по 200 ₽» при низком пороге цеплялась за «Монтаж
     * радиатора отопления» по одному слову «отопления» — и сравнение
     * показывало разницу в тысячу процентов на ровном месте. Погонного
     * монтажа труб у нас в прайсе нет, и честный ответ здесь — «нет».
     */
    WORK_MATCH_MIN: 0.5,

    matchWork(row) {
        const raw = String((row && row.raw) || '');
        if (!raw) return null;

        // Сначала прямые соответствия: они точнее любого счёта слов.
        for (const a of this.WORK_ALIASES) {
            if (!a.all.every(re => re.test(raw))) continue;
            const w = this.ourWorks().find(x => x.name === a.work);
            if (!w) continue;
            const extra = (a.plus || [])
                .filter(p => p.re.test(raw))
                .map(p => this.ourWorks().find(x => x.name === p.work))
                .filter(Boolean);
            return { work: w, extra, score: 1, byAlias: true };
        }

        const q = this.workWords(raw);
        if (q.size < 2) return null;   // из одного слова работу не опознать
        let best = null;
        for (const w of this.ourWorks()) {
            let common = 0;
            for (const x of q) if (w.words.has(x)) common++;
            if (common < 2) continue;
            const score = (2 * common) / (q.size + w.words.size);
            if (!best || score > best.score) best = { work: w, extra: [], score };
        }
        return best && best.score >= this.WORK_MATCH_MIN ? best : null;
    },

    /**
     * Свёртка нескольких их строк в одну нашу расценку.
     *
     * Разбивка смет не совпадает: у них «Монтаж водорозеток 14 шт по 250 ₽» и
     * «Монтаж труб водоснабжения 153 м по 200 ₽» — две строки, у нас одна
     * «Точка присоединения ХВС», и трубы в неё уже входят: так эта расценка и
     * называется. Пока строки сравнивались порознь, наши 3 700 ₽ за точку
     * стояли против их 250 ₽ за розетку, и вкладка показывала, что мы дороже
     * в пятнадцать раз, — при том что их же трубы за 30 600 ₽ висели «вне
     * сравнения» и в счёт не шли.
     *
     * Ведущая строка задаёт количество наших точек, поглощаемая добавляет свою
     * сумму к их стороне сравнения. Свёртку можно разобрать обратно кнопкой:
     * состав работ у всех разный, и решать за монтажника тут нельзя.
     */
    WORK_ROLLUPS: [
        {
            work: 'Точка присоединения ХВС (монтаж трубопроводов, водорозетки)',
            lead: [/водорозет/i],
            absorb: [[/труб/i, /водоснабж|хвс|вод[аыуе]/i]],
            note: 'трубы водоснабжения посчитаны отдельной строкой, а в нашу точку они входят',
        },
        {
            work: 'Точка присоединения ГВС (монтаж трубопроводов, водорозетки)',
            lead: [/гвс|горяч/i, /точк|розет/i],
            absorb: [[/труб/i, /гвс|горяч/i]],
            note: 'трубы ГВС посчитаны отдельной строкой, а в нашу точку они входят',
        },
    ],

    /**
     * Сверка единиц измерения.
     *
     * «Монтаж тёплого пола, 94 м» и наша расценка «750 ₽/м²» — это метры трубы
     * против квадратов пола, и перемножать их нельзя: на этой строке ошибка
     * выходит в разы и выглядит достоверно. Считаем сопоставимыми только
     * единицы одного рода: штуки, точки, комплекты и пары считают предметы,
     * метры — длину, квадраты — площадь.
     *
     * Единицу, которой нет в списке, за ошибку не считаем: молчать лучше, чем
     * ругаться на незнакомое сокращение.
     */
    UNIT_GROUP: {
        'шт': 'count', 'штук': 'count', 'штука': 'count', 'ед': 'count',
        'точка': 'count', 'точки': 'count', 'точек': 'count',
        'компл': 'count', 'комплект': 'count', 'кт': 'count',
        'пара': 'count', 'пар': 'count',
        'м': 'len', 'мп': 'len', 'погм': 'len', 'пм': 'len',
        'м2': 'area', 'кв2': 'area', 'квм': 'area',
    },

    unitGroup(u) {
        const k = String(u || '').toLowerCase().replace(/ё/g, 'е')
            .replace(/²/g, '2').replace(/[\s./\\-]/g, '');
        return this.UNIT_GROUP[k] || null;
    },

    unitsOk(theirUnit, ourUnit) {
        const a = this.unitGroup(theirUnit);
        const b = this.unitGroup(ourUnit);
        if (!a || !b) return true;
        return a === b;
    },

    /**
     * Во сколько раз наша расценка должна разойтись с их ценой, чтобы считать
     * это ошибкой сопоставления, а не разницей в цене.
     *
     * Тот же смысл, что у PRICE_GUARD_RATIO для материалов: работа может стоить
     * вдвое дороже и втрое дешевле, но не в пятнадцать раз. Пятнадцать — это
     * когда «Монтаж водорозеток» по 250 ₽ сравнили с нашей точкой присоединения
     * за 3 700 ₽, где посчитаны ещё и трубы. Сравнивать надо суммы строк, а не
     * цены за единицу: единицы у нас и у них разные по определению.
     */
    WORK_GUARD_RATIO: 5,

    /**
     * Разметка работ перед показом и переносом: свёртка, единицы, цена.
     * Ручной выбор расценки не трогаем — раз выбрали, значит так и надо.
     */
    prepareWorks(works) {
        this.applyRollups(works);
        for (const r of works) {
            delete r._wUnitBad;
            delete r._wAlarm;
            const w = r._w && r._w.work;
            if (!w || r._wLocked || r._rolledInto) continue;

            if (!this.unitsOk(r.unit, w.unit)) { r._wUnitBad = w.unit; continue; }

            const qty = this.docQty(r);
            const their = this.docPrice(r) * qty + (r._roll
                ? r._roll.rows.reduce((s, x) => s + this.docPrice(x) * this.docQty(x), 0) : 0);
            const ours = this.workPriceOf(r._w) * qty;
            if (their <= 0 || ours <= 0) continue;
            const k = ours > their ? ours / their : their / ours;
            if (k >= this.WORK_GUARD_RATIO) r._wAlarm = ours > their ? Math.round(k) : -Math.round(k);
        }
    },

    /** Идёт ли работа в сравнение: расценка есть, единицы сходятся, цена не дикая. */
    workComparable(r) {
        return !!(r._w && r._w.work && !r._wUnitBad && !r._wAlarm && !r._rolledInto);
    },

    applyRollups(works) {
        works.forEach(r => { delete r._rolledInto; delete r._roll; });
        for (const rule of this.WORK_ROLLUPS) {
            if (this._rollOff && this._rollOff[rule.work]) continue;
            const lead = works.find(r => !r._rolledInto && r._w && r._w.work.name === rule.work
                && rule.lead.every(re => re.test(r.raw || '')));
            if (!lead) continue;
            // Поглощаем только то, чему своей расценки не нашлось: строку,
            // которая и сама с чем-то сопоставлена, забирать нельзя.
            const absorbed = works.filter(r => r !== lead && !r._w && !r._rolledInto
                && rule.absorb.some(set => set.every(re => re.test(r.raw || ''))));
            if (!absorbed.length) continue;
            absorbed.forEach(a => { a._rolledInto = lead; });
            lead._roll = { rows: absorbed, note: rule.note, work: rule.work };
        }
    },

    /** Разобрать свёртку обратно: строки снова сравниваются порознь. */
    unroll(work) {
        if (!this._rollOff) this._rollOff = {};
        this._rollOff[work] = true;
        this.renderReview();
    },

    reroll(work) {
        if (this._rollOff) delete this._rollOff[work];
        this.renderReview();
    },

    /** Наша цена строки работ: расценка плюс те, что чужая строка включает. */
    workPriceOf(w) {
        if (!w || !w.work) return 0;
        return (w.work.price || 0) + (w.extra || []).reduce((s, x) => s + (x.price || 0), 0);
    },

    rematch(row) {
        if (row._locked) return;   // ручной выбор автоподбор не перебивает
        // Работу подбирать по каталогу нечем: в нём нет работ. Зато есть наш
        // прайс монтажа — по нему и подбираем, для сравнения и переноса.
        if (this.looksLikeWork(row)) {
            row._m = null;
            delete row._priceAlarm;
            if (!row._wLocked) row._w = this.matchWork(row);
            return;
        }
        // Что монтажник однажды подобрал руками, подбирать заново незачем:
        // он уже сказал, чем эта строка является. Правила подбора о местных
        // сокращениях поставщика не знают и не узнают.
        if (this.memApply(row)) return;
        row._sysMiss = null;   // пометку «у нас такого нет» ставит сам подбор
        row._m = (typeof RecognizeMatch !== 'undefined' && typeof catalog !== 'undefined')
            ? RecognizeMatch.matchItem(row, this._sys) : null;
        if (row._m) row._sysMiss = null;
        this.priceGuard(row);
    },

    /**
     * Во сколько раз цены должны разойтись, чтобы считать это не «дорого»,
     * а «подобрано не то».
     *
     * Настоящая разница прайса с закупкой конкурента укладывается в разы, но
     * не в порядки: сорок процентов, вдвое, изредка втрое. Пятикратная — это
     * уже другой предмет.
     */
    PRICE_GUARD_RATIO: 5,

    /**
     * Насколько узкой должна быть полоса цен при переподборе.
     *
     * Пять — это порог тревоги, а не критерий поиска: в полосе ±5x нашёлся
     * «Коллектор хромированный» за 3 440 ₽ вместо коллекторной группы за
     * 16 000 ₽, формально прошёл и молча снял предупреждение. Заменять промах
     * можно только тем, что стоит примерно столько же; вдвое — это уже запас
     * на чужую наценку и скидку.
     */
    PRICE_REMATCH_BAND: 2,

    /**
     * Предохранитель по цене документа.
     *
     * Чужая цена — единственная в смете подсказка о том, ЧТО за предмет имелся
     * в виду, и подбор её не использует: он ищет по словам названия. Из-за
     * этого «Сервопривод Rommer H, 3, 230 В» за 682 ₽ уходил в трёхточечный
     * привод смесительного клапана за 32 929 ₽ — совпало слово «3», которое в
     * исходнике было частью обозначения модели. Шестнадцать таких строк дали
     * полмиллиона и сдвинули итог сравнения на 76 процентных пунктов.
     *
     * Поэтому: разошлись в PRICE_GUARD_RATIO раз — сначала пробуем запасные
     * варианты подбора, вдруг верный там. Не нашлось — подбор оставляем как
     * есть (выбрасывать его нельзя, вдруг цена в документе — опечатка), но
     * помечаем строку: в таблице проверки она подсветится, а в сравнение цен
     * не пойдёт.
     *
     * Работает только там, где в документе есть цены. На рукописной смете
     * сверять не с чем, и предохранитель молчит.
     */
    priceGuard(row) {
        delete row._priceAlarm;
        delete row._priceFixed;
        const m = row._m;
        if (!m || !m.item || row._locked) return;

        const dp = this.docPrice(row);
        // Цену берём в единицах документа: бухта в каталоге стоит за метр, и без
        // пересчёта верный подбор выглядел расхождением в десятки раз.
        const op = this.ourUnitPriceOf(m.item, row);
        if (!dp || !op) return;

        const off = p => p > dp * this.PRICE_GUARD_RATIO || p * this.PRICE_GUARD_RATIO < dp;
        if (!off(op)) return;

        const alt = (m.alternatives || []).find(a =>
            a && Number(a.price) && !off(this.ourUnitPriceOf(a, row)));
        if (alt) {
            row._m = { ...m, item: alt };
            row._priceFixed = true;
            return;
        }

        /**
         * Запасные варианты — это три соседа по той же оценке названия, и если
         * подбор ушёл не в ту сторону целиком, верного среди них нет. Так
         * «Коллекторная группа с расходомерами 1"х10х3/4" Rommer» за 16 123 ₽
         * уходила в «Коллектор с запорными клапанами, 2 вых.» за 1 251 ₽, а
         * рядом в прайсе лежал RMS-1200-000010 за 16 205 ₽ — тот самый, и цена
         * сходится до полупроцента.
         *
         * Поэтому ищем ещё раз по всему каталогу и прайсу, но только среди
         * того, что стоит того же порядка. Цена документа здесь работает как
         * дополнительный признак: она не говорит, ЧТО это, но убирает из
         * отбора всё, чем этот предмет быть не может.
         */
        if (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.matchByName) {
            const again = RecognizeMatch.matchByName(row, {
                deep: true,
                priceBand: {
                    min: dp / this.PRICE_REMATCH_BAND,
                    max: dp * this.PRICE_REMATCH_BAND,
                    target: dp,
                },
            });
            if (again && again.item && again.item !== m.item && !off(this.ourUnitPriceOf(again.item, row))) {
                row._m = again;
                row._priceFixed = true;
                return;
            }
        }
        // Во сколько раз мимо — это и показываем монтажнику: «дороже в 48 раз»
        // говорит о промахе внятнее, чем «+4732%».
        row._priceAlarm = op > dp ? Math.round(op / dp) : -Math.round(dp / op);
    },

    /**
     * Снимок строк для «Отменить».
     *
     * Позиции каталога ссылаются друг на друга: у товара есть поле alts со
     * списком альтернатив, а те ссылаются обратно. Обычный JSON.stringify на
     * такой структуре падает с «circular structure», и вместе с ним падало
     * всё, что делает снимок: удаление строк, перенос в раздел, переключатель
     * аналогов, сама отмена. Поэтому связи между товарами в снимок не идут —
     * для отката нужны сами строки, а не каталог целиком.
     */
    // _rolledInto и _roll ссылаются на соседние строки того же массива. В
    // снимок они не идут: свёртка пересчитывается при каждой отрисовке, а
    // ссылка на строку в JSON превращается либо в её копию, либо в дыру.
    SNAP_SKIP: ['alts', 'alternatives', 'rommer', 'comfort', '_item', '_rolledInto', '_roll'],

    snap() {
        const seen = new WeakSet();
        const json = JSON.stringify(this._rows, (key, value) => {
            if (this.SNAP_SKIP.includes(key)) return undefined;
            if (value && typeof value === 'object') {
                if (seen.has(value)) return undefined;   // страховка от прочих циклов
                seen.add(value);
            }
            return value;
        });
        this._undo.push(json);
        if (this._undo.length > 40) this._undo.shift();
    },

    set(i, field, val) {
        this.snap();
        const r = this._rows[i];
        r[field] = (val === '') ? null
            : (['qty', 'qtyExtra', 'd'].includes(field) ? Number(val) : val);
        // Раздел выбран руками — подраздел, угаданный автоматом, отменяется:
        // «6.3. Big Blue» внутри, скажем, «9. Дополнительные» — мусор.
        if (field === 'section') r.sectionGroup = null;
        r._locked = false;
        // Правка признаков — это просьба подобрать заново. Запомненная замена
        // тут только мешала бы: она вернула бы прежний артикул поверх того,
        // ради чего тип и диаметр правили.
        if (['type', 'd', 'thread'].includes(field)) { r._noMem = true; delete r._fromMem; }
        this.rematch(r);
        this.renderReview();
    },

    thread(i, t) {
        this.snap();
        const r = this._rows[i];
        r.threadType = (r.threadType === t) ? null : t;
        r._locked = false;
        r._noMem = true;
        delete r._fromMem;
        this.rematch(r);
        this.renderReview();
    },

    del(i) { this.snap(); this._rows.splice(i, 1); this.refreshSuggestions(); this.renderReview(); },
    sel(i, v) { this._rows[i]._sel = v; this.renderReview(); },
    /**
     * Галочка в шапке таблицы.
     *
     * Отрисовка идёт заново после каждого изменения, и раньше чекбокс шапки
     * всегда приходил пустым — снять им выделение было нельзя, только по одной
     * строке. Поэтому состояние берётся из строк: отмечен, когда выделены все.
     */
    allSelected() {
        const vis = this.visibleRows();
        return vis.length > 0 && vis.every(r => r._sel);
    },

    // Галочка в шапке работает по видимому: при включённом фильтре выделять
    // строки, которых на экране нет, — не то, о чём просят.
    selAll(v) { this.visibleRows().forEach(r => r._sel = v); this.renderReview(); },

    // ------------------------------------------------------------------
    // Фильтр «только проблемные»
    //
    // На смете в полторы сотни строк разобранные и неразобранные идут
    // вперемешку. Подсветка есть, но искать жёлтое глазами по всей таблице —
    // это и есть та работа, ради избавления от которой распознавание
    // затевалось. Фильтр оставляет на экране только то, что требует решения,
    // и список тает по мере правки.
    // ------------------------------------------------------------------

    /**
     * Строка, с которой надо что-то сделать.
     *
     * Три признака, и все три означают, что смета уедет неправильной: без
     * артикула — строка с нулём, с несходящейся ценой — чужое изделие за
     * чужие деньги, без количества — строка не уедет вовсе.
     *
     * Работа без артикула сюда не входит: артикула у неё и быть не может,
     * это норма, а не дыра в смете.
     *
     * «Раздел под вопросом» сюда тоже НЕ входит, хотя напрашивался. На пробе
     * он сработал на пяти строках из шести: раздел угадывается по смете
     * целиком, и на всём, что не опознано уверенно, стоит эта пометка. Фильтр
     * с ней показывал ровно ту же таблицу, от которой должен был избавить.
     * Спорный раздел к тому же виден в самой строке и правится выпадающим
     * списком, а не поиском по каталогу.
     */
    /**
     * Чужой расходник: пена, газ к пистолету, отрезной круг.
     *
     * Его отсутствие в каталоге — не промах подбора, а факт: у поставщика
     * такого товара нет. В смету строка уедет своей ценой из документа, и
     * требовать по ней решения незачем.
     */
    notOurRange(r) {
        return !!(typeof RecognizeMatch !== 'undefined' && RecognizeMatch.notOurRange
            && RecognizeMatch.notOurRange(r && r.raw));
    },

    isProblem(r) {
        if (!r) return false;
        // Строка про чужой расходник проблемой не считается: искать нечего.
        if (!r._m && this.notOurRange(r)) return false;
        if (!r._m && !this.looksLikeWork(r)) return true;     // нет в каталоге
        if (r._priceAlarm) return true;                       // цена не сходится
        if (!((r.qty || 0) + (r.qtyExtra || 0))) return true; // нет количества
        return false;
    },

    /** Строки, которые сейчас на экране: с учётом фильтра. */
    visibleRows() {
        return this._onlyBad ? this._rows.filter(r => this.isProblem(r)) : this._rows.slice();
    },

    toggleOnlyBad(on) {
        this._onlyBad = !!on;
        this.renderReview();
    },

    renderBadFilter(badN) {
        // Кнопки нет, когда фильтровать нечего. Но если он включён, а последняя
        // проблема только что исчезла, переключатель обязан остаться — иначе
        // выключить его будет нечем, а таблица останется пустой.
        if (!badN && !this._onlyBad) return '';
        return `<label class="rec-switch${this._onlyBad ? ' on' : ''}"
                       title="Оставить на экране только строки, требующие решения: без артикула, с несходящейся ценой, без количества или со спорным разделом">
            <input type="checkbox" ${this._onlyBad ? 'checked' : ''}
                   onchange="RecognizeUI.toggleOnlyBad(this.checked)">
            <span class="rec-switch-track"><span class="rec-switch-knob"></span></span>
            <span class="rec-switch-text">Только проблемные <em>${badN}</em></span>
          </label>`;
    },
    delSel() {
        if (!this._rows.some(r => r._sel)) return;
        this.snap();
        this._rows = this._rows.filter(r => !r._sel);
        this.renderReview();
    },

    /** Массовый перенос отмеченных строк в один раздел сметы. */
    moveSel(section) {
        if (!section || !this._rows.some(r => r._sel)) return;
        this.snap();
        this._rows.forEach(r => {
            if (!r._sel) return;
            r.section = section;
            r.sectionGroup = null;   // раздел назначен вручную — подраздела нет
            r._sectionSure = true;   // выбор человека сомнений не вызывает
        });
        this.renderReview();
    },
    undo() {
        if (!this._undo.length) return;
        this._rows = JSON.parse(this._undo.pop());
        // Режим аналогов восстанавливаем по самим строкам, иначе после отката
        // кнопка осталась бы «включённой» при исходных позициях в таблице.
        this._analogOn = this._rows.some(r => r._analogBase);
        if (!this._analogOn) this._analogSaved = 0;
        this.renderReview();
    },

    renderReview() {
        // Перерисовка идёт после любой правки — здесь же и запоминаем разбор,
        // чтобы обновление страницы не стирало работу.
        this.saveDraft();

        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const cell = v => (v === null || v === undefined || v === '') ? '' : v;
        const THREADS = ['ВР', 'НР', 'ВВ', 'ВН'];

        // Разделы исходного документа. Заголовок ставится перед первой ВИДИМОЙ
        // строкой раздела: при включённом фильтре «только проблемные» пустые
        // заголовки висели бы над ничем.
        const secState = { last: null };

        const rows = this._rows.map((r, n) => {
            // Отфильтрованную строку пропускаем, но номер n сохраняем: по нему
            // работают все кнопки строки, и пересчёт индексов после фильтра
            // отправил бы правку не туда.
            if (this._onlyBad && !this.isProblem(r)) return '';

            const secHead = this.docSectionHead(r, 11, secState);

            const m = r._m;
            const qty = (r.qty || 0) + (r.qtyExtra || 0);
            // Цена из документа для строки без аналога: она уедет в смету
            // вместо нуля, значит и в таблице проверки должна быть видна.
            const docP = (!m && this.docPricesOn()) ? this.docPrice(r) : 0;
            // Жёлтым помечаем только то, что подобрать не удалось. Неполное
            // совпадение видно в самой ячейке подбора («совпадение 90%»), и
            // красить из-за него всю строку — значит топить настоящую проблему
            // в жёлтом фоне половины таблицы.
            // Строка с несходящейся ценой красится наравне с неподобранной:
            // молча оставленный чужой артикул за тридцать тысяч дороже
            // обходится, чем пустая строка, которую видно.
            // Работа без артикула — это норма, а не дыра в смете: красить её
            // наравне с неподобранным материалом значит пугать зря.
            // Чужой расходник жёлтым не красим: жёлтый значит «нужно решение»,
            // а решать тут нечего — такого товара у поставщика нет.
            const cls = m ? (r._priceAlarm ? 'rec-pricebad' : '')
                : (this.looksLikeWork(r) ? 'rec-workrow'
                    : (this.notOurRange(r) ? '' : 'rec-nomatch'));

            const tbtns = THREADS.map(t =>
                `<button class="rec-tbtn ${r.threadType === t ? 'on' : ''}"
                         onclick="RecognizeUI.thread(${n},'${t}')">${t}</button>`).join('');

            // Подставленное из памяти замен подписываем иначе, чем выбранное
            // только что: монтажник должен видеть, что артикул сюда поставил
            // не подбор, а его собственное прошлое решение — и мочь от него
            // отказаться, не разыскивая, где оно хранится.
            const mark = r._fromMem
                ? ` · по вашему прошлому выбору · <a href="#" class="rec-memforget"
                     onclick="RecognizeUI.memForget(${n});return false;">забыть</a>`
                : (r._locked ? ' · выбрано вручную'
                    : (m && m.score < 1 ? ` · совпадение ${Math.round(m.score * 100)}%` : ''));

            const match = m
                ? `<div>${esc(m.item.name)}</div>
                   <div class="rec-art">${esc(m.item.article || m.item.id)}${mark}${
                    m.needsApproval ? ' · <b>требует согласования</b>' : ''}${
                    r._priceFixed ? ' · <b>уточнено по цене</b>' : ''}</div>${
                    m.substituted ? `<div class="rec-art">${esc(m.substituted)}</div>` : ''}${
                    this.renderAlts(r, n)}${
                    r._priceAlarm ? `<div class="rec-pricebad-note">Цена не сходится: ${
                        r._priceAlarm > 0 ? `у нас дороже в ${r._priceAlarm} раз` : `у нас дешевле в ${-r._priceAlarm} раз`
                    } — скорее всего подобрано другое изделие, проверьте 🔍</div>` : ''}`
                : (this.looksLikeWork(r)
                    ? `<span class="rec-work-tag">монтажная работа</span>
                       <span class="rec-art">уйдёт в раздел работ${
                        docP ? ' со своей ценой из документа' : ' без цены'}</span>`
                    // Про эту строку известно больше, чем «не нашли»: подходящее
                    // в базе есть, но в другом материале, а своего нет вовсе.
                    // Так и пишем — иначе монтажник будет искать её руками
                    // через 🔍 и не найдёт, потому что искать нечего.
                    : this.notOurRange(r)
                        ? `<span class="rec-art">не наш ассортимент (расходник монтажника) — уйдёт своей позицией ${
                            docP ? 'с ценой из документа' : 'с ценой 0'}</span>`
                    : r._sysMiss
                        ? `<span class="rec-nohave">${esc(this.sysMissText(r._sysMiss))}</span>
                           <span class="rec-art">уйдёт своей позицией ${
                            docP ? 'с ценой из документа' : 'с ценой 0'} — поставьте свою или уберите строку</span>`
                        : docP
                            ? `<span class="rec-art">нет в каталоге — уйдёт своей позицией с ценой из документа</span>`
                            : `<span class="rec-art">нет в каталоге — уйдёт своей позицией с ценой 0</span>`);

            return `${secHead}<tr class="${cls}">
              <td><input type="checkbox" ${r._sel ? 'checked' : ''}
                         onchange="RecognizeUI.sel(${n},this.checked)"></td>
              <td class="rec-raw">${r.docNo ? `<span class="rec-docno">${esc(r.docNo)}</span>` : ''}${esc(r.raw)}
                  ${r._inherited ? `<div class="rec-art">наименование от строки выше: ${esc(r._inherited)}</div>` : ''}</td>
              <td><input class="rec-f" value="${esc(cell(r.type))}"
                         onchange="RecognizeUI.set(${n},'type',this.value)"></td>
              <td><input class="rec-f rec-f-s" value="${esc(cell(r.d))}"
                         onchange="RecognizeUI.set(${n},'d',this.value)"></td>
              <td><input class="rec-f rec-f-s" value="${esc(cell(r.thread))}"
                         onchange="RecognizeUI.set(${n},'thread',this.value)">
                  <div class="rec-tgroup">${tbtns}</div></td>
              <td><input class="rec-f rec-f-s" value="${esc(cell(r.qty))}"
                         onchange="RecognizeUI.set(${n},'qty',this.value)">
                  ${r.qtyExtra ? `<span class="rec-art">+${r.qtyExtra}</span>` : ''}
                  ${r._packNote ? `<div class="rec-art">${esc(r._packNote)}</div>` : ''}</td>
              <td>${match}</td>
              <td>${m ? Math.round(this.ourUnitPrice(r) * 100) / 100 + ' ₽' : (docP ? `<span class="rec-art">${Math.round(docP)} ₽</span>` : '—')}</td>
              <td><b>${m ? Math.round(this.ourUnitPrice(r) * qty) + ' ₽'
                : (docP ? `<span class="rec-art">${Math.round(docP * qty)} ₽</span>` : '—')}</b></td>
              <td>
                <select class="rec-f${r._sectionSure === false ? ' rec-guess' : ''}"
                        onchange="RecognizeUI.set(${n},'section',this.value)">
                  ${(RecognizeMatch.SECTIONS || []).map(s =>
                    `<option value="${esc(s)}" ${r.section === s ? 'selected' : ''}>${esc(s)}</option>`
                  ).join('')}
                </select>
                ${r._sectionSure === false ? '<div class="rec-art">раздел под вопросом</div>' : ''}
              </td>
              <td class="rec-acts">
                <button onclick="RecognizeUI.search(${n})" title="Найти в каталоге">🔍</button>
                <button onclick="RecognizeUI.del(${n})" title="Удалить строку">✕</button>
              </td></tr>`;
        }).join('');

        // Вычеркнутые строки при включённом фильтре прячем: решения они не
        // требуют, это справка о том, что модель увидела и не взяла.
        const skipRows = this._onlyBad ? '' : (this._skipped || []).map(s =>
            `<tr class="rec-skip"><td></td><td class="rec-raw">${esc(s.raw)}</td>
             <td colspan="8">${esc(s.reason || 'вычеркнуто')}</td></tr>`).join('');

        const found = this._rows.filter(r => r._m);
        // Работы в проценте подбора не участвуют: артикула у них нет и быть не
        // может, а в знаменателе они занижали цифру и выглядели как провал.
        const works = this._rows.filter(r => this.looksLikeWork(r));
        const eqTotal = this._rows.length - works.length;
        // В итог идут и цены из документа: именно с ними строки уедут в смету,
        // и сумма под таблицей должна совпадать с тем, что монтажник увидит.
        const sum = this._rows.reduce((s, r) => {
            const q = (r.qty || 0) + (r.qtyExtra || 0);
            if (r._m) return s + this.ourUnitPrice(r) * q;
            return s + (this.docPricesOn() ? this.docPrice(r) * q : 0);
        }, 0);
        const noQty = this._rows.filter(r => !((r.qty || 0) + (r.qtyExtra || 0))).length;
        const selN = this._rows.filter(r => r._sel).length;
        // Считается по всей смете, а не по показанному: иначе с включённым
        // фильтром счётчик показывал бы сам себя.
        const badN = this._rows.filter(r => this.isProblem(r)).length;

        // Работы уехали на свою вкладку: в одной таблице с материалами им
        // делать нечего — ни артикула, ни каталога, ни аналога ROMMER, зато
        // есть свой прайс, с которым их и надо сравнивать.
        if (this._tab === 'works' && (works.length || this.missingWorks(works).length)) {
            this.renderWorksPane(works, sum); return;
        }
        if (!works.length && !this.missingWorks(works).length) this._tab = 'eq';

        document.getElementById('rec_body').innerHTML = `
          ${this._parseWarning ? `<div class="rec-err">${esc(this._parseWarning)}
             Проверьте, все ли строки сметы на месте.</div>` : ''}
          ${this.renderSavedTime(found.length)}
          ${this.renderTabs(eqTotal, works)}
          ${this.renderTotalCheck()}
          ${this.renderTotalsStrip()}
          ${this.renderControls(found.length, eqTotal, works, noQty, badN)}
          ${this.renderSelectionBar(selN)}
          <div class="rec-tablewrap">
            <table class="rec-table">
              <colgroup><col style="width:30px"><col style="width:170px"><col style="width:140px">
                <col style="width:50px"><col style="width:100px"><col style="width:70px">
                <col><col style="width:72px"><col style="width:82px">
                <col style="width:190px"><col style="width:66px"></colgroup>
              <thead><tr>
                <th><input type="checkbox" ${this.allSelected() ? 'checked' : ''}
                           title="Выделить все строки / снять выделение"
                           onchange="RecognizeUI.selAll(this.checked)"></th>
                <th>Как написано</th><th>Тип</th><th>D</th><th>Резьба</th><th>Кол.</th>
                <th>Подобрано в каталоге</th><th>Цена</th><th>Сумма</th>
                <th>Раздел сметы</th><th></th>
              </tr></thead>
              <tbody>${rows}${skipRows}${
            (this._onlyBad && !badN) ? `<tr><td colspan="11" class="rec-allclear">
                 ✓ Проблемных строк не осталось — можно переносить смету.
                 <button class="rec-btn-g" onclick="RecognizeUI.toggleOnlyBad(false)">Показать все</button>
               </td></tr>` : ''}</tbody>
            </table>
          </div>
          ${this.renderMissAnalysis()}
          ${this.renderSuggestions()}
          <div class="rec-foot">
            <div class="rec-total">Итого: <b>${Math.round(sum).toLocaleString('ru-RU')} ₽</b></div>
            <button class="calc-dialog-btn calc-dialog-btn-cancel" onclick="RecognizeUI.apply('new')">Создать новую смету</button>
            <button class="calc-dialog-btn calc-dialog-btn-confirm" onclick="RecognizeUI.apply('add')">Добавить в текущую смету</button>
          </div>`;
    },

    // ------------------------------------------------------------------
    // Вкладка монтажных работ
    // ------------------------------------------------------------------

    /**
     * Итог по всему КП: оборудование и работы вместе.
     *
     * До этого сравнение жило на двух экранах врозь, и ответа на главный вопрос
     * — «во сколько тот же объём выйдет у нас целиком» — не было ни на одном.
     * Складываем только сопоставимое: там, где позиция не подобрана, единицы
     * разошлись или цена ушла в разы, суммы идут в отдельный счёт «вне
     * сравнения», а не растворяются в итоге.
     */
    compareTotals() {
        const brand = this._cmpBrand === 'rommer' ? 'rommer' : 'stout';
        // eqDoc — сколько внутри итога стоят позиции, у которых нашей цены нет и
        // взята цена документа. Нужен подписью в шапке: без неё непонятно, что
        // часть суммы «у нас» — вовсе не наша.
        const t = { eqTheir: 0, eqOur: 0, eqOut: 0, eqDoc: 0, wTheir: 0, wOur: 0, wOut: 0 };

        const works = this._rows.filter(r => this.looksLikeWork(r));
        if (works.length) this.prepareWorks(works);

        for (const r of this._rows) {
            const qty = this.docQty(r);
            const dp = this.docPrice(r);

            if (this.looksLikeWork(r)) {
                if (r._rolledInto) continue;      // её сумма уже в ведущей строке
                const roll = r._roll
                    ? r._roll.rows.reduce((s, x) => s + this.docPrice(x) * this.docQty(x), 0) : 0;
                const their = dp * qty + roll;
                const ours = this.workPriceOf(r._w) * qty;
                if (this.workComparable(r) && their > 0 && ours > 0) {
                    t.wTheir += their; t.wOur += ours;
                } else {
                    t.wOut += their;
                }
                continue;
            }

            const m = r._m;
            const op = m ? this.ourUnitPriceOf(m.item, r) : 0;
            const ra = (m && typeof RecognizeMatch !== 'undefined' && RecognizeMatch.rommerAlt)
                ? RecognizeMatch.rommerAlt(m.item) : null;
            const bp = brand === 'rommer' ? (ra ? (this.ourUnitPriceOf(ra.item, r) || op) : op) : op;
            if (dp > 0 && op > 0 && qty > 0 && !r._priceAlarm) {
                t.eqTheir += dp * qty; t.eqOur += bp * qty;
            } else if (!m && dp > 0 && qty > 0 && this.docPricesOn()) {
                /**
                 * Позиция без аналога в каталоге при включённом тумблере уезжает
                 * в смету с ценой из документа — значит в «у нас» она входит той
                 * же цифрой, а не выпадает во «вне сравнения». Иначе тумблер
                 * менял состав сметы, но не двигал ни одного числа в шапке, и по
                 * ней нельзя было понять, что он вообще делает.
                 *
                 * На разницу это не влияет: одна и та же сумма ложится на обе
                 * стороны — мы на таких позициях не дороже и не дешевле.
                 */
                t.eqTheir += dp * qty; t.eqOur += dp * qty; t.eqDoc += dp * qty;
            } else {
                t.eqOut += dp * qty;
            }
        }

        t.their = t.eqTheir + t.wTheir;
        t.our = t.eqOur + t.wOur;
        t.out = t.eqOut + t.wOut;
        t.delta = t.our - t.their;
        // Точное значение; округляет уже показ (fmtPct), иначе мелкая разница
        // превращалась в «+0%» рядом с ненулевой суммой.
        t.pct = t.their > 0 ? (t.delta / t.their) * 100 : 0;
        t.brand = brand;
        return t;
    },

    /** Полоса итога — одна и та же на обеих вкладках. */
    renderTotalsStrip() {
        if (!this.hasDocPrices()) return '';
        const t = this.compareTotals();
        if (t.their <= 0) return '';
        const money = n => Math.round(n || 0).toLocaleString('ru-RU') + ' ₽';
        const part = (a, b) => `${money(a)} / ${money(b)}`;

        return `<div class="rec-grand${t.delta > 0 ? ' up' : t.delta < 0 ? ' down' : ''}">
            <div class="rec-grand-main">
              <span class="rec-grand-lbl">По документу</span>
              <b>${money(t.their)}</b>
              <span class="rec-grand-arrow">→</span>
              <span class="rec-grand-lbl">У нас · ${t.brand === 'rommer' ? 'ROMMER' : 'STOUT'}</span>
              <b>${money(t.our)}</b>
              <span class="rec-grand-delta">${t.delta === 0 ? 'разницы нет'
                : `${t.delta > 0 ? '+' : '−'}${money(Math.abs(t.delta))} (${t.delta > 0 ? '+' : ''}${this.fmtPct(t.pct)}%)`}</span>
            </div>
            <div class="rec-grand-sub">
              оборудование ${part(t.eqTheir, t.eqOur)} · работы ${part(t.wTheir, t.wOur)}${
            t.eqDoc > 0 ? ` · из них по ценам документа ${money(t.eqDoc)}` : ''}${
            t.out > 0 ? ` · вне сравнения ${money(t.out)}` : ''}
            </div>
          </div>`;
    },

    /**
     * Панель разбора: чем считаем и что уже подобрано.
     *
     * Над таблицей стояли две разнородные строки: в первой служебные кнопки
     * вперемешку с действиями над выделением, во второй — режимы; кнопки при
     * пустом выделении оставались на виду серыми и занимали место. Теперь
     * настройки разбора собраны в одну панель, а действия над выделением живут
     * отдельно и появляются, только когда есть что с ними делать.
     */
    renderControls(foundN, eqTotal, works, noQty, badN) {
        const fromMem = this._rows.filter(r => r._fromMem).length;
        const stat = `Подобрано ${foundN} из ${eqTotal} (${
            eqTotal ? Math.round(foundN / eqTotal * 100) : 0}%)`
            + (works.length ? ` · монтажных работ ${works.length}` : '')
            + (this._deep ? ` · из них углублённым поиском ${this._deep}` : '')
            + (fromMem ? ` · по вашим прошлым заменам ${fromMem}` : '')
            + (this._mergeInfo ? ' · ' + this._mergeInfo : '')
            + (noQty ? ` · без количества ${noQty}` : '');

        // «Отменить» показываем, только когда есть что отменять: пустая серая
        // кнопка на экране ничего не сообщает.
        const undo = this._undo.length
            ? `<button class="rec-btn-g" title="Отменить последнее изменение"
                       onclick="RecognizeUI.undo()">↶ Отменить</button>` : '';

        // «Сбросить» стоит рядом с «Отменить», но делает другое: «Отменить»
        // откатывает одну правку, а это очищает разбор целиком и возвращает
        // к загрузке. Раньше выйти из разобранной сметы можно было только
        // применив её или перезагрузив страницу.
        const reset = `<button class="rec-btn-g" title="Очистить разбор и загрузить другую смету"
                       onclick="RecognizeUI.resetAll()">✕ Сбросить распознавание</button>`;

        return `<div class="rec-panel">
            <div class="rec-panel-row">
              ${this.renderSystemSelect()}
              ${this.renderBadFilter(badN || 0)}
              ${this.renderAnalogButton()}
              ${this.renderDocPriceButton()}
              <span class="rec-tb-right">
                ${this.renderRetryButton()}${this.renderMemoryButton()}${undo}${this.renderCompareButton()}${reset}
              </span>
            </div>
            <div class="rec-panel-stat">${stat}</div>
          </div>`;
    },

    /** Действия над выделенными строками. Нет выделения — нет и панели. */
    renderSelectionBar(selN) {
        if (!selN) return '';
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        return `<div class="rec-selbar">
            <span class="rec-selbar-n">Выбрано ${selN}</span>
            <button class="rec-btn-g" onclick="RecognizeUI.searchSelected()"
                    title="Выбрать один артикул и поставить его всем отмеченным строкам">🔍 Подобрать всем</button>
            <button class="rec-btn-g" onclick="RecognizeUI.delSel()">Удалить</button>
            <select class="rec-btn-g"
                    onchange="RecognizeUI.moveSel(this.value); this.selectedIndex=0;">
              <option value="">Перенести в раздел…</option>
              ${(typeof RecognizeMatch !== 'undefined' ? (RecognizeMatch.SECTIONS || []) : []).map(s =>
                `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
            <span class="rec-tb-right">
              <button class="rec-btn-g" onclick="RecognizeUI.selAll(false)">Снять выделение</button>
            </span>
          </div>`;
    },

    /**
     * Переключатель «Оборудование / Монтажные работы».
     *
     * Вкладка нужна и тогда, когда своих строк работ в документе нет: накладная
     * или отчёт по материалам — это ровно тот случай, ради которого считаются
     * работы по составу оборудования. Раньше вкладка при нуле работ пропадала
     * вместе с ними, и смета уезжала без монтажа.
     */
    renderTabs(eqTotal, works) {
        const miss = this.missingWorks(works);
        if (!works.length && !miss.length) return '';
        const wSum = works.reduce((s, r) => s + this.docPrice(r) * this.docQty(r), 0);
        const on = this._tab === 'works';
        const n = works.length || miss.length;
        return `<div class="rec-tabs">
            <button class="rec-tab${on ? '' : ' on'}" onclick="RecognizeUI.tab('eq')">
              Оборудование <em>${eqTotal}</em></button>
            <button class="rec-tab${on ? ' on' : ''}" onclick="RecognizeUI.tab('works')">
              Монтажные работы <em>${n}</em>${
            works.length ? (wSum > 0 ? ` <i>${Math.round(wSum).toLocaleString('ru-RU')} ₽</i>` : '')
                : ' <i>по оборудованию</i>'}</button>
          </div>`;
    },

    tab(t) {
        this._tab = t;
        this.renderReview();
    },

    /** В смету работы уезжают с нашей ценой; по умолчанию — да. */
    ourWorkPricesOn() {
        return this._useOurWorkPrices !== false;
    },

    toggleOurWorkPrices(on) {
        this._useOurWorkPrices = !!on;
        this.renderReview();
    },

    /** Смена подобранной работы вручную. */
    setWork(n, name) {
        this.snap();
        const row = this._rows[n];
        if (!row) return;
        if (!name) {
            row._w = null;
            row._wLocked = true;          // «не сравнивать» — тоже решение
        } else {
            const w = this.ourWorks().find(x => x.name === name);
            row._w = w ? { work: w, extra: [], score: 1 } : null;
            row._wLocked = true;
        }
        this.renderReview();
    },

    /**
     * Работы, которых в чужой смете нет, а по составу оборудования быть должны.
     *
     * Правила намеренно короткие и очевидные: есть радиаторы — должен быть их
     * монтаж, есть бойлер — его подключение. Гадать за монтажника не надо, но
     * забытая строка в чужом КП — это то, чем оно и отличается от нашего, и
     * увидеть её стоит до того, как смету сравнили по деньгам.
     */
    WORK_HINTS: [
        // --- 1.1 Котёл и бойлер ---
        { re: /кот[её]л/i, not: /обвязк|коллектор|автоматик|контроллер|термостат|дымоход|стабилизатор|фильтр|бак|насос/i,
          sub: /газов/i, work: 'Монтаж газового котла' },
        { re: /кот[её]л/i, not: /газов|обвязк|коллектор|автоматик|контроллер|термостат|дымоход|стабилизатор|фильтр|бак|насос/i,
          work: 'Mонтаж электрического котла' },
        { re: /дымоход|коаксиал/i, work: 'Монтаж коаксиального дымохода' },
        { re: /стабилизатор напряж/i, work: 'Монтаж стабилизатора напряжения' },
        // \b в JS считает словом только латиницу, поэтому границы слова в
        // русских правилах задаются через (?![а-яё]) — иначе «тэн\b» и
        // «трап\b» не срабатывают вообще ни на чём.
        // «ТЭН» в исключения не берём: он стоит в названии самих бойлеров
        // («с возм. уст. ТЭН»), и по нему терялся монтаж бойлера целиком.
        { re: /бойлер|водонагреват/i, not: /насос|кран|американк|клапан|гильз/i,
          work: 'Монтаж водонагревателя / бойлера' },
        { re: /бойлер\s*косвенн|косвенн[а-яё]*\s*нагрев/i, qty: 'one',
          work: 'Подключение бойлера косвенного нагрева (монтаж гидравлики)' },
        { re: /расширительн[а-яё]*\s*бак|гидроаккумулятор|мембранн[а-яё]*\s*бак/i,
          work: 'Установка расширительного бака водоснабжения' },

        // --- 1.2 Обвязка котельной ---
        { re: /гидрострелк|гидравлическ[а-яё]*\s*стрелк/i, work: 'Монтаж гидравлической стрелки' },
        { re: /насосн[а-яё]*\s*групп/i, work: 'Монтаж насосной группы' },
        { re: /насос\s*циркуляционн|циркуляционн[а-яё]*\s*насос/i,
          not: /рециркуляц|гвс|групп|скважин|блок управлени/i, work: 'Установка насоса' },
        { re: /насос\s*гвс|рециркуляц/i, not: /точк|труб/i,
          work: 'Монтаж циркуляционного насоса рециркуляции ГВС' },
        { re: /распределительн[а-яё]*\s*коллектор\s*котельн|коллекторн[а-яё]*\s*балк/i,
          work: 'Монтаж распределительного коллектора котельной' },

        // --- 1.3 Радиаторы ---
        // Радиатором считаем сам прибор. «Коллектор радиаторный», «трубка для
        // подключения радиатора», кронштейны и термоголовки — это не точки
        // монтажа, и складывать их в количество радиаторов нельзя.
        { re: /радиатор/i, not: /коллектор|трубк|кронштейн|шкаф|термоголов|узел|переходник|заглушк|футорк|пробк|клапан|кран|уплотнен/i,
          work: 'Монтаж радиатора отопления' },
        { re: /конвектор/i, work: 'Монтаж внутрипольного конвектора' },
        { re: /полотенцесушител/i, work: 'Монтаж водяного полотенцесушителя с обвязкой' },
        { re: /коллектор\s*радиаторн|радиаторн[а-яё]*\s*коллектор/i, qty: 'pairs',
          work: 'Установка коллектора для радиаторов' },
        { re: /шкаф\s*(распределительн|коллекторн)|шрн|шрв/i,
          work: 'Монтаж и обвязка распределительных шкафов' },

        // --- 1.4 Тёплый пол ---
        // Площадь берём только оттуда, где она написана прямо в названии
        // (подложка и маты продаются в м²). По метражу трубы её не считаем:
        // шаг укладки в документе не указан, а PEX-a идёт и на радиаторы.
        { re: /подложк|мат[ыи]?\s*(для\s*)?(т[её]пл|тп(?![а-яё]))|теплоизоляционн[а-яё]*\s*мат/i, qty: 'area',
          work: 'Монтаж труб водяного тёплого пола' },
        { re: /подложк|мат[ыи]?\s*(для\s*)?(т[её]пл|тп(?![а-яё]))|теплоизоляционн[а-яё]*\s*мат/i, qty: 'area',
          work: 'Монтаж утеплителя для укладки ТП' },
        { re: /коллектор.*(т[её]пл[а-яё]*\s*пол|тп(?![а-яё]))|(т[её]пл[а-яё]*\s*пол).*коллектор/i, qty: 'pairs',
          work: 'Установка и подключение коллектора теплого пола' },
        { re: /скоб[аы]\s*якорн|такер|подложк|коллектор.*т[её]пл[а-яё]*\s*пол/i, qty: 'one',
          work: 'Опрессовка систем водяного тёплого пола' },

        // --- 1.4 Автоматика ---
        { re: /сервопривод/i, work: 'Монтаж сервоприводов' },
        { re: /термостат/i, not: /бойлер|водонагреват|с\s*термостатом/i, work: 'Монтаж термостатов' },
        { re: /коммутационн[а-яё]*\s*блок|блок\s*управлени[а-яё]*\s*(смесительн|контур)|контроллер/i,
          not: /насос/i, qty: 'one', work: 'Монтаж коммутационного блока' },

        // --- 2.1 Внешнее водоснабжение ---
        { re: /скважинн[а-яё]*\s*насос|погружн[а-яё]*\s*насос|блок\s*управлени[а-яё]*\s*насос|sirio/i,
          qty: 'one', work: 'Монтаж скважинного насоса (опуск, оголовок, автоматика)' },

        // --- 2.2 Узел ввода ХВС ---
        { re: /big\s*blue|корпус\s+(для\s+)?(картриджн[а-яё]*\s+)?фильтр|колб[аы]\s+фильтр/i, qty: 'one',
          work: 'Монтаж системы фильтрации Big Blue (колбы + картриджи)' },
        { re: /незамерзающ|уличн[а-яё]*\s*кран/i, work: 'Монтаж незамерзающего уличного крана' },

        // --- 2.3 Внутреннее водоснабжение ---
        { re: /водорозетк/i, work: 'Точка присоединения ХВС (монтаж трубопроводов, водорозетки)' },
        { re: /коллектор\s*никелированн|коллектор.*водоснабж|коллектор\s*1["»].*вых/i,
          not: /радиаторн|т[её]пл/i, work: 'Установка и подключение коллектора системы водоснабжения' },

        // --- 3.1 Канализация ---
        // Точки канализации считаем по приборам, а не по трубам и фитингам:
        // сколько точек в доме, по метражу фановой трубы не узнать.
        { re: /трап|сифон|унитаз|инсталляц|раковин|умывальник|мойк|ванн[аы](?![а-яё])|душев/i,
          not: /трапец/i, work: 'Монтаж труб канализации (без метража)' },
        { re: /инсталляц|унитаз/i, work: 'Монтаж инсталляции унитаза' },
    ],

    /**
     * Количество для подсказанной работы.
     *
     * 'sum'   — сумма количеств подходящих позиций (радиаторы, сервоприводы);
     * 'one'   — работа комплексная, сколько бы позиций её ни выдало;
     * 'pairs' — коллекторы в прайсе считаются парами (подача + обратка);
     * 'area'  — площадь, написанная прямо в названии позиции («... (30 м²)»).
     */
    hintQty(hits, mode) {
        if (mode === 'one') return 1;
        if (mode === 'area') {
            let a = 0;
            for (const r of hits) {
                const src = ((r._m && r._m.item && r._m.item.name) || '') + ' ' + (r.raw || '');
                const m = src.match(/(\d+(?:[.,]\d+)?)\s*м\s*(?:²|2|кв)/i);
                if (m) a += parseFloat(m[1].replace(',', '.')) * (this.docQty(r) || 1);
            }
            return Math.round(a);
        }
        const sum = hits.reduce((s, r) => s + this.docQty(r), 0) || hits.length;
        if (mode === 'pairs') return Math.max(1, Math.ceil(sum / 2));
        return sum;
    },

    /** Текст строки, по которому ищем признак работы: и чужой, и наш. */
    hintText(r) {
        return (r.raw || '') + ' ' + ((r._m && r._m.item && r._m.item.name) || '');
    },

    missingWorks(works) {
        const have = new Set((works || []).filter(r => r._w).map(r => r._w.work.name));
        const eq = this._rows.filter(r => !this.looksLikeWork(r) && this.docQty(r) > 0);
        const out = [];
        for (const h of this.WORK_HINTS) {
            if (have.has(h.work) || out.some(o => o.work.name === h.work)) continue;
            const hit = eq.filter(r => {
                const t = this.hintText(r);
                if (!h.re.test(t)) return false;
                if (h.not && h.not.test(t)) return false;
                if (h.sub && !h.sub.test(t)) return false;
                return true;
            });
            if (!hit.length) continue;
            const w = this.ourWorks().find(x => x.name === h.work);
            if (!w) continue;
            const qty = this.hintQty(hit, h.qty);
            if (!(qty > 0)) continue;   // площадь не написана — не выдумываем её
            out.push({ work: w, qty, why: hit.length + (hit.length === 1 ? ' позиция' : ' позиций') });
        }
        return out;
    },

    /** Подсказанные работы, которые монтажник не снял галочкой. */
    missingWorksOn(works) {
        return this.missingWorks(works).filter(m => !(this._missOff || {})[m.work.name]);
    },

    toggleMiss(name, on) {
        if (!this._missOff) this._missOff = {};
        if (on) delete this._missOff[name]; else this._missOff[name] = true;
        this.renderReview();
    },

    renderWorksPane(works, eqSum) {
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const money = n => Math.round(n || 0).toLocaleString('ru-RU') + ' ₽';

        // Наш прайс мог поменяться правкой в смете — пересобираем на каждый показ.
        this._ourWorks = null;

        this.prepareWorks(works);

        let theirCmp = 0, ourCmp = 0, theirAll = 0, ourAll = 0;
        let matched = 0, rolled = 0, flagged = 0, cmpN = 0;

        const groups = {};
        for (const w of this.ourWorks()) (groups[w.group] = groups[w.group] || []).push(w);
        const options = sel => Object.keys(groups).map(g =>
            `<optgroup label="${esc(g)}">${groups[g].map(w =>
                `<option value="${esc(w.name)}" ${w.name === sel ? 'selected' : ''}>${
                    esc(w.name)} · ${Math.round(w.price)} ₽/${esc(w.unit)}</option>`).join('')}</optgroup>`).join('');

        const rows = works.map(r => {
            const n = this._rows.indexOf(r);
            const qty = this.docQty(r);
            const dp = this.docPrice(r);
            const dSum = dp * qty;
            const w = r._w && r._w.work;
            const extra = (r._w && r._w.extra) || [];
            const op = this.workPriceOf(r._w);
            const oSum = op * qty;

            theirAll += dSum;

            // Строка, свёрнутая в соседнюю: своей цены в сравнении у неё нет,
            // её сумма учтена ведущей строкой. Показываем подстрочником.
            if (r._rolledInto) {
                rolled++;
                return `<tr class="rec-rolled">
                  <td class="rec-raw">${esc(r.raw)}</td>
                  <td>${qty || '—'} ${esc(r.unit || 'шт')}</td>
                  <td>${dp > 0 ? money(dp) : '—'}</td>
                  <td><b>${dSum > 0 ? money(dSum) : '—'}</b></td>
                  <td colspan="4"><span class="rec-art">учтено в строке
                    «${esc(r._rolledInto.raw)}» — там наша расценка включает и это</span>
                    <button class="rec-btn-g" style="margin-left:8px"
                            onclick="RecognizeUI.unroll('${esc(r._rolledInto._w.work.name).replace(/'/g, "\\'")}')">Считать отдельно</button>
                  </td></tr>`;
            }

            // Ведущая строка свёртки забирает суммы поглощённых на свою сторону.
            const rollSum = r._roll ? r._roll.rows.reduce((s, x) => s + this.docPrice(x) * this.docQty(x), 0) : 0;
            const dSumAll = dSum + rollSum;

            // Наша цена идёт в смету только у сопоставимых строк: там, где
            // единицы разъехались или цена ушла в разы, вернее взять их цену,
            // чем умножать нашу расценку на чужой объём.
            const ok = this.workComparable(r);
            ourAll += ok ? oSum : dSum;
            if (w) matched++;
            if (w && !ok) flagged++;
            if (ok) { theirCmp += dSumAll; ourCmp += oSum; cmpN++; }

            let diff = '<span class="rec-cmp-eq">—</span>';
            if (ok && dSumAll > 0 && qty > 0) {
                const pct = ((oSum - dSumAll) / dSumAll) * 100;
                diff = pct > 0 ? `<span class="rec-cmp-up">+${this.fmtPct(pct)}%</span>`
                    : pct < 0 ? `<span class="rec-cmp-down">${this.fmtPct(pct)}%</span>`
                        : '<span class="rec-cmp-eq">0%</span>';
            } else if (w) {
                diff = '<span class="rec-cmp-up" title="Не участвует в итогах">✕</span>';
            }

            return `<tr class="${w ? (ok ? '' : 'rec-pricebad') : 'rec-nomatch'}">
              <td class="rec-raw">${esc(r.raw)}${r._roll
                ? `<div class="rec-art">+ ${r._roll.rows.map(x => esc(x.raw)).join('; ')}
                     <br>свёрнуто в одну нашу расценку: ${esc(r._roll.note)}</div>` : ''}</td>
              <td><input class="rec-f rec-f-s" value="${qty || ''}"
                         onchange="RecognizeUI.set(${n},'qty',this.value)"> ${esc(r.unit || 'шт')}</td>
              <td>${dp > 0 ? money(dp) : '—'}</td>
              <td><b>${dSumAll > 0 ? money(dSumAll) : '—'}</b>${r._roll
                ? `<div class="rec-art">в т.ч. ${money(rollSum)} со свёрнутых</div>` : ''}</td>
              <td>
                <select class="rec-f" onchange="RecognizeUI.setWork(${n}, this.value)">
                  <option value="">— нет в нашем прайсе —</option>
                  ${options(w ? w.name : null)}
                </select>
                ${extra.map(x => `<div class="rec-art">+ ${esc(x.name)} · ${
                    Math.round(x.price)} ₽/${esc(x.unit)} — их строка включает и это</div>`).join('')}
                ${r._wUnitBad ? `<div class="rec-pricebad-note">Единицы разные: у них
                    «${esc(r.unit || 'шт')}», у нас «${esc(r._wUnitBad)}» — перемножать нельзя.
                    Строка идёт со своей ценой и в сравнение не входит. Если объём тот же,
                    по нашему прайсу это <b>${money(oSum)}</b> — выберите расценку в списке
                    вручную, и строка вернётся в сравнение.</div>` : ''}
                ${r._wAlarm ? `<div class="rec-pricebad-note">Расценка расходится ${
                    r._wAlarm > 0 ? `в ${r._wAlarm} раз в нашу сторону` : `в ${-r._wAlarm} раз в их сторону`
                } — скорее всего сопоставлено не то. В итоги не идёт.</div>` : ''}
                ${w && !r._wLocked && !r._w.byAlias
                    ? '<div class="rec-art">похоже по названию — сверьте</div>' : ''}
                ${w && r._wLocked ? '<div class="rec-art">выбрано вручную</div>' : ''}
              </td>
              <td>${w ? money(op) + '<div class="rec-art">за ' + esc(w.unit) + '</div>' : '—'}</td>
              <td><b>${w ? money(oSum) : '—'}</b></td>
              <td>${diff}</td></tr>`;
        }).join('');

        const delta = ourCmp - theirCmp;
        const pct = theirCmp > 0 ? (delta / theirCmp) * 100 : 0;
        // Свёрнутые строки не «вне сравнения»: их суммы учтены ведущей строкой.
        const outN = works.length - rolled - (matched - flagged);

        const miss = this.missingWorks(works);
        const missOff = this._missOff || {};
        const missOn = miss.filter(m => !missOff[m.work.name]);
        const missSum = missOn.reduce((s, m) => s + m.work.price * m.qty, 0);

        document.getElementById('rec_body').innerHTML = `
          ${this.renderTabs(this._rows.length - works.length, works)}
          ${this.renderTotalCheck()}
          ${this.renderTotalsStrip()}
          <div class="rec-toolbar">
            <button class="rec-btn-g" onclick="RecognizeUI.undo()" ${this._undo.length ? '' : 'disabled'}>↶ Отменить</button>
            <span class="rec-status">${works.length
                ? `Сопоставлено с нашим прайсом ${matched} из ${works.length}${
                    rolled ? ` · ${rolled} свёрнуто в наши точки` : ''}${
                    flagged ? ` · ${flagged} отложено: единицы или цена не сходятся` : ''}${
                    works.length - matched - rolled > 0
                        ? ` · ${works.length - matched - rolled} уедут своей строкой с ценой из документа` : ''}`
                : `Строк монтажа в документе нет · работ по составу оборудования: ${missOn.length} из ${miss.length}`
            }</span>
            ${Object.keys(this._rollOff || {}).filter(k => this._rollOff[k]).map(k =>
                `<button class="rec-btn-g" onclick="RecognizeUI.reroll('${esc(k).replace(/'/g, "\\'")}')">↩ Вернуть свёртку</button>`).join('')}
            ${works.length ? `<span class="rec-tb-right">
              <label class="rec-switch${this.ourWorkPricesOn() ? ' on' : ''}"
                     title="Чем считать работы в смете: нашим прайсом монтажа или ценами из чужого документа">
                <input type="checkbox" ${this.ourWorkPricesOn() ? 'checked' : ''}
                       onchange="RecognizeUI.toggleOurWorkPrices(this.checked)">
                <span class="rec-switch-track"><span class="rec-switch-knob"></span></span>
                <span class="rec-switch-text">В смету — наши расценки</span>
              </label>
            </span>` : ''}
          </div>

          ${!works.length ? '' : `<div class="rec-cmp-sum">
            <div class="rec-cmp-item">
              <div class="rec-cmp-val">${money(theirCmp)}</div>
              <div class="rec-cmp-lbl">По документу<br><span>${cmpN} ${
                this.plural(cmpN, 'работа', 'работы', 'работ')}, которые можно сравнить</span></div>
            </div>
            <div class="rec-cmp-item">
              <div class="rec-cmp-val">${money(ourCmp)}</div>
              <div class="rec-cmp-lbl">Те же ${cmpN} ${
                this.plural(cmpN, 'работа', 'работы', 'работ')}<br><span>по нашему прайсу</span></div>
            </div>
            ${delta === 0 ? `<div class="rec-cmp-item"><div class="rec-cmp-val">0 ₽</div>
                 <div class="rec-cmp-lbl">Разницы нет<br><span>по этим ${cmpN} ${
                    this.plural(cmpN, 'работе', 'работам', 'работам')}</span></div></div>`
                : `<div class="rec-cmp-item">
                 <div class="rec-cmp-val ${delta > 0 ? 'up' : 'down'}">${
                    delta > 0 ? '+' : '−'}${money(Math.abs(delta))} (${delta > 0 ? '+' : ''}${this.fmtPct(pct)}%)</div>
                 <div class="rec-cmp-lbl">${delta > 0 ? 'У нас дороже' : 'У нас дешевле'}<br><span>только по этим ${
                    cmpN} ${this.plural(cmpN, 'работе', 'работам', 'работам')}</span></div></div>`}
          </div>`}

          ${!works.length ? '' : `<div class="rec-cmp-note">
            <b>Как это считается.</b> Всего работ в документе ${works.length - rolled} на
            ${money(theirAll)}. Из них ${cmpN} ${this.plural(cmpN, 'работа', 'работы', 'работ')}
            на ${money(theirCmp)} ${this.plural(cmpN, 'сопоставлена', 'сопоставлены', 'сопоставлены')}
            с нашим прайсом — только они и участвуют в проценте.${outN > 0 ? `
            Остальные ${outN} ${this.plural(outN, 'работа', 'работы', 'работ')} на
            ${money(theirAll - theirCmp)} <b>в сравнение не идут</b>: нашей расценки для них нет
            либо единицы не сходятся. В смету они уедут своей строкой с ценой из документа.` : ''}
            ${outN > 0 ? `<br>Укрупнённые формулировки вроде «монтаж котельной под ключ» на одну
            нашу работу не ложатся: у нас та же работа разложена на котёл, обвязку, опрессовку и
            пусконаладку — сравнивать их построчно значит сравнивать разное.` : ''}
          </div>`}

          ${miss.length ? `<div class="rec-missing">
            <div class="rec-missing-hd">${works.length
                ? `В документе не нашлось ${miss.length === 1
                    ? 'работы, которая следует' : 'работ, которые следуют'} из состава оборудования`
                : `Работ в документе нет — вот что следует из состава оборудования`} —
              на ${money(missSum)} по нашему прайсу</div>
            <table class="rec-table">
              <tbody>${miss.map(m => `<tr${missOff[m.work.name] ? ' class="rec-skip"' : ''}>
                <td style="width:34px"><input type="checkbox" ${missOff[m.work.name] ? '' : 'checked'}
                    onchange="RecognizeUI.toggleMiss('${esc(m.work.name).replace(/'/g, "\\'")}', this.checked)"></td>
                <td>${esc(m.work.name)}<div class="rec-art">в оборудовании: ${esc(m.why)}</div></td>
                <td style="width:110px">${m.qty} ${esc(m.work.unit)}</td>
                <td style="width:110px">${money(m.work.price)}</td>
                <td style="width:110px"><b>${money(m.work.price * m.qty)}</b></td>
              </tr>`).join('')}</tbody>
            </table>
            <div class="rec-art" style="padding:8px 12px 0;">Отмеченные строки уедут в смету нашей
              расценкой. Количество здесь — прикидка по документу: калькулятор не знает ни площади
              дома, ни числа точек, поэтому проверьте цифры и снимите лишнее.</div>
          </div>` : ''}

          ${!works.length ? '' : `<div class="rec-tablewrap">
            <table class="rec-table">
              <colgroup><col><col style="width:110px"><col style="width:86px"><col style="width:96px">
                <col style="width:300px"><col style="width:96px"><col style="width:96px">
                <col style="width:74px"></colgroup>
              <thead><tr>
                <th>Работа из документа</th><th>Кол.</th><th>Их цена</th><th>Их сумма</th>
                <th>Наша расценка</th><th>Наша цена</th><th>Наша сумма</th><th>Разница</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`}
          <div class="rec-foot">
            <div class="rec-total">Работы: <b>${money(
                (this.ourWorkPricesOn() ? ourAll : theirAll) + missSum)}</b>
              <span class="rec-art">оборудование: ${money(eqSum)}</span></div>
            <button class="calc-dialog-btn calc-dialog-btn-cancel" onclick="RecognizeUI.apply('new')">Создать новую смету</button>
            <button class="calc-dialog-btn calc-dialog-btn-confirm" onclick="RecognizeUI.apply('add')">Добавить в текущую смету</button>
          </div>`;
    },

    // ------------------------------------------------------------------
    // Сравнение с нашими ценами
    // ------------------------------------------------------------------

    /**
     * Сравнение чужой сметы с нашей.
     *
     * Главный сценарий вкладки — монтажнику принесли чужое КП. Разобрать его
     * мало: нужен ответ, во сколько тот же объём выйдет на STOUT/ROMMER.
     * Всё для этого уже есть — количество, подобранная позиция каталога и
     * её цена; не хватало только цен самого документа, поэтому их теперь
     * забирает разбор (см. правило 18 в RECOGNIZE_PROMPT).
     *
     * Считаем только по строкам, где известны ОБЕ цены. Складывать чужую
     * сумму с нашей там, где позиция не подобрана, — значит показать
     * экономию, которой нет.
     */
    docQty(r) {
        return (Number(r.qty) || 0) + (Number(r.qtyExtra) || 0);
    },

    /** Русское склонение по числу: 1 работа, 3 работы, 5 работ. */
    plural(n, one, few, many) {
        const d = Math.abs(n) % 10, h = Math.abs(n) % 100;
        if (d === 1 && h !== 11) return one;
        if (d >= 2 && d <= 4 && (h < 10 || h >= 20)) return few;
        return many;
    },

    /** Цена за единицу из документа: как её дала модель, либо сумма ÷ количество. */
    docPrice(r) {
        const p = Number(r.price);
        if (p > 0) return p;
        const s = Number(r.sum);
        const q = this.docQty(r);
        if (s > 0 && q > 0) return s / q;
        return 0;
    },

    // ------------------------------------------------------------------
    // Сверка с итогом документа
    //
    // Единственный способ узнать, что распознавание потеряло строку. Промах
    // подбора виден сразу — строка светится жёлтым, — а вот позиция, которую
    // модель просто не прочитала, не оставляет следа: в таблице её нет, и нет
    // ничего, что показывало бы её отсутствие. Зато внизу счёта напечатан
    // итог, и он посчитан ПО ВСЕМ строкам. Сходится с суммой разобранных —
    // прочитано всё; не сходится — ровно на сумму потерянного.
    //
    // Поэтому модели отдельно запрещено считать итог самой (правило 19):
    // сумма, полученная сложением тех же строк, сойдётся всегда и проверку
    // обесценит.
    // ------------------------------------------------------------------

    /**
     * Итоги, найденные в разобранном куске.
     *
     * Приводим к одному виду и старый ответ (docTotal + docTotalLabel), и
     * новый список: в памяти листов лежат разборы, сделанные до этой правки,
     * и терять их из-за смены формата незачем.
     */
    docTotalsOf(parsed) {
        const out = [];
        const push = (sum, label) => {
            const n = this.docNum(sum);
            if (n > 0) out.push({ sum: n, label: String(label || '').slice(0, 60) });
        };
        for (const t of (parsed && parsed.docTotals) || []) {
            if (t) push(t.sum, t.label);
        }
        if (!out.length && parsed) push(parsed.docTotal, parsed.docTotalLabel);
        return out;
    },

    /**
     * Слияние итогов, найденных в разных частях.
     *
     * Одинаковые числа схлопываем: один и тот же итог видят и лист, на котором
     * он напечатан, и сводящий проход, а сложить его с самим собой значит
     * получить вдвое больше документа.
     */
    mergeDocTotals(into, more) {
        for (const t of more || []) {
            if (!into.some(x => Math.abs(x.sum - t.sum) < 0.5)) into.push(t);
        }
        return into;
    },

    /** Число из документа: модель нет-нет да и вернёт «348 500,00 ₽» строкой. */
    docNum(v) {
        if (typeof v === 'number') return isFinite(v) && v > 0 ? v : 0;
        const s = String(v == null ? '' : v)
            .replace(/[\s ]/g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
        const n = parseFloat(s);
        return isFinite(n) && n > 0 ? n : 0;
    },

    /**
     * Проценты для показа.
     *
     * Крупная разница в десятых не нуждается — «+37,2%» читается хуже, чем
     * «+37%». А вот мелкая без них превращается в ноль: семь тысяч на итоге в
     * полтора миллиона округлялись до «+0%», и цифра выглядела опечаткой при
     * ненулевой сумме рядом. Граница — десять процентов.
     */
    fmtPct(p) {
        const v = Math.abs(p) >= 10 ? Math.round(p) : Math.round(p * 10) / 10;
        return v.toLocaleString('ru-RU');
    },

    /** Копеечные округления по строкам — не потеря. Полпроцента на это с запасом. */
    TOTAL_EPS: 0.005,
    NDS_RATE: 0.2,

    /**
     * Итог документа против суммы разобранных строк.
     *
     * Возвращает null, когда сверять нечем: итога в документе нет, цен в нём
     * нет, или часть листов не прочиталась (там расхождение объясняется
     * упавшим листом, а не потерей строки).
     */
    /**
     * С чем сверять сумму строк.
     *
     * Итогов в документе бывает несколько: КП делится на «Итого к оплате» по
     * оборудованию и по монтажу, и ни одно из этих чисел само по себе всей
     * смете не отвечает — отвечает их сумма. Раньше брался наибольший, и на
     * таком КП сверка ругалась на разницу в 400 тысяч, которой не было: она
     * сравнивала итог по оборудованию со строками оборудования И монтажа.
     *
     * Поэтому кандидатов несколько: каждый итог по отдельности и все вместе.
     * Подходит любой — значит документ прочитан целиком.
     */
    totalCandidates() {
        const list = (this._docTotals || []).filter(t => t && t.sum > 0);
        if (!list.length) return [];
        const out = list.map(t => ({ sum: t.sum, label: t.label || '', parts: 1 }));
        if (list.length > 1) {
            out.push({
                sum: list.reduce((s, t) => s + t.sum, 0),
                label: list.map(t => t.label).filter(Boolean).join(' + '),
                parts: list.length,
            });
        }
        return out;
    },

    totalCheck() {
        const cands = this.totalCandidates();
        if (!cands.length) return null;

        let sum = 0, priced = 0, blind = 0;
        for (const r of (this._rows || [])) {
            // Сумма строки точнее произведения: в документе она напечатана, а
            // цена за единицу там сплошь и рядом округлена до рубля.
            const s = this.docNum(r.sum) || this.docPrice(r) * this.docQty(r);
            if (s > 0) { sum += s; priced++; } else blind++;
        }
        if (!priced) return null;

        // Берём тот итог, к которому строки ближе всего. Если подходит хоть
        // один — сверка сошлась, и придираться к остальным незачем.
        let best = cands[0];
        for (const c of cands) {
            if (Math.abs(c.sum - sum) < Math.abs(best.sum - sum)) best = c;
        }

        const doc = best.sum;
        const delta = doc - sum;                       // чего итогу не хватило в строках
        const pct = Math.abs(delta) / doc;
        const base = {
            doc, sum, delta, pct, blind,
            label: best.label,
            parts: best.parts,
            all: cands.filter(c => c.parts === 1),
        };

        if (pct <= this.TOTAL_EPS) return { ...base, kind: 'ok' };

        // Итог ровно на НДС больше суммы строк: в таблице цены без налога.
        // Это не потеря, и пугать этим нельзя — иначе предупреждение будет
        // висеть на каждом втором счёте и его перестанут читать.
        if (delta > 0 && Math.abs(doc - sum * (1 + this.NDS_RATE)) / doc <= this.TOTAL_EPS) {
            return { ...base, kind: 'vat' };
        }

        // Строк без цены достаточно, чтобы объяснить недостачу, — значит дело
        // в них, а не в пропущенной позиции.
        if (delta > 0 && blind) return { ...base, kind: 'blind' };

        return { ...base, kind: delta > 0 ? 'short' : 'over' };
    },

    /** Плашка сверки над таблицей проверки. */
    renderTotalCheck() {
        const t = this.totalCheck();
        if (!t) return '';
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const money = n => Math.round(Math.abs(n) || 0).toLocaleString('ru-RU') + ' ₽';
        const pct = this.fmtPct(t.pct * 100);
        const label = t.label ? ` (${esc(t.label)})` : '';

        // Из чего сложился итог, с которым сверялись. Когда итогов в документе
        // несколько, без этой расшифровки цифра выглядит взятой с потолка.
        const from = t.parts > 1
            ? `<div>Итогов в документе несколько, сверка идёт по их сумме: ${
                t.all.map(c => `${esc(c.label || 'итог')} ${money(c.sum)}`).join(' + ')}.</div>`
            : '';

        const TEXT = {
            ok: {
                cls: 'ok', icon: '✓',
                head: `Сходится с итогом документа: ${money(t.doc)}${label}`,
                sub: 'Все строки на месте — сумма разобранного совпала с напечатанным итогом.' + from,
            },
            vat: {
                cls: 'ok', icon: '✓',
                head: `Сходится с итогом документа: ${money(t.doc)}${label}`,
                sub: `Строки дают ${money(t.sum)} — итог больше ровно на НДС 20%, значит цены в таблице без налога. Позиции прочитаны все.` + from,
            },
            blind: {
                cls: 'warn', icon: '!',
                head: `Итог документа ${money(t.doc)}${label}, строки таблицы дают ${money(t.sum)}`,
                sub: `Разница ${money(t.delta)} (${pct}%). У ${t.blind} ${
                    this.plural(t.blind, 'строки', 'строк', 'строк')} цена не прочиталась — скорее всего дело в них, но проверьте и то, все ли позиции на месте.` + from,
            },
            short: {
                cls: 'bad', icon: '!',
                head: `Не сходится с итогом документа: не хватает ${money(t.delta)}`,
                sub: `В документе ${money(t.doc)}${label}, строки таблицы дают ${money(t.sum)} — разница ${pct}%. Цены есть у всех строк, так что похоже на потерянную позицию: сверьте таблицу с оригиналом и допишите недостающее кнопкой поиска 🔍.` + from,
            },
            over: {
                cls: 'bad', icon: '!',
                head: `Не сходится с итогом документа: строки дают на ${money(t.delta)} больше`,
                sub: `В документе ${money(t.doc)}${label}, строки таблицы дают ${money(t.sum)} — разница ${pct}%. Причина может быть в задвоенной на стыке листов строке или в промежуточном итоге, попавшем в список отдельной позицией; посмотрите строки с самыми крупными суммами.` + from,
            },
        };
        const v = TEXT[t.kind];
        if (!v) return '';

        return `<div class="rec-tcheck ${v.cls}">
            <span class="rec-tcheck-ico">${v.icon}</span>
            <div><b>${v.head}</b><div class="rec-tcheck-sub">${v.sub}</div></div>
          </div>`;
    },

    /**
     * Наша цена в тех же единицах, в каких строка написана в документе.
     *
     * Бухты и мотки в каталоге хранятся ЦЕНОЙ ЗА МЕТР (unit: "м") — так короче
     * сверять с прайсом поставщика: цифра одна для бухт 30/50/100 м одного
     * диаметра, а сама длина стоит в названии («…, синяя, бухта 30 м»). В
     * чужом счёте та же гофра идёт одной строкой: «бухта 30 м, 1 шт, 1457 ₽».
     *
     * Сравнивать 1457 ₽ за бухту с 51.64 ₽ за метр нельзя: предохранитель
     * priceGuard видел расхождение в 28 раз, объявлял верно подобранную
     * позицию промахом и выбрасывал её из сравнения. Поэтому, когда документ
     * считает бухтами, а каталог — метрами, домножаем нашу цену на длину бухты.
     *
     * Когда в документе метраж («Гофра 18 мм синяя, 150 м»), пересчёт не нужен:
     * там единицы уже сходятся.
     */
    COIL_LEN_RE: /бухт[аеиы]?\s*(\d+(?:[.,]\d+)?)\s*м(?![а-яё²])/i,

    /** Длина бухты из названия позиции каталога; 0 — позиция не метражная. */
    coilLen(item) {
        if (!item || String(item.unit || '').trim().toLowerCase() !== 'м') return 0;
        const m = this.COIL_LEN_RE.exec(String(item.name || ''));
        const L = m ? parseFloat(m[1].replace(',', '.')) : 0;
        return L > 0 ? L : 0;
    },

    /** Считает ли строка документа метрами (а не штуками и бухтами). */
    docInMetres(row) {
        return /^(м|м\.?п\.?|мп|метр\S*|m)$/i.test(String((row && row.unit) || '').trim());
    },

    ourUnitPriceOf(item, row) {
        const p = Number(item && item.price) || 0;
        if (!p) return 0;
        const L = this.coilLen(item);
        return (L && !this.docInMetres(row)) ? p * L : p;
    },

    ourUnitPrice(row) {
        return this.ourUnitPriceOf(row && row._m && row._m.item, row);
    },

    /** Есть ли в разобранном документе цены вообще (в рукописном списке их нет). */
    hasDocPrices() {
        return (this._rows || []).some(r => this.docPrice(r) > 0);
    },

    renderCompareButton() {
        if (!this.hasDocPrices()) return '';
        return `<button class="rec-btn-g rec-btn-accent" onclick="RecognizeUI.renderCompare()"
                        title="Во сколько тот же объём выйдет на STOUT / ROMMER">⚖ Сравнить цены</button>`;
    },

    /**
     * Цены из документа для ненайденных позиций.
     *
     * Расходников — монтажной пены, отрезных кругов, газа для пистолета,
     * штоков к хомутам — в каталоге STOUT/ROMMER нет и не будет, поэтому в
     * смету они уезжали с нулём и монтажник вбивал цену руками. Между тем в
     * счёте она написана: своя, за этот месяц и этот регион. Подставляем её,
     * но только туда, где нашей цены нет.
     *
     * Переключатель показывается, лишь когда в документе вообще есть цены,
     * и по умолчанию включён: цифра из счёта всяко полезнее нуля.
     */
    docPricesOn() {
        return this._useDocPrices !== false;
    },

    renderDocPriceButton() {
        if (!this.hasDocPrices()) return '';
        const n = this._rows.filter(r => !r._m && this.docPrice(r) > 0).length;
        if (!n) return '';
        return `<label class="rec-switch${this.docPricesOn() ? ' on' : ''}"
                       title="Позициям, которых нет в каталоге, поставить цену из самого документа">
            <input type="checkbox" ${this.docPricesOn() ? 'checked' : ''}
                   onchange="RecognizeUI.toggleDocPrices(this.checked)">
            <span class="rec-switch-track"><span class="rec-switch-knob"></span></span>
            <span class="rec-switch-text">Цены из документа
              <em>${n} поз. без аналога</em></span>
          </label>`;
    },

    toggleDocPrices(on) {
        this._useDocPrices = !!on;
        this.renderReview();
    },

    renderCompare() {
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const money = n => Math.round(n || 0).toLocaleString('ru-RU') + ' ₽';

        // Бренд выбирается только для расчёта. Что уедет в смету, по-прежнему
        // решает тумблер «Аналог ROMMER» на экране проверки: сравнение — это
        // прикидка «а что если», и молча переписывать отобранное она не должна.
        const brand = this._cmpBrand === 'rommer' ? 'rommer' : 'stout';

        let docTotal = 0, stoutTotal = 0, rommerTotal = 0;
        let cmpN = 0, matched = 0, priced = 0, alarmed = 0;
        // Работы сравниваются не с прайсом, а с нашими расценками на монтаж.
        // Здесь они только считаются отдельной строкой итога, чтобы не выглядеть
        // как позиции, которым не нашлось аналога.
        let workN = 0, workSum = 0;
        const eqTotal = this._rows.filter(r => !this.looksLikeWork(r)).length;

        // Разделы документа — те же, что на экране проверки: сверяют здесь с
        // тем же листом бумаги, и ориентиры должны совпадать.
        const secState = { last: null };

        const rows = this._rows.map((r, n) => {
            const secHead = this.docSectionHead(r, 9, secState);

            const isWork = this.looksLikeWork(r);
            const m = isWork ? null : r._m;
            const qty = this.docQty(r);
            const dp = this.docPrice(r);
            const op = m ? this.ourUnitPriceOf(m.item, r) : 0;
            // Цена той же позиции на ROMMER. Аналога нет (или он дороже) —
            // остаётся исходная: смета «на ROMMER» всё равно наполовину STOUT.
            const ra = (m && typeof RecognizeMatch !== 'undefined' && RecognizeMatch.rommerAlt)
                ? RecognizeMatch.rommerAlt(m.item) : null;
            const rp = ra ? (this.ourUnitPriceOf(ra.item, r) || op) : op;
            const bp = brand === 'rommer' ? rp : op;
            const dSum = dp * qty;
            const bSum = bp * qty;
            if (isWork) { workN++; workSum += dSum; }
            if (m) matched++;
            if (dp > 0 && !isWork) priced++;
            if (r._priceAlarm) alarmed++;

            // В итоги идут только строки, где есть обе цены и количество —
            // и где цены сошлись по порядку величины. Строка с промахом
            // подбора (см. priceGuard) утянула бы итог на сотни процентов.
            const comparable = dp > 0 && op > 0 && qty > 0 && !r._priceAlarm;
            if (comparable) {
                docTotal += dSum;
                stoutTotal += op * qty;
                rommerTotal += rp * qty;
                cmpN++;
            }

            let diff = '<span class="rec-cmp-eq">—</span>';
            if (comparable) {
                const pct = ((bp - dp) / dp) * 100;
                diff = pct > 0 ? `<span class="rec-cmp-up">+${this.fmtPct(pct)}%</span>`
                    : pct < 0 ? `<span class="rec-cmp-down">${this.fmtPct(pct)}%</span>`
                        : `<span class="rec-cmp-eq">0%</span>`;
            } else if (r._priceAlarm) {
                diff = `<span class="rec-cmp-up" title="Не участвует в итогах">✕</span>`;
            }

            // Точка уверенности подбора — тот же score, что и в таблице проверки.
            const score = m ? (r._locked ? 1 : (m.score || 0)) : 0;
            const dotCls = score >= 0.9 ? 'high' : score >= 0.7 ? 'mid' : score > 0 ? 'low' : 'none';
            const ours = m
                ? `<span class="rec-cmp-dot ${dotCls}"></span>${esc(m.item.name)}${
                    brand === 'rommer' && ra ? ` <span class="rec-art">→ ${esc(ra.item.name)}</span>` : ''}
                   <div class="rec-art">${esc(m.item.article || m.item.id)}${
                    r._fromMem ? ' · по вашему прошлому выбору'
                        : (r._locked ? ' · выбрано вручную'
                            : (m.score < 1 ? ` · совпадение ${Math.round(m.score * 100)}%` : ''))}</div>${
                    r._priceAlarm ? `<div class="rec-pricebad-note">Цена не сходится ${
                        r._priceAlarm > 0 ? `в ${r._priceAlarm} раз` : `в ${-r._priceAlarm} раз`
                    } — подобрано другое изделие, в сравнение не идёт</div>` : ''}`
                : isWork
                    ? `<span class="rec-work-tag">монтажная работа</span>
                       <span class="rec-art">с прайсом не сравнивается</span>`
                    : `<span class="rec-art">аналог не подобран</span>`;

            return `${secHead}<tr${r._priceAlarm ? ' class="rec-pricebad"' : (isWork ? ' class="rec-workrow"' : '')}>
              <td>${r.docNo ? esc(r.docNo) : n + 1}</td>
              <td class="rec-raw">${esc(r.raw)}</td>
              <td>${qty || '—'} ${esc(r.unit || 'шт')}</td>
              <td>${dp > 0 ? money(dp) : '—'}</td>
              <td><b>${dp > 0 ? money(dSum) : '—'}</b></td>
              <td>${ours}</td>
              <td>${m ? money(bp) : '—'}</td>
              <td><b>${m ? money(bSum) : '—'}</b></td>
              <td>${diff}</td></tr>`;
        }).join('');

        const ourTotal = brand === 'rommer' ? rommerTotal : stoutTotal;
        const delta = ourTotal - docTotal;
        // До десятых: на итоге в полтора миллиона разница в семь тысяч — это
        // 0,4%, а округление до целых показывало «+7 006 ₽ (+0%)» и выглядело
        // опечаткой.
        const pct = docTotal > 0 ? (delta / docTotal) * 100 : 0;
        // Сравнили не всю смету — в подписи к итогам это должно быть видно
        // сразу, а не только в примечании под ними: цифра со звёздочкой,
        // прочитанная как итог целиком, — готовый спор с клиентом.
        const partial = cmpN < this._rows.length ? ' · сравнимые позиции' : '';

        /**
         * Скидка, при которой наша смета сравняется с чужой.
         *
         * Это и есть рабочий ответ монтажнику: не «мы дороже на 146%», а
         * «дай 59% — и мы вровень». Проценты считаются от НАШЕЙ суммы,
         * поэтому «дороже на 146%» и «скидка 59%» — одно и то же число,
         * пересчитанное в ту сторону, в какую его дают на переговорах.
         */
        const needDiscount = (total) => (!cmpN || !total || total <= docTotal)
            ? 0 : Math.round((1 - docTotal / total) * 100);

        const discountLine = (total) => {
            if (!cmpN || !total) return '';
            if (total <= docTotal) {
                const cheaper = docTotal > 0 ? Math.round((1 - total / docTotal) * 100) : 0;
                return `<div class="rec-cmp-note down">дешевле на ${cheaper}% без скидки</div>`;
            }
            return `<div class="rec-cmp-note">нужна скидка ${needDiscount(total)}%</div>`;
        };

        const brandTile = (key, label, total) => `
            <div class="rec-cmp-item${brand === key ? ' on' : ''}" onclick="RecognizeUI.cmpBrand('${key}')"
                 title="Пересчитать сравнение на ${label}">
              <div class="rec-cmp-val">${money(total)}</div>
              <div class="rec-cmp-lbl">Итого у нас · ${label}${partial}</div>
              <div class="rec-cmp-sub">цены прайса, без скидки</div>
              ${discountLine(total)}
            </div>`;

        /**
         * Скидка, с которой смета уедет в калькулятор.
         *
         * Наши суммы здесь — прайс: у монтажника своя скидка от дистрибьютора,
         * и без неё сравнение всегда выходит «мы дороже». Переключатель ставит
         * ту скидку, при которой сметы сравниваются, — дальше её можно править
         * ползунком скидки в самой смете.
         *
         * Скидка в калькуляторе одна на всю смету, не на распознанные строки:
         * при «Создать новую смету» это ровно то, что нужно, а при «Добавить
         * в текущую» она заденет и то, что уже было посчитано. Поэтому пишем
         * об этом прямо у переключателя.
         */
        const discPct = needDiscount(brand === 'rommer' ? rommerTotal : stoutTotal);
        this._cmpDiscount = discPct ? { brand, pct: discPct } : null;
        if (!discPct) this._cmpApplyDiscount = false;

        // Бренд сравнения и бренд переноса развязаны намеренно, но если они
        // разошлись, скидка посчитана не для той сметы, которая уедет.
        const moveBrand = this._analogOn ? 'rommer' : 'stout';
        const brandMismatch = discPct && this._cmpApplyDiscount && moveBrand !== brand;

        const discountStrip = !discPct ? '' : `
          <label class="rec-cmp-apply">
            <input type="checkbox" ${this._cmpApplyDiscount ? 'checked' : ''}
                   onchange="RecognizeUI.cmpApplyDiscount(this.checked)">
            <span>Применить скидку <b>${discPct}%</b> при переносе в смету</span>
            <span class="rec-art">скидка ставится на всю смету целиком, менять её потом можно ползунком в разделе «Оборудование»</span>
            ${brandMismatch ? `<span class="rec-cmp-warn">Сравнение считается на ${
              brand === 'rommer' ? 'ROMMER' : 'STOUT'}, а в смету уедет ${
              moveBrand === 'rommer' ? 'ROMMER' : 'STOUT'} — переключите тумблер «Аналог ROMMER» на экране проверки, иначе суммы не сойдутся</span>` : ''}
          </label>`;

        const deltaBlock = !cmpN ? '' : delta < 0
            ? `<div class="rec-cmp-item"><div class="rec-cmp-val down">${money(-delta)} (${this.fmtPct(-pct)}%)</div>
               <div class="rec-cmp-lbl">У нас дешевле · ${brand === 'rommer' ? 'ROMMER' : 'STOUT'}</div></div>`
            : delta > 0
                ? `<div class="rec-cmp-item"><div class="rec-cmp-val up">+${money(delta)} (+${this.fmtPct(pct)}%)</div>
                   <div class="rec-cmp-lbl">У нас дороже · ${brand === 'rommer' ? 'ROMMER' : 'STOUT'}</div></div>`
                : `<div class="rec-cmp-item"><div class="rec-cmp-val">0 ₽</div>
                   <div class="rec-cmp-lbl">Разницы нет</div></div>`;

        document.getElementById('rec_body').innerHTML = `
          <div class="rec-toolbar">
            <button class="rec-btn-g" onclick="RecognizeUI.renderReview()">← К таблице проверки</button>
            <button class="rec-btn-g" onclick="RecognizeUI.copyCompare()">📋 Скопировать</button>
            <span class="rec-cmp-switch">
              <button class="rec-btn-g${brand === 'stout' ? ' on' : ''}" onclick="RecognizeUI.cmpBrand('stout')">STOUT</button>
              <button class="rec-btn-g${brand === 'rommer' ? ' on' : ''}" onclick="RecognizeUI.cmpBrand('rommer')">ROMMER</button>
            </span>
            <span class="rec-status">Сравнимых позиций: ${cmpN} из ${eqTotal}${
              matched < eqTotal ? ` · без аналога ${eqTotal - matched}` : ''}${
              priced < eqTotal ? ` · без цены в документе ${eqTotal - priced}` : ''}${
              alarmed ? ` · цена не сходится ${alarmed}` : ''}${
              workN ? ` · монтажных работ ${workN} на ${money(workSum)} — считаются отдельно` : ''}</span>
          </div>
          <div class="rec-cmp-sum">
            <div class="rec-cmp-item">
              <div class="rec-cmp-val">${money(docTotal)}</div>
              <div class="rec-cmp-lbl">Итого по документу${partial}</div>
            </div>
            ${brandTile('stout', 'STOUT', stoutTotal)}
            ${brandTile('rommer', 'ROMMER', rommerTotal)}
            ${deltaBlock}
          </div>
          ${discountStrip}
          ${cmpN < eqTotal ? `<div class="rec-art" style="padding:0 0 10px;">
            Суммы посчитаны только по строкам, где известны обе цены и подбор не вызывает
            сомнений — иначе сравнение показывало бы экономию там, где позиция просто не
            подобрана${alarmed ? ', а один промах подбора двигал бы итог на сотни процентов' : ''}.
            Выбор бренда меняет только расчёт: в смету позиции уедут так, как отмечено
            на экране проверки.</div>` : ''}
          <div class="rec-tablewrap">
            <table class="rec-table rec-cmp-table">
              <colgroup><col style="width:34px"><col style="width:200px"><col style="width:74px">
                <col style="width:84px"><col style="width:92px">
                <col><col style="width:84px"><col style="width:92px"><col style="width:70px"></colgroup>
              <thead><tr>
                <th>#</th><th>Позиция из документа</th><th>Кол.</th>
                <th>Их цена</th><th>Их сумма</th>
                <th>Наш аналог</th><th>Наша цена</th><th>Наша сумма</th><th>Разница</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="rec-foot">
            <div class="rec-total">Разница: <b>${cmpN ? (delta < 0 ? '−' : delta > 0 ? '+' : '') + money(Math.abs(delta)) : '—'}</b></div>
            <button class="calc-dialog-btn calc-dialog-btn-cancel" onclick="RecognizeUI.apply('new')">Создать новую смету</button>
            <button class="calc-dialog-btn calc-dialog-btn-confirm" onclick="RecognizeUI.apply('add')">Добавить в текущую смету</button>
          </div>`;
    },

    /** Бренд, на который считается сравнение. Смету не трогает — только расчёт. */
    cmpBrand(brand) {
        this._cmpBrand = brand;
        this.renderCompare();
    },

    /** Переносить ли смету со скидкой, при которой она сравнялась с чужой. */
    cmpApplyDiscount(on) {
        this._cmpApplyDiscount = !!on;
        this.renderCompare();
    },

    /** Таблица сравнения в буфер обмена — вставить в письмо или мессенджер клиенту. */
    copyCompare() {
        const lines = [...document.querySelectorAll('.rec-cmp-table tr')].map(tr =>
            [...tr.querySelectorAll('th,td')].map(td =>
                td.innerText.replace(/\s+/g, ' ').trim()).join('\t'));
        const text = lines.join('\n');
        const done = () => app.alert('Таблица сравнения скопирована.');
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(done).catch(() => this._copyFallback(text, done));
        } else {
            this._copyFallback(text, done);
        }
    },

    _copyFallback(text, done) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* браузер не дал — не беда */ }
        document.body.removeChild(ta);
        done();
    },

    /**
     * Выбор системы трубопровода для всей сметы.
     *
     * Показывается, только когда в смете есть что переводить — трубы или
     * фитинги трубной системы. Латунная арматура, приборы и канализация
     * от выбора не зависят и остаются как есть.
     */
    renderSystemSelect() {
        if (typeof RecognizeMatch === 'undefined' || !RecognizeMatch.SYSTEMS) return '';
        const cur = (this._sys && this._sys.main) || null;
        if (!cur) return '';

        const labels = {
            ppr: 'Полипропилен',
            ss: 'Нержавейка',
            mp: 'Металлопластик (пресс)',
            pex: 'Сшитый полиэтилен (аксиал)',
        };
        const opts = Object.keys(labels).map(s =>
            `<option value="${s}" ${s === cur ? 'selected' : ''}>${labels[s]}</option>`).join('');

        return `<select class="rec-btn-g" title="Заменить систему целиком: диаметры пересчитаются по проходу, фитинги подберутся заново"
                        onchange="RecognizeUI.convertSystem(this.value)">${opts}</select>`;
    },

    /**
     * Кнопка дочитывания. Появляется только когда есть непрочитанные листы —
     * в обычной работе её не видно.
     */
    renderRetryButton() {
        const left = this._failedSheets || [];
        if (!left.length) return '';
        const nums = left.map(i => i + 1).join(', ');
        return `<button class="rec-btn-g rec-retry" ${this._busy ? 'disabled' : ''}
                        title="Прочитать только те листы, которые не удались — уже разобранное сохранится"
                        onclick="RecognizeUI.retryFailedSheets()">↻ Дочитать ${
            left.length > 1 ? 'листы' : 'лист'} ${nums}</button>`;
    },

    /**
     * Переключатель «Аналог ROMMER».
     *
     * Решение «собираем на ROMMER» принимают на смету целиком, а не по одной
     * строке, поэтому это один переключатель на всю таблицу. Считаем заранее,
     * сколько позиций имеют более дешёвый аналог и сколько это денег, — без
     * суммы кнопка ничего не говорит и нажимать её незачем.
     */
    analogStats() {
        if (typeof RecognizeMatch === 'undefined' || !RecognizeMatch.rommerAlt) return null;
        let n = 0, save = 0, base = 0;
        for (const r of this._rows) {
            const m = r._m;
            if (!m || !m.item) continue;
            // При включённом режиме считаем от исходной позиции, а не от аналога.
            const src = (r._analogBase && r._analogBase.item) || m.item;
            const alt = RecognizeMatch.rommerAlt(src);
            if (!alt) continue;
            const qty = (Number(r.qty) || 0) + (Number(r.qtyExtra) || 0);
            n++;
            save += alt.save * qty;
            base += (src.price || 0) * qty;
        }
        return n ? { n, save, base } : null;
    },

    renderAnalogButton() {
        const st = this.analogStats();
        if (!st && !this._analogOn) return '';

        // Процент считаем от суммы тех позиций, у которых аналог есть, — иначе
        // цифра размывается стоимостью всего остального и ничего не значит.
        const save = this._analogOn ? (this._analogSaved || 0) : (st ? st.save : 0);
        const base = this._analogOn ? (this._analogBase0 || 0) : (st ? st.base : 0);
        const pct = base > 0 ? Math.round(save / base * 100) : 0;
        const n = this._analogOn ? (this._analogCount || 0) : st.n;

        return `<label class="rec-switch${this._analogOn ? ' on' : ''}"
                       title="Заменить позиции на аналоги ROMMER там, где они дешевле">
            <input type="checkbox" ${this._analogOn ? 'checked' : ''}
                   onchange="RecognizeUI.toggleAnalog()">
            <span class="rec-switch-track"><span class="rec-switch-knob"></span></span>
            <span class="rec-switch-text">Аналог ROMMER
              <b>−${pct}%</b> · ${Math.round(save).toLocaleString('ru-RU')} ₽
              <em>${n} поз.</em></span>
          </label>`;
    },

    /** Переключение всей сметы на аналоги ROMMER и обратно. */
    toggleAnalog() {
        this.snap();
        if (this._analogOn) {
            for (const r of this._rows) {
                if (!r._analogBase) continue;
                r._m = r._analogBase;
                delete r._analogBase;
            }
            this._analogOn = false;
            this._analogSaved = 0;
            this._analogBase0 = 0;
            this._analogCount = 0;
        } else {
            const st = this.analogStats();
            this._analogBase0 = st ? st.base : 0;
            this._analogCount = st ? st.n : 0;
            let saved = 0;
            for (const r of this._rows) {
                const m = r._m;
                if (!m || !m.item || r._locked) continue;
                const alt = RecognizeMatch.rommerAlt(m.item);
                if (!alt) continue;
                r._analogBase = m;
                saved += alt.save * ((Number(r.qty) || 0) + (Number(r.qtyExtra) || 0));
                r._m = {
                    ...m,
                    item: alt.item,
                    substituted: `аналог ROMMER вместо «${m.item.name}» — дешевле на ${alt.percent}%`,
                    needsApproval: true,
                };
            }
            this._analogOn = true;
            this._analogSaved = saved;
        }
        this.renderReview();
    },

    /**
     * Строка итога: что сделано и сколько это стоило бы руками.
     *
     * Оценка честная и по нижней границе: сорок секунд на позицию — это найти
     * её в прайсе, перенести артикул, цену и количество. Считаем только по
     * подобранным строкам: то, что ушло без артикула, монтажник всё равно
     * заполняет сам, и приписывать эту экономию себе нечестно.
     */
    renderSavedTime(found) {
        if (!found) return '';
        const min = Math.round(found * 40 / 60);
        if (min < 3) return '';
        const time = this.handTime(min);
        const secs = Math.round((this._elapsed || 0) / 1000);
        return `<div class="rec-saved">
            <b>${found}</b> ${this.plural(found, 'позиция', 'позиции', 'позиций')} перенесено в смету
            ${secs ? `за ${secs} с` : ''} — вручную это заняло бы около <b>${time}</b>
          </div>`;
    },

    /**
     * Время ручной работы словами.
     *
     * Полторы сотни минут человек в уме не переводит, а «~135 мин» именно так
     * и выглядело в счётчике во время разбора: в итоговой плашке часы были, а
     * здесь нет. Считаем в одном месте — расходиться этим двум надписям не с
     * чего, обе про одно и то же.
     */
    handTime(min) {
        if (min < 60) return `${min} мин`;
        const h = Math.floor(min / 60), m = min % 60;
        return m ? `${h} ч ${m} мин` : `${h} ч`;
    },

    /** Русское склонение после числа. */
    plural(n, one, few, many) {
        const a = Math.abs(n) % 100, b = a % 10;
        if (a > 10 && a < 20) return many;
        if (b > 1 && b < 5) return few;
        if (b === 1) return one;
        return many;
    },

    /**
     * Разбор неподобранных строк.
     *
     * Показывается только когда такие строки есть. Смысл блока — отделить
     * предел прайса от недоработки подбора: «этого нет у поставщика» и
     * «похожее есть, но совпадение слабое» требуют разных действий.
     */
    renderMissAnalysis() {
        const a = this.missAnalysis();
        if (!a) return '';
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

        const line = (g) => g.map(({ row, info }) => {
            const near = info && info.item
                ? `<span class="rec-art">ближайшее: ${esc(info.item.name.slice(0, 60))} · ${
                    Math.round((info.rel || 0) * 100)}%</span>`
                : '';
            return `<li>${esc(row.raw || '')}${near ? '<br>' + near : ''}</li>`;
        }).join('');

        const blocks = [];
        if (a.groups.noHave.length) {
            blocks.push(`<div class="rec-miss-b"><b>У нас такого нет (${a.groups.noHave.length})</b>
              <div class="rec-art">подходящее по названию и размеру есть только в другом материале —
                подставлять его нельзя, это другое изделие. Искать вручную нечего:
                поставьте свою цену или уберите строку</div>
              <ul>${line(a.groups.noHave)}</ul></div>`);
        }
        if (a.groups.notInBase.length) {
            blocks.push(`<div class="rec-miss-b"><b>Нет у поставщика (${a.groups.notInBase.length})</b>
              <div class="rec-art">этих предметов нет ни в каталоге, ни в прайсе — расходники и чужой крепёж</div>
              <ul>${line(a.groups.notInBase)}</ul></div>`);
        }
        if (a.groups.weak.length) {
            blocks.push(`<div class="rec-miss-b"><b>Совпадение слишком слабое (${a.groups.weak.length})</b>
              <div class="rec-art">похожее в базе есть, но подставлять его наугад нельзя — выберите вручную через 🔍</div>
              <ul>${line(a.groups.weak)}</ul></div>`);
        }
        const rest = a.groups.noWords.concat(a.groups.noType);
        if (rest.length) {
            blocks.push(`<div class="rec-miss-b"><b>Строка не разобрана (${rest.length})</b>
              <div class="rec-art">не удалось выделить ни предмет, ни размеры</div>
              <ul>${line(rest)}</ul></div>`);
        }
        if (!blocks.length) return '';

        return `<details class="rec-miss">
            <summary>Почему не подобрано: ${a.total} ${
              this.plural(a.total, 'строка', 'строки', 'строк')}</summary>
            ${blocks.join('')}
          </details>`;
    },

    /**
     * Блок «возможно, не хватает».
     *
     * Показывается только когда есть что предложить. Каждая строка несёт
     * причину и цену, а предположения помечены отдельно — монтажник должен
     * видеть, где расчёт точный, а где прикидка.
     */
    renderSuggestions() {
        const list = this._sugg || [];
        if (!list.length) return '';
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

        const rows = list.map((s, i) => {
            const m = s.match;
            const sum = m ? Math.round(m.item.price * (s.row.qty || 0)) : 0;
            return `
              <div class="rec-sugg">
                <div class="rec-sugg-main">
                  <div><b>${s.row.qty} × ${esc(m ? m.item.name : s.row.type)}</b>
                    ${m ? `<span class="rec-art">${m.item.price} ₽ · итого ${sum} ₽</span>`
                        : '<span class="rec-art">нет в каталоге</span>'}</div>
                  <div class="rec-art">${esc(s.reason)} — ${esc(s.note)}</div>
                </div>
                ${s.sure ? '' : '<span class="rec-sugg-guess">прикидка</span>'}
                <button class="rec-btn-g" onclick="RecognizeUI.addSuggestion(${i})">Добавить</button>
              </div>`;
        }).join('');

        return `<div class="rec-suggblock">
            <div class="rec-sugg-h">Возможно, не хватает</div>
            ${rows}
          </div>`;
    },

    // ------------------------------------------------------------------
    // Поиск по каталогу для строки
    // ------------------------------------------------------------------

    /**
     * Пул для ручного поиска: каталог плюс прайс-лист.
     *
     * Автоподбор по прайсу намеренно строгий — на текстовом поиске он
     * ошибался в ценах в разы. Зато здесь, где выбирает человек, широта
     * поиска только помогает: видно всё, а решение принимает монтажник.
     */
    catIndex() {
        if (this._catIndex) return this._catIndex;
        this._catIndex = [];

        /**
         * Одна и та же позиция лежит и в каталоге, и в общем прайсе — 247
         * штук на семнадцать тысяч. Пока выдача шла в порядке каталога, дубли
         * стояли врозь и в глаза не бросались; после сортировки по
         * релевантности они встали рядом, и список стал выглядеть сломанным.
         *
         * Сливаем ТОЛЬКО полные совпадения — то же название и та же цена до
         * рубля. По артикулу сливать нельзя: под одним артикулом в каталоге и
         * в прайсе попадаются разные изделия, и такое слияние прятало бы одно
         * из них. Первым в индекс идёт каталог, поэтому побеждает он: у его
         * позиций есть единица измерения, фото и аналоги ROMMER.
         */
        const seen = new Set();
        const key = it => String(it.name).trim().toLowerCase() + '|' + Math.round(Number(it.price) || 0);
        const add = (it) => {
            const k = key(it);
            if (seen.has(k)) return;
            seen.add(k);
            this._catIndex.push(it);
        };

        if (typeof catalog !== 'undefined') {
            for (const k in catalog) {
                const v = catalog[k];
                if (Array.isArray(v)) {
                    for (const it of v) if (it && it.name && it.price != null) add(it);
                } else if (v && v.name && v.price != null) add(v);
            }
        }
        for (const p of (this._priceItems || [])) {
            if (!p || !p.n) continue;
            add({
                id: p.a, article: p.a, name: p.n, price: p.p,
                brand: p.s, _fromPrice: true,
            });
        }
        return this._catIndex;
    },

    // ------------------------------------------------------------------
    // Память ручных замен
    //
    // Когда монтажник подбирает позицию руками через 🔍, он сообщает то, чего
    // калькулятор знать не может: как ИМЕННО этот поставщик называет ИМЕННО
    // этот товар. Раньше это знание жило до конца разбора и пропадало — та же
    // строка в следующем счёте снова уходила в «нет в каталоге», и её снова
    // искали руками. Теперь выбор запоминается и подставляется сам.
    //
    // Ключей два, и порядок между ними важен:
    //   по написанию строки — точное свидетельство: ровно эту формулировку
    //     человек уже разбирал, спорить не с чем;
    //   по признакам (система, тип, диаметр, резьба) — обобщение: «аксиальный
    //     угол 16х1/2 ВР» человек однажды свёл к нашему артикулу, и в другой
    //     смете, где та же деталь названа иначе, подставится он же.
    //
    // Хранится у монтажника в браузере и под его логином: замены — вещь
    // личная, у другого поставщика те же слова значат другое.
    // ------------------------------------------------------------------

    MEM_KEY: 'rec_memory_v1',
    MEM_MAX: 400,

    memStoreKey() { return this.MEM_KEY + ':' + this.userKey(); },

    memStore() {
        // Авторизация доезжает уже после первой отрисовки, и логин может
        // смениться под тем же открытым калькулятором. Держим прочитанное
        // вместе с ключом, под которым оно прочитано, — иначе чужие замены
        // попали бы в чужую смету.
        const key = this.memStoreKey();
        if (this._mem && this._memKey === key) return this._mem;
        let data = null;
        try { data = JSON.parse(localStorage.getItem(key) || 'null'); }
        catch (e) { data = null; }
        this._mem = (data && data.byRaw && data.bySig) ? data : { byRaw: {}, bySig: {} };
        this._memKey = key;
        return this._mem;
    },

    memSave() {
        const mem = this.memStore();
        // Вытесняем самые давние: хранилище браузера не резиновое, а замена,
        // к которой не возвращались полгода, скорее всего и не понадобится.
        for (const bag of [mem.byRaw, mem.bySig]) {
            const keys = Object.keys(bag);
            if (keys.length <= this.MEM_MAX) continue;
            keys.sort((a, b) => (bag[a].at || 0) - (bag[b].at || 0))
                .slice(0, keys.length - this.MEM_MAX)
                .forEach(k => delete bag[k]);
        }
        try { localStorage.setItem(this.memStoreKey(), JSON.stringify(mem)); }
        catch (e) { console.warn('Замены не сохранены:', e.message); }
    },

    /**
     * Количество в конце строки — не часть названия.
     *
     * «Кран шаровой 1/2 - 2шт» и «Кран шаровой 1/2 - 5шт» это одна и та же
     * позиция, и запоминать их порознь значит не запомнить ничего.
     */
    MEM_QTY_RE: /[-–—]?\s*\d+(?:[.,]\d+)?\s*(?:шт|штук\w*|компл\w*|точ\w*|пар\w*|м2|м\.?п\.?|мп|м)\.?\s*$/i,

    memKeyRaw(row) {
        const s = String((row && row.raw) || '').toLowerCase().replace(/ё/g, 'е')
            .replace(this.MEM_QTY_RE, ' ')
            .replace(/[^a-zа-я0-9/.]+/g, ' ')
            .replace(/\s+/g, ' ').trim();
        // Слишком короткий остаток («ф32», «—») ничего не опознаёт, а
        // совпадёт со многим.
        return s.length >= 4 ? s : '';
    },

    memKeySig(row) {
        if (!row || !row.type || String(row.type).toLowerCase() === 'прочее') return '';
        const sys = (this._sys && this._sys.main) || '';
        return [sys, String(row.type).toLowerCase(), row.d || '', row.thread || '',
            row.threadType || '', row.angle || '',
            Array.isArray(row.dims) ? row.dims.join('x') : ''].join('|');
    },

    /** Запомнить выбор человека. Вызывается там, где он его сделал. */
    memRemember(row, item) {
        if (!row || !item || item.id == null) return;
        // Работы подбираются по прайсу монтажа, а не по каталогу товаров:
        // артикулу там взяться неоткуда, и запоминать нечего.
        if (this.looksLikeWork(row)) return;

        const mem = this.memStore();
        const rec = {
            id: String(item.id),
            article: String(item.article || item.id),
            name: item.name, price: item.price, brand: item.brand || '',
            raw: String(row.raw || '').slice(0, 120), at: Date.now(),
        };
        const kr = this.memKeyRaw(row);
        if (kr) mem.byRaw[kr] = rec;
        const ks = this.memKeySig(row);
        if (ks) mem.bySig[ks] = rec;
        this.memSave();
    },

    memForgetRow(row) {
        const mem = this.memStore();
        const kr = this.memKeyRaw(row), ks = this.memKeySig(row);
        // Снимаем оба ключа: оставить один значит вернуть ту же замену
        // следующим же пересчётом.
        if (kr) delete mem.byRaw[kr];
        if (ks) delete mem.bySig[ks];
        this.memSave();
    },

    memCount() { return Object.keys(this.memStore().byRaw).length; },

    memClear() {
        this._memKey = this.memStoreKey();
        this._mem = { byRaw: {}, bySig: {} };
        try { localStorage.removeItem(this._memKey); } catch (e) { /* и так сойдёт */ }
    },

    /**
     * Позиция каталога по сохранённому артикулу.
     *
     * Храним артикул, а не саму позицию: цена меняется каждый месяц, и
     * подставлять прошлогоднюю нельзя. Позиции в каталоге уже нет — берём
     * сохранённый снимок, чтобы смета уехала с тем, что человек выбрал, а не
     * с пустой строкой.
     */
    memResolve(rec) {
        if (!rec || rec.id == null) return null;
        if (!this._catById) {
            this._catById = new Map();
            for (const it of this.catIndex()) {
                const id = it.id != null ? String(it.id) : '';
                if (id && !this._catById.has(id)) this._catById.set(id, it);
                const a = it.article != null ? String(it.article) : '';
                if (a && !this._catById.has(a)) this._catById.set(a, it);
            }
        }
        return this._catById.get(String(rec.id))
            || this._catById.get(String(rec.article || ''))
            || { id: rec.id, article: rec.article, name: rec.name, price: rec.price, brand: rec.brand };
    },

    memLookup(row) {
        const mem = this.memStore();
        const kr = this.memKeyRaw(row);
        let rec = kr ? mem.byRaw[kr] : null;
        if (!rec) {
            const ks = this.memKeySig(row);
            rec = ks ? mem.bySig[ks] : null;
        }
        return rec ? this.memResolve(rec) : null;
    },

    /** Подстановка запомненного вместо автоподбора. true — подставили. */
    memApply(row) {
        if (!row || row._noMem || this.looksLikeWork(row)) return false;
        const it = this.memLookup(row);
        if (!it) return false;

        row._m = { item: it, score: 1, alternatives: [] };
        row._locked = true;          // выбор человека автоподбор не перебивает
        row._fromMem = true;
        delete row._priceFixed;
        delete row._priceAlarm;

        // Предохранитель по цене оставляем и здесь, но только как отметку:
        // подменять выбор человека нельзя, а вот показать расхождение в разы
        // стоит — замена могла быть запомнена по ошибке.
        const dp = this.docPrice(row), op = this.ourUnitPriceOf(it, row);
        if (dp && op && (op > dp * this.PRICE_GUARD_RATIO || op * this.PRICE_GUARD_RATIO < dp)) {
            row._priceAlarm = op > dp ? Math.round(op / dp) : -Math.round(dp / op);
        }
        return true;
    },

    /** «Забыть» у строки: снимаем замену и возвращаем строку автоподбору. */
    memForget(i) {
        const r = this._rows[i];
        if (!r) return;
        this.snap();
        this.memForgetRow(r);
        r._locked = false;
        delete r._fromMem;
        this.rematch(r);
        this.renderReview();
    },

    renderMemoryButton() {
        const n = this.memCount();
        if (!n) return '';
        return `<button class="rec-btn-g" onclick="RecognizeUI.memAsk()"
                        title="Артикулы, выбранные вами вручную на прошлых сметах. В новых подставляются сразу, без подбора.">🧠 Мои замены: ${n}</button>`;
    },

    async memAsk() {
        const n = this.memCount();
        if (!n) return;
        const ok = await app.confirm(
            `Запомнено ваших замен: ${n}. В новых сметах они подставляются вместо автоподбора.\n\n` +
            'Очистить список целиком? Вернуть его будет нельзя.');
        if (!ok) return;
        this.memClear();
        this._rows.forEach(r => {
            if (!r._fromMem) return;
            delete r._fromMem;
            r._locked = false;
            this.rematch(r);
        });
        this.renderReview();
    },

    // ------------------------------------------------------------------
    // Запасные варианты подбора
    //
    // Подбор всегда считает не один артикул, а несколько, и хранит соседей в
    // m.alternatives. До сих пор они не показывались нигде: увидеть второй по
    // совпадению вариант можно было только открыв поиск и набрав запрос
    // заново — то есть проделав руками работу, которая уже сделана.
    // ------------------------------------------------------------------

    /** Запасные варианты строки: те, что подбор счёл близкими, но не лучшими. */
    altsOf(row) {
        const m = row && row._m;
        if (!m || !m.item) return [];
        return (m.alternatives || []).filter(a => a && a.name && a !== m.item);
    },

    renderAlts(r, n) {
        const alts = this.altsOf(r);
        if (!alts.length) return '';
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

        if (!r._altsOpen) {
            return `<div class="rec-art"><a href="#" class="rec-altlink"
                onclick="RecognizeUI.toggleAlts(${n});return false;">ещё ${alts.length} ${
                this.plural(alts.length, 'вариант', 'варианта', 'вариантов')} подбора</a></div>`;
        }

        return `<div class="rec-alts">
            ${alts.map((a, k) => `<div class="rec-alt"
                onclick="RecognizeUI.pickAlt(${n},${k})">
                <span>${esc(a.name)}</span><b>${Math.round(Number(a.price) || 0)} ₽</b>
              </div>`).join('')}
            <a href="#" class="rec-altlink"
               onclick="RecognizeUI.toggleAlts(${n});return false;">свернуть</a>
          </div>`;
    },

    toggleAlts(n) {
        const r = this._rows[n];
        if (!r) return;
        r._altsOpen = !r._altsOpen;
        this.renderReview();
    },

    /**
     * Выбор запасного варианта.
     *
     * Это такое же решение человека, как выбор через поиск, поэтому и
     * последствия те же: строка помечается «выбрано вручную», автоподбор её
     * больше не трогает, а сам выбор запоминается на будущие сметы.
     */
    pickAlt(n, k) {
        const r = this._rows[n];
        const alts = this.altsOf(r);
        const picked = alts[k];
        if (!picked) return;

        this.snap();
        // Прежний подбор не выбрасываем, а меняем местами с выбранным: если
        // монтажник передумает, вернуться будет тем же списком.
        const was = r._m.item;
        r._m = {
            ...r._m,
            item: picked,
            score: 1,
            alternatives: [was].concat(alts.filter(a => a !== picked)),
        };
        r._locked = true;
        r._altsOpen = false;
        delete r._fromMem;
        delete r._noMem;
        delete r._priceAlarm;
        delete r._priceFixed;
        this.memRemember(r, picked);
        this.renderReview();
    },

    /**
     * Насколько позиция каталога отвечает запросу.
     *
     * Раньше выдача шла в порядке каталога и обрезалась на пятидесяти: по
     * запросу «труба» первой показывалась та, что просто лежит раньше, а
     * нужная могла не попасть в список вовсе. Считаем три вещи, и все три
     * объяснимы вслух:
     *
     *   ГДЕ стоит слово. В начале названия — это про предмет («Кран шаровой
     *     1/2»), в начале другого слова — уточнение, внутри слова — скорее
     *     совпадение по случайности («кран» внутри «крановый узел»).
     *   ДЛИНА названия. Из двух подходящих ближе к запросу то, в котором
     *     меньше лишнего.
     *   ЦЕНА документа, если она есть. Не говорит, что это за предмет, но
     *     убирает наверх то, что стоит столько же. Именно на этом ломался
     *     автоподбор: «Сервопривод за 682 ₽» уходил в привод за 32 929 ₽.
     */
    SEARCH_WORD_EDGE: /[\s(,.\-/х×]/,

    searchScore(item, words, docP) {
        const name = String(item.name || '').toLowerCase().replace(/ё/g, 'е');
        let s = 0;

        for (const w of words) {
            const at = name.indexOf(w);
            if (at < 0) return -100;                                  // сюда не попадаем: отфильтровано
            if (at === 0) s += 3;                                     // с начала названия
            else if (this.SEARCH_WORD_EDGE.test(name[at - 1])) s += 2; // с начала слова
            else s += 1;                                              // внутри слова
        }

        // Короткое название ближе к запросу. Делитель подобран так, чтобы
        // длина спорила с одним «словом внутри слова», но не перебивала
        // совпадение с начала.
        s += Math.max(0, 2 - name.length / 40);

        if (docP > 0 && Number(item.price) > 0) {
            const k = Math.max(docP, item.price) / Math.min(docP, item.price);
            if (k <= 1.5) s += 3;
            else if (k <= 3) s += 1.5;
            else if (k > 10) s -= 2;   // разница на порядок — это другой предмет
        }
        return s;
    },

    /**
     * Подбор по каталогу для одной строки.
     *
     * Если в смете есть точно такие же строки, подбор предложит применить
     * выбор сразу ко всем: одинаковые фитинги пишут списком, и переподбирать
     * каждый по отдельности — работа на пустом месте.
     */
    search(i) {
        const row = this._rows[i];
        if (!row) return;
        const twins = this.twinsOf(i);
        this.openSearch([i].concat(twins), { lead: i, twins: twins.length });
    },

    /** Подбор сразу для всех отмеченных строк. */
    searchSelected() {
        const idx = this._rows.map((r, n) => (r && r._sel) ? n : -1).filter(n => n >= 0);
        if (!idx.length) return;
        this.openSearch(idx, { lead: idx[0], selected: idx.length });
    },

    /**
     * Строки с тем же наименованием, что у данной.
     *
     * Сравниваем по ключу памяти замен: он уже умеет отбрасывать количество,
     * а «Уголок 20 - 2шт» и «Уголок 20 - 5 шт» — это одна и та же позиция,
     * написанная дважды.
     */
    twinsOf(i) {
        const row = this._rows[i];
        const key = row ? this.memKeyRaw(row) : '';
        if (!key) return [];
        return this._rows.map((r, n) => (n !== i && this.memKeyRaw(r) === key) ? n : -1)
            .filter(n => n >= 0);
    },

    openSearch(indexes, opt) {
        opt = opt || {};
        const row = this._rows[opt.lead != null ? opt.lead : indexes[0]];
        if (!row) return;
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        // Тип строки записан служебным словом калькулятора — «кран_шаровой»,
        // «муфта_комбинированная». В названиях каталога подчёркиваний нет, и
        // поиск по такому слову не находил ничего: монтажник открывал подбор и
        // упирался в пустой экран ровно в тот момент, когда автоподбор уже не
        // справился.
        const guess = [row.type, row.d, row.thread].filter(Boolean).join(' ')
            .replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

        const ov = document.createElement('div');
        ov.className = 'calc-dialog-overlay rec-search-ov active';
        ov.innerHTML = `
          <div class="calc-dialog-card rec-search-card">
            <div class="rec-title" style="font-size:15px">Подбор по каталогу
              <span class="rec-art">${opt.selected
                ? `выбранное применится к ${opt.selected} ${
                    this.plural(opt.selected, 'отмеченной строке', 'отмеченным строкам', 'отмеченным строкам')}`
                : esc(row.raw)}</span></div>
            <input class="calc-dialog-input" id="rec_q" value="${esc(guess)}"
                   placeholder="Название или часть названия">
            ${opt.twins ? `<label class="rec-search-all">
                <input type="checkbox" id="rec_twins" checked>
                <span>Применить ко всем таким же — ещё ${opt.twins} ${
                    this.plural(opt.twins, 'строка', 'строки', 'строк')} с тем же наименованием</span>
              </label>` : ''}
            <div id="rec_res" class="rec-res"></div>
            <div class="rec-foot" style="border:0;padding-top:6px">
              <button class="calc-dialog-btn calc-dialog-btn-cancel" id="rec_cx">Отмена</button>
            </div>
          </div>`;
        document.body.appendChild(ov);

        const q = ov.querySelector('#rec_q');
        const res = ov.querySelector('#rec_res');
        let found = 0;   // сколько нашлось последним прогоном
        const close = () => ov.remove();
        ov.querySelector('#rec_cx').onclick = close;
        ov.onclick = e => { if (e.target === ov) close(); };

        // Ё и Е в каталоге не различаются: у нас «Разъёмное соединение», в
        // прайсе «Разъемное». Для поиска это одна буква — иначе половина
        // запросов не находит ничего по причине, которую не видно глазом.
        const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е');

        // Цена документа — подсказка о том, ЧТО за предмет ищут. Слова
        // названия говорят, как он называется, а цена отсекает то, чем он
        // быть не может: коллекторную группу за 16 000 не спутать с
        // коллектором за 1 200, хотя слова совпадают.
        const docP = this.docPrice(row);

        const run = () => {
            const w = norm(q.value).split(/\s+/).filter(Boolean);
            const hits = this.catIndex()
                .filter(it => w.every(x => norm(it.name).includes(x)))
                .map(it => ({ it, s: this.searchScore(it, w, docP) }))
                .sort((a, b) => b.s - a.s)
                .slice(0, 50)
                .map(x => x.it);
            found = hits.length;
            res.innerHTML = hits.length
                ? hits.map((it, n) => `<div class="rec-hit" data-i="${n}">
                     <span>${esc(it.name)}${it._fromPrice
                       ? ` <span class="rec-art">· из прайса, ${esc(it.brand)}</span>` : ''}</span>
                     <b>${it.price} ₽</b></div>`).join('')
                : '<div class="rec-art" style="padding:10px">Ничего не найдено</div>';
            res.querySelectorAll('.rec-hit').forEach(el => {
                el.onclick = () => {
                    this.snap();
                    const picked = hits[+el.dataset.i];

                    // Галочка «ко всем таким же» снята — правим только ту
                    // строку, из которой подбор открыли.
                    const twinBox = ov.querySelector('#rec_twins');
                    const targets = (opt.selected || !twinBox || twinBox.checked)
                        ? indexes : [indexes[0]];

                    for (const n of targets) {
                        const r = this._rows[n];
                        if (!r) continue;
                        r._m = { item: picked, score: 1, alternatives: [] };
                        r._locked = true;
                        // Выбор сделан только что — в таблице он «выбран
                        // вручную», а «по прошлому выбору» станет со следующей
                        // сметы.
                        delete r._fromMem;
                        // Строку разбирали руками: поле _noMem поставила правка
                        // типа или диаметра, и держать его дальше нельзя —
                        // иначе сделанный сейчас выбор в следующий раз не
                        // подставится.
                        delete r._noMem;
                        delete r._priceAlarm;
                        delete r._priceFixed;
                        // Запоминаем каждую строку отдельно: наименования у них
                        // разные, а решение человек принял про каждое.
                        this.memRemember(r, picked);
                    }
                    close();
                    this.renderReview();
                };
            });
        };
        q.oninput = run;

        /**
         * Первый показ: сужаем запрос, пока что-нибудь не найдётся.
         *
         * Подставленный запрос собран из полей строки, а они пишутся не так,
         * как названия в каталоге: «труба ppr ст» против «Труба PP-R DUO».
         * Достаточно одного лишнего слова, чтобы совпадений не осталось
         * вовсе. Отбрасываем по слову с конца — лишние уточнения стоят
         * справа, предмет слева, поэтому первым уходит наименее важное.
         *
         * Работает только при открытии. Когда монтажник печатает сам,
         * «ничего не найдено» — честный ответ, и подменять его выдачей по
         * половине запроса значит врать.
         */
        const words = q.value.split(' ').filter(Boolean);
        run();
        while (!found && words.length > 1) {
            words.pop();
            q.value = words.join(' ');
            run();
        }

        setTimeout(() => q.focus(), 30);
    },

    // ------------------------------------------------------------------
    // Шаг 3 — перенос в смету
    // ------------------------------------------------------------------

    async apply(mode) {
        // Предупреждаем о замене только если есть что заменять: на пустой смете
        // (0 ₽, ничего не добавлено) вопрос бессмыслен.
        const hasExisting = (app.state.userAddedEq && app.state.userAddedEq.length) ||
            (app.state.userAddedWorks && app.state.userAddedWorks.length) ||
            (app.state.area > 0);
        if (mode === 'new' && hasExisting) {
            const ok = await app.confirm(
                'Текущая смета будет заменена на распознанное. Продолжить?');
            if (!ok) return;
        }
        this.step(3);

        // Архивируем до сброса состояния и до render(): нужны и строки, и
        // оригинал файла. Ошибка архива не должна ломать применение сметы,
        // поэтому она проглатывается внутри archive().
        this.archive(mode);

        // Скидка, отмеченная на экране сравнения. Ставим ДО applyRecognized:
        // он вызывает render(), а скидка применяется именно там, в addToBill.
        let discountNote = '';
        if (this._cmpApplyDiscount && this._cmpDiscount) {
            const pct = this._cmpDiscount.pct;
            app.state.eqDiscountMode = 'discount';
            app.state.eqDiscount = pct;
            discountNote = `\n\nПрименена скидка ${pct}% — та, при которой смета сравнялась с чужой. ` +
                `Изменить её можно ползунком скидки в разделе «Оборудование».`;
            this._cmpApplyDiscount = false;
        }

        // Разметку работ считаем и здесь: во вкладку монтажник мог не заходить,
        // а без неё две строки вместо одной точки уехали бы в смету, и нашей
        // расценкой умножился бы объём в чужих единицах.
        const docWorks = this._rows.filter(x => this.looksLikeWork(x));
        this.prepareWorks(docWorks);

        // Работы, выведенные из состава оборудования. Считаем их и здесь: во
        // вкладку монтажник мог не заходить, а по накладной на материалы это
        // единственный источник монтажа — без них смета уедет с одним
        // оборудованием и нулём работ.
        const addWorks = this.missingWorksOn(docWorks).map(m => ({
            name: m.work.name, q: m.qty, price: Math.round(m.work.price),
            unit: m.work.unit, group: m.work.group, why: m.why,
        }));

        const r = app.applyRecognized(this._rows, mode, {
            docPrices: this.docPricesOn(),
            ourWorkPrices: this.ourWorkPricesOn(),
            addWorks,
        });

        // Смета перенесена — черновику здесь больше делать нечего: предлагать
        // «продолжить разбор» того, что уже уехало в смету, значит звать
        // сделать работу дважды.
        this.dropDraft();

        // Сбрасываем состояние: вкладка должна открыться чистой в следующий раз.
        this._img = null;
        this._imgs = null;
        this._text = '';
        this._docs = [];
        this._rows = [];
        this._undo = [];
        this._skipped = [];
        this._missOff = {};
        const panel = document.getElementById('panel_recognize');
        if (panel) panel.innerHTML = '';

        this.close();

        const parts = [`Добавлено позиций: ${r.eq}`];
        if (r.works) parts.push(`работ: ${r.works}`);
        if (r.hintWorks) parts.push(`из них по составу оборудования: ${r.hintWorks}`);
        if (r.docPriced) parts.push(`с ценой из документа: ${r.docPriced}`);
        if (r.noPrice) parts.push(`из них без цены: ${r.noPrice}`);
        if (r.skippedNoQty) parts.push(`пропущено без количества: ${r.skippedNoQty}`);

        app.alert(parts.join('\n') +
            '\n\nДобавленные строки подсвечены в смете. Отменить целиком — кнопка «Отменить распознавание» под сметой.' +
            discountNote);
    },

    /**
     * Сохранение сметы в архив на Beget для последующей проверки.
     *
     * Складывает оригинал + распознанный результат в папку с датой. Работает
     * «в фоне»: не ждём ответа и глушим любую ошибку — архив не должен мешать
     * монтажнику применить смету.
     *
     * Для фото архивируем сжатую версию (именно её и распознавали, ~300 КБ),
     * для документов — оригинал файла как есть.
     */
    async archive(mode) {
        try {
            // Регион и дистрибьютор лежат в строке доступа, а не в смете.
            // Без них архив нельзя разрезать по регионам: видно, кто прислал,
            // но не видно, откуда он.
            const urow = (typeof app.accessUserRow === 'function')
                ? (app.accessUserRow() || {}) : (app._currentUserRow || {});

            const payload = {
                user: this.userKey(),
                region: urow.region || '',
                distributorId: urow.distributor_id || (app.state && app.state.distributorId) || '',
                source: this._fileKind || (this._img ? 'image' : 'text'),
                fileName: this._fileName || '',
                mode: mode,
                // По этим полям админка строит вкладку «Распознавание»: кто,
                // сколько строк распознано, сколько ушло в смету, сколько
                // монтажник переподобрал руками, и к какому расчёту это всё.
                counts: {
                    recognized: this._rows.length,
                    applied: this._rows.filter(r => ((Number(r.qty) || 0) + (Number(r.qtyExtra) || 0)) > 0).length,
                    // Строки, подставленные из памяти замен, тоже помечены
                    // _locked — но руками в ЭТОЙ смете их никто не трогал, и
                    // в «переподобрал вручную» им не место: иначе счётчик
                    // растёт сам собой и перестаёт значить что-либо.
                    replaced: this._rows.filter(r => r._locked && !r._fromMem).length,
                    fromMemory: this._rows.filter(r => r._fromMem).length,
                    noMatch: this._rows.filter(r => !r._m).length,
                },
                calcId: app.state.calc_id || null,
                projectName: app.state.projectName || '',
                // Сколько запросов к модели стоила эта смета. Лимит монтажника
                // считается именно по ним: с полистным разбором один запуск
                // стоит нескольких запросов, и «50 распознаваний в месяц»
                // без этого числа ничего не означало.
                calls: this._apiCalls || 0,
                fromCache: this._fromCache || 0,
                result: this._rows.map(r => ({
                    raw: r.raw, type: r.type, d: r.d, thread: r.thread,
                    threadType: r.threadType, qty: r.qty, qtyExtra: r.qtyExtra,
                    section: r.section,
                    // Кто поставил артикул: подбор, человек или его прошлое
                    // решение. Без этой пометки ручную замену не отличить от
                    // автоподбора, и сводка «что правят чаще всего» не
                    // собирается — а она главный источник того, чего каталогу
                    // не хватает.
                    manual: !!(r._locked && !r._fromMem),
                    fromMem: !!r._fromMem,
                    // «Своего такого нет»: подбор нашёл подходящее только в
                    // чужом материале и отказался его ставить. Самый прямой
                    // запрос на пополнение каталога, какой вообще бывает, —
                    // поэтому едет в архив вместе со строкой.
                    sysMiss: r._sysMiss || null,
                    // Чужой расходник (пена, газ к пистолету, отрезной круг).
                    // Сводка промахов такие строки не считает: их отсутствие в
                    // каталоге — не пропуск, а факт об ассортименте.
                    notOur: this.notOurRange(r) || undefined,
                    matched: r._m ? { id: r._m.item.id, name: r._m.item.name, price: r._m.item.price } : null,
                })),
            };

            const shot = this._img || (this._imgs && this._imgs[0]);
            if (shot) {
                payload.file = true;
                payload.fileExt = 'jpg';
                payload.fileData = shot;
            } else if (this._file && this._file.size <= 25 * 1024 * 1024) {
                payload.file = true;
                payload.fileExt = (this._fileName.split('.').pop() || 'bin').toLowerCase();
                payload.fileData = await this.fileToBase64(this._file);
            }

            await fetch('https://proxy.heatcalc.ru/recognize_archive.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            console.warn('Смета не заархивирована:', e.message);
        }
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result).split(',')[1] || '');
            r.onerror = () => reject(new Error('не прочитать файл'));
            r.readAsDataURL(file);
        });
    },
};

/**
 * Промпт сведения листов.
 *
 * Второй проход по уже разобранным строкам. Модель не переписывает список —
 * она возвращает только правки: что склеить, что переименовать, что выбросить.
 * Полный список на сто с лишним позиций она снова не успела бы отдать, а
 * переписывать прочитанное незачем: разбор картинок точнее пересказа.
 */
const MERGE_PROMPT = `Ты сводишь воедино смету, разобранную по листам ПОРОЗНЬ.
Каждый лист читался отдельно, поэтому связи между листами потеряны. Найди их.

Верни СТРОГО JSON без пояснений:
{
  "merge":  [[i, j], ...],          // строка j — продолжение строки i (перенос со страницы)
  "retype": [{"i": 5, "type": "муфта_комбинированная"}, ...],
  "drop":   [i, ...],               // повтор шапки таблицы или дубль строки на стыке
  "system": "ppr" | "ss" | "mp" | "pex" | null
}

ЧТО ИСКАТЬ:

1. ПЕРЕНОС СТРОКИ. Конец листа обрывается на полуслове, начало следующего его
   продолжает: «Труба PP-R 32 мм, 4 м, армир» + «ованная стекловолокном, 12 шт».
   Это одна позиция: merge=[[i, j]], где i — верхняя строка.

2. ПОВТОР ШАПКИ. «Наименование | Кол-во | Цена», «Итого», «Продолжение таблицы»,
   номер страницы — это не товар: такие строки в drop.

3. ДУБЛЬ НА СТЫКЕ. Последняя строка листа повторена первой строкой следующего
   (так печатают «продолжение»). Оставь верхнюю, нижнюю — в drop.
   Одинаковые позиции, идущие подряд в РАЗНЫХ местах листа, дублями НЕ считай:
   монтажник мог заказать их дважды.

4. ЕДИНЫЙ ТИП. Один и тот же предмет на разных листах назван по-разному
   («комби 25х3/4» и «муфта комбинированная 25х3/4»). Приведи к одному типу
   через retype. Тип бери из словаря типов распознавания.

5. СИСТЕМА. По смете целиком видно, чем она собрана: ppr — полипропилен,
   ss — нержавейка, mp — металлопластик (пресс), pex — сшитый полиэтилен
   (аксиал). Решает ТРУБА: фитинг без своей трубы систему не задаёт. Если
   труб нет или систем несколько вперемешку — system=null.

Если править нечего, верни пустые массивы. Ничего не выдумывай: строк, которых
нет в списке, быть не должно, индексы — только из присланных.`;

// Промпт распознавания. Правила выведены из разбора реальных рукописных смет,
// каждое закрывает конкретную ошибку модели — подробности в комментариях ниже.
const RECOGNIZE_PROMPT = `Ты разбираешь рукописные сметы монтажников систем отопления и водоснабжения (Россия).
На изображении — список материалов, написанный от руки, с сокращениями и жаргоном.

Верни СТРОГО JSON по схеме. Никакого текста вне JSON.

ЕСЛИ ЭТО НЕ СМЕТА, А ПЛАН ЭТАЖА — чертёж или эскиз здания сверху: стены,
помещения, окна и двери, размерные цепочки, экспликация помещений, площади
в м², — верни ровно {"docKind":"floor_plan","items":[],"skipped":[]} и
больше ничего: такой лист разбирается другими правилами. Список материалов,
пусть и с планом на полях, — это смета.

ДЮЙМЫ ПИШИ БЕЗ СИМВОЛА КАВЫЧКИ: 3/4, 1/2, 1, 1 1/4 — никогда 3/4" и не 3/4».
Кавычка внутри строки JSON рвёт весь ответ, и смета не разбирается целиком.
Это касается и "raw", и "note": «Кран 1/2 - 2шт», а не «Кран 1/2" - 2шт».

СХЕМА:
{
  "items": [{
    "raw": "строка как она написана в оригинале",
    "docNo": "номер позиции, как проставлен в документе, или null",
    "docSection": "заголовок раздела документа, под которым стоит строка, или null",
    "kind": "equipment" | "work",
    "type": "тип из словаря ниже",
    "d": число или null,
    "dims": [32,25,25] или null,
    "thread": "3/4" или null,
    "threadType": "ВР"|"НР"|"ВВ"|"ВН"|null,
    "angle": 90|45|null,
    "qty": число или null,
    "qtyExtra": число,
    "unit": "шт"|"м"|"м2"|"точка"|"компл",
    "price": цена за единицу ИЗ ДОКУМЕНТА или null,
    "sum": сумма по строке ИЗ ДОКУМЕНТА или null,
    "sections": число секций радиатора или null,
    "radKind": "бимет"|"алюм"|"сталь"|null,
    "height": 200|350|500|высота прибора в мм или null,
    "confidence": 0.0-1.0,
    "note": "пояснение, если что-то неясно"
  }],
  "skipped": [{ "raw": "...", "reason": "вычеркнуто" }],
  "docTotals": [{ "sum": число, "label": "как подписан итог" }]
}

ПРАВИЛА:

1. ЗНАК ТРОЙНИКА. Символы ⊥ ┴ ┬ Т ⊢ означают ТРОЙНИК, а не букву и не помарку.

2. ПЛЮСЫ СПРАВА — ОТМЕТКИ О ЗАКУПКЕ, А НЕ КОЛИЧЕСТВО.
   «1шт +»     -> qty=1, qtyExtra=0
   «4шт +2шт»  -> qty=4, qtyExtra=2
   «2шт. +1»   -> qty=2, qtyExtra=1
   Одиночные «+», «✓», «-» без числа игнорируй.
   qtyExtra — добавка К ЭТОМУ ЖЕ товару. Если после плюса назван другой
   предмет, это приписка: qtyExtra=0, текст в note.

3. ЗАЧЁРКНУТОЕ НЕ СЧИТАЕТСЯ, оно идёт в "skipped". Номера строк могут
   повторяться: первое вхождение зачёркнуто, второе действительно.
   Пропуски в нумерации — норма, не выдумывай позицию.

4. ЖАРГОН: «комбики»/«комб.» — муфта комбинированная; «американка»/«америк.» —
   американка; «разъёмная» — разъёмное соединение; «стекло» — PPR со
   стекловолокном; «ме/рез» — металл-резина; «шар» — шаровой;
   «"—» в начале строки — повтор наименования сверху.

5. РЕЗЬБА пишется слитно: ВР внутренняя, НР наружная, ВВ обе внутренние,
   ВН внутренняя-наружная. «25х3/4вр» -> d=25, thread="3/4", threadType="ВР".
   ВР и НР — разные товары.

6. НЕСКОЛЬКО РАЗМЕРОВ записывай все: «32х25х25» -> d=32, dims=[32,25,25].
   Дюймы (3/4, 1/2) — это резьба, а не dims.

7. УГОЛ ОТВОДА — не резьба: «32х90°» -> d=32, angle=90, thread=null.
   32х90° и 32х45° — разные товары.

8. ТИП ОДИНАКОВЫЙ ДЛЯ ОДИНАКОВЫХ ПОЗИЦИЙ. Если рядом есть PPR-фитинги того
   же диаметра — система PPR, и остальные фитинги в ней тоже _ppr.

9. НЕ ВЫДУМЫВАЙ. Количество не указано -> qty=null. Не разобрал строку ->
   confidence ниже 0.5 и пояснение в note.
   Но "прочее" ставь только когда предмет действительно неясен: если строка
   начинается со слова из словаря типов («Труба…», «Муфта…», «Кран…»,
   «Радиатор…», «Насос…»), тип бери по нему, даже если остальное непонятно.

10. kind="work" только если строка описывает действие (монтаж, установка,
    опрессовка, пусконаладка, штробление). Предмет — всегда "equipment".
    Работы в счёте поставщика идут вперемешку с материалами и часто отдельным
    разделом «Монтажные работы» — всё, что в нём, это kind="work".
    «Монтаж радиатора», «Монтаж труб отопления», «Монтаж котельной» — работы.
    «Монтажная планка», «Монтажный комплект», «Монтажная гильза» — предметы.

10a. ЕДИНИЦА ИЗМЕРЕНИЯ — КАК В ДОКУМЕНТЕ, не додумывай.
    «94 м2» -> unit="м2"   (квадратные метры: тёплый пол, утеплитель)
    «250 м.» -> unit="м"    (погонные метры: трубы, кабель)
    «14 шт.» -> unit="шт"
    «3 компл.» -> unit="компл"
    «12 точек» -> unit="точка"
    Квадратные метры пиши строго "м2" — без символа ² и без кавычек.
    Метры и квадратные метры — РАЗНЫЕ единицы: по ним сверяется, можно ли
    сравнивать объём с нашими расценками, и подмена «м2» на «м» ломает счёт.

11. КАНАЛИЗАЦИЯ. Диаметры 40, 50, 110 (и 160) — канализационные. Труба,
    отвод, тройник, редукция, ревизия, заглушка этих диаметров относятся к
    канализации, а не к водоснабжению или отоплению.
    «Труба 110 - 2 м»      -> type="труба_канализация", d=110, qty по «шт», unit="шт"
    «Отвод 110 90°»        -> type="отвод_канализация", d=110, angle=90
    «Редукция 110-32»      -> type="редукция_канализация", dims=[110,32]
    «Тройник 110 90°»      -> type="тройник_канализация", d=110, angle=90
    «Хомут на шпильке 110» -> type="хомут", d=110
    «Отвод» без указания системы — это канализация или сталь, НЕ ppr-угол.
    Канализация меряется штуками труб, а не метрами: «Труба 110 - 2 м - 6 шт»
    означает qty=6 (труб по 2 метра), а не 12 метров — длину пиши в note.

12. РАДИАТОРЫ. Секционный радиатор пиши type="радиатор", число секций в
    "sections", а в "qty" — сколько таких приборов.
    «Радиатор 8сек - 1шт»        -> type="радиатор", sections=8, qty=1
    «Рад. биметалл 10 секц. 2шт» -> type="радиатор", sections=10, radKind="бимет", qty=2
    «Алюм. радиатор 6 секций»    -> type="радиатор", sections=6, radKind="алюм"
    «Панельный 22-500-1000»      -> type="радиатор", radKind="сталь", height=500,
                                    dims=[22,500,1000], sections=null
    radKind ставь ТОЛЬКО если материал прямо назван или очевиден из модели
    (Space, TITAN, Optima Bm — бимет; Profi, Plus, «алюминий» — алюм;
    Compact, Ventil, «панельный», «тип 11/21/22/33» — сталь). Не назван —
    radKind=null, модель подберёт калькулятор.
    Секции («сек», «секц», «сек.») — это НЕ количество приборов и не диаметр.

13. НАСОСЫ. Циркуляционный насос пиши type="насос", а типоразмер оставляй
    в "raw" как написано и повторяй в "note".
    «Насос циркул (с амер) 25-60 - 1» -> type="насос", d=25, qty=1,
                                          note="25-60, с американками"
    «Насос 25/60-180»                 -> type="насос", d=25
    Пометки «с амер», «с американками», «с гайками» — это комплектация насоса,
    отдельной позицией их не делай, пиши в note.
    Скважинный, дренажный, повысительный насос — тоже type="насос", но слово
    («скважинный», «дренажный») обязательно сохрани в raw.

14. КРАНЫ ППР. «Кран ппр с амер 1/2 х 20», «Кран ппр 32» — это полипропиленовая
    арматура, а не латунная: type="кран_ppr", d — диаметр трубы (20, 25, 32),
    thread — резьба, если названа.
    «с амер», «с американкой» у такого крана — это накидная гайка радиаторного
    крана, отдельной позицией её не делай.
    «уг», «угл», «угловой» -> angle=90; без пометки кран прямой.
    «Кран ппр с амер 1/2 - 20 - 2шт уг» -> type="кран_ppr", d=20, thread="1/2",
                                           angle=90, qty=2

15. ДИАМЕТР БЕЗ РЕЗЬБЫ У АРМАТУРЫ — ЭТО DN. «Кран 15», «Кран 32» без слова
    «ппр» и без дюймов — латунный кран по условному проходу: d=15, thread=null.
    Переводить в дюймы не нужно, это сделает калькулятор.

16. «ф» ПЕРЕД ЧИСЛОМ — ДИАМЕТР: «муфта ф40» -> type="муфта", d=40;
    «Труба ф32 - 50м стекло» -> type="труба_ppr_ст", d=32, qty=50, unit="м";
    «муфта соед ф32» -> type="муфта", d=32 (соединительная — обычная муфта);
    «муфта комб ф40 х 1 (н)» -> type="муфта_комбинированная", d=40,
    thread="1", threadType="НР" ((н) — наружная, (в) — внутренняя).

17. СИСТЕМА РАЗВОДКИ. «Пресс» у монтажника — металлопластик (диаметры 16, 20,
    26, 32): «Пресс муфта 16», «Пресс угол 20х1/2 вр», «Пресс тройник 20х16х20».
    «Аксиал», «надвижная», «PEX», «сшитый» — сшитый полиэтилен (16, 20, 25, 32).
    «Гильза» (аксиал) и «зажимная втулка» (пресс) -> type="гильза", d — диаметр.
    Систему, названную в строке, сохраняй в raw: по ней калькулятор понимает,
    какими фитингами собрана смета, и не подставит нержавейку туда, где
    нержавеющей трубы нет.

18. ЦЕНЫ ИЗ ДОКУМЕНТА. Если в смете есть колонки цены и суммы — перенеси их
    как есть: "price" — цена за единицу, "sum" — сумма по строке. Число пиши
    без пробелов, знака рубля и слова «руб»: «1 234,56 ₽» -> 1234.56.
    Это цены ЧУЖОЙ сметы. На подбор позиции они не влияют — нужны только
    затем, чтобы сравнить их с нашими. НЕ СЧИТАЙ цену сам: ни делением суммы
    на количество, ни по памяти о ценах на рынке.
    В документе цен нет (рукописный список, фото без колонок) — не пиши эти
    два поля вовсе: пустые "price": null в каждой строке только раздувают
    ответ, а длинную смету он и так еле вмещает.

19. ИТОГИ ДОКУМЕНТА. Внизу счёта стоит окончательная сумма — «Итого», «Всего
    к оплате», «Итого по смете». Верни её в списке "docTotals" ВЕРХНЕГО УРОВНЯ
    (рядом с "items", а не внутри него): число в "sum", подпись как она
    написана — в "label". Отдельной строкой в items итог не пиши: это не
    позиция сметы.

    ИТОГОВ МОЖЕТ БЫТЬ НЕСКОЛЬКО. Смета часто делится на части со своими
    итогами к оплате — отдельно оборудование, отдельно монтаж. Тогда в списке
    должно быть НЕСКОЛЬКО записей:
    "docTotals": [{"sum": 1516649, "label": "Итого к оплате (оборудование)"},
                  {"sum": 583400, "label": "Итого к оплате (монтаж)"}]
    Один общий итог на весь документ — одна запись. Ни одного — пустой список.

    НЕ СКЛАДЫВАЙ СТРОКИ САМ и не складывай итоги между собой. Нужны ровно те
    числа, которые НАПЕЧАТАНЫ в документе, каждое отдельной записью. По ним
    проверяется, все ли строки прочитаны, и посчитанная тобой сумма эту
    проверку обесценивает: она сойдётся всегда, даже если половина сметы
    потеряна.

    Промежуточные итоги — «Итого по разделу», «Итого материалы», «Итого по
    странице», «Перенос на след. лист» — НЕ бери: это части, а не итоги к
    оплате. Итог не читается или виден лишь частично -> не пиши его вовсе.
    Пустой список честнее выдуманного числа.

20. ПОРЯДОК СТРОК — КАК В ДОКУМЕНТЕ. Читай сверху вниз и в том же порядке
    возвращай: первая строка документа — первая в "items", последняя —
    последняя. Не группируй по смыслу, не собирай одинаковые вместе, не
    переставляй трубы к трубам, а краны к кранам. По этому списку монтажник
    сверяется со своей бумагой строка за строкой, и любая перестановка сверку
    ломает. Позиция повторяется в документе дважды — верни её дважды, там, где
    она стоит.

    Номер позиции, если он проставлен в документе, положи в "docNo" как есть:
    «12», «2.7», «А-4». Своей нумерации не придумывай — нет номера, значит null.

21. РАЗДЕЛЫ ДОКУМЕНТА. Сметы делят на части заголовками: «Отопление»,
    «Водоснабжение», «Раздел 2. Котельная», «Материалы», «Монтажные работы».
    Заголовок — НЕ ПОЗИЦИЯ: отдельной записью в "items" его не пиши, у него нет
    ни количества, ни цены.

    Вместо этого проставь его текст в "docSection" КАЖДОЙ строки, которая стоит
    под ним, — и так до следующего заголовка. Пиши заголовок как он написан, без
    своих пояснений. До первого заголовка (и если делений в документе нет вовсе)
    docSection=null.

    Заголовок узнаётся по тому, что у строки нет ни количества, ни цены, а под
    ней идёт список позиций. «Итого по разделу» заголовком не считается — это
    итог, его не бери (см. правило 19).

СЛОВАРЬ ТИПОВ (значение поля "type" пиши КИРИЛЛИЦЕЙ, ровно как здесь —
"kran_ppr" вместо "кран_ppr" калькулятор не понимает):
радиатор, насос, гильза, ниппель, муфта_комбинированная, американка, угол_ppr, угол_пресс, тройник,
тройник_ppr, тройник_пресс, кран_шаровой, кран_американка, кран_накидной,
кран_ppr, пресс_муфта, пнд_муфта, разъёмное_соединение, переход, футорка,
фильтр, хомут, водорозетка, водорозетка_проходная, планка_водорозетка,
труба_ppr, труба_ppr_ст, труба_pex, клипса, опора, фиксатор, изоляция,
труба_канализация, отвод_канализация, тройник_канализация,
редукция_канализация, муфта_канализация, ревизия, заглушка_канализация,
прочее`;

window.RecognizeUI = RecognizeUI;

/**
 * Авторизация в калькуляторе доезжает асинхронно: Supabase отвечает уже
 * после первой отрисовки, и syncUI() к этому моменту мог отработать на
 * пустых данных. Поэтому проверяем видимость кнопки ещё несколько раз
 * после загрузки — дёшево и снимает зависимость от порядка событий.
 */
document.addEventListener('DOMContentLoaded', () => {
    const tick = () => { try { RecognizeUI.syncButton(); } catch (e) { } };
    tick();
    [300, 1000, 2500, 5000].forEach(ms => setTimeout(tick, ms));
    // Списки доступа нужны только монтажникам, поэтому грузятся один раз
    // и не блокируют запуск калькулятора.
    RecognizeUI.loadAccess();
});
