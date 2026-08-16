# -*- coding: utf-8 -*-
"""
История цен для дашборда админки: как меняется прайс месяц к месяцу.

Зачем. В смете растёт средний чек — и непонятно, стало ли больше работы или
просто подорожало оборудование. Прайс отвечает на это прямо, но живёт он одним
файлом: price_update.php пересобирает price_index.json и старую версию затирает.
Истории нет, а через год она будет нужна — поэтому копим её сейчас.

Как считаем. Не «средняя цена по прайсу»: она скачет от состава ассортимента —
завезли партию дорогих котлов, и «цены выросли», хотя ни одна не изменилась.
Считаем индекс по одним и тем же артикулам: берём позиции, которые есть и в
прошлом снимке, и в новом, у каждой находим отношение новой цены к старой и
берём МЕДИАНУ отношений. Медиана, а не среднее: одна позиция, подешевевшая
в двадцать раз из-за опечатки в прайсе, среднее утащит, медиану — нет.

Что на выходе:
    analytics/prices.json          — история индекса по месяцам и по группам
    analytics/.price_snapshot.json — цены прошлого снимка (артикул → цена),
                                     служебный файл, нужен только для сравнения

Запуск:
    python AutoPriceIndex.py            — обычный прогон (раз в месяц)
    python AutoPriceIndex.py --local FILE — взять прайс из файла, не из сети
                                            (для проверки без обращения к Beget)

Ключей и секретов не требует: price_index.php отдаёт индекс всем, это тот же
файл, который качает сам калькулятор.
"""

import argparse
import datetime
import json
import os
import sys
import urllib.error
import urllib.request

PRICE_URL = "https://proxy.heatcalc.ru/price_index.php"
OUT_FILE = "analytics/prices.json"
SNAPSHOT_FILE = "analytics/.price_snapshot.json"
UA = "Mozilla/5.0 (compatible; HeatCalcAnalyticsBot/1.0; +https://heatcalc.ru)"

# Группы с горсткой позиций дают шумный индекс: две переоценки — и «группа
# подорожала на 40 %». В разбивку по группам берём только те, где хватает
# общих с прошлым месяцем артикулов.
MIN_GROUP_ITEMS = 8
# Сколько групп держать в файле: показываем всё равно верхушку изменений,
# а файл незачем растить полным справочником листов прайса.
KEEP_GROUPS = 40
# Отношения за этими границами — не изменение цены, а мусор в прайсе
# (позиция сменила фасовку, цена уехала на порядок). В индекс не берём.
RATIO_MIN, RATIO_MAX = 0.2, 5.0


def log(msg):
    print(msg, flush=True)


