-- Кнопка "🗑 Удалить всё" в админке (вкладка "Сообщения и рассылки") ничего не удаляла:
-- supabaseClient.from('messages').delete() отрабатывал без ошибки (клиент видит только
-- anon-ключ, RLS применяется как для обычного пользователя), но RLS молча пропускал
-- 0 строк — Supabase не считает это ошибкой. На клиенте казалось, что удаление прошло,
-- а после обновления страницы все сообщения возвращались на месте.
--
-- Перед выполнением можно посмотреть текущие политики на таблице:
--   select * from pg_policies where tablename = 'messages';
--
-- Выполнить вручную в Supabase SQL Editor.

drop policy if exists messages_admin_delete on public.messages;

-- Тот же список email, что захардкожен в app.js (adminEmails) и уже используется
-- в 20260712_add_manager_chat_messages.sql. Если список поменяют в коде — поменять и здесь.
create policy messages_admin_delete on public.messages
    for delete using (
        lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );
