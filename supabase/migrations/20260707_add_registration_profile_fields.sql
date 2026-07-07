-- Доп. поля регистрации/профиля: ФИО по частям, дата рождения, регион, сфера деятельности.
-- phone, email, city в таблице users уже существуют — не трогаем.
-- Выполнить вручную в Supabase SQL Editor (нет CLI/service role key в этом окружении).

alter table public.users
    add column if not exists last_name text,
    add column if not exists first_name text,
    add column if not exists middle_name text,
    add column if not exists birth_date date,
    add column if not exists region text,
    add column if not exists activity_types text[] not null default '{}';