def load_json_file(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (IOError, ValueError):
        return default


def save_json_file(path, data):
    directory = os.path.dirname(path)
    if directory and not os.path.isdir(directory):
        os.makedirs(directory)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def median(values):
    if not values:
        return None
    s = sorted(values)
    n = len(s)
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def fetch_price_index(local_path=None):
    """Индекс цен: из сети или из файла (--local, для проверки)."""
    if local_path:
        data = load_json_file(local_path, None)
        if data is None:
            log("Файл %s не прочитался" % local_path)
        return data
    req = urllib.request.Request(PRICE_URL, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, ValueError, OSError) as e:
        log("Прайс не скачался: %s" % e)
        return None


def normalize(raw):
    """Приводим прайс к {артикул: (цена, группа)}.

    Файл бывает в двух видах: словарь с ключом items и голый список — оба
    встречались вживую, поэтому разбираем оба, а не полагаемся на один.
    """
    items = raw.get("items") if isinstance(raw, dict) else raw
    out = {}
    for it in items or []:
        if not isinstance(it, dict):
            continue
        art = str(it.get("a") or "").strip()
        try:
            price = float(it.get("p") or 0)
        except (TypeError, ValueError):
            continue
        if not art or price <= 0:
            continue
        # Дубли артикула в прайсе бывают: берём первое вхождение, как это
        # делает и сам калькулятор при поиске цены.
        out.setdefault(art, (price, str(it.get("s") or "").strip()))
    return out


def build_month_entry(cur, prev, raw):
    """Считает индекс текущего месяца против прошлого снимка."""
    ratios, by_group = [], {}
    for art, (price, group) in cur.items():
        old = prev.get(art)
        if not old:
            continue
        try:
            old_price = float(old)
        except (TypeError, ValueError):
            continue
        if old_price <= 0:
            continue
        r = price / old_price
        if r < RATIO_MIN or r > RATIO_MAX:
            continue
        ratios.append(r)
        by_group.setdefault(group or "без группы", []).append(r)

    entry = {
        "built": (raw.get("built") if isinstance(raw, dict) else None) or datetime.date.today().isoformat(),
        "version": (raw.get("version") if isinstance(raw, dict) else None) or "",
        "positions": len(cur),
        "common": len(ratios),
        "median_price": round(median([p for p, _ in cur.values()]) or 0, 2),
    }
    m = median(ratios)
    entry["index"] = round((m - 1) * 100, 2) if m is not None else None

    groups = {}
    for group, rs in by_group.items():
        if len(rs) < MIN_GROUP_ITEMS:
            continue
        gm = median(rs)
        groups[group] = {"pct": round((gm - 1) * 100, 2), "n": len(rs)}
    # Оставляем самые заметные изменения в обе стороны, а не первые попавшиеся
    top = sorted(groups.items(), key=lambda kv: abs(kv[1]["pct"]), reverse=True)[:KEEP_GROUPS]
    entry["groups"] = dict(top)
    return entry


def main():
    ap = argparse.ArgumentParser(description="История цен прайса для дашборда")
    ap.add_argument("--local", help="взять прайс из файла вместо сети")
    args = ap.parse_args()

    raw = fetch_price_index(args.local)
    if not raw:
        return 1
    cur = normalize(raw)
    if len(cur) < 100:
        log("В прайсе всего %d позиций — это похоже на сбой выгрузки, файлы не трогаю" % len(cur))
        return 1
    log("Позиций в прайсе: %d, версия %s" % (len(cur), (raw.get("version") if isinstance(raw, dict) else "?")))

    snap = load_json_file(SNAPSHOT_FILE, {})
    prev_prices = snap.get("prices") or {}
    prev_month = snap.get("month")

    this_month = datetime.date.today().strftime("%Y-%m")
    data = load_json_file(OUT_FILE, {})
    months = data.get("months") or {}

    if not prev_prices:
        # Первый прогон: сравнивать не с чем. Это не ошибка — просто
        # запоминаем цены и уходим, индекс появится в следующем месяце.
        log("Прошлого снимка нет — записываю первый, индекс будет со следующего прогона")
        months.setdefault(this_month, {
            "built": raw.get("built") if isinstance(raw, dict) else None,
            "version": raw.get("version") if isinstance(raw, dict) else "",
            "positions": len(cur), "common": 0, "index": None, "groups": {},
            "median_price": round(median([p for p, _ in cur.values()]) or 0, 2),
        })
    else:
        entry = build_month_entry(cur, prev_prices, raw)
        entry["base_month"] = prev_month
        months[this_month] = entry
        if entry["index"] is None:
            log("Общих артикулов с прошлым снимком нет — индекс не посчитан")
        else:
            log("Индекс к %s: %+.2f%% (по %d общим позициям)" % (
                prev_month or "прошлому снимку", entry["index"], entry["common"]))
            for g, v in list(entry["groups"].items())[:10]:
                log("   %-45s %+6.2f%% (%d поз.)" % (g[:45], v["pct"], v["n"]))

    data["updated"] = datetime.date.today().isoformat()
    data["source"] = "price_index"
    data["months"] = months
    save_json_file(OUT_FILE, data)

    # Снимок перезаписываем ТОЛЬКО после успешной записи истории: иначе при
    # сбое на середине мы потеряли бы базу сравнения и следующий месяц
    # оказался бы «первым прогоном» с пустым индексом.
    save_json_file(SNAPSHOT_FILE, {
        "month": this_month,
        "built": raw.get("built") if isinstance(raw, dict) else None,
        "prices": {a: p for a, (p, _) in cur.items()},
    })
    log("Готово: %s обновлён" % OUT_FILE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
