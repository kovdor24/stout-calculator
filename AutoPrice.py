import re
import sys
import time
import os
import subprocess
import urllib3
import traceback
from bs4 import BeautifulSoup

# --- НАСТРОЙКИ ---
# Путь к файлу базы данных (Относительный для GitHub Actions)
FULL_PATH = "catalog.js"
SEARCH_URL = 'https://www.teremonline.ru'

# stdout не в терминал (как в GitHub Actions) по умолчанию блочно буферизуется — строки
# print() могут не появляться в логе, пока буфер не наполнится или процесс не завершится.
# Из-за этого зависание и "просто медленно" в логах выглядят одинаково — пусто. Форсируем
# построчный вывод, чтобы лог показывал прогресс в реальном времени.
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException

def clean_price(text):
    if not text: return None
    text = text.replace('\xa0', '').replace(' ', '').replace('\n', '')
    m = re.search(r'(\d+)(?:[.,]\d+)?', text)
    if m: return int(m.group(1))
    return None

def kill_zombies():
    try:
        os.system("taskkill /f /im chromedriver.exe >nul 2>&1")
        os.system("taskkill /f /im chrome.exe >nul 2>&1")
    except: pass

def close_popups(driver):
    try:
        popups = driver.find_elements(By.XPATH, "//button[contains(text(), 'Да') or contains(text(), 'Верно') or contains(@class, 'close')]")
        for btn in popups:
            if btn.is_displayed():
                driver.execute_script("arguments[0].click();", btn)
                time.sleep(0.2)
    except: pass

def get_enclosing_object(text, match_start):
    depth = 0
    start_idx = -1
    for i in range(match_start, -1, -1):
        if text[i] == '}': depth -= 1
        elif text[i] == '{':
            depth += 1
            if depth > 0:
                start_idx = i
                break
    depth = 0
    end_idx = -1
    for i in range(match_start, len(text)):
        if text[i] == '{': depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth < 0:
                end_idx = i + 1
                break
    return start_idx, end_idx

def get_price_card_isolation(driver, sku, old_price):
    if "404" in driver.title or "Страница не найдена" in driver.page_source: 
        return "NOT_FOUND"
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    parts = re.findall(r'\d+', sku)
    if not parts: return "NOT_FOUND"
    unique_id = parts[-1] 
    candidates = soup.find_all(string=re.compile(unique_id))
    found_items = []
    
    fallback_status = None
    if soup.body:
        fallback_match = re.search(r'(В наличии|Под заказ)', soup.body.get_text(" ", strip=True), re.IGNORECASE)
        if fallback_match:
            status_str = fallback_match.group(1).lower()
            if 'в наличии' in status_str: fallback_status = 'in_stock'
            elif 'под заказ' in status_str: fallback_status = 'on_order'

    for text_node in candidates:
        card = text_node.find_parent()
        price_in_card = None
        status_in_card = None
        for _ in range(10):
            if not card: break
            
            if not status_in_card:
                card_text = card.get_text(" ", strip=True)
                status_match = re.search(r'(В наличии|Под заказ)', card_text, re.IGNORECASE)
                if status_match:
                    status_str = status_match.group(1).lower()
                    if 'в наличии' in status_str: status_in_card = 'in_stock'
                    elif 'под заказ' in status_str: status_in_card = 'on_order'
            
            if not price_in_card:
                price_el = card.find(class_=re.compile(r'price__value|product-price|club-price|catalog-item__price', re.I))
                if price_el and 'old' not in str(price_el.get('class', [])) and 'old' not in str(price_el.parent.get('class', [])):
                    p = clean_price(price_el.get_text())
                    if p and p > 100:
                        price_in_card = p
                if not price_in_card:
                    m = re.search(r'(\d{1,3}(?:\s\d{3})*|\d+)\s?(?:₽|руб)', card.get_text(" ", strip=True), re.IGNORECASE)
                    if m:
                        p = clean_price(m.group(1))
                        if p and p > 100:
                            price_in_card = p
            
            if price_in_card and status_in_card:
                break
            card = card.find_parent()
            
        if price_in_card:
            final_status = status_in_card or fallback_status
            found_items.append({'price': price_in_card, 'status': final_status})
        
    if not found_items: return "NOT_FOUND"
    try: old_price_int = int(float(old_price))
    except: old_price_int = 0
    
    # ЛИМИТ 200%
    lower_limit = old_price_int * 0.33
    upper_limit = old_price_int * 3.0
    valid_items = [i for i in found_items if lower_limit <= i['price'] <= upper_limit]
    if valid_items: return valid_items[0]
    else: return f"ERR_DIFF_{found_items[0]['price']}"

