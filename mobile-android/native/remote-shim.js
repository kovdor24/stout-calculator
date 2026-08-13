// Прослойка для Android-сборки. В сам APK кладём только код и вёрстку — фото
// товаров (135 МБ), 3D-модели и прайсы остаются на сайте. Этот файл подставляет
// им абсолютный адрес, чтобы не править исходники сайта под мобильную сборку.
//
// Подключается первым скриптом в www/index.html (это делает build-www.ps1).
(function () {
    var REMOTE = 'https://heatcalc.ru/';

    // Что внутрь приложения не попадает и берётся с сайта
    var remotePatterns = [
        /^\/?price_index\.json/,
        /^\/?price_extra\.json/,
        /^\/?img\//,
        /^\/?models\//,
        /\.php(\?|$)/
    ];

    function needsRemote(url) {
        for (var i = 0; i < remotePatterns.length; i++) {
            if (remotePatterns[i].test(url)) return true;
        }
        return false;
    }

    function absolutize(url) {
        if (typeof url !== 'string' || !url) return url;
        if (/^(https?:|data:|blob:|file:)/.test(url)) return url;
        if (!needsRemote(url)) return url;
        return REMOTE + url.replace(/^\//, '');
    }

    var origFetch = window.fetch;
    if (origFetch) {
        window.fetch = function (input, init) {
            if (typeof input === 'string') {
                input = absolutize(input);
            } else if (input && typeof input.url === 'string') {
                var abs = absolutize(input.url);
                if (abs !== input.url) input = new Request(abs, input);
            }
            return origFetch.call(this, input, init);
        };
    }

    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        arguments[1] = absolutize(url);
        return origOpen.apply(this, arguments);
    };

    // Фото товаров запрашиваются как img/<артикул>.jpg и внутри приложения не
    // находятся. Ловим промах на фазе перехвата — до того, как сработает
    // собственный onerror картинки, который её прячет, — и берём фото с сайта.
    document.addEventListener('error', function (e) {
        var el = e.target;
        if (!el || el.tagName !== 'IMG') return;
        if (el.getAttribute('data-hc-remote')) return;

        var src = el.getAttribute('src') || '';
        if (!src || /^(https?:|data:|blob:)/.test(src)) return;

        el.setAttribute('data-hc-remote', '1');
        el.onerror = null;
        el.src = REMOTE + src.replace(/^\//, '');
    }, true);
})();
