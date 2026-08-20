-- Автопоздравление с днём рождения.
--
-- Раз в сутки база сама находит тех, у кого сегодня день рождения, и:
--   1) отправляет монтажнику личное сообщение от администрации сайта — оно приходит
--      обычным уведомлением в приложении (со звуком и всплывашкой) и ложится во
--      вкладку «Переписка», как любое письмо администратора;
--   2) отправляет таким же личным сообщением напоминание менеджеру, за которым
--      закреплён этот монтажник (менеджер компании из его карточки «Дистрибьютор»).
--
-- Текст поздравления не один на всех: их пять штук, вариант выбирается по id человека
-- и году, поэтому в следующем году придёт другое письмо. Имя подставляется из анкеты
-- (имя и отчество, если они заполнены).
--
-- Почему в базе, а не в приложении: поздравление должно уходить само, а не тогда,
-- когда кто-то откроет админку. Тот же приём, что у автоочистки переписки
-- (20260731_cleanup_old_messages.sql) — функция + расписание pg_cron.
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).
-- Ничего не удаляет и не переписывает, только добавляет.

-- ─────────────────────────────────────────────────────────────────────────
-- Кого уже поздравили. Ключ (человек, год) — второй раз в тот же день рождения
-- письмо не уйдёт, даже если запустить функцию руками десять раз подряд.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.birthday_greetings (
    user_id            uuid not null references public.users(id) on delete cascade,
    year               int  not null,
    sent_at            timestamptz not null default now(),
    message_id         uuid,   -- письмо монтажнику
    manager_message_id uuid,   -- напоминание менеджеру (null, если менеджера нет)
    primary key (user_id, year)
);

-- Таблица служебная: наружу её не отдаём совсем. Функция ниже — security definer,
-- она работает от владельца схемы и политики обходит.
alter table public.birthday_greetings enable row level security;

create or replace function public.send_birthday_greetings()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    -- Отправитель. Сообщение должно быть «от администрации», а sender_id в messages —
    -- это строка реального пользователя, поэтому берём владельца, а если его почта
    -- вдруг сменилась — первого попавшегося администратора.
    sender uuid;
    y      int := extract(year from current_date)::int;
    u      record;
    nm     text;
    yrs    int;
    yrsw   text;
    mgr    uuid;
    comp   text;
    msg_id uuid;
    mgr_id uuid;
    n      int := 0;
    tpl    text[] := array[
'%s, с днём рождения!

Желаем крепкого здоровья, надёжных заказчиков и лёгких объектов — чтобы каждый узел собирался с первого раза, а система запускалась без единой подтяжки.

Успехов в работе и хорошего сезона!

Администрация HeatCalc.ru',

'С днём рождения, %s!

Пусть в работе всё идёт ровно, как давление в правильно собранной системе: без скачков, без завоздушивания и без авралов. Желаем интересных объектов, честных сроков и заказчиков, которые ценят хорошую работу.

Здоровья вам и вашим близким!

Администрация HeatCalc.ru',

'%s, поздравляем с днём рождения!

Желаем, чтобы сметы согласовывались с первого раза, материалы приходили вовремя, а тёплых домов за вашей спиной становилось всё больше.

Успехов в работе, сил и хорошего настроения!

Администрация HeatCalc.ru',

'С днём рождения, %s!

Пусть год принесёт крупные объекты, надёжную бригаду и время на отдых между ними. Желаем профессионального роста и чтобы работа приносила не только доход, но и удовольствие.

Здоровья и успехов в работе!

Администрация HeatCalc.ru',

'%s, с днём рождения!

Спасибо, что считаете вместе с нами. Желаем стабильного потока заказов, точных расчётов и чтобы ни один объект не преподносил сюрпризов на запуске.

Больших успехов в работе и крепкого здоровья!

Администрация HeatCalc.ru'
    ];
