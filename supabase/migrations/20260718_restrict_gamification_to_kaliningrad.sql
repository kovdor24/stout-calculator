-- ============================================================================
--  ГЕЙМИФИКАЦИЯ: ограничение пилота Калининградской областью + требование входа
-- ============================================================================
-- Пилот рейтинга/значков запускается только для монтажников Калининградской
-- области. Остальные регионы не должны ни видеть кубок/страницу рейтинга на
-- фронте (это уже сделано в gamification.js/app.js), ни получать XP/значки,
-- ни читать данные рейтинга — даже если кто-то вызовет RPC напрямую в обход UI.
--
-- Выполнить вручную в Supabase SQL Editor ПОСЛЕ 20260717_add_gamification_system.sql,
-- целиком за один раз.
-- ============================================================================


-- 1. Регион-хелпер — единая точка, если список регионов-участников расширится позже.
create or replace function public.grm_is_eligible_region(p_region text)
returns boolean
language sql
immutable
as $$
    select lower(trim(coalesce(p_region, ''))) = lower('Калининградская область');
$$;


-- 2. Начисление XP за действие (PDF/ссылка/счёт) — тихий no-op для неавторизованных
--    и для регионов вне пилота (не считаем это ошибкой клиента, просто 0 XP).
create or replace function public.grm_track_action(
    p_action text,
    p_ref_id text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid := public.grm_current_user_id();
    v_region text;
    v_amount integer;
begin
    if v_uid is null then
        return 0;
    end if;

    select region into v_region from public.users where id = v_uid;
    if not public.grm_is_eligible_region(v_region) then
        return 0;
    end if;

    v_amount := case p_action
        when 'pdf'     then 5
        when 'share'   then 10
        when 'invoice' then 15
        else 0
    end;

    if v_amount = 0 then
        return 0;
    end if;

    perform public.grm_award_xp(v_uid, p_action, v_amount, p_ref_id);
    return v_amount;
end;
$$;


-- 3. Разблокировка значка (+50 XP) — та же защита по региону/авторизации.
create or replace function public.grm_unlock_achievement(p_achievement_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid := public.grm_current_user_id();
    v_region text;
    v_ach    public.achievements%rowtype;
    v_user   public.users%rowtype;
    v_rows   integer := 0;
    v_new    boolean := false;
begin
    if v_uid is null then
        return false;
    end if;

    select region into v_region from public.users where id = v_uid;
    if not public.grm_is_eligible_region(v_region) then
        return false;
    end if;

    select * into v_ach from public.achievements where id = p_achievement_id and is_active;
    if not found then
        raise exception 'unknown achievement %', p_achievement_id;
    end if;

    insert into public.user_achievements (user_id, achievement_id)
    values (v_uid, p_achievement_id)
    on conflict (user_id, achievement_id, period) do nothing;

    get diagnostics v_rows = row_count;
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


-- 4. Чтение рейтинга/призов — требует авторизации И региона-участника, независимо
--    от того, что передал вызывающий в p_region (защита от прямого вызова RPC
--    в обход UI неавторизованным или "чужим" пользователем).
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
    where public.grm_current_user_id() is not null
      and public.grm_is_eligible_region(p_region)
      and u.region is not null
      and u.region = p_region
      and coalesce(u.is_blocked, false) = false
    order by u.xp_points_current_month desc, u.created_at asc
    limit p_limit;
$$;

create or replace function public.grm_prize_invoices(p_region text)
returns table (rank bigint, user_id uuid, user_name text, score bigint, is_me boolean)
language sql stable security definer set search_path = public
as $$
    with agg as (
        select e.user_id, count(*) as score
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
    where public.grm_current_user_id() is not null
      and public.grm_is_eligible_region(p_region)
      and u.region = p_region
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
    where public.grm_current_user_id() is not null
      and public.grm_is_eligible_region(p_region)
      and u.region = p_region
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
    where public.grm_current_user_id() is not null
      and public.grm_is_eligible_region(p_region)
      and u.region = p_region
    order by a.score desc
    limit 3;
$$;


-- 5. RLS на чтение ленты/значков/истории — раньше было `using (true)`, то есть
--    полностью открыто анонимным запросам через REST API. Теперь требует, чтобы
--    вызывающий был опознан как существующий пользователь (grm_current_user_id()).
drop policy if exists activity_feed_read on public.activity_feed;
create policy activity_feed_read on public.activity_feed
    for select using (public.grm_current_user_id() is not null);

drop policy if exists feed_reactions_read on public.feed_reactions;
create policy feed_reactions_read on public.feed_reactions
    for select using (public.grm_current_user_id() is not null);

drop policy if exists user_achievements_read on public.user_achievements;
create policy user_achievements_read on public.user_achievements
    for select using (public.grm_current_user_id() is not null);

drop policy if exists mlh_read on public.monthly_leaderboard_history;
create policy mlh_read on public.monthly_leaderboard_history
    for select using (public.grm_current_user_id() is not null);
