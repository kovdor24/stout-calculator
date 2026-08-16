#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Официальные данные по дистрибьюторам: кто они и сколько зарабатывают.

Зачем. Во вкладке «Аналитика» уже сведены две оси — поисковый спрос в регионе
дистрибьютора и число смет его монтажников. Третьей, денежной, не было:
вопрос «доходит ли рост рынка до него» без выручки решается на глаз. Выручку
компании публикует сама ФНС, и по ИНН её можно взять бесплатно.

Источник — ГИР БО, государственный ресурс бухгалтерской отчётности
(bo.nalog.gov.ru). Не парсинг страниц: у ресурса есть JSON-эндпоинты, на
которых работает его же интерфейс, ключа и регистрации они не требуют.

    /advanced-search/organizations/search?query=<ИНН>&page=0  -> id организации
    /nbo/organizations/<id>                                    -> карточка ЕГРЮЛ
    /nbo/organizations/<id>/bfo/                               -> отчёты по годам
    /nbo/bfo/<id>/details                                      -> формы отчёта

ВАЖНО про единицы: суммы в формах отчётности — в ТЫСЯЧАХ рублей, так их и
храним (поле unit в файле). Проверено на уставном капитале: в карточке ЕГРЮЛ
он 100000 рублей, в форме — 100. Умножать на тысячу должен тот, кто выводит.

ВАЖНО про свежесть: годовая отчётность публикуется до конца марта следующего
года, то есть отставание доходит до полутора лет. Это не сбой сборщика, а
свойство источника — оперативную картину по-прежнему дают сметы, отчётность
даёт масштаб.

Список ИНН берём из своей базы (RPC analytics_distributor_inns) — заводит их
владелец в карточке дистрибьютора, дублировать в конфиге нечего.

Запуск:
    python AutoCompanyInfo.py                # все дистрибьюторы из базы
    python AutoCompanyInfo.py --inn 7729646148   # один ИНН, для проверки
    python AutoCompanyInfo.py --years 7       # сколько лет истории держать
