/**
 * HeatCalc Windows & Thermostats Auto-Calculator Observer
 * 
 * Изолированный скрипт-наблюдатель для автоматического расчета количества окон 
 * и количества комнат/термостатов (1 термостат на 1 комнату) на основе площади 
 * дома и этажности в калькуляторе HeatCalc.
 * Работает как независимая надстройка, не меняя основной код калькулятора.
 */
(function () {
    // Ждем полной загрузки DOM и объекта калькулятора app
    window.addEventListener('DOMContentLoaded', () => {
        const inpArea = document.getElementById('inp_area');
        const chkFloors = document.getElementById('chk_floors');
        const valWin = document.getElementById('val_win');
        const chkDetailedRooms = document.getElementById('chk_detailed_rooms');

        if (!inpArea || !chkFloors || !valWin) {
            console.warn('Observer: Необходимые DOM-элементы управления не найдены.');
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

        // Вычисление количества помещений по алгоритму инженера-проектировщика на основе площади теплого пола
        function calculateRecommendedRooms(tpArea, isSecondFloor) {
            if (tpArea === 0) return 0;
            let rooms = 5;
            if (tpArea < 80) {
                rooms = 5;
            } else if (tpArea >= 81 && tpArea <= 120) {
                rooms = 7;
            } else if (tpArea >= 121 && tpArea <= 160) {
                rooms = 9;
            } else if (tpArea >= 161 && tpArea <= 200) {
                rooms = 11;
            } else if (tpArea >= 201 && tpArea <= 250) {
                rooms = 14;
            } else {
                rooms = 17;
            }

            if (isSecondFloor) {
                rooms += 2;
            }
            return rooms;
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

        // Обновление количества термостатов (1 термостат на 1 комнату)
        function updateThermostatsValue(targetValue) {
            const valZones = document.getElementById('val_zones');
            if (!valZones) return;
            if (parseInt(valZones.innerText) === targetValue) return;

            valZones.innerText = targetValue;

            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            valZones.dispatchEvent(inputEvent);
            valZones.dispatchEvent(changeEvent);

            if (typeof app !== 'undefined' && typeof app.setZones === 'function') {
                app.setZones(String(targetValue));
            }
        }

        // Триггер авторасчета при изменении параметров
        function handleAutoCalculation() {
            const area = parseInt(inpArea.value) || 150;
            const isSecondFloor = chkFloors.checked;
            
            // 1. Авторасчет окон
            const recommendedWin = calculateRecommendedWindows(area, isSecondFloor);
            updateWindowsValue(recommendedWin);

            // 2. Авторасчет термостатов на основе площади ТП (только при выключенном режиме "По комнатам", так как в покомнатном режиме им управляет app.js)
            if (typeof app !== 'undefined' && app.state && !app.state.detailedRooms) {
                const tpArea = (app.state.tp1 || 0) + (app.state.tp2 || 0);
                const recommendedRooms = calculateRecommendedRooms(tpArea, isSecondFloor);
                updateThermostatsValue(recommendedRooms);
            }
        }

        // Подписываемся на события изменения площади, этажности и режима расчета
        inpArea.addEventListener('input', handleAutoCalculation);
        chkFloors.addEventListener('change', handleAutoCalculation);
        if (chkDetailedRooms) {
            chkDetailedRooms.addEventListener('change', handleAutoCalculation);
        }

        // Подписываемся на изменение площади теплого пола
        const inpTp1 = document.getElementById('inp_tp1');
        const inpTp2 = document.getElementById('inp_tp2');
        if (inpTp1) inpTp1.addEventListener('input', handleAutoCalculation);
        if (inpTp2) inpTp2.addEventListener('input', handleAutoCalculation);

        // Дополнительный наблюдатель за системой
        document.addEventListener('click', (e) => {
            if (e.target.closest('#sys_tp') || e.target.closest('.cool-tab') || e.target.closest('.tab')) {
                setTimeout(handleAutoCalculation, 100);
            }
        });

        // Первичный расчет при инициализации страницы
        setTimeout(handleAutoCalculation, 1000);
    });
})();
