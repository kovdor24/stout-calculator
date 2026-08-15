# -*- coding: utf-8 -*-
"""
Планы газификации по регионам присутствия — analytics/gas.json.

Зачем: если в посёлок приходит газ, там в ближайшие год-полтора массово меняют
электрические и твердотопливные котлы на газовые и переделывают котельные.
Монтажник, знающий это заранее, приходит к заказчику первым.

ОТКУДА БЕРЁМ. Единого машиночитаемого источника по стране нет, и это выяснялось
трудно (см. ANALYTICS_PLAN.md, 4.1). У портала Единого оператора (connectgas.ru)
API есть, но перечни посёлков и позиции программы закрыты авторизацией: наружу
отдаётся только счётчик. Регистрировать учётную запись ради робота мы не стали —
и это плохая опора: слетит пароль, и сбор молча встанет.

Рабочим оказался gazprommap.ru — сайт «Газификация России». У него на каждый
регион своя страница, а данные лежат прямо в разметке инлайновым скриптом:

    var regionData = { 'households': '4 225', 'objects': '5', 'pipelines': '158', }
    var points = { 'point-1': { 'title': 'Газопровод межпоселковый ...', 'done': 1, }, ... }

То есть один разбор покрывает все регионы сразу, без адаптера на каждый.
Разбираем регулярками: подключать интерпретатор JS ради двух литералов незачем,
а формат простой и стабильный.

ЧТО ИЗВЛЕКАЕМ. Из regionData — сводку программы 2026–2030. Из points — перечень
объектов, а из их названий — имена населённых пунктов: они перечислены прямо в
заголовке («от п. Хлебниково до п. Полянское, п. Боброво…»). Названия посёлков и
есть то, ради чего всё затевалось: по ним монтажник понимает, куда идёт газ.

Запуск: python AutoGasPlans.py [--all]
Без ключа обходит только живые регионы (те же, что у Wordstat), с --all — все.
"""

import argparse
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

BASE = "https://www.gazprommap.ru"
REGIONS_PAGE = BASE + "/regions/"
UA = "Mozilla/5.0 (compatible; HeatCalcAnalyticsBot/1.0; +https://heatcalc.ru)"
OUT_FILE = "analytics/gas.json"
SLUGS_FILE = "analytics/gas_region_slugs.json"
PAUSE = 0.7                    # между страницами, чтобы не долбить сайт
MIN_REGIONS_OK = 0.6           # ниже доли разобранных регионов считаем сбоем

# Живые регионы и приведение имён берём у Wordstat-парсера: список присутствия
# один на всю аналитику, и дублировать его нельзя — разъедется.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from AutoWordstat import (          # noqa: E402
    get_live_canonical_regions, load_city_region_map, normalize_region_name, log,
)


def fetch(url, tries=3):
    last = None
    for n in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:                     # noqa: BLE001 — причина в лог
            last = e
            time.sleep(2 + n * 3)
    log("  не открылось: %s (%s)" % (url, last))
    return None


# ──────────────────────────────────────────────────────────────────────────
# Адреса страниц регионов
# ──────────────────────────────────────────────────────────────────────────

