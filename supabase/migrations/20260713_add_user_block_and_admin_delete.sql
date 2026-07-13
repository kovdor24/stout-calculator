-- Админка (вкладка "Монтажники и Сметы"): кнопки блокировки/разблокировки доступа и полного
-- удаления учётки. Блокировка — новый флаг is_blocked, проверяется в app.js/handleAuthSession
-- при каждом входе (не даёт войти, данные не трогает). Удаление — реальный DELETE строк
-- в users/estimates/messages/manager_chat_messages из-под анонимного (публикуемого) ключа,
-- поэтому нужны явные RLS-политики для админов — тот же список email, что захардкожен
-- в app.js (adminEmails) и уже используется в 20260712_add_manager_chat_messages.sql.
--
-- Выполнить вручную в Supabase SQL Editor.

alter table public.users add column if not exists is_blocked boolean not null default false;

-- Кто считается админом — переиспользуем в каждой политике ниже
-- lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')

drop policy if exists users_admin_update on public.users;
create policy users_admin_update on public.users
    for update using (
        lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );

drop policy if exists users_admin_delete on public.users;
create policy users_admin_delete on public.users
    for delete using (
        lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );

drop policy if exists estimates_admin_delete on public.estimates;
create policy estimates_admin_delete on public.estimates
    for delete using (
        lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );

-- messages уже получила DELETE-политику для админов в 20260713_fix_messages_admin_delete_policy.sql
-- (messages_admin_delete) — отдельная политика здесь не нужна, deleteUserCompletely
-- удаляет строки messages по sender_id/recipient_id через ту же политику.

drop policy if exists manager_chat_admin_delete on public.manager_chat_messages;
create policy manager_chat_admin_delete on public.manager_chat_messages
    for delete using (
        lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );
