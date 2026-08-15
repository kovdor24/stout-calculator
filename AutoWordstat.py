# -*- coding: utf-8 -*-
"""
Сборка данных Wordstat (поисковый спрос) для вкладки «Аналитика» в админке.

Зачем и как устроено — см. ANALYTICS_PLAN.md, раздел 3. Коротко: считаем спрос
только по регионам, где калькулятор реально присутствует (монтажники,
дистрибьюторы, объекты смет) — их отдаёт RPC-функция Supabase
analytics_live_regions(). Список фраз и какие из них «основные» (core) —
в analytics/wordstat_phrases.json, его владелец правит без кода.

Три режима запуска:
    python AutoWordstat.py             — ежемесячный снимок (3-го числа)
    python AutoWordstat.py --pulse     — недельный пульс по России (понедельник)
    python AutoWordstat.py --backfill  — разовый сбор истории 2018→сейчас
                                          по регионам (запускать руками)

Почему история по регионам не тянется каждый месяц напрямую: у метода
распределения по регионам (GetRegionsDistribution) нет глубины в прошлое —
только последние 30 дней, зато он бесплатно (по числу вызовов) кроет все
регионы одним запросом. А у метода с историей (GetDynamics) глубина есть,
но по одному региону за раз — дорого по часовой квоте. Поэтому: backfill
разово тянет GetDynamics по регионам для основных фраз с 2018 года, а дальше
каждый ежемесячный снимок GetRegionsDistribution сам добавляет в
region_monthly одну новую точку — история растёт сама, без повторных дорогих
запросов. Когда в базе появляется новый живой регион, ежемесячный запуск
сам делает для него маленький backfill (10 запросов, только по core-фразам).

Квота Wordstat — 10 запросов в секунду И 100 в час (см. ANALYTICS_PLAN.md,
3.1). Держим темп с запасом от лимита: RATE_PER_HOUR ниже официального.

Ключ и folderId — только в GitHub Secrets (WORDSTAT_API_KEY,
WORDSTAT_FOLDER_ID), локально их нет и не должно быть.
"""

import argparse
import calendar
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

API_BASE = "https://searchapi.api.cloud.yandex.net/v2/wordstat"
SUPABASE_RPC_PATH = "/rest/v1/rpc/analytics_live_regions"
UA = "Mozilla/5.0 (compatible; HeatCalcAnalyticsBot/1.0; +https://heatcalc.ru)"

PHRASES_FILE = "analytics/wordstat_phrases.json"
CATEGORIES_FILE = "analytics/wordstat_categories.json"
REGIONS_MAP_FILE = "analytics/wordstat_regions_map.json"
STATE_FILE = "analytics/.wordstat_state.json"
OUT_FILE = "analytics/wordstat.json"
PULSE_FILE = "analytics/wordstat_pulse.json"
BRANDS_FILE = "analytics/wordstat_brands.json"
CITIES_GEO_FILE = "cities_geo.js"
APP_JS_FILE = "app.js"

RATE_PER_SECOND = 8            # запас от официальных 10/с
RATE_PER_HOUR = 90              # запас от официальных 100/ч
QUOTA_WAIT = 20 * 60            # сколько ждать, поймав отказ по часовой квоте
MIN_SUCCESS_RATIO = 0.8         # ниже — файлы не переписываем, это сбой
SNAPSHOT_MONTHS_KEEP = 6        # region_snapshots — только последние месяцы,
                                 # полная история и так есть в region_monthly
TOP_MONTHS_KEEP = 2             # «последний снимок и предыдущий», см. план
BRAND_MONTHS_KEEP = 24          # рейтинги марок по России — два года истории
BRAND_REGION_KEEP = 8           # региональные срезы делаем раз в квартал

# ──────────────────────────────────────────────────────────────────────────
# Канонические имена регионов — как в el_tariffs.js / cities_geo.js.
# Список сверен с el_tariffs.js (EL_TARIFFS, 85 ключей) 15.08.2026.
# ──────────────────────────────────────────────────────────────────────────

CANONICAL_REGIONS = frozenset([
    "Адыгея", "Алтай", "Алтайский край", "Амурская область", "Архангельская область",
    "Астраханская область", "Башкортостан", "Белгородская область", "Брянская область",
    "Бурятия", "Владимирская область", "Волгоградская область", "Вологодская область",
    "Воронежская область", "Дагестан", "Еврейская АО", "Забайкальский край",
    "Ивановская область", "Ингушетия", "Иркутская область", "Кабардино-Балкария",
    "Калининградская область", "Калмыкия", "Калужская область", "Камчатский край",
    "Карачаево-Черкесия", "Карелия", "Кемеровская область", "Кировская область",
    "Коми", "Костромская область", "Краснодарский край", "Красноярский край",
    "Крым", "Курганская область", "Курская область", "Ленинградская область",
    "Липецкая область", "Магаданская область", "Марий Эл", "Мордовия", "Москва",
    "Московская область", "Мурманская область", "Ненецкий АО", "Нижегородская область",
    "Новгородская область", "Новосибирская область", "Омская область",
    "Оренбургская область", "Орловская область", "Пензенская область",
    "Пермский край", "Приморский край", "Псковская область", "Ростовская область",
    "Рязанская область", "Самарская область", "Санкт-Петербург", "Саратовская область",
    "Сахалинская область", "Свердловская область", "Севастополь", "Северная Осетия",
    "Смоленская область", "Ставропольский край", "Тамбовская область", "Татарстан",
    "Тверская область", "Томская область", "Тульская область", "Тыва",
    "Тюменская область", "Удмуртия", "Ульяновская область", "Хабаровский край",
    "Хакасия", "Ханты-Мансийский АО", "Челябинская область", "Чечня", "Чувашия",
    "Чукотский АО", "Якутия", "Ямало-Ненецкий АО", "Ярославская область",
])

# Длинные формы — как их пишет регистрация монтажника (app.js VALID_REGIONS)
# и свободный ввод дистрибьютора. Только те, что ОТЛИЧАЮТСЯ от канонической
# короткой формы — остальные длинные формы совпадают с CANONICAL_REGIONS
# один в один (например «Московская область» и там, и там).
REGION_LONG_ALIASES = {
    "Еврейская автономная область": "Еврейская АО",
    "Республика Адыгея": "Адыгея",
    "Республика Алтай": "Алтай",
    "Республика Башкортостан": "Башкортостан",
    "Республика Бурятия": "Бурятия",
    "Республика Дагестан": "Дагестан",
    "Республика Ингушетия": "Ингушетия",
    "Кабардино-Балкарская Республика": "Кабардино-Балкария",
    "Карачаево-Черкесская Республика": "Карачаево-Черкесия",
    "Республика Карелия": "Карелия",
    "Республика Коми": "Коми",
    "Республика Крым": "Крым",
    "Республика Марий Эл": "Марий Эл",
    "Республика Мордовия": "Мордовия",
    "Республика Саха (Якутия)": "Якутия",
    "Республика Саха": "Якутия",
    "Республика Северная Осетия - Алания": "Северная Осетия",
    "Республика Северная Осетия — Алания": "Северная Осетия",
    "Республика Татарстан": "Татарстан",
    "Республика Тыва": "Тыва",
    "Удмуртская Республика": "Удмуртия",
    "Республика Хакасия": "Хакасия",
    "Чеченская Республика": "Чечня",
    "Чувашская Республика": "Чувашия",
    "Ненецкий автономный округ": "Ненецкий АО",
    "Ханты-Мансийский автономный округ - Югра": "Ханты-Мансийский АО",
    "Ханты-Мансийский автономный округ — Югра": "Ханты-Мансийский АО",
    "Чукотский автономный округ": "Чукотский АО",
    "Ямало-Ненецкий автономный округ": "Ямало-Ненецкий АО",
}

