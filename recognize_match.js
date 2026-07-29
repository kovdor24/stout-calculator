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
      // Полипропиленовая запорная арматура: «кран ппр» в смете это она,
      // а не латунный кран той же резьбы.
      valve: 'ppr_proaqua_valve',
      valve_rad: 'ppr_proaqua_valve_rad',
      valve_rad_angle: 'ppr_proaqua_valve_rad_angle',
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
      // Резьбовые тройники и разъёмные соединения нержавейки в таблице
      // отсутствовали, хотя в каталоге лежат. Из-за этого «Пресс нерж тройник
      // 28х1/2 ВР» и «соединитель 28х1 ВР с накидной гайкой» оставались без
      // артикула — искать их было попросту негде.
      tee_fi: 'ss_tee_fi',
      tee_mi: 'ss_tee_mi',
      union_fi: 'ss_union_fi',
      // Водорозетки нержавейки: раньше не были перечислены, и подбор по ним
      // молчал, хотя обе категории в каталоге есть.
      wall_elbow: 'ss_wall_elbow',
      wall_elbow_pass: 'ss_wall_elbow_pass',
    },
    mp: { _pipes: 'water_pipes_mp', _flat: 'water_fittings_press_mp' },
    // У аксиальной системы водорозетки лежат отдельно от фитингов —
    // в water_fittings (тупиковая, проточные бронзовые). Поэтому источников два.
    pex: { _pipes: 'water_pipes', _flat: ['axial_fittings_pex', 'water_fittings'] },
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
    // Крепёж (хомут, клипса, опора, фиксатор) отсюда убран намеренно.
    // Латунная арматура опознаётся по резьбе, а у крепежа резьбы нет — и
    // подбор брал ПЕРВОЕ попавшееся название с нужным словом: «Хомут 59-66 мм
    // с гайкой» превращался в «Зажим (хомут) для троса 4-5 мм». Крепёж ищется
    // по названию (matchByName), где размер из строки участвует в оценке.
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
    // Проходная водорозетка — отдельное изделие с двумя выходами, и её
    // название начинается так же, как у обычной. Шаблоны обязаны идти первыми.
    // В каталоге она называется по-разному: «проходной», «проточный»,
    // «(проходная)» — все варианты об одном и том же.
    [/угольник (проходной|проточный) настенный|угольник настенный проходной/i, 'wall_elbow_pass'],
    [/угольник проточный|проходная\)/i, 'wall_elbow_pass'],
    [/водорозетка.*(проходн|проточн)/i, 'wall_elbow_pass'],
    [/угольник настенный/i, 'wall_elbow'],
    [/водорозетка/i, 'wall_elbow'],
    [/угольник|угол/i, 'elbow90'],
    [/муфта соединительная переходная|муфта переходная/i, 'coupling_red'],
    [/муфта/i, 'coupling'],
    // Гильза (аксиал) и зажимная втулка (пресс) — одно и то же по назначению:
    // кольцо, которым труба обжимается на фитинге.
    [/монтажная гильза|гильза монтажная|зажимная втулка/i, 'sleeve'],
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
    // Стенка бывает и двузначной: «75x10,3», «110х18,3». Раньше от неё
    // читалась только первая цифра, и проход у толстых труб выходил вдвое
    // больше настоящего.
    const m = name.match(/(\d{2,3}(?:[.,]\d+)?)\s*[xх]\s*(\d{1,2}(?:[.,]\d+)?)/i);
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

    // Резьба может стоять и без пометки ВР/НР и без кавычек — так подписаны
    // радиаторные краны: «Шаровой кран для радиатора угловой PP-R 20х1/2».
    // Берём только дробь: «25х20» — это два диаметра, а не резьба.
    m = name.match(/[хx]\s*(\d\s+\d\/\d|\d\/\d|\d\.\d\/\d)(?:\s|$)/i);
    if (m) return m[1].replace(/\s+/g, ' ').replace('.', ' ').trim();
    return null;
  }

  /** Все размеры подряд для переходных тройников: «32x25x32» → [32,25,32]. */
  function parseDimChain(name) {
    const m = name.match(/(\d{2})\s*[xх]\s*(\d{2})\s*[xх]\s*(\d{2})/i);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }

  /**
   * Два размера подряд — переходная муфта: «Муфта переходная PP-R 40х32».
   * Дюймовую резьбу («25х3/4») сюда не пускаем: там второе число одноразрядное
   * и стоит перед дробью.
   */
  function parseDimPair(name) {
    const m = name.match(/(\d{2})\s*[xх]\s*(\d{2})(?!\d)(?!\s*[\/.,]\d)/i);
    return m ? [+m[1], +m[2]] : null;
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
  /**
   * Система «по умолчанию» для строки, которая о ней молчит.
   *
   * Подсказка снаружи бывает двух видов: просто название системы (так её
   * передаёт пересчёт сметы) или профиль всей сметы из systemProfile.
   * У профиля учитывается диаметр: шестнадцатого полипропилена не выпускают,
   * поэтому в смете «магистраль ППР 32 + разводка 16» шестнадцатые позиции
   * относятся к прессу или аксиалу, а не к полипропилену.
   */
  function fallbackSystem(item, hint) {
    if (!hint) return 'ppr';
    if (typeof hint === 'string') return hint;

    const small = item.d && item.d <= 16;
    if (small && (hint.main === 'ppr' || !hint.main)) {
      if (hint.counts && hint.counts.mp) return 'mp';
      if (hint.counts && hint.counts.pex) return 'pex';
      return 'mp';
    }
    return hint.main || 'ppr';
  }

  function systemOf(item, hint) {
    const fallback = fallbackSystem(item, hint);
    const t = (item.type || '').toLowerCase();
    const raw = (item.raw || '').toLowerCase();

    // Канализация — по явному типу либо по характерным диаметрам 40/50/110/160
    // у трубы/отвода/тройника/редукции. «Отвод» без уточнения системы это
    // канализационный отвод, а не полипропиленовый угол.
    if (/канализац|ревизия/.test(t)) return 'sewer';
    // Диаметры 40 и 50 есть и у полипропилена, поэтому по одному диаметру в
    // канализацию уходят только те формы, которых в напорной системе не бывает.
    // Муфта и переход раньше попадали сюда же — из-за этого «муфта комб ф40х1»
    // и «муфта ф40» оставались без артикула вовсе.
    if ([40, 50, 110, 160].includes(item.d) && !item.thread &&
        /^(труба|отвод|редукция|заглушка)/.test(t)) {
      // Канализацию считают штуками труб, напорную — метрами (правило 11
      // распознавания). Метраж и прямое упоминание полипропилена перевешивают
      // диаметр: «Труба ф40 - 12 м» это ППР, а не канализация.
      const pprHint = /ppr|ппр|стекло|полипроп/.test(`${t} ${raw}`);
      const inMeters = item.unit === 'м' && /^труба/.test(t);
      if (!pprHint && !inMeters) return 'sewer';
    }
    if ([110, 160].includes(item.d) &&
        /^(тройник|переход|муфта)/.test(t)) return 'sewer';

    // ПНД — ввод воды в дом, а не система разводки, и спутать его не с чем:
    // слово стоит прямо в строке. Проверка идёт до всех остальных, потому что
    // тип модель ставит по форме: «ПНД отвод электросв. 32» приходит как
    // «угол_ppr», и строка подбиралась аксиальным угольником 32 за 2424 ₽.
    if (t === 'пнд_муфта' || /пнд/.test(raw)) return 'hdpe';

    // Латунь опознаётся по типу, но только при отсутствии диаметра трубы.
    // «Разъёмная 25х3/4 НР» — это полипропиленовый фитинг на 25-ю трубу,
    // а не латунная американка: наличие d говорит о принадлежности к системе.
    if (BRASS_PATTERNS[t] && !item.d) return 'brass';

    // Материал, названный в строке прямо, сильнее способа соединения.
    //
    // «Пресс нерж соединитель 28*1 НР» — это нержавейка, обжатая прессом, а
    // не металлопластик: 28-го металлопластика не бывает вовсе, и такие строки
    // молча оставались без артикула. То же с аксиалом: «Stout угол 16 аксиальн.»
    // модель отдаёт с типом «угол_пресс», и слово «пресс» в ТИПЕ перевешивало
    // слово «аксиальн.» в самой строке. Поэтому сначала материал, потом способ.
    if (/впр|нерж/.test(raw)) return 'ss';
    if (/аксиал|надвижн/.test(raw)) return 'pex';

    // «Пресс» в русском обиходе монтажника — это металлопластик.
    if (/пресс/.test(t) || /пресс/.test(raw)) return 'mp';

    // «ппр» кириллицей монтажник пишет чаще, чем латиницей.
    if (/ppr|ппр|полипропилен/.test(t) || /ppr|ппр|стекло/.test(raw)) return 'ppr';

    if (t === 'труба_pex') return 'pex';

    // Водорозетка бывает в любой системе разводки, поэтому её систему
    // задаёт смета целиком, а не сама строка. Раньше здесь стояло жёсткое
    // 'mp', и в аксиальной смете подбирался пресс-фитинг.
    if (t.startsWith('водорозетка')) return fallback || 'mp';

    return fallback || 'ppr';
  }

  /**
   * Система трубопровода всей сметы.
   *
   * Отдельная строка о системе часто молчит: «муфта 25», «водорозетка 16»,
   * «клипса 32» одинаково выглядят в полипропилене, прессе и аксиале. Зато
   * список целиком её задаёт — в первую очередь трубой: нержавеющих фитингов
   * не бывает там, где нет нержавеющей трубы. Поэтому труба весит больше
   * фитинга, а результат идёт подсказкой в подбор каждой строки.
   *
   * Возвращает { main, present, counts }: main — основная система сметы
   * (null, если признаков нет вообще).
   */
  function systemProfile(rows) {
    const counts = { ppr: 0, ss: 0, mp: 0, pex: 0 };
    // Отдельно — системы, у которых в смете есть ТРУБА. Фитинг без своей
    // трубы в смете не живёт: «пресс 20х3/4» среди сплошного полипропилена
    // и без единого метра металлопластика — это полипропиленовый фитинг.
    const pipes = { ppr: 0, ss: 0, mp: 0, pex: 0 };

    for (const r of (rows || [])) {
      const t = (r.type || '').toLowerCase();
      // Подобранная позиция знает свою систему точнее рукописной строки:
      // «Комби 25х3/4» молчит, «Муфта комбинированная ВР PP-R 25х3/4» — нет.
      const matched = ((r._m && r._m.item && r._m.item.name) || '').toLowerCase();
      const s = `${t} ${(r.raw || '').toLowerCase()} ${matched}`;
      const isPipe = /^труба/.test(t) || /(^|[^а-яё])труб/.test(s);
      const weight = isPipe ? 10 : 1;

      let sys = null;
      if (/нерж|впр|aisi/.test(s)) sys = 'ss';
      else if (/аксиал|надвижн|pex|сшит/.test(s)) sys = 'pex';
      else if (/пресс|металлопласт|pe-xb\/al|мп\b/.test(s)) sys = 'mp';
      else if (/ppr|ппр|полипропилен|стекло|pp-r/.test(s)) sys = 'ppr';
      if (!sys) continue;

      counts[sys] += weight;
      if (isPipe) pipes[sys] += 1;
    }

    let main = null;
    for (const sys of Object.keys(counts)) {
      if (counts[sys] > 0 && (!main || counts[sys] > counts[main])) main = sys;
    }
    const present = Object.keys(counts).filter((s) => counts[s] > 0);
    return { main, present, counts, pipes };
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
      /**
       * Резьба сильнее набора размеров.
       *
       * «Тройник 28х1/2 ВР х28» модель отдаёт с dims=[28,28]: чисел в строке
       * несколько, и она честно их перечисляет. Но это НЕ переходной тройник,
       * а резьбовой — боковой выход у него с резьбой, а не другого диаметра.
       * Пока размеры проверялись первыми, подбор уходил в переходные тройники,
       * где резьбовых нет вовсе, и строка оставалась без артикула.
       */
      if (item.thread && item.threadType === 'НР') return 'tee_mi';
      if (item.thread && item.threadType === 'ВР') return 'tee_fi';
      // Резьба названа, а исполнение — нет: если при этом перечислены размеры,
      // значит боковой выход резьбовой. Латунный «Тройник 1 ВВВ» размеров не
      // перечисляет и сюда не попадает — он разбирается как обычный тройник.
      if (hasDims) return item.thread ? 'tee_fi' : 'tee_red';
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
    // Планка под водорозетки — крепёж, он не принадлежит трубной системе
    // и подбирается своим правилом (matchPlate).
    if (t === 'планка_водорозетка' || t === 'планка') return 'plate';
    // Гильза у аксиала, зажимная втулка у пресса — деталь соединения,
    // название разное, назначение одно.
    if (t === 'гильза' || t === 'втулка') return 'sleeve';

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
    //
    // Американка попала сюда же: своей ветки у неё не было вовсе, и строка с
    // диаметром («Пресс нерж соединитель 28х1 ВР с накидной гайкой») уходила
    // в подбор без формы, то есть в никуда. Без диаметра она по-прежнему
    // считается латунной и разбирается в matchBrass.
    if (t.startsWith('разъёмное') || t.startsWith('разъемное') || t === 'американка') {
      if (item.threadType === 'НР') return 'union_mi';
      if (item.threadType === 'ВР') return 'union_fi';
      return 'union_fi';
    }
    // Кран, вваренный в полипропилен: с резьбой это радиаторный (с накидной
    // гайкой, он же «с американкой»), без резьбы — полнопроходной в трубу.
    // «уг» в строке означает угловой корпус, это отдельный артикул.
    if (t.startsWith('кран')) {
      if (!item.thread) return 'valve';
      // \b здесь бесполезен: для регулярных выражений кириллица — не «слово»,
      // и «\bуг\b» на строке «2шт уг» не срабатывает. Поэтому границы явные.
      return (item.angle === 90 || /(^|[\s(,.\-–])уг(\.|л[а-я]*)?([\s),.]|$)/i.test(item.raw || ''))
        ? 'valve_rad_angle' : 'valve_rad';
    }

    if (t === 'переход') return 'coupling_red';
    // «муфта», «муфта_соединительная», «муфта_соед» — одно и то же изделие.
    // Комбинированная и канализационная разобраны выше, до этой строки.
    if (t.startsWith('муфта')) return 'coupling';
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

  /**
   * Бренд замены по умолчанию — STOUT.
   *
   * В счёте поставщика половина позиций чужих марок: Tiemme, itap, Aquasfera,
   * Unipump. Заменять их надо на STOUT — это основной бренд сметы. ROMMER
   * ставится только там, где он назван в строке прямо: «Подложка Rommer»,
   * «Пресс нерж труба Rommer». Никакого другого исключения нет.
   *
   * Возвращает функцию ранга: чем меньше, тем предпочтительнее.
   */
  function brandPreference(rec) {
    const raw = String((rec && rec.raw) || '');
    if (/rommer|роммер/i.test(raw)) {
      return (item) => (item && item.brand === 'ROMMER' ? -1 : brandRank(item));
    }
    return brandRank;
  }

  /**
   * Разница оценок, внутри которой решает бренд.
   *
   * Строгое равенство здесь бесполезно: у двух исполнений одного изделия
   * оценки почти никогда не совпадают до сотых, и STOUT проигрывал чужой
   * марке из-за третьего знака.
   */
  const BRAND_TIE = 0.03;

  /**
   * Сортировка кандидатов: сначала качество совпадения, при близких — бренд.
   * Возвращает компаратор, знающий, какой бренд предпочесть для этой строки.
   */
  function byScoreThenBrand(rec) {
    const rank = brandPreference(rec);
    return (a, b) => {
      if (Math.abs(b.score - a.score) > BRAND_TIE) return b.score - a.score;
      const d = rank(a.item) - rank(b.item);
      return d !== 0 ? d : b.score - a.score;
    };
  }

  let pprBrand = 'proaqua';
  function setPprBrand(brand) {
    pprBrand = (brand === 'wavin' || brand === 'ekoplastik') ? 'ekoplastik' : 'proaqua';
  }
  function catalogKey(sys) {
    return sys === 'ppr' ? `ppr_${pprBrand}` : sys;
  }

  /**
   * Метров в одной единице поставки трубы.
   *
   * Полипропилен и нержавейка продаются штангами, и цена в каталоге — за
   * штангу. В смете же трубу пишут метрами: «Труба ф32 - 50 м». Без пересчёта
   * 50 умножается на цену штанги, и труба дорожает вчетверо.
   *
   * Металлопластик и сшитый полиэтилен в тех ветках каталога, откуда идёт
   * подбор, лежат с ценой ЗА МЕТР — их здесь намеренно нет.
   */
  const PIPE_PACK = {
    ppr_ekoplastik_pipe: 4,
    ppr_proaqua_pipe: 4,
    ss_pipe_4m: 4,
    ss_pipe_4m_ru: 4,
    ss_pipe_2m: 2,
  };

  function pipePack(sys, shape) {
    if (shape !== 'pipe') return null;
    const map = CATEGORIES[catalogKey(sys)];
    if (!map) return null;
    return PIPE_PACK[map.pipe || map._pipes] || null;
  }

  /** Кандидаты каталога для формы в заданной системе. */
  function candidatesFor(sys, shape) {
    const map = CATEGORIES[catalogKey(sys)];
    if (!map) return [];

    /**
     * Разъёмного соединения как отдельного изделия у аксиала и пресса нет.
     *
     * «Соединитель 16х3/4 ВР евроконус с накидной гайкой» — это и есть
     * переходник с внутренней резьбой: накидная гайка у него в конструкции.
     * Пока такой подмены не было, строка (а их в счёте 54 штуки) уходила в
     * пустоту — категории union_fi в этих системах просто не существует.
     */
    if ((shape === 'union_fi' || shape === 'union_mi') && !map[shape]) {
      shape = shape === 'union_mi' ? 'adapter_mi' : 'adapter_fi';
    }

    if (map._flat) {
      const flatKeys = Array.isArray(map._flat) ? map._flat : [map._flat];
      let pool = shape === 'pipe'
        ? (catalog[map._pipes] || [])
        : flatKeys.reduce((acc, k) => acc.concat(catalog[k] || []), []);
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
  /**
   * Прямые замены: «вот на это ставь вот это».
   *
   * Есть позиции, у которых со своим аналогом в каталоге нет НИ ОДНОГО общего
   * слова: «Контроллер насоса ERMANGIZER» и «Блок управления насосом SIRIO
   * UNIVERSAL» — одно и то же изделие, названное совершенно по-разному.
   * Никакое правило сравнения их не свяжет, тут нужно решение человека.
   *
   * Таблица пополняется по разобранным счетам: слева — узнаваемый кусок
   * строки поставщика, справа — артикул каталога или прайса.
   */
  const EQUIVALENTS = [
    { test: /ermangizer|эрмангайзер/i, id: 'SCS-0001-000070',
      note: 'прямая замена: контроллер насоса → блок управления SIRIO UNIVERSAL' },
    { test: /блок управления смесительн|пид[- ]?регул/i, id: 'SMH-3001-104212',
      note: 'прямая замена: блок управления смесительными контурами → STOUT Thermatic 3001' },
    // Здесь замена задана НАЗВАНИЕМ, а не артикулом: у этой позиции числовой
    // код прайса меняется от редакции к редакции (15399 → 15372 при первой же
    // пересборке), и привязка к нему разваливается. Коды каталога (SAC-, RVM-,
    // SFA-) стабильны, их можно указывать артикулом.
    { test: /эктоконтрол|ectocontrol/i, name: /центральный блок.*ectocontrol/i,
      note: 'прямая замена: система сотового контроля → центральный блок Ectocontrol' },
    { test: /привод к вен|привод.*3-?х\s*ход|3-?х\s*ход.*привод/i, id: 'RVM-0005-230001',
      note: 'прямая замена: привод к трёхходовому клапану → сервопривод ROMMER 230 В' },
  ];

  /** Позиция каталога или прайса по артикулу — для таблицы прямых замен. */
  function itemByArticle(id) {
    const idx = buildNameIndex();
    const norm = (s) => String(s || '').replace(/[\s.\-]/g, '').toUpperCase();
    const want = norm(id);
    const row = idx.rows.find((r) => norm(r.it.id) === want || norm(r.it.article) === want);
    return row ? row.it : null;
  }

  /** Позиция каталога или прайса по названию — для замен без стабильного кода. */
  function itemByName(re) {
    const idx = buildNameIndex();
    let best = null;
    for (const row of idx.rows) {
      if (!re.test(row.it.name)) continue;
      // При нескольких подходящих берём выверенную каталожную, а среди равных
      // — ту, что дешевле: замена не должна дорожать на ровном месте.
      const rank = (row.fromPrice ? 1 : 0);
      if (!best || rank < best.rank ||
          (rank === best.rank && row.it.price < best.row.it.price)) best = { row, rank };
    }
    return best ? best.row.it : null;
  }

  function matchEquivalent(rec) {
    const raw = String(rec.raw || '');
    for (const eq of EQUIVALENTS) {
      if (!eq.test.test(raw)) continue;
      const item = eq.name ? itemByName(eq.name) : itemByArticle(eq.id);
      if (!item) continue;
      return {
        item,
        score: 0.9,
        substituted: eq.note,
        brandRank: brandRank(item),
        needsApproval: true,
        alternatives: [],
      };
    }
    return null;
  }

  function matchItem(rec, sysHint) {
    // Приводим строку в порядок до всех поисков: по прайсу «Кран 15» иначе
    // ищется по числу 15, которого в названиях латунной арматуры нет, а
    // строка без типа не ищется вовсе.
    const r = normalize(rec);
    // Прямая замена, назначенная человеком, важнее любого расчёта похожести.
    // Третий заход — по самому названию. Он выручает строки, у которых нет
    // ни формы, ни слова в TYPE_WORDS: бойлер, сервопривод, шкаф, подложка.
    // Раньше такие строки не искались нигде и всегда уходили с ценой 0.
    return matchEquivalent(r) || matchCatalog(r, sysHint) || matchPrice(r) || matchByName(r);
  }

  /**
   * Подбор канализации по каталогу sewer_silent.
   *
   * Формы канализации называются иначе, чем в водоснабжении: «Отвод» вместо
   * угла, «Редукция»/«Переход эксц.» вместо перехода. Угол у канализации
   * стандартно 87°, а на бумаге пишут «90°» — сопоставляем.
   */
  /**
   * Диаметры бесшумной серии.
   *
   * У бесшумной канализации STOUT наружный диаметр другой: там, где обычная
   * труба 50 мм, бесшумная — 58 мм (у ROMMER тот же артикул подписан как
   * D 050). Монтажник пишет привычные 50, подбор искал «D 050», не находил
   * ничего и уходил в прайс — где брал ОБЫЧНУЮ трубу за 93 ₽ вместо
   * бесшумной за 857 ₽. Разные изделия и разные деньги.
   */
  const SEWER_SILENT_D = { 50: 58, 40: 40, 110: 110, 160: 160 };

  /**
   * Длина трубы из строки: «50*1000мм», «110х2000 мм».
   *
   * Без неё все фановые трубы одного диаметра сваливались в одну позицию:
   * и метровая, и двухметровая подбирались к первой попавшейся.
   */
  function sewerLength(raw) {
    const s = String(raw || '');
    const mm = s.match(/[*х×x]\s*(\d{3,4})\s*мм/i);
    if (mm) return +mm[1];
    // Длину пишут и метрами: «Труба 110 - 2 м - 6 шт» — это шесть труб по
    // два метра. Канализационную трубу режут на 0,5–3 м, поэтому больше трёх
    // здесь уже не длина изделия, а метраж трассы.
    const m = s.match(/(?:^|[\s\-–])([0-3])(?:[.,]5)?\s*м(?![мa-zа-яё])/i);
    if (!m) return null;
    const val = parseFloat(m[0].replace(/[^\d.,]/g, '').replace(',', '.'));
    return val > 0 ? Math.round(val * 1000) : null;
  }

  /**
   * Полный список бесшумной канализации.
   *
   * В catalog.js её лежит четыре позиции — те, что нужны расчёту калькулятора.
   * В прайсе серия полная: сорок с лишним артикулов, включая тройник 58x58,
   * трубы на 250, 500, 1500 и 3000 мм. Подбор искал только по каталогу, не
   * находил половину серии и уходил в прайс — где брал ОБЫЧНУЮ канализацию
   * вместо бесшумной. Поэтому пул собираем из обоих источников; каталог идёт
   * первым, у его позиций проставлены бюджетные аналоги.
   */
  let sewerCache = null;
  function sewerPool() {
    if (sewerCache) return sewerCache;
    sewerCache = ((typeof catalog !== 'undefined' && catalog.sewer_silent) || []).slice();
    const seen = new Set(sewerCache.map((it) => String(it.id || '').toUpperCase()));
    for (const r of (priceIndex || [])) {
      if (!/бесшум/i.test(r.s || '')) continue;
      const id = String(r.a || '').toUpperCase();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      sewerCache.push({ id: r.a, article: r.a, name: r.n, price: r.p, brand: 'STOUT' });
    }
    return sewerCache;
  }

  function matchSewer(rec) {
    const pool = sewerPool();
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
    const wantLen = /труба/.test(t) ? sewerLength(rec.raw) : null;

    let best = null;
    for (const it of pool) {
      const n = it.name;
      if (!re.test(n)) continue;

      let score = 0, max = 0;

      // Диаметр обязателен и ищется как отдельное число: «D 110», «D 050».
      // Принимаем и диаметр бесшумной серии: 50 в строке — это D 058.
      if (rec.d) {
        max += 2;
        const dm = n.match(/D\s*0*(\d{2,3})/i);
        const want = [rec.d, SEWER_SILENT_D[rec.d]].filter(Boolean);
        if (dm && want.includes(+dm[1])) score += 2;
      }
      if (wantAngle) {
        max += 1;
        if (n.includes(wantAngle + '°') || n.includes(wantAngle + ' ')) score += 1;
      }
      /**
       * Длина трубы. Точное совпадение — то, что заказано; иначе даём тем
       * больше, чем ближе. Полуметровой трубы в бесшумной серии нет, и
       * подобрать метровую разумнее, чем двухметровую, — но видно, что это
       * замена: оценка не дотянет до единицы.
       */
      let gotLen = null;
      if (wantLen) {
        max += 1;
        const lm = n.match(/L\s*0*(\d{3,4})/i);
        if (lm) {
          gotLen = +lm[1];
          score += gotLen === wantLen
            ? 1
            : Math.max(0, 1 - Math.abs(gotLen - wantLen) / Math.max(gotLen, wantLen));
        }
      }
      if (max === 0) continue;

      const rel = score / max;
      if (!best || rel > best.rel) best = { rel, item: it, len: gotLen };
    }

    if (!best || best.rel < 0.75) return null;
    // Длину, которой в серии нет, подменяем ближайшей — но об этом надо
    // сказать: две трубы по 500 мм это не одна метровая.
    const lenNote = (wantLen && best.len && best.len !== wantLen)
      ? `в серии нет длины ${wantLen} мм — подобрана ${best.len} мм, пересчитайте количество`
      : null;
    return {
      item: best.item,
      score: lenNote ? Math.min(best.rel, 0.8) : best.rel,
      substituted: lenNote,
      brandRank: brandRank(best.item),
      needsApproval: brandRank(best.item) >= 3 || !!lenNote,
      alternatives: [],
    };
  }

  /**
   * «Кран 15», «Кран 20» — это условный проход, то есть резьба, а не труба.
   *
   * Латунную арматуру монтажник меряет по DN, и труб таких диаметров в этих
   * системах просто нет: 15 мм не бывает вовсе, а 20 мм пишут как «ппр 20».
   * Поэтому у арматуры без резьбы, но с DN-подобным диаметром переводим его
   * в дюймы — иначе строка уходила в подбор по трубной системе и не находила
   * ничего.
   */
  /**
   * Спасение строк, которым распознавание не дало типа.
   *
   * Модель иногда возвращает «прочее» там, где предмет назван первым же
   * словом: «Труба ф32 - 50м стекло», «Радиатор 8сек». Отказываться от такой
   * строки глупо — тип написан прямо в ней. Берём его по первому слову.
   */
  const RAW_TYPES = [
    // «Трубка» — не труба: так называют короткий соединительный отрезок
    // («Stout трубка 250х16х15»), и подставлять вместо него бухту трубы нельзя.
    [/^труб(?!к)/i, 'труба'],
    [/^(муфта комб|комби)/i, 'муфта_комбинированная'],
    [/^муфт/i, 'муфта'],
    [/^(переход|редукц)/i, 'переход'],
    [/^(гильз|зажимная втулк|втулк)/i, 'гильза'],
    [/^(разъемн|разъёмн)/i, 'разъёмное_соединение'],
    [/^кран/i, 'кран_шаровой'],
    [/^американк/i, 'американка'],
    [/^тройник/i, 'тройник'],
    [/^(угол|угольник)/i, 'угол_ppr'],
    [/^отвод/i, 'отвод_канализация'],
    [/^водорозетк/i, 'водорозетка'],
    [/^клипс/i, 'клипса'],
    [/^хомут/i, 'хомут'],
    [/^опор/i, 'опора'],
    [/^фильтр/i, 'фильтр'],
    [/^ниппел/i, 'ниппель'],
    [/^футорк/i, 'футорка'],
  ];

  /**
   * Тип, записанный латиницей.
   *
   * Модель возвращает то «кран_ppr», то «kran_ppr» — на глаз одно и то же,
   * а для кода это разные строки, и по «kran_ppr» не срабатывает ни одна
   * проверка: строка уходит в смету без артикула. Переводим обратно в
   * кириллицу, сохраняя технические обозначения (ppr, pex) как есть.
   */
  const TRANSLIT = [
    ['shch', 'щ'], ['sch', 'щ'], ['sh', 'ш'], ['ch', 'ч'], ['zh', 'ж'], ['ts', 'ц'],
    ['kh', 'х'], ['yo', 'ё'], ['yu', 'ю'], ['ya', 'я'], ['ye', 'е'],
    ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'], ['z', 'з'],
    ['i', 'и'], ['j', 'й'], ['y', 'й'], ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'],
    ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'], ['f', 'ф'],
    ['h', 'х'], ['c', 'ц'], ['w', 'в'], ['x', 'кс'], ['q', 'к'], ["'", 'ь'],
  ];

  // Мягкий знак латиницей не пишут, поэтому такие типы правим по началу слова.
  const TYPE_FIX = [
    [/^нипп?ел/, 'ниппель'],
    [/^фил[ья]?тр/, 'фильтр'],
    [/^раз[ъьйё]?[её]м/, 'разъёмное_соединение'],
    [/^водороз/, 'водорозетка'],
  ];

  function fromLatin(type) {
    let t = String(type || '').toLowerCase().trim();
    if (!/[a-z]/.test(t)) return t;

    const keep = [];
    t = t.replace(/pp-?rct|pp-?r|ppr|pe-?x|pex|pe-?rt|pn\s*\d+|sdr/g,
      (m) => ` ${keep.push(m) - 1} `);
    for (const [lat, cyr] of TRANSLIT) t = t.split(lat).join(cyr);
    t = t.replace(/ (\d+) /g, (_, i) => keep[+i]);

    for (const [re, fixed] of TYPE_FIX) if (re.test(t)) return fixed;
    return t;
  }

  function normalizeType(rec) {
    const latin = fromLatin(rec.type);
    if (latin && latin !== (rec.type || '').toLowerCase()) rec = { ...rec, type: latin };

    const t = (rec.type || '').toLowerCase();
    if (t && t !== 'прочее') return rec;
    // Номер позиции в начале строки («12. Труба…») к типу отношения не имеет.
    const raw = String(rec.raw || '').trim().replace(/^[\d).\s№-]+/, '');

    /**
     * Предмет назван не обязательно первым словом.
     *
     * В счёте поставщика впереди часто стоит система или узел: «Пресс нерж
     * ТРУБА 28х1,2», «Корпус ФИЛЬТРА 10 Big Blue», «ПНД ОТВОД 32». Раньше
     * шаблоны примерялись только к началу строки, такие позиции оставались
     * с типом «прочее» и не искались вовсе. Смотрим первые три слова —
     * дальше третьего предмет в названии не уезжает, а лишний просмотр
     * начал бы цеплять уточнения вроде «под нержавеющую трубу».
     */
    const starts = [raw];
    const words = raw.split(/\s+/);
    for (let i = 1; i < Math.min(3, words.length); i++) starts.push(words.slice(i).join(' '));

    for (const [re, type] of RAW_TYPES) {
      if (!starts.some((s) => re.test(s))) continue;
      if (type === 'кран_шаровой' && /ппр|ppr/i.test(raw)) return { ...rec, type: 'кран_ppr' };
      // ПНД к канализации отношения не имеет: «ПНД отвод 32» — это сварной
      // фитинг водопроводного ввода, и канализационный отвод D032 вместо него
      // ставить нельзя. Диаметры у них совпадают, названия — нет. Своего типа
      // для ПНД-отвода нет, поэтому строка остаётся без типа и ищется по
      // названию — честнее, чем выдать соединительную муфту вместо отвода.
      if (/канализац/.test(type) && /пнд/i.test(raw)) continue;
      return { ...rec, type };
    }
    return rec;
  }

  /** Ряд диаметров, по которому отличаем размер от количества и метража. */
  // Полимерный ряд плюс ряд нержавейки и меди (15, 18, 22, 28, 35, 42, 54):
  // без него «Пресс нерж труба 28х1,2» оставалась без диаметра, а значит и
  // без подбора — двадцать восьмого в полимерном ряду нет.
  const PIPE_DS = [15, 16, 18, 20, 22, 25, 28, 32, 35, 40, 42, 50, 54, 63, 75, 90, 110, 160];

  /**
   * Диаметр, резьба и пара размеров, когда распознавание их не выделило.
   *
   * Строку «Кран ппр с амер 1/2 - 20 - 2шт уг» модель иногда отдаёт без полей
   * вовсе, а «ф32 х 20 - 2шт» — это переход, у которого размеры записаны
   * только в тексте. Числа читаем осторожно: «2шт» это количество, «50м» —
   * метраж, «1/2» — резьба, и диаметром считаем лишь число из ряда труб.
   */
  function normalizeD(rec) {
    const raw = String(rec.raw || '');
    const out = { ...rec };

    if (!out.thread) {
      // Разделителем перед резьбой бывает и звёздочка: «28*1/2 ВР*28» —
      // так пишут в счетах 1С. Без неё дробь не выделялась, тройник считался
      // переходным и не находился вовсе.
      const th = raw.match(/(?:^|[\s(х×x*-])(\d\s+\d\s*\/\s*\d|\d\s*\/\s*\d)(?![\d])/);
      if (th) out.thread = th[1].replace(/\s*\/\s*/, '/').replace(/\s+/, ' ');
    }

    if (!out.angle && (!Array.isArray(out.dims) || out.dims.length < 2)) {
      const pair = raw.match(/[фfdØø]?\s*(\d{2,3})\s*[хx]\s*(\d{2,3})(?!\d)(?!\s*[\/.,]\d)/i);
      // Переход всегда с большего на меньший, поэтому «25х90» — это не пара
      // размеров, а диаметр с углом: «Угол ппр 25х90».
      if (pair && +pair[1] > +pair[2] &&
          PIPE_DS.includes(+pair[1]) && PIPE_DS.includes(+pair[2])) {
        out.dims = [+pair[1], +pair[2]];
      }
    }

    if (!out.d) {
      const m = raw.match(/(?:^|[\s(х-])[фfdØø]\s*(\d{2,3})(?!\d)/i) ||
                raw.match(/\b(\d{2,3})\s*мм\b/i);
      if (m) out.d = +m[1];
      else if (Array.isArray(out.dims) && out.dims.length) out.d = out.dims[0];
      else {
        // Отдельно стоящее число из ряда труб: «… с амер 1/2 - 20 - 2шт».
        const nums = raw.match(/(?:^|[^\d\/.,])(\d{2,3})(?![\d\/.,]|\s*(?:шт|м\b))/g) || [];
        const hit = nums.map(s => +s.replace(/\D/g, '')).find(n => PIPE_DS.includes(n));
        if (hit) out.d = hit;
      }
    }
    return out;
  }

  const DN_THREAD = { 15: '1/2', 20: '3/4', 25: '1', 32: '1 1/4', 40: '1 1/2', 50: '2' };
  const DN_TYPES = /^(кран|американка|ниппель|футорка|фильтр|разъ)/;

  /**
   * Приведение строки в порядок целиком — и ровно один раз.
   *
   * Повторный проход ломал результат: normalizeDn переводит «Кран 25» в резьбу
   * 1" и убирает диаметр, а normalizeD на втором круге видел «25» в тексте и
   * возвращал его обратно. Получался кран с резьбой 1" на трубе 25 — такого
   * изделия нет, и строка оставалась без артикула. Флаг ставим на копии,
   * чтобы не пачкать строку, которую правит монтажник.
   */
  function normalize(rec) {
    if (rec._norm) return rec;
    const out = normalizeDn(normalizeD(normalizeType(rec)));
    return out === rec ? { ...rec, _norm: true } : Object.assign(out, { _norm: true });
  }

  function normalizeDn(rec) {
    if (rec.thread || !DN_THREAD[rec.d]) return rec;
    const t = (rec.type || '').toLowerCase();
    if (!DN_TYPES.test(t)) return rec;
    // Про полипропилен и пресс сказано прямо — там 20 и 25 это труба.
    if (/ppr|ппр|пресс|полипропилен|стекло/i.test(`${t} ${rec.raw || ''}`)) return rec;
    return { ...rec, thread: DN_THREAD[rec.d], d: null };
  }

  /**
   * Система для конкретной строки с оглядкой на всю смету.
   *
   * Фитинг подбирается ПОД ТРУБУ. Слово в строке («пресс») называет систему,
   * но если её трубы в смете нет, а другая система в ней явно преобладает —
   * значит монтажник назвал фитинг по привычке, а собирает он другую систему.
   * Так «Пресс 20х3/4 нр» в смете сплошь из полипропилена перестаёт быть
   * металлопластиковым переходником за 559 ₽.
   *
   * Правило намеренно осторожное: переключаем, только когда своей трубы нет
   * вовсе, а чужая система весит втрое больше. В смешанной смете (магистраль
   * полипропиленом, разводка прессом) обе системы весомы, и всё остаётся как
   * написано.
   */
  function systemForRow(rec, hint) {
    const sys = systemOf(rec, hint);

    // Перевод сметы в другую систему — решение человека, и слова в строке
    // («труба PPR 32») его не отменяют. Латунная арматура, канализация и ПНД
    // к трубной системе не относятся и остаются как есть.
    if (rec._forceSys && sys !== 'brass' && sys !== 'sewer' && sys !== 'hdpe') {
      return rec._forceSys;
    }

    if (!hint || typeof hint === 'string') return sys;
    if (sys === 'brass' || sys === 'sewer' || sys === 'hdpe') return sys;

    const counts = hint.counts || {};
    const pipes = hint.pipes || {};
    const main = hint.main;
    if (!main || main === sys) return sys;

    /**
     * Подменять можно только СПОСОБ СОЕДИНЕНИЯ, но не материал.
     *
     * Правило родилось из «Пресс 20х3/4» посреди сплошного полипропилена:
     * слово «пресс» монтажник пишет по привычке. Но материал по привычке не
     * пишут. «PPRC Чехия обвод 20 Ekoplastik» подбирался аксиальным угольником
     * за 583 ₽ только потому, что аксиала в смете больше, — хотя в строке
     * прямым текстом назван полипропилен конкретного производителя.
     */
    if (/полипропилен|pp-?r|ppr|ekoplastik|экопластик|proaqua|про ?аква|нержав|нерж\b|аксиал|надвижн|pex|сшит|металлопласт/i.test(rec.raw || '')) {
      return sys;
    }

    if (pipes[sys]) return sys;                    // своя труба в смете есть
    if ((counts[main] || 0) < (counts[sys] || 0) * 3) return sys;
    // Шестнадцатого полипропилена не бывает — такую подмену не делаем.
    if (main === 'ppr' && rec.d && rec.d <= 16) return sys;
    return main;
  }

  /**
   * Монтажная планка под водорозетки.
   *
   * Это крепёж из mounting_system, а не фитинг: он не зависит ни от системы
   * трубопровода, ни от диаметра, поэтому обычный подбор по форме его не
   * находил. По умолчанию берём двойную — на планку встают две водорозетки,
   * именно из этого расчёта и пишут «планка под водорозетки».
   */
  function matchPlate(rec) {
    const pool = (typeof catalog !== 'undefined' && catalog.mounting_system || [])
      .filter((it) => it && it.name && /монтажная планка/i.test(it.name));
    if (!pool.length) return null;

    const raw = String(rec.raw || '').toLowerCase();
    const single = /одинарн|одиночн/.test(raw);
    const want150 = /150/.test(raw);

    let best = pool.find((it) => single
      ? /одинарн/i.test(it.name)
      : (/двойн/i.test(it.name) && (want150 ? /150/.test(it.name) : /100/.test(it.name))));
    if (!best) best = pool.find((it) => /двойн/i.test(it.name)) || pool[0];

    return {
      item: best,
      score: 1,
      brandRank: brandRank(best),
      needsApproval: brandRank(best) >= 3,
      alternatives: pool.filter((it) => it !== best).slice(0, 3),
    };
  }

  function matchCatalog(rec, sysHint) {
    rec = normalize(rec);

    // Прибор отопления к трубопроводным системам не относится: у него ни
    // диаметра, ни резьбы — только материал, высота и число секций.
    if (isRadiator(rec)) return matchRadiator(rec);
    if (isPump(rec)) return matchPump(rec);
    // Бак к трубопроводу тоже не относится: его выбирают объём и назначение.
    if (isTank(rec)) return matchTank(rec);
    if (isCorrugated(rec)) return matchCorrugated(rec);
    // Консоль выбирают по вылету, а не по трубной системе.
    if (isConsole(rec)) {
      const c = matchConsole(rec);
      if (c) return c;
    }

    // Система берётся от самой позиции; подсказка снаружи — лишь запасной
    // вариант для случаев, когда по типу определить не удалось.
    const sys = systemForRow(rec, sysHint);

    if (sys === 'brass') return matchBrass(rec);
    if (sys === 'sewer') return matchSewer(rec);

    const shape = shapeOf(rec);
    if (!shape) return null;
    if (shape === 'plate') return matchPlate(rec);

    let pool = candidatesFor(sys, shape);

    // Проходной водорозетки в пресс-системе нет: в ассортименте она бывает
    // аксиальной (бронзовый проточный угольник) и нержавеющей. Сначала ищем
    // её у аксиальной системы — это то же изделие того же назначения, —
    // и только если и там пусто, ставим обычную настенную. Обе замены
    // помечаются: подобрано похожее, а не ровно то, что написано.
    let substituted = null;
    if (!pool.length && (shape === 'wall_elbow_pass' || shape === 'wall_elbow')) {
      const axial = sys === 'pex' ? [] : candidatesFor('pex', shape);
      if (axial.length) {
        pool = axial;
        substituted = 'в этой системе такой водорозетки нет — подобрана аксиальная';
      } else if (shape === 'wall_elbow_pass') {
        const blind = candidatesFor(sys, 'wall_elbow');
        if (blind.length) {
          pool = blind;
          substituted = 'проходной водорозетки нет — подобрана обычная настенная';
        }
      }
    }
    if (!pool.length) return null;

    // Когда названа резьба, набор размеров сравнивать нельзя: у «Тройника
    // 28х1/2 ВР х28» dims=[28,28], а в каталоге он подписан «28х1/2» — цепочка
    // размеров не совпадёт ни с чем и обнулит оценку верной позиции.
    const wantChain = !rec.thread && Array.isArray(rec.dims) && rec.dims.length > 1
      ? rec.dims : null;
    const scored = [];

    for (const it of pool) {
      let score = 0, max = 0;

      if (wantChain && wantChain.length > 2) {
        max += 3;
        const chain = parseDimChain(it.name);
        if (chain && chain.join('x') === wantChain.join('x')) score += 3;
        else if (chain && chain[0] === wantChain[0]) score += 1;
      } else if (wantChain) {
        // Переход «40х32»: в каталоге это два размера, а не три. Раньше сюда
        // применялся разбор тройников, он таких названий не видел — и любой
        // переход оставался «нет в каталоге».
        max += 3;
        const pair = parseDimPair(it.name);
        if (pair && pair[0] === wantChain[0] && pair[1] === wantChain[1]) score += 3;
        else if (pair && pair[0] === wantChain[0]) score += 1;
      } else if (rec.d) {
        max += 2;
        if (parseFittingD(it.name) === rec.d) score += 2;
      }

      // Армирование — это разные трубы одного диаметра и разная цена.
      // «Стекло» в смете означает стекловолокно (RUBIS), а не фольгу (DUO),
      // и раньше обе получали одинаковую оценку: побеждала просто первая.
      // Смысл есть только у полипропилена: у нержавейки и пресса армирования
      // нет, и требование «стекло» там валило оценку любой трубы.
      if (shape === 'pipe' && sys === 'ppr') {
        const src = `${rec.type || ''} ${rec.raw || ''}`.toLowerCase();
        const wantFiber = /стекл|_ст\b|rubis/.test(src);
        const wantFoil = /фольг|алюм|duo|stabi/.test(src);
        if (wantFiber || wantFoil) {
          const isFiber = /стеклово|rubis/i.test(it.name);
          const isFoil = /фольг|duo|stabi/i.test(it.name);
          max += 2;
          if ((wantFiber && isFiber) || (wantFoil && isFoil)) score += 2;
        }
        // Класс давления, если он назван: PN 20 и PN 25 — разные артикулы.
        const pn = (rec.raw || '').match(/pn\s*(\d{2})/i) || (rec.raw || '').match(/sdr\s*(\d(?:[.,]\d)?)/i);
        if (pn) {
          max += 1;
          if (new RegExp('(PN|SDR)\\s*' + pn[1].replace(',', '[.,]'), 'i').test(it.name)) score += 1;
        }
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
    scored.sort(byScoreThenBrand(rec));
    // Ниже двух третей совпадения считаем, что позиции в каталоге нет.
    // Лучше честное «не найдено» на экране проверки, чем тихая подмена.
    if (scored[0].score < 0.67) return null;

    return {
      item: scored[0].item,
      // Замена на похожее изделие — это не полное совпадение, и в проверке
      // строка должна показывать, что подобрано не ровно то, что написано.
      score: substituted ? Math.min(scored[0].score, 0.8) : scored[0].score,
      substituted,
      brandRank: brandRank(scored[0].item),
      needsApproval: brandRank(scored[0].item) >= 3,
      alternatives: scored.slice(1, 4).filter((s) => s.score > 0.4).map((s) => s.item),
      // Метров в штанге — по нему метраж из сметы переводится в штуки.
      pack: pipePack(sys, shape),
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

    // Кран — отдельное изделие, а не разновидность американки. «Сгон америк.
    // углов. ВН 1/2» подбирался к «Крану шаровому с американкой 1/2"»: слово
    // «американка» есть в обоих названиях, и в смету вместо сгона за 500 ₽
    // вставал кран за 1082 ₽. Обратное направление уже учтено порядком
    // шаблонов, здесь закрываем прямое.
    const wantValve = /^кран/.test((rec.type || '').toLowerCase());

    for (const re of patterns) {
      const pool = brassPool().filter((it) => it.name && re.test(it.name) &&
        (wantValve || !/кран|вентил/i.test(it.name)));
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
        hits.sort(byScoreThenBrand(rec));
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
  // Радиаторы
  //
  // В рукописной смете прибор пишут коротко: «Радиатор 8сек - 1шт». Ни модели,
  // ни материала, ни высоты. Оставлять такую строку без артикула нельзя —
  // радиатор весит в смете больше, чем вся обвязка, и уходить с ценой 0 он не
  // должен. Поэтому берём то, что названо, а недостающее ставим по умолчанию:
  // биметалл STOUT SPACE 500 мм. Подстановка снижает оценку совпадения, то есть
  // строка приходит на проверку подсвеченной, а не подменяется молча.
  // ---------------------------------------------------------------------------

  const RAD_DEFAULT_KIND = 'бимет';
  const RAD_DEFAULT_HEIGHT = 500;

  /**
   * Серии радиаторов каталога с их материалом и высотой.
   *
   * Массивы объявлены в catalog.js как отдельные константы (не внутри объекта
   * catalog), поэтому обращаемся по именам и страхуемся typeof: часть серий
   * может отсутствовать в старой редакции каталога.
   */
  let radCache = null;
  function radPools() {
    if (radCache) return radCache;
    radCache = [];
    const add = (arr, kind, height, series) => {
      if (Array.isArray(arr) && arr.length) radCache.push({ items: arr, kind, height, series });
    };

    // Первой идёт серия по умолчанию: SPACE, биметалл, 500 мм.
    if (typeof catalog !== 'undefined') add(catalog.rads, 'бимет', 500, 'space');
    if (typeof spaceRuRads !== 'undefined') add(spaceRuRads, 'бимет', 500, 'space');
    if (typeof spaceRu350Rads !== 'undefined') add(spaceRu350Rads, 'бимет', 350, 'space');
    if (typeof titanRads !== 'undefined') add(titanRads, 'бимет', 500, 'titan');
    if (typeof titanSideRads !== 'undefined') add(titanSideRads, 'бимет', 500, 'titan');
    if (typeof titanSide350Rads !== 'undefined') add(titanSide350Rads, 'бимет', 350, 'titan');
    if (typeof titanSide200Rads !== 'undefined') add(titanSide200Rads, 'бимет', 200, 'titan');
    if (typeof titanBottom350Rads !== 'undefined') add(titanBottom350Rads, 'бимет', 350, 'titan');
    if (typeof rommerOptimaBmRads !== 'undefined') add(rommerOptimaBmRads, 'бимет', 500, 'optima');
    if (typeof rommerProfiBmRads !== 'undefined') add(rommerProfiBmRads, 'бимет', 500, 'profi');
    if (typeof rommerPlusBmRads !== 'undefined') add(rommerPlusBmRads, 'бимет', 500, 'plus');

    if (typeof aluminumRads !== 'undefined') add(aluminumRads, 'алюм', 500, 'stout');
    if (typeof aluminum350Rads !== 'undefined') add(aluminum350Rads, 'алюм', 350, 'stout');
    if (typeof vega500AlRads !== 'undefined') add(vega500AlRads, 'алюм', 500, 'vega');
    if (typeof rommerProfiAlRads !== 'undefined') add(rommerProfiAlRads, 'алюм', 500, 'profi');
    if (typeof rommerPlusAlRads !== 'undefined') add(rommerPlusAlRads, 'алюм', 500, 'plus');
    if (typeof rommerPlusAl200Rads !== 'undefined') add(rommerPlusAl200Rads, 'алюм', 200, 'plus');

    // У стальных панельных высота своя у каждой позиции, поэтому серия одна.
    if (typeof steelRads !== 'undefined') add(steelRads, 'сталь', null, 'steel');
    return radCache;
  }

  // Слова, из-за которых строка с «радиатором» радиатором НЕ является:
  // радиаторный кран, коллектор, узел подключения, монтаж радиатора.
  const RAD_NOT = /кран|коллектор|узел|термоголов|голов|клапан|пробк|ниппель|кроншт|держат|подключ|монтаж|трубк|заглуш/i;

  function isRadiator(rec) {
    const t = (rec.type || '').toLowerCase();
    if (t === 'радиатор') return true;
    // Строку «Радиатор 8сек» модель раньше относила к «прочее» — такие
    // подхватываем по тексту, но только если это точно сам прибор.
    if (t && t !== 'прочее') return false;
    const raw = String(rec.raw || '');
    return /(^|[\s(№.])рад(иатор|\.)/i.test(raw) && !RAD_NOT.test(raw);
  }

  /** Число секций: из разбора либо из текста строки. */
  function radSections(rec) {
    const n = Number(rec.sections);
    if (n > 0) return Math.round(n);
    const m = String(rec.raw || '').match(/(\d{1,2})\s*сек/i);
    return m ? +m[1] : null;
  }

  /** Материал прибора. null означает «не назван» — тогда ставим биметалл. */
  function radKindOf(rec) {
    const k = String(rec.radKind || '').toLowerCase();
    if (/бимет/.test(k)) return 'бимет';
    if (/алюм|al/.test(k)) return 'алюм';
    if (/сталь|панельн/.test(k)) return 'сталь';

    const s = String(rec.raw || '').toLowerCase();
    if (/панельн|стальн|тип\s*(11|21|22|33)|compact|ventil/.test(s)) return 'сталь';
    if (/алюмин|\bал\b|\bal\b|profi|plus\b|vega/.test(s)) return 'алюм';
    if (/бимет|\bбм\b|\bbm\b|space|спейс|титан|titan|optima/.test(s)) return 'бимет';
    return null;
  }

  /** Высота прибора, если названа: 200/350/500 у секционных. */
  function radHeightOf(rec) {
    const h = Number(rec.height);
    if (h > 0) return Math.round(h);
    const m = String(rec.raw || '').match(/\b(200|300|350|400|500|600)\b/);
    return m ? +m[1] : null;
  }

  /** Серия, если названа прямо: SPACE, TITAN, Optima и т. д. */
  function radSeriesOf(rec) {
    const s = String(rec.raw || '').toLowerCase();
    if (/space|спейс/.test(s)) return 'space';
    if (/titan|титан/.test(s)) return 'titan';
    if (/optima|оптима/.test(s)) return 'optima';
    if (/profi|профи/.test(s)) return 'profi';
    if (/plus|плюс/.test(s)) return 'plus';
    if (/vega|вега/.test(s)) return 'vega';
    return null;
  }

  function radResult(item, score, alternatives) {
    return {
      item,
      score,
      brandRank: brandRank(item),
      needsApproval: brandRank(item) >= 3,
      alternatives: alternatives || [],
    };
  }

  function matchRadiator(rec) {
    const kindGiven = radKindOf(rec);
    const kind = kindGiven || RAD_DEFAULT_KIND;
    const series = radSeriesOf(rec);
    const height = radHeightOf(rec);

    let pools = radPools().filter((p) => p.kind === kind);
    if (!pools.length) return null;

    if (series) {
      const byS = pools.filter((p) => p.series === series);
      if (byS.length) pools = byS;
    }
    if (kind !== 'сталь') {
      // Высота меняет и мощность, и цену. Не названа — берём 500 мм: это
      // ходовой размер, из него собран весь расчёт калькулятора.
      const want = height || RAD_DEFAULT_HEIGHT;
      const byH = pools.filter((p) => p.height === want);
      if (byH.length) pools = byH;
    }

    return kind === 'сталь'
      ? matchSteelRad(rec, pools, !kindGiven)
      : matchSectionRad(rec, pools, !kindGiven);
  }

  /** Секционный прибор: решает число секций. */
  function matchSectionRad(rec, pools, kindGuessed) {
    const sec = radSections(rec);
    if (!sec) return null;   // без секций подставлять наугад нечего

    let best = null;
    for (const p of pools) {
      for (const it of p.items) {
        if (!it || it.price == null || it.sec == null) continue;
        const diff = Math.abs(it.sec - sec);
        const better = !best || diff < best.diff ||
          (diff === best.diff && brandRank(it) < brandRank(best.item));
        if (better) best = { item: it, diff };
      }
    }
    if (!best) return null;

    // Точное число секций — это ровно тот прибор. Иначе мощность уже другая,
    // и строка обязана попасть на проверку подсвеченной.
    let score = best.diff === 0 ? 1 : Math.max(0.5, 1 - best.diff * 0.15);
    // Материал взят по умолчанию — это уже допущение, и его видно на проверке.
    // Высоту по умолчанию (500 мм) за допущение не считаем: другой размер
    // монтажник пишет явно, а 500 мм — то, что стоит в подавляющем большинстве.
    if (kindGuessed) score = Math.min(score, 0.9);

    // В альтернативы кладём тот же размер в других материалах: чаще всего
    // правка — это именно «нужен был алюминий», а не другое число секций.
    const alts = [];
    for (const p of radPools()) {
      if (pools.includes(p) || alts.length >= 3) continue;
      const same = p.items.find((it) => it && it.sec === sec && it.price != null);
      if (same) alts.push(same);
    }
    return radResult(best.item, score, alts);
  }

  /**
   * Стальной панельный: секций у него нет, его определяют тип (11/21/22/33),
   * высота и длина — их и пишут в смете как «22-500-1000».
   */
  function matchSteelRad(rec, pools, kindGuessed) {
    const raw = String(rec.raw || '');
    const dims = Array.isArray(rec.dims) ? rec.dims.map(Number).filter(Boolean) : [];
    const nums = dims.length ? dims : (raw.match(/\d{2,4}/g) || []).map(Number);

    const type = nums.find((n) => [11, 21, 22, 33].includes(n)) || null;
    const height = radHeightOf(rec) || nums.find((n) => n >= 200 && n <= 900) || null;
    const len = nums.find((n) => n >= 400 && n <= 3000 && n !== height) || null;
    if (!type && !len) return null;   // ничего, кроме слова «панельный», не известно

    let best = null;
    for (const p of pools) {
      for (const it of p.items) {
        if (!it || it.price == null) continue;
        let score = 0, max = 0;

        if (type) { max += 2; if (new RegExp('Тип\\s*' + type).test(it.name)) score += 2; }
        if (height) { max += 2; if (it.height === height) score += 2; }
        if (len) { max += 2; if (it.sec === len) score += 2; }
        // Нижнее подключение (Ventil) пишут отдельно, иначе боковое Compact.
        max += 1;
        if (/низ|нижн|ventil/i.test(raw) === !!it.bottom) score += 1;

        if (!max) continue;
        const rel = score / max;
        const better = !best || rel > best.rel ||
          (rel === best.rel && brandRank(it) < brandRank(best.item));
        if (better) best = { item: it, rel };
      }
    }
    if (!best || best.rel < 0.6) return null;
    return radResult(best.item, kindGuessed ? Math.min(best.rel, 0.9) : best.rel, []);
  }

  // ---------------------------------------------------------------------------
  // Циркуляционные насосы
  //
  // Пишут их так же коротко, как радиаторы: «Насос циркул (с амер) 25-60».
  // Типоразмер назван наполовину — диаметр и напор есть, монтажная длина нет,
  // и по такой строке подбор молчал. Между тем выбирать почти не из чего:
  // длина 180 мм стандартная, а исполнение (обычный или частотный) монтажник
  // называет прямо. Поэтому недостающее берём по умолчанию — базовый STOUT.
  // ---------------------------------------------------------------------------

  const PUMP_DEFAULT = { head: 60, len: 180 };

  // Слова, при которых «насос» — не сам насос, а что-то при нём.
  //
  // «насосн\w*» вместо перечисления окончаний: в счёте поставщика пишут
  // «Группа насосн. Rommer», и по списку «ая|ой|ые» такая строка проходила
  // как насос — вместо насосной группы за 11 200 ₽ в смету вставал насос.
  // «Контроллер насоса ERMANGIZER» ловился тем же способом.
  const PUMP_NOT = /насосн\w*|для насоса|к насосу|реле|кабел|защит|датчик|контроллер|блок управлен|частотн|преобразовател/i;

  function isPump(rec) {
    const t = (rec.type || '').toLowerCase();
    const raw = String(rec.raw || '');
    if (t === 'насос') return !PUMP_NOT.test(raw);
    if (t && t !== 'прочее') return false;
    return /насос/i.test(raw) && !PUMP_NOT.test(raw);
  }

  let pumpCache = null;
  function pumpPool() {
    if (pumpCache) return pumpCache;
    pumpCache = [];
    if (typeof catalog !== 'undefined') {
      // Порядок задаёт умолчание: первым идёт базовый STOUT 25/60-180.
      for (const key of ['pumps_dn25', 'pumps_mix', 'pumps_dn20', 'rommer_pumps']) {
        for (const it of (catalog[key] || [])) if (it && it.price != null) pumpCache.push(it);
      }
    }
    return pumpCache;
  }

  /**
   * Типоразмер из строки сметы: «25/60-180», «25-60», «25 60».
   * Напор ограничен реальным рядом (40/60/80), длина — 130/180, иначе
   * «25-60 - 1 шт» прочиталось бы как насос длиной 1 мм.
   */
  function pumpSize(rec) {
    const raw = String(rec.raw || '').replace(/\s+/g, ' ');
    const m = raw.match(/\b(15|20|25|32)\s*[\/\-хx]\s*(40|60|80|100)(?:\s*[\-–]\s*(130|180))?\b/i);
    if (m) return { dn: +m[1], head: +m[2], len: m[3] ? +m[3] : null };
    return { dn: Number(rec.d) || null, head: null, len: null };
  }

  function matchPump(rec) {
    const raw = String(rec.raw || '');
    // Скважинный, дренажный и повысительный — другие изделия и другой каталог.
    if (/скважин|погружн|глубинн|дренажн|фекальн|повышени|станци/i.test(raw)) return null;

    const size = pumpSize(rec);
    const dn = size.dn || 25;                       // 25 — ходовой присоединительный
    const head = size.head || PUMP_DEFAULT.head;
    const len = size.len || PUMP_DEFAULT.len;
    const wantSmart = /частотн|энергоэфф|mini|smart|\bpro\b/i.test(raw);

    let best = null;
    for (const it of pumpPool()) {
      const nm = String(it.name).match(/(\d{2})\s*\/\s*(\d{2,3})\s*-\s*(\d{3})/);
      if (!nm) continue;               // без типоразмера в названии не опознать
      if (+nm[1] !== dn) continue;     // диаметр присоединения — требование жёсткое

      let score = 3;
      if (+nm[2] === head) score += 2;
      if (+nm[3] === len) score += 1;
      // Частотный ставим только если о нём просили: он втрое дороже базового.
      if (/mini|pro/i.test(it.name) === wantSmart) score += 1;

      const better = !best || score > best.score ||
        (score === best.score && brandRank(it) < brandRank(best.item));
      if (better) best = { item: it, score };
    }
    if (!best) return null;

    let rel = Math.min(1, best.score / 7);
    // Что не названо — то допущение: строка идёт на проверку подсвеченной.
    if (!size.head) rel = Math.min(rel, 0.9);
    else if (!size.len) rel = Math.min(rel, 0.95);
    return radResult(best.item, rel, []);
  }

  // ---------------------------------------------------------------------------
  // Гофрированная защитная труба
  //
  // Размер гофры в счёте и в каталоге означает разное. Поставщик пишет «Гофра
  // 18 мм» — это диаметр трубы, которую гофра защищает; каталог называет саму
  // гофру: «23 (для труб до 16)», «28 (для труб до 20)». Сравнивать числа в
  // лоб бесполезно, их и не должно совпасть. Берём наименьшую гофру, в которую
  // названная труба ещё влезает, — так её и подбирают на объекте.
  // ---------------------------------------------------------------------------

  function isCorrugated(rec) {
    const raw = String(rec.raw || '');
    if (!/гофр/i.test(raw)) return false;
    // Гофрированная нержавеющая труба — газовая подводка, другое изделие.
    return !/нержав|стал|газ/i.test(raw);
  }

  function matchCorrugated(rec) {
    const pool = ((typeof catalog !== 'undefined' && catalog.extra_items) || [])
      .filter((it) => /^SPG-/.test(it.id || ''));
    if (!pool.length) return null;

    const raw = String(rec.raw || '');
    const red = /красн/i.test(raw);
    const blue = /син/i.test(raw);

    // Диаметр защищаемой трубы: первое число ряда труб в строке.
    const nums = (raw.match(/\d{2,3}/g) || []).map(Number);
    const want = nums.find((n) => n >= 10 && n <= 40);
    if (!want) return null;

    let best = null;
    for (const it of pool) {
      const isRed = /красн/i.test(it.name);
      if ((red && !isRed) || (blue && isRed)) continue;
      const m = it.name.match(/до\s+(\d{2})\s*мм/i);
      if (!m) continue;
      const fits = +m[1];
      if (fits < want) continue;            // труба в такую гофру не войдёт
      if (!best || fits < best.fits) best = { item: it, fits };
    }
    if (!best) return null;

    return {
      item: best.item,
      score: 0.85,
      substituted: `гофра подобрана под трубу ${want} мм — ближайшая из ряда`,
      brandRank: brandRank(best.item),
      needsApproval: true,
      alternatives: pool.filter((it) => it !== best.item).slice(0, 3),
    };
  }

  // ---------------------------------------------------------------------------
  // Монтажная консоль (кронштейн под трубу)
  //
  // Консоль выбирают по вылету: 300, 400, 500 мм — это то, на сколько она
  // выносит трубу от стены. Сечение профиля («30х30х2») вторично, у каждого
  // производителя оно своё. Подбор по названию этого не понимал: в строке
  // «Кронштейн оцинк. Walraven 400 мм 30*30*2» четыре числа, и длина тонула
  // среди них — 300-я находилась случайно, а 400 и 500 не находились вовсе.
  // ---------------------------------------------------------------------------

  const CONSOLE_NOT = /коллект|бак|радиатор|полотенц|котл|насос/i;

  function isConsole(rec) {
    const raw = String(rec.raw || '');
    if (!/кронштейн|консоль/i.test(raw)) return false;
    return !CONSOLE_NOT.test(raw);
  }

  /** Вылет консоли: самое крупное число из ряда длин. */
  function consoleLength(raw) {
    const nums = (String(raw || '').match(/(\d{3,4})\s*мм/gi) || [])
      .map((s) => parseInt(s, 10))
      .filter((n) => n >= 100 && n <= 1000);
    return nums.length ? Math.max(...nums) : null;
  }

  function matchConsole(rec) {
    const want = consoleLength(rec.raw);
    if (!want) return null;

    const idx = buildNameIndex();
    const rank = brandPreference(rec);
    let best = null;

    for (const row of idx.rows) {
      const n = String(row.it.name || '');
      if (!/консоль|кронштейн/i.test(n)) continue;
      if (CONSOLE_NOT.test(n)) continue;
      // Длина — последнее число в названии: «1,75х28х30х400мм», «WM2 … 400мм».
      const nums = (n.match(/(\d{2,4})\s*мм/gi) || []).map((s) => parseInt(s, 10));
      const len = nums.length ? nums[nums.length - 1] : null;
      if (len !== want) continue;

      const r = rank(row.it) + (row.fromPrice ? 0.5 : 0);
      if (!best || r < best.rank || (r === best.rank && row.it.price < best.it.price)) {
        best = { it: row.it, rank: r };
      }
    }
    if (!best) return null;

    return {
      item: best.it,
      score: 0.85,
      substituted: `консоль подобрана по вылету ${want} мм — сверьте сечение профиля`,
      brandRank: brandRank(best.it),
      needsApproval: true,
      alternatives: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Мембранные баки
  //
  // Бак выбирают по двум признакам, и оба всегда написаны: объём в литрах и
  // назначение. «Бак мембр. д/водоснабжения 24л» — это гидроаккумулятор,
  // «расширительный 24л» без уточнения — бак отопления, «для ГВС» — свой.
  // Подбор по названию тут не работает: поставщик пишет «мембр. НЕРЖ.
  // горизонт.», каталог — «Расширительный бак гидроаккумулятор 24 л (синий)»,
  // общих слов почти нет. Зато объём и назначение сравниваются точно, поэтому
  // бак разбирается своим правилом — как радиатор и насос.
  // ---------------------------------------------------------------------------

  const TANK_NOT = /кронштейн|крепление|комплект подключ|группа подключ|подключения бака/i;

  function isTank(rec) {
    const raw = String(rec.raw || '');
    const t = (rec.type || '').toLowerCase();
    if (t && t !== 'прочее' && !/бак|гидроаккум/.test(t)) return false;
    if (TANK_NOT.test(raw)) return false;
    return /(^|[\s(№.])(бак|гидроаккумул|мембранн\w* бак|расширительн\w* бак)/i.test(raw);
  }

  /**
   * Объём бака в литрах: «24л», «24 л», «100 литров».
   *
   * Границу слова через \b здесь не поставить: для регулярных выражений
   * кириллица не «слово», и «24л НЕРЖ» по \b не разбиралось вовсе. Поэтому
   * проверяем явно, что после «л» не идёт продолжение слова.
   */
  function tankVolume(rec) {
    const m = String(rec.raw || '').match(/(\d{1,4})\s*л(?![а-яёa-z])/i);
    return m ? +m[1] : null;
  }

  /**
   * Назначение бака. Водоснабжение — гидроаккумулятор (синий), ГВС — белый
   * бак для горячей воды, всё остальное — расширительный бак отопления.
   */
  function tankKind(rec) {
    const raw = String(rec.raw || '').toLowerCase();
    if (/гвс|горяч/.test(raw)) return 'dhw';
    if (/водоснабж|хвс|скважин|гидроаккум|насосн/.test(raw)) return 'water';
    return 'heating';
  }

  function tankPools(kind) {
    const cat = (typeof catalog !== 'undefined' && catalog) || {};
    const pick = (arr) => (Array.isArray(arr) ? arr : []).filter((it) =>
      it && it.price != null && /бак|гидроаккумул/i.test(it.name || ''));
    if (kind === 'dhw') return pick(cat.exp_dhw);
    if (kind === 'water') return pick(cat.well_parts).concat(pick(cat.exp_dhw));
    return pick(cat.exp_heating);
  }

  function matchTank(rec) {
    const want = tankVolume(rec);
    if (!want) return null;                   // без объёма бак не выбрать
    const kind = tankKind(rec);
    const pool = tankPools(kind);
    if (!pool.length) return null;

    let best = null;
    for (const it of pool) {
      const vol = it.vol || (String(it.name).match(/(\d{1,4})\s*л/) || [])[1];
      if (!vol) continue;
      const diff = Math.abs(+vol - want);
      const better = !best || diff < best.diff ||
        (diff === best.diff && brandRank(it) < brandRank(best.item));
      if (better) best = { item: it, diff };
    }
    if (!best) return null;

    // Точный объём — то, что заказано. Иной объём это уже замена, и на экране
    // проверки она обязана быть видна.
    const score = best.diff === 0 ? 0.9 : Math.max(0.5, 0.9 - best.diff / Math.max(want, 1));
    if (score < 0.5) return null;

    return {
      item: best.item,
      score,
      substituted: best.diff === 0
        ? 'бак подобран по объёму и назначению — сверьте исполнение'
        : `в каталоге нет ${want} л — подобран ближайший ${best.item.vol || ''} л`,
      brandRank: brandRank(best.item),
      needsApproval: true,
      alternatives: pool.filter((it) => it !== best.item).slice(0, 3),
    };
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

      // _forceSys говорит подбору искать в новой системе, даже если в строке
      // написана старая («труба PPR 32»).
      const converted = { ...rec, d: targetD, _sourceD: rec.d, _shape: shape, _forceSys: toSys };

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

      // Только каталог: прайс при переводе системы подсовывает трубы чужих
      // производителей того же диаметра, а нужен ряд, который калькулятор
      // умеет считать. Нет в каталоге — честное «нет», а не случайный артикул.
      converted.match = matchCatalog(converted, toSys);
      out.push(converted);
    }

    // Стыки по длине трассы считаем отдельно: они не позиция исходной сметы,
    // а следствие того, как труба поставляется.
    if (pipeMeters > 0 && pipeD) {
      const seg = SYSTEMS[toSys].segmentLength(pipeD);
      const joints = Math.max(0, Math.ceil(pipeMeters / seg) - 1);
      if (joints > 0) {
        const c = { type: 'муфта', d: pipeD, qty: joints, unit: 'шт', _shape: 'coupling',
                    _forceSys: toSys, raw: `Муфта соединительная ${pipeD}`,
                    _note: `стыки трубы: ${pipeMeters} м по ${seg} м` };
        c.match = matchCatalog(c, toSys);
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
    nameIndex = null;
    sewerCache = null;   // бесшумная серия собирается из прайса   // прайс входит в индекс названий — он пересобирается
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

  /**
   * Разобранный прайс: приведённое название и его слова.
   *
   * Слова считаются один раз на сборке. Раньше штраф за лишние уточнения
   * резал строку на слова заново для каждой позиции прайса при разборе каждой
   * строки сметы — тринадцать тысяч разрезаний на строку.
   */
  let priceTokens = null;
  function tokenized() {
    if (priceTokens) return priceTokens;
    priceTokens = priceIndex.map((it) => {
      const n = norm(it.n);
      return { it, n, w: n.split(' ').filter((x) => x.length > 2) };
    });
    return priceTokens;
  }

  /**
   * Подбор по прайсу. Возвращает тот же вид результата, что и подбор по
   * каталогу, но с пометкой fromPrice — такие позиции показываются на
   * проверке отдельно и требуют согласования.
   */
  /**
   * Бренд из названия листа прайса.
   *
   * В индексе поле «источник» — это заголовок листа: «STOUT Бесшумная
   * канализация», «Rommer шаровые краны (Китай)», «Pro Aqua PPR». Раньше он
   * попадал в смету как бренд целиком, и в колонке «Бренд» вместо STOUT
   * оказывалась строка на пол-экрана. Берём из него только производителя.
   */
  const SHEET_BRANDS = [
    [/^stout/i, 'STOUT'],
    [/^rommer/i, 'ROMMER'],
    [/^pro\s*aqua/i, 'ProAqua'],
    [/^wavin/i, 'Wavin'],
  ];

  function brandFromSheet(sheet) {
    const s = String(sheet || '').trim();
    if (!s) return '';
    for (const [re, brand] of SHEET_BRANDS) if (re.test(s)) return brand;
    // У остальных поставщиков лист назван самим брендом («Sinikon», «Ostendorf»,
    // «Политэк Кан») — берём первое слово, оно и есть производитель.
    return s.split(/[\s(]/)[0];
  }

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

    // Все регулярные выражения компилируются один раз. Раньше они собирались
    // заново внутри цикла — тринадцать тысяч раз на каждую строку сметы, и это
    // была львиная доля времени разбора.
    const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reWords = words.map((w) => new RegExp('(^|[^а-яa-z])' + esc(w)));
    const reD = d ? new RegExp('(^|[^0-9])0*' + d + '([^0-9]|$)') : null;
    const reTh = thread ? new RegExp('(^|[^0-9/])' + esc(thread) + '([^0-9/]|$)') : null;
    const angleStr = rec.angle ? String(rec.angle) : null;
    const explained = [...words, thread, dims, String(d || ''), String(rec.angle || '')]
      .filter(Boolean).map(String);

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
      if (!reWords.every((re) => re.test(n))) continue;

      // Канализационную позицию не подменяем товаром другой системы.
      if (sewerType && !isSewerName(n)) continue;
      // И наоборот: канализация в напорной строке взяться не может.
      if (!sewerType && isSewerName(n)) continue;

      let score = 0, max = 0;

      if (dims) {
        max += 3;
        if (n.includes(dims)) score += 3;
      } else if (d) {
        max += 2;
        // Диаметр ищем как отдельное число, иначе «2» найдётся в «32».
        // Допускаем ведущие нули: канализация пишется «D 050», «D 058».
        if (reD.test(n)) score += 2;
      }

      if (thread) {
        max += 2;
        // Резьбу ищем как отдельное значение, а не подстрокой. По подстроке
        // «1» находилась внутри «110», и «Тройник 1 ВВВ» уходил к
        // канализационному «Тройнику 110» — с ценой канализационного.
        if (reTh.test(n)) score += 2;
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
        if (n.includes(angleStr)) score += 1;
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
      // Слова названия посчитаны при сборке индекса, список объяснённых — один
      // раз на строку сметы: и то и другое раньше пересчитывалось внутри цикла.
      let extra = 0;
      for (const w of row.w) {
        if (!explained.some((e) => w.includes(e) || e.includes(w))) extra++;
      }
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
        brand: brandFromSheet(best.item.s),
      },
      score: best.rel,
      fromPrice: true,
      needsApproval: true,
      alternatives: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Подбор по названию
  //
  // Структурный подбор выше знает только те предметы, для которых заведён тип
  // и форма: муфта, угол, тройник, кран, труба. Но в счёте поставщика половина
  // строк — предметы без «формы» вовсе: бойлер, сервопривод, шкаф коллекторный,
  // подложка, скоба, манометр, трап. Такая строка приходит с типом «прочее»,
  // shapeOf возвращает null, в TYPE_WORDS её тоже нет — и раньше она не
  // искалась НИГДЕ. Подбор молча отвечал «нет в каталоге», хотя позиция лежит
  // и в каталоге, и в прайсе. Это и была главная причина, по которой из счёта
  // распознавалось меньше половины строк.
  //
  // Здесь ищем так, как ищет человек: по самому названию, по редким словам в
  // нём. Путь запасной — включается, только когда структурный подбор промолчал,
  // и всё найденное требует согласования.
  // ---------------------------------------------------------------------------

  /**
   * Латиницей в счёте пишут бренд, а не предмет: Tiemme, Ostendorf, Walraven,
   * RapidRail, ERMANGIZER, Aquasfera. Искать мы всё равно будем по каталогу
   * STOUT и ROMMER, поэтому чужое имя ничего не различает — зато занижало
   * полноту: у «Stout трубка 250x16x15» слово «Stout» весило больше самой
   * трубки. Технические обозначения латиницей пишут по делу, их оставляем.
   */
  const LATIN_TECH = /^(ppr|pprc|pex|pert|pert|pe|pp|pvc|al|din|dn|du|pn|sdr|rp|npt|bsp|aisi|xps|epdm|fpm|abs|hdpe|ix)$/;

  function isBrandWord(w) {
    return /[a-z]/.test(w) && !/[а-я]/.test(w) && !LATIN_TECH.test(w);
  }

  /**
   * Синонимы предмета: одно и то же изделие поставщик и каталог называют
   * разными словами. Список короткий и растёт только по разобранным счетам —
   * гадать за монтажника не надо.
   */
  const WORD_SYNONYMS = {
    // Именно «блок», а не «устройство»: «Устройство управления насосом BRIO» —
    // это реле протока за 5 тысяч, а контроллер насоса это блок управления
    // (SIRIO UNIVERSAL). Разница в цене восьмикратная.
    'контроллер': ['управления'],
    'регулятор': ['управления'],
    // И в обратную сторону: «Блок управления смесительными контурами» из счёта
    // это «Контроллер … отопительными контурами STOUT Thermatic».
    'блок': ['контроллер'],
    'корпус': ['колба'],
    'колба': ['корпус'],
    'гофра': ['гофрированная'],
    'бак': ['гидроаккумулятор'],
    'сгон': ['американка'],
    'трубка': ['труба'],
    // Кронштейн под трубу у Walraven называется консолью, а привод к
    // трёхходовому клапану в каталоге — сервоприводом.
    'кронштейн': ['консоль'],
    'консоль': ['кронштейн'],
    'привод': ['сервопривод'],
    'фум': ['гель', 'лента'],
  };

  /**
   * Особые исполнения предмета, которые нельзя подставлять молча.
   *
   * Одно слово в названии превращает изделие в другой узел системы, а подбор
   * по названию этого не видит: он считает совпавшие слова. «Сервопривод
   * Rommer H, 3, 230 В» за 682 ₽ уходил в «Сервопривод 3-точечный 230V» за
   * 32 929 ₽ — совпали «сервопривод», «230» и «3», причём тройка в исходнике
   * была частью обозначения модели, а не числом точек. Компактный привод
   * сидит на коллекторе тёплого пола, трёхточечный — на смесительном клапане
   * котельной; это разные вещи, а не разные цены на одну.
   *
   * Правило: особое исполнение должно быть названо в самой строке сметы.
   * Не названо — кандидат отпадает. Названо, а у кандидата его нет — тоже
   * отпадает: подмена работает в обе стороны.
   */
  const CLASS_SPLITS = [
    {
      probe: /сервопривод|привод/,
      // Просто «поворотный» сюда брать нельзя: «Сервопривод с поворотным
      // фиксатором штока» (RTE-0020-230001, 1057 ₽) — это компактный привод
      // на коллектор, поворачивается там фиксатор, а не сам привод.
      special: /3-?точечн|трёхточечн|трехточечн|с датчиком|поворотный привод/,
    },
  ];

  function classConflict(rawLc, name) {
    const n = String(name || '').toLowerCase();
    for (const s of CLASS_SPLITS) {
      if (!s.probe.test(rawLc) || !s.probe.test(n)) continue;
      if (s.special.test(n) !== s.special.test(rawLc)) return true;
    }
    return false;
  }

  /**
   * Числа внутри артикула размером не являются.
   *
   * «Контроллер насоса ERMANGIZER ER-G-220-02-2.2»: 220, 02 и 2.2 — это части
   * кода, а не габариты, и требовать их в названии каталога бессмысленно —
   * строка проваливала проверку размера и не подбиралась вовсе. Артикул узнаём
   * по цепочке через дефис, начинающейся с букв: «ER-G-220-02», «ШН-7».
   * «110-116 мм» и «25-40» начинаются с цифры и размерами остаются.
   */
  function articleNumbers(raw) {
    const out = new Set();
    for (const m of String(raw || '').matchAll(/[a-zA-Zа-яА-Я]+(?:-[a-zA-Z0-9.]+)+/g)) {
      for (const n of (m[0].match(/\d+(?:\.\d+)?/g) || [])) out.add(n);
    }
    return out;
  }

  /** Слова, которые есть почти в каждом названии и о предмете не говорят. */
  const NAME_STOP = new Set([
    'для', 'под', 'над', 'без', 'при', 'или', 'как', 'его', 'она', 'это',
    'шт', 'штук', 'штука', 'уп', 'упак', 'ком', 'комп', 'арт', 'тип', 'вид',
    'россия', 'китай', 'чехия', 'турция', 'италия', 'производство',
    'цвет', 'цвета', 'мм', 'см', 'кг', 'гр', 'мл',
  ]);

  /**
   * Слова и числа названия.
   *
   * «16мм», «110/50», «1/2», «28*1,2» разбираются на части: без этого «16мм»
   * и «16» считались разными словами, и половина совпадений терялась.
   * Дроби («1/2») остаются целыми — это резьба, а не два числа.
   */
  /**
   * Дробь — это резьба в дюймах, но только настоящая: 1/2, 3/4, 1/4, 3/8.
   *
   * Косая черта разделяет и габариты: «Трубка Г-образная 16/250», «Гофра
   * 32/43», «Теплоизоляция 18/9», «Насос 25/60». Пока любая дробь считалась
   * резьбой, «16/250» было одним неделимым токеном — и ни 16, ни 250 не
   * совпадали с «трубкой 250 x 16» из счёта. Позиция лежала в прайсе и не
   * находилась.
   */
  function isInchFraction(t) {
    const m = t.match(/^(\d+)\/(\d+)$/);
    return !!m && +m[1] < +m[2] && [2, 3, 4, 8, 16].includes(+m[2]);
  }

  function nameParts(s) {
    const toks = norm(s).match(/\d+\/\d+|\d+[.,]\d+|\d+|[a-zа-я]+/g) || [];
    const out = [];
    for (const t of toks) {
      if (/^\d/.test(t)) {
        if (/\//.test(t) && !isInchFraction(t)) out.push(...t.split('/'));
        else out.push(t.replace(',', '.'));
      } else if (t.length >= 3 && !NAME_STOP.has(t)) out.push(t);
    }
    return out;
  }

  /**
   * Сравнение слов с учётом русских окончаний: «трубка/трубки», «заглушка/
   * заглушки», «оцинкованный/оцинкованная». Четырёх букв достаточно, чтобы
   * отличить предмет, и мало, чтобы окончание помешало.
   */
  /**
   * Бренд, написанный кириллицей, — то же слово, что и латиницей.
   * «Эктоконтроль» в счёте и «Ectocontrol» в прайсе, «Джилекс» и «Jilex».
   */
  const TO_LATIN = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
    т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  function toLatin(w) {
    let out = '';
    for (const ch of w) out += (TO_LATIN[ch] !== undefined ? TO_LATIN[ch] : ch);
    return out;
  }

  function sameWord(a, b) {
    if (a === b) return true;
    // Разные алфавиты сравниваем через латиницу — но только целиком, чтобы
    // транслитерация не начала склеивать обычные русские слова.
    if (/[а-яё]/.test(a) !== /[а-яё]/.test(b) &&
        a.length >= 5 && b.length >= 5 && toLatin(a) === toLatin(b)) return true;
    const min = Math.min(a.length, b.length);
    if (min < 4) return false;
    // Чем длиннее слова, тем больше общего начала требуется. По четырём буквам
    // «контроллер» совпадал с «контргайкой», и «Контроллер насоса» подбирался
    // к контргайке 1". Четырёх букв хватает окончаниям («скоба» — «скобы»),
    // но не разным словам с общим корнем.
    const need = Math.max(4, min - 3);
    let i = 0;
    while (i < min && a[i] === b[i]) i++;
    return i >= need;
  }

  /** Ключи, по которым слово попадает в обратный индекс. */
  function wordKeys(w) {
    return w.length >= 4 ? [w.slice(0, 3), w.slice(0, 4)] : [w];
  }

  /**
   * Ключ, под которым слово учитывается в статистике.
   *
   * Считать по точному написанию оказалось нельзя: сравниваются слова с учётом
   * окончаний («скоба» = «скобы»), а редкость считалась по букве в букву. В
   * каталоге лежат «Скобы якорные для такера» и «Теплоизоляция 18/9», в счёте
   * написано «Скоба якорная» и «Теплоизоляционная трубка» — точного совпадения
   * нет, слово считалось отсутствующим в каталоге и выбрасывалось из отбора
   * вместе с предметом строки. Позиция была в каталоге и всё равно не находилась.
   */
  function wordKey(w) {
    return w.length >= 4 ? w.slice(0, 4) : w;
  }

  let nameIndex = null;

  /**
   * Обратный индекс по словам названий: каталог целиком плюс прайс.
   *
   * Каталог идёт первым и при равном совпадении выигрывает: он выверен, в нём
   * проставлены бренды. Строится один раз и лениво — обход двенадцати тысяч
   * названий незачем делать тем, кто распознаванием не пользуется.
   */
  function buildNameIndex() {
    if (nameIndex) return nameIndex;

    const rows = [];
    const seen = new Set();
    const push = (it, fromPrice) => {
      if (!it || !it.name || it.price == null) return;
      // Заголовки и описания разделов прайса — не товар. Узнаются по двоеточию
      // и по длинной цепочке пробелов: это остаток вёрстки ячейки, в названии
      // изделия такого не бывает. По строке «Коллектор с расходомерами:»
      // подбиралась «Коллекторная группа 1х7 вых.», хотя рядом лежит настоящий
      // коллектор с числом выходов.
      if (/:\s*$/.test(it.name) || /\s{5,}/.test(it.name)) return;
      const key = (it.id || '') + '|' + it.name;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({ it, fromPrice, w: nameParts(it.name) });
    };

    if (typeof catalog !== 'undefined') {
      for (const key in catalog) {
        const v = catalog[key];
        if (Array.isArray(v)) v.forEach((x) => push(x, false));
        else push(v, false);
      }
    }
    if (priceIndex) {
      for (const r of priceIndex) {
        push({ id: r.a, article: r.a, name: r.n, price: r.p, brand: brandFromSheet(r.s) }, true);
      }
    }

    const df = new Map();
    const post = new Map();
    // Отдельный индекс по первым трём словам названия. Предмет строки обязан
    // стоять именно там, поэтому кандидатов достаточно брать только отсюда:
    // объединение постингов по ВСЕМ словам давало тысячи заведомо негодных
    // названий, и на них уходила почти вся работа подбора.
    const head = new Map();
    rows.forEach((row, i) => {
      for (const w of new Set(row.w)) {
        const key = wordKey(w);
        df.set(key, (df.get(key) || 0) + 1);
        for (const k of wordKeys(w)) {
          const arr = post.get(k);
          if (arr) arr.push(i); else post.set(k, [i]);
        }
      }
      for (const w of new Set(row.w.slice(0, 3))) {
        for (const k of wordKeys(w)) {
          const arr = head.get(k);
          if (arr) arr.push(i); else head.set(k, [i]);
        }
      }
    });

    nameIndex = { rows, df, post, head, n: rows.length || 1 };

    // Веса слов считаются один раз на сборке индекса. Пересчёт логарифма
    // внутри перебора кандидатов на каждой строке сметы стоил больше, чем
    // весь остальной подбор вместе взятый.
    for (const row of rows) {
      row.ww = row.w.map((w) => wordWeight(nameIndex, w));
      row.total = row.ww.reduce((s, x) => s + x, 0);
    }
    return nameIndex;
  }

  /**
   * Вес слова: чем реже оно встречается в каталоге, тем больше говорит о
   * предмете. «Сервопривод» встречается в трёх десятках названий и решает
   * дело, «трубка» — в тысяче и не решает ничего.
   *
   * Вес ограничен сверху намеренно. Без потолка одно случайное число весило
   * больше, чем название предмета: в «Хомут 59-66мм 2 с гайкой» числа 59 и 66
   * (встречаются в каталоге по разу) перевешивали слово «хомут», и правильный
   * «Хомут для труб с гайкой 2" (57–63 мм)» проигрывал — диапазон у каждого
   * поставщика записан своими цифрами.
   */
  const WEIGHT_MAX = 6;

  function wordWeight(idx, w) {
    return Math.min(WEIGHT_MAX,
      Math.max(0.2, Math.log(idx.n / (1 + (idx.df.get(wordKey(w)) || 0)))));
  }

  /**
   * Подбор по названию строки. Возвращает тот же вид результата, что и
   * остальные подборы, но всегда с пометкой согласования: совпадение здесь
   * вероятностное, а не структурное.
   */
  /**
   * Подбор по названию строки.
   *
   * opts.deep — углублённый проход: он включается только для строк, которые
   * обычный подбор не взял, и ослабляет ровно три ограничения — предмет может
   * стоять не в начале названия, хватает одного совпавшего слова, порог ниже.
   * Такие находки помечаются отдельно: это уже подсказка, а не подбор.
   * opts.explain — вернуть лучшего кандидата даже ниже порога, для разбора
   * причин на экране проверки.
   */
  function matchByName(rec, opts) {
    const deep = !!(opts && opts.deep);
    const explain = !!(opts && opts.explain);
    const band = (opts && opts.priceBand) || null;
    const idx = buildNameIndex();
    if (!idx.rows.length) return null;

    // Повторы убираем: «Бойлер 300л косвенного нагрева Espero 300 F» — число
    // 300 названо дважды, а совпасть в названии может только раз. Второй счёт
    // уходил в знаменатель полноты и придавливал оценку верного «Бойлера
    // напольного 300л» ниже порога.
    const q = [...new Set(nameParts(rec.raw || ''))];
    if (q.length < 2) return null;   // из одного слова предмет не опознать

    /**
     * Слова, которых нет в каталоге вовсе, из сравнения исключаются.
     *
     * «Шкаф коллекторн. нар. L-1300мм ШН-7 глубина 180мм»: слов «коллекторн»,
     * «1300» и «глубина» в каталоге нет ни в одном названии, совпасть они не
     * могут ни с чем — а вес имели максимальный и придавливали оценку любого
     * кандидата до трети. Отбор они не улучшают, поэтому в знаменатель не идут;
     * то, что они остались необъяснёнными, и так учитывает точность.
     */
    /**
     * Числа, которые не являются размером: части артикула и фасовка.
     *
     * Из сравнения они выброшены целиком, а не только из проверки размера.
     * «Контроллер насоса ERMANGIZER ER-G-220-02-2.2»: три числа из кода не
     * могут совпасть ни с чем, но занимали три четверти веса строки — верный
     * «Блок управления насосом» набирал треть и до порога не доходил.
     */
    const packs = articleNumbers(rec.raw);
    for (const m of String(rec.raw || '').matchAll(/(\d+)\s*(?:шт|штук|уп\b|упак|компл|кассет)/gi)) {
      packs.add(m[1]);
    }

    // Слово оставляем и тогда, когда его самого в каталоге нет, но есть его
    // синоним: «фум» в названиях не встречается ни разу, а «гель» — да, и
    // именно через него «Фум жидкий 60 г» находит уплотнительный гель.
    const inBase = (w) => idx.df.get(wordKey(w)) ||
      (WORD_SYNONYMS[w] || []).some((s) => idx.df.get(wordKey(s)));
    const known = q.filter((w) => inBase(w) && !(/^\d/.test(w) && packs.has(w)));
    const qw = known.map((w) => ({
      w,
      // Бренду даём минимальный вес, а не выбрасываем его совсем. Выброшенный
      // «Hydro» перестал отличать «Теплоноситель WARME Hydro 20 л» от
      // «Теплоносителя WARME Basic-30» — марка всё-таки различает товар.
      // Малого веса достаточно: полноту он не топит, а выбор между двумя
      // одинаково подходящими решает.
      weight: isBrandWord(w) ? 0.5 : wordWeight(idx, w),
      syn: WORD_SYNONYMS[w] || [],
    }));
    const qTotal = qw.reduce((s, x) => s + x.weight, 0);
    if (qw.length < 2 || qTotal <= 0) return null;

    /**
     * Размеры считаются отдельно от слов, и весят они больше.
     *
     * В сантехнике артикул задают предмет и размер, а не прилагательные. Счёт
     * поставщика описывает товар своими словами — «Бак мембр. д/водоснабжения
     * 24л НЕРЖ. горизонт.», «Кран WWSYSTEM через стенку 250 мм», — и в каталоге
     * STOUT этих слов нет вовсе: там «Расширительный бак гидроаккумулятор 24 л»
     * и «Кран незамерзающий, длина 250 мм». Пока все слова считались поровну,
     * четыре чужих прилагательных перевешивали совпавшие предмет и размер, и
     * верная позиция не доходила до порога. Теперь размер — отдельная треть
     * оценки: совпал он или нет, видно сразу и без разбора формулировок.
     */
    const qNums = known.filter((w) => /^\d/.test(w));

    /**
     * Предмет строки — её первое русское слово, и совпасть он обязан.
     *
     * Без этого требования «Фиксатор к трубе Pex 16 мм» подбирался к
     * «Переходу на PEX-трубу 20x16»: слова «труба», «pex» и «16» совпали,
     * а сам фиксатор — нет. Латинскую приставку пропускаем: «Stout», «PPRC»
     * в начале названия это бренд, а не предмет.
     */
    const head = q.find((w) => /[а-я]/.test(w)) || null;
    const rankOf = brandPreference(rec);

    /**
     * Бренд — полноценное слагаемое оценки, а не решающий голос при ничьей.
     *
     * «Сервопривод Rommer Н.З. 230 В»: в каталоге лежит ROMMER «Сервопривод
     * компактный НЗ, 230В» за 718 ₽, но выигрывал STOUT «Сервопривод 230V» за
     * 16 079 ₽ — его короткое название точнее ложится на запрос, и разрыв был
     * больше порога ничьей. Названный в строке бренд должен перевешивать такую
     * разницу: монтажник написал «Rommer» не случайно. Когда бренд не назван,
     * та же прибавка достаётся STOUT — он основной в смете.
     */
    const wantRommer = /rommer|роммер/i.test(rec.raw || '');
    const BRAND_BONUS = 0.12;
    const brandBonus = (it) => {
      const b = (it && it.brand) || 'STOUT';
      if (wantRommer) return b === 'ROMMER' ? BRAND_BONUS : 0;
      return b === 'STOUT' ? BRAND_BONUS : 0;
    };

    // Кандидаты — только те названия, где встретилось хоть одно слово запроса.
    // Сплошной перебор двенадцати тысяч названий на каждую строку сметы
    // заметно тормозил бы проверку.
    // Кандидат обязан содержать предмет строки в начале названия — это и так
    // проверяется ниже, поэтому берём их сразу из индекса начал. Синонимы
    // предмета идут туда же: «кронштейн» ищется и как «консоль».
    const cand = new Set();
    if (head && !deep) {
      for (const w of [head].concat(WORD_SYNONYMS[head] || [])) {
        for (const k of wordKeys(w)) {
          for (const i of (idx.head.get(k) || [])) cand.add(i);
        }
      }
    } else if (head) {
      // Углублённый проход: предмет может стоять где угодно в названии, поэтому
      // берём кандидатов по всему индексу слов, а не только по началам.
      for (const w of [head].concat(WORD_SYNONYMS[head] || [])) {
        for (const k of wordKeys(w)) {
          for (const i of (idx.post.get(k) || [])) cand.add(i);
        }
      }
    } else {
      for (const { w } of qw) {
        // Совсем общие слова кандидатов не приводят: по слову «труба» в набор
        // попал бы весь каталог, и отбор потерял бы смысл.
        if ((idx.df.get(wordKey(w)) || 0) > idx.n / 12) continue;
        for (const k of wordKeys(w)) {
          for (const i of (idx.post.get(k) || [])) cand.add(i);
        }
      }
    }
    if (!cand.size) return null;

    let best = null, alt = null;
    // Запасные варианты подбора. Нужны предохранителю по цене (см. priceGuard
    // в recognize.js): когда цена подобранного расходится с ценой документа в
    // разы, верный кандидат обычно стоит вторым или третьим — раньше этот
    // список уходил пустым, и заменить промах было нечем.
    const runnerUps = [];
    const rawLc = String(rec.raw || '').toLowerCase();
    for (const i of cand) {
      const row = idx.rows[i];
      const nw = row.w;
      if (!nw.length) continue;
      if (classConflict(rawLc, row.it.name)) continue;
      // Отбор по цене документа (opts.priceBand). Нужен предохранителю: когда
      // подобранное разошлось с ценой счёта в разы, ищем заново среди того,
      // что вообще может столько стоить. Цена — не признак товара, но она
      // отсекает целые классы промахов: коллекторную группу за 16 000 ₽ не
      // спутать с коллектором за 1 200 ₽, если в отбор пущены только позиции
      // того же порядка.
      if (band) {
        const p = Number(row.it.price) || 0;
        if (!p || p < band.min || p > band.max) continue;
      }

      let hitQ = 0, hitN = 0, nTotal = 0, hits = 0, hitNums = 0, headHit = !head;
      const used = new Array(nw.length).fill(false);

      for (const { w, weight, syn } of qw) {
        const j = nw.findIndex((x, k) => !used[k] &&
          (sameWord(w, x) || syn.some((s) => sameWord(s, x))));
        if (j < 0) continue;
        used[j] = true;
        hitQ += weight;
        hits++;
        if (/^\d/.test(w)) hitNums++;
        // Предмет должен стоять в начале названия каталога, а не мелькать
        // в середине: «Гайка M8 удлиненная» подбиралась к «Хомуту для труб
        // одновинтовому с гайкой M8» — слово «гайка» там шестое по счёту и
        // описывает не предмет, а его деталь. Три слова — запас на бренд
        // и прилагательное: «ROMMER Насосная группа», «Защитная втулка».
        if (w === head && (deep || j < 3)) headHit = true;
      }
      // Одного совпавшего слова мало: в прайсе есть позиция, названная просто
      // «Заглушка», и по ней в смету вставала бы любая заглушка любой цены.
      if (!headHit || hits < (deep ? 1 : 2)) continue;

      nTotal = row.total;
      for (let k = 0; k < nw.length; k++) if (used[k]) hitN += row.ww[k];
      if (nTotal <= 0) continue;

      // Полнота (сколько из запроса нашлось) важнее точности, но и точность
      // нужна: без неё «Бак 24 л» побеждала бы «Насосная группа с баком 24 л»
      // — там тоже есть и «бак», и «24».
      //
      // Когда в строке назван размер, треть оценки отдаётся ему: совпадение
      // размера значит больше, чем совпадение любых трёх прилагательных.
      // Заодно это отрезает подбор «на глаз»: «Дюбель к шпильке M12» перестал
      // цепляться к «Хомуту со шпилькой D 110» — двенадцати там нет.
      const byWords = 0.65 * (hitQ / qTotal) + 0.35 * (hitN / nTotal);
      let rel = qNums.length
        ? 0.45 * (hitQ / qTotal) + 0.25 * (hitN / nTotal) + 0.30 * (hitNums / qNums.length)
        : byWords;

      // Первое слово названия — это предмет, и если запрос его не объяснил,
      // скорее всего перед нами другое изделие: «Дюбель INKA к шпильке M10»
      // подбирался к «Хомуту ПП со шпилькой и дюбелем D 110» — там нашлись
      // и шпилька, и дюбель, вот только сам предмет хомут.
      //
      // Бренд первым словом под это правило не подпадает. Имена брендов мы из
      // запроса выбрасываем как ничего не значащие, поэтому совпасть они не
      // могут по определению — и каждое название вида «ROMMER Насосная группа»
      // получало штраф ни за что. Так потерялась насосная группа RDG-1002.
      let byWordsRel = byWords;
      if (!used[0] && !isBrandWord(nw[0])) { rel *= 0.8; byWordsRel *= 0.8; }

      const bonus = brandBonus(row.it);
      rel = Math.min(1, rel + bonus);
      byWordsRel = Math.min(1, byWordsRel + bonus);

      // При близких оценках решает бренд: по умолчанию STOUT, а ROMMER —
      // только если он назван в самой строке. Каталог при равном бренде
      // предпочтительнее прайса — он выверен.
      const rank = rankOf(row.it) + (row.fromPrice ? 0.5 : 0);
      const better = !best || (Math.abs(rel - best.rel) > BRAND_TIE
        ? rel > best.rel
        : (rank !== best.rank ? rank < best.rank : rel > best.rel));
      if (better) best = { rel, row, rank };
      if (!alt || byWordsRel > alt.rel) alt = { rel: byWordsRel, row };
      runnerUps.push({ rel, it: row.it, row });
    }

    /**
     * В переподборе по цене ничью решает сама цена — отдельным проходом.
     *
     * Коллекторные группы ROMMER лежат в прайсе одной серией, различаются
     * числом выходов, и по словам почти неотличимы: оценки 0.50 и 0.51. Внутри
     * перебора такую ничью разобрать нельзя — сравнение идёт с текущим лидером,
     * и кандидат с чуть более высокой оценкой, но втрое мимо цены, закрывал
     * дорогу тому, что стоит ровно столько же, сколько в счёте. Поэтому среди
     * всех, кто отстал от лидера не больше чем на ничью, выбираем ближайшего по
     * цене. Близость считаем в разах, а не в рублях: иначе дешёвые позиции
     * всегда выглядели бы «ближе».
     */
    if (band && best && band.target > 0) {
      let win = null;
      for (const p of runnerUps) {
        if (p.rel < best.rel - BRAND_TIE) continue;
        const fit = Math.abs(Math.log((Number(p.row.it.price) || 1) / band.target));
        if (!win || fit < win.fit) win = { fit, rel: p.rel, row: p.row };
      }
      if (win) best = { rel: win.rel, row: win.row, rank: 0 };
    }

    // Порог выставлен по счёту поставщика на 122 позиции: выше — теряются
    // «Бойлер напольный 300л» и «Хомут одновинтовой 3/4" (25–28)», которые в
    // каталоге есть; ниже — начинается угадывание, и «Дюбель INKA к шпильке»
    // подбирается к хомуту со шпилькой, а металлический фиксатор к пластиковому.
    let note = 'подобрано по названию — сверьте позицию';
    if (explain) return best ? { item: best.row.it, rel: best.rel, fromPrice: best.row.fromPrice } : null;
    let hit = best && best.rel >= (deep ? 0.42 : 0.53) ? best : null;

    /**
     * Запасной проход — без учёта размера.
     *
     * Размер должен ОТЛИЧАТЬ кандидатов друг от друга, но не запрещать подбор
     * целиком. «Фильтр 1" шламоотделитель магнитный» отбрасывался только
     * потому, что в каталоге этот фильтр бывает на 3/4" — и строка уходила
     * пустой, хотя нужное изделие есть и монтажник взял бы именно его.
     * Планка здесь выше: если размер не совпал, совпасть должно название.
     */
    if (!hit && alt && alt.rel >= (deep ? 0.5 : 0.62)) {
      hit = { rel: Math.min(alt.rel, 0.7), row: alt.row };
      note = 'подобрано по названию, размер не совпал — сверьте позицию';
    }
    if (!hit) return null;
    if (deep) note = 'найдено углублённым поиском — обязательно сверьте позицию';
    if (band) note = 'переподобрано по цене документа — обязательно сверьте позицию';

    return {
      item: hit.row.it,
      // Подбор по названию — это всегда «похоже», а не «то самое»: строка
      // обязана прийти на проверку подсвеченной.
      // Углублённая находка не должна выглядеть увереннее обычной.
      score: Math.min(deep ? 0.6 : 0.9, hit.rel),
      byName: true,
      deep,
      // На экране проверки строка объясняет, откуда взялся артикул: подбор по
      // названию — не то же самое, что совпадение по диаметру и резьбе.
      substituted: note,
      fromPrice: hit.row.fromPrice,
      brandRank: brandRank(hit.row.it),
      needsApproval: true,
      alternatives: runnerUps
        .filter((p) => p.it !== hit.row.it)
        .sort((a, b) => b.rel - a.rel)
        .slice(0, 3)
        .map((p) => p.it),
    };
  }

  // ---------------------------------------------------------------------------
  // Аналог ROMMER
  //
  // У части позиций STOUT в каталоге лежит готовая замена ROMMER — она дешевле
  // и согласована заранее (поле rommer у позиции). Показать её монтажнику
  // стоит все разом: решение «идём в ROMMER» принимается на смету целиком,
  // а не по одной строке.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Разбор причины отказа
  //
  // «Нет в каталоге» — ответ без объяснения, и по нему нельзя понять, что
  // делать: то ли позиции правда нет и это расходник, то ли она есть, но
  // названа иначе. Разбираем причину по данным индекса и, если есть, называем
  // ближайшего кандидата с его оценкой.
  // ---------------------------------------------------------------------------

  const MISS_REASONS = {
    noWords:  'в строке нет слов, по которым можно искать',
    notInBase: 'такого предмета нет ни в каталоге, ни в прайсе',
    weak:     'похожие есть, но совпадение слабое',
    noType:   'предмет не опознан — ни типа, ни размеров',
  };

  /**
   * Почему строка осталась без артикула: { reason, text, item, rel }.
   * item и rel заполняются, когда ближайший кандидат всё-таки нашёлся.
   */
  function explainMiss(rec) {
    const idx = buildNameIndex();
    const q = [...new Set(nameParts(rec.raw || ''))];
    if (q.length < 2) return { reason: 'noWords', text: MISS_REASONS.noWords };

    const head = q.find((w) => /[а-я]/.test(w)) || null;
    if (!head) return { reason: 'noType', text: MISS_REASONS.noType };

    // Знает ли база сам предмет — с учётом синонимов и окончаний.
    const known = [head].concat(WORD_SYNONYMS[head] || [])
      .some((w) => idx.df.get(wordKey(w)));
    if (!known) {
      return { reason: 'notInBase', text: `«${head}» — ${MISS_REASONS.notInBase}` };
    }

    const best = matchByName(rec, { explain: true });
    if (!best) return { reason: 'notInBase', text: MISS_REASONS.notInBase };
    return {
      reason: 'weak',
      text: MISS_REASONS.weak,
      item: best.item,
      rel: best.rel,
      fromPrice: best.fromPrice,
    };
  }

  /**
   * Сколько штук в упаковке, если это написано в названии каталога.
   *
   * «Скобы якорные для такера (Кассета 25 шт)» стоят 109 ₽ за кассету, а в
   * счёте написано «Скоба якорная по 500 штук отгружаем — 6000». Без пересчёта
   * шесть тысяч скоб умножались на цену кассеты: 654 000 ₽ вместо 26 000 ₽.
   */
  function packSize(name) {
    const s = String(name || '');
    const m = s.match(/(?:уп\.?|упак\w*|кассет\w*|пакет|компл\w*|набор|блистер)[^)\d]{0,12}(\d{1,4})\s*(?:шт|штук)/i)
      || s.match(/\((\d{2,4})\s*(?:шт|штук)\)/i);
    const n = m ? +m[1] : 0;
    return n > 1 ? n : null;
  }

  /**
   * Аналог ROMMER для подобранной позиции: { item, save, percent } либо null.
   * Возвращается только выгодная замена — дороже ставить незачем.
   */
  /**
   * Бюджетный аналог для бесшумной канализации.
   *
   * Бесшумная серия — это полипропилен с минеральным наполнителем, она втрое
   * дороже обычной ПП. Когда монтажник переключает смету на аналоги, для
   * канализации это значит «то же самое, но в бюджетной серии»: труба той же
   * длины, отвод того же угла, тройник тех же диаметров. Поле rommer у части
   * позиций каталога это уже задаёт, но у пришедших из прайса его нет —
   * поэтому ищем по типоразмеру.
   *
   * Диаметры считаем по бесшумному ряду: D 058 бесшумной = D 050 обычной.
   */
  const SEWER_BUDGET_SHEETS = /sinikon|политэк/i;

  function sewerBudgetAlt(item) {
    const name = String(item && item.name || '');
    // Только бесшумная серия: у обычной удешевлять нечего.
    if (!/^SKB-/i.test(String(item.id || '')) && !/бесшумн/i.test(name)) return null;

    const form = (name.match(/^(труба|отвод|тройник|муфта|заглушка|переход|ревизия|крестовина)/i) || [])[1];
    if (!form) return null;
    const ds = (name.match(/D\s*0*(\d{2,3})/gi) || [])
      .map((x) => +x.replace(/\D/g, ''))
      .map((d) => (d === 58 ? 50 : d));
    if (!ds.length) return null;
    const len = (name.match(/L\s*0*(\d{3,4})/i) || [])[1];
    const angle = (name.match(/(\d{2})\s*°/) || [])[1];

    let best = null;
    for (const r of (priceIndex || [])) {
      if (!SEWER_BUDGET_SHEETS.test(r.s || '')) continue;
      const n = String(r.n || '');
      if (!new RegExp('^' + form, 'i').test(n)) continue;

      const nds = (n.match(/D\s*0*(\d{2,3})/gi) || []).map((x) => +x.replace(/\D/g, ''));
      if (nds.length !== ds.length || !ds.every((d, i) => d === nds[i])) continue;
      if (len && (n.match(/L\s*0*(\d{3,4})/i) || [])[1] !== len) continue;
      if (angle && !n.includes(angle + '°') && !n.includes(angle + ' ')) continue;

      if (!best || r.p < best.p) best = r;
    }
    if (!best || !(best.p < item.price)) return null;
    return {
      item: { id: best.a, article: best.a, name: best.n, price: best.p, brand: 'Sinikon' },
      save: item.price - best.p,
      percent: Math.round((1 - best.p / item.price) * 100),
    };
  }

  function rommerAlt(item) {
    if (!item) return null;
    // Канализация удешевляется переходом на обычную серию, а не сменой бренда.
    const sewer = sewerBudgetAlt(item);
    if (sewer) return sewer;
    if (item.brand === 'ROMMER') return null;
    const base = typeof item.price === 'number' ? item.price : null;
    // Позиция могла прийти из прайса — там поля rommer нет, ищем в каталоге.
    const src = (item.rommer ? item : findById(item.id)) || item;
    const alt = src.rommer;
    if (!alt || typeof alt.price !== 'number' || !base || alt.price >= base) return null;
    return {
      item: { ...alt, brand: alt.brand || 'ROMMER' },
      save: base - alt.price,
      percent: Math.round((1 - alt.price / base) * 100),
    };
  }

  /** Позиция каталога по id — для поиска поля rommer у прайсовой находки. */
  function findById(id) {
    if (!id || typeof catalog === 'undefined') return null;
    for (const key in catalog) {
      const v = catalog[key];
      const arr = Array.isArray(v) ? v : [v];
      for (const it of arr) if (it && it.id === id) return it;
    }
    return null;
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
    '10. Нераспознанные материалы',
  ];

  /**
   * Подраздел «Big Blue» внутри узла ввода ХВС.
   *
   * В смете калькулятора колба, картридж и обвязка к ним стоят отдельной
   * группой (grp63 в app.render), поэтому раздела мало — нужен ещё подраздел.
   */
  const BIG_BLUE = {
    section: '6. Узел ввода ХВС',
    group: '6.3. Система фильтрации Big Blue',
  };

  /** Значение таблицы разделов: строка — только раздел, объект — с подразделом. */
  const asSection = (v) => (typeof v === 'string'
    ? { section: v, group: null }
    : { section: v.section, group: v.group || null });

  /**
   * Раздел по категории каталога.
   *
   * Если позиция подобрана, её раздел уже известен: калькулятор кладёт эту
   * категорию всегда в одно и то же место. Бойлер идёт к котлу, блок
   * управления скважинным насосом — в обвязку скважины, дымоход и стабилизатор
   * — в котельную. Раньше всё это оседало в «Дополнительных материалах» просто
   * потому, что рукописная строка о разделе молчит.
   *
   * В таблице только ОДНОЗНАЧНЫЕ категории. Трубы, фитинги, полипропилен и
   * крепёж встречаются сразу в нескольких разделах — их сюда не вносим, для
   * них ниже работают правила по составу сметы.
   */
  const CATALOG_SECTIONS = {
    // 1. Котёл + водонагреватель
    boilers_gas: '1. Котёл + водонагреватель',
    boilers_baxi: '1. Котёл + водонагреватель',
    boilers_plus: '1. Котёл + водонагреватель',
    boilers_status: '1. Котёл + водонагреватель',
    tanks_optibase: '1. Котёл + водонагреватель',
    tanks_standard: '1. Котёл + водонагреватель',
    tanks_stainless: '1. Котёл + водонагреватель',
    tanks_floor_comb: '1. Котёл + водонагреватель',
    tanks_wall_cos: '1. Котёл + водонагреватель',
    tanks_wall_comb: '1. Котёл + водонагреватель',

    // 2. Обвязка котельной
    chimneys: '2. Обвязка котельной',
    stabs: '2. Обвязка котельной',
    valves: '2. Обвязка котельной',
    exp_heating: '2. Обвязка котельной',
    exp_dhw: '2. Обвязка котельной',
    tank_mount: '2. Обвязка котельной',
    tank_kit: '2. Обвязка котельной',
    groups_dn20: '2. Обвязка котельной',
    groups_dn25: '2. Обвязка котельной',
    groups_dn32: '2. Обвязка котельной',
    heat_exchanger_groups: '2. Обвязка котельной',
    hydro_separators: '2. Обвязка котельной',
    hydro_arrow: '2. Обвязка котельной',
    collectors_dn20: '2. Обвязка котельной',
    collectors_dn25: '2. Обвязка котельной',
    collectors_dn32: '2. Обвязка котельной',
    hydro_dn20: '2. Обвязка котельной',
    hydro_dn25: '2. Обвязка котельной',
    hydro_modular_dn20: '2. Обвязка котельной',
    pumps_dn20: '2. Обвязка котельной',
    pumps_dn25: '2. Обвязка котельной',
    rommer_pumps: '2. Обвязка котельной',
    pumps_mix: '2. Обвязка котельной',
    mixing_units: '2. Обвязка котельной',
    servo_rotary_sensor: '2. Обвязка котельной',
    servo_rotary_std: '2. Обвязка котельной',
    dhw_pump: '2. Обвязка котельной',
    coolants: '2. Обвязка котельной',

    // 3. Приборы отопления
    rads: '3. Приборы отопления',
    rad_kits: '3. Приборы отопления',
    convectors_scq: '3. Приборы отопления',
    convectors_scn: '3. Приборы отопления',
    conv_valves: '3. Приборы отопления',
    conv_parts: '3. Приборы отопления',
    rad_tube_set: '3. Приборы отопления',
    heads: '3. Приборы отопления',
    h_valves: '3. Приборы отопления',
    manifolds_rad: '3. Приборы отопления',
    manifolds_chrome_blocks: '3. Приборы отопления',
    manifold_brackets: '3. Приборы отопления',
    rad_pipes_grey: '3. Приборы отопления',

    // 4. Водяной тёплый пол
    mats: '4. Водяной тёплый пол',
    xps_kit: '4. Водяной тёплый пол',
    ufh_mat: '4. Водяной тёплый пол',
    manifolds: '4. Водяной тёплый пол',
    manifolds_full_kit: '4. Водяной тёплый пол',
    manifolds_shutoff: '4. Водяной тёплый пол',
    manifolds_shutoff_auto: '4. Водяной тёплый пол',
    ufh_mech: '4. Водяной тёплый пол',
    ufh_electro: '4. Водяной тёплый пол',
    thermostats_stout: '4. Водяной тёплый пол',
    actuators: '4. Водяной тёплый пол',
    actuators_rommer: '4. Водяной тёплый пол',
    wiring_center: '4. Водяной тёплый пол',

    // 5.1. Внутреннее водоснабжение
    water_pipes: '5.1. Внутреннее водоснабжение',
    water_pipes_mp: '5.1. Внутреннее водоснабжение',
    water_manifolds_cold: '5.1. Внутреннее водоснабжение',
    water_manifolds_stout: '5.1. Внутреннее водоснабжение',
    water_manifolds_rommer: '5.1. Внутреннее водоснабжение',
    outdoor_faucets: '5.1. Внутреннее водоснабжение',

    // 5.2. Внутреннее ГВС / 5.3. Рециркуляция
    water_manifolds_hot: '5.2. Внутреннее ГВС',
    water_manifolds_recirc: '5.3. Рециркуляция',

    // 6. Узел ввода ХВС
    water_input_node: '6. Узел ввода ХВС',
    filter_big_blue: BIG_BLUE,

    // 7.1. Обвязка скважинного насоса
    well_pumps: '7.1. Обвязка скважинного насоса',
    well_parts: '7.1. Обвязка скважинного насоса',
    well_auto: '7.1. Обвязка скважинного насоса',
    well_relays: '7.1. Обвязка скважинного насоса',

    // 8. Канализация
    sewer_silent: '8. Канализация',
  };

  /**
   * Раздел для отдельных артикулов, о которых категория каталога молчит.
   *
   * extra_items — общая полка для позиций из счетов поставщиков: контроллер
   * котла, колба фильтра и теплоизоляция лежат там вперемешку, и раздел у
   * каждой свой. По категории его не вывести, только по артикулу.
   */
  const ID_SECTIONS = {
    // Контроллер котла и отопительных контуров — котельная.
    'SMH-3001-104212': '2. Обвязка котельной',
    // Корпус картриджного фильтра Джилекс — та же колба Big Blue, но чужая.
    // Артикул с приставкой JLX-, потому что «9059» в прайсе занят коллектором
    // MEIBES (см. комментарий в catalog.js).
    'JLX-9059': BIG_BLUE,
  };

  /**
   * Раздел по названию — для позиций, которых в каталоге нет вовсе.
   *
   * Такие строки подбираются по прайсу, а у прайса раздела сметы нет: его
   * листы («STOUT ГБМ», «Chudej», «Ectocontrol») группируют товар по
   * поставщику, а не по месту в системе. Поэтому смотрим на само название.
   *
   *   [ что ищем, раздел, чего при этом быть не должно ]
   */
  const NAME_SECTIONS = [
    // Шламоотделитель и грязевик стоят на обратке перед котлом.
    [/шламоотделител|шламоуловител|грязевик/, '2. Обвязка котельной'],
    // Погодозависимая автоматика и блоки управления котлом.
    [/thermatic|ectocontrol|эктоконтрол|контроллер удал[её]нного управления/,
      '2. Обвязка котельной'],
    // Поворотный сервопривод сидит на смесительном клапане в котельной.
    // Термоэлектрический — на коллекторе тёплого пола, его сюда не берём.
    [/сервопривод/, '2. Обвязка котельной',
      /электротермическ|термоэлектрическ|компактн|нормально (за|от)крыт/],
    // Колба фильтра: и штатная Big Blue, и Джилекс — один и тот же узел.
    [/big ?blue|корпус для картриджного фильтра/, BIG_BLUE],
    // Трап — приёмник канализации в полу, ни в каком другом разделе не бывает.
    [/(^|[^а-яё])трап/, '8. Канализация'],
    /**
     * Трубка подключения радиатора (Г-образная и ей подобные).
     *
     * В каталоге такая трубка лежит в rad_tube_set и раздел получает верный,
     * но там только один типоразмер — 16/500. Остальные (16/250, 16/1000,
     * 20/250, ROMMER, TIEMME, РЕХАУ) подбираются по прайсу, а его лист
     * называется «STOUT Аксиальные фитинги»: по нему трубка неотличима от
     * водопроводного фитинга и уезжала не в свой раздел. Между тем это
     * подводка к самому прибору — раздел у неё один при любой смете.
     */
    [/(?=.*трубк)(?=.*радиат)(?=.*(?:г-?образн|подкл))/, '3. Приборы отопления'],
  ];

  /** Раздел по названию подобранной позиции (и по самой строке сметы). */
  function sectionByName(text) {
    if (!text) return null;
    for (const [re, sec, except] of NAME_SECTIONS) {
      if (!re.test(text)) continue;
      if (except && except.test(text)) continue;
      return sec;
    }
    return null;
  }

  /**
   * Индекс «артикул → раздел», собирается один раз по первому обращению.
   *
   * Один и тот же артикул лежит сразу в нескольких категориях: кран 3/4"
   * встречается и в узле ввода, и в уличном кране, евроконус — и в тёплом
   * полу, и в водоснабжении. Такой артикул раздела не задаёт, и в индексе он
   * гасится (null): пусть лучше сработают правила по составу сметы.
   */
  let catSectionIndex = null;
  /**
   * Артикулы нержавейки (категории ss_*, ряд RSS-…).
   *
   * Раздела у них нет и быть не может: одной и той же нержавейкой ведут и
   * обвязку котельной, и подводку к радиаторам, и водоснабжение. Раньше
   * префикс ss_ читался как «сантехника», и вся нержавейка уезжала в
   * «8. Канализация» — хотя канализация целиком лежит в одном sewer_silent.
   * Теперь список нужен для правила, которое решает по составу сметы.
   */
  let ssIds = null;
  function buildCatSectionIndex() {
    catSectionIndex = Object.create(null);
    ssIds = new Set();
    if (typeof catalog === 'undefined') return;

    // Смотрим ВЕСЬ каталог, а не только категории из таблицы. Ниппель 3/4"
    // лежит и в узле ввода, и в уличном кране, и в колбе Big Blue — по нему
    // раздел не определить, и такой артикул гасится (null). Раздел остаётся
    // только у тех, кто встречается ровно в одном месте.
    const seen = Object.create(null);
    for (const key in catalog) {
      const v = catalog[key];
      if (!v || typeof v !== 'object') continue;
      const section = CATALOG_SECTIONS[key] || null;
      const stainless = /^ss_/.test(key);
      const arr = Array.isArray(v) ? v : [v];
      for (const it of arr) {
        if (!it || typeof it !== 'object') continue;
        const ids = [it.id, it.article, it.rommer && it.rommer.id, it.comfort && it.comfort.id];
        for (const id of ids) {
          if (!id) continue;
          if (stainless) ssIds.add(id);
          if (!(id in seen)) seen[id] = section;
          else if (seen[id] !== section) seen[id] = null;
        }
      }
    }
    for (const id in seen) if (seen[id]) catSectionIndex[id] = seen[id];
  }

  function sectionByCatalog(item) {
    if (!item) return null;
    if (!catSectionIndex) buildCatSectionIndex();
    return ID_SECTIONS[item.id] || ID_SECTIONS[item.article] ||
      catSectionIndex[item.id] || catSectionIndex[item.article] || null;
  }

  /**
   * Нержавейка ли это.
   *
   * Сначала по артикулу — он не врёт. Если позиция подобрана по прайсу или не
   * подобрана вовсе, смотрим на текст: «нерж», «ВПр» (пресс-раструб под
   * нержавеющую трубу). Гофрированная нержавеющая труба — газовая подводка,
   * другое изделие, и к трубопроводной системе отношения не имеет.
   */
  function isStainless(item) {
    const it = item && item._m && item._m.item;
    if (it) {
      if (!ssIds) buildCatSectionIndex();
      if (ssIds.has(it.id) || ssIds.has(it.article)) return true;
    }
    const text = `${(it && it.name) || ''} ${item && item.raw || ''}`.toLowerCase();
    if (/гофрирован/.test(text)) return false;
    return /нерж|впр/.test(text);
  }

  /**
   * Профиль сметы: какие системы в ней вообще есть.
   *
   * Раздел по одной строке определить нельзя: муфта 25х3/4 одинаково уместна
   * и в водоснабжении, и в обвязке радиаторов. Зато по списку целиком видно,
   * ЧТО монтажник собирает: список из радиаторов, циркуляционного насоса и
   * полипропилена — это отопление, и весь полипропилен в нём идёт к
   * радиаторам, а не к смесителям.
   *
   * Признаки намеренно узкие: каждый должен встречаться только в своей
   * системе. «Фильтр» или «кран» бывают везде и профиль не задают.
   */
  /**
   * Слова ищем от начала слова, а не подстрокой.
   *
   * «\b» с кириллицей не работает, и без явной границы «ванн» находилось
   * внутри «комбинированная» — из-за одной муфты чисто отопительная смета
   * считалась ещё и водоснабжением, а весь полипропилен уезжал не в тот раздел.
   */
  const word = (words) => new RegExp('(^|[^а-яёa-z])(' + words + ')', 'i');

  const PROFILE_WATER = word('водорозетк|смесител|мойк|раковин|унитаз|душев|ванна|ванной|бойлер|' +
    'водонагрев|счётчик вод|счетчик вод|пнд|скважин|гидроаккумул|редуктор давлен|' +
    'дисков|хвс|гвс|рециркуляц|полотенцесуш');
  const PROFILE_HEAT = word('радиатор|конвектор|термоголов|термостатическ|котёл|котел|котла|' +
    'гидрострелк|расширительн|отоплен');
  const PROFILE_UFH = word('тёплый пол|теплый пол|тёплого пола|теплого пола|бобышк|такер|демпферн');
  /**
   * Признак КОТЕЛЬНОЙ, а не отопления вообще.
   *
   * Радиаторы отоплением смету делают, а котельной — нет: бывает смета на одну
   * разводку по приборам, и раздел «Обвязка котельной» в ней пустой. Поэтому
   * ищем сам источник тепла и его обвязку.
   */
  const PROFILE_BOILER = word('котёл|котел|котла|гидрострелк|гидравлическ|дымоход|стабилизатор|' +
    'расширительн|насосн групп|группа насосн|теплообменник|шламоотделител|коллектор распределительн');

  function profileOf(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const text = list.map(r => `${r.type || ''} ${r.raw || ''}`).join(' ').toLowerCase();
    const heat = PROFILE_HEAT.test(text) ||
      list.some(r => isRadiator(r) || (isPump(r) && !/скважин|погружн|дренаж/i.test(r.raw || '')));
    return {
      heating: heat,
      boiler: PROFILE_BOILER.test(text) ||
        list.some(r => isPump(r) && !/скважин|погружн|дренаж|циркуляционн насос гвс/i.test(r.raw || '')),
      water: PROFILE_WATER.test(text),
      ufh: PROFILE_UFH.test(text),
      sewer: word('канализ|ревизи|сифон').test(text),
    };
  }

  /**
   * Предположение раздела для позиции.
   *
   * Второй аргумент — профиль всей сметы (profileOf). Без него работает
   * по-старому, то есть осторожно: всё неоднозначное уходит в водоснабжение
   * или в «Дополнительные материалы» и помечается как догадка.
   *
   * Возвращает { section, group, sure } — sure=false означает «это лишь
   * догадка», group — подраздел внутри раздела (или null).
   */
  /**
   * Раздел для позиции.
   *
   * Обёртка над правилами: всё, в чём калькулятор не уверен, отправляется в
   * «Дополнительные материалы». Раскидывать догадки по разделам сметы хуже,
   * чем собрать их в одном месте — там монтажник разложит их сам, а в
   * водоснабжении или отоплении чужая строка теряется.
   */
  function guessSection(item, profile) {
    // Позиция не подобрана: ни артикула, ни цены у неё нет. В разделах сметы
    // такой строке делать нечего — она не «дополнительный материал», а дыра,
    // которую монтажнику надо закрыть руками. Собираем их отдельно.
    if (!item || !item._m || !item._m.item) {
      return { section: '10. Нераспознанные материалы', group: null, sure: true };
    }
    const res = guessSectionRule(item, profile);
    if (res.sure) return { group: null, ...res };
    return { section: '9. Дополнительные материалы', group: null, sure: false };
  }

  function guessSectionRule(item, profile) {
    const t = (item.type || '').toLowerCase();
    const raw = (item.raw || '').toLowerCase();
    const d = item.d;
    const p = profile || {};
    // Смета только про отопление: приборы есть, водоразбора нет.
    const heatOnly = !!p.heating && !p.water;
    const matched = (item._m && item._m.item && item._m.item.name || '').toLowerCase();

    // Подобранная позиция лежит в каталоге в категории, у которой раздел один
    // и тот же при любой смете. Это самое надёжное свидетельство: рукописная
    // строка о разделе молчит, а артикул — нет.
    const byCat = sectionByCatalog(item._m && item._m.item);
    if (byCat) return { ...asSection(byCat), sure: true };

    // В каталоге позиции нет — она подобрана по прайсу, а прайс о разделе
    // сметы не знает. Тогда о назначении говорит само название.
    const byName = sectionByName(matched) || sectionByName(raw);
    if (byName) return { ...asSection(byName), sure: true };

    // Радиатор бывает только прибором отопления — сомневаться тут не в чем.
    if (isRadiator(item)) return { section: '3. Приборы отопления', sure: true };

    // Циркуляционный насос стоит в котельной. Скважинный — свой раздел,
    // и он опознаётся по слову, а не по типу.
    if (isPump(item)) {
      return /скважин|погружн|глубинн/.test(raw)
        ? { section: '7.1. Обвязка скважинного насоса', sure: true }
        : { section: '2. Обвязка котельной', sure: true };
    }

    // Канализация опознаётся по типу и в другие разделы не попадает.
    // Тип не всегда назван («Тройник 110»), поэтому смотрим и на подобранную
    // позицию: бесшумная канализация ни в каком другом разделе не встречается.
    if (/канализац|ревизия/.test(t) || /канализац|бесшумн/.test(matched)) {
      return { section: '8. Канализация', sure: true };
    }

    // Ввод воды в дом: ПНД-труба и дисковый фильтр ни в каком другом
    // разделе не встречаются.
    if (t === 'пнд_муфта' || /пнд/.test(raw)) return { section: '6. Узел ввода ХВС', sure: true };
    if (t === 'фильтр' && /дисков/.test(raw)) return { section: '6. Узел ввода ХВС', sure: true };

    // Подобранная позиция сама говорит о назначении: «кран для радиатора»
    // ставится на прибор отопления при любом составе сметы.
    if (/для радиатора|радиаторн/.test(matched)) {
      return { section: '3. Приборы отопления', sure: true };
    }

    // Строка прямо называет узел: «муфта комб 40х1 к насосу».
    if (/к насосу|на насос|к котлу|котел|котёл|группа|гребёнк|гребенк/.test(raw)) {
      return { section: '2. Обвязка котельной', sure: !!p.heating };
    }

    // Точки водоразбора: водорозетка бывает только в разводке к приборам.
    if (t.startsWith('водорозетка') || t === 'планка_водорозетка') {
      return { section: '5.1. Внутреннее водоснабжение', sure: true };
    }

    // Крепёж и расходники по существу не привязаны к разделу — их кладём туда,
    // где идёт основная трасса сметы.
    if (['хомут', 'клипса', 'опора', 'фиксатор', 'изоляция'].includes(t)) {
      return heatOnly
        ? { section: '3. Приборы отопления', sure: false }
        : { section: '5.4. Общие материалы', sure: true };
    }

    // Нержавейка раздела сама по себе не задаёт: одним и тем же прессом ведут
    // и обвязку котельной, и подводку к радиаторам, и водоснабжение. Вывод
    // делаем из сметы целиком, а внутри неё — из диаметра.
    //
    // Ряд нержавейки: 15, 18, 22, 28, 35, 42, 54. Крупная половина (28 и выше)
    // — это магистраль и обвязка котла: к смесителю или к радиатору такую
    // трубу не тянут. Мелкая (15-22) — разводка по приборам, и куда именно,
    // видно по составу сметы.
    if (isStainless(item)) {
      // Позиция без диаметра (уплотнительное кольцо, ключ) идёт за основной
      // трассой, то есть считается крупной.
      const big = !d || d >= 28;
      // Котельная должна быть в смете: в разводке по одним радиаторам крупный
      // диаметр — это магистраль к приборам, а не обвязка котла.
      if (big && p.boiler) return { section: '2. Обвязка котельной', sure: true };
      if (big && p.heating) return { section: '3. Приборы отопления', sure: true };
      if (big) return { section: '5.1. Внутреннее водоснабжение', sure: !!p.water };
      // Водоразбора в смете нет — мелкий диаметр идёт к приборам отопления.
      if (!p.water) return { section: '3. Приборы отопления', sure: !!p.heating };
      // Есть и приборы, и точки водоразбора: 18-я нержавейка одинаково уместна
      // и там, и там. Догадку не навязываем — такая строка уходит в
      // «Дополнительные материалы» с пометкой «раздел под вопросом».
      return { section: '5.1. Внутреннее водоснабжение', sure: !p.heating };
    }

    // Отопительная смета: трубы, фитинги и арматура в ней — обвязка приборов.
    if (heatOnly) return { section: '3. Приборы отопления', sure: true };

    // Разводка шестнадцатым диаметром — почти всегда подводка к приборам.
    if (d === 16) {
      return p.ufh
        ? { section: '4. Водяной тёплый пол', sure: false }
        : { section: '5.1. Внутреннее водоснабжение', sure: false };
    }

    // Полипропилен в смешанной смете идёт магистралью водоснабжения, но
    // уверенности нет: тем же PPR ведут и отопление.
    //
    // Систему смотрим и по подобранной позиции: строка «Муфта соед ф32» о ней
    // молчит, а «Муфта соединительная PP-R 32 мм» из каталога — нет. Раньше
    // такие фитинги падали в «Дополнительные материалы» просто потому, что в
    // рукописной строке не было слова «ппр».
    if (/ppr|ппр/.test(t) || /ppr|ппр|стекло/.test(raw) ||
        /pp-r|ppr|pe-x|pex|металлопласт/.test(matched)) {
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

  /**
   * Сколько концов трубы у фитинга — столько и гильз (втулок) он требует.
   * У резьбовых переходников и водорозеток труба входит с одной стороны.
   */
  const SLEEVES_PER_FITTING = [
    [/тройник/, 3],
    [/угол|отвод/, 2],
    [/^муфта$|^муфта_соед|переход/, 2],
    [/муфта_комбинированная|пресс_муфта|водорозетка|американка|разъ/, 1],
  ];

  function sleevesNeeded(row) {
    const t = (row.type || '').toLowerCase();
    // Резьбовое исполнение всегда сажает трубу только одним концом.
    if (row.thread && !/тройник/.test(t)) return 1;
    for (const [re, n] of SLEEVES_PER_FITTING) if (re.test(t)) return n;
    return 0;
  }

  /** Позиция каталога по id — для рекомендаций с конкретным артикулом. */
  function catItem(key, id) {
    const raw = (typeof catalog !== 'undefined' && catalog[key]) || [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return (id ? arr.find((x) => x && x.id === id) : arr[0]) || null;
  }

  /**
   * Узлы калькулятора и то, чем они комплектуются.
   *
   * Таблица повторяет связи из app.render(): котёл без дымохода и стабилизатора
   * не запустить, бак висит на креплении, коллектор — на кронштейнах, скважинный
   * насос не работает без реле давления и гидроаккумулятора. Каждое правило
   * срабатывает, только когда нужного в смете НЕТ: добивать количество за
   * монтажником не нужно, он считает его сам.
   *
   *   when  — что в смете есть (по типу, тексту строки или подобранному артикулу)
   *   miss  — чего в ней нет
   *   item  — [категория каталога, id] рекомендуемой позиции
   *   qty   — сколько штук: число или функция от количества найденного
   *   sure  — true, если расчёт точный, false — прикидка
   */
  const KIT_RULES = [
    // --- Котёл и котельная ---
    {
      when: /котёл|котел|boiler/, extra: /газов|турбирован|конденсац/, miss: /дымоход|коаксиальн|труба дым/,
      item: ['chimneys'], qty: () => 1, sure: true,
      reason: 'Газовый котёл есть, дымохода нет',
      note: 'коаксиальный дымоход в комплект котла не входит',
    },
    {
      when: /котёл|котел|boiler/, miss: /стабилизатор/,
      item: ['stabs', 'SST-0001-000250'], qty: () => 1, sure: false,
      reason: 'Котёл без стабилизатора напряжения',
      note: 'электронику котла защищают стабилизатором',
    },
    {
      when: /котёл|котел|boiler/, miss: /расширительн|бак/,
      item: ['exp_heating', 'STH-0006-000024'], qty: () => 1, sure: false,
      reason: 'Котёл без расширительного бака отопления',
      note: 'встроенного бака хватает не на всякий объём системы',
    },
    {
      when: /расширительн|мембранн бак/, miss: /крепление для бака|кронштейн.*бак/,
      item: ['tank_mount'], qty: (n) => n || 1, sure: true,
      reason: 'Расширительный бак без крепления',
      note: 'бак вешается на кронштейн, в комплект он не входит',
    },
    {
      when: /коллектор радиаторн|коллектор.*вых|распределительн коллектор|гидрострелк|гидравлическая стрелка/,
      miss: /кронштейн/,
      item: ['manifold_brackets'], qty: (n) => n || 1, sure: true,
      reason: 'Коллектор без кронштейнов',
      note: 'пара кронштейнов на коллектор',
    },

    // --- Приборы отопления ---
    {
      // Именно прибор, а не «коллектор радиаторный» и не «кран радиаторный».
      test: (r) => isRadiator(r), miss: /термоголов|термостатическ головк|головка термостат/,
      item: ['heads', 'SHT-0002-003015'], qty: (n) => n, sure: false,
      reason: 'Радиаторы без термоголовок',
      note: 'без головки клапан работает только в ручном режиме',
    },
    {
      when: /конвектор/, miss: /клапан термостатическ|запорно-балансиров/,
      item: ['conv_valves', 'SVT-0001-000015'], qty: (n) => n, sure: false,
      reason: 'Конвекторы без термостатических клапанов',
      note: 'клапан и запорный узел к конвектору идут отдельно',
    },

    // --- Тёплый пол ---
    {
      when: /тёплый пол|теплый пол|тёплого пола|теплого пола/, miss: /евроконус/,
      item: ['parts', 'SFC-0020-001620'], qty: (n, ctx) => Math.max(2, ctx.loops * 2), sure: true,
      reason: 'Контуры тёплого пола без евроконусов',
      note: 'по два евроконуса на контур — подача и обратка',
    },
    {
      when: /тёплый пол|теплый пол|тёплого пола|теплого пола/, miss: /скоб|такер|мат с бобышк|подложк/,
      item: ['xps_kit', 'SMF-0005-251620'], qty: (n, ctx) => Math.max(1, Math.ceil(ctx.pipeMeters / 25)), sure: false,
      reason: 'Труба тёплого пола без крепления к основанию',
      note: 'кассета скоб такера примерно на 25 м трубы',
    },

    // --- Узел ввода и скважина ---
    {
      // У скважины клапан ставится на напорной трубе 1 1/4", у ввода в дом — 3/4".
      when: /скважин|погружн/, miss: /обратн клапан|клапан обратн/,
      item: ['well_parts', 'SVC-0011-000032'], qty: () => 1, sure: true,
      reason: 'Скважина без обратного клапана',
      note: 'без него вода уходит обратно в скважину при остановке насоса',
    },
    {
      when: /пнд/, miss: /обратн клапан|клапан обратн|скважин|погружн/,
      item: ['water_input_node', 'SVC-0011-000020'], qty: () => 1, sure: true,
      reason: 'Ввод воды без обратного клапана',
      note: 'клапан держит воду в доме, когда давление во вводе падает',
    },
    {
      when: /скважин|погружн/, miss: /реле давлен/,
      item: ['well_relays', 'RCS-0001-000005'], qty: () => 1, sure: true,
      reason: 'Скважинный насос без реле давления',
      note: 'реле включает насос по давлению в системе',
    },
    {
      when: /скважин|погружн/, miss: /гидроаккумул|бак.*водоснабж/,
      item: ['well_parts', 'STW-0002-000050'], qty: () => 1, sure: false,
      reason: 'Скважинный насос без гидроаккумулятора',
      note: 'без бака насос включается на каждый литр разбора',
    },
    {
      when: /скважин|погружн/, miss: /оголовок/,
      item: ['well_parts', '83652'], qty: () => 1, sure: false,
      reason: 'Скважина без оголовка',
      note: 'оголовок держит трубу и насос и закрывает скважину',
    },
  ];

  /**
   * Рекомендации «возможно, не хватает».
   *
   * Два правила, выведенные из жалоб на прежнюю версию:
   *   1. Не предлагать то, что в смете уже есть. Монтажник, написавший
   *      «планка — 4 шт», уже подумал о планках, и добивка «ещё одну»
   *      только зашумляет список.
   *   2. Предлагать не мелочь, а то, без чего узел не соберётся: радиатор
   *      без подключения, насосная группа без насоса, аксиальные фитинги
   *      без гильз.
   */
  function suggest(rows, sysHint) {
    if (!Array.isArray(rows) || !rows.length) return [];
    const out = [];
    const sys = (sysHint && (typeof sysHint === 'string' ? sysHint : sysHint.main)) || null;
    const nameOf = (r) => ((r._m && r._m.item && r._m.item.name) || '').toLowerCase();
    const textOf = (r) => `${r.type || ''} ${r.raw || ''} ${nameOf(r)}`.toLowerCase();
    const has = (re) => rows.some((r) => re.test(textOf(r)));

    // --- Радиатор без подключения ------------------------------------------
    // Прибор не подключить без узла нижнего подключения или пары кранов.
    // Забывают именно это — сам радиатор в смете есть всегда.
    const radQty = totalQty(rows, (r) => isRadiator(r));
    if (radQty > 0) {
      const links = totalQty(rows, (r) =>
        /узел нижн|для радиатора|радиаторн|термостатическ/.test(textOf(r)));
      const node = catItem('h_valves', 'SVH-0004-000020');
      if (!links && node) {
        out.push({
          reason: `Радиаторов ${radQty}, подключения в смете нет`,
          note: 'на каждый прибор нужен узел нижнего подключения или пара кранов',
          row: { type: 'узел_подключения', qty: radQty, unit: 'шт', _item: node },
          sure: false,
        });
      }
    }

    // --- Насосная группа без насоса ----------------------------------------
    // Группы поставляются и с насосом, и без него: те, где насос входит,
    // так и подписаны в названии — их не считаем.
    const groupsNoPump = rows.filter((r) => {
      const s = textOf(r);
      return /насосная группа|группа насосная|группа насосн/.test(s) && !/с насосом/.test(s);
    });
    if (groupsNoPump.length && !rows.some((r) => isPump(r))) {
      const pump = catItem('pumps_dn25', 'SPC-0011-2560180');
      if (pump) {
        const qty = totalQty(rows, (r) => groupsNoPump.includes(r)) || groupsNoPump.length;
        out.push({
          reason: `Насосных групп ${qty}, насоса в смете нет`,
          note: 'в такие группы насос не входит и подбирается отдельно',
          row: { type: 'насос', qty, unit: 'шт', _item: pump },
          sure: true,
        });
      }
    }

    // --- Гильзы под аксиальные фитинги -------------------------------------
    // Аксиальное соединение держит надвижная гильза: по одной на каждый конец
    // трубы. Это не прикидка — количество считается по самим фитингам.
    if (sys === 'pex') {
      let need = 0;
      for (const r of rows) {
        const per = sleevesNeeded(r);
        if (!per) continue;
        need += per * ((Number(r.qty) || 0) + (Number(r.qtyExtra) || 0));
      }
      const have = totalQty(rows, (r) => /гильз|втулк/.test(textOf(r)));
      if (need > 0 && need - have >= 2) {
        const d = (rows.find((r) => /^труба/.test(r.type || '') && r.d) || {}).d || 16;
        out.push({
          reason: `Соединений у фитингов ${need}, гильз ${have}`,
          note: 'аксиальный фитинг держится надвижной гильзой — по одной на каждый конец трубы',
          row: { type: 'гильза', d, qty: need - have, unit: 'шт' },
          sure: true,
        });
      }
    }

    // --- Стыки полипропиленовой трубы -------------------------------------
    // Труба поставляется штангами по 4 м: на каждый стык нужна муфта.
    // Если соединительные муфты в смете уже есть, монтажник о стыках подумал.
    const pprPipes = rows.filter((r) => /^труба_ppr/.test(r.type || ''));
    for (const p of pprPipes) {
      const meters = (Number(p.qty) || 0) + (Number(p.qtyExtra) || 0);
      if (meters < 5 || !p.d) continue;
      if (rows.some((r) => /^муфта$|^муфта_соед|муфта соединительная/.test(textOf(r)) && r.d === p.d)) continue;
      const joints = Math.max(0, Math.ceil(meters / 4) - 1);
      if (joints > 0) {
        out.push({
          reason: `Труба ${p.d} — ${meters} м, штанги по 4 м`,
          note: `на ${joints} ${plural(joints, 'стык', 'стыка', 'стыков')} ` +
                `${plural(joints, 'нужна соединительная муфта', 'нужны соединительные муфты', 'нужны соединительные муфты')}`,
          row: { type: 'муфта', d: p.d, qty: joints, unit: 'шт' },
          sure: true,
        });
      }
    }

    // --- Планки под водорозетки -------------------------------------------
    // Только если планок нет вовсе: их количество монтажник считает сам,
    // и добивка «ещё одну» лишь мешает.
    const sockets = totalQty(rows, (r) => (r.type || '').startsWith('водорозетка'));
    if (sockets >= 2 && !has(/планка/)) {
      out.push({
        reason: `Водорозеток ${sockets} шт, планок в смете нет`,
        note: 'по две водорозетки на планку',
        row: { type: 'планка_водорозетка', qty: Math.ceil(sockets / 2), unit: 'шт' },
        sure: false,
      });
    }

    // --- Комплектность узлов ------------------------------------------------
    // Таблица KIT_RULES: что с чем идёт в паре у калькулятора. Правило молчит,
    // если нужное в смете уже есть.
    const pipeMetersAll = totalQty(rows, (r) => /^труба/.test(r.type || '') && r.unit === 'м');
    // Число контуров у коллектора — из его названия («Коллектор радиаторный 4 вых.»)
    // или из самой строки сметы («коллектор 5 контуров»).
    let loops = 0;
    for (const r of rows) {
      const m = textOf(r).match(/(\d{1,2})\s*(?:вых|контур|петл)/);
      if (m) loops = Math.max(loops, +m[1]);
    }
    const kitCtx = { pipeMeters: pipeMetersAll, loops };

    for (const rule of KIT_RULES) {
      const hits = rows.filter((r) => {
        if (rule.test) return rule.test(r);
        const s = textOf(r);
        return rule.when.test(s) && (!rule.extra || rule.extra.test(s));
      });
      if (!hits.length || has(rule.miss)) continue;

      const item = catItem(rule.item[0], rule.item[1]);
      if (!item) continue;

      const found = hits.reduce((s, r) =>
        s + (Number(r.qty) || 0) + (Number(r.qtyExtra) || 0), 0) || hits.length;
      const qty = Math.max(1, Math.round(rule.qty(found, kitCtx)));
      out.push({
        reason: rule.reason,
        note: rule.note,
        row: { type: 'комплектация', qty, unit: 'шт', _item: item },
        sure: rule.sure,
      });
    }

    // --- Крепёж для трубы --------------------------------------------------
    // Шаг крепления зависит от того, как проложена трасса, поэтому цифра
    // помечена как предположение. Если крепёж в смете есть — молчим.
    const pipes = rows.filter((r) => /^труба/.test(r.type || '') && r.unit === 'м');
    const pipeMeters = pipeMetersAll;
    const mounts = totalQty(rows, (r) => ['клипса', 'опора', 'хомут', 'фиксатор'].includes(r.type));
    // Трубу тёплого пола клипсами не крепят — её пришивают к основанию
    // скобами такера, о них есть своё правило.
    const isUfh = has(/тёплый пол|теплый пол|тёплого пола|теплого пола|бобышк|такер/);
    if (pipeMeters >= 10 && !mounts && !isUfh) {
      // Диаметр берём у самой длинной трубы: без него клипса не подберётся —
      // подбор уйдёт в латунную арматуру вместо трубной системы.
      const main = pipes.slice().sort((a, b) =>
        ((b.qty || 0) + (b.qtyExtra || 0)) - ((a.qty || 0) + (a.qtyExtra || 0)))[0];
      out.push({
        reason: `Трубы ${pipeMeters} м, крепежа в смете нет`,
        note: 'ориентировочно одно крепление на 2 м открытой трассы',
        row: { type: 'клипса', d: main ? main.d : null, qty: Math.ceil(pipeMeters / 2), unit: 'шт' },
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
    SYSTEMS, SECTIONS, detectSystem, systemProfile, guessSection, profileOf, suggest, matchItem, matchCatalog,
    isRadiator, matchRadiator, isPump, matchPump,
    // Тип, выведенный из текста строки: нужен интерфейсу проверки, чтобы
    // строка-повтор наследовала предмет от той, что действительно назвала его.
    typeOf: (rec) => (normalizeType(rec).type || '').toLowerCase(),
    matchPrice, matchByName, explainMiss, rommerAlt, packSize, setPriceIndex, hasPriceIndex, convert, total,
    equivalentD, boreTable, parsePipeGeometry, setPprBrand,
  };
})();

if (typeof module !== 'undefined') module.exports = RecognizeMatch;
