-- RevenueCat-ready workshop code and access grant model

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.workshop_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  entitlement_key text not null default 'pro',
  trial_days integer not null check (trial_days > 0),
  max_redemptions integer null check (max_redemptions is null or max_redemptions > 0),
  requires_revenuecat_sync boolean not null default true,
  active boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workshop_codes_normalized_code check (code = upper(btrim(code)) and btrim(code) <> '')
);

create index if not exists workshop_codes_active_idx
  on public.workshop_codes (active, starts_at, ends_at);

create table if not exists public.user_access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  access_key text not null,
  source_type text not null check (source_type in ('workshop_code', 'revenuecat', 'admin', 'legacy_trial')),
  source_id uuid null,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked', 'scheduled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_access_grants_user_idx
  on public.user_access_grants (user_id, access_key, status);

create index if not exists user_access_grants_active_window_idx
  on public.user_access_grants (user_id, starts_at, ends_at);

create table if not exists public.workshop_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  workshop_code_id uuid not null references public.workshop_codes (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  access_grant_id uuid null references public.user_access_grants (id) on delete set null,
  signup_method text null check (signup_method is null or signup_method in ('email', 'google', 'apple', 'unknown')),
  request_status text not null default 'redeemed' check (request_status in ('pending', 'redeemed', 'rejected', 'sync_pending', 'sync_failed')),
  revenuecat_sync_status text not null default 'pending' check (revenuecat_sync_status in ('pending', 'synced', 'failed', 'not_required')),
  revenuecat_sync_error text null,
  requested_at timestamptz not null default now(),
  redeemed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workshop_code_id, user_id)
);

create index if not exists workshop_code_redemptions_user_idx
  on public.workshop_code_redemptions (user_id, request_status, revenuecat_sync_status);

create table if not exists public.revenuecat_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  app_user_id text not null unique,
  original_app_user_id text null,
  aliases jsonb not null default '[]'::jsonb,
  last_seen_at timestamptz null,
  last_synced_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenuecat_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  app_user_id text not null,
  original_app_user_id text null,
  environment text null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  processing_error text null
);

create index if not exists revenuecat_events_app_user_idx
  on public.revenuecat_events (app_user_id, received_at desc);

drop trigger if exists workshop_codes_set_updated_at on public.workshop_codes;
create trigger workshop_codes_set_updated_at
before update on public.workshop_codes
for each row execute function public.set_updated_at();

drop trigger if exists user_access_grants_set_updated_at on public.user_access_grants;
create trigger user_access_grants_set_updated_at
before update on public.user_access_grants
for each row execute function public.set_updated_at();

drop trigger if exists workshop_code_redemptions_set_updated_at on public.workshop_code_redemptions;
create trigger workshop_code_redemptions_set_updated_at
before update on public.workshop_code_redemptions
for each row execute function public.set_updated_at();

drop trigger if exists revenuecat_customers_set_updated_at on public.revenuecat_customers;
create trigger revenuecat_customers_set_updated_at
before update on public.revenuecat_customers
for each row execute function public.set_updated_at();

alter table public.workshop_codes enable row level security;
alter table public.user_access_grants enable row level security;
alter table public.workshop_code_redemptions enable row level security;
alter table public.revenuecat_customers enable row level security;
alter table public.revenuecat_events enable row level security;

create policy workshop_codes_manage
  on public.workshop_codes
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

create policy user_access_grants_access
  on public.user_access_grants
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

create policy workshop_code_redemptions_access
  on public.workshop_code_redemptions
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

create policy revenuecat_customers_access
  on public.revenuecat_customers
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

create policy revenuecat_events_manage
  on public.revenuecat_events
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

