-- Марки на графике «Спрос по месяцам» (вкладка «Дашборд») — список правится
-- кнопками в самой админке, без правки кода и без выкладки сайта.
--
-- Зачем таблица, а не файл в репозитории: список нужен ДВОИМ — браузеру, чтобы
-- решить, какие линии рисовать, и AutoWordstat.py в GitHub Actions, чтобы
-- решить, по каким словам вообще запрашивать историю у Wordstat. Из браузера в
-- репозиторий не написать, поэтому общее место — база. Ровно так же устроены
-- решения по словам-кандидатам (analytics_terms).
--
-- Поля:
--   word       — что спрашиваем у Wordstat, ровно этой строкой (нижний регистр);
--   label      — как подписываем линию; пусто — берём word;
--   rival_of   — 'own' (наши), 'stout' или 'rommer': только для группировки
--                в списке, на расчёт не влияет;
--   enabled    — рисовать ли линию. Историю собираем и по выключенным тоже:
--                тогда галочка переключается мгновенно, а не «после прогона»;
--   merge_into — склейка двух написаний в одну линию (usystems → uponor:
--                старое и новое юрлицо одной марки в РФ). Строка с merge_into
--                собирается отдельно, а на графике прибавляется к цели;
--   sort       — порядок в списке настроек.
--
-- Выполнить вручную в Supabase SQL Editor, весь файл целиком, за один раз.

create table if not exists public.analytics_chart_brands (
    word        text primary key,
    label       text,
    rival_of    text not null default 'stout',
    enabled     boolean not null default true,
    merge_into  text,
    sort        integer not null default 100,
    updated_at  timestamptz not null default now()
);

alter table public.analytics_chart_brands enable row level security;

-- Читают все: парсеру в Actions доступен только публичный ключ (anon), а
-- секрета в списке марок нет — это те же слова, что видно на графике.
drop policy if exists analytics_chart_brands_read on public.analytics_chart_brands;
create policy analytics_chart_brands_read on public.analytics_chart_brands
    for select using (true);

-- Пишет только админ: лишняя марка в списке — это лишний платный запрос к
-- Wordstat в каждом прогоне.
drop policy if exists analytics_chart_brands_write on public.analytics_chart_brands;
create policy analytics_chart_brands_write on public.analytics_chart_brands
    for all using (public.is_admin()) with check (public.is_admin());

grant select on public.analytics_chart_brands to anon, authenticated;
grant insert, update, delete on public.analytics_chart_brands to authenticated;

-- Стартовый список: свои две марки плюс по три конкурента у каждой.
-- Конкуренты выбраны по рейтингам категорий (analytics/wordstat_brands.json):
-- valtec первый по спросу вообще, rehau — в PEX и аксиальных фитингах,
-- elsen — в насосных группах и обвязке; tim — в коллекторах тёплого пола и
-- незамерзающих кранах, vieir — в эконом-кранах и металлопластике,
-- valfex — в полипропилене.
-- Подписи оставляем строчными, как в остальной аналитике: рейтинги категорий
-- показывают слова ровно так, как их пишут в поиске.
insert into public.analytics_chart_brands (word, label, rival_of, enabled, sort) values
    ('stout',    'stout',   'own',    true,  1),
    ('rommer',   'rommer',  'own',    true,  2),
    ('valtec',   'valtec',  'stout',  true, 10),
    ('elsen',    'elsen',   'stout',  true, 11),
    ('rehau',    'rehau',   'stout',  true, 12),
    ('tim',      'tim',     'rommer', true, 20),
    ('valfex',   'valfex',  'rommer', true, 21),
    ('vieir',    'vieir',   'rommer', true, 22)
on conflict (word) do nothing;

-- Прежние марки графика остаются в списке, но выключенными: спрос по ним
-- продолжает собираться, и вернуть линию можно одной галочкой.
insert into public.analytics_chart_brands (word, label, rival_of, enabled, sort) values
    ('uponor',   'uponor',   'stout', false, 30),
    ('usystems', 'usystems', 'stout', false, 31),
    ('oventrop', 'oventrop', 'stout', false, 32)
on conflict (word) do nothing;

-- usystems — то же имя на рынке, что uponor (новое юрлицо в РФ): показываем
-- одной линией, чтобы переход одного бренда в другой не читался как падение.
update public.analytics_chart_brands set merge_into = 'uponor' where word = 'usystems';

-- Кириллица и латиница у Wordstat — РАЗНЫЕ запросы: «рехау» не попадает в счёт
-- «rehau» ни одной единицей. Пока написания не сведены, график занижает каждую
-- марку, причём по-разному: у одних кириллицей ищут заметную долю, у других
-- почти нет. Написания взяты из brand_aliases в analytics/wordstat_categories.json,
-- где они уже используются для рейтингов категорий.
--
-- Каждое написание — ещё один запрос к Wordstat в каждом прогоне, поэтому
-- заводим их только для марок, которые сейчас на графике. «тим» намеренно нет:
-- это обычное слово, и в счёт марки попало бы всё подряд.
insert into public.analytics_chart_brands (word, label, rival_of, enabled, merge_into, sort) values
    ('стаут',   'стаут',   'own',    true, 'stout',  3),
    ('стоут',   'стоут',   'own',    true, 'stout',  4),
    ('роммер',  'роммер',  'own',    true, 'rommer', 5),
    ('валтек',  'валтек',  'stout',  true, 'valtec', 13),
    ('валтэк',  'валтэк',  'stout',  true, 'valtec', 14),
    ('эльзен',  'эльзен',  'stout',  true, 'elsen',  15),
    ('рехау',   'рехау',   'stout',  true, 'rehau',  16),
    ('валфекс', 'валфекс', 'rommer', true, 'valfex', 23),
    ('виеир',   'виеир',   'rommer', true, 'vieir',  24)
on conflict (word) do nothing;
