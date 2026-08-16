const CACHE_NAME = 'heatcalc-v25.61';
// Подложки планов этажей — отдельным кэшем, который переживает смену версии
// приложения. В общем кэше они терялись бы при каждом выпуске, а это как раз
// то, что монтажник открывает на объекте, где связи может не быть.
const PLANS_CACHE = 'heatcalc-plans';
const ASSETS = [
  '/',
  '/index.html',
  '/start.html',
  '/style.css',
  '/app.js',
  '/catalog.js',
  '/dist_prices.js',
  '/img/logo_HC.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Кэшируем основные ассеты (игнорируя ошибки, чтобы не блокировать SW)
      return Promise.allSettled(
        ASSETS.map(asset => cache.add(asset))
      ).then(() => {
        console.log('[Service Worker] Installed & Pre-cached assets');
      });
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      clients.claim();
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== PLANS_CACHE) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Подложка плана этажа: чужой домен (proxy.heatcalc.ru), но по одному
  // адресу она никогда не меняется — имя файла содержит хеш картинки, и
  // перерисованный план приезжает под новым именем. Значит отдаём из кэша
  // сразу, в сеть не ходим вовсе: и трафика ноль, и на объекте без связи
  // план открывается. Списки файлов (?list=) кэшировать нельзя — меняются.
  if (e.request.method === 'GET') {
    let planFile = null;
    try {
      const u = new URL(e.request.url);
      if (u.pathname.endsWith('/plans.php')) planFile = u.searchParams.get('n');
    } catch (err) { /* нестандартный адрес — просто не наш случай */ }
    if (planFile) {
      e.respondWith(
        caches.open(PLANS_CACHE).then((cache) =>
          cache.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
            if (res && res.status === 200) cache.put(e.request, res.clone());
            return res;
          }))
        )
      );
      return;
    }
  }

  // Пропускаем не-GET запросы и сторонние API (например, Supabase)
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Навигация (открытие/переход на HTML-страницу, включая /rating/) — network-first.
  // Иначе правка внутри самого HTML не может «доехать» до браузера: старая закэшированная
  // версия страницы продолжает отдаваться из кэша бесконечно, а код фикса, который должен
  // был бы её пересобрать, лежит именно в новой версии этого же файла — замкнутый круг.
  // Обычный F5/Ctrl+Shift+R его не пробивает, потому что SW перехватывает запрос раньше
  // HTTP-кэша браузера. Кэш всё ещё используется как офлайн-фолбэк, если сети нет.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Фоновое обновление кэша (stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
