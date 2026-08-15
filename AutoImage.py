import re
import time
import random
import os
import json
import urllib3
import urllib.request
import urllib.error
import traceback
from bs4 import BeautifulSoup
from PIL import Image, ImageChops

# --- CONFIG ---
CATALOG_PATH = "catalog.js"
PRICE_EXTRA_PATH = "price_extra.json"
PRICE_INDEX_PATH = "price_index.json"
SEARCH_URL = 'https://www.teremonline.ru'
IMAGE_DIR = "img"
MISSING_LIST_PATH = "articles_without_images.txt"
INVALID_SKU_LIST_PATH = "articles_invalid_sku.txt"

INVALID_FILENAME_CHARS = set('*?"<>|:\\/')
NOT_FOUND_LIST_PATH = "articles_not_found.txt"

def has_invalid_filename_chars(item_id):
    return any(c in INVALID_FILENAME_CHARS for c in item_id)

# --- ВЕЖЛИВОСТЬ К САЙТУ (чтобы не словить бан/капчу при больших объёмах) ---
DELAY_MIN = 1.5              # мин. пауза между запросами, сек
DELAY_MAX = 3.5              # макс. пауза между запросами, сек
BATCH_SIZE = 40               # каждые N товаров — длинная пауза
BATCH_PAUSE_MIN = 20          # мин. длинная пауза, сек
BATCH_PAUSE_MAX = 45          # макс. длинная пауза, сек
RESTART_BROWSER_EVERY = 250   # пересоздавать браузер каждые N товаров (новая "сессия")
MAX_CONSECUTIVE_ERRORS = 6    # подряд ошибок/ERR_* — стоп-кран, похоже на блокировку

# Экшен на GitHub запускается вручную (workflow_dispatch) на общем раннере ubuntu-latest,
# и жёстко ограничен ~6 часами на джобу — если скрипт не уложится, шаг коммита не выполнится
# и все скачанные за этот прогон картинки будут потеряны. Поэтому обрабатываем ограниченными
# порциями за один запуск; остальное подтянется следующим ручным запуском workflow.
#
# Пробный прогон дал 7,2 секунды на артикул со всеми паузами, то есть 1500 позиций
# укладываются в три часа — вдвое меньше потолка джобы. Больше не берём: коммит идёт
# отдельным шагом в самом конце, и упёршийся в потолок прогон потеряет всё скачанное.
MAX_ITEMS_PER_RUN = 1500

# --- ПРОБНЫЙ ПРОГОН (python AutoImage.py --pilot [N]) ---
# Полный прайс — это ещё ~8 400 артикулов, то есть больше десятка запусков workflow
# по полтора часа. Гнать их вслепую незачем: картинки ищутся поиском по teremonline.ru,
# и найдётся только то, что магазин продаёт. Целые листы прайса (TIEMME, RAUTITAN, WATTS,
# Ostendorf, ITAP, Sanha, Thermaflex, Walraven) ни разу не пробовались вовсе — они лежат
# только в price_index.json, который скрипт до сих пор не читал.
#
# Пилот берёт по нескольку артикулов из каждого листа и печатает попадание в разрезе
# листов: за пять минут видно, по каким брендам полный прогон имеет смысл, а по каким
# это будут часы впустую. В пилоте НЕ пишем в articles_not_found.txt — маленькая выборка
# не повод навсегда занести артикул в список пропускаемых.
PILOT_PER_SHEET = 3
PILOT_TOTAL = 50

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException

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

def clean_nested_objects(text):
    depth = 0
    result = []
    for char in text:
        if char == '{':
            depth += 1
            if depth == 1:
                result.append(char)
        elif char == '}':
            if depth == 1:
                result.append(char)
            depth -= 1
        else:
            if depth == 1:
                result.append(char)
    return "".join(result)

