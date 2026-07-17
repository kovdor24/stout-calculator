-- ============================================================================
--  ГЕЙМИФИКАЦИЯ + МЕСЯЧНЫЙ РЕЙТИНГ (в стиле Duolingo) + СОЦИАЛЬНЫЕ РЕАКЦИИ
-- ============================================================================
-- Лёгкая система очков (XP), значков-достижений (Apple Fitness style на фронте),
-- регионального рейтинга с ежемесячным обнулением и «Лидером месяца», ленты
-- активности с реакциями 🔥 и трёх призовых номинаций.
--
-- Стек проекта — Supabase/Postgres, а не ORM. Поэтому «контроллеры» из ТЗ здесь
-- реализованы как SECURITY DEFINER-функции, вызываемые с фронта через
-- supabaseClient.rpc(...). Начисление очков и разблокировка значков идут ТОЛЬКО
-- через эти функции (клиент не пишет xp напрямую) — это защищает счётчики от
-- накрутки прямыми update'ами, суммы за действие фиксированы на сервере.
--
-- «invoices» из ТЗ в этом проекте — это связка estimates + invoice_events
-- (журнал событий: calculated/saved/sent/printed/invoice_requested/confirmed).
-- Поэтому статус Draft/Requested/Complet-Paid добавляем колонкой на estimates и
-- синхронизируем его триггером с журналом invoice_events (см. блок 7).
--
-- Выполнить ВЕСЬ файл целиком за один раз в Supabase SQL Editor (нет CLI/service
-- role key в этом окружении). Блок pg_cron внизу требует расширения pg_cron —
-- если оно не включено, включите его в Dashboard → Database → Extensions или
-- строкой `create extension if not exists pg_cron;` (нужны права суперпользователя).
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────
-- 0. Хелперы идентификации
-- ─────────────────────────────────────────────────────────────────────────

-- Текущий пользователь приложения (public.users.id) по auth.uid(). Отдельная
-- функция, чтобы не дублировать джойн в каждой политике/функции ниже.
create or replace function public.grm_current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select u.id from public.users u where u.auth_user_id = auth.uid() limit 1;
$$;

-- Список админов — тот же, что захардкожен в app.js и в других миграциях.
-- Если поменяется там — поменять и здесь (public.is_admin() уже есть в
-- 20260714_add_role_based_rls_support.sql, переиспользуем её где можно).


-- ─────────────────────────────────────────────────────────────────────────
-- 1. Расширение users: очки текущего месяца и суммарные
--    (region уже добавлен в 20260707_add_registration_profile_fields.sql)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.users
    add column if not exists xp_points_current_month integer not null default 0,
    add column if not exists xp_points_total          integer not null default 0;

-- Рейтинг строится по (region, xp_points_current_month) — индекс под выборку топа
create index if not exists users_region_month_xp_idx
    on public.users (region, xp_points_current_month desc);


-- ─────────────────────────────────────────────────────────────────────────
-- 2. Каталог достижений (achievements) и разблокированные значки (user_achievements)
-- ─────────────────────────────────────────────────────────────────────────
-- Каталог статичен и одинаков для всех — slug'и совпадают с ключами SVG на фронте.
create table if not exists public.achievements (
    id           text primary key,               -- slug: 'first_pdf', 'sales_master', ...
    title        text not null,                  -- «Первый чертёж»
    description  text,                            -- условие получения (для тултипа)
    category     text not null,                  -- 'streak' | 'settings' | 'business'
    metric       text,                            -- 'pdf' | 'invoice' | 'share' | 'streak' | 'manual' | null
    threshold    integer not null default 1,      -- сколько нужно (1/10/50, дней стрика…)
    xp_reward    integer not null default 50,     -- +XP за разблокировку
    sort_order   integer not null default 0,
    is_active    boolean not null default true,
    created_at   timestamptz not null default now()
);