# Климатические зоны калькулятора (state.region по умолчанию, когда город не
# выбран) — это не регион, а расчётная зона. Отбрасываем молча, это норма.
CLIMATE_ZONES = {"центр", "юг", "урал", "сибирь"}

# Федеральные округа изредка остаются в старых записях дистрибьюторов —
# отбрасываем, но с записью в лог: это не climate zone, это грязные данные.
FED_DISTRICT_RE = re.compile(
    r"федеральный округ|\bурфо\b|\bцфо\b|\bсзфо\b|\bпфо\b|\bюфо\b|\bскфо\b|\bсфо\b|\bдвфо\b",
    re.IGNORECASE,
)


def log(msg):
    print(msg, flush=True)


# ──────────────────────────────────────────────────────────────────────────
# HTTP + лимит запросов
# ──────────────────────────────────────────────────────────────────────────

class RateLimiter:
    """Держит темп не чаще RATE_PER_SECOND в секунду и RATE_PER_HOUR в час
    (скользящее окно). Часовой предел — основной: 100 backfill-запросов на
    нашем темпе растягиваются на час-полтора, и это ожидаемо, не сбой."""

    def __init__(self):
        self._calls = []  # timestamps

    def reset(self):
        """После ожидания часовой квоты прежние отметки бессмысленны: окно
        открылось заново, и держать паузу по старым меткам значит простаивать
        второй час подряд."""
        self._calls = []

    def wait(self):
        now = time.time()
        self._calls = [t for t in self._calls if now - t < 3600]
        if len(self._calls) >= RATE_PER_HOUR:
            sleep_for = 3600 - (now - self._calls[0]) + 1
            log("  темп: %d запросов за час, пауза %d с" % (RATE_PER_HOUR, int(sleep_for)))
            time.sleep(max(sleep_for, 1))
            now = time.time()
            self._calls = [t for t in self._calls if now - t < 3600]
        recent = [t for t in self._calls if now - t < 1]
        if len(recent) >= RATE_PER_SECOND:
            time.sleep(1)
            now = time.time()
        self._calls.append(now)


def http_post_json(url, headers, payload, timeout=30):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", UA)
    for k, v in headers.items():
        req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


class WordstatClient:
    def __init__(self, api_key, folder_id, limiter):
        self.api_key = api_key
        self.folder_id = folder_id
        self.limiter = limiter
        self.attempted = 0
        self.succeeded = 0

    def call(self, method, body, tries=5):
        """POST на .../v2/wordstat/<method> с ключом и folderId. Три попытки
        на 429/503 с растущей паузой — квота часовая, лишний запрос при сбое
        стоит реальных денег и минут, поэтому не долбим чаще необходимого."""
        body = dict(body)
        body["folderId"] = self.folder_id
        headers = {"Authorization": "Api-key %s" % self.api_key}
        url = "%s/%s" % (API_BASE, method)
        self.attempted += 1
        last_err = None
        for attempt in range(tries):
            self.limiter.wait()
            try:
                result = http_post_json(url, headers, body)
                self.succeeded += 1
                return result
            except urllib.error.HTTPError as e:
                body_txt = ""
                try:
                    body_txt = e.read().decode("utf-8", "replace")[:300]
                except Exception:
                    pass
                last_err = "HTTP %s: %s" % (e.code, body_txt)
                if e.code in (429, 503) and attempt < tries - 1:
                    # Часовая квота у Яндекса общая на аккаунт, а наш счётчик
                    # живёт внутри процесса: два прогона подряд — и второй
                    # стартует с нулём в счётчике, но с уже выбранной квотой.
                    # Ждать в таком случае надо не секунды, а до открытия
                    # следующего часового окна. Прогон, потерявший на этом
                    # 29 запросов из 47, и заставил переписать эту ветку.
                    quota = "RequestsPerHour" in body_txt or "quota" in body_txt.lower()
                    pause = QUOTA_WAIT if quota else 5 * (attempt + 1)
                    log("  %s: %s%s, повтор через %d с" % (
                        method, "исчерпана часовая квота" if quota else last_err,
                        "" if quota else "", pause))
                    time.sleep(pause)
                    if quota:
                        # Окно открылось — прежние отметки уже не считаются.
                        self.limiter.reset()
                    continue
                break
            except Exception as e:  # noqa: BLE001 — причина уходит в лог
                last_err = str(e)
                if attempt < tries - 1:
                    time.sleep(3 * (attempt + 1))
                    continue
                break
        log("  %s: не удалось (%s)" % (method, last_err))
        return None

    @property
    def success_ratio(self):
        if self.attempted == 0:
            return 1.0
        return self.succeeded / self.attempted


def to_int(v, default=0):
    try:
        if v in (None, ""):
            return default
        return int(v)
    except (TypeError, ValueError):
        try:
            return int(float(v))
        except (TypeError, ValueError):
            return default


def to_float(v, default=None):
    try:
        if v in (None, ""):
            return default
        return float(v)
    except (TypeError, ValueError):
        return default


# ──────────────────────────────────────────────────────────────────────────
# Даты
# ──────────────────────────────────────────────────────────────────────────

def month_start(d):
    return d.replace(day=1)


def month_end(d):
    last = calendar.monthrange(d.year, d.month)[1]
    return d.replace(day=last)


def rfc3339(d):
    return "%sT00:00:00Z" % d.isoformat()


def month_key(date_str):
    """"2026-07-15T00:00:00Z" -> "2026-07". Достаточно префикса: месяц
    у ответа и так один на весь период агрегации."""
    return date_str[:7]


def monday_of(d):
    return d - datetime.timedelta(days=d.weekday())


def recent_full_weeks(n):
    """Понедельник n-й полной недели назад .. воскресенье прошлой полной
    недели. Текущая (неполная) неделя не берётся — иначе последняя точка
    графика была бы заведомо заниженной."""
    today = datetime.date.today()
    last_monday = monday_of(today) - datetime.timedelta(days=7)
    first_monday = last_monday - datetime.timedelta(weeks=n - 1)
    last_sunday = last_monday + datetime.timedelta(days=6)
    return first_monday, last_sunday


