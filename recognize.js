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

    // Отдельного списка админов здесь нет намеренно: он уже есть в
    // app.getAdminRole(), который смотрит и в _currentUserRow, и в
    // state.tgUser. Дубль приводил к тому, что «Админка» была видна,
    // а эта кнопка нет — вход заполняет не всегда одно и то же поле.

    _img: null,        // подготовленная картинка в base64
    _rows: [],         // распознанное, оно же правится пользователем
    _undo: [],
    _catIndex: null,
    _busy: false,

    isAllowed() {
        if (typeof app === 'undefined') return false;
        // Отладочный ключ: ?recognize=1 показывает кнопку без проверки роли.
        // Нужен, когда надо посмотреть мастер до того, как авторизация
        // успела заполнить данные пользователя.
        try {
            if (new URLSearchParams(location.search).get('recognize') === '1') return true;
        } catch (e) { /* location недоступен — не мешаем работе */ }
        return typeof app.hasAdminAccess === 'function' && app.hasAdminAccess();
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
          <img id="rec_prev" class="rec-prev" alt="">
          <div class="rec-actions">
            <button class="calc-dialog-btn calc-dialog-btn-confirm" id="rec_go" disabled>Распознать</button>
            <span class="rec-status" id="rec_status">Фото и сканы, а также PDF, Excel, Word, HTML</span>
          </div>`;

        const drop = document.getElementById('rec_drop');
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = (typeof RecognizeFiles !== 'undefined') ? RecognizeFiles.ACCEPT : 'image/*';
        inp.multiple = true;   // многостраничная смета — несколько фото сразу
        inp.style.display = 'none';
        document.body.appendChild(inp);

        drop.onclick = () => inp.click();
        inp.onchange = e => { if (e.target.files.length) this.handleFiles([...e.target.files]); inp.remove(); };
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
            const go = document.getElementById('rec_go');
            if (go) go.disabled = true;
            const tp = document.getElementById('rec_textprev');
            if (tp) tp.style.display = 'none';
            for (let i = 0; i < images.length; i++) {
                this.setStatus(`Готовлю лист ${i + 1} из ${images.length}…`);
                this._imgs.push(await this.prepareToBase64(images[i]));
            }
            this.showImagesPreview();
            if (go) go.disabled = false;
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
        const prev = document.getElementById('rec_prev');
        if (prev) prev.style.display = 'none';
        let box = document.getElementById('rec_imgs');
        if (!box) {
            box = document.createElement('div');
            box.id = 'rec_imgs';
            box.className = 'rec-imgs';
            const host = document.getElementById('rec_body');
            const actions = host && host.querySelector('.rec-actions');
            if (actions) host.insertBefore(box, actions); else if (host) host.appendChild(box);
        }
        box.innerHTML = (this._imgs || []).map((b, i) =>
            `<div class="rec-thumb"><img src="data:image/jpeg;base64,${b}" alt="лист ${i + 1}"><span>${i + 1}</span></div>`
        ).join('');
        box.style.display = 'flex';
    },

    async handleFile(file) {
        this._img = null;
        this._imgs = null;
        this._text = '';
        this._fileName = file.name || '';
        this._file = file;              // держим оригинал для архива
        const oldImgs = document.getElementById('rec_imgs');
        if (oldImgs) oldImgs.style.display = 'none';

        if (typeof RecognizeFiles === 'undefined') { this.prepare(file); return; }

        const kind = RecognizeFiles.kindOf(file);
        this._fileKind = kind;
        if (!kind) {
            this.setStatus('Формат не поддерживается. Нужны фото, PDF, Excel, Word или HTML.');
            return;
        }
        if (kind === 'image') { this.prepare(file); return; }

        const go = document.getElementById('rec_go');
        if (go) go.disabled = true;

        try {
            const r = await RecognizeFiles.extract(file, (m) => this.setStatus(m));

            if (r.images && r.images.length) {
                // Скан в PDF: текстового слоя нет, работаем с картинкой.
                this._img = r.images[0];
                const prev = document.getElementById('rec_prev');
                if (prev) { prev.src = 'data:image/jpeg;base64,' + this._img; prev.style.display = 'block'; }
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
            if (go) go.disabled = false;
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
        const prev = document.getElementById('rec_prev');
        if (prev) prev.style.display = 'none';
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
            if (prev) { prev.src = url; prev.style.display = 'block'; }
            // Убираем текстовое превью, если до этого грузили файл с текстом.
            const tp = document.getElementById('rec_textprev');
            if (tp) tp.style.display = 'none';
            const go = document.getElementById('rec_go');
            if (go) go.disabled = false;
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

    async run() {
        // Работаем либо с картинкой (фото, скан), либо с текстом (Excel, Word,
        // PDF с текстовым слоем, HTML). Что именно — определил handleFile.
        const hasImgs = this._img || (this._imgs && this._imgs.length);
        if ((!hasImgs && !this._text) || this._busy) return;
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
                    { inline_data: { mime_type: 'image/jpeg', data: this._img } },
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

            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                throw new Error(cand.finishReason === 'MAX_TOKENS'
                    ? 'Ответ обрезан по длине — попробуйте снять смету двумя фото по половине'
                    : 'Модель вернула не-JSON: ' + e.message);
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
        this._rows.forEach(r => this.rematch(r));

        this.progressTo(3);
        // Раздел сметы предполагаем по типу позиции. Где признак неоднозначен,
        // guessSection честно возвращает sure=false — такие строки помечаем,
        // чтобы монтажник обратил на них внимание и поправил.
        this._rows.forEach(r => {
            if (typeof RecognizeMatch === 'undefined') return;
            const g = RecognizeMatch.guessSection(r);
            r.section = g.section;
            r._sectionSure = g.sure;
        });

        this._undo = [];
        this.refreshSuggestions();
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
        this._sugg = RecognizeMatch.suggest(this._rows).map(s => {
            s.match = RecognizeMatch.matchItem(s.row);
            return s;
        });
    },

    /** Принятие рекомендации: строка становится обычной позицией сметы. */
    addSuggestion(i) {
        const s = (this._sugg || [])[i];
        if (!s) return;
        this.snap();
        const g = RecognizeMatch.guessSection(s.row);
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

    rematch(row) {
        if (row._locked) return;   // ручной выбор автоподбор не перебивает
        row._m = (typeof RecognizeMatch !== 'undefined' && typeof catalog !== 'undefined')
            ? RecognizeMatch.matchItem(row) : null;
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
            const cls = !m ? 'rec-nomatch'
                : ((r.confidence ?? 1) < 0.7 || (m.score ?? 1) < 1 ? 'rec-low' : '');

            const tbtns = THREADS.map(t =>
                `<button class="rec-tbtn ${r.threadType === t ? 'on' : ''}"
                         onclick="RecognizeUI.thread(${n},'${t}')">${t}</button>`).join('');

            const match = m
                ? `<div>${esc(m.item.name)}</div>
                   <div class="rec-art">${esc(m.item.article || m.item.id)}${
                    r._locked ? ' · выбрано вручную'
                        : (m.score < 1 ? ` · совпадение ${Math.round(m.score * 100)}%` : '')}${
                    m.needsApproval ? ' · <b>требует согласования</b>' : ''}</div>`
                : `<span class="rec-art">нет в каталоге — уйдёт своей позицией с ценой 0</span>`;

            return `<tr class="${cls}">
              <td><input type="checkbox" ${r._sel ? 'checked' : ''}
                         onchange="RecognizeUI.sel(${n},this.checked)"></td>
              <td class="rec-raw">${esc(r.raw)}</td>
              <td><input class="rec-f" value="${esc(cell(r.type))}"
                         onchange="RecognizeUI.set(${n},'type',this.value)"></td>
              <td><input class="rec-f rec-f-s" value="${esc(cell(r.d))}"
                         onchange="RecognizeUI.set(${n},'d',this.value)"></td>
              <td><input class="rec-f rec-f-s" value="${esc(cell(r.thread))}"
                         onchange="RecognizeUI.set(${n},'thread',this.value)">
                  <div class="rec-tgroup">${tbtns}</div></td>
              <td><input class="rec-f rec-f-s" value="${esc(cell(r.qty))}"
                         onchange="RecognizeUI.set(${n},'qty',this.value)">
                  ${r.qtyExtra ? `<span class="rec-art">+${r.qtyExtra}</span>` : ''}</td>
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
          <div class="rec-toolbar">
            <button class="rec-btn-g" onclick="RecognizeUI.undo()" ${this._undo.length ? '' : 'disabled'}>↶ Отменить</button>
            <button class="rec-btn-g" onclick="RecognizeUI.delSel()" ${selN ? '' : 'disabled'}>Удалить выбранные${selN ? ' (' + selN + ')' : ''}</button>
            <select class="rec-btn-g" ${selN ? '' : 'disabled'}
                    onchange="RecognizeUI.moveSel(this.value); this.selectedIndex=0;">
              <option value="">Выбранные — в раздел…</option>
              ${(RecognizeMatch.SECTIONS || []).map(s =>
                `<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
            <span class="rec-status">Подобрано ${found.length} из ${this._rows.length}${
              noQty ? ` · без количества ${noQty}` : ''}</span>
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
          ${this.renderSuggestions()}
          <div class="rec-foot">
            <div class="rec-total">Итого: <b>${Math.round(sum).toLocaleString('ru-RU')} ₽</b></div>
            <button class="calc-dialog-btn calc-dialog-btn-cancel" onclick="RecognizeUI.apply('new')">Создать новую смету</button>
            <button class="calc-dialog-btn calc-dialog-btn-confirm" onclick="RecognizeUI.apply('add')">Добавить в текущую смету</button>
          </div>`;
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
                user: (app._currentUserRow && (app._currentUserRow.email || app._currentUserRow.username))
                    || (app.state.tgUser && app.state.tgUser.username) || 'admin',
                source: this._fileKind || (this._img ? 'image' : 'text'),
                fileName: this._fileName || '',
                mode: mode,
                result: this._rows.map(r => ({
                    raw: r.raw, type: r.type, d: r.d, thread: r.thread,
                    threadType: r.threadType, qty: r.qty, qtyExtra: r.qtyExtra,
                    section: r.section,
                    matched: r._m ? { id: r._m.item.id, name: r._m.item.name, price: r._m.item.price } : null,
                })),
            };

            if (this._img) {
                payload.file = true;
                payload.fileExt = 'jpg';
                payload.fileData = this._img;
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

СЛОВАРЬ ТИПОВ:
ниппель, муфта_комбинированная, американка, угол_ppr, угол_пресс, тройник,
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
});
