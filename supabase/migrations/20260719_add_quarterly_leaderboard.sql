-- ============================================================================
--  КВАРТАЛЬНЫЙ РЕЙТИНГ («Общий рейтинг» — переключатель рядом с месячным на /rating/)
-- ============================================================================
-- Считает сумму XP из xp_ledger за текущий календарный квартал (Postgres
-- date_trunc('quarter', ...) — стандартные границы Q1..Q4, например Q3 = июль–
-- сентябрь). Отдельного счётчика и отдельного сброса не требуется: диапазон
-- дат вычисляется на лету при каждом обращении, а история начислений уже
-- пишется в xp_ledger при любом действии (см. grm_award_xp в 20260717_...).
-- Значит квартал не нужно "прокатывать" cron'ом — как только наступает новый
-- квартал, старые записи xp_ledger естественным образом перестают попадать
-- в фильтр, и рейтинг сам начинается заново.
--
-- Выполнить вручную в Supabase SQL Editor ПОСЛЕ 20260718_restrict_gamification_to_kaliningrad.sql,
-- целиком за один раз.
-- ============================================================================

create or replace function public.grm_leaderboard_quarterly(p_region text, p_limit integer default 20)
returns table (
    rank        bigint,
    user_id     uuid,
    user_name   text,
    xp_points   bigint,
    is_me       boolean
)
language sql
stable
security definer
set search_path = public
as $$
    with agg as (
        select l.user_id, sum(l.amount) as xp_points
        from public.xp_ledger l
        where date_trunc('quarter', l.period) = date_trunc('quarter', now())
        group by l.user_id
    )
    select
        row_number() over (order by a.xp_points desc, u.created_at asc) as rank,
        u.id,
        coalesce(nullif(trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''), u.email) as user_name,
        a.xp_points,
        (u.id = public.grm_current_user_id()) as is_me
    from agg a
    join public.users u on u.id = a.user_id
    where public.grm_current_user_id() is not null
      and public.grm_is_eligible_region(p_region)
      and u.region = p_region
      and coalesce(u.is_blocked, false) = false
    order by a.xp_points desc, u.created_at asc
    limit p_limit;
$$;