# ──────────────────────────────────────────────────────────────────────────
# Регионы: живой список из Supabase + приведение к каноническим именам
# ──────────────────────────────────────────────────────────────────────────

def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_supabase_credentials():
    """Читает supabaseUrl/supabaseKey из app.js регэкспом — это публичный
    (anon) ключ, уже отдаваемый браузеру, дублировать его в секретах смысла
    нет. Если формат файла поменяется — понятная ошибка, а не тихий сбой."""
    src = read_text(APP_JS_FILE)
    m_url = re.search(r"const\s+supabaseUrl\s*=\s*'([^']+)'", src)
    m_key = re.search(r"const\s+supabaseKey\s*=\s*'([^']+)'", src)
    if not m_url or not m_key:
        raise RuntimeError("supabaseUrl/supabaseKey не найдены в %s" % APP_JS_FILE)
    return m_url.group(1), m_key.group(1)


def load_city_region_map():
    """Город -> канонический регион, из cities_geo.js (CITY_GEO). Нужен для
    object_info.region у смет: там хранится название ВЫБРАННОГО ГОРОДА,
    а не региона (см. ANALYTICS_PLAN.md, 2.1)."""
    src = read_text(CITIES_GEO_FILE)
    out = {}
    for m in re.finditer(r'"([^"]+)":\s*\{([^{}]*)\}', src):
        city, body = m.group(1), m.group(2)
        rm = re.search(r'region:\s*"([^"]+)"', body)
        if rm:
            out[city] = rm.group(1)
    return out


def expand_abbrev(s):
    """«обл.» -> «область» и т.п. — тот же приём, что и в app.js при разборе
    анкеты монтажника (там это делает регулярка на клиенте), нужен здесь для
    свободного текстового поля дистрибьютора, где ввод никто не проверяет."""
    s = re.sub(r"\bобл\.?\b", "область", s, flags=re.IGNORECASE)
    s = re.sub(r"\bресп\.?\b", "республика", s, flags=re.IGNORECASE)
    s = re.sub(r"\bкр\.?\b", "край", s, flags=re.IGNORECASE)
    return s


def normalize_region_name(raw, city_map, unknown_log):
    """Сырое значение (регион монтажника / регион дистрибьютора / город из
    сметы) -> каноническое имя региона или None. Незнакомое — в unknown_log,
    не молча (тот же принцип, что у AutoTariff.SLUG_TO_REGION)."""
    if not raw:
        return None
    raw = raw.strip()
    if not raw:
        return None
    low = raw.lower().replace("ё", "е")

    if low in CLIMATE_ZONES:
        return None  # ожидаемо, не ошибка

    if FED_DISTRICT_RE.search(raw):
        unknown_log.append(("федеральный округ, не регион", raw))
        return None

    if raw in CANONICAL_REGIONS:
        return raw
    if raw in REGION_LONG_ALIASES:
        return REGION_LONG_ALIASES[raw]
    if raw in city_map:
        return city_map[raw]

    expanded = expand_abbrev(raw)
    if expanded != raw:
        if expanded in CANONICAL_REGIONS:
            return expanded
        if expanded in REGION_LONG_ALIASES:
            return REGION_LONG_ALIASES[expanded]

    for k, v in REGION_LONG_ALIASES.items():
        if k.lower() == low:
            return v
    for c in CANONICAL_REGIONS:
        if c.lower() == low:
            return c

    unknown_log.append(("не опознано", raw))
    return None


def fetch_live_regions_raw(supabase_url, supabase_key):
    url = supabase_url.rstrip("/") + SUPABASE_RPC_PATH
    headers = {
        "apikey": supabase_key,
        "Authorization": "Bearer %s" % supabase_key,
    }
    result = http_post_json(url, headers, {})
    if not isinstance(result, list):
        raise RuntimeError("Неожиданный ответ RPC: %r" % (result,))
    return result


def get_live_canonical_regions():
    """Живые регионы -> отсортированный список канонических имён. Если RPC
    недоступен — не падаем, берём regions из последнего wordstat.json
    (см. ANALYTICS_PLAN.md, 2.1: «парсер берёт список из прошлого
    analytics/*.json и пишет предупреждение, а не падает»)."""
    city_map = load_city_region_map()
    unknown = []
    try:
        supabase_url, supabase_key = load_supabase_credentials()
        rows = fetch_live_regions_raw(supabase_url, supabase_key)
        names = set()
        for row in rows:
            canon = normalize_region_name(row.get("name"), city_map, unknown)
            if canon:
                names.add(canon)
        if unknown:
            log("Регионы без опознания (%d): %s" % (
                len(unknown), ", ".join("%s [%s]" % (v, k) for k, v in unknown[:20])))
        if not names:
            raise RuntimeError("RPC вернул пустой список регионов")
        log("Живых регионов: %d (%s)" % (len(names), ", ".join(sorted(names))))
        return sorted(names)
    except Exception as e:  # noqa: BLE001
        log("Не удалось получить живые регионы из Supabase: %s" % e)
        old = load_json_file(OUT_FILE, None)
        if old and old.get("regions"):
            names = sorted(old["regions"].keys())
            log("ВНИМАНИЕ: список регионов взят из прошлого запуска (%d): %s" % (
                len(names), ", ".join(names)))
            return names
        raise RuntimeError(
            "Supabase недоступен, а прошлого %s тоже нет — списка регионов "
            "взять неоткуда" % OUT_FILE)


# ──────────────────────────────────────────────────────────────────────────
# Карта регионов Яндекса (yid) — строится один раз, дальше только читается
# ──────────────────────────────────────────────────────────────────────────

def flatten_region_tree(nodes, out, path=()):
    for n in nodes or []:
        label = n.get("label")
        if n.get("id") and label:
            out.append((str(n["id"]), label, " / ".join(path)))
        flatten_region_tree(n.get("children"), out, path + ((label or "?"),))


NORM_STRIP_WORDS = ("республика", "область", "край", "автономный", "округ", "ао")


def norm_key(label):
    s = label.lower().replace("ё", "е")
    s = re.sub(r"[^\w\s\-]", " ", s, flags=re.UNICODE)
    s = s.replace("-", " ")
    tokens = [t for t in s.split() if t not in NORM_STRIP_WORDS]
    return " ".join(sorted(tokens))


def build_region_lookup(flat):
    """norm_key(ярлык Яндекса) -> (id, ярлык). При дублях — первый выигрывает,
    остальные в лог: сталкиваться не должны, но если да — лучше видеть."""
    lookup = {}
    dupes = []
    for rid, label, _path in flat:
        k = norm_key(label)
        if not k:
            continue
        if k in lookup and lookup[k][0] != rid:
            dupes.append((label, lookup[k][1]))
            continue
        lookup[k] = (rid, label)
    if dupes:
        log("  сталкивающиеся названия регионов Яндекса (оставлен первый): %s" % dupes[:10])
    return lookup


