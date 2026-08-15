-- Список «живых» регионов для парсеров вкладки «Аналитика» (см. ANALYTICS_PLAN.md).
--
-- Зачем: и Wordstat, и догазификация считаются ТОЛЬКО по регионам присутствия —
-- где есть монтажники, дистрибьюторы или объекты смет. Запросы к Wordstat платные
-- и ограничены сотней в час, а адаптер догазификации приходится писать под каждый
-- регион отдельно, поэтому «вся страна» здесь не вариант.
--
-- Список нужен парсеру в GitHub Actions при каждом запуске, а ключ у него только
-- публичный (anon) — значит, обычным select'ом сюда не дотянуться из-за RLS.
-- Отсюда security definer: функция читает таблицы правами владельца, но наружу
-- отдаёт только НАЗВАНИЯ регионов, без счётчиков, имён и любых других данных.
--
-- Три источника, приведение к общим названиям делает уже парсер (в users
-- «Республика Бурятия», в cities_geo.js — «Бурятия»):
--   user — регион из профиля монтажника;
--   dist — регионы дистрибьютора (массив);
--   city — object_info.region у сметы: это НАЗВАНИЕ ГОРОДА, если город выбран,
--          иначе климатическая зона («Центр», «Сибирь») — зоны парсер отбросит.
-- Приведение object_info к jsonb — на случай, если колонка создавалась как json
-- или text: cast работает во всех трёх случаях, а без него ->> упадёт на text.
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).

create or replace function public.analytics_live_regions()
returns table(kind text, name text)
language sql
security definer
set search_path = public
as $$
    select 'user'::text, u.region
      from public.users u
     where u.region is not null and btrim(u.region) <> ''
    union
    select 'dist'::text, unnest(d.regions)
      from public.distributors d
     where d.regions is not null
    union
    select 'city'::text, (s.object_info::jsonb) ->> 'region'
      from public.shared_invoices s
     where (s.object_info::jsonb) ->> 'region' is not null;
$$;

revoke all on function public.analytics_live_regions() from public;
grant execute on function public.analytics_live_regions() to anon, authenticated;
