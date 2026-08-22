# -*- coding: utf-8 -*-
"""
Сборка динамики спроса по Google Trends — второй столбец «Google» в таблице
«Наши места по категориям» (вкладка «Аналитика» в админке).

Зачем отдельный скрипт, а не расширение AutoWordstat.py: Google не отдаёт
абсолютную частоту запросов. Keyword Planner, единственный её источник,
требует аккаунта Google Ads с активными расходами, а без трат показывает
диапазон «1 тыс. — 10 тыс.» вместо числа — сравнивать группы прайса по такому
нельзя. Google Trends открыт и без ключа, но его значения относительные:
0–100 внутри одного запроса, где 100 — месяц максимума. Между категориями
такие числа несравнимы, поэтому в интерфейс идёт только ИЗМЕНЕНИЕ: вырос
интерес к группе за месяц/квартал/год или упал. Это проверка яндексовой
динамики чужой выборкой, а не второй источник объёма.

Что спрашиваем: ту же фразу, что и Wordstat — поле phrase каждой категории
в analytics/wordstat_categories.json. Один список фраз на оба источника,
иначе расхождение будет означать не разницу аудиторий, а разные запросы.

Как устроен обмен. Официального API у Trends нет, есть два внутренних адреса,
которыми пользуется сама страница trends.google.com:
    explore   — по фразе отдаёт список виджетов, у каждого свой token;
    multiline — по token виджета TIMESERIES отдаёт сам ряд.
Оба отвечают JSON с мусорным префиксом ")]}'," — его срезаем. Перед первым
запросом заходим на главную: без cookie NID оба адреса отвечают 429.

Глубина «2018-01 → последний закрытый месяц» выбрана не случайно: свыше пяти
лет Google переключает шаг с недели на месяц, а месячный шаг нам и нужен,
чтобы ряд сравнивался с яндексовым точка в точку. Более ранние годы брать
незачем — они только сдвинули бы вниз всю шкалу, привязанную к максимуму.

Квоты у Trends нет, есть защита от частых обращений: 429 прилетает пачками,
если бить без пауз. Держим PAUSE между запросами и отступаем при отказе.
Собранное мержим в старый файл: категория, которую Google в этот раз не
отдал, остаётся со вчерашним рядом, а не пропадает из таблицы.

Запуск:
    python AutoTrends.py              — обновить все категории
    python AutoTrends.py --only ID    — одна категория, для проверки
"""

import argparse
import calendar
import datetime
import http.cookiejar
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

HOME_URL = "https://trends.google.com/trends/?geo=RU"
EXPLORE_URL = "https://trends.google.com/trends/api/explore"
MULTILINE_URL = "https://trends.google.com/trends/api/widgetdata/multiline"
# Свой User-Agent тут не годится: на «бота» в имени Trends отвечает 429.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

CATEGORIES_FILE = "analytics/wordstat_categories.json"
OUT_FILE = "analytics/google_trends.json"

GEO = "RU"
START_MONTH = "2018-01"
PAUSE = 4.0            # пауза между запросами, секунды
# Сколько нулевых месяцев из последних двух лет ещё терпимо. Ноль у Trends
# значит не «никто не искал», а «слишком мало, чтобы показать»: у редкой фразы
# ряд скачет 0 → 100 → 0, и любая динамика по нему — выдумка. Такие категории
# собираем, но помечаем sparse, и в таблице по ним стоит прочерк.
SPARSE_ZEROS_MAX = 3
SPARSE_WINDOW = 24
RETRIES = 4            # попыток на запрос
BACKOFF = 30           # первая пауза после отказа, дальше удваивается
TIMEOUT = 40


def log(msg):
    print(msg, flush=True)


# ──────────────────────────────────────────────────────────────────────────
# HTTP
# ──────────────────────────────────────────────────────────────────────────

class TrendsClient:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.jar))
        self._last_call = 0.0

    def warm_up(self):
        """Забираем cookie NID. Без неё оба api-адреса отвечают 429 сразу."""
        self._get(HOME_URL)
        names = [c.name for c in self.jar]
        if "NID" not in names:
            log("  предупреждение: cookie NID не выдана, возможны отказы")

    def _get(self, url):
        wait = PAUSE - (time.time() - self._last_call)
        if wait > 0:
            time.sleep(wait)
        self._last_call = time.time()
        req = urllib.request.Request(url)
        req.add_header("User-Agent", UA)
        req.add_header("Accept-Language", "ru-RU,ru;q=0.9")
        with self.opener.open(req, timeout=TIMEOUT) as r:
            return r.read().decode("utf-8", "replace")

    def get_json(self, url):
        """Ответы Trends начинаются с ")]}'," — до первой фигурной скобки это
        не JSON, а защита от подстановки ответа в <script>."""
        raw = self._get(url)
        i = raw.find("{")
        if i < 0:
            raise ValueError("ответ без JSON")
        return json.loads(raw[i:])

    def get_json_retry(self, url, what):
        delay = BACKOFF
        for attempt in range(1, RETRIES + 1):
            try:
                return self.get_json(url)
            except urllib.error.HTTPError as e:
                # 429 у Trends означает «слишком часто», а не «навсегда»:
                # отступаем и пробуем снова с новой cookie.
                if e.code in (429, 502, 503) and attempt < RETRIES:
                    log("  %s: отказ %d, пауза %d с" % (what, e.code, delay))
                    time.sleep(delay)
                    delay *= 2
                    if e.code == 429:
                        self.jar.clear()
                        try:
                            self.warm_up()
                        except Exception:
                            pass
                    continue
                raise
            except (urllib.error.URLError, ValueError, json.JSONDecodeError) as e:
                if attempt < RETRIES:
                    log("  %s: %s, пауза %d с" % (what, type(e).__name__, delay))
                    time.sleep(delay)
                    delay *= 2
                    continue
                raise
        return None