-- Персональные разблокировки. Для «Лидер месяца [Месяц Год]» — динамический title
-- на строку (в каталоге такого фиксированного значка нет), поэтому храним и label,
-- и период; achievement_id для таких строк = 'leader_of_month'.
create table if not exists public.user_achievements (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references public.users(id) on delete cascade,
    achievement_id text not null references public.achievements(id) on delete cascade,
    label          text,                          -- переопределение названия (для «Лидер месяца …»)
    period         date,                          -- для месячных значков — первый день месяца-победы
    unlocked_at    timestamptz not null default now(),
    -- Один и тот же обычный значок нельзя получить дважды (period = NULL). Для
    -- leader_of_month уникальность даёт период. NULLS NOT DISTINCT (PG15+) нужен,
    -- чтобы два NULL-периода считались равными — иначе ON CONFLICT в grm_unlock
    -- не сработает и +50 XP начислялись бы повторно.
    unique nulls not distinct (user_id, achievement_id, period)
);

create index if not exists user_achievements_user_idx
    on public.user_achievements (user_id, unlocked_at desc);


-- ─────────────────────────────────────────────────────────────────────────
-- 3. История месячных рейтингов (снимок топа прошлых месяцев по регионам)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.monthly_leaderboard_history (
    id          uuid primary key default gen_random_uuid(),
    period      date not null,                    -- первый день завершившегося месяца
    region      text not null,
    user_id     uuid references public.users(id) on delete set null,
    user_name   text,                             -- денормализация: имя на момент снимка
    rank        integer not null,                 -- 1..N внутри региона
    xp_points   integer not null,                 -- очки, с которыми закрыли месяц
    created_at  timestamptz not null default now(),
    unique (period, region, rank)
);

create index if not exists mlh_period_region_idx
    on public.monthly_leaderboard_history (period, region, rank);


-- ─────────────────────────────────────────────────────────────────────────
-- 4. Лента активности (activity_feed) и реакции (feed_reactions)
-- ─────────────────────────────────────────────────────────────────────────
-- В ленту попадают события «получил значок» и «стал лидером месяца». Регион
-- денормализуем, чтобы фильтровать ленту по региону без джойна на users.
create table if not exists public.activity_feed (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid references public.users(id) on delete cascade,
    user_name      text,
    region         text,
    type           text not null,                 -- 'badge_earned' | 'leader_of_month'
    achievement_id text,                           -- какой значок (если применимо)
    title          text,                           -- готовая подпись для ленты
    reaction_count integer not null default 0,     -- денормализованный счётчик 🔥 (ведёт триггер)
    created_at     timestamptz not null default now()
);

create index if not exists activity_feed_region_idx
    on public.activity_feed (region, created_at desc);

create table if not exists public.feed_reactions (
    id         uuid primary key default gen_random_uuid(),
    feed_id    uuid not null references public.activity_feed(id) on delete cascade,
    user_id    uuid not null references public.users(id) on delete cascade,
    emoji      text not null default '🔥',
    created_at timestamptz not null default now(),
    -- один пользователь = одна реакция данного типа на запись (повторный тап = снять)
    unique (feed_id, user_id, emoji)
);

create index if not exists feed_reactions_feed_idx
    on public.feed_reactions (feed_id);


-- ─────────────────────────────────────────────────────────────────────────
-- 5. Журнал начислений XP (xp_ledger) — аудит + база для призовой номинации
--    «PDF + ссылки», и для точечного отката при сбросе месяца.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.xp_ledger (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references public.users(id) on delete cascade,
    region     text,
    action     text not null,                     -- 'pdf' | 'share' | 'invoice' | 'badge' | 'reaction'
    amount     integer not null,
    ref_id     text,                              -- ссылка на источник (achievement_id, feed_id, calc_id)
    period     date not null default date_trunc('month', now())::date,
    created_at timestamptz not null default now()
);

create index if not exists xp_ledger_user_period_idx
    on public.xp_ledger (user_id, period);
create index if not exists xp_ledger_region_action_period_idx
    on public.xp_ledger (region, action, period);


-- ─────────────────────────────────────────────────────────────────────────
-- 6. Тикеты обратной связи (feedback_tickets) со статусом Pending/Useful/Rejected
--    Номинация «Топ-3 по полезным отзывам» считается по status='useful'.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.feedback_tickets (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid references public.users(id) on delete set null,
    user_name  text,
    region     text,
    message    text not null,
    status     text not null default 'pending'
               check (status in ('pending', 'useful', 'rejected')),
    created_at timestamptz not null default now(),
    reviewed_at timestamptz
);

