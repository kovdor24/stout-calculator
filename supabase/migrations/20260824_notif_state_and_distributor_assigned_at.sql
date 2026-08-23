-- Уведомления: два независимых исправления. Выполнить вручную в Supabase SQL Editor.
--
-- 1) users.distributor_assigned_at — когда монтажника привязали к дистрибьютору.
--    Уведомление «🤝 Назначен менеджер» собиралось заново при каждом опросе (раз в 2 мин),
--    условием было само наличие distributor_id, а время бралось из new Date(). Из-за этого
--    карточка вечно висела наверху списка с текущим временем, будто её только что прислали.
--    Теперь она показывается только двое суток с момента привязки. Дату ставит триггер —
--    так она проставится при любом способе назначения: промокод при регистрации, промокод
--    в меню, самостоятельный выбор менеджера, точечное и массовое назначение из админки
--    и даже правка руками в редакторе Supabase.
--    Backfill намеренно НЕ делаем: у всех уже привязанных колонка останется пустой,
--    и уведомление у них просто исчезнет — оно своё дело давно сделало.
--
-- 2) users.notif_state — прочитанные и скрытые уведомления. Раньше оба списка лежали
--    только в localStorage, то есть принадлежали браузеру: на втором устройстве, в другом
--    браузере, после чистки данных сайта или переустановки PWA всё разобранное всплывало
--    заново. Теперь это свойство учётной записи, localStorage остаётся кэшем.

-- ── 1. Дата привязки к дистрибьютору ────────────────────────────────────────
alter table public.users
    add column if not exists distributor_assigned_at timestamptz;

create or replace function public.stamp_distributor_assigned_at()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'INSERT' then
        if new.distributor_id is not null and new.distributor_assigned_at is null then
            new.distributor_assigned_at := now();
        end if;
    elsif new.distributor_id is distinct from old.distributor_id then
        -- Снятие дистрибьютора обнуляет и дату: следующая привязка снова будет свежей
        new.distributor_assigned_at := case when new.distributor_id is null then null else now() end;
    end if;
    return new;
end;
$$;

drop trigger if exists users_stamp_distributor_assigned_at on public.users;
create trigger users_stamp_distributor_assigned_at
    before insert or update on public.users
    for each row execute function public.stamp_distributor_assigned_at();

-- ── 2. Прочитано / скрыто у уведомлений ─────────────────────────────────────
alter table public.users
    add column if not exists notif_state jsonb not null default '{}'::jsonb;

comment on column public.users.distributor_assigned_at is
    'Когда монтажника привязали к дистрибьютору. Ставится триггером. Уведомление «Назначен менеджер» живёт 2 суток от этой даты.';
comment on column public.users.notif_state is
    'Разобранный колокольчик: {"read": [id...], "dismissed": [id...]}. Свойство учётной записи, а не браузера.';
