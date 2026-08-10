# -*- coding: utf-8 -*-
"""
Сборка справочника тарифов на природный газ для населения — gas_tariffs.js.

Зачем: в прогнозе «Стоимость отопления 🔥» тариф был вбит руками по десятку
регионов, остальные получали среднюю цифру. Разброс между субъектами — от 5
до 12 ₽/м³, то есть средняя врала до 40 %. Справочник пересобирается раз в
месяц через GitHub Actions (.github/workflows/update-gas-tariffs.yml) — тем
же способом, что цены (AutoPrice.py) и тарифы на электричество (AutoTariff.py).

Источник — proschetchiki.ru, раздел «Тарифы на газ <год>»: на каждый субъект
своя страница с одной и той же таблицей. Официального машинного источника у
газовых тарифов нет: их устанавливает каждый регион своим приказом, ФАС
наружу данных не отдаёт, а агрегатор gogov.ru отвечает 429 на любой запрос
не из браузера. Поэтому берём один аккуратный агрегатор, а не 81 разный сайт
«Газпром межрегионгаза».

Что берём. Нужна категория БЫТОВОГО ОТОПЛЕНИЯ — «на отопление или отопление
с одновременным использованием газа на другие цели». Ловить её по номеру
пункта нельзя: нумерация по регионам разъезжается (в Свердловской области
это пункт 4, в Рязанской под тем же номером стоят котельные). Поэтому строка
ищется по смыслу, см. pick_heating_row().

Цены в источнике даны за 1000 м³ — делим на 1000. Периодов обычно два
(с 1 января и с 1 октября), храним оба: калькулятор выберет действующий по
текущей дате.

Запуск вручную: python AutoGasTariff.py [--year 2026]
Скрипт валится с ненулевым кодом, если разобрано меньше MIN_REGIONS —
лучше упасть в Actions, чем тихо выложить полупустой справочник.
"""

import re
import sys
import json
import time
import html
import datetime
import urllib.request

SECTION = "http://proschetchiki.ru/tarify-na-gaz-{year}-pervoe-polugodie/"
UA = "Mozilla/5.0 (compatible; HeatCalcTariffBot/1.0; +https://heatcalc.ru)"
OUT_FILE = "gas_tariffs.js"
MIN_REGIONS = 60          # ниже этого считаем сборку неудачной
PAUSE = 0.6               # пауза между страницами, чтобы не долбить сайт