def get_unique_skus():
    if not os.path.exists(CATALOG_PATH):
        print(f"Error: {CATALOG_PATH} not found!")
        return []
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    items = {} # id -> article
    sheets = {} # id -> лист прайса, из которого пришёл артикул (для отчёта пилота)
    invalid_ids = set()
    processed_starts = set()
    for match in re.finditer(r'(["\']?price["\']?\s*:\s*)(\d+(?:\.\d+)?)', content, re.IGNORECASE):
        start_idx, end_idx = get_enclosing_object(content, match.start())
        if start_idx == -1 or end_idx == -1 or start_idx in processed_starts: continue
        processed_starts.add(start_idx)
        obj_text = content[start_idx:end_idx]
        obj_text = clean_nested_objects(obj_text)

        id_val = None
        id_m = re.search(r'["\']?id["\']?\s*:\s*["\']([^"\']+)["\']', obj_text, re.IGNORECASE)
        if id_m: id_val = id_m.group(1).strip()

        art_val = None
        art_m = re.search(r'["\']?article["\']?\s*:\s*["\']([^"\']+)["\']', obj_text, re.IGNORECASE)
        if art_m: art_val = art_m.group(1).strip()

        if id_val:
            if has_invalid_filename_chars(id_val):
                invalid_ids.add(id_val)
                continue
            items[id_val] = art_val or id_val

    # Дополнительно берём позиции из price_extra.json — расширенный прайс-лист
    # STOUT/ROMMER, который теперь тоже участвует в поиске "Добавить оборудование",
    # но раньше не попадал в скачивание картинок
    if os.path.exists(PRICE_EXTRA_PATH):
        try:
            with open(PRICE_EXTRA_PATH, 'r', encoding='utf-8') as f:
                extra_items = json.load(f)
            added = 0
            for it in extra_items:
                id_val = (it.get('id') or '').strip()
                if not id_val:
                    continue
                if has_invalid_filename_chars(id_val):
                    invalid_ids.add(id_val)
                    continue
                if id_val not in items:
                    items[id_val] = id_val
                    added += 1
                sheets.setdefault(id_val, it.get('category') or PRICE_EXTRA_PATH)
            print(f"Из {PRICE_EXTRA_PATH} добавлено артикулов: {added}")
        except Exception as e:
            print(f"Не удалось прочитать {PRICE_EXTRA_PATH}: {e}")

    # И весь прайс целиком (price_index.json) — тот же индекс, по которому
    # распознавание счетов подбирает позиции. Раньше он сюда не попадал, поэтому
    # у всего, что нашлось в прайсе, а не в каталоге, в смете не было фото.
    # Имя файла — сам артикул ("a"): именно под ним фото ищет смета.
    if os.path.exists(PRICE_INDEX_PATH):
        try:
            with open(PRICE_INDEX_PATH, 'r', encoding='utf-8') as f:
                index_items = (json.load(f) or {}).get('items') or []
            added = 0
            for it in index_items:
                id_val = str(it.get('a') or '').strip()
                if not id_val:
                    continue
                if has_invalid_filename_chars(id_val):
                    invalid_ids.add(id_val)
                    continue
                if id_val not in items:
                    items[id_val] = id_val
                    added += 1
                sheets.setdefault(id_val, it.get('s') or PRICE_INDEX_PATH)
            print(f"Из {PRICE_INDEX_PATH} добавлено артикулов: {added}")
        except Exception as e:
            print(f"Не удалось прочитать {PRICE_INDEX_PATH}: {e}")

    if invalid_ids:
        print(f"Пропущено артикулов с недопустимыми для имени файла символами ({''.join(sorted(INVALID_FILENAME_CHARS))}): {len(invalid_ids)}")
        with open(INVALID_SKU_LIST_PATH, 'w', encoding='utf-8') as f:
            f.write("\n".join(sorted(invalid_ids)))

    return [{"id": k, "article": v, "sheet": sheets.get(k, CATALOG_PATH)} for k, v in sorted(items.items())]

def get_missing_skus(items):
    existing_files = set()
    if os.path.exists(IMAGE_DIR):
        for f in os.listdir(IMAGE_DIR):
            if os.path.isfile(os.path.join(IMAGE_DIR, f)):
                existing_files.add(f.lower())
                
    # Load previously verified not-found SKUs to avoid re-checking them
    not_found_skus = set()
    if os.path.exists(NOT_FOUND_LIST_PATH):
        try:
            with open(NOT_FOUND_LIST_PATH, 'r', encoding='utf-8') as f:
                for line in f:
                    val = line.strip()
                    if val:
                        not_found_skus.add(val.lower())
        except Exception as e:
            print(f"Ошибка чтения {NOT_FOUND_LIST_PATH}: {e}")

    missing = []
    for item in items:
        item_id = item["id"]
        if item_id.lower() in not_found_skus:
            continue
            
        # Check case-insensitive for item_id.jpg, png, etc.
        extensions = ['.jpg', '.png', '.jpeg', '.webp']
        found = False
        for ext in extensions:
            if f"{item_id.lower()}{ext}" in existing_files:
                found = True
                break
        if not found:
            missing.append(item)
    return missing

