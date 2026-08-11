/* project_plans.js — листы «План N этажа» и «Тёплый пол N этажа».
 *
 * Данные готовит редактор plan_editor.html и кладёт в localStorage
 * ('floor_plans_v1'): этажи с масштабом pxPerM и зонами (тёплый пол /
 * радиаторы / котельная), точки зон — в пикселях изображения подложки.
 *
 * Сама подложка (даунскейл ~1600 px) лежит на Beget, в разметке от неё
 * остаётся имя файла; в адрес его разворачивает страница листов
 * (sheet_demo.html), сюда f.img приходит уже готовой ссылкой. У записей,
 * сделанных до переноса, там по-прежнему data:-картинка — работает и так.
 *
 * Лист плана: подложка + зоны (штриховка 45° у ТП, контуры, подписи с
 * площадями), легенда, печатный масштаб. Лист ТП: подложка приглушена,
 * в зонах — змейка укладки с шагом из сметы, таблица петель.
 *
 * Петли считает floorLoops() — тем же расчётом пользуется смета (app.js):
 * длина трубы и число выходов коллектора берутся из нарисованной укладки,
 * иначе на листе было бы одно, а в деньгах другое.
 *
 * Требует project_sheets.js (кроме floorLoops — она чистая геометрия и
 * работает и в калькуляторе, где листов нет). Глобал: window.projectPlans
 */