create index if not exists feedback_tickets_status_idx
    on public.feedback_tickets (status, created_at desc);


-- ─────────────────────────────────────────────────────────────────────────
-- 7. Статус «инвойса» на estimates: Draft / Requested / Completed(Paid)
--    и его авто-синхронизация с журналом invoice_events.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.estimates
    add column if not exists status text not null default 'draft'
        check (status in ('draft', 'requested', 'completed')),
    -- момент перехода в 'completed' — по нему считается месячная призовая номинация
    -- (в estimates нет updated_at, поэтому ведём отдельную отметку времени)
    add column if not exists completed_at timestamptz;

-- Когда в invoice_events прилетает событие, поднимаем статус связанной сметы.
-- invoice_events.calc_id — это строковый calc_id, лежащий внутри estimates.calc_data->>'calc_id'.
create or replace function public.grm_sync_estimate_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_new_status text;
begin
    v_new_status := case new.event
        when 'invoice_requested' then 'requested'
        when 'confirmed'         then 'completed'
        else null
    end;

    if v_new_status is not null then
        update public.estimates e
           set status = v_new_status,
               completed_at = case when v_new_status = 'completed' then now() else e.completed_at end
         where e.calc_data->>'calc_id' = new.calc_id
           -- не понижаем статус: completed остаётся completed
           and (v_new_status = 'completed' or e.status = 'draft');
    end if;

    return new;
end;
$$;

drop trigger if exists trg_sync_estimate_status on public.invoice_events;
create trigger trg_sync_estimate_status
    after insert on public.invoice_events
    for each row execute function public.grm_sync_estimate_status();


