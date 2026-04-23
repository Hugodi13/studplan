-- Résoudre l’id utilisateur par email (appelé depuis l’Edge Function, clé service)
create or replace function public.auth_user_id_by_email(lookup_email text)
returns uuid
language sql
stable
security definer
set search_path = auth, public
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(lookup_email))
  limit 1
$$;

revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;

-- Idempotence des webhooks
create table if not exists public.paypal_webhook_events (
  id text primary key,
  event_type text,
  created_at timestamptz not null default now()
);
alter table public.paypal_webhook_events enable row level security;
revoke all on public.paypal_webhook_events from anon, authenticated;
grant all on public.paypal_webhook_events to service_role;

-- Blocage : le client (JWT authenticated) ne peut pas s’auto-activer en Premium PayPal
-- (l’Edge Function utilise service_role et n’est pas bloquée)
create or replace function public._block_client_paypal_premium()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  jrole text;
begin
  jrole := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', auth.jwt() ->> 'role', '');

  if jrole in ('service_role', 'supabase_service') then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and not coalesce(old.is_founder, false)
     and (new.is_premium = true and new.payment_provider = 'paypal')
     and not (old.is_premium = true and old.payment_provider = 'paypal')
  then
    if jrole = 'authenticated' or jrole = 'anon' then
      raise exception 'Premium PayPal: activation côté serveur uniquement (webhook).';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_block_client_paypal on public.profiles;
create trigger trg_block_client_paypal
  before update on public.profiles
  for each row
  execute function public._block_client_paypal_premium();
