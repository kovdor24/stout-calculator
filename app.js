
// === ЗАЩИТА ДОМЕНА (DOMAIN LOCK) ===
(function () {
    var currentHost = window.location.hostname;
    // Разрешенные домены
    var allowedHosts = ['heatcalc.ru', 'www.heatcalc.ru', 'terem24.github.io', 'localhost', '127.0.0.1'];

    // Если текущего домена нет в списке разрешенных (включая запуск из папки через file://)
    if (allowedHosts.indexOf(currentHost) === -1) {
        document.body.innerHTML = '<div style="text-align:center; padding:100px; font-family:Arial, sans-serif; background:#f3f4f6; height:100vh;"><h2>⚠️ Доступ запрещен</h2><p>Этот калькулятор является интеллектуальной собственностью и работает только на официальном сайте.</p></div>';
        throw new Error("Domain Lock: Несанкционированный запуск на чужом сайте или локальном компьютере.");
    }
})();
// ===================================

const supabaseUrl = 'https://ahanbwugsmcyvrwbmtlx.supabase.co';
const supabaseKey = 'sb_publishable_gcMJ-PvJmKavObbnePFGZQ_O-pu5O2p';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ===================================
// === OFFLINE SHARE LINK GENERATOR (COMPRESSION & BASE64) ===
function compactPayload(data) {
    return {
        o: {
            n: data.object_info.projectName || "Новый объект",
            a: data.object_info.area || 0,
            f: data.object_info.floors || 1,
            r: data.object_info.res || 1,
            m: data.object_info.mat || 1,
            p: data.object_info.power || 0,
            g: data.object_info.region || 'Центр',
            d: data.object_info.date || '',
            s: data.object_info.showSku ? 1 : 0
        },
        m: {
            n: data.manager_info.name || '',
            p: data.manager_info.phone || '',
            c: data.manager_info.city || '',
            e: data.manager_info.email || ''
        },
        i: {
            e: (data.items.equipment || []).map(item => ({
                n: item.name || '',
                s: item.displaySku || item.sku || '',
                b: item.brand || '',
                u: item.unit || '',
                q: item.q || item.qty || 0,
                p: item.price || 0,
                m: item.sum || 0,
                t: item.sectionTitle || ''
            })),
            w: (data.items.works || []).map(item => ({
                n: item.name || '',
                q: item.q || item.qty || 0,
                p: item.price || 0,
                m: item.sum || 0
            }))
        },
        t: {
            e: data.totals.equipment || 0,
            w: data.totals.works || 0,
            g: data.totals.grandTotal || 0
        }
    };
}

function base64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}

async function compressString(str) {
    const byteArray = new TextEncoder().encode(str);
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    writer.write(byteArray);
    writer.close();
    const response = new Response(cs.readable);
    const arrayBuffer = await response.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function encodePayload(data) {
    const json = JSON.stringify(compactPayload(data));
    try {
        if (typeof CompressionStream !== 'undefined') {
            const compressed = await compressString(json);
            return 'c_' + encodeURIComponent(compressed);
        }
    } catch (e) {
        console.warn('CompressionStream failed, using raw base64:', e);
    }
    return 'r_' + encodeURIComponent(base64Encode(json));
}
// ===================================

function getFriendlyErrorMessage(err, defaultMsg = 'Неизвестная ошибка') {
    if (!err) return defaultMsg;
    const msg = (err.message || String(err)).toLowerCase();
    const isNetwork = msg.includes('failed to fetch') ||
        msg.includes('load failed') ||
        msg.includes('network') ||
        msg.includes('aborted') ||
        msg.includes('cors') ||
        msg.includes('timeout') ||
        msg.includes('превышено время') ||
        (err.name && err.name.includes('TypeError')) ||
        !navigator.onLine;
    if (isNetwork) {
        return 'Не удалось связаться с сервером Supabase. Пожалуйста, проверьте интернет-соединение, VPN, CORS-настройки в панели Supabase, или отключите блокировщики рекламы/расширения приватности (AdBlock, uBlock и др.) в вашем браузере.';
    }

    if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
        return 'Неверный логин или пароль.';
    }
    if (msg.includes('email not confirmed')) {
        return 'Email не подтвержден. Пожалуйста, проверьте почту и подтвердите ваш аккаунт.';
    }
    if (msg.includes('already registered') || msg.includes('already exists')) {
        return 'Пользователь с таким email уже зарегистрирован. Войдите в систему.';
    }
    return err.message || defaultMsg;
}

async function withTimeout(promise, timeoutMs = 6000, errorMsg = 'Превышено время ожидания ответа от сервера Supabase. Возможно, требуется включить VPN или проверить интернет-соединение.') {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(errorMsg));
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
}

if (typeof emailjs !== 'undefined') emailjs.init("-m4N93pTqMlCfuBpT");

// Глобальный маппинг замен для кнопки "Аналог"
const ANALOG_MAP = {
    "SVC-0011-000020": "RVC-0001-000020",
    "RDG-0015-004002": "RDG-1015-004003",
    "SVB-0006-000020": "RBV-0007-2410220",
    "RCP-0005-152080": "RCP-0005-150480",
    "SFA-0020-000016": "RFA-0020-000016",
    "SPC-0011-2560130": "RCP-0004-2560130"
};



const app = {
    // === PREMIUM CUSTOM DIALOGS ===
    alert: function (msg, title = "Внимание") {
        if (document.body.classList.contains('menu-open')) {
            try { this.toggleMenu(); } catch (e) { }
        }
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'calc-dialog-overlay';

            const card = document.createElement('div');
            card.className = 'calc-dialog-card';

            const titleEl = document.createElement('h3');
            titleEl.className = 'calc-dialog-title';
            titleEl.innerText = title;
            card.appendChild(titleEl);

            const msgEl = document.createElement('p');
            msgEl.className = 'calc-dialog-message';
            msgEl.innerText = msg;
            card.appendChild(msgEl);

            const btnContainer = document.createElement('div');
            btnContainer.className = 'calc-dialog-buttons';

            const okBtn = document.createElement('button');
            okBtn.className = 'calc-dialog-btn calc-dialog-btn-confirm';
            okBtn.innerText = 'OK';
            okBtn.onclick = () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 200);
            };
            btnContainer.appendChild(okBtn);
            card.appendChild(btnContainer);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            setTimeout(() => overlay.classList.add('active'), 10);
        });
    },

    confirm: function (msg, title = "Подтверждение") {
        if (document.body.classList.contains('menu-open')) {
            try { this.toggleMenu(); } catch (e) { }
        }
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'calc-dialog-overlay';

            const card = document.createElement('div');
            card.className = 'calc-dialog-card';

            const titleEl = document.createElement('h3');
            titleEl.className = 'calc-dialog-title';
            titleEl.innerText = title;
            card.appendChild(titleEl);

            const msgEl = document.createElement('p');
            msgEl.className = 'calc-dialog-message';
            msgEl.innerText = msg;
            card.appendChild(msgEl);

            const btnContainer = document.createElement('div');
            btnContainer.className = 'calc-dialog-buttons';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'calc-dialog-btn calc-dialog-btn-cancel';
            cancelBtn.innerText = 'Отмена';
            cancelBtn.onclick = () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    resolve(false);
                }, 200);
            };

            const okBtn = document.createElement('button');
            okBtn.className = 'calc-dialog-btn calc-dialog-btn-confirm';
            okBtn.innerText = 'Да';
            okBtn.onclick = () => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    resolve(true);
                }, 200);
            };

            btnContainer.appendChild(cancelBtn);
            btnContainer.appendChild(okBtn);
            card.appendChild(btnContainer);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            setTimeout(() => overlay.classList.add('active'), 10);
        });
    },

    prompt: function (msg, defaultValue = "", title = "Ввод данных") {
        if (document.body.classList.contains('menu-open')) {
            try { this.toggleMenu(); } catch (e) { }
        }
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'calc-dialog-overlay';

            const card = document.createElement('div');
            card.className = 'calc-dialog-card';

            const titleEl = document.createElement('h3');
            titleEl.className = 'calc-dialog-title';
            titleEl.innerText = title;
            card.appendChild(titleEl);

            const msgEl = document.createElement('p');
            msgEl.className = 'calc-dialog-message';
            msgEl.innerText = msg;
            card.appendChild(msgEl);

            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'calc-dialog-input-wrapper';

            const inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.className = 'calc-dialog-input';
            inputEl.value = defaultValue;

            // Надежный захват значения для мобильных устройств
            let currentValue = defaultValue;
            inputEl.oninput = (e) => { currentValue = e.target.value; };
            inputEl.onchange = (e) => { currentValue = e.target.value; };

            inputWrapper.appendChild(inputEl);
            card.appendChild(inputWrapper);

            const btnContainer = document.createElement('div');
            btnContainer.className = 'calc-dialog-buttons';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'calc-dialog-btn calc-dialog-btn-cancel';
            const isSharePrompt = msg && (msg.includes("Ссылка создана") || msg.includes("Скопируйте"));
            if (isSharePrompt) {
                cancelBtn.innerText = 'Копировать';
                cancelBtn.onclick = () => {
                    app.copyToClipboard(currentValue).then(() => {
                        cancelBtn.innerText = '✅ Скопировано!';
                        cancelBtn.style.backgroundColor = '#22c55e';
                        cancelBtn.style.color = '#ffffff';
                        setTimeout(() => {
                            overlay.classList.remove('active');
                            setTimeout(() => {
                                overlay.remove();
                                resolve(currentValue);
                            }, 200);
                        }, 800);
                    }).catch(err => {
                        console.error('Ошибка копирования:', err);
                        cancelBtn.innerText = 'Ошибка!';
                        cancelBtn.style.backgroundColor = '#ef4444';
                    });
                };
            } else {
                cancelBtn.innerText = 'Отмена';
                cancelBtn.onclick = () => {
                    overlay.classList.remove('active');
                    setTimeout(() => {
                        overlay.remove();
                        resolve(null);
                    }, 200);
                };
            }

            const okBtn = document.createElement('button');
            okBtn.className = 'calc-dialog-btn calc-dialog-btn-confirm';
            okBtn.innerText = 'OK';

            const submit = () => {
                // Берем актуальное значение (с fallback на currentValue)
                const val = (inputEl && inputEl.value !== undefined) ? inputEl.value : currentValue;
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.remove();
                    resolve(val);
                }, 200);
            };

            okBtn.onclick = submit;
            inputEl.onkeydown = (e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') {
                    overlay.classList.remove('active');
                    setTimeout(() => {
                        overlay.remove();
                        resolve(null);
                    }, 200);
                }
            };

            btnContainer.appendChild(cancelBtn);
            btnContainer.appendChild(okBtn);
            card.appendChild(btnContainer);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.classList.add('active');
                // Двойной фокус для надежности на iOS
                inputEl.focus();
                inputEl.select();
                setTimeout(() => {
                    inputEl.focus();
                }, 50);
            }, 10);
        });
    },

    copyToClipboard: function (text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((resolve, reject) => {
                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (successful) {
                        resolve();
                    } else {
                        reject(new Error("document.execCommand('copy') failed"));
                    }
                } catch (err) {
                    document.body.removeChild(textArea);
                    reject(err);
                }
            });
        }
    },

    _saveRateLimit: { count: 0, lastReset: 0 },
    _adminOffset: 0,
    _adminPageSize: 30,
    _authHandling: false,
    currentAuthTab: 'login',
    pendingRegistration: null,
    adminData: { users: [], estimates: [], recentEstimates: [], userEstimates: [] },
    state: { waterInput: false, outdoorFaucet: false, bigBlueFilter: false, heatingFeed: false, convConnectionType: 'straight', detailedRooms: false, rooms: [], convectorType: 'scq', well: false, wellDepth: 30, wellDist: 15, wellAutoType: 'sirio', h1: 2.7, h2: 2.7, viewMode: 'equipment', showScheme: false, optItems: {}, darkMode: false, area: 150, floors: 1, region: 100, mat: 1.0, fuels: ['el'], systems: [], hotWater: false, recirc: false, res: 3, win: 4, tp1: 0, tp2: 0, showSku: false, coolant: 'water', groupItems: false, collapsedGroups: [], swaps: {}, showSwapFor: null, radType: 'space', headType: 'gas', connectionType: 'angled', boilerType: 'optibase', ufhZones: 1, ufhCtrl: 'mech', pumpType: 'default', boilerSeries: 'status', hydroType: 'combo', pipeType: 'insulated', ufhBaseType: 'mat', radManifoldType: 'standard', water: false, waterZones: [], ufhAuto: false, projectName: "", brandMode: "stout", customWorks: {}, showImages: true, eqDiscount: 0, customCompany: null },

    lastSavedStateString: "",

    get currentUser() {
        return this.state.tgUser || {};
    },

    getStateSignature: function () {
        let s = { ...this.state };
        // Удаляем чисто визуальные параметры, чтобы они не вызывали кнопку "Сохранить"
        delete s.viewMode;
        delete s.darkMode;
        delete s.collapsedGroups;
        delete s.showSwapFor;
        delete s.tgUser;
        delete s.accountType;
        delete s.demoUsed;
        return JSON.stringify(s);
    },

    updateSaveBtnUI: function () {
        if (this.hasUnsavedChanges) {
            this.markAsUnsaved();
        } else {
            this.markAsSaved();
        }
    },

    getGeoLocation: async function () {
        try { let res = await fetch('https://ipapi.co/json/'); let data = await res.json(); if (data && data.city && data.country_name) return data.city + ', ' + data.country_name; } catch (e) { }
        return '';
    },
    initMobileMenu: function () {
        if (document.getElementById('mobile-sidebar')) return;

        const sidebar = document.createElement('div');
        sidebar.id = 'mobile-sidebar';
        sidebar.className = 'mobile-sidebar';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'auth-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '15px';
        closeBtn.style.right = '20px';
        closeBtn.style.zIndex = '10';
        closeBtn.onclick = () => app.toggleMenu();
        sidebar.appendChild(closeBtn);

        const content = document.createElement('div');
        content.id = 'mobile-sidebar-content';
        content.className = 'mobile-sidebar-content';
        sidebar.appendChild(content);

        document.body.appendChild(sidebar);

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                if (document.body.classList.contains('menu-open')) {
                    app.toggleMenu();
                } else {
                    app.restoreDesktopLayout();
                }
            }
        });
    },

    toggleMenu: function () {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;

        this.initMobileMenu();

        const isOpen = document.body.classList.toggle('menu-open');
        const sidebarContent = document.getElementById('mobile-sidebar-content');

        const authBlock = document.getElementById('tg-auth-container');
        const mainControls = document.querySelector('.header-main-controls');
        const skuControl = document.querySelector('.sku-control');
        const mobileTotals = document.getElementById('mobile_header_totals');
        const footerBtns = document.querySelector('.footer-btns');

        if (isOpen) {
            if (authBlock) sidebarContent.appendChild(authBlock);
            if (mobileTotals) sidebarContent.appendChild(mobileTotals);
            if (mainControls) sidebarContent.appendChild(mainControls);
            if (skuControl) sidebarContent.appendChild(skuControl);
            if (footerBtns) sidebarContent.appendChild(footerBtns);
        } else {
            this.restoreDesktopLayout();
        }
    },

    restoreDesktopLayout: function () {
        const authBlock = document.getElementById('tg-auth-container');
        const mainControls = document.querySelector('.header-main-controls');
        const skuControl = document.querySelector('.sku-control');
        const mobileTotals = document.getElementById('mobile_header_totals');

        const headerRight = document.querySelector('.site-header-right');
        const toggleBtn = document.querySelector('.menu-toggle-btn');
        const headerRow = document.querySelector('.doc-header .header-row');
        const siteHeaderLeft = document.querySelector('.site-header-left');

        if (mobileTotals && siteHeaderLeft && siteHeaderLeft.parentNode && !siteHeaderLeft.parentNode.contains(mobileTotals)) {
            siteHeaderLeft.parentNode.insertBefore(mobileTotals, siteHeaderLeft.nextSibling);
        }
        if (authBlock && headerRight && !headerRight.contains(authBlock)) {
            headerRight.insertBefore(authBlock, toggleBtn);
        }
        if (mainControls && headerRight && !headerRight.contains(mainControls)) {
            headerRight.appendChild(mainControls);
        }
        if (skuControl && headerRow && !headerRow.contains(skuControl)) {
            headerRow.appendChild(skuControl);
        }

        const footerBtns = document.querySelector('.footer-btns');
        const printDisclaimer = document.querySelector('.print-disclaimer');
        if (footerBtns && printDisclaimer && printDisclaimer.parentNode && !printDisclaimer.parentNode.contains(footerBtns)) {
            printDisclaimer.parentNode.insertBefore(footerBtns, printDisclaimer);
        }
    },

    // Плавная анимация бегущих цифр (эффект кассы)
    animateNumber: function (obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            // Вычисляем прогресс от 0 до 1
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Супер-вязкое замедление к концу анимации (степень 8)
            const easeOut = 1 - Math.pow(1 - progress, 8);
            const currentVal = Math.floor(start + easeOut * (end - start));

            obj.innerText = currentVal.toLocaleString('ru-RU') + " ₽";

            if (progress < 1) {
                // Продолжаем анимацию
                obj.dataset.animId = window.requestAnimationFrame(step);
            } else {
                // Финализируем точным значением
                obj.innerText = end.toLocaleString('ru-RU') + " ₽";
            }
        };

        // Отменяем предыдущую анимацию, если цифра снова изменилась до завершения старой
        if (obj.dataset.animId) window.cancelAnimationFrame(obj.dataset.animId);
        obj.dataset.animId = window.requestAnimationFrame(step);
    },
    // === ЛОГИКА ОТСЛЕЖИВАНИЯ НЕ-СОХРАНЕНИЯ ===
    hasUnsavedChanges: false,

    // Включить красную подсветку
    markAsUnsaved: function () {
        this.hasUnsavedChanges = true;
        let btn = document.getElementById('btn_save_main');
        if (btn) {
            btn.classList.add('btn-unsaved');
            btn.setAttribute('title', 'Параметры изменены и не сохранены в облако!');
        }
    },

    // Выключить красную подсветку (после сохранения)
    markAsSaved: function () {
        this.hasUnsavedChanges = false;
        let btn = document.getElementById('btn_save_main');
        if (btn) {
            btn.classList.remove('btn-unsaved');
            btn.setAttribute('title', 'Сохранить текущую смету в облако');
        }
    },
    captureUTM: function () {
        try {
            let params = new URLSearchParams(window.location.search);
            let s = params.get('utm_source'), m = params.get('utm_medium'), c = params.get('utm_campaign');
            if (s || m || c) {
                let arr = [];
                if (s) arr.push(`src: ${s}`); if (m) arr.push(`med: ${m}`); if (c) arr.push(`cmp: ${c}`);
                localStorage.setItem('stout_utm', arr.join(' | '));
            }
        } catch (e) { }
    },
    setProjectName: function (val) {
        if (!this.checkAccess('base')) { this.syncUI(); return; }
        let clean = String(val).trim();
        // Защита от системных глюков и плейсхолдера
        if (clean === "Название объекта" || clean === "true" || clean === "false") {
            clean = "";
        }
        this.state.projectName = clean;
        this.saveState();
        this.updateDocumentTitle();
    },

    setEqDiscount: function (val) {
        if (!this.checkAccess('pro', window.event)) {
            this.render();
            return;
        }
        let num = parseInt(val) || 0;
        if (num < 0) num = 0;
        if (num > 20) num = 20;
        this.state.eqDiscount = num;
        this.saveState();
        this.render();
    },

    updateHeaderCompanyDetails: function () {
        let isPro = this.isPro();
        let cc = (isPro && this.state.customCompany) ? this.state.customCompany : null;
        
        let defName = "Общество с ограниченной ответственностью «ТЕРЕМ»";
        let defWeb = "www.teremopt.ru";
        let defLogo = "img/logo.jpg";
        let defAddr = "<strong>ЦЕНТРАЛЬНЫЙ ОФИС:</strong><br>Россия, 123100, г. Москва<br>вн. тер.г. муниципального округа Пресненский, 2-я Звенигородская ул., д. 12, стр. 1, помещ. 16н<br>тел.: +7 (495) 775-20-20, факс: +7 (495) 775-20-25";
        let defBank = "<strong>РЕКВИЗИТЫ БАНКА:</strong><br>ИНН 7729646148<br>Р/сч. 40702810638110013275<br>Московский банк Сбербанка России ОАО г. Москва<br>К/сч. 30101810400000000225";

        let elName = document.getElementById('hdr_comp_name');
        let elWeb = document.getElementById('hdr_comp_web');
        let elLogo = document.getElementById('hdr_comp_logo');
        let elAddr = document.getElementById('hdr_comp_addr');
        let elBank = document.getElementById('hdr_comp_bank');

        const formatBrandingText = function(text, defaultHtml) {
            if (!text) return defaultHtml;
            let lines = text.split('\n');
            if (lines.length > 0 && lines[0].trim() !== '') {
                if (!lines[0].includes('<strong>') && !lines[0].includes('<b>')) {
                    lines[0] = `<strong>${lines[0].trim()}</strong>`;
                }
            }
            return lines.join('<br>');
        };

        if (elName) elName.innerText = (cc && cc.name) ? cc.name : defName;
        if (elWeb) elWeb.innerText = (cc && cc.website) ? cc.website : defWeb;
        if (elLogo) elLogo.src = (cc && cc.logo) ? cc.logo : defLogo;
        if (elAddr) elAddr.innerHTML = (cc && cc.address) ? formatBrandingText(cc.address, defAddr) : defAddr;
        if (elBank) elBank.innerHTML = (cc && cc.bank) ? formatBrandingText(cc.bank, defBank) : defBank;
    },

    handleProfileLogoUpload: function (event) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 1048576) {
            app.alert("Ошибка: размер изображения логотипа превышает 1МБ.");
            event.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.state.customCompany = this.state.customCompany || {};
            this.state.customCompany.logo = dataUrl;
            
            const imgPreview = document.getElementById('profile_logo_preview');
            if (imgPreview) imgPreview.src = dataUrl;
            
            this.updateHeaderCompanyDetails();
            app.alert("✅ Логотип успешно загружен!");
        };
        reader.readAsDataURL(file);
    },

    resetProfileLogo: function () {
        this.state.customCompany = this.state.customCompany || {};
        this.state.customCompany.logo = "";
        const imgPreview = document.getElementById('profile_logo_preview');
        if (imgPreview) imgPreview.src = "img/logo.jpg";
        this.updateHeaderCompanyDetails();
        app.alert("✅ Логотип сброшен на стандартный ТЕРЕМ!");
    },

    resetCompanyDetails: function () {
        this.state.customCompany = { name: "", website: "", address: "", bank: "", logo: "" };
        if (document.getElementById('profile_company_name')) document.getElementById('profile_company_name').value = "";
        if (document.getElementById('profile_company_website')) document.getElementById('profile_company_website').value = "";
        if (document.getElementById('profile_company_address')) document.getElementById('profile_company_address').value = "";
        if (document.getElementById('profile_company_bank')) document.getElementById('profile_company_bank').value = "";
        const imgPreview = document.getElementById('profile_logo_preview');
        if (imgPreview) imgPreview.src = "img/logo.jpg";
        this.updateHeaderCompanyDetails();
        this.saveState();
        app.alert("✅ Все реквизиты компании сброшены на стандартные!");
    },

    toggleBrandingSection: function () {
        let compSec = document.getElementById('pro_profile_company_section');
        let btn = document.getElementById('toggle_branding_btn');
        let modalContent = document.querySelector('#profile_modal_overlay .auth-modal-content');
        if (compSec) {
            if (compSec.style.display === 'none') {
                compSec.style.display = 'block';
                if (btn) btn.innerHTML = '✕ Скрыть реквизиты';
                if (modalContent) modalContent.style.maxWidth = '760px';
            } else {
                compSec.style.display = 'none';
                if (btn) btn.innerHTML = '⚙️ Настроить логотип и реквизиты';
                if (modalContent) modalContent.style.maxWidth = '380px';
            }
        }
    },

    setBrand: function (val, event) {
        if (!this.checkAccess('pro', event)) {
            let chk = document.getElementById('chk_cheaper');
            if (chk) chk.checked = (this.state.brandMode === 'rommer');
            return;
        }
        this.state.brandMode = val;
        this.saveState();
        this.render();
    },

    toggleWaterInput: function (val) {
        this.state.waterInput = !!val;
        this.saveState();
        this.syncUI();
        this.render();
    },

    toggleState: function (key, val) {
        this.state[key] = !!val;
        this.saveState(); this.render();
    },

    // Открыть ввод своего оборудования (аналог монтажных работ)
    addCustomEqPrompt: async function () {
        let name = await app.prompt("Введите наименование оборудования:");
        if (!name) return;
        let price = parseFloat(await app.prompt("Введите цену за единицу, ₽:", "0")) || 0;
        let qty = parseInt(await app.prompt("Введите количество, шт:", "1")) || 1;

        if (!this.state.userAddedEq) this.state.userAddedEq = [];
        this.state.userAddedEq.push({
            id: 'custom_' + Date.now(),
            name: name,
            price: price,
            q: qty,
            brand: " ", // Пробел обманывает дефолтную проверку, чтобы не писался STOUT
            desc: "Добавлено самостоятельно в ручном режиме" // Включает системный значок (i)
        });
        this.saveState();
        this.render();
    },

    // Удаление своего оборудования
    deleteEq: function (id) {
        if (!this.state.userAddedEq) return;
        this.state.userAddedEq = this.state.userAddedEq.filter(eq => eq.id !== id);
        this.saveState();
        this.render();
    },

    setH: function (floor, val) {
        let v = parseFloat(val);
        if (isNaN(v) || v < 2.7) v = 2.7;
        if (v > 5.0) v = 5.0;
        if (floor === 1) this.state.h1 = v; else this.state.h2 = v;
        this.saveState(); this.syncUI(); this.render();
    },

    toggleScheme: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            let el = document.getElementById('chk_scheme');
            if (el) el.checked = false;
            return;
        }
        this.state.showScheme = !!chk;
        this.saveState();
        this.render();
    },

    isPro: function () {
        let trialUntil = parseInt(localStorage.getItem('pro_trial_until')) || 0;
        let isTrialActive = trialUntil > Date.now();
        return this.state.accountType === 'pro' || isTrialActive;
    },

    checkAccess: function (featureLvl, event) {
        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocal) {
            return true;
        }

        let isGuest = !this.state.tgUser;
        let isPro = this.isPro();

        if (isGuest) {
            if (event) event.preventDefault();
            this.showAuthModal();
            return false;
        }
        if (featureLvl === 'pro' && !isPro) {
            if (event) event.preventDefault();
            this.showModal('pro');
            return false;
        }
        return true;
    },

    showModal: function (type) {
        let overlay = document.getElementById('custom_modal_overlay');
        let icon = document.getElementById('custom_modal_icon');
        let title = document.getElementById('custom_modal_title');
        let text = document.getElementById('custom_modal_text');
        let okBtn = document.getElementById('custom_modal_btn_ok');

        // Сброс состояния окна (показываем карточки, скрываем форму и сообщение об успехе)
        this.showProCards();
        let msg = document.getElementById('pro_success_message');
        if (msg) msg.style.display = 'none';

        if (type === 'guest') {
            if (icon) {
                icon.style.display = 'block';
                icon.innerHTML = "🔒";
            }
            if (title) title.innerHTML = "Требуется авторизация";
            if (text) text.innerHTML = "Авторизуйтесь через Email, Google, чтобы получить доступ к этой функции.";
            let trialBtn = document.getElementById('custom_modal_btn_trial');
            if (trialBtn) trialBtn.style.display = 'none';
            let cards = document.querySelector('.tariff-cards');
            if (cards) cards.style.display = 'none';

            if (okBtn) {
                okBtn.innerText = "Войти в аккаунт";
                okBtn.onclick = function () { app.closeModal(); app.showAuthModal(); };
                okBtn.style.display = 'block';
            }
        } else if (type === 'pro') {
            if (icon) {
                icon.style.display = 'none';
                icon.innerHTML = "";
            }
            if (title) title.innerHTML = "Подписка PRO";
            if (text) text.innerHTML = "Преимущества подписки: подбор всех разделов (котельная, радиаторы, теплый пол, водоснабжение, канализация) монтажные работы, артикулы, подбор аналогов, формирование кп в pdf, excel.";

            let cards = document.querySelector('.tariff-cards');
            if (cards) cards.style.display = 'flex';

            if (okBtn) {
                okBtn.style.display = 'none';
            }

            let trialBtn = document.getElementById('custom_modal_btn_trial');
            if (trialBtn) {
                if (this.state.tgUser && this.state.accountType !== 'pro') {
                    trialBtn.style.display = 'block';
                } else {
                    trialBtn.style.display = 'none';
                }
            }
        }
        if (overlay) overlay.classList.add('active');
    },

    closeModal: function () {
        let overlay = document.getElementById('custom_modal_overlay');
        if (overlay) overlay.classList.remove('active');
    },

    activateTrial: function () {
        // Текущее время + 3 дня в мс
        const trialUntil = Date.now() + 3 * 24 * 60 * 60 * 1000;
        localStorage.setItem('pro_trial_until', trialUntil);

        this.closeModal();
        app.alert('✅ Тестовый период на 3 дня успешно активирован!');

        // Синхронизируем UI и перерисовываем смету без перезагрузки страницы
        this.syncUI();
        this.render();
    },

    formatPhone: function (e) {
        let el = e.target;
        let val = el.value.replace(/\D/g, '');

        if (!val) {
            el.value = '';
            return;
        }

        // Форматирование для РФ (+7 / 8)
        if (['7', '8', '9'].includes(val[0])) {
            if (val[0] === '9') val = '7' + val; // Если начали ввод с 9, подставляем 7
            let formatted = '+7 ';
            if (val.length > 1) formatted += '(' + val.substring(1, 4);
            if (val.length >= 5) formatted += ') ' + val.substring(4, 7);
            if (val.length >= 8) formatted += '-' + val.substring(7, 9);
            if (val.length >= 10) formatted += '-' + val.substring(9, 11);
            el.value = formatted;
        } else {
            // Для номеров других стран
            el.value = '+' + val.substring(0, 15);
        }
    },

    showProCards: function () {
        document.getElementById('pro_main_content').style.display = 'block';
        let msg = document.getElementById('pro_success_message');
        if (msg) msg.style.display = 'none';
    },

    activateTrial14: async function () {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;

        const authUserId = session?.user?.id || tgUser?.authUserId || (tgUser?.id && !/^\d+$/.test(String(tgUser.id)) ? tgUser.id : null);
        const email = session?.user?.email || tgUser?.email;
        const dbId = tgUser?.id; // can be the primary key UUID/int in some contexts

        if (!authUserId && !email && !dbId) {
            app.alert("Сначала авторизуйтесь!");
            return;
        }

        let btn = document.getElementById('custom_modal_btn_trial');
        if (btn) btn.innerText = "Активация...";

        try {
            // Дата окончания = текущее время + 14 суток
            let trialDurationMs = 14 * 24 * 60 * 60 * 1000;
            let endDate = new Date(Date.now() + trialDurationMs).toISOString();

            // Сначала найдем пользователя в БД по любому доступному признаку
            let uRow = null;
            if (authUserId) {
                let { data } = await supabaseClient.from('users').select('id, demo_ends_at').eq('auth_user_id', authUserId).maybeSingle();
                uRow = data;
            }
            if (!uRow && email) {
                let { data } = await supabaseClient.from('users').select('id, demo_ends_at').eq('email', email).maybeSingle();
                uRow = data;
            }
            if (!uRow && dbId) {
                let { data } = await supabaseClient.from('users').select('id, demo_ends_at').eq('id', dbId).maybeSingle();
                uRow = data;
            }

            if (!uRow) {
                app.alert("Профиль пользователя не найден в базе данных. Пожалуйста, попробуйте перезайти в аккаунт.");
                if (btn) btn.innerText = "Попробовать бесплатно 14 дней";
                return;
            }

            if (uRow.demo_ends_at) {
                app.alert("Пробный период уже был активирован ранее.");
                this.state.demoUsed = true;
                this.saveState();
                if (btn) btn.style.display = 'none';
                return;
            }

            // Обновляем статус
            const { error } = await supabaseClient.from('users').update({ account_type: 'pro', demo_ends_at: endDate }).eq('id', uRow.id);

            if (error) throw error;

            this.state.accountType = 'pro';
            this.state.demoUsed = true;
            localStorage.setItem('pro_trial_until', Date.now() + trialDurationMs);
            
            if (this.state.tgUser) {
                this.state.tgUser.account_type = 'pro';
                if (!this.state.tgUser.id) {
                    this.state.tgUser.id = uRow.id;
                }
            }
            
            this.saveState();
            this.syncUI();
            this.closeModal();

            app.alert("✅ Пробный период на 14 дней успешно активирован! Вам открыты все PRO функции.");
        } catch (e) {
            console.error("Ошибка активации:", e);
            app.alert("Ошибка активации. Попробуйте позже.");
            if (btn) btn.innerText = "Попробовать бесплатно 14 дней";
        }
    },

    saveToCloud: async function (silent = false) {
        console.log("[saveToCloud] Функция запущена. Silent:", silent);
        const now = Date.now();
        if (now - this._saveRateLimit.lastReset > 60000) {
            this._saveRateLimit.count = 0;
            this._saveRateLimit.lastReset = now;
        }
        this._saveRateLimit.count++;
        if (this._saveRateLimit.count > 5) {
            app.alert("Слишком много запросов на сохранение. Пожалуйста, подождите минуту.");
            return false;
        }

        try {
            // === ПРОВЕРКА АВТОРИЗАЦИИ ===
            const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

            console.log("[saveToCloud] Запрашиваем сессию Supabase...");
            const { data: { session } } = await supabaseClient.auth.getSession();
            console.log("[saveToCloud] Сессия Supabase получена:", session ? "Активна" : "Нет сессии");

            if (!session && !isLocal) {
                console.log("[saveToCloud] Сессия отсутствует, показываем окно авторизации");
                this.showAuthModal();
                return false;
            }

            let pName = this.state.projectName;
            if (!pName) {
                pName = await app.prompt("Введите название объекта для сохранения в облаке:", "Новый объект");
                if (!pName) {
                    console.log("[saveToCloud] Сохранение отменено пользователем (ввод названия объекта)");
                    return false;
                }
                this.state.projectName = pName;
                this.saveState();
                this.syncUI();
                this.render();
            }

            // Проверка наличия города (ищем в стейте, в полях профиля или в localStorage)
            let userCity = (this.state.tgUser && this.state.tgUser.city) ||
                (this.state.user && this.state.user.city) ||
                (document.getElementById('profile_city_input') ? document.getElementById('profile_city_input').value.trim() : null) ||
                localStorage.getItem('user_city');

            if (!userCity) {
                userCity = await app.prompt("Пожалуйста, укажите ваш город для корректного выставления счёта:");
                if (!userCity || userCity.trim() === '') {
                    console.log("[saveToCloud] Сохранение отменено пользователем (ввод города)");
                    await app.alert("Действие отменено: город обязателен для формирования счёта.");
                    return false; // Прерываем выполнение
                }
                // Сохраняем город для текущей сессии
                localStorage.setItem('user_city', userCity.trim());
                if (this.state.tgUser) {
                    this.state.tgUser.city = userCity.trim();
                    this.saveState();
                } else if (this.state.user) {
                    this.state.user.city = userCity.trim();
                    this.saveState();
                }
            }

            let eq = app.lastEqSum || 0;
            let wk = (this.state.accountType === 'pro') ? (app.lastWorksSum || 0) : 0;
            const total = eq + wk;

            const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;

            let dbUserId = null;
            if (tgUser && tgUser.id) {
                dbUserId = tgUser.id;
            }
            if (!dbUserId && (tgUser || session)) {
                // Пытаемся получить UUID пользователя из сессии или стейта
                const authUserId = session ? session.user.id : (tgUser ? tgUser.authUserId : null);
                const email = session ? session.user.email : (tgUser ? tgUser.email : null);

                console.log("[saveToCloud] Поиск пользователя в БД. authUserId:", authUserId, "email:", email);
                if (authUserId) {
                    console.log("[saveToCloud] Запрос users по authUserId...");
                    let { data: uData } = await supabaseClient.from('users').select('id').eq('auth_user_id', authUserId).maybeSingle();
                    if (uData) dbUserId = uData.id;
                } else if (email) {
                    console.log("[saveToCloud] Запрос users по email...");
                    let { data: uData } = await supabaseClient.from('users').select('id').eq('email', email).maybeSingle();
                    if (uData) dbUserId = uData.id;
                }
                console.log("[saveToCloud] Найден ID пользователя в БД:", dbUserId);
            }

            // Если в режиме разработки и пользователя нет в БД - используем заглушку или предупреждаем
            if (!dbUserId && !isLocal) {
                console.warn("[saveToCloud] Профиль пользователя не найден в БД. Сохраняем расчет без привязки к user_id.");
            }

            const insertData = {
                project_name: pName,
                share_id: this.state.calc_id || null,
                calc_data: this.state,
                total_sum: total,
                eq_sum: eq,
                works_sum: wk,
                user_id: dbUserId
            };

            let saveError = null;
            if (this.state.calc_id) {
                console.log("[saveToCloud] Проверяем существование сметы в БД с share_id:", this.state.calc_id);
                // Проверяем наличие записи с таким share_id
                const { data: existing } = await supabaseClient
                    .from('estimates')
                    .select('id, user_id')
                    .eq('share_id', this.state.calc_id)
                    .limit(1);

                console.log("[saveToCloud] Результат проверки сметы в БД:", existing);
                if (existing && existing.length > 0) {
                    // Безопасность: обновляем ТОЛЬКО если запись принадлежит текущему пользователю
                    if (String(existing[0].user_id) === String(dbUserId)) {
                        console.log("[saveToCloud] Смета своя. Обновляем...");
                        const { error } = await supabaseClient
                            .from('estimates')
                            .update(insertData)
                            .eq('id', existing[0].id);
                        saveError = error;
                    } else {
                        console.log("[saveToCloud] Смета чужая или анонимная попытка перезаписи. Создаем копию...");
                        const { error } = await supabaseClient
                            .from('estimates')
                            .insert([insertData]);
                        saveError = error;
                    }
                } else {
                    console.log("[saveToCloud] Сметы с таким share_id нет. Создаем...");
                    // Создаем новую запись
                    const { error } = await supabaseClient
                        .from('estimates')
                        .insert([insertData]);
                    saveError = error;
                }
            } else {
                console.log("[saveToCloud] У сметы нет share_id. Создаем новую запись...");
                // Если кода нет - всегда вставляем новую запись
                const { error } = await supabaseClient
                    .from('estimates')
                    .insert([insertData]);
                saveError = error;
            }

            if (saveError) {
                console.error("[saveToCloud] Возникла ошибка при сохранении записи:", saveError);
                throw saveError;
            }

            this.lastSavedStateString = this.getStateSignature();
            this.markAsSaved();
            console.log("[saveToCloud] Сохранение успешно завершено.");
            if (!silent) app.alert("✅ Смета успешно сохранена!");
            return true;
        } catch (error) {
            console.error("[saveToCloud] Критическая ошибка в блоке catch:", error);
            app.alert("❌ Ошибка при сохранении в облако: " + error.message);
            return false;
        }
    },

    loadFromCloudList: async function () {
        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const { data: { session } } = await supabaseClient.auth.getSession();
        const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;

        if (!session && !isLocal) {
            app.alert("Для просмотра сохраненных смет необходимо авторизоваться.");
            this.showAuthModal();
            return;
        }

        document.getElementById('cloud_list_modal_overlay').style.display = 'flex';
        document.getElementById('cloud_list_content').innerHTML = '<div style="text-align: center; color: var(--text-sec); padding: 50px;">Загрузка списка...</div>';

        try {
            let uRow = null;
            if (session) {
                let { data } = await supabaseClient.from('users').select('id, account_type, email').eq('auth_user_id', session.user.id).maybeSingle();
                uRow = data;
            } else if (tgUser) {
                if (tgUser.authUserId) {
                    let { data } = await supabaseClient.from('users').select('id, account_type, email').eq('auth_user_id', tgUser.authUserId).maybeSingle();
                    uRow = data;
                }
            }

            // Фоллбек для локального тестирования
            if (!uRow && isLocal) {
                uRow = { id: '0279a53c-452b-474f-8626-08be2c2b32da', account_type: 'base', email: 'dima24ba@gmail.com' };
            }

            // Безопасность: если пользователь не найден в БД — не показываем ничего
            if (!uRow) {
                document.getElementById('cloud_list_content').innerHTML = '<div style="text-align: center; color: var(--text-sec); padding: 50px;">Профиль пользователя не найден. Попробуйте перезайти в аккаунт.</div>';
                return;
            }

            let query = supabaseClient.from('estimates').select('id, project_name, total_sum, created_at, user_id, calc_data').order('created_at', { ascending: false }).limit(50);

            const isAdmin = uRow.email && ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'].includes(uRow.email.toLowerCase());
            if (!isAdmin) {
                // Обычный пользователь видит ТОЛЬКО свои сметы
                query = query.eq('user_id', uRow.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const estimates = data || [];
            const sharedIds = estimates.map(e => e.calc_data?.shared_invoice_id).filter(Boolean);

            let sharedStatuses = {};
            if (sharedIds.length > 0) {
                try {
                    const { data: sharedList, error: sharedError } = await supabaseClient
                        .from('shared_invoices')
                        .select('id, object_info')
                        .in('id', sharedIds);

                    if (!sharedError && sharedList) {
                        sharedList.forEach(item => {
                            sharedStatuses[item.id] = item.object_info?.status || 'sent';
                        });
                    }
                } catch (e) {
                    console.error("Error fetching shared invoice statuses:", e);
                }
            }

            this._cloudEstimates = estimates;
            this._currentUserRow = uRow;
            this.renderCloudList(this._cloudEstimates, sharedStatuses);
        } catch (error) {
            document.getElementById('cloud_list_content').innerHTML = `<div style="padding:20px; color:#EF4444;">Ошибка: ${error.message}</div>`;
        }
    },

    renderCloudList: function (data, sharedStatuses = {}) {
        const content = document.getElementById('cloud_list_content');
        if (!data || data.length === 0) {
            content.innerHTML = '<div style="text-align: center; color: var(--text-sec); padding: 50px;">У вас пока нет сохраненных смет.</div>';
            return;
        }

        const isAdmin = this._currentUserRow && this._currentUserRow.email && ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'].includes(this._currentUserRow.email.toLowerCase());
        const currentUserId = this._currentUserRow ? this._currentUserRow.id : null;

        let h = `
            <table class="inv-table">
                <thead>
                    <tr>
                        <th>Название объекта</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                        <th>Дата</th>
                        <th style="text-align:right;">Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(item => {
            const date = new Date(item.created_at).toLocaleDateString();
            const sum = item.total_sum ? item.total_sum.toLocaleString() + " ₽" : "0 ₽";
            const canDelete = isAdmin || (currentUserId && String(item.user_id) === String(currentUserId));

            const sharedInvoiceId = item.calc_data?.shared_invoice_id;
            let statusBadge = `<span class="status-badge-cabinet status-cabinet-saved">Сохранена</span>`;
            if (sharedInvoiceId) {
                const status = sharedStatuses[sharedInvoiceId];
                if (status === 'confirmed') {
                    statusBadge = `<span class="status-badge-cabinet status-cabinet-confirmed" title="Смета согласована клиентом">Одобрена</span>`;
                } else if (status === 'needs_revision') {
                    statusBadge = `<span class="status-badge-cabinet status-cabinet-revision" title="Клиент просит внести правки">На доработке</span>`;
                } else {
                    statusBadge = `<span class="status-badge-cabinet status-cabinet-sent" title="Ссылка отправлена клиенту">Отправлена</span>`;
                }
            }

            // Кнопка "Получить счёт" если статус confirmed
            const isConfirmed = sharedInvoiceId && sharedStatuses[sharedInvoiceId] === 'confirmed';
            let getInvoiceBtn = '';
            if (isConfirmed) {
                getInvoiceBtn = `<button class="btn-get-invoice" id="btn_invoice_${item.id}" onclick="event.stopPropagation(); app.sendEstimateInvoiceToManager('${item.id}', this)" title="Заказать счёт у менеджера">📄 Получить счёт</button>`;
            }

            h += `
                <tr class="active-row" style="cursor: pointer;" onclick="app.loadSingleEstimate('${item.id}')">
                    <td style="font-weight:600;">${item.project_name}</td>
                    <td style="color:var(--primary); font-weight:bold;">${sum}</td>
                    <td>${statusBadge}</td>
                    <td style="color:var(--text-sec); font-size:12px;">${date}</td>
                    <td style="text-align:right;">
                        <div style="display:flex; justify-content:flex-end; gap:8px; align-items: center;">
                            ${getInvoiceBtn}
                            ${canDelete ? `
                                <button class="delete-icon-btn" onclick="event.stopPropagation(); app.deleteEstimate('${item.id}', event)" title="Удалить смету">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        h += `</tbody></table>`;
        content.innerHTML = h;
    },

    closeCloudListModal: function () {
        document.getElementById('cloud_list_modal_overlay').style.display = 'none';
    },

    sendEstimateInvoiceToManager: async function (estimateId, btnEl) {
        try {
            // Оптимистичный UI
            if (btnEl) {
                btnEl.disabled = true;
                btnEl.innerHTML = '⌛ Отправка...';
            }

            // Ищем смету в кеше
            const est = (this._cloudEstimates || []).find(e => String(e.id) === String(estimateId));
            if (!est || !est.calc_data) {
                await app.alert('Данные сметы не найдены. Попробуйте обновить список.');
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '📄 Получить счёт'; }
                return;
            }

            const tgUser = this.state.tgUser;
            if (!tgUser || !tgUser.email) {
                await app.alert('Пожалуйста, укажите Email в профиле для получения счёта.');
                this.showProfileModal();
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '📄 Получить счёт'; }
                return;
            }

            const EMAILJS_SERVICE_ID = "service_o11b4ej";
            const EMAILJS_TEMPLATE_ID = "template_lg1zol9";
            const EMAILJS_PUBLIC_KEY = "-m4N93pTqMlCfuBpT";

            const eqSum = est.eq_sum || 0;
            const worksSum = est.works_sum || 0;
            const total = eqSum + worksSum;

            const baseOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.origin : 'https://heatcalc.ru';
            const viewUrl = `${baseOrigin}/invoice.html?id=${estimateId}`;
            const managerViewUrl = `${viewUrl}&manager=1`;

            const templateParams = {
                project_name: est.project_name || "Без названия",
                calc_id: est.calc_data.calc_id || 'N/A',
                user_name: tgUser.first_name || tgUser.username || "Монтажник",
                user_phone: tgUser.phone || "Не указан",
                user_email: tgUser.email || 'Не указан',
                user_city: tgUser.city || localStorage.getItem('user_city') || 'Не указан',
                user_status: (this.state.accountType === 'pro') ? "PRO" : "Базовый",
                area: est.calc_data.area || 0,
                region: est.calc_data.region || 100,
                boiler_type: "—",
                total_sum: eqSum.toLocaleString('ru-RU') + " ₽",
                equipment_list: `[Запрос счёта для согласованной сметы]\nОборудование: ${eqSum.toLocaleString('ru-RU')} ₽\nРаботы: ${worksSum.toLocaleString('ru-RU')} ₽\nИТОГО: ${total.toLocaleString('ru-RU')} ₽`,
                view_url: managerViewUrl
            };

            const job = {
                id: "invoice_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
                stateData: est.calc_data,
                eqSum: eqSum,
                worksSum: worksSum,
                templateParams: templateParams,
                serviceId: EMAILJS_SERVICE_ID,
                templateId: EMAILJS_TEMPLATE_ID,
                emailJsKey: EMAILJS_PUBLIC_KEY,
                retries: 0,
                status: "pending",
                created_at: Date.now()
            };

            if (this.queue && typeof this.queue.addJob === 'function') {
                this.queue.addJob(job);
            }

            if (btnEl) {
                btnEl.innerHTML = '✓ Счёт заказан';
                btnEl.style.background = '#059669';
                btnEl.style.opacity = '0.8';
            }

            this.showInAppNotification(
                'Запрос отправлен',
                `Счёт для «${est.project_name}» отправлен менеджеру. Ожидайте ответа на email.`,
                '📄'
            );

        } catch (error) {
            console.error('[sendEstimateInvoiceToManager] Error:', error);
            await app.alert('Ошибка при отправке запроса: ' + error.message);
            if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '📄 Получить счёт'; }
        }
    },

    deleteEstimate: async function (id, event) {
        if (event) event.stopPropagation();
        if (!await app.confirm("Вы уверены, что хотите удалить этот объект? Это действие необратимо.")) return;

        try {
            const { error } = await supabaseClient.from('estimates').delete().eq('id', id);
            if (error) throw error;

            // Optimistic Update
            if (this.adminData) {
                if (this.adminData.estimates) this.adminData.estimates = this.adminData.estimates.filter(e => String(e.id) !== String(id));
                if (this.adminData.recentEstimates) this.adminData.recentEstimates = this.adminData.recentEstimates.filter(e => String(e.id) !== String(id));
                if (this.adminData.userEstimates) this.adminData.userEstimates = this.adminData.userEstimates.filter(e => String(e.id) !== String(id));
            }
            if (this._cloudEstimates) {
                this._cloudEstimates = this._cloudEstimates.filter(e => String(e.id) !== String(id));
                this.renderCloudList(this._cloudEstimates);
            }

            const row = document.querySelector(`tr[onclick*="${id}"]`);
            if (row) row.style.display = 'none';

            app.alert("Объект успешно удален");
        } catch (error) {
            app.alert("Ошибка удаления: " + error.message);
        }
    },

    loadSingleEstimate: async function (id) {
        this.closeCloudListModal();
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;

            let query = supabaseClient.from('estimates').select('calc_data, user_id').eq('id', id);

            // Если мы не в режиме разработки, добавляем фильтр по текущему пользователю
            // (даже если RLS настроен, лишняя проверка на фронте не помешает)
            let userEmail = session ? session.user.email : (tgUser ? tgUser.email : null);
            if (userEmail && ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'].includes(userEmail.toLowerCase())) {
                // Пропускаем фильтрацию для админа
            } else if (session) {
                let { data: uData } = await supabaseClient.from('users').select('id').eq('auth_user_id', session.user.id).maybeSingle();
                if (uData) query = query.eq('user_id', uData.id);
            } else if (!isLocal) {
                throw new Error("Доступ запрещен. Пожалуйста, авторизуйтесь.");
            }

            const { data, error } = await query.single();
            if (error) throw error;

            let loadedState = data.calc_data;
            delete loadedState.tgUser; delete loadedState.accountType; delete loadedState.demoUsed; delete loadedState.darkMode;
            this.state = { ...this.state, ...loadedState };
            this.saveState(); this.syncUI(); this.render();

            this.lastSavedStateString = this.getStateSignature();
            this.hasUnsavedChanges = false;
            this.updateSaveBtnUI();
            app.alert("✅ Смета успешно загружена!");
        } catch (error) { app.alert("Ошибка загрузки сметы: " + error.message); }
    },

    loginGoogle: async function () {
        if (!document.getElementById('chk_terms').checked) {
            app.alert("Для продолжения необходимо принять условия Публичной оферты.");
            return;
        }
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google'
            });
            if (error) throw error;
        } catch (err) {
            console.error("Ошибка входа через Google:", err);
            app.alert("Ошибка при входе через Google: " + getFriendlyErrorMessage(err));
        }
    },

    logout: async function () {
        this._currentUserRow = null;
        this._cloudEstimates = null;
        this._authHandling = false;
        await supabaseClient.auth.signOut();
        delete this.state.tgUser; this.state.accountType = 'base';
        this.saveState(); this.syncUI(); this.render();
    },

    showAuthModal: function () {
        document.getElementById('auth_modal_overlay').style.display = 'flex';
        let tgWrapper = document.getElementById('auth_modal_tg_wrapper');
        if (tgWrapper && tgWrapper.children.length === 0) {
            let script = document.createElement('script');
            script.async = true;
            script.src = "https://telegram.org/js/telegram-widget.js?22";
            script.setAttribute("data-telegram-login", "stout_calc_bot");
            script.setAttribute("data-size", "large");
            script.setAttribute("data-onauth", "onTelegramAuth(user)");
            script.setAttribute("data-request-access", "write");
            tgWrapper.appendChild(script);
        }
    },
    closeAuthModal: function () { document.getElementById('auth_modal_overlay').style.display = 'none'; },

    showProfileModal: function () {
        let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;
        if (!tgUser) return;
        document.getElementById('profile_name_input').value = tgUser.first_name || tgUser.username || '';
        document.getElementById('profile_phone_input').value = tgUser.phone || '';
        document.getElementById('profile_city_input').value = tgUser.city || '';
        if (document.getElementById('profile_email_input')) {
            document.getElementById('profile_email_input').value = tgUser.email || '';
        }

        // Show/hide and populate PRO company branding settings
        let isPro = this.isPro();
        let compSec = document.getElementById('pro_profile_company_section');
        let toggleBtn = document.getElementById('toggle_branding_btn');
        if (compSec) {
            compSec.style.display = 'none'; // Keep hidden by default to keep modal clean and compact
            if (isPro) {
                let cc = this.state.customCompany || {};
                let defName = "Общество с ограниченной ответственностью «ТЕРЕМ»";
                let defWeb = "www.teremopt.ru";
                let defAddr = "Россия, 123100, г. Москва\nвн. тер.г. муниципального округа Пресненский, 2-я Звенигородская ул., д. 12, стр. 1, помещ. 16н\nтел.: +7 (495) 775-20-20, факс: +7 (495) 775-20-25";
                let defBank = "ИНН 7729646148\nР/сч. 40702810638110013275\nМосковский банк Сбербанка России ОАО г. Москва\nК/сч. 30101810400000000225";

                document.getElementById('profile_company_name').value = (cc.name !== undefined && cc.name !== null && cc.name !== '') ? cc.name : defName;
                document.getElementById('profile_company_website').value = (cc.website !== undefined && cc.website !== null && cc.website !== '') ? cc.website : defWeb;
                document.getElementById('profile_company_address').value = (cc.address !== undefined && cc.address !== null && cc.address !== '') ? cc.address : defAddr;
                document.getElementById('profile_company_bank').value = (cc.bank !== undefined && cc.bank !== null && cc.bank !== '') ? cc.bank : defBank;
                document.getElementById('profile_logo_preview').src = cc.logo || 'img/logo.jpg';
                if (toggleBtn) {
                    toggleBtn.style.display = 'flex';
                    toggleBtn.innerHTML = '⚙️ Настроить логотип и реквизиты';
                }
            } else {
                if (toggleBtn) toggleBtn.style.display = 'none';
            }
        }

        let modalContent = document.querySelector('#profile_modal_overlay .auth-modal-content');
        if (modalContent) modalContent.style.maxWidth = '380px';

        document.getElementById('profile_modal_overlay').style.display = 'flex';
    },
    closeProfileModal: function () { document.getElementById('profile_modal_overlay').style.display = 'none'; },

    showAdminModal: function () {
        let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;
        let adminEmails = ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'];
        if (!tgUser || !tgUser.email || !adminEmails.includes(tgUser.email.toLowerCase())) {
            app.alert("Доступ запрещен.");
            return;
        }
        document.getElementById('admin_modal_overlay').style.display = 'flex';
        this.loadAdminData();
    },
    closeAdminModal: function () { document.getElementById('admin_modal_overlay').style.display = 'none'; },

    loadAdminData: async function (offset = 0) {
        let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;
        let adminEmails = ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'];
        if (!tgUser || !tgUser.email || !adminEmails.includes(tgUser.email.toLowerCase())) {
            const content = document.getElementById('admin_content');
            if (content) content.innerHTML = '<div style="padding:20px; color:#EF4444;">Доступ запрещен.</div>';
            return;
        }
        this._adminOffset = offset;
        const content = document.getElementById('admin_content');
        if (content) content.innerHTML = '<div style="text-align: center; color: var(--text-sec); padding: 50px;">Загрузка данных...</div>';

        try {
            // 1. Fetch Users (Paginated)
            let { data: users, error: errU, count: totalUsers } = await supabaseClient.from('users')
                .select('id, username, email, phone, created_at, last_visited, last_device, account_type, demo_ends_at, city, location, avatar_url', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + this._adminPageSize - 1);

            if (errU) throw errU;

            // 2. Fetch Estimates for these specific users to calc LTV in the list
            const userIds = users.map(u => u.id);
            let { data: userEsts, error: errUE } = await supabaseClient.from('estimates')
                .select('id, user_id, project_name, eq_sum, works_sum, total_sum, calc_data, created_at')
                .in('user_id', userIds);

            // 3. Fetch Recent Estimates (Fixed 50)
            let { data: recentEsts, error: errRE } = await supabaseClient.from('estimates')
                .select('id, project_name, eq_sum, works_sum, total_sum, calc_data, created_at, users(username, phone, email)')
                .order('created_at', { ascending: false })
                .limit(50);

            // 4. Fetch Global Totals (Only sums for dashboard cards)
            let { data: sums, error: errS } = await supabaseClient.from('estimates')
                .select('eq_sum, works_sum, total_sum');

            if (errUE || errRE || errS) throw new Error("Ошибка загрузки связанных данных");

            let totalEq = 0, totalWorks = 0;
            sums.forEach(s => { totalEq += (s.eq_sum || 0); totalWorks += (s.works_sum || 0); });

            // 5. Fetch statuses for shared invoices linked to recent estimates
            let sharedStatusesAdmin = {};
            try {
                const sharedIds = (recentEsts || []).map(e => e.calc_data?.shared_invoice_id).filter(Boolean);
                if (sharedIds.length > 0) {
                    const { data: sharedList } = await supabaseClient
                        .from('shared_invoices')
                        .select('id, object_info')
                        .in('id', sharedIds);
                    if (sharedList) {
                        sharedList.forEach(item => {
                            sharedStatusesAdmin[item.id] = item.object_info?.status || 'sent';
                        });
                    }
                }
            } catch (e) { console.error('Admin status fetch error:', e); }

            this.adminData = {
                users: users || [],
                userEstimates: userEsts || [],
                recentEstimates: recentEsts || [],
                totalUsers: totalUsers || 0,
                totalEstimates: sums.length,
                totalEq,
                totalWorks,
                sharedStatusesAdmin
            };
            this.renderAdminMain();
        } catch (error) {
            console.error("Admin Load Error:", error);
            if (content) content.innerHTML = `<div style="padding:20px; color:#EF4444;">Ошибка: ${error.message}</div>`;
        }
    },

    renderAdminMain: function () {
        const { users, userEstimates, recentEstimates, totalUsers, totalEstimates, totalEq, totalWorks } = this.adminData;

        users.forEach(u => {
            const uEsts = userEstimates.filter(e => String(e.user_id) === String(u.id));
            u.projectsCount = uEsts.length;
            u.ltv = 0;
            let totalArea = 0;
            uEsts.forEach(e => {
                u.ltv += (e.total_sum || 0);
                if (e.calc_data && e.calc_data.area) totalArea += parseFloat(e.calc_data.area);
            });
            u.avgArea = u.projectsCount > 0 ? Math.round(totalArea / u.projectsCount) : 0;
        });

        // СОРТИРОВКА (Инструкция пользователя)
        const sortType = document.getElementById('sort-installers')?.value || 'default';
        if (sortType !== 'default') {
            users.sort((a, b) => {
                if (sortType === 'login_desc') return new Date(b.last_visited || 0) - new Date(a.last_visited || 0);
                if (sortType === 'login_asc') return new Date(a.last_visited || 0) - new Date(b.last_visited || 0);
                if (sortType === 'ltv_desc') return (b.ltv || 0) - (a.ltv || 0);
                if (sortType === 'ltv_asc') return (a.ltv || 0) - (b.ltv || 0);
                return 0;
            });
        }

        let h = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div class="control-card" style="background: rgba(37, 99, 235, 0.1); border-color: var(--primary); padding: 15px;"><span class="lbl" style="color: var(--text-sec);">Пользователей</span><span style="font-size: 24px; font-weight: 800; color: var(--primary);">${totalUsers}</span></div>
                        <div class="control-card" style="background: rgba(16, 185, 129, 0.1); border-color: #10B981; padding: 15px;"><span class="lbl" style="color: var(--text-sec);">Смет сохранено</span><span style="font-size: 24px; font-weight: 800; color: #10B981;">${totalEstimates}</span></div>
                        <div class="control-card" style="background: rgba(99, 102, 241, 0.1); border-color: #6366F1; padding: 15px;"><span class="lbl" style="color: var(--text-sec);">Оборудование (Сумма)</span><span style="font-size: 20px; font-weight: 800; color: #6366F1;">${totalEq.toLocaleString()} ₽</span></div>
                        <div class="control-card" style="background: rgba(249, 115, 22, 0.1); border-color: #F97316; padding: 15px;"><span class="lbl" style="color: var(--text-sec);">Работы (Сумма)</span><span style="font-size: 20px; font-weight: 800; color: #F97316;">${totalWorks.toLocaleString()} ₽</span></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <h4 style="margin: 0;">👥 Монтажники</h4>
                        <div style="display: flex; gap: 10px; width: 100%; max-width: 580px;">
                            <input type="text" id="admin_search_input" placeholder="🔍 Поиск по имени..." style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-main); font-size: 12px; outline: none;" onkeyup="app.filterAdminData(this.value)">
                            <select id="sort-installers" onchange="app.renderAdminMain()" style="background: var(--surface); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; padding: 0 10px; font-size: 12px; outline: none; cursor: pointer;">
                                <option value="default" ${sortType === 'default' ? 'selected' : ''}>Сортировка</option>
                                <option value="login_desc" ${sortType === 'login_desc' ? 'selected' : ''}>Вход: сначала новые</option>
                                <option value="login_asc" ${sortType === 'login_asc' ? 'selected' : ''}>Вход: сначала старые</option>
                                <option value="ltv_desc" ${sortType === 'ltv_desc' ? 'selected' : ''}>LTV: по убыванию</option>
                                <option value="ltv_asc" ${sortType === 'ltv_asc' ? 'selected' : ''}>LTV: по возрастанию</option>
                            </select>
                            <button class="btn-header-blue" style="background: #10B981; color: white; border-color: #10B981; font-weight: bold; padding: 0 15px; height: 34px;" onclick="app.exportAdminToExcel()">📊 Excel</button>
                        </div>
                    </div>

                    <table class="inv-table" style="margin-bottom: 30px;">
                        <thead><tr><th style="width:30px;">#</th><th>Имя / Контакты</th><th>Статистика (LTV)</th><th>Тариф / Устройство</th><th style="text-align:right;">Вход</th></tr></thead>
                        <tbody>
                `;
        users.forEach((u, i) => {
            let date = new Date(u.created_at).toLocaleDateString();
            let isExpired = u.account_type === 'pro' && u.demo_ends_at && (new Date(u.demo_ends_at) < new Date());
            let badge = (u.account_type === 'pro' && !isExpired) ? '<span style="color:#D97706; font-weight:bold;">PRO</span>' : 'Базовый';
            if (isExpired) badge += ' <span style="color:#EF4444; font-size:9px; font-weight:700;">(ИСТЁК)</span>';
            let name = u.username || u.email || 'Без имени';
            let phone = u.phone || 'Нет телефона';
            let device = u.last_device || 'Неизвестно';
            let lastVis = u.last_visited ? new Date(u.last_visited).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : date;
            let avatarImg = u.avatar_url ? `<img src="${u.avatar_url}" style="width:32px; height:32px; border-radius:50%; vertical-align:middle; margin-right:10px; object-fit:cover; border:1px solid #E5E7EB;">` : `<span style="font-size:24px; vertical-align:middle; margin-right:10px;">👤</span>`;

            let cityText = u.city || 'Город не указан';
            let ipLoc = u.location || 'Неизвестно';
            let locHTML = `<div style="font-size:10px;color:var(--text-sec); margin-top:2px;">📍 ${cityText} <span class="admin-ip-location" style="color: #888; font-size: 0.85em; margin-left:5px;">(IP: ${ipLoc})</span></div>`;

            let searchStr = `${name} ${phone} ${u.email || ''} ${cityText} ${ipLoc}`.toLowerCase();

            h += `<tr class="active-row admin-list-row" data-search="${searchStr}" style="cursor: pointer; transition: 0.2s;" onclick="app.viewAdminUser('${u.id}')" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='transparent'">
                        <td style="color:var(--text-sec);">${i + 1}</td>
                        <td><div style="display:flex; align-items:center;">${avatarImg} <div><b style="font-size:13px;">${name}</b><br><span style="font-size:11px;color:var(--text-sec);">${phone}</span>${locHTML}</div></div></td>
                        <td><b style="color:var(--primary);">${u.ltv.toLocaleString()} ₽</b><br><span style="font-size:10px;color:var(--text-sec);">Смет: ${u.projectsCount} | Ср.объект: ${u.avgArea} м²</span></td>
                        <td>${badge}<br><span style="font-size:10px;color:var(--text-sec);">${device}</span></td>
                        <td style="text-align:right;">${lastVis}</td>
                    </tr>`;
        });

        // Pagination Controls
        const hasPrev = this._adminOffset > 0;
        const hasNext = (this._adminOffset + this._adminPageSize) < totalUsers;

        h += `</tbody></table>
              <div style="display:flex; justify-content:center; align-items:center; gap:20px; margin-bottom:30px;">
                  <button class="btn-ctrl" ${!hasPrev ? 'disabled style="opacity:0.5; cursor:default;"' : ''} onclick="app.loadAdminData(${this._adminOffset - this._adminPageSize})">⬅️ Назад</button>
                  <span style="font-size:12px; color:var(--text-sec);">Записи ${this._adminOffset + 1} — ${Math.min(this._adminOffset + this._adminPageSize, totalUsers)} из ${totalUsers}</span>
                  <button class="btn-ctrl" ${!hasNext ? 'disabled style="opacity:0.5; cursor:default;"' : ''} onclick="app.loadAdminData(${this._adminOffset + this._adminPageSize})">Вперед ➡️</button>
              </div>
        `;

        h += `<h4 style="margin: 0 0 10px 0;">📋 Последние сметы</h4><table class="inv-table"><thead><tr><th style="width:30px;">#</th><th>Объект</th><th>Монтажник</th><th>Сумма</th><th>Статус</th><th style="text-align:right;">Дата / Опции</th></tr></thead><tbody>`;

        const sharedStatusesAdmin = this.adminData.sharedStatusesAdmin || {};

        recentEstimates.forEach((e, i) => {
            let date = new Date(e.created_at).toLocaleDateString();
            let sum = e.total_sum ? e.total_sum.toLocaleString() + ' ₽' : '0 ₽';
            let author = e.users ? (e.users.username || 'Без имени') : 'Неизвестен';
            let projName = e.project_name || e.name || 'Без названия';
            let estSearchStr = `${projName} ${author} ${sum}`.toLowerCase();

            // Определяем статус сметы
            const sharedInvoiceId = e.calc_data?.shared_invoice_id;
            let adminStatusBadge = `<span class="status-badge-cabinet status-cabinet-saved">Сохранена</span>`;
            if (sharedInvoiceId) {
                const st = sharedStatusesAdmin[sharedInvoiceId];
                if (st === 'confirmed') adminStatusBadge = `<span class="status-badge-cabinet status-cabinet-confirmed">✓ Одобрена</span>`;
                else if (st === 'needs_revision') adminStatusBadge = `<span class="status-badge-cabinet status-cabinet-revision">✍ На доработке</span>`;
                else adminStatusBadge = `<span class="status-badge-cabinet status-cabinet-sent">Отправлена</span>`;
            }

            h += `<tr class="active-row admin-list-row" data-search="${estSearchStr}" style="cursor: pointer; transition: 0.2s;" onclick="app.viewAdminEstimate('${e.id}')" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='transparent'">
                        <td style="color:var(--text-sec);">${i + 1}</td>
                        <td><b>${projName}</b></td>
                        <td>${author}</td>
                        <td style="font-weight:bold; color:var(--primary);">${sum}</td>
                        <td>${adminStatusBadge}</td>
                        <td style="text-align:right;">
                            <div style="display:flex; align-items:center; justify-content:flex-end; gap:10px;">
                                <span style="color:var(--text-sec); font-size:12px;">${date}</span>
                                <button class="delete-icon-btn" onclick="event.stopPropagation(); app.deleteEstimate('${e.id}', event)" title="Удалить смету">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </td>
                    </tr>`;
        });
        h += `</tbody></table>`;
        document.getElementById('admin_content').innerHTML = h;
    },
    filterAdminData: function (query) {
        let lowerQuery = query.toLowerCase().trim();
        let rows = document.querySelectorAll('.admin-list-row');
        rows.forEach(row => {
            let dataSearch = row.getAttribute('data-search') || '';
            if (!lowerQuery || dataSearch.includes(lowerQuery)) row.style.display = '';
            else row.style.display = 'none';
        });
    },
    renderScheme: function () {
        const s = this.state;
        const spec = this.currentSpec || [];
        const basePath = 'img/scheme/';
        const layers = [];

        // Вспомогательные функции для поиска оборудования в спецификации
        const hasItem = (namePart) => spec.some(i => i.name.toLowerCase().includes(namePart.toLowerCase()));
        const hasCat = (catPart) => spec.some(i => i.id && i.id.toLowerCase().includes(catPart.toLowerCase()));

        // 1. Базовый слой (всегда виден)
        layers.push('bg_frame.png');

        // 2. Расширительный бак отопления (только если есть в смете)
        if (spec.some(i => i.name.toLowerCase().includes("бак") && (i.name.toLowerCase().includes("отопл") || (i.group && i.group.toLowerCase().includes("котельн"))) && !i.name.toLowerCase().includes("гвс"))) {
            layers.push('tank_heating.png');
        }

        // 3. Блок Котлов и магистралей
        const hasGasBoiler = hasItem("Газовый") || hasCat("gas");
        const hasElBoiler = hasItem("Электрический") || hasCat("se-") || hasCat("seb-");

        if (hasGasBoiler) {
            layers.push('boiler_gas.png');
            layers.push('piping_gas.png');
        }
        if (hasElBoiler) {
            layers.push('boiler_el.png');
            layers.push('piping_el.png');
        }

        // Общая магистраль
        const boilerCount = (hasGasBoiler ? 1 : 0) + (hasElBoiler ? 1 : 0);
        if (boilerCount >= 2 || s.hotWater || s.systems.length > 0) {
            layers.push('podacha_obratka.png');
        }

        // 4. Блок Бойлера (ГВС)
        if (s.hotWater && (hasItem("Бойлер") || hasItem("Водонагреватель"))) {
            layers.push('bkn_tank.png');

            // Бак ГВС (синий)
            if (spec.some(i => (i.name.toLowerCase().includes("бак") && i.name.toLowerCase().includes("гвс")) || hasCat("exp_dhw"))) {
                layers.push('tank_water.png');
            }

            // Комплекты Fugas
            if (hasItem("Fugas") || hasItem("fugas") || hasItem("фугас")) {
                if (hasGasBoiler) layers.push('fugas_gas.png');
                if (hasElBoiler) layers.push('fugas_el.png');
            }

            // Рециркуляция
            if (s.recirc) {
                layers.push('recirc_loop.png');
            }
        }

        // 5. Ввод холодной воды
        if (s.water) {
            layers.push('water_input.png');
        }

        // 6. Распределение и Потребители
        if (hasItem("Гидрострелка") || hasItem("разделитель") || hasCat("hydro_")) {
            layers.push('hydro_manifold.png');
        }
        if (hasItem("Радиатор") && hasItem("группа")) {
            layers.push('system_rad.png');
        }
        if (hasItem("пол") && hasItem("группа")) {
            layers.push('system_tp.png');
        }

        // Генерация HTML с CSS-правилами для ночного режима и ПЕЧАТИ
        let html = `
                <style>
                    #dynamic_scheme {
                        position: relative; width: 100%; height: 70vh; min-height: 400px; max-height: 800px;
                        background: transparent; overflow: hidden; border-radius: 8px; margin-bottom: 20px;
                    }
                    #dynamic_scheme img {
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        object-fit: contain; mix-blend-mode: multiply; transition: filter 0.3s ease, opacity 0.3s ease;
                    }
                    body.dark-mode #dynamic_scheme img {
                        filter: invert(1) hue-rotate(180deg); mix-blend-mode: screen; opacity: 0.85;
                    }
                    
                    /* === ЖЕСТКИЕ ПРАВИЛА ДЛЯ ИДЕАЛЬНОЙ ПЕЧАТИ === */
            /* Правила для вывода на отдельный альбомный лист */
            @media print {
                @page scheme-page { 
                    size: A4 landscape; 
                    margin: 10mm; 
                }
                #dynamic_scheme {
                    page: scheme-page !important;
                    page-break-before: always !important;
                    break-before: page !important;
                    page-break-after: avoid !important;
                    break-after: avoid !important;
                    height: 170mm !important; /* Оптимизировано, чтобы не вызывать пустой лист */
                    min-height: 170mm !important;
                    max-height: 170mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                }
                #dynamic_scheme img {
                    object-fit: contain !important;
                    object-position: center center !important;
                }
            }
                </style>
                <div id="dynamic_scheme">`;

        layers.forEach(layer => {
            // Текст прижимаем влево, оборудование - вправо
            let position = (layer === 'bg_frame.png') ? 'left center' : 'right center';
            html += `<img src="${basePath}${layer}" alt="${layer}" style="object-position: ${position};" onerror="this.style.display='none'">`;
        });

        html += `</div>`;
        return html;
    },
    exportAdminToExcel: function () {
        let users = this.adminData.users;
        let estimates = this.adminData.userEstimates || [];
        let csv = '\uFEFF';
        csv += "Имя;Телефон;Email;Telegram;Тариф;Регистрация;Локация;UTM Источник;Кол-во смет;Ср. площадь (м2);LTV (Сумма руб)\n";
        users.forEach(u => {
            let uEsts = estimates.filter(e => String(e.user_id) === String(u.id));
            let projectsCount = uEsts.length;
            let ltv = 0, totalArea = 0;
            uEsts.forEach(e => {
                ltv += (e.total_sum || 0);
                if (e.calc_data && e.calc_data.area) totalArea += parseFloat(e.calc_data.area);
            });
            let avgArea = projectsCount > 0 ? Math.round(totalArea / projectsCount) : 0;
            let name = (u.username || u.email || 'Без имени').replace(/;/g, ' ');
            let phone = (u.phone || '').replace(/;/g, ' ');
            let email = (u.email || '').replace(/;/g, ' ');
            let tg = (u.tg_username || '').replace(/;/g, ' ');
            let tariff = u.account_type === 'pro' ? 'PRO' : 'Base';
            let reg = new Date(u.created_at).toLocaleDateString();
            let loc = (u.location || '').replace(/;/g, ' ');
            let utm = (u.utm_source || '').replace(/;/g, ' ');
            csv += `${name};${phone};${email};${tg};${tariff};${reg};${loc};${utm};${projectsCount};${avgArea};${ltv}\n`;
        });
        let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        let link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", "STOUT_CRM_Users.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    viewAdminUser: function (userId) {
        let user = this.adminData.users.find(u => String(u.id) === String(userId));
        if (!user) return;
        let userEstimates = (this.adminData.userEstimates || []).filter(e => String(e.user_id) === String(userId));
        let date = new Date(user.created_at).toLocaleDateString();
        let lastVis = user.last_visited ? new Date(user.last_visited).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Нет данных';
        let proDateInput = user.demo_ends_at ? user.demo_ends_at.split('T')[0] : '';

        let ltv = 0, totalArea = 0;
        userEstimates.forEach(e => { ltv += (e.total_sum || 0); if (e.calc_data && e.calc_data.area) totalArea += parseFloat(e.calc_data.area); });
        let avgArea = userEstimates.length > 0 ? Math.round(totalArea / userEstimates.length) : 0;

        let h = `
                    <button class="btn-header-blue" style="margin-bottom: 20px; width: fit-content;" onclick="app.renderAdminMain()">← Назад</button>
                    <div style="background: var(--surface-light); padding: 25px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 30px;">
                        <div style="display:flex; align-items:center; gap:20px; margin-bottom:25px;">
                            ${user.avatar_url ? `<img src="${user.avatar_url}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid var(--primary);">` : `<div style="width:80px; height:80px; border-radius:50%; background:var(--primary-light); display:flex; align-items:center; justify-content:center; font-size:40px; color:var(--primary);">👤</div>`}
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; width: 100%;">
                                <div class="user-main-contacts">
                                    <h2 style="margin: 0; color: var(--text-main); font-size: 20px;">${user.username || user.email || 'Без имени'}</h2>
                                    <div style="display: flex; gap: 15px; margin-top: 5px; font-size: 13px; color: var(--text-sec);">
                                        <span>📱 ${user.phone || '—'}</span>
                                        ${(user.account_type === 'pro' && user.demo_ends_at && new Date(user.demo_ends_at) < new Date()) ? '<b style="color:#EF4444;">⚠️ Тариф истёк</b>' : ''}
                                    </div>
                                    ${user.utm_source ? `<div style="display: inline-block; background: var(--primary-light); color: var(--primary); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; margin-top: 8px;">${user.utm_source}</div>` : ''}
                                </div>

                                <div class="user-location-block" style="text-align: right; font-size: 13px; min-width: 200px;">
                                    <div style="margin-bottom: 4px; color: var(--text-main);">
                                        📍 <span style="opacity: 0.7; font-size: 12px;">Город (рег.):</span> <b>${user.city || '—'}</b>
                                    </div>
                                    <div style="color: var(--text-sec); font-size: 13px;">
                                        🌐 <span style="opacity: 0.7; font-size: 11px;">По IP:</span> ${user.location || '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; margin-bottom:25px;">
                            <div style="background:var(--bg); padding:15px; border-radius:12px; text-align:center; border:1px solid var(--border);">
                                <div style="font-size:11px; color:var(--text-sec); text-transform:uppercase; font-weight:700; margin-bottom:5px;">Выручка (LTV)</div>
                                <div style="font-size:20px; font-weight:800; color:var(--primary);">${ltv.toLocaleString()} ₽</div>
                            </div>
                            <div style="background:var(--bg); padding:15px; border-radius:12px; text-align:center; border:1px solid var(--border);">
                                <div style="font-size:11px; color:var(--text-sec); text-transform:uppercase; font-weight:700; margin-bottom:5px;">Проектов</div>
                                <div style="font-size:20px; font-weight:800; color:var(--text-main);">${userEstimates.length}</div>
                            </div>
                            <div style="background:var(--bg); padding:15px; border-radius:12px; text-align:center; border:1px solid var(--border);">
                                <div style="font-size:11px; color:var(--text-sec); text-transform:uppercase; font-weight:700; margin-bottom:5px;">Ср. площадь</div>
                                <div style="font-size:20px; font-weight:800; color:var(--text-main);">${avgArea} м²</div>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; padding-top:20px; border-top:1px dashed var(--border);">
                            <div>
                                <h4 style="margin:0 0 15px 0; font-size:14px; color:var(--text-main);">⚙️ Управление тарифом</h4>
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
                                    <div>
                                        <label style="display:block; font-size:11px; color:var(--text-sec); margin-bottom:4px;">Тип аккаунта</label>
                                        <select id="admin_edit_tariff" style="width:100%; padding:6px; border-radius:6px; background:var(--bg); color:var(--text-main); border:1px solid var(--border); font-size:12px;">
                                            <option value="base" ${user.account_type === 'base' ? 'selected' : ''}>Базовый</option>
                                            <option value="pro" ${user.account_type === 'pro' ? 'selected' : ''}>PRO ⭐️</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="display:block; font-size:11px; color:var(--text-sec); margin-bottom:4px;">Истекает (для PRO)</label>
                                        <input type="date" id="admin_edit_date" value="${proDateInput}" style="width:100%; padding:6px; border-radius:6px; background:var(--bg); color:var(--text-main); border:1px solid var(--border); font-size:12px;">
                                    </div>
                                </div>
                                <button class="auth-btn-base btn-email-submit" style="width:100%; height:34px; font-size:12px;" onclick="app.updateAdminUserTariff('${user.id}')">💾 Применить настройки</button>
                            </div>
                            <div style="font-size:12px;">
                                <h4 style="margin:0 0 15px 0; font-size:14px; color:var(--text-main);">📂 Техническая инфо</h4>
                                <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:8px;">
                                    <span style="color:var(--text-sec);">Зарегистрирован:</span> <span style="color:var(--text-main); font-weight:600;">${date}</span>
                                    <span style="color:var(--text-sec);">Последний визит:</span> <span style="color:var(--text-main); font-weight:600;">${lastVis}</span>
                                    <span style="color:var(--text-sec);">Устройство:</span> <span style="color:var(--text-main); font-weight:600;">${user.last_device || 'Неизвестно'}</span>
                                    <span style="color:var(--text-sec);">Email:</span> <span style="color:var(--text-main); font-weight:600;">${user.email || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h4 style="margin:0 0 15px 10px; color:var(--text-main);">📋 Сметы пользователя (${userEstimates.length})</h4>
                    <table class="inv-table">
                        <thead><tr><th style="width:30px;">#</th><th>Название объекта</th><th>Сумма</th><th style="text-align:right;">Дата / Опции</th></tr></thead>
                        <tbody>
                `;
        if (userEstimates.length > 0) {
            userEstimates.forEach((e, i) => {
                let edate = e.created_at ? new Date(e.created_at).toLocaleDateString() : '—';
                let esum = e.total_sum ? e.total_sum.toLocaleString() + ' ₽' : '0 ₽';
                let projName = e.project_name || e.name || 'Без названия';
                h += `<tr class="active-row" style="cursor: pointer; transition: 0.2s;" onclick="app.viewAdminEstimate('${e.id}')" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='transparent'">
                            <td style="color:var(--text-sec);">${i + 1}</td>
                            <td style="font-weight:600;">${projName}</td>
                            <td style="color:var(--primary); font-weight:bold;">${esum}</td>
                            <td style="text-align:right;">
                                <div style="display:flex; align-items:center; justify-content:flex-end; gap:10px;">
                                    <span style="color:var(--text-sec); font-size:12px;">${edate}</span>
                                    <button class="delete-icon-btn" onclick="event.stopPropagation(); app.deleteEstimate('${e.id}', event)" title="Удалить смету">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>`;
            });
        } else {
            h += `<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--text-sec);">Пользователь еще не сохранял сметы</td></tr>`;
        }
        h += `</tbody></table>`;
        document.getElementById('admin_content').innerHTML = h;
    },
    viewAdminEstimate: async function (estId) {
        let est = (this.adminData.userEstimates || []).find(e => String(e.id) === String(estId)) || (this.adminData.recentEstimates || []).find(e => String(e.id) === String(estId));
        if (!est) return;
        let author = est.users ? (est.users.username || 'Без имени') : 'Неизвестен';
        let phone = est.users ? (est.users.phone || 'Не указан') : '—';
        let email = est.users ? (est.users.email || 'Не указан') : '—';
        let date = new Date(est.created_at).toLocaleDateString();
        let objArea = est.calc_data && est.calc_data.area ? est.calc_data.area + ' м²' : 'Не указана';

        // Формируем контактный блок монтажника с кликабельными ссылками
        let phoneLink = phone !== 'Не указан' && phone !== '—'
            ? `<a href="tel:${phone.replace(/[^+\d]/g, '')}" style="color: var(--primary); text-decoration: none; font-weight: 600;">${phone}</a>`
            : `<span style="color: var(--text-sec);">${phone}</span>`;
        let emailLink = email !== 'Не указан' && email !== '—'
            ? `<a href="mailto:${email}" style="color: var(--primary); text-decoration: none; font-weight: 600;">${email}</a>`
            : `<span style="color: var(--text-sec);">${email}</span>`;

        let h = `
                    <button class="btn-header-blue" style="margin-bottom: 20px; width: fit-content;" onclick="app.renderAdminMain()">← Назад</button>
                    <div style="background: var(--surface-light); padding: 20px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 20px;">
                        <h3 style="margin-top:0; color: var(--text-main);">📋 ${est.project_name}</h3>
                        
                        <div style="background: rgba(37, 99, 235, 0.04); border: 1px solid rgba(37, 99, 235, 0.12); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;">
                            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-sec); font-weight: 700; margin-bottom: 10px;">👷 Монтажник</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                                <div><b style="color: var(--text-sec);">Имя:</b> <span style="font-weight: 600; color: var(--text-main);">${author}</span></div>
                                <div><b style="color: var(--text-sec);">Город:</b> <span style="color: var(--text-main);">${est.calc_data?.tgUser?.city || 'Не указан'}</span></div>
                                <div><b style="color: var(--text-sec);">📞 Телефон:</b> ${phoneLink}</div>
                                <div><b style="color: var(--text-sec);">✉️ Email:</b> ${emailLink}</div>
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; color: var(--text-main); margin-bottom: 20px;">
                            <div><b style="color: var(--text-sec);">Дата сохранения:</b> ${date}</div>
                            <div><b style="color: var(--text-sec);">Площадь объекта:</b> <span style="font-weight: bold; color: var(--text-main);">${objArea}</span></div>
                            
                            <div style="grid-column: span 2; height: 1px; background: var(--border); margin: 5px 0;"></div>
                            
                            <div><b style="color: var(--text-sec);">Оборудование:</b> <span style="color: #6366F1; font-weight: bold;">${est.eq_sum ? est.eq_sum.toLocaleString() : '0'} ₽</span></div>
                            <div><b style="color: var(--text-sec);">Монтажные работы:</b> <span style="color: #F97316; font-weight: bold;">${est.works_sum ? est.works_sum.toLocaleString() : '0'} ₽</span></div>
                            <div style="grid-column: span 2; font-size: 14px; margin-top: 5px;"><b style="color: var(--text-sec);">Итоговая сумма:</b> <span style="color:var(--primary); font-weight:bold; font-size: 18px;">${est.total_sum ? est.total_sum.toLocaleString() : '0'} ₽</span></div>
                            
                            <div style="grid-column: span 2; height: 1px; background: var(--border); margin: 5px 0;"></div>
                            
                            <div id="admin_shared_status_container" style="grid-column: span 2;">
                                <div style="color: var(--text-sec); font-size: 12px;">Загрузка статуса предложения...</div>
                            </div>
                        </div>
                        <div style="font-size:12px; color:var(--text-sec); margin-bottom: 15px; line-height: 1.4;">
                            <i>* В базе данных сохраняются только общие суммы.<br>Чтобы посмотреть детальную спецификацию по позициям, скопируйте код ниже, закройте окно и нажмите иконку 📥 (Загрузить код).</i>
                        </div>
                        <button class="auth-btn-base btn-email-submit" style="width: 100%; height: 40px; margin-bottom: 10px;" onclick="app.copyAdminEstimateCode('${estId}')">📋 Скопировать код сметы</button>
                    </div>
                `;
        document.getElementById('admin_content').innerHTML = h;

        const sharedInvoiceId = est.calc_data?.shared_invoice_id;
        const statusContainer = document.getElementById('admin_shared_status_container');

        if (!sharedInvoiceId) {
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <b style="color: var(--text-sec);">Статус предложения:</b>
                        <span class="status-badge-cabinet status-cabinet-saved">Сохранена</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-sec); margin-top: 5px;">Клиентская ссылка еще не создавалась.</div>
                `;
            }
            return;
        }

        try {
            const { data: sharedInvoice, error: sharedError } = await supabaseClient
                .from('shared_invoices')
                .select('id, object_info, created_at')
                .eq('id', sharedInvoiceId)
                .maybeSingle();

            if (sharedError) throw sharedError;

            if (!sharedInvoice) {
                if (statusContainer) {
                    statusContainer.innerHTML = `
                        <div style="color: #EF4444; font-size: 12px;">⚠️ Запись коммерческого предложения удалена или отсутствует в базе.</div>
                    `;
                }
                return;
            }

            const objInfo = sharedInvoice.object_info || {};
            const status = objInfo.status || 'sent';
            const clientComment = objInfo.client_comment || '';
            const statusUpdatedAt = objInfo.status_updated_at || sharedInvoice.created_at;

            let statusBadgeHTML = '';
            if (status === 'confirmed') {
                statusBadgeHTML = `<span class="status-badge-cabinet status-cabinet-confirmed">✓ Одобрена</span>`;
            } else if (status === 'needs_revision') {
                statusBadgeHTML = `<span class="status-badge-cabinet status-cabinet-revision">✍ На доработке</span>`;
            } else {
                statusBadgeHTML = `<span class="status-badge-cabinet status-cabinet-sent">Отправлена клиенту</span>`;
            }

            const formatDateTime = (isoString) => {
                if (!isoString) return '—';
                try {
                    const d = new Date(isoString);
                    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    return isoString;
                }
            };

            let commentBlockHTML = '';
            if (status === 'needs_revision' && clientComment) {
                commentBlockHTML = `
                    <div style="margin-top: 12px; background: rgba(239, 68, 68, 0.05); border-left: 4px solid #EF4444; padding: 10px 14px; border-radius: 6px;">
                        <div style="font-weight: 700; color: #EF4444; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">✍ Комментарий заказчика (Правки):</div>
                        <div style="font-size: 12.5px; color: var(--text-main); font-style: italic; white-space: pre-wrap; line-height: 1.4;">"${clientComment}"</div>
                    </div>
                `;
            } else if (status === 'confirmed') {
                commentBlockHTML = `
                    <div style="margin-top: 12px; background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10B981; padding: 10px 14px; border-radius: 6px;">
                        <div style="font-weight: 700; color: #10B981; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">✓ Комментарий при согласовании:</div>
                        <div style="font-size: 12.5px; color: var(--text-main); font-style: italic; white-space: pre-wrap; line-height: 1.4;">${clientComment ? `"${clientComment}"` : '<i>Без дополнительных комментариев</i>'}</div>
                    </div>
                `;
            }

            if (statusContainer) {
                statusContainer.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <b style="color: var(--text-sec);">Статус предложения:</b>
                            ${statusBadgeHTML}
                        </div>
                        <div style="font-size: 11.5px; color: var(--text-sec);">
                            <b>Дата изменения:</b> ${formatDateTime(statusUpdatedAt)}
                        </div>
                    </div>
                    ${commentBlockHTML}
                    <div style="margin-top: 12px; display: flex; gap: 10px;">
                        <a href="invoice.html?id=${sharedInvoiceId}" target="_blank" class="btn-header-blue" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-size: 11px; height: 28px; padding: 0 12px; background: transparent; border: 1px solid var(--primary); color: var(--primary);">🔗 Открыть КП клиента</a>
                    </div>
                `;
            }
        } catch (e) {
            console.error("Error loading shared status details:", e);
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <div style="color: #EF4444; font-size: 12px;">⚠️ Ошибка загрузки статуса предложения с сервера.</div>
                `;
            }
        }
    },
    copyAdminEstimateCode: async function (estId) {
        let est = (this.adminData.userEstimates || []).find(e => String(e.id) === String(estId)) || (this.adminData.recentEstimates || []).find(e => String(e.id) === String(estId));
        if (!est || !est.calc_data) { await app.alert('Нет данных для копирования'); return; }
        let exportState = {};
        let st = est.calc_data;
        for (let key in st) {
            let val = st[key];
            if (val === false || val === 0 || val === "" || key === 'viewMode' || key === 'showSwapFor' || key === 'collapsedGroups') continue;
            if (key === 'tgUser' || key === 'accountType' || key === 'demoUsed' || key === 'darkMode') continue;
            if (Array.isArray(val) && val.length === 0) continue;
            if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) continue;
            exportState[key] = val;
        }
        let settings = btoa(unescape(encodeURIComponent(JSON.stringify(exportState))));
        app.copyToClipboard(settings).then(async () => {
            await app.alert('✅ Код сметы скопирован!\n\nЗакройте админку, нажмите иконку 📥 (Загрузить код) в верхней панели и вставьте его.');
        }).catch(async err => {
            console.error('Ошибка копирования: ', err);
            await app.prompt('Скопируйте этот код вручную:', settings);
        });
    },
    switchAuthTab: function (tab) {
        this.currentAuthTab = tab;
        const tabLogin = document.getElementById('tab_login');
        const tabRegister = document.getElementById('tab_register');
        const loginFields = document.getElementById('login_fields');
        const registerFields = document.getElementById('register_fields');
        const submitBtn = document.getElementById('auth_submit_btn');
        const forgotLink = document.getElementById('auth_forgot_link');

        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            loginFields.style.display = 'block';
            registerFields.style.display = 'none';
            submitBtn.innerText = 'Войти';
            forgotLink.style.display = 'block';
        } else {
            tabLogin.classList.remove('active');
            tabRegister.classList.add('active');
            loginFields.style.display = 'none';
            registerFields.style.display = 'block';
            submitBtn.innerText = 'Зарегистрироваться';
            forgotLink.style.display = 'none';
        }
    },

    handleAuthSubmit: function () {
        if (this.currentAuthTab === 'register') {
            this.handleRegistration();
        } else {
            this.handleLogin();
        }
    },

    handleLogin: async function () {
        const email = document.getElementById('auth_email_input').value.trim();
        const password = document.getElementById('auth_password_input').value.trim();
        const btn = document.getElementById('auth_submit_btn');

        const authErrEl = document.getElementById('auth_error_msg');
        if (authErrEl) authErrEl.style.display = 'none';

        if (!email || !password) {
            if (authErrEl) {
                authErrEl.innerText = 'Введите Email и пароль';
                authErrEl.style.display = 'block';
            } else {
                app.alert('Введите Email и пароль');
            }
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Вход...';

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            this.closeAuthModal();
        } catch (err) {
            console.error("Детали ошибки входа (Supabase):", err);
            const userFriendlyMsg = getFriendlyErrorMessage(err, 'Неверный логин или пароль');
            if (authErrEl) {
                authErrEl.innerText = 'Ошибка входа: ' + userFriendlyMsg;
                authErrEl.style.display = 'block';
            } else {
                app.alert('Ошибка входа: ' + userFriendlyMsg);
            }
        } finally {
            btn.disabled = false;
            btn.innerText = 'Войти';
        }
    },

    handleRegistration: async function () {
        const btn = document.getElementById('auth_submit_btn');
        if (btn) {
            btn.disabled = true;
        }

        if (!document.getElementById('chk_terms').checked) {
            app.alert("Для регистрации необходимо принять условия Публичной оферты.");
            if (btn) {
                btn.disabled = false;
            }
            return;
        }

        const email = document.getElementById('auth_email_input').value.trim();
        const password = document.getElementById('auth_reg_password').value.trim();

        const authErrEl = document.getElementById('auth_error_msg');
        if (authErrEl) authErrEl.style.display = 'none';

        if (!email || !password) {
            if (authErrEl) {
                authErrEl.innerText = 'Заполните все поля';
                authErrEl.style.display = 'block';
            } else {
                app.alert('Заполните все поля');
            }
            if (btn) {
                btn.disabled = false;
            }
            return;
        }
        if (password.length < 6) {
            if (authErrEl) {
                authErrEl.innerText = 'Пароль должен быть не менее 6 символов';
                authErrEl.style.display = 'block';
            } else {
                app.alert('Пароль должен быть не менее 6 символов');
            }
            if (btn) {
                btn.disabled = false;
            }
            return;
        }

        if (btn) {
            btn.innerText = 'Проверка...';
        }

        try {
            // Проверка: существует ли уже пользователь с таким email через RPC-функцию (SECURITY DEFINER обходит RLS)
            const { data: emailExists, error } = await supabaseClient.rpc('check_email_exists', { check_email: email });

            // Обязательно добавь console.log('Результат проверки email:', emailExists)
            console.log('Результат проверки email:', emailExists);

            if (error) {
                console.error("Ошибка проверки email:", error);
                throw error;
            }

            // Логика блокировки: Если emailExists === true
            if (emailExists === true) {
                if (authErrEl) {
                    authErrEl.innerText = 'Пользователь с таким email уже существует. Пожалуйста, войдите в систему.';
                    authErrEl.style.display = 'block';
                }
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = 'Зарегистрироваться';
                }
                return;
            }

            // Execute the generation of the 4-digit verification code and invoke await emailjs.send(...) STRICTLY inside the condition where the Supabase query successfully confirms the email is available
            if (emailExists === false) {
                if (btn) {
                    btn.innerText = 'Отправка кода...';
                }
                const code = Math.floor(1000 + Math.random() * 9000).toString();
                this.pendingRegistration = { email, password, code };

                const serviceId = "service_o11b4ej";
                const templateId = "template_ysuxfio";
                const publicKey = "-m4N93pTqMlCfuBpT";

                const templateParams = {
                    to_email: email,
                    user_email: email,
                    email_subject: "Код подтверждения на HeatCalc.ru",
                    subject_text: "Код подтверждения на HeatCalc.ru",
                    email_body: `Для подтверждения вашего email и завершения регистрации на сайте HeatCalc.ru, пожалуйста, введите следующий 4-значный код:\n\n👉  ${code}  👈\n\nЕсли вы не запрашивали этот код, просто проигнорируйте это письмо.`,
                    message_text: `Для подтверждения вашего email и завершения регистрации на сайте HeatCalc.ru, пожалуйста, введите следующий 4-значный код:\n\n👉  ${code}  👈\n\nЕсли вы не запрашивали этот код, просто проигнорируйте это письмо.`
                };

                await emailjs.send(serviceId, templateId, templateParams, publicKey);

                // Transition the UI to the verification code input modal only after the EmailJS promise resolves successfully.
                document.getElementById('auth_main_view').style.display = 'none';
                document.getElementById('auth_verify_view').style.display = 'block';
                document.getElementById('auth_terms_wrapper').style.display = 'none';
            }
        } catch (err) {
            console.error("Детали ошибки регистрации/отправки кода:", err);
            const friendlyErr = getFriendlyErrorMessage(err);
            if (authErrEl) {
                authErrEl.innerText = 'Ошибка: ' + friendlyErr;
                authErrEl.style.display = 'block';
            } else {
                app.alert("Ошибка при регистрации: " + friendlyErr);
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = (this.currentAuthTab === 'login') ? 'Войти' : 'Зарегистрироваться';
            }
        }
    },

    verifyCodeAndSignUp: async function () {
        const inputCode = document.getElementById('auth_code_input').value.trim();
        const btn = document.querySelector('[onclick="app.verifyCodeAndSignUp()"]');
        const errEl = document.getElementById('auth_code_error');

        if (errEl) errEl.style.display = 'none';

        if (!this.pendingRegistration) {
            app.alert('Сессия регистрации истекла. Пожалуйста, начните сначала.');
            this.backToAuthMain();
            return;
        }

        if (!inputCode || String(inputCode) !== String(this.pendingRegistration.code)) {
            if (errEl) {
                errEl.innerText = 'Неверный код подтверждения';
                errEl.style.display = 'block';
            } else {
                app.alert('Неверный код подтверждения');
            }
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Создание аккаунта...';

        const authErrEl = document.getElementById('auth_error_msg');
        if (authErrEl) authErrEl.style.display = 'none';

        try {
            const { error } = await supabaseClient.auth.signUp({
                email: this.pendingRegistration.email,
                password: this.pendingRegistration.password
            });

            if (error) throw error;

            app.alert('Регистрация успешна!'); // Оставляем успех как алерт или можно тоже в UI
            this.closeAuthModal();
        } catch (err) {
            console.error("Детали ошибки создания аккаунта (Supabase):", err);

            const friendlyErr = getFriendlyErrorMessage(err);
            if (authErrEl) {
                const msg = (err.message || "").toLowerCase();
                if (msg.includes('already registered') || msg.includes('already exists')) {
                    authErrEl.innerText = 'Пользователь с таким email уже существует. Пожалуйста, войдите в систему.';
                } else {
                    authErrEl.innerText = 'Ошибка регистрации: ' + friendlyErr;
                }
                authErrEl.style.display = 'block';
                this.backToAuthMain(); // Возвращаем к форме, чтобы пользователь видел ошибку
            } else {
                app.alert('Ошибка регистрации: ' + friendlyErr);
            }
        } finally {
            btn.disabled = false;
            btn.innerText = 'Подтвердить';
        }
    },

    showForgotPasswordView: function () {
        document.getElementById('auth_main_view').style.display = 'none';
        document.getElementById('auth_forgot_view').style.display = 'block';
        document.getElementById('auth_terms_wrapper').style.display = 'none';
    },

    backToAuthMain: function () {
        document.getElementById('auth_main_view').style.display = 'block';
        document.getElementById('auth_verify_view').style.display = 'none';
        document.getElementById('auth_forgot_view').style.display = 'none';
        document.getElementById('auth_terms_wrapper').style.display = 'block';
    },

    showPasswordResetSuccessModal: function () {
        const modal = document.getElementById('password_reset_success_modal_overlay');
        if (modal) {
            modal.style.display = 'flex';
        }
    },

    closePasswordResetSuccessModal: function () {
        const modal = document.getElementById('password_reset_success_modal_overlay');
        if (modal) {
            modal.style.display = 'none';
        }
        this.backToAuthMain();
    },
    showEmailSuccessModal: function () {
        const modal = document.getElementById('email_success_modal_overlay');
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    closeEmailSuccessModal: function () {
        const modal = document.getElementById('email_success_modal_overlay');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    handleForgotPassword: async function () {
        const email = document.getElementById('forgot_email_input').value.trim();
        const btn = document.querySelector('[onclick="app.handleForgotPassword()"]');

        if (!email) {
            app.alert('Введите Email');
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Отправка...';

        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });
            if (error) throw error;
            this.closeAuthModal();
            this.showPasswordResetSuccessModal();
        } catch (err) {
            app.alert('Ошибка: ' + getFriendlyErrorMessage(err));
        } finally {
            btn.disabled = false;
            btn.innerText = 'Отправить ссылку';
        }
    },

    handleAuthSession: async function (session) {
        if (!session || !session.user) return;

        if (this._authHandling) return;
        this._authHandling = true;

        try {
            let user = session.user;
            let authUserId = user.id;
            let email = user.email || '';
            let fullName = (user.user_metadata && user.user_metadata.full_name)
                ? user.user_metadata.full_name
                : (email ? email.split('@')[0] : 'Монтажник');
            let phone = (user.user_metadata && user.user_metadata.phone) ? user.user_metadata.phone : '';
            let avatar = (user.user_metadata && user.user_metadata.avatar_url)
                ? user.user_metadata.avatar_url
                : ((user.user_metadata && user.user_metadata.picture) ? user.user_metadata.picture : '');

            let city = 'Не определен';
            let clientIp = '0.0.0.0';
            try {
                const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                if (isLocal) {
                    clientIp = '127.0.0.1';
                    city = 'Локальный хост';
                } else {
                    try {
                        const res = await fetch('https://ipapi.co/json/');
                        if (!res.ok) throw new Error("HTTP error " + res.status);
                        const geo = await res.json();
                        city = geo.city || 'Не определен';
                        clientIp = geo.ip || '0.0.0.0';
                    } catch (primaryErr) {
                        console.warn("Primary geo fetch failed, trying fallback...", primaryErr);
                        try {
                            const res = await fetch('https://ipinfo.io/json');
                            if (!res.ok) throw new Error("HTTP error " + res.status);
                            const geo = await res.json();
                            city = geo.city || 'Не определен';
                            clientIp = geo.ip || '0.0.0.0';
                        } catch (fallbackErr) {
                            console.warn("Fallback geo fetch also failed", fallbackErr);
                        }
                    }
                }
            } catch (e) { console.warn("Geo error", e); }

            let utm = localStorage.getItem('stout_utm') || '';

            this.state.tgUser = this.state.tgUser || {};
            const existingCity = this.state.tgUser.city || localStorage.getItem('user_city') || '';
            const existingPhone = this.state.tgUser.phone || phone || '';

            this.state.tgUser = {
                id: authUserId,
                authUserId: authUserId,
                first_name: fullName,
                phone: existingPhone,
                email: email,
                avatar_url: avatar,
                city: existingCity,
                isGoogle: user.app_metadata && user.app_metadata.provider === 'google'
            };
            this.saveState();

            let updatePayload = {
                last_visited: new Date().toISOString(),
                last_device: this.getDeviceName(),
                avatar_url: avatar,
                location: city,
                email: email
            };

            let upsertObj = {
                auth_user_id: authUserId,
                email: email,
                username: fullName,
                phone: existingPhone,
                city: existingCity || undefined,
                utm_source: utm || undefined,
                registration_ip: clientIp,
                ...updatePayload
            };
            Object.keys(upsertObj).forEach(k => { if (upsertObj[k] === undefined) delete upsertObj[k]; });

            let { data: upsertResult, error: upsertError } = await supabaseClient
                .from('users')
                .upsert(upsertObj, { onConflict: 'auth_user_id', ignoreDuplicates: false })
                .select('id, account_type, demo_ends_at, username, phone, city');

            if (upsertError) {
                console.warn('Upsert по auth_user_id не удался, используем fallback:', upsertError.message);
                let { data: uDataList } = await supabaseClient
                    .from('users')
                    .select('id, account_type, demo_ends_at, username, phone, city')
                    .eq('email', email)
                    .limit(1);
                let uData = uDataList ? uDataList[0] : null;
                if (!uData) {
                    let { data: newUList } = await supabaseClient
                        .from('users')
                        .insert([{ auth_user_id: authUserId, email: email, username: fullName, phone: existingPhone, city: existingCity || undefined, utm_source: utm, registration_ip: clientIp, ...updatePayload }])
                        .select('id, account_type, demo_ends_at, username, phone, city');
                    upsertResult = newUList;
                } else {
                    await supabaseClient.from('users').update({ auth_user_id: authUserId, city: existingCity || uData.city || undefined, ...updatePayload }).eq('id', uData.id);
                    upsertResult = [uData];
                    if (upsertResult[0]) {
                        upsertResult[0].city = existingCity || uData.city || '';
                    }
                }
            }

            let uRow = upsertResult ? upsertResult[0] : null;
            if (uRow) {
                let accType = uRow.account_type || 'base';
                let demoEnds = uRow.demo_ends_at;
                if (demoEnds) {
                    this.state.demoUsed = true;
                    if (accType === 'pro' && new Date() > new Date(demoEnds)) {
                        accType = 'base';
                        supabaseClient.from('users')
                            .update({ account_type: 'base' })
                            .eq('auth_user_id', authUserId)
                            .lt('demo_ends_at', new Date().toISOString());
                    } else if (accType === 'pro' && new Date(demoEnds) > new Date()) {
                        let msLeft = new Date(demoEnds).getTime() - Date.now();
                        if (msLeft <= 24 * 60 * 60 * 1000 && !sessionStorage.getItem('trial_reminder_shown')) {
                            sessionStorage.setItem('trial_reminder_shown', '1');
                            setTimeout(() => {
                                app.alert('⏰ Ваш пробный период заканчивается в течение 24 часов. Оформите подписку, чтобы не потерять доступ.');
                            }, 1500);
                        }
                    }
                }
                this.state.accountType = accType;
                this.state.tgUser.id = uRow.id;
                if (uRow.phone && uRow.phone !== phone) this.state.tgUser.phone = uRow.phone;
                if (uRow.username && uRow.username !== fullName) this.state.tgUser.first_name = uRow.username;
                if (uRow.city) this.state.tgUser.city = uRow.city;

                // City check removed immediately after registration; now validated on actions
            } else {
                this.state.accountType = 'base';
            }

            this.saveState();
            this.closeAuthModal();
            this.syncUI();
            this.render();
        } catch (error) {
            console.error('Ошибка авторизации:', error);
        } finally {
            setTimeout(() => { this._authHandling = false; }, 2000);
        }
    },
    updateAdminUserTariff: async function (userId) {
        let type = document.getElementById('admin_edit_tariff').value;
        let dateVal = document.getElementById('admin_edit_date').value;
        let updateData = { account_type: type };
        if (dateVal) updateData.demo_ends_at = new Date(dateVal).toISOString();
        else updateData.demo_ends_at = null;
        try {
            const { error } = await supabaseClient.from('users').update(updateData).eq('id', userId);
            if (error) throw error;
            app.alert("✅ Тариф успешно обновлен!");
            this.loadAdminData();
        } catch (e) {
            console.error(e);
            app.alert("Ошибка обновления: " + e.message);
        }
    },
    saveProfile: async function () {
        let name = document.getElementById('profile_name_input').value.trim();
        let phone = document.getElementById('profile_phone_input').value.trim();
        let city = document.getElementById('profile_city_input').value.trim();
        let email = document.getElementById('profile_email_input') ? document.getElementById('profile_email_input').value.trim() : '';
        if (!name) { app.alert('Имя не может быть пустым.'); return; }
        if (!city) { app.alert('Пожалуйста, укажите ваш город. Это необходимо для формирования смет.'); return; }
        if (phone && phone.length < 18) { app.alert('Введите корректный номер телефона.'); return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { app.alert('Пожалуйста, введите корректный email.'); return; }

        let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;
        if (!tgUser) return;

        // 1. Мгновенно сохраняем в локальное состояние для моментального отклика
        this.state.tgUser = this.state.tgUser || {};
        this.state.tgUser.first_name = name;
        this.state.tgUser.phone = phone;
        this.state.tgUser.city = city;
        this.state.tgUser.email = email;

        // Save company details for PRO tariff users
        if (this.isPro()) {
            this.state.customCompany = this.state.customCompany || {};
            this.state.customCompany.name = document.getElementById('profile_company_name').value.trim();
            this.state.customCompany.website = document.getElementById('profile_company_website').value.trim();
            this.state.customCompany.address = document.getElementById('profile_company_address').value.trim();
            this.state.customCompany.bank = document.getElementById('profile_company_bank').value.trim();
            this.updateHeaderCompanyDetails();
        }

        this.saveState();
        localStorage.setItem('user_city', city); // Дублируем для надежности

        this.syncUI();
        this.closeProfileModal();
        app.alert('✅ Профиль успешно сохранен!');

        // 2. В фоне синхронизируем с Supabase без блокировки UI
        (async () => {
            try {
                let query = supabaseClient.from('users').update({ username: name, phone: phone, city: city, email: email });
                if (tgUser.authUserId) query = query.eq('auth_user_id', tgUser.authUserId);
                else if (tgUser.email) query = query.eq('email', tgUser.email);
                const { error } = await query;
                if (error) throw error;
                if (tgUser.email) await supabaseClient.auth.updateUser({ data: { full_name: name, phone: phone } });
                console.log("[saveProfile] Профиль успешно синхронизирован с облаком Supabase.");
            } catch (error) {
                console.error('[saveProfile] Фоновая ошибка синхронизации профиля с Supabase:', error);
            }
        })();
    },
    maskPhone: function (input) {
        let val = input.value.replace(/\D/g, '');
        if (!val) { input.value = ''; return; }
        if (val[0] === '8' || val[0] === '9') val = '7' + (val[0] === '9' ? '9' : val.substring(1));
        if (val[0] !== '7') val = '7' + val;
        let res = '+7 ';
        let core = val.substring(1);
        if (core.length > 0) res += '(' + core.substring(0, 3);
        if (core.length >= 3) res += ') ' + core.substring(3, 6);
        if (core.length >= 6) res += '-' + core.substring(6, 8);
        if (core.length >= 8) res += '-' + core.substring(8, 10);
        input.value = res;
    },
    getDeviceName: function () {
        let ua = navigator.userAgent || '';
        let os = "Неизвестно";
        if (/Windows/i.test(ua)) os = "Windows";
        else if (/Mac/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = "Mac";
        else if (/iPhone|iPad/i.test(ua)) os = "iOS";
        else if (/Android/i.test(ua)) os = "Android";
        else if (/Linux/i.test(ua)) os = "Linux";
        let browser = "Браузер";
        if (/YaBrowser/i.test(ua)) browser = "Yandex";
        else if (/Edg/i.test(ua)) browser = "Edge";
        else if (/Chrome/i.test(ua)) browser = "Chrome";
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
        else if (/Firefox/i.test(ua)) browser = "Firefox";
        else if (/Telegram/i.test(ua)) browser = "Telegram";
        return os + " | " + browser;
    },

    deleteWork: async function (name) {
        if (!await app.confirm(`Удалить работу "${name}"?`)) return;
        if (!this.state.deletedWorks) this.state.deletedWorks = [];
        this.state.deletedWorks.push(name);
        // Если это была ручная работа - удаляем и из массива ручных
        if (this.state.userAddedWorks) {
            this.state.userAddedWorks = this.state.userAddedWorks.filter(w => w.name !== name);
        }
        this.saveState();
        this.render();
    },

    addCustomWork: async function () {
        if (!this.checkAccess('pro')) return;
        let name = await app.prompt("Введите название работы:", "Дополнительная работа");
        if (!name) return;
        let q = parseFloat((await app.prompt("Количество:", "1")).replace(',', '.')) || 1;
        let price = parseFloat((await app.prompt("Цена за единицу (₽):", "1000")).replace(',', '.')) || 0;

        if (!this.state.userAddedWorks) this.state.userAddedWorks = [];
        this.state.userAddedWorks.push({ name: name, q: q, price: price, unit: "шт", group: "5. Дополнительные работы" });
        this.saveState();
        this.render();
    },

    updateWorkPrice: function (name, val) {
        if (!this.state.customWorks) this.state.customWorks = {};
        // Очищаем от пробелов и оставляем только цифры
        let num = parseInt(val.replace(/[^\d]/g, ''));
        if (!isNaN(num)) {
            this.state.customWorks[name] = num;
        } else {
            // Если поле пустое - удаляем кастомную цену (возврат к базовой)
            delete this.state.customWorks[name];
        }
        this.saveState();
        this.render();
    },

    setViewMode: function (mode) {
        if (mode === 'works' && !this.checkAccess('pro')) return;
        this.state.viewMode = mode;
        let tEq = document.getElementById('tab_equipment');
        let tWk = document.getElementById('tab_works');
        if (tEq && tWk) {
            tEq.classList.toggle('active', mode === 'equipment');
            tWk.classList.toggle('active', mode === 'works');
        }
        document.body.classList.toggle('work-mode', mode === 'works');
        this.render();
    },
    toggleOpt: function (id) { this.state.optItems[id] = !this.state.optItems[id]; this.render(); },
    toggleDark: function (chk, event) {
        if (!this.checkAccess('base', event)) {
            document.getElementById('chk_dark').checked = this.state.darkMode;
            return;
        }
        this.state.darkMode = chk; document.body.classList.toggle('dark-mode', chk); this.saveState();
    },
    // Новая функция для переключения автоматики
    toggleUfhAuto: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            if (document.getElementById('chk_ufh_auto')) document.getElementById('chk_ufh_auto').checked = this.state.ufhAuto;
            return;
        }
        this.state.ufhAuto = chk; this.syncUI(); this.render();
    },

    toggleGroup: function (name) {
        const idx = this.state.collapsedGroups.indexOf(name);
        if (idx === -1) this.state.collapsedGroups.push(name);
        else this.state.collapsedGroups.splice(idx, 1);
        this.render();
    },
    toggleMerge: function (event) {
        if (!this.checkAccess('pro', event)) {
            let chk = document.getElementById('chk_merge');
            if (chk) setTimeout(() => { chk.checked = this.state.groupItems; }, 50);
            return;
        }

        let chk = document.getElementById('chk_merge');
        this.state.groupItems = chk.checked;
        this.render();
    },
    handlePremiumToggleClick: function (featureName, event) {
        event.preventDefault();
        event.stopPropagation();

        const isAuth = !!(this.state.tgUser || this.state.user || this.state.currentUser);
        if (!isAuth) {
            this.showAuthModal();
            return;
        }

        const isPro = this.isPro();
        if (!isPro) {
            this.showModal('pro');
            return;
        }

        // Если PRO-подписка активна, вручную переключаем input и вызываем обработчик
        if (featureName === 'cheaper') {
            const chk = document.getElementById('chk_cheaper');
            if (chk) {
                chk.checked = !chk.checked;
                this.setBrand(chk.checked ? 'rommer' : 'stout', event);
            }
        } else if (featureName === 'scheme') {
            const chk = document.getElementById('chk_scheme');
            if (chk) {
                chk.checked = !chk.checked;
                this.toggleScheme(chk.checked, event);
            }
        } else if (featureName === 'sku') {
            const chk = document.getElementById('chk_sku');
            if (chk) {
                chk.checked = !chk.checked;
                this.toggleSku(event);
            }
        } else if (featureName === 'merge') {
            const chk = document.getElementById('chk_merge');
            if (chk) {
                chk.checked = !chk.checked;
                this.toggleMerge(event);
            }
        }
    },
    updateDocumentTitle: function () {
        let sections = [];
        if (this.state.systems.includes('rad') || this.state.systems.includes('tp') || this.state.hotWater) {
            sections.push("котельная");
        }
        if (this.state.systems.includes('rad')) {
            sections.push("радиаторы");
        }
        if (this.state.systems.includes('tp')) {
            sections.push("теплый пол");
        }
        if (this.state.water) {
            sections.push("водоснабжение");
        }
        if (this.state.waterInput) {
            sections.push("узел ввода ХВС");
        }
        if (this.state.well) {
            sections.push("скважина");
        }

        let sewerToilets = 0;
        if (this.state.waterZones && this.state.waterZones.length > 0) {
            this.state.waterZones.forEach(z => {
                if (z.fixtures && z.fixtures.toilet) {
                    sewerToilets += z.fixtures.toilet;
                }
            });
        }
        if (sewerToilets > 0) {
            sections.push("канализация");
        }

        const objName = (this.state.projectName && this.state.projectName.trim()) ? this.state.projectName.trim() : "Новый объект";
        const areaVal = this.state.area || 0;
        const sectionsText = sections.length > 0 ? " (" + sections.join(", ") + ")" : "";
        let safeName = objName.replace(/[\\\/:\*\?"<>\|]/g, "");

        document.title = `КП ${safeName} - ${areaVal} м2${sectionsText}`;
        console.log("[updateDocumentTitle] Updated title to:", document.title);
    },
    generateLocalShareLink: async function (object_info, manager_info, items, totals) {
        const payload = {
            object_info: object_info,
            manager_info: manager_info,
            items: items,
            totals: totals
        };
        const encoded = await encodePayload(payload);
        const baseOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.origin : 'https://heatcalc.ru';
        return `${baseOrigin}/invoice.html?data=${encoded}`;
    },
    shareInvoice: async function () {
        if (!this.checkAccess('base')) return;

        let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;
        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocal && (!tgUser || !tgUser.first_name || !tgUser.phone || tgUser.phone.length < 16)) {
            tgUser = { first_name: "Тестовый Монтажник", phone: "+7 (999) 999-99-99", email: "test@installer.ru" };
        }

        if (!tgUser) {
            app.alert("Пожалуйста, авторизуйтесь, чтобы сформировать ссылку.");
            this.showAuthModal();
            return;
        }

        if (!tgUser.first_name || !tgUser.phone || tgUser.phone.length < 16 || !tgUser.email || !tgUser.email.includes('@') || !tgUser.city) {
            app.alert("Пожалуйста, укажите Ваше Имя, Телефон, Город и Email в профиле. Они необходимы для формирования ссылки для клиента.");
            this.showProfileModal();
            return;
        }

        let pName = this.state.projectName;
        if (!pName) {
            pName = await app.prompt("Введите название объекта для сохранения в облаке:", "Новый объект");
            if (!pName) {
                console.log("[shareInvoice] Отменено пользователем (ввод названия объекта)");
                return;
            }
            this.state.projectName = pName;
            this.saveState();
            this.syncUI();
        }

        // Генерируем уникальный ID расчета (если еще нет), чтобы избежать дубликатов при saveToCloud
        if (!this.state.calc_id) {
            const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            this.state.calc_id = `HC-${datePart}-${randPart}`;
            this.saveState();
        }

        this.render();

        let h1 = this.state.h1 || 2.7, h2 = this.state.h2 || 2.7;
        let avgH = (this.state.floors === 2) ? (h1 + h2) / 2 : h1;
        let pwr = 0;
        if (this.state.detailedRooms && this.state.rooms && this.state.rooms.length > 0) {
            let totalLoadW = 0;
            this.state.rooms.forEach(r => {
                let rHeight = (r.floor === 2) ? h2 : h1;
                let heightCoef = rHeight / 2.7;
                totalLoadW += (r.area * heightCoef * 70 * (this.state.region / 100) * this.state.mat);
                r.windows.forEach(w => {
                    let wHeight = w.isPan ? 2.5 : 1.5;
                    let wArea = parseFloat(w.width || 1) * wHeight;
                    totalLoadW += (wArea * 150 * (this.state.region / 100) * this.state.mat);
                });
            });
            pwr = (totalLoadW / 1000).toFixed(1);
        } else {
            pwr = (this.state.area * avgH * 37 * (this.state.region / 100) * this.state.mat / 1000).toFixed(1);
        }
        let regionName = "Сибирь"; if (this.state.region === 120) regionName = "Урал"; if (this.state.region === 100) regionName = "Центр"; if (this.state.region === 60) regionName = "Юг";

        let object_info = {
            projectName: this.state.projectName || "Новый объект",
            area: this.state.area,
            floors: this.state.floors,
            res: this.state.res,
            mat: this.state.mat,
            power: pwr,
            region: regionName,
            date: new Date().toLocaleDateString('ru-RU'),
            showSku: !!this.state.showSku
        };

        let manager_info = {
            name: tgUser.first_name || tgUser.username || '',
            phone: tgUser.phone || '',
            city: tgUser.city || '',
            email: (this.state.tgUser?.email || this.state.user?.email || localStorage.getItem('user_email') || ''),
            customCompany: (this.isPro() && this.state.customCompany) ? this.state.customCompany : null
        };

        let items = {
            equipment: this.currentEquipmentList || [],
            works: this.currentWorksList || []
        };

        let totals = {
            equipment: app.lastEqSum || 0,
            works: app.lastWorksSum || 0,
            grandTotal: (app.lastEqSum || 0) + (app.lastWorksSum || 0)
        };

        const btn = document.getElementById('btn_share_trigger');
        let origHtml = "Ссылка для клиента";
        if (btn) {
            origHtml = btn.innerHTML;
            btn.innerHTML = `<span class="loading-spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:stout-spin 0.8s linear infinite; margin-right:8px; vertical-align:middle;"></span>Генерация...`;
            btn.disabled = true;
        }

        const isProUser = this.isPro();

        if (!isProUser) {
            // ================== БАЗОВЫЙ ТАРИФ ==================
            // По умолчанию генерируем оффлайн-ссылку без обращения к Supabase
            try {
                const shareUrl = await this.generateLocalShareLink(object_info, manager_info, items, totals);

                app.copyToClipboard(shareUrl).then(() => {
                    app.prompt("✅ Ссылка создана и скопирована! Отправьте её клиенту:", shareUrl);
                }).catch(err => {
                    console.error('Ошибка копирования:', err);
                    app.prompt("✅ Ссылка создана! Скопируйте и отправьте клиенту:", shareUrl);
                });
            } catch (err) {
                console.error('[shareInvoice] Ошибка генерации оффлайн-ссылки:', err);
                app.alert("Произошла ошибка при создании ссылки: " + err.message);
            } finally {
                if (btn) {
                    btn.innerHTML = origHtml;
                    btn.disabled = false;
                }
            }
            return;
        }

        // ================== ПРЕМИУМ (PRO) ТАРИФ ==================
        // Пытаемся записать в Supabase с таймаутом в 10 секунд
        try {
            // -- НАДЕЖНАЯ ПРОВЕРКА СЕССИИ --
            let user = null;
            let authError = null;
            try {
                const { data: sessionData, error: sessionErr } = await withTimeout(supabaseClient.auth.getSession(), 4000);
                if (sessionData && sessionData.session) {
                    user = sessionData.session.user;
                } else {
                    const { data: userData, error: userErr } = await withTimeout(supabaseClient.auth.getUser(), 4000);
                    user = userData ? userData.user : null;
                    authError = userErr || sessionErr;
                }
            } catch (e) {
                console.warn('[shareInvoice] Ошибка проверки сессии:', e);
                authError = e;
            }

            // Резервный вариант: если произошел сетевой сбой / таймаут Supabase, но в стейте сохранен авторизованный пользователь
            if ((authError || !user) && this.state.tgUser) {
                console.log('[shareInvoice] Сбой сети или таймаут Supabase. Используем локальную сохраненную сессию.');
                user = {
                    id: this.state.tgUser.authUserId || this.state.tgUser.id,
                    email: this.state.tgUser.email || ''
                };
                authError = null; // Сбрасываем ошибку, так как локальная сессия валидна
            }

            if (authError || !user) {
                app.alert("Ошибка: Вы не авторизованы. Войдите в систему для создания ссылки.");
                if (btn) {
                    btn.innerHTML = origHtml;
                    btn.disabled = false;
                }
                return;
            }
            // -- КОНЕЦ ПРОВЕРКИ --

            // Получаем существующий статус сметы для его корректного сохранения/сброса при обновлении
            let existingObjectInfo = {};
            if (this.state.shared_invoice_id) {
                try {
                    const { data: existingData, error: existingError } = await withTimeout(
                        supabaseClient
                            .from('shared_invoices')
                            .select('object_info')
                            .eq('id', this.state.shared_invoice_id)
                            .maybeSingle(),
                        4000
                    );
                    if (!existingError && existingData && existingData.object_info) {
                        existingObjectInfo = existingData.object_info;
                    }
                } catch (e) {
                    console.error('[shareInvoice] Ошибка при получении существующей сметы:', e);
                }
            }

            let newStatus = 'sent';
            let clientComment = existingObjectInfo.client_comment || null;
            let statusUpdatedAt = existingObjectInfo.status_updated_at || null;

            if (existingObjectInfo.status && existingObjectInfo.status !== newStatus) {
                statusUpdatedAt = new Date().toISOString();
            }

            object_info.status = newStatus;
            object_info.client_comment = clientComment;
            object_info.status_updated_at = statusUpdatedAt;

            let dbUserId = null;
            if (this.state.tgUser && this.state.tgUser.id && /^\d+$/.test(String(this.state.tgUser.id))) {
                dbUserId = parseInt(this.state.tgUser.id);
            }
            if (!dbUserId) {
                try {
                    let { data: uData, error: uError } = await withTimeout(
                        supabaseClient
                            .from('users')
                            .select('id')
                            .eq('auth_user_id', user.id)
                            .maybeSingle(),
                        4000
                    );
                    if (!uError && uData) {
                        dbUserId = uData.id;
                        this.state.tgUser = this.state.tgUser || {};
                        this.state.tgUser.id = dbUserId;
                        this.saveState();
                    }
                } catch (e) {
                    console.warn('[shareInvoice] Ошибка при поиске пользователя:', e);
                }
            }

            if (!dbUserId) {
                const email = user.email || '';
                if (email) {
                    try {
                        let { data: uData } = await withTimeout(
                            supabaseClient
                                .from('users')
                                .select('id')
                                .eq('email', email)
                                .maybeSingle(),
                            4000
                        );
                        if (uData) {
                            dbUserId = uData.id;
                            this.state.tgUser = this.state.tgUser || {};
                            this.state.tgUser.id = dbUserId;
                            this.saveState();
                        }
                    } catch (e) {
                        console.warn('[shareInvoice] Ошибка при поиске по email:', e);
                    }
                }
            }

            if (!dbUserId) {
                throw new Error("Профиль пользователя не найден в базе данных. Попробуйте выйти и войти в аккаунт заново.");
            }

            const insertPayload = {
                object_info: object_info,
                manager_info: manager_info,
                items: items,
                totals: totals,
                user_id: user.id
            };

            if (this.state.shared_invoice_id) {
                insertPayload.id = this.state.shared_invoice_id;
            }

            let { data, error } = await withTimeout(
                supabaseClient
                    .from('shared_invoices')
                    .upsert([insertPayload], { onConflict: 'id' })
                    .select('id')
                    .single(),
                6000
            );

            if (error) {
                console.warn('[shareInvoice] Ошибка при сохранении (пробуем RLS/fallback):', error);
                const fallbackPayload = { ...insertPayload };
                delete fallbackPayload.id;

                const { data: fallbackData, error: fallbackError } = await withTimeout(
                    supabaseClient
                        .from('shared_invoices')
                        .insert([fallbackPayload])
                        .select('id')
                        .single(),
                    5000
                );

                if (fallbackError) {
                    throw fallbackError;
                }
                data = fallbackData;
            }

            const shareId = data.id;
            this.state.shared_invoice_id = shareId;
            this.saveState();

            try {
                await withTimeout(this.saveToCloud(true), 4000);
            } catch (saveCloudErr) {
                console.error('[shareInvoice] Ошибка фонового сохранения сметы:', saveCloudErr);
            }

            const baseOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.origin : 'https://heatcalc.ru';
            const shareUrl = `${baseOrigin}/invoice.html?id=${shareId}`;

            app.copyToClipboard(shareUrl).then(() => {
                app.prompt("✅ Ссылка создана и скопирована! Отправьте её клиенту:", shareUrl);
            }).catch(err => {
                console.error('Ошибка копирования:', err);
                app.prompt("✅ Ссылка создана! Скопируйте и отправьте клиенту:", shareUrl);
            });

        } catch (supabaseErr) {
            console.warn('[shareInvoice] Supabase connection failed, falling back to local payload URL:', supabaseErr);
            if (this.isPro()) {
                app.alert("Создана офлайн-ссылка без кнопок согласования.");
            }
            try {
                const shareUrl = await this.generateLocalShareLink(object_info, manager_info, items, totals);

                app.copyToClipboard(shareUrl).then(() => {
                    app.prompt("✅ Ссылка создана и скопирована! Отправьте её клиенту:", shareUrl);
                }).catch(err => {
                    console.error('Ошибка копирования:', err);
                    app.prompt("✅ Ссылка создана! Скопируйте и отправьте клиенту:", shareUrl);
                });
            } catch (fallbackErr) {
                console.error('[shareInvoice] Ошибка генерации автономной ссылки при откате:', fallbackErr);
                app.alert("Произошла ошибка при создании ссылки: " + getFriendlyErrorMessage(supabaseErr));
            }
        } finally {
            if (btn) {
                btn.innerHTML = origHtml;
                btn.disabled = false;
            }
        }
    },
    download: function () {
        if (!this.checkAccess('base')) return;
        let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;

        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocal && (!tgUser || !tgUser.first_name || !tgUser.phone || tgUser.phone.length < 16)) {
            tgUser = { first_name: "Тестовый Монтажник", phone: "+7 (999) 999-99-99" };
        }

        if (!tgUser || !tgUser.first_name || !tgUser.phone || tgUser.phone.length < 16 || !tgUser.city) {
            app.alert("Пожалуйста, укажите Ваше Имя, Телефон и Город в профиле. Они необходимы для формирования красивой печатной сметы.");
            this.showProfileModal();
            return;
        }

        const printBlock = document.getElementById('print_master_contacts');
        if (tgUser && printBlock) {
            document.getElementById('print_master_name').innerText = tgUser.first_name || tgUser.username || '';
            document.getElementById('print_master_phone').innerText = tgUser.phone || '';
            printBlock.style.display = 'block';
        }

        // Временно отключаем темную тему перед печатью для светлого фона документа
        const wasDark = document.body.classList.contains('dark-mode');
        if (wasDark) document.body.classList.remove('dark-mode');

        this.updateDocumentTitle();
        window.print();

        // Возвращаем тему обратно
        if (wasDark) document.body.classList.add('dark-mode');
    },
    saveJobToCloud: async function (stateData, eqSum = 0, worksSum = 0) {
        console.log("[saveJobToCloud] Запущен фоновый сейв для проекта:", stateData.projectName);
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

            let dbUserId = null;
            const tgUser = stateData.tgUser;
            if (tgUser && tgUser.id) {
                dbUserId = tgUser.id;
            }
            if (!dbUserId && (tgUser || session)) {
                const authUserId = session ? session.user.id : (tgUser ? tgUser.authUserId : null);
                const email = session ? session.user.email : (tgUser ? tgUser.email : null);

                if (authUserId) {
                    let { data: uData } = await supabaseClient.from('users').select('id').eq('auth_user_id', authUserId).maybeSingle();
                    if (uData) dbUserId = uData.id;
                } else if (email) {
                    let { data: uData } = await supabaseClient.from('users').select('id').eq('email', email).maybeSingle();
                    if (uData) dbUserId = uData.id;
                }
            }

            if (!dbUserId && !isLocal) {
                console.warn("[saveJobToCloud] Профиль пользователя не найден в БД. Сохраняем расчет без привязки к user_id.");
            }

            const insertData = {
                project_name: stateData.projectName || "Новый объект",
                share_id: stateData.calc_id || null,
                calc_data: stateData,
                total_sum: eqSum + worksSum,
                eq_sum: eqSum,
                works_sum: worksSum,
                user_id: dbUserId
            };

            let saveError = null;
            if (stateData.calc_id) {
                const { data: existing } = await supabaseClient
                    .from('estimates')
                    .select('id, user_id')
                    .eq('share_id', stateData.calc_id)
                    .limit(1);

                if (existing && existing.length > 0) {
                    if (String(existing[0].user_id) === String(dbUserId)) {
                        const { error } = await supabaseClient
                            .from('estimates')
                            .update(insertData)
                            .eq('id', existing[0].id);
                        saveError = error;
                    } else {
                        const { error } = await supabaseClient
                            .from('estimates')
                            .insert([insertData]);
                        saveError = error;
                    }
                } else {
                    const { error } = await supabaseClient
                        .from('estimates')
                        .insert([insertData]);
                    saveError = error;
                }
            } else {
                const { error } = await supabaseClient
                    .from('estimates')
                    .insert([insertData]);
                saveError = error;
            }

            if (saveError) {
                console.error("[saveJobToCloud] Ошибка Supabase:", saveError);
                return false;
            }

            return true;
        } catch (error) {
            console.error("[saveJobToCloud] Ошибка в блоке catch:", error);
            return false;
        }
    },
    queue: {
        _isProcessing: false,
        getQueue: function () {
            try {
                return JSON.parse(localStorage.getItem('email_dispatch_queue')) || [];
            } catch (e) {
                return [];
            }
        },
        saveQueue: function (q) {
            localStorage.setItem('email_dispatch_queue', JSON.stringify(q));
        },
        addJob: function (job) {
            const q = this.getQueue();
            q.push(job);
            this.saveQueue(q);
            this.processNext();
        },
        processNext: async function () {
            if (this._isProcessing) return;
            this._isProcessing = true;

            try {
                const q = this.getQueue();
                const job = q.find(j => j.status === 'pending' || j.status === 'retry');
                if (!job) {
                    this._isProcessing = false;
                    return;
                }

                console.log("[Queue] Обработка задачи:", job.id, "Попытка:", job.retries + 1);
                job.status = 'processing';
                this.saveQueue(q);

                let success = false;
                try {
                    // 1. Сохранение в Supabase (неблокирующее для отправки писем)
                    console.log("[Queue] Шаг 1: Сохранение в Supabase для задачи:", job.id);
                    try {
                        const isSaved = await app.saveJobToCloud(job.stateData, job.eqSum, job.worksSum);
                        if (!isSaved) {
                            console.warn("[Queue] Не удалось сохранить смету в облаке (продолжаем отправку письма)");
                        }
                    } catch (supabaseErr) {
                        console.error("[Queue] Исключение при сохранении в Supabase:", supabaseErr);
                    }

                    // 2. Отправка через EmailJS
                    console.log("[Queue] Шаг 2: Фоновая отправка письма через EmailJS для задачи:", job.id);
                    if (typeof emailjs === 'undefined') {
                        throw new Error("Библиотека EmailJS не обнаружена");
                    }
                    emailjs.init(job.emailJsKey);
                    const result = await emailjs.send(job.serviceId, job.templateId, job.templateParams);
                    console.log("[Queue] Ответ от EmailJS:", result);

                    if (result.status === 200) {
                        success = true;
                    } else {
                        throw new Error("EmailJS ошибка: " + result.text);
                    }
                } catch (jobErr) {
                    console.error("[Queue] Ошибка при обработке задачи:", job.id, jobErr);
                    job.lastError = jobErr.message || String(jobErr);
                }

                const freshQ = this.getQueue();
                const freshJob = freshQ.find(j => j.id === job.id);

                if (success) {
                    console.log("[Queue] Задача успешно завершена:", job.id);
                    const filtered = freshQ.filter(j => j.id !== job.id);
                    this.saveQueue(filtered);
                } else {
                    if (freshJob) {
                        freshJob.retries = (freshJob.retries || 0) + 1;
                        if (freshJob.retries >= 5) {
                            console.error("[Queue] Превышено максимальное количество попыток отправки:", job.id);
                            freshJob.status = 'failed';
                        } else {
                            console.log("[Queue] Задача запланирована на повтор:", job.id);
                            freshJob.status = 'retry';
                            freshJob.nextAttemptAt = Date.now() + Math.min(300000, 5000 * Math.pow(2, freshJob.retries));
                        }
                        this.saveQueue(freshQ);
                    }
                }

            } catch (globalErr) {
                console.error("[Queue] Критическая ошибка очереди:", globalErr);
            } finally {
                this._isProcessing = false;
                setTimeout(() => this.processNext(), 5000);
            }
        },
        start: function () {
            console.log("[Queue] Фоновый воркер запущен.");
            this.processNext();
            setInterval(() => {
                const q = this.getQueue();
                const now = Date.now();
                let needsProcess = false;
                q.forEach(j => {
                    if (j.status === 'retry' && (!j.nextAttemptAt || now >= j.nextAttemptAt)) {
                        j.status = 'pending';
                        needsProcess = true;
                    }
                });
                if (needsProcess) {
                    this.saveQueue(q);
                    this.processNext();
                }
            }, 10000);
        }
    },
    sendEmail: async function () {
        console.log("[sendEmail] Функция запущенна.");
        let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;
        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isLocal && (!tgUser || !tgUser.first_name || !tgUser.phone || tgUser.phone.length < 16)) {
            tgUser = { first_name: "Тестовый Монтажник", phone: "+7 (999) 999-99-99", email: "test@installer.ru" };
        }

        if (!tgUser) {
            console.log("[sendEmail] Пользователь не авторизован.");
            app.alert("Пожалуйста, авторизуйтесь, чтобы отправить смету.");
            this.showAuthModal();
            return;
        }

        if (!tgUser.first_name || !tgUser.phone || tgUser.phone.length < 16 || !tgUser.email || !tgUser.email.includes('@') || !tgUser.city) {
            console.log("[sendEmail] Неполный профиль пользователя.");
            app.alert("Пожалуйста, укажите Ваше Имя, Телефон, Город и Email в профиле. Они необходимы для отправки сметы.");
            this.showProfileModal();
            return;
        }

        let pName = this.state.projectName;
        if (!pName) {
            pName = await app.prompt("Введите название объекта для сохранения в облаке:", "Новый объект");
            if (!pName) {
                console.log("[sendEmail] Отменено пользователем (ввод названия объекта)");
                return;
            }
            this.state.projectName = pName;
            this.saveState();
            this.syncUI();
            this.render();
        }

        let userCity = (this.state.tgUser && this.state.tgUser.city) ||
            (this.state.user && this.state.user.city) ||
            (document.getElementById('profile_city_input') ? document.getElementById('profile_city_input').value.trim() : null) ||
            localStorage.getItem('user_city');

        if (!userCity) {
            userCity = await app.prompt("Пожалуйста, укажите ваш город для корректного выставления счёта:");
            if (!userCity || userCity.trim() === '') {
                console.log("[sendEmail] Отменено пользователем (ввод города)");
                await app.alert("Действие отменено: город обязателен для формирования счёта.");
                return;
            }
            localStorage.setItem('user_city', userCity.trim());
            if (this.state.tgUser) {
                this.state.tgUser.city = userCity.trim();
                this.saveState();
            } else if (this.state.user) {
                this.state.user.city = userCity.trim();
                this.saveState();
            }
        }

        const btn = document.querySelector('.btn-tg');
        if (!btn) {
            console.error("[sendEmail] Кнопка .btn-tg не найдена!");
            return;
        }
        const originalHtml = btn.innerHTML;
        btn.disabled = true;

        // Быстрый лоадер (оптимистичный UI)
        btn.innerHTML = '⌛ Подготовка счёта...';

        try {
            // ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID РАСЧЕТА (если еще нет)
            if (!this.state.calc_id) {
                const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
                this.state.calc_id = `HC-${datePart}-${randPart}`;
                this.saveState();
            }
            console.log("[sendEmail] Сгенерирован/получен ID расчета:", this.state.calc_id);

            // Актуализируем спецификацию
            this.render();

            const EMAILJS_SERVICE_ID = "service_o11b4ej";
            const EMAILJS_TEMPLATE_ID = "template_lg1zol9";
            const EMAILJS_PUBLIC_KEY = "-m4N93pTqMlCfuBpT";

            // 1. Формируем простую и наглядную таблицу оборудования (Название - Артикул - Количество)
            let equipmentText = "Название - Артикул - Количество\n";
            equipmentText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            (this.currentSpec || []).forEach((item, idx) => {
                const sku = item.id || item.code || "—";
                equipmentText += `${idx + 1}. ${item.name} - ${sku} - ${item.q} шт.\n`;
            });
            equipmentText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

            // 2. Формируем таблицу для легкого импорта в 1С (Артикул|Количество)
            let copyTableText = "";
            (this.currentSpec || []).forEach(item => {
                const sku = item.id || item.code || "";
                if (sku) {
                    copyTableText += `${sku}|${item.q}\n`;
                }
            });

            // Добавляем таблицу копирования прямо в конец списка оборудования для максимального удобства
            equipmentText += "📋 ТАБЛИЦА ДЛЯ ИМПОРТА (выделите и скопируйте):\n";
            equipmentText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            equipmentText += copyTableText;
            equipmentText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

            // 3. Получаем названия параметров из стейта
            let regionName = "Центр";
            if (this.state.region === 120) regionName = "Урал";
            if (this.state.region === 100) regionName = "Центр";
            if (this.state.region === 60) regionName = "Юг";
            if (this.state.region === 150) regionName = "Сибирь";

            let boilerName = "Не выбран";
            let fuelArr = [];
            if (this.state.fuels && this.state.fuels.includes('el')) fuelArr.push('Электро');
            if (this.state.fuels && this.state.fuels.includes('gas')) fuelArr.push('Газ');
            if (fuelArr.length > 0) boilerName = fuelArr.join(' / ');

            const eqSum = app.lastEqSum || 0;
            const worksSum = (this.state.accountType === 'pro') ? (app.lastWorksSum || 0) : 0;
            const total = eqSum + worksSum;

            const authorName = tgUser.first_name || tgUser.username || "Дмитрий";

            // ГЕНЕРАЦИЯ / Upsert В ТАБЛИЦУ shared_invoices ДЛЯ СОЗДАНИЯ РАБОЧЕЙ ОНЛАЙН ССЫЛКИ КЛИЕНТА
            let shareId = this.state.shared_invoice_id;
            const baseOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.origin : 'https://heatcalc.ru';
            let viewUrl = "";

            try {
                // Расчет теплопотерь
                let h1 = this.state.h1 || 2.7, h2 = this.state.h2 || 2.7;
                let avgH = (this.state.floors === 2) ? (h1 + h2) / 2 : h1;
                let pwr = 0;
                if (this.state.detailedRooms && this.state.rooms && this.state.rooms.length > 0) {
                    let totalLoadW = 0;
                    this.state.rooms.forEach(r => {
                        let rHeight = (r.floor === 2) ? h2 : h1;
                        let heightCoef = rHeight / 2.7;
                        totalLoadW += (r.area * heightCoef * 70 * (this.state.region / 100) * this.state.mat);
                        r.windows.forEach(w => {
                            let wHeight = w.isPan ? 2.5 : 1.5;
                            let wArea = parseFloat(w.width || 1) * wHeight;
                            totalLoadW += (wArea * 150 * (this.state.region / 100) * this.state.mat);
                        });
                    });
                    pwr = (totalLoadW / 1000).toFixed(1);
                } else {
                    pwr = (this.state.area * avgH * 37 * (this.state.region / 100) * this.state.mat / 1000).toFixed(1);
                }

                const object_info = {
                    projectName: pName,
                    area: this.state.area,
                    floors: this.state.floors,
                    res: this.state.res,
                    mat: this.state.mat,
                    power: pwr,
                    region: regionName,
                    date: new Date().toLocaleDateString('ru-RU'),
                    showSku: !!this.state.showSku,
                    status: 'sent',
                    client_comment: null,
                    status_updated_at: null
                };

                const manager_info = {
                    name: authorName,
                    phone: tgUser.phone || '',
                    city: tgUser.city || '',
                    email: (this.state.tgUser?.email || this.state.user?.email || localStorage.getItem('user_email') || ''),
                    customCompany: (this.isPro() && this.state.customCompany) ? this.state.customCompany : null
                };

                const items = {
                    equipment: this.currentEquipmentList || [],
                    works: this.currentWorksList || []
                };

                const totals = {
                    equipment: eqSum,
                    works: worksSum,
                    grandTotal: total
                };

                const { data: sessionData } = await withTimeout(supabaseClient.auth.getSession(), 3000).catch(() => ({ data: { session: null } }));
                const sessionUser = sessionData?.session?.user;
                const authUserId = sessionUser ? sessionUser.id : (tgUser.authUserId || null);

                // Получаем внутренний dbUserId из таблицы public.users (поскольку user_id - внешний ключ на public.users.id)
                let dbUserId = null;
                if (tgUser && tgUser.id) {
                    dbUserId = tgUser.id;
                }
                if (!dbUserId && authUserId) {
                    try {
                        const { data: uData } = await withTimeout(
                            supabaseClient
                                .from('users')
                                .select('id')
                                .eq('auth_user_id', authUserId)
                                .maybeSingle(),
                            3000
                        );
                        if (uData) dbUserId = uData.id;
                    } catch (e) {
                        console.warn('[sendEmail] Ошибка поиска по auth_user_id:', e);
                    }
                }
                if (!dbUserId) {
                    const email = tgUser.email || (this.state.tgUser?.email || this.state.user?.email || localStorage.getItem('user_email') || '');
                    if (email) {
                        try {
                            const { data: uData } = await withTimeout(
                                supabaseClient
                                    .from('users')
                                    .select('id')
                                    .eq('email', email)
                                    .maybeSingle(),
                                3000
                            );
                            if (uData) dbUserId = uData.id;
                        } catch (e) {
                            console.warn('[sendEmail] Ошибка поиска по email:', e);
                        }
                    }
                }

                const insertPayload = {
                    object_info: object_info,
                    manager_info: manager_info,
                    items: items,
                    totals: totals,
                    user_id: dbUserId
                };

                if (shareId) {
                    insertPayload.id = shareId;
                }

                let { data, error } = await withTimeout(
                    supabaseClient
                        .from('shared_invoices')
                        .upsert([insertPayload], { onConflict: 'id' })
                        .select('id')
                        .single(),
                    4000
                );

                if (error) {
                    const fallbackPayload = { ...insertPayload };
                    delete fallbackPayload.id;
                    const { data: fallbackData, error: fallbackError } = await withTimeout(
                        supabaseClient
                            .from('shared_invoices')
                            .insert([fallbackPayload])
                            .select('id')
                            .single(),
                        4000
                    );
                    if (fallbackError) throw fallbackError;
                    data = fallbackData;
                }

                shareId = data.id;
                this.state.shared_invoice_id = shareId;
                this.saveState();

                viewUrl = `${baseOrigin}/invoice.html?id=${shareId}`;
            } catch (err) {
                console.warn("[sendEmail] Сбой сохранения в shared_invoices, генерируем offline fallback:", err);
                try {
                    let items = {
                        equipment: this.currentEquipmentList || [],
                        works: this.currentWorksList || []
                    };
                    let totals = {
                        equipment: eqSum,
                        works: worksSum,
                        grandTotal: total
                    };
                    viewUrl = await this.generateLocalShareLink(
                        { projectName: pName, area: this.state.area, floors: this.state.floors, res: this.state.res, mat: this.state.mat, power: 0, region: regionName, date: new Date().toLocaleDateString('ru-RU'), showSku: !!this.state.showSku },
                        { name: authorName, phone: tgUser.phone || '', city: tgUser.city || '', email: tgUser.email || '' },
                        items,
                        totals
                    );
                } catch (fallbackErr) {
                    console.error("[sendEmail] Ошибка генерации офлайн-ссылки:", fallbackErr);
                }
            }

            const managerViewUrl = viewUrl ? (viewUrl.includes('?') ? `${viewUrl}&manager=1` : `${viewUrl}?manager=1`) : "";

            // 4. Собираем итоговый объект данных для EmailJS
            const templateParams = {
                project_name: pName,
                calc_id: this.state.calc_id,
                user_name: authorName,
                user_phone: tgUser.phone || "Не указан",
                user_email: (this.state.tgUser?.email || this.state.user?.email || 'Не указан'),
                user_city: (this.state.tgUser?.city || this.state.user?.city || localStorage.getItem('user_city') || 'Не указан'),
                user_status: (this.state.accountType === 'pro') ? "PRO" : "Базовый",
                area: this.state.area || 0,
                region: regionName,
                boiler_type: boilerName,
                total_sum: eqSum.toLocaleString('ru-RU') + " ₽",
                equipment_list: equipmentText,
                copy_table: copyTableText, // также передаем отдельным параметром на всякий случай
                view_url: managerViewUrl // Полностью рабочая ссылка на счет для менеджера (с кнопкой 1С)
            };

            // Клонируем стейт для независимого сохранения в фоне
            const stateClone = JSON.parse(JSON.stringify(this.state));

            // Создаем задачу в фоновой очереди
            const job = {
                id: "job_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
                stateData: stateClone,
                eqSum: eqSum,
                worksSum: worksSum,
                templateParams: templateParams,
                serviceId: EMAILJS_SERVICE_ID,
                templateId: EMAILJS_TEMPLATE_ID,
                emailJsKey: EMAILJS_PUBLIC_KEY,
                retries: 0,
                status: "pending",
                created_at: Date.now()
            };

            console.log("[sendEmail] Добавление задачи в фоновую очередь:", job.id);

            // Искусственная микрозадержка в 300мс для улучшения плавности UI
            await new Promise(resolve => setTimeout(resolve, 300));

            // Ставим задачу в очередь
            this.queue.addJob(job);

            // Оптимистично помечаем как сохраненную на клиенте
            this.lastSavedStateString = this.getStateSignature();
            this.markAsSaved();

            // Сразу показываем модалку успеха!
            this.showEmailSuccessModal();

        } catch (error) {
            console.error("[sendEmail] Ошибка при подготовке к отправке:", error);
            app.alert("⚠️ Не удалось запустить отправку сметы:\n\n" + error.message);
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    },

    loadFromCode: async function () {
        let code = await app.prompt("Вставьте код расчета (например, HC-240409-S4DT или старый JSON):");
        if (!code) return;

        code = code.trim();

        // 1. ПОИСК ПО КОРОТКОМУ КОДУ В БАЗЕ (HC-...)
        if (code.startsWith('HC-')) {
            try {
                const { data, error } = await supabaseClient
                    .from('estimates')
                    .select('calc_data')
                    .eq('share_id', code)
                    .single();

                if (error || !data) {
                    throw new Error("Расчет с таким кодом не найден в базе данных.");
                }

                if (data.calc_data) {
                    let savedState = data.calc_data;

                    // Удаляем чужие личные данные перед загрузкой
                    delete savedState.tgUser;
                    delete savedState.accountType;
                    delete savedState.demoUsed;
                    delete savedState.darkMode;

                    this.state = { ...this.state, ...savedState };
                    this.syncUI();
                    this.render();
                    app.alert("✅ Расчет успешно загружен по коду!");
                    return;
                }
            } catch (err) {
                console.error("Ошибка загрузки по коду:", err);
                app.alert("❌ Ошибка! Неверный код или расчет не найден.");
                return;
            }
        }

        // 2. СЕРИАЛИЗОВАННЫЙ КОД (JSON / BASE64)
        try {
            let cleanCode = code.replace(/`/g, '').trim();
            let savedState = {};
            if (cleanCode.startsWith('{')) {
                savedState = JSON.parse(cleanCode);
            } else {
                savedState = JSON.parse(decodeURIComponent(escape(atob(cleanCode))));
            }

            if (savedState) {
                delete savedState.tgUser;
                delete savedState.accountType;
                delete savedState.demoUsed;
                delete savedState.darkMode;

                this.state = { ...this.state, ...savedState };
                this.syncUI();
                this.render();
            }
        } catch (e) {
            console.error("Ошибка десериализации:", e);
            app.alert("❌ Ошибка! Неверный формат кода. Попробуйте скопировать снова.");
        }
    },
    // === НОВАЯ ФУНКЦИЯ СБРОСА ===
    reset: async function () {
        if (!await app.confirm("Сбросить все настройки и начать расчет заново?")) return;

        // Запоминаем важные данные перед сбросом
        const currentDarkMode = this.state.darkMode;
        const currentTgUser = this.state.tgUser;
        const currentAccType = this.state.accountType;

        // Полный сброс данных расчета
        this.state = {
            waterInput: false, outdoorFaucet: false, bigBlueFilter: false, heatingFeed: false, convConnectionType: 'straight', detailedRooms: false, rooms: [], convectorType: 'scq', well: false, wellDepth: 30, wellDist: 15, wellAutoType: 'sirio', h1: 2.7, h2: 2.7, viewMode: 'equipment', showScheme: false, optItems: {}, darkMode: currentDarkMode, area: 150, floors: 1, region: 100, mat: 1.0, fuels: ['el'], systems: [], hotWater: false, recirc: false, res: 3, win: 4, tp1: 0, tp2: 0, showSku: false, coolant: 'water', groupItems: false, collapsedGroups: [], swaps: {}, showSwapFor: null, radType: 'space', headType: 'gas', connectionType: 'angled', boilerType: 'optibase', ufhZones: 1, ufhCtrl: 'mech', pumpType: 'default', boilerSeries: 'status', hydroType: 'combo', pipeType: 'insulated', ufhBaseType: 'mat', radManifoldType: 'standard', water: false, waterZones: [], ufhAuto: false, projectName: "", brandMode: "stout", customWorks: {}, showImages: true,
            // ВОЗВРАЩАЕМ АВТОРИЗАЦИЮ И ТАРИФ НА МЕСТО
            tgUser: currentTgUser,
            accountType: currentAccType
        };

        this.saveState();
        this.syncUI();
        this.render();
    },
    // =============================
    saveState: function () { localStorage.setItem('stout_save', JSON.stringify(this.state)); },

    switchMobileTab: function (tab) {
        if (window.innerWidth > 768) return;
        this.state.mobTab = tab;
        this.syncMobileUI();
        this.saveState();
    },

    syncMobileUI: function () {
        if (window.innerWidth > 768) {
            document.body.classList.remove('mob-tab-inputs', 'mob-tab-output');
            return;
        }
        document.querySelectorAll('.mob-nav-item').forEach(el => el.classList.remove('active'));
        let activeTab = this.state.mobTab || 'inputs';
        let navBtn = document.getElementById('mob_nav_' + activeTab);
        if (navBtn) navBtn.classList.add('active');

        if (activeTab === 'output') {
            document.body.classList.add('mob-tab-output');
            document.body.classList.remove('mob-tab-inputs');
            window.scrollTo(0, 0);
        } else {
            document.body.classList.add('mob-tab-inputs');
            document.body.classList.remove('mob-tab-output');
        }
    },

    // === ТОСТ-УВЕДОМЛЕНИЯ О СМЕНЕ СТАТУСА ===
    showInAppNotification: function (title, body, icon = '🔔') {
        let container = document.getElementById('calc_toast_container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'calc_toast_container';
            container.className = 'calc-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'calc-toast-notification';
        toast.innerHTML = `
            <div class="calc-toast-icon">${icon}</div>
            <div class="calc-toast-content">
                <div class="calc-toast-title">${title}</div>
                <div class="calc-toast-body">${body}</div>
            </div>
            <button class="calc-toast-close" onclick="this.parentElement.classList.add('toast-removing'); setTimeout(() => this.parentElement.remove(), 350);">✕</button>
        `;

        container.appendChild(toast);

        // Автоудаление через 8 секунд
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-removing');
                setTimeout(() => toast.remove(), 350);
            }
        }, 8000);
    },

    checkStatusNotifications: async function () {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const tgUser = this.state.tgUser;
            if (!session && !tgUser) return;

            // Получаем текущего пользователя из БД
            let uRow = null;
            if (session) {
                let { data } = await supabaseClient.from('users').select('id').eq('auth_user_id', session.user.id).maybeSingle();
                uRow = data;
            } else if (tgUser && tgUser.authUserId) {
                let { data } = await supabaseClient.from('users').select('id').eq('auth_user_id', tgUser.authUserId).maybeSingle();
                uRow = data;
            }
            if (!uRow) return;

            // Получаем сметы пользователя у которых есть shared_invoice_id
            const { data: estimates } = await supabaseClient
                .from('estimates')
                .select('id, project_name, calc_data')
                .eq('user_id', uRow.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!estimates || estimates.length === 0) return;

            const sharedIds = estimates.map(e => e.calc_data?.shared_invoice_id).filter(Boolean);
            if (sharedIds.length === 0) return;

            // Получаем текущие статусы из shared_invoices
            const { data: sharedList } = await supabaseClient
                .from('shared_invoices')
                .select('id, object_info')
                .in('id', sharedIds);

            if (!sharedList || sharedList.length === 0) return;

            // Сравниваем с localStorage
            let seenRaw = localStorage.getItem('seen_estimate_statuses');
            let seen = {};
            try { seen = seenRaw ? JSON.parse(seenRaw) : {}; } catch (e) { seen = {}; }

            const statusLabels = {
                'confirmed': { label: '✅ Согласована клиентом', icon: '✅' },
                'needs_revision': { label: '✍️ Отклонена — требуется доработка', icon: '⚠️' },
                'sent': { label: 'Отправлена клиенту', icon: '📤' }
            };

            let updated = false;
            sharedList.forEach(item => {
                const currentStatus = item.object_info?.status || 'sent';
                const prevStatus = seen[item.id];

                if (prevStatus !== undefined && prevStatus !== currentStatus) {
                    // Статус изменился — показываем уведомление
                    const estInfo = estimates.find(e => e.calc_data?.shared_invoice_id === item.id);
                    const projectName = estInfo?.project_name || 'Объект';
                    const statusInfo = statusLabels[currentStatus] || { label: currentStatus, icon: '🔔' };

                    this.showInAppNotification(
                        `Смета «${projectName}»`,
                        statusInfo.label,
                        statusInfo.icon
                    );
                }

                seen[item.id] = currentStatus;
                updated = true;
            });

            if (updated) {
                localStorage.setItem('seen_estimate_statuses', JSON.stringify(seen));
            }
        } catch (e) {
            console.error('[checkStatusNotifications] Error:', e);
        }
    },

    init: function () {
        // Global premium modal overrides
        window.alert = (msg) => app.alert(msg);
        window.confirm = (msg) => app.confirm(msg);
        window.prompt = (msg, def) => app.prompt(msg, def);

        this.captureUTM();
        if (localStorage.getItem('stout_save')) {
            try { this.state = { ...this.state, ...JSON.parse(localStorage.getItem('stout_save')) }; } catch (e) { console.error("Ошибка загрузки сохранения", e); }
        }
        let radAlts = [catalog.rads[0], titanRads[0], steelRads[0]];
        catalog.rads.forEach(rad => { rad.alts = radAlts; }); titanRads.forEach(rad => { rad.alts = radAlts; }); steelRads.forEach(rad => { rad.alts = radAlts; });
        let hAlts = catalog.h_valves; catalog.h_valves.forEach(v => { v.alts = hAlts; });
        let boilerAlts = [catalog.tanks_optibase[0], catalog.tanks_standard[0]]; catalog.tanks_optibase.forEach(t => { t.alts = boilerAlts; }); catalog.tanks_standard.forEach(t => { t.alts = boilerAlts; });
        let pumpAlts = catalog.pumps_dn25; catalog.pumps_dn25.forEach(p => { p.alts = pumpAlts; });
        let elBoilerAlts = [catalog.boilers_status[0], catalog.boilers_plus[0]]; catalog.boilers_plus.forEach(b => { b.alts = elBoilerAlts; }); catalog.boilers_status.forEach(b => { b.alts = elBoilerAlts; });
        let hydroAlts = catalog.hydro_modular_dn20; catalog.hydro_dn20.forEach(h => { h.alts = hydroAlts; }); catalog.hydro_modular_dn20.forEach(h => { h.alts = catalog.hydro_dn20; });
        let pipeAlts = catalog.rad_pipes_grey; catalog.insulated_pipes.forEach(p => { p.alts = pipeAlts; }); catalog.rad_pipes_grey.forEach(p => { p.alts = catalog.insulated_pipes; });
        if (catalog.manifolds_rad && catalog.manifolds_chrome_blocks) { let chromeAlt = catalog.manifolds_chrome_blocks[0]; catalog.manifolds_rad.forEach(m => { m.alts = [chromeAlt]; }); catalog.manifolds_chrome_blocks.forEach(m => { m.alts = [catalog.manifolds_rad[0]]; }); }
        let xpsAlt = catalog.xps_kit[0]; catalog.mats.forEach(m => { m.alts = [xpsAlt]; }); catalog.xps_kit[0].alts = catalog.mats;
        if (catalog.well_auto) { let waAlts = catalog.well_auto; catalog.well_auto.forEach(a => { a.alts = waAlts; }); }
        if (catalog.convectors_scq && catalog.convectors_scn) { let convAlts = [catalog.convectors_scq[0], catalog.convectors_scn[0]]; catalog.convectors_scq.forEach(c => { c.alts = convAlts; }); catalog.convectors_scn.forEach(c => { c.alts = convAlts; }); }
        // === ОБХОД АВТОРИЗАЦИИ ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ ===
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.warn('[DEV MODE] Localhost detected — установлена PRO сессия для тестирования.');
            this.state.accountType = 'pro';
        }
        // ===================================================
        this.updateHeaderCompanyDetails(); this.syncUI(); this.render();

        // Initialize mobile UI state and listeners
        this.syncMobileUI();
        window.addEventListener('resize', () => { this.syncMobileUI(); });


        this.isAppReady = true;
        this.lastSavedStateString = this.getStateSignature();
        this.updateSaveBtnUI();

        // Фоновый запуск очереди отправки писем
        if (this.queue && typeof this.queue.start === 'function') {
            this.queue.start();
        }

        // Навешиваем обработчик клика на кнопку "Я оплатил" для надежности
        const payBtn = document.getElementById('notify_payment_btn');
        if (payBtn) {
            payBtn.addEventListener('click', function (e) {
                e.preventDefault();
                notifyPayment();
            });
        }

        // Подписка на изменения авторизации Supabase.
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                // Принудительная перезагрузка после возвращения из Google OAuth (очистка хэша с токеном)
                if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
                    window.location.replace(window.location.pathname + window.location.search);
                    return;
                }
                this.handleAuthSession(session);
            } else if (event === 'SIGNED_OUT') {
                // При явном выходе — сбрасываем состояние
                delete this.state.tgUser;
                this.state.accountType = 'base';
                this._authHandling = false;
                this.saveState();
                this.syncUI();
                this.render();
            }
        });

        // Проверка текущей сессии при загрузке страницы.
        // Если сессия уже есть (токен в localStorage) — сразу авторизуем,
        // иначе ждём действия пользователя.
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                this.handleAuthSession(session);
            }
            // Убрана логика Telegram (tgUser && !tgUser.isGoogle), так как
            // авторизация через Telegram Bot удалена из проекта.
            // Если в localStorage остался старый tgUser без isGoogle — он будет
            // проигнорирован при следующем запросе к БД, дубль не создастся.
        });

        // Скрываем прелоадер после полной инициализации
        setTimeout(() => {
            let preloader = document.getElementById('stout_preloader');
            if (preloader) {
                preloader.style.opacity = '0';
                preloader.style.visibility = 'hidden';
                setTimeout(() => preloader.remove(), 500); // Удаляем из DOM после затухания
            }
        }, 300);

        // Проверяем обновления статусов смет через 3 секунды после загрузки
        setTimeout(() => {
            this.checkStatusNotifications();
        }, 3000);

        // Подписка на обновления статусов смет в реальном времени (Supabase Realtime)
        if (supabaseClient) {
            supabaseClient
                .channel('shared_invoices_updates')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'shared_invoices' },
                    (payload) => {
                        console.log('Realtime update received for shared_invoices:', payload);
                        // Проверяем и показываем тост-уведомление
                        app.checkStatusNotifications();
                        // Если открыта админ-панель (дашборд), обновляем таблицу без перезагрузки
                        let adminModal = document.getElementById('admin_modal_overlay');
                        if (adminModal && adminModal.style.display === 'flex') {
                            app.loadAdminData();
                        }
                    }
                )
                .subscribe();
        }
    },
    toggleSwapUI: function (id) { if (this.state.showSwapFor === id) { this.state.showSwapFor = null; } else { this.state.showSwapFor = id; } this.render(); },
    cycleSwap: function (originalId) {
        let isRad = (catalog.rads.find(x => x.id === originalId) || titanRads.find(x => x.id === originalId) || steelRads.find(x => x.id === originalId));
        if (isRad) { if (this.state.radType === 'space') this.state.radType = 'titan'; else if (this.state.radType === 'titan') this.state.radType = 'steel'; else this.state.radType = 'space'; }
        else if ((originalId.startsWith('SHT') || (originalId.startsWith('STE') && originalId.includes('2070'))) && !originalId.includes('2001') && !originalId.includes('2002')) { if (this.state.headType === 'gas') this.state.headType = 'liquid'; else if (this.state.headType === 'liquid') this.state.headType = 'smart'; else this.state.headType = 'gas'; }
        else if (originalId.startsWith('SVH')) { if (this.state.connectionType === 'angled') this.state.connectionType = 'straight'; else this.state.connectionType = 'angled'; }
        else if (originalId.startsWith('SWH')) { this.state.boilerType = (this.state.boilerType === 'optibase') ? 'standard' : 'optibase'; }
        else if (originalId.startsWith('SPC-') && originalId.includes('180')) { if (this.state.pumpType === 'default') this.state.pumpType = 'std'; else if (this.state.pumpType === 'std') this.state.pumpType = 'mini'; else if (this.state.pumpType === 'mini') this.state.pumpType = 'pro'; else this.state.pumpType = 'default'; }
        else if (originalId.startsWith('SEB-')) { this.state.boilerSeries = (this.state.boilerSeries === 'plus') ? 'status' : 'plus'; }
        else if (originalId.startsWith('SDG-0018') || originalId.startsWith('SDG-0016')) { this.state.hydroType = (this.state.hydroType === 'combo') ? 'modular' : 'combo'; }
        else if (originalId.startsWith('SMS-0922') || originalId.startsWith('SMB-6850')) { this.state.radManifoldType = (this.state.radManifoldType === 'standard') ? 'chrome' : 'standard'; }
        else if (originalId.startsWith('SPI-') || originalId.startsWith('SPX-')) { this.state.pipeType = (this.state.pipeType === 'insulated') ? 'split' : 'insulated'; }
        else if (originalId.startsWith('SMF-0001') || originalId === '418318') { this.state.ufhBaseType = (this.state.ufhBaseType === 'mat') ? 'xps' : 'mat'; }
        else if (originalId.startsWith('SCS-0001')) { if (this.state.wellAutoType === 'sirio') this.state.wellAutoType = 'top'; else if (this.state.wellAutoType === 'top') this.state.wellAutoType = 'base'; else this.state.wellAutoType = 'sirio'; }
        else if (originalId.startsWith('SCQ') || originalId.startsWith('SCN')) { this.state.convectorType = (this.state.convectorType === 'scq') ? 'scn' : 'scq'; }
        else if (originalId.startsWith('SVT') || originalId.startsWith('SVL')) { this.state.convConnectionType = (this.state.convConnectionType === 'straight') ? 'angled' : 'straight'; }
        this.state.showSwapFor = null; this.render();
    },
    syncRoomsToState: function () {
        if (this.state.detailedRooms && this.state.rooms && this.state.rooms.length > 0) {
            let tA = 0, tW = 0, tTp1 = 0, tTp2 = 0;
            this.state.rooms.forEach(r => {
                tA += (parseFloat(r.area) || 0);
                tW += r.windows.length;
                if (r.sys && r.sys.includes('tp')) {
                    if (r.floor === 2) tTp2 += (parseFloat(r.area) || 0);
                    else tTp1 += (parseFloat(r.area) || 0);
                }
            });
            this.state.area = tA > 0 ? tA : 50;
            this.state.win = tW > 0 ? tW : 1;
            this.state.tp1 = tTp1;
            this.state.tp2 = tTp2;

            if ((tTp1 + tTp2) > 0 && !this.state.systems.includes('tp')) this.state.systems.push('tp');
            else if ((tTp1 + tTp2) === 0 && this.state.systems.includes('tp')) this.state.systems = this.state.systems.filter(s => s !== 'tp');

            let hasAnyRad = this.state.rooms.some(r => !r.sys || r.sys.includes('rad'));
            if (hasAnyRad && !this.state.systems.includes('rad')) this.state.systems.push('rad');
            else if (!hasAnyRad && this.state.systems.includes('rad')) this.state.systems = this.state.systems.filter(s => s !== 'rad');
        }
    },
    toggleDetailedRooms: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            document.getElementById('chk_detailed_rooms').checked = this.state.detailedRooms;
            return;
        }
        this.state.detailedRooms = chk;

        if (chk) {
            // Считаем текущую сумму комнат
            let currentRoomsArea = 0;
            if (this.state.rooms) {
                this.state.rooms.forEach(r => currentRoomsArea += (parseFloat(r.area) || 0));
            }

            // Если комнат нет ИЛИ ползунок общей площади сдвинули (площадь не совпадает) -> создаем 3 новые комнаты
            if (!this.state.rooms || this.state.rooms.length === 0 || Math.abs(currentRoomsArea - this.state.area) > 1) {
                let totalA = parseFloat(this.state.area) || 150;
                let a = Math.round(totalA / 3);
                this.state.rooms = [
                    { id: Date.now(), name: "Комната 1", area: a, floor: 1, sys: ['rad'], windows: [{ id: Date.now() + 1, width: 1.5, isPan: false }] },
                    { id: Date.now() + 10, name: "Комната 2", area: a, floor: 1, sys: ['rad'], windows: [{ id: Date.now() + 11, width: 1.5, isPan: false }] },
                    { id: Date.now() + 20, name: "Комната 3", area: totalA - a * 2, floor: 1, sys: ['rad'], windows: [{ id: Date.now() + 21, width: 1.5, isPan: false }] }
                ];
            }
        } else {
            // При выключении: суммируем площади всех комнат и отдаем эту цифру общему ползунку
            if (this.state.rooms && this.state.rooms.length > 0) {
                let totalA = 0;
                this.state.rooms.forEach(r => totalA += (parseFloat(r.area) || 0));
                this.state.area = totalA > 0 ? totalA : 50;
            }
        }

        this.syncRoomsToState();
        this.syncUI();
        this.render();
    },
    addRoom: function () {
        if (!this.state.rooms) this.state.rooms = [];
        let f = 1;
        if (this.state.rooms.length > 0) f = this.state.rooms[this.state.rooms.length - 1].floor || 1;
        this.state.rooms.push({ id: Date.now(), name: "Комната " + (this.state.rooms.length + 1), area: 15, floor: f, sys: ['rad'], windows: [{ id: Date.now() + 1, width: 1.5, isPan: false }] });
        this.syncRoomsToState(); this.renderRoomsUI(); this.syncUI(); this.render();
    },
    addFloor: function () {
        if (this.state.floors === 2) return;
        this.state.floors = 2;
        if (document.getElementById('chk_floors')) document.getElementById('chk_floors').checked = true;
        if (!this.state.rooms) this.state.rooms = [];
        this.state.rooms.push({ id: Date.now(), name: "Комната " + (this.state.rooms.length + 1), area: 15, floor: 2, sys: ['rad'], windows: [{ id: Date.now() + 1, width: 1.5, isPan: false }] });
        this.syncRoomsToState(); this.renderRoomsUI(); this.syncUI(); this.render();
    },
    toggleRoomSys: function (roomId, sysType) {
        let r = this.state.rooms.find(x => x.id === roomId);
        if (r) {
            if (!r.sys) r.sys = ['rad'];
            if (r.sys.includes(sysType)) r.sys = r.sys.filter(s => s !== sysType);
            else r.sys.push(sysType);
            this.syncRoomsToState(); this.renderRoomsUI(); this.syncUI(); this.render();
        }
    },
    removeRoom: function (id) {
        this.state.rooms = this.state.rooms.filter(r => r.id !== id);
        this.syncRoomsToState(); this.renderRoomsUI(); this.syncUI(); this.render();
    },
    addWindow: function (roomId) {
        let r = this.state.rooms.find(x => x.id === roomId);
        if (r) r.windows.push({ id: Date.now(), width: 1.5, isPan: false });
        this.syncRoomsToState(); this.renderRoomsUI(); this.syncUI(); this.render();
    },
    removeWindow: function (roomId, winId) {
        let r = this.state.rooms.find(x => x.id === roomId);
        if (r) { r.windows = r.windows.filter(w => w.id !== winId); if (r.windows.length === 0) r.windows.push({ id: Date.now(), width: 1.5, isPan: false }); }
        this.syncRoomsToState(); this.renderRoomsUI(); this.syncUI(); this.render();
    },
    updRoom: function (id, field, val) {
        let r = this.state.rooms.find(x => x.id === id);
        if (r) { r[field] = field === 'area' ? (parseFloat(val) || 1) : val; this.syncRoomsToState(); this.syncUI(); this.render(); }
    },
    updWindow: function (roomId, winId, field, val) {
        let r = this.state.rooms.find(x => x.id === roomId);
        if (r) {
            let w = r.windows.find(x => x.id === winId);
            if (w) { w[field] = field === 'width' ? (parseFloat(val) || 1.0) : val; this.render(); }
        }
    },
    renderRoomsUI: function () {
        const c1 = document.getElementById('rooms_list_1');
        const c2 = document.getElementById('rooms_list_2');
        if (!c1) return; c1.innerHTML = "";
        if (c2) c2.innerHTML = "";

        if (!this.state.rooms) return;
        this.state.rooms.forEach((r, idx) => {
            let hasRad = !r.sys || r.sys.includes('rad');
            let hasTp = r.sys && r.sys.includes('tp');
            let winsHtml = "";
            r.windows.forEach((w, wIdx) => {
                winsHtml += `<div style="display:inline-flex; align-items:center; background:var(--surface); border:1px solid var(--border); padding:2px 4px; border-radius:4px; gap:4px; font-size:10px; flex-shrink:0;">
                            <span style="font-weight:600; color:var(--text-sec);">Окно</span>
                            <input type="number" style="width:44px; border:1px solid var(--border); border-radius:3px; padding:2px; text-align:center; font-size:11px; background:var(--bg); color:var(--text-main);" value="${w.width}" step="0.1" onchange="app.updWindow(${r.id}, ${w.id}, 'width', this.value)">
                            <span style="color:var(--text-sec);">м</span>
                            <label style="display:flex; align-items:center; gap:2px; cursor:pointer; color:var(--text-main); font-size:10px; margin-left:2px;">
                                <input type="checkbox" ${w.isPan ? 'checked' : ''} onchange="app.updWindow(${r.id}, ${w.id}, 'isPan', this.checked)" style="margin:0; width:12px; height:12px;"> Панорамное
                            </label>
                            <span style="color:#EF4444; cursor:pointer; font-weight:bold; margin-left:2px; font-size:14px; line-height:1;" onclick="app.removeWindow(${r.id}, ${w.id})">×</span>
                        </div>`;
            });

            let floorSel = this.state.floors === 2 ? `<select style="font-size:10px; padding:0 2px 0 0; border:none; border-right:1px solid #D1D5DB; background:transparent; color:var(--text-sec); font-weight:600; margin-right:2px; outline:none; cursor:pointer;" onchange="app.updRoom(${r.id}, 'floor', parseInt(this.value))"><option value="1" ${r.floor === 1 ? 'selected' : ''}>1 Эт</option><option value="2" ${r.floor === 2 ? 'selected' : ''}>2 Эт</option></select>` : '';
            let accentColor = r.floor === 2 ? '#10B981' : 'var(--primary)';

            // ИСПРАВЛЕНИЕ: Используем динамический фон и тень на основе темы
            let cardBg = this.state.darkMode ? 'var(--surface-light)' : '#fff';
            let cardShadow = this.state.darkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.02)';

            let html = `<div class="zone-card" style="padding:8px; margin-bottom:0; border:1px solid var(--border); border-left:4px solid ${accentColor}; border-radius:6px; background:${cardBg}; box-shadow: ${cardShadow};">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:nowrap; gap:4px;">
                            <div style="display:flex; align-items:center; flex:1; min-width:0;">
                                <span contenteditable="true" style="font-weight:700; color:var(--text-main); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; outline:none; padding-right:2px;" onblur="app.updRoom(${r.id}, 'name', this.innerText)">${r.name}</span>
                            </div>
                            
                            <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                                <div style="display:flex; align-items:center; gap:2px; background:var(--bg); padding:2px 4px; border-radius:6px; border:1px solid var(--border);">
                                    ${floorSel}
                                    <input type="number" style="width:46px; border:none; background:transparent; font-weight:800; font-size:13px; text-align:center; padding:0; outline:none; color:var(--primary);" value="${r.area}" onchange="app.updRoom(${r.id}, 'area', this.value)">
                                    <span style="font-size:10px; color:var(--text-sec); font-weight:600; margin-right:2px;">м²</span>
                                    <div style="display:flex; gap:2px; border-left:1px solid #D1D5DB; padding-left:4px;">
                                        <button onclick="app.toggleRoomSys(${r.id}, 'rad')" style="background:${hasRad ? 'var(--primary-light)' : 'transparent'}; border:1px solid ${hasRad ? 'var(--primary)' : 'transparent'}; border-radius:4px; padding:2px; cursor:pointer; font-size:12px; filter: ${hasRad ? 'none' : 'grayscale(1) opacity(0.3)'}; transition:0.2s;" title="Радиаторы">🌡️</button>
                                        <button onclick="app.toggleRoomSys(${r.id}, 'tp')" style="background:${hasTp ? '#ECFDF5' : 'transparent'}; border:1px solid ${hasTp ? '#10B981' : 'transparent'}; border-radius:4px; padding:2px; cursor:pointer; font-size:12px; filter: ${hasTp ? 'none' : 'grayscale(1) opacity(0.3)'}; transition:0.2s;" title="Тёплый пол">♨️</button>
                                    </div>
                                </div>
                                <span style="color:#EF4444; cursor:pointer; font-size:18px; line-height:1; opacity:0.6; padding:0 2px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" onclick="app.removeRoom(${r.id})">×</span>
                            </div>
                        </div>
                        
                        <div style="display:flex; flex-wrap:wrap; align-items:center; gap:4px; margin-top:8px; padding-top:8px; border-top:1px dashed var(--border);">
                            ${winsHtml}
                            <button style="background:transparent; border:1px dashed #9CA3AF; color:#6B7280; padding:2px 6px; height:24px; border-radius:4px; font-size:10px; font-weight:600; cursor:pointer; transition:0.2s; white-space:nowrap;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'" onclick="app.addWindow(${r.id})">+ Окно</button>
                        </div>
                    </div>`;

            if (r.floor === 2 && c2) {
                c2.insertAdjacentHTML('beforeend', html);
            } else {
                c1.insertAdjacentHTML('beforeend', html);
            }
        });
    },
    setUfhCtrl: function (type) { this.state.ufhCtrl = type; this.syncUI(); this.render(); },
    updZones: function (d) { let n = this.state.ufhZones + d; if (n < 1) n = 1; if (n > 16) n = 16; this.state.ufhZones = n; this.syncUI(); this.render(); },
    setZones: function (v) { let n = parseInt(v); if (isNaN(n) || n < 1) n = 1; if (n > 16) n = 16; this.state.ufhZones = n; this.syncUI(); this.render(); },
    syncUI: function () {
        document.getElementById('inp_area').value = this.state.area; document.getElementById('val_area').innerText = this.state.area;
        if (document.getElementById('blk_h2_wrapper')) document.getElementById('blk_h2_wrapper').style.display = (this.state.floors === 2) ? 'flex' : 'none';
        if (document.getElementById('btn_add_floor')) document.getElementById('btn_add_floor').style.display = (this.state.floors === 2) ? 'none' : 'block';
        if (document.getElementById('inp_h1')) document.getElementById('inp_h1').value = this.state.h1 || 2.7;
        if (document.getElementById('val_h1')) document.getElementById('val_h1').innerText = parseFloat(this.state.h1 || 2.7).toFixed(1);
        if (document.getElementById('inp_h2')) document.getElementById('inp_h2').value = this.state.h2 || 2.7;
        if (document.getElementById('val_h2')) document.getElementById('val_h2').innerText = parseFloat(this.state.h2 || 2.7).toFixed(1);
        document.getElementById('val_win').innerText = this.state.win; document.getElementById('chk_floors').checked = (this.state.floors === 2); document.getElementById('div_tp2').style.display = (this.state.floors === 2) ? 'block' : 'none';
        document.getElementById('fuel_el').className = this.state.fuels.includes('el') ? 'tab multi-active' : 'tab'; document.getElementById('fuel_gas').className = this.state.fuels.includes('gas') ? 'tab multi-active' : 'tab';
        const hasTp = this.state.systems.includes('tp'); document.getElementById('sys_rad').className = this.state.systems.includes('rad') ? 'tab multi-active' : 'tab'; document.getElementById('sys_tp').className = hasTp ? 'tab multi-active' : 'tab';
        document.getElementById('blk_tp_sliders').style.display = hasTp ? 'block' : 'none'; document.getElementById('blk_ufh_ctrl').style.display = hasTp ? 'block' : 'none';
        document.getElementById('chk_hw').checked = this.state.hotWater; document.getElementById('blk_res').style.display = this.state.hotWater ? 'flex' : 'none'; document.getElementById('val_res').innerText = this.state.res; document.getElementById('val_zones').innerText = this.state.ufhZones;
        const ufhTabs = document.querySelectorAll('.ufh-tab'); ufhTabs.forEach(t => { t.className = 'tab ufh-tab'; if (t.dataset.type === this.state.ufhCtrl) t.classList.add('multi-active'); });
        const regTabs = document.getElementById('reg_tabs').children; for (let t of regTabs) t.classList.remove('active');
        if (this.state.region === 130) regTabs[0].classList.add('active'); if (this.state.region === 120) regTabs[1].classList.add('active'); if (this.state.region === 100) regTabs[2].classList.add('active'); if (this.state.region === 60) regTabs[3].classList.add('active');
        const matTabs = document.getElementById('mat_tabs').children; for (let t of matTabs) t.classList.remove('active');
        if (this.state.mat === 1.3) matTabs[0].classList.add('active'); if (this.state.mat === 1.0) matTabs[1].classList.add('active'); if (this.state.mat === 0.8) matTabs[2].classList.add('active');
        const cTabs = document.querySelectorAll('.cool-tab'); cTabs.forEach(t => { t.classList.remove('active'); if (t.dataset.type === this.state.coolant) t.classList.add('active'); });
        document.getElementById('inp_tp1').max = this.state.area; document.getElementById('inp_tp2').max = this.state.area; document.getElementById('inp_tp1').value = this.state.tp1; document.getElementById('val_tp1').innerText = this.state.tp1; document.getElementById('inp_tp2').value = this.state.tp2; document.getElementById('val_tp2').innerText = this.state.tp2;
        document.getElementById('chk_sku').checked = this.state.showSku;
        // Логика доступа для переключателя "СХЕМА"
        let sw = document.getElementById('scheme_wrapper');
        let chkScheme = document.getElementById('chk_scheme');
        if (sw && chkScheme) {
            let isAuthenticated = this.state.tgUser || this.state.user || this.state.currentUser;
            if (!isAuthenticated) {
                // Полностью скрываем блок для неавторизованных пользователей
                sw.style.display = 'none';
            } else {
                sw.style.display = 'flex';
                chkScheme.checked = this.state.showScheme;
            }
        }
        // Логика доступа для переключателя "УДЕШЕВИТЬ / АНАЛОГ"
        let cw = document.getElementById('cheaper_wrapper');
        let sl = document.getElementById('cheaper_switch_label');
        let chk = document.getElementById('chk_cheaper');

        if (cw && chk && sl) {
            // Показываем блок для всех (включая гостей), так как хотим отобразить закрытый замок
            cw.style.display = 'flex';
            chk.checked = (this.state.brandMode === 'rommer');

            // Если пользователь без PRO как-то включил режим, сбрасываем его
            if (!this.isPro() && this.state.brandMode === 'rommer') {
                this.state.brandMode = 'stout';
                chk.checked = false;
                setTimeout(() => this.render(), 10);
            }
        }
        if (document.getElementById('chk_hw')) document.getElementById('chk_hw').checked = this.state.hotWater;
        if (document.getElementById('chk_recirc')) document.getElementById('chk_recirc').checked = this.state.recirc;
        if (document.getElementById('chk_water_input')) document.getElementById('chk_water_input').checked = this.state.waterInput;
        if (document.getElementById('blk_water_input_opts')) document.getElementById('blk_water_input_opts').style.display = this.state.waterInput ? 'flex' : 'none';
        if (document.getElementById('chk_outdoor_faucet')) document.getElementById('chk_outdoor_faucet').checked = !!this.state.outdoorFaucet;
        if (document.getElementById('chk_big_blue')) document.getElementById('chk_big_blue').checked = !!this.state.bigBlueFilter;
        if (document.getElementById('chk_heating_feed')) document.getElementById('chk_heating_feed').checked = !!this.state.heatingFeed;
        if (document.getElementById('chk_water')) document.getElementById('chk_water').checked = this.state.water;
        if (document.getElementById('blk_water_zones')) document.getElementById('blk_water_zones').style.display = this.state.water ? 'flex' : 'none';
        if (document.getElementById('chk_detailed_rooms')) document.getElementById('chk_detailed_rooms').checked = this.state.detailedRooms;
        if (document.getElementById('blk_fast_calc')) document.getElementById('blk_fast_calc').style.display = this.state.detailedRooms ? 'none' : 'block';
        if (document.getElementById('blk_detailed_calc')) document.getElementById('blk_detailed_calc').style.display = this.state.detailedRooms ? 'flex' : 'none';
        if (this.state.detailedRooms) this.renderRoomsUI();
        if (document.getElementById('chk_well')) document.getElementById('chk_well').checked = this.state.well;
        if (document.getElementById('blk_well')) document.getElementById('blk_well').style.display = this.state.well ? 'flex' : 'none';
        if (document.getElementById('inp_wellDepth')) { document.getElementById('inp_wellDepth').value = this.state.wellDepth; document.getElementById('val_wellDepth').innerText = this.state.wellDepth; }
        if (document.getElementById('inp_wellDist')) { document.getElementById('inp_wellDist').value = this.state.wellDist; document.getElementById('val_wellDist').innerText = this.state.wellDist; }

        // Синхронизация Автоматики ТП
        if (document.getElementById('chk_ufh_auto')) document.getElementById('chk_ufh_auto').checked = this.state.ufhAuto;
        if (document.getElementById('blk_ufh_settings')) document.getElementById('blk_ufh_settings').style.display = this.state.ufhAuto ? 'block' : 'none';

        // Синхронизация имени и проверка прав на его редактирование
        let nameEdit = document.getElementById('project_name_edit');
        if (nameEdit) {
            // Если имя пустое или с глюком, выводим красивую заглушку
            let currentName = this.state.projectName;
            if (currentName === "true" || currentName === "false") currentName = "";
            nameEdit.innerText = currentName || "Название объекта";

            // Определяем, является ли пользователь Гостем (нет tgUser)
            const tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;
            let isGuest = !tgUser;

            if (isGuest) {
                // Запрещаем ввод текста
                nameEdit.removeAttribute('contenteditable');
                // Вешаем вызов модального окна по клику
                nameEdit.onclick = function (e) {
                    e.preventDefault();
                    app.showAuthModal();
                };
                nameEdit.onfocus = null;
                nameEdit.onblur = null;
            } else {
                // Разрешаем ввод текста для авторизованных
                nameEdit.setAttribute('contenteditable', 'true');
                // Снимаем блокирующий обработчик клика
                nameEdit.onclick = null;

                // UX: Очищаем заглушку при фокусе для удобного ввода
                nameEdit.onfocus = function () {
                    if (this.innerText === "Название объекта") this.innerText = "";
                };
                // Возвращаем заглушку и сохраняем при потере фокуса
                nameEdit.onblur = function () {
                    if (this.innerText.trim() === "") this.innerText = "Название объекта";
                    app.setProjectName(this.innerText);
                };
            }
        }


        // Отрисовка профиля ТГ / Google
        let authContainer = document.getElementById('tg-auth-container');
        if (authContainer) {
            let tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) ? window.Telegram.WebApp.initDataUnsafe.user : this.state.tgUser;

            if (tgUser) {
                let isActuallyPro = this.isPro();
                let badge = isActuallyPro ? `<span style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; letter-spacing: 0.05em; margin-left: 8px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);">PRO</span>` : `<span style="color: var(--text-sec); font-size: 11px; font-weight: 500; margin-left: 8px;">(Базовый)</span>`;
                let uName = tgUser.first_name || tgUser.username || 'Монтажник';
                let avatarImg = tgUser.avatar_url || tgUser.photo_url;
                let icon = avatarImg ? `<img src="${avatarImg}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">` : (tgUser.isGoogle ? 'G' : '👤');

                // ПРОВЕРКА НА АДМИНА
                let adminEmails = ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'];
                let adminBtn = (tgUser.email && adminEmails.includes(tgUser.email.toLowerCase()))
                    ? `<div style="font-size: 12px; font-weight: 700; color: #10B981; cursor: pointer; border: 1px solid #10B981; padding: 4px 10px; border-radius: 8px; background: #ECFDF5; margin-right: 10px;" onclick="app.showAdminModal()" title="Панель владельца">👑 Админка</div>`
                    : `<div style="font-size: 12px; font-weight: 700; color: var(--primary); cursor: pointer; border: 1px solid var(--primary); padding: 4px 10px; border-radius: 8px; background: var(--primary-light); margin-right: 10px;" onclick="app.loadFromCloudList()" title="Мой кабинет (Мои сметы)">📁 Мои сметы</div>`;

                authContainer.innerHTML = `<div style="display: flex; align-items: center; gap: 15px; padding-right: 15px; border-right: 1px solid var(--border);">${adminBtn}<div style="font-size: 13px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; cursor: pointer; transition: 0.2s; padding: 4px 8px; border-radius: 6px;" onclick="app.showProfileModal()" title="Настроить профиль" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='transparent'">${icon} <span style="border-bottom: 1px dashed var(--text-sec); margin-left: 5px;">${uName}</span> ${badge}</div><div style="font-size: 12px; color: #EF4444; cursor:pointer; font-weight: 500; padding: 4px;" onclick="app.logout()">Выйти</div></div>`;
            } else {
                // Если пользователь не авторизован - показываем только одну аккуратную кнопку
                authContainer.innerHTML = `
                            <div style="padding-right: 15px; border-right: 1px solid var(--border); display: flex; align-items: center;">
                                <button style="background: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; transition: 0.2s;" onclick="app.showAuthModal()" onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">Войти</button>
                            </div>
                        `;
            }
        }
        if (document.getElementById('chk_dark')) document.getElementById('chk_dark').checked = this.state.darkMode; document.body.classList.toggle('dark-mode', this.state.darkMode);

        // === БЛОКИРОВКИ ===
        const isGuest = !this.state.tgUser;
        const isPro = this.isPro();

        const cloudBtns = document.querySelector('.header-cloud-btns');
        if (cloudBtns) cloudBtns.style.display = isGuest ? 'none' : 'flex';

        const applyLock = (elId, reqLvl) => {
            let container;
            let el = document.getElementById(elId);
            if (!el) return;

            if (elId.startsWith('chk_') || elId === 'blk_coolant') {
                container = el.closest('.switch') || el.closest('.tabs') || el;
            } else {
                container = el;
            }
            if (!container) return;

            container.classList.remove('locked-guest', 'locked-pro');
            if (reqLvl === 'base' && isGuest) {
                container.classList.add('locked-guest');
            } else if (reqLvl === 'pro' && !isPro) {
                if (isGuest) container.classList.add('locked-guest');
                else container.classList.add('locked-pro');
            }

            const isPremiumToggle = ['chk_cheaper', 'chk_scheme', 'chk_sku', 'chk_merge'].includes(elId);
            if (container.classList.contains('locked-guest') || container.classList.contains('locked-pro')) {
                container.style.pointerEvents = 'auto';
                if (el.tagName === 'INPUT') el.disabled = false; // Убираем жесткую блокировку клика, чтобы лейбл/свитч перехватывал клики

                if (!container.dataset.lockInit) {
                    container.dataset.lockInit = '1';
                    container.addEventListener('click', function (e) {
                        if (this.classList.contains('locked-guest')) {
                            e.preventDefault();
                            e.stopPropagation();
                            app.showAuthModal();
                        } else if (this.classList.contains('locked-pro')) {
                            e.preventDefault();
                            e.stopPropagation();
                            app.showModal('pro');
                        }
                    }, true);
                }
            } else {
                if (el.tagName === 'INPUT') el.disabled = false;
            }

            if (elId === 'project_name_edit') {
                container.setAttribute('contenteditable', String(!isGuest));
            }
        };

        // Гость не может редактировать имя и переключать тему
        applyLock('project_name_edit', 'base');
        applyLock('chk_dark', 'base');
        applyLock('chk_detailed_rooms', 'pro');

        // Гость и Базовый не могут использовать PRO фичи
        applyLock('tab_works', 'pro');
        applyLock('chk_water', 'pro');
        applyLock('blk_coolant', 'pro');
        applyLock('sys_tp', 'pro');
        applyLock('sys_rad', 'pro');
        applyLock('chk_water_input', 'pro');
        applyLock('chk_well', 'pro');
        applyLock('chk_hw', 'pro');
        applyLock('chk_recirc', 'pro');
        applyLock('chk_ufh_auto', 'pro');

        if (document.getElementById('chk_merge')) document.getElementById('chk_merge').checked = this.state.groupItems;
        if (document.getElementById('chk_sku')) document.getElementById('chk_sku').checked = this.state.showSku;
        if (document.getElementById('chk_scheme')) document.getElementById('chk_scheme').checked = this.state.showScheme;
        // Логика доступа для переключателя "КАРТИНКИ"
        let imgWrapper = document.getElementById('images_wrapper');
        let chkImages = document.getElementById('chk_images');
        if (imgWrapper && chkImages) {
            let isAuthenticated = this.state.tgUser || this.state.user || this.state.currentUser;
            if (!isAuthenticated) {
                // Полностью скрываем блок для неавторизованных пользователей
                imgWrapper.style.display = 'none';
            } else {
                imgWrapper.style.display = 'flex';
                chkImages.checked = (this.state.showImages !== false);
            }
        }
        document.body.classList.toggle('hide-images-mode', this.state.showImages === false);

        applyLock('chk_merge', 'pro');
        applyLock('chk_sku', 'pro');
        applyLock('chk_scheme', 'pro');
        applyLock('chk_cheaper', 'pro');
        applyLock('btn_print_trigger', 'base');

        document.body.classList.toggle('work-mode', this.state.viewMode === 'works');
        const viewTabs = document.getElementById('view_tabs');
        if (viewTabs) {
            for (let t of viewTabs.children) {
                t.classList.remove('active', 'work-active');
                if (t.dataset.type === this.state.viewMode) {
                    t.classList.add('active');
                    if (this.state.viewMode === 'works') t.classList.add('work-active');
                }
            }
        }

        let tEq = document.getElementById('tab_equipment');
        let tWk = document.getElementById('tab_works');
        if (tEq && tWk) {
            tEq.classList.toggle('active', this.state.viewMode === 'equipment');
            tWk.classList.toggle('active', this.state.viewMode === 'works');
        }

        this.renderZonesUI();
        this.updateInfo();

        // Динамическое переименование кнопки Печать -> Скачать PDF на мобильных устройствах
        const btnPrint = document.getElementById('btn_print_trigger');
        const btnShare = document.getElementById('btn_share_trigger');
        if (btnPrint) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
            if (isMobile) {
                btnPrint.style.display = 'none';
                if (isGuest && btnShare) btnShare.style.display = 'none';
            } else {
                btnPrint.style.display = '';
                btnPrint.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>Печать`;
                if (btnShare) btnShare.style.display = '';
            }
        }
    },
    setArea: function (v) {
        if (this.state.detailedRooms) { this.syncUI(); return; } // Блокировка ползунка, если включен покомнатный расчет
        v = parseInt(v);
        if (isNaN(v) || v < 50) v = 50;
        if (v > 300) v = 300; // Жесткий лимит площади
        this.state.area = v;
        if (this.state.tp1 > v) this.state.tp1 = v;
        if (this.state.tp1 + this.state.tp2 > v) this.state.tp2 = v - this.state.tp1;
        this.state.waterZones.forEach(z => z.dist = this.state.area < 120 ? 6 : 10);
        this.syncUI(); this.render();
    },
    updWin: function (d) {
        if (this.state.detailedRooms) { this.syncUI(); return; } // Блокировка кнопок окон
        let n = this.state.win + d; if (n < 1) n = 1; this.state.win = n; this.syncUI(); this.render();
    },
    setWin: function (v) {
        if (this.state.detailedRooms) { this.syncUI(); return; } // Блокировка ввода окон
        let n = parseInt(v); if (isNaN(n) || n < 1) n = 1; if (n > 50) n = 50; this.state.win = n; this.syncUI(); this.render();
    },
    toggleFloors: function (chk) {
        this.state.floors = chk ? 2 : 1; if (!chk) this.state.tp2 = 0;
        // Автообновление метража для воды
        this.state.waterZones.forEach(z => z.dist = this.state.area < 120 ? 6 : 10);
        this.syncUI(); this.render();
    },
    setRegion: function (v) { this.state.region = v; this.syncUI(); this.render(); },
    setMat: function (v) { this.state.mat = v; this.syncUI(); this.render(); },
    updateInfo: function () { document.getElementById('desc_reg').innerHTML = `<span>📍</span> ${REGION_DESC[this.state.region]}`; document.getElementById('desc_mat').innerHTML = WALL_DESC[this.state.mat]; },
    toggleFuel: function (f) { let idx = this.state.fuels.indexOf(f); if (idx > -1) { if (this.state.fuels.length > 1) this.state.fuels.splice(idx, 1); } else { this.state.fuels.push(f); } this.syncUI(); this.render(); },
    toggleSys: function (s, event) {
        if ((s === 'tp' || s === 'rad') && !this.checkAccess('pro', event)) return;
        setTimeout(() => {
            let i = this.state.systems.indexOf(s);
            if (i > -1) {
                if (this.state.systems.length > 1) this.state.systems.splice(i, 1);
            } else this.state.systems.push(s);
            this.syncUI(); this.render();
        }, 50);
    },
    toggleHW: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            if (document.getElementById('chk_hw')) document.getElementById('chk_hw').checked = this.state.hotWater;
            return;
        }
        this.state.hotWater = chk; this.render();
    },
    toggleRecirc: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            if (document.getElementById('chk_recirc')) document.getElementById('chk_recirc').checked = this.state.recirc;
            return;
        }
        this.state.recirc = chk; this.render();
    },
    toggleWaterInput: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            if (document.getElementById('chk_water_input')) document.getElementById('chk_water_input').checked = this.state.waterInput;
            return;
        }
        setTimeout(() => {
            this.state.waterInput = chk;
            this.render();
        }, 50);
    },
    toggleWell: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            if (document.getElementById('chk_well')) document.getElementById('chk_well').checked = this.state.well;
            return;
        }
        setTimeout(() => {
            this.state.well = chk;
            this.syncUI();
            this.render();
        }, 50);
    },
    setWellDepth: function (v) { let n = parseInt(v); if (isNaN(n) || n < 10) n = 10; if (n > 150) n = 150; this.state.wellDepth = n; this.syncUI(); this.render(); },
    setWellDist: function (v) { let n = parseInt(v); if (isNaN(n) || n < 0) n = 0; if (n > 150) n = 150; this.state.wellDist = n; this.syncUI(); this.render(); },
    toggleWater: function (chk, event) {
        if (!this.checkAccess('pro', event)) {
            document.getElementById('chk_water').checked = this.state.water;
            return;
        }
        setTimeout(() => {
            this.state.water = chk;
            if (chk && this.state.waterZones.length === 0) this.addZone();
            this.syncUI();
            this.render();
        }, 50);
    },
    addZone: function () {
        let id = Date.now();
        let dist = this.state.area < 120 ? 6 : 10;
        this.state.waterZones.push({ id: id, name: "Санузел " + (this.state.waterZones.length + 1), dist: dist, fixtures: { toilet: 0, basin: 0, bath: 0, shower: 0, wash: 0, dish: 0 } });
        this.syncUI(); this.render();
    },
    removeZone: function (id) { this.state.waterZones = this.state.waterZones.filter(z => z.id !== id); this.syncUI(); this.render(); },
    updZoneFixture: function (id, type, delta) {
        let z = this.state.waterZones.find(x => x.id === id);
        if (z) {
            if (z.fixtures[type] === undefined) z.fixtures[type] = 0;
            z.fixtures[type] += delta;
            if (z.fixtures[type] < 0) z.fixtures[type] = 0;
        }
        this.renderZonesUI(); this.render();
    },
    updZoneDist: function (id, val) {
        let z = this.state.waterZones.find(x => x.id === id);
        if (z) z.dist = parseInt(val) || 0;
        this.render();
    },
    renderZonesUI: function () {
        const container = document.getElementById('zones_list');
        if (!container) return;
        container.innerHTML = "";
        const labels = { toilet: "🚽 Унитаз", basin: "🚰 Раковина", bath: "🛁 Ванна", shower: "🚿 Душ", wash: "🧺 Стиралка", dish: "🍽️ ПММ" };
        this.state.waterZones.forEach((z, idx) => {
            let itemsHtml = "";
            for (let [key, name] of Object.entries(labels)) {
                let val = z.fixtures[key] || 0; // Защита для старых сохранений
                itemsHtml += `<div class="zone-row"><span style="font-size:11px;">${name}</span><div class="stepper"><button class="step-btn" onclick="app.updZoneFixture(${z.id}, '${key}', -1)">−</button><div class="step-val">${val}</div><button class="step-btn" onclick="app.updZoneFixture(${z.id}, '${key}', 1)">+</button></div></div>`;

            }
            let html = `<div class="zone-card"><div class="zone-header"><span class="zone-title" contenteditable="true" onblur="app.state.waterZones[${idx}].name=this.innerText">${z.name}</span><div class="zone-remove" onclick="app.removeZone(${z.id})">×</div></div><div style="margin-bottom:10px; font-size:11px; display:flex; align-items:center; gap:5px;"><span>Трасса (м):</span><input type="number" class="zone-input" value="${z.dist}" onchange="app.updZoneDist(${z.id}, this.value)"></div>${itemsHtml}</div>`;
            container.insertAdjacentHTML('beforeend', html);
        });
    },
    updRes: function (d) { let n = this.state.res + d; if (n < 1) n = 1; if (n > 10) n = 10; this.state.res = n; this.syncUI(); this.render(); },
    setRes: function (v) { let n = parseInt(v); if (isNaN(n) || n < 1) n = 1; if (n > 10) n = 10; this.state.res = n; this.syncUI(); this.render(); },
    updTp: function (f, v) {
        v = parseInt(v);
        if (isNaN(v) || v < 0) v = 0;
        let max = this.state.area;
        if (v > max) v = max; // Пол не может быть больше площади дома

        if (f === 1) {
            this.state.tp1 = v;
            if (this.state.tp1 + this.state.tp2 > max) this.state.tp2 = max - this.state.tp1;
        } else {
            this.state.tp2 = v;
            if (this.state.tp1 + this.state.tp2 > max) this.state.tp1 = max - this.state.tp2;
        }
        this.syncUI(); this.render();
    },
    setCoolant: function (t, event) {
        if (!this.checkAccess('pro', event)) return;
        this.state.coolant = t; this.syncUI(); this.render();
    },
    toggleSku: function (event) {
        if (!this.checkAccess('pro', event)) {
            document.getElementById('chk_sku').checked = this.state.showSku;
            return;
        }
        setTimeout(() => {
            this.state.showSku = document.getElementById('chk_sku').checked;
            const panel = document.querySelector('.output-panel');
            if (this.state.showSku) panel.classList.add('show-sku-mode'); else panel.classList.remove('show-sku-mode');
            this.render();
        }, 50);
    },
    toggleImages: function (event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const chk = document.getElementById('chk_images');
        if (chk) {
            chk.checked = !chk.checked;
            this.state.showImages = chk.checked;
            this.saveState();
            this.syncUI();
        }
    },

    // === НОВАЯ ФУНКЦИЯ ДЛЯ ПОДСКАЗОК ===
    getDesc: function (type, val1, val2, val3) {
        const styles = "font-size:11px; line-height:1.4;";
        const head = "font-weight:700; color:#93C5FD; display:block; margin-bottom:4px;";

        // Логика для коллекторов
        if (type === 'manifold') {
            let formula = "";
            let why = "Равномерное распределение, балансировка петель.";
            if (val2 === 'cw') {
                formula = `<b>Тип:</b> ХВС (Холодная вода).<br><b>Формула:</b> Сумма всех водоразеток.<br><b>Итого точек:</b> ${val1}.`;
            } else if (val2 === 'hw_std') {
                formula = `<b>Тип:</b> ГВС (Тупиковая).<br><b>Формула:</b> Сумма приборов с горячей водой.<br><b>Итого точек:</b> ${val1}.`;
            } else if (val2 === 'hw_recirc') {
                formula = `<b>Тип:</b> ГВС (Лучевая).<br><b>Формула:</b> 1 выход на 1 зону (санузел/кухню).<br><b>Итого петель:</b> ${val1}.`;
            } else if (val2 === 'recirc') {
                formula = `<b>Тип:</b> Рециркуляция.<br><b>Формула:</b> Равно числу петель ГВС.<br><b>Итого линий:</b> ${val1}.`;
            } else if (val2 === 'rad') {
                formula = `<b>Тип:</b> Радиаторное отопление.<br><b>Формула:</b> 1 пара выходов на 1 радиатор.<br><b>Радиаторов:</b> ${val1} шт.`;
            } else if (val2 === 'ufh') {
                formula = `<b>Тип:</b> Тёплый пол.<br><b>Формула:</b> Площадь ТП / 12 м² (макс. площадь одной петли).<br><b>Контуров:</b> ${val1} шт.`;
            }
            let minWarn = (val1 === 1) ? "<br><br><i>*Выбран блок на 2 выхода (заводской минимум). 1 выход — резерв.</i>" : "";
            return `<span style="${styles}"><span style="${head}">Коллекторный блок</span><b>Зачем:</b> ${why}<br><br>${formula}${minWarn}</span>`;
        }

        switch (type) {
            // === 1. КОТЕЛЬНАЯ ===
            case 'boiler_gas':
                return `<span style="${styles}"><span style="${head}">Газовый котел</span><b>Зачем:</b> Основной источник тепла.<br><b>Формула:</b> (Площадь × H_потолков × Утепление) + 20% запас.<br><b>Потребность:</b> ${val1} кВт.<br><b>Норматив:</b> СП 60.13330.2020.</span>`;
            case 'boiler_el':
                return `<span style="${styles}"><span style="${head}">Электрический котел</span><b>Зачем:</b> Резервный или основной источник.<br><b>Расчет:</b> По теплопотерям здания.<br><b>Потребность:</b> ${val1} кВт.</span>`;
            case 'boiler_tank':
                let calcStr = `Жильцы (${val1} чел) × 50 л.`;
                if (val3 && val3 > (val1 * 50)) calcStr = `Пиковый водоразбор санузлов (${val3} л).`;
                return `<span style="${styles}"><span style="${head}">Бойлер косвенного нагрева</span><b>Зачем:</b> Комфортное ГВС (запас воды).<br><b>База расчета:</b> ${calcStr}<br><b>Подобранный объем:</b> ${val2} л.<br><b>Норматив:</b> СП 30.13330.2020.</span>`;
            case 'chimney':
                return `<span style="${styles}"><span style="${head}">Дымоход коаксиальный</span><b>Зачем:</b> Безопасный выброс газов и забор воздуха с улицы.<br><b>Стандарт:</b> 60/100 мм (для турбированных котлов).<br><b>Норматив:</b> СП 402.1325800.2018.</span>`;
            case 'stab':
                return `<span style="${styles}"><span style="${head}">Стабилизатор напряжения</span><b>Зачем:</b> Защита дорогой электроники котла.<br><b>Важно:</b> Обязательное условие гарантии большинства производителей.</span>`;
            case 'exp_h':
                return `<span style="${styles}"><span style="${head}">Расширительный бак (Отопление)</span><b>Зачем:</b> Компенсация расширения воды при нагреве.<br><b>Формула:</b> V_системы (${val1} л) × 0.12 (коэфф. расширения).<br><b>Норматив:</b> СП 41-104-2000.</span>`;
            case 'exp_d':
                return `<span style="${styles}"><span style="${head}">Расширительный бак (ГВС)</span><b>Зачем:</b> Компенсация давления при нагреве бойлера.<br><b>Формула:</b> 10% от объема бойлера (${val1} л).<br><b>Расчет:</b> ${val2} л.</span>`;
            case 'fugas':
                return `<span style="${styles}"><span style="${head}">Комплект Fugas</span><b>Зачем:</b> Трехходовой клапан для подключения бойлера к одноконтурному котлу.<br><b>Функция:</b> Переключает поток на нагрев воды по датчику.</span>`;
            case 'pump_std':
                return `<span style="${styles}"><span style="${head}">Насос циркуляционный</span><b>Зачем:</b> Прокачка теплоносителя по системе.<br><b>Параметры:</b> 25/60 (Напор 6м).<br><b>Подбор:</b> По гидравлическому сопротивлению самой длинной петли.</span>`;

            // === 3. РАДИАТОРЫ ===
            case 'rad_item':
                return `<span style="${styles}"><span style="${head}">Радиатор отопления</span><b>Зачем:</b> Компенсация теплопотерь через окна/стены.<br><b>Формула:</b> Теплопотери помещения / Теплоотдача секции.<br><b>Мощность:</b> ${val1} Вт.<br><b>Норматив:</b> ГОСТ 31311-2005.</span>`;
            case 'rad_valves':
                return `<span style="${styles}"><span style="${head}">Узел нижнего подключения</span><b>Зачем:</b> Эстетичное подключение труб из стены/пола.<br><b>Функция:</b> Позволяет перекрыть и снять радиатор без слива системы.</span>`;
            case 'rad_head':
                return `<span style="${styles}"><span style="${head}">Термоголовка</span><b>Зачем:</b> Климат-контроль в каждой комнате.<br><b>Экономия:</b> Снижает расход газа/электричества на 15-20% за счет отсутствия перетопа.</span>`;
            case 'rad_pipe':
                return `<span style="${styles}"><span style="${head}">Труба (Лучевая разводка)</span><b>Зачем:</b> Индивидуальная трасса к каждому радиатору.<br><b>Формула:</b> (Ср. расстояние до коллектора × 2) + Подъемы.<br><b>Всего:</b> ${val1} м.</span>`;

            // === 4. ТЕПЛЫЙ ПОЛ ===
            case 'ufh_pipe':
                return `<span style="${styles}"><span style="${head}">Труба теплого пола</span><b>Зачем:</b> Греющий элемент системы.<br><b>Формула:</b> Площадь пола × 7 м (при шаге укладки 150 мм).<br><b>Общая длина:</b> ${val1} м.<br><b>Норматив:</b> СП 60.13330.2020.</span>`;
            case 'ufh_mat':
                return `<span style="${styles}"><span style="${head}">Мат с бобышками</span><b>Зачем:</b> Быстрый монтаж и фиксация трубы.<br><b>Расчет:</b> Чистая площадь ТП (${val1} м²) + 5% запас на подрезку.</span>`;
            case 'ufh_xps':
                return `<span style="${styles}"><span style="${head}">Пенополистирол (XPS)</span><b>Зачем:</b> Теплоизоляция от перекрытия/грунта.<br><b>Толщина:</b> 50 мм (стандарт для 1 этажа).<br><b>Расчет:</b> Площадь ТП + 5% запас.</span>`;
            case 'actuator':
                return `<span style="${styles}"><span style="${head}">Сервопривод</span><b>Зачем:</b> Автоматическое открывание петель.<br><b>Управление:</b> По команде от комнатного термостата.<br><b>Кол-во:</b> 1 шт на каждую петлю коллектора.</span>`;
            case 'thermostat':
                return `<span style="${styles}"><span style="${head}">Термостат</span><b>Зачем:</b> Измерение температуры воздуха в комнате.<br><b>Расчет:</b> 1 шт на одну независимую зону (комнату).</span>`;

            // === 5. ВОДОСНАБЖЕНИЕ ===
            case 'pipe_cw':
                return `<span style="${styles}"><span style="${head}">Труба PEX-a (ХВС)</span><b>Зачем:</b> Питьевая холодная вода.<br><b>Расчет:</b> Сумма длин трасс до приборов.<br><b>Всего:</b> ${val1} м.<br><b>Норматив:</b> СП 30.13330.2020.</span>`;
            case 'pipe_hw':
                return `<span style="${styles}"><span style="${head}">Труба PEX-a (ГВС)</span><b>Зачем:</b> Горячая вода (до 95°C).<br><b>Расчет:</b> Трассы подачи + подъемы.<br><b>Всего:</b> ${val1} м.</span>`;
            case 'ins_blue':
                return `<span style="${styles}"><span style="${head}">Изоляция (Синяя)</span><b>Зачем:</b> Защита от конденсата (чтобы труба не "потела").<br><b>Расчет:</b> По длине трубы ХВС (${val1} м).<br><b>Норматив:</b> СП 61.13330.2012.</span>`;
            case 'ins_red':
                return `<span style="${styles}"><span style="${head}">Изоляция (Красная)</span><b>Зачем:</b> Снижение теплопотерь (чтобы вода не остывала).<br><b>Расчет:</b> По длине трубы ГВС (${val1} м).</span>`;
            case 'socket':
                return `<span style="${styles}"><span style="${head}">Водорозетка</span><b>Зачем:</b> Жесткая фиксация выхода для смесителя.<br><b>Тип:</b> ${val1}.<br><b>Кол-во:</b> ${val2} шт.</span>`;
            case 'sleeve':
                return `<span style="${styles}"><span style="${head}">Гильза монтажная</span><b>Зачем:</b> Опрессовка соединения (вечное соединение).<br><b>Расход:</b> ${val1}.</span>`;
            case 'install':
                return `<span style="${styles}"><span style="${head}">Инсталляция</span><b>Зачем:</b> Несущая рама для подвесного унитаза.<br><b>Нагрузка:</b> Испытано на 400 кг.<br><b>Комплект:</b> Рама, бачок, кнопка, крепеж.</span>`;
            case 'eurocone_water':
                return `<span style="${styles}"><span style="${head}">Евроконус 16</span><b>Зачем:</b> Подключение трубы к коллектору (разборное).<br><b>Формула:</b> 1 шт на каждый выход коллектора.<br><b>Кол-во:</b> ${val1} шт.</span>`;

            case 'convector':
                return `<span style="${styles}"><span style="${head}">Внутрипольный конвектор</span><b>Мощность по ГОСТ (90/70°C):</b> ${val1} Вт.<br><b style="color:var(--primary);">Факт. теплоотдача (75/65°C):</b> ~${val2} Вт.<br><b>Примечание:</b> В реальной системе мощность падает на ~35%. Прибор подобран с нужным запасом.<br><b>Важно:</b> Требует глубину стяжки не менее 85 мм.</span>`;
            case 'rad_tooltip': {
                let o = val1;
                let dev = (o.isRommer && o.item.rommer) ? o.item.rommer : o.item;
                let isPanel = dev.isPanel || (dev.name && dev.name.toLowerCase().includes("панельный"));
                let passPwr = dev.passportPower || Math.round(dev.power50 / 0.65) || 'undefined';

                let headLine = `Выбран: ${dev.name}`;
                let pwrLine = "";
                if (isPanel) {
                    pwrLine = `Размер: ${dev.sec} мм. Мощность: ${dev.power50} Вт (ΔT=50°C)`;
                } else {
                    pwrLine = `Секций: ${dev.sec}. Мощность секции: ${dev.power50} Вт (ΔT=50°C)`;
                }

                let margin = Math.round((o.fact / o.demand) * 100) - 100;
                let marginText = margin >= 0 ? `+${margin}% запас` : `${Math.abs(margin)}% дефицит`;
                let coverageColor = margin >= 0 ? '#10B981' : '#F59E0B';
                let coverageIcon = margin >= 0 ? '✅' : '⚠️';

                let warnWin = "";
                if (o.count > o.win) {
                    warnWin = `<br><span style="color:#F59E0B; font-weight:700; display:block; margin-top:4px;">⚠️ Окон (${o.win}) мало! Добавлено приборов: ${o.count - o.win} шт.</span>`;
                }

                return `<span style="font-size:12px; line-height:1.5; display:block; min-width:240px;">
                    <b style="display:block; margin-bottom:2px; font-size:13px;">${headLine}</b>
                    <b style="display:block; margin-bottom:2px;">${pwrLine}</b>
                    <span style="color:#9CA3AF; font-size:11px;">(Паспортная мощность: ${passPwr} Вт при ΔT=70°C)</span>
                    <hr style="margin:8px 0; border:none; border-top:1px dashed #4B5563;">
                    <b style="display:block; margin-bottom:2px;">${o.demandLabel}: ${o.demand} Вт</b>
                    <b style="display:block; margin-bottom:4px;">Фактическая мощность: ${o.fact} Вт (${o.count} шт).</b>
                    <span style="color:${coverageColor}; font-weight:700;">${coverageIcon} Покрытие: ${margin + 100}% (${marginText})</span>
                    ${warnWin}
                </span>`;
            }
            case 'rad_item_detailed':
                return `<span style="${styles}"><span style="${head}">Прибор отопления</span><b>Мощность по ГОСТ (90/70°C):</b> ${val1} Вт.<br><b style="color:var(--primary);">Факт. теплоотдача (75/65°C):</b> ${val2} Вт.<br><b>Примечание:</b> Прибор подобран с учетом реального температурного графика современных котлов и правила перекрытия окна на 70%.</span>`;
            case 'coolant':
                return `<span style="${styles}"><span style="${head}">Теплоноситель</span><b>Зачем:</b> Заполнение системы.<br><b>Формула:</b> V_котлов + V_радиаторов + V_труб + V_ТП + Запас.<br><b>Объем системы:</b> ~${val1} л.</span>`;

            default: return "";
        }
    },
    // ====================================
    render: function () {
        this.updateHeaderCompanyDetails();
        this.updateDocumentTitle();
        this.calcBaseTotal = 0;
        this.calcFinalTotal = 0;
        app.lastEqSum = 0;
        app.lastWorksSum = 0;
        app.originalEqSum = 0;
        this.currentEquipmentList = [];
        this.currentWorksList = [];
        app.tempWarns = []; // Массив для сбора предупреждений о дефиците мощности
        this.currentSpec = []; // Список оборудования для генерации схемы
        let trialUntil = parseInt(localStorage.getItem('pro_trial_until')) || 0;
        let isTrialActive = trialUntil > Date.now();
        let isPro = (this.state.accountType === 'pro' || isTrialActive);
        // Схлопываем смету (forceMerge = true), если нет PRO или тумблер "Группировать" ВЫКЛЮЧЕН
        let forceMerge = !isPro || !this.state.groupItems;
        let h1 = this.state.h1 || 2.7, h2 = this.state.h2 || 2.7;
        let avgH = (this.state.floors === 2) ? (h1 + h2) / 2 : h1;

        let pwr = 0;
        if (this.state.detailedRooms && this.state.rooms && this.state.rooms.length > 0) {
            let totalLoadW = 0;
            this.state.rooms.forEach(r => {
                let rHeight = (r.floor === 2) ? h2 : h1;
                let heightCoef = rHeight / 2.7;
                // Считаем стены
                let baseRoomLoad = (r.area * heightCoef * 70 * (this.state.region / 100) * this.state.mat);
                totalLoadW += baseRoomLoad;
                // Прибавляем все окна
                r.windows.forEach(w => {
                    let wHeight = w.isPan ? 2.5 : 1.5;
                    let wArea = parseFloat(w.width || 1) * wHeight;
                    totalLoadW += (wArea * 150 * (this.state.region / 100) * this.state.mat);
                });
            });
            pwr = (totalLoadW / 1000).toFixed(1);
        } else {
            pwr = (this.state.area * avgH * 37 * (this.state.region / 100) * this.state.mat / 1000).toFixed(1);
        }

        let regionName = "Сибирь"; if (this.state.region === 120) regionName = "Урал"; if (this.state.region === 100) regionName = "Центр"; if (this.state.region === 60) regionName = "Юг";

        // Заголовок спецификации
        document.getElementById('doc_summary').innerHTML = `
            <span class="param-item">🏠 Объект: <b>${this.state.area} м²</b> (${this.state.floors === 2 ? 2 : 1} эт)</span>
            <span class="param-item">👨‍👩‍👧 Проживающих: <b>${this.state.res}</b></span>
            <span class="param-item">🔥 Теплопотери: <b>${pwr} кВт</b></span>
            <span class="param-item">📍 Регион: <b>${regionName}</b></span>
            <span class="param-item param-date calculation-date">📅 Дата: <b>${new Date().toLocaleDateString('ru-RU')}</b></span>
        `;

        let bill = [];
        const addToBill = (item, qty, tip, group = null) => {
            if (!item || qty <= 0) return;

            let itemsToAdd = [];
            if (this.state.brandMode === 'rommer' && (item.rommer || ANALOG_MAP[item.id])) {
                // Считаем базу ОДИН РАЗ для этого исходного товара
                this.calcBaseTotal += (item.price || 0) * qty;

                if (item.rommer && Array.isArray(item.rommer)) {
                    // Если это массив аналогов (сборка или пирог)
                    item.rommer.forEach(sub => {
                        let finalSub = { ...sub };
                        finalSub.brand = sub.brand || "ROMMER"; // Явно прописываем бренд, если не указан
                        itemsToAdd.push({ itm: finalSub, q: qty });
                    });
                } else {
                    // Обработка аналогов
                    let analog = item.rommer;
                    if (!analog && ANALOG_MAP[item.id]) {
                        let targetId = ANALOG_MAP[item.id];
                        for (let catKey in catalog) {
                            if (Array.isArray(catalog[catKey])) {
                                let f = catalog[catKey].find(x => x.id === targetId);
                                if (f) { analog = f; break; }
                            }
                        }
                    }

                    if (analog) {
                        let finalItem = { ...item };
                        finalItem.id = analog.id;
                        finalItem.name = analog.name;
                        finalItem.price = analog.price;
                        finalItem.brand = analog.brand || "ROMMER";
                        if (analog.article) finalItem.article = analog.article;
                        finalItem.alts = analog.alts || item.alts;
                        finalItem.originalId = item.id;
                        itemsToAdd.push({ itm: finalItem, q: qty });
                    } else {
                        itemsToAdd.push({ itm: { ...item }, q: qty });
                    }
                }
            } else {
                this.calcBaseTotal += (item.price || 0) * qty;
                itemsToAdd.push({ itm: { ...item }, q: qty });
            }

            // Добавляем все сформированные позиции в смету
            itemsToAdd.forEach(entry => {
                let finalItem = entry.itm;
                let finalQty = entry.q;

                let originalPrice = finalItem.price || 0;
                let finalPrice = originalPrice;
                if (isPro && this.state.eqDiscount > 0) {
                    finalPrice = Math.round(originalPrice * (1 - this.state.eqDiscount / 100));
                }

                let lookupId = finalItem.originalId || finalItem.id;
                let isOpt = !!this.state.optItems[lookupId];
                if (!isOpt) {
                    app.originalEqSum = (app.originalEqSum || 0) + originalPrice * finalQty;
                }

                finalItem.price = finalPrice;

                this.currentSpec.push({ ...finalItem, q: finalQty, group: group });
                this.calcFinalTotal += (finalItem.price || 0) * finalQty;

                if (forceMerge) {
                    let existing = bill.find(x => x.id === finalItem.id && x.group === group);
                    if (existing) {
                        existing.q += finalQty;
                        existing.sum += finalItem.price * finalQty;
                        if (tip && tip.includes('|||')) {
                            let parts = tip.split('|||');
                            let locInfo = parts[0];
                            let devInfo = parts[1];
                            if (!existing.locs) {
                                let oldParts = existing.qtyTip ? existing.qtyTip.split('|||') : [];
                                existing.locs = oldParts.length > 1 ? [oldParts[0]] : [existing.qtyTip];
                            }
                            if (!existing.locs.includes(locInfo)) existing.locs.push(locInfo);
                            existing.qtyTip = existing.locs.join('<br>') + '<hr style="margin:6px 0; border:none; border-top:1px dashed #4B5563;">' + devInfo;
                        } else if (tip && (!existing.qtyTip || !existing.qtyTip.includes(tip))) {
                            existing.qtyTip = existing.qtyTip ? existing.qtyTip + "<br>" + tip : tip;
                        }
                    } else {
                        let finalTip = tip;
                        if (tip && tip.includes('|||')) {
                            let parts = tip.split('|||');
                            finalItem.locs = [parts[0]];
                            finalTip = parts[0] + '<hr style="margin:6px 0; border:none; border-top:1px dashed #4B5563;">' + parts[1];
                        }
                        bill.push({ ...finalItem, q: finalQty, sum: finalItem.price * finalQty, displaySku: finalItem.article || finalItem.id, qtyTip: finalTip || "", group: group, originalId: item.id });
                    }
                } else {
                    let finalTip = tip;
                    if (tip && tip.includes('|||')) finalTip = tip.split('|||').join('<hr style="margin:6px 0; border:none; border-top:1px dashed #4B5563;">');
                    bill.push({ ...finalItem, q: finalQty, sum: finalItem.price * finalQty, displaySku: finalItem.article || finalItem.id, qtyTip: finalTip || "", group: group, originalId: item.id });
                }
            });
        };
        let worksBill = [];
        const addToWorks = (name, qty, basePrice, unit, group = null) => {
            if (qty <= 0) return;
            if (this.state.deletedWorks && this.state.deletedWorks.includes(name)) return;
            // Проверяем, есть ли ручная цена
            let price = (this.state.customWorks && this.state.customWorks[name] !== undefined) ? this.state.customWorks[name] : basePrice;

            let existing = worksBill.find(x => x.name === name && x.group === group);
            if (existing) {
                existing.q += qty;
                existing.sum += price * qty;
            } else {
                worksBill.push({ name: name, q: qty, price: price, sum: price * qty, unit: unit, group: group });
            }
        };

        let h = "", sum = 0, globalIdx = 1, showSku = document.getElementById('chk_sku').checked;

        const flushBill = (title, warn) => {
            if (bill.length === 0) return;

            // Сохраняем элементы для коммерческого предложения клиенту
            bill.forEach(i => {
                this.currentEquipmentList.push({
                    id: i.id,
                    name: i.name,
                    displaySku: i.displaySku || i.article || i.id,
                    brand: i.brand || 'STOUT',
                    unit: i.unit || 'шт',
                    q: i.q,
                    price: i.price,
                    sum: i.sum,
                    group: i.group,
                    sectionTitle: title,
                    isOpt: !!this.state.optItems[i.originalId || i.id],
                    availability: i.availability
                });
            });

            // Считаем сумму оборудования всегда
            let localSecTotal = 0;
            bill.forEach(i => { let lookupId = i.originalId || i.id; if (!this.state.optItems[lookupId]) localSecTotal += i.sum; });
            app.lastEqSum += localSecTotal;

            // Но рендерим HTML только если мы на вкладке Оборудования
            if (this.state.viewMode === 'works') { bill = []; return; }

            let groupTotals = {};
            bill.forEach(i => { if (i.group) { if (!groupTotals[i.group]) groupTotals[i.group] = 0; groupTotals[i.group] += i.sum; } });
            let secTotal = 0, rows = "";
            let titleHtml = title + (warn ? `<div class="warn-box">${warn}</div>` : "");
            h += `<tr class="row-sec"><td colspan="9">${titleHtml}</td></tr>`;
            let lastGroup = null;
            bill.forEach((i, arrIndex) => {
                let lookupId = i.originalId || i.id;
                let isOpt = this.state.optItems[lookupId];
                if (!isOpt) secTotal += i.sum;
                let isCollapsed = (!forceMerge && i.group && this.state.collapsedGroups.includes(i.group));
                let isSubSection = (i.group && i.group.match(/^\d+\.\d+/));
                const dashStyle = "1px dashed rgba(0, 0, 0, 0.2)";
                if (!forceMerge && i.group && i.group !== lastGroup) {
                    let icon = ""; if (i.group.includes("Газового")) icon = "🔥"; else if (i.group.includes("Электрического")) icon = "⚡"; else if (i.group.includes("Водонагревателя")) icon = "💧";
                    let arrow = isCollapsed ? "▶" : "⤵";
                    let txtUnit = isCollapsed ? "компл." : ""; let txtQty = isCollapsed ? "1" : ""; let txtSum = isCollapsed ? groupTotals[i.group].toLocaleString() : "";
                    let headStyle = "";
                    if (isSubSection) { headStyle = `style="background:var(--surface-light); border: ${dashStyle}; border-bottom: none; color:var(--text-main);"`; if (isCollapsed) headStyle = `style="background:var(--surface-light); border: ${dashStyle}; color:var(--text-main);"`; }
                    let titleColSpan = showSku ? 5 : 4;
                    rows += `<tr class="group-header" ${headStyle} onclick="app.toggleGroup('${i.group}')" title="Свернуть/Развернуть"><td colspan="${titleColSpan}" style="text-align:left; padding-left:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><b>${arrow} ${icon} ${i.group}</b></td><td class="col-unit" style="color:#9CA3AF; font-size:10px;">${txtUnit}</td><td class="col-qty" style="font-weight:700;">${txtQty}</td><td class="col-price"></td><td class="col-sum">${txtSum}</td></tr>`;
                    lastGroup = i.group;
                }
                let rowStyle = "";
                if (isCollapsed) { rowStyle = 'style="display:none;"'; }
                else if (!forceMerge && isSubSection) { let borders = `border-left: ${dashStyle}; border-right: ${dashStyle};`; let nextItem = bill[arrIndex + 1]; if (!nextItem || nextItem.group !== i.group) borders += ` border-bottom: ${dashStyle};`; else borders += " border-bottom: 1px solid var(--border);"; rowStyle = `style="background:var(--surface); ${borders}"`; }
                else if (!forceMerge && i.group) { if (i.group.includes("Газового") || i.group.includes("Электрического")) rowStyle = 'style="background-color: var(--primary-light);"'; }

                let optStyle = isOpt ? 'opacity: 0.4; text-decoration: line-through; filter: grayscale(1);' : '';
                if (optStyle) {
                    if (rowStyle) rowStyle = rowStyle.replace('style="', `style="${optStyle} `);
                    else rowStyle = `style="${optStyle}"`;
                }
                let availStyle = '';
                let availText = '';
                if (i.availability === 'in_stock') {
                    availStyle = 'color: #22c55e; border-color: #22c55e;';
                    availText = ' (В наличии)';
                } else if (i.availability === 'on_order') {
                    availStyle = 'color: #eab308; border-color: #eab308;';
                    availText = ' (Под заказ)';
                }

                let descText = i.desc ? i.desc : (i.qtyTip || '');
                let availStatusLine = availText ? `<div style="margin-top: 8px; font-weight: 700; color: ${i.availability === 'in_stock' ? '#22c55e' : '#eab308'};">${availText.trim()}</div>` : '';
                let finalTooltipContent = `${descText}${availStatusLine}`;

                let tipHtml = finalTooltipContent ? `
                    <div class="tooltip-wrapper">
                        <i class="info-icon" style="${availStyle}">i</i>
                        <div class="tooltip-content">${finalTooltipContent}</div>
                    </div>` : "";
                let qHtml = `<div class="qty-wrap">${i.q}${tipHtml} <span class="opt-btn" onclick="event.stopPropagation(); app.toggleOpt('${lookupId}')">${!isOpt ? '🗑️' : '➕'}</span></div>`;
                let imgContent = getImg(i);
                let hasAlts = (i.alts && i.alts.length > 0);
                let imgCellHtml = "";
                if (hasAlts) {
                    let isOpen = (this.state.showSwapFor === lookupId);
                    let wrapClass = isOpen ? "img-wrap show-swap-ui" : "img-wrap";
                    let svgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21h5v-5"></path></svg>`;
                    imgCellHtml = `<td class="col-img swappable-cursor"><div class="${wrapClass}" onclick="app.toggleSwapUI('${lookupId}')" title="Нажмите, чтобы заменить"><div class="swap-cycle-btn" onclick="event.stopPropagation(); app.cycleSwap('${lookupId}')">${svgIcon}</div>${imgContent}</div></td>`;
                } else { imgCellHtml = `<td class="col-img">${imgContent}</td>`; }

                let nameClass = hasAlts ? "col-name swappable-cursor" : "col-name";
                let nameClick = hasAlts ? `onclick="event.stopPropagation(); app.cycleSwap('${lookupId}')" title="Нажмите, чтобы заменить"` : "";

                rows += `<tr ${rowStyle} onclick="this.classList.toggle('active-row')"><td class="col-idx">${globalIdx++}</td>${imgCellHtml}<td class="${nameClass}" ${nameClick}>${i.name}</td><td class="col-sku col-art ${showSku ? '' : 'hidden-col'}">${i.displaySku}</td><td class="col-brand">${i.brand || 'STOUT'}</td><td class="col-unit">${i.unit || 'шт'}</td><td class="col-qty">${qHtml}</td><td class="col-price"><span class="mob-mult" style="display:none;">${i.q}</span>${i.price.toLocaleString()}</td><td class="col-sum">${i.sum.toLocaleString()}</td></tr>`;
            });
            h += rows + `<tr class="row-subtotal"><td colspan="9">Итого: ${secTotal.toLocaleString()} ₽</td></tr>`;
            sum += secTotal; bill = [];
        };

        const flushWorks = () => {
            if (worksBill.length === 0) return;

            // Сохраняем элементы для коммерческого предложения клиенту
            worksBill.forEach(w => {
                this.currentWorksList.push({
                    name: w.name,
                    q: w.q,
                    price: w.price,
                    sum: w.sum,
                    unit: w.unit,
                    group: w.group
                });
            });

            // Считаем сумму работ всегда
            worksBill.forEach(w => { app.lastWorksSum += w.sum; });

            if (this.state.viewMode !== 'works') return; // Рендерим HTML только если выбраны работы

            let worksByGroup = {};
            worksBill.forEach(w => {
                let g = w.group || "Прочее";
                if (!worksByGroup[g]) worksByGroup[g] = [];
                worksByGroup[g].push(w);
            });

            let sortedGroups = Object.keys(worksByGroup).sort();
            for (let g of sortedGroups) {
                let secTotal = 0;
                worksByGroup[g].forEach(w => secTotal += w.sum);

                // Главный заголовок секции выводится всегда
                h += `<tr class="row-sec"><td colspan="9">${g}</td></tr>`;

                let rows = "";
                const dashStyle = "1px dashed rgba(0, 0, 0, 0.2)";
                let isCollapsed = false;

                // Логика тумблера "Объединять": выводим вложенный список только если он выключен
                if (!forceMerge) {
                    let groupId = 'works_' + g;
                    isCollapsed = (this.state.collapsedGroups.includes(groupId));
                    let arrow = isCollapsed ? "▶" : "⤵";
                    let icon = "🔧";

                    // ИСПРАВЛЕНИЕ ВЕРСТКИ: colspan = 2 (т.к. 3 колонки скрыты CSS-ом)
                    let titleColSpan = 2;

                    let txtUnit = isCollapsed ? "компл." : "";
                    let txtQty = isCollapsed ? "1" : "";
                    let txtSum = isCollapsed ? secTotal.toLocaleString() : "";

                    let headStyle = `style="background:var(--surface-light); border: ${dashStyle}; color:var(--text-main);"`;
                    if (!isCollapsed) headStyle = `style="background:var(--surface-light); border: ${dashStyle}; border-bottom: none; color:var(--text-main);"`;

                    rows += `<tr class="group-header" ${headStyle} onclick="app.toggleGroup('${groupId}')" title="Свернуть/Развернуть"><td colspan="${titleColSpan}" style="text-align:left; padding-left:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><b>${arrow} ${icon} Детализация</b></td><td class="col-unit" style="color:#9CA3AF; font-size:10px;">${txtUnit}</td><td class="col-qty" style="font-weight:700;">${txtQty}</td><td class="col-price"></td><td class="col-sum">${txtSum}</td></tr>`;
                }

                // Рендер самих строк
                worksByGroup[g].forEach((w, idx) => {
                    let rowStyle = "";
                    if (!forceMerge) {
                        if (isCollapsed) {
                            rowStyle = 'style="display:none;"';
                        } else {
                            let borders = `border-left: ${dashStyle}; border-right: ${dashStyle};`;
                            if (idx !== worksByGroup[g].length - 1) borders += ` border-bottom: ${dashStyle};`;
                            else borders += ` border-bottom: 1px solid var(--border);`;
                            rowStyle = `style="background:var(--surface); ${borders}"`;
                        }
                    }

                    rows += `<tr ${rowStyle} onclick="this.classList.toggle('active-row')"><td class="col-idx">${globalIdx++}</td><td class="col-img hidden-col"></td><td class="col-name"><span class="work-del-btn" onclick="event.stopPropagation(); app.deleteWork('${w.name}')" title="Удалить работу">✖</span>${w.name}</td><td class="col-sku col-art ${showSku ? '' : 'hidden-col'}">-</td><td class="col-brand hidden-col"></td><td class="col-unit">${w.unit}</td><td class="col-qty"><div class="qty-wrap">${w.q}</div></td><td class="col-price"><span class="mob-mult" style="display:none;">${w.q}</span><span class="price-edit" contenteditable="true" onblur="app.updateWorkPrice('${w.name}', this.innerText)" title="Изменить цену">${w.price.toLocaleString()}</span></td><td class="col-sum">${w.sum.toLocaleString()}</td></tr>`;
                });

                h += rows + `<tr class="row-subtotal"><td colspan="9">Итого: ${secTotal.toLocaleString()} ₽</td></tr>`;
                sum += secTotal;
            }

            // Кнопка добавления своей работы (в едином стиле с оборудованием)
            h += `<tr class="hide-custom-work-btn no-print"><td colspan="100">
                    <div class="btn-add-custom" onclick="app.addCustomWork()">
                        + Добавить свою работу
                    </div>
                  </td></tr>`;
        };

        // === 1. КОТЁЛ + ВОДОНАГРЕВАТЕЛЬ ===
        let selBoilers = [], boilerCnt = 0;
        ['gas', 'el'].forEach(ft => {
            if (this.state.fuels.includes(ft)) {
                let needed = parseFloat(pwr);
                let db = (ft === 'gas') ? catalog.boilers_gas : (this.state.boilerSeries === 'status' ? catalog.boilers_status : catalog.boilers_plus);
                let b = db.find(x => x.power >= needed);
                if (ft === 'el') {
                    if (!b && needed > 27) { let half = needed / 2; let b2 = db.find(x => x.power >= half); if (b2) { b2.alts = (this.state.boilerSeries === 'status') ? catalog.boilers_plus : catalog.boilers_status; addToBill(b2, 2, this.getDesc('boiler_el', needed)); selBoilers.push(b2, b2); } }
                    else { let t = b || db[db.length - 1]; t.alts = (this.state.boilerSeries === 'status') ? catalog.boilers_plus : catalog.boilers_status; addToBill(t, 1, this.getDesc('boiler_el', needed)); selBoilers.push(t); }
                } else if (ft === 'gas') {
                    // === ПОДБОР ГАЗОВОГО КОТЛА HAIER ===
                    // Расчетная мощность (без запаса)
                    let targetPower = parseFloat(pwr);

                    // Расчет необходимого количества котлов (каскад)
                    let qty = Math.ceil(targetPower / 24);
                    let powerPerBoiler = targetPower / qty;

                    let haierBoiler;
                    if (!this.state.hotWater) {
                        // Бойлер ВЫКЛЮЧЕН → двухконтурный котёл (ГВС встроен)
                        haierBoiler = powerPerBoiler <= 18
                            ? catalog.boilers_gas.find(x => x.id === 'GE0Q6NE0CRU')
                            : catalog.boilers_gas.find(x => x.id === 'GE0Q6PE0CRU');
                    } else {
                        // Бойлер ВКЛЮЧЕН → одноконтурный котёл (ГВС через бойлер)
                        haierBoiler = powerPerBoiler <= 18
                            ? catalog.boilers_gas.find(x => x.id === 'GE0Q6QE0CRU')
                            : catalog.boilers_gas.find(x => x.id === 'GE0Q6RE0CRU');
                    }
                    if (haierBoiler) {
                        addToBill(haierBoiler, qty, this.getDesc('boiler_gas', parseFloat(pwr)));
                        for (let k = 0; k < qty; k++) selBoilers.push(haierBoiler);
                    }
                }
            }
        });
        boilerCnt = selBoilers.length;

        if (this.state.hotWater) {
            let hw_fixtures_vol = 0;
            // Считаем потребность по санузлам (60°C вода)
            if (this.state.water && this.state.waterZones) {
                let b = 0, s = 0, bs = 0;
                this.state.waterZones.forEach(z => { b += (z.fixtures.bath || 0); s += (z.fixtures.shower || 0); bs += (z.fixtures.basin || 0); });
                hw_fixtures_vol = (b * 120) + (s * 50) + (bs * 10);
            }

            let volByRes = this.state.res >= 10 ? 500 : this.state.res >= 7 ? 300 : this.state.res >= 5 ? 200 : this.state.res >= 3 ? 150 : 100;
            let targetVol = Math.max(volByRes, hw_fixtures_vol);

            let vol = 100;
            if (targetVol > 100 && targetVol <= 150) vol = 150;
            else if (targetVol > 150 && targetVol <= 200) vol = 200;
            else if (targetVol > 200 && targetVol <= 300) vol = 300;
            else if (targetVol > 300) vol = 500;

            let tankDb = (this.state.boilerType === 'optibase') ? catalog.tanks_optibase : catalog.tanks_standard;
            let t = tankDb.find(x => x.vol === vol) || tankDb[tankDb.length - 1];
            t.alts = [catalog.tanks_optibase[0], catalog.tanks_standard[0]];

            let warn = targetVol > 500 ? `<br><b style="color:#EF4444; font-size:10px;">⚠️ Требуемый объем ГВС превышает 500л! Добавьте в смету второй бойлер вручную или проверьте количество потребителей ГВС.</b>` : "";

            addToBill(t, 1, this.getDesc('boiler_tank', this.state.res, vol, hw_fixtures_vol) + warn);
        }
        flushBill("1. Котёл + водонагреватель");

        // === 2. ОБВЯЗКА КОТЕЛЬНОЙ ===
        selBoilers.forEach(b => {
            if (b.type === 'gas') {
                let grp = "2.1. Обвязка Газового котла";
                addToBill(catalog.chimneys[0], 1, this.getDesc('chimney'), grp);
                addToBill(catalog.stabs[0], 1, this.getDesc('stab'), grp);
                addToBill(catalog.american_34, 2, "Разъемное соед.", grp);
                addToBill(catalog.ball_valve_34, 2, "Запорная арматура.", grp);
                addToBill(catalog.filter_mag, 1, "Защита от шлама.", grp);
                if (this.state.hotWater) { addToBill(catalog.valves[0], 1, this.getDesc('fugas'), grp); addToBill(catalog.nipple_34, 2, "Для фугаса.", grp); }
                if (selBoilers.length > 1) addToBill(catalog.check_valve_34, 1, "Обратный клапан.", grp);
            }
        });
        selBoilers.forEach(b => {
            if (b.type !== 'gas') {
                let grp = "2.2. Обвязка Электрического котла";
                let s = b.power <= 18 ? catalog.stabs[1] : catalog.stabs[2]; addToBill(s, 1, this.getDesc('stab'), grp);
                addToBill(catalog.american_34, 2, "Разъемное соед.", grp);
                addToBill(catalog.ball_valve_34, 2, "Запорная арматура.", grp);
                addToBill(catalog.filter_mag, 1, "Защита от шлама.", grp);
                if (this.state.hotWater) { addToBill(catalog.valves[0], 1, this.getDesc('fugas'), grp); addToBill(catalog.nipple_34, 2, "Для фугаса.", grp); }
                if (selBoilers.length > 1) addToBill(catalog.check_valve_34, 1, "Обратный клапан.", grp);
            }
        });
        if (this.state.hotWater) {
            let grp = "2.3. Обвязка Водонагревателя";
            let vol = this.state.res >= 10 ? 500 : this.state.res >= 7 ? 300 : this.state.res >= 5 ? 200 : this.state.res >= 3 ? 150 : 100;
            let exp = catalog.exp_dhw.find(x => x.vol >= vol * 0.1) || catalog.exp_dhw[2];
            addToBill(exp, 1, this.getDesc('exp_d', vol, exp.vol), grp);
            addToBill(catalog.tank_mount, 1, "Крепление", grp); addToBill(catalog.tank_kit, 1, "Подключение бака", grp);
            addToBill(catalog.dhw_fittings[0], 2, "Американка 1\" (Змеевик)", grp); addToBill(catalog.dhw_fittings[1], 2, "Кран 1\" (Змеевик)", grp);
            addToBill(catalog.dhw_fittings[2], 1, "Американка 3/4\" (ГВС)", grp); addToBill(catalog.dhw_fittings[3], 1, "Кран 3/4\" (ГВС)", grp);
            addToBill(catalog.dhw_fittings[4], 1, "Клапан 6 бар", grp); addToBill(catalog.dhw_fittings[5], 1, "Крестовина 3/4\"", grp); addToBill(catalog.dhw_fittings[6], 1, "Клапан обратный (ХВС)", grp); addToBill(catalog.dhw_fittings[7], 1, "Кран 3/4\" (ХВС)", grp);
            if (this.state.recirc) { addToBill(catalog.dhw_pump[0], 1, "Насос ГВС", grp); addToBill(catalog.dhw_fittings[2], 1, "Американка 3/4\" (Рецирк.)", grp); addToBill(catalog.dhw_fittings[3], 1, "Кран 3/4\" (Рецирк.)", grp); addToBill(catalog.dhw_fittings[6], 1, "Обратный клапан (Рецирк.)", grp); }
        }
        let hasRad = this.state.systems.includes('rad');
        let hasTp = this.state.systems.includes('tp');
        let radSecs = 0, radMeters = 0, tpMeters = 0;
        let tpArea = this.state.tp1 + this.state.tp2;
        if (hasRad) { let load = (hasTp && tpArea > 0) ? pwr * 1000 * 0.7 : pwr * 1000; radSecs = Math.ceil(load / 117); if (radSecs > 0) { let pipe = Math.ceil(this.state.win * (Math.sqrt(this.state.area / (this.state.floors === 2 ? 2 : 1)) + 3) * 1.1); radMeters = pipe * 2; } }
        tpMeters = hasTp ? tpArea * 7 : 0;
        // Заранее считаем необходимое количество коллекторов ТП
        let estMans = 0;
        if (hasTp && tpArea > 0) {
            let l1 = this.state.tp1 > 0 ? Math.ceil((this.state.tp1 * 7) / 85) : 0; if (l1 === 1) l1 = 2;
            let l2 = this.state.tp2 > 0 ? Math.ceil((this.state.tp2 * 7) / 85) : 0; if (l2 === 1) l2 = 2;
            if (l1 > 0) estMans += Math.ceil(l1 / 12);
            if (l2 > 0) estMans += Math.ceil(l2 / 12);
        }

        // Эко-схема (локальные узлы) ставится, если нет радиаторов и коллекторов ТП не больше 2-х
        let useEco = (!hasRad && hasTp && estMans <= 2);

        // Логика расчета насосных групп
        let rQ = 0, tQ = 0;
        if (hasRad) {
            // Если есть радиаторы и дом большой/2 этажа - ставим группы на радиаторы
            if (this.state.area > 150 || this.state.floors === 2 || pwr > 20) {
                rQ = (this.state.floors === 2) ? 2 : 1;
            }
        }

        if (hasTp && tpArea > 0) {
            // Если Эко-схема, в котельной группы ТП не ставим. Иначе - ставим по группе на каждый коллектор ТП (но минимум 1).
            tQ = useEco ? 0 : (estMans > 0 ? estMans : 1);
        }

        // Коллектор нужен, если общих групп быстрого монтажа >= 2
        let needCollector = (rQ + tQ) >= 2;

        // Расчет объема системы (для бака)
        let boilersVol = 0; if (selBoilers.length > 0) { selBoilers.forEach(b => { boilersVol += (b.vol !== undefined ? b.vol : 6); }); }
        let vSys = (boilersVol + radSecs * 0.25 + radMeters * 0.11 + tpMeters * 0.113 + (needCollector ? 5 : 0)) * 1.15;
        let reqExp = vSys * 0.12; let bltin = 0; if (selBoilers.length > 0) { selBoilers.forEach(b => { bltin += (b.exp !== undefined ? b.exp : 0); }); }
        let def = reqExp - bltin; if (def > 0) { let et = catalog.exp_heating.find(t => t.vol >= def) || catalog.exp_heating[4]; addToBill(et, 1, this.getDesc('exp_h', Math.round(vSys))); if (et.vol <= 25) addToBill(catalog.tank_mount, 1, "Крепление бака."); addToBill(catalog.tank_kit, 1, "Подключение бака."); }

        // Вывод оборудования котельной
        if (!useEco) {
            let big = (pwr > 30 || tpArea > 120);
            let dn25 = big;
            let pmp = null;

            // Добавляем коллектор/стрелку только если нужно
            if (needCollector) {
                let circuits = rQ + tQ;
                let idx = (circuits > 2) ? 1 : 0;
                if (dn25) {
                    let item = catalog.hydro_dn25[idx]; addToBill(item, 1, "Гидравлическая развязка (DN25).");
                } else {
                    if (this.state.hydroType === 'combo') {
                        let item = catalog.hydro_dn20[idx]; item.alts = catalog.hydro_modular_dn20; addToBill(item, 1, "Коллектор-гидрострелка (Комби).");
                    } else {
                        let item = catalog.hydro_modular_dn20[idx]; item.alts = catalog.hydro_dn20; addToBill(item, 1, "Распр. коллектор."); addToBill(catalog.hydro_arrow, 1, "Гидравлическая стрелка.");
                    }
                }
            }

            let grps = dn25 ? catalog.groups_dn25 : catalog.groups_dn20;
            if (dn25) {
                let activePump = catalog.pumps_dn25.find(p => p.type === this.state.pumpType) || catalog.pumps_dn25[0]; activePump.alts = catalog.pumps_dn25; pmp = activePump;
            } else {
                pmp = catalog.pumps_dn20[0];
            }

            // Добавляем группы и насосы ТОЛЬКО если они рассчитаны и нужен коллектор
            // Если коллектора нет (1 группа), то группа обычно не ставится, насос берется встроенный в котел или ставится отдельно на трубу (здесь упрощение: если нет коллектора, группы не ставим)
            if (needCollector) {
                if (rQ > 0) {
                    addToBill(grps[0], rQ, "Группа прямая (Радиаторы).");
                }
                if (tQ > 0) {
                    addToBill(grps[1], tQ, "Группа смесительная (ТП).");
                }
                if ((rQ + tQ) > 0) addToBill(pmp, rQ + tQ, this.getDesc('pump_std'));
            }
        }
        flushBill("2. Обвязка котельной");

        if (hasRad && radSecs > 0) {
            let totalRadCount = 0;
            let totalConvCount = 0;
            let totalVartronic = 0;
            let heatLoadTotal = Math.round((hasTp && tpArea > 0) ? pwr * 700 : pwr * 1000);

            if (this.state.detailedRooms && this.state.rooms && this.state.rooms.length > 0) {
                this.state.rooms.forEach(r => {
                    let roomSCQCount = 0;

                    // 1. Физика: Базовые потери коробки (учитываем высоту)
                    let rHeight = (r.floor === 2) ? (this.state.h2 || 2.7) : (this.state.h1 || 2.7);
                    let heightCoef = rHeight / 2.7;
                    let baseRoomLoad = (r.area * heightCoef * 70 * (this.state.region / 100) * this.state.mat);

                    let roomHasTp = r.sys && r.sys.includes('tp');
                    let roomHasRad = !r.sys || r.sys.includes('rad');
                    if (roomHasTp) baseRoomLoad = baseRoomLoad * 0.7; // Локальный ТП забирает 30% теплопотерь

                    r.windows.forEach((w, wIdx) => {
                        // 2. Физика: Теплопотери через площадь стекла
                        let wHeight = w.isPan ? 2.5 : 1.5;
                        let wArea = parseFloat(w.width || 1) * wHeight;
                        let windowHeatLoss = wArea * 150 * (this.state.region / 100) * this.state.mat;

                        // 3. Итоговая нагрузка: окно + доля стен
                        let wLoad = windowHeatLoss + (baseRoomLoad / r.windows.length);

                        let locInfo = `<span style="font-size:11px; line-height:1.2;">• <b>${r.name} (Окно ${wIdx + 1})</b>: ${w.width}м | Потери: <b>${Math.round(wLoad)} Вт</b></span>`;

                        if (w.isPan) {
                            let reqPower70 = wLoad / 0.65;
                            let db = this.state.convectorType === 'scn' ? catalog.convectors_scn : catalog.convectors_scq;
                            let item = db.find(x => x.power70 >= reqPower70 && x.len >= w.width * 0.7);
                            if (!item) item = db[db.length - 1];
                            item.alts = [catalog.convectors_scq[0], catalog.convectors_scn[0]];

                            let factPower = Math.round(item.power70 * 0.65);

                            if (factPower < Math.round(wLoad)) {
                                app.tempWarns.push(`• <b>${r.name} (Окно ${wIdx + 1}):</b> дефицит конвектора ~${Math.round(wLoad) - factPower} Вт. Переключите на вентиляторную модель (SCQ).`);
                            }

                            let devInfo = this.getDesc('convector', item.power70, factPower);
                            let cDesc = locInfo + "|||" + devInfo;

                            addToBill(item, 1, cDesc, "3. Приборы отопления");
                            totalConvCount++;
                            if (this.state.convectorType === 'scq') roomSCQCount++;
                        } else if (roomHasRad) {
                            let isRommer = (this.state.brandMode === 'rommer');
                            let reqPwr = Math.round(wLoad);
                            let p50_space = (isRommer && catalog.rads[0].rommer) ? (catalog.rads[0].rommer.power50 || 117) : 117;
                            let p50_titan = (isRommer && titanRads[0].rommer) ? (titanRads[0].rommer.power50 || 128) : 128;

                            let reqSecsSpace = Math.max(4, Math.ceil(reqPwr / p50_space));
                            if ((reqSecsSpace * 0.08) < w.width * 0.7) reqSecsSpace = Math.max(reqSecsSpace, Math.ceil((w.width * 0.7) / 0.08));

                            // Корректировка для Rommer Optima (только четные 4, 6, 8, 10, 12)
                            if (isRommer) {
                                if (reqSecsSpace % 2 !== 0) reqSecsSpace++; // 5->6, 7->8, 9->10, 11->12, 13->14
                                if (reqSecsSpace > 12) reqSecsSpace = 12;    // 14->12
                            } else {
                                if (reqSecsSpace > 14) reqSecsSpace = 14;
                            }
                            let itemSpace = catalog.rads.find(x => x.sec === reqSecsSpace) || catalog.rads[catalog.rads.length - 1];

                            let reqSecsTitan = Math.max(4, Math.ceil(reqPwr / p50_titan));
                            if ((reqSecsTitan * 0.08) < w.width * 0.7) reqSecsTitan = Math.max(reqSecsTitan, Math.ceil((w.width * 0.7) / 0.08));
                            if (reqSecsTitan > 14) reqSecsTitan = 14;
                            let itemTitan = titanRads.find(x => x.sec === reqSecsTitan) || titanRads[titanRads.length - 1];

                            let bestPanel = steelRads.find(s => s.power50 >= reqPwr && (s.sec / 1000) >= w.width * 0.7) || steelRads.find(s => s.power50 >= reqPwr) || steelRads[steelRads.length - 1];

                            let altsList = [itemSpace, itemTitan, bestPanel];
                            itemSpace.alts = altsList; itemTitan.alts = altsList; bestPanel.alts = altsList;

                            let activeItem, factPower;
                            let effectiveRadType = this.state.radType;

                            if (isRommer && effectiveRadType === 'titan') {
                                effectiveRadType = 'space'; // Роммер Титан не существует, берем Оптиму (Space)
                            }

                            if (effectiveRadType === 'steel') {
                                activeItem = bestPanel; factPower = bestPanel.power50;
                                if (this.state.radType === 'space') {
                                    activeItem = { ...itemSpace, rommer: bestPanel };
                                } else if (this.state.radType === 'titan') {
                                    activeItem = { ...itemTitan, rommer: bestPanel };
                                }
                            } else if (effectiveRadType === 'titan') {
                                activeItem = itemTitan; factPower = itemTitan.sec * p50_titan;
                            } else {
                                activeItem = itemSpace; factPower = itemSpace.sec * p50_space;
                            }

                            if (factPower < reqPwr) {
                                app.tempWarns.push(`• <b>${r.name} (Окно ${wIdx + 1}):</b> дефицит мощности радиатора ~${reqPwr - factPower} Вт.`);
                            }

                            let devInfo = app.getDesc('rad_tooltip', {
                                item: activeItem,
                                isRommer: isRommer,
                                demand: reqPwr,
                                fact: factPower,
                                count: 1,
                                win: 1,
                                demandLabel: "Потребность на окно"
                            });

                            let wDesc = locInfo + "|||" + devInfo;
                            addToBill(activeItem, 1, wDesc, "3. Приборы отопления");
                            totalRadCount++;
                        }
                    });
                    if (roomSCQCount > 0) { totalVartronic += Math.ceil(roomSCQCount / 12); }
                });
            } else {
                let win = this.state.win;
                let isRommer = (this.state.brandMode === 'rommer');
                let p50_space = (isRommer && catalog.rads[0].rommer) ? (catalog.rads[0].rommer.power50 || 117) : 117;
                let p50_titan = (isRommer && titanRads[0].rommer) ? (titanRads[0].rommer.power50 || 128) : 128;
                let loadPerWindow = heatLoadTotal / win;

                let totalSecSpace = Math.ceil(heatLoadTotal / p50_space);
                let maxSecs = isRommer ? 12 : 14;
                let countSpace = Math.max(win, Math.ceil(totalSecSpace / maxSecs));
                let secPerRadSpace = Math.max(4, Math.min(maxSecs, Math.ceil(totalSecSpace / countSpace)));

                // Корректировка для Rommer Optima (только четные 4-12)
                if (isRommer) {
                    if (secPerRadSpace % 2 !== 0) secPerRadSpace++;
                    if (secPerRadSpace > 12) secPerRadSpace = 12;
                }
                let itemSpace = catalog.rads.find(x => x.sec === secPerRadSpace) || catalog.rads[catalog.rads.length - 1];

                let totalSecTitan = Math.ceil(heatLoadTotal / p50_titan);
                let countTitan = Math.max(win, Math.ceil(totalSecTitan / 14));
                let secPerRadTitan = Math.max(4, Math.min(14, Math.ceil(totalSecTitan / countTitan)));
                let itemTitan = titanRads.find(x => x.sec === secPerRadTitan) || titanRads[titanRads.length - 1];

                let bestPanel = steelRads.find(s => s.power50 >= loadPerWindow) || steelRads[steelRads.length - 1];
                let countSteel = Math.max(win, Math.ceil(heatLoadTotal / bestPanel.power50));

                let altsList = [itemSpace, itemTitan, bestPanel];
                itemSpace.alts = altsList; itemTitan.alts = altsList; bestPanel.alts = altsList;

                let activeItem, factPowerTotal, totalCount;
                let effectiveRadType = this.state.radType;

                if (isRommer && effectiveRadType === 'titan') {
                    effectiveRadType = 'space';
                }

                if (effectiveRadType === 'steel') {
                    activeItem = bestPanel; totalCount = countSteel; factPowerTotal = activeItem.power50 * totalCount;
                    if (this.state.radType === 'space') {
                        activeItem = { ...itemSpace, rommer: bestPanel };
                    } else if (this.state.radType === 'titan') {
                        activeItem = { ...itemTitan, rommer: bestPanel };
                    }
                } else if (effectiveRadType === 'titan') {
                    activeItem = itemTitan; totalCount = countTitan; factPowerTotal = activeItem.sec * p50_titan * totalCount;
                } else {
                    activeItem = itemSpace; totalCount = countSpace; factPowerTotal = activeItem.sec * p50_space * totalCount;
                }
                totalRadCount = totalCount;

                let devInfo = app.getDesc('rad_tooltip', {
                    item: activeItem,
                    isRommer: isRommer,
                    demand: heatLoadTotal,
                    fact: factPowerTotal,
                    count: totalCount,
                    win: win,
                    demandLabel: "Потребность дома"
                });

                addToBill(activeItem, totalCount, devInfo, "3. Приборы отопления");
            }

            // Обвязка РАДИАТОРОВ (только для обычных окон)
            if (totalRadCount > 0) {
                let grp = "3.1. Обвязка радиаторов";
                let activeHead = catalog.heads.find(h => h.type === this.state.headType) || catalog.heads[0]; activeHead.alts = catalog.heads; addToBill(activeHead, totalRadCount, this.getDesc('rad_head'), grp);
                if (activeHead.type === 'smart') { let radHubs = Math.ceil(totalRadCount / 15); addToBill(catalog.smart_hub, radHubs, `Шлюз Zigbee.`, grp); }
                let activeHValve = catalog.h_valves.find(v => v.type === this.state.connectionType) || catalog.h_valves[0]; activeHValve.alts = catalog.h_valves; addToBill(activeHValve, totalRadCount, this.getDesc('rad_valves'), grp);
                if (this.state.radType === 'steel' && !this.state.detailedRooms) { addToBill(catalog.rad_kits[0], totalRadCount * 2, "Ниппель переходной.", grp); }
                if (activeHValve.id === 'SVH-0002-000020') { addToBill(catalog.rad_tube_set[0], totalRadCount * 2, "Трубка Г-образная.", grp); addToBill(catalog.rad_tube_set[1], totalRadCount, "Скоба фиксатор.", grp); addToBill(catalog.rad_tube_set[2], totalRadCount * 2, "Гильза 16.", grp); addToBill(catalog.rad_tube_set[3], totalRadCount * 2, "Фитинг компрессионный.", grp); }
                addToBill(catalog.parts[1], totalRadCount * 2, "Евроконус 16 (Рад).", grp); addToBill(catalog.parts[2], totalRadCount * 2, "Фиксатор 90°.", grp); addToBill(catalog.protective_sleeves[0], totalRadCount, "Втулка (под).", grp); addToBill(catalog.protective_sleeves[1], totalRadCount, "Втулка (обр).", grp); addToBill(catalog.label_kits[0], 1, "Наклейки.", grp);
            }

            // Обвязка КОНВЕКТОРОВ (строго без биноклей)
            if (totalConvCount > 0) {
                let grpC = "3.2. Обвязка конвекторов";

                let isAngled = (this.state.convConnectionType === 'angled');
                let vSupply = isAngled ? catalog.conv_valves[2] : catalog.conv_valves[0];
                let vReturn = isAngled ? catalog.conv_valves[3] : catalog.conv_valves[1];

                vSupply.alts = [catalog.conv_valves[0], catalog.conv_valves[2]];
                vReturn.alts = [catalog.conv_valves[1], catalog.conv_valves[3]];

                addToBill(vSupply, totalConvCount, "На подачу в конвектор.", grpC);
                addToBill(vReturn, totalConvCount, "На обратку из конвектора.", grpC);

                addToBill(catalog.conv_parts[0], totalConvCount * 2, "Монтажная гильза.", grpC);
                addToBill(catalog.conv_parts[1], totalConvCount * 2, "Переходник на резьбу 1/2.", grpC);

                if (this.state.convectorType === 'scq') {
                    // Для вентиляторных
                    addToBill(catalog.actuators, totalConvCount, "На термостатический клапан.", grpC);
                    if (totalVartronic > 0) {
                        addToBill(catalog.conv_parts[2], totalVartronic, "Настенный регулятор Vartronic (1 шт на комнату, до 12 шт).", grpC);
                    } else if (!this.state.detailedRooms) {
                        addToBill(catalog.conv_parts[2], 1, "Настенный регулятор Vartronic.", grpC);
                    }
                }
                // Для естественной конвекции (SCN) автоматика не выводится
            }

            let totalDevicesCount = totalRadCount + totalConvCount;
            let floorArea = this.state.area / (this.state.floors === 2 ? 2 : 1); let avgRun = Math.sqrt(floorArea) + 3; let totalMeters = totalDevicesCount * avgRun * 1.1; let neededPipe = Math.ceil(totalMeters);
            let pipeGrp = "3.3. Трубы отопления";
            if (neededPipe > 0) {
                if (this.state.pipeType === 'insulated') {
                    let coils = Math.ceil(neededPipe / 100); let halfCoils = Math.ceil(coils / 2);
                    let itemRed = catalog.insulated_pipes[0]; itemRed.alts = catalog.rad_pipes_grey; addToBill(itemRed, halfCoils, `Труба в красной изол.`, pipeGrp);
                    let itemBlue = catalog.insulated_pipes[1]; itemBlue.alts = catalog.rad_pipes_grey; addToBill(itemBlue, halfCoils, `Труба в синей изол.`, pipeGrp);
                } else {
                    let grayItem = (neededPipe > 200) ? catalog.rad_pipes_grey[1] : catalog.rad_pipes_grey[0]; grayItem.alts = catalog.insulated_pipes; addToBill(grayItem, Math.ceil(neededPipe / grayItem.len), this.getDesc('rad_pipe', neededPipe), pipeGrp);
                    let insLen = Math.ceil(neededPipe / 2); if (insLen % 2 !== 0) insLen++; addToBill(catalog.insulation[0], insLen, "Изоляция красная.", pipeGrp); addToBill(catalog.insulation[1], insLen, "Изоляция синяя.", pipeGrp);
                }
                addToBill(catalog.water_fittings[8], neededPipe, "Дюбель-крюк двойной (1 шт/м трубы).", pipeGrp);
            }

            let reqLoops = (this.state.floors === 2 ? Math.ceil(totalDevicesCount / 2) : totalDevicesCount); if (reqLoops > 12) reqLoops = 12; let manifoldsCount = (this.state.floors === 2) ? 2 : 1;
            if (this.state.radManifoldType === 'standard') { let m = catalog.manifolds_rad.find(x => x.loops === reqLoops) || catalog.manifolds_rad[catalog.manifolds_rad.length - 1]; if (m) { m.alts = [catalog.manifolds_chrome_blocks[0]]; addToBill(m, manifoldsCount, this.getDesc('manifold', totalDevicesCount, 'rad'), pipeGrp); } }
            else {
                const assemblyMap = { 2: [0, 0, 1], 3: [0, 1, 0], 4: [1, 0, 0], 5: [0, 1, 1], 6: [0, 2, 0], 7: [1, 1, 0], 8: [2, 0, 0], 9: [1, 1, 1], 10: [1, 2, 0], 11: [2, 1, 0], 12: [3, 0, 0] }; let plan = assemblyMap[reqLoops] || [3, 0, 0]; let b4 = catalog.manifolds_chrome_blocks[2]; let b3 = catalog.manifolds_chrome_blocks[1]; let b2 = catalog.manifolds_chrome_blocks[0]; let stdAlt = catalog.manifolds_rad.find(x => x.loops === reqLoops) || catalog.manifolds_rad[0];[b4, b3, b2].forEach(b => b.alts = [stdAlt]); let multiplier = manifoldsCount * 2;
                if (plan[0] > 0) addToBill(b4, plan[0] * multiplier, `Блок 4 вых.`, pipeGrp); if (plan[1] > 0) addToBill(b3, plan[1] * multiplier, `Блок 3 вых.`, pipeGrp); if (plan[2] > 0) addToBill(b2, plan[2] * multiplier, `Блок 2 вых.`, pipeGrp); addToBill(catalog.manifold_brackets, manifoldsCount, "Кронштейны.", pipeGrp);
            }

            addToWorks("Монтаж радиатора отопления", totalRadCount, workPrices.rad_point, "точка", "1.2 Монтаж радиаторного отопления");
            if (totalConvCount > 0) addToWorks("Монтаж внутрипольного конвектора", totalConvCount, 8500, "шт", "1.2 Монтаж радиаторного отопления");
            if (manifoldsCount > 0) addToWorks("Монтаж коллектора радиаторов", manifoldsCount, workPrices.manifold, "шт", "1.2 Монтаж радиаторного отопления");
        }

        let heatWarnHtml = null;
        if (app.tempWarns && app.tempWarns.length > 0) {
            let hasConvWarn = app.tempWarns.some(w => w.includes('конвектора'));
            let hasRadWarn = app.tempWarns.some(w => w.includes('радиатора'));
            let advice = "";
            if (hasConvWarn && !hasRadWarn) advice = "Для компенсации теплопотерь измените тип приборов (например, нажмите 🔄 для переключения конвектора SCN на вентиляторный SCQ).";
            else if (!hasConvWarn && hasRadWarn) advice = "Для компенсации теплопотерь добавьте дополнительные радиаторы в проблемные помещения.";
            else advice = "Для компенсации теплопотерь измените тип конвекторов (SCN на SCQ) или добавьте дополнительные радиаторы в проблемные помещения.";

            heatWarnHtml = `⚠️ <b>ВНИМАНИЕ: Нехватка мощности отопления!</b><br>` + app.tempWarns.join('<br>') + `<br><span style="font-weight: 500; display:block; margin-top:6px;">${advice}</span>`;
        }
        flushBill("3. Приборы отопления", heatWarnHtml);

        if (hasTp && tpMeters > 0) {
            let q5 = Math.floor(tpMeters / 500); let q1 = Math.ceil((tpMeters % 500) / 100);
            if (q5) addToBill(catalog.pipes[1], q5, this.getDesc('ufh_pipe', tpMeters)); if (q1) addToBill(catalog.pipes[0], q1, this.getDesc('ufh_pipe', tpMeters));
            let loops = 0, mans = 0;
            const proc = (a, lbl) => {
                if (a <= 0) return; let l = Math.ceil((a * 7) / 85); if (l === 1) l = 2; loops += l; let n = Math.ceil(l / 12);
                for (let i = 0; i < n; i++) { let sz = Math.floor(l / n) + (i < (l % n) ? 1 : 0); let m = catalog.manifolds.find(x => x.loops === sz); if (m) { addToBill({ ...m, name: `Коллектор ТП ${sz} вых (${lbl})` }, 1, this.getDesc('manifold', sz, 'ufh')); mans++; if (!needCollector) { addToBill(catalog.mixing_units[0], 1, this.getDesc('ufh_mix')); addToBill(catalog.pumps_mix[0], 1, this.getDesc('pump_std')); } } }
            };
            proc(this.state.tp1, "1 этаж"); proc(this.state.tp2, "2 этаж");
            addToBill(catalog.parts[0], mans * 2, "Концевые фитинги."); addToBill(catalog.parts[3], loops * 2, "Евроконус 16 (ТП)."); addToBill(catalog.parts[2], loops * 2, "Фиксатор 90°.");
            addToBill(catalog.protective_sleeves[0], loops, "Втулка красная."); addToBill(catalog.protective_sleeves[1], loops, "Втулка синяя."); addToBill(catalog.label_kits[1], 1, "Наклейки.");
            let grpIns = "4.1. УТЕПЛИТЕЛЬ И КРЕПЁЖ";
            if (this.state.ufhBaseType === 'mat') { let mt = catalog.mats[0]; mt.alts = [catalog.xps_kit[0]]; let mc = Math.ceil((tpArea / mt.area) * 1.05); addToBill(mt, mc, this.getDesc('ufh_mat', tpArea), grpIns); }
            else { let xpsItem = catalog.xps_kit[0]; xpsItem.alts = catalog.mats; let sheets = Math.ceil((tpArea / xpsItem.area) * 1.05); addToBill(xpsItem, sheets, this.getDesc('ufh_xps', tpArea), grpIns); let totalDowels = Math.ceil(tpArea * 5); addToBill(catalog.xps_kit[1], Math.ceil(totalDowels / 100), `Дюбеля.`, grpIns); let totalStaples = Math.ceil(tpMeters * 2.5); addToBill(catalog.xps_kit[2], Math.ceil(totalStaples / 25), `Скобы.`, grpIns); let tapeRolls = Math.ceil((sheets * 1.76 * 1.1) / 50); addToBill(catalog.xps_kit[3], tapeRolls, `Скотч.`, grpIns); }

            if (this.state.ufhAuto) {
                let grpAuto = "4.2. АВТОМАТИКА ТЁПЛОГО ПОЛА";
                addToBill(catalog.actuators, loops, this.getDesc('actuator'), grpAuto);
                let zones = this.state.ufhZones;
                let activeStatBase = (this.state.ufhCtrl === 'mech') ? catalog.ufh_mech[0] : catalog.ufh_electro[0];
                addToBill(activeStatBase, zones, this.getDesc('thermostat'), grpAuto);
                let cntByZones = Math.ceil(zones / 8); let cntByFloors = (this.state.floors === 2 && this.state.tp2 > 0) ? 2 : 1;
                let finalCnt = Math.max(cntByZones, cntByFloors);
                addToBill(catalog.wiring_center, finalCnt, "Коммутационный блок.", grpAuto);
            }

            let warn = null;
            if (!hasRad && tpArea > 0) {
                let f = (pwr * 1000) / tpArea;
                if (f > 75) {
                    warn = `⚠️ <b>ВНИМАНИЕ: Одного только тёплого пола может не хватить для обогрева!</b><br>
                            Расчетная потребность: <b>${Math.round(f)} Вт/м²</b> (комфортный предел теплоотдачи пола: до 75 Вт/м²).<br>
                            <span style="font-weight: 500;">Чтобы покрыть такие теплопотери в сильные морозы, пол придется нагревать выше санитарных норм (поверхность будет некомфортно горячей для ног). Настоятельно рекомендуется добавить радиаторы отопления.</span>`;
                }
            }
            flushBill("4. Водяной тёплый пол", warn);
        }

        if (this.state.water && this.state.waterZones.length > 0) {
            let mainTitle = "5. Внутреннее водоснабжение";
            let isMerge = this.state.mergeItems;
            let grpCold = isMerge ? mainTitle : "5. Внутреннее водоснабжение";
            let grpHot = isMerge ? mainTitle : "5.1. Внутреннее ГВС";
            let grpRecirc = isMerge ? mainTitle : "5.2. Рециркуляция";
            let grpGen = isMerge ? mainTitle : "5.3. Общие материалы";
            let totalColdPoints = 0, totalHotPoints = 0, totalToilets = 0;
            let totalPipeCold = 0, totalPipeHot = 0;
            let recirc = this.state.recirc;

            this.state.waterZones.forEach(z => {
                let f = z.fixtures;
                totalToilets += f.toilet;
                let cw_only = f.toilet + f.wash + f.dish;
                let mix = f.basin + f.shower + (f.bath || 0);
                let zoneCold = cw_only + mix;
                let zoneHot = mix;
                totalColdPoints += zoneCold;
                totalPipeCold += (z.dist * zoneCold * 1.1);
                if (recirc) {
                    totalHotPoints++;
                    if (zoneHot > 0) totalPipeHot += ((z.dist * 2) + (zoneHot * 2));
                } else {
                    totalHotPoints += zoneHot;
                    if (zoneHot > 0) totalPipeHot += (z.dist * zoneHot * 1.1);
                }
            });

            if (totalColdPoints > 0) {
                let needed = totalColdPoints, q4 = Math.floor(needed / 4), rem = needed % 4, q3 = 0, q2 = 0;
                if (rem === 3) q3 = 1; else if (rem === 2) q2 = 1; else if (rem === 1) { if (q4 > 0) { q4--; q3 = 1; q2 = 1 } else { q2 = 1 } }
                let descColl = this.getDesc('manifold', totalColdPoints, 'cw');
                if (q4) addToBill(catalog.water_manifolds_cold[2], q4, descColl, grpCold);
                if (q3) addToBill(catalog.water_manifolds_cold[1], q3, descColl, grpCold);
                if (q2) addToBill(catalog.water_manifolds_cold[0], q2, descColl, grpCold);
                addToBill(catalog.water_parts[0], totalColdPoints, this.getDesc('eurocone_water', totalColdPoints), grpCold);
                addToBill(catalog.water_parts[2], 1, "Заглушка коллектора", grpCold);
                let pLen = Math.ceil(totalPipeCold);
                addToBill(catalog.water_pipes[0], pLen, this.getDesc('pipe_cw', `${pLen} м`), grpCold);
                addToBill(catalog.water_insulation[1], pLen, this.getDesc('ins_blue', pLen), grpCold);
                addToBill(catalog.water_fittings[8], pLen, "Дюбель-крюк двойной (1 шт/м трубы ХВС).", grpCold);
                let socketsCold = totalColdPoints - totalToilets;
                if (socketsCold > 0) {
                    addToBill(catalog.water_fittings[0], socketsCold, this.getDesc('socket', 'Тупиковая (ХВС)', socketsCold), grpCold);
                    addToBill(catalog.water_parts[7], socketsCold, this.getDesc('sleeve', '1 шт на розетку'), grpCold);
                    addToBill(catalog.water_fittings[4], socketsCold, "Пробка синяя (опрессовка)", grpCold);
                    addToBill(catalog.water_fittings[6], socketsCold, "Фиксатор 90°", grpCold);
                }
                if (totalToilets > 0) addToBill(catalog.water_fittings[8], totalToilets, "Фиксатор трубы (к инсталляции)", grpCold);
            }

            if (totalPipeHot > 0) {
                let needed = totalHotPoints, q4 = Math.floor(needed / 4), rem = needed % 4, q3 = 0, q2 = 0;
                if (rem === 3) q3 = 1; else if (rem === 2) q2 = 1; else if (rem === 1) { if (q4 > 0) { q4--; q3 = 1; q2 = 1 } else { q2 = 1 } }
                let descColl = this.getDesc('manifold', totalHotPoints, recirc ? 'hw_recirc' : 'hw_std');
                if (q4) addToBill(catalog.water_manifolds_hot[2], q4, descColl, grpHot);
                if (q3) addToBill(catalog.water_manifolds_hot[1], q3, descColl, grpHot);
                if (q2) addToBill(catalog.water_manifolds_hot[0], q2, descColl, grpHot);
                addToBill(catalog.water_parts[0], totalHotPoints, this.getDesc('eurocone_water', totalHotPoints), grpHot);
                addToBill(catalog.water_parts[2], 1, "Заглушка коллектора", grpHot);
                let pLen = Math.ceil(recirc ? (totalPipeHot / 2) : totalPipeHot);
                addToBill(catalog.water_pipes[0], pLen, this.getDesc('pipe_hw', `${pLen} м`), grpHot);
                addToBill(catalog.water_insulation[0], pLen, this.getDesc('ins_red', pLen), grpHot);
                addToBill(catalog.water_fittings[8], pLen, "Дюбель-крюк двойной (1 шт/м трубы ГВС).", grpHot);
                let totalMixers = 0;
                this.state.waterZones.forEach(z => totalMixers += (z.fixtures.basin + z.fixtures.shower));
                if (totalMixers > 0) {
                    let socketItem = recirc ? catalog.water_fittings[1] : catalog.water_fittings[0];
                    let sName = recirc ? "Угольник проточный (Бронза)" : "Водорозетка тупиковая";
                    let sCount = recirc ? 2 : 1;
                    addToBill(socketItem, totalMixers, this.getDesc('socket', sName, totalMixers), grpHot);
                    addToBill(catalog.water_parts[7], totalMixers * sCount, this.getDesc('sleeve', `${sCount} шт на розетку`), grpHot);
                    addToBill(catalog.water_fittings[5], totalMixers, "Пробка красная (опрессовка)", grpHot);
                    let fixCount = recirc ? totalMixers * 2 : totalMixers;
                    addToBill(catalog.water_fittings[6], fixCount, "Фиксатор 90°", grpHot);
                }
            }

            if (recirc && totalHotPoints > 0) {
                let needed = totalHotPoints, q4 = Math.floor(needed / 4), rem = needed % 4, q3 = 0, q2 = 0;
                if (rem === 3) q3 = 1; else if (rem === 2) q2 = 1; else if (rem === 1) { if (q4 > 0) { q4--; q3 = 1; q2 = 1 } else { q2 = 1 } }
                let descColl = this.getDesc('manifold', totalHotPoints, 'recirc');
                if (q4) addToBill(catalog.water_manifolds_recirc[2], q4, descColl, grpRecirc);
                if (q3) addToBill(catalog.water_manifolds_recirc[1], q3, descColl, grpRecirc);
                if (q2) addToBill(catalog.water_manifolds_recirc[0], q2, descColl, grpRecirc);
                addToBill(catalog.water_parts[0], totalHotPoints, this.getDesc('eurocone_water', totalHotPoints), grpRecirc);
                addToBill(catalog.water_parts[2], 1, "Заглушка коллектора", grpRecirc);
                let pLen = Math.ceil(totalPipeHot / 2);
                addToBill(catalog.water_pipes[0], pLen, this.getDesc('pipe_hw', `${pLen} м (Обратка)`), grpRecirc);
                addToBill(catalog.water_insulation[0], pLen, this.getDesc('ins_red', pLen), grpRecirc);
                addToBill(catalog.water_fittings[8], pLen, "Дюбель-крюк двойной (1 шт/м трубы рецирк.).", grpRecirc);
            }

            let collGroups = (totalColdPoints > 0 ? 1 : 0) + (totalHotPoints > 0 ? 1 : 0) + (recirc ? 1 : 0);
            if (collGroups > 0) addToBill(catalog.manifold_brackets, collGroups, "Пара кронштейнов на каждый коллектор", grpGen);
            addToBill(catalog.water_parts[3], 1, "Наклейки", grpGen);
            let totalBrackets = 0;
            this.state.waterZones.forEach(z => { totalBrackets += (z.fixtures.basin + z.fixtures.shower + (z.fixtures.bath || 0) + z.fixtures.wash); });
            if (totalBrackets > 0) addToBill(catalog.water_fittings[3], totalBrackets, "Монтажная планка (Для смесителей)", grpGen);
            let allPipe = totalPipeCold + totalPipeHot;

            if (isMerge) {
                flushBill(mainTitle);
            } else {
                flushBill(grpCold);
                flushBill(grpHot);
                flushBill(grpRecirc);
                flushBill(grpGen);
            }

            if (totalColdPoints > 0 || totalHotPoints > 0) {
                // ==========================================
                // БЛОК: 2.1 Внешнее водоснабжение
                // ==========================================
                let extWaterGroup = "2.1 Внешнее водоснабжение";
                if (this.state.hotWater) {
                    addToWorks("Подключение ХВС к бойлеру косвенного нагрева ГВС", 1, 5000, "компл", extWaterGroup);
                }
                if (this.state.well) {
                    addToWorks("Монтаж скважинного насоса (опуск, оголовок, автоматика)", 1, 15000, "компл", extWaterGroup);
                    addToWorks("Прокладка трубы ПНД в траншее", this.state.wellDist, 400, "м.p.", extWaterGroup);
                    addToWorks("Ввод воды в дом (греющий кабель, теплоизоляция)", 1, 5000, "компл", extWaterGroup);
                }

                // ==========================================
                // БЛОК: 2.2 Внутреннее водоснабжение
                // ==========================================
                let wGroup2 = "2.2 Внутреннее водоснабжение";
                if (totalColdPoints > 0) addToWorks("Точка присоединения ХВС (монтаж трубопроводов, водорозетки)", totalColdPoints, 3700, "точка", wGroup2);
                if (totalHotPoints > 0) addToWorks("Точка присоединения ГВС (монтаж трубопроводов, водорозетки)", totalHotPoints, 4500, "точка", wGroup2);
                if (this.state.recirc && totalHotPoints > 0) addToWorks("Точка присоединения рециркуляции ГВС", totalHotPoints, 3700, "точка", wGroup2);
                if (typeof collGroups !== 'undefined' && collGroups > 0) addToWorks("Установка и подключение коллектора системы водоснабжения", collGroups, 4500, "шт", wGroup2);

                // ==========================================
                // БЛОК: 3.1 Внутренняя канализация
                // ==========================================
                let totalFixtures = 0;
                this.state.waterZones.forEach(z => {
                    totalFixtures += z.fixtures.toilet + z.fixtures.basin + z.fixtures.shower + z.fixtures.wash + z.fixtures.dish;
                });

                let sewerGroup = "3.1 Внутренняя канализация";
                if (totalFixtures > 0) addToWorks("Монтаж труб канализации (без метража)", totalFixtures, 3500, "точка", sewerGroup);
                if (totalToilets > 0) addToWorks("Монтаж инсталляции унитаза", totalToilets, 8000, "шт", sewerGroup);
            }
        }

        // === 6. УЗЕЛ ВВОДА ХВС ===
        if (this.state.waterInput) {
            let ni = catalog.water_input_node;
            let grp61 = "6.1. Ввод ХВС в дом";
            ni.forEach(item => addToBill(item, 1, "", grp61));

            if (this.state.outdoorFaucet) {
                let grp62 = "6.2. Незамерзающий уличный кран";
                catalog.outdoor_faucet.forEach(item => addToBill(item, 1, "", grp62));
                addToBill({ id: "SFT-0004-003434", name: "Ниппель 3/4\" НР", price: 207, brand: "STOUT" }, 1, "", grp62);
            }

            if (this.state.bigBlueFilter) {
                let grp63 = "6.3. Система фильтрации Big Blue";
                let bb = catalog.filter_big_blue;
                addToBill(bb[0], 1, "", grp63);
                addToBill(bb[1], 1, "", grp63);
                addToBill(bb[2], 3, "", grp63);
                addToBill(bb[3], 1, "", grp63);
                addToBill(bb[4], 2, "", grp63);
                addToBill(bb[5], 2, "", grp63);
                addToBill(bb[6], 3, "", grp63);
                addToBill(bb[7], 2, "", grp63);
                addToBill(bb[8], 2, "", grp63);
                addToBill(bb[9], 2, "", grp63);
            }

            let ballValve = { id: "SVB-1007-200020", name: "Кран шаровой ВН-НР 3/4\"", price: 1556, brand: "STOUT" };
            let tee34 = { id: "SFT-0020-000034", name: "Тройник 3/4\" ВР", price: 504, brand: "STOUT" };
            let union34 = { id: "SFT-0045-000034", name: "Сгон прямой 3/4\" ВР-НР", price: 583, brand: "STOUT" };
            let nipple34 = { id: "SFT-0004-003434", name: "Ниппель 3/4\" НР", price: 207, brand: "STOUT" };
            let ext30 = { id: "SFT-0002-003430", name: "Удлинитель ВН/ВР 3/4\" 30 мм", price: 501, brand: "STOUT" };

            let grp64 = "6.4. ХВС в коллектор водоснабжения";
            addToBill(tee34, 1, "", grp64); addToBill(ballValve, 1, "", grp64);
            addToBill(union34, 1, "", grp64); addToBill(nipple34, 1, "", grp64); addToBill(ext30, 1, "", grp64);

            if (this.state.hotWater) {
                let grp65 = "6.5. ХВС в бойлер";
                addToBill(tee34, 1, "", grp65); addToBill(ballValve, 1, "", grp65);
                addToBill(union34, 1, "", grp65); addToBill(nipple34, 1, "", grp65); addToBill(ext30, 1, "", grp65);
            }

            if (this.state.heatingFeed) {
                let grp66 = "6.6. Подпитка системы отопления";
                addToBill(tee34, 1, "", grp66); addToBill(ballValve, 1, "", grp66);
                addToBill(union34, 1, "", grp66); addToBill(nipple34, 1, "", grp66); addToBill(ext30, 1, "", grp66);
                addToBill(catalog.plug_34, 1, "", grp66);
            }


            flushBill("6. Узел ввода ХВС");
        }

        // === 7. СКВАЖИНА (Внешнее водоснабжение) ===
        if (this.state.well) {
            let grpWell = "7. Внешнее водоснабжение";
            let q = 0;
            if (this.state.waterZones && this.state.waterZones.length > 0) {
                this.state.waterZones.forEach(z => {
                    q += (z.fixtures.toilet * 0.1) + (z.fixtures.basin * 0.15) + (z.fixtures.shower * 0.3) + ((z.fixtures.bath || 0) * 0.4) + (z.fixtures.wash * 0.2) + (z.fixtures.dish * 0.2);
                });
            }
            if (q > 4.5) q = 4.5 + (q - 4.5) * 0.5;
            if (q < 1.5) q = 1.5;

            let floorsH = this.state.floors === 2 ? 3 : 0;
            let h = (this.state.wellDepth + (this.state.wellDist / 10) + floorsH + 30) * 1.1;

            let validPumps = catalog.well_pumps.filter(p => p.q_max >= (q * 0.9) && p.h_max >= (h + 20));
            let pump = validPumps.length > 0 ? validPumps[0] : catalog.well_pumps[catalog.well_pumps.length - 1];

            let pumpDesc = `<span style="font-size:11px; line-height:1.4;"><span style="font-weight:700; color:#93C5FD; display:block; margin-bottom:4px;">Скважинный насос ROMMER</span><b>Расчет:</b> Потребность ${q.toFixed(1)} м³/ч, Напор ${Math.round(h)} м.<br><b>Формула напора:</b> Глубина (${this.state.wellDepth}м) + Трасса/10 + Высота этажей + 30м (Давление) + 10% запас.<br><i>*Насос включает кабель питания.</i></span>`;

            addToBill(pump, 1, pumpDesc, grpWell);
            let grpWellTie = "7.1. Обвязка скважинного насоса";

            let activeAuto;
            let autoDesc = "";
            if (this.state.wellAutoType === 'sirio') {
                activeAuto = catalog.well_auto.find(a => a.id === 'SCS-0001-000070');
                autoDesc = `<span style="font-size:11px; line-height:1.4;"><b>Автоматика (Инвертор):</b> Частотный преобразователь STOUT SIRIO. Поддерживает идеальное давление (как в квартире) за счет плавного изменения оборотов насоса. Гарантирует плавный пуск, защищает от гидроударов и экономит ресурс двигателя.</span>`;
            } else if (this.state.wellAutoType === 'top') {
                activeAuto = catalog.well_auto.find(a => a.id === 'SCS-0001-000063');
                autoDesc = `<span style="font-size:11px; line-height:1.4;"><b>Автоматика (Премиум):</b> Цифровой контроллер STOUT BRIO-TOP. Настройка давления включения/выключения с кнопок, защита от сухого хода с авто-рестартом, защита от замерзания.</span>`;
            } else {
                activeAuto = catalog.well_auto.find(a => a.id === 'SCS-0001-000064');
                autoDesc = `<span style="font-size:11px; line-height:1.4;"><b>Автоматика (Базовая):</b> Электронное реле STOUT BRIO. Включает насос при падении давления и выключает при прекращении потока. Имеет базовую защиту от "сухого хода".</span>`;
            }
            if (!activeAuto) activeAuto = catalog.well_auto[0];
            addToBill(activeAuto, 1, autoDesc, grpWellTie);

            let t24 = catalog.well_parts.find(x => x.id === "STW-0001-000024");
            let t50 = catalog.well_parts.find(x => x.id === "STW-0002-000050");
            let t80 = catalog.well_parts.find(x => x.id === "STW-0002-000080");
            let t100 = catalog.well_parts.find(x => x.id === "STW-0002-000100");
            let t150 = catalog.well_parts.find(x => x.id === "STW-0002-000150");

            let tankVol = 50;
            let tankItem = t50;
            let tankDesc = "";

            if (this.state.wellAutoType === 'sirio') {
                tankVol = 24;
                tankItem = t24;
                tankDesc = `<span style="font-size:11px; line-height:1.4;"><b>Назначение:</b> Компенсирует микро-утечки в системе.<br><b style="color:var(--primary);">Расчет:</b> ${tankVol} л. При использовании частотного преобразователя SIRIO большой гидроаккумулятор не требуется, так как насос работает плавно и подстраивается под любой расход.</span>`;
            } else {
                if (q > 3.5) { tankVol = 150; tankItem = t150; }
                else if (q > 2.5) { tankVol = 100; tankItem = t100; }
                else if (q > 1.5) { tankVol = 80; tankItem = t80; }
                let usefulVol = Math.round(tankVol * 0.33);
                tankDesc = `<span style="font-size:11px; line-height:1.4;"><b>Назначение:</b> Создает запас воды (~${usefulVol} л) и защищает насос от губительных частых включений. Гасит гидроудары.<br><b style="color:var(--primary);">Расчет:</b> Емкость ${tankVol} л подобрана на основе расчетного пикового водоразбора (${q.toFixed(1)} м³/ч).</span>`;
            }

            if (tankItem) addToBill(tankItem, 1, tankDesc, grpWellTie);

            let cableLen = parseInt(this.state.wellDepth) + 3;
            let coilsCount = Math.ceil(cableLen / 250);
            let cableDesc = `<span style="font-size:11px; line-height:1.4;">Расчетная длина троса: <b>${cableLen} м</b>.<br>Трос 4 мм: Разрывная нагрузка ~920 кг.</span>`;
            addToBill(catalog.well_parts[1], coilsCount, cableDesc, grpWellTie);

            addToBill(catalog.well_parts[3], 1, 'Скважинный оголовок — предназначен для герметизации окончания обсадной трубы скважины с наружным диаметром от 125 до 133 мм после установки в нее погружного насоса с диаметром напорной трубы 32 мм.<br>выходное отверстие (внутренняя резьба): 1"', grpWellTie);

            let valveDesc = `<span style="font-size:11px; line-height:1.4;"><b>Назначение:</b> Удерживает столб воды в трубе при выключенном насосе, защищая систему от гидроударов.<br><b>Почему металлическое седло?</b> В отличие от клапанов с пластиковым внутренним механизмом, металлическое седло (золотник) выдерживает колоссальное давление воды в глубоких скважинах и не ломается при постоянных жестких включениях насоса.</span>`;
            addToBill(catalog.well_parts[4], 1, valveDesc, grpWellTie);

            let pipeLen = parseInt(this.state.wellDepth) + parseInt(this.state.wellDist) + 5;
            let pipePieces = Math.ceil(pipeLen / 5);
            let pipeDesc = `<span style="font-size:11px; line-height:1.4;">Расчетная длина: <b>${pipeLen} м</b>.<br><b>Почему 32х3.0 питьевая?</b> Стенка 3.0 мм (PN16) гарантированно выдерживает высокое давление глубоководного насоса без сплющивания и разрывов. Питьевая труба (из первичного полиэтилена с синей полосой) абсолютно безопасна для здоровья и не придает воде химический запах.</span>`;
            addToBill(catalog.well_parts[0], pipePieces, pipeDesc, grpWellTie);

            let muftaDesc = `<span style="font-size:11px; line-height:1.4;"><b>Назначение:</b> Компрессионный переходник для соединения пластиковой трубы с металлическим оборудованием.<br><b>Монтаж:</b> 2 штуки. Первая муфта вкручивается в обратный клапан насоса (внизу), вторая — в скважинный оголовок (наверху).</span>`;
            addToBill(catalog.well_parts[5], 2, muftaDesc, grpWellTie);

            let clipDesc = `<span style="font-size:11px; line-height:1.4;"><b>Монтаж:</b> По 2 зажима на каждую петлю (снизу у насоса и сверху у оголовка) для надежной фиксации и страховки.<br><b>Назначение:</b> Надежно фиксируют петли страховочного троса. Рекомендуется использовать зажимы, устойчивые к коррозии, чтобы избежать обрыва в агрессивной среде скважины.</span>`;
            addToBill(catalog.well_parts[2], 4, clipDesc, grpWellTie);

            let thimbleDesc = `<span style="font-size:11px; line-height:1.4;"><b>Назначение:</b> Вставляется внутрь петли троса. Защищает трос от перетирания и излома в местах крепления к насосу и оголовку.</span>`;
            addToBill(catalog.well_parts[6], 2, thimbleDesc, grpWellTie);

            flushBill(grpWell);
            let grpWellTie7 = "7.1. Обвязка скважинного насоса";
            // (grpWellTie already used above — flush with correct name)
            flushBill(grpWellTie);
        }

        // === 8. КАНАЛИЗАЦИЯ ===
        let sewerToilets = 0;
        if (this.state.waterZones && this.state.waterZones.length > 0) {
            this.state.waterZones.forEach(z => {
                sewerToilets += z.fixtures.toilet;
            });
        }
        if (sewerToilets > 0) {
            addToBill(catalog.water_parts[6], sewerToilets, this.getDesc('install'), "8. Канализация");
            flushBill("8. Канализация");
        }

        // === 9. ДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ ===
        let cl = catalog.coolants.find(c => c.type === this.state.coolant);
        if (cl) {
            if (cl.type === 'pro65') {
                let vP = vSys * 0.65; let vH = vSys * 0.35; let p1 = catalog.coolants[2]; let p2 = catalog.coolants[0];
                addToBill(p1, Math.ceil(vP / p1.vol), "Концентрат.", "9. Дополнительные материалы"); addToBill(p2, Math.ceil(vH / p2.vol), "Вода.", "9. Дополнительные материалы");
            } else {
                addToBill(cl, Math.ceil(vSys / cl.vol), this.getDesc('coolant', Math.round(vSys)), "9. Дополнительные материалы");
            }
        }
        flushBill("9. Дополнительные материалы");

        // 9. СВОЁ ОБОРУДОВАНИЕ (Только для вкладки оборудования)
        if (this.state.viewMode === 'equipment') {
            if (this.state.userAddedEq && this.state.userAddedEq.length > 0) {
                this.state.userAddedEq.forEach(eq => {
                    // Передаем объект как есть, без крестиков, выравнивание будет стандартным
                    let customEqItem = { ...eq, brand: " " };
                    addToBill(customEqItem, eq.q, eq.desc || "", "9. Своё оборудование");
                });
                flushBill("9. Своё оборудование");
            }

            // Кнопка добавления (со специальным классом no-print для скрытия при печати)
            h += `<tr class="hide-custom-eq-btn no-print"><td colspan="100">
                    <div class="btn-add-custom" onclick="app.addCustomEqPrompt()">
                        + Добавить своё оборудование
                    </div>
                  </td></tr>`;
        }
        // ==========================================
        // БЛОК: 1.1 Монтаж котельной (Логика работ)
        // ==========================================
        let wGroup = "1.1 Монтаж котельной";

        // 1. Котлы и дымоудаление
        let gasCount = this.state.fuels.includes('gas') ? 1 : 0;
        let elCount = this.state.fuels.includes('el') ? 1 : 0;

        if (elCount > 0) addToWorks("Mонтаж электрического котла", elCount, 18000, "шт", wGroup);
        if (gasCount > 0) {
            addToWorks("Монтаж газового котла", gasCount, 20000, "шт", wGroup);
            addToWorks("Монтаж коаксиального дымохода", gasCount, 10000, "шт", wGroup);
            addToWorks("Монтаж отверстия под дымоход", gasCount, 6000, "шт", wGroup);
        }

        // 2. Бойлер и водоснабжение
        if (this.state.hotWater) {
            addToWorks("Монтаж водонагревателя / бойлера", 1, 9000, "шт", wGroup);
            addToWorks("Подключение бойлера косвенного нагрева (монтаж гидравлики)", 1, 12000, "компл", wGroup);
            addToWorks("Установка расширительного бака водоснабжения", 1, 4500, "шт", wGroup);
            addToWorks("Монтаж гидравлики ГВС (подпитка СО + подключение ГВС)", 1, 9000, "компл", wGroup);
            if (this.state.recirc) {
                addToWorks("Монтаж системы рециркуляции", 1, 8000, "компл", wGroup);
            }
        }

        if (this.state.water) {
            addToWorks("Монтаж гидравлики ХВС (узел ввода, фильтры, байпас)", 1, 20000, "компл", wGroup);
        }

        // 3. Распределительная гидравлика
        let isCombo = (this.state.systems.includes('rad') && this.state.systems.includes('tp'));
        if (isCombo) {
            addToWorks("Монтаж коллектора и гидрострелки", 1, 12000, "шт", wGroup);
            addToWorks("Монтаж насосной группы", 2, 6500, "шт", wGroup); // Группа на ТП и на Радиаторы
        } else if (this.state.systems.includes('tp')) {
            addToWorks("Монтаж узла смешения теплого пола", 1, 9000, "шт", wGroup);
        }

        // 4. Трассы (Магистрали)
        if (this.state.systems.includes('tp') && this.state.area > 0) {
            addToWorks("Монтаж ГИДРАВЛИКИ: от котла до коллектора т.пола", 1, 15000, "компл", wGroup);
        }
        if (this.state.systems.includes('rad')) {
            addToWorks("Монтаж ГИДРАВЛИКИ: от котла - магистральные трубопроводы радиаторов", 1, 9000, "компл", wGroup);
        }

        // 5. Общие и пусконаладочные работы
        addToWorks("Монтаж ГИДРАВЛИКИ: расширительные баки, предохранительные клапаны", 1, 9000, "компл", wGroup);
        addToWorks("Опрессовка котельной", 1, 5000, "компл", wGroup);
        addToWorks("Пусконаладка котельной", 1, 12000, "компл", wGroup);
        addToWorks("Монтаж электрики котельной", 1, 12000, "компл", wGroup);
        // ==========================================

        // ==========================================
        // БЛОК: 1.2 Монтаж радиаторного отопления
        // ==========================================
        let radGroup = "1.2 Монтаж радиаторного отопления";
        if (this.state.systems.includes('rad') && typeof activeCount !== 'undefined' && activeCount > 0) {
            addToWorks("Монтаж трубопроводов PEX-a... и подключение радиатора", activeCount, 6500, "шт", radGroup);

            if (typeof manifoldsCount !== 'undefined' && manifoldsCount > 0) {
                addToWorks("Установка коллектора для радиаторов", manifoldsCount, 6000, "пара", radGroup);

                // Если есть коллектор, добавляем шкаф (только если клиент не отключил их в настройках, проверим по bill)
                let radCabs = bill.filter(x => x.group === "Радиаторы" && x.name.toLowerCase().includes("шкаф")).reduce((sum, x) => sum + x.q, 0);
                if (radCabs > 0) addToWorks("Монтаж и обвязка распределительных шкафов", radCabs, 4000, "шт", radGroup);
            }
        }

        // ==========================================
        // БЛОК: 1.3 Монтаж водяного теплого пола
        // ==========================================
        let tpGroup = "1.3 Монтаж водяного теплого пола";
        if (this.state.systems.includes('tp') && typeof tpArea !== 'undefined' && tpArea > 0) {
            addToWorks("Монтаж труб водяного тёплого пола", tpArea, 750, "м²", tpGroup);
            addToWorks("Монтаж утеплителя для укладки ТП", tpArea, 350, "м²", tpGroup);

            if (typeof mans !== 'undefined' && mans > 0) {
                addToWorks("Установка и подключение коллектора теплого пола", mans, 6500, "пара", tpGroup);

                // Шкафы берем из фактического наличия в спецификации
                let tpCabs = bill.filter(x => x.group === "Тёплый пол" && x.name.toLowerCase().includes("шкаф")).reduce((sum, x) => sum + x.q, 0);
                if (tpCabs > 0) addToWorks("Монтаж и обвязка распределительных шкафов", tpCabs, 6000, "шт", tpGroup);
            }

            // Если используется Эко-схема (локальный подмес)
            if (typeof useEco !== 'undefined' && useEco) {
                addToWorks("Сборка и установка узла подмеса", 1, 6000, "шт", tpGroup);
                addToWorks("Установка насоса", 1, 3000, "шт", tpGroup);
            }

            addToWorks("Опрессовка систем водяного тёплого пола", 1, 5000, "компл", tpGroup);
        }

        // ==========================================
        // БЛОК: 1.4 Автоматика для теплого пола
        // ==========================================
        let autoGroup = "1.4 Автоматика для теплого пола";
        if (this.state.systems.includes('tp') && this.state.ufhAuto) {
            if (typeof finalCnt !== 'undefined' && finalCnt > 0) {
                addToWorks("Монтаж коммутационного блока", finalCnt, 5000, "шт", autoGroup);
            }

            // Берем количество сервоприводов из спецификации (чтобы не было расхождений)
            let servos = bill.filter(x => x.name.toLowerCase().includes("сервопривод")).reduce((sum, x) => sum + x.q, 0);
            if (servos > 0) addToWorks("Монтаж сервоприводов", servos, 1000, "шт", autoGroup);

            let therms = this.state.ufhZones || 0;
            if (therms > 0) {
                addToWorks("Монтаж термостатов", therms, 4500, "шт", autoGroup);
                addToWorks("Монтаж закладной для датчика пола", therms, 1000, "шт", autoGroup);
                addToWorks("Прокладка провода на термостаты", therms * 15, 100, "м.p.", autoGroup);
            }
        }

        // Добавляем ручные работы перед финальной отрисовкой
        if (this.state.userAddedWorks) {
            this.state.userAddedWorks.forEach(w => {
                addToWorks(w.name, w.q, w.price, w.unit, w.group);
            });
        }

        flushWorks();

        document.getElementById('tbody').innerHTML = h;
        document.getElementById('total_sum').innerText = sum.toLocaleString() + " ₽";

        // Toggle and update discount block for PRO users
        let discountBlock = document.getElementById('discount_block');
        if (discountBlock) {
            if (isPro && this.state.viewMode === 'equipment') {
                discountBlock.style.display = 'flex';
                document.getElementById('rec_price_val').innerText = (app.originalEqSum || 0).toLocaleString() + " ₽";
                document.getElementById('eq_discount_slider').value = this.state.eqDiscount || 0;
                document.getElementById('eq_discount_val').innerText = this.state.eqDiscount || 0;
            } else {
                discountBlock.style.display = 'none';
            }
        }
        let d = showSku ? 'table-cell' : 'none'; document.querySelectorAll('.col-sku').forEach(e => e.style.display = d); document.querySelector('.col-sku-head').style.display = d;

        // === ОБНОВЛЕНИЕ СУММ В ЛИПКОЙ ШАПКЕ (С АНИМАЦИЕЙ) ===
        let headerTotals = document.getElementById('header_totals');
        if (headerTotals) {
            // Проверяем тариф (может быть pro в accountType или внутри tgUser или активный триал)
            let trialUntil = parseInt(localStorage.getItem('pro_trial_until')) || 0;
            let isTrialActive = trialUntil > Date.now();
            let isPro = (this.state.accountType === 'pro' || isTrialActive || (this.state.tgUser && ['pro', 'admin'].includes(this.state.tgUser.account_type)));

            // Строим HTML каркас только 1 раз (или при смене тарифа), чтобы не сбрасывать анимацию
            if (!headerTotals.innerHTML.includes('anim_eq_sum') || headerTotals.dataset.isPro !== String(isPro)) {
                let html = `<span style="color:var(--text-sec); font-size:11px; margin-right:4px;">Оборудование:</span> <b id="anim_eq_sum" style="color:var(--primary); font-size:14px;">0 ₽</b>`;
                if (isPro) {
                    html += `<span style="margin:0 10px; color:var(--border);">|</span> <span style="color:var(--text-sec); font-size:11px; margin-right:4px;">Монтаж:</span> <b id="anim_works_sum" style="color:#F97316; font-size:14px;">0 ₽</b>`;
                }
                headerTotals.innerHTML = html;
                headerTotals.dataset.isPro = String(isPro);
                headerTotals.dataset.lastEq = 0;
                headerTotals.dataset.lastWorks = 0;
            }

            // Запускаем анимацию Оборудования
            let elEq = document.getElementById('anim_eq_sum');
            let oldEq = parseFloat(headerTotals.dataset.lastEq) || 0;
            let newEq = app.lastEqSum || 0;
            if (oldEq !== newEq && elEq) {
                app.animateNumber(elEq, oldEq, newEq, 2400); // Замедлено до 2.4 секунд
                headerTotals.dataset.lastEq = newEq;
            }

            // Запускаем анимацию Монтажа
            if (isPro) {
                let elWorks = document.getElementById('anim_works_sum');
                let oldWorks = parseFloat(headerTotals.dataset.lastWorks) || 0;
                let newWorks = app.lastWorksSum || 0;
                if (oldWorks !== newWorks && elWorks) {
                    app.animateNumber(elWorks, oldWorks, newWorks, 2400); // Замедлено до 2.4 секунд
                    headerTotals.dataset.lastWorks = newWorks;
                }
            }

            headerTotals.style.display = 'flex';
        }
        // === ОБНОВЛЕНИЕ СУММ В МОБИЛЬНОЙ ШАПКЕ (НОВЫЙ ВИДЖЕТ) ===
        let mEqEl = document.getElementById('m_tot_eq');
        let mWorkEl = document.getElementById('m_tot_work');
        let mobileTotals = document.getElementById('mobile_header_totals');

        if (mEqEl && mobileTotals) {
            let oldEq = parseFloat(mobileTotals.dataset.lastEq) || 0;
            let newEq = app.lastEqSum || 0;
            if (oldEq !== newEq) {
                app.animateNumber(mEqEl, oldEq, newEq, 2400);
                mobileTotals.dataset.lastEq = newEq;
            }

            // Проверяем тариф
            let trialUntil = parseInt(localStorage.getItem('pro_trial_until')) || 0;
            let isPro = (this.state.accountType === 'pro' || trialUntil > Date.now() || (this.state.tgUser && ['pro', 'admin'].includes(this.state.tgUser.account_type)));

            if (isPro && mWorkEl) {
                let oldWorks = parseFloat(mobileTotals.dataset.lastWorks) || 0;
                let newWorks = app.lastWorksSum || 0;
                if (oldWorks !== newWorks) {
                    app.animateNumber(mWorkEl, oldWorks, newWorks, 2400);
                    mobileTotals.dataset.lastWorks = newWorks;
                }
                document.querySelector('.m-total-work').style.display = 'inline';
                document.querySelector('.m-total-div').style.display = 'inline';
            } else {
                document.querySelector('.m-total-work').style.display = 'none';
                document.querySelector('.m-total-div').style.display = 'none';
            }
        }
        // ===================================================
        // Очищаем старую схему и вставляем новую ПЕРЕД таблицей спецификации
        let oldScheme = document.getElementById('dynamic_scheme');
        if (oldScheme) oldScheme.remove();
        if (this.state.viewMode === 'equipment' && this.state.showScheme) {
            let tableWrapper = document.querySelector('.table-responsive');
            if (tableWrapper) {
                tableWrapper.insertAdjacentHTML('beforebegin', this.renderScheme());
            }
        }
        this.saveState();

        if (this.isAppReady) {
            // Сравниваем текущие инженерные настройки с последними сохраненными
            let isDifferent = (this.lastSavedStateString !== this.getStateSignature());
            if (isDifferent) this.markAsUnsaved();
            else this.markAsSaved();
        }

        // Моментальное обновление бейджа с процентом экономии
        let dBadge = document.getElementById('discount_badge');
        if (dBadge) {
            if (this.state.brandMode === 'rommer' && this.calcBaseTotal > this.calcFinalTotal) {
                let diff = this.calcBaseTotal - this.calcFinalTotal;
                let percent = Math.round((diff / this.calcBaseTotal) * 100);
                dBadge.textContent = 'Экономия ' + percent + '%';
                dBadge.style.display = 'block';
            } else {
                dBadge.style.display = 'none';
            }
        }
    },

    openPaymentModal(type) {
        const overlay = document.getElementById('payment_modal_overlay');
        const subtitle = document.getElementById('planName');
        const qrContainer = document.getElementById('qrcode_container');
        const linkBtn = document.getElementById('pay_link_btn');
        const emailInput = document.getElementById('userEmail');

        if (!overlay || !qrContainer) return;

        let url = "";
        let tariffName = "";
        let price = "";

        if (type === 'month') {
            url = "https://www.tbank.ru/cf/59ivYDZRKQK";
            tariffName = "PRO 1 месяц";
            price = "1 500 ₽";
        } else if (type === 'year') {
            url = "https://tbank.ru/cf/7tE93xi7saP";
            tariffName = "PRO 1 год";
            price = "10 800 ₽";
        }

        subtitle.innerText = `Тариф: ${tariffName} (${price})`;
        if (linkBtn) linkBtn.href = url;

        // Clear old QR
        qrContainer.innerHTML = "";

        // Generate new QR using qrcode.js
        try {
            new QRCode(qrContainer, {
                text: url,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (e) {
            console.error("QR Generation error:", e);
        }

        // Pre-fill email if user is logged in
        if (this.state.tgUser && this.state.tgUser.email) {
            emailInput.value = this.state.tgUser.email;
        } else {
            // Attempt to get email from Supabase session
            supabaseClient.auth.getSession().then(({ data }) => {
                if (data && data.session && data.session.user) {
                    emailInput.value = data.session.user.email;
                }
            });
        }

        overlay.style.display = 'flex';
        this.currentPaymentTariff = tariffName;
    },

    // === FEEDBACK FORM FUNCTIONALITY ===
    selectedFeedbackCategory: 'bug',
    feedbackImageBase64: null,

    openFeedbackModal: function () {
        // Reset fields
        const subjectEl = document.getElementById('feedback_subject');
        const descEl = document.getElementById('feedback_description');
        const fileInput = document.getElementById('feedback_file_input');
        
        if (subjectEl) subjectEl.value = '';
        if (descEl) descEl.value = '';
        if (fileInput) fileInput.value = '';
        
        this.feedbackImageBase64 = null;
        this.clearFeedbackFile();

        // Show main view, hide success view
        const mainContent = document.getElementById('feedback_main_content');
        const successContent = document.getElementById('feedback_success_content');
        if (mainContent) mainContent.style.display = 'block';
        if (successContent) successContent.style.display = 'none';

        // Set default category
        this.selectFeedbackCategory('bug');

        // Show overlay
        const overlay = document.getElementById('feedback_modal_overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    },

    closeFeedbackModal: function () {
        const overlay = document.getElementById('feedback_modal_overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    selectFeedbackCategory: function (category) {
        this.selectedFeedbackCategory = category;
        
        // Update active classes
        document.querySelectorAll('.feedback-cat-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const activeCard = document.getElementById('feedback_cat_' + category);
        if (activeCard) {
            activeCard.classList.add('active');
        }
    },

    handleFeedbackFile: function (event) {
        const file = event.target.files[0];
        if (!file) return;

        // Size check (1MB = 1048576 bytes)
        if (file.size > 1048576) {
            app.alert("Ошибка: размер изображения превышает 1МБ.");
            this.clearFeedbackFile();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Resize image using canvas to max 800x800 to avoid EmailJS payload limit
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 800;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress image to JPEG 0.6
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                this.feedbackImageBase64 = dataUrl;

                // Show preview UI
                const previewContainer = document.getElementById('feedback_file_preview_container');
                const fileNameEl = document.getElementById('feedback_file_name');
                const fileTextEl = document.getElementById('feedback_file_text');
                
                if (previewContainer) previewContainer.style.display = 'flex';
                if (fileNameEl) fileNameEl.innerText = file.name;
                if (fileTextEl) fileTextEl.innerText = "Изображение прикреплено";
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    clearFeedbackFile: function () {
        this.feedbackImageBase64 = null;
        const fileInput = document.getElementById('feedback_file_input');
        if (fileInput) fileInput.value = '';
        
        const previewContainer = document.getElementById('feedback_file_preview_container');
        const fileTextEl = document.getElementById('feedback_file_text');
        
        if (previewContainer) previewContainer.style.display = 'none';
        if (fileTextEl) fileTextEl.innerText = "Прикрепить изображение (макс. 1МБ)";
    },

    submitFeedback: async function () {
        const subjectEl = document.getElementById('feedback_subject');
        const descEl = document.getElementById('feedback_description');
        const sendBtn = document.getElementById('btn_send_feedback');

        const subject = subjectEl ? subjectEl.value.trim() : '';
        const description = descEl ? descEl.value.trim() : '';

        if (!subject || !description) {
            app.alert("Пожалуйста, заполните Тему и Описание.");
            return;
        }

        // Set Loading state
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerText = "Отправка...";
        }

        try {
            // 1. Gather browser diagnostics & network IP/geo details
            let clientIp = '0.0.0.0';
            let clientCity = 'Не определен';
            try {
                const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                if (isLocal) {
                    clientIp = '127.0.0.1';
                    clientCity = 'Локальный хост';
                } else {
                    const res = await fetch('https://ipapi.co/json/');
                    const geo = await res.json();
                    clientIp = geo.ip || '0.0.0.0';
                    clientCity = geo.city || 'Не определен';
                }
            } catch (e) {
                console.error("Feedback geo-IP error:", e);
            }

            const categoryLabels = {
                'bug': '🐞 Баг / Ошибка',
                'idea': '💡 Идея / Улучшение',
                'question': '❓ Вопрос',
                'other': '💬 Другое'
            };

            const categoryLabel = categoryLabels[this.selectedFeedbackCategory] || this.selectedFeedbackCategory;
            const userAgent = navigator.userAgent;
            const windowSize = `${window.innerWidth}x${window.innerHeight}`;
            const screenSize = `${screen.width}x${screen.height}`;
            const platform = navigator.platform;
            const language = navigator.language;
            const connectionSpeed = navigator.connection ? navigator.connection.effectiveType : 'unknown';

            // Gather contact info
            const userEmail = this.state.tgUser?.email || 'Не указан';
            const userName = this.state.tgUser?.first_name || this.state.tgUser?.username || 'Гость';
            const userPhone = this.state.tgUser?.phone || 'Не указан';
            const userCity = this.state.tgUser?.city || 'Не указан';
            
            // Gather calculation details
            const projectName = this.state.projectName || 'Новый объект';
            const calcId = this.state.calc_id || 'Нет ID';
            const eqSum = app.lastEqSum || 0;
            const workSum = app.lastWorksSum || 0;
            const totalSum = eqSum + workSum;

            // 2. Telegram Alert dispatch
            const tgBotToken = '8601624733:AAH3Mlz6NQJ3MB1pSE2T17hMzPoocbTAGmg';
            const tgChatId = '594437394';
            const tgMessage = `📩 НОВЫЙ ОТЗЫВ / ОБРАТНАЯ СВЯЗЬ!\n` +
                              `========================\n` +
                              `• Категория: ${categoryLabel}\n` +
                              `• Тема: ${subject}\n` +
                              `• Описание: ${description}\n\n` +
                              `👤 ОТПРАВИТЕЛЬ:\n` +
                              `• Имя: ${userName}\n` +
                              `• Email: ${userEmail}\n` +
                              `• Телефон: ${userPhone}\n` +
                              `• Город (профиль): ${userCity}\n\n` +
                              `🌐 УСТРОЙСТВО И СЕТЬ:\n` +
                              `• IP: ${clientIp} (${clientCity})\n` +
                              `• Браузер/ОС: ${userAgent}\n` +
                              `• Окно: ${windowSize}, Экран: ${screenSize}\n` +
                              `• Платформа: ${platform}, Язык: ${language}\n` +
                              `• Сеть: ${connectionSpeed}\n\n` +
                              `📊 ДАННЫЕ РАСЧЕТА:\n` +
                              `• Объект: ${projectName}\n` +
                              `• ID Расчета: ${calcId}\n` +
                              `• Сумма: ${totalSum} ₽ (Оборудование: ${eqSum} ₽, Монтаж: ${workSum} ₽)\n` +
                              `========================\n` +
                              `${this.feedbackImageBase64 ? '🖼️ [Изображение прикреплено в письме]' : '❌ Изображение не прикреплено'}`;

            const tgUrl = `https://api.telegram.org/bot${tgBotToken}/sendMessage`;
            fetch(tgUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: tgChatId, text: tgMessage })
            }).catch(err => console.error('Ошибка отправки в Telegram:', err));

            // 3. EmailJS dispatch
            const emailjsServiceID = 'service_o11b4ej';
            const emailjsTemplateID = 'template_ysuxfio';

            const emailSubject = `[Feedback - ${categoryLabel}] ${subject}`;
            const emailBody = `Поступила новая форма обратной связи:\n\n` +
                              `Категория: ${categoryLabel}\n` +
                              `Тема: ${subject}\n` +
                              `Описание: ${description}\n\n` +
                              `--- ОТПРАВИТЕЛЬ ---\n` +
                              `Имя: ${userName}\n` +
                              `Email: ${userEmail}\n` +
                              `Телефон: ${userPhone}\n` +
                              `Город (профиль): ${userCity}\n\n` +
                              `--- ДИАГНОСТИКА УСТРОЙСТВА ---\n` +
                              `IP-Адрес: ${clientIp} (${clientCity})\n` +
                              `User Agent: ${userAgent}\n` +
                              `Window Size: ${windowSize}, Screen Resolution: ${screenSize}\n` +
                              `Platform: ${platform}, Language: ${language}\n` +
                              `Network Speed: ${connectionSpeed}\n\n` +
                              `--- ДАННЫЕ РАСЧЕТА ---\n` +
                              `Название объекта: ${projectName}\n` +
                              `ID Расчета: ${calcId}\n` +
                              `Итого сметы: ${totalSum} ₽\n\n` +
                              `--------------------------------\n` +
                              `Отправлено автоматически с сайта HeatCalc.ru.`;

            const templateParams = {
                to_email: 'kovdor24@yandex.ru',
                user_email: userEmail,
                tariff_name: categoryLabel,
                email_subject: emailSubject,
                subject_text: emailSubject,
                email_body: emailBody,
                message_text: emailBody,
                feedback_image: this.feedbackImageBase64 || ''
            };

            if (typeof emailjs !== 'undefined') {
                try {
                    await emailjs.send(emailjsServiceID, emailjsTemplateID, templateParams);
                } catch (emailjsError) {
                    console.error('Ошибка EmailJS при отправке отзыва:', emailjsError);
                }
            } else {
                console.warn('Библиотека EmailJS не загружена');
            }

            // Show success content
            const mainContent = document.getElementById('feedback_main_content');
            const successContent = document.getElementById('feedback_success_content');
            if (mainContent) mainContent.style.display = 'none';
            if (successContent) successContent.style.display = 'block';

        } catch (error) {
            console.error("Ошибка отправки обратной связи:", error);
            app.alert("Не удалось отправить отзыв. Пожалуйста, попробуйте позже.");
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerText = "Отправить отзыв";
            }
        }
    },

};

// Глобальные функции для обработки оплаты (вызываются напрямую из HTML)
function closePaymentModal() {
    const overlay = document.getElementById('payment_modal_overlay');
    if (overlay) overlay.style.display = 'none';
}

async function notifyPayment() {
    const emailEl = document.getElementById('userEmail');
    const emailInput = emailEl ? emailEl.value.trim() : '';
    const planNameEl = document.getElementById('planName');

    // Динамически получаем название тарифа со стоимостью из заголовка в модальном окне
    let tariffNameText = '';
    if (planNameEl) {
        // Убираем префикс "Тариф: ", если он присутствует
        tariffNameText = planNameEl.innerText.replace(/^Тариф:\s*/i, '').trim();
    }

    if (!emailInput) {
        app.alert('Пожалуйста, укажите ваш email, чтобы мы могли активировать PRO-статус.');
        return;
    }

    // === 1. ОТПРАВКА В TELEGRAM ===
    const tgBotToken = '8601624733:AAH3Mlz6NQJ3MB1pSE2T17hMzPoocbTAGmg';
    const tgChatId = '594437394';
    const messageText = `🔥 Новая заявка на PRO!\nПользователь: ${emailInput}\nТариф: ${tariffNameText}\nПроверьте поступление в Т-Банке.`;
    const tgUrl = `https://api.telegram.org/bot${tgBotToken}/sendMessage`;

    fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: messageText })
    }).catch(err => console.error('Ошибка ТГ:', err));

    // === 2. ОТПРАВКА НА EMAIL (через EmailJS с обновленным шаблоном) ===
    const emailjsServiceID = 'service_o11b4ej';
    const emailjsTemplateID = 'template_ysuxfio';

    const templateParams = {
        to_email: 'kovdor24@yandex.ru',
        user_email: emailInput,
        tariff_name: tariffNameText,
        email_subject: `Новая заявка на PRO статус - HeatCalc.ru`,
        subject_text: `Новая заявка на PRO статус - HeatCalc.ru`,
        email_body: `Поступила новая заявка на активацию PRO-статуса.\n\n• Email пользователя: ${emailInput}\n• Выбранный тариф: ${tariffNameText}\n\nПожалуйста, проверьте поступление оплаты в банке.`,
        message_text: `Поступила новая заявка на активацию PRO-статуса.\n\n• Email пользователя: ${emailInput}\n• Выбранный тариф: ${tariffNameText}\n\nПожалуйста, проверьте поступление оплаты в банке.`
    };

    if (typeof emailjs !== 'undefined') {
        emailjs.send(emailjsServiceID, emailjsTemplateID, templateParams)
            .catch(err => console.error('Ошибка EmailJS:', err));
    } else {
        console.warn('Библиотека EmailJS не загружена');
    }

    // === 3. ЗАКРЫТИЕ ВСЕХ ВСПЛЫВАЮЩИХ ОКОН И УВЕДОМЛЕНИЕ ===
    // Закрываем окно оплаты
    closePaymentModal();

    // Закрываем главное окно тарифов (Подписка PRO) через штатный метод и принудительное скрытие
    if (typeof app !== 'undefined' && typeof app.closeModal === 'function') {
        app.closeModal();
    }
    const mainPricingModal = document.getElementById('custom_modal_overlay');
    if (mainPricingModal) {
        mainPricingModal.classList.remove('active');
        mainPricingModal.style.display = 'none';
    }

    // Закрываем окно профиля
    const profileModal = document.getElementById('profile_modal_overlay');
    if (profileModal) {
        profileModal.style.display = 'none';
    }

    // Закрываем окно авторизации
    const authModal = document.getElementById('auth_modal_overlay');
    if (authModal) {
        authModal.style.display = 'none';
    }

    // Закрываем все элементы с классом auth-modal-overlay для полной надежности
    document.querySelectorAll('.auth-modal-overlay').forEach(overlay => {
        overlay.style.display = 'none';
    });

    // Отображаем всплывающее уведомление пользователю
    app.alert('Спасибо! Мы проверяем поступление средств. PRO-статус будет активирован на email: ' + emailInput + ' в ближайшее время.');
}
window.notifyPayment = notifyPayment;
document.addEventListener('DOMContentLoaded', function () { app.init(); });

// Автоматическая генерация мульти-страничного документа перед печатью
window.addEventListener('beforeprint', function () {
    document.body.classList.remove('dark-mode');

    // 1. Создаем или очищаем скрытый контейнер, который увидит только принтер
    let printBin = document.getElementById('print_bin');
    if (!printBin) {
        printBin = document.createElement('div');
        printBin.id = 'print_bin';
        document.body.appendChild(printBin);
    }
    printBin.innerHTML = '';

    // Запоминаем текущее состояние
    let originalMode = app.state.viewMode;
    let printArea = document.getElementById('print-area');

    if (printArea) {
        // --- ШАГ 1: ЛИСТ ОБОРУДОВАНИЯ ---
        app.state.viewMode = 'equipment';
        app.render();
        let eqClone = printArea.cloneNode(true);
        eqClone.id = 'print_eq_clone';
        // Убираем схему и табы
        let eqScheme = eqClone.querySelector('#dynamic_scheme');
        if (eqScheme) eqScheme.remove();
        let eqTabs = eqClone.querySelector('.main-view-tabs');
        if (eqTabs) eqTabs.style.display = 'none';
        printBin.appendChild(eqClone);

        // --- ШАГ 2: ЛИСТ МОНТАЖНЫХ РАБОТ (Если есть PRO или активный триал) ---
        let trialUntil = parseInt(localStorage.getItem('pro_trial_until')) || 0;
        let isTrialActive = trialUntil > Date.now();
        let isPro = (app.state.accountType === 'pro' || isTrialActive || (app.state.tgUser && ['pro', 'admin'].includes(app.state.tgUser.account_type)));
        if (isPro) {
            app.state.viewMode = 'works';
            app.render();
            let worksClone = printArea.cloneNode(true);
            worksClone.id = 'print_works_clone';
            worksClone.classList.add('print-page-break'); // Разрыв страницы
            let worksScheme = worksClone.querySelector('#dynamic_scheme');
            if (worksScheme) worksScheme.remove();
            let wTabs = worksClone.querySelector('.main-view-tabs');
            if (wTabs) wTabs.style.display = 'none';

            // === ВЫРЕЗАЕМ ЛИШНИЕ КОЛОНКИ ДЛЯ ЭКОНОМИИ МЕСТА ===
            worksClone.querySelectorAll('table').forEach(table => {
                let headers = table.querySelectorAll('thead th');
                let hideIdx = [];
                // Ищем индексы ненужных колонок
                headers.forEach((th, idx) => {
                    let txt = th.innerText.trim().toUpperCase();
                    if (txt === 'БРЕНД' || txt === 'АРТИКУЛ' || txt === 'ФОТО') {
                        hideIdx.push(idx);
                    }
                });
                // Скрываем эти ячейки во всех строках
                if (hideIdx.length > 0) {
                    table.querySelectorAll('tr').forEach(row => {
                        let cells = row.children;
                        hideIdx.forEach(idx => {
                            if (cells[idx]) cells[idx].style.display = 'none';
                        });
                    });
                }
            });
            // ==================================================

            printBin.appendChild(worksClone);
        }

        // --- ШАГ 3: СХЕМА (На отдельном листе) ---
        if (app.state.showScheme) {
            app.state.viewMode = 'equipment'; // Схема генерится только на этой вкладке
            app.render();
            let currentScheme = document.getElementById('dynamic_scheme');
            if (currentScheme) {
                let schemeClone = currentScheme.cloneNode(true);
                printBin.appendChild(schemeClone);
            }
        }

        // --- ШАГ 4: ПРЯЧЕМ ОРИГИНАЛ ОТ ПРИНТЕРА ---
        printArea.classList.add('hide-original-for-print');
        let liveScheme = document.getElementById('dynamic_scheme');
        if (liveScheme) liveScheme.classList.add('hide-original-for-print');

        // Возвращаем интерфейс в исходное состояние
        app.state.viewMode = originalMode;
        app.render();
    }
});

// Возврат к нормальной жизни после закрытия окна печати
window.addEventListener('afterprint', function () {
    if (app && app.state && app.state.darkMode) {
        document.body.classList.add('dark-mode');
    }

    // Возвращаем видимость оригинальному интерфейсу
    let printArea = document.getElementById('print-area');
    let liveScheme = document.getElementById('dynamic_scheme');
    if (printArea) printArea.classList.remove('hide-original-for-print');
    if (liveScheme) liveScheme.classList.remove('hide-original-for-print');

    // Очищаем корзину печати
    let printBin = document.getElementById('print_bin');
    if (printBin) printBin.innerHTML = '';
});

// Датчик прокрутки для сужения шапки
window.addEventListener('scroll', function () {
    let header = document.querySelector('.site-header');
    if (header) {
        // Если прокрутили больше чем на 40 пикселей - включаем режим "узкой шапки"
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});