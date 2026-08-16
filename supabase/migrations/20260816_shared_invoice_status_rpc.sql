-- Клиент отвечает на смету: «Согласовать», «Отправить замечания», «Запросить счёт».
--
-- Что было не так. Страница invoice.html открывается по ссылке, без входа в аккаунт,
-- то есть работает от роли anon. Статус она писала прямым upsert в shared_invoices.
-- Строка к этому моменту уже существует (её создал монтажник), поэтому upsert
-- превращается в UPDATE, а права на UPDATE у anon нет — Postgres отвечает:
--   new row violates row-level security policy (USING expression) for table "shared_invoices"
-- Именно эту ошибку видел клиент при отклонении сметы с комментарием. У «Запросить
-- счёт» тот же сбой уходил молча в консоль, статус просто не сохранялся.
--
-- Почему не открыть anon UPDATE на таблицу целиком: тогда любой, у кого есть ссылка,
-- мог бы переписать в смете состав, цены и итоги. Поэтому даём не право на строку,
-- а одну функцию, которая меняет ровно три поля внутри object_info:
-- status, client_comment, status_updated_at. Всё остальное остаётся нетронутым.
--
-- security definer: функция работает правами владельца и проходит мимо RLS, но
-- сделать ею можно только то, что написано в теле. Право знать чужой id ссылки —
-- это и есть право ответить на смету, ссылка сама по себе и является пропуском.
--
-- Приведение object_info к jsonb и обратно к собственному типу колонки — на случай,
-- если она создавалась как json или text (та же оговорка, что в
-- 20260815_analytics_live_regions.sql).
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).

create or replace function public.set_shared_invoice_status(
    p_id uuid,
    p_status text,
    p_comment text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_patch   jsonb;
    v_coltype text;
    v_updated int;
begin
    -- Белый список: снаружи приходит только то, что умеют кнопки на странице сметы.
    if p_status not in ('sent', 'confirmed', 'needs_revision', 'invoice_requested') then
        raise exception 'Недопустимый статус сметы: %', p_status;
    end if;

    v_patch := jsonb_build_object(
        'status', p_status,
        'status_updated_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    );

    -- Комментарий не передали (согласование, запрос счёта) — прежний не затираем.
    if p_comment is not null then
        v_patch := v_patch || jsonb_build_object('client_comment', left(p_comment, 5000));
    end if;

    select format_type(a.atttypid, a.atttypmod)
      into v_coltype
      from pg_attribute a
     where a.attrelid = 'public.shared_invoices'::regclass
       and a.attname = 'object_info';

    execute format(
        'update public.shared_invoices
            set object_info = ((coalesce(object_info::jsonb, ''{}''::jsonb) || $1)::text)::%s
          where id = $2',
        v_coltype
    ) using v_patch, p_id;

    get diagnostics v_updated = row_count;

    -- false = строки с таким id нет. Страница в этом случае создаст её сама
    -- обычным insert'ом: данные сметы у неё в руках, а вставка анониму разрешена.
    return v_updated > 0;
end;
$$;

revoke all on function public.set_shared_invoice_status(uuid, text, text) from public;
grant execute on function public.set_shared_invoice_status(uuid, text, text) to anon, authenticated;