# Адрес страницы -> регион ровно в том написании, в каком он лежит в
# cities_geo.js (CITY_GEO.region). Сравнивать по заголовку страницы нельзя:
# он в предложном падеже («в Московской области»), и любое «умное»
# сопоставление рано или поздно тихо ошибётся. Незнакомый адрес скрипт
# заметит и напишет в лог — тогда сюда дописывается строка.
SLUG_TO_REGION = {
    "altajskom-krae": "Алтайский край",
    "arhangelskoj-oblasti": "Архангельская область",
    "astrahanskoj-oblasti": "Астраханская область",
    "belgorodskoj-oblasti": "Белгородская область",
    "blagoveshenske-i-amurskoj-oblasti": "Амурская область",
    "bryanskoj-oblasti": "Брянская область",
    "chechenskoj-respublike": "Чечня",
    "chelyabinskoj-oblasti": "Челябинская область",
    "chuvashskoj-respublike": "Чувашия",
    "evrejskoj-avtonomnoj-oblasti": "Еврейская АО",
    "ggorno-altajsk-i-respublike-altaj": "Алтай",
    "habarovskom-krae": "Хабаровский край",
    "hanti-mansijskom-avtonomnom-okruge-yugra": "Ханты-Мансийский АО",
    "irkutskoj-oblasti": "Иркутская область",
    "ivanovskoj-oblasti": "Ивановская область",
    "kabardino-balkarskoj-respublike": "Кабардино-Балкария",
    "kaliningradskoj-oblasti": "Калининградская область",
    "kaluzhskoj-oblasti": "Калужская область",
    "kemerovskoj-oblasti": "Кемеровская область",
    "kirovskoj-oblasti": "Кировская область",
    "kostromskoj-oblasti": "Костромская область",
    "krasnodarskom-krae": "Краснодарский край",
    "krasnoyarskom-krae": "Красноярский край",
    "kurganskoj-oblasti": "Курганская область",
    "kurskoj-oblasti": "Курская область",
    "leningradskoj-oblasti": "Ленинградская область",
    "lipeckoj-oblasti": "Липецкая область",
    "moskovskoj-oblasti": "Московская область",
    "moskve": "Москва",
    "murmanskoj-oblasti": "Мурманская область",
    "neneckom-avtonomnom-okruge": "Ненецкий АО",
    "nizhegorodskoj-oblasti": "Нижегородская область",
    "novgorodskoj-oblasti": "Новгородская область",
    "novosibirskoj-oblasti": "Новосибирская область",
    "omskoj-oblasti": "Омская область",
    "orenburgskoj-oblasti": "Оренбургская область",
    "orlovskoj-oblasti": "Орловская область",
    "penzenskoj-oblasti": "Пензенская область",
    "permskom-krae": "Пермский край",
    "primorskom-krae": "Приморский край",
    "pskovskoj-oblasti": "Псковская область",
    "respublike-adigeya": "Адыгея",
    "respublike-bashkortostan": "Башкортостан",
    "respublike-dagestan": "Дагестан",
    "respublike-hakasiya": "Хакасия",
    "respublike-ingushetiya": "Ингушетия",
    "respublike-kalmikiya": "Калмыкия",
    "respublike-kareliya": "Карелия",
    "respublike-komi": "Коми",
    "respublike-krim": "Крым",
    "respublike-marij-el": "Марий Эл",
    "respublike-mordoviya": "Мордовия",
    "respublike-saha-yakutiya": "Якутия",
    "respublike-severnaya-osetiya-alaniya": "Северная Осетия",
    "respublike-tiva-tuva": "Тыва",
    "rostovskoj-oblasti": "Ростовская область",
    "ryazanskoj-oblasti": "Рязанская область",
    "sahalinskoj-oblasti": "Сахалинская область",
    "samarskoj-oblasti": "Самарская область",
    "sankt-peterburge": "Санкт-Петербург",
    "saratovskoj-oblasti": "Саратовская область",
    "sevastopole": "Севастополь",
    "smolenskoj-oblasti": "Смоленская область",
    "stavropolskom-krae": "Ставропольский край",
    "sverdlovskoj-oblasti": "Свердловская область",
    "tambovskoj-oblasti": "Тамбовская область",
    "tomskoj-oblasti": "Томская область",
    "tulskoj-oblasti": "Тульская область",
    "tverskoj-oblasti": "Тверская область",
    "tyumenskoj-oblasti": "Тюменская область",
    "udmurtskoj-respublike": "Удмуртия",
    "ulyanovskoj-oblasti": "Ульяновская область",
    "vladimirskoj-oblasti": "Владимирская область",
    "volgogradskoj-oblasti": "Волгоградская область",
    "vologodskoj-oblasti": "Вологодская область",
    "voronezhskoj-oblasti": "Воронежская область",
    "yaroslavskoj-oblasti": "Ярославская область",
    "zabajkalskom-krae": "Забайкальский край",
    # Новые территории в CITY_GEO не представлены — страницы пропускаем осознанно.
    "doneckoj-narodnoj-respublike": None,
    "luganskoj-narodnoj-respublike": None,
    "melitopole-i-zaporozhskoj-oblasti": None,
}

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")

# Консоль Windows по умолчанию cp1251 и валится на «₽» и «м³» прямо в
# середине разбора. В Actions кодировка и так utf-8, здесь — принудительно.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:                        # noqa: BLE001 — на старых Python метода нет
    pass


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


def text_of(chunk):
    """Текст ячейки: без тегов, без сущностей, без двойных пробелов."""
    return WS_RE.sub(" ", html.unescape(TAG_RE.sub(" ", chunk))).strip()


def rows_of(page):
    """Все строки всех таблиц страницы, каждая — список непустых ячеек."""
    out = []
    for r in re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.S | re.I):
        cells = [text_of(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.S | re.I)]
        cells = [c for c in cells if c]
        if cells:
            out.append(cells)
    return out


NUM_RE = re.compile(r"^\d[\d ]*(?:[.,]\d+)?$")
NUMBER_CELL_RE = re.compile(r"^\d+\.$")          # ячейка «№ п/п» вида «3.»
MIN_RUB, MAX_RUB = 2.0, 25.0                     # разумные границы ₽/м³


# Ячейка со значением. Требуем либо десятичную часть, либо число от сотни:
# тарифы в источнике всегда с копейками («6,95», «8 179,46»), а голое целое —
# это номер пункта. В Петербурге он записан как «4» без точки и уезжал в цены,
# из-за чего у города выходило 4 ₽/м³ вместо девяти.
VALUE_CELL_RE = re.compile(r"^(\d[\d  ]*[.,]\d+|\d[\d  ]{2,})(?:\s|$)")
# Строка начинается с отопления (номер пункта может быть любой глубины).
STARTS_HEATING_RE = re.compile(r"^(?:\d+(?:\.\d+)*\.?\s*)?(?:на\s+)?отоплен")