# --- ПРОМЕЖУТОЧНЫЕ ЧЕКПОИНТЫ ---
# Основной коммит происходит отдельным шагом workflow ПОСЛЕ завершения всего скрипта — а
# при 2500+ товарах и ~7 сек/товар прогон занимает часы и может не уложиться в дефолтный
# 6-часовой лимит джобы GitHub Actions. Если джобу оборвёт по таймауту, ни один из уже
# найденных шагом раньше workflow не выполнится и все собранные обновления пропадут.
# Поэтому раз в CHECKPOINT_INTERVAL_SEC коммитим и пушим накопленное прямо из Python —
# независимо от исхода основного шага workflow.
CHECKPOINT_INTERVAL_SEC = 600  # 10 минут

def write_snapshot(content, replacements):
    """Применяет накопленные replacements к КОПИИ исходного content и пишет в файл — сам
    content не трогаем, чтобы start_idx/end_idx ещё не обработанных товаров (посчитанные
    относительно исходного текста) не разъехались."""
    if not replacements:
        return False
    snapshot = content
    for s, e, val in sorted(replacements, key=lambda x: x[0], reverse=True):
        snapshot = snapshot[:s] + val + snapshot[e:]
    with open(FULL_PATH, 'w', encoding='utf-8') as f:
        f.write(snapshot)
    return True

def git_checkpoint(commit_msg):
    """Коммитит и пушит catalog.js как есть на диске. Не должно ронять основной прогон —
    это подстраховка на случай обрыва по таймауту, а не критичная часть парсинга."""
    try:
        subprocess.run(["git", "config", "--local", "user.email", "action@github.com"], check=False)
        subprocess.run(["git", "config", "--local", "user.name", "GitHub Action Bot"], check=False)
        subprocess.run(["git", "add", FULL_PATH], check=False)
        diff = subprocess.run(["git", "diff", "--staged", "--quiet"])
        if diff.returncode == 0:
            print("[Чекпоинт] Изменений с прошлого чекпоинта нет, коммит пропущен.")
            return
        subprocess.run(["git", "commit", "-m", commit_msg], check=False)

        push = subprocess.run(["git", "push"], check=False)
        if push.returncode != 0:
            # origin/main мог уйти вперёд (например, кто-то запушил правку кода, пока этот
            # прогон работает) — подтягиваем свежую историю поверх своего коммита и пробуем
            # ещё раз, прежде чем сдаваться.
            print("[Чекпоинт] git push отклонён — подтягиваю origin/main (rebase) и пробую снова...")
            subprocess.run(["git", "pull", "--rebase"], check=False)
            push = subprocess.run(["git", "push"], check=False)

        if push.returncode == 0:
            print(f"[Чекпоинт] Промежуточный коммит запушен: {commit_msg}")
        else:
            print(f"[Чекпоинт] git push вернул код {push.returncode} — не критично, продолжаем парсинг, попробуем на следующем чекпоинте.")
    except Exception as e:
        print(f"[Чекпоинт] Ошибка при промежуточном коммите: {e} — не критично, продолжаем.")

def process_sku_v42(driver, sku, old_price):
    # Восстановлено дословно до версии, стабильно отработавшей месяцы (апрель-июнь, полные
    # прогоны по 1-2 часа) — до коммита 359f0be (20.06), который разом добавил прямую ссылку
    # /search/?q=..., "стелс"-настройки браузера и жёсткий обрыв по первому же признаку
    # блокировки. Все три правки, сделанные сегодня, по очереди откатывали кусочки этого
    # коммита; здесь — финальный откат: без явного детекта DDoS-Guard/CAPTCHA, просто до 8
    # попыток прочитать цену с паузой в 1с — как и было в проверенной версии.
    try:
        try:
            driver.get(SEARCH_URL)
        except TimeoutException:
            driver.execute_script("window.stop();")
        close_popups(driver)
        raw_sku = sku.strip()
        for attempt in range(3):
            try:
                wait = WebDriverWait(driver, 5)
                try: inp = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='search'], input[name='q'], input[placeholder*='поиск']")))
                except:
                    inp = next((i for i in driver.find_elements(By.TAG_NAME, "input") if i.is_displayed() and i.size['width'] > 50), None)
                if not inp: return "ERR: Поле поиска"

                inp.send_keys(Keys.CONTROL + "a")
                inp.send_keys(Keys.BACKSPACE)

                inp.send_keys(raw_sku)
                time.sleep(1)
                try:
                    driver.find_element(By.CSS_SELECTOR, "button[type='submit'], .search-btn").click()
                except:
                    inp.send_keys(Keys.RETURN)
                break
            except StaleElementReferenceException:
                time.sleep(0.5)
                continue
            except Exception as e:
                if attempt == 2: return f"ERR: {str(e)[:20]}"
                time.sleep(0.5)
                continue

        res = "NOT_FOUND"
        for _ in range(8):
            time.sleep(1)
            res = get_price_card_isolation(driver, sku, old_price)
            if isinstance(res, dict): return res
            if isinstance(res, str) and (res.startswith("ERR_DIFF") or res == "NOT_FOUND"): continue
        return res
    except Exception as e: return f"ERR: {str(e)[:20]}"

