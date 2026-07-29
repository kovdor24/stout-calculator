const CACHE_NAME = 'heatcalc-v11.2';
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
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
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
