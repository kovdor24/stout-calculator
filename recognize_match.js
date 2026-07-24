/**
 * Подбор распознанных позиций по каталогу и замена системы трубопровода.
 *
 * Никакого ИИ: на вход приходит нормализованная структура от распознавания
 * (тип, диаметр, резьба, угол, размеры отводов), на выходе — артикул каталога.
 * Детерминированно, воспроизводимо, работает без сети.
 *
 * Вторая задача модуля — пересчёт сметы между системами (ППР, нержавейка,
 * металлопластик, сшитый полиэтилен). Прямая подстановка «диаметр в диаметр»
 * здесь неверна по двум причинам, и обе учтены ниже:
 *   1. Ряды диаметров у систем разные, сравнивать надо по проходу (bore).
 *   2. Гнущиеся трубы требуют меньше углов, а бухтовые — меньше стыков.
 */

const RecognizeMatch = (function () {

  // ---------------------------------------------------------------------------
  // Системы и их физика
  // ---------------------------------------------------------------------------

  const SYSTEMS = {
    ppr: {
      label: 'Полипропилен',
      // Жёсткая труба: каждый поворот — только фитингом.
      elbowFactor: () => 1.0,
      // Продаётся штангами, поэтому стык каждые 4 м.
      segmentLength: () => 4,
    },
    ss: {
      label: 'Нержавейка',
      elbowFactor: () => 1.0,
      segmentLength: () => 4,
    },
    mp: {
      label: 'Металлопластик',
      // Гнётся, но радиус ограничен — примерно половина углов уходит.
      elbowFactor: () => 0.5,
      segmentLength: (d) => coilLength('mp', d),
    },
    pex: {
      label: 'Сшитый полиэтилен',
      // Свободно гнётся только шестнадцатый диаметр. Всё, что толще,
      // ведёт себя как металлопластик — уточнение от монтажника.
      elbowFactor: (d) => (d && d <= 16 ? 0.27 : 0.5),
      segmentLength: (d) => coilLength('pex', d),
    },
  };

  // Соответствие «форма фитинга → категория каталога».
  // У ППР и нержавейки форма = отдельная категория. У металлопластика и
  // сшитого полиэтилена всё лежит одной кучей, форму приходится читать из
  // названия — для них указан _flat.
  const CATEGORIES = {
    ppr_ekoplastik: {
      pipe: 'ppr_ekoplastik_pipe',
      elbow90: 'ppr_ekoplastik_elbow90',
      elbow45: 'ppr_ekoplastik_elbow45',
      tee: 'ppr_ekoplastik_tee',
      tee_red: 'ppr_ekoplastik_tee_red',
      adapter_fi: 'ppr_ekoplastik_adapter_fi',
      adapter_mi: 'ppr_ekoplastik_adapter_mi',
      coupling: 'ppr_ekoplastik_coupling',
      coupling_red: 'ppr_ekoplastik_coupling_red',
    },
    ppr_proaqua: {
      pipe: 'ppr_proaqua_pipe',
      elbow90: 'ppr_proaqua_elbow90',
      elbow45: 'ppr_proaqua_elbow45',
      tee: 'ppr_proaqua_tee',
      tee_red: 'ppr_proaqua_tee_red',
      adapter_fi: 'ppr_proaqua_adapter_fi',
      adapter_mi: 'ppr_proaqua_adapter_mi',
      coupling: 'ppr_proaqua_coupling',
      coupling_red: 'ppr_proaqua_coupling_red',
      // Резьбовые фитинги, американки и крепёж — добавлены из прайса,
      // раньше их не было в каталоге и подбор честно возвращал «нет».
      elbow_mi: 'ppr_proaqua_elbow_mi',
      elbow_fi: 'ppr_proaqua_elbow_fi',
      tee_mi: 'ppr_proaqua_tee_mi',
      tee_fi: 'ppr_proaqua_tee_fi',
      union_mi: 'ppr_proaqua_union_mi',
      union_fi: 'ppr_proaqua_union_fi',
      clip: 'ppr_proaqua_clip',
      support: 'ppr_proaqua_support',
    },
    ss: {
      pipe: 'ss_pipe_4m',
      elbow90: 'ss_elbow90',
      elbow45: 'ss_elbow45',
      tee: 'ss_tee',
      tee_red: 'ss_tee_red',
      adapter_fi: 'ss_adapter_fi',
      adapter_mi: 'ss_adapter_mi',
      coupling: 'ss_coupling',
      coupling_red: 'ss_coupling_red',
      elbow_fi: 'ss_elbow_fi',
      elbow_mi: 'ss_elbow_mi',
    },
    mp: { _pipes: 'water_pipes_mp', _flat: 'water_fittings_press_mp' },
    pex: { _pipes: 'water_pipes', _flat: 'axial_fittings_pex' },
    // ПНД-фитинги лежат вместе со скважинной обвязкой, вперемешку с прочим,
    // поэтому источник дополнительно фильтруется по слову «ПНД».
    hdpe: { _pipes: 'well_parts', _flat: 'well_parts', _only: /ПНД/i },
  };

  /**
   * Латунная арматура системе трубопровода не принадлежит: кран, американка
   * или ниппель одинаковы хоть при полипропилене, хоть при нержавейке.
   * Лежит она в каталоге вперемешку — часть отдельными объектами, часть
   * массивами, — поэтому собирается в общий пул отдельно.
   */
  // Перечислять категории вручную оказалось ошибкой: латунь рассыпана по
  // всему каталогу, и, например, «Американка 1" ВР/НР» лежит в dhw_fittings
  // с пометкой «Змеевик бойлера» — по имени категории её не найти. Поэтому
  // пул собирается сплошным обходом, а отбор идёт по названию и резьбе.
  // Исключаем только системные ветки: там свои правила подбора.
  const BRASS_EXCLUDE = /^(ppr_|ss_|water_fittings_press_mp|axial_fittings_pex|water_pipes|pipes|metal_plastic_pipes|stable_pipes|insulated)/;

  // Опознание латунной позиции по названию каталога.
  // Шаблоны перечислены по убыванию точности: для «крана с американкой»
  // сначала ищем именно кран, и только если его нет — разъёмное соединение.
  // Иначе кран подменяется одной американкой, то есть теряется сам вентиль.
  const BRASS_PATTERNS = {
    'американка': [/американк|разъемное соед|разъёмное соед/i],
    'кран_шаровой': [/кран шаровой|шаровой кран/i],
    'кран_американка': [/кран шаровой/i, /американк/i],
    'кран_накидной': [/кран шаровой/i, /кран|вентиль/i],
    'ниппель': [/ниппель/i],
    'футорка': [/футорк/i],
    'переход': [/переходник|футорк/i],
    'фильтр': [/фильтр/i],
    'хомут': [/хомут/i],
    'клипса': [/клипс/i],
    'опора': [/опора/i],
    'фиксатор': [/фиксатор/i],
  };

  // Опознание формы по названию — для систем с плоским списком фитингов.
  // Порядок важен: «Тройник-переходник с наружной резьбой» должен опознаться
  // как tee_mi, а не как tee_red, поэтому резьбовые шаблоны идут первыми.
  const SHAPE_PATTERNS = [
    [/угольник[- ]переходник.*внутренней резьбой/i, 'elbow_fi'],
    [/угольник[- ]переходник.*наружной резьбой/i, 'elbow_mi'],
    [/тройник[- ]переходник.*внутренней резьбой/i, 'tee_fi'],
    [/тройник[- ]переходник.*наружной резьбой/i, 'tee_mi'],
    [/переходник.*внутренней резьбой/i, 'adapter_fi'],
    [/переходник.*наружной резьбой/i, 'adapter_mi'],
    [/тройник переходной/i, 'tee_red'],
    [/тройник равнопроходн/i, 'tee'],
    [/тройник/i, 'tee'],
    [/угольник настенный/i, 'wall_elbow'],
    [/угольник|угол/i, 'elbow90'],
    [/муфта соединительная переходная|муфта переходная/i, 'coupling_red'],
    [/муфта/i, 'coupling'],
    [/труба/i, 'pipe'],
  ];

  // ---------------------------------------------------------------------------
  // Разбор названий каталога
  // ---------------------------------------------------------------------------

  /**
   * Наружный диаметр и стенка из названия трубы: «32x4,4», «22х1.2», «16x2.0».
   * Кириллическая «х» и латинская «x» встречаются вперемешку, запятая как
   * десятичный разделитель — тоже. Проход считаем как ОД минус две стенки.
   */
  function parsePipeGeometry(name) {
    const m = name.match(/(\d{2}(?:[.,]\d+)?)\s*[xх]\s*(\d(?:[.,]\d+)?)/i);
    if (!m) return null;
    const od = parseFloat(m[1].replace(',', '.'));
    const wall = parseFloat(m[2].replace(',', '.'));
    if (!od || !wall || wall >= od / 2) return null;
    return { od, wall, bore: Math.round((od - 2 * wall) * 10) / 10 };
  }

  /** Длина бухты/штанги из названия: «(100 м)», «(50 м)». */
  function parseCoil(name) {
    const m = name.match(/\((\d+)\s*м\)/);
    return m ? parseInt(m[1], 10) : null;
  }

  /**
   * Резьба в дюймах: 1/2, 3/4, 1, 1 1/4.
   *
   * Полипропилен пишет её в кавычках («32х3/4''»), нержавейка — без них
   * («Переходник ВПр-ВР 22х3/4»). Обозначения ВПр и НПр — это пресс-концы,
   * а не резьба, и путать их с ВР/НР нельзя: подстроки «ВР»/«НР» внутри
   * «ВПр»/«НПр» не встречаются, поэтому проверка по ним безопасна.
   */
  function parseThread(name) {
    let m = name.match(/(\d\s+\d\/\d|\d\/\d|\d)\s*(?:''|"|”|»)/);
    if (m) return m[1].replace(/\s+/g, ' ').trim();

    if (/(ВР|НР|[хx]\s*R\d)/i.test(name)) {
      m = name.match(/[хx]\s*R?(\d\s+\d\/\d|\d\/\d|\d)(?:\s|$)/i);
      if (m) return m[1].replace(/\s+/g, ' ').trim();
    }
    return null;
  }

  /** Все размеры подряд для переходных тройников: «32x25x32» → [32,25,32]. */
  function parseDimChain(name) {
    const m = name.match(/(\d{2})\s*[xх]\s*(\d{2})\s*[xх]\s*(\d{2})/i);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }

  /**
   * Условный диаметр фитинга.
   *
   * Две ловушки, обе стоили ошибок при проверке на каталоге:
   *   - «Угольник 90° PP-RCT 32х90°» — угол читается как диаметр, если брать
   *     первое двузначное число. Градусы вырезаем заранее.
   *   - «Труба ... 32x4,4» — граница слова \b между «32» и «x» не срабатывает,
   *     поэтому диаметр не находился вовсе. Нужен явный просмотр вперёд.
   */
  function parseFittingD(name) {
    const cleaned = name
      .replace(/\d+\s*°/g, ' ')      // углы отводов
      .replace(/PN\s*\d+/gi, ' ')    // класс давления
      .replace(/PP-RCT|PE-X[ab]?|PE-RT/gi, ' ');
    // Диаметр может стоять и после «х»: у металлопластика резьба пишется
    // первой — «Переходник с наружной резьбой 1"х32».
    const m = cleaned.match(/(?:^|[\s(xх"'])(\d{2})(?=[\sxх×,.)/]|$)/i);
    return m ? +m[1] : null;
  }

  // ---------------------------------------------------------------------------
  // Таблица соответствия диаметров по проходу
  // ---------------------------------------------------------------------------

  let boreCache = null;

  /** Строит {система: [{d, bore, coil}]} прямо из каталога, без ручных таблиц. */
  function boreTable() {
    if (boreCache) return boreCache;
    boreCache = {};

    const pipeCats = {
      ppr: ['ppr_ekoplastik_pipe', 'ppr_proaqua_pipe'],
      ss: ['ss_pipe_4m'],
      mp: ['metal_plastic_pipes', 'water_pipes_mp'],
      pex: ['pipes', 'water_pipes', 'stable_pipes'],
    };

    for (const sys in pipeCats) {
      const seen = new Map();
      for (const key of pipeCats[sys]) {
        for (const item of (catalog[key] || [])) {
          const g = parsePipeGeometry(item.name);
          if (!g) continue;
          const d = Math.round(g.od);
          const coil = parseCoil(item.name);
          const prev = seen.get(d);
          // Из нескольких фасовок одного диаметра берём самую длинную:
          // меньше стыков, и монтажник обычно берёт именно её.
          if (!prev || (coil || 0) > (prev.coil || 0)) {
            seen.set(d, { d, bore: g.bore, coil });
          }
        }
      }
      boreCache[sys] = [...seen.values()].sort((a, b) => a.bore - b.bore);
    }
    return boreCache;
  }

  /** Длина одной единицы поставки трубы данного диаметра. */
  function coilLength(sys, d) {
    const row = (boreTable()[sys] || []).find((r) => r.d === d);
    return (row && row.coil) || 50;
  }

  /**
   * Эквивалент диаметра в другой системе — по ближайшему проходу.
   * ППР 32 (проход 23,2) уходит в нержавейку 28 (проход 25,6), а не в 32.
   */
  function equivalentD(fromSys, d, toSys) {
    const src = (boreTable()[fromSys] || []).find((r) => r.d === d);
    if (!src) return null;
    const candidates = boreTable()[toSys] || [];
    if (!candidates.length) return null;
    let best = null;
    for (const c of candidates) {
      const diff = Math.abs(c.bore - src.bore);
      if (!best || diff < best.diff) best = { ...c, diff };
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // Подбор позиции
  // ---------------------------------------------------------------------------

  /**
   * Система для КОНКРЕТНОЙ позиции.
   *
   * Определять систему на всю смету нельзя: реальная смета смешанная —
   * магистраль полипропиленом, разводка к приборам пресс-фитингами, запорная
   * арматура латунная. При общем определении пресс-муфта молча подбиралась
   * как сварной фитинг PP-RCT, то есть выдавалась несовместимая деталь.
   */
  function systemOf(item, fallback) {
    const t = (item.type || '').toLowerCase();
    const raw = (item.raw || '').toLowerCase();

    // Канализация — по явному типу либо по характерным диаметрам 40/50/110/160
    // у трубы/отвода/тройника/редукции. «Отвод» без уточнения системы это
    // канализационный отвод, а не полипропиленовый угол.
    if (/канализац|ревизия/.test(t)) return 'sewer';
    if ([40, 50, 110, 160].includes(item.d) &&
        /^(труба|отвод|тройник|редукция|переход|заглушка|муфта)/.test(t)) return 'sewer';

    // Латунь опознаётся по типу, но только при отсутствии диаметра трубы.
    // «Разъёмная 25х3/4 НР» — это полипропиленовый фитинг на 25-ю трубу,
    // а не латунная американка: наличие d говорит о принадлежности к системе.
    if (BRASS_PATTERNS[t] && !item.d) return 'brass';

    // «Пресс» в русском обиходе монтажника — это металлопластик.
    // У сшитого полиэтилена соединение называют аксиальным или надвижным.
    if (/пресс/.test(t) || /пресс/.test(raw)) return 'mp';
    if (/аксиал|надвижн/.test(raw)) return 'pex';

    if (/ppr|полипропилен/.test(t) || /ppr|стекло/.test(raw)) return 'ppr';
    if (/впр|нерж/.test(raw)) return 'ss';

    if (t === 'водорозетка' || t === 'водорозетка_проходная') return 'mp';
    if (t === 'труба_pex') return 'pex';
    if (t === 'пнд_муфта') return 'hdpe';

    return fallback || 'ppr';
  }

  /** Плоский пул латунной арматуры: часть каталога — объекты, часть — массивы. */
  let brassCache = null;
  function brassPool() {
    if (brassCache) return brassCache;
    brassCache = [];
    for (const key in catalog) {
      if (BRASS_EXCLUDE.test(key)) continue;
      const v = catalog[key];
      if (Array.isArray(v)) {
        for (const it of v) if (it && it.name && it.price != null) brassCache.push(it);
      } else if (v && v.name && v.price != null) {
        brassCache.push(v);
      }
    }
    return brassCache;
  }

  /** Форма фитинга по распознанному типу. */
  function shapeOf(item) {
    if (item._shape) return item._shape;   // форма задана явно (служебные позиции)
    const t = (item.type || '').toLowerCase();
    const hasDims = Array.isArray(item.dims) && item.dims.length > 1;

    if (t.startsWith('труба')) return 'pipe';

    // Резьба меняет изделие, а не только его размер: угол с наружной резьбой
    // и обычный сварной угол — разные артикулы. Раньше резьба у углов и
    // тройников игнорировалась, и подбор уходил на гладкий фитинг.
    if (t.startsWith('угол')) {
      if (item.thread && item.threadType === 'НР') return 'elbow_mi';
      if (item.thread && item.threadType === 'ВР') return 'elbow_fi';
      return item.angle === 45 ? 'elbow45' : 'elbow90';
    }
    if (t.startsWith('тройник')) {
      if (hasDims) return 'tee_red';
      if (item.thread && item.threadType === 'НР') return 'tee_mi';
      if (item.thread && item.threadType === 'ВР') return 'tee_fi';
      return 'tee';
    }
    if (t === 'клипса') return 'clip';
    if (t === 'опора') return 'support';
    if (t.startsWith('муфта_комбинированная')) {
      // Именно резьба выбирает категорию — и именно она чаще всего
      // распознаётся неверно. Отсюда требование показывать её в проверке.
      return item.threadType === 'НР' ? 'adapter_mi' : 'adapter_fi';
    }
    // Водорозетка — это настенный угольник с креплением под смеситель.
    // В каталоге она так и называется, поэтому по слову «водорозетка»
    // не находилась вовсе.
    if (t === 'водорозетка') return 'wall_elbow';
    if (t === 'водорозетка_проходная') return 'wall_elbow_pass';

    if (t.startsWith('пнд_муфта')) {
      if (item.threadType === 'НР') return 'adapter_mi';
      if (item.threadType === 'ВР') return 'adapter_fi';
      return 'coupling';
    }
    if (t.startsWith('пресс_муфта')) {
      if (item.threadType === 'НР') return 'adapter_mi';
      if (item.threadType === 'ВР') return 'adapter_fi';
      return 'coupling';
    }
    // «Разъёмная» у монтажника — это американка: муфта комбинированная
    // разъёмная. Тип резьбы выбирает конкретный артикул.
    if (t.startsWith('разъёмное') || t.startsWith('разъемное')) {
      if (item.threadType === 'НР') return 'union_mi';
      if (item.threadType === 'ВР') return 'union_fi';
      return 'union_fi';
    }
    if (t === 'переход') return 'coupling_red';
    if (t === 'муфта') return 'coupling';
    return null;
  }

  /**
   * Полипропилен представлен двумя брендами, и какой из них активен, решает
   * app.state.pprSystemBrand. Наружу модуль оперирует системой ('ppr'),
   * внутрь — конкретной веткой каталога.
   */
  /**
   * Приоритет брендов при подборе: сначала STOUT, при его отсутствии ROMMER,
   * затем прайс ТЕРЕМа. Полипропилен PRO AQUA и Wavin согласован заранее —
   * своего полипропилена у STOUT нет. Всё остальное из чужих прайсов
   * помечается флагом needsApproval и требует решения человека.
   *
   * Позиции без поля brand в этом каталоге относятся к STOUT.
   */
  const BRAND_RANK = { 'STOUT': 0, 'ROMMER': 1, 'ProAqua': 2, 'Wavin': 2 };

  function brandRank(item) {
    if (!item || !item.brand) return 0;
    const r = BRAND_RANK[item.brand];
    return r === undefined ? 3 : r;
  }

  /** Сортировка кандидатов: сначала качество совпадения, при равенстве — бренд. */
  function byScoreThenBrand(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return brandRank(a.item) - brandRank(b.item);
  }

  let pprBrand = 'proaqua';
  function setPprBrand(brand) {
    pprBrand = (brand === 'wavin' || brand === 'ekoplastik') ? 'ekoplastik' : 'proaqua';
  }
  function catalogKey(sys) {
    return sys === 'ppr' ? `ppr_${pprBrand}` : sys;
  }

  /** Кандидаты каталога для формы в заданной системе. */
  function candidatesFor(sys, shape) {
    const map = CATEGORIES[catalogKey(sys)];
    if (!map) return [];

    if (map._flat) {
      let pool = shape === 'pipe'
        ? (catalog[map._pipes] || [])
        : (catalog[map._flat] || []);
      if (map._only) pool = pool.filter((it) => it.name && map._only.test(it.name));
      if (shape === 'pipe') return pool;
      return pool.filter((it) => {
        for (const [re, sh] of SHAPE_PATTERNS) if (re.test(it.name)) return sh === shape;
        return false;
      });
    }
    return catalog[map[shape]] || [];
  }

  /**
   * Подбор артикула. Возвращает {item, score, alternatives} либо null.
   * score < 1 означает, что совпало не всё — такие позиции подсвечиваются
   * на экране проверки, а не подставляются молча.
   */
  /**
   * Подбор позиции: сначала каталог, затем прайс.
   *
   * Порядок принципиален. Каталог выверен, в нём проставлены бренды и
   * работает приоритет STOUT → ROMMER. Прайс — сырой список из 198 листов,
   * он шире, но менее надёжен, поэтому только как запасной путь.
   */
  function matchItem(rec, sysHint) {
    return matchCatalog(rec, sysHint) || matchPrice(rec);
  }

  /**
   * Подбор канализации по каталогу sewer_silent.
   *
   * Формы канализации называются иначе, чем в водоснабжении: «Отвод» вместо
   * угла, «Редукция»/«Переход эксц.» вместо перехода. Угол у канализации
   * стандартно 87°, а на бумаге пишут «90°» — сопоставляем.
   */
  function matchSewer(rec) {
    const pool = catalog.sewer_silent || [];
    if (!pool.length) return null;

    const t = (rec.type || '').toLowerCase();
    let re;
    if (/отвод/.test(t)) re = /отвод/i;
    else if (/тройник/.test(t)) re = /тройник/i;
    else if (/редукц|переход/.test(t)) re = /переход|редукц/i;
    else if (/муфта/.test(t)) re = /муфта/i;
    else if (/ревизия/.test(t)) re = /ревизия/i;
    else if (/заглушка/.test(t)) re = /заглушка/i;
    else if (/труба/.test(t)) re = /труба/i;
    else return null;

    // 90° на бумаге = 87° в канализации.
    const wantAngle = rec.angle === 90 ? 87 : rec.angle;

    let best = null;
    for (const it of pool) {
      const n = it.name;
      if (!re.test(n)) continue;

      let score = 0, max = 0;

      // Диаметр обязателен и ищется как отдельное число: «D 110», «D 050».
      if (rec.d) {
        max += 2;
        const dm = n.match(/D\s*0*(\d{2,3})/i);
        if (dm && +dm[1] === rec.d) score += 2;
      }
      if (wantAngle) {
        max += 1;
        if (n.includes(wantAngle + '°') || n.includes(wantAngle + ' ')) score += 1;
      }
      if (max === 0) continue;

      const rel = score / max;
      if (!best || rel > best.rel) best = { rel, item: it };
    }

    if (!best || best.rel < 0.75) return null;
    return {
      item: best.item,
      score: best.rel,
      brandRank: brandRank(best.item),
      needsApproval: brandRank(best.item) >= 3,
      alternatives: [],
    };
  }

  function matchCatalog(rec, sysHint) {
    // Система берётся от самой позиции; подсказка снаружи — лишь запасной
    // вариант для случаев, когда по типу определить не удалось.
    const sys = systemOf(rec, sysHint);

    if (sys === 'brass') return matchBrass(rec);
    if (sys === 'sewer') return matchSewer(rec);

    const shape = shapeOf(rec);
    if (!shape) return null;

    const pool = candidatesFor(sys, shape);
    if (!pool.length) return null;

    const wantChain = Array.isArray(rec.dims) && rec.dims.length > 1 ? rec.dims : null;
    const scored = [];

    for (const it of pool) {
      let score = 0, max = 0;

      if (wantChain) {
        max += 3;
        const chain = parseDimChain(it.name);
        if (chain && chain.join('x') === wantChain.join('x')) score += 3;
        else if (chain && chain[0] === wantChain[0]) score += 1;
      } else if (rec.d) {
        max += 2;
        if (parseFittingD(it.name) === rec.d) score += 2;
      }

      if (rec.thread) {
        const th = parseThread(it.name);
        // Резьба — требование жёсткое, а не одно из слагаемых. Позиция с
        // резьбой и позиция без неё это разные изделия: подставить обычный
        // тройник вместо резьбового значит выдать несобираемый узел.
        if (!th) continue;
        max += 2;
        if (th === rec.thread) score += 2;
      }

      if (max === 0) continue;
      scored.push({ item: it, score: score / max });
    }

    if (!scored.length) return null;
    scored.sort(byScoreThenBrand);
    // Ниже двух третей совпадения считаем, что позиции в каталоге нет.
    // Лучше честное «не найдено» на экране проверки, чем тихая подмена.
    if (scored[0].score < 0.67) return null;

    return {
      item: scored[0].item,
      score: scored[0].score,
      brandRank: brandRank(scored[0].item),
      needsApproval: brandRank(scored[0].item) >= 3,
      alternatives: scored.slice(1, 4).filter((s) => s.score > 0.4).map((s) => s.item),
    };
  }

  /**
   * Подбор латунной арматуры. Отличается от системного тем, что здесь нет
   * диаметра трубы — есть только резьба, и она обязана совпасть точно:
   * кран 3/4 вместо крана 1/2 это не «почти то же самое».
   */
  function matchBrass(rec) {
    const patterns = BRASS_PATTERNS[(rec.type || '').toLowerCase()];
    if (!patterns) return null;

    for (const re of patterns) {
      const pool = brassPool().filter((it) => it.name && re.test(it.name));
      const hits = [];

      for (const it of pool) {
        const th = parseThread(it.name);
        if (rec.thread && th !== rec.thread) continue;
        if (!rec.thread && th) continue;

        // Тип резьбы у латуни пишется как «ВР/НР», «ВН», «ВВ» и означает
        // разные изделия. Несовпадение не отбрасываем — такой позиции может
        // просто не быть в наличии, — но снижаем оценку, чтобы строка попала
        // на ручную проверку подсвеченной.
        let score = 1;
        if (rec.threadType && !new RegExp(rec.threadType, 'i').test(it.name)) score = 0.7;
        hits.push({ item: it, score });
      }

      if (hits.length) {
        hits.sort(byScoreThenBrand);
        return {
          item: hits[0].item,
          score: hits[0].score,
          brandRank: brandRank(hits[0].item),
          needsApproval: brandRank(hits[0].item) >= 3,
          alternatives: hits.slice(1, 4).map((h) => h.item),
        };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Замена системы
  // ---------------------------------------------------------------------------

  /**
   * Пересчёт списка в другую систему.
   *
   * Три правила, каждое со своим смыслом:
   *   - резьбовые стыки переносятся один в один, резьба сохраняется —
   *     они уходят в приборы и от материала трубы не зависят;
   *   - трубы меняют диаметр по проходу, метраж остаётся;
   *   - углы пересчитываются коэффициентом гибкости, а соединительные
   *     муфты — исходя из длины бухты или штанги.
   */
  function convert(recognized, fromSys, toSys) {
    const out = [];
    let pipeMeters = 0, pipeD = null;

    for (const rec of recognized) {
      const shape = shapeOf(rec);
      const qty = (rec.qty || 0) + (rec.qtyExtra || 0);
      const eq = rec.d ? equivalentD(fromSys, rec.d, toSys) : null;
      const targetD = eq ? eq.d : rec.d;

      const converted = { ...rec, d: targetD, _sourceD: rec.d, _shape: shape };

      if (shape === 'pipe') {
        pipeMeters += qty;
        pipeD = targetD;
        converted.qty = qty;
      } else if (shape === 'elbow90' || shape === 'elbow45') {
        const k = SYSTEMS[toSys].elbowFactor(targetD);
        converted.qty = Math.ceil(qty * k);
        if (k !== 1) {
          // У гнущихся систем отводов на 45° не бывает и они не нужны: такой
          // поворот делается изгибом трубы. Остаток сводим к угольникам 90°,
          // иначе позиция повиснет как «нет в каталоге» без всякой пользы.
          converted._shape = 'elbow90';
          converted.angle = 90;
          converted._note = `пересчитано: ${qty} → ${converted.qty} (труба гнётся)` +
            (shape === 'elbow45' ? ', 45° сведены к 90°' : '');
        }
      } else if (Array.isArray(rec.dims)) {
        // Переходной тройник: каждый размер отдельно по проходу.
        converted.dims = rec.dims.map((d) => {
          const e = equivalentD(fromSys, d, toSys);
          return e ? e.d : d;
        });
        converted.qty = qty;
      } else {
        converted.qty = qty;
      }

      converted.match = matchItem(converted, toSys);
      out.push(converted);
    }

    // Стыки по длине трассы считаем отдельно: они не позиция исходной сметы,
    // а следствие того, как труба поставляется.
    if (pipeMeters > 0 && pipeD) {
      const seg = SYSTEMS[toSys].segmentLength(pipeD);
      const joints = Math.max(0, Math.ceil(pipeMeters / seg) - 1);
      if (joints > 0) {
        const c = { type: 'муфта', d: pipeD, qty: joints, unit: 'шт', _shape: 'coupling',
                    _note: `стыки трубы: ${pipeMeters} м по ${seg} м` };
        c.match = matchItem(c, toSys);
        out.push(c);
      }
    }

    return mergeSameArticles(out);
  }

  /**
   * Схлопывание одинаковых артикулов.
   *
   * После пересчёта углов 90° и 45° сводятся к одному изделию, и в смете
   * появляются две строки с одним артикулом. В документе для клиента это
   * выглядит как ошибка, поэтому складываем.
   */
  function mergeSameArticles(list) {
    const merged = [];
    const byId = new Map();

    for (const row of list) {
      const id = row.match && row.match.item ? row.match.item.id : null;
      if (!id) { merged.push(row); continue; }

      const prev = byId.get(id);
      if (!prev) {
        byId.set(id, row);
        merged.push(row);
        continue;
      }
      prev.qty = (prev.qty || 0) + (row.qty || 0);
      const notes = [prev._note, row._note].filter(Boolean);
      if (notes.length) prev._note = notes.join('; ');
    }
    return merged;
  }

  /** Сумма по подобранным позициям. Позиции без артикула в сумму не идут. */
  function total(list) {
    return list.reduce((s, r) => {
      const price = r.match && r.match.item ? r.match.item.price : 0;
      return s + price * (r.qty || 0);
    }, 0);
  }

  // ---------------------------------------------------------------------------
  // Поиск по прайс-листу
  //
  // Каталог собран под сценарии калькулятора и покрывает малую часть прайса.
  // Индекс прайса — плоский текстовый список из 198 листов, поэтому подбор
  // здесь не структурный, а по словам. Используется ТОЛЬКО когда в каталоге
  // ничего не нашлось: позиции каталога проверены и приоритетны.
  // ---------------------------------------------------------------------------

  let priceIndex = null;

  /** Индекс подгружается лениво при открытии вкладки распознавания. */
  function setPriceIndex(items) {
    priceIndex = Array.isArray(items) ? items : null;
    priceTokens = null;
  }
  function hasPriceIndex() { return !!(priceIndex && priceIndex.length); }

  /** Слова, по которым тип позиции ищется в названиях прайса. */
  const TYPE_WORDS = {
    'муфта_комбинированная': ['муфта', 'комбинированная'],
    'пресс_муфта': ['муфта'],
    'пнд_муфта': ['пнд'],
    'американка': ['американка'],
    'разъёмное_соединение': ['разъемная'],
    'угол_ppr': ['угольник'],
    'угол_пресс': ['угольник'],
    'тройник': ['тройник'],
    'тройник_ppr': ['тройник'],
    'тройник_пресс': ['тройник'],
    'кран_шаровой': ['кран', 'шаровой'],
    'кран_американка': ['кран', 'шаровой'],
    'кран_ppr': ['кран'],
    'кран_накидной': ['кран'],
    'ниппель': ['ниппель'],
    'футорка': ['футорка'],
    'переход': ['переход'],
    'фильтр': ['фильтр'],
    'хомут': ['хомут'],
    'клипса': ['клипса'],
    'опора': ['опора'],
    'фиксатор': ['фиксатор'],
    'водорозетка': ['угольник', 'настенный'],
    'водорозетка_проходная': ['угольник', 'проходной'],
    'труба_ppr': ['труба'],
    'труба_ppr_ст': ['труба'],
    'труба_pex': ['труба'],
    'изоляция': ['изоляция'],
    // Канализация — запасной путь через прайс, когда тонкого каталога
    // sewer_silent не хватило (например, диаметр 50).
    'труба_канализация': ['труба'],
    'отвод_канализация': ['отвод'],
    'тройник_канализация': ['тройник'],
    'редукция_канализация': ['переход'],
    'муфта_канализация': ['муфта'],
    'ревизия': ['ревизия'],
    'заглушка_канализация': ['заглушка'],
    'хомут': ['хомут'],
  };

  /**
   * Приведение к общему виду: кириллическая «х» и латинская «x» в прайсе
   * встречаются вперемешку, как и разные кавычки у дюймов.
   */
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[хx]/g, 'x')
      .replace(/["'”»″]/g, '')
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9/.,\- ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let priceTokens = null;
  function tokenized() {
    if (priceTokens) return priceTokens;
    priceTokens = priceIndex.map((it) => ({ it, n: norm(it.n) }));
    return priceTokens;
  }

  /**
   * Подбор по прайсу. Возвращает тот же вид результата, что и подбор по
   * каталогу, но с пометкой fromPrice — такие позиции показываются на
   * проверке отдельно и требуют согласования.
   */
  function matchPrice(rec) {
    if (!hasPriceIndex()) return null;

    const type = (rec.type || '').toLowerCase();
    const words = TYPE_WORDS[type];
    if (!words || !words.length) return null;

    // Канализация обязана оставаться канализацией: без этого «Труба 50»
    // цепляла напорную PN-трубу водоснабжения — чужую систему и цену.
    // Признак канализационной позиции в прайсе: слово или диаметр вида D0xx.
    const sewerType = /канализ|ревизия/.test(type);
    const isSewerName = (n) => /канализ|раструб|бесшумн|d\s*0\d\d/.test(n);

    const thread = rec.thread ? norm(rec.thread) : null;
    const d = rec.d;
    const dims = Array.isArray(rec.dims) && rec.dims.length > 1 ? rec.dims.join('x') : null;
    const wantMi = rec.threadType === 'НР';
    const wantFi = rec.threadType === 'ВР';

    let best = null;
    for (const row of tokenized()) {
      const n = row.n;

      /**
       * Тип обязателен, и сверяется ПО СЛОВАМ ЦЕЛИКОМ.
       *
       * По подстроке «Фильтр дисковой» подбирался к «Трубе дренажной с
       * геофильтром»: слово «фильтр» пряталось внутри «геофильтром».
       * Допускаем только совпадение с начала слова — русские окончания
       * («муфта/муфты», «угольник/угольника») иначе не поймать.
       */
      if (!words.every((w) => new RegExp('(^|[^а-яa-z])' + w).test(n))) continue;

      // Канализационную позицию не подменяем товаром другой системы.
      if (sewerType && !isSewerName(n)) continue;

      let score = 0, max = 0;

      if (dims) {
        max += 3;
        if (n.includes(dims)) score += 3;
      } else if (d) {
        max += 2;
        // Диаметр ищем как отдельное число, иначе «2» найдётся в «32».
        // Допускаем ведущие нули: канализация пишется «D 050», «D 058».
        if (new RegExp('(^|[^0-9])0*' + d + '([^0-9]|$)').test(n)) score += 2;
      }

      if (thread) {
        max += 2;
        if (n.includes(thread)) score += 2;
      }

      if (wantMi || wantFi) {
        max += 2;
        const isMi = /наружн|\bнр\b/.test(n);
        const isFi = /внутренн|\bвр\b/.test(n);
        if ((wantMi && isMi) || (wantFi && isFi)) score += 2;
        else if (isMi || isFi) score -= 1;   // явно другое исполнение
      }

      if (rec.angle) {
        max += 1;
        if (n.includes(rec.angle + '')) score += 1;
      }

      if (max === 0) continue;
      let rel = score / max;

      /**
       * Штраф за лишние уточнения в названии.
       *
       * Без него «Фильтр дисковой 1"» подбирался к «Шламоотделителю с
       * магнитом» за 16 110 ₽ вместо фильтра за тысячу: слова «фильтр» и
       * «1» в названии есть, а «с магнитом» ничем не наказывалось.
       * Чем больше в названии слов, которых запрос не объясняет, тем
       * вероятнее, что это другое, более специальное изделие.
       */
      const nameWords = n.split(' ').filter((w) => w.length > 2);
      const explained = new Set([...words, thread, dims, String(d || ''), String(rec.angle || '')]
        .filter(Boolean).map(String));
      const extra = nameWords.filter((w) =>
        ![...explained].some((e) => w.includes(e) || e.includes(w))).length;
      rel -= Math.min(0.4, extra * 0.05);

      if (!best || rel > best.rel) best = { rel, item: row.it };
    }

    // Планка заметно выше, чем у каталога: прайс не выверен, а ошибка здесь
    // стоит денег в смете. Лучше честное «не найдено», чем чужой артикул.
    if (!best || best.rel < 0.95) return null;

    return {
      item: {
        id: best.item.a,
        article: best.item.a,
        name: best.item.n,
        price: best.item.p,
        brand: best.item.s,
      },
      score: best.rel,
      fromPrice: true,
      needsApproval: true,
      alternatives: [],
    };
  }

  /**
   * Разделы сметы, в которые можно положить распознанное. Список повторяет
   * заголовки из flushBill() в app.js — своё оборудование попадает в раздел
   * по точному совпадению строки.
   */
  const SECTIONS = [
    '1. Котёл + водонагреватель',
    '2. Обвязка котельной',
    '3. Приборы отопления',
    '4. Водяной тёплый пол',
    '5.1. Внутреннее водоснабжение',
    '5.2. Внутреннее ГВС',
    '5.3. Рециркуляция',
    '5.4. Общие материалы',
    '6. Узел ввода ХВС',
    '7.1. Обвязка скважинного насоса',
    '8. Канализация',
    '9. Дополнительные материалы',
  ];

  /**
   * Предположение раздела по типу позиции.
   *
   * Намеренно осторожное: по одному списку материалов раздел часто
   * неопределим — та же комбинированная муфта 25х3/4 одинаково уместна и в
   * водоснабжении, и в обвязке котла. Поэтому уверенное предположение даём
   * только там, где признак однозначен, а остальное отправляем в
   * «Дополнительные материалы» и предлагаем переставить руками.
   *
   * Возвращает { section, sure } — sure=false означает «это лишь догадка».
   */
  function guessSection(item) {
    const t = (item.type || '').toLowerCase();
    const raw = (item.raw || '').toLowerCase();
    const d = item.d;

    // Ввод воды в дом: ПНД-труба и дисковый фильтр ни в каком другом
    // разделе не встречаются.
    if (t === 'пнд_муфта' || /пнд/.test(raw)) return { section: '6. Узел ввода ХВС', sure: true };
    if (t === 'фильтр' && /дисков/.test(raw)) return { section: '6. Узел ввода ХВС', sure: true };

    // Точки водоразбора: водорозетка бывает только в разводке к приборам.
    if (t.startsWith('водорозетка') || t === 'планка_водорозетка') {
      return { section: '5.1. Внутреннее водоснабжение', sure: true };
    }

    // Крепёж и расходники не привязаны к разделу по существу.
    if (['хомут', 'клипса', 'опора', 'фиксатор', 'изоляция'].includes(t)) {
      return { section: '5.4. Общие материалы', sure: true };
    }

    // Разводка шестнадцатым диаметром — почти всегда подводка к приборам.
    if (d === 16) return { section: '5.1. Внутреннее водоснабжение', sure: false };

    // Полипропилен в этих сметах идёт магистралью водоснабжения, но
    // уверенности нет: тем же PPR ведут и отопление.
    if (/ppr/.test(t) || /ppr|стекло/.test(raw)) {
      return { section: '5.1. Внутреннее водоснабжение', sure: false };
    }

    return { section: '9. Дополнительные материалы', sure: false };
  }

  // ---------------------------------------------------------------------------
  // Рекомендации: чего не хватает к распознанному
  //
  // Правила выведены из физики монтажа, а не из статистики: труба в штангах
  // требует стыков, водорозетки — планок. Каждая рекомендация несёт причину,
  // чтобы монтажник видел, откуда взялась цифра, и мог отказаться.
  // ---------------------------------------------------------------------------

  /** Русское склонение после числа: 1 стык, 2 стыка, 5 стыков. */
  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  /** Суммарное количество по строкам, чей тип подходит под условие. */
  function totalQty(rows, test) {
    return rows.reduce((s, r) => {
      if (!test(r)) return s;
      return s + (Number(r.qty) || 0) + (Number(r.qtyExtra) || 0);
    }, 0);
  }

  function suggest(rows) {
    if (!Array.isArray(rows) || !rows.length) return [];
    const out = [];

    // --- Стыки полипропиленовой трубы -------------------------------------
    // Труба поставляется штангами по 4 м: на каждый стык нужна муфта.
    // Это не догадка, длина штанги видна в названиях позиций каталога.
    const pprPipes = rows.filter(r => /^труба_ppr/.test(r.type || ''));
    for (const p of pprPipes) {
      const meters = (Number(p.qty) || 0) + (Number(p.qtyExtra) || 0);
      if (meters < 5 || !p.d) continue;
      const joints = Math.max(0, Math.ceil(meters / 4) - 1);
      const have = totalQty(rows, r => r.type === 'муфта' && r.d === p.d);
      const need = joints - have;
      if (need > 0) {
        out.push({
          reason: `Труба ${p.d} — ${meters} м, штанги по 4 м`,
          note: `на ${joints} ${plural(joints, 'стык', 'стыка', 'стыков')} ` +
                `${plural(joints, 'нужна соединительная муфта', 'нужны соединительные муфты', 'нужны соединительные муфты')}`,
          row: { type: 'муфта', d: p.d, qty: need, unit: 'шт' },
          sure: true,
        });
      }
    }

    // --- Планки под водорозетки -------------------------------------------
    // На планку встают две водорозетки — отсюда деление пополам.
    const sockets = totalQty(rows, r => r.type === 'водорозетка');
    if (sockets >= 2) {
      const plates = Math.ceil(sockets / 2);
      const have = totalQty(rows, r => r.type === 'планка_водорозетка');
      if (plates - have > 0) {
        out.push({
          reason: `Водорозеток ${sockets} шт, планок ${have}`,
          note: 'по две водорозетки на планку',
          row: { type: 'планка_водорозетка', qty: plates - have, unit: 'шт' },
          sure: false,
        });
      }
    }

    // --- Крепёж для трубы --------------------------------------------------
    // Шаг крепления зависит от того, как трасса проложена, поэтому цифра
    // помечена как предположение: по открытой стене крепят чаще, в штробе
    // не крепят вовсе.
    const pipes = rows.filter(r => /^труба/.test(r.type || '') && r.unit === 'м');
    const pipeMeters = totalQty(rows, r => /^труба/.test(r.type || '') && r.unit === 'м');
    const mounts = totalQty(rows, r => ['клипса', 'опора', 'хомут', 'фиксатор'].includes(r.type));
    if (pipeMeters >= 10 && mounts < pipeMeters / 4) {
      // Диаметр берём у самой длинной трубы: без него клипса не подберётся —
      // подбор уйдёт в латунную арматуру вместо трубной системы.
      const main = pipes.slice().sort((a, b) =>
        ((b.qty || 0) + (b.qtyExtra || 0)) - ((a.qty || 0) + (a.qtyExtra || 0)))[0];
      out.push({
        reason: `Трубы ${pipeMeters} м, крепежа ${mounts} шт`,
        note: 'ориентировочно одно крепление на 2 м открытой трассы',
        row: { type: 'клипса', d: main ? main.d : null, qty: Math.ceil(pipeMeters / 2) - mounts, unit: 'шт' },
        sure: false,
      });
    }

    return out;
  }

  /** Определение исходной системы по признакам распознанного списка. */
  function detectSystem(items) {
    const text = items.map((i) => `${i.type} ${i.raw || ''}`).join(' ').toLowerCase();
    if (/ppr|полипропилен|стекло/.test(text)) return 'ppr';
    if (/пресс/.test(text)) return 'mp';
    if (/нержав|впр/.test(text)) return 'ss';
    return 'ppr';
  }

  return {
    SYSTEMS, SECTIONS, detectSystem, guessSection, suggest, matchItem, matchCatalog,
    matchPrice, setPriceIndex, hasPriceIndex, convert, total,
    equivalentD, boreTable, parsePipeGeometry, setPprBrand,
  };
})();

if (typeof module !== 'undefined') module.exports = RecognizeMatch;