def update_catalog_prices():
    print(f"--- ЗАПУСК ПАРСЕРА (ЖЕСТКИЙ ПУТЬ + ЛИМИТ 200%) ---")
    print(f"Путь: {FULL_PATH}\n")
    
    print("Шаг 1: Проверка файла БД...")
    if not os.path.exists(FULL_PATH):
        print(f"ОШИБКА: Файл catalog.js не найден!")
        return

    print("Шаг 2: Очистка старых процессов...")
    kill_zombies()

    print("Шаг 3: Инициализация Selenium (стабильный режим)...")
    try:
        options = Options()
        options.add_argument("--log-level=3")
        options.page_load_strategy = 'eager'
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_experimental_option("excludeSwitches", ["enable-logging"])
        options.add_argument("--no-proxy-server")

        # УБРАНО: кастомный User-Agent (Chrome/122 — почти наверняка устарел относительно
        # реальной версии Chrome, которую тянет chromedriver на раннере) и
        # --disable-blink-features=AutomationControlled + CDP-патч navigator.webdriver.
        # AutoImage.py парсит тот же сайт с тех же раннеров БЕЗ этих "стелс"-хаков и
        # стабильно проходит (сотни картинок за прогон), а AutoPrice.py с ними — блокировался
        # 100% запросов. Похоже, несовпадение UA с реальным движком браузера и точечный
        # патч одного-единственного свойства (при том что остальные автоматизационные
        # признаки никуда не делись) — более явный сигнал для антибота, чем дефолтный
        # Selenium-профиль без всякой маскировки. Оставляем настройки идентичными рабочему
        # AutoImage.py.
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        driver.set_window_size(1920, 1080)
        print("Браузер успешно запущен!\n")
    except Exception as e:
        print(f"Ошибка браузера: {e}")
        return

    with open(FULL_PATH, 'r', encoding='utf-8') as f: content = f.read()
    items_to_process = []
    processed_starts = set()
    for match in re.finditer(r'(["\']?price["\']?\s*:\s*)(\d+(?:\.\d+)?)', content, re.IGNORECASE):
        start_idx, end_idx = get_enclosing_object(content, match.start())
        if start_idx == -1 or end_idx == -1 or start_idx in processed_starts: continue
        processed_starts.add(start_idx)
        obj_text = content[start_idx:end_idx]
        sku = None
        art_m = re.search(r'["\']?article["\']?\s*:\s*["\']([^"\']+)["\']', obj_text, re.IGNORECASE)
        if art_m: sku = art_m.group(1)
        else:
            id_m = re.search(r'["\']?id["\']?\s*:\s*["\']([^"\']+)["\']', obj_text, re.IGNORECASE)
            if id_m: sku = id_m.group(1)
        if not sku: continue
        old_price_str = match.group(2)
        old_price = float(old_price_str) if '.' in old_price_str else int(old_price_str)
        date_m = re.search(r'["\']?price_date["\']?\s*:\s*["\']([^"\']+)["\']', obj_text, re.IGNORECASE)
        price_date = date_m.group(1) if date_m else None
        items_to_process.append({'sku': sku, 'old_price': old_price, 'match': match, 'start_idx': start_idx, 'end_idx': end_idx, 'obj_text': obj_text, 'price_date': price_date})

    valid_items = []
    for item in items_to_process:
        is_nested = False
        for other in items_to_process:
            if item['start_idx'] > other['start_idx'] and item['end_idx'] < other['end_idx']:
                is_nested = True
                break
        if not is_nested:
            valid_items.append(item)
    items_to_process = valid_items

    # Сортируем от самых старых price_date к самым свежим (без даты — считаем самыми
    # старыми, в начало очереди). Прогон часто не успевает пройти весь каталог за один раз
    # (см. риск таймаута джобы) — теперь при неполном прогоне в первую очередь освежаются
    # именно просроченные позиции, а не всегда одни и те же товары в начале catalog.js.
    items_to_process.sort(key=lambda x: x['price_date'] or '0000-00-00')

    print(f"Найдено корневых товаров: {len(items_to_process)}\n")
    replacements = []
    price_cache = {}
    updated_count = 0
    not_found_streak = 0
    last_checkpoint_ts = time.time()
    for i, item in enumerate(items_to_process):
        sku, old_price, match = item['sku'], item['old_price'], item['match']
        start_idx, end_idx, obj_text = item['start_idx'], item['end_idx'], item['obj_text']
        print(f"[{i+1}/{len(items_to_process)}] {sku}", end=" ")

        if not_found_streak >= 4:
            print("[Анти-залипание] Принудительная перезагрузка...", end=" ")
            try: driver.get(SEARCH_URL)
            except: pass
            not_found_streak = 0

        if sku in price_cache:
            res = price_cache[sku]; print("(Кеш)", end=" ")
        else:
            res = process_sku_v42(driver, sku, old_price)
            price_cache[sku] = res

        if isinstance(res, str) and res == "NOT_FOUND":
            not_found_streak += 1
        elif not (isinstance(res, str) and res.startswith("ERR")):
            not_found_streak = 0
            
        if isinstance(res, dict):
            new_price = res['price']
            new_status = res['status']
            
            if new_price != old_price: print(f"-> {new_price} ₽", end="")
            else: print("-> OK", end="")
            
            if new_status == 'in_stock': print(" (В наличии)")
            elif new_status == 'on_order': print(" (Под заказ)")
            else: print("")
            
            new_obj_text = obj_text
            if new_price != old_price:
                price_local_start = match.start(2) - start_idx
                price_local_end = match.end(2) - start_idx
                new_obj_text = new_obj_text[:price_local_start] + str(new_price) + new_obj_text[price_local_end:]
                
            import datetime
            current_date_str = datetime.datetime.now().strftime('%Y-%m-%d')
            
            # 1. Update/insert price_date
            date_m = re.search(r'(["\']?price_date["\']?\s*:\s*["\'])([^"\']+)(["\'])', new_obj_text, re.IGNORECASE)
            if date_m:
                new_obj_text = new_obj_text[:date_m.start(2)] + current_date_str + new_obj_text[date_m.end(2):]
            else:
                last_brace = new_obj_text.rfind('}')
                if last_brace != -1:
                    last_content_idx = last_brace - 1
                    while last_content_idx >= 0 and new_obj_text[last_content_idx].isspace():
                        last_content_idx -= 1
                    comma = ',' if new_obj_text[last_content_idx] != ',' else ''
                    insert_str = f"{comma}\n  price_date: '{current_date_str}'"
                    new_obj_text = new_obj_text[:last_content_idx+1] + insert_str + new_obj_text[last_content_idx+1:]
            
            # 2. Update/insert availability
            if new_status:
                avail_m = re.search(r'(["\']?availability["\']?\s*:\s*["\'])([^"\']+)(["\'])', new_obj_text, re.IGNORECASE)
                if avail_m:
                    new_obj_text = new_obj_text[:avail_m.start(2)] + new_status + new_obj_text[avail_m.end(2):]
                else:
                    last_brace = new_obj_text.rfind('}')
                    if last_brace != -1:
                        last_content_idx = last_brace - 1
                        while last_content_idx >= 0 and new_obj_text[last_content_idx].isspace():
                            last_content_idx -= 1
                        comma = ',' if new_obj_text[last_content_idx] != ',' else ''
                        insert_str = f"{comma}\n  availability: '{new_status}'"
                        new_obj_text = new_obj_text[:last_content_idx+1] + insert_str + new_obj_text[last_content_idx+1:]
            
            if new_obj_text != obj_text:
                replacements.append((start_idx, end_idx, new_obj_text))
                updated_count += 1
                
        elif isinstance(res, str) and res.startswith("ERR_DIFF"): 
            print(f"-> Блок 200% ({res.split('_')[-1]} ₽)")
        else: print(f"-> {res}")

        if time.time() - last_checkpoint_ts >= CHECKPOINT_INTERVAL_SEC:
            print(f"\n[Чекпоинт] Промежуточное сохранение: обработано {i+1}/{len(items_to_process)}, обновлено цен: {updated_count}...")
            if write_snapshot(content, replacements):
                git_checkpoint(f"Автообновление цен (промежуточно, {i+1}/{len(items_to_process)} обработано)")
            last_checkpoint_ts = time.time()
    driver.quit()
    if replacements:
        replacements.sort(key=lambda x: x[0], reverse=True)
        for s, e, val in replacements: content = content[:s] + val + content[e:]
        with open(FULL_PATH, 'w', encoding='utf-8') as f: f.write(content)
        print(f"\nУспешно обновлено цен: {updated_count}")
    else: print("\nИзменений не требуется.")
    return True

if __name__ == "__main__":
    try:
        ok = update_catalog_prices()
        if not ok:
            sys.exit(1)
    except Exception as e:
        print(f"\n[!] КРИТИЧЕСКАЯ ОШИБКА: {e}")
        traceback.print_exc()
        sys.exit(1)