def suggest_candidates(name, flat, limit=8):
    """Похожие ярлыки для несопоставленного региона — чтобы в логе сразу было
    видно, ЧТО есть у Яндекса вместо ожидаемого. Ищем по самому длинному слову
    названия («московская», «ленинградская»): оно и есть отличительное."""
    words = [w for w in norm_key(name).split() if len(w) > 4]
    if not words:
        return []
    stem = max(words, key=len)[:6]
    hits = []
    for rid, label, path in flat:
        if stem in label.lower().replace("ё", "е"):
            hits.append("%s = %s%s" % (rid, label, (" [в %s]" % path) if path else ""))
        if len(hits) >= limit:
            break
    return hits


def ensure_region_map(canonical_names, client):
    """Дополняет analytics/wordstat_regions_map.json недостающими именами.
    Существующие записи НИКОГДА не трогает — если их поправили руками (файл
    предполагается «строится один раз, дальше читается», см. план 3.4),
    правка не должна затираться автоматом."""
    region_map = load_json_file(REGIONS_MAP_FILE, {})
    missing = [n for n in canonical_names if n not in region_map]
    if not missing:
        return region_map

    log("В карте регионов Яндекса не хватает %d: %s" % (len(missing), ", ".join(missing)))
    tree_resp = client.call("getRegionsTree", {})
    if not tree_resp:
        log("  GetRegionsTree не ответил, недостающие регионы пропускаем в этом запуске")
        return region_map

    flat = []
    flatten_region_tree(tree_resp.get("regions"), flat)
    lookup = build_region_lookup(flat)

    still_missing = []
    for name in missing:
        candidates = [name]
        for k, v in REGION_LONG_ALIASES.items():
            if v == name:
                candidates.append(k)
        found = None
        for cand in candidates:
            hit = lookup.get(norm_key(cand))
            if hit:
                found = hit
                break
        if found:
            region_map[name] = {"yid": found[0], "yandex_label": found[1]}
            log("  %s -> yid %s (%s)" % (name, found[0], found[1]))
        else:
            still_missing.append(name)

    if still_missing:
        log("  НЕ сопоставлено (проверить/дописать руками в %s): %s" % (
            REGIONS_MAP_FILE, ", ".join(still_missing)))
        # Показываем, что у Яндекса есть похожего: подставлять «на глаз» нельзя
        # (у него есть, например, отдельный регион «Москва и Московская
        # область» — взять его вместо области значит подмешать московский
        # спрос в подмосковный и молча получить неверные цифры).
        for name in still_missing:
            hits = suggest_candidates(name, flat)
            log("    похожее у Яндекса для «%s»: %s" % (
                name, "; ".join(hits) if hits else "ничего не нашлось"))

    save_json_file(REGIONS_MAP_FILE, region_map)
    return region_map


def run_dump_regions(client):
    """Диагностика: печатает дерево регионов Яндекса в лог. Метод
    GetRegionsTree бесплатный, так что режим ничего не стоит. Нужен, когда
    регион не сопоставился и надо глазами увидеть, под каким именем он живёт
    у Яндекса и живёт ли вообще."""
    tree_resp = client.call("getRegionsTree", {})
    if not tree_resp:
        log("GetRegionsTree не ответил")
        return 1
    flat = []
    flatten_region_tree(tree_resp.get("regions"), flat)
    log("Всего узлов в дереве: %d" % len(flat))

    # Печатаем дерево целиком: тысяча строк в логе ничего не стоит, зато
    # больше не придётся гонять диагностику из-за того, что нужный узел
    # оказался глубже выбранной отсечки.
    log("--- дерево регионов Wordstat ---")
    for rid, label, path in flat:
        log("  %-8s %-45s [в %s]" % (rid, label, path or "-"))
    return 0


# ──────────────────────────────────────────────────────────────────────────
# Файлы
# ──────────────────────────────────────────────────────────────────────────

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


def load_phrases():
    cfg = load_json_file(PHRASES_FILE, None)
    if not cfg or not cfg.get("phrases"):
        raise RuntimeError("%s не найден или пуст" % PHRASES_FILE)
    by_id = {p["id"]: p for p in cfg["phrases"]}
    core_ids = [p["id"] for p in cfg["phrases"] if p.get("core")]
    top_ids = cfg.get("top_requests_for", [])
    return cfg["phrases"], by_id, core_ids, top_ids


def load_categories():
    cfg = load_json_file(CATEGORIES_FILE, None)
    if not cfg or not cfg.get("categories"):
        raise RuntimeError("%s не найден или пуст" % CATEGORIES_FILE)
    return cfg


# ──────────────────────────────────────────────────────────────────────────
# Обнаружение брендов: кто лидирует в категории — по данным, а не по памяти
# ──────────────────────────────────────────────────────────────────────────

# Слово из запроса засчитываем в бренд, если оно не служебное и не часть
# самой категории. Числа и размеры («16х2.0», «200») отбрасываем: это
# типоразмеры, а не марки.
NUM_TOKEN_RE = re.compile(r"^[\d.,x×/\-]+$")
WORD_RE = re.compile(r"[a-zA-Zа-яА-ЯёЁ][\w.\-]*", re.UNICODE)


def phrase_tokens(phrase):
    return [w.lower().replace("ё", "е") for w in WORD_RE.findall(phrase)]


def build_alias_index(cfg):
    """написание -> как показываем. Кириллица и латиница у Wordstat — разные
    запросы, и без сведения один бренд идёт в рейтинге двумя строками с
    половинным счётом каждая."""
    idx = {}
    for canon, variants in (cfg.get("brand_aliases") or {}).items():
        c = canon.lower().replace("ё", "е")
        idx[c] = c
        for v in variants:
            idx[v.lower().replace("ё", "е")] = c
    return idx


def canon_brand(name, aliases):
    return aliases.get(name, name)


def build_brand_matcher(cat, own_brands, aliases):
    """Словарь распознавания для категории: известные марки, свои бренды и
    все их написания. Многословные («royal thermo», «метеор термо») ищем
    подстрокой, однословные — по токенам."""
    known = [b.lower().replace("ё", "е") for b in cat.get("known_brands", [])]
    known += [b.lower().replace("ё", "е") for b in own_brands]
    # Написания из таблицы синонимов тоже должны узнаваться: в конфиге
    # категории может стоять только латиница, а ищут кириллицей.
    for variant, canon in aliases.items():
        if canon in known or variant in known:
            known.append(variant)
    multi = sorted(set(b for b in known if " " in b), key=len, reverse=True)
    single = set(b for b in known if " " not in b)
    ambiguous = set(b.lower() for b in cat.get("ambiguous", []))
    return multi, single, ambiguous