-- ============================================================================
--  БЭКЕНД-ЛОГИКА (RPC-функции = «контроллеры»)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Ядро начисления XP. Внутренняя функция, суммы фиксированы на сервере.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.grm_award_xp(
    p_user_id uuid,
    p_action  text,
    p_amount  integer,
    p_ref_id  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_region text;
begin
    if p_user_id is null or coalesce(p_amount, 0) = 0 then
        return;
    end if;

    select region into v_region from public.users where id = p_user_id;

    update public.users
       set xp_points_current_month = xp_points_current_month + p_amount,
           xp_points_total         = xp_points_total + p_amount
     where id = p_user_id;

    insert into public.xp_ledger (user_id, region, action, amount, ref_id)
    values (p_user_id, v_region, p_action, p_amount, p_ref_id);
end;
$$;

-- Публичная точка для действий «PDF / ссылка / запрос счёта». Вызывается с фронта:
--   supabaseClient.rpc('grm_track_action', { p_action: 'pdf', p_ref_id: calcId })
-- Суммы зашиты здесь, клиент их не передаёт → накрутить произвольное число нельзя.
create or replace function public.grm_track_action(
    p_action text,
    p_ref_id text default null
)
returns integer                       -- сколько XP начислено
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid := public.grm_current_user_id();
    v_amount integer;
begin
    if v_uid is null then
        raise exception 'not authenticated';
    end if;

    v_amount := case p_action
        when 'pdf'     then 5     -- генерация PDF
        when 'share'   then 10    -- шаринг ссылки
        when 'invoice' then 15    -- запрос счёта
        else 0
    end;

    if v_amount = 0 then
        raise exception 'unknown action %', p_action;
    end if;

    perform public.grm_award_xp(v_uid, p_action, v_amount, p_ref_id);
    return v_amount;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- 9. Разблокировка значка (+50 XP) + запись в ленту активности.
--    Идемпотентна: повторный вызов ничего не начисляет.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.grm_unlock_achievement(p_achievement_id text)
returns boolean                       -- true, если значок разблокирован именно сейчас
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid   uuid := public.grm_current_user_id();
    v_ach   public.achievements%rowtype;
    v_user  public.users%rowtype;
    v_rows  integer := 0;
    v_new   boolean := false;
begin
    if v_uid is null then
        raise exception 'not authenticated';
    end if;

    select * into v_ach from public.achievements where id = p_achievement_id and is_active;
    if not found then
        raise exception 'unknown achievement %', p_achievement_id;
    end if;

    -- Пытаемся вставить; если уже есть — ON CONFLICT промолчит и v_new останется false
    insert into public.user_achievements (user_id, achievement_id)
    values (v_uid, p_achievement_id)
    on conflict (user_id, achievement_id, period) do nothing;

    get diagnostics v_rows = row_count;  -- 1 если реально вставили, 0 если конфликт
    v_new := (v_rows > 0);

    if v_new then
        perform public.grm_award_xp(v_uid, 'badge', v_ach.xp_reward, p_achievement_id);

        select * into v_user from public.users where id = v_uid;
        insert into public.activity_feed (user_id, user_name, region, type, achievement_id, title)
        values (
            v_uid,
            coalesce(nullif(trim(coalesce(v_user.first_name,'') || ' ' || coalesce(v_user.last_name,'')), ''), v_user.email),
            v_user.region,
            'badge_earned',
            p_achievement_id,
            'получил значок «' || v_ach.title || '»'
        );
    end if;

    return v_new;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- 10. Реакции 🔥: постановка/снятие + начисление +1 XP автору записи ленты.
--     Реализовано триггером, чтобы XP автору начислялся при любой вставке реакции.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.grm_on_reaction_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_author uuid;
begin
    -- автор записи ленты получает +1 XP (но не за реакцию на самого себя)
    select user_id into v_author from public.activity_feed where id = new.feed_id;

    update public.activity_feed
       set reaction_count = reaction_count + 1
     where id = new.feed_id;

    if v_author is not null and v_author <> new.user_id then
        perform public.grm_award_xp(v_author, 'reaction', 1, new.feed_id::text);
    end if;

    return new;
end;
$$;

create or replace function public.grm_on_reaction_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.activity_feed
       set reaction_count = greatest(reaction_count - 1, 0)
     where id = old.feed_id;
    -- XP за снятую реакцию не отзываем (проще и не создаёт отрицательных балансов)
    return old;
end;
$$;

drop trigger if exists trg_reaction_insert on public.feed_reactions;
create trigger trg_reaction_insert
    after insert on public.feed_reactions
    for each row execute function public.grm_on_reaction_insert();

drop trigger if exists trg_reaction_delete on public.feed_reactions;
create trigger trg_reaction_delete
    after delete on public.feed_reactions
    for each row execute function public.grm_on_reaction_delete();


-- ─────────────────────────────────────────────────────────────────────────
-- 11. Региональный рейтинг текущего месяца (для Duolingo-плашки на фронте)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.grm_leaderboard(p_region text, p_limit integer default 20)
returns table (
    rank        bigint,
    user_id     uuid,
    user_name   text,
    xp_points   integer,
    is_me       boolean
)
language sql
stable
security definer
set search_path = public
as $$
    select
        row_number() over (order by u.xp_points_current_month desc, u.created_at asc) as rank,
        u.id,
        coalesce(nullif(trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''), u.email) as user_name,
        u.xp_points_current_month,
        (u.id = public.grm_current_user_id()) as is_me
    from public.users u
    where u.region is not null
      and u.region = p_region
      and coalesce(u.is_blocked, false) = false
    order by u.xp_points_current_month desc, u.created_at asc
    limit p_limit;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- 12. Призовые номинации (по три топ-3). Считаем за текущий месяц по региону.
--     A) Топ-3 по оплаченным счетам (estimates.status='completed')
--     B) Топ-3 по полезным отзывам (feedback_tickets.status='useful')
--     C) Топ-3 по (PDF + ссылки) из xp_ledger
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.grm_prize_invoices(p_region text)
returns table (rank bigint, user_id uuid, user_name text, score bigint, is_me boolean)
language sql stable security definer set search_path = public
as $$
    with agg as (
        select e.user_id,
               count(*) as score
        from public.estimates e
        where e.status = 'completed'
          and e.user_id is not null
          and date_trunc('month', coalesce(e.completed_at, now())) = date_trunc('month', now())
        group by e.user_id
    )
    select row_number() over (order by a.score desc) as rank,
           u.id,
           coalesce(nullif(trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''), u.email),
           a.score,
           (u.id = public.grm_current_user_id())
    from agg a
    join public.users u on u.id = a.user_id
    where p_region is null or u.region = p_region
    order by a.score desc
    limit 3;
