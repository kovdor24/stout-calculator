-- Email директора компании-дистрибьютора — получает скрытую копию (BCC) писем,
-- уходящих менеджеру дистрибьютора при запросе счёта монтажником.
-- Несколько менеджеров одной компании оформляются как несколько строк distributors
-- с одинаковым company_name (и, при желании, одинаковым director_email).
-- Выполнить вручную в Supabase SQL Editor.

alter table public.distributors
    add column if not exists director_email text;
