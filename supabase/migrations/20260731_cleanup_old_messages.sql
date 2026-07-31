-- Автоочистка переписки старше 90 дней. Держать её вечно незачем: сообщения
-- лежат в базе, а вложения чата — прямо в строках (base64 dataUrl), и это самая
-- быстрорастущая часть базы на бесплатном плане.
--
-- ⚠️ УДАЛЕНИЕ НЕОБРАТИМО. Прежде чем выполнять файл, посмотрите, что именно уедет —
-- запрос ниже ничего не удаляет, только считает:
--
--   select 'messages' as t, count(*) from public.messages
--       where created_at < now() - interval '90 days'
--   union all
--   select 'manager_chat_messages', count(*) from public.manager_chat_messages
--       where created_at < now() - interval '90 days';
--
-- Что попадает под очистку:
--   • messages — объявления, личные письма админа и ответы монтажников;
--   • manager_chat_messages — переписка монтажника с менеджером ВМЕСТЕ С ВЛОЖЕНИЯМИ;
--   • message_receipts — уезжают сами, каскадом за своим сообщением.
-- Сметы, счета, история статусов и баллы НЕ трогаются.
--
-- Не нужна очистка чата с менеджером — закомментируйте второй delete в функции.
-- Другой срок — поменяйте '90 days' в обоих местах (единственное место, где он задан).
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).

create or replace function public.cleanup_old_messages()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    cutoff timestamptz := now() - interval '90 days';
    n_msg int;
    n_chat int;
    n_orphan int;
begin
    delete from public.messages where created_at < cutoff;
    get diagnostics n_msg = row_count;

    delete from public.manager_chat_messages where created_at < cutoff;
    get diagnostics n_chat = row_count;

    -- Свежий ответ на уже удалённое старое сообщение остаётся «висеть» без родителя:
    -- в колокольчике монтажника он не покажется никогда (ответы рисуются только внутри
    -- своего письма), поэтому подчищаем и их
    delete from public.messages m
     where m.type = 'reply'
       and m.parent_id is not null
       and not exists (select 1 from public.messages p where p.id = m.parent_id);
    get diagnostics n_orphan = row_count;

    raise notice 'cleanup_old_messages: messages=%, manager_chat=%, orphan_replies=%', n_msg, n_chat, n_orphan;
end;
$$;

-- Функция служебная, вызывать её должен только планировщик, а не браузер с anon-ключом
revoke all on function public.cleanup_old_messages() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Планировщик. Ежедневно в 03:20 по времени сервера БД (обычно UTC).
-- Тот же приём, что у grm_monthly_rollover в 20260717_add_gamification_system.sql:
-- если pg_cron не включён, файл не падает, а пишет notice.
-- ─────────────────────────────────────────────────────────────────────────
-- create extension if not exists pg_cron;   -- раскомментировать, если ещё не включено

do $$
begin
    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        if exists (select 1 from cron.job where jobname = 'cleanup_old_messages') then
            perform cron.unschedule('cleanup_old_messages');
        end if;

        perform cron.schedule('cleanup_old_messages', '20 3 * * *', 'select public.cleanup_old_messages();');
    else
        raise notice 'pg_cron не установлен — расписание не создано. Включите расширение в Dashboard → Database → Extensions и повторите этот блок.';
    end if;
end;
$$;

-- Разовый прогон прямо сейчас (первая очистка снимет весь накопленный хвост).
-- Закомментируйте эту строку, если хотите, чтобы первое удаление произошло только
-- ночью по расписанию — например, чтобы успеть выгрузить архив переписки.
select public.cleanup_old_messages();