(function () {
  'use strict';

  var AVAIL = { x0: 100, y0: 24, x1: 405, y1: 266 };  // поле под подложку, мм листа
  var COLT = { tp: '#ff8000', rad: '#d22222', boiler: '#5577aa', wc: '#0b7285' };
  var NAMES = { tp: 'Тёплый пол', rad: 'Радиаторы', boiler: 'Котельная', wc: 'Санузел' };

  function n(v) { return Math.round(v * 100) / 100; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function txt(x, y, s, o) {
    o = o || {};
    var a = ' x="' + n(x) + '" y="' + n(y) + '" font-size="' + (o.size || 3.68) + '"';
    if (o.anchor) a += ' text-anchor="' + o.anchor + '"';
    // Латиница вне покрытия чертёжного шрифта (сабсеты из PDF-образца) —
    // запасным семейством целиком, иначе слово выйдет разнобоем букв.
    var PS = window.projectSheets;
    if (PS && PS.fontFor && PS.fontFor(s, null) === PS.FONT_LAT)
      a += ' font-family="' + PS.FONT_LAT + '"';
    if (o.fill) a += ' style="fill:' + o.fill + '"';
    return '<text' + a + '>' + esc(s) + '</text>';
  }
  function polyPts(pts, X, Y) {
    return pts.map(function (p) { return n(X(p[0])) + ',' + n(Y(p[1])); }).join(' ');
  }
  function centroid(pts) {
    var x = 0, y = 0;
    pts.forEach(function (p) { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
  }
  function areaM2(z, f) {
    var s = 0, m = f.pxPerM || 1;
    for (var i = 0; i < z.pts.length; i++) {
      var a = z.pts[i], b = z.pts[(i + 1) % z.pts.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(s / 2) / (m * m);
  }
  function bbox(pts) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    pts.forEach(function (p) {
      x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
    });
    return [x0, y0, x1, y1];
  }

  /** Трансформация подложки этажа в поле листа: масштаб и origin.
   *  box — своё поле (у сводного плана справа таблица, снизу составы). */
  function fit(f, box) {
    var B = box || AVAIL;
    var s = Math.min((B.x1 - B.x0) / f.w, (B.y1 - B.y0) / f.h);
    var ox = B.x0 + ((B.x1 - B.x0) - f.w * s) / 2;
    var oy = B.y0 + ((B.y1 - B.y0) - f.h * s) / 2;
    return {
      s: s, ox: ox, oy: oy,
      X: function (px) { return ox + px * s; },
      Y: function (px) { return oy + px * s; }
    };
  }

  function imageTag(f, t, op) {
    // Подложка приходит либо картинкой (data:...), либо адресом на сервере
    // подложек. В адресе есть «&» между параметрами, а это разметка внутри
    // SVG-атрибута — экранируем, иначе ссылка обрывается на первом же «&».
    var href = String(f.img || '').replace(/&/g, '&amp;');
    return '<image x="' + n(t.ox) + '" y="' + n(t.oy) + '" width="' + n(f.w * t.s) +
      '" height="' + n(f.h * t.s) + '" preserveAspectRatio="none"' +
      (op ? ' opacity="' + op + '"' : '') + ' href="' + href + '"/>';
  }

  function legend(rows, Lx, Ty) {
    var o = [];
    rows.forEach(function (r, i) {
      var y = Ty + i * 6.4;
      o.push('<rect x="' + n(Lx) + '" y="' + n(y) + '" width="5" height="4" style="fill:' +
        r[1] + ';fill-opacity:0.5;stroke:' + r[1] + ';stroke-width:0.3"/>');
      o.push(txt(Lx + 7, y + 3.2, r[0], { size: 3.3 }));
    });
    return o.join('');
  }

  function title(s) {
    return txt(217.5, 14.8, s, { size: 7.36, anchor: 'middle' });
  }

  /** Лист «План N этажа» */
  function floorBody(f, num) {
    var t = fit(f), o = [];
    o.push(imageTag(f, t));
    o.push('<defs><pattern id="tpH' + num + '" width="2.4" height="2.4" patternUnits="userSpaceOnUse"' +
      ' patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2.4"' +
      ' style="stroke:' + COLT.tp + ';stroke-width:0.45"/></pattern></defs>');
    var used = {};
    (f.zones || []).forEach(function (z) {
      var col = COLT[z.type]; used[z.type] = 1;
      var fill = z.type === 'tp' ? 'url(#tpH' + num + ')'
        : z.type === 'boiler' ? 'rgba(85,119,170,0.18)' : 'none';
      o.push('<polygon points="' + polyPts(z.pts, t.X, t.Y) + '" style="fill:' + fill +
        ';stroke:' + col + ';stroke-width:0.5' +
        (z.type === 'rad' ? ';stroke-dasharray:2.2,1.2' : '') + '"/>');
      var c = centroid(z.pts);
      var nm = (z.name && z.name !== NAMES[z.type]) ? z.name + ' — ' : '';
      var label = nm + NAMES[z.type] + ', ' + areaM2(z, f).toFixed(1) + ' м²';
      o.push('<rect x="' + n(t.X(c[0]) - label.length * 0.86) + '" y="' + n(t.Y(c[1]) - 2.6) +
        '" width="' + n(label.length * 1.72) + '" height="4.6" rx="0.8" style="fill:#ffffff;fill-opacity:0.82"/>');
      o.push(txt(t.X(c[0]), t.Y(c[1]) + 0.9, label, { size: 3.1, anchor: 'middle', fill: col }));
    });
    // радиаторы — значки вдоль стен (точечные приборы, не зоны)
    (f.rads || []).forEach(function (r) {
      used.rad = 1;
      var wl = r.w * t.s, hl = Math.max(1.1, 0.14 * (f.pxPerM || 100) * t.s);
      var g = '<g transform="translate(' + n(t.X(r.x)) + ',' + n(t.Y(r.y)) + ') rotate(' + (r.ang || 0) + ')">';
      g += '<rect x="' + n(-wl / 2) + '" y="' + n(-hl / 2) + '" width="' + n(wl) + '" height="' + n(hl) +
        '" style="fill:rgba(210,34,34,0.3);stroke:#d22222;stroke-width:0.35"/>';
      for (var s2 = -2; s2 <= 2; s2++) {
        var xs = s2 * wl / 5.6;
        g += '<line x1="' + n(xs) + '" y1="' + n(-hl / 2) + '" x2="' + n(xs) + '" y2="' + n(hl / 2) +
          '" style="stroke:#d22222;stroke-width:0.25"/>';
      }
      o.push(g + '</g>');
    });
    if (f.coll) collectorMark(f.coll, t, f, o);
    var rows = Object.keys(used).map(function (k) { return [NAMES[k], COLT[k]]; });
    if (rows.length) {
      o.push(txt(30, 226, 'Условные обозначения', { size: 4.2 }));
      o.push(legend(rows, 30, 230));
    }
    var scale = f.pxPerM ? Math.round(1000 / (f.pxPerM * t.s)) : 0;
    if (scale) o.push(txt(30, 260, 'Масштаб печати ~1:' + scale + ' (лист А3)', { size: 3.3 }));
    o.push(txt(228, 273.8, 'Зоны нанесены в редакторе планов heatcalc.ru по подложке заказчика.', { size: 3.0 }));
    return o.join('');
  }

  function pip(p, pts) {  // точка внутри полигона (ray casting)
    var inn = false;
    for (var a = 0, b = pts.length - 1; a < pts.length; b = a++) {
      if ((pts[a][1] > p[1]) !== (pts[b][1] > p[1]) &&
          p[0] < (pts[b][0] - pts[a][0]) * (p[1] - pts[a][1]) / (pts[b][1] - pts[a][1]) + pts[a][0])
        inn = !inn;
    }
    return inn;
  }

  function lenPoly(pts) {
    var s = 0;
    for (var i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return s;
  }

  // ═══ Укладка тёплого пола ═══════════════════════════════════════════════
  // Одна петля на помещение: змейка с заданным шагом, оба конца выведены в
  // коллектор. Труба строится как ДВЕ ПАРАЛЛЕЛЬНЫЕ НИТКИ одной направляющей
  // (сдвиг ±шаг/2, разворот в дальнем конце) — параллельные линии не
  // пересекаются по построению. Подводка от коллектора входит в ту же
  // направляющую, поэтому подача и обратка непрерывно идут от гребёнки в
  // помещение и обратно, без стыков и обрывов.

  var CELL_DIV = 2;         // клетка растра = шаг/2
  var MAX_LOOP_M = 100;     // предел длины одной петли 16×2,0 мм — запасное значение

  /**
   * Предел длины петли, м. Считает его смета (app.ufhLoopMax) — там известны и
   * труба, и шаг, и допустимые потери. Лист и смета обязаны показывать одну и
   * ту же укладку, поэтому предел у них общий, а не свой у каждого.
   */
  function loopLimit(stepMm) {
    try {
      if (window.app && typeof app.ufhLoopMax === 'function') return app.ufhLoopMax(stepMm);
    } catch (e) { /* расчёт ещё не поднялся — работаем по запасному значению */ }
    return MAX_LOOP_M;
  }

  /** Маска зоны на растре: клетки, чей центр внутри полигона */
  function zoneMask(z, stepPx) {
    var bb = bbox(z.pts), cell = stepPx / CELL_DIV;
    var W = Math.ceil((bb[2] - bb[0]) / cell) + 2;
    var H = Math.ceil((bb[3] - bb[1]) / cell) + 2;
    if (W < 4 || H < 4 || W * H > 400000) return null;
    var ox = bb[0] - cell, oy = bb[1] - cell;
    var inside = new Uint8Array(W * H), x, y, cnt = 0;
    for (y = 0; y < H; y++)
      for (x = 0; x < W; x++)
        if (pip([ox + (x + 0.5) * cell, oy + (y + 0.5) * cell], z.pts)) { inside[y * W + x] = 1; cnt++; }
    return cnt ? { W: W, H: H, ox: ox, oy: oy, cell: cell, inside: inside, cnt: cnt } : null;
  }

  /** Отрезки маски вдоль ряда idx (vertical — ряды вертикальные) */
  function runsAt(m, vertical, idx) {
    var W = m.W, len = vertical ? m.H : m.W, out = [], start = -1, k;
    for (k = 0; k < len; k++) {
      var on = vertical ? m.inside[k * W + idx] : m.inside[idx * W + k];
      if (on && start < 0) start = k;
      if (start >= 0 && (!on || k === len - 1)) {
        var end = on ? k : k - 1;
        if (end > start) out.push([start, end]);
        start = -1;
      }
    }
    return out;
  }

  /** Ряды укладки через 2·шаг. В ряду берём самый длинный отрезок: комната
   *  заполняется одной непрерывной змейкой, а не рассыпается на куски. */
  function fillRows(m, vertical) {
    var lines = vertical ? m.W : m.H, lo = -1, hi = -1, i, all = [];
    for (i = 0; i < lines; i++) {
      var rs = runsAt(m, vertical, i);
      all.push(rs);
      if (rs.length) { if (lo < 0) lo = i; hi = i; }
    }
    if (lo < 0) return null;
    var rows = [], multi = 0, len = 0;
    for (i = lo + CELL_DIV; i <= hi - CELL_DIV + 1; i += 2 * CELL_DIV) {
      var rr = all[i];
      if (!rr || !rr.length) continue;
      if (rr.length > 1) multi++;
      var best = rr[0], j;
      for (j = 1; j < rr.length; j++) if (rr[j][1] - rr[j][0] > best[1] - best[0]) best = rr[j];
      rows.push({ idx: i, a: best[0], b: best[1] });
      len += best[1] - best[0];
    }
    return rows.length ? { rows: rows, multi: multi, len: len } : null;
  }

  /** Направляющая змейка по рядам: колена всегда внутри соседних рядов */
  function guideOfRows(rows, m, vertical, anchor) {
    var ins = CELL_DIV;                       // отступ от стен вдоль ряда
    function px(line, along) {
      return vertical ? [m.ox + (line + 0.5) * m.cell, m.oy + (along + 0.5) * m.cell]
                      : [m.ox + (along + 0.5) * m.cell, m.oy + (line + 0.5) * m.cell];
    }
    function dist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }
    if (anchor) {
      var r0 = rows[0], rN = rows[rows.length - 1];
      if (dist(px(rN.idx, (rN.a + rN.b) / 2), anchor) < dist(px(r0.idx, (r0.a + r0.b) / 2), anchor))
        rows = rows.slice().reverse();
    }
    // координата точки входа вдоль ряда — с неё начинается первый ряд, иначе
    // труба от подводки шла бы через всю комнату к дальнему концу поверх себя
    var entryC = null;
    if (anchor) {
      entryC = (vertical ? (anchor[1] - m.oy) : (anchor[0] - m.ox)) / m.cell - 0.5;
    }
    var pts = [], lastLine = null, lastC = null;
    rows.forEach(function (r, ri) {
      var aC = r.a + ins, bC = r.b - ins;
      if (bC <= aC) { var mid = (r.a + r.b) / 2; aC = bC = mid; }
      var startC, endC;
      startC = (lastC === null)
        ? (entryC === null ? aC : Math.max(aC, Math.min(bC, entryC)))
        : Math.max(aC, Math.min(bC, lastC));
      endC = (Math.abs(startC - aC) < Math.abs(startC - bC)) ? bC : aC;
      // Разворот делаем там, где ряды перекрываются: у скошенных стен ряды
      // разной длины, и без этого труба возвращалась бы по тому же ряду
      // назад — сдвинутая пара на таком возврате сама себя пересекала.
      var nx = rows[ri + 1];
      if (nx) {
        var na = nx.a + ins, nb = nx.b - ins;
        if (nb > na) endC = Math.max(na, Math.min(nb, endC));
      }
      if (lastC !== null) {
        pts.push(px(lastLine, startC));       // вдоль прошлого ряда до общей координаты
      }
      pts.push(px(r.idx, startC));            // поперёк — на новый ряд
      pts.push(px(r.idx, endC));              // и по нему до конца
      lastLine = r.idx; lastC = endC;
    });
    return pts.length >= 2 ? pts : null;
  }

  /** Ломаную маршрута приводим к прямым углам — трубу ведут вдоль стен */
  function orthoPath(pts) {
    var out = [pts[0].slice()], i;
    for (i = 1; i < pts.length; i++) {
      var a = out[out.length - 1], b = pts[i];
      if (Math.abs(b[0] - a[0]) > 1e-6 && Math.abs(b[1] - a[1]) > 1e-6) out.push([b[0], a[1]]);
      out.push(b.slice());
    }
    return out;
  }

  /** Параллельная линия орто-полилинии: сдвиг на h влево по ходу (h<0 —
   *  вправо). Стыки — пересечением сдвинутых прямых, линии остаются орто. */
  function offsetOrtho(pts, h) {
    var p = [], i;
    for (i = 0; i < pts.length; i++)
      if (!p.length || Math.abs(p[p.length - 1][0] - pts[i][0]) > 1e-6 ||
                       Math.abs(p[p.length - 1][1] - pts[i][1]) > 1e-6) p.push(pts[i]);
    if (p.length < 2) return null;
    var segs = [];
    for (i = 0; i + 1 < p.length; i++) {
      var dx = p[i + 1][0] - p[i][0], dy = p[i + 1][1] - p[i][1];
      var L = Math.hypot(dx, dy) || 1, nx = dy / L, ny = -dx / L;
      segs.push({ a: [p[i][0] + nx * h, p[i][1] + ny * h],
                  b: [p[i + 1][0] + nx * h, p[i + 1][1] + ny * h],
                  hz: Math.abs(dy) < 1e-6 });
    }
    var out = [segs[0].a];
    for (i = 1; i < segs.length; i++) {
      var pr = segs[i - 1], cu = segs[i];
      if (pr.hz === cu.hz) {
        // Разворот на месте (труба идёт по ряду назад): сдвинутые линии лежат
        // по разные стороны от ряда, и соединять их надо поперечиной. Раньше
        // здесь ставилась одна точка — и вместо разворота получалась косая,
        // пересекавшая вторую трубу петли.
        out.push(pr.b); out.push(cu.a);
        continue;
      }
      out.push(pr.hz ? [cu.a[0], pr.a[1]] : [pr.a[0], cu.a[1]]);
    }
    out.push(segs[segs.length - 1].b);
    return unfold(out, p);
  }

  /**
   * Чистка вывернутых колен параллельной линии.
   *
   * На внутренней стороне поворота сдвинутая линия идёт назад, если колено
   * короче двойного сдвига: две трубы одной петли тогда пересекаются — на
   * полу так не кладут. Вывернутый отрезок убираем, соседние продлеваем до
   * их пересечения (линии орто, поэтому это одна точка).
   */
  function unfold(out, src) {
    for (var pass = 0; pass < 12; pass++) {
      var bad = -1, i;
      for (i = 0; i + 1 < out.length && i + 1 < src.length; i++) {
        var dx = out[i + 1][0] - out[i][0], dy = out[i + 1][1] - out[i][1];
        var sx = src[i + 1][0] - src[i][0], sy = src[i + 1][1] - src[i][1];
        if (dx * sx + dy * sy < -1e-9) { bad = i; break; }
      }
      if (bad < 0) break;
      var a = out[bad - 1], b = out[bad + 2];
      if (!a || !b) { out.splice(bad, 2); src.splice(bad, 2); continue; }
      var join = (Math.abs(a[1] - out[bad][1]) < 1e-6) ? [b[0], a[1]] : [a[0], b[1]];
      out.splice(bad, 2, join); src.splice(bad, 2, src[bad]);
    }
    // и подчистка нулевых звеньев, оставшихся после склейки
    var res = [out[0]];
    for (var j = 1; j < out.length; j++)
      if (Math.hypot(out[j][0] - res[res.length - 1][0], out[j][1] - res[res.length - 1][1]) > 1e-6)
        res.push(out[j]);
    return res.length >= 2 ? res : out;
  }

  /** Одна петля по набору рядов: {sup, ret, lenM, m} в пикселях подложки */
  function buildLoop(rows, m, vertical, anchor, lead, stepPx, ppm) {
    var P = guideOfRows(rows, m, vertical, anchor);
    if (!P) return null;
    // подводка — начало той же направляющей; стык выпрямляем вместе со всем
    // маршрутом, чтобы на нём не возникло косого отрезка
    if (lead && lead.length > 1) P = orthoPath(lead.concat(P));
    var h = stepPx / 2;
    var sup = offsetOrtho(P, h), ret = offsetOrtho(P, -h);
    if (!sup || !ret) return null;
    ret = ret.slice().reverse();
    var lenM = (lenPoly(sup) + lenPoly(ret) +
      Math.hypot(sup[sup.length - 1][0] - ret[0][0], sup[sup.length - 1][1] - ret[0][1])) / ppm;
    return { sup: sup, ret: ret, lenM: lenM, m: Math.round(lenM) };
  }

  /** Ряды на k примерно равных по длине трубы полос: длинную комнату кладут
   *  не одной петлёй, а несколькими, каждая со своей подводкой к гребёнке. */
  function splitRows(rows, k) {
    var w = rows.map(function (r) { return (r.b - r.a) + 2 * CELL_DIV; });
    var tot = w.reduce(function (a, b) { return a + b; }, 0) || 1;
    var out = [], cur = [], acc = 0, gi = 1, i;
    for (i = 0; i < rows.length; i++) {
      cur.push(rows[i]); acc += w[i];
      var left = rows.length - i - 1;
      if (gi < k && acc >= tot * gi / k && left >= k - gi) { out.push(cur); cur = []; gi++; }
    }
    if (cur.length) out.push(cur);
    return out;
  }

  /**
   * Петли помещения: [{sup, ret, lenM, m}] в пикселях подложки, либо null,
   * если зона мала даже для одного ряда (лист рисует встречную змейку по
   * габариту). lead — маршрут от коллектора (из редактора планов),
   * становится началом направляющей: подача и обратка непрерывно идут от
   * гребёнки и обратно.
   *
   * Петля длиннее maxLenM делится на несколько: по 16-й трубе на одном
   * выходе коллектора больше сотни метров не гоняют — не продавит насос.
   */
  function layZoneLoops(z, f, stepMm, entry, lead, maxLenM) {
    var ppm = f.pxPerM; if (!ppm) return null;
    var stepPx = stepMm / 1000 * ppm;
    var m = zoneMask(z, stepPx);
    if (!m) return null;
    var anchor = entry || (f.coll ? [f.coll.x, f.coll.y] : null);
    // Направление рядов выбираем так, чтобы (1) комната не разрывалась на куски
    // и (2) ввод от коллектора приходился на КРАЙ хода змейки. Иначе труба от
    // подводки шла бы к началу укладки прямо по уже уложенному полю.
    function score(R, vertical) {
      if (!R) return 1e9;
      var e = 0;
      if (anchor) {
        var line = (vertical ? (anchor[0] - m.ox) : (anchor[1] - m.oy)) / m.cell;
        var lo = R.rows[0].idx, hi = R.rows[R.rows.length - 1].idx;
        var pos = hi > lo ? (line - lo) / (hi - lo) : 0;
        pos = Math.max(0, Math.min(1, pos));
        e = Math.min(pos, 1 - pos);
      }
      return R.multi * 10 + e * 4 - R.len / 1e6;
    }
    var A = fillRows(m, false), B = fillRows(m, true);
    var vertical = score(B, true) < score(A, false);
    var R = vertical ? B : A;
    if (!R) return null;
    var one = buildLoop(R.rows, m, vertical, anchor, lead, stepPx, ppm);
    if (!one) return null;
    var lim = maxLenM || MAX_LOOP_M;
    var k = Math.min(R.rows.length, Math.ceil(one.lenM / lim));
    if (k < 2) return [one];
    // Каждая петля тянет собственную подводку от коллектора, поэтому после
    // деления сумма растёт и полосы могут снова не уложиться в предел —
    // добавляем петлю и пробуем ещё раз (не больше трёх попыток).
    var best = null, tries;
    for (tries = 0; tries < 4 && k <= R.rows.length; tries++, k++) {
      var parts = splitRows(R.rows, k), out = [], i, lp, worst = 0;
      for (i = 0; i < parts.length; i++) {
        lp = buildLoop(parts[i], m, vertical, anchor, lead, stepPx, ppm);
        if (!lp) { out = null; break; }
        worst = Math.max(worst, lp.lenM);
        out.push(lp);
      }
      if (!out || !out.length) break;         // не поделилось — оставляем как было
      if (worst <= lim) return out;
      if (!best) best = out;
    }
    return best || [one];
  }

  /** Совместимость: одна петля зоны (стенд укладки) */
  function layZone(z, f, stepMm, entry, lead) {
    var lp = layZoneLoops(z, f, stepMm, entry, lead, 1e9);
    return lp ? lp[0] : null;
  }

  /**
   * Петли тёплого пола этажа — общий расчёт листа и сметы.
   * [{ i, name, area, est, loops: [{sup, ret, lenM, m}] }], i — индекс зоны.
   * est=true — геометрия не построилась (узкая зона), длины оценены по
   * площади; лист рисует такую зону встречной змейкой по габариту.
   */
  function floorLoops(f, stepMm, maxLenM) {
    var out = [];
    if (!f || !f.pxPerM) return out;
    var lim = maxLenM || loopLimit(stepMm), leads = f.leads || [];
    (f.zones || []).forEach(function (z, i) {
      if (z.type !== 'tp' || !z.pts || z.pts.length < 3) return;
      var lead = null;
      for (var li = 0; li < leads.length; li++) if (leads[li].i === i) { lead = leads[li]; break; }
      var leadPts = (lead && lead.pts && lead.pts.length > 1) ? lead.pts : null;
      var entry = leadPts ? leadPts[leadPts.length - 1] : (f.coll ? [f.coll.x, f.coll.y] : null);
      var S = areaM2(z, f), lp = null;
      try { lp = layZoneLoops(z, f, stepMm, entry, leadPts, lim); } catch (e) { lp = null; }
      if (!lp) {
        // Оценка по площади: та же формула, что в смете без планов.
        var est = S / (stepMm / 1000) * 1.05;
        var k = Math.max(1, Math.ceil(est / lim));
        lp = [];
        for (var j = 0; j < k; j++) lp.push({ lenM: est / k, m: Math.max(5, Math.round(est / k)) });
      }
      out.push({ i: i, name: z.name || '', area: S, est: !lp[0].sup, loops: lp });
    });
    return out;
  }

  /** Полилиния, сдвинутая на o px перпендикулярно ходу (для пары подводок) */
  function offsetPoly(pts, o) {
    return pts.map(function (p, i) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var L = Math.hypot(dx, dy) || 1;
      return [p[0] - dy / L * o, p[1] + dx / L * o];
    });
  }

  function pathD(pts, t) {
    return pts.map(function (p, i) {
      return (i ? 'L' : 'M') + n(t.X(p[0])) + ',' + n(t.Y(p[1]));
    }).join('');
  }

  /**
   * Тот же путь, но с закруглёнными поворотами: труба гнётся по радиусу, а
   * не ломается под угол. Радиус — не больше половины короткой из соседних
   * сторон, поэтому на частых коленах скругление само уменьшается.
   */
  function pathR(pts, t, r) {
    if (!pts || pts.length < 3) return pathD(pts, t);
    var P = pts.map(function (p) { return [t.X(p[0]), t.Y(p[1])]; });
    var d = ['M' + n(P[0][0]) + ',' + n(P[0][1])];
    for (var i = 1; i < P.length - 1; i++) {
      var a = P[i - 1], b = P[i], c = P[i + 1];
      var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      var l2 = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
      var rr = Math.min(r, l1 / 2, l2 / 2);
      if (rr < 0.05) { d.push('L' + n(b[0]) + ',' + n(b[1])); continue; }
      var p1 = [b[0] + (a[0] - b[0]) / l1 * rr, b[1] + (a[1] - b[1]) / l1 * rr];
      var p2 = [b[0] + (c[0] - b[0]) / l2 * rr, b[1] + (c[1] - b[1]) / l2 * rr];
      d.push('L' + n(p1[0]) + ',' + n(p1[1]));
      d.push('Q' + n(b[0]) + ',' + n(b[1]) + ' ' + n(p2[0]) + ',' + n(p2[1]));
    }
    var L = P[P.length - 1];
    d.push('L' + n(L[0]) + ',' + n(L[1]));
    return d.join('');
  }

  /**
   * Стены и окна этажа — вектором, из геометрии редактора планов (f.geom).
   *
   * Подложка у монтажников любая: фото, скан, экспорт CAD, — а лист должен
   * выглядеть одинаково, как в проектах-образцах. Поэтому план рисуется по
   * контурам стен, а подложка остаётся запасным вариантом для планов,
   * размеченных до появления геометрии.
   */
  function wallsBody(f, t) {
    var g = f.geom;
    if (!g || !(g.walls || []).length) return '';
    var o = [];
    o.push('<g style="fill:#8b98ab;stroke:#5b6675;stroke-width:0.12;fill-rule:evenodd">');
    g.walls.forEach(function (pl) { o.push('<path d="' + pathD(pl, t) + 'Z"/>'); });
    o.push('</g>');
    // Окно: проём выбирается из стены белым, по краям — переплёт двумя
    // тонкими линиями вдоль стены (в оригинале так же).
    (g.wins || []).forEach(function (w) {
      var L = w.w * t.s, th = Math.max(0.7, 0.32 * (f.pxPerM || 100) * t.s);
      o.push('<g transform="translate(' + n(t.X(w.x)) + ',' + n(t.Y(w.y)) +
        ') rotate(' + (w.ang || 0) + ')">' +
        '<rect x="' + n(-L / 2) + '" y="' + n(-th / 2) + '" width="' + n(L) +
        '" height="' + n(th) + '" style="fill:#ffffff;stroke:#5b6675;stroke-width:0.12"/>' +
        '<line x1="' + n(-L / 2) + '" y1="' + n(-th / 6) + '" x2="' + n(L / 2) +
        '" y2="' + n(-th / 6) + '" style="stroke:#5b6675;stroke-width:0.1"/>' +
        '<line x1="' + n(-L / 2) + '" y1="' + n(th / 6) + '" x2="' + n(L / 2) +
        '" y2="' + n(th / 6) + '" style="stroke:#5b6675;stroke-width:0.1"/></g>');
      // Размер окна — как в проектах-образцах, над проёмом: ширина берётся
      // стандартная (редактор округляет замер), поэтому размер не «плавает».
      if (w.mm) {
        var lx = t.X(w.x), ly = t.Y(w.y);
        var vert = Math.abs((w.ang || 0) % 180) > 45;
        if (vert) o.push('<text x="' + n(lx - 2.2) + '" y="' + n(ly) + '" font-size="2.6"' +
          ' text-anchor="middle" transform="rotate(-90 ' + n(lx - 2.2) + ' ' + n(ly) + ')">Ш:' +
          w.mm + '</text>');
        else o.push(txt(lx, ly - 2.2, 'Ш:' + w.mm, { size: 2.6, anchor: 'middle' }));
      }
    });
    // Дверь: проём выбирается из стены, от навески идёт полотно и дуга
    // открывания — как на планах проектов-образцов. Сторона навески и
    // сторона открывания приходят из редактора (ближняя поперечная стена
    // и то, где больше свободного места).
    (g.doors || []).forEach(function (d) {
      var L = d.w * t.s, th = Math.max(0.7, 0.32 * (f.pxPerM || 100) * t.s);
      var hx = (d.hinge < 0 ? -1 : 1) * L / 2;          // навеска у края проёма
      var sy = (d.side < 0 ? -1 : 1);                   // куда открывается
      var tipX = hx, tipY = sy * L;                     // конец полотна
      var arc = 'M' + n(hx - (d.hinge < 0 ? -L : L)) + ',0' +
        ' A' + n(L) + ',' + n(L) + ' 0 0 ' + ((d.hinge < 0) === (sy > 0) ? 1 : 0) + ' ' +
        n(tipX) + ',' + n(tipY);
      o.push('<g transform="translate(' + n(t.X(d.x)) + ',' + n(t.Y(d.y)) +
        ') rotate(' + (d.ang || 0) + ')">' +
        '<rect x="' + n(-L / 2) + '" y="' + n(-th / 2) + '" width="' + n(L) +
        '" height="' + n(th) + '" style="fill:#ffffff;stroke:none"/>' +
        '<path d="' + arc + '" style="fill:none;stroke:#5b6675;stroke-width:0.12"/>' +
        '<line x1="' + n(hx) + '" y1="0" x2="' + n(tipX) + '" y2="' + n(tipY) +
        '" style="stroke:#5b6675;stroke-width:0.25"/></g>');
    });
    return o.join('');
  }

  /** Значок коллектора ТП: короткая гребёнка с отводами */
  function collectorMark(c, t, f, o) {
    var w = Math.max(3.5, 0.55 * (f.pxPerM || 100) * t.s), h = w * 0.36;
    var X = t.X(c.x), Y = t.Y(c.y);
    o.push('<rect x="' + n(X - w / 2) + '" y="' + n(Y - h / 2) + '" width="' + n(w) + '" height="' + n(h) +
      '" rx="0.5" style="fill:#ffffff;stroke:#b35900;stroke-width:0.5"/>');
    for (var s2 = -1; s2 <= 1; s2++) {
      var xs = X + s2 * w / 3.4;
      o.push('<line x1="' + n(xs) + '" y1="' + n(Y - h / 2 - 1.1) + '" x2="' + n(xs) + '" y2="' + n(Y - h / 2) +
        '" style="stroke:#b35900;stroke-width:0.45"/>');
    }
    o.push(txt(X, Y + h / 2 + 3.1, 'Коллектор ТП', { size: 2.8, anchor: 'middle', fill: '#b35900' }));
  }

  // Цвета петель — замер по эталону (растр листа «Сводный план сетей»):
  // подача #ff8080, обратка #8080ff — полутона чистых красного и синего.
  var COL_SUP = '#ff8080', COL_RET = '#8080ff';

  // ═══ Расход теплоносителя по петлям ═════════════════════════════════════
  // По расходу балансируют коллектор (расходомеры на подающей гребёнке),
  // поэтому в таблице петель он стоит рядом с шагом и длиной.
  //   G = Q / (c × ΔT),  c = 1,163 Вт·ч/(кг·°C).
  // Перепад ΔT берём у сметы: обычно это 5 К, но если насосу узла на таком
  // расходе не хватает напора, расчёт принимает 7 или 10 К (app.ufhBalance).
  // Числа на листе и в смете обязаны быть одни и те же.
  var UFH_DT = 5, UFH_C = 1.163;
  function ufhDt() {
    try {
      if (window.app && app._ufhBal && app._ufhBal.dT > 0) return app._ufhBal.dT;
    } catch (e) { /* расчёт ещё не поднялся — работаем по обычным 5 К */ }
    return UFH_DT;
  }

  /** Предельная теплоотдача пола при шаге укладки, Вт/м² (СП 60.13330.2020) */
  function qUdeFor(stepMm) {
    return stepMm === 100 ? 90 : (stepMm === 200 ? 50 : 70);
  }

  /** Расход петли, л/мин: Q в ваттах → кг/ч → литры в минуту */
  function flowLmin(qW) {
    return qW / (UFH_C * ufhDt()) / 60;
  }

  /** Число с одним знаком и запятой — как принято на чертежах */
  function num1(v) { return v.toFixed(1).replace('.', ','); }

  /** Помещение расчёта, одноимённое зоне плана (по нему сверяются и площади) */
  function roomOf(zName, rooms) {
    var key = String(zName || '').trim().toLowerCase();
    if (!key) return null;
    for (var i = 0; i < (rooms || []).length; i++)
      if (String(rooms[i].name || '').trim().toLowerCase() === key) return rooms[i];
    return null;
  }

  /**
   * Тепловая мощность зоны, Вт. Основа — теплопотери одноимённой комнаты
   * расчёта, но не больше того, что пол отдаёт при этом шаге: в комнате с
   * радиаторами остаток покрывают они (так же делит нагрузку и смета).
   * Комнаты нет (планы без режима помещений) — считаем по площади и шагу.
   */
  function zoneHeat(room, area, stepMm) {
    var cap = area * qUdeFor(stepMm);
    return (room && room.q > 0) ? Math.min(room.q, cap) : cap;
  }

  /** Запасная укладка совсем узких зон (меньше двух витков): встречная змейка —
   *  подача и обратка идут рядом, как и в спирали; обрезка контуром зоны */
  function serpentine(z, t, f, stepMm, cid) {
    var o = [];
    o.push('<clipPath id="' + cid + '"><polygon points="' + polyPts(z.pts, t.X, t.Y) + '"/></clipPath>');
    var bb = bbox(z.pts);
    var stepPx = stepMm / 1000 * f.pxPerM;          // шаг укладки в пикселях подложки
    var x0 = t.X(bb[0]) + 1, x1 = t.X(bb[2]) - 1;
    var snake = function (yFrom, col) {
      var d = [], dir = 0;
      for (var y = yFrom; y <= bb[3]; y += 2 * stepPx) {
        var Y = t.Y(y);
        if (!d.length) d.push('M' + n(dir ? x1 : x0) + ',' + n(Y));
        d.push('L' + n(dir ? x0 : x1) + ',' + n(Y));
        var yn = y + 2 * stepPx;
        if (yn <= bb[3]) d.push('L' + n(dir ? x0 : x1) + ',' + n(t.Y(yn)));
        dir = 1 - dir;
      }
      if (d.length)
        o.push('<path d="' + d.join('') + '" clip-path="url(#' + cid + ')"' +
          ' style="fill:none;stroke:' + col + ';stroke-width:0.5"/>');
    };
    snake(bb[1] + stepPx / 2, COL_SUP);
    snake(bb[1] + stepPx * 1.5, COL_RET);
    return o.join('');
  }

  /**
   * Петли этажа строкой на петлю — общий источник для таблиц.
   * [{ no, name, area, step, m, flow, byLoss, est, zi, k, li, loop }]
   * Нумерация сквозная по этажу: № в таблице коллектора и № на укладке —
   * одно и то же число. rooms — помещения расчёта уже этого этажа.
   */
  function loopRows(f, stepMm, rooms) {
    var out = [], no = 0, zno = 0;
    floorLoops(f, stepMm, loopLimit(stepMm)).forEach(function (Z) {
      var k = Z.loops.length;
      var zName = Z.name || 'зона ' + (++zno);
      // мощность зоны делится между её петлями поровну — как и площадь
      var rm = roomOf(Z.name, rooms);
      var g = flowLmin(zoneHeat(rm, Z.area, stepMm) / k);
      Z.loops.forEach(function (lp, li) {
        out.push({ no: ++no, name: zName + (k > 1 ? ' ' + (li + 1) + '/' + k : ''),
          area: Z.area / k, step: stepMm, m: lp.m, flow: g,
          byLoss: !!rm, est: !!Z.est, zi: Z.i, k: k, li: li, loop: lp });
      });
    });
    return out;
  }

  // ═══ Листы «Этаж N. 3D вид системы» ════════════════════════════════════
  // В проектах-образцах системы показаны не только планом, но и объёмным
  // видом: плита перекрытия, на ней подложка плана, поверх — трубопроводы
  // своей геометрией, вокруг — таблички контуров с шагом, длиной и расходом.
  // Проекция изометрическая: X = (x − y)·cos30°, Y = (x + y)·sin30° − z.

  var ISO_C = Math.cos(Math.PI / 6), ISO_S = Math.sin(Math.PI / 6);
  var ISO_BOX = { x0: 120, y0: 30, x1: 400, y1: 244 };   // поле под вид

  /**
   * Изометрия этажа: перевод координат подложки (пиксели плана) в лист.
   * z — высота в пикселях подложки, вверх положительная.
   */
  function isoFit(f, box) {
    var B = box || ISO_BOX;
    var raw = function (px, py, z) {
      return [(px - py) * ISO_C, (px + py) * ISO_S - (z || 0)];
    };
    var cor = [raw(0, 0, 0), raw(f.w, 0, 0), raw(f.w, f.h, 0), raw(0, f.h, 0)];
    var bb = bbox(cor);
    var s = Math.min((B.x1 - B.x0) / (bb[2] - bb[0]), (B.y1 - B.y0) / (bb[3] - bb[1]));
    var ox = B.x0 + ((B.x1 - B.x0) - (bb[2] - bb[0]) * s) / 2 - bb[0] * s;
    var oy = B.y0 + ((B.y1 - B.y0) - (bb[3] - bb[1]) * s) / 2 - bb[1] * s;
    var P = function (px, py, z) {
      var r = raw(px, py, z);
      return [ox + r[0] * s, oy + r[1] * s];
    };
    return {
      s: s, P: P,
      X: function (px, py, z) { return P(px, py, z)[0]; },
      Y: function (px, py, z) { return P(px, py, z)[1]; },
      // высота в пикселях подложки из миллиметров натуры
      mm: function (v) { return (v / 1000) * (f.pxPerM || 100); }
    };
  }

  /** Ломаная плана в изометрии на высоте z */
  function isoPath(pts, t, z) {
    return pts.map(function (p, i) {
      var q = t.P(p[0], p[1], z || 0);
      return (i ? 'L' : 'M') + n(q[0]) + ',' + n(q[1]);
    }).join('');
  }

  function isoPoly(pts, t, z) {
    return pts.map(function (p) {
      var q = t.P(p[0], p[1], z || 0);
      return n(q[0]) + ',' + n(q[1]);
    }).join(' ');
  }

  /**
   * Плита перекрытия с подложкой плана на верхней грани.
   * Подложка — обычная картинка, вписанная в параллелограмм аффинным
   * преобразованием: прямоугольник в изометрии остаётся параллелограммом,
   * поэтому matrix() отрисует её без искажений.
   */
  /**
   * Стены по периметру этажа: только две дальние грани.
   *
   * Геометрии стен в редакторе планов нет — есть подложка и контуры зон,
   * поэтому поднимаем контур плиты на высоту этажа. Ближние стены не рисуем
   * вовсе: иначе они закроют трубы, ради которых лист и делается. Оконных
   * проёмов нет по той же причине — данных о них в плане не заведено.
   */
  function isoWalls(f, t, o, hMm) {
    var h = t.mm(hMm || 2700);
    [[[0, 0], [f.w, 0]], [[0, 0], [0, f.h]]].forEach(function (e) {
      var a = t.P(e[0][0], e[0][1], 0), b = t.P(e[1][0], e[1][1], 0);
      var b2 = t.P(e[1][0], e[1][1], h), a2 = t.P(e[0][0], e[0][1], h);
      o.push('<polygon points="' + [a, b, b2, a2].map(function (p) {
        return n(p[0]) + ',' + n(p[1]);
      }).join(' ') + '" style="fill:#eef1f4;fill-opacity:0.5;stroke:#8a9099;stroke-width:0.25"/>');
    });
  }

  function isoSlab(f, t, o, thick) {
    var th = t.mm(thick == null ? 250 : thick);
    var top = [[0, 0], [f.w, 0], [f.w, f.h], [0, f.h]];
    // боковые грани — те, что обращены к зрителю
    [[[f.w, 0], [f.w, f.h]], [[f.w, f.h], [0, f.h]]].forEach(function (e) {
      var a = t.P(e[0][0], e[0][1], 0), b = t.P(e[1][0], e[1][1], 0);
      var a2 = t.P(e[0][0], e[0][1], -th), b2 = t.P(e[1][0], e[1][1], -th);
      o.push('<polygon points="' + [a, b, b2, a2].map(function (p) {
        return n(p[0]) + ',' + n(p[1]);
      }).join(' ') + '" style="fill:#d9dde2;stroke:#8a9099;stroke-width:0.25"/>');
    });
    o.push('<polygon points="' + isoPoly(top, t, 0) +
      '" style="fill:#f2f4f6;stroke:#8a9099;stroke-width:0.3"/>');
    if (f.img) {
      var O = t.P(0, 0, 0), U = t.P(1, 0, 0), V = t.P(0, 1, 0);
      var m = [U[0] - O[0], U[1] - O[1], V[0] - O[0], V[1] - O[1], O[0], O[1]];
      o.push('<image x="0" y="0" width="' + n(f.w) + '" height="' + n(f.h) +
        '" preserveAspectRatio="none" opacity="0.5" transform="matrix(' +
        m.map(function (v) { return n(v); }).join(',') + ')" href="' +
        String(f.img).replace(/&/g, '&amp;') + '"/>');
    }
  }

  /** Табличка контура: номер, шаг, длина, расход — как в образце */
  function isoCard(o, x, y, lines, w) {
    w = w || 30;
    var h = 5.4 * lines.length;
    o.push('<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" style="fill:#ffffff;stroke:#000;stroke-width:0.25"/>');
    lines.forEach(function (s, i) {
      if (i) o.push('<line x1="' + n(x) + '" y1="' + n(y + 5.4 * i) + '" x2="' + n(x + w) +
        '" y2="' + n(y + 5.4 * i) + '" style="stroke:#000;stroke-width:0.2"/>');
      o.push(txt(x + w / 2, y + 5.4 * i + 3.6, s, { size: 3.1, anchor: 'middle' }));
    });
    return h;
  }

  /** Лист «Этаж N. 3D вид напольного отопления» */
  function isoTpBody(f, num, stepMm, rooms) {
    var t = isoFit(f), o = [];
    isoWalls(f, t, o);
    isoSlab(f, t, o);
    rooms = (rooms || []).filter(function (r) { return (r.floor || 1) === num; });

    var cards = [];
    loopRows(f, stepMm, rooms).forEach(function (R) {
      var lp = R.loop;
      if (!lp.sup) return;
      var sE = lp.sup[lp.sup.length - 1], rS = lp.ret[0];
      o.push('<path d="' + isoPath(lp.sup, t) + '" style="fill:none;stroke:' + COL_SUP +
        ';stroke-width:0.4"/>');
      o.push('<path d="' + isoPath([sE, rS], t) + '" style="fill:none;stroke:' + COL_RET +
        ';stroke-width:0.4"/>');
      o.push('<path d="' + isoPath(lp.ret, t) + '" style="fill:none;stroke:' + COL_RET +
        ';stroke-width:0.4"/>');
      var mid = lp.sup[Math.floor(lp.sup.length / 2)];
      cards.push({ p: t.P(mid[0], mid[1], 0), lines: ['Контур ' + R.no,
        'Шаг ' + R.step + ' мм', 'L = ' + R.m + ' м', num1(R.flow) + ' л/мин'] });
    });

    // Таблички раскладываем по краям листа и тянем выноску к своей петле:
    // в середине вида им места нет, они закрыли бы укладку.
    var left = [], right = [];
    cards.forEach(function (c) {
      (c.p[0] < (ISO_BOX.x0 + ISO_BOX.x1) / 2 ? left : right).push(c);
    });
    [[left, 24, 1], [right, 380, -1]].forEach(function (g) {
      var arr = g[0], x = g[1], dir = g[2], y = 34;
      arr.sort(function (a, b) { return a.p[1] - b.p[1]; });
      arr.forEach(function (c) {
        var h = isoCard(o, x, y, c.lines, 30);
        var ax = dir > 0 ? x + 30 : x;
        o.push('<line x1="' + n(ax) + '" y1="' + n(y + h / 2) + '" x2="' + n(c.p[0]) +
          '" y2="' + n(c.p[1]) + '" style="stroke:#000;stroke-width:0.2"/>');
        o.push('<circle cx="' + n(c.p[0]) + '" cy="' + n(c.p[1]) +
          '" r="0.6" style="fill:#000"/>');
        y += h + 3.2;
      });
    });

    if (f.coll) {
      var c = t.P(f.coll.x, f.coll.y, 0);
      o.push('<circle cx="' + n(c[0]) + '" cy="' + n(c[1]) +
        '" r="2.4" style="fill:#fff;stroke:' + COLT.tp + ';stroke-width:0.5"/>');
      o.push(txt(c[0] + 4, c[1] - 2, 'Коллектор ТП', { size: 3.1 }));
    }

    o.push(txt(24, 258, 'Условные обозначения систем трубопроводов:', { size: 3.4 }));
    o.push('<line x1="24" y1="262" x2="44" y2="262" style="stroke:' + COL_SUP +
      ';stroke-width:0.8"/>');
    o.push(txt(46, 263.2, '— Т11, подающий трубопровод напольного отопления', { size: 3.2 }));
    o.push('<line x1="24" y1="267" x2="44" y2="267" style="stroke:' + COL_RET +
      ';stroke-width:0.8"/>');
    o.push(txt(46, 268.2, '— Т21, обратный трубопровод напольного отопления', { size: 3.2 }));
    return o.join('');
  }

  /** Лист «Этаж N. 3D вид водоснабжения» либо «…канализации» */
  function isoPipeBody(f, num, kind) {
    var t = isoFit(f), o = [];
    isoWalls(f, t, o);
    isoSlab(f, t, o);
    var lines = kind === 'sewer' ? (f.slines || []) : (f.wlines || []);
    lines.forEach(function (L) {
      if (!L.pts || L.pts.length < 2) return;
      o.push('<path d="' + isoPath(L.pts, t) + '" style="fill:none;stroke:' +
        (kind === 'sewer' ? '#7a5c2e' : '#0b8a8f') + ';stroke-width:' +
        (kind === 'sewer' ? 0.7 : 0.5) + '"/>');
    });
    (f.fixtures || []).forEach(function (fx) {
      var p = t.P(fx.x, fx.y, 0);
      o.push('<circle cx="' + n(p[0]) + '" cy="' + n(p[1]) +
        '" r="1.6" style="fill:#fff;stroke:' + COLT.wc + ';stroke-width:0.4"/>');
    });
    o.push(txt(24, 258, 'Условные обозначения систем трубопроводов:', { size: 3.4 }));
    if (kind === 'sewer') {
      o.push('<line x1="24" y1="262" x2="44" y2="262" style="stroke:#7a5c2e;stroke-width:0.8"/>');
      o.push(txt(46, 263.2, '— К1, трубопровод бытовой канализации', { size: 3.2 }));
    } else {
      o.push('<line x1="24" y1="262" x2="44" y2="262" style="stroke:#0b8a8f;stroke-width:0.8"/>');
      o.push(txt(46, 263.2, '— В1, Т3, трубопроводы водоснабжения', { size: 3.2 }));
    }
    return o.join('');
  }

  /**
   * Листы объёмных видов систем по этажам.
   * opts.kind: 'tp' | 'water' | 'sewer'
   */
  function iso3dSheets(plans, opts) {
    opts = opts || {};
    var out = [], num = opts.sheetStart || 1;
    var fmt = opts.num || function (v) { return String(v); };
    var kind = opts.kind || 'tp';
    if (!plans || !plans.floors) return out;
    plans.floors.forEach(function (f, i) {
      if (!f.img || !f.pxPerM) return;
      if (opts.floor && opts.floor !== i + 1) return;
      var body, ttl;
      if (kind === 'tp') {
        if (!(f.zones || []).some(function (z) { return (z.type || 'tp') === 'tp'; })) return;
        ttl = 'Этаж 0' + (i + 1) + '. 3D вид напольного отопления';
        body = isoTpBody(f, i + 1, opts.stepMm || 150, opts.rooms);
      } else if (kind === 'sewer') {
        if (!(f.slines || []).length) return;
        ttl = 'Этаж 0' + (i + 1) + '. 3D вид канализации';
        body = isoPipeBody(f, i + 1, 'sewer');
      } else {
        if (!(f.fixtures || []).length) return;
        ttl = 'Этаж 0' + (i + 1) + '. 3D вид водоснабжения';
        body = isoPipeBody(f, i + 1, 'water');
      }
      out.push({ title: ttl, svg: window.projectSheets.sheet({
        code: opts.code, sheet: fmt(num++), body: title(ttl) + body }) });
    });
    return out;
  }

  /** Лист «Тёплый пол N этажа». rooms — помещения расчёта (теплопотери) */
  function tpBody(f, num, stepMm, rooms) {
    var t = fit(f), o = [];
    o.push(imageTag(f, t, 0.32));
    var anyLead = (f.leads || []).some(function (L) { return L.pts && L.pts.length > 1; });
    var rows = [], flowSum = 0, byLoss = false;
    rooms = (rooms || []).filter(function (r) { return (r.floor || 1) === num; });
    // Петли считает общий расчёт: ровно те же числа уходят в смету и в
    // таблицу контуров на листе узла коллектора.
    loopRows(f, stepMm, rooms).forEach(function (R) {
      var z = (f.zones || [])[R.zi], lp = R.loop;
      if (R.byLoss) byLoss = true;
      if (R.li === 0) {
        o.push('<polygon points="' + polyPts(z.pts, t.X, t.Y) + '" style="fill:none;stroke:' +
          COLT.tp + ';stroke-width:0.45;stroke-dasharray:1.6,1.2"/>');
        // зона узкая — геометрия не строится, кладём встречной змейкой по габариту
        if (R.est) o.push(serpentine(z, t, f, stepMm, 'tpz' + num + '_' + R.zi));
      }
      if (lp.sup) {
        var sE = lp.sup[lp.sup.length - 1], rS = lp.ret[0];
        var rr1 = stepMm / 1000 * (f.pxPerM || 100) * t.s * 0.5;   // радиус гиба — полшага
        o.push('<path d="' + pathR(lp.sup, t, rr1) + '" style="fill:none;stroke:' + COL_SUP +
          ';stroke-width:0.5;stroke-linejoin:round;stroke-linecap:round"/>');
        o.push('<path d="' + pathD([sE, rS], t) + '" style="fill:none;stroke:' + COL_RET + ';stroke-width:0.5"/>');
        o.push('<path d="' + pathR(lp.ret, t, rr1) + '" style="fill:none;stroke:' + COL_RET +
          ';stroke-width:0.5;stroke-linejoin:round;stroke-linecap:round"/>');
      }
      // Номер: у одной петли — в центре зоны, у поделённой — на своей полосе.
      // У зоны без геометрии полос нет: значок ставим один, на всю зону.
      if (lp.sup || R.li === 0) {
        var mark = (R.k > 1 && lp.sup) ? lp.sup[Math.floor(lp.sup.length / 2)] : centroid(z.pts);
        o.push('<circle cx="' + n(t.X(mark[0])) + '" cy="' + n(t.Y(mark[1])) + '" r="3.4"' +
          ' style="fill:#ffffff;stroke:' + COLT.tp + ';stroke-width:0.4"/>');
        o.push(txt(t.X(mark[0]), t.Y(mark[1]) + 1.2,
          (R.est && R.k > 1) ? (R.no + '…' + (R.no + R.k - 1)) : R.no,
          { size: (R.est && R.k > 1) ? 2.6 : 3.4, anchor: 'middle' }));
      }
      flowSum += R.flow;
      rows.push([R.no, R.name, num1(R.area), R.step, R.m, num1(R.flow)]);
    });
    if (f.coll) collectorMark(f.coll, t, f, o);
    // таблица петель слева
    var Lx = 22, Ty = 40, W = [7, 27, 12, 13, 15, 16], rh = 6.4;
    var Wsum = W.reduce(function (a, b) { return a + b; }, 0);
    o.push(txt(Lx + Wsum / 2, Ty - 2.4, 'Петли тёплого пола', { size: 4.2, anchor: 'middle' }));
    var hdr = ['№', 'Помещение', 'S, м²', 'Шаг, мм', 'Длина, м', 'G, л/мин'];
    var all = [hdr].concat(rows);
    all.forEach(function (r, ri) {
      var y = Ty + ri * rh, x = Lx;
      o.push('<rect x="' + n(Lx) + '" y="' + n(y) + '" width="' + n(Wsum) + '" height="' + rh +
        '" style="fill:none;stroke:#000;stroke-width:0.2"/>');
      r.forEach(function (cell, ci) {
        o.push(txt(x + W[ci] / 2, y + rh / 2 + 1.2, cell, { size: ri ? 3.2 : 3.4, anchor: 'middle' }));
        if (ri === 0 && ci) o.push('<line x1="' + n(x) + '" y1="' + n(Ty) + '" x2="' + n(x) +
          '" y2="' + n(Ty + all.length * rh) + '" style="stroke:#000;stroke-width:0.15"/>');
        x += W[ci];
      });
    });
    var ny = Ty + all.length * rh + 5;
    o.push(txt(Lx, ny, 'Длины петель — по нарисованной укладке (подача и обратка' +
      (anyLead ? ', подводки' : '') + ');', { size: 3.0 }));
    o.push(txt(Lx, ny + 4, 'петля длиннее ' + loopLimit(stepMm) +
      ' м разделена; эти же длины и число петель — в смете.', { size: 3.0 }));
    // Расход: по нему выставляют расходомеры на подающей гребёнке, поэтому
    // рядом с таблицей объясняем, из чего он получен, и даём сумму по этажу.
    o.push(txt(Lx, ny + 8, 'Расход G = Q / (c × ΔT) при ΔT = ' + ufhDt() + ' °C, ' +
      'c = ' + String(UFH_C).replace('.', ',') + ' Вт·ч/(кг·°C);', { size: 3.0 }));
    o.push(txt(Lx, ny + 12, 'Q — ' + (byLoss ? 'теплопотери помещения, но не выше' : 'по площади зоны и') +
      ' ' + qUdeFor(stepMm) + ' Вт/м² (шаг ' + stepMm + ' мм).', { size: 3.0 }));
    o.push(txt(Lx, ny + 16, 'Суммарный расход по коллектору: ' + num1(flowSum) + ' л/мин (' +
      (flowSum * 0.06).toFixed(2).replace('.', ',') + ' м³/ч).', { size: 3.0 }));
    // условные обозначения: подача/обратка встречной спирали
    var ly = ny + 23;
    o.push(txt(Lx, ly, 'Условные обозначения', { size: 3.6 }));
    [['Подача', COL_SUP], ['Обратка', COL_RET]].forEach(function (r, i) {
      var yy = ly + 4.6 + i * 5;
      o.push('<line x1="' + n(Lx) + '" y1="' + n(yy) + '" x2="' + n(Lx + 9) + '" y2="' + n(yy) +
        '" style="stroke:' + r[1] + ';stroke-width:0.6"/>');
      o.push(txt(Lx + 11.5, yy + 1.1, r[0], { size: 3.0 }));
    });
    o.push(txt(228, 273.8, 'Укладка построена автоматически: трассировку уточнить при монтаже.', { size: 3.0 }));
    return o.join('');
  }

  // ═══ Листы водоснабжения и канализации ══════════════════════════════════
  // Приборы и стояк расставлены в редакторе планов, трассы посчитаны там же
  // при сохранении (f.wlines — вода от котельной, f.slines — выпуски к стояку).

  // подпись, буква на значке и габарит в мм (вдоль стены × от стены)
  var FIXT = {
    basin: ['Раковина', 'Р', 600, 450], toilet: ['Унитаз', 'У', 360, 700],
    bath: ['Ванна', 'В', 1700, 700], shower: ['Душ', 'Д', 900, 900],
    wash: ['Стиральная машина', 'СМ', 600, 600],
    dish: ['Посудомоечная машина', 'ПМ', 600, 600],
    riser: ['Стояк канализации', 'Ст', 110, 110]
  };
  var COL_CW = '#0b7285', COL_HW = '#c92a2a', COL_SEW = '#5f3dc4';

  /** Значок прибора: габарит в масштабе листа, развёрнутый вдоль стены.
   *  Стояк — кружок. Буква подписи не поворачивается, чтобы читалась. */
  function fixtureMark(q, t, f, o, col) {
    var ppm = (f.pxPerM || 100) * t.s;
    var W = (q.w || (FIXT[q.t] || [])[2] || 500) / 1000 * ppm;
    var D = (q.d || (FIXT[q.t] || [])[3] || 500) / 1000 * ppm;
    var X = t.X(q.x), Y = t.Y(q.y);
    if (q.t === 'riser') {
      o.push('<circle cx="' + n(X) + '" cy="' + n(Y) + '" r="' + n(Math.max(1.6, W / 2)) +
        '" style="fill:#ffffff;stroke:' + col + ';stroke-width:0.5"/>');
    } else {
      o.push('<g transform="translate(' + n(X) + ',' + n(Y) + ') rotate(' + (q.ang || 0) + ')">' +
        '<rect x="' + n(-W / 2) + '" y="' + n(-D / 2) + '" width="' + n(W) + '" height="' + n(D) +
        '" rx="0.4" style="fill:#ffffff;fill-opacity:0.9;stroke:' + col + ';stroke-width:0.4"/></g>');
    }
    o.push(txt(X, Y + 1.1, (FIXT[q.t] || ['', '?'])[1], { size: 2.9, anchor: 'middle', fill: col }));
  }

  /** Лист «Водоснабжение N этажа»: В1 и Т3 парой от котельной к приборам */
  /** Контуры санузлов — общий фон листов ВК */
  function wcOutlines(f, t, o) {
    (f.zones || []).forEach(function (z) {
      if (z.type !== 'wc') return;
      o.push('<polygon points="' + polyPts(z.pts, t.X, t.Y) + '" style="fill:none;stroke:' +
        COLT.wc + ';stroke-width:0.4;stroke-dasharray:1.6,1.2"/>');
      var c = centroid(z.pts);
      if (z.name) o.push(txt(t.X(c[0]), t.Y(c[1]) - 4, z.name,
        { size: 3.0, anchor: 'middle', fill: COLT.wc }));
    });
  }

  function waterBody(f, num) {
    var t = fit(f), o = [], rows = [];
    o.push(imageTag(f, t, 0.32));
    wcOutlines(f, t, o);
    var fx = f.fixtures || [], step = Math.max(1.2, 0.09 * (f.pxPerM || 100) * t.s);
    (f.wlines || []).forEach(function (w) {
      if (!w.pts || w.pts.length < 2) return;
      o.push('<path d="' + pathD(offsetPoly(w.pts, -step / 2), t) +
        '" style="fill:none;stroke:' + COL_CW + ';stroke-width:0.45"/>');
      o.push('<path d="' + pathD(offsetPoly(w.pts, step / 2), t) +
        '" style="fill:none;stroke:' + COL_HW + ';stroke-width:0.45"/>');
    });
    fx.forEach(function (q, qi) {
      if (q.t === 'riser') return;
      fixtureMark(q, t, f, o, COL_CW);
      rows.push([rows.length + 1, (FIXT[q.t] || ['прибор'])[0], 'В1 + Т3']);
    });
    (f.zones || []).forEach(function (z) {
      if (z.type !== 'boiler') return;
      var c = centroid(z.pts);
      o.push('<circle cx="' + n(t.X(c[0])) + '" cy="' + n(t.Y(c[1])) + '" r="3.2"' +
        ' style="fill:#ffffff;stroke:' + COL_CW + ';stroke-width:0.5"/>');
      o.push(txt(t.X(c[0]), t.Y(c[1]) + 1.1, 'К', { size: 3, anchor: 'middle', fill: COL_CW }));
      o.push(txt(t.X(c[0]), t.Y(c[1]) + 6, 'Коллектор ВС', { size: 2.8, anchor: 'middle', fill: COL_CW }));
    });
    vkTable(o, 'Сантехнические приборы', ['№', 'Прибор', 'Подводка'], rows, [8, 46, 22]);
    var ly = 40 + (rows.length + 1) * 6.4 + 12;
    o.push(txt(22, ly, 'Условные обозначения', { size: 3.6 }));
    [['В1 — холодное водоснабжение', COL_CW], ['Т3 — горячее водоснабжение', COL_HW]].forEach(function (r, i) {
      var yy = ly + 4.6 + i * 5;
      o.push('<line x1="22" y1="' + n(yy) + '" x2="31" y2="' + n(yy) +
        '" style="stroke:' + r[1] + ';stroke-width:0.6"/>');
      o.push(txt(33.5, yy + 1.1, r[0], { size: 3.0 }));
    });
    o.push(txt(228, 273.8, 'Трассы показаны условно: разводку уточнить по месту при монтаже.', { size: 3.0 }));
    return o.join('');
  }

  /** Лист «Канализация N этажа»: выпуски приборов к стояку с диаметрами */
  function sewerBody(f, num) {
    var t = fit(f), o = [], rows = [];
    o.push(imageTag(f, t, 0.32));
    wcOutlines(f, t, o);
    var fx = f.fixtures || [];
    (f.slines || []).forEach(function (s) {
      if (!s.pts || s.pts.length < 2) return;
      o.push('<path d="' + pathD(s.pts, t) + '" style="fill:none;stroke:' + COL_SEW +
        ';stroke-width:' + (s.d >= 110 ? 0.8 : 0.5) + '"/>');
      var mid = s.pts[Math.floor(s.pts.length / 2)];
      o.push(txt(t.X(mid[0]), t.Y(mid[1]) - 1.4, 'd' + s.d, { size: 2.8, fill: COL_SEW }));
      var q = fx[s.i];
      if (q) rows.push([rows.length + 1, (FIXT[q.t] || ['прибор'])[0], 'd' + s.d,
        s.d >= 110 ? '0,02' : '0,03']);
    });
    fx.forEach(function (q) { fixtureMark(q, t, f, o, q.t === 'riser' ? '#7a5c00' : COL_SEW); });
    vkTable(o, 'Выпуски канализации', ['№', 'Прибор', 'Ø, мм', 'Уклон'], rows, [8, 40, 16, 16]);
    var ly = 40 + (rows.length + 1) * 6.4 + 12;
    o.push(txt(22, ly, 'Условные обозначения', { size: 3.6 }));
    o.push('<line x1="22" y1="' + n(ly + 4.6) + '" x2="31" y2="' + n(ly + 4.6) +
      '" style="stroke:' + COL_SEW + ';stroke-width:0.7"/>');
    o.push(txt(33.5, ly + 5.7, 'К1 — бытовая канализация', { size: 3.0 }));
    o.push(txt(22, ly + 12, 'Уклон выпусков: d50 — 0,03; d110 — 0,02 в сторону стояка.', { size: 3.0 }));
    o.push(txt(228, 273.8, 'Трассы показаны условно: разводку уточнить по месту при монтаже.', { size: 3.0 }));
    return o.join('');
  }

  /** Таблица приборов слева — та же сетка, что у таблицы петель ТП */
  function vkTable(o, title, hdr, rows, W) {
    var Lx = 22, Ty = 40, rh = 6.4;
    var Wsum = W.reduce(function (a, b) { return a + b; }, 0);
    o.push(txt(Lx + Wsum / 2, Ty - 2.4, title, { size: 4.2, anchor: 'middle' }));
    var all = [hdr].concat(rows.length ? rows : [['—', 'приборы не расставлены', '', '']]);
    all.forEach(function (r, ri) {
      var y = Ty + ri * rh, x = Lx;
      o.push('<rect x="' + n(Lx) + '" y="' + n(y) + '" width="' + n(Wsum) + '" height="' + rh +
        '" style="fill:none;stroke:#000;stroke-width:0.2"/>');
      W.forEach(function (w, ci) {
        o.push(txt(x + w / 2, y + rh / 2 + 1.2, r[ci] == null ? '' : r[ci],
          { size: ri ? 3.2 : 3.4, anchor: 'middle' }));
        if (ri === 0 && ci) o.push('<line x1="' + n(x) + '" y1="' + n(Ty) + '" x2="' + n(x) +
          '" y2="' + n(Ty + all.length * rh) + '" style="stroke:#000;stroke-width:0.15"/>');
        x += w;
      });
    });
  }

  /** Листы ВК: [{title, svg}] — только по этажам, где расставлены приборы */
  /**
   * Планы водоснабжения и канализации.
   * opts.only: 'water' | 'sewer' — в проектах-образцах это разные разделы
   * со своими шифрами (В и К), поэтому листы выдаются порознь.
   */
  function waterSheets(plans, opts) {
    opts = opts || {};
    var out = [], num = opts.sheetStart || 1;
    var fmt = opts.num || function (v) { return String(v); };
    var only = opts.only || null;
    if (!plans || !plans.floors) return out;
    plans.floors.forEach(function (f, i) {
      if (!f.img || !f.pxPerM || !(f.fixtures || []).length) return;
      if (opts.floor && opts.floor !== i + 1) return;
      if (only !== 'sewer') {
        var t1 = 'Водоснабжение ' + (i + 1) + ' этажа';
        out.push({ title: t1, svg: window.projectSheets.sheet({
          code: opts.code, sheet: fmt(num++), body: title(t1) + waterBody(f, i + 1) }) });
      }
      if (only !== 'water' && (f.slines || []).length) {
        var t2 = 'Канализация ' + (i + 1) + ' этажа';
        out.push({ title: t2, svg: window.projectSheets.sheet({
          code: opts.code, sheet: fmt(num++), body: title(t2) + sewerBody(f, i + 1) }) });
      }
    });
    return out;
  }

  // ═══ Лист «Этаж N. Сводный план сетей» ══════════════════════════════════
  // Всё в одном виде: укладка тёплого пола, радиаторы, вода и канализация,
  // номера помещений с теплопотерями, экспликация и составы конструкций.
  // Данные помещений приходят из расчёта (opts.rooms), составы — из настроек.

  var SUM_PLAN = { x0: 100, y0: 24, x1: 296, y1: 202 };   // поле подложки
  var SUM_TBL = 300;                                       // левый край экспликации

  /**
   * Оси плана: длинные стены дают линии сетки, как в проектах-образцах —
   * цифры по горизонтали, буквы по вертикали. Готовой сетки у нас нет
   * (подложка — чертёж монтажника), поэтому оси берём из контуров стен:
   * длинная прямая стена и есть ось. Близкие линии сливаются в одну.
   */
  var AX_LET = 'АБВГДЕЖИКЛМНПРСТУФ'.split('');
  function axisGrid(f) {
    var g = f.geom;
    if (!g || !(g.walls || []).length || !f.pxPerM) return null;
    var ppm = f.pxPerM, vs = {}, hs = {};
    g.walls.forEach(function (pl) {
      for (var i = 0; i < pl.length; i++) {
        var a = pl[i], b = pl[(i + 1) % pl.length];
        var dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]);
        var L = Math.hypot(dx, dy);
        if (L < 1.5 * ppm) continue;                 // короткие куски осью не считаем
        var cell = 0.15 * ppm;
        if (dx < 0.3 * ppm) {
          var kx = Math.round((a[0] + b[0]) / 2 / cell);
          vs[kx] = (vs[kx] || 0) + L;
        } else if (dy < 0.3 * ppm) {
          var ky = Math.round((a[1] + b[1]) / 2 / cell);
          hs[ky] = (hs[ky] || 0) + L;
        }
      }
    });
    var pick = function (map) {
      var arr = Object.keys(map).map(function (k) { return { c: +k * 0.15 * ppm, w: map[k] }; });
      arr.sort(function (a, b) { return b.w - a.w; });
      arr = arr.slice(0, 10).sort(function (a, b) { return a.c - b.c; });
      var out = [];
      arr.forEach(function (r) {                     // ближе 0.8 м — та же ось
        var last = out[out.length - 1];
        if (last && r.c - last.c < 0.8 * ppm) { if (r.w > last.w) last.c = r.c; return; }
        out.push({ c: r.c, w: r.w });
      });
      return out.map(function (r) { return r.c; });
    };
    var xs = pick(vs), ys = pick(hs);
    if (xs.length < 2 || ys.length < 2) return null;
    return { xs: xs, ys: ys };
  }

  /** Оси и размерные цепочки: цифры снизу, буквы слева — как в образцах */
  function axesBody(f, t, box) {
    var G = axisGrid(f);
    if (!G) return '';
    var mm = function (px) { return Math.round(px / f.pxPerM * 1000); };
    var o = [];
    var X0 = t.X(G.xs[0]), X1 = t.X(G.xs[G.xs.length - 1]);
    var Y0 = t.Y(G.ys[0]), Y1 = t.Y(G.ys[G.ys.length - 1]);
    var LB = box.y1 + 10, LL = box.x0 - 10;          // где стоят кружки осей
    var DIM1 = box.y1 + 18, DIM2 = box.y1 + 25;      // цепочки: по осям и общая
    var DML1 = box.x0 - 18, DML2 = box.x0 - 25;
    var dash = 'stroke:#8a8a8a;stroke-width:0.18;stroke-dasharray:6 1.6 1 1.6';
    var mark = function (x, y, s) {
      o.push('<circle cx="' + n(x) + '" cy="' + n(y) + '" r="3.2" style="fill:#fff;stroke:#333;stroke-width:0.25"/>');
      o.push(txt(x, y + 1.3, s, { size: 3.2, anchor: 'middle' }));
    };
    // размерная цепочка: линия с засечками и подписью каждого пролёта
    var chain = function (pts, along, horiz, lab) {
      if (pts.length < 2) return;
      var A = horiz ? [pts[0], along] : [along, pts[0]];
      var B = horiz ? [pts[pts.length - 1], along] : [along, pts[pts.length - 1]];
      o.push('<line x1="' + n(A[0]) + '" y1="' + n(A[1]) + '" x2="' + n(B[0]) + '" y2="' + n(B[1]) +
        '" style="stroke:#333;stroke-width:0.2"/>');
      pts.forEach(function (c) {
        var x = horiz ? c : along, y = horiz ? along : c;
        o.push('<line x1="' + n(x - 1) + '" y1="' + n(y - 1) + '" x2="' + n(x + 1) + '" y2="' + n(y + 1) +
          '" style="stroke:#333;stroke-width:0.25"/>');
      });
      for (var i = 0; i + 1 < pts.length; i++) {
        var mid = (pts[i] + pts[i + 1]) / 2, v = lab[i];
        if (horiz) o.push(txt(mid, along - 1.4, String(v), { size: 3.0, anchor: 'middle' }));
        else o.push('<text x="' + n(along - 1.4) + '" y="' + n(mid) + '" font-size="3" text-anchor="middle"' +
          ' transform="rotate(-90 ' + n(along - 1.4) + ' ' + n(mid) + ')">' + esc(String(v)) + '</text>');
      }
    };
    G.xs.forEach(function (c, i) {
      var x = t.X(c);
      o.push('<line x1="' + n(x) + '" y1="' + n(box.y0) + '" x2="' + n(x) + '" y2="' + n(LB - 3.4) +
        '" style="' + dash + '"/>');
      mark(x, LB, String(i + 1));
    });
    G.ys.forEach(function (c, i) {
      var y = t.Y(c);
      o.push('<line x1="' + n(LL + 3.4) + '" y1="' + n(y) + '" x2="' + n(box.x1) + '" y2="' + n(y) +
        '" style="' + dash + '"/>');
      mark(LL, y, AX_LET[G.ys.length - 1 - i] || String(i + 1));
    });
    var xsMM = [], ysMM = [];
    for (var i2 = 0; i2 + 1 < G.xs.length; i2++) xsMM.push(mm(G.xs[i2 + 1] - G.xs[i2]));
    for (var j2 = 0; j2 + 1 < G.ys.length; j2++) ysMM.push(mm(G.ys[j2 + 1] - G.ys[j2]));
    chain(G.xs.map(t.X), DIM1, true, xsMM);
    chain([X0, X1], DIM2, true, [mm(G.xs[G.xs.length - 1] - G.xs[0])]);
    chain(G.ys.map(t.Y), DML1, false, ysMM);
    chain([Y0, Y1], DML2, false, [mm(G.ys[G.ys.length - 1] - G.ys[0])]);
    return o.join('');
  }

  /** Компактный «пирог» конструкции с подписями слоёв */
  function pieBlock(o, x, y, w, title2, layers) {
    o.push(txt(x + w / 2, y - 1.6, title2, { size: 3.3, anchor: 'middle' }));
    var yy = y, i;
    for (i = 0; i < layers.length; i++) {
      var h = Math.max(1.8, Math.min(5, (layers[i].thick || 60) / 40));
      o.push('<rect x="' + n(x) + '" y="' + n(yy) + '" width="' + n(w) + '" height="' + n(h) +
        '" style="fill:none;stroke:#000;stroke-width:0.2"/>');
      if (layers[i].hatch)
        for (var hx = x + 1.2; hx < x + w - 0.6; hx += 2.6)
          o.push(line(hx, yy + h, Math.min(hx + h, x + w), yy));
      o.push(line(x + w, yy + h / 2, x + w + 3, yy + h / 2));
      o.push(txt(x + w + 4, yy + h / 2 + 1, layers[i].name, { size: 2.7 }));
      yy += h;
    }
    return yy;
  }

  function line(x1, y1, x2, y2) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) +
      '" style="stroke:#000;stroke-width:0.2"/>';
  }

  /** Лист «Этаж N. Сводный план сетей» */
  function summaryBody(f, num, opts, stepMm) {
    var t = fit(f, SUM_PLAN), o = [];
    stepMm = stepMm || opts.stepMm || 150;
    var vec = wallsBody(f, t);
    o.push(vec || imageTag(f, t, 0.5));
    if (vec) o.push(axesBody(f, t, SUM_PLAN));       // оси и размеры — по контурам стен

    // 1) тёплый пол — та же укладка, что на профильном листе, но тоньше
    floorLoops(f, stepMm, loopLimit(stepMm)).forEach(function (Z) {
      Z.loops.forEach(function (lp) {
        if (!lp.sup) return;
        var rr2 = stepMm / 1000 * (f.pxPerM || 100) * t.s * 0.5;
        o.push('<path d="' + pathR(lp.sup, t, rr2) + '" style="fill:none;stroke:' + COL_SUP +
          ';stroke-width:0.28;stroke-linejoin:round;stroke-linecap:round"/>');
        o.push('<path d="' + pathR(lp.ret, t, rr2) + '" style="fill:none;stroke:' + COL_RET +
          ';stroke-width:0.28;stroke-linejoin:round;stroke-linecap:round"/>');
      });
    });
    if (f.coll) collectorMark(f.coll, t, f, o);

    // 2) радиаторы
    (f.rads || []).forEach(function (r) {
      var wl = r.w * t.s, hl = Math.max(0.9, 0.14 * (f.pxPerM || 100) * t.s);
      o.push('<g transform="translate(' + n(t.X(r.x)) + ',' + n(t.Y(r.y)) + ') rotate(' + (r.ang || 0) + ')">' +
        '<rect x="' + n(-wl / 2) + '" y="' + n(-hl / 2) + '" width="' + n(wl) + '" height="' + n(hl) +
        '" style="fill:rgba(210,34,34,0.35);stroke:#d22222;stroke-width:0.3"/></g>');
    });

    // 3) вода и канализация — тонко, чтобы не спорили с отоплением
    (f.wlines || []).forEach(function (w) {
      if (w.pts && w.pts.length > 1)
        o.push('<path d="' + pathD(w.pts, t) + '" style="fill:none;stroke:' + COL_CW +
          ';stroke-width:0.28;stroke-dasharray:2,1"/>');
    });
    (f.slines || []).forEach(function (s) {
      if (s.pts && s.pts.length > 1)
        o.push('<path d="' + pathD(s.pts, t) + '" style="fill:none;stroke:' + COL_SEW +
          ';stroke-width:0.35"/>');
    });
    (f.fixtures || []).forEach(function (q) {
      fixtureMark(q, t, f, o, q.t === 'riser' ? '#7a5c00' : COL_CW);
    });

    // 4) номера помещений на плане: выноска с номером, площадью и теплопотерями
    var rooms = (opts.rooms || []).filter(function (r) { return (r.floor || 1) === num; });
    var byName = {};
    rooms.forEach(function (r) { byName[String(r.name || '').trim().toLowerCase()] = r; });
    var used = {};
    (f.zones || []).forEach(function (z) {
      var key = String(z.name || '').trim().toLowerCase();
      var r = byName[key];
      if (!r || used[key]) return;
      used[key] = 1;
      var c = centroid(z.pts), X = t.X(c[0]), Y = t.Y(c[1]);
      var lines2 = ['[' + r.id + ']', r.name, Math.round(r.q) + ' Вт', r.area.toFixed(1) + ' м²'];
      var wBox = 20;
      o.push('<rect x="' + n(X - wBox / 2) + '" y="' + n(Y - 7) + '" width="' + n(wBox) +
        '" height="13.6" rx="0.6" style="fill:#ffffff;fill-opacity:0.86;stroke:#000;stroke-width:0.2"/>');
      lines2.forEach(function (s2, i) {
        o.push(txt(X, Y - 4 + i * 3.2, s2, { size: i ? 2.5 : 2.8, anchor: 'middle' }));
      });
    });

    // 5) экспликация помещений справа
    var EX = SUM_TBL, EY = 26, W = [12, 46, 22, 24], rh = 5.6;
    var Wsum = W.reduce(function (a, b) { return a + b; }, 0);
    o.push(txt(EX + Wsum / 2, EY - 2.2, 'Экспликация помещений ' + num + ' этажа',
      { size: 3.6, anchor: 'middle' }));
    var totA = 0, totQ = 0;
    var body = rooms.map(function (r) {
      totA += r.area; totQ += r.q;
      return [r.id, r.name, r.area.toFixed(2) + ' м²', Math.round(r.q) + ' Вт'];
    });
    if (body.length) body.push(['', '', totA.toFixed(2) + ' м²', Math.round(totQ) + ' Вт']);
    var all = [['№', 'Наименование', 'Площадь', 'Теплопотери']].concat(body);
    all.forEach(function (r, ri) {
      var y = EY + ri * rh, x = EX;
      o.push('<rect x="' + n(EX) + '" y="' + n(y) + '" width="' + n(Wsum) + '" height="' + rh +
        '" style="fill:none;stroke:#000;stroke-width:0.2"/>');
      W.forEach(function (w, ci) {
        o.push(txt(ci === 1 ? x + 1.2 : x + w / 2, y + rh / 2 + 1, r[ci] == null ? '' : r[ci],
          { size: ri ? 2.9 : 3.1, anchor: ci === 1 ? 'start' : 'middle' }));
        if (ri === 0 && ci) o.push('<line x1="' + n(x) + '" y1="' + n(EY) + '" x2="' + n(x) +
          '" y2="' + n(EY + all.length * rh) + '" style="stroke:#000;stroke-width:0.15"/>');
        x += w;
      });
    });

    // 6) составы конструкций внизу
    var cy = 216;
    if (opts.floorLayers && opts.floorLayers.length)
      pieBlock(o, 108, cy, 44, 'Состав пола ' + num + ' этажа', opts.floorLayers);
    if (opts.wallLayers && opts.wallLayers.length)
      pieBlock(o, 196, cy, 44, 'Состав наружной стены', opts.wallLayers.map(function (L) {
        return { name: L.name, thick: L.thick, hatch: /утепл|вата|пенопл|эппс|xps/i.test(L.name) };
      }));

    // 7) условные обозначения
    var ly = 216;
    o.push(txt(SUM_TBL, ly - 1.6, 'Условные обозначения', { size: 3.3 }));
    [['Тёплый пол — подача', COL_SUP], ['Тёплый пол — обратка', COL_RET],
     ['Радиаторы', '#d22222'], ['Водоснабжение В1/Т3', COL_CW], ['Канализация К1', COL_SEW]]
      .forEach(function (r, i) {
        var yy = ly + 3.4 + i * 4.4;
        o.push('<line x1="' + n(SUM_TBL) + '" y1="' + n(yy) + '" x2="' + n(SUM_TBL + 8) + '" y2="' + n(yy) +
          '" style="stroke:' + r[1] + ';stroke-width:0.6"/>');
        o.push(txt(SUM_TBL + 10, yy + 1, r[0], { size: 2.9 }));
      });
    var scale = f.pxPerM ? Math.round(1000 / (f.pxPerM * t.s)) : 0;
    if (scale) o.push(txt(108, 208, 'Масштаб печати ~1:' + scale + ' (лист А3)', { size: 3.0 }));
    o.push(txt(228, 273.8, 'Сети нанесены автоматически по смете и разметке планов heatcalc.ru.', { size: 3.0 }));
    return o.join('');
  }

  /** Габариты зоны «котельная» (мм) — для листа компоновки */
  function boilerRoom(plans) {
    if (!plans || !plans.floors) return null;
    for (var i = 0; i < plans.floors.length; i++) {
      var f = plans.floors[i];
      if (!f.pxPerM) continue;
      for (var j = 0; j < (f.zones || []).length; j++) {
        var z = f.zones[j];
        if (z.type !== 'boiler') continue;
        var bb = bbox(z.pts);
        return {
          w: Math.round((bb[2] - bb[0]) / f.pxPerM * 1000),
          d: Math.round((bb[3] - bb[1]) / f.pxPerM * 1000)
        };
      }
    }
    return null;
  }

  /**
   * Листы из планов: [{kind, title, svg}].
   * kind: 'summary' — сводный план сетей (идёт в общую часть комплекта, MEP),
   * 'floor' и 'tp' — планы отопления (раздел «О»). opts.only ограничивает
   * набор: у разделов свои шифры и своя нумерация, поэтому листы одного
   * этажа приходится собирать в два захода.
   * opts.num — как печатать номер листа (в разделе это «О-3», а не «3»).
   */
  function sheets(plans, opts) {
    opts = opts || {};
    var out = [], num = opts.sheetStart || 1;
    var fmt = opts.num || function (n) { return String(n); };
    var want = function (k) { return !opts.only || opts.only.indexOf(k) >= 0; };
    if (!plans || !plans.floors) return out;
    plans.floors.forEach(function (f, i) {
      if (!f.img || !f.pxPerM) return;
      // opts.floor — собрать только этот этаж: в эталоне листы идут этажами
      // (план системы, объёмный вид, следующая система), а не пачками.
      if (opts.floor && opts.floor !== i + 1) return;
      // Шаг укладки у каждого этажа свой (в смете это ufhStep1 / ufhStep2).
      var st = (opts.steps && opts.steps[i]) || opts.stepMm || 150;
      // Сводный план сетей — первым: на нём сразу всё, остальные листы этажа
      // раскрывают отдельные системы. Нужны помещения расчёта (экспликация).
      if (want('summary') && (opts.rooms || []).some(function (r) { return (r.floor || 1) === i + 1; })) {
        var t0 = 'Этаж ' + String(i + 1).padStart(2, '0') + '. Сводный план сетей';
        out.push({
          kind: 'summary', title: t0,
          svg: window.projectSheets.sheet({
            code: opts.code, sheet: fmt(num++),
            body: title(t0) + summaryBody(f, i + 1, opts, st)
          })
        });
      }
      if (want('floor')) {
        var tt = 'План ' + (i + 1) + ' этажа';
        out.push({
          kind: 'floor', title: tt,
          svg: window.projectSheets.sheet({
            code: opts.code, sheet: fmt(num++),
            body: title(tt) + floorBody(f, i + 1)
          })
        });
      }
      if (want('tp') && (f.zones || []).some(function (z) { return z.type === 'tp'; })) {
        var t2 = 'Тёплый пол ' + (i + 1) + ' этажа';
        out.push({
          kind: 'tp', title: t2,
          svg: window.projectSheets.sheet({
            code: opts.code, sheet: fmt(num++),
            body: title(t2) + tpBody(f, i + 1, st, opts.rooms)
          })
        });
      }
    });
    return out;
  }

  // layZone открыт наружу для стенда укладки (scratchpad/render_plans.js):
  // геометрию петель надо проверять без браузера и без листа целиком.
  // floorLoops — для сметы: длина трубы и число выходов коллектора берутся
  // из той же укладки, что нарисована на листе.
  // loopRows — для листа узла коллектора (project_ufh_manifold.js): номера,
  // длины и расходы петель там должны совпадать с листом укладки.
  window.projectPlans = { sheets: sheets, waterSheets: waterSheets, iso3dSheets: iso3dSheets,
    boilerRoom: boilerRoom, layZone: layZone, layZoneLoops: layZoneLoops,
    floorLoops: floorLoops, loopRows: loopRows, num1: num1,
    UFH_DT: UFH_DT, ufhDt: ufhDt, UFH_C: UFH_C,
    MAX_LOOP_M: MAX_LOOP_M, loopLimit: loopLimit };
})();