def extract_brands(phrase, cat_tokens, multi, single, ambiguous, stop_words, aliases):
    """Марки, упомянутые в запросе, сведённые к одному написанию.
    Неоднозначные («tim», «oasis», «point») засчитываем только здесь —
    внутри запроса про эту категорию, — потому что само по себе такое
    слово ничего не значит."""
    low = phrase.lower().replace("ё", "е")
    found = set()
    for m in multi:
        if m in low:
            found.add(canon_brand(m, aliases))
    for t in phrase_tokens(phrase):
        if t in cat_tokens or t in stop_words or NUM_TOKEN_RE.match(t) or len(t) < 3:
            continue
        if t in single:
            found.add(canon_brand(t, aliases))
    return found


def collect_unknown_tokens(phrase, cat_tokens, single, multi, stop_words, counter):
    """Кандидаты в бренды: слова, которых нет ни в словаре, ни в стоп-листе.
    Именно отсюда всплывают локальные игроки, которых никто не назвал."""
    low = phrase.lower().replace("ё", "е")
    if any(m in low for m in multi):
        return
    for t in phrase_tokens(phrase):
        if (t in cat_tokens or t in stop_words or t in single
                or NUM_TOKEN_RE.match(t) or len(t) < 3):
            continue
        counter[t] = counter.get(t, 0) + 1


LATIN_RE = re.compile(r"^[a-z][a-z0-9.\-]*$")


def rank_candidates(candidates, categories, limit=80):
    """Отбор кандидатов в бренды. Первый прогон показал, чего стоит наивная
    сортировка по частоте: сверху оказались «как», «выбрать», «газового» —
    обычные слова, а настоящие находки (aquatec, zeissler) утонули.

    Признак марки — узость: бренд живёт в одной-двух категориях, а служебное
    слово встречается всюду. Плюс латиница почти всегда бренд, а падежные
    формы слов самой категории («гидрострелкой», «внутрипольных») отсекаются
    по общему началу с её словами."""
    cat_stems = set()
    for c in categories:
        for t in phrase_tokens(c["phrase"]):
            if len(t) >= 5:
                cat_stems.add(t[:5])

    scored = []
    for word, info in candidates.items():
        n_cats = len(info["cats"])
        if len(word) >= 5 and word[:5] in cat_stems:
            continue                      # форма слова из названия категории
        latin = bool(LATIN_RE.match(word))
        if latin:
            # Латиница почти всегда марка, и порог по числу категорий тут
            # мягче нарочно: самые интересные конкуренты — сквозные, они
            # встречаются во многих группах сразу (так в первом прогоне
            # едва не потерялся zeissler, найденный в трёх).
            if n_cats > 6:
                continue
        else:
            if n_cats > 2 or info["hits"] < 5:
                continue                  # русское слово из многих групп — не бренд
        scored.append((0 if latin else 1, n_cats, -info["hits"], word, info))

    scored.sort()
    return {w: {"hits": i["hits"], "cats": i["cats"], "latin": bool(LATIN_RE.match(w))}
            for _, _, _, w, i in scored[:limit]}


def run_brands(client, regional=False):
    """Рейтинг марок внутри каждой товарной категории — из топа запросов
    Wordstat (GetTop). Смысл: список конкурентов не сочиняется вручную,
    а измеряется; свои бренды всегда в этом же рейтинге, даже если далеко
    внизу — «не входит в топ» тоже ответ."""
    cfg = load_categories()
    categories = cfg["categories"]
    own_brands = cfg.get("own_brands", [])
    stop_words = set(w.lower() for w in cfg.get("stop_words", []))
    aliases = build_alias_index(cfg)
    own_canon = []
    for b in own_brands:
        c = canon_brand(b.lower().replace("ё", "е"), aliases)
        if c not in own_canon:
            own_canon.append(c)

    region_ids = {}
    if regional:
        live = get_live_canonical_regions()
        region_map = ensure_region_map(live, client)
        region_ids = {n: region_map[n]["yid"] for n in live if n in region_map}
        # Регионы гоняем только по помеченным категориям: все 63 × 10 регионов
        # это 630 запросов, семь часов при квоте 100 в час — в таймаут задачи
        # не влезает. Да и смысла нет: у категорий вроде КИП по стране девять
        # запросов, делить их на десять регионов бессмысленно.
        categories = [c for c in categories if c.get("regional")]
        # Знак умножения тут писать нельзя: в консоли с кириллической
        # кодировкой он не кодируется и роняет скрипт на ровном месте.
        log("Региональный срез: %d категорий x %d регионов = %d запросов"
            % (len(categories), len(region_ids), len(categories) * len(region_ids)))

    data = load_json_file(BRANDS_FILE, {})
    this_month = datetime.date.today().strftime("%Y-%m")
    result_ru = {}
    result_reg = {}
    candidates_all = {}

    for cat in categories:
        cat_tokens = set(phrase_tokens(cat["phrase"]))
        multi, single, ambiguous = build_brand_matcher(cat, own_brands, aliases)

        # В региональном режиме по России не переспрашиваем: этот рейтинг уже
        # собран обычным --brands, а лишний запрос стоит денег и квоты.
        if regional:
            targets = [(name, yid) for name, yid in sorted(region_ids.items())]
        else:
            targets = [(None, None)]

        for region_name, yid in targets:
            body = {"phrase": cat["phrase"], "numPhrases": "500"}
            if yid:
                body["regions"] = [yid]
            resp = client.call("topRequests", body)
            if resp is None:
                continue

            rows = list(resp.get("results", [])) + list(resp.get("associations", []))
            totals = {}
            cand = {}
            for r in rows:
                phrase = r.get("phrase", "")
                count = to_int(r.get("count"))
                if not phrase or count <= 0:
                    continue
                brands = extract_brands(phrase, cat_tokens, multi, single,
                                        ambiguous, stop_words, aliases)
                for b in brands:
                    totals[b] = totals.get(b, 0) + count
                if not brands:
                    collect_unknown_tokens(phrase, cat_tokens, single, multi,
                                            stop_words, cand)

            ranking = sorted(totals.items(), key=lambda kv: -kv[1])
            entry = {
                "total": to_int(resp.get("totalCount")),
                "ranking": [[b, c] for b, c in ranking],
                "own": {b: {"count": totals.get(b, 0),
                            "place": next((i + 1 for i, (n, _) in enumerate(ranking)
                                            if n == b), None)}
                         for b in own_canon},
            }
            if region_name:
                result_reg.setdefault(cat["id"], {})[region_name] = entry
            else:
                result_ru[cat["id"]] = entry
                # Кандидаты копим только по России: в регионах те же слова,
                # но частоты мельче — на общий список это ничего не добавит.
                for t, n in cand.items():
                    if n >= 2:      # разовое слово — почти всегда опечатка
                        candidates_all.setdefault(t, {"hits": 0, "cats": []})
                        candidates_all[t]["hits"] += n
                        if cat["id"] not in candidates_all[t]["cats"]:
                            candidates_all[t]["cats"].append(cat["id"])

            top3 = ", ".join("%s %d" % (b, c) for b, c in ranking[:3]) or "—"
            own_note = ", ".join(
                "%s %s" % (b, ("%d место" % entry["own"][b]["place"])
                            if entry["own"][b]["place"] else "не в топе")
                for b in ("stout", "rommer") if b in entry["own"])
            log("  %-18s %-22s лидеры: %-45s | %s" % (
                cat["id"], region_name or "Россия", top3, own_note))

    ratio = client.success_ratio
    log("Запросов: %d, успешно: %d (%.0f%%)" % (client.attempted, client.succeeded, ratio * 100))
    if ratio < MIN_SUCCESS_RATIO:
        log("Меньше %.0f%% запросов удалось — файл не переписываю, это сбой" % (MIN_SUCCESS_RATIO * 100))
        return 1

    if regional:
        # Рейтинги по России в этом режиме не собирались — трогать их нельзя,
        # иначе региональный прогон затрёт месяц пустышкой. По той же причине
        # не переписываем список категорий и кандидатов: здесь их подмножество.
        data.setdefault("regions", {})[this_month] = result_reg
        for m in sorted(data["regions"])[:-BRAND_REGION_KEEP]:
            del data["regions"][m]
    else:
        data.setdefault("months", {})[this_month] = result_ru
        for m in sorted(data["months"])[:-BRAND_MONTHS_KEEP]:
            del data["months"][m]

        # Помесячная история спроса на саму категорию — чтобы во вкладке
        # считать «плюс-минус процентов» к прошлому месяцу, кварталу и году.
        # Копить её из ежемесячных снимков нельзя: первый процент появился бы
        # только через год. Один запрос на категорию отдаёт ряд с 2018 года
        # сразу — 47 запросов, около рубля.
        from_date = rfc3339(datetime.date(2018, 1, 1))
        to_date = rfc3339(month_end(datetime.date.today()))
        cat_monthly = data.get("cat_monthly", {})
        for cat in categories:
            resp = client.call("dynamics", {
                "phrase": cat["phrase"], "period": "PERIOD_MONTHLY",
                "fromDate": from_date, "toDate": to_date,
            })
            if resp is None:
                continue
            series = [[month_key(r["date"]), to_int(r.get("count"))]
                      for r in resp.get("results", [])]
            series.sort(key=lambda x: x[0])
            if series:
                cat_monthly[cat["id"]] = series
        data["cat_monthly"] = cat_monthly
        log("История по категориям: %d рядов" % len(cat_monthly))
        # order и section_title нужны вкладке: она строит таблицу в порядке
        # подбора сметы, а не по занятому месту. Без них порядок разъезжается,
        # и это незаметно — таблица просто рисуется как попало.
        data["categories"] = {c["id"]: {"phrase": c["phrase"], "section": c.get("section"),
                                         "section_title": c.get("section_title"),
                                         "order": c.get("order"),
                                         "cat": c.get("cat"), "price_group": c.get("price_group"),
                                         "own_in_group": c.get("own_in_group"),
                                         "regional": bool(c.get("regional"))}
                               for c in categories}
        data["candidates"] = rank_candidates(candidates_all, categories)
    data["updated"] = datetime.date.today().isoformat()
    save_json_file(BRANDS_FILE, data)
    log("Готово: %s обновлён. Кандидатов в бренды на проверку: %d" % (
        BRANDS_FILE, len(data["candidates"])))
    return 0


