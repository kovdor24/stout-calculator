# -*- coding: utf-8 -*-
"""
Сборка справочника тарифов на электроэнергию для населения — el_tariffs.js.

Зачем: в прогнозе стоимости отопления электричеством («Стоимость отопления»)
тариф был вбит константой 6 ₽/кВт·ч на всю страну. Разброс по регионам —
от 3 до 12 ₽, то есть цифра врала в разы. Справочник собирается раз в месяц
через GitHub Actions (.github/workflows/update-tariffs.yml), как и цены.

Источник — elec.ru, раздел «Тарифы на электроэнергию <год>»: одна и та же
таблица на каждый субъект, 83 страницы. Официального API у тарифов нет:
их утверждает каждый регион своим приказом, ФАС наружу машинных данных
не отдаёт. Поэтому берём один аккуратный агрегатор, а не 83 разных сайта
сбытовых компаний.

Что берём из таблицы. Три категории потребителей:
    urban    — раздел 1, город без электроплит (полный тариф);
    electric — раздел 2, дома с электроплитами и (или) ЭЛЕКТРООТОПЛЕНИЕМ.
               Это ровно наш случай: дом с электрокотлом попадает сюда
               по закону, тариф примерно на 30 % ниже городского;
    rural    — раздел 3, сельское население (ещё дешевле).
Из каждой — одноставочный тариф и двухзонный (день / ночь).

Оговорки, сознательно принятые:
  * Берём ПЕРВЫЙ диапазон потребления. С 2025 года тариф в ряде регионов
    растёт ступенями по объёму (в Подмосковье: до 3900 кВт·ч в месяц,
    3900–6000, свыше). Отопление дома до 300 м² в первую ступень
    укладывается; кто вылезает — правит цифру руками.
  * Тарифы делятся на периоды внутри года (обычно с 1 января и с 1 октября).
    Храним оба, выбирает нужный уже калькулятор по текущей дате.
  * Трёхзонный тариф не берём: в калькуляторе его нет.

Запуск вручную: python AutoTariff.py [--year 2026]
Скрипт валится с ненулевым кодом, если разобрано меньше MIN_REGIONS —
лучше упасть в Actions, чем тихо выложить полупустой справочник.
"""

import re
import sys
import json
import time
import datetime
import urllib.request
import urllib.error

BASE = "https://www.elec.ru/library/rd/tarify-elektroenergiya-{year}/"
UA = "Mozilla/5.0 (compatible; HeatCalcTariffBot/1.0; +https://heatcalc.ru)"
OUT_FILE = "el_tariffs.js"
MIN_REGIONS = 70          # ниже этого считаем сборку неудачной
PAUSE = 0.7               # пауза между страницами, чтобы не долбить сайт

