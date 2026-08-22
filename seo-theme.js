/* Переключатель светлой и тёмной темы на контентных страницах.
 *
 * Саму тему ставит не этот файл, а короткий инлайн-скрипт в <head> каждой
 * страницы: он должен отработать до первой отрисовки, иначе тёмная страница
 * успевает моргнуть белым. Здесь только обработка нажатия на кнопку и
 * подгонка цвета адресной строки.
 *
 * Правило выбора темы при первом заходе — по часам: с 7 до 19 светлая,
 * иначе тёмная. Дальше решает выбор пользователя, он лежит в localStorage
 * под ключом hc-theme и живёт до очистки данных сайта.
 */
(function () {
    'use strict';

    var KEY = 'hc-theme';
    var root = document.documentElement;

    function current() {
        return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    // Цвет адресной строки на телефоне: должен совпадать с фоном страницы,
    // иначе сверху остаётся полоса от прошлой темы.
    function syncMeta(theme) {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'light' ? '#FFFFFF' : '#000000');
    }

    function label(btn, theme) {
        var text = theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему';
        btn.setAttribute('aria-label', text);
        btn.setAttribute('title', text);
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        syncMeta(theme);
        try { localStorage.setItem(KEY, theme); } catch (e) { /* приватный режим */ }
        var btn = document.querySelector('.theme-toggle');
        if (btn) label(btn, theme);
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.theme-toggle') : null;
        if (!btn) return;
        apply(current() === 'light' ? 'dark' : 'light');
    });

    // Первичная подгонка подписи и меты под тему, которую уже поставил
    // инлайн-скрипт.
    var btn = document.querySelector('.theme-toggle');
    if (btn) label(btn, current());
    syncMeta(current());
})();
