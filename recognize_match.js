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

    // Латунь опознаётся по типу, но только при отсутствии диаметра трубы.
    // «Разъёмная 25х3/4 НР» — это полипропиленовый фитинг на 25-ю трубу,
    // а не латунная американка: наличие d говорит о принадлежности к системе.
    if (BRASS_PATTERNS[t] && !item.d) return 'brass';

    // «Пресс» в русском обиходе монтажника — это металлопластик.
    // У сшитого полиэтилена соединение называют аксиальным или надвижным.
    if (/пресс/.test(t) || /пресс/.test(raw)) return 'mp';
    if (/аксиал|надвижн/.test(raw)) return 'pex';

    // «ппр» кириллицей монтажник пишет чаще, чем латиницей.
    if (/ppr|ппр|полипропилен/.test(t) || /ppr|ппр|стекло/.test(raw)) return 'ppr';
    if (/впр|нерж/.test(raw)) return 'ss';

    if (t === 'труба_pex') return 'pex';
    if (t === 'пнд_муфта') return 'hdpe';

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
    if (t.startsWith('разъёмное') || t.startsWith('разъемное')) {
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
  function matchItem(rec, sysHint) {
    // Приводим строку в порядок до обоих поисков: по прайсу «Кран 15» иначе
    // ищется по числу 15, которого в названиях латунной арматуры нет, а
    // строка без типа не ищется вовсе.
    const r = normalize(rec);
    return matchCatalog(r, sysHint) || matchPrice(r);
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
    [/^труб/i, 'труба'],
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
    for (const [re, type] of RAW_TYPES) {
      if (!re.test(raw)) continue;
      if (type === 'кран_шаровой' && /ппр|ppr/i.test(raw)) return { ...rec, type: 'кран_ppr' };
      return { ...rec, type };
    }
    return rec;
  }

  /** Ряд диаметров, по которому отличаем размер от количества и метража. */
  const PIPE_DS = [16, 20, 25, 32, 40, 50, 63, 75, 90, 110, 160];

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
      const th = raw.match(/(?:^|[\s(х-])(\d\s+\d\s*\/\s*\d|\d\s*\/\s*\d)(?![\d])/);
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

    const wantChain = Array.isArray(rec.dims) && rec.dims.length > 1 ? rec.dims : null;
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
    scored.sort(byScoreThenBrand);
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
  const PUMP_NOT = /насосн(ая|ой|ые)|для насоса|к насосу|реле|кабел|защит|датчик/i;

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
        brand: brandFromSheet(best.item.s),
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

  function profileOf(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const text = list.map(r => `${r.type || ''} ${r.raw || ''}`).join(' ').toLowerCase();
    const heat = PROFILE_HEAT.test(text) ||
      list.some(r => isRadiator(r) || (isPump(r) && !/скважин|погружн|дренаж/i.test(r.raw || '')));
    return {
      heating: heat,
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
   * Возвращает { section, sure } — sure=false означает «это лишь догадка».
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
    const res = guessSectionRule(item, profile);
    if (res.sure) return res;
    return { section: '9. Дополнительные материалы', sure: false };
  }

  function guessSectionRule(item, profile) {
    const t = (item.type || '').toLowerCase();
    const raw = (item.raw || '').toLowerCase();
    const d = item.d;
    const p = profile || {};
    // Смета только про отопление: приборы есть, водоразбора нет.
    const heatOnly = !!p.heating && !p.water;
    const matched = (item._m && item._m.item && item._m.item.name || '').toLowerCase();

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
        /pp-r|ppr|pe-x|pex|металлопласт|нерж/.test(matched)) {
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
    matchPrice, setPriceIndex, hasPriceIndex, convert, total,
    equivalentD, boreTable, parsePipeGeometry, setPprBrand,
  };
})();

if (typeof module !== 'undefined') module.exports = RecognizeMatch;
