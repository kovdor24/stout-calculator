// Поправки интерфейса, которые нужны только внутри Android-приложения.
//
// Файл едет ТОЛЬКО в APK — его кладёт туда build-www.ps1 и подключает на всех
// страницах приложения, сразу после объявления кодировки и без defer.
// На heatcalc.ru его нет, исходники сайта под приложение не правятся.
//
// Зачем он вообще. Магазин заворачивает приложения, которые выглядят как сайт
// в рамке. Всё, что выдаёт сайт — вопрос про cookie, веб-аналитика, ссылки и
// QR-код на heatcalc.ru — здесь убирается, а взамен появляется то, чего у
// вкладки браузера быть не может: кнопка «Назад» закрывает окна, приложение
// честно говорит, что сети нет, и продолжает считать без неё.

(function () {
    'use strict';

    // Метка для остального кода: cookie-consent.js по ней понимает, что он
    // внутри приложения, и не показывает баннер. Ставится синхронно, до всех
    // отложенных скриптов, — поэтому файл подключается без defer.
    window.__HC_NATIVE__ = true;

    // Счётчика в приложении нет, а вызовы к нему в разметке остались — они
    // висят прямо в кнопках «Печать» и «Excel». Без заглушки каждое такое
    // нажатие роняло бы обработчик на неизвестном имени.
    if (typeof window.ym !== 'function') {
        window.ym = function () {};
    }

    var d = document;

    // ---------------------------------------------------------------- стили
    // Пишем сразу, не дожидаясь разметки: до первой отрисовки успеет.
    var style = d.createElement('style');
    style.textContent = [
        /* Плашка «нет сети». Висит над нижней панелью навигации, поверх всего. */
        '.hc-offline-bar{position:fixed;left:50%;transform:translateX(-50%) translateY(120%);',
        'bottom:calc(72px + env(safe-area-inset-bottom, 0px));z-index:100000;',
        'max-width:calc(100vw - 24px);box-sizing:border-box;',
        'display:flex;align-items:center;gap:8px;',
        'padding:10px 16px;border-radius:22px;',
        'background:#1F2937;color:#fff;font-size:13px;line-height:1.3;',
        'box-shadow:0 6px 20px rgba(0,0,0,.35);',
        'transition:transform .25s ease;pointer-events:none;}',
        '.hc-offline-bar.show{transform:translateX(-50%) translateY(0);}',
        '.hc-offline-bar b{font-weight:600;}',
        /* Печать: плашке на бумаге делать нечего. */
        '@media print{.hc-offline-bar{display:none !important;}}'
    ].join('');
    (d.head || d.documentElement).appendChild(style);

    // ------------------------------------------------------- «нет сети»
    var bar = null;

    function offlineBar() {
        if (bar) return bar;
        bar = d.createElement('div');
        bar.className = 'hc-offline-bar';
        bar.innerHTML = '<span>📴</span><span><b>Нет сети.</b> Расчёт, смета и печать работают. ' +
            'Цены и облако вернутся при подключении.</span>';
        d.body.appendChild(bar);
        return bar;
    }

    function updateNetwork() {
        var el = offlineBar();
        // Кадр задержки нужен, чтобы браузер успел применить начальное
        // положение и увидел именно переход, а не сразу конечное состояние.
        requestAnimationFrame(function () {
            el.classList.toggle('show', !navigator.onLine);
        });
    }

    // -------------------------------------------------- следы сайта в печати
    // В печатной сноске стоит QR-код на heatcalc.ru, который рисует чужой
    // сервис api.qrserver.com: внутри приложения это и лишний поход в сеть,
    // и прямая отсылка «идите на сайт». Убираем вместе с подписью.
    function dropSiteMarks() {
        var qr = d.querySelector('.print-disclaimer img[src*="qrserver"]');
        if (qr) {
            var cell = qr.parentNode;
            if (cell && cell.parentNode) cell.parentNode.removeChild(cell);
        }

        var note = d.querySelector('.print-disclaimer div');
        if (note && note.innerHTML.indexOf('heatcalc.ru') !== -1) {
            note.innerHTML = note.innerHTML.replace(
                /автоматическим калькулятором на сайте heatcalc\.ru/,
                'приложением «Калькулятор Монтажника»'
            );
        }
    }

    // ------------------------------------------------------------- ссылки
    // target="_blank" на телефоне разворачивается в отдельное окно, и Capacitor
    // отдаёт такое окно системному браузеру. Для оферты и политики это провал:
    // они лежат внутри приложения, по адресу localhost, и браузер показал бы
    // пустую страницу. Свои страницы открываем у себя же.
    //
    // Рейтинг — наоборот: страницы /rating/ внутри нет, она живёт на сайте.
    // Даём ей полный адрес, и система откроет её в браузере, как и положено
    // внешней ссылке.
    //
    // Разбираем не разметку, а нажатие: половину ссылок рисует app.render()
    // уже после загрузки, и однократный обход по готовности их бы не застал.
    var SITE = 'https://heatcalc.ru';

    function handleLink(e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;

        var href = a.getAttribute('href') || '';

        // Разделы сайта, которых нет в приложении (рейтинг, страницы городов).
        if (href.charAt(0) === '/' && href !== '/') {
            e.preventDefault();
            window.open(SITE + href, '_blank');
            return;
        }

        // Свои страницы: открываем у себя, без отдельного окна.
        if (a.target === '_blank' && /\.html($|[?#])/.test(href)) {
            e.preventDefault();
            window.location.href = href;
        }
    }

    // ------------------------------------------------------ кнопка «Назад»
    // Зовётся из MainActivity. Возвращает true, если нашлось что закрыть, —
    // тогда приложение остаётся на месте. Если false, родная часть предложит
    // выйти по второму нажатию.
    var OVERLAYS = [
        '.auth-modal-overlay',
        '.custom-modal-overlay',
        '#admin_modal_overlay',
        '#cloud_list_modal_overlay',
        '#notifications_modal_overlay',
        '#payment_modal_overlay',
        '#profile_modal_overlay',
        '#share_options_modal_overlay',
        '#swap_modal_overlay',
        '#feedback_modal_overlay',
        '#lk_rating_overlay'
    ].join(',');

    function visible(el) {
        if (!el) return false;
        var cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function onMainScreen() {
        var p = location.pathname || '/';
        return p === '/' || /\/index\.html$/.test(p);
    }

    window.hcNativeBack = function () {
        var open = [];
        var all = d.querySelectorAll(OVERLAYS);
        for (var i = 0; i < all.length; i++) {
            if (visible(all[i])) open.push(all[i]);
        }

        if (!open.length) {
            // Окон нет, но мы ушли с главного экрана — на оферту, политику или
            // в счёт. «Назад» должен вернуть в расчёт, а не предлагать выход.
            if (!onMainScreen() && history.length > 1) {
                history.back();
                return true;
            }
            return false;
        }

        // Самое верхнее — то, у которого больше z-index; при равных берём
        // последнее в разметке, так же как это видит человек.
        var top = open[0];
        for (var j = 1; j < open.length; j++) {
            var a = parseInt(getComputedStyle(open[j]).zIndex, 10) || 0;
            var b = parseInt(getComputedStyle(top).zIndex, 10) || 0;
            if (a >= b) top = open[j];
        }

        // Сначала пробуем родную для окна кнопку закрытия: она не только
        // прячет окно, но и прибирает за собой (сбрасывает состояние, снимает
        // блокировку прокрутки). Простое сокрытие оставило бы мусор.
        // Крестик у всех окон калькулятора один и тот же — .auth-modal-close.
        var close = top.querySelector('.auth-modal-close');
        if (close) {
            close.click();
        } else {
            top.style.display = 'none';
        }
        return true;
    };

    // ------------------------------------------------------------- запуск
    function start() {
        dropSiteMarks();
        updateNetwork();
        window.addEventListener('online', updateNetwork);
        window.addEventListener('offline', updateNetwork);
        d.addEventListener('click', handleLink, true);
    }

    if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