def optimize_and_save_image(temp_file_path, sku):
    """
    Optimizes the downloaded image:
    1. Converts transparent backgrounds to white.
    2. Auto-crops empty white space around the detail.
    3. Resizes the image to fit max 200x200 pixels.
    4. Saves it as a compressed JPEG.
    """
    out_file = os.path.join(IMAGE_DIR, f"{sku}.jpg")
    try:
        with Image.open(temp_file_path) as img:
            # 1. Convert to RGB (handle transparency)
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                bg = Image.new('RGB', img.size, (255, 255, 255))
                bg.paste(img, mask=img.convert('RGBA').split()[3])
                img = bg
            else:
                img = img.convert('RGB')
            
            # 2. Smart Crop (Auto-crop white space)
            bg_white = Image.new('RGB', img.size, (255, 255, 255))
            diff = ImageChops.difference(img, bg_white)
            bbox = diff.getbbox()
            
            if bbox:
                img = img.crop(bbox)
            
            # 3. Downscale preserving aspect ratio (max dimension 200px)
            max_size = (200, 200)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # 4. Save as optimized JPEG
            img.save(out_file, 'JPEG', quality=75, optimize=True)
            
        print(f"-> Saved, Cropped & Optimized (200x200 max): {out_file}")
        return True
    except Exception as e:
        print(f"-> Error optimizing image: {e}")
        return False

