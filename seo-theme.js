/* Переключатель темы на контентных страницах.
 *
 * Флаг общий с калькулятором: localStorage['stout_save'].darkMode. Тот же
 * приём уже используется на странице рейтинга — переключил тему в одном
 * месте, она поменялась везде. Собственного ключа заводить нельзя: тогда
 * калькулятор и статьи разъедутся по теме.
 *
 * Саму тему ставит не этот файл, а короткий инлайн-скрипт в <head> каждой
 * страницы: класс нужен до первой отрисовки, иначе тёмная страница успевает
 * моргнуть белым. Здесь только нажатие на кнопку и подпись к ней.
 */
(function () {
    'use strict';

    var KEY = 'stout_save';
    var root = document.documentElement;

    function isDark() {
        return root.classList.contains('dark-mode');
    }

    // Цвет адресной строки на телефоне: должен совпадать с фоном страницы.
    function syncMeta(dark) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', dark ? '#000000' : '#F3F4F6');
    }

    function label(btn, dark) {
        var text = dark ? 'Включить светлую тему' : 'Включить тёмную тему';
        btn.setAttribute('aria-label', text);
        btn.setAttribute('title', text);
    }

    function apply(dark) {
        root.classList.toggle('dark-mode', dark);
        // Калькулятор держит класс на <body>; поддерживаем оба, чтобы стиль
        // работал одинаково, если страницу откроют внутри приложения.
        if (document.body) document.body.classList.toggle('dark-mode', dark);
        syncMeta(dark);
        try {
            var saved = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
            saved.darkMode = dark;
            localStorage.setItem(KEY, JSON.stringify(saved));
        } catch (e) { /* приватный режим или переполненное хранилище */ }
        var btn = document.querySelector('.theme-toggle');
        if (btn) label(btn, dark);
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.theme-toggle') : null;
        if (!btn) return;
        apply(!isDark());
    });

    if (document.body) document.body.classList.toggle('dark-mode', isDark());
    var btn = document.querySelector('.theme-toggle');
    if (btn) label(btn, isDark());
    syncMeta(isDark());
})();