def split_row(cells):
    """Строку таблицы разбираем на название и числа.

    Раскладка по ячейкам у источника плавает во все стороны:
      * номер пункта то входит в название («4. Отопление или…»), то стоит
        отдельной ячейкой, то вообще без точки («4») — из-за последнего он
        попадал в числа и портил Петербург;
      * единица измерения то отдельной ячейкой, то приписана прямо к
        названию («…(руб./1000 куб.м)») — на этом терялась Челябинская
        область: название целиком опознавалось как единица и из строки
        пропадало слово «отопление»;
      * значение то чистое число, то с хвостом («8 179,46 за 1000 куб.м.») —
        на этом терялся Башкортостан.

    Поэтому правило простое и от вёрстки не зависящее: ячейка, которая
    НАЧИНАЕТСЯ с числа, — это значение (число берём из её начала); всё
    остальное идёт в название. Единицу измерения не разбираем вовсе: масштаб
    надёжнее определяется по порядку величины, см. to_rub_per_m3().
    """
    nums, words = [], []
    for c in cells:
        t = c.strip()
        if NUMBER_CELL_RE.match(t):          # отдельная ячейка «№ п/п» вида «3.»
            continue
        m = VALUE_CELL_RE.match(t)
        if m:
            raw = m.group(1).replace(" ", "").replace(" ", "").replace(",", ".")
            try:
                nums.append(float(raw))
            except ValueError:
                pass
            continue
        words.append(t)
    return " ".join(words).lower(), None, nums


def to_rub_per_m3(value):
    """Цена в ₽/м³ или None, если число на цену не похоже.

    Единицу измерения источник указывает в самой строке, но доверять ей
    нельзя: у Ростовской области в строке отопления написано «руб./1000
    куб. м», а число там уже в рублях за кубометр. Поэтому решаем по
    порядку величины и проверяем результат на разумность: 9 020 — это
    рубли за тысячу кубов, 9,02 — за куб, а 1, 2, 3 в первой колонке —
    вообще номера пунктов, и они отсеиваются сами.

    Числа, не попавшие ни в один вариант, отбрасываем: лучше оставить
    регион непрочитанным, чем положить в справочник цифру, по которой
    монтажник посчитает смету.
    """
    if MIN_RUB <= value <= MAX_RUB:
        return value
    if MIN_RUB <= value / 1000.0 <= MAX_RUB:
        return value / 1000.0
    return None


def pick_heating_row(rows):
    """Строка бытового отопления: (название, [₽/м³ по периодам]) или (None, None).

    По номеру пункта не ищем: нумерация по регионам разъезжается — в
    Свердловской области бытовое отопление идёт четвёртым пунктом, а в
    Рязанской под тем же номером стоят котельные.

    Отличаем по смыслу. У бытового отопления либо оговорка «(кроме отопления
    и (или) выработки… с использованием котельных…)», либо ссылка на пункты
    про плиту. У котельных такой оговорки нет, зато есть «выработка
    электрической энергии» и «котельных всех типов». Отдельно выбрасываем
    нежилые помещения и тарифы «при отсутствии приборов учёта» — считаем мы
    дом со счётчиком.

    Результат прогоняем через разумные границы: если вышло не 2…25 ₽/м³,
    строку не берём. Лучше оставить регион непрочитанным, чем положить в
    справочник цифру, по которой монтажник посчитает смету.
    """
    for cells in rows:
        title, unit, nums = split_row(cells)
        if "отоплен" not in title or not nums:
            continue
        # Нежилые помещения нам не нужны, но в ряде регионов (Волгоградская)
        # одна строка покрывает и жильё, и нежилое: «отопление квартир (жилых
        # домов) и (или) отопление нежилых помещений». Выбрасываем только те,
        # где о жилье не сказано вовсе.
        if "нежил" in title and not re.search(r"жилых дом|квартир|жилых помещен", title):
            continue
        if "отсутствии приборов учет" in title or "сверх стандарта" in title:
            continue
        has_exception = "кроме" in title
        if ("котельн" in title or "выработк" in title) and not has_exception:
            continue
        # Прибор в названии при том, что строка начинается не с отопления —
        # значит она про плиту или колонку, а «отопление» стоит лишь
        # уточнением: «Газовая плита в домах с центральным отоплением». В
        # Самарской области таблица построена именно так, и подбор брал
        # оттуда 10,93 ₽ вместо 8,01 ₽. Проверку начала строки оставляем:
        # у настоящей строки отопления приборы тоже упоминаются — в перечне
        # «других целей», и без этой оговорки терялась Карелия.
        if re.search(r"плит|колонк|водонагрев", title) and not STARTS_HEATING_RE.match(title):
            continue
        if re.match(r"^(на\s+)?(приготовлен|нагрев)", title):
            continue
        rub = [round(r, 4) for r in (to_rub_per_m3(n) for n in nums) if r is not None]
        if rub:
            return title, rub
    return None, None

