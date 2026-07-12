-- Чат монтажник ⇄ менеджер дистрибьютора. Менеджер — обычный зарегистрированный
-- пользователь (users), опознаётся тем, что его email (после регистрации) совпадает
-- с distributors.manager_email. Если менеджер ещё не зарегистрировался — переписка
-- недоступна (это проверяется в приложении при построении вкладки, в БД не ограничено).
-- Один монтажник привязан ровно к одному дистрибьютору (users.distributor_id) → ровно
-- один менеджер, поэтому пара (installer_user_id, manager_user_id) и есть "нить".
-- Админ явно не участвует в переписке (не отправляет и не дублируется), но видит любую
-- нить целиком в карточке монтажника или менеджера в админке — только на чтение.
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз) —
-- команда в самом низу сама включает Realtime для таблицы, отдельно в Dashboard
-- ничего искать не нужно.

create table if not exists public.manager_chat_messages (
    id uuid primary key default gen_random_uuid(),
    installer_user_id uuid not null references public.users(id) on delete cascade,
    installer_auth_user_id uuid not null,
    manager_user_id uuid not null references public.users(id) on delete cascade,
    manager_auth_user_id uuid not null,
    sender_user_id uuid not null references public.users(id),
    sender_name text,
    text text,
    attachments jsonb not null default '[]'::jsonb, -- [{name, mime, size, dataUrl}]
    is_read boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists manager_chat_messages_thread_idx
    on public.manager_chat_messages (installer_user_id, manager_user_id, created_at);

create index if not exists manager_chat_messages_manager_idx
    on public.manager_chat_messages (manager_user_id, created_at);

create index if not exists manager_chat_messages_unread_idx
    on public.manager_chat_messages (installer_user_id, manager_user_id, is_read)
    where is_read = false;

alter table public.manager_chat_messages enable row level security;

-- Админы определяются по email из JWT — тот же список, что захардкожен в app.js
-- (kovdorekb@gmail.com, kovdor24@yandex.ru, dima24ba@gmail.com). Если список поменяют
-- в коде, не забыть поменять и здесь. Админ — только select, без insert/update.
create policy manager_chat_select on public.manager_chat_messages
    for select using (
        auth.uid() in (installer_auth_user_id, manager_auth_user_id)
        or lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );

-- Писать может только сам монтажник или сам менеджер этой нити, и только от своего имени
-- (sender_user_id обязан быть одной из двух сторон нити — не даёт подделать автора).
create policy manager_chat_insert on public.manager_chat_messages
    for insert with check (
        auth.uid() in (installer_auth_user_id, manager_auth_user_id)
        and sender_user_id in (installer_user_id, manager_user_id)
    );

-- Update нужен только для проставления is_read/read_at той стороной, которая читает
create policy manager_chat_update on public.manager_chat_messages
    for update using (
        auth.uid() in (installer_auth_user_id, manager_auth_user_id)
    );

-- Включаем Realtime для таблицы — то же самое действие, что переключатель
-- "Enable Realtime" в Dashboard → Database → Publications, просто через SQL
alter publication supabase_realtime add table public.manager_chat_messages;