$$;

create or replace function public.grm_prize_feedback(p_region text)
returns table (rank bigint, user_id uuid, user_name text, score bigint, is_me boolean)
language sql stable security definer set search_path = public
as $$
    with agg as (
        select f.user_id, count(*) as score
        from public.feedback_tickets f
        where f.status = 'useful'
          and f.user_id is not null
          and date_trunc('month', f.created_at) = date_trunc('month', now())
        group by f.user_id
    )
    select row_number() over (order by a.score desc) as rank,
           u.id,
           coalesce(nullif(trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''), u.email),
           a.score,
           (u.id = public.grm_current_user_id())
    from agg a
    join public.users u on u.id = a.user_id
    where p_region is null or u.region = p_region
    order by a.score desc
    limit 3;
$$;

create or replace function public.grm_prize_content(p_region text)
returns table (rank bigint, user_id uuid, user_name text, score bigint, is_me boolean)
language sql stable security definer set search_path = public
as $$
    with agg as (
        select l.user_id, count(*) as score
        from public.xp_ledger l
        where l.action in ('pdf', 'share')
          and l.period = date_trunc('month', now())::date
        group by l.user_id
    )
    select row_number() over (order by a.score desc) as rank,
           u.id,
           coalesce(nullif(trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''), u.email),
           a.score,
           (u.id = public.grm_current_user_id())
    from agg a
    join public.users u on u.id = a.user_id
    where p_region is null or u.region = p_region
    order by a.score desc
    limit 3;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- 13. Ежемесячный «прокат» рейтинга (CRON-логика Duolingo).
--     1-го числа 00:00: снимок топа по регионам → monthly_leaderboard_history,
--     значок «Лидер месяца [Месяц Год]» победителю каждого региона,
--     обнуление xp_points_current_month у всех.
--     Идемпотентна: guard-таблица не даёт прокатать один и тот же месяц дважды.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.grm_rollover_log (
    period     date primary key,      -- завершившийся месяц, который прокатали
    ran_at     timestamptz not null default now()
);

-- Русские названия месяцев для подписи значка «Лидер месяца [Месяц Год]»
create or replace function public.grm_ru_month(p_d date)
returns text language sql immutable as $$
    select (array['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря'])[extract(month from p_d)::int];
$$;

create or replace function public.grm_monthly_rollover()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_period date := (date_trunc('month', now()) - interval '1 month')::date;  -- завершившийся месяц
    v_label  text;
    r        record;
