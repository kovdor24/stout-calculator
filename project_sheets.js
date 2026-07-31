/* project_sheets.js — движок листов рабочей документации (А3, ГОСТ 21.101)
 *
 * Лист — это SVG с viewBox в миллиметрах 1:1, поэтому при печати он ложится
 * на А3 без пересчёта масштаба. Геометрия рамки, штампа и боковых граф снята
 * с реальных листов проекта 2025-191, а не выведена из ГОСТ по памяти.
 *
 * Глобальный объект: window.projectSheets
 */
(function () {
  'use strict';

  // ─── Геометрия листа А3, альбомная (мм) ────────────────────────────────
  var A3 = { w: 420, h: 297 };

  // Поле чертежа: слева 20 (поле подшивки), остальные по 5
  var FRAME = { x: 20, y: 5, w: 395, h: 287 };
  var FR = { l: FRAME.x, t: FRAME.y, r: FRAME.x + FRAME.w, b: FRAME.y + FRAME.h }; // 20 / 5 / 415 / 292

  // Основная надпись (штамп), форма 3 — 185×15 в правом нижнем углу
  var STAMP = {
    l: FR.r - 185, r: FR.r, t: FR.b - 15, b: FR.b,
    cols: [230, 240, 250, 260, 270, 285, 295],   // Изм | Кол.уч | Лист | №док | Подп | Дата
    code: 400,                                    // до сюда шифр проекта, дальше «Лист»
    sheetSplit: 7                                 // выше — подпись «Лист», ниже — номер
  };

  // Боковые графы в поле подшивки (текст повёрнут на 90°)
  var SIDE = {
    soglas: { x: 5, w: 15, t: 142, b: 207, inner: 10, rows: [152, 167, 187] },
    boxes: [
      { t: 207, b: 232, label: 'Взам. инв. №' },
      { t: 232, b: 267, label: 'Подп. и дата' },
      { t: 267, b: 292, label: 'Инв. № подл.' }
    ],
    x: 8, w: 12
  };

  var ROW_H = 5.47;        // высота строки таблицы
  var BODY_TOP = 15.6;     // верх таблицы под заголовком листа (снято с оригинала)
  var LW = { thick: 0.7, thin: 0.25, hair: 0.18 };

  // Размеры шрифта, обмеренные по PDF оригинала (мм):
  // таблицы и заголовок листа — 3.88, штамп и боковые графы — 3.53, шифр — 4.94
  var SZ = { body: 3.88, stamp: 3.53, code: 4.94 };

  // В оригинале два шрифта: ISOCPEUR (таблицы) и GOST-Common (штамп, графы).
  // Их сабсеты извлечены из PDF проекта-образца и лежат в fonts/ — страница
  // должна объявить @font-face (см. sheet_demo.html). Дальше локальные копии
  // полных шрифтов, затем свободные GOST type A/B, в конце — узкий системный.
  var FONT = "'ISOCPEUR','GOST type A','GOST type B','Arial Narrow','Liberation Sans Narrow',sans-serif";
  var FONT_STAMP = "'GOST Common','GOST-Common','ISOCPEUR','GOST type A','Arial Narrow',sans-serif";

  // Чертёжные шрифты у нас — сабсеты, вырезанные из PDF-образца: кириллица в
  // них полная, а латиница нет (нет b, u, i, j и др.). Если в строке попадётся
  // такая буква, браузер подставит её из системного шрифта — и слово выйдет
  // разнобоем. Поэтому строки с «неподдержанной» латиницей рисуем целиком
  // запасным узким шрифтом: вид ровный, стиль чертежа сохраняется.
  var FONT_LAT = "'Arial Narrow','Liberation Sans Narrow',Arial,sans-serif";
  var COV_ISOC = 'ADEFGHIKLMNOPRSTUVXZacehlmnortx';
  var COV_GOST = 'ACDEFGILMNOPRSTVWXZacefghilmnorstx';

  function fontFor(s, base) {
    s = String(s == null ? '' : s);
    if (!/[A-Za-z]/.test(s)) return base;
    var cov = (base === FONT_STAMP) ? COV_GOST : COV_ISOC;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (/[A-Za-z]/.test(c) && cov.indexOf(c) < 0) return FONT_LAT;
    }
    return base;
  }

  // ─── Примитивы ─────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function n(v) { return Math.round(v * 100) / 100; }

  function line(x1, y1, x2, y2, w) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) +
      '" stroke-width="' + (w || LW.thin) + '"/>';
  }
  function rect(x, y, w, h, sw) {
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" fill="none" stroke-width="' + (sw || LW.thin) + '"/>';
  }

  /** Текст. anchor: start|middle|end; y — базовая линия (мм); font — семейство */
  function text(x, y, s, o) {
    o = o || {};
    var a = { start: 'start', middle: 'middle', end: 'end' }[o.anchor || 'start'];
    var attrs = ' x="' + n(x) + '" y="' + n(y) + '" font-size="' + (o.size || SZ.body) +
      '" text-anchor="' + a + '"';
    if (o.rotate) attrs += ' transform="rotate(' + o.rotate + ' ' + n(x) + ' ' + n(y) + ')"';
    if (o.weight) attrs += ' font-weight="' + o.weight + '"';
    // семейство: заданное, либо запасное — если в строке есть латиница,
    // которой нет в чертёжном шрифте (иначе слово вышло бы разнобоем)
    var fam = fontFor(s, o.font || FONT);
    if (fam !== FONT) attrs += ' font-family="' + fam + '"';
    if (o.fill) attrs += ' fill="' + o.fill + '"';
    if (o.fit) attrs += ' textLength="' + n(o.fit) + '" lengthAdjust="spacingAndGlyphs"';
    return '<text' + attrs + '>' + esc(s) + '</text>';
  }

  /** Текст, вписанный в ячейку. Отступ слева 0.8 мм — как в оригинале.
   *  maxW: если строка явно длиннее ячейки — ужимаем межбуквенно (textLength),
   *  как сжатие ширины текста в AutoCAD; данные не обрезаются. */
  function cellText(x, y, w, h, s, o) {
    o = o || {};
    var size = o.size || SZ.body;
    var cx = o.align === 'left' ? x + 0.8 : o.align === 'right' ? x + w - 0.8 : x + w / 2;
    var anchor = o.align === 'left' ? 'start' : o.align === 'right' ? 'end' : 'middle';
    // Предел ширины — сама ячейка, даже если вызывающий его не задал: за края
    // графы текст не выходит никогда, как в проектах-образцах.
    var lim = (o.maxW != null) ? o.maxW : Math.max(2, w - 1.6);
    var fit = (String(s == null ? '' : s).length * size * 0.46 > lim) ? lim : '';
    return text(cx, y + h / 2 + size * 0.35, s,
      { size: size, anchor: anchor, weight: o.weight, font: o.font, fit: fit });
  }

  /** Заголовок ячейки в несколько строк: длинная подпись переносится по
   *  словам и центрируется по высоте графы — так свёрстаны шапки в образце. */
  function cellLines(x, y, w, h, s, o) {
    o = o || {};
    var size = o.size || SZ.body;
    var per = Math.max(4, Math.floor((w - 1.6) / (size * 0.46)));
    var ls = wrap(String(s == null ? '' : s), per);
    var lh = size * 1.15;
    var y0 = y + h / 2 - (ls.length - 1) * lh / 2 + size * 0.35;
    return ls.map(function (ln, i) {
      return text(x + w / 2, y0 + i * lh, ln,
        { size: size, anchor: 'middle', weight: o.weight, font: o.font, fit: (ln.length * size * 0.46 > w - 1.6) ? (w - 1.6) : '' });
    }).join('');
  }

  // ─── Рамка, штамп, боковые графы ───────────────────────────────────────
  function frame() {
    var o = [];
    o.push(rect(FR.l, FR.t, FRAME.w, FRAME.h, LW.thick));
    return o.join('');
  }

  function stamp(d) {
    d = d || {};
    var S = STAMP, o = [];
    o.push(rect(S.l, S.t, S.r - S.l, S.b - S.t, LW.thick));

    // левый блок: 6 колонок × 3 строки по 5 мм
    var rows = [S.t, S.t + 5, S.t + 10, S.b];
    for (var i = 1; i < rows.length - 1; i++) o.push(line(S.cols[0], rows[i], S.cols[6], rows[i]));
    for (var c = 1; c < S.cols.length; c++) o.push(line(S.cols[c], S.t, S.cols[c], S.b));
    o.push(line(S.cols[6], S.t, S.cols[6], S.b, LW.thin));

    // шифр проекта
    o.push(line(S.code, S.t, S.code, S.b));
    // «Лист» / номер
    o.push(line(S.code, S.t + S.sheetSplit, S.r, S.t + S.sheetSplit));

    // подписи нижней строки штампа
    var caps = ['Изм.', 'Кол.уч.', 'Лист', '№док.', 'Подп.', 'Дата'];
    for (var k = 0; k < 6; k++) {
      var x0 = S.cols[k], x1 = S.cols[k + 1];
      o.push(cellText(x0, rows[2], x1 - x0, 5, caps[k], { size: SZ.stamp, font: FONT_STAMP }));
    }
    o.push(cellText(S.code, S.t, S.r - S.code, S.sheetSplit, 'Лист',
      { size: SZ.stamp, font: FONT_STAMP }));
    o.push(cellText(S.code, S.t + S.sheetSplit, S.r - S.code, S.b - S.t - S.sheetSplit,
      d.sheet || '', { size: SZ.stamp, font: FONT_STAMP }));
    o.push(cellText(S.cols[6], S.t, S.code - S.cols[6], S.b - S.t, d.code || '',
      { size: SZ.code, font: FONT_STAMP }));
    return o.join('');
  }

  // «Формат А3  297 х 420» под рамкой справа — есть на каждом листе оригинала
  function formatNote() {
    return text(365.8, 295.5, 'Формат А3', { size: SZ.stamp, font: FONT_STAMP }) +
      text(391.2, 295.5, '297 х 420', { size: SZ.stamp, font: FONT_STAMP });
  }

  // ─── Основная надпись форма 3 (первый лист раздела), 185×55 ────────────
  // Геометрия обмерена по листу ТМ-1 оригинала: x 230..415, y 237..291.9
  /**
   * d: { code, object, section, sheetTitle, stage='Р', sheet, total,
   *      people: { razrab, zakaz, nkontr, utv }, date='ММ.ГГ', org }
   */
  function stampBig(d) {
    d = d || {};
    var o = [], F = { font: FONT_STAMP, size: SZ.stamp };
    var T = 237, B = 291.9, L = 230, R = 415;
    o.push(rect(L, T, R - L, B - T, LW.thick));

    // верхний левый блок (таблица изменений): 6 колонок, 5 строк
    [242, 247, 252, 257].forEach(function (y) { o.push(line(L, y, 295, y)); });
    o.push(line(L, 262, R, 262));
    [240, 260].forEach(function (x) { o.push(line(x, T, x, 262)); });
    [250, 270, 285, 295].forEach(function (x) { o.push(line(x, T, x, B)); });
    var caps = ['Изм.', 'Кол.уч.', 'Лист', '№док.', 'Подп.', 'Дата'];
    var capX = [230, 240, 250, 260, 270, 285, 295];
    for (var k = 0; k < 6; k++)
      o.push(cellText(capX[k], 257, capX[k + 1] - capX[k], 5, caps[k], F));

    // нижний левый блок (подписи): Разраб / Заказчик / — / — / Н.контр / Утв
    [267, 272, 276.9, 281.9, 286.9].forEach(function (y) { o.push(line(L, y, y === 267 || y === 276.9 ? R : 295, y)); });
    var p = d.people || {};
    var sigRows = [
      [262, 'Разраб.', p.razrab], [267, 'Заказчик', p.zakaz], [272, '', ''],
      [276.9, '', ''], [281.9, 'Н. контр.', p.nkontr], [286.9, 'Утв.', p.utv]
    ];
    sigRows.forEach(function (r, i) {
      var h = (sigRows[i + 1] ? sigRows[i + 1][0] : B) - r[0];
      if (r[1]) o.push(cellText(L, r[0], 20, h, r[1], { font: FONT_STAMP, size: SZ.stamp, align: 'left' }));
      if (r[2]) o.push(cellText(250, r[0], 20, h, r[2], F));
      if (r[1] && d.date) o.push(cellText(285, r[0], 10, h, d.date, F));
    });

    // правый блок: шифр / объект / раздел / стадия-лист-листов / название листа
    o.push(line(295, 247, R, 247));
    o.push(line(365, 262, 365, B));
    o.push(line(380, 262, 380, 276.9));
    o.push(line(395, 262, 395, 276.9));
    o.push(line(295, 267, R, 267));
    o.push(cellText(295, T, 120, 10, d.code || '', { size: SZ.code, font: FONT_STAMP }));
    o.push(cellText(295, 247, 120, 15, d.object || '', F));
    o.push(cellText(295, 262, 70, 14.9, d.section || '', F));
    o.push(cellText(365, 262, 15, 5, 'Стадия', F));
    o.push(cellText(380, 262, 15, 5, 'Лист', F));
    o.push(cellText(395, 262, 20, 5, 'Листов', F));
    o.push(cellText(365, 267, 15, 9.9, d.stage || 'Р', F));
    o.push(cellText(380, 267, 15, 9.9, d.sheet || '', F));
    o.push(cellText(395, 267, 20, 9.9, d.total || '', F));
    o.push(cellText(295, 276.9, 70, 15, d.sheetTitle || '', F));
    o.push(cellText(365, 276.9, 50, 15, d.org || '', F));
    return o.join('');
  }

  // перенос текста по словам под ширину колонки (оценка по средней ширине знака)
  function wrap(s, maxChars) {
    var words = String(s == null ? '' : s).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
      else cur = (cur ? cur + ' ' : '') + w;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function sideBoxes() {
    var o = [], s = SIDE.soglas;
    // «Согласовано»
    o.push(rect(s.x, s.t, s.w, s.b - s.t, LW.thin));
    o.push(line(s.inner, s.t, s.inner, s.b));
    s.rows.forEach(function (y) { o.push(line(s.inner, y, s.x + s.w, y)); });
    o.push(text(s.x + 3.5, (s.t + s.b) / 2, 'Согласовано',
      { size: SZ.stamp, anchor: 'middle', rotate: -90, font: FONT_STAMP }));

    SIDE.boxes.forEach(function (b) {
      o.push(rect(SIDE.x, b.t, SIDE.w, b.b - b.t, LW.thin));
      o.push(text(SIDE.x + 3.9, (b.t + b.b) / 2, b.label,
        { size: SZ.stamp, anchor: 'middle', rotate: -90, font: FONT_STAMP }));
    });
    return o.join('');
  }

  // ─── Таблица ───────────────────────────────────────────────────────────
  /**
   * cols:  [{w, title, align}]  ширины в мм, сумма = ширина таблицы
   * rows:  [ [v,v,v], … ]  либо { section: 'Арматура трубопроводов' }
   */
  function table(x, y, cols, rows, o) {
    o = o || {};
    var out = [], headH = o.headH || 5.5, rh = o.rowH || ROW_H;
    var total = cols.reduce(function (a, c) { return a + c.w; }, 0);
    var cy = y;

    // шапка — жирная (в оригинале двойная прорисовка)
    var cx = x;
    out.push(rect(x, cy, total, headH, LW.thin));
    cols.forEach(function (c, i) {
      if (i) out.push(line(cx, cy, cx, cy + headH));
      out.push(cellText(cx, cy, c.w, headH, c.title, { weight: 'bold' }));
      cx += c.w;
    });
    cy += headH;

    rows.forEach(function (r) {
      if (r && r.section) {
        // строка-раздел: обычное начертание, слева — как в оригинале
        out.push(rect(x, cy, total, rh, LW.thin));
        out.push(cellText(x, cy, total, rh, r.section, { align: 'left' }));
        cy += rh;
        return;
      }
      out.push(rect(x, cy, total, rh, LW.thin));
      var kx = x;
      cols.forEach(function (c, i) {
        if (i) out.push(line(kx, cy, kx, cy + rh));
        out.push(cellText(kx, cy, c.w, rh, r[i], { align: c.align || 'center', maxW: c.w - 1.6 }));
        kx += c.w;
      });
      cy += rh;
    });
    return { svg: out.join(''), bottom: cy };
  }

  // ─── Сборка листа ──────────────────────────────────────────────────────
  /**
   * opts: { title, code, sheet, body }  body — готовая SVG-строка
   */
  function sheet(opts) {
    opts = opts || {};
    var body = opts.body || '';
    // заголовок листа: у спецификаций 3.88 (базовая линия 11.7), у расчётов
    // и общих данных 5.47 (базовая линия 12.3) — оба варианта обмерены
    var head = '';
    if (opts.title) {
      var ts = opts.titleSize || SZ.body;
      head = text((FR.l + FR.r) / 2, ts > 4.5 ? 12.3 : 11.7, opts.title,
        { size: ts, anchor: 'middle', weight: 'bold' });
    }
    // штамп: 'small' — форма 6 (последующие листы), 'big' — форма 3
    // (первый лист раздела), 'none' — титульный лист
    var st = opts.stampType === 'none' ? '' :
      opts.stampType === 'big' ? stampBig(opts) : stamp(opts);
    // на титульном листе оригинала форматной надписи нет
    var fmt = opts.stampType === 'none' ? '' : formatNote();
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + A3.w + ' ' + A3.h + '" ' +
      'width="' + A3.w + 'mm" height="' + A3.h + 'mm" class="sheet-a3">' +
      '<style>.sheet-a3 text{fill:#000;stroke:none}' +
      '.sheet-a3 line,.sheet-a3 rect{stroke:#000;fill:none}' +
      '</style>' +
      '<rect x="0" y="0" width="' + A3.w + '" height="' + A3.h + '" fill="#fff" stroke="none"/>' +
      '<g stroke-linecap="square" font-family="' + FONT + '" font-style="italic" font-size="' +
      SZ.body + '">' +
      frame() + sideBoxes() + st + fmt +
      '<g class="sheet-body">' + head + body + '</g>' +
      '</g></svg>';
  }

  // ─── Готовый лист: спецификация ────────────────────────────────────────
  var SPEC_COLS = [
    { w: 25, title: '№', align: 'center' },
    { w: 240, title: 'Наименование', align: 'left' },
    { w: 20, title: 'Ед. изм.', align: 'center' },
    { w: 40, title: 'Кол-во', align: 'center' },
    { w: 70, title: 'Примечание', align: 'left' }
  ];

  /** items: [{ section } | { name, unit, qty, note }]
   *  numTitle — «№» на листах В и О, «Позиция» на листах ТМ */
  function specification(opts) {
    var rows = [], num = 0;
    (opts.items || []).forEach(function (it) {
      if (it.section) { rows.push({ section: it.section }); return; }
      num++;
      rows.push([num, it.name, it.unit || 'шт.', it.qty, it.note || '']);
    });
    if (opts.total) rows.push([' ', 'Общий итог:', '', opts.total, '']);
    var cols = SPEC_COLS.map(function (c, i) {
      return i === 0 ? { w: c.w, title: opts.numTitle || c.title, align: c.align } : c;
    });
    var t = table(FR.l, BODY_TOP, cols, rows, {});
    return sheet({
      title: opts.title || 'Спецификация оборудования и материалов',
      code: opts.code, sheet: opts.sheet, body: t.svg
    });
  }

  // ─── Титульный лист ────────────────────────────────────────────────────
  // Все базовые линии и размеры обмерены по стр. 23 оригинала (ТМ-0)
  /**
   * opts: { object, region, docType, code, section, year, logo,
   *         sigs: [{label, name}] — по умолчанию Заказчик / ГИП / Разработал }
   */
  function titleSheet(opts) {
    opts = opts || {};
    var C = (FR.l + FR.r) / 2, o = [];
    // Логотип компании над названием объекта — как в проектах-образцах.
    // Пропорции не знаем заранее (у монтажников логотипы любые), поэтому
    // рамка с letterbox: картинка вписывается, не растягиваясь.
    if (opts.logo) {
      o.push('<image x="' + n(C - 45) + '" y="32" width="90" height="44"' +
        ' preserveAspectRatio="xMidYMid meet" href="' + String(opts.logo).replace(/"/g, '&quot;') + '"/>');
    }
    o.push(text(C, 106.3, opts.object || '', { size: 7.06, anchor: 'middle', weight: 'bold', font: FONT_STAMP }));
    o.push(text(C, 118.8, opts.region || '', { size: 7.06, anchor: 'middle', weight: 'bold', font: FONT_STAMP }));
    o.push(text(C, 132.0, opts.docType || 'Рабочая документация',
      { size: 4.23, anchor: 'middle', weight: 'bold', font: FONT_STAMP }));
    o.push(text(C, 171.2, opts.code || '', { size: 7.06, anchor: 'middle', weight: 'bold', font: FONT_STAMP }));
    o.push(text(C, 180.7, opts.section || '', { size: 4.23, anchor: 'middle', weight: 'bold', font: FONT_STAMP }));

    // подписные линейки: три строки 177.6–257.6, y 229.1 / 237.1 / 245.1
    var sigs = opts.sigs || [{ label: 'Заказчик' }, { label: 'ГИП' }, { label: 'Разработал' }];
    var sigY = [229.1, 237.1, 245.1];
    sigs.slice(0, 3).forEach(function (s, i) {
      o.push(line(177.6, sigY[i], 257.6, sigY[i]));
      o.push(text(178.2, sigY[i] - 0.8, s.label, { size: SZ.stamp, font: FONT_STAMP }));
      if (s.name) o.push(text(256.8, sigY[i] - 0.8, s.name,
        { size: SZ.stamp, anchor: 'end', font: FONT_STAMP }));
    });

    o.push(text(C, 278.5, String(opts.year || new Date().getFullYear()),
      { size: SZ.stamp, anchor: 'middle', font: FONT_STAMP }));
    return sheet({ stampType: 'none', body: o.join('') });
  }

  // ─── Лист «Общие данные» ───────────────────────────────────────────────
  // Слева таблица «Список листов» (x 43.8–188.8), справа колонка указаний.
  // Геометрия и размеры обмерены по стр. 24 оригинала (ТМ-1).
  /**
   * opts: { listTitle, sheetsList: [[номер, имя, примечание]],
   *         notesTitle, notes: [{h, lines: []}], + все поля stampBig }
   */
  function generalData(opts) {
    opts = opts || {};
    var o = [];

    // таблица списка листов
    var LX = 43.8, LT = 20.4, colW = [20, 95, 30], totalW = 145;
    o.push(rect(LX, LT, totalW, 10.6, LW.thin));   // ячейка заголовка
    o.push(cellText(LX, LT, totalW, 10.6, opts.listTitle || 'Список листов', { weight: 'bold' }));
    var cy = 31.0;
    o.push(rect(LX, cy, totalW, ROW_H, LW.thin));
    var capX = LX;
    ['Лист', 'Имя листа', 'Примечание'].forEach(function (c, i) {
      if (i) o.push(line(capX, cy, capX, cy + ROW_H));
      o.push(cellText(capX, cy, colW[i], ROW_H, c, { weight: 'bold' }));
      capX += colW[i];
    });
    cy += ROW_H;
    (opts.sheetsList || []).forEach(function (r) {
      o.push(rect(LX, cy, totalW, ROW_H, LW.thin));
      var kx = LX;
      colW.forEach(function (w, i) {
        if (i) o.push(line(kx, cy, kx, cy + ROW_H));
        o.push(cellText(kx, cy, w, ROW_H, r[i],
          { align: i === 1 ? 'left' : 'center', maxW: w - 1.6 }));
        kx += w;
      });
      cy += ROW_H;
    });

    // Таблица «Основные показатели» под списком листов (как в образце):
    // площадь и расход тепла по этажам с итогом.
    if (opts.indicators && opts.indicators.rows && opts.indicators.rows.length) {
      var IX = LX, IY = cy + 12, iw = [38, 22, 22, 21, 21, 21], isum = 145;
      o.push(text(IX + isum / 2, IY - 2.6, opts.indicators.title ||
        'Основные показатели по рабочим чертежам марки ОВ',
        { size: 4.23, anchor: 'middle', weight: 'bold' }));
      // шапка в две строки: над тремя правыми колонками — «Расход тепла, Вт»
      o.push(rect(IX, IY, isum, ROW_H * 2, LW.thin));
      var hx = IX, htop = ['Наименование помещения', 'Периоды года при tн, °С', 'Площадь, кв. м'];
      htop.forEach(function (c, i) {
        if (i) o.push(line(hx, IY, hx, IY + ROW_H * 2));
        o.push(cellLines(hx, IY, iw[i], ROW_H * 2, c, { weight: 'bold', size: 3.1 }));
        hx += iw[i];
      });
      o.push(line(hx, IY, hx, IY + ROW_H * 2));
      var hw = iw[3] + iw[4] + iw[5];
      o.push(cellText(hx, IY, hw, ROW_H, 'Расход тепла, Вт', { weight: 'bold' }));
      o.push(line(hx, IY + ROW_H, hx + hw, IY + ROW_H));
      var hx2 = hx;
      ['на отопление', 'на вентиляцию', 'на ГВС'].forEach(function (c, i) {
        if (i) o.push(line(hx2, IY + ROW_H, hx2, IY + ROW_H * 2));
        o.push(cellText(hx2, IY + ROW_H, iw[3 + i], ROW_H, c, { weight: 'bold', size: 3.1 }));
        hx2 += iw[3 + i];
      });
      var iy = IY + ROW_H * 2;
      opts.indicators.rows.forEach(function (r) {
        o.push(rect(IX, iy, isum, ROW_H, LW.thin));
        var kx2 = IX;
        iw.forEach(function (w, i) {
          if (i) o.push(line(kx2, iy, kx2, iy + ROW_H));
          o.push(cellText(kx2, iy, w, ROW_H, r[i],
            { align: i ? 'center' : 'left', maxW: w - 1.4 }));
          kx2 += w;
        });
        iy += ROW_H;
      });
      cy = iy;
    }

    // Схема пирога пола с выносками (как «Схема 2» в образце)
    if (opts.floorScheme && opts.floorScheme.layers && opts.floorScheme.layers.length) {
      var FX = LX + 22, FY = cy + 16, FW = 92, lay = opts.floorScheme.layers;
      o.push(text(LX + 72, FY - 5, opts.floorScheme.title || 'Схема 1',
        { size: 4.23, anchor: 'middle', weight: 'bold' }));
      var ly2 = FY;
      lay.forEach(function (L) {
        o.push(rect(FX, ly2, FW, L.h, LW.thin));
        // выноска вправо к подписи слоя
        o.push(line(FX + FW, ly2 + L.h / 2, FX + FW + 10, ly2 + L.h / 2));
        o.push(text(FX + FW + 11.5, ly2 + L.h / 2 + 1.1, L.name, { size: 3.1 }));
        if (L.hatch) {                       // засыпка/утеплитель — штриховка
          for (var hxx = FX + 2; hxx < FX + FW - 1; hxx += 3.2)
            o.push(line(hxx, ly2 + L.h, hxx + Math.min(2.6, L.h), ly2));
        }
        ly2 += L.h;
      });
      // трубы в стяжке: подача и обратка кружками
      var tp = opts.floorScheme.pipeY;
      if (tp != null) {
        var pl = opts.floorScheme.pipeLabels || ['Т1', 'Т2'];
        [FX + FW * 0.42, FX + FW * 0.58].forEach(function (cxp, i) {
          o.push('<circle cx="' + n(cxp) + '" cy="' + n(FY + tp) + '" r="1.5" style="fill:none;stroke:' +
            (i ? '#2b5fcc' : '#cc2222') + ';stroke-width:0.35"/>');
          o.push(line(cxp, FY + tp - 1.5, cxp, FY - 6));
          o.push(text(cxp - 1, FY - 7, pl[i], { size: 3.0 }));
        });
      }
    }

    // правая колонка указаний: x 223.5, заголовок 5.47, строки через 4.75
    var NX = 223.5, LH = 4.75;
    o.push(text(311, 11.6, opts.notesTitle || 'Общие указания',
      { size: 5.47, anchor: 'middle', weight: 'bold' }));
    var ny = 20.8;
    (opts.notes || []).forEach(function (sec) {
      o.push(text(NX + 2.7, ny, sec.h, { weight: 'bold' }));
      ny += LH * 2;
      (sec.lines || []).forEach(function (ln) {
        wrap(ln, 100).forEach(function (w) {
          o.push(text(NX, ny, w));
          ny += LH;
        });
      });
      ny += LH;
    });

    return sheet({
      stampType: 'big',
      code: opts.code, object: opts.object, section: opts.section,
      sheetTitle: opts.sheetTitle, stage: opts.stage, sheet: opts.sheet,
      total: opts.total, people: opts.people, date: opts.date, org: opts.org,
      body: o.join('')
    });
  }

  // ─── Лист «Расчёт теплопотерь» ─────────────────────────────────────────
  // Колонки и размеры обмерены по стр. 5 оригинала (лист 4 раздела MEP)
  var HL_COLS = [
    { w: 25.4, title: '№ пом.' },
    { w: 44.5, title: 'Конструкция', align: 'left' },
    { w: 19.5, title: 'К-во' },
    { w: 29.4, title: 'Площадь, м²' },
    { w: 24.5, title: 'Тв, °C' },
    { w: 24.3, title: 'Тн, °C' },
    { w: 44.8, title: 'R, (м²·K)/Вт' },
    { w: 26.2, title: 'n' },
    { w: 115, title: 'Расчет', align: 'left' },
    { w: 41.4, title: 'Теплопотери, Вт' }
  ];

  /**
   * floors: [{ label: '1 этаж', rooms: [{ id: '1.01',
   *            items: [{type, count, area, Tv, Tn, R, n, Q}], total }], total }]
   * opts: { code, sheetStart }
   * Возвращает массив SVG-листов (по листу на этаж, длинный этаж режется).
   */
  function heatLossSheets(floors, opts) {
    opts = opts || {};
    var f1 = function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
    var f2 = function (v) { return (Math.round(v * 100) / 100).toFixed(2); };
    var sheets = [], start = opts.sheetStart || 1;

    (floors || []).forEach(function (fl) {
      var rows = [];
      (fl.rooms || []).forEach(function (r) {
        (r.items || []).forEach(function (it) {
          var formula = it.count + ' х ' + f1(it.area) + ' м² х (' + it.Tv +
            ' °C - (' + it.Tn + ' °C)) / ' + f2(it.R) + ' (м²·K)/Вт х ' + it.n;
          rows.push([r.id, it.type, it.count, f2(it.area) + ' м²', it.Tv + ' °C',
            it.Tn + ' °C', f2(it.R) + ' (м²·K)/Вт', it.n, formula,
            Math.round(it.Q) + ' Вт']);
        });
        rows.push([r.id, '', '', '', '', '', '', '', '', Math.round(r.total) + ' Вт']);
      });
      rows.push([fl.label, '', '', '', '', '', '', '', '', Math.round(fl.total) + ' Вт']);

      // разбивка длинного этажа на листы — как у спецификации
      var perSheet = Math.floor((275 - BODY_TOP - 5.5) / ROW_H);
      var pages = [], page = [];
      rows.forEach(function (r) {
        if (page.length >= perSheet) { pages.push(page); page = []; }
        page.push(r);
      });
      if (page.length) pages.push(page);

      pages.forEach(function (pageRows) {
        var t = table(FR.l, BODY_TOP, HL_COLS, pageRows, {});
        sheets.push(sheet({
          title: 'Расчет теплопотерь — ' + fl.label, titleSize: 5.47,
          code: opts.code, sheet: String(start + sheets.length), body: t.svg
        }));
      });
    });
    return sheets;
  }

  // ─── Спецификация из сметы калькулятора ────────────────────────────────
  /**
   * items — currentEquipmentList из app.js (или его срез): нужны поля
   * name, unit, q, sectionTitle, group, isOpt. Порядок строк сохраняется —
   * он уже выставлен сортировкой сметы.
   * opts: { title, code, sheetStart }
   * Возвращает массив SVG-строк: по листу А3 на страницу.
   */
  function fromEquipment(items, opts) {
    opts = opts || {};
    var rows = [], num = 0, lastSec = null, lastGroup = null;
    (items || []).forEach(function (i) {
      if (i.sectionTitle && i.sectionTitle !== lastSec) {
        rows.push({ section: i.sectionTitle });
        lastSec = i.sectionTitle;
        lastGroup = null;
      }
      if (i.group && i.group !== lastGroup) {
        // в смете подраздел иногда совпадает с названием раздела — не дублируем
        if (i.group !== lastSec) rows.push({ section: i.group });
        lastGroup = i.group;
      }
      num++;
      var unit = i.unit === 'шт' ? 'шт.' : (i.unit || 'шт.');
      rows.push([num, i.name, unit, i.q, i.isOpt ? 'опция' : '']);
    });

    // Разбивка по листам: последняя строка не ниже 275 мм — над штампом
    var headH = 5.5;
    var perSheet = Math.floor((275 - BODY_TOP - headH) / ROW_H);
    var pages = [], page = [];
    rows.forEach(function (r) {
      if (page.length >= perSheet) { pages.push(page); page = []; }
      page.push(r);
    });
    if (page.length) pages.push(page);
    // заголовок раздела не должен повиснуть последней строкой листа
    for (var p = 0; p < pages.length - 1; p++) {
      var tail = pages[p][pages[p].length - 1];
      if (tail && tail.section) { pages[p].pop(); pages[p + 1].unshift(tail); }
    }

    var start = opts.sheetStart || 1;
    return pages.map(function (pageRows, idx) {
      var t = table(FR.l, BODY_TOP, SPEC_COLS, pageRows, {});
      return sheet({
        title: opts.title || 'Спецификация оборудования и материалов',
        code: opts.code, sheet: String(start + idx), body: t.svg
      });
    });
  }

  window.projectSheets = {
    A3: A3, FRAME: FRAME, FR: FR, STAMP: STAMP, SIDE: SIDE, ROW_H: ROW_H,
    sheet: sheet, table: table, specification: specification,
    fromEquipment: fromEquipment,
    titleSheet: titleSheet, generalData: generalData, stampBig: stampBig,
    heatLossSheets: heatLossSheets,
    text: text, cellText: cellText, cellLines: cellLines, line: line, rect: rect,
    // общий подбор семейства: модули листов рисуют свой текст сами, но
    // латиницу вне покрытия чертёжного шрифта должны обрабатывать так же
    fontFor: fontFor, FONT_LAT: FONT_LAT,
    SPEC_COLS: SPEC_COLS
  };
})();
