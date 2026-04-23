-- Expose compteur fondateur en lecture publique (sécurisé via fonction)
create or replace function public.get_founder_slots()
returns table (
  used_count int,
  max_slots int,
  remaining int
)
language sql
security definer
set search_path = public
as $$
  select
    fs.used_count,
    fs.max_slots,
    greatest(fs.max_slots - fs.used_count, 0) as remaining
  from public.founder_state fs
  where fs.id = 1
$$;

grant execute on function public.get_founder_slots() to anon, authenticated;
