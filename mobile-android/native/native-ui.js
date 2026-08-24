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

        /* Полоса «файл сохранён» — та же посадка, но с кнопками. */
        '.hc-saved-bar{position:fixed;left:50%;transform:translateX(-50%) translateY(160%);',
        'bottom:calc(72px + env(safe-area-inset-bottom, 0px));z-index:100001;',
        'max-width:calc(100vw - 24px);box-sizing:border-box;',
        'display:flex;align-items:center;gap:10px;flex-wrap:wrap;',
        'padding:10px 12px 10px 16px;border-radius:22px;',
        'background:#111827;color:#fff;font-size:13px;line-height:1.3;',
        'box-shadow:0 6px 20px rgba(0,0,0,.4);transition:transform .25s ease;}',
        '.hc-saved-bar.show{transform:translateX(-50%) translateY(0);}',
        '.hc-saved-bar button{appearance:none;border:none;cursor:pointer;',
        'padding:7px 14px;border-radius:16px;font-size:13px;font-weight:600;',
        'background:#2563EB;color:#fff;font-family:inherit;}',
        '.hc-saved-bar button.ghost{background:rgba(255,255,255,.14);}',

        /* Кнопка съёмки в распознавании. */
        '.hc-shot{display:flex;align-items:center;justify-content:center;gap:8px;',
        'width:100%;margin-top:10px;padding:13px 16px;border:none;cursor:pointer;',
        'border-radius:12px;font-size:15px;font-weight:600;font-family:inherit;',
        'background:#2563EB;color:#fff;}',

        /* Печать: экранным плашкам на бумаге делать нечего. */
        '@media print{.hc-offline-bar,.hc-saved-bar,.hc-shot{display:none !important;}}'
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
                'приложением HeatCalc'
            );
        }
    }

    // ------------------------------------------------------------- ссылки
    // Часть ссылок в разметке ведёт в разделы сайта, которых внутри приложения
    // нет: рейтинг, страницы городов. Внутри они открылись бы как localhost/…,
    // то есть пустой страницей. Даём таким полный адрес — чужой адрес Capacitor
    // перехватывает и отдаёт системному браузеру, сам оставаясь на месте.
    //
    // Оферту и политику, наоборот, держим у себя: они лежат внутри APK.
    // target="_blank" убираем явно, чтобы поведение не зависело от настроек
    // встроенного браузера.
    //
    // Разбираем не разметку, а нажатие: половину ссылок рисует app.render()
    // уже после загрузки, и однократный обход по готовности их бы не застал.
    var SITE = 'https://heatcalc.ru';

    function handleLink(e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;

        var href = a.getAttribute('href') || '';

        // Именно переходом, а не window.open: отдельные окна во встроенном
        // браузере выключены, и open() молча вернул бы пустоту.
        if (href.charAt(0) === '/' && href !== '/') {
            e.preventDefault();
            location.href = SITE + href;
            return;
        }

        if (a.target === '_blank' && /\.html($|[?#])/.test(href)) {
            e.preventDefault();
            location.href = href;
        }
    }

    // ------------------------------------------------------- выгрузка файлов
    // Смета в PDF, счёт, договор, выгрузка в Excel — всё собирается в браузере
    // и «скачивается» щелчком по невидимой ссылке с blob:-адресом. Встроенный
    // браузер такие ссылки не скачивает вообще: нажатие не делает ничего.
    // Поэтому ссылку перехватываем и отдаём содержимое родной части, которая
    // кладёт файл в «Загрузки».
    //
    // Перехватываем в двух местах. Свои кнопки калькулятора зовут a.click(),
    // а библиотека печати в PDF — a.dispatchEvent(new MouseEvent('click')) на
    // ссылке, которой нет в разметке. До второго случая не добралось бы ни
    // одно событие на документе, поэтому подменяем оба метода самой ссылки.

    var A = window.HTMLAnchorElement && window.HTMLAnchorElement.prototype;
    var last = null;   // последний сохранённый файл — для «Открыть» и «Поделиться»

    function plugin() {
        var cap = window.Capacitor;
        return (cap && cap.Plugins && cap.Plugins.HcNative) || null;
    }

    function isDownload(a, href) {
        if (!a.hasAttribute('download')) return false;
        return href.indexOf('blob:') === 0 || href.indexOf('data:') === 0;
    }

    function grab(href) {
        // fetch читает и blob:, и data: — отдельная ветка для каждого не нужна.
        return fetch(href).then(function (r) { return r.blob(); }).then(function (b) {
            return new Promise(function (resolve, reject) {
                var fr = new FileReader();
                fr.onload = function () {
                    // Отрезаем «data:тип;base64,» — родной части нужно только тело.
                    var s = String(fr.result);
                    resolve({ data: s.slice(s.indexOf(',') + 1), mime: b.type });
                };
                fr.onerror = function () { reject(fr.error); };
                fr.readAsDataURL(b);
            });
        });
    }

    function saveFile(href, name) {
        var api = plugin();
        if (!api) return false;

        grab(href).then(function (f) {
            return api.save({ name: name, mime: f.mime, data: f.data })
                .then(function (res) {
                    last = { uri: res.uri, mime: res.mime, name: res.name, data: f.data };
                    showSaved(res);
                });
        }).catch(function (err) {
            console.error('[native] сохранение файла не удалось', err);
            alert('Не удалось сохранить файл. Проверьте свободное место на устройстве.');
        });
        return true;
    }

    if (A) {
        var origClick = A.click;
        A.click = function () {
            var href = this.getAttribute('href') || '';
            if (isDownload(this, href) && saveFile(href, this.getAttribute('download'))) return;
            return origClick.apply(this, arguments);
        };

        var origDispatch = A.dispatchEvent;
        A.dispatchEvent = function (ev) {
            var href = this.getAttribute('href') || '';
            if (ev && ev.type === 'click' && isDownload(this, href) &&
                saveFile(href, this.getAttribute('download'))) {
                return true;
            }
            return origDispatch.apply(this, arguments);
        };
    }

    // --------------------------------------------------- полоса «сохранено»
    var savedBar = null, savedTimer = null;

    function showSaved(res) {
        if (!savedBar) {
            savedBar = d.createElement('div');
            savedBar.className = 'hc-saved-bar';
            d.body.appendChild(savedBar);
        }

        savedBar.innerHTML = '';

        var text = d.createElement('span');
        text.innerHTML = 'Сохранено в «' + esc(res.where) + '»';
        savedBar.appendChild(text);

        var open = d.createElement('button');
        open.className = 'ghost';
        open.textContent = 'Открыть';
        open.onclick = function () {
            var api = plugin();
            if (!api || !last) return;
            api.open({ uri: last.uri, mime: last.mime }).catch(function (err) {
                console.error('[native] открыть файл не удалось', err);
                alert('На устройстве нет программы для просмотра этого файла.');
            });
        };
        savedBar.appendChild(open);

        var send = d.createElement('button');
        send.textContent = 'Поделиться';
        send.onclick = function () {
            var api = plugin();
            if (!api || !last) return;
            api.share({ name: last.name, mime: last.mime, data: last.data })
                .catch(function (err) { console.error('[native] отправка не удалась', err); });
        };
        savedBar.appendChild(send);

        requestAnimationFrame(function () { savedBar.classList.add('show'); });

        // Полоса не должна висеть вечно: она перекрывает нижнюю навигацию.
        clearTimeout(savedTimer);
        savedTimer = setTimeout(function () { savedBar.classList.remove('show'); }, 12000);
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    }

    // ------------------------------------------------ съёмка сметы на камеру
    // Распознавание умеет читать фотографию, но выбрать её можно было только
    // из галереи: снимок сначала надо сделать в другой программе и вернуться.
    // Отдельная кнопка открывает камеру сразу — обычная ссылка так не может.
    //
    // Кнопка добавляется рядом с полем загрузки, а не вместо него: атрибут
    // capture у поля выбора увёл бы в камеру и тех, кому нужен PDF со сметой
    // от поставщика.

    function addShotButton() {
        var drop = d.getElementById('rec_drop');
        if (!drop || d.getElementById('hc_shot')) return;

        var btn = d.createElement('button');
        btn.id = 'hc_shot';
        btn.className = 'hc-shot';
        btn.type = 'button';
        btn.innerHTML = '<span>📷</span><span>Сфотографировать</span>';
        btn.onclick = function (e) {
            e.stopPropagation();
            shoot();
        };
        drop.parentNode.insertBefore(btn, drop.nextSibling);
    }

    function shoot() {
        var inp = d.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.capture = 'environment';   // задняя камера, а не селфи
        inp.style.display = 'none';
        d.body.appendChild(inp);
        inp.onchange = function (e) {
            var files = [].slice.call(e.target.files || []);
            inp.remove();
            if (!files.length) return;
            if (typeof RecognizeUI === 'undefined') return;
            // Тот же путь, что и у выбора файла из галереи: снимок докладывается
            // к уже загруженным листам, если они есть.
            if (RecognizeUI._docs && RecognizeUI._docs.length) RecognizeUI.addDocs(files);
            else RecognizeUI.handleFiles(files);
        };
        inp.click();
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

        // Экран распознавания собирается заново при каждом открытии, поэтому
        // кнопку съёмки не ставим один раз, а дожидаемся появления поля.
        addShotButton();
        if (window.MutationObserver) {
            new MutationObserver(addShotButton)
                .observe(d.body, { childList: true, subtree: true });
        }
    }

    if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