def parse_periods(rows):
    """Даты начала периодов из шапки: «с 1 января 2026», «с 1 октября 2026»."""
    head = " ".join(" ".join(r) for r in rows[:3]).lower()
    months = {
        "января": "01", "февраля": "02", "марта": "03", "апреля": "04",
        "мая": "05", "июня": "06", "июля": "07", "августа": "08",
        "сентября": "09", "октября": "10", "ноября": "11", "декабря": "12",
    }
    out = []
    for d, mon, y in re.findall(r"с\s*(\d{1,2})\s*([а-я]+)\s*(\d{4})", head):
        if mon in months:
            out.append("%04d-%s-%02d" % (int(y), months[mon], int(d)))
    return out


def parse_region(page):
    """{'periods': ['2026-01-01', ...], 'rub': [8.51, ...]} или None."""
    rows = rows_of(page)
    if not rows:
        return None
    title, rub = pick_heating_row(rows)
    if not rub:
        return None
    periods = parse_periods(rows)
    # Колонок бывает больше, чем периодов (в ряде регионов цена разбита ещё
    # и по зонам или поставщикам). Значения идут слева направо по периодам,
    # зоны уходят правее — берём столько первых, сколько нашли периодов.
    if periods:
        rub = rub[:len(periods)]
        periods = periods[:len(rub)]
    else:
        rub = rub[:1]
        periods = [""]
    return {"periods": periods, "rub": rub, "title": title[:90]}


def main():
    year = 2026
    for i, a in enumerate(sys.argv):
        if a == "--year" and i + 1 < len(sys.argv):
            year = int(sys.argv[i + 1])

    index_url = SECTION.format(year=year)
    print("Индекс: %s" % index_url)
    index = fetch(index_url)
    if not index:
        print("Индекс не открылся — выходим")
        return 2

    slugs = sorted(set(re.findall(
        r"tarify-na-gaz-v-([a-z0-9-]+)-s-1-yanvarya-%d-goda\.html" % year, index)))
    print("Страниц регионов: %d" % len(slugs))

    data, skipped, unknown = {}, [], []
    for n, slug in enumerate(slugs, 1):
        if slug in SLUG_TO_REGION and SLUG_TO_REGION[slug] is None:
            continue                      # осознанно пропущенные территории
        region = SLUG_TO_REGION.get(slug)
        if not region:
            unknown.append(slug)
            continue
        url = "%starify-na-gaz-v-%s-s-1-yanvarya-%d-goda.html" % (index_url, slug, year)
        page = fetch(url)
        parsed = parse_region(page) if page else None
        if not parsed:
            skipped.append(region)
            print("  [%2d/%d] %-28s — строку отопления не нашли" % (n, len(slugs), region))
        else:
            data[region] = parsed
            print("  [%2d/%d] %-28s %s ₽/м³" % (n, len(slugs), region,
                                                 " / ".join("%.2f" % v for v in parsed["rub"])))
        time.sleep(PAUSE)

    if unknown:
        print("\nНеизвестные адреса (допишите в SLUG_TO_REGION): %s" % ", ".join(unknown))
    if skipped:
        print("Без тарифа: %s" % ", ".join(skipped))

    print("\nРазобрано регионов: %d" % len(data))
    if len(data) < MIN_REGIONS:
        print("Меньше %d — справочник не переписываем" % MIN_REGIONS)
        return 1

    today = datetime.date.today().isoformat()
    body = ",\n".join(
        '    %s: %s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False))
        for k, v in sorted(data.items())
    )
    out = (
        "// Тарифы на природный газ для населения, категория «бытовое отопление».\n"
        "// ФАЙЛ СОБИРАЕТСЯ АВТОМАТИЧЕСКИ — правки руками затрёт следующий запуск.\n"
        "// Скрипт: AutoGasTariff.py, источник: proschetchiki.ru, обновлено %s.\n"
        "//\n"
        "// rub — цена ₽/м³ по периодам, periods — даты начала этих периодов.\n"
        "// Действующий период калькулятор выбирает сам (app.getGasTariff).\n"
        "// Ключ — субъект в написании CITY_GEO.region из cities_geo.js.\n"
        "const GAS_TARIFFS = {\n%s\n};\n"
        "const GAS_TARIFFS_UPDATED = %s;\n"
        % (today, body, json.dumps(today))
    )
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(out)
    print("Записан %s" % OUT_FILE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
