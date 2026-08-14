// Пуш-уведомления в Android-приложении.
//
// На сайте этот файл ничего не делает: плагина Capacitor в обычном браузере нет,
// isNative() возвращает false, и все методы тихо выходят. Один и тот же код едет
// и на heatcalc.ru, и внутрь APK — отдельной сборки для приложения не требуется.
//
// Отправку выполняет Edge Function send-push. Приложение сообщает ей ТОЛЬКО вид
// события и id строки — ни текста, ни адресата. Кому и что слать, функция выясняет
// сама, перечитывая строку из базы; см. комментарий в её начале.

const appPush = {

    _ready: false,
    _lastToken: null,

    plugin: function () {
        const cap = window.Capacitor;
        return (cap && cap.Plugins && cap.Plugins.PushNotifications) || null;
    },

    isNative: function () {
        const cap = window.Capacitor;
        return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform() && this.plugin());
    },

    // Вызывается из app.init() после того, как известно, кто вошёл.
    init: async function () {
        if (!this.isNative() || this._ready) return;
        const push = this.plugin();

        try {
            // Отдельный канал: без него Android кладёт уведомления в безымянный
            // канал по умолчанию, и пользователь не может настроить их отдельно
            // от всего остального. Идентификатор совпадает с channel_id в send-push.
            if (push.createChannel) {
                await push.createChannel({
                    id: 'heatcalc',
                    name: 'Сообщения и статусы смет',
                    description: 'Ответы клиентов, сообщения менеджера, объявления',
                    importance: 4,
                    visibility: 1
                });
            }

            // На Android 13 и новее разрешение спрашивается явно. Отказ — не ошибка:
            // человек имеет право не хотеть уведомлений, приложение работает и без них.
            let perm = await push.checkPermissions();
            if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
                perm = await push.requestPermissions();
            }
            if (perm.receive !== 'granted') {
                console.log('[push] уведомления не разрешены пользователем');
                return;
            }

            push.addListener('registration', (t) => {
                this._lastToken = t && t.value;
                this.saveToken(this._lastToken);
            });

            push.addListener('registrationError', (err) => {
                // Наружу не показываем: человек ничего не может с этим сделать,
                // а расчёт и смета работают независимо от уведомлений.
                console.warn('[push] не удалось зарегистрировать устройство:', err);
            });

            // Нажатие на уведомление, когда приложение было закрыто или свёрнуто
            push.addListener('pushNotificationActionPerformed', () => {
                this.openFor();
            });

            await push.register();
            this._ready = true;
        } catch (e) {
            console.warn('[push] инициализация не удалась:', e);
        }
    },

    // Куда прыгнуть по нажатию на уведомление.
    //
    // Все три повода — сообщение менеджера, объявление, ответ клиента по смете —
    // сходятся в одном месте: центре сообщений (та же кнопка в шапке). Поэтому
    // разбирать data.open не нужно, достаточно обновить список и открыть его.
    openFor: function () {
        try {
            if (!window.app) return;
            const show = () => { if (typeof app.openMessagesCenter === 'function') app.openMessagesCenter(); };
            if (typeof app.fetchNotifications === 'function') {
                // Уведомление приходит раньше, чем опрос успевает подтянуть строку,
                // — открывать пустой список бессмысленно, сначала обновляем.
                Promise.resolve(app.fetchNotifications()).then(show).catch(show);
            } else {
                show();
            }
        } catch (e) {
            console.warn('[push] не удалось открыть раздел:', e);
        }
    },

    saveToken: async function (token) {
        if (!token || typeof supabaseClient === 'undefined') return;
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session || !session.user) return;

            const { data: uRow } = await supabaseClient
                .from('users').select('id').eq('auth_user_id', session.user.id).maybeSingle();
            if (!uRow) return;

            // onConflict по token: один и тот же телефон при повторном входе должен
            // обновлять свою строку, а не плодить новые — иначе на одно устройство
            // уходило бы по копии уведомления за каждый вход.
            const { error } = await supabaseClient.from('push_tokens').upsert({
                user_id: uRow.id,
                auth_user_id: session.user.id,
                token: token,
                platform: 'android',
                updated_at: new Date().toISOString()
            }, { onConflict: 'token' });

            if (error) console.warn('[push] адрес устройства не сохранён:', error.message);
        } catch (e) {
            console.warn('[push] адрес устройства не сохранён:', e);
        }
    },

    // При выходе из аккаунта: иначе следующий владелец телефона продолжит получать
    // уведомления предыдущего.
    forgetToken: async function () {
        if (!this._lastToken || typeof supabaseClient === 'undefined') return;
        try {
            await supabaseClient.from('push_tokens').delete().eq('token', this._lastToken);
        } catch (e) {
            console.warn('[push] адрес устройства не удалён:', e);
        }
    },

    // Просьба разбудить телефон адресата. Вызывается сразу после того, как строка
    // записана в базу. Ошибку наружу не показываем и не ждём ответа: уведомление —
    // дополнение к сообщению, а не его условие. Не дошло — сообщение всё равно
    // лежит в базе и появится при следующем открытии приложения.
    notify: async function (reason, rowId) {
        if (!rowId || typeof supabaseClient === 'undefined') return;
        try {
            const headers = { 'Content-Type': 'application/json', apikey: supabaseKey };
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.access_token) {
                headers.Authorization = 'Bearer ' + session.access_token;
            }

            // supabaseProxyFetch, а не обычный fetch: у части провайдеров в РФ
            // блокируется *.supabase.co (см. комментарий в начале app.js)
            await supabaseProxyFetch(supabaseUrl + '/functions/v1/send-push', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ reason: reason, id: String(rowId) })
            });
        } catch (e) {
            console.warn('[push] уведомление не отправлено:', e);
        }
    }
};
