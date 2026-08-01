-- Вкладка «Проекты» в админке: объекты, по которым выпущен комплект листов.
--
-- Смета и проект — разные события. Смету считают и пересохраняют по многу раз,
-- она живёт в estimates. Проект выпускают осознанно: монтажник нажимает «Проект»,
-- страница листов собирает комплект — вот этот момент и есть строка здесь.
-- Поэтому у проекта своя дата (issued_at), а не created_at сметы.
--
-- Ключ — номер расчёта (calc_id, он же share_id сметы). Повторный выпуск по тому
-- же объекту обновляет строку, а не плодит дубли: в списке нужен последний
-- комплект с актуальными суммами. Строку пишет logProjectSheets() в app.js.
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    calc_id text not null unique,
    project_name text,
    address text,
    -- «MEP, ТМ, О, В» — марки разделов комплекта, одной строкой
    sections text,
    area numeric,
    eq_sum numeric,
    works_sum numeric,
    user_name text,
    user_email text,
    issued_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists projects_issued_idx
    on public.projects (issued_at desc);

alter table public.projects enable row level security;

-- Пишет монтажник в момент выпуска листов — про свой объект, из приложения.
-- Отдельной проверки авторства нет: calc_id генерируется случайно на устройстве
-- и в чужую строку без него не попасть, а раздел проектирования и так открыт
-- только тем, кому его включил админ.
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
    for insert to authenticated with check (true);

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
    for update to authenticated using (true);

-- Читают список админы и наблюдатели (та же роль, что открывает админку в app.js:
-- account_type in ('admin','viewer') плюс супер-админы из is_admin()).
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
    for select using (
        public.is_admin()
        or exists (
            select 1 from public.users
            where users.auth_user_id = auth.uid()
              and users.account_type = 'viewer'
        )
    );

drop policy if exists projects_admin_delete on public.projects;
create policy projects_admin_delete on public.projects
    for delete using ( public.is_admin() );