def save_image(url, sku):
    """
    Возвращает "OK", "NOT_FOUND" или "FAILED".

    NOT_FOUND — сайт ответил на картинку 404/410: файла у Терема просто нет (так у
    R09048215508…R09114215508 карточка ссылалась на несуществующий RG008M1UNGOOK0_1.jpg).
    Это не сбой сети и не блокировка, поэтому такой артикул уходит в «не найдено»,
    а не в ошибки: раньше шесть таких подряд срабатывали как стоп-кран «похоже на
    блокировку», и с 07.08.2026 каждый прогон умирал на первых шести артикулах очереди.
    """
    if url.startswith('//'):
        url = 'https:' + url
    elif url.startswith('/'):
        url = 'https://www.teremonline.ru' + url

    temp_file = os.path.join(IMAGE_DIR, f"temp_{sku}")
    os.makedirs(IMAGE_DIR, exist_ok=True)

    try:
        # Download raw image
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            with open(temp_file, 'wb') as f:
                f.write(response.read())

        # Optimize and crop image
        success = optimize_and_save_image(temp_file, sku)

        # Delete temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)

        return "OK" if success else "FAILED"
    except urllib.error.HTTPError as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        if e.code in (404, 410):
            print(f"-> Картинки нет на сайте (HTTP {e.code}): {url}")
            return "NOT_FOUND"
        print(f"-> Error downloading {url}: {e}")
        return "FAILED"
    except Exception as e:
        print(f"-> Error downloading {url}: {e}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return "FAILED"

# Уценка на teremonline.ru лежит отдельными карточками с тем же артикулом:
# «Уценённый товар (мятый / нетоварный вид упаковки, скол краски) …». В выдаче
# они нередко идут ПЕРВЫМИ, и парсер утаскивал их фото — вместо изделия в каталог
# попадали снимки помятых коробок на складской паллете. Так пришли битые картинки
# коллекторных шкафов SCC-0001/0002/1003. Такие карточки пропускаем.
MARKDOWN_URL_MARKERS = ('utsenennyy', 'utsenenniy', 'utsenka', 'utsenennaya')
MARKDOWN_TEXT_RE = re.compile(r'уцен|нетоварн(ый|ого)\s+вид|скол\s+краски|м[яa]тый', re.I)

def is_markdown_card(el):
    """True, если карточка товара — уценка (по ссылке или по тексту карточки)."""
    if el is None:
        return False
    for a in el.select('a[href]'):
        href = (a.get('href') or '').lower()
        if any(m in href for m in MARKDOWN_URL_MARKERS):
            return True
    return bool(MARKDOWN_TEXT_RE.search(el.get_text(' ', strip=True)))

def norm_article(s):
    return re.sub(r'[^A-Z0-9]', '', (s or '').upper())

def extract_image_url(driver, sku, article=None):
    soup = BeautifulSoup(driver.page_source, 'html.parser')

    # Если поиск сразу открыл карточку уценённого товара — фото с неё не берём:
    # пусть лучше артикул уйдёт в NOT_FOUND и попадёт в отчёт, чем в каталог
    # встанет снимок брака.
    page_url = (driver.current_url or '').lower()
    if any(m in page_url for m in MARKDOWN_URL_MARKERS):
        return None

    # Артикула нет НИГДЕ на странице — значит поиск его не знает и показал что-то
    # своё (соседний товар той же группы, а то и просто первую позицию каталога).
    # Раньше картинка с этой чужой карточки молча уезжала в img/<наш_id>.jpg: так
    # у серии коллекторов ROMMER RMB-* оказались фото шаровых кранов, а у
    # несуществующего артикула — бухта трубы. Лучше NOT_FOUND и строка в отчёте.
    if article:
        want = norm_article(article)
        if want and want not in norm_article(soup.get_text(' ', strip=True)):
            return None

    # Try 1: Look at og:image metadata (usually high-res main product image)
    og_img = soup.find('meta', property='og:image')
    if og_img and og_img.get('content'):
        url = og_img.get('content')
        if '/upload/' in url and 'logo' not in url.lower() and 'brand' not in url.lower():
            return url
            
    # Try 2: Look for image tag with itemprop="image"
    itemprop_img = soup.find('img', itemprop='image')
    if itemprop_img and itemprop_img.get('src'):
        url = itemprop_img.get('src')
        if 'logo' not in url.lower() and 'brand' not in url.lower():
            return url
        
    # Try 3: Search for common product detail page gallery structures
    gallery_img = soup.select('.product-gallery img, .js-product-gallery img, .product-image img, .detail-gallery img, .product-card__gallery img')
    for img in gallery_img:
        src = img.get('src') or img.get('data-src')
        if src and ('/upload/' in src):
            src_lower = src.lower()
            if 'logo' not in src_lower and 'banner' not in src_lower and 'icon' not in src_lower and 'arrow' not in src_lower and 'brand' not in src_lower:
                return src
                
    # Try 4: карточка в выдаче, НЕ являющаяся уценкой. Раньше бралась просто первая —
    # а уценённые позиции у Терема часто стоят выше обычных. Плюс: если в выдаче
    # несколько товаров, берём именно ту карточку, где стоит наш артикул, а не
    # верхнюю (проверка выше гарантирует лишь то, что артикул есть где-то на странице).
    cards = list(soup.select('.product-item, .product-item-container, .product-card'))
    if article:
        want = norm_article(article)
        exact = [c for c in cards if want and want in norm_article(c.get_text(' ', strip=True))]
        if exact:
            cards = exact
    for item_el in cards:
        if is_markdown_card(item_el):
            continue
        img_els = item_el.select('.product-item-image-original, .product-item-image-alternative, img')
        for el in img_els:
            src = el.get('src') or el.get('data-src') or el.get('style') or ''
            if 'background-image' in src:
                bg_match = re.search(r"url\(['\"]?([^'\"]+)['\"]?\)", src)
                if bg_match:
                    src = bg_match.group(1)
            if src and ('/upload/' in src):
                src_lower = src.lower()
                if 'logo' not in src_lower and 'banner' not in src_lower and 'icon' not in src_lower and 'arrow' not in src_lower and 'brand' not in src_lower:
                    return src

    return None

def process_sku_image(driver, item):
    try:
        try:
            driver.get(SEARCH_URL)
        except TimeoutException:
            driver.execute_script("window.stop();")
        close_popups(driver)
        
        search_query = item["article"].strip()
        save_filename = item["id"].strip()
        img_url = None
        for attempt in range(3):
            try:
                wait = WebDriverWait(driver, 5)
                try: inp = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='search'], input[name='q'], input[placeholder*='поиск']")))
                except:
                    inp = next((i for i in driver.find_elements(By.TAG_NAME, "input") if i.is_displayed() and i.size['width'] > 50), None)
                if not inp: return "ERR_NO_SEARCH_INPUT"

                inp.send_keys(Keys.CONTROL + "a")
                inp.send_keys(Keys.BACKSPACE)
                inp.send_keys(search_query)
                
                # Сразу нажимаем Enter, пропуская мелкие картинки в подсказке
                try: 
                    driver.find_element(By.CSS_SELECTOR, "button[type='submit'], .search-btn").click()
                except: 
                    inp.send_keys(Keys.RETURN)
                    
                # Ждем загрузки полноценной страницы с хорошим исходником
                time.sleep(2)
                img_url = extract_image_url(driver, save_filename, search_query)
                break
            except StaleElementReferenceException:
                time.sleep(0.5)
                continue
            except Exception as e:
                if attempt == 2: return f"ERR_SEARCH: {str(e)[:25]}"
                time.sleep(0.5)
                continue
        if not img_url:
            return "NOT_FOUND"

        saved = save_image(img_url, save_filename)
        if saved == "OK":
            return "DOWNLOADED"
        if saved == "NOT_FOUND":
            # 404 на самой картинке: у Терема её нет — «не найдено», а не ошибка
            return "NOT_FOUND"

        return "DOWNLOAD_FAILED"
    except Exception as e:
        return f"ERR: {str(e)[:25]}"

