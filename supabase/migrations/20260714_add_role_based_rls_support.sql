-- Добавление RLS политик для поддержки роли 'admin'
-- Позволяет пользователям с account_type = 'admin' выполнять операции UPDATE и DELETE наряду с супер-администраторами.
-- Выполнить вручную в Supabase SQL Editor.

-- 1. Функция-хелпер для проверки, является ли текущий авторизованный пользователь админом
create or replace function public.is_admin()
returns boolean security definer as $$
begin
  return (
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('kovdorekb@gmail.com', 'kovdor24@yandex.ru', 'dima24ba@gmail.com')
    or exists (
      select 1 from public.users
      where users.auth_user_id = auth.uid()
        and users.account_type = 'admin'
    )
  );
end;
$$ language plpgsql;

-- 2. Обновление политик для public.users
drop policy if exists users_admin_update on public.users;
create policy users_admin_update on public.users
    for update using ( public.is_admin() );

drop policy if exists users_admin_delete on public.users;
create policy users_admin_delete on public.users
    for delete using ( public.is_admin() );

-- 3. Обновление политик для public.estimates
drop policy if exists estimates_admin_delete on public.estimates;
create policy estimates_admin_delete on public.estimates
    for delete using ( public.is_admin() );

-- 4. Обновление политик для public.manager_chat_messages
drop policy if exists manager_chat_admin_delete on public.manager_chat_messages;
create policy manager_chat_admin_delete on public.manager_chat_messages
    for delete using ( public.is_admin() );

-- 5. Обновление политик для public.messages
drop policy if exists messages_admin_delete on public.messages;
create policy messages_admin_delete on public.messages
    for delete using ( public.is_admin() );
