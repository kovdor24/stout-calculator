-- ============================================================================
--  ПРИОРИТЕТ ОПЛАТЫ: +100 очков за смету вместо +30, 4 новых значка-вехи
-- ============================================================================
-- Раньше запрос счёта (+15) и рутинная активность (PDF/ссылки) в сумме могли
-- обогнать реальные закрытые сделки. Теперь оплата — доминирующий фактор
-- рейтинга: +100 очков за каждую оплаченную смету (было +30), плюс 4 новых
-- значка за накопленное число оплат.
--
-- Значки за оплату разблокируются ПРЯМО ИЗ ТРИГГЕРА на сервере, а не через
-- обычный клиентский путь (GRM.trackAction в gamification.js, локальные
-- счётчики в localStorage) — потому что оплату подтверждает КЛИЕНТ на
-- invoice.html, а не сам монтажник, и в этот момент браузер монтажника,
-- скорее всего, вообще не открыт. Поэтому логика разблокировки вынесена в
-- отдельный внутренний хелпер grm_unlock_for_user(), общий для клиентского
-- RPC grm_unlock_achievement() и для триггера.
--
-- Заодно переименованы/скорректированы 2 существующих значка под новый список
-- приоритетных номинаций — правим только title/threshold, id не трогаем,
-- чтобы не потерять уже выданные значки у реальных пользователей.
--
-- Выполнить вручную в Supabase SQL Editor ПОСЛЕ 20260717-721_....sql,
-- целиком за один раз.
-- ============================================================================


-- 1. Переименования/пороги существующих значков под новый список приоритетов
update public.achievements set title = 'Держим давление' where id = 'hold_degree';
update public.achievements set title = 'Генеральный подрядчик', threshold = 30 where id = 'general_partner';
update public.achievements set threshold = 20 where id = 'sales_master';


-- 2. Каталог 4 новых значков за оплату (id = ключ SVG-иконки на фронте)
insert into public.achievements (id, title, description, category, metric, threshold, xp_reward, sort_order) values
    ('first_payment',      'Первая оплата',      '1 смета получила статус «оплачено»', 'business', 'payment', 1,  100, 43),
    ('reliable_installer', 'Надёжный монтажник', '5 оплаченных смет',                   'business', 'payment', 5,  150, 44),
    ('amber_master',       'Янтарный мастер',    '15 оплаченных смет',                  'business', 'payment', 15, 300, 45),
    ('baltic_owner',       'Хозяин Балтики',     '30 оплаченных смет за квартал',       'business', 'payment', 30, 500, 46)
on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    xp_reward = excluded.xp_reward,
    threshold = excluded.threshold;


-- 3. Внутренний хелпер разблокировки по явному user_id — общая логика для
--    клиентского RPC (ниже) и для серверного триггера (блок 5). НЕ вызывается
--    напрямую с фронта: принимает произвольный p_user_id без проверки личности
--    вызывающего, поэтому execute отозван у anon/authenticated в конце файла
--    (тот же паттерн, что и у grm_award_xp в 20260721_...).
create or replace function public.grm_unlock_for_user(p_user_id uuid, p_achievement_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_ach   public.achievements%rowtype;
    v_user  public.users%rowtype;
    v_rows  integer := 0;
    v_new   boolean := false;
begin
    if p_user_id is null then
        return false;
    end if;

    select * into v_ach from public.achievements where id = p_achievement_id and is_active;
    if not found then
        return false;
    end if;

    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, p_achievement_id)
    on conflict (user_id, achievement_id, period) do nothing;

    get diagnostics v_rows = row_count;
    v_new := (v_rows > 0);

    if v_new then
        perform public.grm_award_xp(p_user_id, 'badge', v_ach.xp_reward, p_achievement_id);

        select * into v_user from public.users where id = p_user_id;
        insert into public.activity_feed (user_id, user_name, region, type, achievement_id, title)
        values (
            p_user_id,
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

-- Публичный RPC теперь резолвит вызывающего сам и делегирует хелперу —
-- поведение для клиента (кнопки/ручные значки) не меняется.
create or replace function public.grm_unlock_achievement(p_achievement_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid    uuid := public.grm_current_user_id();
    v_region text;
begin
    if v_uid is null then
        return false;
    end if;

    select region into v_region from public.users where id = v_uid;
    if not public.grm_is_eligible_region(v_region) then
        return false;
    end if;

    return public.grm_unlock_for_user(v_uid, p_achievement_id);
end;
$$;


-- 4. Триггер: +100 очков за оплату (было +30) + автопроверка порогов
--    4 значков-вех прямо на сервере, идемпотентно (grm_unlock_for_user сама
--    не начислит повторно благодаря ON CONFLICT в user_achievements).
create or replace function public.grm_sync_estimate_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_new_status    text;
    v_estimate_id   uuid;
    v_estimate_user uuid;
    v_region        text;
    v_total_paid    integer;
    v_quarter_paid  integer;
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
           and (v_new_status = 'completed' or e.status = 'draft')
           and e.status is distinct from v_new_status
        returning e.id, e.user_id into v_estimate_id, v_estimate_user;

        if v_new_status = 'completed' and v_estimate_user is not null then
            select region into v_region from public.users where id = v_estimate_user;
            if public.grm_is_eligible_region(v_region) then
                perform public.grm_award_xp(v_estimate_user, 'payment', 100, new.calc_id);

                select count(*) into v_total_paid
                from public.estimates
                where user_id = v_estimate_user and status = 'completed';

                select count(*) into v_quarter_paid
                from public.estimates
                where user_id = v_estimate_user and status = 'completed'
                  and date_trunc('quarter', completed_at) = date_trunc('quarter', now());

                if v_total_paid >= 1  then perform public.grm_unlock_for_user(v_estimate_user, 'first_payment'); end if;
                if v_total_paid >= 5  then perform public.grm_unlock_for_user(v_estimate_user, 'reliable_installer'); end if;
                if v_total_paid >= 15 then perform public.grm_unlock_for_user(v_estimate_user, 'amber_master'); end if;
                if v_quarter_paid >= 30 then perform public.grm_unlock_for_user(v_estimate_user, 'baltic_owner'); end if;
            end if;
        end if;
    end if;

    return new;
end;
$$;


-- 5. grm_unlock_for_user принимает произвольный p_user_id без проверки личности
--    вызывающего — тот же риск, что закрывали для grm_award_xp в 20260721_....
revoke execute on function public.grm_unlock_for_user(uuid, text) from public, anon, authenticated;