create or replace function public.redeem_workshop_code(
  input_code text,
  input_signup_method text default null
)
returns table (
  status text,
  access_key text,
  trial_days integer,
  starts_at timestamptz,
  ends_at timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_code text := upper(btrim(coalesce(input_code, '')));
  current_timestamp_utc timestamptz := now();
  code_row public.workshop_codes%rowtype;
  existing_redemption public.workshop_code_redemptions%rowtype;
  existing_grant public.user_access_grants%rowtype;
  redemption_count integer := 0;
  created_grant_id uuid;
  grant_start timestamptz;
  grant_end timestamptz;
  sync_status text;
begin
  if current_user_id is null then
    return query
    select 'unauthenticated', null::text, null::integer, null::timestamptz, null::timestamptz, 'User is not authenticated.';
    return;
  end if;

  if normalized_code = '' then
    return query
    select 'invalid', null::text, null::integer, null::timestamptz, null::timestamptz, 'Workshop code is missing.';
    return;
  end if;

  select *
  into code_row
  from public.workshop_codes
  where code = normalized_code
  limit 1;

  if not found then
    return query
    select 'invalid', null::text, null::integer, null::timestamptz, null::timestamptz, 'Workshop code is invalid.';
    return;
  end if;

  if not code_row.active then
    return query
    select 'inactive', code_row.entitlement_key, code_row.trial_days, null::timestamptz, null::timestamptz, 'Workshop code is inactive.';
    return;
  end if;

  if code_row.starts_at is not null and current_timestamp_utc < code_row.starts_at then
    return query
    select 'inactive', code_row.entitlement_key, code_row.trial_days, null::timestamptz, null::timestamptz, 'Workshop code is not active yet.';
    return;
  end if;

  if code_row.ends_at is not null and current_timestamp_utc > code_row.ends_at then
    return query
    select 'expired', code_row.entitlement_key, code_row.trial_days, null::timestamptz, null::timestamptz, 'Workshop code has expired.';
    return;
  end if;

  select *
  into existing_redemption
  from public.workshop_code_redemptions
  where workshop_code_id = code_row.id
    and user_id = current_user_id
  limit 1;

  if found and existing_redemption.access_grant_id is not null then
    select *
    into existing_grant
    from public.user_access_grants
    where id = existing_redemption.access_grant_id
    limit 1;

    return query
    select
      'already_redeemed',
      coalesce(existing_grant.access_key, code_row.entitlement_key),
      code_row.trial_days,
      existing_grant.starts_at,
      existing_grant.ends_at,
      'Workshop code was already redeemed by this user.';
    return;
  end if;

  if code_row.max_redemptions is not null then
    select count(*)
    into redemption_count
    from public.workshop_code_redemptions
    where workshop_code_id = code_row.id
      and request_status in ('redeemed', 'sync_pending', 'sync_failed');

    if redemption_count >= code_row.max_redemptions then
      return query
      select 'limit_reached', code_row.entitlement_key, code_row.trial_days, null::timestamptz, null::timestamptz, 'Workshop code redemption limit reached.';
      return;
    end if;
  end if;

  grant_start := current_timestamp_utc;
  grant_end := current_timestamp_utc + make_interval(days => code_row.trial_days);
  sync_status := case when code_row.requires_revenuecat_sync then 'pending' else 'not_required' end;

  insert into public.user_access_grants (
    user_id,
    access_key,
    source_type,
    source_id,
    status,
    starts_at,
    ends_at,
    metadata
  )
  values (
    current_user_id,
    code_row.entitlement_key,
    'workshop_code',
    code_row.id,
    'active',
    grant_start,
    grant_end,
    jsonb_build_object(
      'workshop_code', code_row.code,
      'trial_days', code_row.trial_days,
      'signup_method', coalesce(input_signup_method, 'unknown'),
      'requires_revenuecat_sync', code_row.requires_revenuecat_sync
    )
  )
  returning id into created_grant_id;

  insert into public.workshop_code_redemptions (
    workshop_code_id,
    user_id,
    access_grant_id,
    signup_method,
    request_status,
    revenuecat_sync_status,
    requested_at,
    redeemed_at
  )
  values (
    code_row.id,
    current_user_id,
    created_grant_id,
    case
      when input_signup_method in ('email', 'google', 'apple', 'unknown') then input_signup_method
      else 'unknown'
    end,
    case when code_row.requires_revenuecat_sync then 'sync_pending' else 'redeemed' end,
    sync_status,
    current_timestamp_utc,
    current_timestamp_utc
  )
  on conflict (workshop_code_id, user_id) do update
  set
    access_grant_id = excluded.access_grant_id,
    signup_method = excluded.signup_method,
    request_status = excluded.request_status,
    revenuecat_sync_status = excluded.revenuecat_sync_status,
    revenuecat_sync_error = null,
    requested_at = excluded.requested_at,
    redeemed_at = excluded.redeemed_at,
    updated_at = now();

  return query
  select
    'redeemed',
    code_row.entitlement_key,
    code_row.trial_days,
    grant_start,
    grant_end,
    'Workshop code redeemed successfully.';
end;
$$;

create or replace function public.get_my_access_state()
returns table (
  has_access boolean,
  access_key text,
  source_type text,
  active_until timestamptz,
  paywall_required boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with active_grant as (
    select
      g.access_key,
      g.source_type,
      g.ends_at
    from public.user_access_grants g
    where g.user_id = auth.uid()
      and g.status = 'active'
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
    order by g.ends_at asc nulls last, g.created_at asc
    limit 1
  )
  select
    exists(select 1 from active_grant) as has_access,
    (select access_key from active_grant) as access_key,
    (select source_type from active_grant) as source_type,
    (select ends_at from active_grant) as active_until,
    not exists(select 1 from active_grant) as paywall_required;
$$;

grant execute on function public.redeem_workshop_code(text, text)
to authenticated, service_role;

grant execute on function public.get_my_access_state()
to authenticated, service_role;
