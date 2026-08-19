// ============================================================================
//  GRM — общий модуль геймификации (XP, значки, региональный рейтинг, лента).
// ============================================================================
// Используется на двух страницах:
//   1) index.html (калькулятор) — только начисление XP/значков за действия
//      монтажника (генерация PDF, шаринг ссылки, запрос счёта, ручные правки).
//   2) rating/index.html — полная страница «Рейтинг и достижения»
//      (GRM.renderFullInto(root)).
//
// Бэкенд — SECURITY DEFINER функции в Supabase (см. миграцию
// 20260717_add_gamification_system.sql). Модуль только вызывает RPC и читает
// публичные таблицы; сами очки/значки правит сервер (защита от накрутки).
// Требует, чтобы к моменту ВЫЗОВА функций (не обязательно к моменту загрузки
// файла) в глобальной области уже существовал `supabaseClient`.
//
// Всё максимально отказоустойчиво: нет сети/сессии/таблиц — интерфейс просто
// показывает то, что смог загрузить, без необработанных ошибок.
// ============================================================================

const GRM = (function () {

    // Пилот рейтинга/значков запущен только для монтажников Калининградской области —
    // остальные регионы (и неавторизованные пользователи) не должны видеть ни кубок
    // в шапке, ни страницу /rating/. Сервер дублирует эту же проверку (см. миграцию
    // 20260718_restrict_gamification_to_kaliningrad.sql) — здесь только UI-гейт.
    const ELIGIBLE_REGION = 'Калининградская область';

    // Общий выключатель: пилот свёрнут, рейтинг и значки скрыты от всех — включая
    // админов и наблюдателей. Гасит и кубок в шапке, и пункт меню, и виджет баллов
    // под сметой, и саму страницу /rating/ (её гейт спрашивает те же две функции
    // ниже и без доступа уводит на калькулятор). Вернуть всё как было — поставить
    // RATING_ENABLED = true, региональная логика пилота под ним сохранена.
    const RATING_ENABLED = false;
    function isEnabled() { return RATING_ENABLED; }

    function isEligibleRegion(region) {
        if (!RATING_ENABLED) return false;
        return String(region || '').trim().toLowerCase() === ELIGIBLE_REGION.toLowerCase();
    }

    // Админы и наблюдатели видят рейтинг вне зависимости от своего региона (контроль/тест
    // пилота) — тот же список супер-админов и те же роли, что и в app.js (getAdminRole).
    const SUPER_ADMIN_EMAILS = ['kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com'];
    function isPrivilegedUser(user) {
        // Выключатель выше сильнее любых ролей: пока пилот свёрнут, страницы нет и
        // у админа — иначе «скрыто от всех» держалось бы только на честном слове.
        if (!RATING_ENABLED) return false;
        if (!user) return false;
        const email = String(user.email || '').toLowerCase();
        if (email && SUPER_ADMIN_EMAILS.includes(email)) return true;
        return user.account_type === 'admin' || user.account_type === 'viewer';
    }

    // Каталог значков (slug'и совпадают с achievements.id в БД и с SVG ниже).
    // Значки с metric:'payment' разблокируются только сервером (в триггере
    // оплаты) — монтажник не онлайн в момент, когда клиент подтверждает счёт,
    // поэтому обычный клиентский путь (GRM.trackAction) для них не применяется,
    // они нужны здесь только для отображения в сетке и прогресс-бара.
    const BADGES = [
        { id: 'first_payment',    title: 'Первая оплата',        cat: 'Оплата',       metric: 'payment', need: 1,  hint: '1 смета получила статус «оплачено»' },
        { id: 'reliable_installer', title: 'Надёжный монтажник', cat: 'Оплата',       metric: 'payment', need: 5,  hint: '5 оплаченных смет' },
        { id: 'amber_master',     title: 'Янтарный мастер',      cat: 'Оплата',       metric: 'payment', need: 15, hint: '15 оплаченных смет' },
        { id: 'baltic_owner',     title: 'Хозяин Балтики',       cat: 'Оплата',       metric: 'payment', need: 30, hint: '30 оплаченных смет за квартал' },
        { id: 'system_launch',    title: 'Запуск системы',       cat: 'Счета',        metric: 'invoice', need: 1,  hint: 'Первый запрос счёта' },
        { id: 'stable_contractor',title: 'Стабильный подрядчик', cat: 'Счета',        metric: 'invoice', need: 10, hint: '10 запросов счёта' },
        { id: 'general_partner',  title: 'Генеральный подрядчик',cat: 'Счета',        metric: 'invoice', need: 30, hint: '30 запросов счёта' },
        { id: 'first_pdf',        title: 'Первый чертёж',        cat: 'PDF',          metric: 'pdf',     need: 1,  hint: 'Сгенерировать первый PDF' },
        { id: 'project_bureau',   title: 'Проектное бюро',       cat: 'PDF',          metric: 'pdf',     need: 10, hint: '10 сгенерированных PDF' },
        { id: 'chief_engineer',   title: 'Главный инженер',      cat: 'PDF',          metric: 'pdf',     need: 50, hint: '50 сгенерированных PDF' }
    ];

    let _cachedUser = null;      // { id, region, xp_points_current_month, xp_points_total, first_name, last_name, email }
    let _myReactions = {};       // { [feed_id]: true }
    let _toastTimer = null;
    let _onUnlockCb = null;      // вызывается при успешной серверной разблокировке значка
    let _onNeedAuthCb = null;    // вызывается, когда действие требует входа, а пользователь гость

    function onUnlock(cb) { _onUnlockCb = cb; }
    function onNeedAuth(cb) { _onNeedAuthCb = cb; }

    // ─── Локальные накопительные счётчики действий (мгновенная разблокировка
    // значков без ожидания round-trip к БД + работа офлайн). Дублируются на
    // сервере в xp_ledger. Общие для всех страниц (localStorage одного домена).
    function loadCounts() {
        let c = null;
        try { c = JSON.parse(localStorage.getItem('grm_counts') || 'null'); } catch (e) { c = null; }
        c = c || {};
        return {
            pdf: c.pdf || 0,
            share: c.share || 0,
            invoice: c.invoice || 0,
            manual: c.manual || {},
            days: Array.isArray(c.days) ? c.days : [],  // строки-даты активности 'YYYY-MM-DD'
            streak: c.streak || 0
        };
    }
    function saveCounts(c) {
        try { localStorage.setItem('grm_counts', JSON.stringify(c)); } catch (e) { /* quota */ }
    }

    // Отметить сегодняшний день активным и пересчитать текущую серию (подряд идущих дней).
    function touchStreak(c) {
        const today = new Date().toISOString().slice(0, 10);
        if (c.days[c.days.length - 1] === today) return c.streak;
        c.days.push(today);
        if (c.days.length > 400) c.days = c.days.slice(-400);
        let streak = 1;
        for (let i = c.days.length - 2; i >= 0; i--) {
            const prev = new Date(c.days[i + 1]); prev.setDate(prev.getDate() - 1);
            if (c.days[i] === prev.toISOString().slice(0, 10)) streak++; else break;
        }
        c.streak = streak;
        return streak;
    }

    // Единая точка начисления XP за действие. Вызывает серверный RPC (суммы зашиты
    // на сервере), обновляет локальные счётчики и разблокирует пороговые значки.
    // Действия: 'pdf'(+5) | 'share'(+10) | 'invoice'(+15). Не блокирует основной поток.
    // Для гостя RPC просто вернёт ошибку 'not authenticated' — молча логируется,
    // локальный прогресс-счётчик всё равно копится (пригодится, если войдёт позже).
    function trackAction(action, refId) {
        try {
            const c = loadCounts();
            if (c[action] !== undefined) c[action] += 1;
            touchStreak(c);
            saveCounts(c);

            BADGES.filter(b => b.metric === action).forEach(b => {
                if (c[action] >= b.need) unlock(b.id);
            });
            BADGES.filter(b => b.metric === 'streak').forEach(b => {
                if (c.streak >= b.need) unlock(b.id);
            });

            if (typeof supabaseClient !== 'undefined') {
                supabaseClient.rpc('grm_track_action', { p_action: action, p_ref_id: refId ? String(refId) : null })
                    .then(({ error }) => { if (error) console.warn('[GRM.trackAction] RPC error:', error.message); });
            }
        } catch (e) {
            console.warn('[GRM.trackAction] Исключение:', e);
        }
    }

    // Разблокировка «ручного» значка (изменение цены / замена / удаление позиции).
    function unlockManual(badgeId) {
        try {
            const c = loadCounts();
            if (c.manual[badgeId]) return;   // уже засчитан локально — не дёргаем сеть
            c.manual[badgeId] = 1;
            saveCounts(c);
            unlock(badgeId);
        } catch (e) { console.warn('[GRM.unlockManual]', e); }
    }

    // Идемпотентный вызов серверной разблокировки значка (+50 XP один раз, запись в
    // ленту активности). Сервер сам не начислит повторно, поэтому вызывать можно смело.
    function unlock(badgeId) {
        if (typeof supabaseClient === 'undefined') return;
        supabaseClient.rpc('grm_unlock_achievement', { p_achievement_id: badgeId })
            .then(({ data, error }) => {
                if (error) { console.warn('[GRM.unlock] RPC error:', error.message); return; }
                if (data === true) {
                    const b = BADGES.find(x => x.id === badgeId);
                    toast('🏅 Новое достижение: «' + (b ? b.title : badgeId) + '» +50 очков');
                    if (typeof _onUnlockCb === 'function') _onUnlockCb(badgeId);
                }
            });
    }

    // Лёгкий тост о разблокировке — ненавязчивый временный баннер внизу экрана.
    function toast(msg) {
        try {
            let t = document.getElementById('grm_toast');
            if (!t) {
                t = document.createElement('div');
                t.id = 'grm_toast';
                t.className = 'grm-toast';
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.classList.add('show');
            clearTimeout(_toastTimer);
            _toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
        } catch (e) { /* no-op */ }
    }

    // Разрешение внутреннего users.id/региона текущего пользователя (для RPC и выборок).
    // Источник истины — активная Supabase-сессия (auth_user_id); если сессии нет
    // (например, только Telegram-логин без Supabase Auth), пробуем найти пользователя
    // по email, закэшированному калькулятором в localStorage['stout_save'].tgUser.
    async function resolveUser() {
        if (_cachedUser && _cachedUser.id) return _cachedUser;
        const cols = 'id, region, xp_points_current_month, xp_points_total, first_name, last_name, email, account_type';
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                const { data } = await supabaseClient.from('users').select(cols).eq('auth_user_id', session.user.id).maybeSingle();
                if (data) { _cachedUser = data; return _cachedUser; }
            }
        } catch (e) { /* нет сети/сессии */ }
        try {
            const cached = JSON.parse(localStorage.getItem('stout_save') || 'null');
            const email = cached && cached.tgUser && cached.tgUser.email;
            if (email) {
                const { data } = await supabaseClient.from('users').select(cols).eq('email', email).maybeSingle();
                if (data) { _cachedUser = data; return _cachedUser; }
            }
        } catch (e) { /* нет кэша */ }
        return null;
    }

    // Кол-во дней до конца текущего месяца (для плашки «До подведения итогов…»)
    function daysToMonthEnd() {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return Math.max(0, Math.ceil((end - now) / 86400000));
    }

    // Кол-во дней до конца текущего календарного квартала (Q1..Q4, как в Postgres
    // date_trunc('quarter', ...) — те же границы использует grm_leaderboard_quarterly).
    function daysToQuarterEnd() {
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3);
        const end = new Date(now.getFullYear(), (q + 1) * 3, 1);
        return Math.max(0, Math.ceil((end - now) / 86400000));
    }

    // Подпись текущего квартала для вкладки переключателя, например «Июль – Сентябрь 2026»
    function quarterRangeLabel() {
        const MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3);
        const startM = q * 3, endM = startM + 2;
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
        return `${cap(MONTHS[startM])} – ${cap(MONTHS[endM])} ${now.getFullYear()}`;
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    function plural(n, one, few, many) {
        const m10 = n % 10, m100 = n % 100;
        if (m10 === 1 && m100 !== 11) return one;
        if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
        return many;
    }

    async function loadMyReactions(user, feed) {
        const set = {};
        try {
            if (!user || !user.id || !feed.length) return set;
            const ids = feed.map(f => f.id);
            const { data } = await supabaseClient.from('feed_reactions')
                .select('feed_id').eq('user_id', user.id).in('feed_id', ids);
            (data || []).forEach(r => { set[r.feed_id] = true; });
        } catch (e) { /* no-op */ }
        return set;
    }

    // ─── Карточка профиля: XP месяца / всего + титулы «Лидер месяца» ─────────
    function renderProfileCard(user, monthXp, totalXp, leaderTitles) {
        const name = user ? (([user.first_name, user.last_name].filter(Boolean).join(' ')) || user.email || 'Монтажник') : 'Монтажник';
        const titlesHtml = (leaderTitles && leaderTitles.length)
            ? `<div class="grm-titles">${leaderTitles.map(t => `<span class="grm-title-chip">👑 ${esc(t)}</span>`).join('')}</div>`
            : '';
        return `
        <div class="grm-profile-card">
            <div class="grm-profile-top">
                <div class="grm-avatar">${esc((name[0] || 'М').toUpperCase())}</div>
                <div class="grm-profile-name">
                    <div class="grm-name">${esc(name)}</div>
                    ${titlesHtml || '<div class="grm-sub">Копите очки и поднимайтесь в рейтинге региона</div>'}
                </div>
            </div>
            <div class="grm-xp-row">
                <div class="grm-xp-box grm-xp-month">
                    <div class="grm-xp-val">${monthXp}</div>
                    <div class="grm-xp-lbl">Очков за месяц</div>
                </div>
                <div class="grm-xp-box">
                    <div class="grm-xp-val">${totalXp}</div>
                    <div class="grm-xp-lbl">Очков всего</div>
                </div>
            </div>
        </div>`;
    }

    // ─── Duolingo-style региональный рейтинг: месячный / общий (квартальный) ──
    // Пользователей с 0 очков в список не выводим — RPC отдаёт вообще всех
    // зарегистрированных региона (даже тех, кто ещё ничего не сделал), а честный
    // рейтинг должен показывать только тех, кто реально что-то заработал в периоде.
    function buildLbRows(rows, region, emptyText) {
        const medal = ['🥇', '🥈', '🥉'];
        const earned = (rows || []).filter(r => Number(r.xp_points) > 0);
        return earned.length
            ? earned.map(r => {
                const rank = Number(r.rank);
                const top = rank <= 3 ? ` grm-lb-top grm-lb-top${rank}` : '';
                const me = r.is_me ? ' grm-lb-me' : '';
                return `<div class="grm-lb-row${top}${me}">
                    <div class="grm-lb-rank">${rank <= 3 ? medal[rank - 1] : rank}</div>
                    <div class="grm-lb-name">${esc(r.user_name)}${r.is_me ? ' <span class="grm-you">вы</span>' : ''}</div>
                    <div class="grm-lb-xp">${r.xp_points} очк.</div>
                </div>`;
            }).join('')
            : `<div class="grm-empty">${region ? emptyText : 'Укажите регион в профиле, чтобы попасть в рейтинг.'}</div>`;
    }

    function renderLeaderboard(monthRows, quarterRows, region) {
        const monthDays = daysToMonthEnd();
        const monthList = buildLbRows(monthRows, region, 'В вашем регионе пока нет участников — начните гонку первым!');
        const quarterList = buildLbRows(quarterRows, region, 'За этот квартал пока нет участников — станьте первым!');
        const quarterLabel = quarterRangeLabel();

        return `
        <div class="grm-section">
            <div class="grm-section-head">
                <h3>🏁 Рейтинг${region ? ' · ' + esc(region) : ''}</h3>
            </div>
            <div class="grm-lb-tabs">
                <button class="grm-lb-tab active" data-mode="month" onclick="GRM.switchLbMode('month', this)">Месячный рейтинг</button>
                <button class="grm-lb-tab" data-mode="quarter" onclick="GRM.switchLbMode('quarter', this)">Общий рейтинг · ${esc(quarterLabel)}</button>
            </div>
            <div class="grm-countdown" id="grm_lb_countdown">До подведения итогов месяца: <b>${monthDays} ${plural(monthDays, 'день', 'дня', 'дней')}</b></div>
            <div class="grm-lb" id="grm_lb_month">${monthList}</div>
            <div class="grm-lb" id="grm_lb_quarter" style="display:none">${quarterList}</div>
        </div>`;
    }

    // Переключение вкладки рейтинга (месяц/квартал) — данные уже загружены заранее,
    // просто показываем/прячем нужный блок, без повторного похода в БД.
    function switchLbMode(mode, btn) {
        document.querySelectorAll('.grm-lb-tab').forEach(b => b.classList.toggle('active', b === btn));
        const monthEl = document.getElementById('grm_lb_month');
        const quarterEl = document.getElementById('grm_lb_quarter');
        const countdownEl = document.getElementById('grm_lb_countdown');
        if (!monthEl || !quarterEl) return;
        if (mode === 'quarter') {
            monthEl.style.display = 'none';
            quarterEl.style.display = '';
            if (countdownEl) {
                const d = daysToQuarterEnd();
                countdownEl.innerHTML = `До конца квартала: <b>${d} ${plural(d, 'день', 'дня', 'дней')}</b>`;
            }
        } else {
            monthEl.style.display = '';
            quarterEl.style.display = 'none';
            if (countdownEl) {
                const d = daysToMonthEnd();
                countdownEl.innerHTML = `До подведения итогов месяца: <b>${d} ${plural(d, 'день', 'дня', 'дней')}</b>`;
            }
        }
    }

    // ─── Панель призовых номинаций (3 категории, без указания конкретных призов) ─
    function renderPrizePanel(prizes) {
        const cats = [
            { key: 'invoices', icon: '💰', title: 'Оплаченные счета',  unit: 'счетов',  rows: prizes.invoices },
            { key: 'feedback', icon: '💡', title: 'Полезные отзывы',   unit: 'отзывов', rows: prizes.feedback },
            { key: 'content',  icon: '📄', title: 'PDF + Ссылки',       unit: 'действий', rows: prizes.content }
        ];
        const card = (c) => {
            const rows = c.rows || [];
            const mine = rows.find(r => r.is_me);
            const podium = rows.length
                ? rows.map(r => `<div class="grm-prize-row${r.is_me ? ' grm-lb-me' : ''}">
                        <span class="grm-prize-rank">${['🥇', '🥈', '🥉'][Number(r.rank) - 1] || r.rank}</span>
                        <span class="grm-prize-name">${esc(r.user_name)}</span>
                        <span class="grm-prize-score">${r.score}</span>
                    </div>`).join('')
                : '<div class="grm-empty grm-empty-sm">Пока нет данных за месяц</div>';
            const myLine = mine
                ? `<div class="grm-prize-my">Вы: <b>#${mine.rank}</b> · ${mine.score} ${c.unit}</div>`
                : `<div class="grm-prize-my grm-prize-my-out">Вы пока вне топ-3 — есть шанс вырваться вперёд!</div>`;
            return `<div class="grm-prize-card">
                <div class="grm-prize-head">${c.icon} <span>${c.title}</span></div>
                <div class="grm-prize-podium">${podium}</div>
                ${myLine}
            </div>`;
        };
        return `
        <div class="grm-section">
            <div class="grm-section-head"><h3>🎁 Призовые номинации</h3></div>
            <div class="grm-prize-note">Топ-3 монтажника в каждой номинации получат ценные призы!</div>
            <div class="grm-prize-grid">${cats.map(card).join('')}</div>
        </div>`;
    }

    // ─── Сетка достижений (Apple Fitness style медали) ──────────────────────
    function renderBadgesGrid(myBadges, counts, adminPreview) {
        const owned = new Set(myBadges || []);
        const progressFor = (b) => {
            if (b.metric === 'manual') return (counts.manual && counts.manual[b.id]) ? 1 : 0;
            if (b.metric === 'streak') return counts.streak || 0;
            return counts[b.metric] || 0;
        };
        const cells = BADGES.map(b => {
            const unlocked = owned.has(b.id);
            const have = progressFor(b);
            const pct = unlocked ? 100 : Math.min(100, Math.round((have / b.need) * 100));
            const progressBar = (!unlocked && b.need > 1)
                ? `<div class="grm-badge-progress"><div class="grm-badge-progress-bar" style="width:${pct}%"></div></div>
                   <div class="grm-badge-progress-txt">${have} / ${b.need}</div>`
                : '';
            return `<div class="grm-badge${unlocked ? ' grm-badge-on' : ' grm-badge-off'}" title="${esc(b.hint)}">
                <div class="grm-badge-medal">${badgeMedal(b.id, unlocked)}</div>
                <div class="grm-badge-title">${esc(b.title)}</div>
                <div class="grm-badge-hint">${esc(b.hint)}</div>
                ${progressBar}
            </div>`;
        }).join('');
        return `
        <div class="grm-section">
            <div class="grm-section-head"><h3>🏅 Достижения</h3><div class="grm-badge-count">${owned.size} / ${BADGES.length}</div></div>
            <div class="grm-badge-grid${adminPreview ? ' grm-admin-preview' : ''}">${cells}</div>
        </div>`;
    }

    // ─── Лента активности региона с реакциями 🔥 ────────────────────────────
    function renderFeed(feed) {
        const rows = (feed && feed.length)
            ? feed.map(f => {
                const liked = _myReactions && _myReactions[f.id];
                return `<div class="grm-feed-row">
                    <div class="grm-feed-dot">${f.type === 'leader_of_month' ? '👑' : '🏅'}</div>
                    <div class="grm-feed-text"><b>${esc(f.user_name || 'Монтажник')}</b> ${esc(f.title || '')}</div>
                    <button class="grm-fire${liked ? ' grm-fire-on' : ''}" onclick="GRM.react('${f.id}', this)">🔥 <span>${f.reaction_count || 0}</span></button>
                </div>`;
            }).join('')
            : '<div class="grm-empty grm-empty-sm">Пока нет событий — получите значок первым, и он появится в ленте региона.</div>';
        return `
        <div class="grm-section">
            <div class="grm-section-head"><h3>📡 Лента региона</h3></div>
            <div class="grm-feed">${rows}</div>
        </div>`;
    }

    // Поставить/снять реакцию 🔥. Оптимистично обновляет кнопку, синхронизирует с БД.
    async function react(feedId, btn) {
        try {
            if (typeof supabaseClient === 'undefined') return;
            const user = await resolveUser();
            if (!user || !user.id) { if (typeof _onNeedAuthCb === 'function') _onNeedAuthCb(); return; }
            const already = !!_myReactions[feedId];
            const span = btn ? btn.querySelector('span') : null;
            const cur = span ? (parseInt(span.textContent) || 0) : 0;

            if (already) {
                _myReactions[feedId] = false;
                if (btn) { btn.classList.remove('grm-fire-on'); if (span) span.textContent = Math.max(0, cur - 1); }
                await supabaseClient.from('feed_reactions').delete().eq('feed_id', feedId).eq('user_id', user.id).eq('emoji', '🔥');
            } else {
                _myReactions[feedId] = true;
                if (btn) { btn.classList.add('grm-fire-on'); if (span) span.textContent = cur + 1; }
                const { error } = await supabaseClient.from('feed_reactions').insert([{ feed_id: feedId, user_id: user.id, emoji: '🔥' }]);
                if (error && error.code !== '23505') { // 23505 = уже лайкнул, не откатываем
                    _myReactions[feedId] = false;
                    if (btn) { btn.classList.remove('grm-fire-on'); if (span) span.textContent = cur; }
                }
            }
        } catch (e) {
            console.warn('[GRM.react] Ошибка:', e);
        }
    }

    // ─── Растровые медали (заказная арт-графика) ────────────────────────────
    // Часть значков имеет готовые PNG-иконки (img/badges/<id>.png, прозрачный
    // фон, без подписи — подпись рисует .grm-badge-title рядом). Для значков
    // без картинки рендер падает обратно на встроенную SVG-медаль (badgeSvg).
    const BADGE_ART_IDS = new Set([
        'first_payment', 'reliable_installer', 'amber_master', 'baltic_owner',
        'system_launch', 'stable_contractor', 'general_partner', 'first_pdf',
        'project_bureau', 'chief_engineer'
    ]);
    const IMG_BASE = location.pathname.includes('/rating/') ? '../img/badges/' : 'img/badges/';
    // Версия арт-файлов значков. Без неё картинки кэшируются SW/браузером по голому имени
    // файла и могут годами не обновляться, даже когда сам файл на диске уже другой —
    // бампать при каждой замене/переобработке PNG в img/badges/.
    const BADGE_IMG_VER = 5;

    function badgeMedal(id, unlocked) {
        if (BADGE_ART_IDS.has(id)) {
            return `<img class="grm-medal-svg" src="${IMG_BASE}${id}.png?v=${BADGE_IMG_VER}" alt="">`;
        }
        return badgeSvg(id, unlocked);
    }

    // ─── SVG-медали (Apple Fitness style) ───────────────────────────────────
    // Каждая медаль = металлический диск (общая рамка medal()) + уникальный глиф.
    // Заблокированное состояние (блёклое «стекло») делает CSS (.grm-badge-off),
    // тут всегда рисуем цветную версию + мягкое свечение когда unlocked.
    function medal(id, ringA, ringB, glowColor, inner, unlocked) {
        const uid = 'm_' + id;
        return `<svg viewBox="0 0 100 100" class="grm-medal-svg" aria-hidden="true">
  <defs>
    <radialGradient id="${uid}_disc" cx="38%" cy="32%" r="80%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="30%" stop-color="${ringA}"/>
      <stop offset="100%" stop-color="${ringB}"/>
    </radialGradient>
    <linearGradient id="${uid}_ring" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="${ringA}"/>
      <stop offset="100%" stop-color="${ringB}"/>
    </linearGradient>
    <radialGradient id="${uid}_glow" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="${glowColor}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  ${unlocked ? `<circle cx="50" cy="50" r="49" fill="url(#${uid}_glow)"/>` : ''}
  <circle cx="50" cy="50" r="45" fill="url(#${uid}_ring)"/>
  <circle cx="50" cy="50" r="45" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="1.5"/>
  <circle cx="50" cy="50" r="37" fill="url(#${uid}_disc)"/>
  <ellipse cx="42" cy="30" rx="20" ry="10" fill="#ffffff" opacity="0.22"/>
  <g>${inner}</g>
</svg>`;
    }

    function badgeSvg(id, unlocked) {
        const M = (a, b, g, inner) => medal(id, a, b, g, inner, unlocked);
        switch (id) {
            // ── Оплата (высший приоритет номинаций) ──
            case 'first_payment': // Монета/рубль — первая закрытая сделка. Золото, зелёный.
                return M('#fde68a', '#b45309', '#22c55e',
                    `<circle cx="50" cy="50" r="20" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>
                     <text x="50" y="59" font-size="22" font-weight="700" text-anchor="middle" fill="#78350f">₽</text>`);
            case 'reliable_installer': // Рукопожатие с галочкой оплаты. Синий, зелёный.
                return M('#93c5fd', '#1d4ed8', '#22c55e',
                    `<path d="M28 58 h44" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
                     <path d="M32 44 l12 4 6 -2 6 2 12 -4" fill="none" stroke="#e8a87c" stroke-width="7" stroke-linecap="round"/>
                     <path d="M58 40 l5 6 l10 -12" fill="none" stroke="#16a34a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`);
            case 'amber_master': // Янтарный самородок в оправе — региональный символ. Янтарь, золото.
                return M('#fde68a', '#92400e', '#f59e0b',
                    `<path d="M50 28 L66 42 L60 68 L40 68 L34 42 Z" fill="#f59e0b" stroke="#92400e" stroke-width="2" stroke-linejoin="round"/>
                     <path d="M50 28 L58 42 L54 68 L46 68 L42 42 Z" fill="#fcd34d" opacity="0.65"/>`);
            case 'baltic_owner': // Золотая корона с якорем — вершина номинации за оплату. Золото, синий.
                return M('#fde68a', '#78350f', '#fbbf24',
                    `<path d="M30 56 L36 34 L48 48 L50 32 L52 48 L64 34 L70 56 Z" fill="#f59e0b" stroke="#92400e" stroke-width="1.5" stroke-linejoin="round"/>
                     <rect x="30" y="56" width="40" height="7" rx="2" fill="#f59e0b" stroke="#92400e" stroke-width="1"/>
                     <circle cx="50" cy="70" r="6" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>
                     <line x1="50" y1="65" x2="50" y2="76" stroke="#1d4ed8" stroke-width="2.5"/>
                     <line x1="44" y1="73" x2="56" y2="73" stroke="#1d4ed8" stroke-width="2.5"/>`);
            // ── Бизнес: PDF ──
            case 'first_pdf': // Свёрнутый чертёж с синей лентой. Синий, белый.
                return M('#dbeafe', '#60a5fa', '#2563eb',
                    `<rect x="38" y="28" width="24" height="44" rx="4" fill="#f8fafc" stroke="#93c5fd" stroke-width="1.5"/>
                     <line x1="44" y1="36" x2="56" y2="36" stroke="#3b82f6" stroke-width="2"/>
                     <line x1="44" y1="43" x2="56" y2="43" stroke="#93c5fd" stroke-width="2"/>
                     <line x1="44" y1="50" x2="52" y2="50" stroke="#93c5fd" stroke-width="2"/>
                     <rect x="34" y="46" width="6" height="24" rx="3" fill="#e0e7ff"/>
                     <path d="M44 66 l6 8 l6 -8 v-6 h-12 z" fill="#2563eb"/>`);
            case 'project_bureau': // Скрещённые циркуль и угольник. Серебро, синий.
                return M('#e5e7eb', '#94a3b8', '#3b82f6',
                    `<path d="M50 30 L38 66 M50 30 L62 66" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round"/>
                     <circle cx="50" cy="30" r="4" fill="#3b82f6"/>
                     <path d="M34 62 L66 62 L34 46 Z" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linejoin="round"/>`);
            case 'chief_engineer': // Массивная золотая сургучная печать. Золото, оранжевый.
                return M('#fcd34d', '#b45309', '#f97316',
                    `<rect x="40" y="58" width="20" height="14" rx="2" fill="#f8fafc" transform="rotate(-8 50 65)"/>
                     <circle cx="50" cy="48" r="18" fill="#ea580c"/>
                     <circle cx="50" cy="48" r="18" fill="none" stroke="#fdba74" stroke-width="2"/>
                     <path d="M50 38 l3 6 6 1 -4 5 1 6 -6 -3 -6 3 1 -6 -4 -5 6 -1 z" fill="#fde68a"/>`);
            // ── Бизнес: счета ──
            case 'system_launch': // Пламя горелки. Оранжевый, синий градиент.
                return M('#fb923c', '#c2410c', '#f97316',
                    `<rect x="44" y="58" width="12" height="12" rx="2" fill="#334155"/>
                     <path d="M50 26 C58 38 60 44 54 52 C58 48 58 44 58 44 C64 54 58 66 50 66 C42 66 36 56 42 46 C42 50 44 52 46 52 C42 44 46 34 50 26 Z" fill="#f97316"/>
                     <path d="M50 40 C54 46 52 54 48 58 C44 54 44 48 50 40 Z" fill="#60a5fa"/>`);
            case 'stable_contractor': // Коллектор тёплого пола. Сталь, латунь, красный, синий.
                return M('#cbd5e1', '#64748b', '#ef4444',
                    `<rect x="30" y="42" width="40" height="8" rx="4" fill="#dc2626"/>
                     <rect x="30" y="54" width="40" height="8" rx="4" fill="#2563eb"/>
                     <g fill="#e3b448"><rect x="34" y="34" width="4" height="10"/><rect x="44" y="34" width="4" height="10"/><rect x="54" y="34" width="4" height="10"/><rect x="64" y="34" width="4" height="10"/></g>
                     <g fill="#e3b448"><rect x="34" y="60" width="4" height="10"/><rect x="44" y="60" width="4" height="10"/><rect x="54" y="60" width="4" height="10"/><rect x="64" y="60" width="4" height="10"/></g>
                     <rect x="26" y="40" width="6" height="24" rx="2" fill="#94a3b8"/>`);
            case 'general_partner': // Массивный напольный чугунный котёл в золоте. Золото, графит.
                return M('#fcd34d', '#7c6f1e', '#3f3f46',
                    `<rect x="34" y="34" width="32" height="38" rx="4" fill="#27272a" stroke="#facc15" stroke-width="2"/>
                     <rect x="40" y="42" width="20" height="16" rx="2" fill="#f97316"/>
                     <path d="M42 50 q4 -8 8 0 q4 8 8 0" fill="none" stroke="#fde68a" stroke-width="2"/>
                     <rect x="38" y="64" width="24" height="4" fill="#facc15"/>
                     <rect x="44" y="26" width="12" height="8" rx="2" fill="#3f3f46"/>`);
            // ── Престиж ──
            case 'leader_of_month': // Золотой гаечный ключ — приз лидеру месяца. Золото.
                return M('#fde68a', '#b45309', '#fbbf24',
                    `<g transform="rotate(-38 50 50)">
                         <path d="M12 28 h20 v12 h-10 v20 h10 v12 h-20 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.5"/>
                         <rect x="26" y="46" width="40" height="8" rx="3" fill="#fbbf24" stroke="#b45309" stroke-width="1"/>
                         <circle cx="72" cy="50" r="14" fill="#fbbf24" stroke="#b45309" stroke-width="1.5"/>
                         <circle cx="72" cy="50" r="7" fill="#0b0f19"/>
                     </g>`);
            default:
                return M('#cbd5e1', '#64748b', '#94a3b8', `<circle cx="50" cy="50" r="14" fill="#94a3b8"/>`);
        }
    }

    // ─── Композитный рендер целой страницы рейтинга ──────────────────────────
    // rootEl — контейнер, куда пишется вся разметка. opts.loginUrl — куда вести
    // гостя для входа (на странице /rating это ссылка на главный калькулятор).
    async function renderFullInto(rootEl, opts) {
        opts = opts || {};
        if (!rootEl) return;
        rootEl.innerHTML = '<div class="grm-empty">Загрузка рейтинга…</div>';

        const user = await resolveUser();
        if (!user || !user.id) {
            rootEl.innerHTML = `<div class="grm-guest">
                <div class="grm-guest-icon">🏆</div>
                <div class="grm-guest-title">Рейтинг и достижения</div>
                <div class="grm-guest-text">Войдите в аккаунт на главной странице калькулятора, чтобы участвовать в региональном рейтинге, получать значки и очки за свою работу.</div>
                <a class="grm-guest-btn" href="${esc(opts.loginUrl || '../')}">Войти на главной →</a>
            </div>`;
            return;
        }

        const privileged = isPrivilegedUser(user);
        if (!isEligibleRegion(user.region) && !privileged) {
            rootEl.innerHTML = `<div class="grm-guest">
                <div class="grm-guest-icon">📍</div>
                <div class="grm-guest-title">Пока недоступно в вашем регионе</div>
                <div class="grm-guest-text">Рейтинг и достижения сейчас работают в пилотном режиме только для монтажников Калининградской области. Как только программа расширится на другие регионы, здесь появится ваш прогресс.</div>
                <a class="grm-guest-btn" href="${esc(opts.loginUrl || '../')}">← К калькулятору</a>
            </div>`;
            return;
        }

        // Админ/наблюдатель не из Калининграда смотрит пилотный регион для контроля —
        // своего прогресса там у него нет, но именно там сейчас идёт вся активность.
        const region = isEligibleRegion(user.region) ? user.region : (privileged ? ELIGIBLE_REGION : (user.region || null));
        const safe = (p) => p.then(r => r).catch(() => ({ data: null, error: true }));
        let leaderboard = [], leaderboardQuarter = [], prizes = { invoices: [], feedback: [], content: [] }, feed = [], myBadges = [], leaderTitles = [];

        let paidCount = 0;
        try {
            const [lb, lbq, pi, pf, pc, ua, af, pd] = await Promise.all([
                region ? safe(supabaseClient.rpc('grm_leaderboard', { p_region: region, p_limit: 20 })) : Promise.resolve({ data: [] }),
                region ? safe(supabaseClient.rpc('grm_leaderboard_quarterly', { p_region: region, p_limit: 20 })) : Promise.resolve({ data: [] }),
                region ? safe(supabaseClient.rpc('grm_prize_invoices', { p_region: region })) : Promise.resolve({ data: [] }),
                region ? safe(supabaseClient.rpc('grm_prize_feedback', { p_region: region })) : Promise.resolve({ data: [] }),
                region ? safe(supabaseClient.rpc('grm_prize_content', { p_region: region })) : Promise.resolve({ data: [] }),
                safe(supabaseClient.from('user_achievements').select('achievement_id, label, period, unlocked_at').eq('user_id', user.id)),
                region ? safe(supabaseClient.from('activity_feed').select('*').eq('region', region).order('created_at', { ascending: false }).limit(25)) : Promise.resolve({ data: [] }),
                safe(supabaseClient.from('estimates').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'))
            ]);
            leaderboard = lb.data || [];
            leaderboardQuarter = lbq.data || [];
            prizes = { invoices: pi.data || [], feedback: pf.data || [], content: pc.data || [] };
            feed = af.data || [];
            const ub = ua.data || [];
            myBadges = ub.map(r => r.achievement_id);
            leaderTitles = ub.filter(r => r.achievement_id === 'leader_of_month' && r.label).map(r => r.label);
            paidCount = pd.count || 0;
            _myReactions = await loadMyReactions(user, feed);
        } catch (e) {
            console.warn('[GRM.renderFullInto] Ошибка загрузки:', e);
        }

        const counts = loadCounts();
        counts.payment = paidCount;
        const monthXp = user.xp_points_current_month || 0;
        const totalXp = user.xp_points_total || 0;

        rootEl.innerHTML =
            renderProfileCard(user, monthXp, totalXp, leaderTitles) +
            renderLeaderboard(leaderboard, leaderboardQuarter, region) +
            renderPrizePanel(prizes) +
            renderBadgesGrid(myBadges, counts, privileged) +
            renderFeed(feed);
    }

    return {
        BADGES,
        trackAction,
        unlockManual,
        unlock,
        toast,
        resolveUser,
        react,
        renderFullInto,
        onUnlock,
        onNeedAuth,
        isEnabled,
        isEligibleRegion,
        isPrivilegedUser,
        switchLbMode
    };
})();
