/* project_layout.js — листы «Компоновка котельной» (план) и «Вид котельной
 * спереди» (фасад), этап 4 комплекта.
 *
 * Оба листа — чертёж вектором, КОМПОНУЕТСЯ из конфигурации системы (как
 * принципиальная схема): состав оборудования и его габариты берутся из
 * buildSchemeConfig() и позиций сметы. Стиль и пропорции сняты с векторного
 * листа ТМ-4 проекта 2025-191 (Boiler_Club_106m2.pdf, стр. 27): масштаб 1:10
 * (авто-уменьшение при широкой стене), стена #f4f4f4 с плиткой 300×300,
 * торцы стен #7588a1, пол со стяжкой, гребёнки с шагом 70 мм, отводы вниз с
 * марками-овалами 6×3 и легендой «Условные обозначения».
 *
 * Помещение на плане условное: реальные размеры котельной калькулятору
 * неизвестны, стена принимается по составу оборудования (запас 400 мм),
 * глубина 2000 мм — об этом на листе есть примечание.
 *
 * Требует project_sheets.js. Глобал: window.projectLayout
 */
(function () {
  'use strict';

  var SZ = { txt: 3.68, dim: 2.5, title: 7.36, mark: 3.0 };
  var COL = {
    wall: '#f4f4f2', wallEnd: '#7588a1', tile: '#dcdcdc',
    plinth: '#e0e0e0', screed: '#aaaaaa', ground: '#5d5870', warm: '#ff8000',
    supply: '#ff0000', ret: '#0000ff', dhw: '#ff8000', cold: '#00ffff',
    rail: '#bdbbb8', body: '#f4f4f2', panel: '#191919', valve: '#c33326',
    brass: '#d5bf6f', pump: '#282828', tankHeat: '#c33326', tankDhw: '#ffffff',
    dim: '#000000'
  };

  function n(v) { return Math.round(v * 100) / 100; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function txt(x, y, s, o) {
    o = o || {};
    var a = ' x="' + n(x) + '" y="' + n(y) + '" font-size="' + (o.size || SZ.txt) + '"';
    if (o.anchor) a += ' text-anchor="' + o.anchor + '"';
    if (o.rotate) a += ' transform="rotate(' + o.rotate + ' ' + n(x) + ' ' + n(y) + ')"';
    if (o.maxW && String(s).length * (o.size || SZ.txt) * 0.42 > o.maxW)
      a += ' textLength="' + n(o.maxW) + '" lengthAdjust="spacingAndGlyphs"';
    // латиница вне покрытия чертёжного шрифта — запасным семейством целиком
    var PS = window.projectSheets;
    if (PS && PS.fontFor && PS.fontFor(s, null) === PS.FONT_LAT)
      a += ' font-family="' + PS.FONT_LAT + '"';
    return '<text' + a + '>' + esc(s) + '</text>';
  }
  // Инлайновый style: CSS листа (.sheet-a3 rect/line) сильнее атрибутов,
  // поэтому цвет задаётся только через style — как в project_scheme.js
  function paintStyle(fill, o) {
    o = o || {};
    return ' style="fill:' + (fill || 'none') + ';stroke:' + (o.stroke || 'none') +
      ';stroke-width:' + (o.sw || 0.2) + '"';
  }
  function rect(x, y, w, h, fill, o) {
    o = o || {};
    var a = ' x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"';
    if (o.rx) a += ' rx="' + o.rx + '"';
    return '<rect' + a + paintStyle(fill, o) + '/>';
  }
  function line(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) +
      '" style="stroke:' + (o.c || '#000') + ';stroke-width:' + (o.w || 0.2) + '"/>';
  }
  function circle(cx, cy, r, fill, o) {
    return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '"' +
      paintStyle(fill, o) + '/>';
  }
  function ellipse(cx, cy, rx, ry, fill, o) {
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '"' +
      paintStyle(fill, o) + '/>';
  }

  // ─── Размерные линии (засечки 45° по ГОСТ) ─────────────────────────────
  function tick(x, y) {
    return line(x - 0.9, y + 0.9, x + 0.9, y - 0.9, { w: 0.3 });
  }
  /** Горизонтальная цепочка: xs — границы, y — линия, числа над ней */
  function dimH(xs, y, o) {
    o = o || {};
    var out = [], i;
    out.push(line(xs[0], y, xs[xs.length - 1], y, { w: 0.13 }));
    for (i = 0; i < xs.length; i++) {
      out.push(line(xs[i], y - 2.2, xs[i], y + 1.2, { w: 0.13 }));
      out.push(tick(xs[i], y));
    }
    for (i = 0; i < xs.length - 1; i++) {
      var v = o.vals ? o.vals[i] : Math.round((xs[i + 1] - xs[i]) / o.s);
      if (v == null) continue;
      out.push(txt((xs[i] + xs[i + 1]) / 2, y - 0.8, v, { size: SZ.dim, anchor: 'middle' }));
    }
    return out.join('');
  }
  /** Вертикальная цепочка: ys — границы, x — линия, числа слева повёрнуто */
  function dimV(ys, x, o) {
    o = o || {};
    var out = [], i;
    out.push(line(x, ys[0], x, ys[ys.length - 1], { w: 0.13 }));
    for (i = 0; i < ys.length; i++) {
      out.push(line(x - 1.2, ys[i], x + 2.2, ys[i], { w: 0.13 }));
      out.push(tick(x, ys[i]));
    }
    for (i = 0; i < ys.length - 1; i++) {
      var v = o.vals ? o.vals[i] : Math.round(Math.abs(ys[i + 1] - ys[i]) / o.s);
      if (v == null) continue;
      out.push(txt(x - 0.8, (ys[i] + ys[i + 1]) / 2, v,
        { size: SZ.dim, anchor: 'middle', rotate: -90 }));
    }
    return out.join('');
  }

  // выноска, как в проектах-образцах: только ортогональные сегменты —
  // полка от текста горизонтально до вертикали якоря, затем вниз/вверх к точке
  function callout(ax, ay, tx, ty, s, o) {
    o = o || {};
    var out = [];
    out.push(circle(ax, ay, 0.38, '#000'));
    var x0 = tx + (o.right ? -0.8 : 0.8);
    if (Math.abs(ay - ty) < 0.6) {
      out.push(line(x0, ty, ax, ay, { w: 0.2 }));
    } else {
      out.push(line(x0, ty, ax, ty, { w: 0.2 }));
      out.push(line(ax, ty, ax, ay, { w: 0.2 }));
    }
    out.push(txt(tx, ty + SZ.txt * 0.35, s,
      { anchor: o.right ? 'start' : 'end', maxW: o.maxW || 120 }));
    return out.join('');
  }

  // ─── Габариты оборудования (реальные мм) ───────────────────────────────
  /**
   * Проекция прибора из BIM-модели вместо нарисованного контура. Картинки
   * готовит scratch/render_nodes.py --equip: ортогональный вид с прозрачным
   * фоном, пропорции равны габариту модели. Нет картинки — вернём null, и
   * прибор нарисуется как раньше.
   */
  function pic(ctx, key, view, x, y, w, h, val) {
    if (!ctx.equip) return null;
    var use = picKey(ctx, key, val);
    if (!ctx.equip[use]) return null;
    // у типоразмера с той же геометрией своего кадра нет — берём базовый
    var file = ctx.equip[use].img || use;
    return '<image x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" preserveAspectRatio="none" href="img/equip/' + file + '_' + view + '.png"/>';
  }

  /**
   * Кадр нужного типоразмера: бак на 24 л, а не тот тип семейства Revit,
   * который оказался активным при выгрузке. Типоразмеры сняты отдельными
   * кадрами и помечены в equip.json полями base и num (литры, киловатты).
   */
  function picKey(ctx, key, val) {
    if (!val || !ctx.equip) return key;
    var best = null;
    Object.keys(ctx.equip).forEach(function (k) {
      var it = ctx.equip[k];
      if (!it || it.base !== key || !it.num) return;
      var d = Math.abs(it.num - val);
      if (!best || d < best.d) best = { k: k, d: d };
    });
    return best ? best.k : key;
  }

  function tankSize(vol) {
    if (!vol) return null;
    if (vol <= 12) return { d: 280, h: 330 };
    if (vol <= 18) return { d: 280, h: 425 };
    if (vol <= 24) return { d: 320, h: 455 };
    if (vol <= 35) return { d: 365, h: 480 };
    if (vol <= 50) return { d: 410, h: 550 };
    if (vol <= 80) return { d: 480, h: 640 };
    return { d: 500, h: 780 };
  }
  function boilerTankSize(vol, wall) {
    if (wall) return { d: 500, h: 900, wall: true };
    if (!vol || vol <= 160) return { d: 530, h: 1200 };
    if (vol <= 200) return { d: 584, h: 1300 };
    if (vol <= 300) return { d: 640, h: 1700 };
    return { d: 700, h: 1900 };
  }

  /** Контекст компоновки: реальные габариты и состав, из схемы + сметы */
  function buildCtx(scheme, items) {
    var nameOf = function (i) { return i && i.name ? String(i.name) : ''; };
    var short = function (s) {
      s = String(s || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
      return s.length > 55 ? s.slice(0, 52) + '…' : s;
    };
    var find = function (re, not) {
      for (var k = 0; k < (items || []).length; k++) {
        var nm = nameOf(items[k]);
        if (re.test(nm) && !(not && not.test(nm))) return short(nm);
      }
      return null;
    };
    var gasCount = scheme.gas ? (scheme.gas.count || 1) : 0;
    var elCount = scheme.el ? (scheme.el.count || 1) : 0;

    // контуры-отводы гребёнки и строки легенды — по составу системы
    var loops = [];
    if (scheme.tp) {
      loops.push({ c: COL.supply, t: 'Подача теплого пола' });
      loops.push({ c: COL.ret, t: 'Обратка теплого пола' });
    }
    if (scheme.rad) {
      loops.push({ c: COL.supply, t: 'Подача радиаторного отопления' });
      loops.push({ c: COL.ret, t: 'Обратка радиаторного отопления' });
    }
    if (scheme.indirect) {
      loops.push({ c: COL.cold, t: 'Подпитка системы отопления' });
      loops.push({ c: COL.supply, t: 'Подача отопления бойлера' });
      loops.push({ c: COL.ret, t: 'Обратка отопления бойлера' });
    } else if (scheme.water && scheme.gas && scheme.gas.circuits === 2) {
      loops.push({ c: COL.dhw, t: 'Линия ГВС' });
      loops.push({ c: COL.cold, t: 'Линия ХВС' });
    }
    if (!loops.length) {
      loops.push({ c: COL.supply, t: 'Подача отопления' });
      loops.push({ c: COL.ret, t: 'Обратка отопления' });
    }

    return {
      gasCount: gasCount, elCount: elCount,
      boilerW: 440, boilerH: 750, boilerD: 350,
      elW: 420, elH: 640, elD: 300,
      // корпус электрокотла зависит от серии: STATUS или PLUS
      elKey: (scheme.el && scheme.el.status) ? 'boiler_status' : 'boiler_plus',
      hydro: !!scheme.hydro,
      indirect: scheme.indirect ? boilerTankSize(scheme.indirect.vol, scheme.indirect.wall) : null,
      tankH: tankSize(scheme.tankHeating),
      tankD: tankSize(scheme.tankDhw),
      // объёмы из сметы — по ним берётся кадр нужного типоразмера
      vol: {
        tankH: scheme.tankHeating || null,
        tankD: scheme.tankDhw || null,
        indirect: (scheme.indirect && scheme.indirect.vol) || null
      },
      loops: loops,
      tp: !!scheme.tp,
      names: {
        // Название котла берём из схемы: там оно от подобранной позиции каталога.
        // Поиск по слову «котёл» в смете — запасной вариант: у BAXI («ECO Nova 18F»)
        // и прочих моделей этого слова в названии нет, и подпись съезжала на общую.
        gas: (scheme.gas && scheme.gas.name ? short(scheme.gas.name) : null) ||
          find(/кот[её]л/i, /электрическ/i) || 'Котёл газовый настенный',
        el: (scheme.el && scheme.el.name ? short(scheme.el.name) : null) ||
          find(/кот[её]л\s+электрическ|электрическ\S*\s+кот[её]л/i) || 'Котёл электрический',
        boiler: find(/бойлер|водонагреват/i) || 'Бойлер косвенного нагрева',
        hydro: find(/гидравлическ\S*\s+раздел|гидрострелк/i) || 'Гидравлический разделитель',
        pump: find(/циркуляционн\S*\s+насос|насос\s+циркуляционн/i, /рециркуляц/i) || 'Циркуляционный насос',
        tankH: 'Расширительный бак для отопления' + (scheme.tankHeating ? ' на ' + scheme.tankHeating + 'л' : ''),
        tankD: 'Расширительный бак для ГВС' + (scheme.tankDhw ? ' на ' + scheme.tankDhw + 'л' : '')
      }
    };
  }

  // ─── Раскладка стены (реальные мм, от левого края стены) ───────────────
  function planWall(ctx) {
    var GAP = 150;
    var x = GAP, blocks = {};
    if (ctx.tankH) {
      blocks.tankH = { x: x, w: ctx.tankH.d };
      x += ctx.tankH.d + GAP;
    }
    // зона отводов: под котлами; ширина от числа контуров
    var zoneW = Math.max((ctx.loops.length - 1) * 90 + 140,
      ctx.gasCount * ctx.boilerW + ctx.elCount * ctx.elW +
      (ctx.gasCount + ctx.elCount - 1) * 60);
    blocks.zone = { x: x, w: zoneW };
    // котлы по центру зоны
    var bw = ctx.gasCount * ctx.boilerW + ctx.elCount * ctx.elW +
      (ctx.gasCount + ctx.elCount - 1) * 60;
    var bx = x + (zoneW - bw) / 2;
    blocks.boilers = [];
    for (var g = 0; g < ctx.gasCount; g++) {
      blocks.boilers.push({ x: bx, w: ctx.boilerW, h: ctx.boilerH, gas: true });
      bx += ctx.boilerW + 60;
    }
    for (var e = 0; e < ctx.elCount; e++) {
      blocks.boilers.push({ x: bx, w: ctx.elW, h: ctx.elH, gas: false });
      bx += ctx.elW + 60;
    }
    x += zoneW;
    if (ctx.hydro) { blocks.hydro = { x: x + 30, w: 120 }; x += 180; }
    if (ctx.tankD) {
      blocks.tankD = { x: x + GAP / 2, w: ctx.tankD.d };
      x += ctx.tankD.d + GAP;
    }
    if (ctx.indirect) {
      blocks.indirect = { x: x + GAP / 2, w: ctx.indirect.d };
      x += ctx.indirect.d + GAP;
    }
    blocks.W = x + GAP;
    return blocks;
  }

  // ─── Лист «Вид котельной спереди» ──────────────────────────────────────
  /**
   * Фасад котельной кадром из BIM-моделей.
   *
   * Кадр готовит scratch/render_nodes.py (узел boiler_front): котёл, шины,
   * стояки контуров с настоящей арматурой. Вместе с картинкой приходят
   * опорные точки в долях кадра — по ним ставим размерную цепочку между
   * стояками и кружки с номерами контуров, как на листе образца.
   */
  /** Контуры бойлерной стороны: подписи приходят вместе с кадром */
  function dhwLoops(ctx) {
    var pts = ((ctx.frontDhw || {}).anchors || {}).pts || [];
    return pts.filter(function (p) { return p.k === 'loop'; })
      .sort(function (a, b) { return a.x - b.x; })
      .map(function (p) { return { t: p.name || 'Контур ' + p.no }; });
  }

  function frontPhotoBody(ctx) {
    var ph = ctx.front, o = [];
    // Кадров несколько — по составу контуров. Ключ собираем из их цветов,
    // тогда цвет стояка на кадре и строка легенды описывают одно и то же.
    if (ph && !ph.url) {
      var code = (ctx.loops || []).map(function (L) {
        if (L.c === COL.supply) return 'S';
        if (L.c === COL.ret) return 'R';
        if (L.c === COL.dhw) return 'D';
        return 'C';
      }).join('');
      ph = ph[code] || ph['SRSRCSR'] || ph['SR'] || null;
    }
    if (!ph || !ph.url) return null;
    var F = { x: 122, y: 26, w: 274, h: 216 };
    var r = ph.ratio || 1;
    var w = F.w, h = w / r;
    if (h > F.h) { h = F.h; w = h * r; }
    var x = F.x + (F.w - w) / 2, y = F.y;
    o.push('<image x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" preserveAspectRatio="xMidYMid meet" href="' +
      String(ph.url).replace(/&/g, '&amp;') + '"/>');

    var A = ph.anchors || {}, pts = A.pts || [];
    var loops = pts.filter(function (p) { return p.k === 'loop'; })
      .sort(function (a, b) { return a.x - b.x; });
    var PX = function (p) { return x + p.x * w; };
    var PY = function (p) { return y + p.y * h; };

    // кружки с номерами контуров под стояками
    var cy = y + h + 6;
    loops.forEach(function (p) {
      o.push(circle(PX(p), cy, 3.2, '#ffffff', { stroke: '#000', sw: 0.25 }));
      o.push(txt(PX(p), cy + 1.2, String(p.no), { size: 3.3, anchor: 'middle' }));
      o.push(line(PX(p), PY(p), PX(p), cy - 3.4, { w: 0.15, c: '#888' }));
    });
    // размерная цепочка: шаг между стояками
    if (loops.length > 1) {
      var dy = cy + 8;
      o.push(dimH(loops.map(PX), dy, { vals: loops.slice(1).map(function () {
        return A.step_mm || 90; }) }));
    }

    // Вертикальная цепочка справа: отметки коллекторов, кранов и низа стояков.
    // Высоты приходят в опорных точках, поэтому подписи — настоящие, а не
    // пересчитанные из пикселей картинки.
    var lv = {};
    pts.forEach(function (p) {
      if (p.z == null) return;
      var k = p.k === 'loop' ? 'loop' : p.k;
      if (k === 'rail_r' || k === 'rail_l') return;
      if (!lv[k] || p.y < lv[k].y) lv[k] = p;
    });
    var levels = Object.keys(lv).map(function (k) { return lv[k]; })
      .sort(function (a, b) { return a.y - b.y; });
    if (levels.length > 1) {
      var dx = x + w + 8;
      o.push(dimV(levels.map(PY), dx, { vals: levels.slice(1).map(function (p, i) {
        return Math.abs(levels[i].z - p.z);
      }) }));
      levels.forEach(function (p) {
        o.push(line(PX(p), PY(p), dx - 2, PY(p), { w: 0.12, c: '#888' }));
      });
    }

    // Выноски к приборам: точки приходят вместе с кадром, подписи — оттуда же.
    // Полки уводим влево, как в образце, и разводим по высоте, чтобы не
    // налезали друг на друга.
    var ms = (ph.marks || []).slice().sort(function (a, b) { return a.y - b.y; });
    // Две колонки, как на листах образца: левая набирается сверху вниз, а что
    // ниже таблицы обозначений уже не помещается — уходит в правую.
    var ly = y + 4, ry = y + 4, LIM = 205;
    ms.forEach(function (m) {
      var ax = x + m.x * w, ay = y + m.y * h;
      if (ly <= LIM) {
        if (ly < ay) ly = ay;
        if (ly <= LIM) {
          o.push(callout(ax, ay, 138, ly, m.t, { right: false, maxW: 112 }));
          ly += 5.4;
          return;
        }
      }
      if (ry < ay) ry = ay;
      o.push(callout(ax, ay, 348, Math.min(ry, 250), m.t, { right: true, maxW: 56 }));
      ry += 5.4;
    });
    // условные обозначения контуров — как в образце, таблицей слева
    // Названия контуров берём из сметы (ctx.loops) — их же печатает
    // векторный вариант листа; по цвету системы не различить.
    var nameOf = function (p, i) {
      var L = (ctx.loops || [])[i];
      if (L && L.t) return L.t;
      if (p.sys === 'hot') return 'Линия ГВС';
      if (p.sys === 'cold') return 'Линия ХВС';
      return (p.sys === 'sup' ? 'Подача' : 'Обратка') + ' отопления';
    };
    var LX = 24, TY = 210;
    o.push(txt(LX + 55, TY - 3, 'Условные обозначения', { size: 4.2, anchor: 'middle' }));
    o.push(rect(LX, TY, 110, 6.4 * (loops.length + 1), 'none', { stroke: '#000', sw: 0.2 }));
    [['№', 'Наименование']].concat(loops.map(function (p, li) {
      return [String(p.no), nameOf(p, li)];
    })).forEach(function (row, i) {
      var ry = TY + i * 6.4;
      if (i) o.push(line(LX, ry, LX + 110, ry, { w: 0.2 }));
      o.push(txt(LX + 8, ry + 4.2, row[0], { size: 3.3, anchor: 'middle' }));
      o.push(txt(LX + 20, ry + 4.2, row[1], { size: 3.3 }));
    });
    o.push(line(LX + 16, TY, LX + 16, TY + 6.4 * (loops.length + 1), { w: 0.2 }));
    o.push(txt(LX, TY + 6.4 * (loops.length + 1) + 5,
      'Примечание: крепёж показан условно и не является частью проекта.', { size: 3.1 }));
    return o.join('');
  }

  function frontBody(ctx) {
    if (ctx.front) {
      var photo = frontPhotoBody(ctx);
      if (photo) return photo;
    }
    var o = [];
    var B = planWall(ctx);
    var H = 2200;                       // высота стены, мм
    var FLOOR_Y = 245;                  // пол на листе, мм листа
    var avail = { x0: 168, x1: 396 };   // поле под рисунок (слева выноски)
    var s = Math.min(0.1, (avail.x1 - avail.x0 - 14) / B.W, 205 / H);
    var X = function (mm) { return avail.x0 + 6.2 + mm * s; };
    var Y = function (mm) { return FLOOR_Y - mm * s; };      // мм от пола
    var wallW = B.W * s;

    // стена, плитка, торцы, пол
    o.push(rect(X(0), Y(H), wallW, H * s, COL.wall));
    var t;
    for (t = 300; t < B.W; t += 300)
      o.push(line(X(t), Y(H), X(t), Y(0), { c: COL.tile, w: 0.1 }));
    for (t = 300; t < H; t += 300)
      o.push(line(X(0), Y(t), X(B.W), Y(t), { c: COL.tile, w: 0.1 }));
    o.push(rect(X(0) - 6.2, Y(H), 6.2, H * s + 10.5, COL.wallEnd));
    o.push(rect(X(B.W), Y(H), 6.2, H * s + 10.5, COL.wallEnd));
    // пол: плинтус-линия, стяжка (с трубами ТП при их наличии), грунт
    o.push(line(X(0), Y(0), X(B.W), Y(0), { w: 0.5 }));
    o.push(rect(X(0), Y(0), wallW, 2, COL.plinth));
    o.push(rect(X(0), Y(0) + 2, wallW, 6.9, COL.screed));
    if (ctx.tp) o.push(rect(X(0), Y(0) + 3.4, wallW, 2.6, COL.warm));
    o.push(rect(X(0) - 6.2, Y(0) + 8.9, wallW + 12.4, 1.6, COL.ground));

    // гребёнки: подача/обратка (+ загрузка бойлера) через зону отводов
    var zone = B.zone;
    var railY = { supply: 1050, ret: 980 };
    var rails = [
      { y: railY.supply, c: COL.supply },
      { y: railY.ret, c: COL.ret }
    ];
    var zx0 = zone.x - 40, zx1 = zone.x + zone.w + 40;
    // стойки крепления
    o.push(rect(X(zx0) - 1.3, Y(1150), 2.6, (1150 - 820) * s, COL.rail));
    o.push(rect(X(zx1) - 1.3, Y(1150), 2.6, (1150 - 820) * s, COL.rail));
    rails.forEach(function (r) {
      o.push(rect(X(zx0), Y(r.y) - 1.1, (zx1 - zx0) * s, 2.2, r.c));
    });

    // котлы и их подводки к гребёнкам
    B.boilers.forEach(function (b) {
      var bx = X(b.x), bw = b.w * s, bh = b.h * s;
      var byTop = Y(1350 + b.h), pw;
      // электрический котёл есть моделью (SEB-2201), газового в семействах нет
      var im = pic(ctx, b.gas ? 'boiler_gas' : (ctx.elKey || 'boiler_plus'),
        'front', bx, byTop, bw, bh);
      if (im) {
        o.push(im);
      } else {
        o.push(rect(bx, byTop, bw, bh, COL.body, { stroke: '#9a9a9a', sw: 0.15, rx: 0.8 }));
        // панель управления с экраном
        pw = bw * 0.7;
        o.push(rect(bx + (bw - pw) / 2, byTop + bh * 0.78, pw, bh * 0.13, COL.panel, { rx: 0.5 }));
        o.push(rect(bx + bw / 2 - 2.6, byTop + bh * 0.81, 5.2, 2.0, b.gas ? '#b2b2b2' : '#2ab5b5'));
        // дымоход газового
        if (b.gas) o.push(rect(bx + bw / 2 - 2, Y(1350 + b.h) - 4, 4, 4, '#b2b2b2'));
      }
      // подводки вниз до гребёнок
      var cx = b.x + b.w / 2;
      o.push(rect(X(cx - 60) - 1.1, Y(1350), 2.2, (1350 - railY.supply) * s, COL.supply));
      o.push(rect(X(cx + 60) - 1.1, Y(1350), 2.2, (1350 - railY.ret) * s, COL.ret));
    });

    // гидрострелка справа от зоны отводов
    if (ctx.hydro) {
      var hx = X(B.hydro.x), hw = B.hydro.w * s;
      var hIm = pic(ctx, 'hydro_sep', 'front', hx, Y(1250), hw, (1250 - 850) * s);
      if (hIm) {
        o.push(hIm);
      } else {
        o.push(rect(hx, Y(1250), hw, (1250 - 850) * s, COL.body, { stroke: '#9a9a9a', sw: 0.15, rx: 1 }));
        o.push(rect(hx + hw / 2 - 0.8, Y(1290), 1.6, 40 * s, COL.brass));
        o.push(circle(hx + hw / 2, Y(1296), 1.6, COL.brass));
      }
    }

    // бойлер косвенного нагрева
    if (ctx.indirect) {
      var ib = B.indirect, iw = ib.w * s, ix = X(ib.x);
      if (ctx.indirect.wall) {
        o.push(rect(ix, Y(1100 + ctx.indirect.h), iw, ctx.indirect.h * s, COL.body,
          { stroke: '#9a9a9a', sw: 0.15, rx: 1.2 }));
      } else {
        var ih = ctx.indirect.h * s;
        var tIm = pic(ctx, 'boiler_tank', 'front', ix, Y(ctx.indirect.h), iw, ih,
          (ctx.vol || {}).indirect);
        if (tIm) {
          o.push(tIm);
        } else {
          o.push(rect(ix, Y(ctx.indirect.h - 20), iw, ih - (40 * s), '#8a8a8a', { rx: 2 }));
          o.push(ellipse(ix + iw / 2, Y(ctx.indirect.h - 20), iw / 2, 3, '#7d7d7d'));
          o.push(ellipse(ix + iw / 2, Y(60), iw / 2, 3.2, '#828282'));
          o.push(rect(ix + iw * 0.2, Y(0), iw * 0.12, 60 * s, '#4a4a4a'));
          o.push(rect(ix + iw * 0.68, Y(0), iw * 0.12, 60 * s, '#4a4a4a'));
        }
      }
    }

    // расширительный бак отопления на полу
    if (ctx.tankH) {
      var tb = B.tankH, tw = tb.w * s, tx = X(tb.x);
      var th = ctx.tankH.h * s;
      var kIm = pic(ctx, 'exp_tank', 'front', tx, Y(ctx.tankH.h), tw, th,
        (ctx.vol || {}).tankH);
      if (kIm) {
        o.push(kIm);
      } else {
        o.push(rect(tx, Y(ctx.tankH.h - 15), tw, th - 30 * s, COL.tankHeat, { rx: 2.4 }));
        o.push(ellipse(tx + tw / 2, Y(ctx.tankH.h - 15), tw / 2, 2.6, '#a92c21'));
        o.push(rect(tx + tw / 2 - 0.9, Y(ctx.tankH.h), 1.8, 15 * s + 2, COL.brass));
        o.push(rect(tx + tw / 2 - 3, Y(0), 6, 3, '#3a3a3a'));
      }
    }

    // отводы контуров вниз + краны + марки
    var lp = ctx.loops, lpN = lp.length;
    var step = 90, lx0 = zone.x + (zone.w - (lpN - 1) * step) / 2;
    var marks = [];
    lp.forEach(function (l, i) {
      var mx = lx0 + i * step;
      var fromY = l.c === COL.ret ? railY.ret : railY.supply;
      o.push(rect(X(mx) - 1.1, Y(fromY), 2.2, fromY * s, l.c));
      // шаровой кран с красной ручкой на 350 от пола
      o.push(rect(X(mx) - 1.6, Y(390), 3.2, 40 * s, COL.brass, { rx: 0.5 }));
      o.push(line(X(mx), Y(370), X(mx) + 2.6, Y(430), { c: COL.valve, w: 1.1 }));
      marks.push({ x: X(mx), num: i + 1 });
    });
    // трёхходовой клапан и насос на подаче тёплого пола (первый отвод)
    if (ctx.tp) {
      o.push(circle(X(lx0), Y(640), 3.1, '#e9e9e9', { stroke: '#9a9a9a', sw: 0.15 }));
      o.push(circle(X(lx0), Y(530), 4.9, COL.pump));
      o.push(circle(X(lx0), Y(530), 1.6, '#3f3f3f'));
    }
    // марки-овалы у пола
    marks.forEach(function (m, i) {
      o.push(ellipse(m.x, Y(0) + 15, 3, 1.9, '#fff', { stroke: '#000', sw: 0.2 }));
      o.push(txt(m.x, Y(0) + 15 + SZ.mark * 0.35, String(i + 1),
        { size: SZ.mark, anchor: 'middle' }));
    });

    // ─── размеры ───
    // сверху: от торца стены до первого котла, ширины котлов, остаток
    var xs = [X(0)], vals = [];
    var bs = B.boilers;
    if (bs.length) {
      xs.push(X(bs[0].x)); vals.push(Math.round(bs[0].x));
      bs.forEach(function (b, i) {
        xs.push(X(b.x + b.w)); vals.push(Math.round(b.w));
        var nxt = bs[i + 1];
        if (nxt) { xs.push(X(nxt.x)); vals.push(Math.round(nxt.x - b.x - b.w)); }
      });
      xs.push(X(B.W)); vals.push(Math.round(B.W - bs[bs.length - 1].x - bs[bs.length - 1].w));
    } else { xs.push(X(B.W)); vals.push(Math.round(B.W)); }
    o.push(dimH(xs, Y(H) - 6, { vals: vals }));

    // справа: высотные отметки — верх котла, низ котла, гребёнки, пол
    var dy = [Y(1350 + ctx.boilerH), Y(1350), Y(railY.supply), Y(railY.ret), Y(0)];
    var dv = [ctx.boilerH, 1350 - railY.supply, railY.supply - railY.ret, railY.ret];
    o.push(dimV(dy, X(B.W) + 12, { vals: dv }));
    // отводы: шаг марок внизу
    if (marks.length > 1) {
      var mxs = marks.map(function (m) { return m.x; });
      o.push(dimH(mxs, Y(0) + 22, { vals: mxs.slice(1).map(function () { return step; }) }));
    }

    // ─── выноски слева ───
    var cy = 60, CX = 160;
    function co(ax, ay, name) {
      o.push(callout(ax, ay, CX, cy, name));
      cy += 12;
    }
    if (bs.length && ctx.gasCount) co(X(bs[0].x + bs[0].w / 2), Y(1350 + ctx.boilerH / 2), ctx.names.gas);
    if (ctx.elCount) {
      var eb = bs[ctx.gasCount];
      co(X(eb.x + eb.w / 2), Y(1350 + eb.h / 2), ctx.names.el);
    }
    if (ctx.hydro) co(X(B.hydro.x + B.hydro.w / 2), Y(1050), ctx.names.hydro);
    if (ctx.tankH) co(X(B.tankH.x + B.tankH.w / 2), Y(ctx.tankH.h / 2), ctx.names.tankH);
    if (ctx.tp) co(X(lx0), Y(530), ctx.names.pump);
    if (ctx.indirect) co(X(B.indirect.x + B.indirect.w / 2),
      Y(ctx.indirect.wall ? 1100 + ctx.indirect.h / 2 : ctx.indirect.h / 2), ctx.names.boiler);

    // ─── легенда и примечание ───
    o.push(legend(ctx.loops, 30, 200));
    o.push(txt(228, 270.8, 'Примечание: Крепеж показан условно и не является частью проекта.',
      { size: 3.0 }));
    o.push(txt(228, 274.8, 'Расстановка оборудования условная, уточняется по месту монтажа.',
      { size: 3.0 }));
    return o.join('');
  }

  // таблица «Условные обозначения»
  function legend(loops, Lx, Ty) {
    var o = [], W = 84, rh = 7, hw = 12;
    var H2 = rh * (loops.length + 1);
    o.push(txt(Lx + W / 2, Ty - 2, 'Условные обозначения', { size: 4.68, anchor: 'middle' }));
    o.push(rect(Lx, Ty, W, H2, null, { stroke: '#000', sw: 0.25 }));
    o.push(line(Lx + hw, Ty, Lx + hw, Ty + H2, { w: 0.18 }));
    o.push(txt(Lx + hw / 2, Ty + rh / 2 + 1.6, '№', { size: 4.68, anchor: 'middle' }));
    o.push(txt(Lx + hw + (W - hw) / 2, Ty + rh / 2 + 1.6, 'Наименование', { size: 4.68, anchor: 'middle' }));
    loops.forEach(function (l, i) {
      var y = Ty + rh * (i + 1);
      o.push(line(Lx, y, Lx + W, y, { w: 0.18 }));
      o.push(txt(Lx + hw / 2, y + rh / 2 + 1.3, String(i + 1), { anchor: 'middle' }));
      o.push(txt(Lx + hw + 2, y + rh / 2 + 1.3, l.t, { maxW: W - hw - 4 }));
    });
    return o.join('');
  }

  // ─── Лист «Компоновка котельной» (план) ────────────────────────────────
  // room: реальные габариты помещения из зоны «Котельная» плана этажа (мм)
  function planBody(ctx, room) {
    var o = [];
    var B = planWall(ctx);
    // помещение шире набора оборудования — растягиваем стену до реального
    if (room && room.w > B.W) B.W = room.w;
    var ROOM_D = (room && room.d) ? room.d : 2000;  // глубина помещения, мм
    var WALL = 200, PART = 100;        // несущая стена и перегородки
    var avail = { x0: 130, y0: 30, x1 : 400, y1: 262 };
    var s = Math.min(0.1, (avail.x1 - avail.x0 - 24) / (B.W + WALL * 2),
      (avail.y1 - avail.y0 - 22) / (ROOM_D + WALL + PART));
    var X = function (mm) { return avail.x0 + 18 + WALL * s + mm * s; };
    var Y = function (mm) { return avail.y0 + 10 + WALL * s + mm * s; };  // от внутр. угла

    // стены: верхняя несущая (серая), боковые и нижняя перегородки (синие)
    o.push(rect(X(0) - WALL * s, Y(0) - WALL * s, (B.W + 2 * WALL) * s, WALL * s, '#8c8c8c'));
    o.push(rect(X(0) - PART * s, Y(0), PART * s, ROOM_D * s, COL.wallEnd));
    o.push(rect(X(B.W), Y(0), PART * s, ROOM_D * s, COL.wallEnd));
    // нижняя перегородка с дверным проёмом 800 у правого края
    var doorW = 800, dwx = B.W - doorW - 150;
    o.push(rect(X(0) - PART * s, Y(ROOM_D), (dwx + PART) * s, PART * s, COL.wallEnd));
    o.push(rect(X(dwx + doorW), Y(ROOM_D), (B.W - dwx - doorW + PART) * s, PART * s, COL.wallEnd));
    // окно в несущей стене — белый разрыв над зоной котлов
    var winW = Math.min(1200, B.zone.w), winX = B.zone.x + (B.zone.w - winW) / 2;
    o.push(rect(X(winX), Y(0) - WALL * s, winW * s, WALL * s, '#fff', { stroke: '#8c8c8c', sw: 0.15 }));
    o.push(line(X(winX), Y(0) - WALL * s / 2, X(winX + winW), Y(0) - WALL * s / 2, { w: 0.15 }));
    // пол помещения
    o.push(rect(X(0), Y(0), B.W * s, ROOM_D * s, '#f7f7f7', { stroke: '#c9c9c9', sw: 0.1 }));

    // оборудование в плане вдоль верхней стены
    B.boilers.forEach(function (b) {
      o.push(rect(X(b.x), Y(30), b.w * s, (b.gas ? ctx.boilerD : ctx.elD) * s,
        COL.body, { stroke: '#8f8f8f', sw: 0.18, rx: 0.6 }));
      o.push(circle(X(b.x + b.w / 2), Y(30 + ctx.boilerD / 2), Math.min(b.w, 200) * s / 2,
        null, { stroke: '#b5b5b5', sw: 0.13 }));
    });
    if (ctx.tankH)
      o.push(circle(X(B.tankH.x + B.tankH.w / 2), Y(40 + ctx.tankH.d / 2),
        ctx.tankH.d * s / 2, COL.tankHeat, { stroke: '#7d211a', sw: 0.15 }));
    if (ctx.tankD)
      o.push(circle(X(B.tankD.x + B.tankD.w / 2), Y(40 + ctx.tankD.d / 2),
        ctx.tankD.d * s / 2, '#fff', { stroke: '#9a9a9a', sw: 0.18 }));
    if (ctx.indirect)
      o.push(circle(X(B.indirect.x + B.indirect.w / 2), Y(40 + ctx.indirect.d / 2),
        ctx.indirect.d * s / 2, '#8a8a8a', { stroke: '#5f5f5f', sw: 0.18 }));
    if (ctx.hydro)
      o.push(rect(X(B.hydro.x), Y(30), B.hydro.w * s, 90 * s, COL.body, { stroke: '#8f8f8f', sw: 0.15 }));
    // гребёнка вдоль стены в зоне отводов (полоса подачи/обратки в плане)
    o.push(rect(X(B.zone.x - 40), Y(10), (B.zone.w + 80) * s, 2.2, COL.supply));
    o.push(rect(X(B.zone.x - 40), Y(10) + 2.6, (B.zone.w + 80) * s, 2.2, COL.ret));

    // узел ввода воды на левой стене
    var wiY = 900, wiH = 630;
    o.push(rect(X(0), Y(wiY), 60 * s, wiH * s, '#e8e8e8', { stroke: '#8f8f8f', sw: 0.15 }));
    for (var kv = 0; kv < 4; kv++)
      o.push(line(X(70), Y(wiY + 80 + kv * 150), X(140), Y(wiY + 80 + kv * 150), { c: COL.valve, w: 0.9 }));

    // ─── размеры ───
    var xs = [X(0)], vals = [];
    var order = [];
    if (B.tankH) order.push(B.tankH);
    order.push({ x: B.zone.x, w: B.zone.w });
    if (B.hydro) order.push(B.hydro);
    if (B.tankD) order.push(B.tankD);
    if (B.indirect) order.push(B.indirect);
    var px = 0;
    order.forEach(function (blk) {
      xs.push(X(blk.x)); vals.push(Math.round(blk.x - px));
      xs.push(X(blk.x + blk.w)); vals.push(Math.round(blk.w));
      px = blk.x + blk.w;
    });
    xs.push(X(B.W)); vals.push(Math.round(B.W - px));
    o.push(dimH(xs, Y(0) - WALL * s - 6, { vals: vals }));
    // слева: узел ввода
    o.push(dimV([Y(0), Y(wiY), Y(wiY + wiH), Y(ROOM_D)], X(0) - PART * s - 8,
      { vals: [wiY, wiH, ROOM_D - wiY - wiH] }));
    // справа: глубина помещения
    o.push(dimV([Y(0), Y(ROOM_D)], X(B.W) + PART * s + 8, { vals: [ROOM_D] }));

    // ─── выноски ───
    var cy = 55, CX = 122;
    function co(ax, ay, name) { o.push(callout(ax, ay, CX, cy, name)); cy += 12; }
    if (ctx.tankH) co(X(B.tankH.x + B.tankH.w / 2), Y(40 + ctx.tankH.d / 2), ctx.names.tankH);
    if (ctx.gasCount) co(X(B.boilers[0].x + B.boilers[0].w / 2), Y(30 + ctx.boilerD / 2), ctx.names.gas);
    if (ctx.elCount) {
      var eb = B.boilers[ctx.gasCount];
      co(X(eb.x + eb.w / 2), Y(30 + ctx.elD / 2), ctx.names.el);
    }
    if (ctx.tankD) co(X(B.tankD.x + B.tankD.w / 2), Y(40 + ctx.tankD.d / 2), ctx.names.tankD);
    if (ctx.indirect) co(X(B.indirect.x + B.indirect.w / 2), Y(40 + ctx.indirect.d / 2), ctx.names.boiler);
    o.push(callout(X(30), Y(wiY + wiH / 2), CX, cy, 'Узел ввода воды'));

    o.push(txt(228, 273.8, room
      ? 'Размеры помещения — по зоне «Котельная» плана этажа; расстановка уточняется по месту.'
      : 'Размеры помещения условные: планировка уточняется по месту монтажа.',
      { size: 3.0 }));
    return o.join('');
  }

  function title(s) {
    return txt(217.5, 14.8, s, { size: SZ.title, anchor: 'middle' });
  }

  /**
   * Лист «Общий вид котельной»: снимок 3D-модели из калькулятора
   * (Boiler3D.snapshot) — та же котельная, что монтажник крутит на экране.
   * Картинка вписывается в поле листа по своим пропорциям, под ней рамка
   * и примечание: расстановка условная, размеры берутся с листа компоновки.
   */
  function viewBody(photo, ratio) {
    var F = { x0: 26, y0: 24, x1: 409, y1: 252 };      // поле под изображение
    var r = ratio || 1.6;
    var w = F.x1 - F.x0, h = w / r;
    if (h > F.y1 - F.y0) { h = F.y1 - F.y0; w = h * r; }
    var x = F.x0 + ((F.x1 - F.x0) - w) / 2, y = F.y0 + ((F.y1 - F.y0) - h) / 2;
    var o = [];
    o.push('<image x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" preserveAspectRatio="xMidYMid meet" href="' + String(photo).replace(/&/g, '&amp;') + '"/>');
    o.push('<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" style="fill:none;stroke:#000;stroke-width:0.25"/>');
    o.push(txt(x, y + h + 5.4, 'Общий вид помещения котельной по составу сметы.', { size: 3.2 }));
    o.push(txt(x, y + h + 9.6, 'Расстановка оборудования показана условно; ' +
      'габариты и привязки — по листу «Компоновка котельной».', { size: 3.2 }));
    o.push(txt(228, 273.8, 'Модель построена автоматически по подобранному оборудованию.', { size: 3.0 }));
    return o.join('');
  }

  /** Листы этапа 4: [{title, svg}] */
  function sheets(scheme, items, opts) {
    opts = opts || {};
    if (!scheme) return [];
    var ctx = buildCtx(scheme, items || []);
    // проекции приборов из BIM-моделей, если они собраны (img/equip)
    ctx.equip = opts.equip || null;
    ctx.front = opts.front || null;
    ctx.frontDhw = opts.frontDhw || null;
    var start = opts.sheetStart || 1;
    var fmt = opts.num || function (v) { return String(v); };
    var out = [
      {
        title: 'Компоновка котельной',
        svg: window.projectSheets.sheet({
          code: opts.code, sheet: fmt(start),
          body: title('Компоновка котельной') + planBody(ctx, opts.room || null)
        })
      },
      {
        title: 'Вид котельной спереди',
        svg: window.projectSheets.sheet({
          code: opts.code, sheet: fmt(start + 1),
          body: title(ctx.frontDhw ? 'Вид котельной спереди на котлы'
            : 'Вид котельной спереди') + frontBody(ctx)
        })
      }
    ];
    // Второй фасад — со стороны бойлера. В образце на 179 м² это отдельный
    // лист: на один вид котлы и бойлер с обвязкой не помещаются.
    if (ctx.frontDhw && ctx.frontDhw.url) {
      var dctx = Object.assign({}, ctx, { front: ctx.frontDhw, loops: dhwLoops(ctx) });
      out.push({
        title: 'Вид котельной спереди на бойлер',
        svg: window.projectSheets.sheet({
          code: opts.code, sheet: fmt(start + out.length),
          body: title('Вид котельной спереди на бойлер') + frontPhotoBody(dctx)
        })
      });
    }
    // Снимка нет (нет сети, нет WebGL) — лист просто не выпускается
    if (opts.photo) out.push({
      title: 'Общий вид котельной',
      svg: window.projectSheets.sheet({
        code: opts.code, sheet: fmt(start + 2),
        body: title('Общий вид котельной') + viewBody(opts.photo, opts.photoRatio)
      })
    });
    return out;
  }

  window.projectLayout = { sheets: sheets, buildCtx: buildCtx };
})();
