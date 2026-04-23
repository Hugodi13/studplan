-- Ajustement slots fondateur : forcer à 100
alter table if exists public.founder_state
  alter column max_slots set default 100;

update public.founder_state
set max_slots = 100
where id = 1;
