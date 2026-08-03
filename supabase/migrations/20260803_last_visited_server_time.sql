-- Время последнего входа (колонка «Вход» в админке) ставит база, а не браузер.
--
-- Как было: при входе приложение отправляло last_visited: new Date().toISOString(),
-- то есть время брали с часов устройства монтажника. Если часы сбиты (ручная установка
-- времени на телефоне, севшая батарейка на компьютере), в базу уезжала дата из будущего
-- или из прошлого — в списке появлялись входы «сегодня в 19:12», когда на часах админа 12:56.
-- Сортировка «Вход: сначала новые» из-за этого тоже врала: такие записи вставали в начало.
--
-- Как стало: клиент по-прежнему присылает свою дату, но триггер молча заменяет её на now()
-- сервера. Строки, где last_visited не менялся (админ поменял дистрибьютора, тариф, блокировку),
-- триггер не трогает — иначе любая правка из админки считалась бы «входом» пользователя.
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).

create or replace function public.users_stamp_last_visited()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'INSERT' then
        if new.last_visited is not null then
            new.last_visited := now();
        end if;
    elsif new.last_visited is distinct from old.last_visited then
        new.last_visited := now();
    end if;
    return new;
end;
$$;

drop trigger if exists users_stamp_last_visited on public.users;
create trigger users_stamp_last_visited
    before insert or update on public.users
    for each row
    execute function public.users_stamp_last_visited();

-- НЕОБЯЗАТЕЛЬНО (можно не выполнять). Разовая правка уже записанных дат из будущего:
-- реального времени входа не знает никто, известно только, что оно не позже «сейчас».
-- Без этой строки старые кривые даты останутся как есть — в админке они помечены ⚠
-- и исправятся сами при следующем входе такого пользователя.
-- update public.users
--    set last_visited = now()
--  where last_visited > now() + interval '1 hour';
