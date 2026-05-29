/**
 * HeatCalc Windows Auto-Calculator Observer
 * 
 * Изолированный скрипт-наблюдатель для автоматического расчета количества окон 
 * на основе площади дома и этажности в калькуляторе HeatCalc.
 * Работает как независимая надстройка, не меняя основной код калькулятора.
 */
(function () {
    // Ждем полной загрузки DOM и объекта калькулятора app
    window.addEventListener('DOMContentLoaded', () => {
        const inpArea = document.getElementById('inp_area');
        const chkFloors = document.getElementById('chk_floors');
        const valWin = document.getElementById('val_win');

        if (!inpArea || !chkFloors || !valWin) {
            console.warn('Windows Observer: Необходимые DOM-элементы управления не найдены.');
            return;
        }

        // Вычисление оптимального количества окон на основе площади и этажности
        function calculateRecommendedWindows(area, isSecondFloor) {
            let windows = 5;
            if (area < 80) {
                windows = 5;
            } else if (area >= 80 && area <= 100) {
                windows = 8;
            } else if (area >= 101 && area <= 150) {
                windows = 10;
            } else if (area >= 151 && area <= 200) {
                windows = 15;
            } else {
                windows = Math.max(20, Math.round(area / 12));
            }

            if (isSecondFloor) {
                windows += 1;
            }
            return windows;
        }

        // Обновление количества окон в калькуляторе с имитацией ручного ввода
        function updateWindowsValue(targetValue) {
            if (parseInt(valWin.innerText) === targetValue) return;

            valWin.innerText = targetValue;
            
            // Инициируем события для срабатывания реактивности калькулятора
            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            valWin.dispatchEvent(inputEvent);
            valWin.dispatchEvent(changeEvent);

            // Дополнительно вызываем нативный метод калькулятора для надежного пересчета сметы
            if (typeof app !== 'undefined' && typeof app.setWin === 'function') {
                app.setWin(String(targetValue));
            }
        }

        // Триггер авторасчета окон при изменении параметров
        function handleAutoCalculation() {
            const area = parseInt(inpArea.value) || 150;
            const isSecondFloor = chkFloors.checked;
            const recommended = calculateRecommendedWindows(area, isSecondFloor);
            updateWindowsValue(recommended);
        }

        // Подписываемся на события изменения площади и этажности
        inpArea.addEventListener('input', handleAutoCalculation);
        chkFloors.addEventListener('change', handleAutoCalculation);

        // Первичный расчет при инициализации страницы
        setTimeout(handleAutoCalculation, 1000);
    });
})();
