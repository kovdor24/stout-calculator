import re
import time
import os
import urllib3
import urllib.request
import traceback
from bs4 import BeautifulSoup
from PIL import Image, ImageChops

# --- CONFIG ---
CATALOG_PATH = "catalog.js"
SEARCH_URL = 'https://www.teremonline.ru'
IMAGE_DIR = "img"
MISSING_LIST_PATH = "articles_without_images.txt"

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
            items[id_val] = art_val or id_val
            
    return [{"id": k, "article": v} for k, v in sorted(items.items())]

def get_missing_skus(items):
    existing_files = set()
    if os.path.exists(IMAGE_DIR):
        for f in os.listdir(IMAGE_DIR):
            if os.path.isfile(os.path.join(IMAGE_DIR, f)):
                existing_files.add(f.lower())
                
    missing = []
    for item in items:
        item_id = item["id"]
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
            
        return success
    except Exception as e:
        print(f"-> Error downloading {url}: {e}")
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return False

def extract_image_url(driver, sku):
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # Try 1: Look at og:image metadata (usually high-res main product image)
    og_img = soup.find('meta', property='og:image')
    if og_img and og_img.get('content'):
        url = og_img.get('content')
        if '/upload/' in url:
            return url
            
    # Try 2: Look for image tag with itemprop="image"
    itemprop_img = soup.find('img', itemprop='image')
    if itemprop_img and itemprop_img.get('src'):
        return itemprop_img.get('src')
        
    # Try 3: Search for common product detail page gallery structures
    gallery_img = soup.select('.product-gallery img, .js-product-gallery img, .product-image img, .detail-gallery img, .product-card__gallery img')
    for img in gallery_img:
        src = img.get('src') or img.get('data-src')
        if src and ('/upload/' in src):
            return src
            
    # Try 4: Fallback to any image inside product containers or matching iblock
    all_imgs = soup.find_all('img')
    for img in all_imgs:
        src = img.get('src') or img.get('data-src')
        if src and ('/upload/' in src):
            src_lower = src.lower()
            if 'logo' not in src_lower and 'banner' not in src_lower and 'icon' not in src_lower and 'arrow' not in src_lower:
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
                img_url = extract_image_url(driver, save_filename)
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
            
        success = save_image(img_url, save_filename)
        if success:
            return "DOWNLOADED"
            
        return "DOWNLOAD_FAILED"
    except Exception as e:
        return f"ERR: {str(e)[:25]}"

def update_catalog_images():
    print("=== ЗАПУСК ПАРСЕРА КАРТИНОК С ОПТИМИЗАЦИЕЙ ===")
    
    # --- ТОТ САМЫЙ "ПЫЛЕСОС" ---
    print("Шаг 0: Очистка старых бракованных картинок (меньше 5 КБ)...")
    if os.path.exists(IMAGE_DIR):
        cleaned = 0
        for f in os.listdir(IMAGE_DIR):
            file_path = os.path.join(IMAGE_DIR, f)
            if os.path.isfile(file_path) and os.path.getsize(file_path) < 5120: 
                os.remove(file_path)
                cleaned += 1
        print(f"Удалено плохих картинок: {cleaned}")
    # ---------------------------

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
        
    print("Шаг 3: Очистка старых процессов...")
    kill_zombies()
    
    print("Шаг 4: Инициализация Selenium...")
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
        
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(30)
        driver.set_window_size(1920, 1080)
        print("Браузер успешно запущен!\n")
    except Exception as e:
        print(f"Ошибка браузера: {e}")
        return

    downloaded = 0
    not_found = 0
    failed = 0
    
    try:
        for idx, item in enumerate(missing_items):
            print(f"[{idx+1}/{len(missing_items)}] Скачиваем и оптимизируем для {item['id']}...", end=" ")
            res = process_sku_image(driver, item)
            print(res)
            
            if res == "DOWNLOADED":
                downloaded += 1
            elif res == "NOT_FOUND":
                not_found += 1
            else:
                failed += 1
                
            # Add a small delay between requests
            time.sleep(1.5)
            
    finally:
        driver.quit()
        print("\n=== РЕЗУЛЬТАТЫ РАБОТЫ ===")
        print(f"Успешно скачано и сжато: {downloaded}")
        print(f"Не найдено: {not_found}")
        print(f"С ошибками: {failed}")

if __name__ == "__main__":
    try:
        update_catalog_images()
    except Exception as e:
        print(f"\n[!] КРИТИЧЕСКАЯ ОШИБКА: {e}")
        traceback.print_exc()