def load_region_slugs():
    """Название региона -> адрес страницы. Список берём со страницы «Регионы»,
    но храним в файле: адреса вида «lenobl» у Ленинградской области не выводятся
    из названия никаким правилом, а сверять их каждый раз незачем."""
    saved = {}
    if os.path.exists(SLUGS_FILE):
        try:
            with open(SLUGS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
        except (json.JSONDecodeError, OSError):
            saved = {}

    html = fetch(REGIONS_PAGE)
    if not html:
        if saved:
            log("Страница регионов недоступна, беру сохранённый список (%d)" % len(saved))
            return saved
        raise RuntimeError("Не открылась %s и сохранённого списка нет" % REGIONS_PAGE)

    found = {}
    for m in re.finditer(r'<a[^>]+href="([a-z0-9\-]+)/"[^>]*>([^<]{4,60})</a>', html):
        slug, title = m.group(1), m.group(2).strip()
        if re.search(r"област|край|Респ|республик|Москва|Петербург|округ|Севастополь",
                     title, re.IGNORECASE):
            found[title] = slug

    if found:
        os.makedirs(os.path.dirname(SLUGS_FILE) or ".", exist_ok=True)
        with open(SLUGS_FILE, "w", encoding="utf-8") as f:
            json.dump(found, f, ensure_ascii=False, indent=2, sort_keys=True)
            f.write("\n")
        log("Адресов регионов: %d" % len(found))
        return found

    log("Ссылок на регионы не нашлось, беру сохранённый список (%d)" % len(saved))
    return saved


# ──────────────────────────────────────────────────────────────────────────
# Разбор страницы региона
# ──────────────────────────────────────────────────────────────────────────

NUM_RE = re.compile(r"[^\d]")


def parse_region_page(html):
    """Сводка программы и перечень объектов со страницы региона."""
    summary = {}
    m = re.search(r"var\s+regionData\s*=\s*\{(.*?)\}", html, re.S)
    if m:
        body = m.group(1)
        for key, field in (("households", "households"), ("objects", "objects"),
                            ("pipelines", "pipelines_km")):
            v = re.search(r"'%s'\s*:\s*'([^']*)'" % key, body)
            if v and v.group(1).strip():
                digits = NUM_RE.sub("", v.group(1))
                if digits:
                    summary[field] = int(digits)

    objects = []
    # Ищем записи 'point-…': { … } по всему документу, а не внутри вырезанного
    # блока var points: блок бывает свёрнут в одну строку, и попытка выделить
    # его по закрывающей скобке с переводом строки не находила ничего —
    # сводка разбиралась, а перечень объектов молча выходил пустым.
    # Вложенных фигурных скобок внутри записи нет (только title и done),
    # поэтому нежадный поиск до первой закрывающей скобки безопасен.
    for pm in re.finditer(r"'point-[^']*'\s*:\s*\{(.*?)\}", html, re.S):
        inner = pm.group(1)
        t = re.search(r"'title'\s*:\s*'((?:[^'\\]|\\.)*)'", inner)
        if not t:
            continue
        title = t.group(1).replace("\\'", "'").strip()
        done = re.search(r"'done'\s*:\s*(\d+)", inner)
        objects.append({
            "title": title,
            # done=1 у объектов, отмеченных на карте выполненными. Поле есть не
            # везде, поэтому отсутствие трактуем как «неизвестно», а не как ноль.
            "done": bool(int(done.group(1))) if done else None,
            "settlements": extract_settlements(title),
        })
    return summary, objects


# Населённые пункты перечислены прямо в названии объекта:
# «Газопровод межпоселковый от п. Хлебниково до п. Полянское, п. Боброво …».
# Берём то, что идёт после сокращения вида «п.», «г.», «пос.», «с.», «д.».
SETTLEMENT_RE = re.compile(
    r"\b(?:п|пос|г|с|д|ст|х|рп|пгт)\.\s*([А-ЯЁ][А-Яа-яёЁ\-]+(?:\s+[А-ЯЁ][А-Яа-яёЁ\-]+)?)"
)
# Хвост «… Нестеровского городского округа» — это район, а не посёлок.
DISTRICT_RE = re.compile(
    r"([А-ЯЁ][А-Яа-яёЁ\-]+(?:ского|ском|ский))\s+(?:городского округа|района|муниципального)"
)


# Второе слово в названии разрешено ради «Ясная Поляна», «Дубовая Роща»,
# «Чистые Пруды». Но в «п. Чернышевское Нестеровского городского округа» оно
# принадлежит району, а не посёлку — такие хвосты срезаем по форме слова.
TAIL_RE = re.compile(r"\s+[А-ЯЁ][А-Яа-яёЁ\-]*(ского|ском|ский|ская|ской|области|округа|района)$")


# Названия в кавычках — это станции и пункты редуцирования, и назван каждый
# по своему городу: ГРС «Кандалакша», ГРС «Апатиты», ГРС «Сухой Лог». Без них
# у регионов, где программа состоит из магистральных объектов, а не
# межпоселковых газопроводов, список посёлков выходил пустым — хотя именно
# эти города газ и получают.
QUOTED_RE = re.compile(r"[«\"]([А-ЯЁ][А-Яа-яёЁ\- ]{2,30}?)[»\"]")


def extract_settlements(title):
    names = []

    def add(name):
        name = TAIL_RE.sub("", (name or "").strip(" ,;-")).strip(" ,;-")
        # «Калининградской области» целиком — не посёлок
        if not name or re.search(r"(области|край|округа?|района?)$", name):
            return
        if name not in names:
            names.append(name)

    for m in SETTLEMENT_RE.finditer(title):
        add(m.group(1))
    for m in QUOTED_RE.finditer(title):
        add(m.group(1))
    return names


def extract_district(title):
    m = DISTRICT_RE.search(title)
    return m.group(1) if m else None


# ──────────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--all", action="store_true",
                    help="обойти все регионы, а не только регионы присутствия")
    args = ap.parse_args()

    slugs = load_region_slugs()
    city_map = load_city_region_map()

    # Название на gazprommap («Республика Карелия») приводим к нашему («Карелия»)
    unknown = []
    canon_to_slug = {}
    for title, slug in slugs.items():
        canon = normalize_region_name(title, city_map, unknown)
        if canon:
            canon_to_slug.setdefault(canon, slug)

    if args.all:
        targets = sorted(canon_to_slug)
    else:
        live = get_live_canonical_regions()
        targets = [r for r in live if r in canon_to_slug]
        missing = [r for r in live if r not in canon_to_slug]
        if missing:
            log("Нет страницы на gazprommap: %s" % ", ".join(missing))

    log("Регионов к обходу: %d" % len(targets))

    old = {}
    if os.path.exists(OUT_FILE):
        try:
            with open(OUT_FILE, "r", encoding="utf-8") as f:
                old = json.load(f).get("regions", {})
        except (json.JSONDecodeError, OSError):
            old = {}

    regions, ok = {}, 0
    for i, name in enumerate(targets, 1):
        slug = canon_to_slug[name]
        html = fetch("%s/%s/" % (BASE, slug))
        if not html:
            # Прошлые данные лучше пустоты: программа меняется раз в год.
            if name in old:
                regions[name] = dict(old[name], note="страница не открылась, данные прошлого сбора")
            continue
        summary, objects = parse_region_page(html)
        if not summary and not objects:
            log("  [%d/%d] %-28s разметка не разобралась" % (i, len(targets), name))
            if name in old:
                regions[name] = dict(old[name], note="разметка изменилась, данные прошлого сбора")
            continue

        settlements = []
        for o in objects:
            for s in o["settlements"]:
                if s not in settlements:
                    settlements.append(s)

        regions[name] = {
            "source": "%s/%s/" % (BASE, slug),
            "fetched": datetime.date.today().isoformat(),
            "summary": summary,
            "objects": objects,
            "settlements": settlements,
        }
        ok += 1
        log("  [%d/%d] %-28s объектов %2d, посёлков %3d, домовладений %s"
            % (i, len(targets), name, len(objects), len(settlements),
               summary.get("households", "—")))
        time.sleep(PAUSE)

    if targets and ok < len(targets) * MIN_REGIONS_OK:
        log("Разобрано %d из %d регионов — это сбой, файл не переписываю"
            % (ok, len(targets)))
        return 1

    os.makedirs(os.path.dirname(OUT_FILE) or ".", exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "updated": datetime.date.today().isoformat(),
            "source": "gazprommap.ru",
            "program": "2026-2030",
            "regions": regions,
        }, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    log("Готово: %s, регионов %d" % (OUT_FILE, len(regions)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
