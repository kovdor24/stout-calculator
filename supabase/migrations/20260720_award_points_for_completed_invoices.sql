-- ============================================================================
--  ОЧКИ ЗА КАЖДУЮ ОПЛАЧЕННУЮ СМЕТУ (+30 очков за каждый переход в «оплачено»)
-- ============================================================================
-- Раньше оплаченные сметы влияли на основной рейтинг только косвенно (через
-- будущие значки-вехи). Теперь каждая реально закрытая сделка сама по себе
-- весомо двигает монтажника в рейтинге — это самое ценное действие для бизнеса,
-- и рейтинг должен это отражать сильнее, чем просто общая активность.
--
-- Логика встроена в тот же триггер, что уже переводит estimates.status в
-- 'completed' при событии 'confirmed' в invoice_events (см. 20260717_...).
-- Начисление идёт РОВНО ОДИН РАЗ на смету — защита от повторного клика
-- клиента по «подтвердить» через явную проверку перехода статуса
-- (e.status is distinct from v_new_status в WHERE), а не просто на каждое
-- событие 'confirmed'.
--
-- Очки начисляются только монтажникам Калининградской области — тот же гейт,
-- что и у остальной геймификации (grm_is_eligible_region из 20260718_...).
--
-- Выполнить вручную в Supabase SQL Editor ПОСЛЕ 20260717/18/19_....sql,
-- целиком за один раз.
-- ============================================================================

create or replace function public.grm_sync_estimate_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_new_status   text;
    v_estimate_id  uuid;
    v_estimate_user uuid;
    v_region       text;
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
           and (v_new_status = 'completed' or e.status = 'draft')
           -- реальный переход статуса, а не повторное срабатывание на том же событии
           and e.status is distinct from v_new_status
        returning e.id, e.user_id into v_estimate_id, v_estimate_user;

        -- Очки — только при настоящем первом переходе в 'completed' (v_estimate_id
        -- не null означает, что update выше реально затронул строку) и только
        -- монтажникам-участникам пилота.
        if v_new_status = 'completed' and v_estimate_user is not null then
            select region into v_region from public.users where id = v_estimate_user;
            if public.grm_is_eligible_region(v_region) then
                perform public.grm_award_xp(v_estimate_user, 'payment', 30, new.calc_id);
            end if;
        end if;
    end if;

    return new;
end;
$$;
