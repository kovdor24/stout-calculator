-- Адреса устройств для пуш-уведомлений (Firebase Cloud Messaging).
--
-- Один пользователь — сколько угодно устройств, поэтому таблица, а не колонка в users.
-- Токен выдаёт сам Firebase на телефоне при первом запуске приложения; он меняется
-- при переустановке и иногда сам по себе, поэтому пишем его при каждом входе через
-- upsert по токену.
--
-- Читает эту таблицу только Edge Function send-push (под сервисным ключом, в обход RLS).
-- Пользователю чужие токены не видны и не нужны: политики ниже разрешают ему трогать
-- только свои строки, а select не разрешают вовсе — приложению не требуется их читать.
--
-- Выполнить вручную в Supabase SQL Editor, весь файл целиком за один раз.

create table if not exists public.push_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    auth_user_id uuid not null,
    token text not null unique,
    platform text not null default 'android',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- Устройство регистрирует само себя: строка обязана быть привязана к текущей сессии,
-- иначе можно было бы подписать чужой аккаунт на свой телефон и читать его уведомления.
create policy push_tokens_insert on public.push_tokens
    for insert with check (auth.uid() = auth_user_id);

-- using (true), а не «только свои строки»: адрес устройства выдаёт Firebase, и при
-- смене пользователя на том же телефоне он остаётся прежним. Если разрешить менять
-- только свою строку, вход второго человека упрётся в права, строка останется на
-- первом — и чужие уведомления продолжат приходить на этот телефон. Это опаснее
-- теоретического риска обратного: with check не даёт записать чужой auth_user_id,
-- то есть строку можно только перевести на себя, зная сам адрес устройства, а он
-- длинный и случайный.
create policy push_tokens_update on public.push_tokens
    for update using (true) with check (auth.uid() = auth_user_id);

-- Удаление нужно при выходе из аккаунта: чужой телефон не должен продолжать
-- получать уведомления после смены пользователя на устройстве.
create policy push_tokens_delete on public.push_tokens
    for delete using (auth.uid() = auth_user_id);
