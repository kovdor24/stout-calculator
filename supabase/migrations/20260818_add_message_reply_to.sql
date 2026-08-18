-- Ответ на конкретное сообщение (цитата), как в мессенджерах.
--
-- В переписке админа с монтажником сообщения идут одной лентой, и когда их
-- накопилось много, непонятно, на какое именно отвечают. Теперь по сообщению
-- можно кликнуть, и ответ уходит с цитатой: в пузыре видно кусок исходного
-- сообщения, а клик по цитате прокручивает переписку к нему и подсвечивает его.
--
-- Колонка parent_id для этого не годится: она уже занята — ею ответ монтажника
-- привязывается к письму, на которое отвечают в карточке уведомления, и по ней
-- же панель управления решает, в чью нить положить ответ (см. renderAdminMessages).
--
-- on delete set null: исходное сообщение могли удалить («Удалить сообщение»,
-- «Удалить переписку», автоочистка через 90 дней) — ответ при этом остаётся,
-- просто вместо цитаты в нём будет «Сообщение удалено».
--
-- Пока миграция не выполнена, всё работает как раньше: приложение видит, что
-- колонки нет (код 42703), и отправляет сообщение без цитаты.
--
-- Выполнить вручную в Supabase SQL Editor (весь файл целиком, за один раз).

alter table public.messages
    add column if not exists reply_to_id uuid references public.messages(id) on delete set null;

-- Индекс нужен самой базе: без него on delete set null перебирает всю таблицу
-- при каждом удалении сообщения.
create index if not exists messages_reply_to_id_idx on public.messages (reply_to_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Если запрос выше ругается на тип («foreign key constraint ... cannot be
-- implemented», «incompatible types»), значит messages.id не uuid. Тогда
-- вместо него выполнить этот блок — он сам подставит нужный тип:
--
-- do $$
-- declare id_type text;
-- begin
--     if exists (select 1 from information_schema.columns
--                 where table_schema = 'public' and table_name = 'messages'
--                   and column_name = 'reply_to_id') then return; end if;
--     select data_type into id_type from information_schema.columns
--      where table_schema = 'public' and table_name = 'messages' and column_name = 'id';
--     execute format('alter table public.messages add column reply_to_id %s references public.messages(id) on delete set null', id_type);
-- end $$;
