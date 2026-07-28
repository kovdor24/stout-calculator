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

        if (typeof app.hasAdminAccess === 'function' && app.hasAdminAccess()) return true;

        // Монтажнику инструмент открывает администратор — поимённо либо
        // сразу всему региону.
        const acc = this._access;
        if (!acc) return false;
        const row = app._currentUserRow || {};
        const login = (row.email || row.username || '').toLowerCase();
        const region = row.region || '';
        if (login && Object.keys(acc.users || {}).some(u => String(u).toLowerCase() === login)) return true;
        return !!(region && acc.regions && acc.regions[region]);
    },

    /** Загрузка списков доступа. Молча пропускаем сбой: без списков — как раньше. */
    async loadAccess() {
        try {
            const r = await fetch('https://proxy.heatcalc.ru/recognize_archive.php?access=1');
            const data = await r.json();
            if (data && data.ok) {
                this._access = { users: data.users || {}, regions: data.regions || {} };
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
     * Встраивание во вкладку «3. Распознать смету».
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
                    <div class="rec-title">Распознавание рукописной сметы
                      <span class="rec-beta">бета</span></div>
                    <div class="rec-steps">
                      <span class="rec-step on" data-s="1">1. Загрузка</span>
                      <span class="rec-step" data-s="2">2. Проверка</span>
                      <span class="rec-step" data-s="3">3. В смету</span>
                    </div>
                  </div>
                  <button class="rec-btn-g" id="rec_undo_apply"
                          style="display:none" onclick="RecognizeUI.undoApply()">
                    ↶ Отменить прошлое распознавание</button>
                </div>
                <div class="rec-body" id="rec_body"></div>
              </div>`;

            this._onPaste = (e) => {
                // Вставка работает, только пока вкладка открыта и мы на шаге загрузки.
                if (app.state.viewMode !== 'recognize' || this._rows.length) return;
                const it = [...(e.clipboardData || {}).items || []]
                    .find(i => i.type.startsWith('image/'));
                if (it) this.handleFile(it.getAsFile());
            };
            document.addEventListener('paste', this._onPaste);

            this.renderUpload();
            this.loadPriceIndex();
        }

        const u = document.getElementById('rec_undo_apply');
        if (u) u.style.display = app._recognizeUndo ? '' : 'none';
    },

    /** Возврат к смете после применения. */
    close() {
        app.setViewMode('equipment');
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
          <div class="rec-drop" id="rec_drop">
            <div class="rec-drop-ico">📄</div>
            <div class="rec-drop-t">Перетащите смету сюда</div>
            <div class="rec-drop-s">фото, PDF, Excel, Word или HTML · или нажмите для выбора · или вставьте скриншот через Ctrl+V</div>
          </div>
          <div class="rec-prev-row" id="rec_prev_wrap">
            <div class="rec-prev-wrap">
              <img id="rec_prev" class="rec-prev" alt="">
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
        this.pickFiles(files => this.addSheets(files));
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
                const r = await RecognizeFiles.extract(f, (m) => this.setStatus(m));
                if (r.images && r.images.length) added.push(...r.images);
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
        this._fileKind = 'image';
        this._fileName = `${this._imgs.length} листов`;

        const tp = document.getElementById('rec_textprev');
        if (tp) tp.style.display = 'none';
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

    /** Сброс загруженного: вернуться к пустой зоне и выбрать другой файл. */
    clearFile() {
        this._img = null;
        this._imgs = null;
        this._file = null;
        this._text = '';
        this._fileName = '';
        this._fileKind = null;

        const wrap = document.getElementById('rec_prev_wrap');
        if (wrap) wrap.style.display = 'none';
        const box = document.getElementById('rec_imgs');
        if (box) box.style.display = 'none';
        const dup = document.getElementById('rec_dup');
        if (dup) dup.remove();
        const tp = document.getElementById('rec_textprev');
        if (tp) tp.style.display = 'none';
        const err = document.querySelector('#rec_body .rec-err');
        if (err) err.remove();
        this.setGoReady(false);
        this.setStatus('Фото и сканы, а также PDF, Excel, Word, HTML');
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
            this._img = null;
            this._imgs = [];
            this._files = images;
            this._fileKind = 'image';
            this._fileName = `${images.length} листов`;
            this.setGoReady(false);
            const tp = document.getElementById('rec_textprev');
            if (tp) tp.style.display = 'none';
            for (let i = 0; i < images.length; i++) {
                this.setStatus(`Готовлю лист ${i + 1} из ${images.length}…`);
                this._imgs.push(await this.prepareToBase64(images[i]));
            }
            this.showImagesPreview();
            this.setGoReady(true);
            this.setStatus(`${images.length} листов готовы — можно распознавать все вместе`);
            return;
        }
        return this.handleFile(files[0]);
    },

    /** Ужать картинку до base64 без показа — для пакетной загрузки. */
    prepareToBase64(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const max = 1600;
                const k = Math.min(1, max / Math.max(img.width, img.height));
                const c = document.createElement('canvas');
                c.width = Math.round(img.width * k);
                c.height = Math.round(img.height * k);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
            };
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        });
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
               <button class="rec-thumb-del" title="Убрать лист"
                       onclick="RecognizeUI.removeSheet(${i})">✕</button></div>`;
        }).join('') +
            `<button class="rec-add-tile" title="${this.ADD_HINT}"
                     onclick="RecognizeUI.pickMore()">+</button>`;
        box.style.display = 'flex';
        this.showDupNote(dups, box);
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
        this._fileName = file.name || '';
        this._file = file;              // держим оригинал для архива
        const oldImgs = document.getElementById('rec_imgs');
        if (oldImgs) oldImgs.style.display = 'none';
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
            const r = await RecognizeFiles.extract(file, (m) => this.setStatus(m));

            if (r.images && r.images.length) {
                // Скан в PDF: текстового слоя нет, работаем с картинкой.
                this._img = r.images[0];
                const prev = document.getElementById('rec_prev');
                const wrap = document.getElementById('rec_prev_wrap');
                if (prev) prev.src = 'data:image/jpeg;base64,' + this._img;
                if (wrap) wrap.style.display = 'flex';
                this.setStatus(r.images.length > 1
                    ? `PDF без текста: возьму первую страницу из ${r.images.length}`
                    : 'PDF без текста — распознаю как изображение');
            } else if (r.text) {
                this._text = this.trimText(r.text);
                const lines = this._text.split('\n').length;
                this.setStatus(`${file.name}: извлечено ${lines} строк текста, можно разбирать`);
                this.showTextPreview(this._text);
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
    trimText(text) {
        const MAX = 24000;   // символов; настоящая смета сильно меньше

        // Заголовок таблицы оборудования: «# НАИМЕНОВАНИЕ … КОЛ … СУММА».
        // Всё выше него — расчётная часть, она не нужна.
        const m = text.match(/(наименовани[ея][\s\S]{0,60}?(кол|сумм|цена))/i);
        if (m && m.index > 200) {
            text = text.slice(m.index);
        }

        if (text.length > MAX) {
            text = text.slice(0, MAX) + '\n[текст обрезан — распознаётся начало сметы]';
        }
        return text;
    },

    /** Короткий показ извлечённого текста — видно, что прочиталось. */
    showTextPreview(text) {
        const wrap = document.getElementById('rec_prev_wrap');
        if (wrap) wrap.style.display = 'none';
        let box = document.getElementById('rec_textprev');
        if (!box) {
            box = document.createElement('pre');
            box.id = 'rec_textprev';
            box.className = 'rec-textprev';
            const host = document.getElementById('rec_body');
            const actions = host && host.querySelector('.rec-actions');
            if (actions) host.insertBefore(box, actions); else if (host) host.appendChild(box);
        }
        box.style.display = 'block';   // мог быть скрыт после загрузки картинки
        const lines = text.split('\n');
        box.textContent = lines.slice(0, 40).join('\n') +
            (lines.length > 40 ? `\n… и ещё ${lines.length - 40} строк` : '');
    },

    prepare(file) {
        const img = new Image();
        img.onload = () => {
            const max = 1600;
            const k = Math.min(1, max / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * k);
            c.height = Math.round(img.height * k);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            const url = c.toDataURL('image/jpeg', 0.85);
            this._img = url.split(',')[1];

            const prev = document.getElementById('rec_prev');
            const wrap = document.getElementById('rec_prev_wrap');
            if (prev) prev.src = url;
            if (wrap) wrap.style.display = 'flex';
            // Убираем текстовое превью, если до этого грузили файл с текстом.
            const tp = document.getElementById('rec_textprev');
            if (tp) tp.style.display = 'none';
            this.setGoReady(true);
            this.setStatus(`${c.width}×${c.height}, ~${Math.round(this._img.length / 1365)} КБ — можно распознавать`);
        };
        img.src = URL.createObjectURL(file);
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

    progressStart(fromText) {
        this.STAGES = fromText ? this.STAGES_TEXT : this.STAGES_IMG;
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
        this._timer = setInterval(() => {
            const el = document.getElementById('rec_elapsed');
            if (!el) return;
            const s = Math.round((Date.now() - this._t0) / 1000);
            el.textContent = s + ' с' + (s > 45 ? ' — дольше обычного, но запрос ещё идёт' : '');
        }, 1000);

        this.progressTo(0);
    },

    progressTo(n) {
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
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        const box = document.getElementById('rec_progress');
        if (box) box.remove();
    },

    // ------------------------------------------------------------------
    // Запрос к распознаванию
    // ------------------------------------------------------------------

    /** Логин, под которым распознавания попадают в архив и считается лимит. */
    userKey() {
        return (app._currentUserRow && (app._currentUserRow.email || app._currentUserRow.username))
            || (app.state.tgUser && app.state.tgUser.username) || 'admin';
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
        el.textContent = `Распознаваний в этом месяце: ${q.used} из ${q.limit}, осталось ${q.left}`;
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
                err.textContent = `Распознавания на этот месяц закончились: использовано ${quota.used} из ${quota.limit}. ` +
                    'Лимит обновится первого числа. Если нужно больше — напишите администратору.';
                body.appendChild(err);
            }
            return;
        }

        this._busy = true;
        const go = document.getElementById('rec_go');
        if (go) go.disabled = true;
        this.setStatus('');
        this.progressStart(!!this._text);

        try {
            this.progressTo(1);

            // Из текстового файла картинку не шлём: текст в запросе точнее и
            // дешевле, модель не тратит зрение на то, что уже прочитано.
            // Несколько листов идут в один запрос — модель видит смету целиком.
            let parts;
            if (this._text) {
                parts = [{ text: 'Разбери эту смету по правилам. Это текст, извлечённый из файла:\n\n' + this._text }];
            } else if (this._imgs && this._imgs.length > 1) {
                parts = [{ text: `Разбери эту смету по правилам. Это ${this._imgs.length} листов ОДНОЙ сметы — ` +
                    `нумерация и система сквозные, разбирай их вместе как единый список. Верни только JSON.` }];
                for (const b of this._imgs) parts.push({ inline_data: { mime_type: 'image/jpeg', data: b } });
            } else {
                parts = [
                    { text: 'Разбери эту смету по правилам. Верни только JSON.' },
                    { inline_data: { mime_type: 'image/jpeg', data: this._img || this._imgs[0] } },
                ];
            }

            // Модели пробуются по очереди: если основная перегружена на
            // стороне Google («high demand»), автоматически берём запасную.
            // Все три в белом списке прокси, менять сервер не нужно.
            const MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview'];
            let data = null, lastErr = null;
            for (let mi = 0; mi < MODELS.length; mi++) {
                const resp = await this.fetchRetry({
                    mode: 'recognize',
                    model: MODELS[mi],
                    systemInstruction: RECOGNIZE_PROMPT,
                    messages: [{ role: 'user', parts }]
                });
                const parsed = JSON.parse(resp);
                if (!parsed.error) { data = parsed; break; }

                const msg = typeof parsed.error === 'string' ? parsed.error : parsed.error.message || '';
                lastErr = msg;
                // Перегрузка модели — пробуем следующую. Прочие ошибки
                // (неверный запрос, ключ) повторять другой моделью бессмысленно.
                const overloaded = /high demand|overload|unavailable|503|429|resource has been exhausted/i.test(msg);
                if (!overloaded || mi === MODELS.length - 1) {
                    throw new Error(msg + (overloaded ? '\n\nВсе модели сейчас перегружены — попробуйте через минуту.' : ''));
                }
                this.setStatus(`Модель занята, пробую запасную (${mi + 2} из ${MODELS.length})…`);
            }

            const cand = data?.candidates?.[0];
            const text = cand?.content?.parts?.[0]?.text;
            if (!text) throw new Error('Модель вернула пустой ответ');

            const parsed = this.parseModelJson(text, cand.finishReason);

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
        const first = src.indexOf('{');
        const last = src.lastIndexOf('}');
        if (first > 0 && last > first) src = src.slice(first, last + 1);

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
            this._parseWarning = finishReason === 'MAX_TOKENS'
                ? `Ответ обрезан по длине — разобрано ${items.length} позиций, конец сметы мог не попасть.`
                : `Ответ пришёл с ошибкой формата — разобрано ${items.length} позиций, часть строк могла потеряться.`;
            return { items, skipped: [] };
        }

        throw new Error(finishReason === 'MAX_TOKENS'
            ? 'Ответ обрезан по длине — попробуйте снять смету двумя фото по половине'
            : 'Модель вернула не-JSON и восстановить его не удалось');
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
     * Поэтому свой таймаут (100 с, чуть меньше 110 с у ретранслятора), и по
     * нему — сразу понятная ошибка, а не три круга ожидания.
     */
    async fetchRetry(payload, attempts = 3) {
        let last;
        for (let i = 1; i <= attempts; i++) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 100000);
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
                    this.setStatus(`Сервер не ответил (попытка ${i} из ${attempts}), повторяю…`);
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }
        throw new Error('Сервер распознавания не отвечает. Попробуйте через минуту.\n' +
            (last ? last.message : ''));
    },

    // ------------------------------------------------------------------
    // Шаг 2 — проверка
    // ------------------------------------------------------------------

    startReview(res) {
        const items = res.items || [];
        this._skipped = res.skipped || [];
        if (typeof RecognizeMatch !== 'undefined') {
            RecognizeMatch.setPprBrand(app.state.pprSystemBrand || 'proaqua');
        }

        this._rows = items.map(i => ({ ...i, _sel: false, _locked: false }));
        this.inheritRepeats();

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
        const profileOfSystem = () =>
            (typeof RecognizeMatch !== 'undefined' && RecognizeMatch.systemProfile)
                ? RecognizeMatch.systemProfile(this._rows) : null;

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
        this._rows.forEach(r => {
            if (typeof RecognizeMatch === 'undefined') return;
            const g = RecognizeMatch.guessSection(r, this._profile);
            r.section = g.section;
            r._sectionSure = g.sure;
        });

        this._undo = [];
        this._analogOn = false;      // новое распознавание — режим аналогов сброшен
        this._analogSaved = 0;
        this._deep = 0;
        // Ниже девяноста процентов смета получается дырявой, и монтажнику
        // придётся добивать её руками. Прежде чем показывать такой результат,
        // прогоняем неподобранные строки ещё раз, с ослабленными правилами.
        this.deepPass();
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
        const g = RecognizeMatch.guessSection(s.row, this._profile);
        this._rows.push({
            ...s.row,
            raw: 'Рекомендация: ' + s.reason,
            kind: 'equipment',
            confidence: 1,
            note: s.note,
            section: g.section,
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
            const row = { ...r, _m: r.match || null, _sel: false, _locked: false };
            delete row.match;
            if (r._note) row.note = [r.note, r._note].filter(Boolean).join('; ');
            return row;
        });

        this._sys = RecognizeMatch.systemProfile(this._rows);
        this._rows.forEach(r => {
            const g = RecognizeMatch.guessSection(r, this._profile);
            r.section = g.section;
            r._sectionSure = g.sure;
        });
        this.refreshSuggestions();
        this.renderReview();
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
                r.qty = Math.ceil(qty / m.pack);
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
            if (per && qty >= per * 3) {
                r._pieces = qty;
                r._packed = per;
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

        const groups = { notInBase: [], weak: [], noWords: [], noType: [] };
        for (const r of miss) {
            let e;
            try { e = RecognizeMatch.explainMiss(r); } catch (err) { e = null; }
            const key = (e && groups[e.reason]) ? e.reason : 'noType';
            groups[key].push({ row: r, info: e });
        }
        return { total: miss.length, groups };
    },

    rematch(row) {
        if (row._locked) return;   // ручной выбор автоподбор не перебивает
        row._m = (typeof RecognizeMatch !== 'undefined' && typeof catalog !== 'undefined')
            ? RecognizeMatch.matchItem(row, this._sys) : null;
    },

    snap() {
        this._undo.push(JSON.stringify(this._rows));
        if (this._undo.length > 40) this._undo.shift();
    },

    set(i, field, val) {
        this.snap();
        const r = this._rows[i];
        r[field] = (val === '') ? null
            : (['qty', 'qtyExtra', 'd'].includes(field) ? Number(val) : val);
        r._locked = false;
        this.rematch(r);
        this.renderReview();
    },

    thread(i, t) {
        this.snap();
        const r = this._rows[i];
        r.threadType = (r.threadType === t) ? null : t;
        r._locked = false;
        this.rematch(r);
        this.renderReview();
    },

    del(i) { this.snap(); this._rows.splice(i, 1); this.refreshSuggestions(); this.renderReview(); },
    sel(i, v) { this._rows[i]._sel = v; this.renderReview(); },
    selAll(v) { this._rows.forEach(r => r._sel = v); this.renderReview(); },
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
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const cell = v => (v === null || v === undefined || v === '') ? '' : v;
        const THREADS = ['ВР', 'НР', 'ВВ', 'ВН'];

        const rows = this._rows.map((r, n) => {
            const m = r._m;
            const qty = (r.qty || 0) + (r.qtyExtra || 0);
            // Жёлтым помечаем только то, что подобрать не удалось. Неполное
            // совпадение видно в самой ячейке подбора («совпадение 90%»), и
            // красить из-за него всю строку — значит топить настоящую проблему
            // в жёлтом фоне половины таблицы.
            const cls = m ? '' : 'rec-nomatch';

            const tbtns = THREADS.map(t =>
                `<button class="rec-tbtn ${r.threadType === t ? 'on' : ''}"
                         onclick="RecognizeUI.thread(${n},'${t}')">${t}</button>`).join('');

            const match = m
                ? `<div>${esc(m.item.name)}</div>
                   <div class="rec-art">${esc(m.item.article || m.item.id)}${
                    r._locked ? ' · выбрано вручную'
                        : (m.score < 1 ? ` · совпадение ${Math.round(m.score * 100)}%` : '')}${
                    m.needsApproval ? ' · <b>требует согласования</b>' : ''}</div>${
                    m.substituted ? `<div class="rec-art">${esc(m.substituted)}</div>` : ''}`
                : `<span class="rec-art">нет в каталоге — уйдёт своей позицией с ценой 0</span>`;

            return `<tr class="${cls}">
              <td><input type="checkbox" ${r._sel ? 'checked' : ''}
                         onchange="RecognizeUI.sel(${n},this.checked)"></td>
              <td class="rec-raw">${esc(r.raw)}
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
                  ${r._packed ? `<div class="rec-art">${r._meters} м → штанги по ${r._packed} м</div>` : ''}</td>
              <td>${match}</td>
              <td>${m ? m.item.price + ' ₽' : '—'}</td>
              <td><b>${m ? Math.round(m.item.price * qty) + ' ₽' : '—'}</b></td>
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

        const skipRows = (this._skipped || []).map(s =>
            `<tr class="rec-skip"><td></td><td class="rec-raw">${esc(s.raw)}</td>
             <td colspan="8">${esc(s.reason || 'вычеркнуто')}</td></tr>`).join('');

        const found = this._rows.filter(r => r._m);
        const sum = found.reduce((s, r) =>
            s + r._m.item.price * ((r.qty || 0) + (r.qtyExtra || 0)), 0);
        const noQty = this._rows.filter(r => !((r.qty || 0) + (r.qtyExtra || 0))).length;
        const selN = this._rows.filter(r => r._sel).length;

        document.getElementById('rec_body').innerHTML = `
          ${this._parseWarning ? `<div class="rec-err">${esc(this._parseWarning)}
             Проверьте, все ли строки сметы на месте.</div>` : ''}
          <div class="rec-toolbar">
            <button class="rec-btn-g" onclick="RecognizeUI.undo()" ${this._undo.length ? '' : 'disabled'}>↶ Отменить</button>
            <button class="rec-btn-g" onclick="RecognizeUI.delSel()" ${selN ? '' : 'disabled'}>Удалить выбранные${selN ? ' (' + selN + ')' : ''}</button>
            <select class="rec-btn-g" ${selN ? '' : 'disabled'}
                    onchange="RecognizeUI.moveSel(this.value); this.selectedIndex=0;">
              <option value="">Выбранные — в раздел…</option>
              ${(RecognizeMatch.SECTIONS || []).map(s =>
                `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
            ${this.renderSystemSelect()}
            <span class="rec-status">Подобрано ${found.length} из ${this._rows.length} (${
              this._rows.length ? Math.round(found.length / this._rows.length * 100) : 0}%)${
              this._deep ? ` · из них углублённым поиском ${this._deep}` : ''}${
              noQty ? ` · без количества ${noQty}` : ''}</span>
            ${this.renderAnalogButton()}
          </div>
          <div class="rec-tablewrap">
            <table class="rec-table">
              <colgroup><col style="width:30px"><col style="width:170px"><col style="width:140px">
                <col style="width:50px"><col style="width:100px"><col style="width:70px">
                <col><col style="width:72px"><col style="width:82px">
                <col style="width:190px"><col style="width:66px"></colgroup>
              <thead><tr>
                <th><input type="checkbox" onchange="RecognizeUI.selAll(this.checked)"></th>
                <th>Как написано</th><th>Тип</th><th>D</th><th>Резьба</th><th>Кол.</th>
                <th>Подобрано в каталоге</th><th>Цена</th><th>Сумма</th>
                <th>Раздел сметы</th><th></th>
              </tr></thead>
              <tbody>${rows}${skipRows}</tbody>
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
              a.total % 10 === 1 && a.total % 100 !== 11 ? 'строка' : 'строк'}</summary>
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
        if (typeof catalog !== 'undefined') {
            for (const k in catalog) {
                const v = catalog[k];
                if (Array.isArray(v)) {
                    for (const it of v) if (it && it.name && it.price != null) this._catIndex.push(it);
                } else if (v && v.name && v.price != null) this._catIndex.push(v);
            }
        }
        for (const p of (this._priceItems || [])) {
            this._catIndex.push({
                id: p.a, article: p.a, name: p.n, price: p.p,
                brand: p.s, _fromPrice: true,
            });
        }
        return this._catIndex;
    },

    search(i) {
        const row = this._rows[i];
        const esc = s => String(s ?? '').replace(/[&<>"]/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const guess = [row.type, row.d, row.thread].filter(Boolean).join(' ');

        const ov = document.createElement('div');
        ov.className = 'calc-dialog-overlay rec-search-ov active';
        ov.innerHTML = `
          <div class="calc-dialog-card rec-search-card">
            <div class="rec-title" style="font-size:15px">Подбор по каталогу
              <span class="rec-art">${esc(row.raw)}</span></div>
            <input class="calc-dialog-input" id="rec_q" value="${esc(guess)}"
                   placeholder="Название или часть названия">
            <div id="rec_res" class="rec-res"></div>
            <div class="rec-foot" style="border:0;padding-top:6px">
              <button class="calc-dialog-btn calc-dialog-btn-cancel" id="rec_cx">Отмена</button>
            </div>
          </div>`;
        document.body.appendChild(ov);

        const q = ov.querySelector('#rec_q');
        const res = ov.querySelector('#rec_res');
        const close = () => ov.remove();
        ov.querySelector('#rec_cx').onclick = close;
        ov.onclick = e => { if (e.target === ov) close(); };

        const run = () => {
            const w = q.value.toLowerCase().split(/\s+/).filter(Boolean);
            const hits = this.catIndex()
                .filter(it => w.every(x => it.name.toLowerCase().includes(x)))
                .slice(0, 50);
            res.innerHTML = hits.length
                ? hits.map((it, n) => `<div class="rec-hit" data-i="${n}">
                     <span>${esc(it.name)}${it._fromPrice
                       ? ` <span class="rec-art">· из прайса, ${esc(it.brand)}</span>` : ''}</span>
                     <b>${it.price} ₽</b></div>`).join('')
                : '<div class="rec-art" style="padding:10px">Ничего не найдено</div>';
            res.querySelectorAll('.rec-hit').forEach(el => {
                el.onclick = () => {
                    this.snap();
                    row._m = { item: hits[+el.dataset.i], score: 1, alternatives: [] };
                    row._locked = true;
                    close();
                    this.renderReview();
                };
            });
        };
        q.oninput = run;
        run();
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

        const r = app.applyRecognized(this._rows, mode);

        // Сбрасываем состояние: вкладка должна открыться чистой в следующий раз.
        this._img = null;
        this._imgs = null;
        this._text = '';
        this._rows = [];
        this._undo = [];
        this._skipped = [];
        const panel = document.getElementById('panel_recognize');
        if (panel) panel.innerHTML = '';

        this.close();

        const parts = [`Добавлено позиций: ${r.eq}`];
        if (r.works) parts.push(`работ: ${r.works}`);
        if (r.noPrice) parts.push(`из них без цены: ${r.noPrice}`);
        if (r.skippedNoQty) parts.push(`пропущено без количества: ${r.skippedNoQty}`);

        app.alert(parts.join('\n') +
            '\n\nДобавленные строки подсвечены в смете. Отменить целиком — кнопка «Отменить распознавание» под сметой.');
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
            const payload = {
                user: this.userKey(),
                source: this._fileKind || (this._img ? 'image' : 'text'),
                fileName: this._fileName || '',
                mode: mode,
                // По этим полям админка строит вкладку «Распознавание»: кто,
                // сколько строк распознано, сколько ушло в смету, сколько
                // монтажник переподобрал руками, и к какому расчёту это всё.
                counts: {
                    recognized: this._rows.length,
                    applied: this._rows.filter(r => ((Number(r.qty) || 0) + (Number(r.qtyExtra) || 0)) > 0).length,
                    replaced: this._rows.filter(r => r._locked).length,
                    noMatch: this._rows.filter(r => !r._m).length,
                },
                calcId: app.state.calc_id || null,
                projectName: app.state.projectName || '',
                result: this._rows.map(r => ({
                    raw: r.raw, type: r.type, d: r.d, thread: r.thread,
                    threadType: r.threadType, qty: r.qty, qtyExtra: r.qtyExtra,
                    section: r.section,
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

// Промпт распознавания. Правила выведены из разбора реальных рукописных смет,
// каждое закрывает конкретную ошибку модели — подробности в комментариях ниже.
const RECOGNIZE_PROMPT = `Ты разбираешь рукописные сметы монтажников систем отопления и водоснабжения (Россия).
На изображении — список материалов, написанный от руки, с сокращениями и жаргоном.

Верни СТРОГО JSON по схеме. Никакого текста вне JSON.

ДЮЙМЫ ПИШИ БЕЗ СИМВОЛА КАВЫЧКИ: 3/4, 1/2, 1, 1 1/4 — никогда 3/4" и не 3/4».
Кавычка внутри строки JSON рвёт весь ответ, и смета не разбирается целиком.
Это касается и "raw", и "note": «Кран 1/2 - 2шт», а не «Кран 1/2" - 2шт».

СХЕМА:
{
  "items": [{
    "raw": "строка как она написана в оригинале",
    "kind": "equipment" | "work",
    "type": "тип из словаря ниже",
    "d": число или null,
    "dims": [32,25,25] или null,
    "thread": "3/4" или null,
    "threadType": "ВР"|"НР"|"ВВ"|"ВН"|null,
    "angle": 90|45|null,
    "qty": число или null,
    "qtyExtra": число,
    "unit": "шт"|"м",
    "sections": число секций радиатора или null,
    "radKind": "бимет"|"алюм"|"сталь"|null,
    "height": 200|350|500|высота прибора в мм или null,
    "confidence": 0.0-1.0,
    "note": "пояснение, если что-то неясно"
  }],
  "skipped": [{ "raw": "...", "reason": "вычеркнуто" }]
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
