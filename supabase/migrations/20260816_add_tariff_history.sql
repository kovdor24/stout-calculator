-- История тарифа: кто, когда и как получил или потерял Профи.
--
-- Зачем. В users лежит только ТЕКУЩЕЕ состояние (account_type, demo_ends_at,
-- pro_expires_at, distributor_id). По нему нельзя отличить «продлил» от
-- «купил впервые», а значит нельзя посчитать ни продления, ни конверсию
-- пробного в оплату. На дашборде из-за этого честно написано, что числа
-- продлений нет и не будет, пока не появится история. Эта таблица — она.
--
-- Почему триггером, а не записью из приложения. Тариф меняют в нескольких
-- местах: карточка монтажника в админке (saveAdminUserTariff), активация
-- демо в app.js, и руками в Supabase Studio, когда что-то правят. Запись из
-- браузера пропустила бы последнее и разъехалась бы при любой новой кнопке.
-- Триггер ловит всё, включая правку SQL-ом.
--
-- Что здесь НАМЕРЕННО не сводится в одно поле «источник». В админке вид
-- Профи считается так: сначала distributor_id → «промокод», иначе
-- pro_expires_at → «оплата». Но дистрибьютор к тарифу отношения не имеет
-- («не зависит от тарифа» написано в самой форме) — он про копию запроса
-- счёта. Из-за этого оплативший монтажник с указанным поставщиком выглядит
-- как промокодный. Поэтому строка хранит ОБА исходных признака (paid и
-- distributor_id) плюс производный source: если правило поменяется, историю
-- можно пересчитать, ничего не потеряв.
--
-- История начинается с момента выполнения этого файла: задним числом взять
-- её неоткуда. Дашборд об этом говорит прямо, а не показывает ноль как факт.
--
-- Выполнить вручную в Supabase SQL Editor, ВЕСЬ файл целиком за один раз.
-- Если редактор ответит «Unexpected eof» — вставка обрезалась, вставить заново.

create table if not exists public.tariff_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    changed_at timestamptz not null default now(),

    -- Что произошло:
    --   granted   — Профи появился там, где его не было
    --   extended  — срок сдвинут вперёд у действующего Профи (продление)
    --   returned  — срок сдвинут вперёд у УЖЕ истёкшего (вернулся)
    --   converted — появился признак оплаты там, где его не было
    --   shortened — срок сдвинут назад
    --   revoked   — Профи снят
    --   changed   — тарифные поля тронули, но ни под одно правило не подошло
    kind text not null,

    -- Производный вид Профи на момент изменения. Правило здесь своё: оплата
    -- важнее промокода, потому что pro_expires_at заполняется ТОЛЬКО при
    -- выборе «Оплата», а distributor_id ставится независимо от тарифа.
    source text,

    -- Исходные признаки, из которых source получен. Хранятся отдельно, чтобы
    -- пересчитать при смене правила.
    paid boolean not null default false,
    distributor_id uuid,

    was_until timestamptz,
    now_until timestamptz,
    account_type text
);

create index if not exists tariff_events_changed_idx
    on public.tariff_events (changed_at desc);
create index if not exists tariff_events_user_idx
    on public.tariff_events (user_id, changed_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- Триггер на users: пишет строку, когда меняются тарифные поля.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.tariff_log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_old_pro boolean;
    v_new_pro boolean;
    v_kind    text;
    v_source  text;
begin
    -- Тарифные поля не тронуты — выходим молча. Users обновляется на каждом
    -- входе (last_visited), и без этой проверки таблица набивалась бы шумом.
    if new.account_type   is not distinct from old.account_type
   and new.demo_ends_at   is not distinct from old.demo_ends_at
   and new.pro_expires_at is not distinct from old.pro_expires_at
   and new.distributor_id is not distinct from old.distributor_id then
        return new;
    end if;

    -- Профи бывает и у админа с наблюдателем: считаем по наличию тарифа, а
    -- не по account_type = 'pro' (тот же принцип, что в app.js).
    --
    -- coalesce обязателен: account_type у старых строк бывает пустым, а
    -- NULL = 'pro' даёт не false, а NULL — и тогда «not v_old_pro» тоже NULL,
    -- ветка granted не выбирается, и выдача Профи молча уезжает в «changed».
    v_old_pro := coalesce(old.account_type = 'pro', false)
                 or (coalesce(old.account_type in ('admin', 'viewer'), false)
                     and old.demo_ends_at is not null);
    v_new_pro := coalesce(new.account_type = 'pro', false)
                 or (coalesce(new.account_type in ('admin', 'viewer'), false)
                     and new.demo_ends_at is not null);

    v_source := case
        when new.pro_expires_at is not null then 'оплата'
        when new.distributor_id is not null then 'промокод'
        else 'пробный'
    end;

    if not v_old_pro and v_new_pro then
        v_kind := 'granted';
    elsif v_old_pro and not v_new_pro then
        v_kind := 'revoked';
    -- Появился признак оплаты — это первая оплата, и она важнее того, что
    -- заодно сдвинулась дата: продлений будет много, а конверсия одна.
    elsif old.pro_expires_at is null and new.pro_expires_at is not null then
        v_kind := 'converted';
    elsif new.demo_ends_at is distinct from old.demo_ends_at then
        if new.demo_ends_at is not null
           and (old.demo_ends_at is null or new.demo_ends_at > old.demo_ends_at) then
            -- Срок вперёд. Если прежний уже истёк — это возврат, а не
            -- продление: человек уходил и вернулся, разговор о нём другой.
            if old.demo_ends_at is not null and old.demo_ends_at < now() then
                v_kind := 'returned';
            else
                v_kind := 'extended';
            end if;
        else
            v_kind := 'shortened';
        end if;
    else
        v_kind := 'changed';
    end if;

    insert into public.tariff_events
        (user_id, kind, source, paid, distributor_id, was_until, now_until, account_type)
    values
        (new.id, v_kind, v_source, new.pro_expires_at is not null, new.distributor_id,
         old.demo_ends_at, new.demo_ends_at, new.account_type);

    return new;
end;
$$;

drop trigger if exists trg_tariff_log_change on public.users;
create trigger trg_tariff_log_change
    after update on public.users
    for each row execute function public.tariff_log_change();

-- ─────────────────────────────────────────────────────────────────────────
-- Права: читают только админы и наблюдатели — те же, кто видит дашборд.
-- Писать напрямую не может никто: строки кладёт триггер, а он security
-- definer и через RLS не проходит.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.tariff_events enable row level security;

drop policy if exists tariff_events_select on public.tariff_events;
create policy tariff_events_select on public.tariff_events
    for select using (
        public.is_admin()
        or exists (
            select 1 from public.users
            where users.auth_user_id = auth.uid()
              and users.account_type in ('admin', 'viewer')
        )
    );
