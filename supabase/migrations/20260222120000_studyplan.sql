-- Exécuter ce script dans l’éditeur SQL de Supabase (ou via CLI) une fois.
-- Ajuste les politiques « authenticated » si besoin.

-- Compteur global pour les 100 premiers comptes « fondateur »
create table if not exists public.founder_state (
  id int primary key default 1,
  used_count int not null default 0,
  max_slots int not null default 100
);
insert into public.founder_state (id, used_count) values (1, 0)
  on conflict (id) do nothing;

-- Profil = abonnement + méta
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_premium boolean not null default false,
  is_founder boolean not null default false,
  founder_rank int,
  payment_provider text,
  paypal_order_id text,
  paypal_subscription_id text,
  subscription_start_date date,
  subscription_end_date timestamptz,
  is_subscription_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Lecture profil = soi" on public.profiles
  for select using (auth.uid() = id);
create policy "Mise à jour profil = soi" on public.profiles
  for update using (auth.uid() = id);
create policy "Insertion profil = soi (trigger)" on public.profiles
  for insert with check (auth.uid() = id);

-- Réservation fondateur : au plus 100, une fois par compte
create or replace function public.claim_founder()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_max int;
  v_rank int;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid()) then
    return null;
  end if;
  if (select is_founder from public.profiles where id = auth.uid()) = true then
    return (select founder_rank from public.profiles where id = auth.uid());
  end if;

  perform 1 from public.founder_state where id = 1 for update;
  select used_count, max_slots into v_count, v_max from public.founder_state where id = 1;
  if v_count >= v_max then
    return null;
  end if;

  v_rank := v_count + 1;
  update public.founder_state set used_count = v_rank where id = 1;
  update public.profiles
  set is_founder = true,
      founder_rank = v_rank,
      is_premium = true,
      is_subscription_active = true,
      updated_at = now()
  where id = auth.uid();

  return v_rank;
end;
$$;

-- Trigger: créer le profil à l’inscription
create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.on_auth_user_created();

grant usage on schema public to anon, authenticated;
grant all on public.profiles to authenticated;
-- founder_state: lecture service ; mises à jour par claim_founder() en security definer
grant select, update, insert on public.founder_state to service_role;
revoke all on public.founder_state from authenticated, anon;

-- RPC : appelée côté client (anon key + JWT) pour tenter d’obtenir un slot fondateur
grant execute on function public.claim_founder() to authenticated;
