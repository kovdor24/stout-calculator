/**
 * excel_export.js — выгрузка сметы в Excel (.xlsx).
 *
 * Файл собирается прямо в браузере, без сторонних библиотек: .xlsx — это обычный
 * zip с несколькими XML внутри, и всё, что для него нужно, — писатель zip без
 * сжатия (метод store) и разметка листа. Библиотека на мегабайт с CDN ради этого
 * не подключается: калькулятор открывают на объекте, где связи может не быть,
 * а выгрузка должна работать так же, как работает печать.
 *
 * Источник данных — не state, а уже собранная печатная вёрстка (#print_bin,
 * см. prepareForPrint в app.js). Из неё же делается PDF, поэтому Excel получает
 * ровно ту смету, что уходит на печать: те же разделы, те же строки, те же
 * скидки и группировки. Дублировать логику сметы не приходится — правки render()
 * приезжают в Excel сами.
 *
 * Не переносятся: фотографии позиций и гидравлическая схема (картинки в таблице
 * Excel мешают редактировать, а схема — векторная графика на весь лист).
 */
(function () {
    'use strict';

    // ==========================================================
    //  ZIP (store, без сжатия)
    // ==========================================================

    const CRC_TABLE = (function () {
        const t = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[i] = c >>> 0;
        }
        return t;
    })();

    function crc32(buf) {
        let c = 0xFFFFFFFF;
        for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    /**
     * Складывает файлы в zip-архив. Сжатие не применяем: смета — это десятки
     * килобайт XML, экономия не стоит возни с deflate, а распаковывает такой
     * архив кто угодно, включая Excel и «Google Таблицы».
     */
    function zipStore(files) {
        const enc = new TextEncoder();
        const chunks = [];
        const central = [];
        let offset = 0;

        files.forEach(function (f) {
            const nameBytes = enc.encode(f.name);
            const data = enc.encode(f.data);
            const crc = crc32(data);

            const local = new Uint8Array(30 + nameBytes.length);
            const dv = new DataView(local.buffer);
            dv.setUint32(0, 0x04034b50, true);
            dv.setUint16(4, 20, true);       // версия, необходимая для распаковки
            dv.setUint16(6, 0x0800, true);   // флаг «имена файлов в UTF-8»
            dv.setUint16(8, 0, true);        // метод: без сжатия
            dv.setUint16(10, 0, true);       // время
            dv.setUint16(12, 0x21, true);    // дата 01.01.1980 (нулевая дата недопустима)
            dv.setUint32(14, crc, true);
            dv.setUint32(18, data.length, true);
            dv.setUint32(22, data.length, true);
            dv.setUint16(26, nameBytes.length, true);
            dv.setUint16(28, 0, true);
            local.set(nameBytes, 30);

            chunks.push(local, data);

            const cd = new Uint8Array(46 + nameBytes.length);
            const cdv = new DataView(cd.buffer);
            cdv.setUint32(0, 0x02014b50, true);
            cdv.setUint16(4, 20, true);
            cdv.setUint16(6, 20, true);
            cdv.setUint16(8, 0x0800, true);
            cdv.setUint16(10, 0, true);
            cdv.setUint16(12, 0, true);
            cdv.setUint16(14, 0x21, true);
            cdv.setUint32(16, crc, true);
            cdv.setUint32(20, data.length, true);
            cdv.setUint32(24, data.length, true);
            cdv.setUint16(28, nameBytes.length, true);
            cdv.setUint32(42, offset, true);
            cd.set(nameBytes, 46);
            central.push(cd);

            offset += local.length + data.length;
        });

        let centralSize = 0;
        central.forEach(function (c) { centralSize += c.length; });

        const end = new Uint8Array(22);
        const edv = new DataView(end.buffer);
        edv.setUint32(0, 0x06054b50, true);
        edv.setUint16(8, files.length, true);
        edv.setUint16(10, files.length, true);
        edv.setUint32(12, centralSize, true);
        edv.setUint32(16, offset, true);

        return new Blob(chunks.concat(central, [end]), {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    // ==========================================================
    //  XLSX
    // ==========================================================

    function esc(s) {
        return String(s)
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function colLetter(n) {
        let s = '';
        while (n > 0) {
            const m = (n - 1) % 26;
            s = String.fromCharCode(65 + m) + s;
            n = (n - m - 1) / 26;
        }
        return s;
    }

    // Номера стилей из cellXfs. Порядок менять только вместе с stylesXml.
    const S = {
        def: 0,
        banner: 1,    // цветная полоса с названием компании
        gray: 2,      // мелкий серый текст (адрес, параметры объекта, подписи)
        title: 3,     // «Смета № … от …»
        th: 4,        // заголовок колонки
        thLeft: 5,
        td: 6,        // ячейка позиции
        tdC: 7,
        qty: 8,
        money: 9,
        sec: 10,      // строка раздела
        grp: 11,      // строка группы
        grpMoney: 12,
        sub: 13,      // «Итого» по разделу
        subMoney: 14,
        total: 15,    // итог документа
        totalMoney: 16,
        idx: 17,      // номер позиции
        small: 18,    // подписи под линиями («подпись», «расшифровка»)
        underline: 19,// сумма прописью — с чертой снизу
        line: 20,     // пустая линия для подписи
        bold: 21,     // жирный текст вне таблицы
        wrap: 22      // многострочный текст (реквизиты поставщика)
    };

    function stylesXml(primary, primaryLight) {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            + '<numFmts count="2">'
            + '<numFmt numFmtId="164" formatCode="#,##0.00"/>'
            + '<numFmt numFmtId="165" formatCode="#,##0.###"/>'
            + '</numFmts>'
            + '<fonts count="9">'
            + '<font><sz val="10"/><name val="Arial"/></font>'
            + '<font><b/><sz val="10"/><name val="Arial"/></font>'
            + '<font><b/><sz val="14"/><name val="Arial"/></font>'
            + '<font><sz val="9"/><color rgb="FF6B7280"/><name val="Arial"/></font>'
            + '<font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>'
            + '<font><b/><sz val="10"/><color rgb="FF1E3A8A"/><name val="Arial"/></font>'
            + '<font><b/><sz val="11"/><name val="Arial"/></font>'
            + '<font><sz val="8"/><color rgb="FF9CA3AF"/><name val="Arial"/></font>'
            + '<font><b/><sz val="10"/><color rgb="' + primary + '"/><name val="Arial"/></font>'
            + '</fonts>'
            + '<fills count="6">'
            + '<fill><patternFill patternType="none"/></fill>'
            + '<fill><patternFill patternType="gray125"/></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="' + primary + '"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="' + primaryLight + '"/><bgColor indexed="64"/></patternFill></fill>'
            + '<fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>'
            + '</fills>'
            // Сетка у образца сплошная и тонкая, поэтому основная рамка — коробка со
            // всех четырёх сторон; отдельные линии нужны только для подписей.
            + '<borders count="4">'
            + '<border><left/><right/><top/><bottom/><diagonal/></border>'
            + '<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>'
            + '<border><left/><right/><top/><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>'
            + '<border><left/><right/><top style="thin"><color rgb="FF000000"/></top><bottom/><diagonal/></border>'
            + '</borders>'
            + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            + '<cellXfs count="23">'
            /* 0  def       */ + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="0" applyAlignment="1"><alignment vertical="center"/></xf>'
            /* 1  banner    */ + '<xf xfId="0" numFmtId="0" fontId="4" fillId="2" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
            /* 2  gray      */ + '<xf xfId="0" numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
            /* 3  title     */ + '<xf xfId="0" numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
            /* 4  th        */ + '<xf xfId="0" numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
            /* 5  thLeft    */ + '<xf xfId="0" numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
            /* 6  td        */ + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>'
            /* 7  tdC       */ + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
            /* 8  qty       */ + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            /* 9  money     */ + '<xf xfId="0" numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            /* 10 sec       */ + '<xf xfId="0" numFmtId="0" fontId="8" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
            /* 11 grp       */ + '<xf xfId="0" numFmtId="0" fontId="5" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
            /* 12 grpMoney  */ + '<xf xfId="0" numFmtId="164" fontId="5" fillId="5" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            /* 13 sub       */ + '<xf xfId="0" numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'
            /* 14 subMoney  */ + '<xf xfId="0" numFmtId="164" fontId="1" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            /* 15 total     */ + '<xf xfId="0" numFmtId="0" fontId="6" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'
            /* 16 totalMoney*/ + '<xf xfId="0" numFmtId="164" fontId="6" fillId="0" borderId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>'
            /* 17 idx       */ + '<xf xfId="0" numFmtId="1" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            /* 18 small     */ + '<xf xfId="0" numFmtId="0" fontId="7" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>'
            /* 19 underline */ + '<xf xfId="0" numFmtId="0" fontId="1" fillId="0" borderId="2" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
            /* 20 line      */ + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="2" applyBorder="1"/>'
            /* 21 bold      */ + '<xf xfId="0" numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
            /* 22 wrap      */ + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="0" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>'
            + '</cellXfs>'
            + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
            + '</styleSheet>';
    }

    // Имя листа: Excel не принимает []:*?/\ и длину больше 31 символа
    function sheetName(name) {
        return String(name || 'Лист').replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31);
    }

    /**
     * Лист: { name, cols: [ширина...], freeze, rows: [ { h?, cells: [ячейка|null...] } ] }
     * Ячейка: { v, t: 's'|'n', s: номер стиля, span?: сколько колонок объединить }
     */
    function sheetXml(sheet) {
        const nCols = sheet.cols.length || 1;
        const merges = [];
        let body = '';

        sheet.rows.forEach(function (row, ri) {
            const r = ri + 1;
            let cellsXml = '';
            // Перебор именно по числу колонок, а не forEach по массиву: ниже мы
            // дописываем в него пустые ячейки под объединение, а forEach уже
            // добавленные за концом элементы не увидел бы.
            row.cells = row.cells || [];
            for (let ci = 0; ci < nCols; ci++) {
                const cell = row.cells[ci];
                if (!cell) continue;
                const ref = colLetter(ci + 1) + r;
                const span = Math.min(cell.span || 1, nCols - ci);
                if (span > 1) {
                    merges.push(ref + ':' + colLetter(ci + span) + r);
                    // Рамку объединённой ячейки Excel рисует по каждой ячейке диапазона,
                    // а не по всей области: без пустых ячеек с тем же стилем линия
                    // обрывалась на первой колонке.
                    for (let k = 1; k < span; k++) {
                        row.cells[ci + k] = row.cells[ci + k] || { v: '', t: 's', s: cell.s || 0 };
                    }
                }
                if (cell.runs) {
                    // Строка с жирным началом («Поставщик: ООО …») — как в бумажном счёте
                    const runs = cell.runs.map(function (run) {
                        const pr = run.b
                            ? '<rPr><b/><sz val="10"/><rFont val="Arial"/></rPr>'
                            : '<rPr><sz val="10"/><rFont val="Arial"/></rPr>';
                        return '<r>' + pr + '<t xml:space="preserve">' + esc(run.t) + '</t></r>';
                    }).join('');
                    cellsXml += '<c r="' + ref + '" s="' + (cell.s || 0) + '" t="inlineStr"><is>' + runs + '</is></c>';
                } else if (cell.t === 'n') {
                    cellsXml += '<c r="' + ref + '" s="' + (cell.s || 0) + '"><v>' + cell.v + '</v></c>';
                } else if (cell.v === '' || cell.v === null || cell.v === undefined) {
                    cellsXml += '<c r="' + ref + '" s="' + (cell.s || 0) + '"/>';
                } else {
                    cellsXml += '<c r="' + ref + '" s="' + (cell.s || 0) + '" t="inlineStr"><is><t xml:space="preserve">'
                        + esc(cell.v) + '</t></is></c>';
                }
            }
            body += '<row r="' + r + '"' + (row.h ? ' ht="' + row.h + '" customHeight="1"' : '') + '>' + cellsXml + '</row>';
        });

        let cols = '';
        sheet.cols.forEach(function (w, i) {
            cols += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>';
        });

        // Шапку таблицы закрепляем: смета длинная, без этого на третьем экране уже
        // не видно, что за колонка перед тобой.
        const freeze = sheet.freeze
            ? '<sheetView showGridLines="0" workbookViewId="0"><pane ySplit="' + sheet.freeze
              + '" topLeftCell="A' + (sheet.freeze + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView>'
            : '<sheetView showGridLines="0" workbookViewId="0"/>';

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            + '<sheetViews>' + freeze + '</sheetViews>'
            + '<sheetFormatPr defaultRowHeight="14"/>'
            + (cols ? '<cols>' + cols + '</cols>' : '')
            + '<sheetData>' + body + '</sheetData>'
            + (merges.length
                ? '<mergeCells count="' + merges.length + '">'
                  + merges.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join('')
                  + '</mergeCells>'
                : '')
            + '<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>'
            + '<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>'
            + '</worksheet>';
    }

    function buildWorkbook(sheets, primary, primaryLight) {
        const files = [];

        let types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            + '<Default Extension="xml" ContentType="application/xml"/>'
            + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
        let sheetsXml = '';
        let rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';

        sheets.forEach(function (sheet, i) {
            const n = i + 1;
            types += '<Override PartName="/xl/worksheets/sheet' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
            sheetsXml += '<sheet name="' + esc(sheetName(sheet.name)) + '" sheetId="' + n + '" r:id="rId' + n + '"/>';
            rels += '<Relationship Id="rId' + n + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + n + '.xml"/>';
            files.push({ name: 'xl/worksheets/sheet' + n + '.xml', data: sheetXml(sheet) });
        });
        types += '</Types>';
        rels += '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            + '</Relationships>';

        files.unshift(
            { name: '[Content_Types].xml', data: types },
            {
                name: '_rels/.rels',
                data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                    + '</Relationships>'
            },
            {
                name: 'xl/workbook.xml',
                data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
                    + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                    + '<sheets>' + sheetsXml + '</sheets></workbook>'
            },
            { name: 'xl/_rels/workbook.xml.rels', data: rels },
            { name: 'xl/styles.xml', data: stylesXml(primary, primaryLight) }
        );

        return zipStore(files);
    }

    // ==========================================================
    //  Чтение печатной вёрстки (#print_bin)
    // ==========================================================

    const COL_CLASSES = ['col-idx', 'col-img', 'col-name', 'col-sku', 'col-brand', 'col-unit', 'col-qty', 'col-price', 'col-sum'];

    // Что в Excel не едет: служебные кнопки, подсказки, значки замены.
    const JUNK = '.no-print, .opt-btn, .qty-step, .swap-inline-btn, .eq-badge, .work-del-btn,'
        + ' .port-tag, .tooltip-wrapper, .info-icon, .rec-sel-chk, .img-wrap, button, svg, .btn-add-custom';

    function isHidden(el) {
        if (!el) return true;
        if (el.classList && (el.classList.contains('no-print') || el.classList.contains('hidden-col'))) return true;
        return !!(el.style && el.style.display === 'none');
    }

    /**
     * Текст элемента без служебной обвязки. innerText здесь не годится: #print_bin
     * скрыт от экрана, и браузер возвращает из него склеенный textContent — поэтому
     * границы блоков расставляем сами.
     */
    function readText(el, sep) {
        if (!el) return '';
        sep = sep || ' ';
        const c = el.cloneNode(true);
        c.querySelectorAll(JUNK).forEach(function (n) { n.remove(); });
        // Количество и цена у распознанных позиций правятся полем ввода — значение
        // лежит в самом поле, текста в ячейке нет.
        c.querySelectorAll('input').forEach(function (inp) {
            const span = document.createElement('span');
            span.textContent = (inp.type === 'checkbox') ? '' : (inp.value || inp.getAttribute('value') || '');
            inp.parentNode.replaceChild(span, inp);
        });

        const BLOCK = /^(DIV|P|LI|TR|SECTION|H1|H2|H3|H4|H5|TABLE|TBODY|THEAD|HR)$/;
        let out = '';
        (function walk(node) {
            node.childNodes.forEach(function (ch) {
                if (ch.nodeType === 3) { out += ch.nodeValue; return; }
                if (ch.nodeType !== 1) return;
                if (isHidden(ch)) return;
                if (ch.tagName === 'BR') { out += '\u0001'; return; }
                // .param-item — строка параметров объекта: это соседние <span>, и без
                // явной границы «Объект: 150 м²» и «Регион: Москва» слипаются в одно слово.
                const block = BLOCK.test(ch.tagName)
                    || (ch.classList && ch.classList.contains('param-item'));
                if (block) out += '\u0001';
                walk(ch);
                if (block) out += '\u0001';
            });
        })(c);

        return out.replace(/[\u00A0\u202F]/g, ' ')
            .split('\u0001')
            .map(function (s) { return s.replace(/\s+/g, ' ').trim(); })
            .filter(Boolean)
            .join(sep);
    }

    // «12 500 ₽» → 12500, «1,5» → 1.5, «1 шт» → null (останется текстом)
    function num(s) {
        if (s === null || s === undefined || s === '') return null;
        const cleaned = String(s).replace(/[\s\u00A0\u202F]/g, '').replace(/[₽]|руб\.?/gi, '').replace(',', '.');
        if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
        return parseFloat(cleaned);
    }

    /**
     * Разбор таблицы сметы. Колонки берём из шапки (скрытые — «Артикул» при
     * выключенных артикулах, «Бренд» и «Фото» на листе работ — пропускаем),
     * ячейки строк раскладываем по колонкам через их классы, а безымянные
     * (заголовок раздела, «Итого») растягиваем до следующей занятой колонки.
     */
    function readTable(table) {
        const cols = [];
        Array.from(table.querySelectorAll('thead th')).forEach(function (th) {
            if (isHidden(th)) return;
            const title = readText(th);
            if (/^фото$/i.test(title)) return;   // картинки в Excel не переносим
            cols.push({
                cls: COL_CLASSES.find(function (c) { return th.classList.contains(c); }) || null,
                title: title
            });
        });
        if (!cols.length) return null;

        const idxByCls = {};
        cols.forEach(function (c, i) { if (c.cls) idxByCls[c.cls] = i; });

        const rows = [];
        Array.from(table.querySelectorAll('tbody tr')).forEach(function (tr) {
            if (isHidden(tr)) return;
            if (tr.classList.contains('group-warn-row') || tr.classList.contains('empty-state-row')
                || tr.classList.contains('scheme-row')) return;

            const placed = [];
            let cur = 0;
            Array.from(tr.children).forEach(function (td) {
                if (isHidden(td)) return;
                const cls = COL_CLASSES.find(function (c) { return td.classList.contains(c); }) || null;
                if (cls && idxByCls[cls] === undefined) return;      // колонка не выгружается
                let at = cls ? idxByCls[cls] : cur;
                if (at < cur) at = cur;
                placed.push({ at: at, cls: cls, td: td });
                cur = at + 1;
            });
            if (!placed.length) return;

            const cells = new Array(cols.length).fill(null);
            placed.forEach(function (p, i) {
                const next = (i + 1 < placed.length) ? placed[i + 1].at : cols.length;
                cells[p.at] = {
                    text: readText(p.td),
                    span: Math.max(1, next - p.at),
                    cls: p.cls
                };
            });

            let kind = 'item';
            if (tr.classList.contains('row-sec')) kind = 'section';
            else if (tr.classList.contains('row-subtotal')) kind = 'subtotal';
            else if (tr.classList.contains('group-header')) kind = 'group';
            if (kind === 'item' && placed.length === 1 && cols.length > 1) kind = 'wide';

            if (cells.every(function (c) { return !c || !c.text; })) return;   // пустая строка
            rows.push({ kind: kind, cells: cells });
        });

        return { cols: cols, rows: rows };
    }

    // Стиль ячейки строки-позиции — по классу колонки
    function itemStyle(cls) {
        if (cls === 'col-idx') return S.idx;
        if (cls === 'col-qty') return S.qty;
        if (cls === 'col-price' || cls === 'col-sum') return S.money;
        if (cls === 'col-brand' || cls === 'col-unit' || cls === 'col-sku') return S.tdC;
        return S.td;
    }

    function headStyle(cls) {
        return cls === 'col-name' ? S.thLeft : S.th;
    }

    // Ширина колонки в Excel: под содержимое, но в разумных границах
    function colWidth(cls, samples) {
        let max = 8;
        samples.forEach(function (s) { if (s && s.length > max) max = s.length; });
        if (cls === 'col-idx') return 5;
        if (cls === 'col-qty' || cls === 'col-unit') return 8;
        if (cls === 'col-brand') return 11;
        if (cls === 'col-sku') return 18;
        if (cls === 'col-price' || cls === 'col-sum') return 13;
        return Math.max(30, Math.min(Math.round(max * 1.05), 60));
    }

    const UNITS = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const UNITS_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
        'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    function plural(n, one, two, five) {
        const n10 = n % 10, n100 = n % 100;
        if (n100 >= 11 && n100 <= 14) return five;
        if (n10 === 1) return one;
        if (n10 >= 2 && n10 <= 4) return two;
        return five;
    }

    // Триада числа словами (до 999)
    function triadWords(num3, female) {
        const words = [];
        const h = Math.floor(num3 / 100);
        const t = Math.floor((num3 % 100) / 10);
        const u = num3 % 10;
        if (h) words.push(HUNDREDS[h]);
        if (t === 1) {
            words.push(TEENS[u]);
        } else {
            if (t) words.push(TENS[t]);
            if (u) words.push((female ? UNITS_F : UNITS)[u]);
        }
        return words;
    }

    /**
     * Сумма прописью — как в бумажном счёте: «Сто две тысячи рублей 00 копеек».
     * Копейки цифрами, первая буква заглавная.
     */
    function rublesInWords(value) {
        const total = Math.round(Math.abs(value || 0) * 100);
        const rub = Math.floor(total / 100);
        const kop = total % 100;

        const groups = [
            { div: 1e9, female: false, forms: ['миллиард', 'миллиарда', 'миллиардов'] },
            { div: 1e6, female: false, forms: ['миллион', 'миллиона', 'миллионов'] },
            { div: 1e3, female: true, forms: ['тысяча', 'тысячи', 'тысяч'] }
        ];

        let rest = rub;
        let words = [];
        groups.forEach(function (g) {
            const cnt = Math.floor(rest / g.div);
            rest = rest % g.div;
            if (!cnt) return;
            words = words.concat(triadWords(cnt, g.female));
            words.push(plural(cnt, g.forms[0], g.forms[1], g.forms[2]));
        });
        if (rest || !words.length) words = words.concat(triadWords(rest, false));
        words.push(plural(rub, 'рубль', 'рубля', 'рублей'));

        let text = words.filter(Boolean).join(' ');
        text = text.charAt(0).toUpperCase() + text.slice(1);
        return text + ' ' + (kop < 10 ? '0' + kop : kop) + ' ' + plural(kop, 'копейка', 'копейки', 'копеек');
    }

    /** Строка «Итого: 123 456 ₽» → подпись слева, число в последней колонке */
    function splitTotal(text) {
        const m = String(text).match(/^(.*?)([\d\s\u00A0\u202F.,]+)\s*[₽]?\s*$/);
        if (!m) return { label: text, value: null };
        const value = num(m[2]);
        return value === null ? { label: text, value: null } : { label: m[1].replace(/[:\s]+$/, ''), value: value };
    }

    /**
     * Один печатный лист (#print_eq_clone / #print_works_clone / таблица
     * теплопотерь) → один лист книги.
     */
    function sheetFromNode(node, name) {
        const table = node.querySelector('.inv-table') || node.querySelector('table');
        const data = table ? readTable(table) : null;
        if (!data || !data.rows.length) return null;

        const cols = data.cols;
        const n = cols.length;
        const rows = [];
        const wide = function (text, style, h) {
            if (!text) return;
            rows.push({ h: h, cells: [{ v: text, t: 's', s: style, span: n }] });
        };
        // Ширина листа в знаках — по ней прикидываем, во сколько строк ляжет
        // длинный текст реквизитов (у объединённой ячейки высота сама не подбирается).
        const sheetChars = cols.reduce(function (a, c) { return a + colWidth(c.cls, [c.title]); }, 0);

        // Строка вида «Поставщик: ООО …»: подпись жирная, значение обычное
        const labelled = function (label, value, h) {
            if (!value) return;
            const text = label + ' ' + value;
            const lines = Math.max(1, Math.ceil(text.length / Math.max(20, sheetChars - 4)));
            rows.push({
                h: lines > 1 ? lines * 12 + 3 : h,
                cells: [{
                    runs: [{ t: label + ' ', b: true }, { t: value }],
                    s: lines > 1 ? S.wrap : S.def,
                    span: n
                }]
            });
        };
        const blank = function (h) { rows.push({ h: h, cells: [] }); };

        // --- шапка документа ---
        // Вместо картинок-баннеров, как в бумажном счёте, — цветная полоса с
        // названием компании и серая строка контактов под ней. Рисуется ячейками,
        // поэтому в файле нет ни одной картинки и он остаётся лёгким.
        const hdr = node.querySelector('.print-header');
        if (hdr) {
            // «ЦЕНТРАЛЬНЫЙ ОФИС:» и «РЕКВИЗИТЫ БАНКА:» — подписи блоков печатного бланка,
            // в строке реквизитов они лишние.
            const dropLabel = function (s) { return String(s || '').replace(/^[^:]{3,30}:,?\s*/, ''); };
            const compName = readText(hdr.querySelector('#hdr_comp_name'));
            const compWeb = readText(hdr.querySelector('#hdr_comp_web'));
            const compAddr = dropLabel(readText(hdr.querySelector('#hdr_comp_addr'), ', '));
            const compBank = dropLabel(readText(hdr.querySelector('#hdr_comp_bank'), ', '));

            rows.push({
                h: 30,
                cells: [{ v: '  ' + (compName || 'Смета'), t: 's', s: S.banner, span: n }]
            });
            wide([compAddr, compWeb].filter(Boolean).join('   ·   '), S.gray, 16);
            blank(6);
            labelled('Поставщик:', [compName, compBank].filter(Boolean).join(', '), 15);

            const master = hdr.querySelector('#print_master_contacts');
            if (master && master.style.display !== 'none') {
                labelled('Расчёт произвёл:', readText(master).replace(/^Расчёт произвёл:\s*/i, ''), 15);
            }
            blank(6);
        }

        // --- заголовок документа: «Смета № … от …», как «Счет на оплату № … от …» ---
        const titleEl = node.querySelector('#project_name_edit');
        const projectName = readText(titleEl) || (window.app && app.state ? app.state.projectName : '') || 'Смета';
        const calcId = (window.app && app.state && app.state.calc_id) ? app.state.calc_id : '';
        const today = new Date().toLocaleDateString('ru-RU');
        rows.push({
            h: 24,
            cells: [{
                v: 'Смета' + (calcId ? ' № ' + calcId : '') + ' от ' + today,
                t: 's', s: S.title, span: n
            }]
        });
        labelled('Объект:', projectName + (name ? '. ' + name : ''), 15);
        wide(readText(node.querySelector('#doc_summary'), ' · '), S.gray, 15);
        blank(6);

        // --- шапка таблицы ---
        rows.push({
            h: 26,
            cells: cols.map(function (c) {
                return { v: c.title, t: 's', s: headStyle(c.cls) };
            })
        });
        const freeze = rows.length;

        // --- строки сметы ---
        const samples = cols.map(function () { return []; });
        let itemCount = 0;
        data.rows.forEach(function (r) {
            if (r.kind === 'item') itemCount++;
            const cells = new Array(n).fill(null);
            r.cells.forEach(function (c, i) {
                if (!c) return;
                samples[i].push(c.text);

                if (r.kind === 'section' || r.kind === 'wide') {
                    cells[i] = { v: c.text, t: 's', s: r.kind === 'section' ? S.sec : S.td, span: c.span };
                    return;
                }
                if (r.kind === 'group') {
                    const v = num(c.text);
                    const money = (c.cls === 'col-price' || c.cls === 'col-sum');
                    // Стрелка сворачивания группы — часть интерфейса, в файле она ни о чём
                    const text = c.text.replace(/^[▶▼►⤴⤵↳↴\s]+/, '');
                    cells[i] = (v !== null && money)
                        ? { v: v, t: 'n', s: S.grpMoney, span: c.span }
                        : { v: text, t: 's', s: S.grp, span: c.span };
                    return;
                }
                if (r.kind === 'subtotal') {
                    const parts = splitTotal(c.text);
                    if (parts.value !== null && n > 1) {
                        cells[i] = { v: parts.label, t: 's', s: S.sub, span: Math.max(1, n - 1) };
                        cells[n - 1] = { v: parts.value, t: 'n', s: S.subMoney };
                    } else {
                        cells[i] = { v: c.text, t: 's', s: S.sub, span: c.span };
                    }
                    return;
                }
                const numeric = num(c.text);
                const isNumCol = (c.cls === 'col-idx' || c.cls === 'col-qty' || c.cls === 'col-price' || c.cls === 'col-sum');
                cells[i] = (numeric !== null && isNumCol)
                    ? { v: numeric, t: 'n', s: itemStyle(c.cls), span: c.span }
                    : { v: c.text, t: 's', s: itemStyle(c.cls), span: c.span };
            });
            rows.push({ cells: cells });
        });

        // --- подвал: итог, сумма прописью и место для подписи ---
        const footer = node.querySelector('.doc-footer');
        const lbl = footer ? footer.querySelector('.total-lbl') : null;
        const val = footer ? footer.querySelector('.total-val') : null;
        const sum = (lbl && val) ? num(readText(val)) : null;

        if (lbl && val && n > 1) {
            blank(6);
            const cells = new Array(n).fill(null);
            cells[0] = { v: readText(lbl), t: 's', s: S.total, span: n - 1 };
            cells[n - 1] = (sum !== null)
                ? { v: sum, t: 'n', s: S.totalMoney }
                : { v: readText(val), t: 's', s: S.total };
            rows.push({ h: 20, cells: cells });
        }

        if (sum !== null) {
            blank(4);
            wide('Всего наименований ' + itemCount + ', на сумму '
                + sum.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' руб.',
                S.def, 15);
            // Сумма прописью с чертой — так подписывают бумажный счёт
            rows.push({ h: 16, cells: [{ v: rublesInWords(sum), t: 's', s: S.underline, span: n }] });
        }

        // Место для подписи: линия во всю ширину и подпись мелким под ней
        const masterName = readText(node.querySelector('#print_master_name'));
        const masterPhone = readText(node.querySelector('#print_master_phone'));
        if (n > 2) {
            blank(14);
            const sign = new Array(n).fill(null);
            sign[0] = { v: 'Расчёт произвёл', t: 's', s: S.bold, span: 2 };
            sign[2] = { v: '', t: 's', s: S.line, span: n - 2 };
            rows.push({ h: 18, cells: sign });

            const under = new Array(n).fill(null);
            under[2] = {
                v: [masterName, masterPhone].filter(Boolean).join(', тел. ') || 'подпись, расшифровка',
                t: 's', s: S.small, span: n - 2
            };
            rows.push({ h: 12, cells: under });
        }

        return {
            name: name,
            freeze: freeze,
            cols: cols.map(function (c, i) { return colWidth(c.cls, samples[i].concat([c.title])); }),
            rows: rows
        };
    }

    function collectSheets() {
        const bin = document.getElementById('print_bin');
        if (!bin) return [];
        const sheets = [];
        Array.from(bin.children).forEach(function (node) {
            let name = null;
            if (node.id === 'print_eq_clone') name = 'Оборудование';
            else if (node.id === 'print_works_clone') name = 'Монтажные работы';
            else if (node.id === 'heat_loss_table_page') name = 'Теплопотери';
            else return;                      // схема — только в PDF
            const sheet = sheetFromNode(node, name);
            if (sheet) sheets.push(sheet);
        });
        return sheets;
    }

    function cssColor(name, fallback) {
        let v = '';
        try {
            v = getComputedStyle(document.documentElement).getPropertyValue(name);
        } catch (e) { /* нестандартное окружение — берём запасной цвет */ }
        const m = String(v || '').trim().match(/^#?([0-9a-fA-F]{6})$/);
        return 'FF' + (m ? m[1].toUpperCase() : fallback);
    }

    function saveBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
    }

    window.ExcelExport = {
        /** Собирает книгу из уже подготовленного #print_bin и отдаёт её браузеру */
        saveFromPrintBin: function (fileName) {
            const sheets = collectSheets();
            if (!sheets.length) throw new Error('в смете нет разделов для выгрузки');
            const blob = buildWorkbook(
                sheets,
                cssColor('--primary', '2563EB'),
                cssColor('--primary-light', 'EFF6FF')
            );
            saveBlob(blob, fileName);
            return sheets.length;
        },
        // для отладки и тестов
        _internals: { collectSheets: collectSheets, buildWorkbook: buildWorkbook, readText: readText, num: num }
    };
})();
