-- Свои цены дистрибьютора.
--
-- Каталог (catalog.js) хранит цены Терем-онлайн, их раз в месяц целиком
-- переписывает автообновление. У дистрибьютора цены свои, и в каталоге они
-- жить не могут — их бы затирало. Сами цены лежат файлом dist_prices.js,
-- а здесь только два выключателя: чей прайс и включён ли он вообще.
--
-- use_own_prices  — главный рубильник в карточке дистрибьютора: пока включён,
--                   его монтажники видят его цены, автообновление их не трогает.
-- price_list_key  — какой блок из dist_prices.js относится к этой компании
--                   (для ООО «КИТ-СЕРВИС» это 'kit-service').
-- users.price_source — личное исключение для монтажника: 'terem' возвращает
--                   его на каталожные цены даже при включённом рубильнике.
--                   NULL и 'distributor' означают одно и то же — цены дистрибьютора.
--
-- Выполнить вручную в Supabase SQL Editor ДО выкладки новой версии сайта:
-- админка читает эти колонки, и без них вкладка «Пользователи» не загрузится.

alter table public.distributors
    add column if not exists use_own_prices boolean not null default false;

alter table public.distributors
    add column if not exists price_list_key text;

alter table public.users
    add column if not exists price_source text;
