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
      '" style="stroke:' + (o.c || '#000') + ';stroke-width:' + (o.w || LW.sym) + '"/>';
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

  // ─── Таблица «Условные графические обозначения» (статичная, как в ТМ-2) ─
  function legendTable() {
    var L = 25.07, R = 127.65, S = 39.07, top = 12.35, o = [];
    var cx = (L + S) / 2, tx = (S + R) / 2;
    o.push(pline([[L, top], [R, top], [R, 236.35], [L, 236.35], [L, top]]));
    o.push(ln(S, 22.35, S, 236.35));
    o.push(txt((L + R) / 2, 19.05, 'Условные графические обозначения', { size: SZ.head, anchor: 'middle' }));
    o.push(ln(L, 22.35, R, 22.35));

    var y = 22.35;
    var rows = [
      ['Шаровый кран', function (c) { return ballValve(cx, c, false); }],
      ['Обратный клапан', function (c) { return checkValve(cx, c, 'right'); }],
      ['Циркуляционный насос', function (c) { return pump(cx, c, 'left'); }],
      ['Термостатический смесительный клапан', function (c) { return valve3(cx + 1.21, c, 'therm', 'udr', 'l'); }],
      ['Предохранительный клапан', function (c) { return safetyValve(cx, c, false); }],
      ['Автоматический воздухоотводчик', function (c) { return airVent(cx, c + 3.77); }],
      ['Термометр', function (c) { return gauge(cx, c, 'Т'); }],
      ['Манометр', function (c) { return gauge(cx, c, 'P'); }],
      ['Фильтр', function (c) { return filterSym(cx, c); }],
      ['Соединительное устройство для расширительного бака', function (c) { return expConn(cx, c); }],
      ['Клапан трехходовой с сервоприводом', function (c) { return valve3(cx + 1.21, c, 'servo', 'udr', 'l'); }],
      ['Клапан приоритета бойлера', function (c) { return valve3(cx + 1.21, c, 'prio', 'udr', 'l'); }]
    ];
    rows.forEach(function (r) {
      var y1 = y + 10, c = (y + y1) / 2;
      o.push(r[1](c));
      o.push(txt(tx, c + SZ.txt * 0.35, r[0], { size: SZ.txt, anchor: 'middle' }));
      o.push(ln(L, y1, R, y1));
      y = y1;
    });

    // гидравлический разделитель — ячейка 40 мм, символ по обмеру легенды
    (function () {
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
    })();

    // группа безопасности котла — ячейка 12 мм
    (function () {
      var gy1 = y + 12;
      o.push(safetyGroup(cx, gy1 - 1));
      o.push(txt(tx, (y + gy1) / 2 + SZ.txt * 0.35, 'Группа безопасности котла', { size: SZ.txt, anchor: 'middle' }));
      o.push(ln(L, gy1, R, gy1));
      y = gy1;
    })();

    var marks = [
      ['Т1', 'Подача радиаторного отопления'], ['Т2', 'Обратка радиаторного отопления'],
      ['Т11', 'Подача напольного отопления'], ['Т21', 'Обратка напольного отопления'],
      ['В1', 'Холодное водоснабжение'], ['Т3', 'Горячее водоснабжение'],
      ['Т4', 'Рециркуляция горячего водоснабжения']
    ];
    marks.forEach(function (m) {
      var y1 = y + 6, c = (y + y1) / 2 + SZ.txt * 0.35;
      o.push(txt(cx, c, m[0], { size: SZ.txt, anchor: 'middle' }));
      o.push(txt(tx, c, m[1], { size: SZ.txt, anchor: 'middle' }));
      o.push(ln(L, y1, R, y1));
      y = y1;
    });
    return o.join('');
  }

  // ─── Легенда трубопроводов (низ листа, статичная) ──────────────────────
  function pipeLegend() {
    var o = [];
    o.push(txt(56.3, 253.1, 'Условные обозначения трубопроводов', { size: SZ.head }));
    var rows = [
      [COL.ret, 'обратный трубопровод'],
      [COL.supply, 'подающий трубопровод'],
      [COL.loadR, 'обратный трубопровод загрузки бойлера'],
      [COL.loadS, 'подающий трубопровод загрузки бойлера'],
      [COL.dhw, 'трубопровод горячего водоснабжения'],
      [COL.recirc, 'трубопровод рециркуляции горячего водоснабжения'],
      [COL.cold, 'трубопровод холодного водоснабжения']
    ];
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
    var o = [], dia = cfg.dia || 'Ø25х3,5 мм';
    var hasLoad = !!cfg.indirect;
    var twoCirc = !!(cfg.gas && cfg.gas.circuits === 2 && !hasLoad);

    // Блоки котлов: каскад одинаковых рисуется отдельными блоками, но не
    // больше трёх — левее гребёнке некуда, там таблица УГО. При трёх блоках
    // корпуса компактные (27), кроме блока-носителя ГВС/загрузки (33).
    var blocks = [];
    var gasCount = cfg.gas ? Math.max(1, cfg.gas.count || 1) : 0;
    var elCount = cfg.el ? Math.max(1, cfg.el.count || 1) : 0;
    for (var gi = 0; gi < gasCount; gi++) blocks.push({ kind: 'gas' });
    for (var ei = 0; ei < elCount; ei++) blocks.push({ kind: 'el' });
    if (!blocks.length) blocks.push({ kind: 'el' });
    if (blocks.length > 3) blocks.length = 3;
    var multi = blocks.length > 1;
    var carrierIdx = 0;
    for (var ci = 0; ci < blocks.length; ci++) {
      if (blocks[ci].kind === 'gas') { carrierIdx = ci; break; }
    }
    blocks.forEach(function (b, i) {
      b.carrier = (i === carrierIdx) && (twoCirc || hasLoad);
      b.w = (blocks.length === 3 && !b.carrier) ? 27 : 33;
    });

    o.push(legendTable());
    o.push(pipeLegend());
    o.push(txt(252.2, 17.4, 'Принципиальная схема', { size: SZ.title }));

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
    var edge = 226.9;
    for (var k = blocks.length - 1; k >= 0; k--) {
      bXs[k] = edge - blocks[k].w;
      edge = bXs[k] - gap;
    }
    var mLeft = bXs[0] - 7.1;

    // стрелки и Ø на стояках — в одной полосе, как в эталоне
    var stemArrowDown = mY.supply - 5.15, stemArrowUp = mY.supply - 8.29;
    var stemDiaY = mY.supply - 10.6;

    blocks.forEach(function (b, bi) {
      var kind = b.kind, bx = bXs[bi];
      o.push(boilerUnit(bx, bTop, kind, b.w));
      var xs = b.w === 33 ? bx + 3.03 : bx + 9;
      var xRet = b.carrier ? xs + 27 : xs + 9;

      // подача
      o.push(ln(xs, bBot, xs, bBot + 2.53, { c: COL.supply, w: LW.pipe }));
      o.push(ballValve(xs, bBot + 5.03, true));
      o.push(leaderValve(xs, bBot + 5.03, '3/4"'));
      var ys = bBot + 7.53;
      if (multi) {
        o.push(ln(xs, ys, xs, ys + 1.5, { c: COL.supply, w: LW.pipe }));
        o.push(checkValve(xs, ys + 4, 'down'));
        ys += 6.5;
      }
      o.push(vpipe(xs, ys, mY.supply, COL.supply, others(mY.supply)));
      o.push(diaV(xs, stemDiaY, dia));
      o.push(arrowSym(xs, stemArrowDown, 'down'));

      // обратка: кран + фильтр + кран (+ обратный клапан при двух котлах)
      o.push(ln(xRet, bBot, xRet, bBot + 2.53, { c: COL.ret, w: LW.pipe }));
      o.push(ballValve(xRet, bBot + 5.03, true));
      o.push(leaderValve(xRet, bBot + 5.03, '3/4"'));
      o.push(ln(xRet, bBot + 7.53, xRet, bBot + 9.6, { c: COL.ret, w: LW.pipe }));
      o.push(filterSym(xRet, bBot + 13.14));
      o.push(leaderFilter(xRet, bBot + 13.14, '3/4"'));
      o.push(ln(xRet, bBot + 16.67, xRet, bBot + 18.74, { c: COL.ret, w: LW.pipe }));
      o.push(ballValve(xRet, bBot + 21.24, true));
      o.push(leaderValve(xRet, bBot + 21.24, '3/4"'));
      var yr = bBot + 23.74;
      if (multi) {
        o.push(ln(xRet, yr, xRet, yr + 1.5, { c: COL.ret, w: LW.pipe }));
        o.push(checkValve(xRet, yr + 4, 'up'));
        yr += 6.5;
      }
      o.push(vpipe(xRet, yr, mY.ret, COL.ret, others(mY.ret)));
      o.push(diaV(xRet, stemDiaY, dia));
      o.push(arrowSym(xRet, stemArrowUp, 'up'));

      // двухконтурный газовый: ГВС и ХВС из котла. В эталоне ТМ-2 арматура
      // стоит только на обратке отопления, стояки ГВС/ХВС — сплошные.
      if (b.carrier && twoCirc) {
        var xg = xs + 9, xc = xs + 18;
        o.push(vpipe(xg, bBot, mY.dhw, COL.dhw, others(mY.dhw)));
        o.push(diaV(xg, stemDiaY, dia));
        o.push(arrowSym(xg, stemArrowDown, 'down'));
        o.push(vpipe(xc, bBot, mY.cold, COL.cold, others(mY.cold)));
        o.push(diaV(xc, stemDiaY, dia));
        o.push(arrowSym(xc, stemArrowUp, 'up'));
      }

      // загрузка бойлера — от блока-носителя (первый газовый, иначе первый)
      if (hasLoad && b.carrier) {
        var xls = xs + 9, xlr = xs + 18;
        o.push(ln(xls, bBot, xls, bBot + 2.53, { c: COL.loadS, w: LW.pipe }));
        o.push(ballValve(xls, bBot + 5.03, true));
        o.push(leaderValve(xls, bBot + 5.03, '3/4"'));
        var yl = bBot + 7.53;
        if (cfg.fugas) {
          o.push(ln(xls, yl, xls, yl + 2.2, { c: COL.loadS, w: LW.pipe }));
          o.push(valve3(xls, yl + 4.7, 'prio', 'udl', 'r'));
          o.push(hpipe(xls - 2.5, xls - 6.5, yl + 4.7, COL.supply));
          o.push(vpipe(xls - 6.5, yl + 4.7, mY.supply, COL.supply, []));
          yl += 7.2;
        } else if (cfg.loadPump) {
          o.push(ln(xls, yl, xls, yl + 1.6, { c: COL.loadS, w: LW.pipe }));
          o.push(pump(xls, yl + 4.52, 'down'));
          yl += 7.44;
        }
        o.push(vpipe(xls, yl, mY.loadS, COL.loadS, others(mY.loadS)));
        o.push(diaV(xls, stemDiaY, dia));
        o.push(arrowSym(xls, stemArrowDown, 'down'));
        o.push(ln(xlr, bBot, xlr, bBot + 2.53, { c: COL.loadR, w: LW.pipe }));
        o.push(ballValve(xlr, bBot + 5.03, true));
        o.push(leaderValve(xlr, bBot + 5.03, '3/4"'));
        o.push(vpipe(xlr, bBot + 7.53, mY.loadR, COL.loadR, others(mY.loadR)));
        o.push(diaV(xlr, stemDiaY, dia));
        o.push(arrowSym(xlr, stemArrowUp, 'up'));
      }
    });

    // ── потребители ──
    var taps = [];
    if (cfg.rad !== false) taps.push({ mark: 'Т2', color: COL.ret, from: 'ret', dir: 'up' });
    if (cfg.tp) {
      taps.push({ mark: 'Т21', color: COL.ret, from: 'ret', dir: 'up', mix: true });
      taps.push({ mark: 'Т11', color: COL.supply, from: 'supply', dir: 'down', pump: true });
    }
    if (cfg.rad !== false) taps.push({ mark: 'Т1', color: COL.supply, from: 'supply', dir: 'down', group: !!cfg.hydro });
    if (twoCirc) {
      taps.push({ mark: 'В1', color: COL.cold, from: 'cold', dir: 'up' });
      taps.push({ mark: 'Т3', color: COL.dhw, from: 'dhw', dir: 'down' });
    }

    var tapX0 = 235.13, tapStep = 9;
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
      var loadYs = hasLoad ? [mY.loadS, mY.loadR] : [];
      o.push(vpipe(xd, mY.supply, secPair.supply, COL.supply, [mY.ret].concat(loadYs)));
      o.push(hpipe(hydroX + 4.5, xd, secPair.supply, COL.supply));
      o.push(openArrow(hydroX + 6.4, secPair.supply, 'left', COL.supply));
      o.push(vpipe(xu, mY.ret, secPair.ret, COL.ret, loadYs));
      o.push(hpipe(hydroX + 4.5, xu, secPair.ret, COL.ret));
      o.push(openArrow(xu - 0.8, secPair.ret, 'right', COL.ret));
      o.push(hydroSep(hydroX, 167, cfg.hydro.kw));
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
    taps.forEach(function (t, i) {
      var x = tapX0 + i * tapStep;
      var yStart = srcY[t.from];
      var yTop = bottomValveY - 2.5;
      if (t.mix) {
        // узел ТП: термостатический клапан на обратке (как в ТМ-2),
        // перемычка подмеса вправо в подачу Т11
        var vy = 215.27;
        o.push(vpipe(x, yStart, vy - 2.5, t.color, crossFor(yStart)));
        o.push(valve3(x, vy, 'therm', 'udr', 'l'));
        o.push(leader(x - 0.96, vy - 2.6, '3/4"'));
        o.push(hpipe(x + 2.5, x + tapStep, vy, COL.supply));
        o.push(ln(x, vy + 2.5, x, yTop, { c: t.color, w: LW.pipe }));
      } else if (t.pump) {
        var py = 215.27;
        o.push(vpipe(x, yStart, py, t.color, crossFor(yStart)));
        o.push(ln(x, py, x, py + 4.6, { c: t.color, w: LW.pipe }));
        o.push(ballValve(x, py + 7.1, true));
        o.push(leaderValve(x, py + 7.1, '3/4"'));
        o.push(ln(x, py + 9.6, x, py + 13.24, { c: t.color, w: LW.pipe }));
        o.push(pump(x, py + 16.16, 'down'));
        o.push(ln(x, py + 19.08, x, yTop, { c: t.color, w: LW.pipe }));
      } else if (t.group) {
        // насосная группа радиаторов (при гидрострелке)
        var gy = 212.5;
        o.push(vpipe(x, yStart, gy, t.color, crossFor(yStart)));
        o.push(checkValve(x, gy + 2.5, 'down'));
        o.push(leaderValve(x, gy + 2.5, '3/4"'));
        o.push(ln(x, gy + 5, x, gy + 9.6, { c: t.color, w: LW.pipe }));
        o.push(ballValve(x, gy + 12.1, true));
        o.push(leaderValve(x, gy + 12.1, '3/4"'));
        o.push(ln(x, gy + 14.6, x, gy + 18.24, { c: t.color, w: LW.pipe }));
        o.push(pump(x, gy + 21.16, 'down'));
        o.push(ln(x, gy + 24.08, x, yTop, { c: t.color, w: LW.pipe }));
      } else {
        o.push(vpipe(x, yStart, yTop, t.color, crossFor(yStart)));
      }
      o.push(ballValve(x, bottomValveY, true));
      o.push(leaderValve(x, bottomValveY, '3/4"'));
      o.push(diaV(x, bottomValveY - 7.2, dia));
      o.push(bottomMark(x, t.mark, t.dir));
    });

    // правый край котловой гребёнки (без гидрострелки)
    if (!cfg.hydro) {
      mRight = tapsEnd + 14.7;
      o.push(hpipe(mLeft, mRight, mY.supply, COL.supply));
      o.push(tick(mRight, mY.supply, false, COL.supply));
      o.push(diaH(mRight, mY.supply, dia));
      var retRight = cfg.tankHeating ? mRight + 4.7 : mRight;
      o.push(hpipe(mLeft, retRight, mY.ret, COL.ret));
      if (!cfg.tankHeating) o.push(tick(retRight, mY.ret, false, COL.ret));
      o.push(diaH(mRight, mY.ret, dia));
      if (twoCirc) {
        o.push(hpipe(mLeft, mRight, mY.dhw, COL.dhw));
        o.push(tick(mRight, mY.dhw, false, COL.dhw));
        o.push(diaH(mRight, mY.dhw, dia));
        o.push(hpipe(mLeft, mRight, mY.cold, COL.cold));
        o.push(tick(mRight, mY.cold, false, COL.cold));
        o.push(diaH(mRight, mY.cold, dia));
      }
    }
    // левые торцы гребёнки
    var colByKey = { supply: COL.supply, ret: COL.ret, dhw: COL.dhw, cold: COL.cold, loadS: COL.loadS, loadR: COL.loadR };
    Object.keys(mY).forEach(function (k) {
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
        o.push(vpipe(tx2, mY.ret - 19.4, mY.ret, COL.ret, []));
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
      var pT3 = tY + tH * 0.167, pT4 = tY + tH * 0.244, pT1 = tY + tH * 0.321,
        pT2 = tY + tH * 0.69, pB1 = tY + tH - (wall ? 8 : 10);
      // арматура В1 всегда на уровне напольного патрубка — у настенного между
      // ней и корпусом остаётся спуск с обходами линий загрузки
      var armY = Math.max(pB1, 166);
      var portYs = [pT3, pT1, pT2, pB1].concat(cfg.recirc ? [pT4] : []);
      // контур загрузки от гребёнки к патрубкам
      var lx1 = tX - 22, lx2 = tX - 13;
      o.push(hpipe(mLeft, lx1, mY.loadS, COL.loadS));
      o.push(hpipe(mLeft, lx2, mY.loadR, COL.loadR));
      o.push(diaH(lx1 - 2, mY.loadS, dia));
      o.push(diaH(lx1 - 2, mY.loadR, dia));
      o.push(vpipe(lx1, mY.loadS, pT1, COL.loadS, [mY.loadR, pB1]));
      o.push(hpipe(lx1, tX - 1.5, pT1, COL.loadS));
      o.push(openArrow(tX - 3.2, pT1, 'right', COL.loadS));
      o.push(vpipe(lx2, mY.loadR, pT2, COL.loadR, [mY.loadS, pB1]));
      o.push(hpipe(lx2, lx2 + 2.8, pT2, COL.loadR));
      o.push(ballValve(lx2 + 5.3, pT2, false));
      o.push(leader(lx2 + 4.4, pT2 - 1.1, '1/2"'));
      o.push(hpipe(lx2 + 7.8, tX - 1.5, pT2, COL.loadR));
      o.push(openArrow(lx2 + 2, pT2, 'left', COL.loadR));
      o.push(tankPort(tX, pT1, COL.loadS, 'Т1'));
      o.push(tankPort(tX, pT2, COL.loadR, 'Т2'));
      o.push(tankPort(tX, pT3, COL.dhw, 'Т3'));
      o.push(tankPort(tX, pB1, COL.cold, 'В1'));
      if (cfg.recirc) o.push(tankPort(tX, pT4, COL.recirc, 'Т4'));

      var bx1 = tX - 30, bx3 = tX - 21, bx2 = tX - 5.5;
      var yTopV = bottomValveY - 2.5;
      // В1: ввод холодной воды снизу, с обратным и предохранительным
      if (cfg.water !== false) {
        o.push(hpipe(bx1, tX - 1.5, pB1, COL.cold));
        if (armY > pB1) o.push(vpipe(bx1, pB1, armY, COL.cold, [mY.loadS, mY.loadR]));
        o.push(ln(bx1, armY, bx1, armY + 6.4, { c: COL.cold, w: LW.pipe }));
        // предохранительный на отводе (сброс вниз), как на листе 2025-1209R
        o.push(hpipe(bx1, bx1 + 4.1, armY + 8.9, COL.cold));
        o.push(safetyValve(bx1 + 6.6, armY + 8.9, true));
        o.push(leader(bx1 + 5.6, armY + 7.8, '1/2"'));
        o.push(ln(bx1, armY + 6.4, bx1, armY + 13.9, { c: COL.cold, w: LW.pipe }));
        o.push(checkValve(bx1, armY + 16.4, 'up'));
        o.push(leaderValve(bx1, armY + 16.4, '3/4"'));
        o.push(ln(bx1, armY + 18.9, bx1, yTopV, { c: COL.cold, w: LW.pipe }));
        o.push(ballValve(bx1, bottomValveY, true));
        o.push(leaderValve(bx1, bottomValveY, '3/4"'));
        o.push(diaV(bx1, bottomValveY - 7.2, dia));
        o.push(bottomMark(bx1, 'В1', 'up'));
        // расширительный бак ГВС — на своём отводе от В1, ниже линий загрузки;
        // при гидрострелке ещё ниже, чтобы не задевать её обвязку
        if (cfg.tankDhw) {
          var dtX = bx1 - 13.5, dtY = cfg.hydro ? 215 : 193;
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
      o.push(leaderValve(bx2, bottomValveY, '3/4"'));
      o.push(diaV(bx2, bottomValveY - 7.2, dia));
      o.push(bottomMark(bx2, 'Т3', 'down'));
      // Т4: рециркуляция с насосом и обратным клапаном
      if (cfg.recirc) {
        o.push(hpipe(bx3, tX - 1.5, pT4, COL.recirc));
        o.push(vpipe(bx3, pT4, 223.1, COL.recirc, [pT1, pT2, pB1, mY.loadR]));
        o.push(pump(bx3, 226, 'up'));
        o.push(ln(bx3, 228.92, bx3, 230.5, { c: COL.recirc, w: LW.pipe }));
        o.push(checkValve(bx3, 233, 'up'));
        o.push(leaderValve(bx3, 233, '1/2"'));
        o.push(ln(bx3, 235.5, bx3, yTopV, { c: COL.recirc, w: LW.pipe }));
        o.push(ballValve(bx3, bottomValveY, true));
        o.push(leaderValve(bx3, bottomValveY, '1/2"'));
        o.push(bottomMark(bx3, 'Т4', 'up'));
      }
    }

    return o.join('');
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
    build: build, sheet: sheetSvg,
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
