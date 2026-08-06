/* project_node_sheets.js — листы узлов по 3D-рендеру: «Узел обвязки
 * коллектора водоснабжения» (раздел В) и «Узел обвязки панельного
 * радиатора» (раздел О).
 *
 * В проектах-образцах это стр. 10 и 19: объёмный вид узла и выноски к его
 * элементам. Рендер и точки привязки готовит project_nodes3d.js (доли
 * кадра), здесь они разворачиваются в координаты листа, разводятся по
 * высоте, чтобы полки не налезали друг на друга, и подписываются именами
 * из сметы.
 *
 * Требует project_sheets.js. Глобал: window.projectNodeSheets
 */
(function () {
  'use strict';

  var SZ = { title: 7.36, txt: 3.3, small: 3.0 };

  function n(v) { return Math.round(v * 100) / 100; }
  function PS() { return window.projectSheets; }
  function txt(x, y, s, o) {
    o = o || {}; o.size = o.size || SZ.txt;
    return PS().text(x, y, s, o);
  }
  function line(x1, y1, x2, y2, w) {
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) +
      '" style="stroke:#000;stroke-width:' + (w || 0.2) + '"/>';
  }

  /** Название позиции сметы по образцу (и укороченное под графу листа) */
  function pick(items, re, not) {
    for (var i = 0; i < (items || []).length; i++) {
      var nm = String(items[i].name || '');
      if (re.test(nm) && !(not && not.test(nm))) return nm.replace(/\s+/g, ' ').trim();
    }
    return null;
  }
  function short(s, lim) {
    s = String(s || '');
    return s.length > lim ? s.slice(0, lim - 1) + '…' : s;
  }

  /**
   * Тело листа: рендер слева, выноски вправо.
   * photo — { url, ratio, marks: [{x, y, t}] } из projectNodes3D.
   * subs — замены подписей: { 'Евроконус': 'Евроконус 16x2.0' } из сметы.
   */
  function viewBody(title, photo, subs, notes) {
    var o = [];
    o.push(txt(217.5, 14.8, title, { anchor: 'middle', size: SZ.title }));

    // Второй вид: в образцах рядом с фронтальным стоит маленькая
    // изометрия того же узла — по ней понятно, что за чем стоит.
    if (photo.iso && photo.iso.url) {
      var iw = 88, ih = iw / (photo.iso.ratio || 1.4);
      var ix = 26, iy = 238 - ih;
      o.push('<image x="' + n(ix) + '" y="' + n(iy) + '" width="' + n(iw) + '" height="' + n(ih) +
        '" preserveAspectRatio="xMidYMid meet" href="' +
        String(photo.iso.url).replace(/&/g, '&amp;') + '"/>');
      o.push(txt(ix + iw / 2, iy - 1.6, 'Общий вид узла', { anchor: 'middle', size: SZ.small }));
    }

    // поле рендера: слева, под выноски оставлена правая треть листа
    var F = photo.iso && photo.iso.url ? { x: 102, y: 22, w: 168, h: 214 }
      : { x: 26, y: 24, w: 236, h: 214 };
    var r = photo.ratio || 1.55;
    var w = F.w, h = w / r;
    if (h > F.h) { h = F.h; w = h * r; }
    var x = F.x + (F.w - w) / 2, y = F.y + (F.h - h) / 2;
    o.push('<image x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" preserveAspectRatio="xMidYMid meet" href="' +
      String(photo.url).replace(/&/g, '&amp;') + '"/>');

    // Выноски: полка у правого края листа, порядок — по высоте точки на
    // рендере, шаг не меньше 6 мм, иначе подписи слипаются.
    var LX = 286, gap = 6.4;
    var marks = (photo.marks || []).slice().sort(function (a, b) { return a.y - b.y; });
    var ly = y + 6;
    marks.forEach(function (m) {
      var ax = x + m.x * w, ay = y + m.y * h;
      if (ly < ay) ly = ay;                       // полка не выше своей точки
      var label = subs && subs[m.t] ? subs[m.t] : m.t;
      o.push('<circle cx="' + n(ax) + '" cy="' + n(ay) + '" r="0.55" style="fill:#000"/>');
      o.push(line(ax, ay, LX - 3, ly));
      o.push(line(LX - 3, ly, LX - 1, ly));
      o.push(txt(LX, ly + 1.1, short(label, 46), { size: SZ.small }));
      ly += gap;
    });

    var ny = Math.max(y + h + 8, 246);
    (notes || []).forEach(function (s, i) {
      o.push(txt(F.x, ny + i * 4.6, s, { size: SZ.small }));
    });
    return o.join('');
  }

  /**
   * Примечание в красной рамке внизу листа — в проектах-образцах им
   * оговаривают, что вид принципиальный: фактические выходы и типоразмер
   * берут с планов и из спецификации.
   */
  function warn(lines) {
    var o = [], x = 26, y = 264, w = 190, h = 4.6 * lines.length + 3.4;
    o.push('<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" style="fill:none;stroke:#c0392b;stroke-width:0.3"/>');
    lines.forEach(function (s, i) {
      o.push(txt(x + 2.4, y + 4.4 + i * 4.6, s, { size: SZ.small, fill: '#c0392b' }));
    });
    return o.join('');
  }

  /** Лист «Узел обвязки коллектора водоснабжения» (раздел В) */
  function water(opts) {
    opts = opts || {};
    if (!opts.photo || !opts.photo.url || !window.projectSheets) return null;
    var it = opts.items || [];
    var subs = {
      'Коллектор ХВС (В1)': pick(it, /коллектор.{0,30}(хвс|холодн)/i) || 'Коллектор ХВС (В1)',
      'Коллектор ГВС (Т3)': pick(it, /коллектор.{0,30}(гвс|горяч)/i) || 'Коллектор ГВС (Т3)',
      'Евроконус': pick(it, /евроконус/i) || 'Евроконус',
      'Отсечной вентиль выхода': pick(it, /кран\s+шаровой|вентиль/i) || 'Отсечной вентиль выхода',
      'Трубопроводы к приборам': pick(it, /труб\S*.{0,50}(pex|сшит|pe-rt|полипроп)/i) || 'Трубопровод водоснабжения'
    };
    var t = 'Узел обвязки коллектора водоснабжения';
    return {
      title: t,
      svg: window.projectSheets.sheet({
        code: opts.code, sheet: opts.sheet,
        body: viewBody(t, opts.photo, subs, [
          'Коллекторы устанавливаются в шкафу или открыто, уклон не требуется; ' +
            'к каждому прибору идёт своя линия.',
          'После монтажа выполнить промывку и опрессовку системы водоснабжения.'
        ]) + warn([
          'Примечание:',
          'На данном виде показана принципиальная схема обвязки коллекторов, ' +
            'реальное количество выходов смотреть на плане водоснабжения.'
        ])
      })
    };
  }

  /** Лист «Узел обвязки радиатора» (раздел О): панельного или секционного */
  function radiator(opts) {
    opts = opts || {};
    if (!opts.photo || !opts.photo.url || !window.projectSheets) return null;
    var it = opts.items || [];
    // Название листа — по тому прибору, который нарисован и стоит в смете
    var kind = opts.photo.panel ? 'панельного радиатора'
      : (opts.photo.sections ? 'секционного радиатора' : 'радиатора');
    var subs = {
      'Прибор отопления': pick(it, /радиатор|конвектор/i, /шкаф|кронштейн|узел|кран|термоголов/i) ||
        'Прибор отопления',
      'Термостатическая головка': pick(it, /термоголовк|термостатическ\S*\s+головк/i) ||
        'Термостатическая головка',
      'Узел нижнего подключения радиатора': pick(it, /узел\s+нижнего\s+подключ|нижнего\s+подключения/i) ||
        'Узел нижнего подключения радиатора',
      'Евроконус': pick(it, /евроконус/i) || 'Евроконус',
      'Кран Маевского': pick(it, /маевск/i) || 'Кран Маевского'
    };
    var t = 'Узел обвязки ' + kind;
    return {
      title: t,
      svg: window.projectSheets.sheet({
        code: opts.code, sheet: opts.sheet,
        body: viewBody(t, opts.photo, subs, [
          'Радиатор устанавливается под окном, ширина прибора 50–90 % ширины окна; ' +
            'от пола 100–120 мм, от подоконника не менее 80 мм.',
          'Подводки выполняются трубой в теплоизоляции; соединения в стяжке не допускаются.'
        ]) + warn([
          'Примечание:',
          'На данном виде мощность, размеры и расположение выходов прибора могут ' +
            'отличаться от проектных — они приняты по спецификации и планам.'
        ])
      })
    };
  }

  /**
   * Лист узла обвязки по готовому кадру: вид, выноски к каждому фитингу,
   * примечание. Тем же способом собраны листы обвязки в проектах-образцах.
   */
  function piping(opts) {
    opts = opts || {};
    if (!opts.photo || !opts.photo.url || !window.projectSheets) return null;
    var t = opts.title || 'Обвязка узла';
    return {
      title: t,
      svg: window.projectSheets.sheet({
        code: opts.code, sheet: opts.sheet,
        body: viewBody(t, opts.photo, null, opts.notes || [
          'Соединения выполнять по паспортам изделий; резьбовые — с уплотнением.',
          'После сборки провести гидравлическое испытание и осмотр всех соединений.'
        ]) + warn([
          'Примечание:',
          'На данном виде показана принципиальная схема обвязки; ' +
            'фактические типоразмеры и количество деталей — по спецификации.'
        ])
      })
    };
  }

  window.projectNodeSheets = { water: water, radiator: radiator, piping: piping };
})();
