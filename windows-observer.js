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

        // Вычисление количества помещений (зон/термостатов) по алгоритму на основе площади теплого пола
        function calculateRecommendedRooms(tpArea, isSecondFloor) {
            if (tpArea === 0) return 0;
            
            // Динамический расчет числа комнат (зон) с теплым полом: 1 термостат на каждые 20 м² площади теплого пола
            let tpRoomsCount = Math.max(1, Math.ceil(tpArea / 20));
            
            // Если этажа два и на обоих есть теплый пол, то минимум 2 термостата
            if (isSecondFloor && typeof app !== 'undefined' && app.state && (parseFloat(app.state.tp1) || 0) > 0 && (parseFloat(app.state.tp2) || 0) > 0) {
                tpRoomsCount = Math.max(2, tpRoomsCount);
            }
            
            return tpRoomsCount;
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
                app.setWin(String(targetValue), true);
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
                app.setZones(String(targetValue), true);
            }
        }

        // Триггер авторасчета при изменении параметров
        function handleAutoCalculation() {
            if (typeof app === 'undefined' || !app.state) {
                // Если объект app еще не готов, выполняем стандартный авторасчет
                const area = parseInt(inpArea.value) || 150;
                const isSecondFloor = chkFloors.checked;
                const recommendedWin = calculateRecommendedWindows(area, isSecondFloor);
                updateWindowsValue(recommendedWin);
                return;
            }

            const area = parseInt(inpArea.value) || 150;
            const isSecondFloor = chkFloors.checked;
            const floors = isSecondFloor ? 2 : 1;
            
            // 1. Авторасчет окон
            let shouldAutoCalcWin = true;
            if (app.state.winManual) {
                if (app.state.winManualArea === area && app.state.winManualFloors === floors) {
                    shouldAutoCalcWin = false;
                } else {
                    app.state.winManual = false;
                }
            }
            if (shouldAutoCalcWin) {
                const recommendedWin = calculateRecommendedWindows(area, isSecondFloor);
                updateWindowsValue(recommendedWin);
            }

            // 2. Авторасчет термостатов на основе площади ТП (только при выключенном режиме "По комнатам", так как в покомнатном режиме им управляет app.js)
            if (!app.state.detailedRooms || !app.state.showDetailedRoomsPanel) {
                const tpArea = (app.state.tp1 || 0) + (app.state.tp2 || 0);
                let shouldAutoCalcZones = true;
                if (app.state.zonesManual) {
                    if (app.state.zonesManualArea === area && 
                        app.state.zonesManualTpArea === tpArea && 
                        app.state.zonesManualFloors === floors) {
                        shouldAutoCalcZones = false;
                    } else {
                        app.state.zonesManual = false;
                    }
                }
                if (shouldAutoCalcZones) {
                    const recommendedRooms = calculateRecommendedRooms(tpArea, isSecondFloor);
                    updateThermostatsValue(recommendedRooms);
                }
            }
        }

        // Подписываемся на события изменения площади, этажности и режима расчета
        inpArea.addEventListener('input', handleAutoCalculation);
        chkFloors.addEventListener('change', handleAutoCalculation);
        if (chkDetailedRooms) {
            chkDetailedRooms.addEventListener('change', handleAutoCalculation);
        }
        const chkDetailedRoomsToggle = document.getElementById('chk_detailed_rooms_toggle');
        if (chkDetailedRoomsToggle) {
            chkDetailedRoomsToggle.addEventListener('change', handleAutoCalculation);
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
