/* project_nodes3d.js — виды узлов для листов проекта.
 *
 * Раньше узлы рисовались тут же, на three.js, прямо в браузере. Так их
 * не сделать: в проектах-образцах виды узлов (стр. 10, 18, 19) — это
 * 3D-виды Revit со стилем «затенение с показом кромок», вставленные на
 * лист картинкой 992x876. Ни ортогональной проекции, ни линий кромок
 * WebGL не даёт, и живой рендер выглядел кустарно.
 *
 * Теперь кадры готовит scratch/render_nodes.py (Blender, ортогональная
 * камера + Freestyle) и кладёт в img/nodes3d вместе с nodes3d.json, где
 * записаны размеры кадра и точки выносок в его долях. Здесь остаётся
 * только выбрать нужный узел под смету и отдать листу описание кадра.
 *
 * Глобал: window.projectNodes3D — { load, node }
 */
(function () {
  'use strict';

  var DIR = 'img/nodes3d/';
  var index = null;

  /** Разовая загрузка описания кадров. Нет файла — узлов на листах не будет. */
  function load() {
    if (index) return Promise.resolve(index);
    return fetch(DIR + 'nodes3d.json')
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { index = j || {}; return index; })
      .catch(function () { index = {}; return index; });
  }

  /**
   * Описание кадра узла: адрес картинки, пропорции и точки выносок.
   * key — ufh | water | rad_sec | rad_panel.
   */
  function node(key) {
    var it = index && index[key];
    if (!it || !it.front || !it.front.w) return null;
    var f = it.front;
    var out = {
      url: DIR + key + '_front.jpg',
      ratio: f.w / f.h,
      marks: (f.marks || []).map(function (m) { return { t: m.t, x: m.x, y: m.y }; })
    };
    if (it.anchors) out.anchors = it.anchors;
    if (it.iso && it.iso.w) {
      out.iso = { url: DIR + key + '_iso.jpg', ratio: it.iso.w / it.iso.h };
    }
    return out;
  }

  /**
   * Кадр нужного типоразмера: sized('pipe_exp', 24) → узел с баком 24 л.
   *
   * Кадры готовятся заранее на ходовые величины («pipe_exp_18», «_24»,
   * «_50»), поэтому берём ближайший к тому, что стоит в смете. Размера
   * нет или кадров под него не готовили — отдаём базовый узел.
   */
  function sized(base, value) {
    if (value && index) {
      var re = new RegExp('^' + base + '_(\\d+(?:\\.\\d+)?)$'), best = null;
      Object.keys(index).forEach(function (k) {
        var m = re.exec(k);
        if (!m) return;
        var d = Math.abs(parseFloat(m[1]) - value);
        if (!best || d < best.d) best = { key: k, d: d };
      });
      if (best) {
        var got = node(best.key);
        if (got) return got;
      }
    }
    return node(base);
  }

  window.projectNodes3D = { load: load, node: node, sized: sized };
})();