# ──────────────────────────────────────────────────────────────────────────
# Backfill / докатка нового региона: GetDynamics по одному региону за раз
# ──────────────────────────────────────────────────────────────────────────

def load_state():
    return load_json_file(STATE_FILE, {"done": [], "region_monthly": {}})


def save_state(state):
    save_json_file(STATE_FILE, state)


def clear_state():
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)


def fetch_region_series(client, phrase_text, region_entry, from_date, to_date):
    """Месячный ряд запросов по региону. У «Московской» и «Ленинградской»
    областей в дереве Wordstat своего узла нет — есть «Москва и область» и
    «Санкт-Петербург и Ленинградская область», внутри которых сидит сам
    город. Поэтому для них в карте регионов стоит minus_yid, и область
    получается вычитанием города из пары: два запроса вместо одного.
    Возвращает None, если хоть один запрос не удался (частичные данные тут
    хуже отсутствия: разница с недобранным вычитаемым завысит область)."""
    def series_of(yid):
        resp = client.call("dynamics", {
            "phrase": phrase_text,
            "period": "PERIOD_MONTHLY",
            "fromDate": from_date,
            "toDate": to_date,
            "regions": [yid],
        })
        if resp is None:
            return None
        return {month_key(r["date"]): to_int(r.get("count"))
                for r in resp.get("results", [])}

    whole = series_of(region_entry["yid"])
    if whole is None:
        return None

    minus_yid = region_entry.get("minus_yid")
    if minus_yid:
        part = series_of(minus_yid)
        if part is None:
            return None
        # Отрицательного быть не должно, но если Яндекс округлит по-разному —
        # обрезаем по нулю, а не тащим минус в график.
        whole = {m: max(0, v - part.get(m, 0)) for m, v in whole.items()}

    return sorted([[m, v] for m, v in whole.items()], key=lambda x: x[0])


def run_dynamics_backfill(pairs, phrases_by_id, region_map, client):
    """pairs — список (phraseId, regionName). Тянет полную месячную историю
    GetDynamics с 2018 года для каждой пары, с одним регионом на запрос
    (regions суммирует несколько id в один ответ, а нам нужны отдельные
    ряды). Прогресс — в analytics/.wordstat_state.json: обрыв на середине
    не теряет уже собранное, повторный запуск продолжает с этого места."""
    state = load_state()
    done = set(tuple(x) for x in state.get("done", []))
    acc = state.get("region_monthly", {})

    todo = [p for p in pairs if tuple(p) not in done]
    if not todo:
        log("Backfill: все %d пар уже собраны в прошлый раз" % len(pairs))
    else:
        log("Backfill: %d пар всего, осталось %d" % (len(pairs), len(todo)))

    from_date = rfc3339(datetime.date(2018, 1, 1))
    to_date = rfc3339(month_end(datetime.date.today()))

    for i, (phrase_id, region_name) in enumerate(todo, 1):
        phrase = phrases_by_id[phrase_id]
        yid = region_map.get(region_name, {}).get("yid")
        if not yid:
            log("  [%d/%d] %s / %s: нет yid в карте регионов, пропуск" % (
                i, len(todo), phrase_id, region_name))
            continue
        series = fetch_region_series(client, phrase["text"], region_map[region_name],
                                      from_date, to_date)
        if series is None:
            log("  [%d/%d] %s / %s: сбой запроса, попробуем в следующий раз" % (
                i, len(todo), phrase_id, region_name))
            continue
        acc.setdefault(phrase_id, {})[region_name] = series
        done.add((phrase_id, region_name))
        state["done"] = [list(x) for x in done]
        state["region_monthly"] = acc
        save_state(state)
        log("  [%d/%d] %s / %s: %d точек" % (i, len(todo), phrase_id, region_name, len(series)))

    ratio = client.success_ratio
    covered = sum(1 for p in pairs if tuple(p) in done)
    return acc, covered, len(pairs), ratio


