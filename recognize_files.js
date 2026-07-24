/**
 * Извлечение текста из файлов смет: Excel, Word, PDF, HTML.
 *
 * Смысл модуля: у этих форматов текст уже есть внутри, распознавать картинку
 * не нужно. Достаём текст в браузере и отправляем в тот же промпт, что и
 * фотографии, — быстрее, дешевле и без ошибок чтения почерка.
 *
 * Исключение — сканы в PDF. Там текстового слоя нет, страницы приходится
 * рисовать в картинку и отправлять на распознавание как фото.
 *
 * Внешних библиотек нет: xlsx и docx это обычные zip-архивы, а распаковка
 * есть в самом браузере (DecompressionStream). Только для PDF подключается
 * pdf.js, и то лениво — если PDF никто не загрузит, он не скачается.
 */

const RecognizeFiles = {

    PDFJS_URL: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    PDFJS_WORKER: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',

    /** Что показывать в диалоге выбора файла. */
    ACCEPT: '.jpg,.jpeg,.png,.webp,.gif,.pdf,.xlsx,.xls,.docx,.html,.htm,.txt,image/*',

    /**
     * Предел строк при разборе таблиц.
     *
     * Смета монтажника — это десятки, максимум сотни строк. Предел защищает
     * от случайной загрузки чего-то вроде прайс-листа целиком: на нём разбор
     * занимает полторы минуты и даёт почти два мегабайта текста, который
     * всё равно незачем отправлять на распознавание.
     */
    MAX_ROWS: 3000,

    /** Опознание по расширению: MIME у офисных файлов часто пустой или врёт. */
    kindOf(file) {
        const n = (file.name || '').toLowerCase();
        if (/\.(jpe?g|png|webp|gif|bmp)$/.test(n) || (file.type || '').startsWith('image/')) return 'image';
        if (/\.pdf$/.test(n)) return 'pdf';
        if (/\.xlsx?$/.test(n)) return 'xlsx';
        if (/\.docx$/.test(n)) return 'docx';
        if (/\.html?$/.test(n)) return 'html';
        if (/\.txt$/.test(n)) return 'text';
        return null;
    },

    // ======================================================================
    // Минимальное чтение ZIP
    // ======================================================================

    /**
     * Извлечение одной записи из zip по имени.
     *
     * Читаем «с конца»: сначала End of Central Directory, затем каталог
     * записей, и только потом нужные данные. Так не приходится разбирать
     * весь архив — в xlsx с картинками это были бы лишние десятки мегабайт.
     */
    async zipEntries(buf) {
        const dv = new DataView(buf);
        const u8 = new Uint8Array(buf);

        // EOCD ищем с конца: его сигнатура 0x06054b50, хвост максимум 64 КБ.
        let eocd = -1;
        for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65558); i--) {
            if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
        }
        if (eocd < 0) throw new Error('это не zip-архив');

        const count = dv.getUint16(eocd + 10, true);
        let p = dv.getUint32(eocd + 16, true);

        const entries = {};
        for (let i = 0; i < count; i++) {
            if (dv.getUint32(p, true) !== 0x02014b50) break;
            const method = dv.getUint16(p + 10, true);
            const compSize = dv.getUint32(p + 20, true);
            const nameLen = dv.getUint16(p + 28, true);
            const extraLen = dv.getUint16(p + 30, true);
            const commLen = dv.getUint16(p + 32, true);
            const localOff = dv.getUint32(p + 42, true);
            const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen));
            entries[name] = { method, compSize, localOff };
            p += 46 + nameLen + extraLen + commLen;
        }
        return { dv, u8, entries };
    },

    async zipRead(zip, name) {
        const e = zip.entries[name];
        if (!e) return null;

        // В локальном заголовке своя длина имени и «extra» — берём оттуда,
        // в центральном каталоге они могут отличаться.
        const nameLen = zip.dv.getUint16(e.localOff + 26, true);
        const extraLen = zip.dv.getUint16(e.localOff + 28, true);
        const start = e.localOff + 30 + nameLen + extraLen;
        const data = zip.u8.subarray(start, start + e.compSize);

        if (e.method === 0) return new TextDecoder().decode(data);
        if (e.method !== 8) throw new Error('неизвестное сжатие в архиве');

        const ds = new DecompressionStream('deflate-raw');
        const stream = new Blob([data]).stream().pipeThrough(ds);
        return await new Response(stream).text();
    },

    // ======================================================================
    // Excel
    // ======================================================================

    async fromXlsx(buf) {
        const zip = await this.zipEntries(buf);

        // Текст ячеек в xlsx вынесен в отдельную таблицу общих строк.
        const shared = [];
        const ssXml = await this.zipRead(zip, 'xl/sharedStrings.xml');
        if (ssXml) {
            for (const si of ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
                const parts = [...si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]);
                shared.push(this.unesc(parts.join('')));
            }
        }

        const names = Object.keys(zip.entries)
            .filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
            .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));

        const lines = [];
        let truncated = false;
        for (const n of names) {
            if (lines.length >= this.MAX_ROWS) { truncated = true; break; }
            const xml = await this.zipRead(zip, n);
            if (!xml) continue;
            for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
                if (lines.length >= this.MAX_ROWS) { truncated = true; break; }
                const cells = [];
                // Шаблон намеренно простой. Вариант с необязательной группой
                // внутри `[^>]*?…[^>]*` уходил в катастрофический откат:
                // разбор большого файла не укладывался и в две минуты.
                for (const c of r[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
                    const m = c[2].match(/<v>([\s\S]*?)<\/v>/);
                    if (!m) continue;
                    const isStr = c[1].includes('t="s"');
                    cells.push(isStr ? (shared[+m[1]] ?? '') : m[1]);
                }
                const line = cells.filter(x => String(x).trim() !== '').join(' | ');
                if (line.trim()) lines.push(line);
            }
        }
        if (truncated) {
            lines.push(`[файл обрезан: показаны первые ${this.MAX_ROWS} строк]`);
        }
        return lines.join('\n');
    },

    // ======================================================================
    // Word
    // ======================================================================

    async fromDocx(buf) {
        const zip = await this.zipEntries(buf);
        const xml = await this.zipRead(zip, 'word/document.xml');
        if (!xml) throw new Error('в файле нет word/document.xml');

        return xml
            // Разрывы абзацев и строк должны стать переводами строки, иначе
            // весь документ слипнется в одну строку и разбор развалится.
            .replace(/<\/w:p>/g, '\n')
            .replace(/<w:br[^>]*\/>/g, '\n')
            .replace(/<w:tab[^>]*\/>/g, ' | ')
            .replace(/<[^>]+>/g, '')
            .split('\n').map(s => this.unesc(s).trim()).filter(Boolean).join('\n');
    },

    // ======================================================================
    // HTML и обычный текст
    // ======================================================================

    fromHtml(str) {
        const doc = new DOMParser().parseFromString(str, 'text/html');
        doc.querySelectorAll('script, style').forEach(e => e.remove());
        // Ячейки таблиц разделяем вертикальной чертой: смета почти всегда
        // таблица, и без разделителя колонки склеиваются.
        doc.querySelectorAll('td, th').forEach(e => { e.textContent = e.textContent + ' | '; });
        return (doc.body ? doc.body.innerText || doc.body.textContent : '')
            .split('\n').map(s => s.replace(/\s+/g, ' ').replace(/\s*\|\s*$/, '').trim())
            .filter(Boolean).join('\n');
    },

    // ======================================================================
    // PDF
    // ======================================================================

    async loadPdfJs() {
        if (window.pdfjsLib) return window.pdfjsLib;
        await new Promise((ok, err) => {
            const s = document.createElement('script');
            s.src = this.PDFJS_URL;
            s.onload = ok;
            s.onerror = () => err(new Error('не удалось загрузить pdf.js'));
            document.head.appendChild(s);
        });
        if (!window.pdfjsLib) throw new Error('pdf.js не инициализировался');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = this.PDFJS_WORKER;
        return window.pdfjsLib;
    },

    /**
     * PDF бывает двух видов. Если есть текстовый слой — берём текст, это
     * точно и бесплатно. Если это скан, текста не будет: страницы рисуем
     * в картинки и отправляем на обычное распознавание.
     */
    async fromPdf(buf, onProgress) {
        const pdfjs = await this.loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;

        const maxPages = Math.min(pdf.numPages, 10);
        let text = '';
        for (let i = 1; i <= maxPages; i++) {
            if (onProgress) onProgress(`читаю страницу ${i} из ${maxPages}`);
            const page = await pdf.getPage(i);
            const c = await page.getTextContent();
            text += c.items.map(t => t.str).join(' ') + '\n';
        }

        // Порог опытный: у настоящей сметы текста заведомо больше, а у скана
        // попадаются одиночные символы из штампов и колонтитулов.
        if (text.replace(/\s/g, '').length > 200) {
            return { text: text.trim(), images: [] };
        }

        const images = [];
        const scanPages = Math.min(pdf.numPages, 3);
        for (let i = 1; i <= scanPages; i++) {
            if (onProgress) onProgress(`страница ${i} из ${scanPages}: текста нет, готовлю изображение`);
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            images.push(RecognizeFiles.shrink(canvas));
        }
        return { text: '', images };
    },

    /** Ужимание до 1600px — тот же предел, что и для фотографий. */
    shrink(canvas) {
        const max = 1600;
        const k = Math.min(1, max / Math.max(canvas.width, canvas.height));
        if (k === 1) return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        const c2 = document.createElement('canvas');
        c2.width = Math.round(canvas.width * k);
        c2.height = Math.round(canvas.height * k);
        c2.getContext('2d').drawImage(canvas, 0, 0, c2.width, c2.height);
        return c2.toDataURL('image/jpeg', 0.85).split(',')[1];
    },

    unesc(s) {
        return String(s)
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&');
    },

    // ======================================================================
    // Точка входа
    // ======================================================================

    /**
     * Возвращает { kind, text, images }.
     * text — если удалось достать текст, images — если пришлось рисовать.
     */
    async extract(file, onProgress) {
        const kind = this.kindOf(file);
        if (!kind) throw new Error('Формат не поддерживается: ' + (file.name || ''));

        if (kind === 'image') return { kind, text: '', images: [] };   // обработает вызывающий

        if (onProgress) onProgress('читаю файл');

        if (kind === 'html' || kind === 'text') {
            const str = await file.text();
            const text = kind === 'html' ? this.fromHtml(str) : str;
            return { kind, text: text.trim(), images: [] };
        }

        const buf = await file.arrayBuffer();

        if (kind === 'xlsx') return { kind, text: (await this.fromXlsx(buf)).trim(), images: [] };
        if (kind === 'docx') return { kind, text: (await this.fromDocx(buf)).trim(), images: [] };
        if (kind === 'pdf') {
            const r = await this.fromPdf(buf, onProgress);
            return { kind, text: r.text, images: r.images };
        }
        throw new Error('Формат не поддерживается');
    },
};

window.RecognizeFiles = RecognizeFiles;