# Славянская часть работы: сопоставление адреса страницы с названием региона
# ровно в том виде, в каком регион записан в cities_geo.js (CITY_GEO.region).
# Сравнивать по заголовку страницы нельзя — он в предложном падеже
# («в Московской области»), и любое «умное» сопоставление рано или поздно
# тихо ошибётся. Лучше явная таблица: незнакомый адрес скрипт заметит и
# напишет об этом в лог.
SLUG_TO_REGION = {
    "altay-resp": "Алтай",
    "altayskiy-kray": "Алтайский край",
    "amur-obl": "Амурская область",
    "arhangelsk-obl": "Архангельская область",
    "astrahan-obl": "Астраханская область",
    "belgorod-obl": "Белгородская область",
    "bryansk-obl": "Брянская область",
    "buryatiya-resp": "Бурятия",
    "chechnya-resp": "Чечня",
    "chelyabinsk-obl": "Челябинская область",
    "chukotskiy-ao": "Чукотский АО",
    "chuvash-resp": "Чувашия",
    "dagestan-resp": "Дагестан",
    "evreyskaya-ao": "Еврейская АО",
    "habarovsk-kray": "Хабаровский край",
    "hakasiya-resp": "Хакасия",
    "ingushetiya-resp": "Ингушетия",
    "irkutsk-obl": "Иркутская область",
    "ivanovskaya-obl": "Ивановская область",
    "kabardino-balkarskaya-resp": "Кабардино-Балкария",
    "kaliningrad-obl": "Калининградская область",
    "kalmykia-resp": "Калмыкия",
    "kaluga-obl": "Калужская область",
    "kamchtskiy-kray": "Камчатский край",
    "karachaevo-cherkesiya-resp": "Карачаево-Черкесия",
    "kareliya-resp": "Карелия",
    "kemerovo-obl": "Кемеровская область",
    "kirov-obl": "Кировская область",
    "komi-resp": "Коми",
    "kostroma-obl": "Костромская область",
    "krasnodar-krai": "Краснодарский край",
    "krasnoyarsk-krai-1": "Красноярский край",
    "krym-resp": "Крым",
    "kurgan-obl": "Курганская область",
    "kursk-obl": "Курская область",
    "leningrad-obl": "Ленинградская область",
    "lipetsk-obl": "Липецкая область",
    "magadan-obl": "Магаданская область",
    "mariy-el-resp": "Марий Эл",
    "mordovia-resp": "Мордовия",
    "moskva": "Москва",
    "moskva-obl": "Московская область",
    "murmans-obl": "Мурманская область",
    "nizhegorodskaya-obl": "Нижегородская область",
    "novgorod-obl": "Новгородская область",
    "novosibirsk-obl": "Новосибирская область",
    "omsk-obl": "Омская область",
    "orenburg-obl": "Оренбургская область",
    "oryol-obl": "Орловская область",
    "penza-resp": "Пензенская область",
    "perm-kray": "Пермский край",
    "primorskiy-kray": "Приморский край",
    "pskov-obl": "Псковская область",
    "rostov-obl": "Ростовская область",
    "ryazan-obl": "Рязанская область",
    "saha-resp": "Якутия",
    "sahalin-obl": "Сахалинская область",
    "samara-obl": "Самарская область",
    "saratov-obl": "Саратовская область",
    "sevastopol": "Севастополь",
    "severnaya-ostiya-resp": "Северная Осетия",
    "smolensk-obl": "Смоленская область",
    "st-peterburg": "Санкт-Петербург",
    "stavropol-kray": "Ставропольский край",
    "sverdlovsk-obl": "Свердловская область",
    "tambov-obl": "Тамбовская область",
    "tatarstan-resp": "Татарстан",
    "tomsk-obl": "Томская область",
    "tula-obl": "Тульская область",
    "tver-obl": "Тверская область",
    "tyumen-obl": "Тюменская область",
    "tyva-resp": "Тыва",
    "udmurtskaya-resp": "Удмуртия",
    "ufa-resp": "Башкортостан",
    "ulyanovsk-obl": "Ульяновская область",
    "vladimir-obl": "Владимирская область",
    "volgograd-obl": "Волгоградская область",
    "vologda-obl": "Вологодская область",
    "voronezh-obl": "Воронежская область",
    "yamalo-nenetskiy-ao": "Ямало-Ненецкий АО",
    "yaroslavl-obl": "Ярославская область",
    "zabaykalskiy-kray": "Забайкальский край",
}

# Три региона из cities_geo.js своей страницы в источнике не имеют. Берём им
# соседа, с которым они и в жизни в одной энергосистеме: без этого города
# Нарьян-Мара и Ханты-Мансийска остались бы вообще без тарифа.
FALLBACK_REGION = {
    "Адыгея": "Краснодарский край",
    "Ненецкий АО": "Архангельская область",
    "Ханты-Мансийский АО": "Тюменская область",
}


def fetch(url, tries=3):
    """Страница источника. Три попытки: сайт живой, но иногда отдаёт 5xx."""
    last = None
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:          # noqa: BLE001 — причина уходит в лог
            last = e
            time.sleep(2 + n * 3)
    print("  не открылось: %s (%s)" % (url, last))
    return None


TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def text_of(html):
    """Текст ячейки: без тегов, без неразрывных пробелов, без двойных пробелов."""
    s = TAG_RE.sub(" ", html)
    s = s.replace("&nbsp;", " ").replace("&#160;", " ")
    s = s.replace("&laquo;", "«").replace("&raquo;", "»").replace("&amp;", "&")
    return WS_RE.sub(" ", s).strip()


NUM_RE = re.compile(r"^\d+[.,]\d+$")


def row_numbers(cells):
    """Числа строки таблицы. Порядок в источнике: диапазоны потребления
    внутри периода, периоды слева направо."""
    out = []
    for c in cells:
        t = c.replace(" ", "")
        if NUM_RE.match(t):
            out.append(float(t.replace(",", ".")))
    return out


def pick_columns(nums, cols):
    """Значения нужных колонок строки. cols — индексы, посчитанные по шапке.

    Строка может оказаться короче ожидаемого (в источнике попадаются регионы
    с урезанной таблицей) — тогда берём, что есть, а недостающее закрываем
    первым числом: лучше повторить тариф первого полугодия, чем потерять
    ставку целиком."""
    if not nums:
        return None
    return [nums[c] if c < len(nums) else nums[0] for c in cols]


PERIOD_WORDS = ("полугодие", "полугодии", "с 01.", "с 1 ")