"""

import argparse
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BO_BASE = "https://bo.nalog.gov.ru"
SUPABASE_INNS_PATH = "/rest/v1/rpc/analytics_distributor_inns"
OUT_FILE = "analytics/companies.json"
APP_JS_FILE = "app.js"

UA = "Mozilla/5.0 (compatible; HeatCalcCompanyBot/1.0; +https://heatcalc.ru)"
YEARS_KEEP = 5          # больше пяти лет назад бизнес был другим
PAUSE = 0.4             # пауза между запросами: ресурс чужой и бесплатный
TRIES = 3


def log(msg):
    print(msg, flush=True)


def http_get_json(url, headers=None, timeout=30, tries=TRIES):
    """GET с повторами. Сеть до налоговой иногда отвечает 5xx, и из-за одного
    такого ответа терять весь прогон незачем. 404 не повторяем — это ответ
    «такого нет», он не изменится."""
    last = None
    for attempt in range(1, tries + 1):
        req = urllib.request.Request(url, method="GET")
        req.add_header("User-Agent", UA)
        req.add_header("Accept", "application/json")
        for k, v in (headers or {}).items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (400, 404):
                return None
            last = e
        except Exception as e:  # noqa: BLE001
            last = e
        if attempt < tries:
            time.sleep(2 * attempt)
    raise RuntimeError("%s: %s" % (url, last))


def save_json_file(path, data):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")


def load_json_file(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


# ──────────────────────────────────────────────────────────────────────────
# Список ИНН из своей базы
# ──────────────────────────────────────────────────────────────────────────

def load_supabase_credentials():
    """supabaseUrl/supabaseKey из app.js. Ключ публичный (anon), он и так
    уходит в браузер — дублировать его в секретах смысла нет. Тот же приём,
    что в AutoWordstat.py."""
    with open(APP_JS_FILE, "r", encoding="utf-8") as f:
        src = f.read()
    m_url = re.search(r"const\s+supabaseUrl\s*=\s*'([^']+)'", src)
    m_key = re.search(r"const\s+supabaseKey\s*=\s*'([^']+)'", src)
    if not m_url or not m_key:
        raise RuntimeError("supabaseUrl/supabaseKey не найдены в %s" % APP_JS_FILE)
    return m_url.group(1), m_key.group(1)


def fetch_distributor_inns():
    """ИНН дистрибьюторов -> [(инн, название)]. Читаем через RPC, а не прямым
    запросом к таблице: в distributors лежат промокоды и почты менеджеров,
    открывать её анонимному ключу целиком нельзя."""
    supabase_url, supabase_key = load_supabase_credentials()
    url = supabase_url.rstrip("/") + SUPABASE_INNS_PATH
    req = urllib.request.Request(url, data=b"{}", method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", UA)
    req.add_header("apikey", supabase_key)
    req.add_header("Authorization", "Bearer %s" % supabase_key)
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.loads(r.read().decode("utf-8"))
    out = []
    seen = set()
    for row in rows or []:
        inn = re.sub(r"\D", "", str(row.get("inn") or ""))
        # Один ИНН на несколько промокодов — это норма: у крупного
        # дистрибьютора свой промокод у каждого менеджера. Компания при этом
        # одна, и запрашивать её отчётность по разу на менеджера незачем.
        if inn and inn not in seen:
            seen.add(inn)
            out.append((inn, row.get("company_name") or ""))
    return out


# ──────────────────────────────────────────────────────────────────────────
# ГИР БО
# ──────────────────────────────────────────────────────────────────────────

def gir_find_org(inn):
    """ИНН -> id организации в ГИР БО. Поиск подсвечивает совпадение тегами
    <strong>, поэтому сравнивать ответ с исходным ИНН надо после очистки —
    иначе не совпадёт никогда."""
    url = "%s/advanced-search/organizations/search?query=%s&page=0" % (
        BO_BASE, urllib.parse.quote(inn))
    data = http_get_json(url)
    for item in ((data or {}).get("content") or []):
        got = re.sub(r"\D", "", str(item.get("inn") or ""))
        if got == inn:
            return item.get("id")
    return None


def gir_org_card(org_id):
    return http_get_json("%s/nbo/organizations/%s" % (BO_BASE, org_id))


def gir_reports(org_id):
    return http_get_json("%s/nbo/organizations/%s/bfo/" % (BO_BASE, org_id)) or []


def gir_report_details(bfo_id):
    data = http_get_json("%s/nbo/bfo/%s/details" % (BO_BASE, bfo_id))
    if isinstance(data, list) and data:
        return data[0]
    return None


def num(v):
    """Пустое значение строки отчёта -> None, а не ноль. Ноль и «не заполнено»
    в отчётности значат разное: ноль прибыли — это результат, отсутствие
    строки — это отсутствие данных, и на графике их путать нельзя."""
    if v is None:
        return None
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None


def collect_company(inn, fallback_name, years_keep):
    """Всё, что знаем о компании по ИНН: карточка ЕГРЮЛ + отчётность по годам."""
    org_id = gir_find_org(inn)
    time.sleep(PAUSE)
    if not org_id:
        # У ИП бухотчётности нет по закону, и пустой ответ для 12-значного
        # ИНН — не сбой. Для 10-значного это уже странно, и это видно в логе.
        note = ("ИП не сдаёт бухгалтерскую отчётность"
                if len(inn) == 12 else "в ГИР БО не нашлось")
        return {"inn": inn, "name": fallback_name, "note": note, "years": {}}

    card = gir_org_card(org_id) or {}
    time.sleep(PAUSE)
    okved = card.get("okved2") or {}
    rec = {
        "inn": inn,
        "bo_id": org_id,
        "name": card.get("shortName") or fallback_name,
        "full_name": card.get("fullName") or "",
        "ogrn": card.get("ogrn") or "",
        "region": card.get("region") or "",
        "okved": okved.get("id") if isinstance(okved, dict) else (okved or ""),
        "okved_name": okved.get("name") if isinstance(okved, dict) else "",
        "status": card.get("statusCode") or "",
        "status_date": card.get("statusDate") or "",
        "registered": card.get("registrationDate") or "",
        "capital": card.get("authorizedCapital"),
        "active": bool(card.get("active")),
        "years": {},
    }

    reports = gir_reports(org_id)
    time.sleep(PAUSE)
    # Годы берём с конца: если отчётов много, нужны последние, а не первые.
    reports = sorted(reports, key=lambda b: str(b.get("period") or ""), reverse=True)
    for rep in reports[:years_keep]:
        period = str(rep.get("period") or "")
        if not period:
            continue
        year = {
            "revenue": num(rep.get("gainSum")),      # выручка, строка 2110
            "assets": num(rep.get("actives")),       # итог баланса, строка 1600
            "profit": None,                          # чистая прибыль, строка 2400
        }
        det = gir_report_details(rep.get("id")) if rep.get("id") else None
        time.sleep(PAUSE)
        if det:
            fin = det.get("financialResult") or {}
            bal = det.get("balance") or {}
            # Из карточки берём только то, чего в списке отчётов нет: выручку
            # и активы там уже дали, а прибыль лежит только в формах.
            year["profit"] = num(fin.get("current2400"))
            year["sales_profit"] = num(fin.get("current2200"))
            if year["revenue"] is None:
                year["revenue"] = num(fin.get("current2110"))
            if year["assets"] is None:
                year["assets"] = num(bal.get("current1600"))
        rec["years"][period] = year
    return rec


def run(inns, years_keep):
    data = load_json_file(OUT_FILE, {})
    companies = data.get("companies") or {}
    errors = {}
    ok = 0

    for inn, name in inns:
        try:
            rec = collect_company(inn, name, years_keep)
        except Exception as e:  # noqa: BLE001
            # Сбой по одной компании не должен обнулять остальные: оставляем
            # прошлый снимок и пишем причину в файл, чтобы во вкладке было
            # видно, что цифра старая, а не выдумана.
            errors[inn] = str(e)
            log("  %s — ошибка: %s" % (inn, e))
            continue
        companies[inn] = rec
        ok += 1
        years = sorted(rec["years"], reverse=True)
        last = rec["years"].get(years[0]) if years else None
        log("  %-13s %-38s %s" % (
            inn, (rec.get("name") or "")[:38],
            ("выручка %s: %s тыс. руб" % (years[0], format(last["revenue"], ",d").replace(",", " ")))
            if last and last.get("revenue") is not None
            else (rec.get("note") or "отчётности нет")))

    data["companies"] = companies
    data["errors"] = errors
    data["updated"] = datetime.date.today().isoformat()
    data["unit"] = "тыс. руб"
    data["source"] = "ГИР БО, bo.nalog.gov.ru"
    save_json_file(OUT_FILE, data)
    log("Готово: %s. Компаний обновлено %d, ошибок %d." % (OUT_FILE, ok, len(errors)))
    return 0 if ok or not inns else 1


def main():
    ap = argparse.ArgumentParser(description="Данные по ИНН из ГИР БО")
    ap.add_argument("--inn", help="один ИНН вместо списка из базы (проверка)")
    ap.add_argument("--years", type=int, default=YEARS_KEEP, help="сколько лет истории")
    args = ap.parse_args()

    if args.inn:
        inns = [(re.sub(r"\D", "", args.inn), "")]
    else:
        try:
            inns = fetch_distributor_inns()
        except Exception as e:  # noqa: BLE001
            log("Список ИНН не прочитался: %s" % e)
            log("Проверьте, что в базе создана функция analytics_distributor_inns.")
            return 1
        if not inns:
            log("В карточках дистрибьюторов не заполнен ни один ИНН — собирать нечего.")
            return 0
    log("Компаний к опросу: %d" % len(inns))
    return run(inns, args.years)


if __name__ == "__main__":
    sys.exit(main())