def merge_region_monthly(data, acc):
    for phrase_id, by_region in acc.items():
        dst = data.setdefault("region_monthly", {}).setdefault(phrase_id, {})
        for region_name, series in by_region.items():
            dst[region_name] = series


def regions_needing_catchup(data, core_ids, live_regions):
    """Живой регион «докатан», если у него есть история хотя бы по одной
    core-фразе — этого достаточно, чтобы не гонять полный набор повторно;
    остальные core-фразы для него подтянутся тем же проходом (все core-id
    входят в pairs целиком для региона, см. вызов ниже).

    Пустой region_monthly — это НЕ «десять новых регионов», а холодный старт:
    полного первого сбора истории здесь не делаем (это ~100 запросов на
    реальных десяти регионах, час-полтора) — такой объём должен запускаться
    осознанно через --backfill, а не тихо всплывать внутри обычного
    ежемесячного запуска. Иначе, к примеру, workflow_dispatch с режимом по
    умолчанию (monthly) неожиданно растянется на два часа вместо нескольких
    минут."""
    region_monthly = data.get("region_monthly", {})
    if not region_monthly:
        return []
    covered = set()
    for phrase_id in core_ids:
        covered |= set(region_monthly.get(phrase_id, {}).keys())
    return [r for r in live_regions if r not in covered]


# ──────────────────────────────────────────────────────────────────────────
# Ежемесячный снимок
# ──────────────────────────────────────────────────────────────────────────

def run_monthly(client):
    phrases, phrases_by_id, core_ids, top_ids = load_phrases()
    live_regions = get_live_canonical_regions()
    region_map = ensure_region_map(live_regions, client)
    mapped_live = [r for r in live_regions if r in region_map]
    unmapped = [r for r in live_regions if r not in region_map]
    if unmapped:
        log("Живые регионы без yid (пропущены в этом запуске): %s" % ", ".join(unmapped))

    data = load_json_file(OUT_FILE, {})
    if not data.get("region_monthly"):
        log("Истории по регионам ещё нет — запустите разово режим --backfill "
            "(~100 запросов, час-полтора). Этот запуск заполнит остальное "
            "(тренд по России, снимок месяца, топ запросов) и без него.")
    this_month = datetime.date.today().strftime("%Y-%m")

    # Новый живой регион — докатать core-фразы, пока история не сравнялась
    # с остальными (см. ANALYTICS_PLAN.md, 3.2).
    new_regions = regions_needing_catchup(data, core_ids, mapped_live)
    if new_regions:
        log("Новые живые регионы, докатываю историю: %s" % ", ".join(new_regions))
        pairs = [(pid, r) for pid in core_ids for r in new_regions]
        acc, _covered, _total, _ratio = run_dynamics_backfill(pairs, phrases_by_id, region_map, client)
        merge_region_monthly(data, acc)
        # Файл состояния НЕ чистим: он общий с ручным --backfill, и если тот
        # сейчас прерван на середине (см. run_backfill), здесь мы видим лишь
        # подмножество его пар. Полный список пар backfill — надмножество
        # любой докатки, поэтому очищать state имеет право только он сам,
        # когда закрыт целиком (см. run_backfill).

    # Снимок по регионам. Запросов на фразу два, и второй обязателен: в разрезе
    # REGION_REGIONS городов нет вовсе, поэтому без него выпадают Москва и
    # Санкт-Петербург, а вместе с ними Московская и Ленинградская области —
    # они считаются вычитанием города из пары «город и область». Это четыре
    # региона из десяти, причём самые крупные рынки; первый прогон именно так
    # их и потерял, написав в лог «нет данных по вычитаемому id».
    region_snapshots = data.get("region_snapshots", {})
    region_monthly = data.get("region_monthly", {})
    this_month_snap = {}
    needs_cities = any(region_map[n].get("minus_yid") for n in mapped_live) or \
        any(str(region_map[n]["yid"]) in ("213", "2") for n in mapped_live)
    for p in phrases:
        resp = client.call("regions", {"phrase": p["text"], "region": "REGION_REGIONS"})
        if resp is None:
            continue
        # Ответ разбираем по id: он нужен и сам по себе, и как вычитаемое
        # для областей, у которых своего узла в дереве Wordstat нет.
        raw = {}
        for r in resp.get("results", []):
            raw[str(r.get("region"))] = {
                "count": to_int(r.get("count")),
                "affinity": to_float(r.get("affinityIndex")),
            }
        if needs_cities:
            cresp = client.call("regions", {"phrase": p["text"], "region": "REGION_CITIES"})
            for r in (cresp or {}).get("results", []):
                raw.setdefault(str(r.get("region")), {
                    "count": to_int(r.get("count")),
                    "affinity": to_float(r.get("affinityIndex")),
                })

        by_region = {}
        for name in mapped_live:
            entry = region_map[name]
            whole = raw.get(str(entry["yid"]))
            if whole is None:
                continue
            count = whole["count"]
            affinity = whole["affinity"]
            minus_yid = entry.get("minus_yid")
            if minus_yid:
                part = raw.get(str(minus_yid))
                if part is None:
                    # Города в разрезе REGION_REGIONS может не оказаться —
                    # тогда честнее пропустить месяц, чем записать область
                    # вместе с городом и выдать это за область.
                    log("  %s: нет данных по вычитаемому id %s, месяц пропущен"
                        % (name, minus_yid))
                    continue
                count = max(0, count - part["count"])
                affinity = None      # индекс у разности не определён
            by_region[name] = {"count": count, "affinity": affinity}
            series = region_monthly.setdefault(p["id"], {}).setdefault(name, [])
            series[:] = [pt for pt in series if pt[0] != this_month]
            series.append([this_month, count])
            series.sort(key=lambda x: x[0])
        if by_region:
            this_month_snap[p["id"]] = by_region
    if this_month_snap:
        region_snapshots[this_month] = this_month_snap
        for old_month in sorted(region_snapshots)[:-SNAPSHOT_MONTHS_KEEP]:
            del region_snapshots[old_month]

    # Динамика по России помесячно с 2018 — перезаписываем целиком, это
    # дешевле, чем аккуратно дописывать хвост.
    ru_monthly = data.get("ru_monthly", {})
    from_date = rfc3339(datetime.date(2018, 1, 1))
    to_date = rfc3339(month_end(datetime.date.today()))
    for p in phrases:
        resp = client.call("dynamics", {
            "phrase": p["text"], "period": "PERIOD_MONTHLY",
            "fromDate": from_date, "toDate": to_date,
        })
        if resp is None:
            continue
        series = [[month_key(r["date"]), to_int(r.get("count"))] for r in resp.get("results", [])]
        series.sort(key=lambda x: x[0])
        ru_monthly[p["id"]] = series

    # Топ запросов — только «широкие» фразы, храним текущий и прошлый месяц.
    top_requests = data.get("top_requests", {})
    this_month_top = {}
    for pid in top_ids:
        p = phrases_by_id.get(pid)
        if not p:
            continue
        resp = client.call("topRequests", {"phrase": p["text"], "numPhrases": "30"})
        if resp is None:
            continue
        this_month_top[pid] = [[r.get("phrase", ""), to_int(r.get("count"))]
                                for r in resp.get("results", [])]
    if this_month_top:
        top_requests[this_month] = this_month_top
        for old_month in sorted(top_requests)[:-TOP_MONTHS_KEEP]:
            del top_requests[old_month]

    ratio = client.success_ratio
    log("Запросов: %d, успешно: %d (%.0f%%)" % (client.attempted, client.succeeded, ratio * 100))
    if ratio < MIN_SUCCESS_RATIO:
        log("Меньше %.0f%% запросов удалось — файл не переписываю, это сбой" % (MIN_SUCCESS_RATIO * 100))
        return 1

    data["updated"] = datetime.date.today().isoformat()
    data["source"] = "wordstat"
    data["regions"] = {name: {"yid": region_map[name]["yid"]} for name in mapped_live}
    data["phrases"] = {p["id"]: {"text": p["text"], "group": p["group"], "core": p.get("core", False)}
                        for p in phrases}
    data["region_monthly"] = region_monthly
    data["region_snapshots"] = region_snapshots
    data["ru_monthly"] = ru_monthly
    data["top_requests"] = top_requests
    save_json_file(OUT_FILE, data)
    log("Готово: %s обновлён" % OUT_FILE)
    return 0


