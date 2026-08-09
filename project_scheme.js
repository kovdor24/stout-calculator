/* project_scheme.js — лист «Принципиальная схема» (А3, ГОСТ 21.101)
 *
 * УГО, таблица обозначений, легенда трубопроводов и вся геометрия сняты
 * с листа ТМ-2 проекта 2025-191 (Boiler_Club_106m2.pdf, стр. 25) и листов
 * ТМ-03 проектов 2025-148 / 2025-1209R — не нарисованы по памяти.
 *
 * Схема не рисуется, а КОМПОНУЕТСЯ из конфигурации системы:
 *   { gas: {circuits}, el: {}, indirect: {vol}, fugas, loadPump,
 *     rad, tp, hydro: {kw}, water, recirc, tankHeating, tankDhw, dia }
 *
 * Требует project_sheets.js (рамка, штамп, текст). Глобал: window.projectScheme
 */
(function () {
  'use strict';

  // ─── Цвета трубопроводов (сняты с ТМ-2) ────────────────────────────────
  var COL = {
    supply: '#ff0000',   // подающий
    ret: '#0000ff',      // обратный
    loadS: '#800040',    // подающий загрузки бойлера
    loadR: '#8282ff',    // обратный загрузки бойлера
    dhw: '#ff8000',      // горячее водоснабжение
    recirc: '#ff00ff',   // рециркуляция ГВС
    cold: '#00ffff'      // холодное водоснабжение
  };
  // Толщины: трубы схемы 0.2, образцы в легенде 0.35, тонкие выноски 0.08
  var LW = { pipe: 0.2, sym: 0.2, thin: 0.08, sample: 0.35 };
  var SZ = { txt: 3.68, dia: 2.05, head: 5.19, title: 7.36 };
  var GREY = { body: '#f0f0f0', edge: '#e1e1e1', icon: '#1e88c7' };

  function n(v) { return Math.round(v * 100) / 100; }
  // Линии и прямоугольники задают вид инлайн-стилем: общий <style> листа
  // (.sheet-a3 line,rect {stroke:#000}) иначе перебьёт цвета трубопроводов.
  function ln(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) +
      '" style="stroke:' + (o.c || '#000') + ';stroke-width:' + (o.w || LW.sym) +
      (o.dash ? ';stroke-dasharray:' + o.dash : '') + '"/>';
  }
  function pline(pts, o) {
    o = o || {};
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + n(p[0]) + ',' + n(p[1]); }).join('');
    return '<path d="' + d + (o.close ? 'Z' : '') + '" fill="' + (o.f || 'none') +
      '" stroke="' + (o.c || (o.f && o.f !== 'none' ? 'none' : '#000')) +
      '" stroke-width="' + (o.w || LW.sym) + '"/>';
  }
  function path(d, o) {
    o = o || {};
    return '<path d="' + d + '" fill="' + (o.f || 'none') + '" stroke="' + (o.c || 'none') +
      '" stroke-width="' + (o.w || 0) + '"/>';
  }
  function circle(cx, cy, r, o) {
    o = o || {};
    return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" style="fill:' + (o.f || 'none') +
      ';stroke:' + (o.c || (o.f ? 'none' : '#000')) + ';stroke-width:' + (o.w || LW.sym) + '"/>';
  }
  function rrect(x, y, w, h, r, o) {
    o = o || {};
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" rx="' + n(r) + '" style="fill:' + (o.f || 'none') + ';stroke:' + (o.c || 'none') +
      ';stroke-width:' + (o.w || 0) + '"/>';
  }
  function txt(x, y, s, o) { return window.projectSheets.text(x, y, s, o); }

  // ─── УГО. Все размеры обмерены по колонке символов легенды ТМ-2 ───────

  /** Шаровый кран. (x,y) — центр. vert — на вертикальной трубе.
   *  Вдоль трубы 5, поперёк 3, шарик r 0.82. */
  function ballValve(x, y, vert) {
    function pt(u, v) { return vert ? [x + v, y + u] : [x + u, y + v]; }
    var o = [];
    o.push(pline([pt(-2.5, -1.5), pt(-2.5, 1.5)]));
    o.push(pline([pt(2.5, -1.5), pt(2.5, 1.5)]));
    [[-2.5, 1.5, -0.7, 0.41], [2.5, 1.5, 0.7, 0.41], [-2.5, -1.5, -0.7, -0.41], [2.5, -1.5, 0.7, -0.41]]
      .forEach(function (s) { o.push(pline([pt(s[0], s[1]), pt(s[2], s[3])])); });
    o.push(circle(x, y, 0.82));
    return o.join('');
  }

  /** Обратный клапан. flow: 'down'|'up'|'right'|'left' — куда пропускает.
   *  Две полные диагонали, залитый треугольник со стороны выхода, упор. */
  function checkValve(x, y, flow) {
    var vert = (flow === 'down' || flow === 'up');
    var sgn = (flow === 'down' || flow === 'right') ? 1 : -1;
    function pt(u, v) { u *= sgn; return vert ? [x + v, y + u] : [x + u, y + v]; }
    var o = [];
    o.push(pline([pt(-2.5, -1.5), pt(-2.5, 1.5)]));
    o.push(pline([pt(2.5, -1.5), pt(2.5, 1.5)]));
    o.push(pline([pt(-2.5, 1.5), pt(2.5, -1.5)]));
    o.push(pline([pt(-2.5, -1.5), pt(2.5, 1.5)]));
    o.push(pline([pt(2.5, 1.5), pt(2.5, -1.5), pt(0, 0)], { f: '#000' }));
    // упор-скобка у выходного торца (тонкая линия в оригинале)
    o.push(pline([pt(0.64, -1.08), pt(1.85, -1.81)], { w: LW.thin }));
    o.push(pline([pt(0.69, -2.5), pt(1.85, -1.81)], { w: LW.thin }));
    o.push(pline([pt(1.85, -1.81), pt(-1.98, -1.81)], { w: LW.thin }));
    return o.join('');
  }

  /** Циркуляционный насос. (x,y) — центр, r 2.92, треугольник по потоку. */
  function pump(x, y, dir) {
    var o = [circle(x, y, 2.92)];
    var tri = {
      down: [[x, y + 2.92], [x - 2.52, y - 1.46], [x + 2.52, y - 1.46]],
      up: [[x, y - 2.92], [x - 2.52, y + 1.46], [x + 2.52, y + 1.46]],
      right: [[x + 2.92, y], [x - 1.46, y - 2.52], [x - 1.46, y + 2.52]],
      left: [[x - 2.92, y], [x + 1.46, y - 2.52], [x + 1.46, y + 2.52]]
    }[dir || 'down'];
    o.push(pline(tri, { f: '#000', close: true }));
    return o.join('');
  }

  /** Патрубок клапана: торцевая черта 3 мм + две линии к шарику r 0.82.
   *  (x,y) — центр шарика, side: 'u'|'d'|'l'|'r', вынос торца 2.5. */
  function valvePort(x, y, side) {
    var o = [];
    if (side === 'u' || side === 'd') {
      var sy = side === 'u' ? -1 : 1;
      var ty = y + sy * 2.5;
      o.push(pline([[x - 1.5, ty], [x + 1.5, ty]]));
      o.push(pline([[x - 1.5, ty], [x - 0.41, y + sy * 0.68]]));
      o.push(pline([[x + 1.5, ty], [x + 0.41, y + sy * 0.68]]));
    } else {
      var sx = side === 'l' ? -1 : 1;
      var tx = x + sx * 2.5;
      o.push(pline([[tx, y - 1.5], [tx, y + 1.5]]));
      o.push(pline([[tx, y - 1.5], [x + sx * 0.68, y - 0.41]]));
      o.push(pline([[tx, y + 1.5], [x + sx * 0.68, y + 0.41]]));
    }
    return o.join('');
  }

  /** Трёхходовой клапан: три патрубка + шарик + кружок привода.
   *  kind: 'therm' («м»), 'servo' (линза), 'prio' (полукруг залит).
   *  ports: строка из 'u','d','l','r'. circleSide: свободная сторона. */
  function valve3(x, y, kind, ports, circleSide) {
    ports = ports || 'udr'; circleSide = circleSide || 'l';
    var o = [];
    for (var i = 0; i < ports.length; i++) o.push(valvePort(x, y, ports[i]));
    o.push(circle(x, y, 0.82));
    var C = { l: [-3.13, 0], r: [3.13, 0], u: [0, -3.13], d: [0, 3.13] }[circleSide];
    var cx = x + C[0], cy = y + C[1];
    o.push(circle(cx, cy, 1.5));
    o.push(pline([[cx + (x - cx) * 0.48, cy + (y - cy) * 0.48], [x - (x - cx) * 0.27, y - (y - cy) * 0.27]]));
    if (kind === 'therm') {
      o.push(txt(cx, cy + 1.25, 'м', { size: SZ.txt, anchor: 'middle' }));
    } else if (kind === 'servo') {
      // линза-полумесяц внутри кружка (УГО «клапан трехходовой с сервоприводом»)
      o.push(path('M' + n(cx) + ',' + n(cy - 1.5) + ' Q' + n(cx - 0.46) + ',' + n(cy - 0.75) + ' ' + n(cx) + ',' + n(cy) +
        ' Q' + n(cx + 0.46) + ',' + n(cy + 0.75) + ' ' + n(cx) + ',' + n(cy + 1.5), { c: '#000', w: LW.sym }));
    } else if (kind === 'prio') {
      // залитый полукруг (клапан приоритета бойлера)
      o.push(path('M' + n(cx) + ',' + n(cy - 1.5) + ' A1.5,1.5 0 0 0 ' + n(cx) + ',' + n(cy + 1.5) + ' Z',
        { f: '#000', c: '#000', w: LW.sym }));
    }
    return o.join('');
  }

  /** Предохранительный клапан: вход сбоку, сброс вниз, пружина-рычаг.
   *  (x,y) — центр шарика; mirror — вход слева (пружина справа). */
  function safetyValve(x, y, mirror) {
    var m = mirror ? -1 : 1;
    function pt(u, v) { return [x + m * u, y + v]; }
    var o = [];
    o.push(pline([pt(-1.5, 2.5), pt(1.5, 2.5)]));
    o.push(pline([pt(1.5, 2.5), pt(0.41, 0.68)]));
    o.push(pline([pt(-0.41, 0.68), pt(-1.5, 2.5)]));
    o.push(pline([pt(2.5, 1.5), pt(2.5, -1.5)]));
    o.push(pline([pt(2.5, 1.5), pt(0.68, 0.41)]));
    o.push(pline([pt(0.68, -0.41), pt(2.5, -1.5)]));
    o.push(circle(x, y, 0.82));
    o.push(pline([pt(-0.82, 0), pt(-1.76, 0), pt(-1.76, -0.83), pt(-2.42, 0.55),
      pt(-2.8, -0.23), pt(-3.69, -0.23)]));
    return o.join('');
  }

  /** Автоматический воздухоотводчик. (x,y) — точка посадки (низ ножки). */
  function airVent(x, y) {
    var o = [];
    o.push(pline([[x, y], [x, y - 1.26]]));
    o.push(pline([[x - 1, y - 1.26], [x + 1, y - 1.26]]));
    o.push(pline([[x - 1, y - 4.1], [x + 1, y - 4.1]]));
    o.push(pline([[x - 1, y - 1.26], [x - 1, y - 4.1]]));
    o.push(pline([[x + 1, y - 1.26], [x + 1, y - 4.1]]));
    o.push(pline([[x, y - 4.1], [x, y - 5.04]]));
    o.push(pline([[x - 1.5, y - 5.04], [x + 1.5, y - 5.04]]));
    o.push(pline([[x - 1.5, y - 5.04], [x, y - 7.54]]));
    o.push(pline([[x + 1.5, y - 5.04], [x, y - 7.54]]));
    return o.join('');
  }

  /** Термометр / манометр: круг r2 с буквой. */
  function gauge(x, y, letter) {
    return circle(x, y, 2) + txt(x, y + 1.28, letter, { size: SZ.txt, anchor: 'middle' });
  }

  /** Фильтр: ромб (полудиагональ 3.53), пунктирная ось горизонтальна. */
  function filterSym(x, y) {
    var r = 3.53, o = [];
    o.push(pline([[x, y - r], [x + r, y], [x, y + r], [x - r, y], [x, y - r]]));
    o.push(pline([[x - r, y], [x - r + 1.54, y]]));
    o.push(pline([[x - 1, y], [x + 1, y]]));
    o.push(pline([[x + r - 1.53, y], [x + r, y]]));
    return o.join('');
  }

  /** Соединительное устройство для расширительного бака (символ легенды). */
  function expConn(x, y) {
    return path('M' + n(x - 1.25) + ',' + n(y - 1.9) + ' Q' + n(x) + ',' + n(y + 0.6) + ' ' + n(x + 1.25) + ',' + n(y - 1.9),
      { c: '#000', w: LW.sym }) +
      path('M' + n(x - 1.25) + ',' + n(y + 2.1) + ' Q' + n(x) + ',' + n(y - 0.4) + ' ' + n(x + 1.25) + ',' + n(y + 2.1),
        { c: '#000', w: LW.sym });
  }

  /** Группа безопасности котла. (x,y) — точка посадки на трубу (низ ножки).
   *  Офсеты сняты с УГО легенды (якорь оригинала 32.07,193.35). */
  function safetyGroup(x, y) {
    var dx = x - 32.07, dy = y - 193.35, o = [];
    function L(a, b, c, d) { o.push(pline([[a + dx, b + dy], [c + dx, d + dy]])); }
    L(32.07, 193.35, 32.07, 191.09);
    L(28.74, 191.09, 35.39, 191.09);
    L(28.74, 191.09, 28.74, 189.62);
    L(32.07, 191.09, 32.07, 189.57);
    o.push(gauge(32.07 + dx, 187.57 + dy, 'P'));
    L(35.39, 191.09, 35.39, 189.83);
    L(34.39, 189.83, 36.39, 189.83); L(34.39, 186.99, 36.39, 186.99);
    L(34.39, 186.99, 34.39, 189.83); L(36.39, 186.99, 36.39, 189.83);
    L(35.39, 186.99, 35.39, 186.05);
    L(33.89, 186.05, 36.89, 186.05); L(33.89, 186.05, 35.39, 183.55); L(36.89, 186.05, 35.39, 183.55);
    L(27.24, 189.62, 30.24, 189.62);
    L(26.24, 188.62, 26.24, 185.62);
    L(26.24, 188.62, 28.05, 187.53); L(27.24, 189.62, 28.32, 187.81);
    L(28.05, 186.7, 26.24, 185.62); L(29.15, 187.81, 30.24, 189.62);
    o.push(circle(28.6 + dx, 187.13 + dy, 0.82));
    L(28.74, 186.31, 28.74, 185.37); L(28.74, 185.37, 29.57, 185.37);
    L(29.57, 185.37, 28.19, 184.71); L(28.19, 184.71, 28.98, 184.33); L(28.98, 184.33, 28.98, 183.44);
    return o.join('');
  }

  /** Выноска размера: наклонная + полочка + текст. (ax,ay) — точка старта
   *  на арматуре. Геометрия снята с выносок 3/4" листа ТМ-2. */
  function leader(ax, ay, size) {
    return pline([[ax, ay], [ax - 1.06, ay - 1.06]], { w: LW.thin }) +
      pline([[ax - 1.06, ay - 1.06], [ax - 4.32, ay - 1.06]], { w: LW.thin }) +
      txt(ax - 4.18, ay - 1.48, size, { size: SZ.dia });
  }
  /** Выноска у вертикального крана с центром (vx,vy). */
  function leaderValve(vx, vy, size) { return leader(vx - 0.96, vy + 1.6, size); }
  /** Выноска у вертикального обратного клапана. Полка заводится СВЕРХУ:
   *  снизу у символа упор-скобка, и обычная выноска ложилась прямо на неё. */
  function leaderCheck(vx, vy, size) { return leader(vx - 0.96, vy - 2.6, size); }
  /** Выноска у фильтра с центром (fx,fy). */
  function leaderFilter(fx, fy, size) { return leader(fx - 0.96, fy - 1.77, size); }

  /** Гидравлический разделитель для схемы. (x,y) — центр корпуса 9×20. */
  function hydroSep(x, y, kw) {
    var w = 9, h = 20, o = [];
    o.push(rrect(x - w / 2, y - h / 2, w, h, 1, { c: '#000', w: LW.sym }));
    if (kw) {
      o.push(txt(x, y - 0.6, String(kw), { size: SZ.txt, anchor: 'middle' }));
      o.push(txt(x, y + 3.4, 'кВт', { size: SZ.txt, anchor: 'middle' }));
    }
    o.push(pline([[x, y - h / 2], [x, y - h / 2 - 1.5]]));
    o.push(airVent(x, y - h / 2 - 1.5));
    o.push(leader(x - 0.9, y - h / 2 - 5.5, '1/2"'));
    o.push(pline([[x, y + h / 2], [x, y + h / 2 + 1.2]]));
    o.push(ballValve(x, y + h / 2 + 3.7, true));
    o.push(leaderValve(x, y + h / 2 + 3.7, '1/2"'));
    o.push(pline([[x - 0.92, y + h / 2 + 7.05], [x + 0.92, y + h / 2 + 7.05]]));
    o.push(pline([[x - 0.92, y + h / 2 + 7.05], [x, y + h / 2 + 8.58]]));
    o.push(pline([[x + 0.92, y + h / 2 + 7.05], [x, y + h / 2 + 8.58]]));
    return o.join('');
  }

  /** Расширительный бак. (x,y) — точка подключения снизу.
   *  Корпус 15.2×21.7, все уровни сняты с бака «18 л.» листа ТМ-2. */
  function expTank(x, y, color, vol) {
    var o = [];
    var d = 'M' + n(x - 7.62) + ',' + n(y - 17.01) +
      ' L' + n(x - 7.62) + ',' + n(y - 4.1) +
      ' Q' + n(x - 7.5) + ',' + n(y - 2.9) + ' ' + n(x - 6.6) + ',' + n(y - 2.35) +
      ' L' + n(x - 3.15) + ',' + n(y - 0.51) +
      ' L' + n(x + 3.15) + ',' + n(y - 0.51) +
      ' L' + n(x + 6.6) + ',' + n(y - 2.35) +
      ' Q' + n(x + 7.5) + ',' + n(y - 2.9) + ' ' + n(x + 7.62) + ',' + n(y - 4.1) +
      ' L' + n(x + 7.62) + ',' + n(y - 17.01) +
      ' Q' + n(x + 7.6) + ',' + n(y - 18.5) + ' ' + n(x + 6.7) + ',' + n(y - 19.2) +
      ' Q' + n(x + 3.6) + ',' + n(y - 20.25) + ' ' + n(x) + ',' + n(y - 20.45) +
      ' Q' + n(x - 3.6) + ',' + n(y - 20.25) + ' ' + n(x - 6.7) + ',' + n(y - 19.2) +
      ' Q' + n(x - 7.6) + ',' + n(y - 18.5) + ' ' + n(x - 7.62) + ',' + n(y - 17.01) + ' Z';
    o.push(path(d, { f: color, c: '#000', w: LW.thin }));
    o.push(pline([[x - 1.67, y - 20.34], [x - 0.54, y - 21.73], [x + 0.54, y - 21.73], [x + 1.67, y - 20.34]],
      { f: GREY.body, c: '#000', w: LW.thin, close: true }));
    o.push(rrect(x - 3.76, y - 0.51, 7.52, 0.51, 0.25, { f: GREY.body, c: '#000', w: LW.thin }));
    if (vol) {
      o.push(txt(x, y - 11.17, vol, { size: SZ.txt, anchor: 'middle' }));
      o.push(pline([[x - 6.57, y - 10.33], [x + 6.57, y - 10.33]], { w: LW.thin }));
    }
    return o.join('');
  }

  /** Котёл (газовый/электрический). (x,y) — левый верхний угол корпуса.
   *  w — ширина корпуса: 33 как в эталоне, 27 — компактный блок каскада. */
  function boilerUnit(x, y, kind, w) {
    w = w || 33;
    var h = 58, o = [];
    if (kind === 'gas') o.push(rrect(x + w / 2 - 5, y - 5, 10, 6, 1.5, { f: GREY.body, c: GREY.edge, w: 0.6 }));
    else o.push(rrect(x + w / 2 - 3.5, y - 2.5, 7, 3.5, 1, { f: GREY.body, c: GREY.edge, w: 0.6 }));
    o.push(rrect(x, y, w, h, 2, { f: GREY.body, c: GREY.edge, w: 0.6 }));
    o.push(pline([[x, y + 2], [x + w, y + 2]], { c: GREY.edge, w: 0.6 }));
    o.push(txt(x + w / 2, y + 7.9, kind === 'gas' ? 'Газовый котёл' : 'Электрический котёл',
      kind === 'gas' ? { size: SZ.txt, anchor: 'middle' } : { size: SZ.txt, anchor: 'middle', fit: w - 4 }));
    var cx = x + w / 2, cy = y + 27;
    o.push(circle(cx, cy, 7.2, { f: GREY.icon }));
    if (kind === 'gas') {
      // язык пламени: острый хвост вверху, круглое основание, внутренний язычок
      o.push(path('M' + n(cx + 0.4) + ',' + n(cy - 4.8) +
        ' C' + n(cx + 0.6) + ',' + n(cy - 2.6) + ' ' + n(cx + 3.4) + ',' + n(cy - 1.6) + ' ' + n(cx + 3.4) + ',' + n(cy + 1.2) +
        ' C' + n(cx + 3.4) + ',' + n(cy + 3.5) + ' ' + n(cx + 1.9) + ',' + n(cy + 4.9) + ' ' + n(cx) + ',' + n(cy + 4.9) +
        ' C' + n(cx - 1.9) + ',' + n(cy + 4.9) + ' ' + n(cx - 3.4) + ',' + n(cy + 3.5) + ' ' + n(cx - 3.4) + ',' + n(cy + 1.2) +
        ' C' + n(cx - 3.4) + ',' + n(cy - 1.2) + ' ' + n(cx - 1.3) + ',' + n(cy - 2.2) + ' ' + n(cx - 1.9) + ',' + n(cy - 3.9) +
        ' C' + n(cx - 0.9) + ',' + n(cy - 3.6) + ' ' + n(cx - 0.1) + ',' + n(cy - 4) + ' ' + n(cx + 0.4) + ',' + n(cy - 4.8) + ' Z' +
        ' M' + n(cx) + ',' + n(cy + 3.6) +
        ' C' + n(cx + 1.1) + ',' + n(cy + 3.6) + ' ' + n(cx + 1.9) + ',' + n(cy + 2.7) + ' ' + n(cx + 1.9) + ',' + n(cy + 1.7) +
        ' C' + n(cx + 1.9) + ',' + n(cy + 0.9) + ' ' + n(cx + 1.3) + ',' + n(cy + 0.3) + ' ' + n(cx + 0.8) + ',' + n(cy - 0.3) +
        ' C' + n(cx + 0.5) + ',' + n(cy + 0.7) + ' ' + n(cx - 0.6) + ',' + n(cy + 1) + ' ' + n(cx - 1.1) + ',' + n(cy + 0.4) +
        ' C' + n(cx - 1.7) + ',' + n(cy + 1.1) + ' ' + n(cx - 1.9) + ',' + n(cy + 1.8) + ' ' + n(cx - 1.9) + ',' + n(cy + 2.2) +
        ' C' + n(cx - 1.9) + ',' + n(cy + 2.9) + ' ' + n(cx - 1) + ',' + n(cy + 3.6) + ' ' + n(cx) + ',' + n(cy + 3.6) + ' Z',
        { f: '#fff' }));
    } else {
      o.push(rrect(cx - 2.2, cy - 4.9, 1.15, 3.2, 0.55, { f: '#fff' }));
      o.push(rrect(cx + 1.05, cy - 4.9, 1.15, 3.2, 0.55, { f: '#fff' }));
      o.push(path('M' + n(cx - 3.1) + ',' + n(cy - 1.9) + ' L' + n(cx + 3.1) + ',' + n(cy - 1.9) +
        ' L' + n(cx + 3.1) + ',' + n(cy + 0.6) +
        ' Q' + n(cx + 3.1) + ',' + n(cy + 3.4) + ' ' + n(cx) + ',' + n(cy + 3.4) +
        ' Q' + n(cx - 3.1) + ',' + n(cy + 3.4) + ' ' + n(cx - 3.1) + ',' + n(cy + 0.6) + ' Z', { f: '#fff' }));
      o.push(rrect(cx - 0.55, cy + 3.4, 1.1, 1.9, 0.5, { f: '#fff' }));
    }
    o.push(rrect(x + w / 2 - 6, y + h - 11.5, 12, 4.5, 1.5, { f: '#fff', c: GREY.edge, w: 0.35 }));
    return o.join('');
  }

  /** Бойлер косвенного нагрева. (x,y) — левый верхний угол корпуса.
   *  Напольный 52×84; настенный вариант — тот же рисунок компактнее. */
  function indirectTank(x, y, w, h) {
    var o = [];
    o.push(rrect(x, y, w, h, 5, { f: GREY.body, c: GREY.edge, w: 0.6 }));
    o.push(txt(x + w / 2, y + 6.4, 'Бойлер косвенного нагрева', { size: SZ.txt, anchor: 'middle', fit: w - 3 }));
    var cy = y + h * 0.42, R = Math.min(19, h * 0.26);
    o.push(path('M' + n(x) + ',' + n(cy - R) + ' A' + n(R) + ',' + n(R) + ' 0 0 1 ' + n(x) + ',' + n(cy + R) + ' Z', { f: '#fff' }));
    var loops = h > 70 ? 7 : 5;
    for (var i = 0; i < loops; i++) {
      var t = i / (loops - 1);
      var yy = cy - R + 3.2 + t * (2 * R - 6.4);
      var half = Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy))) - 1.6;
      var col = t < 0.5 ? COL.loadS : COL.loadR;
      o.push('<line x1="' + n(x + 0.8) + '" y1="' + n(yy) + '" x2="' + n(x + 0.8 + Math.max(4, half)) + '" y2="' + n(yy) +
        '" style="stroke:' + col + ';stroke-width:2;opacity:' + n(0.55 + 0.45 * Math.abs(1 - 2 * t)) + '" stroke-linecap="round"/>');
    }
    o.push(circle(x + w * 0.62, y + h * 0.42, 3.2, { f: '#555' }));
    o.push(circle(x + w * 0.5, y + h * 0.78, 4.6, { f: '#555' }));
    return o.join('');
  }

  /** Цветной патрубок-пилюля на кромке бойлера + марка. */
  function tankPort(x, y, color, mark) {
    return rrect(x - 1.5, y - 1.5, 3, 3, 1.5, { f: color, c: '#000', w: LW.thin }) +
      (mark ? txt(x + 2.6, y + 1.25, mark, { size: SZ.txt }) : '');
  }

  /** Стрелка-«ласточкин хвост» на трубе. (x,y) — остриё. dir: 'down'|'up'. */
  function arrowSym(x, y, dir) {
    var s = dir === 'up' ? -1 : 1;
    return pline([[x, y], [x - 1.08, y - s * 3.14], [x, y - s * 2.68], [x + 1.08, y - s * 3.14]],
      { f: GREY.body, c: '#000', w: LW.sym, close: true });
  }

  /** Контурный наконечник на горизонтальной линии. dir — куда показывает. */
  function openArrow(x, y, dir, color) {
    var s = dir === 'left' ? -1 : 1;
    return pline([[x - s * 2.6, y - 1], [x, y]], { c: color, w: LW.pipe }) +
      pline([[x - s * 2.6, y + 1], [x, y]], { c: color, w: LW.pipe });
  }

  /** Торцевой штрих на конце линии (3 мм поперёк). */
  function tick(x, y, vert, color) {
    return vert ? ln(x - 1.5, y, x + 1.5, y, { c: color, w: LW.pipe })
      : ln(x, y - 1.5, x, y + 1.5, { c: color, w: LW.pipe });
  }

  /** Подпись диаметра вдоль вертикальной трубы (низ текста в (x-1, y)). */
  function diaV(x, y, dia) {
    return txt(x - 1, y, dia, { size: SZ.dia, rotate: -90 });
  }
  /** Подпись диаметра над горизонтальной трубой, у правого конца. */
  function diaH(xRight, y, dia) {
    return txt(xRight - 10.6, y - 0.7, dia, { size: SZ.dia });
  }

  /** Низ отвода после крана: чёрная линия-указатель, марка, стрелка.
   *  Геометрия обмерена: стрелка «вверх» — остриё 262.28 под краном,
   *  линия от хвоста до 274; «вниз» — линия от 262.28, остриё на 274. */
  function bottomMark(x, mark, dir) {
    var o = [];
    if (dir === 'up') {
      o.push(ln(x, 264.96, x, 274.0, { w: LW.pipe }));
      o.push(arrowSym(x, 262.28, 'up'));
    } else {
      o.push(ln(x, 262.28, x, 271.31, { w: LW.pipe }));
      o.push(arrowSym(x, 274.0, 'down'));
    }
    o.push(txt(x - 2, 270.2, mark, { size: SZ.txt, rotate: -90 }));
    return o.join('');
  }

  /** Вертикальная труба с обходами-полукругами (r 2, выпуклость вправо)
   *  на пересечениях с горизонталями crossYs (соединения не обходятся). */
  function vpipe(x, y0, y1, color, crossYs) {
    if (y1 < y0) { var t = y0; y0 = y1; y1 = t; }
    var ys = (crossYs || []).filter(function (cy) { return cy > y0 + 2 && cy < y1 - 2; })
      .sort(function (a, b) { return a - b; });
    var d = 'M' + n(x) + ',' + n(y0);
    ys.forEach(function (cy) {
      d += ' L' + n(x) + ',' + n(cy - 2) + ' A2,2 0 0 1 ' + n(x) + ',' + n(cy + 2);
    });
    d += ' L' + n(x) + ',' + n(y1);
    return path(d, { c: color, w: LW.pipe });
  }

  function hpipe(x0, x1, y, color) {
    return ln(x0, y, x1, y, { c: color, w: LW.pipe });
  }

  // ─── Таблица «Условные графические обозначения» ────────────────────────
  // Легенда фильтруется по составу конкретной схемы: символ, которого на
  // листе нет, в таблицу не попадает (раньше монтажник искал на схеме
  // термометры и группу безопасности, которых там не было никогда).
  // Высота рамки от этого плавает — низ считается по факту.
  function legendTable(cfg) {
    cfg = cfg || {};
    var L = 25.07, R = 127.65, S = 39.07, top = 12.35, o = [];
    var cx = (L + S) / 2, tx = (S + R) / 2;
    var twoC = !!(cfg.gas && cfg.gas.circuits === 2 && !cfg.indirect);
    var nBoilers = (cfg.gas ? Math.max(1, cfg.gas.count || 1) : 0) +
      (cfg.el ? Math.max(1, cfg.el.count || 1) : 0);
    var usePump = !!(cfg.tp || cfg.hydro || cfg.recirc || cfg.loadPump || (cfg.el && cfg.el.polis));
    var useCheck = !!(nBoilers > 1 || cfg.indirect || cfg.tp || cfg.hydro || cfg.recirc);

    // При автоматике узел ТП ведёт контроллер: смеситель с сервоприводом
    // вместо термостатического, плюс на схеме появляются датчики NTC
    var mixServo = !!(cfg.auto && cfg.auto.mixServo);
    var rows = [
      ['Шаровый кран', function (c) { return ballValve(cx, c, false); }, true],
      ['Обратный клапан', function (c) { return checkValve(cx, c, 'right'); }, useCheck],
      ['Циркуляционный насос', function (c) { return pump(cx, c, 'left'); }, usePump],
      ['Термостатический смесительный клапан', function (c) { return valve3(cx + 1.21, c, 'therm', 'udr', 'l'); }, !!cfg.tp && !mixServo],
      ['Клапан трехходовой с сервоприводом', function (c) { return valve3(cx + 1.21, c, 'servo', 'udr', 'l'); }, !!cfg.tp && mixServo],
      ['Предохранительный клапан', function (c) { return safetyValve(cx, c, false); }, !!cfg.indirect && cfg.water !== false],
      ['Автоматический воздухоотводчик', function (c) { return airVent(cx, c + 3.77); }, !!cfg.hydro],
      ['Фильтр', function (c) { return filterSym(cx, c); }, true],
      ['Клапан приоритета бойлера', function (c) { return valve3(cx + 1.21, c, 'prio', 'udr', 'l'); }, !!cfg.fugas],
      ['Датчик температуры NTC (в гильзе)', function (c) { return gauge(cx, c, 'Т'); }, !!cfg.auto]
    ].filter(function (r) { return r[2]; });

    var marks = [
      ['Т1', 'Подача радиаторного отопления', cfg.rad !== false],
      ['Т2', 'Обратка радиаторного отопления', cfg.rad !== false],
      ['Т11', 'Подача напольного отопления', !!cfg.tp],
      ['Т21', 'Обратка напольного отопления', !!cfg.tp],
      ['В1', 'Холодное водоснабжение', twoC || !!cfg.water || !!cfg.indirect],
      ['Т3', 'Горячее водоснабжение', twoC || !!cfg.indirect],
      ['Т4', 'Рециркуляция горячего водоснабжения', !!cfg.recirc]
    ].filter(function (m) { return m[2]; });

    var bottom = 22.35 + rows.length * 10 + (cfg.hydro ? 40 : 0) + marks.length * 6;
    o.push(pline([[L, top], [R, top], [R, bottom], [L, bottom], [L, top]]));
    o.push(ln(S, 22.35, S, bottom));
    o.push(txt((L + R) / 2, 19.05, 'Условные графические обозначения', { size: SZ.head, anchor: 'middle' }));
    o.push(ln(L, 22.35, R, 22.35));

    var y = 22.35;
    rows.forEach(function (r) {
      var y1 = y + 10, c = (y + y1) / 2;
      o.push(r[1](c));
      o.push(txt(tx, c + SZ.txt * 0.35, r[0], { size: SZ.txt, anchor: 'middle' }));
      o.push(ln(L, y1, R, y1));
      y = y1;
    });

    // гидравлический разделитель — ячейка 40 мм, символ по обмеру легенды
    if (cfg.hydro) {
      var hy0 = y, hy1 = y + 40;
      var bx = cx, bw = 8.3, bt = hy0 + 11.3, bb = hy1 - 12.7;
      o.push(airVent(bx, bt - 1.37));
      o.push(pline([[bx - 1.31, bt - 1.37], [bx - 1.31, bt]]));
      o.push(pline([[bx + 1.3, bt - 1.37], [bx + 1.3, bt]]));
      o.push(rrect(bx - bw / 2, bt, bw, bb - bt, 0.4, { c: '#000', w: LW.sym }));
      o.push(pline([[bx - 1.31, bb], [bx - 1.31, bb + 1.37]]));
      o.push(pline([[bx + 1.3, bb], [bx + 1.3, bb + 1.37]]));
      o.push(pline([[bx - 1.31, bb + 1.37], [bx + 1.3, bb + 1.37]]));
      o.push(pline([[bx, bb + 1.37], [bx, bb + 2.57]]));
      o.push(ballValve(bx, bb + 5.07, true));
      o.push(pline([[bx - 0.92, bb + 8.61], [bx + 0.92, bb + 8.61]]));
      o.push(pline([[bx - 0.92, bb + 8.61], [bx, bb + 10.14]]));
      o.push(pline([[bx + 0.92, bb + 8.61], [bx, bb + 10.14]]));
      o.push(txt(tx, (hy0 + hy1) / 2 + SZ.txt * 0.35, 'Гидравлический разделитель', { size: SZ.txt, anchor: 'middle' }));
      o.push(ln(L, hy1, R, hy1));
      y = hy1;
    }

    marks.forEach(function (m) {
      var y1 = y + 6, c = (y + y1) / 2 + SZ.txt * 0.35;
      o.push(txt(cx, c, m[0], { size: SZ.txt, anchor: 'middle' }));
      o.push(txt(tx, c, m[1], { size: SZ.txt, anchor: 'middle' }));
      o.push(ln(L, y1, R, y1));
      y = y1;
    });
    return o.join('');
  }

  // ─── Легенда трубопроводов (низ листа, по составу схемы) ───────────────
  function pipeLegend(cfg) {
    cfg = cfg || {};
    var o = [];
    var twoC = !!(cfg.gas && cfg.gas.circuits === 2 && !cfg.indirect);
    o.push(txt(56.3, 253.1, 'Условные обозначения трубопроводов', { size: SZ.head }));
    var rows = [
      [COL.ret, 'обратный трубопровод', true],
      [COL.supply, 'подающий трубопровод', true],
      [COL.loadR, 'обратный трубопровод загрузки бойлера', !!cfg.indirect],
      [COL.loadS, 'подающий трубопровод загрузки бойлера', !!cfg.indirect],
      [COL.dhw, 'трубопровод горячего водоснабжения', twoC || !!cfg.indirect],
      [COL.recirc, 'трубопровод рециркуляции горячего водоснабжения', !!cfg.recirc],
      [COL.cold, 'трубопровод холодного водоснабжения', twoC || !!cfg.water || !!cfg.indirect]
    ].filter(function (r) { return r[2]; });
    rows.forEach(function (r, i) {
      var y = 258.4 + i * 5;
      o.push(ln(28.2, y, 78.2, y, { c: r[0], w: LW.sample }));
      o.push(txt(84.7, y + 1.25, '-', { size: SZ.txt }));
      o.push(txt(87.7, y + 1.25, r[1], { size: SZ.txt }));
    });
    return o.join('');
  }

  // ─── Композитор ────────────────────────────────────────────────────────
  /**
   * cfg: { gas: {circuits}|null, el: {}|null, indirect: {vol}|null,
   *        fugas, loadPump, rad, tp, hydro: {kw}|null, water, recirc,
   *        tankHeating: литры|0, tankDhw: литры|0, dia: 'Ø25х3,5 мм' }
   */
  function build(cfg) {
    cfg = cfg || {};
    // Контракт: клапан приоритета и насосная загрузка взаимоисключающие.
    // buildSchemeConfig оба флага из одного поля не выдаёт, но build() —
    // публичный, и при обоих true рисовались бы два разных узла сразу.
    if (cfg.fugas && cfg.loadPump) {
      cfg = { gas: cfg.gas, el: cfg.el, indirect: cfg.indirect, fugas: true, loadPump: false, rad: cfg.rad, tp: cfg.tp, hydro: cfg.hydro, water: cfg.water, recirc: cfg.recirc, tankHeating: cfg.tankHeating, tankDhw: cfg.tankDhw, dia: cfg.dia, sanDia: cfg.sanDia, recDia: cfg.recDia };
    }
    var o = [], dia = cfg.dia || 'Ø25х3,5 мм';
    // Санитарные линии (ГВС/ХВС) и рециркуляция — со своими диаметрами:
    // раньше на них ставился диаметр котловой магистрали, и рециркуляция
    // выходила «Ø40х5,5» при арматуре 1/2".
    var sanDia = cfg.sanDia || 'Ø22х1,2 мм';
    var recDia = cfg.recDia || 'Ø15х1,0 мм';
    // Резьба арматуры котлового контура и линий загрузки бойлера: 3/4" до
    // 30 кВт, 1" выше — тот же порог, по которому смета берёт переходники к
    // патрубкам котла и змеевика. Санитарные линии (В1/Т3/Т4) идут своими
    // размерами, к мощности котельной они не привязаны.
    var mainThread = cfg.mainThread || '3/4"';
    // Патрубки бойлера из его паспорта (cfg.tankPorts): змеевик, ГВС, ХВС,
    // рециркуляция, отдельный патрубок предохранительного клапана. У разных
    // серий они разные — арматуру у бака подписываем ими, а не размером
    // котловой магистрали. Без паспорта остаются прежние значения по умолчанию.
    var TP = cfg.tankPorts || {};
    var coilThread = TP.coil || mainThread;      // Т1/Т2 змеевика
    var dhwThread = TP.dhw || '3/4"';            // Т3 горячая вода
    var coldThread = TP.cold || '3/4"';          // В1 холодная вода
    var recircThread = TP.recirc || '1/2"';      // Т4 рециркуляция
    var safetyThread = TP.safety || '1/2"';      // предохранительный клапан
    var hasLoad = !!cfg.indirect;
    // Группа загрузки на коллекторе (насосная схема + гидрострелка) смотрит
    // ВНИЗ, как остальные группы: линии загрузки идут нижним полем листа,
    // а не поверху. Верхние линии загрузки остаются у фугаса и у узла на
    // магистрали без гидрострелки.
    var loadDown = hasLoad && !!cfg.loadPump && !!cfg.hydro;
    // уровни патрубков змеевика нужны раньше самого бойлера: по ним делают
    // обходы стояки, которые рисуются до него
    var wallT = !!(cfg.indirect && cfg.indirect.wall);
    var tYe = wallT ? 78 : 92, tHe = wallT ? 56 : 84;
    var pT1e = cfg.indirect ? tYe + tHe * 0.321 : 0;
    var pT2e = cfg.indirect ? tYe + tHe * 0.69 : 0;
    // Полосы линий загрузки под кранами отводов. Просвет между ними — тот же
    // шаг 9 мм, что между подачей и обраткой самой насосной группы.
    // Порядок полос обратный порядку стояков (левый стояк — дальняя полоса,
    // правый — ближняя), тогда спуски и подъёмы не пересекаются в принципе.
    var laneR = 272, laneS = 263;
    var twoCirc = !!(cfg.gas && cfg.gas.circuits === 2 && !hasLoad);

    // ── отводы коллектора и раскладка их полосы ────────────────────────────
    // Отводов столько, сколько насосных групп в спецификации (cfg.radGroups /
    // cfg.tpGroups). Контур без группы (местный узел подмеса, прямая обвязка
    // от котла) — один отвод, как раньше. Каждая группа занимает ПАРУ соседних
    // стояков «обратка + подача»: смесительной иначе некуда вести перемычку
    // подмеса, а по разнесённым Т2…Т1 не понять, какая пара чья.
    // Резьба арматуры — по DN самой группы: 3/4" у DN20, 1" у DN25, 1 1/4" у DN32.
    // Считается ДО раскладки котлов: при большом числе групп блоки котлов
    // сдвигаются влево, освобождая полосе место.
    var DN_THREAD = { 20: '3/4"', 25: '1"', 32: '1 1/4"' };
    function thread(dn) { return DN_THREAD[dn] || '3/4"'; }
    var radN = (cfg.rad !== false) ? Math.max(1, cfg.radGroups || 1) : 0;
    var tpN = cfg.tp ? Math.max(1, cfg.tpGroups || 1) : 0;
    // Номер в марке появляется только когда контуров больше одного: на схеме с
    // единственным контуром «Т1.1» читается как ошибка.
    function mk(base, i, n) { return n > 1 ? base + '.' + (i + 1) : base; }
    var taps = [];
    for (var ri = 0; ri < radN; ri++) {
      taps.push({ mark: mk('Т2', ri, radN), color: COL.ret, from: 'ret', dir: 'up', size: thread(cfg.radDn) });
      taps.push({ mark: mk('Т1', ri, radN), color: COL.supply, from: 'supply', dir: 'down', group: !!cfg.hydro, size: thread(cfg.radDn) });
    }
    var tpFrom = taps.length;
    for (var ti = 0; ti < tpN; ti++) {
      taps.push({ mark: mk('Т21', ti, tpN), color: COL.ret, from: 'ret', dir: 'up', mix: true, size: thread(cfg.tpDn) });
      taps.push({ mark: mk('Т11', ti, tpN), color: COL.supply, from: 'supply', dir: 'down', pump: true, size: thread(cfg.tpDn) });
    }
    // Группа загрузки бойлера — такой же отвод коллектора, как остальные:
    // тот же шаг, те же уровни арматуры. Отличие одно — внизу она не идёт
    // к потребителю с маркой, а уходит полосой к змеевику бойлера.
    if (loadDown) {
      taps.push({ color: COL.loadR, from: 'ret', load: 'ret', size: thread(cfg.loadDn) });
      taps.push({ color: COL.loadS, from: 'supply', load: 'sup', size: thread(cfg.loadDn) });
    }
    if (twoCirc) {
      taps.push({ mark: 'В1', color: COL.cold, from: 'cold', dir: 'up' });
      taps.push({ mark: 'Т3', color: COL.dhw, from: 'dhw', dir: 'down' });
    }

    // Полоса отводов зажата между котлами слева и гидрострелкой справа: за её
    // правым концом встаёт стояк подачи загрузки (hydroX−17.5), сама стрелка и
    // канал стояков бойлера. При нижней разводке загрузки канал занят обраткой
    // змеевика — предел жёстче. Штатный шаг 9 мм снят с листа ТМ-2; ужимаем его
    // и сдвигаем котлы влево только когда групп больше, чем влезает.
    var TAP_X0_BASE = 235.13, TAP_STEP_BASE = 9;
    // Куда полоса может уехать ВЛЕВО.
    //   • С гидрострелкой отводы отходят от вторичной пары (y 161/173), а стояки
    //     котлов заканчиваются на котловой гребёнке (y ≤ 150) — под котлами полоса
    //     проходит свободно. Ограничивает её только легенда трубопроводов в левом
    //     нижнем углу: её подписи кончаются около x = 170, берём запас до 190.
    //   • Без стрелки отводы идут от самой котловой гребёнки, вровень со стояками
    //     котлов, — там полоса обязана начинаться правее блоков, и место под неё
    //     освобождается сдвигом самих блоков (не больше 14 мм: левее таблица УГО).
    var TAP_X0_MIN = cfg.hydro ? 190 : 221.1;
    var TAP_STEP_MIN = 6.2;   // насос Ø5.84 мм + просвет: плотнее символы сливаются
    // Правый предел полосы. Полоса тянет за собой гидрострелку (hydroX =
    // tapsEnd+24), а за ней — весь правый край листа, и там два узких места:
    //   • стояк обратки стрелки (xu = hydroX+16.5) против стояка обратки
    //     загрузки бойлера (upR = tX−35.5 = 326) — при нижней разводке;
    //   • стояк расширительного бака отопления (mRight+12) против линии подачи
    //     загрузки к змеевику (lx1 = tX−22 = 339.5) — при клапане Fugas.
    // Оба сходятся на tapsEnd ≈ 280: там просветы те же 5–6 мм, что на штатной
    // схеме с тремя парами отводов. Дальше стояки сливаются в один.
    var TAP_RIGHT = 280.1;
    var tapX0 = TAP_X0_BASE, tapStep = TAP_STEP_BASE, tpDrawn = tpN;
    if (taps.length > 1 && tapX0 + tapStep * (taps.length - 1) > TAP_RIGHT) {
      // Сначала РАСШИРЯЕМСЯ ВЛЕВО, штатный шаг 9 мм не трогаем: сжатая полоса
      // читается хуже, а слева место есть. Ужимаем шаг только когда влево
      // уходить уже некуда.
      var need = tapStep * (taps.length - 1);
      tapX0 = Math.max(TAP_X0_MIN, TAP_RIGHT - need);
      if (tapX0 + need > TAP_RIGHT) {
        tapStep = Math.min(TAP_STEP_BASE, (TAP_RIGHT - tapX0) / (taps.length - 1));
      }
      if (tapStep < TAP_STEP_MIN) {
        // Не помещается даже в минимальный шаг. Снимаем с картинки лишние
        // ОДИНАКОВЫЕ пары ТП и дописываем их реальное число к последней паре
        // («× N шт.») — так же, как усечённый каскад котлов. Молча терять
        // контуры нельзя: по такой схеме соберут не то.
        tapStep = TAP_STEP_MIN;
        var fit = Math.floor((TAP_RIGHT - tapX0) / tapStep) + 1;
        while (taps.length > fit && tpDrawn > 1) {
          taps.splice(tpFrom + (tpDrawn - 1) * 2, 2);
          tpDrawn--;
        }
        // Нумерацию оставшихся пар сохраняем: две одинаковые безномерные пары
        // читались бы как «контуров два», а подпись «× N шт.» у последней прямо
        // говорит, сколько их на самом деле.
        if (tpDrawn < tpN) {
          var lastTp = taps[tpFrom + (tpDrawn - 1) * 2 + 1];
          if (lastTp) lastTp.note = '× ' + tpN + ' шт.';
        }
      }
    }
    // На сколько уезжают влево блоки котлов, чтобы не перекрыть полосу. При
    // гидрострелке полоса проходит НИЖЕ их стояков — двигать котлы не нужно.
    var boilerShift = cfg.hydro ? 0 : (TAP_X0_BASE - tapX0);

    // Блоки котлов: каскад одинаковых рисуется отдельными блоками, но не
    // больше трёх — левее гребёнке некуда, там таблица УГО. При трёх блоках
    // корпуса компактные (27), кроме блока-носителя ГВС/загрузки (33).
    var blocks = [];
    var gasCount = cfg.gas ? Math.max(1, cfg.gas.count || 1) : 0;
    var elCount = cfg.el ? Math.max(1, cfg.el.count || 1) : 0;
    for (var gi = 0; gi < gasCount; gi++) blocks.push({ kind: 'gas' });
    for (var ei = 0; ei < elCount; ei++) blocks.push({ kind: 'el' });
    if (!blocks.length) blocks.push({ kind: 'el' });
    if (blocks.length > 3) {
      // Усечение каскада: раньше резался хвост массива, и при трёх газовых
      // электрокотёл пропадал со схемы целиком — вместе со своим узлом
      // загрузки. Теперь каждый присутствующий тип сохраняет хотя бы один
      // блок, а усечённое количество дописывается на корпус («× N шт.»).
      var hadEl = elCount > 0;
      blocks.length = 3;
      if (hadEl && !blocks.some(function (b) { return b.kind === 'el'; })) blocks[2] = { kind: 'el' };
    }
    var drawnGas = blocks.filter(function (b) { return b.kind === 'gas'; }).length;
    var drawnEl = blocks.filter(function (b) { return b.kind === 'el'; }).length;
    var multi = blocks.length > 1;
    var carrierIdx = 0;
    for (var ci = 0; ci < blocks.length; ci++) {
      if (blocks[ci].kind === 'gas') { carrierIdx = ci; break; }
    }
    // Пара загрузочных стояков (b.load) — у каких блоков рисуется узел
    // загрузки бойлера. Смета ставит клапан Fugas на КАЖДЫЙ ТИП котла
    // (газовый и электрический, кроме POLIS — у него нет автоматики под
    // клапан), а насосную группу загрузки — одну на систему. Схема обязана
    // совпадать со спецификацией, иначе по ней соберут не то.
    var polis = !!(cfg.el && cfg.el.polis);
    var seenKind = {};
    blocks.forEach(function (b, i) {
      var first = !seenKind[b.kind]; seenKind[b.kind] = true;
      // При насосной группе загрузки узел у котла не рисуется вовсе — группа
      // стоит на общей магистрали (см. блок после гребёнки). Врезка в стояк
      // одного газового котла читалась как «бойлер грузит только газовый».
      b.load = hasLoad && cfg.fugas && first && (b.kind === 'gas' || !polis);
      b.carrier = (i === carrierIdx) && twoCirc;
    });
    // POLIS — единственный источник, а бойлер есть: узел загрузки в смете
    // отсутствует (ГВС обычно держит газовый котёл). Рисуем голые стояки
    // загрузки от котла, без клапана — иначе змеевик бойлера повис бы в
    // воздухе. Сам клапан у POLIS не рисуется никогда (см. отрисовку узла).
    if (hasLoad && !cfg.loadPump && !blocks.some(function (b) { return b.load; })) blocks[carrierIdx].load = true;
    blocks.forEach(function (b) {
      // Широкая раскладка (3 стояка и больше) — у носителя ГВС-пары
      // двухконтурного и у блоков с узлом загрузки. При трёх блоках широкий
      // корпус ужимается до 29 с шагом стояков 8: раскладка [33,27,33]
      // уводила гребёнку влево до 121.8 — внутрь таблицы УГО (её правый
      // край 127.65). С [29,27,29] левый торец гребёнки — 129.8.
      b.wide = b.carrier || b.load;
      b.step = (blocks.length === 3 && b.wide) ? 8 : 9;
      b.w = blocks.length === 3 ? (b.wide ? 29 : 27) : 33;
    });

    o.push(legendTable(cfg));
    o.push(pipeLegend(cfg));
    o.push(txt(252.2, 17.4, 'Принципиальная схема', { size: SZ.title }));

    // Датчик уличной температуры (погодозависимое регулирование) — вне
    // гидравлики, в правом верхнем углу листа
    if (cfg.auto) {
      o.push(gauge(401, 25.5, 'Т'));
      o.push(txt(401, 32.6, 'улица', { size: SZ.dia, anchor: 'middle' }));
    }

    // Примечание о подпитке — на листах без линии ХВС (нет ни двухконтурного
    // котла, ни бойлера с вводом воды). Узел подпитки сметой не подбирается,
    // а без него систему нечем заполнить — монтажник должен видеть текстом,
    // откуда брать воду (замечание из ревью: «по этой схеме систему
    // физически нечем заполнить»).
    if (!twoCirc && !cfg.indirect) {
      o.push(txt(302, 246, 'Примечание: заполнение и подпитка системы отопления —', { size: SZ.txt }));
      o.push(txt(302, 251, 'от ввода ХВС через шаровый кран 1/2" с обратным клапаном.', { size: SZ.txt }));
      o.push(txt(302, 256, 'Узел подпитки на схеме условно не показан.', { size: SZ.txt }));
    }

    // гребёнка котлового контура: подача 126.04, ниже с шагом 6 (обмер ТМ-2)
    var mY = { supply: 126.04, ret: 132.04 };
    var rows = 2;
    if (hasLoad) { mY.loadS = 126.04 + rows * 6; mY.loadR = 126.04 + rows * 6 + 6; rows += 2; }
    if (twoCirc) { mY.dhw = 126.04 + rows * 6; mY.cold = 126.04 + rows * 6 + 6; rows += 2; }
    var allYs = Object.keys(mY).map(function (k) { return mY[k]; });
    function others(y) { return allYs.filter(function (v) { return v !== y; }); }

    // раскладка блоков справа налево: правый край последнего блока — 226.9,
    // как у одиночного котла эталона; при трёх блоках зазор ужат, чтобы
    // гребёнка не налезла на таблицу УГО (её правый край — 127.65)
    var bTop = 18.9, bBot = bTop + 58;
    var gap = blocks.length === 3 ? 2.5 : 10;
    var bXs = new Array(blocks.length);
    // Правый край последнего блока уезжает влево ровно на столько, на сколько
    // сдвинулось начало полосы отводов (см. boilerShift): иначе первый стояк
    // группы лёг бы на корпус котла.
    var edge = 226.9 - boilerShift;
    for (var k = blocks.length - 1; k >= 0; k--) {
      bXs[k] = edge - blocks[k].w;
      edge = bXs[k] - gap;
    }
    var mLeft = bXs[0] - 7.1;

    // стрелки и Ø на стояках — в одной полосе, как в эталоне
    var stemArrowDown = mY.supply - 5.15, stemArrowUp = mY.supply - 8.29;
    var stemDiaY = mY.supply - 10.6;

    // Левые границы линий загрузки: подача начинается на стояке первого
    // узла загрузки, обратка — на перемычке в общую обратку у левого торца
    var loadSx = null;
    var firstElIdx = -1;
    for (var fe = 0; fe < blocks.length; fe++) {
      if (blocks[fe].kind === 'el') { firstElIdx = fe; break; }
    }

    blocks.forEach(function (b, bi) {
      var kind = b.kind, bx = bXs[bi], st = b.step;
      o.push(boilerUnit(bx, bTop, kind, b.w));
      // Каскад больше трёх блоков усечён — дописываем реальное количество
      if (kind === 'gas' && gasCount > drawnGas && bi === carrierIdx)
        o.push(txt(bx + b.w / 2, bTop + 12.3, '× ' + gasCount + ' шт.', { size: SZ.txt, anchor: 'middle' }));
      if (kind === 'el' && elCount > drawnEl && bi === firstElIdx)
        o.push(txt(bx + b.w / 2, bTop + 12.3, '× ' + elCount + ' шт.', { size: SZ.txt, anchor: 'middle' }));

      // Раскладка стояков. У котла ДВА гидравлических патрубка (подача и
      // обратка) — узел загрузки бойлера больше не рисуется отдельной парой
      // патрубков из корпуса (по такой картинке узел собирали бы четырьмя
      // врезками в котёл). Носитель ГВС двухконтурного — исключение: у него
      // патрубков действительно четыре (О+ГВС).
      var xs, xRet, xls = null, xg = null, xc = null;
      if (b.carrier) { xs = bx + 3.03; xg = xs + st; xc = xs + 2 * st; xRet = xs + 3 * st; }
      else if (b.load) { xs = bx + (b.w - 2 * st) / 2; xls = xs + st; xRet = xs + 2 * st; }
      else { xs = bx + (b.w - 9) / 2; xRet = xs + 9; }
      if (xls !== null && (loadSx === null || xls < loadSx)) loadSx = xls;

      // POLIS — единственный электрокотёл без встроенного насоса: котловой контур
      // собирается на группе быстрого монтажа (насос на подаче + краны 1" с
      // термометрами). Подписываем её выноской у насоса.
      var isPolis = (kind === 'el' && cfg.el && cfg.el.polis);
      // POLIS присоединяется 1" независимо от мощности котельной — это его
      // собственные патрубки, а не сечение магистрали.
      var portSize = isPolis ? '1"' : mainThread;

      // подача: кран → [насос ГБМ] → [Fugas или тройник загрузки] →
      // [обратный клапан при каскаде] → гребёнка
      o.push(ln(xs, bBot, xs, bBot + 2.53, { c: COL.supply, w: LW.pipe }));
      o.push(ballValve(xs, bBot + 5.03, true));
      o.push(leaderValve(xs, bBot + 5.03, portSize));
      var ys = bBot + 7.53;
      if (isPolis) {
        o.push(ln(xs, ys, xs, ys + 1.6, { c: COL.supply, w: LW.pipe }));
        o.push(pump(xs, ys + 4.52, 'down'));
        ys += 7.44;
        if (cfg.el.gbm) o.push(leader(xs - 3.4, bBot + 13.1, 'ГБМ'));
      }
      if (b.load) {
        var drawFugas = cfg.fugas && !(kind === 'el' && polis);
        if (drawFugas) {
          // Клапан приоритета — В РАЗРЫВ подачи котла: вход сверху от котла,
          // прямой ход вниз в отопление, боковой отвод вправо на линию
          // загрузки. Раньше клапан висел на параллельном стояке, и подача
          // отопления шунтировала его — приоритет ГВС не обеспечивался.
          o.push(ln(xs, ys, xs, ys + 1.6, { c: COL.supply, w: LW.pipe }));
          o.push(valve3(xs, ys + 4.1, 'prio', 'udr', 'l'));
          o.push(hpipe(xs + 2.5, xls, ys + 4.1, COL.loadS));
          o.push(vpipe(xls, ys + 4.1, mY.loadS, COL.loadS, [mY.supply, mY.ret]));
          ys += 6.6;
        } else {
          // Насосная группа загрузки — на тройнике от подачи после крана
          // котла: кран → насос → обратный клапан (без него стоящий насос
          // даёт паразитную циркуляцию через змеевик). Без насоса (прямая
          // ветка) — только кран.
          var yTee = ys + 1.4;
          o.push(ln(xs, ys, xs, ys + 2.8, { c: COL.supply, w: LW.pipe }));
          o.push(hpipe(xs, xls, yTee, COL.loadS));
          o.push(ln(xls, yTee, xls, yTee + 1.2, { c: COL.loadS, w: LW.pipe }));
          o.push(ballValve(xls, yTee + 3.7, true));
          o.push(leaderValve(xls, yTee + 3.7, mainThread));
          if (cfg.loadPump) {
            o.push(ln(xls, yTee + 6.2, xls, yTee + 7.8, { c: COL.loadS, w: LW.pipe }));
            o.push(pump(xls, yTee + 10.72, 'down'));
            o.push(ln(xls, yTee + 13.64, xls, yTee + 15.2, { c: COL.loadS, w: LW.pipe }));
            o.push(checkValve(xls, yTee + 17.7, 'down'));
            o.push(vpipe(xls, yTee + 20.2, mY.loadS, COL.loadS, [mY.supply, mY.ret]));
          } else {
            o.push(vpipe(xls, yTee + 6.2, mY.loadS, COL.loadS, [mY.supply, mY.ret]));
          }
          ys += 2.8;
        }
        o.push(diaV(xls, stemDiaY, dia));
        o.push(arrowSym(xls, stemArrowDown, 'down'));
      }
      if (multi) {
        o.push(ln(xs, ys, xs, ys + 1.5, { c: COL.supply, w: LW.pipe }));
        o.push(checkValve(xs, ys + 4, 'down'));
        ys += 6.5;
      }
      o.push(vpipe(xs, ys, mY.supply, COL.supply, others(mY.supply)));
      o.push(diaV(xs, stemDiaY, dia));
      o.push(arrowSym(xs, stemArrowDown, 'down'));

      // обратка: кран + фильтр + кран. Обратный клапан каскада стоит на
      // подаче — дублировать его на обратке незачем (одного разрыва кольца
      // достаточно, лишний клапан — лишнее сопротивление).
      o.push(ln(xRet, bBot, xRet, bBot + 2.53, { c: COL.ret, w: LW.pipe }));
      o.push(ballValve(xRet, bBot + 5.03, true));
      o.push(leaderValve(xRet, bBot + 5.03, portSize));
      o.push(ln(xRet, bBot + 7.53, xRet, bBot + 9.6, { c: COL.ret, w: LW.pipe }));
      o.push(filterSym(xRet, bBot + 13.14));
      o.push(leaderFilter(xRet, bBot + 13.14, mainThread));
      o.push(ln(xRet, bBot + 16.67, xRet, bBot + 18.74, { c: COL.ret, w: LW.pipe }));
      o.push(ballValve(xRet, bBot + 21.24, true));
      o.push(leaderValve(xRet, bBot + 21.24, mainThread));
      o.push(vpipe(xRet, bBot + 23.74, mY.ret, COL.ret, others(mY.ret)));
      o.push(diaV(xRet, stemDiaY, dia));
      o.push(arrowSym(xRet, stemArrowUp, 'up'));

      // двухконтурный газовый: ГВС и ХВС из котла. В эталоне ТМ-2 эти стояки
      // были сплошными; краны добавлены сознательно — без них замена котла
      // требует слива всей водопроводной разводки.
      if (b.carrier && twoCirc) {
        o.push(ln(xg, bBot, xg, bBot + 2.53, { c: COL.dhw, w: LW.pipe }));
        o.push(ballValve(xg, bBot + 5.03, true));
        o.push(leaderValve(xg, bBot + 5.03, '3/4"'));
        o.push(vpipe(xg, bBot + 7.53, mY.dhw, COL.dhw, others(mY.dhw)));
        o.push(diaV(xg, stemDiaY, sanDia));
        o.push(arrowSym(xg, stemArrowDown, 'down'));
        o.push(ln(xc, bBot, xc, bBot + 2.53, { c: COL.cold, w: LW.pipe }));
        o.push(ballValve(xc, bBot + 5.03, true));
        o.push(leaderValve(xc, bBot + 5.03, '3/4"'));
        o.push(vpipe(xc, bBot + 7.53, mY.cold, COL.cold, others(mY.cold)));
        o.push(diaV(xc, stemDiaY, sanDia));
        o.push(arrowSym(xc, stemArrowUp, 'up'));
      }
    });

    // Обратка загрузки бойлера вливается в общую обратку котлового контура
    // одной перемычкой у левого торца гребёнки (тройник; дальше поток идёт
    // через фильтр того котла, который сейчас греет). Раньше она заходила в
    // котёл отдельным четвёртым патрубком, которого у котла нет.
    var jx = mLeft + 2.6;
    if (hasLoad && !(cfg.loadPump && cfg.hydro)) {
      // при насосной группе на коллекторе (после гидрострелки) обратка
      // загрузки уходит во вторичный коллектор, а не в котловую обратку
      o.push(vpipe(jx, mY.ret, mY.loadR, COL.loadR, [mY.loadS]));
    }

    // ── потребители ──
    var tapsEnd = tapX0 + tapStep * Math.max(0, taps.length - 1);
    var srcY = mY, secPair = null, hydroX = 0, mRight = 0;

    if (cfg.hydro) {
      hydroX = Math.max(tapsEnd + 24, 296);
      secPair = { supply: 161, ret: 173 };
      var xd = hydroX + 11, xu = hydroX + 16.5;
      mRight = xu;
      // котловая пара к гидрострелке
      o.push(hpipe(mLeft, xd, mY.supply, COL.supply));
      o.push(hpipe(mLeft, xu, mY.ret, COL.ret));
      o.push(diaH(hydroX - 2, mY.supply, dia));
      o.push(diaH(hydroX - 2, mY.ret, dia));
      // При нижней разводке загрузки стояки гидрострелки пересекает только
      // верхняя горизонталь к Т2 бойлера — на уровне его патрубка
      var loadYs = (hasLoad && !loadDown) ? [mY.loadS, mY.loadR] : (loadDown ? [pT2e] : []);
      o.push(vpipe(xd, mY.supply, secPair.supply, COL.supply, [mY.ret].concat(loadYs)));
      o.push(hpipe(hydroX + 4.5, xd, secPair.supply, COL.supply));
      o.push(openArrow(hydroX + 6.4, secPair.supply, 'left', COL.supply));
      o.push(vpipe(xu, mY.ret, secPair.ret, COL.ret, loadYs));
      o.push(hpipe(hydroX + 4.5, xu, secPair.ret, COL.ret));
      o.push(openArrow(xu - 0.8, secPair.ret, 'right', COL.ret));
      o.push(hydroSep(hydroX, 167, cfg.hydro.kw));
      // датчик «Каскад» — на подаче за гидрострелкой (по нему контроллер
      // ведёт общую температуру каскада)
      if (cfg.auto && cfg.auto.cascade) {
        o.push(ln(hydroX - 10, secPair.supply - 2.4, hydroX - 10, secPair.supply, { w: LW.thin }));
        o.push(gauge(hydroX - 10, secPair.supply - 4.95, 'Т'));
      }
      // вторичная пара к насосным группам
      o.push(hpipe(tapX0 - 8, hydroX - 4.5, secPair.supply, COL.supply));
      o.push(tick(tapX0 - 8, secPair.supply, false, COL.supply));
      o.push(openArrow(hydroX - 15, secPair.supply, 'left', COL.supply));
      o.push(hpipe(tapX0 - 8, hydroX - 4.5, secPair.ret, COL.ret));
      o.push(tick(tapX0 - 8, secPair.ret, false, COL.ret));
      o.push(openArrow(hydroX - 6.4, secPair.ret, 'right', COL.ret));
      srcY = { supply: secPair.supply, ret: secPair.ret, dhw: mY.dhw, cold: mY.cold };
    }

    var crossAll = allYs.concat(secPair ? [secPair.supply, secPair.ret] : []);
    function crossFor(fromY) {
      return crossAll.filter(function (yy) { return yy !== fromY; });
    }

    var bottomValveY = 256.78;      // центр нижних кранов (обмер: 254.28+2.5)
    var loadRx = null;
    taps.forEach(function (t, i) {
      var x = tapX0 + i * tapStep;
      var yStart = srcY[t.from];
      var yTop = bottomValveY - 2.5;
      // Резьба арматуры стояка — по DN насосной группы этого контура
      // (санитарные отводы В1/Т3 идут своим размером, у них t.size нет).
      var tSize = t.size || '3/4"';
      if (t.load) {
        // Ровно та же группа, что у радиаторного контура: обратка — чистый
        // стояк, подача — обратный клапан + кран + насос на тех же высотах,
        // внизу у обеих веток кран в общем ряду. Отличие только в том, что
        // после крана ветки уходят не к потребителю, а к змеевику бойлера.
        var gyL = 212.5;
        if (t.load === 'sup') {
          o.push(vpipe(x, yStart, gyL, t.color, crossFor(yStart)));
          o.push(checkValve(x, gyL + 2.5, 'down'));
          o.push(leaderCheck(x, gyL + 2.5, tSize));
          o.push(ln(x, gyL + 5, x, gyL + 9.6, { c: t.color, w: LW.pipe }));
          o.push(ballValve(x, gyL + 12.1, true));
          o.push(leaderValve(x, gyL + 12.1, tSize));
          o.push(ln(x, gyL + 14.6, x, gyL + 18.24, { c: t.color, w: LW.pipe }));
          o.push(pump(x, gyL + 21.16, 'down'));
          o.push(ln(x, gyL + 24.08, x, yTop, { c: t.color, w: LW.pipe }));
          loadSx = x;
        } else {
          o.push(vpipe(x, yStart, yTop, t.color, crossFor(yStart)));
          loadRx = x;
        }
        o.push(ballValve(x, bottomValveY, true));
        o.push(leaderValve(x, bottomValveY, tSize));
        o.push(diaV(x, bottomValveY - 7.2, dia));
        return;
      }
      if (t.mix) {
        // узел ТП: клапан на обратке (как в ТМ-2), перемычка подмеса вправо
        // в подачу Т11. При автоматике котельной клапан с сервоприводом —
        // смесью управляет контроллер, термоголовка дублировала бы его
        var vy = 215.27;
        o.push(vpipe(x, yStart, vy - 2.5, t.color, crossFor(yStart)));
        o.push(valve3(x, vy, (cfg.auto && cfg.auto.mixServo) ? 'servo' : 'therm', 'udr', 'l'));
        o.push(leader(x - 0.96, vy - 2.6, tSize));
        o.push(hpipe(x + 2.5, x + tapStep, vy, COL.supply));
        o.push(ln(x, vy + 2.5, x, yTop, { c: t.color, w: LW.pipe }));
      } else if (t.pump || t.group) {
        // насосный стояк: обратный клапан + кран + насос. Узел един для
        // радиаторной группы и подачи ТП — без обратного клапана на Т11
        // соседний насос гонял бы паразитный поток через контур ТП.
        var gy = 212.5;
        o.push(vpipe(x, yStart, gy, t.color, crossFor(yStart)));
        o.push(checkValve(x, gy + 2.5, 'down'));
        o.push(leaderCheck(x, gy + 2.5, tSize));
        o.push(ln(x, gy + 5, x, gy + 9.6, { c: t.color, w: LW.pipe }));
        o.push(ballValve(x, gy + 12.1, true));
        o.push(leaderValve(x, gy + 12.1, tSize));
        o.push(ln(x, gy + 14.6, x, gy + 18.24, { c: t.color, w: LW.pipe }));
        o.push(pump(x, gy + 21.16, 'down'));
        o.push(ln(x, gy + 24.08, x, yTop, { c: t.color, w: LW.pipe }));
        // датчик подачи контура (ТН) — в гильзе после насоса; по нему
        // контроллер ведёт расчётную температуру контура
        if (cfg.auto) {
          o.push(ln(x, gy + 27.6, x + 2.1, gy + 27.6, { w: LW.thin }));
          o.push(gauge(x + 4.66, gy + 27.6, 'Т'));
        }
      } else {
        o.push(vpipe(x, yStart, yTop, t.color, crossFor(yStart)));
      }
      o.push(ballValve(x, bottomValveY, true));
      o.push(leaderValve(x, bottomValveY, tSize));
      o.push(diaV(x, bottomValveY - 7.2, (t.mark === 'В1' || t.mark === 'Т3') ? sanDia : dia));
      o.push(bottomMark(x, t.mark, t.dir));
      // Усечённые одинаковые контуры ТП — их реальное число у последней пары
      if (t.note) o.push(txt(x + 2.6, 270.2, t.note, { size: SZ.dia, rotate: -90 }));
    });

    // правый край котловой гребёнки (без гидрострелки). Если потребителей
    // нет (только ГВС), гребёнка обрезается сразу за котлами — раньше она
    // тянулась к пустому месту несуществующих отводов.
    // Узел загрузки насосной группой без гидрострелки сидит на общей
    // магистрали (коллектор групп прикручен прямо к ней) — гребёнку при
    // необходимости удлиняем, чтобы тройник узла не оказался за её торцом.
    var loadNodeX = (hasLoad && cfg.loadPump && !cfg.hydro) ? Math.max(tapsEnd + 6, 231) : null;
    if (!cfg.hydro) {
      mRight = taps.length ? tapsEnd + 14.7 : 229;
      if (loadNodeX !== null) mRight = Math.max(mRight, loadNodeX + 26);
      o.push(hpipe(mLeft, mRight, mY.supply, COL.supply));
      o.push(tick(mRight, mY.supply, false, COL.supply));
      o.push(diaH(mRight, mY.supply, dia));
      // датчик «Каскад» без гидрострелки — на общей подающей магистрали
      if (cfg.auto && cfg.auto.cascade) {
        o.push(ln(mRight - 6, mY.supply - 2.4, mRight - 6, mY.supply, { w: LW.thin }));
        o.push(gauge(mRight - 6, mY.supply - 4.95, 'Т'));
      }
      var retRight = cfg.tankHeating ? mRight + 4.7 : mRight;
      o.push(hpipe(mLeft, retRight, mY.ret, COL.ret));
      if (!cfg.tankHeating) o.push(tick(retRight, mY.ret, false, COL.ret));
      o.push(diaH(mRight, mY.ret, dia));
      if (twoCirc) {
        o.push(hpipe(mLeft, mRight, mY.dhw, COL.dhw));
        o.push(tick(mRight, mY.dhw, false, COL.dhw));
        o.push(diaH(mRight, mY.dhw, sanDia));
        o.push(hpipe(mLeft, mRight, mY.cold, COL.cold));
        o.push(tick(mRight, mY.cold, false, COL.cold));
        o.push(diaH(mRight, mY.cold, sanDia));
      }
    } else if (twoCirc) {
      // ГВС/ХВС двухконтурного не проходят через гидрострелку — это
      // санитарные линии. Раньше при гидрострелке они не рисовались вовсе:
      // стояки котла и отводы В1/Т3 обрывались в воздухе.
      o.push(hpipe(mLeft, tapsEnd, mY.dhw, COL.dhw));
      o.push(diaH(tapX0 - 4, mY.dhw, sanDia));
      o.push(hpipe(mLeft, tapsEnd - tapStep, mY.cold, COL.cold));
      o.push(diaH(tapX0 - 4, mY.cold, sanDia));
    }
    // ── узел загрузки бойлера насосной группой ──
    // Кран → насос → обратный клапан (без него стоящий насос даёт паразитную
    // циркуляцию через змеевик).
    if (hasLoad && cfg.loadPump && loadNodeX !== null) {
      // Без гидрострелки коллектор групп прикручен к самой магистрали —
      // тройник от общей подачи вниз на линию загрузки, дальше горизонтально.
      var xn = loadNodeX;
      o.push(vpipe(xn, mY.supply, mY.loadS, COL.loadS, [mY.ret]));
      o.push(hpipe(xn, xn + 2.3, mY.loadS, COL.loadS));
      o.push(ballValve(xn + 4.8, mY.loadS, false));
      o.push(leader(xn + 3.9, mY.loadS - 1.2, '3/4"'));
      o.push(hpipe(xn + 7.3, xn + 9.7, mY.loadS, COL.loadS));
      o.push(pump(xn + 12.6, mY.loadS, 'right'));
      o.push(hpipe(xn + 15.5, xn + 17.4, mY.loadS, COL.loadS));
      o.push(checkValve(xn + 19.9, mY.loadS, 'right'));
      loadSx = xn + 22.4;
    }

    // левые торцы гребёнки; линии загрузки начинаются тройниками
    // (подача — от клапана/узла у котла, обратка — от перемычки в обратку),
    // торцов у них нет
    var colByKey = { supply: COL.supply, ret: COL.ret, dhw: COL.dhw, cold: COL.cold, loadS: COL.loadS, loadR: COL.loadR };
    Object.keys(mY).forEach(function (k) {
      if (k === 'loadS' || k === 'loadR') return;
      o.push(tick(mLeft, mY[k], false, colByKey[k]));
    });

    // ── расширительный бак отопления — на обратке котлового контура ──
    if (cfg.tankHeating) {
      var volTxt = cfg.tankHeating + ' л.';
      if (cfg.hydro) {
        var tx2 = hydroX + 28.5;
        o.push(hpipe(mRight, tx2, mY.ret, COL.ret));
        o.push(expTank(tx2, mY.ret - 26.9, '#ff0000', volTxt));
        o.push(ln(tx2, mY.ret - 26.9, tx2, mY.ret - 24.4, { c: COL.ret, w: LW.pipe }));
        o.push(ballValve(tx2, mY.ret - 21.9, true));
        o.push(leaderValve(tx2, mY.ret - 21.9, '3/4"'));
        // при нижней разводке загрузки на этом уровне проходит линия к Т1
        // змеевика — стояк бака обходит её
        o.push(vpipe(tx2, mY.ret - 19.4, mY.ret, COL.ret, loadDown ? [pT1e] : []));
      } else {
        // гребёнка заканчивается левее бака, пересечений нет — обходы не нужны
        var tx1 = mRight + 4.7, tTop = 87.17;
        o.push(expTank(tx1, tTop, '#ff0000', volTxt));
        o.push(ln(tx1, tTop, tx1, tTop + 5.5, { c: COL.ret, w: LW.pipe }));
        o.push(ballValve(tx1, tTop + 8, true));
        o.push(leaderValve(tx1, tTop + 8, '3/4"'));
        o.push(ln(tx1, tTop + 10.5, tx1, mY.ret, { c: COL.ret, w: LW.pipe }));
      }
    }

    // ── бойлер косвенного нагрева ──
    if (cfg.indirect) {
      // напольный 52×84 или настенный 40×56 — по креплению из настроек;
      // настенный висит выше, чтобы низ корпуса не лёг на гребёнку загрузки.
      // Патрубки распределены пропорционально высоте (для напольного это
      // те же уровни, что и раньше: +14 / +20.5 / +27 / +58 / +74)
      var wall = !!cfg.indirect.wall;
      var tW = wall ? 40 : 52, tH = wall ? 56 : 84, tX = 415 - tW - 1.5, tY = wall ? 78 : 92;
      o.push(indirectTank(tX, tY, tW, tH));
      // датчик ГВС — в штатной гильзе бойлера (режим «Бойлер» контроллера)
      if (cfg.auto && cfg.auto.dhwSensor) o.push(gauge(tX + tW - 7, tY + tH * 0.55, 'Т'));
      var pT3 = tY + tH * 0.167, pT4 = tY + tH * 0.244, pT1 = tY + tH * 0.321,
        pT2 = tY + tH * 0.69, pB1 = tY + tH - (wall ? 8 : 10);
      // арматура В1 всегда на уровне напольного патрубка — у настенного между
      // ней и корпусом остаётся спуск с обходами линий загрузки
      var armY = Math.max(pB1, 166);
      var portYs = [pT3, pT1, pT2, pB1].concat(cfg.recirc ? [pT4] : []);
      // Контур загрузки от узла у котла к патрубкам. Линия подачи начинается
      // на стояке узла загрузки (loadSx), обратка — на перемычке в общую
      // обратку (jx) — раньше обе шли от mLeft и висели с торцами в воздухе.
      var lx1 = tX - 22, lx2 = tX - 13;
      if (loadDown) {
        // От кранов группы линии идут вниз, двумя полосами вправо и
        // поднимаются к патрубкам змеевика в свободном канале слева от
        // гидрострелки. Кранов у бака нет — обе ветки отсекает сама группа.
        // Подача поднимается слева от гидрострелки и уходит к Т1 поверху —
        // выше воздухоотводчика. Обратка идёт к Т2 на уровне 150, а там
        // как раз воздухоотводчик стрелки с размером, поэтому её стояк
        // вынесен ПРАВЕЕ стрелки, в свободный канал перед стояком В1:
        // так линия не режет ни клапан, ни его выноску.
        var upS = hydroX - 17.5, upR = tX - 35.5;
        var hops = [secPair.supply, secPair.ret, mY.supply, mY.ret];
        o.push(ln(loadSx, bottomValveY + 2.5, loadSx, laneS, { c: COL.loadS, w: LW.pipe }));
        o.push(hpipe(loadSx, upS, laneS, COL.loadS));
        o.push(ln(loadRx, bottomValveY + 2.5, loadRx, laneR, { c: COL.loadR, w: LW.pipe }));
        o.push(hpipe(loadRx, upR, laneR, COL.loadR));
        o.push(vpipe(upS, laneS, pT1, COL.loadS, hops));
        o.push(hpipe(upS, tX - 1.5, pT1, COL.loadS));
        o.push(openArrow(tX - 3.2, pT1, 'right', COL.loadS));
        // Обратка поднимается ПРАВЕЕ гидрострелки, куда котловые магистрали и
        // вторичная пара не доходят, — обходить ей нечего. Единственное
        // пересечение — перемычка бака ГВС к стояку В1 на своей высоте.
        var dhwTeeY = (cfg.tankDhw && cfg.water !== false) ? (cfg.hydro ? 215 : 193) + 8.6 : null;
        o.push(vpipe(upR, laneR, pT2, COL.loadR, dhwTeeY !== null ? [dhwTeeY] : []));
        o.push(hpipe(upR, tX - 1.5, pT2, COL.loadR));
        o.push(openArrow(upR + 2.5, pT2, 'left', COL.loadR));
        // подпись — в просвете между полосами сразу за стояками группы:
        // правее начинаются отметки В1/Т3/Т4, туда её заводить нельзя
        o.push(txt(loadRx + 4, 268, 'загрузка бойлера', { size: SZ.txt }));
      } else {
      o.push(hpipe(loadSx !== null ? loadSx : mLeft, lx1, mY.loadS, COL.loadS));
      o.push(hpipe(loadRx !== null ? loadRx : (hasLoad ? jx : mLeft), lx2, mY.loadR, COL.loadR));
      o.push(diaH(lx1 - 2, mY.loadS, dia));
      o.push(diaH(lx1 - 2, mY.loadR, dia));
      o.push(vpipe(lx1, mY.loadS, pT1, COL.loadS, [mY.loadR, pB1]));
      // отсекающий кран на подаче загрузки у бойлера: без него для замены
      // бойлера пришлось бы сливать котловой контур
      o.push(hpipe(lx1, tX - 11.5, pT1, COL.loadS));
      o.push(ballValve(tX - 9, pT1, false));
      o.push(leader(tX - 9.9, pT1 - 1.1, coilThread));
      o.push(hpipe(tX - 6.5, tX - 1.5, pT1, COL.loadS));
      o.push(openArrow(tX - 3.2, pT1, 'right', COL.loadS));
      o.push(vpipe(lx2, mY.loadR, pT2, COL.loadR, [mY.loadS, pB1]));
      o.push(hpipe(lx2, lx2 + 2.8, pT2, COL.loadR));
      // кран по сечению линии загрузки; прежняя подпись 1/2" душила
      // бы весь расход загрузки бойлера
      o.push(ballValve(lx2 + 5.3, pT2, false));
      o.push(leader(lx2 + 4.4, pT2 - 1.1, coilThread));
      o.push(hpipe(lx2 + 7.8, tX - 1.5, pT2, COL.loadR));
      o.push(openArrow(lx2 + 2, pT2, 'left', COL.loadR));
      }
      o.push(tankPort(tX, pT1, COL.loadS, 'Т1'));
      o.push(tankPort(tX, pT2, COL.loadR, 'Т2'));
      o.push(tankPort(tX, pT3, COL.dhw, 'Т3'));
      o.push(tankPort(tX, pB1, COL.cold, 'В1'));
      if (cfg.recirc) o.push(tankPort(tX, pT4, COL.recirc, 'Т4'));

      // Стояк рециркуляции сдвинут с tX−21 на tX−17: на tX−21 он проходил
      // ровно сквозь пружину предохранительного клапана узла В1
      // При нижней разводке загрузки правее стрелки поднимается стояк
      // обратки бойлера — узел В1 и стояк рециркуляции сдвигаются вправо,
      // чтобы просвет до него был те же 9 мм, что между подачей и обраткой
      // насосной группы.
      var loadShift = loadDown ? 3.5 : 0;
      var bx1 = tX - 30 + loadShift, bx3 = tX - 17 + loadShift, bx2 = tX - 5.5;
      var yTopV = bottomValveY - 2.5;
      // В1: ввод холодной воды снизу. Порядок по потоку: кран → обратный
      // клапан → тройник расширительного бака ГВС → предохранительный
      // клапан → бойлер. Раньше тройник бака стоял ДО обратного клапана —
      // клапан отсекал бак от бойлера, и тепловое расширение сбрасывалось
      // предохранителем при каждом нагреве.
      if (cfg.water !== false) {
        var dtX = bx1 - 13.5, dtY = cfg.hydro ? 215 : 193;
        var checkY = cfg.tankDhw ? dtY + 16.6 : armY + 16.4;
        o.push(hpipe(bx1, tX - 1.5, pB1, COL.cold));
        if (armY > pB1) o.push(vpipe(bx1, pB1, armY, COL.cold, loadDown ? [] : [mY.loadS, mY.loadR]));
        o.push(ln(bx1, armY, bx1, armY + 6.4, { c: COL.cold, w: LW.pipe }));
        // предохранительный на отводе (сброс вниз), как на листе 2025-1209R
        o.push(hpipe(bx1, bx1 + 4.1, armY + 8.9, COL.cold));
        o.push(safetyValve(bx1 + 6.6, armY + 8.9, true));
        o.push(leader(bx1 + 5.6, armY + 7.8, safetyThread));
        o.push(ln(bx1, armY + 6.4, bx1, checkY - 2.5, { c: COL.cold, w: LW.pipe }));
        o.push(checkValve(bx1, checkY, 'up'));
        o.push(leaderCheck(bx1, checkY, coldThread));
        o.push(ln(bx1, checkY + 2.5, bx1, yTopV, { c: COL.cold, w: LW.pipe }));
        o.push(ballValve(bx1, bottomValveY, true));
        o.push(leaderValve(bx1, bottomValveY, coldThread));
        o.push(diaV(bx1, bottomValveY - 7.2, sanDia));
        o.push(bottomMark(bx1, 'В1', 'up'));
        // расширительный бак ГВС — на своём отводе от В1, между обратным
        // клапаном и бойлером; при гидрострелке ниже, чтобы не задевать
        // её обвязку
        if (cfg.tankDhw) {
          o.push(expTank(dtX, dtY, '#00ffff', cfg.tankDhw + ' л.'));
          o.push(ln(dtX, dtY, dtX, dtY + 1.8, { c: COL.cold, w: LW.pipe }));
          o.push(ballValve(dtX, dtY + 4.3, true));
          o.push(leaderValve(dtX, dtY + 4.3, '3/4"'));
          o.push(ln(dtX, dtY + 6.8, dtX, dtY + 8.6, { c: COL.cold, w: LW.pipe }));
          o.push(hpipe(dtX, bx1, dtY + 8.6, COL.cold));
        }
      }
      // Т3: горячая вода к потребителю
      o.push(hpipe(bx2, tX - 1.5, pT3, COL.dhw));
      o.push(vpipe(bx2, pT3, yTopV, COL.dhw, portYs.filter(function (yy) { return yy !== pT3; })));
      o.push(ballValve(bx2, bottomValveY, true));
      o.push(leaderValve(bx2, bottomValveY, dhwThread));
      o.push(diaV(bx2, bottomValveY - 7.2, sanDia));
      o.push(bottomMark(bx2, 'Т3', 'down'));
      // Т4: рециркуляция — кран у бойлера (иначе замена насоса требует
      // слива бойлера), насос, обратный клапан, кран внизу
      if (cfg.recirc) {
        o.push(hpipe(bx3, tX - 1.5, pT4, COL.recirc));
        o.push(vpipe(bx3, pT4, 213.3, COL.recirc, loadDown ? [pT1, pT2, pB1] : [pT1, pB1, mY.loadR]));
        o.push(ballValve(bx3, 215.8, true));
        o.push(leaderValve(bx3, 215.8, recircThread));
        o.push(ln(bx3, 218.3, bx3, 223.1, { c: COL.recirc, w: LW.pipe }));
        o.push(pump(bx3, 226, 'up'));
        o.push(ln(bx3, 228.92, bx3, 230.5, { c: COL.recirc, w: LW.pipe }));
        o.push(checkValve(bx3, 233, 'up'));
        o.push(leaderCheck(bx3, 233, recircThread));
        o.push(ln(bx3, 235.5, bx3, yTopV, { c: COL.recirc, w: LW.pipe }));
        o.push(ballValve(bx3, bottomValveY, true));
        o.push(leaderValve(bx3, bottomValveY, recircThread));
        o.push(diaV(bx3, bottomValveY - 7.2, recDia));
        o.push(bottomMark(bx3, 'Т4', 'up'));
      }
    }

    return o.join('');
  }

  // ─── Схема подключения автоматики (контроллер Thermatic 3001) ──────────
  // Схема-выноска в стиле фирменных схем подключения ZONT: прибор нарисован
  // плоско, с лицевой панели, с настоящими клеммными колодками; от каждой
  // ЗАДЕЙСТВОВАННОЙ клеммы отходит жгут к оборудованию, нарисованному тоже
  // плоско (без фотографий — они не читаются линиями).
  //
  // Пересечений жил нет по построению:
  //   • жилы одного жгута — параллельные Г-образные трассы с одинаковым
  //     шагом (шаг клемм прибора = шаг клемм прибора-потребителя);
  //   • жгуты разложены по «этажам»: чем левее клемма, тем ближе её этаж
  //     к прибору (справа — зеркально). Тогда стояк соседнего жгута никогда
  //     не пересекает горизонталь нижнего.
  //
  // Назначение и символы клемм — карта клемм техдокументации
  // (Приложение 4 ML.TD.STOUT.3001.01): ∇ — клемма насоса, ◄/► — увеличение
  // и уменьшение прямого потока через смеситель, ⏚ — общий провод, L/N — фаза
  // и нейтраль 220 В, НР/Общ/НЗ — контакты релейных выходов.
  //
  // items — артикулы и названия подобранных позиций (см. renderAutomationScheme).
  // Возвращает { svg, w, h } — svg без обёртки, viewBox собирает вызывающий.
  function automation(tc, items) {
    tc = tc || {};
    items = items || {};
    var nm = items.names || {};
    var o = [], W = 420;

    // ── палитра ──
    var INK = '#334155', FACE = '#E9EDF2', FACE2 = '#F8FAFC';
    var CL = '#DC2626', CN = '#2563EB', CPE1 = '#EAB308', CPE2 = '#16A34A';
    var CSIG = '#64748B', COPEN = '#B45309', CCLOSE = '#1F2937';
    var CBUS = '#0D9488', CBUS2 = '#F59E0B';
    var CRS = ['#1F2937', '#16A34A', '#EAB308', '#DC2626']; // ⏚ B A +12В
    var TC_ = { or: '#F97316', bl: '#2563EB', rd: '#DC2626', wh: '#F1F5F9', dk: '#475569', tl: '#0D9488' };

    var P = 3.2;      // шаг клемм (общий для прибора и потребителей)
    var LS = 19;      // шаг «этажей» выносок
    // Корпус выше, чем нужно одним клеммникам: на лицевой панели помещаются
    // экран с кнопками, как на приборе, и вертикальные подписи силовых клемм.
    // Высота подобрана так, чтобы экран встал ровно по центру панели и при
    // этом не задел подписи — они занимают нижние ~15 мм поля.
    // Пропорции сняты с фотографии прибора: лицевая панель ≈ 2,6:1, модуль
    // экрана ≈ 41 % её ширины и 54 % высоты, сам экран ≈ 1,5:1. Высота
    // корпуса из этого и получается: 75 мм панели + два клеммных ряда.
    var CX = 108, CW = 204, CH = 96;
    var DXL = 76, DXR = 344;          // где стоят колодки потребителей
    var ICL = 56, ICR = 364, ICO = 13; // центры и размер плоских значков

    function cut(s, k) { s = String(s || ''); return s.length > k ? s.slice(0, k - 1) + '…' : s; }
    function seg(pts, c, w, dash) {
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + n(p[0]) + ',' + n(p[1]); }).join(' ');
      return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 0.5) +
        '" stroke-linejoin="round" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
    }
    function peSeg(pts) { return seg(pts, CPE1, 0.55) + seg(pts, CPE2, 0.55, '1.4 1.4'); }
    function gndSym(x, y) {
      return seg([[x, y - 1.6], [x, y]], CPE2, 0.5) +
        seg([[x - 1.7, y], [x + 1.7, y]], CPE2, 0.5) +
        seg([[x - 1.1, y + 0.8], [x + 1.1, y + 0.8]], CPE2, 0.5) +
        seg([[x - 0.5, y + 1.6], [x + 0.5, y + 1.6]], CPE2, 0.5);
    }

    // ── плоские значки оборудования ──
    function icoPump(cx, cy, s) {
      return circle(cx - s * 0.1, cy, s * 0.34, { f: '#fff', c: INK, w: 0.5 }) +
        rrect(cx + s * 0.1, cy - s * 0.24, s * 0.4, s * 0.48, 0.8, { f: '#CBD5E1', c: INK, w: 0.5 }) +
        pline([[cx - s * 0.28, cy - s * 0.16], [cx + s * 0.04, cy], [cx - s * 0.28, cy + s * 0.16]], { f: INK, c: INK, w: 0.4, close: true }) +
        seg([[cx - s * 0.5, cy], [cx - s * 0.44, cy]], INK, 0.5);
    }
    function icoServo(cx, cy, s) {
      var vy = cy + s * 0.22;
      return rrect(cx - s * 0.3, cy - s * 0.5, s * 0.6, s * 0.42, 0.8, { f: '#CBD5E1', c: INK, w: 0.5 }) +
        txt(cx, cy - s * 0.19, 'М', { size: s * 0.3, anchor: 'middle' }) +
        seg([[cx, cy - s * 0.08], [cx, cy + s * 0.04]], INK, 0.5) +
        pline([[cx - s * 0.34, vy - s * 0.22], [cx - s * 0.34, vy + s * 0.22], [cx, vy]], { f: '#fff', c: INK, w: 0.5, close: true }) +
        pline([[cx + s * 0.34, vy - s * 0.22], [cx + s * 0.34, vy + s * 0.22], [cx, vy]], { f: '#fff', c: INK, w: 0.5, close: true }) +
        pline([[cx, vy], [cx + s * 0.2, vy + s * 0.4], [cx - s * 0.2, vy + s * 0.4]], { f: '#fff', c: INK, w: 0.5, close: true });
    }
    // Котёл: корпус с дисплеем и патрубками, в середине — знак вида топлива.
    // Газ — синее пламя, электричество — жёлтая молния (как на схемах STOUT).
    function icoBoiler(cx, cy, s, gas) {
      var g = rrect(cx - s * 0.36, cy - s * 0.5, s * 0.72, s, 1.2, { f: FACE2, c: INK, w: 0.55 }) +
        rrect(cx - s * 0.24, cy - s * 0.34, s * 0.48, s * 0.18, 0.5, { f: '#CBD5E1', c: INK, w: 0.4 }) +
        seg([[cx - s * 0.2, cy + s * 0.5], [cx - s * 0.2, cy + s * 0.62]], INK, 0.5) +
        seg([[cx + s * 0.2, cy + s * 0.5], [cx + s * 0.2, cy + s * 0.62]], INK, 0.5);
      var y0 = cy + s * 0.08;   // центр знака — ниже дисплея
      if (gas) {
        g += path('M' + n(cx) + ',' + n(y0 - s * 0.28) +
          ' C' + n(cx + s * 0.19) + ',' + n(y0 - s * 0.06) + ' ' + n(cx + s * 0.19) + ',' + n(y0 + s * 0.07) + ' ' + n(cx + s * 0.1) + ',' + n(y0 + s * 0.18) +
          ' C' + n(cx + s * 0.04) + ',' + n(y0 + s * 0.25) + ' ' + n(cx - s * 0.04) + ',' + n(y0 + s * 0.25) + ' ' + n(cx - s * 0.1) + ',' + n(y0 + s * 0.18) +
          ' C' + n(cx - s * 0.19) + ',' + n(y0 + s * 0.07) + ' ' + n(cx - s * 0.19) + ',' + n(y0 - s * 0.06) + ' ' + n(cx) + ',' + n(y0 - s * 0.28) + ' Z',
          { f: '#2563EB', c: '#1E3A8A', w: 0.3 });
        // внутренний язык пламени — светлее, чтобы знак читался и мелко
        g += path('M' + n(cx) + ',' + n(y0 - s * 0.06) +
          ' C' + n(cx + s * 0.09) + ',' + n(y0 + s * 0.04) + ' ' + n(cx + s * 0.07) + ',' + n(y0 + s * 0.14) + ' ' + n(cx) + ',' + n(y0 + s * 0.18) +
          ' C' + n(cx - s * 0.07) + ',' + n(y0 + s * 0.14) + ' ' + n(cx - s * 0.09) + ',' + n(y0 + s * 0.04) + ' ' + n(cx) + ',' + n(y0 - s * 0.06) + ' Z',
          { f: '#93C5FD' });
      } else {
        g += path('M' + n(cx + s * 0.09) + ',' + n(y0 - s * 0.28) +
          ' L' + n(cx - s * 0.15) + ',' + n(y0 + s * 0.04) +
          ' L' + n(cx - s * 0.01) + ',' + n(y0 + s * 0.04) +
          ' L' + n(cx - s * 0.09) + ',' + n(y0 + s * 0.28) +
          ' L' + n(cx + s * 0.16) + ',' + n(y0 - s * 0.05) +
          ' L' + n(cx + s * 0.02) + ',' + n(y0 - s * 0.05) + ' Z',
          { f: '#FACC15', c: '#A16207', w: 0.3 });
      }
      return g;
    }
    function icoProbe(cx, cy, s) {
      return rrect(cx - s * 0.14, cy - s * 0.36, s * 0.28, s * 0.72, s * 0.14, { f: '#EFF6FF', c: '#3B82F6', w: 0.5 }) +
        seg([[cx - s * 0.07, cy - s * 0.12], [cx + s * 0.07, cy - s * 0.12]], '#3B82F6', 0.4) +
        seg([[cx - s * 0.07, cy + s * 0.04], [cx + s * 0.07, cy + s * 0.04]], '#3B82F6', 0.4) +
        seg([[cx, cy - s * 0.36], [cx, cy - s * 0.5]], CSIG, 0.5);
    }
    function icoPanel(cx, cy, s) {
      return rrect(cx - s * 0.44, cy - s * 0.34, s * 0.88, s * 0.68, 1, { f: FACE2, c: INK, w: 0.55 }) +
        rrect(cx - s * 0.32, cy - s * 0.22, s * 0.64, s * 0.3, 0.5, { f: '#DBEAFE', c: INK, w: 0.4 }) +
        circle(cx - s * 0.18, cy + s * 0.19, s * 0.05, { f: INK }) +
        circle(cx, cy + s * 0.19, s * 0.05, { f: INK }) +
        circle(cx + s * 0.18, cy + s * 0.19, s * 0.05, { f: INK });
    }
    function icoPuck(cx, cy, s) {
      return circle(cx, cy, s * 0.36, { f: FACE2, c: INK, w: 0.55 }) +
        circle(cx, cy, s * 0.16, { f: '#CBD5E1', c: INK, w: 0.4 });
    }
    function icoDrop(cx, cy, s) {
      return path('M' + n(cx) + ',' + n(cy - s * 0.4) + ' C' + n(cx + s * 0.34) + ',' + n(cy) + ' ' +
        n(cx + s * 0.26) + ',' + n(cy + s * 0.34) + ' ' + n(cx) + ',' + n(cy + s * 0.34) +
        ' C' + n(cx - s * 0.26) + ',' + n(cy + s * 0.34) + ' ' + n(cx - s * 0.34) + ',' + n(cy) + ' ' +
        n(cx) + ',' + n(cy - s * 0.4) + ' Z', { f: '#DBEAFE', c: '#3B82F6', w: 0.5 });
    }
    function icoValveAct(cx, cy, s) {
      var vy = cy + s * 0.24;
      return rrect(cx - s * 0.28, cy - s * 0.5, s * 0.56, s * 0.4, 0.8, { f: '#CBD5E1', c: INK, w: 0.5 }) +
        txt(cx, cy - s * 0.21, 'М', { size: s * 0.28, anchor: 'middle' }) +
        seg([[cx, cy - s * 0.1], [cx, cy + s * 0.02]], INK, 0.5) +
        circle(cx, vy, s * 0.22, { f: '#fff', c: INK, w: 0.5 }) +
        seg([[cx - s * 0.46, vy], [cx - s * 0.22, vy]], INK, 0.6) +
        seg([[cx + s * 0.22, vy], [cx + s * 0.46, vy]], INK, 0.6);
    }
    function icoBreaker(cx, cy, s) {
      return rrect(cx - s * 0.3, cy - s * 0.5, s * 0.6, s, 0.8, { f: FACE2, c: INK, w: 0.55 }) +
        rrect(cx - s * 0.14, cy - s * 0.26, s * 0.28, s * 0.34, 0.4, { f: INK }) +
        txt(cx, cy + s * 0.34, 'C10', { size: s * 0.22, anchor: 'middle' });
    }
    function icoModule(cx, cy, s, ant) {
      return rrect(cx - s * 0.42, cy - s * 0.34, s * 0.84, s * 0.68, 0.8, { f: FACE2, c: INK, w: 0.55 }) +
        rrect(cx - s * 0.3, cy - s * 0.2, s * 0.6, s * 0.16, 0.3, { f: '#CBD5E1' }) +
        (ant ? seg([[cx, cy - s * 0.34], [cx, cy - s * 0.62]], INK, 0.5) + circle(cx, cy - s * 0.66, s * 0.06, { f: INK }) : '') +
        circle(cx - s * 0.2, cy + s * 0.16, s * 0.05, { f: '#22C55E' });
    }

    // ── колодка потребителя: клеммы стоят столбиком, жила входит по прямой ──
    function vstrip(x, cy, labels, side) {
      var m = labels.length, h = m * P + 1.6, s = '';
      s += rrect(x - 2.4, cy - h / 2, 4.8, h, 0.8, { f: '#27AE60', c: '#14532D', w: 0.4 });
      labels.forEach(function (L, i) {
        var y = cy + (i - (m - 1) / 2) * P;
        s += circle(x, y, 1.05, { f: '#E8F5E9', c: '#14532D', w: 0.3 });
        s += ln(x - 0.6, y, x + 0.6, y, { c: '#14532D', w: 0.3 });
        s += txt(x + side * 4.2, y + 0.7, L, { size: 1.95, anchor: side > 0 ? 'start' : 'end' });
      });
      return s;
    }

    // ── описание клеммных блоков прибора (порядок — как на корпусе) ──
    var TOP = [
      { k: 'tn1', n: 2, c: TC_.or, t: 'ТН-1' }, { k: 'tn2', n: 2, c: TC_.bl, t: 'ТН-2' },
      { k: 'tn3', n: 2, c: TC_.rd, t: 'ТН-3' }, { k: 'boiler', n: 2, c: TC_.wh, t: 'Бойлер' },
      { k: 'out', n: 2, c: TC_.wh, t: 'Улица' }, { k: 'casc', n: 2, c: TC_.dk, t: 'Каскад' },
      { k: 'ain', n: 3, c: TC_.wh, t: 'Входы' }, { k: 'vext', n: 3, c: TC_.tl, t: '+5/12В' },
      { k: 'thr', n: 6, c: TC_.wh, t: 'Термостаты' }, { k: 'ow', n: 2, c: TC_.wh, t: '1-Wire' },
      // Ethernet — не клеммник, а гнездо RJ45; по карте клемм стоит в том же
      // ряду, что и 1-Wire с RS-485 (Приложение 4), поэтому и рисуется здесь,
      // а не на лицевой панели: на приборе её лицевая сторона пустая
      { k: 'eth', n: 2, c: TC_.wh, t: 'Ethernet', jack: true },
      { k: 'rs', n: 4, c: TC_.wh, t: 'RS-485' }, { k: 'csh1', n: 2, c: TC_.dk, t: 'ЦШ1' },
      { k: 'csh2', n: 2, c: TC_.dk, t: 'ЦШ2' }
    ];
    var BOT = [
      { k: 'ko1p', n: 2, c: TC_.or, t: 'КО-1 Насос' }, { k: 'ko1m', n: 3, c: TC_.or, t: 'КО-1 Смеситель' },
      { k: 'ko2p', n: 2, c: TC_.bl, t: 'КО-2 Насос' }, { k: 'ko2m', n: 3, c: TC_.bl, t: 'КО-2 Смеситель' },
      { k: 'ko3p', n: 2, c: TC_.rd, t: 'КО-3 Насос' }, { k: 'ko3m', n: 3, c: TC_.rd, t: 'КО-3 Смеситель' },
      { k: 'dhwrc', n: 2, c: TC_.wh, t: 'ГВС РЦ' }, { k: 'dhwcn', n: 2, c: TC_.wh, t: 'ГВС ЦН' },
      { k: 'leak', n: 3, c: TC_.tl, t: 'Кран протечки' }, { k: 'trace', n: 3, c: TC_.tl, t: 'Насос трассы' },
      { k: 'rel1', n: 3, c: TC_.dk, t: 'Реле котёл 1' }, { k: 'rel2', n: 3, c: TC_.dk, t: 'Реле котёл 2' },
      { k: 'pwr', n: 2, c: TC_.tl, t: 'Питание 220В' }
    ];
    // раскладка блоков по ширине корпуса
    function layout(list) {
      var total = 0;
      list.forEach(function (b) { total += b.n * P; });
      var gap = (CW - 14 - total) / (list.length - 1);
      if (gap < 1.6) gap = 1.6;
      var x = CX + 7, map = {};
      list.forEach(function (b) {
        b.x = x; b.cx = x + b.n * P / 2; map[b.k] = b; x += b.n * P + gap;
      });
      return map;
    }
    var T = layout(TOP), B = layout(BOT);

    // ── что подключено ──
    var used = {};
    var topL = [], topR = [], botL = [], botR = [];

    var ntcMap = { 'ТН-1': 'tn1', 'ТН-2': 'tn2', 'ТН-3': 'tn3', 'Бойлер': 'boiler', 'Улица': 'out', 'Каскад': 'casc' };
    (tc.ntc || []).forEach(function (s) {
      var i = s.indexOf(' — '), term = i > 0 ? s.slice(0, i) : s, desc = i > 0 ? s.slice(i + 3) : '';
      var k = ntcMap[term]; if (!k) return;
      // «полярности нет» вынесено в легенду — в подписи оно не помещалось
      // в отведённое поле и наезжало на значок
      topL.push({
        blk: T[k], wires: [CSIG, '#94A3B8'], clamps: ['1', '2'], ico: icoProbe,
        title: 'Датчик NTC «' + term + '»', sub: cut(desc, 32)
      });
    });
    if (tc.leakQty > 0) topL.push({
      blk: T.ain, wires: [CSIG, '#94A3B8'], clamps: ['1', '⏚'], ico: icoDrop,
      title: 'Датчики протечки × ' + tc.leakQty, sub: 'шлейф на аналоговый вход «1»'
    });
    // Двухпозиционные термостаты сидят на «Входах термостатов» сухим
    // контактом — своя пара клемм на каждый контур КО-1…КО-3. Раньше при
    // выборе «Термостат» с сухим контактом на схеме не появлялось ничего.
    if (tc.airOn && tc.airKind === 'dry' && tc.airQty > 0) {
      var dq = Math.min(tc.airQty, tc.dryInputs || 3);
      for (var q = 0; q < dq; q++) topL.push({
        blk: T.thr, clampOffset: q * 2, wires: [CSIG, '#94A3B8'], clamps: ['1', '2'],
        ico: icoPanel, title: 'Термостат ' + ((tc.circuits || [])[q] ? (tc.circuits[q].name) : ('вход ' + (q + 1))),
        sub: cut(nm.air || 'сухой контакт (ON/OFF)', 30)
      });
    }

    var rsDev = [];
    if (tc.panel) rsDev.push({ ico: icoPanel, title: 'Панель управления', sub: cut(nm.panel || 'МЛ-753', 34) });
    // Радиоприборы провода к контроллеру не имеют — их держит радиомодуль,
    // поэтому они уходят в его подпись, а не отдельной выноской «в никуда»
    var radioAir = (tc.airOn && tc.airQty > 0 && tc.airDevice && tc.airDevice.link === 'radio');
    if (tc.needRadio) rsDev.push({
      ico: function (a, b, c) { return icoModule(a, b, c, true); }, title: 'Радиомодуль',
      sub: radioAir ? ((tc.airKind === 'thermostat' ? 'термостаты' : 'датчики') + ' × ' + tc.airQty + ' по радио, 868 МГц')
        : cut(nm.radio || 'МЛ-590, 868 МГц', 34)
    });
    (tc.expansion || []).forEach(function (e) {
      rsDev.push({ ico: icoModule, title: 'Блок расширения ' + (e.id === 'ML00007406' ? 'EX-108' : 'EX-77') + (e.qty > 1 ? ' × ' + e.qty : ''), sub: '+' + (e.circuits * (e.qty || 1)) + ' контура' });
    });
    if (tc.airOn && tc.airKind !== 'dry' && tc.airQty > 0 && !radioAir)
      rsDev.push({
        ico: tc.airKind === 'thermostat' ? icoPanel : icoPuck,
        title: (tc.airKind === 'thermostat' ? 'Комнатные термостаты × ' : 'Датчики воздуха × ') + tc.airQty,
        sub: cut(nm.air || 'по шине RS-485', 34)
      });
    if (rsDev.length) {
      // все приборы RS-485 сидят на одной шине — показываем шлейфом от одной клеммы
      rsDev.forEach(function (d, i) {
        topR.push({
          blk: T.rs, wires: CRS, clamps: ['⏚', 'B', 'A', '+12'], ico: d.ico,
          title: d.title, sub: d.sub, chain: i > 0
        });
      });
    }

    var boilers = (tc.boilers || []).slice(0, 2);
    boilers.forEach(function (b, i) {
      var gas = b.kind === 'gas';
      var dev = {
        ico: function (a, c, s) { return icoBoiler(a, c, s, gas); },
        title: 'Котёл ' + (i + 1) + ' — ' + (gas ? 'газовый' : 'электрический'),
        sub: cut(nm['boiler' + i] || '', 20)
      };
      if (b.iface === 'digital') topR.push({
        blk: T[i === 0 ? 'csh1' : 'csh2'], wires: [CBUS, CBUS2], clamps: ['A', 'B'],
        // Плата цифровых шин — отдельная позиция сметы (одна на котёл),
        // поэтому она нарисована прибором в разрыве шины, а не упомянута
        // текстом: по схеме должно быть видно, что её надо купить и куда
        // поставить.
        inline: 'Плата ЦШ',
        ico: dev.ico, title: dev.title, sub: dev.sub || 'цифровая шина (OpenTherm/E-Bus)'
      });
      else botR.push({
        blk: B[i === 0 ? 'rel1' : 'rel2'], wires: [CCLOSE, '#6B7280'], clamps: ['T', 'T'],
        ico: dev.ico, title: dev.title, sub: (dev.sub ? dev.sub + ' · ' : '') + 'клеммы термостата'
      });
    });

    (tc.circuits || []).slice(0, 3).forEach(function (c, i) {
      var mix = c.type === 'mix', kind = c.src === 'ufh' ? 'тёплый пол' : 'радиаторы';
      var grp = cut(mix ? (nm.mixGroup || 'насосная группа со смесителем') : (nm.dirGroup || 'прямая насосная группа'), 32);
      botL.push({
        blk: B[['ko1p', 'ko2p', 'ko3p'][i]], wires: [CL, CN], clamps: ['L', 'N', '⏚'], pe: true,
        ico: icoPump, title: 'Насос ' + c.name + ' — ' + kind, sub: grp
      });
      if (mix) botL.push({
        blk: B[['ko1m', 'ko2m', 'ko3m'][i]], wires: [COPEN, CCLOSE, CN], clamps: ['◄', '►', 'N', '⏚'], pe: true,
        ico: icoServo, title: 'Сервопривод смесителя ' + c.name, sub: 'на той же насосной группе'
      });
    });
    if (tc.dhw === 'boiler') botR.push({
      blk: B.dhwrc, wires: [CL, CN], clamps: ['L', 'N', '⏚'], pe: true,
      ico: icoPump, title: 'Насос загрузки бойлера', sub: cut(nm.dhwPump || 'из обвязки бойлера', 34)
    });
    if (tc.recirc) botR.push({
      blk: B.dhwcn, wires: [CL, CN], clamps: ['L', 'N', '⏚'], pe: true,
      ico: icoPump, title: 'Насос рециркуляции ГВС', sub: cut(nm.recircPump || 'линия Т4', 34)
    });
    if (tc.leakQty > 0 && tc.leakValve) botR.push({
      blk: B.leak, wires: [CL], clamps: ['L', 'N', '⏚'], pe: true, nStub: true, jumper: true,
      ico: icoValveAct, title: 'Кран защиты от протечки',
      sub: tc.leakSolenoid ? cut(nm.leakValve || 'соленоидный клапан 230 В', 34)
        : 'кран зональный + сервопривод (комплект)'
    });
    botR.push({
      blk: B.pwr, wires: [CL, CN], clamps: ['L', 'N'], ico: icoBreaker,
      title: 'Питание ~220 В, 50 Гц', sub: 'через автоматический выключатель C10'
    });

    // ── этажи: чем левее клемма, тем ближе этаж (справа — зеркально) ──
    topL.sort(function (a, b) { return a.blk.cx - b.blk.cx; });
    botL.sort(function (a, b) { return a.blk.cx - b.blk.cx; });
    topR.sort(function (a, b) { return b.blk.cx - a.blk.cx; });
    botR.sort(function (a, b) { return b.blk.cx - a.blk.cx; });
    var nTop = Math.max(topL.length, topR.length, 1);
    var nBot = Math.max(botL.length, botR.length, 1);

    var CY = 26 + (nTop - 1) * LS;
    var CB = CY + CH;
    // Автоматика тёплого пола вынесена на свой лист (ufhScheme): это
    // отдельная система, и в смете её картинка стоит над разделом 4.3.
    // Здесь остаётся только метка «А» — ссылка на неё у клемм термостатов.
    var ufh = items.ufh && (items.ufh.blocks || items.ufh.stats) ? items.ufh : null;
    var H = CB + 12 + (nBot - 1) * LS + 44;

    o.push(txt(W / 2, 8.4, 'Схема подключения автоматики котельной — STOUT Thermatic 3001',
      { size: 4.4, anchor: 'middle', weight: 'bold' }));

    // ── корпус прибора: плоский вид с лицевой панели ──
    // Рисуется ДО жил: жила должна доходить до самой клеммы, а клеммные
    // ряды рисуются последними и накрывают её торец — как на реальном щите.
    o.push(rrect(CX, CY, CW, CH, 2.4, { f: FACE, c: '#94A3B8', w: 0.6 }));
    // Лицевая панель — по внешнему виду прибора: слева шильдик, справа
    // утопленный модуль экрана с кнопками. Всё держится выше CY+36: ниже
    // идут вертикальные подписи силовых клемм.
    var fx = CX + 3, fy = CY + 10.6, fw = CW - 6, fh = CH - 21;
    o.push(rrect(fx, fy, fw, fh, 2.2, { f: FACE2, c: '#CBD5E1', w: 0.4 }));
    // шильдик: по фотографии — 14 % ширины от левого края, 36 % высоты
    o.push(txt(fx + fw * 0.06, fy + fh * 0.30, 'STOUT Thermatic 3001', { size: 6.4, fill: '#6B7280' }));

    // ── модуль экрана: 41 % ширины и 54 % высоты панели, поднят кверху ──
    var dw = fw * 0.41, dh = fh * 0.54, dx = fx + fw - dw - fw * 0.025, dy = fy + fh * 0.07;
    o.push(rrect(dx, dy, dw, dh, 1.6, { f: '#EDEFF2', c: '#B9C2CC', w: 0.45 }));
    // экран — 65 % модуля по ширине, отношение сторон ≈ 1,5:1 как на приборе
    var sw = dw * 0.655, sh = dh - dh * 0.16, sx = dx + dw * 0.028, sy = dy + dh * 0.08;
    o.push(rrect(sx, sy, sw, sh, 0.8, { f: '#fff', c: '#8A94A0', w: 0.45 }));
    // доли экрана — чтобы содержимое масштабировалось вместе с ним
    function px(f) { return sx + sw * f; }
    function py(f) { return sy + sh * f; }
    // строка состояния — тёмная полоса, как на приборе
    o.push(rrect(sx, sy, sw, sh * 0.155, 0.8, { f: '#3A4A63' }));
    o.push(rrect(sx, sy + sh * 0.08, sw, sh * 0.075, 0, { f: '#3A4A63' }));
    o.push(txt(px(0.04), py(0.115), '+12°', { size: sh * 0.075, fill: '#E2E8F0' }));
    o.push(txt(px(0.96), py(0.115), '15:30', { size: sh * 0.075, anchor: 'end', fill: '#E2E8F0' }));
    [0, 1, 2].forEach(function (i) {
      o.push(rrect(px(0.76) + i * sh * 0.05, py(0.115) - sh * 0.03 - i * sh * 0.018,
        sh * 0.03, sh * 0.045 + i * sh * 0.018, 0.15, { f: '#E2E8F0' }));
    });
    // пламя работы котла и текущая температура
    var flx = px(0.09), fly = py(0.46), flr = sh * 0.12;
    o.push(path('M' + n(flx) + ',' + n(fly - flr) +
      ' C' + n(flx + flr * 0.85) + ',' + n(fly) + ' ' + n(flx + flr * 0.7) + ',' + n(fly + flr * 0.85) + ' ' + n(flx) + ',' + n(fly + flr) +
      ' C' + n(flx - flr * 0.7) + ',' + n(fly + flr * 0.85) + ' ' + n(flx - flr * 0.85) + ',' + n(fly) + ' ' + n(flx) + ',' + n(fly - flr) + ' Z',
      { f: '#F97316' }));
    o.push(txt(px(0.15), py(0.58), '18°', { size: sh * 0.30, fill: '#1D4ED8' }));
    // стрелки прижаты к самому числу: ниже них идёт строка способа
    // регулирования, и на прежних местах они с ней перекрывались
    o.push(pline([[px(0.26), py(0.34)], [px(0.34), py(0.34)], [px(0.30), py(0.27)]], { f: '#94A3B8', c: 'none' }));
    o.push(pline([[px(0.26), py(0.63)], [px(0.34), py(0.63)], [px(0.30), py(0.70)]], { f: '#94A3B8', c: 'none' }));
    // расписание
    o.push(rrect(px(0.44), py(0.30), sh * 0.13, sh * 0.13, 0.4, { f: '#fff', c: '#64748B', w: 0.35 }));
    o.push(ln(px(0.44), py(0.30) + sh * 0.04, px(0.44) + sh * 0.13, py(0.30) + sh * 0.04, { c: '#64748B', w: 0.35 }));
    o.push(txt(px(0.51), py(0.58), 'Расписание', { size: sh * 0.075, anchor: 'middle', fill: '#64748B' }));
    // Способ терморегулирования выбранного контура — он же в «ПОЛЕ КОНТУРА»
    // на приборе. Единственная величина режима, которая выводится из сметы:
    // куплен на контур комнатный прибор — значит по воздуху.
    var c0m = (tc.circuits || [])[0];
    if (c0m) o.push(txt(px(0.50), py(0.79), 'регулирование ' + (c0m.byAir ? 'по воздуху' : 'по теплоносителю'),
      { size: sh * 0.07, anchor: 'middle', fill: '#64748B' }));
    // домик уставки
    // Уставка стоит слева от стойки домика, как на приборе: раньше текст
    // «24°» центрировался правее и перечёркивался этой стойкой.
    var hx = px(0.76), hy = py(0.48), hw = sw * 0.15, hh = sh * 0.22;
    o.push(pline([[hx - hw, hy], [hx, hy - hh], [hx + hw, hy]], { c: '#F5B700', w: sh * 0.05 }));
    o.push(ln(hx + hw * 0.72, hy - hh * 0.05, hx + hw * 0.72, hy + hh * 0.8, { c: '#F5B700', w: sh * 0.05 }));
    o.push(txt(hx - hw * 0.18, hy + hh * 0.62, '24°', { size: sh * 0.155, anchor: 'middle', fill: '#334155' }));
    // Нижняя строка — «СТРОКА КОНТУРА» (техдокументация, стр. 23): показывает
    // ВЫБРАННЫЙ контур, стрелки переключают между ними. Берём первый контур
    // из сметы, чтобы экран отвечал конфигурации, а не был картинкой.
    var scrLabel = 'Отопление';
    if ((tc.circuits || []).length) {
      var c0 = tc.circuits[0];
      scrLabel = c0.name + ' ' + (c0.src === 'ufh' ? 'Тёплый пол' : 'Радиаторы');
    } else if (tc.dhw === 'boiler' || tc.dhw === 'boiler_ct') scrLabel = 'ГВС';
    o.push(rrect(px(0.02), py(0.845), sw * 0.96, sh * 0.13, 0.5, { f: '#1E6FD9' }));
    o.push(txt(px(0.5), py(0.94), '◄  ' + scrLabel + '  ►', { size: sh * 0.095, anchor: 'middle', fill: '#fff' }));

    // ── кнопки справа от экрана: две клавиши, круглый навипад, две клавиши ──
    var bzx = sx + sw, bzw = dx + dw - bzx;              // поле под кнопки
    var bw2 = bzw * 0.42, bh2 = dh * 0.15, bgap2 = bzw * 0.08;
    var bx0 = bzx + (bzw - bw2 * 2 - bgap2) / 2, bx1 = bx0 + bw2 + bgap2;
    var byT = dy + dh * 0.08, byB = dy + dh - dh * 0.08 - bh2;
    function keycap(x, y) {
      return rrect(x, y, bw2, bh2, bh2 * 0.28, { f: '#F8FAFC', c: '#9AA3AD', w: 0.35 });
    }
    o.push(keycap(bx0, byT));
    // «Назад» — контуром: глифа стрелки в чертёжном шрифте нет
    var rax = bx0 + bw2 / 2, ray = byT + bh2 / 2, rs = bh2 * 0.3;
    o.push(seg([[rax + rs * 1.2, ray - rs * 0.8], [rax - rs * 0.6, ray - rs * 0.8], [rax - rs * 0.6, ray + rs * 0.3]], '#64748B', 0.4));
    o.push(pline([[rax - rs * 1.3, ray + rs * 0.3], [rax + rs * 0.1, ray + rs * 0.3], [rax - rs * 0.6, ray + rs * 1.4]],
      { f: '#64748B', c: 'none', close: true }));
    o.push(keycap(bx1, byT));
    o.push(txt(bx1 + bw2 / 2, byT + bh2 * 0.68, 'OK', { size: bh2 * 0.52, anchor: 'middle', fill: '#64748B' }));
    // навигационная площадка
    var nx = (bx0 + bx1 + bw2) / 2, ny = dy + dh / 2, nr = dh * 0.215;
    o.push(circle(nx, ny, nr, { f: '#F8FAFC', c: '#9AA3AD', w: 0.35 }));
    // разрезы на четыре лепестка — площадка на приборе именно такая
    [45, 135, 225, 315].forEach(function (a3) {
      var r3 = a3 * Math.PI / 180;
      o.push(ln(nx + Math.cos(r3) * nr * 0.34, ny + Math.sin(r3) * nr * 0.34,
        nx + Math.cos(r3) * nr, ny + Math.sin(r3) * nr, { c: '#C7CDD4', w: 0.35 }));
    });
    o.push(circle(nx, ny, nr * 0.28, { f: '#fff', c: '#C7CDD4', w: 0.3 }));
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d2) {
      var a1 = nx + d2[0] * nr * 0.6, b1 = ny + d2[1] * nr * 0.6, t2 = nr * 0.24;
      o.push(pline([[a1 - (d2[1] ? t2 : 0), b1 - (d2[0] ? t2 : 0)],
        [a1 + (d2[1] ? t2 : 0), b1 + (d2[0] ? t2 : 0)],
        [a1 + d2[0] * t2 * 1.2, b1 + d2[1] * t2 * 1.2]], { f: '#94A3B8', c: 'none', close: true }));
    });
    o.push(keycap(bx0, byB));
    o.push(txt(bx0 + bw2 / 2, byB + bh2 * 0.64, 'MODE', { size: bh2 * 0.36, anchor: 'middle', fill: '#64748B' }));
    o.push(keycap(bx1, byB));
    [0, 1, 2].forEach(function (i) {
      o.push(ln(bx1 + bw2 * 0.22, byB + bh2 * 0.3 + i * bh2 * 0.2,
        bx1 + bw2 * 0.78, byB + bh2 * 0.3 + i * bh2 * 0.2, { c: '#64748B', w: 0.35 }));
    });
    // Вентиляционная решётка — под экраном, как на приборе: утопленная
    // рамка с 14 овальными прорезями (пересчитано по рендеру прибора из
    // техдокументации). Это именно вентиляция корпуса, а не индикаторы:
    // раздел «Внешний вид, назначение выключателей и символов на экране»
    // перечисляет только клавиши и символы дисплея, светящихся элементов
    // на корпусе у прибора нет.
    // левый край решётки выровнен по левому краю экрана, как на приборе
    var vx = sx, vh = fh * 0.075, vw = dx + dw - sx, vy = fy + fh * 0.70;
    o.push(rrect(vx, vy, vw, vh, vh / 2, { f: FACE2, c: '#B9C2CC', w: 0.4 }));
    var vn = 14, vstep = (vw - vh * 1.4) / vn;
    for (var vd = 0; vd < vn; vd++) {
      o.push(rrect(vx + vh * 0.7 + vd * vstep + vstep * 0.15, vy + vh * 0.28,
        vstep * 0.62, vh * 0.44, vh * 0.22, { f: '#fff', c: '#B9C2CC', w: 0.3 }));
    }

    // ── жгуты ──
    function drawSide(list, edge, side) {
      list.forEach(function (d, i) {
        var lane = edge === 'top' ? CY - 12 - i * LS : CB + 12 + i * LS;
        // жила доходит до центра клеммы своего ряда
        var y0 = edge === 'top' ? CY + 5.4 : CB - 5.4;
        var dx = side < 0 ? DXL : DXR;
        var cl = d.clamps || [];
        var M = cl.length;
        d.lane = lane;
        // Жила k идёт из k-й клеммы прибора строго в k-ю клемму потребителя:
        // её горизонталь стоит ровно на высоте своей клеммы (шаг тот же P),
        // поэтому Г-образные трассы жгута остаются параллельными, а конец
        // жилы приходит точно в клемму, а не рядом с ней.
        for (var k = 0; k < d.wires.length; k++) {
          var off = (k - (M - 1) / 2) * P;
          // clampOffset — если на одном блоке несколько независимых пар
          // («Входы термостатов»: три входа по две клеммы)
          var cxw = d.blk.x + P / 2 + ((d.clampOffset || 0) + k) * P;
          var yw = lane + off;                     // высота своей клеммы
          o.push(seg([[cxw, y0], [cxw, yw], [dx - side * 2.4, yw]], d.wires[k], 0.55));
          o.push(circle(cxw, y0, 0.75, { f: d.wires[k] }));
        }
        used[d.blk.k] = true;
        // прибор, стоящий В РАЗРЫВЕ жгута (плата цифровых шин): рисуется
        // поверх уже проложенных жил — они входят в него слева и выходят справа
        if (d.inline) {
          var mxc = side < 0 ? (DXL + CX) / 2 : (CX + CW + DXR) / 2;
          var mw = 19, mh = M * P + 5.4;
          o.push(rrect(mxc - mw / 2, lane - mh / 2, mw, mh, 1.2, { f: FACE2, c: INK, w: 0.5 }));
          o.push(rrect(mxc - mw / 2 + 2.4, lane - mh / 2 + 1.6, mw - 4.8, 2, 0.4, { f: '#CBD5E1' }));
          for (var g = 0; g < M; g++) {
            o.push(circle(mxc - mw / 2 + 2.2, lane + (g - (M - 1) / 2) * P, 0.7, { f: '#fff', c: INK, w: 0.3 }));
            o.push(circle(mxc + mw / 2 - 2.2, lane + (g - (M - 1) / 2) * P, 0.7, { f: '#fff', c: INK, w: 0.3 }));
          }
          o.push(txt(mxc, lane + mh / 2 + 2.8, d.inline, { size: 2, anchor: 'middle' }));
        }
        // колодка потребителя, значок и подписи
        o.push(vstrip(dx, lane, cl, side));
        var icx = side < 0 ? ICL : ICR;
        o.push(seg([[icx - side * ICO * 0.5, lane], [dx + side * 2.4, lane]], INK, 0.4, '1 1'));
        o.push(d.ico(icx, lane, ICO));
        var tx2 = side < 0 ? icx - ICO * 0.55 - 4 : icx + ICO * 0.55 + 4;
        var an = side < 0 ? 'end' : 'start';
        o.push(txt(tx2, lane - 1.2, d.title, { size: 2.4, anchor: an, weight: 'bold' }));
        if (d.sub) o.push(txt(tx2, lane + 2.2, d.sub, { size: 2.1, anchor: an }));
        // Клеммы, к которым идёт не контроллер, а шины щита: N (там, где
        // контроллер даёт только коммутируемую фазу) и PE. Показываем
        // короткими отводами наружу — тянуть их через весь лист от вводного
        // автомата значило бы перечеркнуть схему.
        if (d.nStub) {
          var ny = lane + (d.wires.length - (M - 1) / 2) * P;
          o.push(seg([[dx - side * 2.4, ny], [dx - side * 8, ny]], CN, 0.55));
          o.push(txt(dx - side * 9, ny + 0.7, 'N щита', { size: 1.8, anchor: side > 0 ? 'end' : 'start' }));
        }
        if (d.pe) {
          var pey = lane + (M - 1) / 2 * P;
          o.push(peSeg([[dx, pey], [dx, pey + 2.2]]));
          o.push(gndSym(dx, pey + 2.2));
        }
      });
    }
    drawSide(topL, 'top', -1); drawSide(topR, 'top', 1);
    drawSide(botL, 'bot', -1); drawSide(botR, 'bot', 1);

    // перемычка «Общ ← L» для реле крана протечки
    var jm = botR.filter(function (d) { return d.jumper; })[0];
    if (jm) {
      var jy = CB + 6.5;
      o.push(seg([[B.leak.x + P * 1.5, CB - 5.4], [B.leak.x + P * 1.5, jy], [B.pwr.x + P / 2, jy], [B.pwr.x + P / 2, CB - 5.4]], CL, 0.55));
      o.push(txt((B.leak.x + B.pwr.x) / 2, jy + 2.4, 'перемычка «Общ» ← L', { size: 1.9, anchor: 'middle' }));
    }

    // ── Таблица контуров: что за контур, на каких он клеммах и как
    // регулируется. Ставится в свободное поле слева от прибора — полоса
    // между верхними и нижними выносками там пустая на всю высоту корпуса.
    (function () {
      var rw = [];
      (tc.circuits || []).forEach(function (c, i) {
        var term = c.type === 'mix'
          ? '«' + c.name + ' Насос» + «' + c.name + ' Смеситель»'
          : '«' + c.name + ' Насос»';
        if (i >= 3) term = 'на блоке расширения EX';
        rw.push({
          t: c.name + ' · ' + (c.src === 'ufh' ? 'Тёплый пол' : 'Радиаторы'),
          s: term + ' · ' + (c.byAir ? 'по воздуху' : 'по теплоносителю')
        });
      });
      if (tc.dhw === 'boiler') rw.push({ t: 'ГВС · загрузка бойлера', s: '«ГВС РЦ» · по датчику «Бойлер»' });
      else if (tc.dhw === 'boiler_ct') rw.push({ t: 'ГВС · через котёл', s: 'уставку котлу задаёт цифровая шина' });
      if (tc.recirc) rw.push({ t: 'ГВС · рециркуляция', s: '«ГВС ЦН» · по режиму «Комфорт»' });
      (tc.boilers || []).slice(0, 2).forEach(function (b, i) {
        rw.push({
          t: 'Котёл ' + (i + 1) + ' · ' + (b.kind === 'gas' ? 'газовый' : 'электрический'),
          s: b.iface === 'digital' ? '«ЦШ' + (i + 1) + '» · цифровая шина' : '«Реле котёл ' + (i + 1) + '» · сухой контакт'
        });
      });
      if (!rw.length) return;
      var tw = 96, th = 6.4 + rw.length * 8.2, tx0 = 6, ty0 = CY + (CH - th) / 2;
      o.push(rrect(tx0, ty0, tw, th, 1.6, { f: '#F8FAFC', c: '#CBD5E1', w: 0.4 }));
      o.push(txt(tx0 + 3, ty0 + 4.6, 'Контуры контроллера', { size: 2.6, weight: 'bold' }));
      o.push(ln(tx0 + 3, ty0 + 6, tx0 + tw - 3, ty0 + 6, { c: '#CBD5E1', w: 0.3 }));
      rw.forEach(function (r, i) {
        var ry2 = ty0 + 10.6 + i * 8.2;
        o.push(txt(tx0 + 3, ry2, r.t, { size: 2.4, weight: 'bold' }));
        o.push(txt(tx0 + 3, ry2 + 3.4, r.s, { size: 2.2, fill: '#475569' }));
      });
    })();

    // При автоматике ТП «Входы термостатов» задействованы: на них приходит
    // запрос тепла с коммутационного блока (сам блок — в полосе внизу листа).
    if (ufh && ufh.ko) {
      used.thr = true;
      // Метка «А» — та же, что у сухого контакта планки ТП внизу листа:
      // связь между двумя системами показана ссылкой, а не жилой через
      // весь чертёж, иначе она перечеркнула бы всю схему по диагонали.
      var thrX = T.thr.x + P * 1.5;
      o.push(seg([[thrX, CY + 5.4], [thrX, CY - 4]], CCLOSE, 0.6));
      o.push(circle(thrX, CY - 6.6, 2.6, { f: '#fff', c: CCLOSE, w: 0.5 }));
      o.push(txt(thrX, CY - 5.7, 'А', { size: 2.6, anchor: 'middle', weight: 'bold' }));
      o.push(txt(thrX + 4, CY - 5.9, 'запрос тепла от планки ТП', { size: 2.1 }));
    }

    // клеммные ряды — поверх жил
    function strip(list, y, labelBelow) {
      list.forEach(function (b) {
        var on = !!used[b.k];
        o.push(rrect(b.x, y, b.n * P, 6.4, 0.7, { f: on ? b.c : '#E2E8F0', c: on ? '#0F172A' : '#94A3B8', w: on ? 0.45 : 0.3 }));
        if (b.jack) {
          // гнездо RJ45: корпус с язычком, а не винтовые клеммы
          o.push(rrect(b.x + 1, y + 1.2, b.n * P - 2, 4, 0.4, { f: '#fff', c: '#94A3B8', w: 0.35 }));
          o.push(rrect(b.x + b.n * P / 2 - 0.9, y + 0.4, 1.8, 1.4, 0.2, { f: '#fff', c: '#94A3B8', w: 0.3 }));
        } else for (var i = 0; i < b.n; i++) {
          var cxx = b.x + P / 2 + i * P;
          o.push(circle(cxx, y + 3.2, 0.95, { f: '#fff', c: '#334155', w: 0.3 }));
          o.push(ln(cxx - 0.55, y + 3.2, cxx + 0.55, y + 3.2, { c: '#334155', w: 0.3 }));
        }
        var col = on ? '#0F172A' : '#94A3B8';
        // Названия силовых клемм длиннее своих колодок («КО-1 Смеситель» —
        // 15 мм против 9.6 мм) и горизонтально наезжали на соседние. Ставим
        // их вертикально в поле лицевой панели, как на щитовых приборах.
        if (labelBelow) o.push(txt(b.cx, y + 9.4, b.t, { size: 1.85, anchor: 'middle', fill: col }));
        else o.push(txt(b.cx + 0.7, y - 1.6, b.t, { size: 1.85, rotate: -90, fill: col }));
      });
    }
    strip(TOP, CY + 2.2, true);
    strip(BOT, CY + CH - 8.6, false);

    // ── автоматика тёплого пола (раздел 4.3 сметы) ──
    // ── легенда жил ──
    var lg = [[CL, 'L — фаза (коммутирует реле контроллера)'], [CN, 'N — нейтраль'],
      [null, 'PE — на шину заземления щита'], [CSIG, 'датчики NTC (пара, полярности нет)'],
      [CRS[2], 'RS-485 (⏚ B A +12В)'], [CBUS, 'цифровая шина котла'],
      [COPEN, 'смеситель: ◄ открытие'], [CCLOSE, '► закрытие']];
    var lgY = H - 12;
    lg.forEach(function (L, i) {
      var col = i % 4, rw = Math.floor(i / 4);
      var xx = 14 + col * 102, yy = lgY + rw * 5;
      if (L[0] === null) o.push(peSeg([[xx, yy], [xx + 10, yy]]));
      else o.push(seg([[xx, yy], [xx + 10, yy]], L[0], 0.8));
      o.push(txt(xx + 12.5, yy + 1, L[1], { size: 2.1 }));
    });

    return { svg: o.join(''), w: W, h: H };
  }

  // ─── Схема подключения автоматики тёплого пола (STE-3050) ──────────────
  // Композиция повторяет функциональную схему подключения из паспорта
  // (п. 3.5): термостаты зон сверху, плата посередине, приводы снизу,
  // насос и сухой контакт справа. Расположение клемм — по фотографии платы
  // (стр. 3): ВЕРХНИЙ ряд каждой зоны — клемма управляющего устройства
  // (L / N / «упр», поз. 3), НИЖНИЙ — клемма исполнительных устройств
  // (L N L N, два привода, поз. 2); справа насос (поз. 9), COM/NC/NO
  // (поз. 10) и питание (поз. 11); переключатель задержки (поз. 8) и
  // светодиоды зон (поз. 4) с POWER / BOILER / PUMP (поз. 5–7).
  function ufhScheme(ufh) {
    ufh = ufh || {};
    var o = [], W = 420;
    var INK = '#334155', FACE2 = '#F8FAFC';
    var CL = '#DC2626', CN = '#2563EB', COPEN = '#B45309', CCLOSE = '#1F2937';
    var no = ufh.servoType === 'no', v24 = ufh.servoVolt === 24;

    function seg(pts, c, w, dash) {
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + n(p[0]) + ',' + n(p[1]); }).join(' ');
      return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 0.5) +
        '" stroke-linejoin="round" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
    }
    function cut(s, k) { s = String(s || ''); return s.length > k ? s.slice(0, k - 1) + '…' : s; }
    // комнатный термостат: корпус с экраном, как на схеме паспорта
    function icoStat(cx, cy, s) {
      return rrect(cx - s * 0.44, cy - s * 0.44, s * 0.88, s * 0.88, 1, { f: '#fff', c: INK, w: 0.5 }) +
        rrect(cx - s * 0.32, cy - s * 0.30, s * 0.64, s * 0.42, 0.5, { f: '#DBEAFE', c: '#64748B', w: 0.35 }) +
        txt(cx, cy + s * 0.02, '22', { size: s * 0.26, anchor: 'middle', fill: '#1D4ED8' }) +
        circle(cx, cy + s * 0.28, s * 0.06, { f: '#F97316' });
    }
    // термоэлектрический привод: колпачок со штоком
    function icoAct(cx, cy, s) {
      return rrect(cx - s * 0.34, cy - s * 0.40, s * 0.68, s * 0.62, s * 0.16, { f: '#F1F5F9', c: INK, w: 0.5 }) +
        rrect(cx - s * 0.12, cy - s * 0.14, s * 0.24, s * 0.26, 0.3, { f: '#fff', c: INK, w: 0.35 }) +
        rrect(cx - s * 0.2, cy + s * 0.22, s * 0.4, s * 0.16, 0.2, { f: '#CBD5E1', c: INK, w: 0.4 });
    }

    // Раскладка колодок — по фотографии платы (паспорт STE-3050, п. 3.1):
    //   поз. 3 и 2 (зоны) — ВЕРТИКАЛЬНЫЕ, контакты столбиком, 3 и 4 штуки;
    //   поз. 11 INPUT (2), поз. 9 PUMP (2), поз. 10 Com/NC/NO (3) — ГОРИЗОНТАЛЬНЫЕ,
    //   стоят в ряд внизу справа, рядом с ними винт заземления (поз. 1).
    var CP = 2.6, BW = 5.4;
    var HP = 3.2, HH = 5.2;
    function blkH(x, y, nn, on) {
      var s = rrect(x, y, nn * HP + 1.4, HH, 0.6,
        { f: on ? '#27AE60' : '#DCE3EA', c: on ? '#14532D' : '#94A3B8', w: 0.4 });
      for (var i = 0; i < nn; i++) s += circle(x + 0.7 + HP / 2 + i * HP, y + HH / 2, 0.85, { f: '#fff', c: '#334155', w: 0.26 });
      return s;
    }
    function cxh(x, i) { return x + 0.7 + HP / 2 + i * HP; }
    // выноска-номер: связывает участок жил с таблицей кабелей внизу листа
    function mark(x, y, k) {
      return circle(x, y, 2.1, { f: '#fff', c: INK, w: 0.45 }) +
        txt(x, y + 0.8, String(k), { size: 2.3, anchor: 'middle', weight: 'bold' });
    }
    function blkV(x, y, nn, on) {
      var s = rrect(x, y, BW, nn * CP + 1.6, 0.6,
        { f: on ? '#27AE60' : '#DCE3EA', c: on ? '#14532D' : '#94A3B8', w: 0.4 });
      for (var i = 0; i < nn; i++) s += circle(x + BW / 2, y + 0.8 + CP / 2 + i * CP, 0.85, { f: '#fff', c: '#334155', w: 0.26 });
      return s;
    }
    function cyv(y, i) { return y + 0.8 + CP / 2 + i * CP; }
    function labR(x, y, i, L) { return txt(x + BW + 0.9, cyv(y, i) + 0.75, L, { size: 1.9 }); }
    function labL(x, y, i, L) { return txt(x - 0.9, cyv(y, i) + 0.75, L, { size: 1.9, anchor: 'end' }); }

    var zn = 8, zStep = 27, grpW = 50;
    var mw3 = 8 + zn * zStep + 4 + grpW, mx = Math.round((W - mw3) / 2), z0 = mx + 8;
    var my = 62, mh3 = 42;
    var inY = my + 6, outY = my + 24;
    var statCy = my - 16, actCy = my + mh3 + 16;
    var nStat = Math.max(0, Math.min(ufh.stats || 0, zn));
    var nAct = Math.max(0, Math.min(ufh.servos || 0, zn * 2));
    var CLED = no ? '#F59E0B' : '#22C55E';

    o.push(txt(W / 2, 9, 'Схема подключения автоматики тёплого пола — STOUT STE-3050',
      { size: 4.2, anchor: 'middle', weight: 'bold' }));
    o.push(txt(W / 2, 14.4, 'раздел 4.3 сметы · отдельная зональная система 230 В · с контроллером котельной связана одним сухим контактом',
      { size: 2.2, anchor: 'middle', fill: '#475569' }));

    // ── плата ──
    o.push(rrect(mx, my, mw3, mh3, 1.6, { f: FACE2, c: INK, w: 0.55 }));
    // шильдик — над платой справа, где нет ни жил, ни термостатов
    o.push(txt(mx + mw3 - 4, my - 2.5, 'STOUT STE-3050' + (ufh.blocks > 1 ? '  × ' + ufh.blocks : '') +
      ' · 8 зон · 230 В · до 10 А', { size: 2.5, anchor: 'end', weight: 'bold' }));

    for (var z = 0; z < zn; z++) {
      var zx = z0 + z * zStep, bx = zx + 9, live = z < nStat;
      o.push(blkV(bx, inY, 3, live));
      o.push(blkV(bx, outY, 4, z * 2 < nAct));
      o.push(circle(bx + BW / 2, my + 3, 0.8, { f: live ? CLED : '#CBD5E1' }));
      o.push(txt(bx + BW / 2, my + 20.4, 'зона ' + (z + 1),
        { size: 1.8, anchor: 'middle', fill: live ? '#0F172A' : '#94A3B8' }));
      if (z === 0) {
        // подписи контактов — только там, где жилы не проходят
        ['L', 'N', 'упр'].forEach(function (L, i) { o.push(labR(bx, inY, i, L)); });
        o.push(labR(bx, outY, 0, 'L')); o.push(labR(bx, outY, 1, 'N'));
        o.push(labL(bx, outY, 2, 'L')); o.push(labL(bx, outY, 3, 'N'));
      }
      // термостат зоны — над своей колодкой, три жилы сбоку, каждая в свой контакт
      if (live) {
        o.push(icoStat(zx + 5, statCy, 13));
        o.push(txt(zx + 5, statCy + 9.4, String(z + 1), { size: 1.9, anchor: 'middle' }));
        // ближняя к колодке жила идёт в верхний контакт — пересечений нет
        [[CL, 0, zx + 7.5], [CN, 1, zx + 5], [COPEN, 2, zx + 2.5]].forEach(function (wr) {
          o.push(seg([[wr[2], statCy + 6], [wr[2], cyv(inY, wr[1])], [bx, cyv(inY, wr[1])]], wr[0], 0.5));
        });
      }
      // приводы зоны: пара контактов 1-2 — влево, пара 3-4 — вправо
      if (nAct > z * 2) {
        o.push(icoAct(zx + 4, actCy, 8.5));
        o.push(seg([[bx, cyv(outY, 0)], [zx + 2.5, cyv(outY, 0)], [zx + 2.5, actCy - 3.4]], CL, 0.5));
        o.push(seg([[bx, cyv(outY, 1)], [zx + 5.5, cyv(outY, 1)], [zx + 5.5, actCy - 3.4]], CN, 0.5));
      }
      if (nAct > z * 2 + 1) {
        o.push(icoAct(zx + 20.5, actCy, 8.5));
        o.push(seg([[bx + BW, cyv(outY, 2)], [zx + 22, cyv(outY, 2)], [zx + 22, actCy - 3.4]], CL, 0.5));
        o.push(seg([[bx + BW, cyv(outY, 3)], [zx + 19, cyv(outY, 3)], [zx + 19, actCy - 3.4]], CN, 0.5));
      }
    }

    // ── правая группа: ряд горизонтальных колодок внизу, как на плате ──
    var rx = z0 + zn * zStep + 4;
    var pwX = rx, pmX = rx + 11, dryX = rx + 22, gndX = rx + 38, gy = my + 31;
    o.push(blkH(pwX, gy, 2, true));
    o.push(blkH(pmX, gy, 2, true));
    o.push(blkH(dryX, gy, 3, true));
    // винт заземления (поз. 1)
    o.push(circle(gndX, gy + HH / 2, 1.6, { f: '#DCE3EA', c: '#14532D', w: 0.5 }));
    o.push(seg([[gndX - 1.1, gy + HH / 2], [gndX + 1.1, gy + HH / 2]], '#14532D', 0.4));
    o.push(seg([[gndX - 0.6, gy + HH / 2 + 0.7], [gndX + 0.6, gy + HH / 2 + 0.7]], '#14532D', 0.4));
    // подписи контактов — там, где нет жил: у питания и сухого контакта снизу, у насоса сверху
    ['L', 'N'].forEach(function (L, i) { o.push(txt(cxh(pwX, i), gy + HH + 2.4, L, { size: 1.7, anchor: 'middle' })); });
    ['L', 'N'].forEach(function (L, i) { o.push(txt(cxh(pmX, i), gy - 1.2, L, { size: 1.7, anchor: 'middle' })); });
    ['COM', 'NC', 'NO'].forEach(function (L, i) { o.push(txt(cxh(dryX, i), gy + HH + 2.4, L, { size: 1.5, anchor: 'middle' })); });
    o.push(txt(gndX, gy + HH + 2.4, '⏚', { size: 1.7, anchor: 'middle' }));
    // названия колодок — тремя строками, чтобы не наезжали друг на друга
    o.push(txt(pwX, my + 20, 'Питание 230 В (поз. 11)', { size: 1.9 }));
    o.push(txt(pmX, my + 23.6, 'Насос (поз. 9)', { size: 1.9 }));
    o.push(txt(dryX + 6, my + 27.2, 'Сухой контакт (поз. 10)', { size: 1.9 }));
    o.push(txt(gndX + 3, my + 41, 'земля (поз. 1)', { size: 1.7, anchor: 'end' }));
    // переключатель задержки (поз. 8) и светодиоды платы
    o.push(rrect(rx, my + 8, 18, 5, 0.6, { f: '#fff', c: INK, w: 0.4 }));
    o.push(txt(rx + 9, my + 11.4, '30/45/60/120 с', { size: 1.6, anchor: 'middle' }));
    o.push(txt(rx + 19, my + 11.7, 'задержка (поз. 8)', { size: 1.8 }));
    [['POWER', '#22C55E'], ['BOILER', '#F59E0B'], ['PUMP', '#22C55E']].forEach(function (L, i) {
      o.push(circle(rx + i * 14, my + 3, 0.8, { f: L[1] }));
      o.push(txt(rx + 1.6 + i * 14, my + 3.8, L[0], { size: 1.5 }));
    });

    // ── насос: жилы вниз из-под колодки и вправо к насосу ──
    o.push(seg([[cxh(pmX, 1), gy + HH], [cxh(pmX, 1), my + 46], [mx + mw3 + 12, my + 46]], CN, 0.5));
    o.push(seg([[cxh(pmX, 0), gy + HH], [cxh(pmX, 0), my + 49.5], [mx + mw3 + 12, my + 49.5]], CL, 0.5));
    o.push(seg([[mx + mw3 + 12, my + 46], [mx + mw3 + 12, my + 49.5]], INK, 0.4));
    // УГО насоса — то же, что на принципиальной схеме: круг с треугольником
    // по направлению потока, а не безымянный кружок
    o.push(seg([[mx + mw3 + 12, my + 47.75], [mx + mw3 + 13.1, my + 47.75]], INK, 0.5));
    o.push(pump(mx + mw3 + 16, my + 47.75, 'right'));
    o.push(txt(mx + mw3 + 21, my + 47, 'Насос группы ТП', { size: 2.0 }));
    o.push(txt(mx + mw3 + 21, my + 50.4, '— вариант Б', { size: 2.0, fill: '#475569' }));

    // ── сухой контакт COM + NC: перемычкой вверх и влево к метке А ──
    var qx = rx - 4, qm = (cxh(dryX, 0) + cxh(dryX, 1)) / 2;
    o.push(seg([[cxh(dryX, 0), gy], [cxh(dryX, 0), my + 29.5], [cxh(dryX, 1), my + 29.5], [cxh(dryX, 1), gy]], CCLOSE, 0.55));
    o.push(seg([[qm, my + 29.5], [qm, my + 16.5], [qx, my + 16.5], [qx, 28]], CCLOSE, 0.6));
    o.push(circle(qx, 25, 2.6, { f: '#fff', c: CCLOSE, w: 0.5 }));
    o.push(txt(qx, 25.9, 'А', { size: 2.6, anchor: 'middle', weight: 'bold' }));
    o.push(txt(12, 22, 'Сухой контакт COM + NC → метка А на схеме автоматики котельной, клеммы «Входы термостатов»' +
      (ufh.ko ? ', вход контура ' + ufh.ko : '') + '.', { size: 2.1 }));
    o.push(txt(12, 25.4, 'К котлу напрямую он НЕ идёт: котлом управляет Thermatic 3001. Зона активна — контакт размыкается, ' +
      'контур просит тепло (задержка 30…120 с).', { size: 2.1 }));

    // ── выноски кабелей ──
    if (nStat > 0) o.push(mark(z0 - 3, my - 4, 1));
    if (nAct > 0) o.push(mark(z0 - 3, my + 34, 2));
    o.push(mark(pwX - 3.5, gy + HH / 2, 3));
    o.push(mark(mx + mw3 + 6, my + 43.2, 4));
    o.push(mark(qx - 3.5, my + 12, 5));

    // ── подписи рядов и групп: всё в левом поле, жилы не пересекаются ──
    o.push(txt(mx - 4, statCy - 2, 'Термостаты зон × ' + (ufh.stats || 0), { size: 2.3, anchor: 'end', weight: 'bold' }));
    o.push(txt(mx - 4, statCy + 1.4, cut(ufh.statName, 30), { size: 2.0, anchor: 'end' }));
    o.push(txt(mx - 4, statCy + 4.8, ({ mech: 'механический', electronic: 'электронный', touch: 'сенсорный' }[ufh.statCtrl] || 'механический') +
      (ufh.statCurrent ? ', ' + ufh.statCurrent + ' А' : '') + ', по одному на комнату', { size: 2.0, anchor: 'end', fill: '#475569' }));
    o.push(txt(mx - 4, cyv(inY, 1) + 0.7, 'Клеммы управляющих устройств (поз. 3):', { size: 2.0, anchor: 'end', weight: 'bold' }));
    o.push(txt(mx - 4, cyv(inY, 1) + 4.1, '8 зон, в клемме три контакта L / N / «упр»', { size: 2.0, anchor: 'end', fill: '#475569' }));
    o.push(txt(mx - 4, cyv(outY, 1) + 0.7, 'Клеммы исполнительных устройств (поз. 2):', { size: 2.0, anchor: 'end', weight: 'bold' }));
    o.push(txt(mx - 4, cyv(outY, 1) + 4.1, '16 выходов, в клемме L N L N — два привода', { size: 2.0, anchor: 'end', fill: '#475569' }));
    o.push(txt(mx - 4, actCy - 2, 'Сервоприводы петель × ' + (ufh.servos || 0), { size: 2.3, anchor: 'end', weight: 'bold' }));
    o.push(txt(mx - 4, actCy + 1.4, cut(ufh.servoName, 30), { size: 2.0, anchor: 'end' }));
    o.push(txt(mx - 4, actCy + 4.8, (no ? 'НО (нормально открытый)' : 'НЗ (нормально закрытый)') + ', ' +
      (ufh.servoVolt || 230) + ' В — по смете', { size: 2.0, anchor: 'end', weight: 'bold', fill: no ? '#B45309' : '#0F172A' }));
    if ((ufh.stats || 0) > zn) o.push(txt(mx + mw3 + 21, statCy, 'Зоны сверх восьми — на втором блоке', { size: 2.0, fill: '#B45309' }));

    // ── примечания ──
    var ny = actCy + 16;
    o.push(txt(12, ny, 'Насос группы тёплого пола — один из двух вариантов, оба рабочие:', { size: 2.2, weight: 'bold' }));
    o.push(txt(12, ny + 3.8, 'А. Насос на клемме «' + (ufh.ko || 'КО-1') + ' Насос» контроллера котельной. ' +
      'Планка даёт только запрос тепла; закрылись все зоны — запрос снят, насос останавливает контроллер.', { size: 2.1 }));
    o.push(txt(12, ny + 7.2, 'Б. Насос на клемму «Насос» планки (показана выше) — она отключит его сразу, как закроется ' +
      'последняя зона. Тогда клемма «' + (ufh.ko || 'КО-1') + ' Насос» контроллера свободна.', { size: 2.1 }));
    o.push(txt(12, ny + 10.6, 'Подключать насос к обоим выходам одновременно нельзя.', { size: 2.1, fill: '#475569' }));
    var ny2 = ny + 15;
    o.push(txt(12, ny2, 'Тип сервоприводов в смете — ' + (no ? 'НО, нормально открытые:' : 'НЗ, нормально закрытые:'),
      { size: 2.2, weight: 'bold' })); ny2 += 3.8;
    if (!no) {
      o.push(txt(12, ny2, 'Зона запитана — клапан открывается. Термостат подаёт «управляющую фазу», когда в комнате ' +
        'холодно (контакт нагрева). Светодиод зоны горит при протоке.', { size: 2.1 })); ny2 += 3.8;
    } else {
      o.push(txt(12, ny2, 'Зона запитана — клапан ЗАКРЫВАЕТСЯ. Термостат подключать через обратный контакт ' +
        '(охлаждение): «упр» должна появляться, когда тепло НЕ нужно.', { size: 2.1, fill: '#B45309' })); ny2 += 3.8;
      o.push(txt(12, ny2, 'Индикация зон инверсная — светодиод горит, когда протока нет (паспорт STE-3050, п. 3.3). ' +
        'По той же причине инвертируются насос и сухой контакт:', { size: 2.1, fill: '#B45309' })); ny2 += 3.8;
      o.push(txt(12, ny2, 'запрос тепла уйдёт котлу при закрытых петлях. Для STE-3050 рекомендуются приводы НЗ — ' +
        'замените их в разделе 4.3 сметы.', { size: 2.1, weight: 'bold', fill: '#DC2626' })); ny2 += 3.8;
    }
    if (v24) { o.push(txt(12, ny2, '⚠ Приводы 24 В, а STE-3050 коммутирует 230 В: напрямую подключать нельзя — нужен контроллер на 24 В либо приводы 230 В.', { size: 2.1, weight: 'bold', fill: '#DC2626' })); ny2 += 3.8; }

    // ── кабели: марки и сечения по выноскам 1…5 ──
    ny2 += 1.2;
    o.push(txt(12, ny2, 'Кабели в комплект поставки не входят. Марки и сечения (медь не менее 1,5 мм² — ПУЭ 7, табл. 7.1.1):',
      { size: 2.2, weight: 'bold' })); ny2 += 3.8;
    [
      '1. Термостат зоны → клемма поз. 3 — ВВГнг(А)-LS 3×1,5. Третья жила это «управляющая фаза», её термостат возвращает на плату. Термостату с собственным питанием (электронный, сенсорный) нужны все три жилы; термостату-контакту хватает L и «упр», ноль остаётся свободным.',
      '2. Клемма поз. 2 → сервоприводы — ВВГнг(А)-LS 2×1,5 на каждый привод. Гибкий вывод самого привода наращивают в распаячной коробке, в клемму платы его не заводят.',
      '3. Питание платы (INPUT, поз. 11) — ВВГнг(А)-LS 3×1,5 от отдельного автомата 10 А: суммарная нагрузка платы до 10 А. Защитный проводник — на винт заземления поз. 1.',
      '4. Насос (поз. 9) — ВВГнг(А)-LS 3×1,5 от клеммы насоса до насосной группы тёплого пола (вариант Б).',
      '5. Сухой контакт (поз. 10) → контроллер котельной — экранированный МКЭШ 2×0,5 или UTP. Вести отдельно от силовых линий, пересекать их под 90°, экран и свободные жилы заземлять только со стороны контроллера (паспорт Thermatic 3001).'
    ].forEach(function (L) { o.push(txt(12, ny2, L, { size: 2.1 })); ny2 += 3.4; });
    o.push(txt(12, ny2, 'Метраж по этим пяти позициям посчитан и включён в подраздел 4.3.1 сметы «Провода и кабели (для тёплого пола)».', { size: 2.1, fill: '#475569' })); ny2 += 3.4;

    return { svg: o.join(''), w: W, h: ny2 + 6 };
  }

  /** Готовый лист: рамка + штамп формы 6 + схема. */
  function sheetSvg(cfg, opts) {
    opts = opts || {};
    return window.projectSheets.sheet({
      code: opts.code, sheet: opts.sheet,
      body: build(cfg)
    });
  }

  window.projectScheme = {
    build: build, sheet: sheetSvg, automation: automation, ufhScheme: ufhScheme,
    // отдельные УГО пригодятся будущим листам узлов обвязки
    sym: {
      ballValve: ballValve, checkValve: checkValve, pump: pump, valve3: valve3,
      safetyValve: safetyValve, airVent: airVent, gauge: gauge, filter: filterSym,
      hydroSep: hydroSep, expTank: expTank, boilerUnit: boilerUnit,
      indirectTank: indirectTank, safetyGroup: safetyGroup, arrowSym: arrowSym
    },
    COL: COL
  };
})();