# ──────────────────────────────────────────────────────────────────────────
# Даты и файлы
# ──────────────────────────────────────────────────────────────────────────

def last_closed_month(today):
    """Текущий месяц не берём: он неполный и всегда выглядел бы провалом."""
    first = today.replace(day=1)
    return first - datetime.timedelta(days=1)


def month_key(ts):
    d = datetime.datetime.fromtimestamp(int(ts), datetime.timezone.utc)
    return "%04d-%02d" % (d.year, d.month)


def load_json_file(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def save_json_file(path, data):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")


def load_categories():
    cfg = load_json_file(CATEGORIES_FILE, None)
    if not cfg or not cfg.get("categories"):
        raise RuntimeError("%s не найден или пуст" % CATEGORIES_FILE)
    out = []
    for c in cfg["categories"]:
        if c.get("id") and c.get("phrase"):
            out.append({"id": c["id"], "phrase": c["phrase"],
                        "order": c.get("order", 99),
                        "section": c.get("section", 99)})
    return out


# ──────────────────────────────────────────────────────────────────────────
# Сбор ряда
# ──────────────────────────────────────────────────────────────────────────

def fetch_series(client, phrase, time_range):
    """Возвращает [["2018-01", 43], ...] — помесячный индекс интереса 0–100.

    Точки, помеченные isPartial, отбрасываем: так Google помечает незакрытый
    период, и его значение занижено просто потому, что месяц ещё идёт."""
    req = {"comparisonItem": [{"keyword": phrase, "geo": GEO, "time": time_range}],
           "category": 0, "property": ""}
    url = ("%s?hl=ru&tz=-180&req=%s"
           % (EXPLORE_URL, urllib.parse.quote(json.dumps(req, ensure_ascii=False))))
    data = client.get_json_retry(url, "explore «%s»" % phrase)
    widgets = [w for w in (data.get("widgets") or []) if w.get("id") == "TIMESERIES"]
    if not widgets:
        raise ValueError("Trends не вернул виджет TIMESERIES")
    w = widgets[0]
    url2 = ("%s?hl=ru&tz=-180&req=%s&token=%s"
            % (MULTILINE_URL,
               urllib.parse.quote(json.dumps(w["request"], ensure_ascii=False)),
               urllib.parse.quote(w["token"])))
    data2 = client.get_json_retry(url2, "ряд «%s»" % phrase)
    timeline = (data2.get("default") or {}).get("timelineData") or []
    series = []
    for p in timeline:
        if p.get("isPartial"):
            continue
        vals = p.get("value") or []
        if not vals:
            continue
        series.append([month_key(p.get("time") or 0), int(vals[0])])
    return series


def is_sparse(series):
    tail = series[-SPARSE_WINDOW:]
    zeros = sum(1 for _, v in tail if not v)
    return zeros > SPARSE_ZEROS_MAX


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="", help="собрать только одну категорию (id)")
    args = ap.parse_args()

    today = datetime.date.today()
    end = last_closed_month(today)
    time_range = "%s-01 %s-%02d" % (START_MONTH, end.strftime("%Y-%m"),
                                    calendar.monthrange(end.year, end.month)[1])
    log("Google Trends, %s, диапазон %s" % (GEO, time_range))

    cats = load_categories()
    if args.only:
        cats = [c for c in cats if c["id"] == args.only]
        if not cats:
            raise RuntimeError("категория «%s» не найдена в %s"
                               % (args.only, CATEGORIES_FILE))

    old = load_json_file(OUT_FILE, {}) or {}
    out_cats = dict(old.get("cats") or {})
    out_phrases = dict(old.get("phrases") or {})

    client = TrendsClient()
    client.warm_up()

    ok, failed = 0, []
    for i, c in enumerate(cats, 1):
        log("[%d/%d] %s — «%s»" % (i, len(cats), c["id"], c["phrase"]))
        try:
            series = fetch_series(client, c["phrase"], time_range)
        except Exception as e:
            log("  не собрано: %s: %s" % (type(e).__name__, e))
            failed.append(c["id"])
            continue
        if len(series) < 13:
            # Меньше года точек — сравнивать «с годом назад» не с чем, а
            # такой ряд обычно значит, что Google не знает фразу.
            log("  не собрано: точек всего %d" % len(series))
            failed.append(c["id"])
            continue
        out_cats[c["id"]] = series
        out_phrases[c["id"]] = c["phrase"]
        ok += 1
        log("  точек %d, последняя %s = %d%s"
            % (len(series), series[-1][0], series[-1][1],
               "  (мало данных, в таблицу не пойдёт)" if is_sparse(series) else ""))

    if not ok:
        # Ни одной категории — это блокировка целиком, а не отсутствие данных.
        # Старый файл в таком случае трогать нельзя: таблица опустеет.
        log("Ничего не собрано, файл не переписан.")
        return 1

    save_json_file(OUT_FILE, {
        "updated": today.strftime("%Y-%m-%d"),
        "geo": GEO,
        "note": ("Относительный индекс интереса Google Trends, 0–100 внутри "
                 "своей строки. Между категориями числа несравнимы, сравнивать "
                 "можно только точки одного ряда."),
        "cats": out_cats,
        "phrases": out_phrases,
        "sparse": sorted(k for k, s in out_cats.items() if is_sparse(s)),
        "failed": sorted(failed)
    })
    sparse_n = sum(1 for s in out_cats.values() if is_sparse(s))
    log("Готово: обновлено %d из %d, не собрано %d, мало данных у %d."
        % (ok, len(cats), len(failed), sparse_n))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
