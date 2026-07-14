-- Ужесточает политику UPDATE на public.users: старая политика "Разрешить обновление
-- пользовател" была разрешена для роли public без условий (qual = true), новая ограничивает
-- обновление до собственной строки пользователя.
--
-- Ограничиваем UPDATE до:
--   (а) собственной строки пользователя — auth.uid() = auth_user_id;
--   (б) строки с тем же email, что в JWT — нужно для сценария "тот же email, другой способ
--       входа" (см. handleAuthSession в app.js: сначала ищет по auth_user_id, при неудаче —
--       по email и привязывает auth_user_id заново; auth.jwt()->>'email' — проверенный
--       Supabase Auth email, сравнение по нему безопасно);
--   (в) админов — уже отдельной политикой users_admin_update, её не трогаем.
--
-- Перед выполнением сверьте точное имя политики (могло отличаться, если её меняли после
-- дампа, который лёг в основу этого файла):
--   select policyname, qual from pg_policies where tablename = 'users' and cmd = 'UPDATE';
--
-- Выполнить вручную в Supabase SQL Editor. После выполнения проверить: вход по email/паролю,
-- вход через Google (в т.ч. когда email уже был зарегистрирован раньше другим способом),
-- сохранение профиля, активацию пробного периода и промокода — это места в app.js, что
-- полагаются на самообновление своей строки.

drop policy if exists "Разрешить обновление пользовател" on public.users;

create policy users_self_update on public.users
    for update using (
        auth.uid() = auth_user_id
        or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(email, ''))
    ) with check (
        auth.uid() = auth_user_id
        or lower(coalesce(auth.jwt() ->> 'email', '')) = lower(coalesce(email, ''))
    );