def header_columns(rows):
    """Какие колонки таблицы брать и что это за периоды.

    Шапка у источника двухуровневая, но смысл уровней от региона к региону
    разный, и перепутать их — значит выдать тариф сверх социальной нормы за
    обычный. Встречаются три расклада:
      * Подмосковье:  полугодия (2) × диапазоны потребления (3) = 6 колонок;
      * Воронеж:      I/II полугодие (2) × диапазоны (3) = 6 колонок;
      * Владимир:     соцнорма (2) × полугодия (2) = 4 колонки, и здесь
                      полугодия внутри, а не снаружи.
    Различаем по словам: где сказано про полугодие или стоит дата — там
    измерение «период». Из второго измерения всегда берём первое значение:
    первый диапазон потребления, в пределах социальной нормы.
    """
    head = [[text_of(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.S)]
            for r in rows[:3]]
    # Уровни шапки — те строки, где нет чисел и есть хоть что-то осмысленное.
    levels = [h for h in head if h and not row_numbers(h)]
    if len(levels) < 2:
        return [0], [("", "")]

    outer, inner = levels[-2], levels[-1]
    # В верхнем уровне первые ячейки — «№ п/п» и «Категории потребителей»,
    # они не про колонки с ценами. Отбрасываем всё до слова «цена (тариф)».
    outer = [c for c in outer if c and "п/п" not in c and "категори" not in c.lower()
             and "цена" not in c.lower()]
    if not outer or not inner:
        return [0], [("", "")]

    per_group = max(1, len(inner) // len(outer))

    def is_period(cells):
        low = " ".join(cells).lower()
        return any(w in low for w in PERIOD_WORDS) or bool(
            re.search(r"\d{2}\.\d{2}\.\d{4}", low))

    dates = re.findall(r"с\s*(\d{2}\.\d{2}\.\d{4})\s*по\s*(\d{2}\.\d{2}\.\d{4})",
                       " ".join(outer + inner))
    seen, periods = set(), []
    for d in dates:
        if d not in seen:
            seen.add(d)
            periods.append(d)

    if is_period(outer):
        # Периоды снаружи: берём первую колонку каждой группы.
        cols = [i * per_group for i in range(len(outer))]
    elif is_period(inner):
        # Периоды внутри: берём всю первую группу (в пределах соцнормы).
        cols = list(range(per_group))
    else:
        cols = [0]

    if not periods or len(periods) != len(cols):
        periods = periods[:len(cols)] or []
        while len(periods) < len(cols):
            periods.append(("", ""))
    return cols, periods


def parse_region(html):
    """Разбор таблицы одного региона.

    Возвращает {'urban': {...}, 'electric': {...}, 'rural': {...}} и
    список периодов вида [('01.01.2026', '30.09.2026'), ...].
    """
    m = re.search(r"<table[^>]*>(.*?)</table>", html, re.S)
    if not m:
        return None, []
    table = m.group(1)

    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table, re.S)
    if not rows:
        return None, []

    cols, periods = header_columns(rows)

    data = {}
    cat = None
    for r in rows:
        cells = [text_of(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.S)]
        if not cells:
            continue
        line = " ".join(cells).lower()

        # Заголовок раздела. Формулировка гуляет: где-то «Тарифы для населения,
        # проживающего в городских населённых пунктах», где-то просто «Городские
        # жители, дома которых оборудованы газовыми плитами». Общее — строка без
        # цен, говорящая про жителей. Порядок проверок важен: раздел с
        # электроплитами тоже говорит про городские пункты, поэтому сначала
        # ищем сельских, потом электроплиты и только в конце — обычный город.
        if ("населен" in line or "жител" in line) and not row_numbers(cells):
            if "сельск" in line:
                cat = "rural"
                data.setdefault(cat, {})
                continue
            if "электроплит" in line or "электроотопительн" in line:
                cat = "electric"
                data.setdefault(cat, {})
                continue
            if "городск" in line:
                cat = "urban"
                data.setdefault(cat, {})
                continue

        if not cat:
            continue

        nums = row_numbers(cells)
        if not nums:
            continue
        label = " ".join(c for c in cells if not NUM_RE.match(c.replace(" ", ""))).lower()

        # Одноставочный — только сам по себе, не «дифференцированный по зонам».
        if "одноставочный" in label and "зон" not in label:
            data[cat].setdefault("single", pick_columns(nums, cols))
        elif "дневная зона" in label:
            # Первое вхождение — двухзонный тариф; ниже идёт трёхзонный
            # со своей «пиковой» и «полупиковой», он нам не нужен.
            data[cat].setdefault("day", pick_columns(nums, cols))
        elif "ночная зона" in label:
            data[cat].setdefault("night", pick_columns(nums, cols))

    return data, periods


