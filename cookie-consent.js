(function() {
    // 1. Define Yandex.Metrika Initialization Function
    window.initMetrika = function() {
        if (window.ymInitialized) return;
        window.ymInitialized = true;

        (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=109490947', 'ym');

        ym(109490947, 'init', {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
        });
    };

    // 2. Check if Consent is already given
    if (localStorage.getItem('cookieConsent') === 'accepted') {
        window.initMetrika();
        return;
    }

    // 3. If not, create and inject the Cookie Consent Banner
    window.addEventListener('DOMContentLoaded', function() {
        // Double-check just in case DOM loaded after storage check
        if (localStorage.getItem('cookieConsent') === 'accepted') {
            window.initMetrika();
            return;
        }

        // Create style element for the banner
        var style = document.createElement('style');
        style.textContent = `
            .hc-cookie-banner {
                position: fixed;
                bottom: 24px;
                right: 24px;
                left: 24px;
                max-width: 420px;
                background: rgba(17, 24, 39, 0.95);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
                color: #F3F4F6;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                font-size: 13px;
                line-height: 1.5;
                z-index: 100000;
                transform: translateY(40px) scale(0.95);
                opacity: 0;
                pointer-events: none;
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
            }
            .hc-cookie-banner.show {
                transform: translateY(0) scale(1);
                opacity: 1;
                pointer-events: auto;
            }
            .hc-cookie-title {
                font-weight: 700;
                font-size: 15px;
                color: #FFFFFF;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .hc-cookie-text {
                color: #9CA3AF;
                margin-bottom: 16px;
            }
            .hc-cookie-text a {
                color: #3B82F6;
                text-decoration: none;
                font-weight: 500;
                border-bottom: 1px dashed rgba(59, 130, 246, 0.4);
                transition: border-color 0.2s, color 0.2s;
            }
            .hc-cookie-text a:hover {
                color: #60A5FA;
                border-bottom-color: #60A5FA;
            }
            .hc-cookie-buttons {
                display: flex;
                gap: 10px;
            }
            .hc-cookie-btn {
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                border: none;
                transition: all 0.2s ease;
                flex: 1;
                text-align: center;
            }
            .hc-cookie-btn-accept {
                background: #3B82F6;
                color: #FFFFFF;
                box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
            }
            .hc-cookie-btn-accept:hover {
                background: #2563EB;
                transform: translateY(-1px);
                box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.3);
            }
            .hc-cookie-btn-accept:active {
                transform: translateY(0);
            }
            .hc-cookie-btn-decline {
                background: rgba(255, 255, 255, 0.08);
                color: #D1D5DB;
            }
            .hc-cookie-btn-decline:hover {
                background: rgba(255, 255, 255, 0.12);
                color: #FFFFFF;
            }
            @media (max-width: 640px) {
                .hc-cookie-banner {
                    bottom: 16px;
                    right: 16px;
                    left: 16px;
                    max-width: none;
                    padding: 16px;
                }
            }
        `;
        document.head.appendChild(style);

        // Create banner element
        var banner = document.createElement('div');
        banner.className = 'hc-cookie-banner';
        banner.innerHTML = `
            <div class="hc-cookie-title">
                <span>🍪</span> Использование файлов Cookie & Аналитика
            </div>
            <div class="hc-cookie-text">
                Мы используем файлы cookie и аналитический сервис Яндекс.Метрика для улучшения работы сайта и сбора статистики. Подробнее в нашей <a href="privacy-policy.html" target="_blank">Политике конфиденциальности</a>.
            </div>
            <div class="hc-cookie-buttons">
                <button class="hc-cookie-btn hc-cookie-btn-accept" id="hc-cookie-accept">Принять</button>
                <button class="hc-cookie-btn hc-cookie-btn-decline" id="hc-cookie-decline">Отклонить</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Trigger slide-in animation
        setTimeout(function() {
            banner.classList.add('show');
        }, 1000);

        // Bind Accept Event
        document.getElementById('hc-cookie-accept').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.classList.remove('show');
            setTimeout(function() {
                banner.remove();
            }, 400);
            window.initMetrika();
        });

        // Bind Decline Event
        document.getElementById('hc-cookie-decline').addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'declined');
            banner.classList.remove('show');
            setTimeout(function() {
                banner.remove();
            }, 400);
        });
    });
})();
