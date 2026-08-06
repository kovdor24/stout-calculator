/* project_ufh_manifold.js — лист «Узел обвязки коллектора тёплого пола».
 *
 * Ключевой монтажный лист ТП: что к какому выходу гребёнки подключено и на
 * какой расход настраивать расходомеры. Остальные листы узлов (project_nodes.js)
 * — растровые рендеры из проектов-образцов, здесь такого образца нет, поэтому
 * узел рисуется вектором: подающая и обратная гребёнки, расходомеры, клапаны
 * с сервоприводами, насосная группа (узел подмеса) и петли по номерам.
 *
 * Петли берутся из projectPlans.loopRows — того же расчёта, что рисует лист
 * укладки и считает смету: номер, длина и расход петли везде одни и те же.
 * Коллекторы делятся по 12 выходов, как в смете.
 *
 * Требует project_sheets.js и project_plans.js. Глобал: window.projectUfhManifold
 */
(function () {
  'use strict';

  var MAX_OUT = 12;                       // выходов на одном коллекторе (как в смете)
  var COL_SUP = '#cc2222', COL_RET = '#2b5fcc';
  var SZ = { title: 7.36, txt: 3.3, small: 2.8, tbl: 3.2 };

  function n(v) { return Math.round(v * 100) / 100; }
  function PS() { return window.projectSheets; }
  function txt(x, y, s, o) {
    o = o || {}; o.size = o.size || SZ.txt;
    return PS().text(x, y, s, o);
  }
  function line(x1, y1, x2, y2, st) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) +
      '" style="stroke:' + (st && st.c || '#000') + ';stroke-width:' + (st && st.w || 0.25) +
      (st && st.dash ? ';stroke-dasharray:' + st.dash : '') + '"/>';
  }
  function rect(x, y, w, h, st) {
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" style="fill:' + (st && st.fill || 'none') + ';stroke:' + (st && st.c || '#000') +
      ';stroke-width:' + (st && st.w || 0.25) + '"/>';
  }
  function circle(x, y, r, st) {
    return '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + n(r) +
      '" style="fill:' + (st && st.fill || 'none') + ';stroke:' + (st && st.c || '#000') +
      ';stroke-width:' + (st && st.w || 0.25) + '"/>';
  }
  /** Позиционный шарик (номер элемента узла) с выноской-полкой */
  function balloon(o, x, y, ax, ay, no) {
    o.push(line(ax, ay, x, y, { w: 0.2 }));
    o.push(circle(ax, ay, 0.4, { fill: '#000', c: '#000' }));
    o.push(circle(x, y, 3, { fill: '#ffffff' }));
    o.push(txt(x, y + 1.1, no, { anchor: 'middle', size: SZ.txt }));
  }

  // ─── Названия элементов узла: из позиций сметы ──────────────────────────
  function pick(items, re, not) {
    for (var i = 0; i < (items || []).length; i++) {
      var nm = String(items[i].name || '');
      if (re.test(nm) && !(not && not.test(nm))) return nm;
    }
    return null;
  }
  function shortName(s, lim) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > (lim || 46) ? s.slice(0, (lim || 46) - 1) + '…' : s;
  }

  /**
   * Экспликация узла: [[№, наименование]]. Имена — из сметы, чтобы на листе
   * стояло то же оборудование, что монтажник купит; чего в смете нет (шкаф,
   * сервоприводы), в списке не появляется.
   */
  function nodeParts(items, ctx) {
    var out = [], no = 0;
    // 72 знака — сколько влезает в графу «Наименование» при её ширине
    var add = function (nm) { out.push([++no, shortName(nm, 72)]); return no; };
    var idx = {};
    idx.group = add(ctx.groupName ||
      'Насосно-смесительный узел тёплого пола с термоголовкой');
    idx.sup = add((ctx.manName || 'Коллектор тёплого пола') + ' — подающая гребёнка с расходомерами');
    idx.ret = add((ctx.manName || 'Коллектор тёплого пола') + ' — обратная гребёнка с клапанами');
    if (ctx.servo) idx.servo = add(ctx.servo);
    idx.euro = add(ctx.euro || 'Евроконус для трубы 16 мм');
    idx.pipe = add(ctx.pipe || 'Труба тёплого пола 16×2,0 мм');
    if (ctx.cabinet) idx.cab = add(ctx.cabinet);
    return { rows: out, idx: idx };
  }

  // ─── Схема узла ────────────────────────────────────────────────────────
  /**
   * Гребёнки с выходами по числу петель, узел подмеса слева, петли снизу.
   * rows — петли этого коллектора (из projectPlans.loopRows).
   */
  function scheme(o, rows, ctx, P) {
    // Поле схемы: слева место под узел подмеса, справа — под подписи торцевых
    // групп; между ними и раскладываются выходы (до 12 штук).
    var M = rows.length, LEFT = 70, RMAX = 205, span = RMAX - LEFT - 8;
    var pitch = (M > 1) ? Math.min(16, span / (M - 1)) : 16;
    var X0 = LEFT + Math.max(0, (span - (M - 1) * pitch) / 2);   // ось первого выхода
    var L = X0 - 8, R = X0 + (M - 1) * pitch + 8;
    var YS = P.ySup, YR = P.yRet, BH = 6;
    var xOf = function (i) { return X0 + i * pitch; };

    // гребёнки: подающая красной, обратная синей — как трассы на планах
    o.push(rect(L, YS - BH / 2, R - L, BH, { c: COL_SUP, w: 0.5, fill: '#ffffff' }));
    o.push(rect(L, YR - BH / 2, R - L, BH, { c: COL_RET, w: 0.5, fill: '#ffffff' }));
    o.push(txt(L - 2, YS + 1.1, 'Т1', { anchor: 'end', size: SZ.small }));
    o.push(txt(L - 2, YR + 1.1, 'Т2', { anchor: 'end', size: SZ.small }));

    // узел подмеса (насосная группа) слева сверху: насос, трёхходовой клапан
    var GX = L - 30, GY = P.yGrp, GW = 26, GH = 30;
    o.push(rect(GX, GY, GW, GH, { w: 0.35, fill: '#ffffff' }));
    o.push(circle(GX + GW / 2, GY + 9, 4.2, { w: 0.35 }));
    o.push(line(GX + GW / 2 - 4.2, GY + 9, GX + GW / 2 + 4.2, GY + 9, { w: 0.35 }));
    o.push(line(GX + GW / 2, GY + 4.8, GX + GW / 2, GY + 13.2, { w: 0.35 }));
    o.push(rect(GX + GW / 2 - 3.4, GY + 19, 6.8, 6.8, { w: 0.35 }));
    o.push(line(GX + GW / 2 - 3.4, GY + 25.8, GX + GW / 2 + 3.4, GY + 19, { w: 0.35 }));
    o.push(txt(GX + GW / 2, GY - 1.6, 'Узел подмеса', { anchor: 'middle', size: SZ.small }));
    // подача и обратка от котельной — сверху, к гребёнкам — вниз-вправо
    o.push(line(GX + 6, GY - 8, GX + 6, GY, { c: COL_SUP, w: 0.5 }));
    o.push(line(GX + GW - 6, GY - 8, GX + GW - 6, GY, { c: COL_RET, w: 0.5 }));
    o.push(txt(GX + 6, GY - 9.6, 'от котельной', { anchor: 'middle', size: SZ.small }));
    o.push(line(GX + 6, GY + GH, GX + 6, YS, { c: COL_SUP, w: 0.5 }));
    o.push(line(GX + 6, YS, L, YS, { c: COL_SUP, w: 0.5 }));
    o.push(line(GX + GW - 6, GY + GH, GX + GW - 6, YR, { c: COL_RET, w: 0.5 }));
    o.push(line(GX + GW - 6, YR, L, YR, { c: COL_RET, w: 0.5 }));

    // торцевые группы: воздухоотводчик на подаче, сливной кран на обратке
    o.push(circle(R + 3, YS, 2, { w: 0.3 }));
    o.push(line(R, YS, R + 1, YS, { w: 0.3 }));
    o.push(txt(R + 11, YS + 1, 'Воздухоотводчик', { size: SZ.small }));
    o.push(line(R, YR, R + 3, YR, { w: 0.3 }));
    o.push(line(R + 3, YR - 2, R + 3, YR + 2, { w: 0.3 }));
    o.push(txt(R + 11, YR + 1, 'Сливной кран', { size: SZ.small }));

    // выходы: расходомер на подающей, клапан с сервоприводом на обратной
    var yBr = P.yLoop, yNo = yBr + 5;
    rows.forEach(function (r, i) {
      var x = xOf(i), xs = x - 3, xr = x + 3;
      // подающая нитка: расходомер, вниз мимо обратной гребёнки (мостик)
      o.push(line(xs, YS + BH / 2, xs, YS + BH / 2 + 3, { c: COL_SUP, w: 0.45 }));
      o.push(rect(xs - 1.8, YS + BH / 2 + 3, 3.6, 7, { w: 0.3, fill: '#ffffff' }));
      o.push(line(xs - 1.8, YS + BH / 2 + 7.5, xs + 1.8, YS + BH / 2 + 7.5, { w: 0.2 }));
      o.push(line(xs, YS + BH / 2 + 10, xs, YR - BH / 2 - 1.4, { c: COL_SUP, w: 0.45 }));
      // мостик через обратную гребёнку — линии не сливаются в узел
      o.push('<path d="M' + n(xs) + ' ' + n(YR - BH / 2 - 1.4) + ' A 1.4 1.4 0 0 1 ' +
        n(xs) + ' ' + n(YR + BH / 2 + 1.4) + '" style="fill:none;stroke:' + COL_SUP +
        ';stroke-width:0.45"/>');
      o.push(line(xs, YR + BH / 2 + 1.4, xs, yBr, { c: COL_SUP, w: 0.45 }));
      // обратная нитка: клапан, при автоматике — сервопривод
      o.push(line(xr, YR + BH / 2, xr, YR + BH / 2 + 3, { c: COL_RET, w: 0.45 }));
      o.push(rect(xr - 1.8, YR + BH / 2 + 3, 3.6, 5, { w: 0.3, fill: '#ffffff' }));
      if (ctx.servo) {
        o.push(rect(xr - 2.4, YR + BH / 2 + 8, 4.8, 4.8, { w: 0.3, fill: '#ffffff' }));
        o.push(line(xr, YR + BH / 2 + 12.8, xr, yBr, { c: COL_RET, w: 0.45 }));
      } else {
        o.push(line(xr, YR + BH / 2 + 8, xr, yBr, { c: COL_RET, w: 0.45 }));
      }
      // петля: скоба, номер и название помещения вдоль листа
      o.push(line(xs, yBr, xr, yBr, { w: 0.3 }));
      o.push(circle(x, yNo, 3.2, { fill: '#ffffff' }));
      o.push(txt(x, yNo + 1.1, r.no, { anchor: 'middle' }));
      // Название помещения — вдоль листа, ужимается, если не влезает. Когда
      // под схемой места нет (сверху стоит объёмный вид), обходимся номером:
      // имя петли есть в таблице контуров.
      var room = P.yName - yNo - 5.4;
      if (room > 10) o.push(txt(x + 1.1, yNo + 5.4, r.name,
        { rotate: 90, size: SZ.small, fit: (r.name.length * 1.5 > room) ? room : 0 }));
    });

    // Позиции: узел, гребёнки, сервопривод, евроконус, труба, шкаф. Шарики
    // справа стоят столбиком за габаритом шкафа, чтобы не лезть на штриховую
    // рамку и на подписи торцевых групп.
    var I = ctx.parts.idx, x1 = xOf(0), xM = xOf(M - 1);
    balloon(o, GX - 6, GY + 6, GX, GY + 9, I.group);
    balloon(o, L - 14, YS - 9, L + 6, YS - BH / 2, I.sup);
    balloon(o, L - 14, YR + 9, L + 6, YR + BH / 2, I.ret);
    if (I.servo) balloon(o, R + 13, YR + 22, xM + 3 + 2.4, YR + BH / 2 + 10.4, I.servo);
    balloon(o, x1 - 12, yBr - 6, x1 - 3, yBr - 3, I.euro);
    balloon(o, R + 13, yBr - 2, xM + 3, yBr - 6, I.pipe);
    if (I.cab) {
      // шкаф — габарит вокруг узла, штрихом
      o.push(rect(GX - 4, P.yGrp - 6, (R + 6) - (GX - 4), (YR + 26) - (P.yGrp - 6),
        { w: 0.25, dash: '3,2' }));
      balloon(o, GX - 6, P.yGrp - 16, GX - 4, P.yGrp - 6, I.cab);
    }
    return { L: L, R: R };
  }

  // ─── Таблицы ───────────────────────────────────────────────────────────
  function table(o, X, Y, W, hdr, body, opts) {
    opts = opts || {};
    var rh = opts.rh || 5.6, Wsum = W.reduce(function (a, b) { return a + b; }, 0);
    if (opts.title) o.push(txt(X + Wsum / 2, Y - 2.2, opts.title, { anchor: 'middle', size: 4.2 }));
    var all = [hdr].concat(body);
    all.forEach(function (r, ri) {
      var y = Y + ri * rh, x = X;
      o.push(rect(X, y, Wsum, rh, { w: 0.2 }));
      W.forEach(function (w, ci) {
        var v = r[ci] == null ? '' : r[ci];
        var left = opts.left && opts.left.indexOf(ci) >= 0;
        o.push(txt(left ? x + 1.2 : x + w / 2, y + rh / 2 + 1.1, v,
          { anchor: left ? 'start' : 'middle', size: ri ? SZ.tbl : 3.4,
            fit: String(v).length * 1.6 > w ? w - 2 : 0 }));
        if (ri === 0 && ci) o.push(line(x, Y, x, Y + all.length * rh, { w: 0.15 }));
        x += w;
      });
    });
    return Y + all.length * rh;
  }

  // ─── Лист ──────────────────────────────────────────────────────────────
  function body(rows, ctx) {
    var o = [], num1 = window.projectPlans.num1;
    o.push(txt(217.5, 14.8, ctx.title, { anchor: 'middle', size: SZ.title }));

    // Объёмный вид узла — как в проектах-образцах; под ним схема подключения
    // с номерами петель (в 3D номера не подписать) и таблицы справа.
    var P = { x0: 30, w: 218, ySup: 92, yRet: 114, yGrp: 44, yLoop: 152, yName: 210 };
    var photoUrl = ctx.photo && ctx.photo.url ? ctx.photo.url : ctx.photo;
    if (photoUrl) {
      var ratio = (ctx.photo && ctx.photo.ratio) || 1.58;
      var iw = 148, ih = iw / ratio, ix = 34, iy = 22;
      o.push('<image x="' + n(ix) + '" y="' + n(iy) + '" width="' + n(iw) + '" height="' + n(ih) +
        '" preserveAspectRatio="xMidYMid meet" href="' +
        String(photoUrl).replace(/&/g, '&amp;') + '"/>');
      o.push(rect(ix, iy, iw, ih, { w: 0.25 }));
      o.push(txt(ix + iw, iy - 1.8, 'Общий вид узла', { anchor: 'end', size: SZ.small }));
      // Как и в проектах-образцах: вид — принципиальная схема обвязки,
      // фактическое число выходов берут из таблицы контуров и с плана
      o.push(txt(ix, iy + ih + 3.4, 'На виде показана принципиальная схема обвязки;' +
        ' число выходов — по таблице контуров.', { size: SZ.small }));
      // схема опускается под картинку и примечание к ней
      P = { x0: 30, w: 218, ySup: iy + ih + 32, yRet: iy + ih + 50,
        yGrp: iy + ih + 18, yLoop: iy + ih + 80, yName: iy + ih + 82 };
    }
    scheme(o, rows, ctx, P);

    // таблица контуров: чем настраивать расходомеры и что к чему подключено
    var TX = 262, TW = [10, 54, 20, 22, 26];
    var mSum = 0, gSum = 0;
    var tb = rows.map(function (r) {
      mSum += r.m; gSum += r.flow;
      return [r.no, r.name, r.step, r.m, num1(r.flow)];
    });
    tb.push(['', 'Итого', '', mSum, num1(gSum)]);
    var y2 = table(o, TX, 26, TW, ['№', 'Помещение', 'Шаг, мм', 'L, м', 'G, л/мин'], tb,
      { title: 'Контуры коллектора', left: [1] });

    // экспликация узла — под таблицей контуров
    y2 += 8;
    y2 = table(o, TX, y2, [10, 122], ['Поз.', 'Наименование'], ctx.parts.rows,
      { title: 'Состав узла', left: [1] });

    // примечания: ниже и таблиц, и номеров петель под схемой
    var ny = Math.max(y2 + 8, P.yLoop + 14, 224), NX = 30;
    o.push(txt(NX, ny, 'Указания по монтажу и наладке', { size: 4.2 }));
    [
      '1. Расходомеры подающей гребёнки настроить по колонке G таблицы контуров' +
        ' (ΔT = ' + window.projectPlans.UFH_DT + ' °C).',
      '2. Петли подключать к выходам по номерам таблицы — те же номера стоят на листе' +
        ' «Тёплый пол».',
      '3. Труба петли в стяжке — цельная, без соединений; длина петли не более 100 м.',
      '4. Опрессовка петель водой 6 бар не менее 24 ч; стяжку заливать под давлением' +
        ' 3 бар.',
      '5. Прогрев стяжки начинать не ранее чем через 28 суток, поднимая температуру' +
        ' на 5 °C в сутки.'
    ].forEach(function (s, i) {
      o.push(txt(NX, ny + 6 + i * 4.6, s, { size: SZ.txt }));
    });
    return o.join('');
  }

  /**
   * Контекст листа: имена оборудования из сметы. Ищем сначала внутри раздела
   * «Водяной тёплый пол» — иначе труба и евроконус подхватываются из
   * радиаторного раздела, где они другого типоразмера.
   */
  function buildCtx(items) {
    var ufh = (items || []).filter(function (i) {
      return /т[её]пл\S*\s+пол/i.test(String(i.sectionTitle || ''));
    });
    var own = ufh.length ? ufh : (items || []);
    var both = function (re, not) { return pick(own, re, not) || pick(items, re, not); };
    return {
      groupName: both(/насосн\S*\s+групп\S*.{0,40}(т[её]пл|ТП)|(т[её]пл|ТП).{0,40}насосн\S*\s+групп/i) ||
        both(/узел\s+подмеса|смесительн\S*\s+узел/i),
      manName: both(/коллектор\s*ТП/i) || both(/коллектор.{0,30}т[её]пл/i),
      servo: both(/сервопривод/i),
      euro: both(/евроконус/i),
      pipe: pick(own, /труб\S*.{0,60}16\s*[хx×]\s*2/i),
      cabinet: both(/шкаф\S*\s+коллекторн|коллекторн\S*\s+шкаф|шкаф\S*\s+распределительн/i)
    };
  }

  /**
   * Листы узла коллектора: по листу на каждый коллектор ТП.
   * opts: { code, sheetStart, steps, stepMm, rooms, items, photo }
   */
  function sheets(plans, opts) {
    opts = opts || {};
    var out = [];
    var PP = window.projectPlans;
    if (!plans || !plans.floors || !PP || !PP.loopRows || !window.projectSheets) return out;
    var base = buildCtx(opts.items || []);
    var many = plans.floors.filter(function (f) { return f && f.pxPerM; }).length > 1;
    var num = opts.sheetStart || 1;
    var fmt = opts.num || function (v) { return String(v); };
    plans.floors.forEach(function (f, fi) {
      if (!f || !f.pxPerM) return;
      var step = (opts.steps && opts.steps[fi]) || opts.stepMm || 150;
      var rooms = (opts.rooms || []).filter(function (r) { return (r.floor || 1) === fi + 1; });
      var rows = PP.loopRows(f, step, rooms);
      if (!rows.length) return;
      // коллекторы делятся по 12 выходов — ровно как в смете
      var k = Math.ceil(rows.length / MAX_OUT), from = 0;
      for (var j = 0; j < k; j++) {
        var sz = Math.floor(rows.length / k) + (j < (rows.length % k) ? 1 : 0);
        var part = rows.slice(from, from + sz);
        from += sz;
        var title = 'Узел обвязки коллектора тёплого пола' +
          (many ? ' ' + (fi + 1) + ' этажа' : '') + (k > 1 ? '. Коллектор ' + (j + 1) : '');
        var ctx = Object.assign({}, base, { title: title, photo: opts.photo || null });
        ctx.parts = nodeParts(opts.items, ctx);
        out.push({ title: title, svg: window.projectSheets.sheet({
          code: opts.code, sheet: fmt(num++), body: body(part, ctx) }) });
      }
    });
    return out;
  }

  window.projectUfhManifold = { sheets: sheets };
})();