begin
    select id into sender from public.users
     where lower(btrim(email)) = 'dima24ba@gmail.com' limit 1;
    if sender is null then
        select id into sender from public.users
         where account_type = 'admin' order by created_at limit 1;
    end if;
    if sender is null then
        raise notice 'send_birthday_greetings: не найден отправитель — поздравления не отправлены';
        return 0;
    end if;

    for u in
        select us.id, us.first_name, us.middle_name, us.last_name, us.username,
               us.phone, us.city, us.region, us.birth_date, us.distributor_id
          from public.users us
         where us.birth_date is not null
           and coalesce(us.is_blocked, false) = false
           and us.id <> sender                       -- сам себе поздравление не пишем
           and (
                to_char(us.birth_date, 'MM-DD') = to_char(current_date, 'MM-DD')
                -- Родившихся 29 февраля в обычный год поздравляем 28-го: третье
                -- условие и означает «завтра уже март», то есть год не високосный.
                or (to_char(us.birth_date, 'MM-DD') = '02-29'
                    and to_char(current_date, 'MM-DD') = '02-28'
                    and to_char(current_date + 1, 'MM-DD') = '03-01')
               )
           and not exists (select 1 from public.birthday_greetings b
                            where b.user_id = us.id and b.year = y)
    loop
        -- Обращение: «Имя Отчество», если отчество заполнено; иначе имя; иначе то,
        -- под чем человек записан в базе.
        nm := coalesce(
                nullif(btrim(concat_ws(' ', u.first_name, u.middle_name)), ''),
                nullif(btrim(u.username), ''),
                'Коллега');

        insert into public.messages (sender_id, recipient_id, text, type)
        values (sender, u.id,
                format(tpl[1 + mod(abs(hashtext(u.id::text || y::text)::bigint), array_length(tpl, 1))::int], nm),
                'private')
        returning id into msg_id;

        -- ── Менеджер, за которым закреплён монтажник ──────────────────────
        mgr := null; mgr_id := null; comp := null;
        if u.distributor_id is not null then
            select mu.id, d.company_name into mgr, comp
              from public.distributors d
              left join public.users mu
                on lower(btrim(mu.email)) = lower(btrim(coalesce(nullif(d.manager_email, ''), d.director_email)))
             where d.id = u.distributor_id
             limit 1;
        end if;

        if mgr is not null and mgr <> u.id then
            yrs := extract(year from age(current_date, u.birth_date))::int;
            yrsw := case
                when yrs % 10 = 1 and yrs % 100 <> 11 then 'год'
                when yrs % 10 between 2 and 4 and yrs % 100 not between 12 and 14 then 'года'
                else 'лет' end;

            insert into public.messages (sender_id, recipient_id, text, type)
            values (sender, mgr,
                format(E'🎂 Сегодня день рождения у вашего монтажника.\n\n%s%s\n%s%s\n\nЭтот монтажник закреплён за вами%s — хороший повод позвонить и поздравить.',
                    coalesce(nullif(btrim(concat_ws(' ', u.last_name, u.first_name, u.middle_name)), ''),
                             nullif(btrim(u.username), ''), 'Монтажник'),
                    case when yrs between 14 and 100 then ', ' || yrs || ' ' || yrsw else '' end,
                    coalesce(nullif(btrim(coalesce(u.city, u.region)), '') || ', ', ''),
                    coalesce(nullif(btrim(u.phone), ''), 'телефон не указан'),
                    coalesce(' (' || nullif(btrim(comp), '') || ')', '')),
                'private')
            returning id into mgr_id;
        end if;

        insert into public.birthday_greetings (user_id, year, message_id, manager_message_id)
        values (u.id, y, msg_id, mgr_id);

        n := n + 1;
    end loop;

    raise notice 'send_birthday_greetings: поздравлений отправлено — %', n;
    return n;
end;
$$;

-- Вызывать должен только планировщик, а не браузер с anon-ключом
revoke all on function public.send_birthday_greetings() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Расписание: ежедневно в 06:00 по времени сервера БД (UTC) — это 09:00 по Москве.
-- Тот же приём, что у cleanup_old_messages: если pg_cron не включён, файл не падает,
-- а пишет notice.
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        if exists (select 1 from cron.job where jobname = 'send_birthday_greetings') then
            perform cron.unschedule('send_birthday_greetings');
        end if;
        perform cron.schedule('send_birthday_greetings', '0 6 * * *', 'select public.send_birthday_greetings();');
    else
        raise notice 'pg_cron не установлен — расписание не создано. Включите расширение в Dashboard → Database → Extensions и повторите этот блок.';
    end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Проверки (выполнять отдельно, по желанию).
--
-- Кого поздравит сегодня — ничего не отправляет, только показывает:
--   select id, last_name, first_name, birth_date from public.users
--    where birth_date is not null and coalesce(is_blocked,false) = false
--      and to_char(birth_date,'MM-DD') = to_char(current_date,'MM-DD');
--
-- Отправить прямо сейчас, не дожидаясь ночи:
--   select public.send_birthday_greetings();
--
-- Что уже отправлено:
--   select * from public.birthday_greetings order by sent_at desc limit 20;
--
-- Отменить автопоздравления:
--   select cron.unschedule('send_birthday_greetings');
-- ─────────────────────────────────────────────────────────────────────────