def pick_pilot(missing_items, total):
    """
    Выборка для пробного прогона: по PILOT_PER_SHEET артикулов из каждого листа.

    Листы перебираются от самых «дырявых» — там, где картинок не хватает больше
    всего, и цена ошибки в решении «гнать полный прогон или нет» тоже выше.
    Внутри листа берём подряд с начала: артикулы отсортированы, и это даёт
    воспроизводимую выборку — повторный пилот проверит те же позиции.
    """
    by_sheet = {}
    for item in missing_items:
        by_sheet.setdefault(item.get("sheet") or "—", []).append(item)

    order = sorted(by_sheet.items(), key=lambda kv: -len(kv[1]))
    picked = []
    for sheet, rows in order:
        if len(picked) >= total:
            break
        picked.extend(rows[:PILOT_PER_SHEET])
    return picked[:total]


def update_catalog_images(pilot=0):
    print("=== ЗАПУСК ПАРСЕРА КАРТИНОК С ОПТИМИЗАЦИЕЙ ===")
    if pilot:
        print(f"[ПИЛОТ] Пробный прогон: до {pilot} артикулов, по {PILOT_PER_SHEET} из листа. "
              f"articles_not_found.txt не трогаем.")

    print("Шаг 1: Извлечение артикулов из catalog.js...")
    items = get_unique_skus()
    print(f"Всего уникальных товаров в каталоге: {len(items)}")
    
    print("Шаг 2: Определение товаров без картинок (с учетом удаленных)...")
    missing_items = get_missing_skus(items)
    print(f"Товаров для скачивания: {len(missing_items)}")
    
    # Save the list of missing ids for local user reference
    with open(MISSING_LIST_PATH, 'w', encoding='utf-8') as f:
        f.write("\n".join([item["id"] for item in missing_items]))
    print(f"Список артикулов сохранен в {MISSING_LIST_PATH}")

    if not missing_items:
        print("Все картинки уже скачаны. Завершение работы.")
        return

    if pilot:
        missing_items = pick_pilot(missing_items, pilot)
        print(f"[ПИЛОТ] В выборке {len(missing_items)} артикулов "
              f"из {len({i.get('sheet') for i in missing_items})} листов прайса.")
        if not missing_items:
            return

    total_missing = len(missing_items)
    if not pilot and total_missing > MAX_ITEMS_PER_RUN:
        print(f"Всего не хватает {total_missing} картинок, но за один прогон обрабатываем не более "
              f"{MAX_ITEMS_PER_RUN} (лимит времени джобы на GitHub Actions). Остальные "
              f"{total_missing - MAX_ITEMS_PER_RUN} подтянутся при следующих запусках workflow.")
        missing_items = missing_items[:MAX_ITEMS_PER_RUN]

    print("Шаг 3: Очистка старых процессов...")
    kill_zombies()

    def launch_driver():
        options = Options()
        options.add_argument("--log-level=3")
        options.page_load_strategy = 'eager'
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_experimental_option("excludeSwitches", ["enable-logging"])
        options.add_argument("--no-proxy-server")

        d = webdriver.Chrome(options=options)
        d.set_page_load_timeout(30)
        d.set_window_size(1920, 1080)
        return d

    print("Шаг 4: Инициализация Selenium...")
    try:
        driver = launch_driver()
        print("Браузер успешно запущен!\n")
    except Exception as e:
        print(f"Ошибка браузера: {e}")
        return

    downloaded = 0
    not_found = 0
    failed = 0
    consecutive_errors = 0
    per_sheet = {}   # лист прайса -> [скачано, не найдено, ошибок]

    try:
        for idx, item in enumerate(missing_items):
            print(f"[{idx+1}/{len(missing_items)}] Скачиваем и оптимизируем для {item['id']}...", end=" ")
            res = process_sku_image(driver, item)
            print(res)

            stat = per_sheet.setdefault(item.get("sheet") or "—", [0, 0, 0])
            if res == "DOWNLOADED":
                downloaded += 1
                stat[0] += 1
                consecutive_errors = 0
            elif res == "NOT_FOUND":
                not_found += 1
                stat[1] += 1
                consecutive_errors = 0
                # В пилоте список пропускаемых не пополняем: пары промахов мало,
                # чтобы навсегда вычеркнуть артикул из полного прогона.
                if not pilot:
                    try:
                        with open(NOT_FOUND_LIST_PATH, 'a', encoding='utf-8') as f:
                            f.write(item['id'] + '\n')
                    except Exception as e:
                        print(f"Ошибка записи в {NOT_FOUND_LIST_PATH}: {e}")
            else:
                failed += 1
                stat[2] += 1
                consecutive_errors += 1

            # Стоп-кран: подряд идущие ошибки чаще всего значат, что сайт начал блокировать
            # (капча/редирект/бан IP), а не что это просто случайные сетевые сбои
            if consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
                print(f"\n[!] {MAX_CONSECUTIVE_ERRORS} ошибок подряд — похоже на блокировку сайтом. "
                      f"Останавливаемся раньше срока, чтобы не усугублять; уже скачанное сохранится.")
                break

            # Пересоздаём браузер каждые N товаров — не тянем одну и ту же "сессию" часами
            if (idx + 1) % RESTART_BROWSER_EVERY == 0 and (idx + 1) < len(missing_items):
                try:
                    driver.quit()
                except Exception:
                    pass
                time.sleep(random.uniform(BATCH_PAUSE_MIN, BATCH_PAUSE_MAX))
                driver = launch_driver()

            # Каждые BATCH_SIZE товаров — длинная пауза, дальше обычная случайная задержка
            if (idx + 1) % BATCH_SIZE == 0:
                pause = random.uniform(BATCH_PAUSE_MIN, BATCH_PAUSE_MAX)
                print(f"   ...пауза {pause:.0f} сек. после пачки из {BATCH_SIZE}...")
                time.sleep(pause)
            else:
                time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    finally:
        driver.quit()
        print("\n=== РЕЗУЛЬТАТЫ РАБОТЫ ===")
        print(f"Успешно скачано и сжато: {downloaded}")
        print(f"Не найдено: {not_found}")
        print(f"С ошибками: {failed}")

        if per_sheet:
            print("\n=== ПОПАДАНИЕ ПО ЛИСТАМ ПРАЙСА ===")
            print(f"{'скач':>5} {'нет':>5} {'ошиб':>5}  лист")
            for sheet, (ok, nf, err) in sorted(per_sheet.items(), key=lambda kv: -kv[1][0]):
                print(f"{ok:>5} {nf:>5} {err:>5}  {sheet}")
            if pilot:
                print("\nЛисты, где скачалось 0 — полный прогон по ним теряет часы впустую: "
                      "этих брендов на сайте просто нет. Листы с попаданием стоит гнать целиком.")

if __name__ == "__main__":
    import sys
    # python AutoImage.py            — обычный прогон (до MAX_ITEMS_PER_RUN артикулов)
    # python AutoImage.py --pilot    — пробный прогон на PILOT_TOTAL артикулов
    # python AutoImage.py --pilot 80 — то же, но своим размером выборки
    pilot_n = 0
    if '--pilot' in sys.argv:
        pilot_n = PILOT_TOTAL
        pos = sys.argv.index('--pilot')
        if pos + 1 < len(sys.argv):
            try:
                pilot_n = int(sys.argv[pos + 1])
            except ValueError:
                pass
    try:
        update_catalog_images(pilot=pilot_n)
    except Exception as e:
        print(f"\n[!] КРИТИЧЕСКАЯ ОШИБКА: {e}")
        traceback.print_exc()