begin
    -- Идемпотентность: если этот месяц уже прокатан — выходим
    if exists (select 1 from public.grm_rollover_log where period = v_period) then
        return;
    end if;

    -- «Лидер месяца [Месяц Год]» — например «Лидер месяца июня 2026»
    v_label := 'Лидер месяца ' || public.grm_ru_month(v_period) || ' ' || extract(year from v_period)::text;

    -- Снимок топ-20 по каждому региону в историю
    insert into public.monthly_leaderboard_history (period, region, user_id, user_name, rank, xp_points)
    select v_period,
           t.region,
           t.id,
           t.user_name,
           t.rank,
           t.xp_points_current_month
    from (
        select u.region,
               u.id,
               coalesce(nullif(trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''), u.email) as user_name,
               u.xp_points_current_month,
               row_number() over (partition by u.region order by u.xp_points_current_month desc, u.created_at asc) as rank
        from public.users u
        where u.region is not null
          and u.xp_points_current_month > 0
    ) t
    where t.rank <= 20;

    -- Значок «Лидер месяца …» победителю (#1) каждого региона
    for r in
        select user_id from public.monthly_leaderboard_history
        where period = v_period and rank = 1 and user_id is not null
    loop
        insert into public.user_achievements (user_id, achievement_id, label, period)
        values (r.user_id, 'leader_of_month', v_label, v_period)
        on conflict (user_id, achievement_id, period) do nothing;

        -- Событие в ленту активности
        insert into public.activity_feed (user_id, user_name, region, type, achievement_id, title)
        select r.user_id,
               coalesce(nullif(trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''), u.email),
               u.region,
               'leader_of_month',
               'leader_of_month',
               'стал(а) «' || v_label || '» 🏆'
        from public.users u where u.id = r.user_id;
    end loop;

    -- Обнуление гонки текущего месяца у всех
    update public.users set xp_points_current_month = 0 where xp_points_current_month <> 0;

    insert into public.grm_rollover_log (period) values (v_period);
end;
$$;

-- Каталожный значок для «Лидер месяца» (динамический title приходит в user_achievements.label)
insert into public.achievements (id, title, description, category, metric, threshold, xp_reward, sort_order)
values ('leader_of_month', 'Лидер месяца', 'Первое место в региональном рейтинге по итогам месяца', 'prestige', 'leader', 1, 0, 999)
on conflict (id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────
-- 14. Планировщик pg_cron. Функция идемпотентна, поэтому вешаем её на КАЖДЫЙ
--     день в 00:05 — реально что-то делает только когда наступил новый месяц
--     (guard grm_rollover_log). Так прокат не потеряется, даже если инстанс
--     спал ровно 1-го числа в 00:00.
--     ВНИМАНИЕ: pg_cron работает во времени сервера БД (обычно UTC). Для Москвы
--     (UTC+3) 00:05 UTC ≈ 03:05 МСК — итоги месяца подведутся ранним утром 1-го.
--     Если нужна ровно полночь МСК — задайте `cron.timezone`='Europe/Moscow'.
-- ─────────────────────────────────────────────────────────────────────────
-- create extension if not exists pg_cron;   -- раскомментировать, если ещё не включено

do $$
begin
    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        -- снять прежнее расписание (если было), затем создать заново — идемпотентно
        if exists (select 1 from cron.job where jobname = 'grm_monthly_rollover') then
            perform cron.unschedule('grm_monthly_rollover');
        end if;

        perform cron.schedule('grm_monthly_rollover', '5 0 * * *', 'select public.grm_monthly_rollover();');
    else
        raise notice 'pg_cron не установлен — задача не создана. Включите расширение и повторите блок 14.';
    end if;
end;
$$;


-- ============================================================================
--  RLS-ПОЛИТИКИ
-- ============================================================================
-- Общий принцип: читать рейтинг/ленту/значки можно всем авторизованным (это
-- публичная соц-механика), писать — только через SECURITY DEFINER-функции выше
-- (у них права владельца, RLS их не ограничивает). Прямой insert клиентом
-- разрешаем лишь там, где это безопасно: реакции 🔥 и отправка своего отзыва.

-- achievements: каталог читают все, меняет только админ
alter table public.achievements enable row level security;
drop policy if exists achievements_read on public.achievements;
create policy achievements_read on public.achievements for select using (true);
drop policy if exists achievements_admin_write on public.achievements;
create policy achievements_admin_write on public.achievements for all using (public.is_admin());

-- user_achievements: свои значки видит владелец, чужие — тоже (для профиля/ленты);
-- запись только через функции (никаких insert/update-политик клиенту не даём)
alter table public.user_achievements enable row level security;
drop policy if exists user_achievements_read on public.user_achievements;
create policy user_achievements_read on public.user_achievements for select using (true);

-- monthly_leaderboard_history: чтение всем, запись — только функция проката/админ
alter table public.monthly_leaderboard_history enable row level security;
drop policy if exists mlh_read on public.monthly_leaderboard_history;
create policy mlh_read on public.monthly_leaderboard_history for select using (true);
drop policy if exists mlh_admin_write on public.monthly_leaderboard_history;
create policy mlh_admin_write on public.monthly_leaderboard_history for all using (public.is_admin());

-- activity_feed: читают все, пишут только функции (badge/leader) → без insert-политики
alter table public.activity_feed enable row level security;
drop policy if exists activity_feed_read on public.activity_feed;
create policy activity_feed_read on public.activity_feed for select using (true);
drop policy if exists activity_feed_admin_write on public.activity_feed;
create policy activity_feed_admin_write on public.activity_feed for all using (public.is_admin());

-- feed_reactions: читают все; ставить/снимать может только сам пользователь и только
-- от своего имени (счётчик и +1 XP автору ведёт триггер выше)
alter table public.feed_reactions enable row level security;
drop policy if exists feed_reactions_read on public.feed_reactions;
create policy feed_reactions_read on public.feed_reactions for select using (true);
drop policy if exists feed_reactions_insert on public.feed_reactions;
create policy feed_reactions_insert on public.feed_reactions
    for insert with check (user_id = public.grm_current_user_id());
drop policy if exists feed_reactions_delete on public.feed_reactions;
create policy feed_reactions_delete on public.feed_reactions
    for delete using (user_id = public.grm_current_user_id());

-- xp_ledger: свой журнал видит владелец, всё — админ; запись только функциями
alter table public.xp_ledger enable row level security;
drop policy if exists xp_ledger_read on public.xp_ledger;
create policy xp_ledger_read on public.xp_ledger
    for select using (user_id = public.grm_current_user_id() or public.is_admin());

-- feedback_tickets: пользователь видит и создаёт свои; админ видит все и меняет статус
alter table public.feedback_tickets enable row level security;
drop policy if exists feedback_read on public.feedback_tickets;
create policy feedback_read on public.feedback_tickets
    for select using (user_id = public.grm_current_user_id() or public.is_admin());
drop policy if exists feedback_insert on public.feedback_tickets;
create policy feedback_insert on public.feedback_tickets
    for insert with check (user_id = public.grm_current_user_id());
drop policy if exists feedback_admin_update on public.feedback_tickets;
create policy feedback_admin_update on public.feedback_tickets
    for update using (public.is_admin());


-- ============================================================================
--  СИД КАТАЛОГА ЗНАЧКОВ (14 достижений из ТЗ). slug = ключ SVG на фронте.
-- ============================================================================
insert into public.achievements (id, title, description, category, metric, threshold, xp_reward, sort_order) values
    -- Стрики
    ('pressure_test', 'Опрессовка пройдена', '3 дня активности подряд',              'streak',   'streak', 3,  50, 10),
    ('hold_degree',   'Держим градус',       'Активность каждую неделю в течение месяца', 'streak', 'streak', 30, 50, 11),
    ('ups_mode',      'Режим: Бесперебойник','3 месяца идеального стрика',            'streak',   'streak', 90, 50, 12),
    -- Настройки и оптимизация
    ('fine_balance',  'Тонкая балансировка', 'Ручное изменение цены позиции',         'settings', 'manual', 1,  50, 20),
    ('own_fittings',  'Своя арматура',       'Поиск и замена позиции на свою',         'settings', 'manual', 1,  50, 21),
    ('loop_optimizer','Оптимизатор контура', 'Удаление позиции из пресета',            'settings', 'manual', 1,  50, 22),
    -- Бизнес: PDF (1/10/50)
    ('first_pdf',     'Первый чертёж',       'Сгенерирован первый PDF',                'business', 'pdf',     1,  50, 30),
    ('project_bureau','Проектное бюро',      '10 PDF',                                  'business', 'pdf',    10,  50, 31),
    ('chief_engineer','Главный инженер',     '50 PDF',                                  'business', 'pdf',    50,  50, 32),
    -- Бизнес: счета (1/10/50)
    ('system_launch', 'Запуск системы',      'Первый запрос счёта',                    'business', 'invoice', 1,  50, 40),
    ('stable_contractor','Стабильный подрядчик','10 запросов счёта',                   'business', 'invoice',10,  50, 41),
    ('general_partner','Генеральный партнёр','50 запросов счёта',                       'business', 'invoice',50,  50, 42),
    -- Бизнес: ссылки (1/50)
    ('first_contact', 'Первый контакт',      'Первая расшаренная ссылка',              'business', 'share',   1,  50, 50),
    ('sales_master',  'Мастер продаж',       '50 расшаренных ссылок',                  'business', 'share',  50,  50, 51)
on conflict (id) do nothing;


-- ============================================================================
--  REALTIME (лента и рейтинг обновляются вживую на фронте)
-- ============================================================================
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_feed'
    ) then
        alter publication supabase_realtime add table public.activity_feed;
    end if;
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'feed_reactions'
    ) then
        alter publication supabase_realtime add table public.feed_reactions;
    end if;
end;
$$;