def js_num(v):
    """Число в JS: без хвостовых нулей, но и без экспоненты."""
    s = ("%.2f" % v).rstrip("0").rstrip(".")
    return s or "0"


def dump_js(tariffs, meta):
    lines = []
    lines.append("// Тарифы на электроэнергию для населения по регионам, ₽/кВт·ч с НДС.")
    lines.append("// Файл собирает AutoTariff.py, руками не править — перезапишется.")
    lines.append("//")
    lines.append("// urban    — город, дом без электроплит (полный тариф)")
    lines.append("// electric — дом с электроплитами и (или) электроотоплением: наш случай,")
    lines.append("//            дом с электрокотлом попадает в эту категорию по закону")
    lines.append("// rural    — сельское население")
    lines.append("//")
    lines.append("// В каждой ставке столько чисел, сколько периодов в году (EL_TARIFFS_META.periods):")
    lines.append("// тарифы пересматривают внутри года, обычно с 1 января и с 1 октября.")
    lines.append("// Взят первый диапазон потребления — отопление дома до 300 м² в него укладывается.")
    lines.append("const EL_TARIFFS_META = %s;" % json.dumps(meta, ensure_ascii=False))
    lines.append("const EL_TARIFFS = {")
    for region in sorted(tariffs):
        cats = tariffs[region]
        parts = []
        for cat in ("urban", "electric", "rural"):
            if cat not in cats:
                continue
            inner = ", ".join(
                "%s: [%s]" % (k, ", ".join(js_num(x) for x in cats[cat][k]))
                for k in ("single", "day", "night") if cats[cat].get(k)
            )
            if inner:
                parts.append("%s: { %s }" % (cat, inner))
        if parts:
            lines.append('    "%s": { %s },' % (region, ", ".join(parts)))
    lines.append("};")
    return "\n".join(lines) + "\n"


def main():
    year = datetime.date.today().year
    if "--year" in sys.argv:
        year = int(sys.argv[sys.argv.index("--year") + 1])

    # Раздел следующего года появляется в источнике не сразу: если его ещё
    # нет, работаем по прошлому — это лучше, чем пустой справочник.
    toc = fetch(BASE.format(year=year))
    if not toc or "tarify-elektroenergiya-%d/" % year not in toc:
        print("Раздел %d не найден, беру %d" % (year, year - 1))
        year -= 1
        toc = fetch(BASE.format(year=year))
    if not toc:
        print("Источник недоступен, справочник не тронут")
        return 1

    slugs = sorted(set(re.findall(
        r"/library/rd/tarify-elektroenergiya-%d/([a-z0-9\-]+)\.html" % year, toc)))
    print("Страниц регионов в источнике: %d" % len(slugs))

    tariffs = {}
    unknown = []
    period_votes = {}
    for i, slug in enumerate(slugs, 1):
        region = SLUG_TO_REGION.get(slug)
        if not region:
            unknown.append(slug)
            continue
        html = fetch("%s%s.html" % (BASE.format(year=year), slug))
        if not html:
            continue
        data, periods = parse_region(html)
        if not data or not any(v.get("single") for v in data.values()):
            print("  %s: таблица не разобралась" % region)
            continue
        tariffs[region] = data
        # Даты периодов в шапке пишут не все регионы (кое-где просто «I и II
        # полугодие»), да и границы у регионов расходятся. В meta кладём самый
        # частый расклад — по нему калькулятор выбирает, какое из чисел ставки
        # действует сегодня.
        if all(p[0] for p in periods):
            period_votes[tuple(periods)] = period_votes.get(tuple(periods), 0) + 1
        print("  [%d/%d] %s: %s" % (i, len(slugs), region, ", ".join(sorted(data))))
        time.sleep(PAUSE)

    for region, donor in FALLBACK_REGION.items():
        if region not in tariffs and donor in tariffs:
            tariffs[region] = tariffs[donor]
            print("  %s: своей страницы нет, взят тариф «%s»" % (region, donor))

    if unknown:
        print("Неизвестные адреса (добавить в SLUG_TO_REGION): %s" % ", ".join(unknown))

    if len(tariffs) < MIN_REGIONS:
        print("Разобрано всего %d регионов — это сбой, файл не переписываю" % len(tariffs))
        return 1

    meta_periods = max(period_votes, key=period_votes.get) if period_votes else [("", "")]
    meta = {
        "year": year,
        "updated": datetime.date.today().isoformat(),
        "source": BASE.format(year=year),
        "periods": [list(p) for p in meta_periods],
    }
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(dump_js(tariffs, meta))
    print("Готово: %d регионов в %s" % (len(tariffs), OUT_FILE))
    return 0


if __name__ == "__main__":
    sys.exit(main())