# ──────────────────────────────────────────────────────────────────────────
# Недельный пульс — только по России, только core-фразы
# ──────────────────────────────────────────────────────────────────────────

def run_pulse(client):
    phrases, phrases_by_id, core_ids, _top_ids = load_phrases()
    first_monday, last_sunday = recent_full_weeks(12)
    from_date, to_date = rfc3339(first_monday), rfc3339(last_sunday)

    ru = {}
    weeks = []
    for pid in core_ids:
        p = phrases_by_id[pid]
        resp = client.call("dynamics", {
            "phrase": p["text"], "period": "PERIOD_WEEKLY",
            "fromDate": from_date, "toDate": to_date,
        })
        if resp is None:
            continue
        series = sorted(resp.get("results", []), key=lambda r: r["date"])
        ru[pid] = [to_int(r.get("count")) for r in series]
        if not weeks:
            weeks = [r["date"][:10] for r in series]

    ratio = client.success_ratio
    log("Запросов: %d, успешно: %d (%.0f%%)" % (client.attempted, client.succeeded, ratio * 100))
    if ratio < MIN_SUCCESS_RATIO:
        log("Меньше %.0f%% запросов удалось — файл не переписываю, это сбой" % (MIN_SUCCESS_RATIO * 100))
        return 1

    save_json_file(PULSE_FILE, {
        "updated": datetime.date.today().isoformat(),
        "weeks": weeks,
        "ru": ru,
    })
    log("Готово: %s обновлён" % PULSE_FILE)
    return 0


# ──────────────────────────────────────────────────────────────────────────
# Разовый backfill — все core-фразы × все живые регионы
# ──────────────────────────────────────────────────────────────────────────

def run_backfill(client):
    phrases, phrases_by_id, core_ids, _top_ids = load_phrases()
    live_regions = get_live_canonical_regions()
    region_map = ensure_region_map(live_regions, client)
    mapped_live = [r for r in live_regions if r in region_map]
    unmapped = [r for r in live_regions if r not in region_map]
    if unmapped:
        log("Живые регионы без yid (пропущены): %s" % ", ".join(unmapped))

    pairs = [(pid, r) for pid in core_ids for r in mapped_live]
    log("Backfill: %d core-фраз x %d регионов = %d запросов" % (
        len(core_ids), len(mapped_live), len(pairs)))

    acc, covered, total, ratio = run_dynamics_backfill(pairs, phrases_by_id, region_map, client)

    data = load_json_file(OUT_FILE, {})
    merge_region_monthly(data, acc)
    data["updated"] = datetime.date.today().isoformat()
    data["source"] = "wordstat"
    data["regions"] = {name: {"yid": region_map[name]["yid"]} for name in mapped_live}
    data["phrases"] = {p["id"]: {"text": p["text"], "group": p["group"], "core": p.get("core", False)}
                        for p in phrases}
    save_json_file(OUT_FILE, data)

    log("Backfill: собрано %d из %d пар, запросов успешно %.0f%%" % (covered, total, ratio * 100))
    if covered == total:
        clear_state()
        log("Backfill завершён полностью, %s очищен" % STATE_FILE)
        return 0
    log("Backfill не завершён — прогресс сохранён в %s, перезапустите этим же режимом" % STATE_FILE)
    return 0 if ratio >= MIN_SUCCESS_RATIO else 1


# ──────────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--pulse", action="store_true", help="недельный пульс по России")
    g.add_argument("--backfill", action="store_true", help="разовый сбор истории по регионам")
    g.add_argument("--dump-regions", action="store_true",
                   help="диагностика: показать дерево регионов Яндекса (бесплатно)")
    g.add_argument("--brands", action="store_true",
                   help="рейтинг марок по категориям из топа запросов (по России)")
    g.add_argument("--brands-regional", action="store_true",
                   help="то же с разбивкой по живым регионам (раз в квартал)")
    args = ap.parse_args()

    api_key = os.environ.get("WORDSTAT_API_KEY")
    folder_id = os.environ.get("WORDSTAT_FOLDER_ID")
    if not api_key or not folder_id:
        log("WORDSTAT_API_KEY / WORDSTAT_FOLDER_ID не заданы — см. GitHub Secrets")
        return 1

    client = WordstatClient(api_key, folder_id, RateLimiter())

    if args.dump_regions:
        return run_dump_regions(client)
    if args.brands:
        return run_brands(client, regional=False)
    if args.brands_regional:
        return run_brands(client, regional=True)
    if args.pulse:
        return run_pulse(client)
    if args.backfill:
        return run_backfill(client)
    return run_monthly(client)


if __name__ == "__main__":
    sys.exit(main())
