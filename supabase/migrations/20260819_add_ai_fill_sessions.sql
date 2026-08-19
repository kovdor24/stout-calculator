-- Журнал «Умного заполнения параметров»: что монтажник говорил или писал
-- в окно ✨ и что система ему отвечала.
--
-- Зачем. Само заполнение — это набор правил (регулярных выражений) в app.js,
-- parseHouseQuery. Умнее оно становится только тогда, когда видно, какие
-- фразы люди реально произносят и на каких правила спотыкаются. До этой
-- таблицы диалог жил только в открытом окне и исчезал с его закрытием.
--
-- Одна строка — один сеанс: от открытия окна до «Применить» или закрытия.
-- Весь диалог лежит в dialog (jsonb) в порядке реплик:
--   { "t": 12,            -- секунд от начала сеанса
--     "who": "u" | "a",   -- монтажник / система
--     "text": "...",      -- реплика как есть (у системы — без разметки)
--     "src": "voice" | "text" | "voice+edit",  -- только у монтажника:
--                         -- надиктовал, набрал, надиктовал и поправил руками
--     "kind": "parsed" | "none" | "yes" | "no" | "stop" | "delete" | "pro" | "question",
--                         -- что система с этой репликой сделала (см. app.js)
--     "found": [ {"label": "Площадь", "display": "150 м²"}, ... ] }
--                         -- что распознано именно этой репликой
-- Остальные колонки — сводка по тому же диалогу, чтобы фильтровать и
-- считать в админке без разбора json: длительность, число реплик, сколько
-- из них голосом, чем кончилось, сколько фраз не распознано.
--
-- Пишет приложение (logAiFillSession в app.js) в момент закрытия окна.
-- Читает только владелец: вкладка админки «✨ Умное заполнение».
--
-- Выполнить вручную в Supabase SQL Editor, ВЕСЬ файл целиком за один раз.
-- Если редактор ответит «Unexpected eof» — вставка обрезалась, вставить заново.

create table if not exists public.ai_fill_sessions (
    id uuid primary key default gen_random_uuid(),

    -- Кто. auth_user_id — для связи с users; имя и почта дублируются
    -- снимком, чтобы список читался даже если строка users потом изменится.
    auth_user_id uuid,
    user_email text,
    user_name text,

    started_at timestamptz not null,
    ended_at timestamptz not null default now(),
    duration_sec integer not null default 0,

    -- Сколько реплик отправил монтажник и сколько из них голосом
    messages_count integer not null default 0,
    voice_count integer not null default 0,

    -- applied — нажал «Применить», closed — закрыл, ничего не применив
    outcome text not null default 'closed',
    -- Что ушло в расчёт по кнопке «Применить»: [{label, display}]
    applied_fields jsonb not null default '[]'::jsonb,
    -- Сколько реплик система не смогла разобрать (kind = none)
    unrecognized integer not null default 0,

    dialog jsonb not null default '[]'::jsonb,

    created_at timestamptz not null default now()
);

create index if not exists ai_fill_sessions_started_idx
    on public.ai_fill_sessions (started_at desc);
create index if not exists ai_fill_sessions_user_idx
    on public.ai_fill_sessions (auth_user_id, started_at desc);

alter table public.ai_fill_sessions enable row level security;

-- Пишет монтажник о своём сеансе из приложения. Отдельной проверки
-- авторства нет (как и в projects): строка создаётся один раз при закрытии
-- окна и дальше не правится, редактировать или читать чужое нельзя.
drop policy if exists ai_fill_sessions_insert on public.ai_fill_sessions;
create policy ai_fill_sessions_insert on public.ai_fill_sessions
    for insert to authenticated with check (true);

-- Читает только владелец (супер-админ из is_admin()): в диалогах личные
-- фразы людей, наблюдателям и дистрибьюторам они не нужны.
drop policy if exists ai_fill_sessions_select on public.ai_fill_sessions;
create policy ai_fill_sessions_select on public.ai_fill_sessions
    for select using ( public.is_admin() );

drop policy if exists ai_fill_sessions_admin_delete on public.ai_fill_sessions;
create policy ai_fill_sessions_admin_delete on public.ai_fill_sessions
    for delete using ( public.is_admin() );
