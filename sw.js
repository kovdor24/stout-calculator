const CACHE_NAME = 'heatcalc-v25.66';
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

// Сколько ждём сеть при открытии приложения, прежде чем показать страницу из
// кэша. Раньше ожидания не было вовсе — ждали, пока сдастся сам браузер. Это
// терпимо, когда сети нет совсем (отказ приходит сразу), и невыносимо, когда
// канал не отвечает «нет», а молчит и рвёт соединение через двадцать секунд:
// ровно столько PWA и показывала белый экран на каждом запуске.
//
// Полторы секунды — заметно больше, чем нужно живой сети (сам index.html
// отдаётся за десятые доли секунды даже с телефона), и заметно меньше, чем
// готов ждать человек, открывший приложение.
const NAV_TIMEOUT = 1500;

// Отметка последнего молчания сети. Нужна, чтобы не наступать на одни грабли
// подряд: если index.html только что не доехал, то и app.js за ним не доедет,
// и ждать его отдельные двадцать секунд бессмысленно. В течение этого окна
// файлы отдаём из кэша сразу, а сеть пробуем в фоне — ответит, обновит кэш.
const NET_DOWN_WINDOW = 30000;
let netFailedAt = 0;
const netLooksDown = () => netFailedAt > 0 && (Date.now() - netFailedAt) < NET_DOWN_WINDOW;
const netOk = () => { netFailedAt = 0; };
const netFailed = () => { netFailedAt = Date.now(); };

// Копия файла в кэше: сначала точное совпадение, затем — тот же файл с любым
// «?v=».
//
// Второе важнее, чем кажется. У каждого выпуска свои номера версий
// (app.js?v=6.23), и сразу после публикации в кэше лежит только предыдущий
// номер. Совпадения по точному адресу нет — и страница, открытая из кэша,
// отправляла в сеть весь свой код до единого файла. При живой связи это
// незаметно, при мёртвой приложение вставало на «Загрузка калькулятора…»:
// index.html из кэша есть, а выполнять нечего.
//
// Ищем по всем кэшам, а не только по текущему: при неудачной установке рядом
// может лежать кэш прошлого выпуска (см. activate) — он и выручает.
function staleMatch(request) {
  return caches.match(request, { ignoreSearch: true });
}

// Фоновое обновление: ответ сети не ждём, но если он придёт — положим в кэш.
function refresh(request) {
  return fetch(request).then((res) => {
    if (res && res.status === 200) {
      netOk();
      return caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
    }
  }).catch(() => { netFailed(); });
}

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
  e.waitUntil((async () => {
    await clients.claim();
    // Кэш прошлого выпуска сносим только тогда, когда новый успел наполниться.
    //
    // Выпуск, совпавший с обрывом связи, иначе оставлял приложение вообще без
    // копии сайта: предзагрузка в install молча провалилась (там allSettled,
    // ошибки игнорируются), а прошлый кэш к этому моменту уже удалён. И вместо
    // приложения человек получал «Соединение сброшено» — при том, что накануне
    // сайт у него открывался и офлайн.
    const cache = await caches.open(CACHE_NAME);
    const filled = (await cache.keys()).length > 0;
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => {
      if (key === CACHE_NAME || key === PLANS_CACHE) return null;
      if (!filled) {
        console.log('[Service Worker] Keeping old cache until the new one is filled:', key);
        return null;
      }
      console.log('[Service Worker] Removing old cache:', key);
      return caches.delete(key);
    }));
  })());
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

  // Навигация (открытие/переход на HTML-страницу, включая /rating/) — network-first,
  // но с ограничением по времени.
  //
  // Сеть спрашиваем первой, иначе правка внутри самого HTML не может «доехать» до
  // браузера: старая закэшированная версия страницы продолжает отдаваться из кэша
  // бесконечно, а код фикса, который должен был бы её пересобрать, лежит именно в новой
  // версии этого же файла — замкнутый круг. Обычный F5/Ctrl+Shift+R его не пробивает,
  // потому что SW перехватывает запрос раньше HTTP-кэша браузера.
  //
  // Но ждать ответа бесконечно нельзя (см. NAV_TIMEOUT): молчащий канал держал запуск
  // приложения по двадцать секунд белого экрана. Теперь через полторы секунды показываем
  // копию из кэша, а ответ сети, если он всё же придёт, обновит кэш к следующему запуску.
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const fromNet = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            netOk();
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => { netFailed(); return null; });

      const answered = await Promise.race([
        fromNet,
        new Promise((resolve) => setTimeout(() => resolve(null), NAV_TIMEOUT))
      ]);
      if (answered) return answered;

      // Сеть молчит дольше отведённого. Показываем то, что есть, по порядку:
      // ровно этот адрес, он же без «?v=», затем стартовая страница приложения и
      // корень сайта. Последние две — ради самой PWA: она открывается по
      // /index.html, и если именно этого адреса в кэше не оказалось, старый код
      // отдавал браузеру пустоту, а тот показывал «Соединение сброшено» — хотя
      // копия сайта в кэше лежала и открыть приложение было из чего.
      const cached = (await caches.match(e.request))
        || (await staleMatch(e.request))
        || (await staleMatch('/index.html'))
        || (await staleMatch('/'));
      if (cached) {
        // Раз страница не пришла вовремя, за ней не придёт и её код — пусть файлы
        // ниже берутся из кэша сразу, а не ждут своей минуты отказа каждый.
        if (!netLooksDown()) netFailed();
        return cached;
      }

      // В кэше нет ничего — ждём сеть до конца: пусть браузер сам покажет, что
      // произошло, это честнее пустой страницы.
      return (await fromNet) || fetch(e.request);
    })());
    return;
  }

  e.respondWith((async () => {
    // Точная копия — отдаём сразу и обновляем в фоне (stale-while-revalidate)
    const cachedResponse = await caches.match(e.request);
    if (cachedResponse) {
      refresh(e.request);
      return cachedResponse;
    }

    // Точной копии нет. Обычно это значит не «файла не было», а «вышел новый
    // выпуск»: сменился номер в «?v=», сам файл тот же. Держим наготове
    // предыдущую версию — вчерашний app.js несравнимо лучше пустого экрана.
    const stale = await staleMatch(e.request);

    // Сеть только что молчала на самой странице — не выстаиваем очередь отказов
    // ещё и на каждом её файле.
    if (stale && netLooksDown()) {
      refresh(e.request);
      return stale;
    }

    try {
      const networkResponse = await fetch(e.request);
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        netOk();
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
      }
      return networkResponse;
    } catch (err) {
      netFailed();
      if (stale) return stale;
      throw err;
    }
  })());
});
