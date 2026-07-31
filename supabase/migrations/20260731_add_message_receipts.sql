-- Галочки «доставлено / прочитано» у сообщений админа (вкладка «Сообщения» в админке).
-- До этого факт прочтения жил только в localStorage на устройстве монтажника
-- (ключ stout_read_notifications), поэтому админ никак не мог понять, дошло ли письмо.
--
-- Одна строка = «это сообщение доехало до вот этого пользователя». Отдельная таблица,
-- а не колонки в messages, потому что объявление (type = 'broadcast') — одна строка
-- в messages на всех сразу, и статус у каждого получателя свой.
--
-- delivered_at ставится, когда приложение монтажника загрузило сообщение в список
-- уведомлений (fetchNotifications) — то есть человек заходил в калькулятор.
-- read_at ставится, когда он открыл список уведомлений или карточку сообщения.
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).

create table if not exists public.message_receipts (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references public.messages(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    auth_user_id uuid,
    delivered_at timestamptz not null default now(),
    read_at timestamptz,
    unique (message_id, user_id)
);

create index if not exists message_receipts_message_idx
    on public.message_receipts (message_id);

alter table public.message_receipts enable row level security;

-- Читать может сам получатель и админ (тот же список email, что захардкожен в app.js
-- и уже используется в 20260712_add_manager_chat_messages.sql — меняете там, меняйте и здесь).
drop policy if exists message_receipts_select on public.message_receipts;
create policy message_receipts_select on public.message_receipts
    for select using (
        auth.uid() = auth_user_id
        or lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );

-- Отметку о доставке/прочтении ставит только сам получатель и только про себя
drop policy if exists message_receipts_insert on public.message_receipts;
create policy message_receipts_insert on public.message_receipts
    for insert with check (auth.uid() = auth_user_id);

drop policy if exists message_receipts_update on public.message_receipts;
create policy message_receipts_update on public.message_receipts
    for update using (auth.uid() = auth_user_id);

-- Кнопки «Удалить переписку» / «Удалить всё» в админке удаляют строки messages,
-- квитанции уезжают за ними каскадом. Отдельная политика delete для админа нужна
-- на случай ручной чистки таблицы из приложения.
drop policy if exists message_receipts_admin_delete on public.message_receipts;
create policy message_receipts_admin_delete on public.message_receipts
    for delete using (
        lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    );
