-- Default app trial and paywall visibility configuration for RevenueCat flows

create table if not exists public.billing_config (
  config_key text primary key default 'default',
  pro_access_key text not null default 'pro',
  default_trial_days integer not null default 7 check (default_trial_days > 0),
  paywall_show_days_before_expiry integer not null default 3 check (paywall_show_days_before_expiry >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_config_default_key check (config_key = 'default')
);

insert into public.billing_config (
  config_key,
  pro_access_key,
  default_trial_days,
  paywall_show_days_before_expiry
)
values (
  'default',
  'pro',
  7,
  3
)
on conflict (config_key) do nothing;

drop trigger if exists billing_config_set_updated_at on public.billing_config;
create trigger billing_config_set_updated_at
before update on public.billing_config
for each row execute function public.set_updated_at();

alter table public.billing_config enable row level security;

drop policy if exists billing_config_select on public.billing_config;
create policy billing_config_select
  on public.billing_config
  for select
  using (auth.role() in ('authenticated', 'service_role'));

drop policy if exists billing_config_manage on public.billing_config;
create policy billing_config_manage
  on public.billing_config
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

alter table public.user_access_grants
  drop constraint if exists user_access_grants_source_type_check;

alter table public.user_access_grants
  add constraint user_access_grants_source_type_check
  check (
    source_type in ('workshop_code', 'revenuecat', 'admin', 'legacy_trial', 'app_trial')
  );

create unique index if not exists user_access_grants_one_app_trial_per_user_idx
  on public.user_access_grants (user_id)
  where source_type = 'app_trial';

create or replace function public.get_billing_config()
returns table (
  pro_access_key text,
  default_trial_days integer,
  paywall_show_days_before_expiry integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.pro_access_key,
    c.default_trial_days,
    c.paywall_show_days_before_expiry
  from public.billing_config c
  where c.config_key = 'default'
  limit 1;
$$;

create or replace function public.ensure_default_app_trial()
returns table (
  status text,
  access_key text,
  starts_at timestamptz,
  ends_at timestamptz,
  paywall_visible_from timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  config_row public.billing_config%rowtype;
  existing_trial public.user_access_grants%rowtype;
  existing_paid_access public.user_access_grants%rowtype;
  grant_start timestamptz := now();
  grant_end timestamptz;
  paywall_from timestamptz;
begin
  if current_user_id is null then
    return query
    select
      'unauthenticated'::text,
      null::text,
      null::timestamptz,
      null::timestamptz,
      null::timestamptz,
      'User is not authenticated.'::text;
    return;
  end if;

  select *
  into config_row
  from public.billing_config
  where config_key = 'default'
  limit 1;

  if not found then
    return query
    select
      'missing_config'::text,
      null::text,
      null::timestamptz,
      null::timestamptz,
      null::timestamptz,
      'Billing config is missing.'::text;
    return;
  end if;

  select *
  into existing_paid_access
  from public.user_access_grants g
  where g.user_id = current_user_id
    and g.status = 'active'
    and g.starts_at <= now()
    and (g.ends_at is null or g.ends_at > now())
    and g.source_type not in ('app_trial', 'legacy_trial')
  order by
    case when g.ends_at is null then 0 else 1 end,
    g.ends_at desc,
    g.created_at asc
  limit 1;

  if found then
    return query
    select
      'access_exists'::text,
      existing_paid_access.access_key,
      existing_paid_access.starts_at,
      existing_paid_access.ends_at,
      null::timestamptz,
      'User already has a non-trial access grant.'::text;
    return;
  end if;

  select *
  into existing_trial
  from public.user_access_grants g
  where g.user_id = current_user_id
    and g.source_type in ('app_trial', 'legacy_trial')
  order by g.created_at asc
  limit 1;

  if found then
    return query
    select
      'already_granted'::text,
      existing_trial.access_key,
      existing_trial.starts_at,
      existing_trial.ends_at,
      coalesce(
        (existing_trial.metadata ->> 'paywall_visible_from')::timestamptz,
        case
          when existing_trial.ends_at is null then null::timestamptz
          else existing_trial.ends_at - make_interval(days => config_row.paywall_show_days_before_expiry)
        end
      ),
      'User already received the default trial.'::text;
    return;
  end if;

  grant_end := grant_start + make_interval(days => config_row.default_trial_days);
  paywall_from := grant_end - make_interval(days => config_row.paywall_show_days_before_expiry);

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
    config_row.pro_access_key,
    'app_trial',
    null,
    'active',
    grant_start,
    grant_end,
    jsonb_build_object(
      'trial_days', config_row.default_trial_days,
      'paywall_visible_from', paywall_from,
      'granted_by', 'billing_config.default'
    )
  );

  return query
  select
    'created'::text,
    config_row.pro_access_key,
    grant_start,
    grant_end,
    paywall_from,
    'Default app trial granted successfully.'::text;
end;
$$;

drop function if exists public.get_my_access_state();

create function public.get_my_access_state()
returns table (
  has_access boolean,
  access_key text,
  source_type text,
  active_until timestamptz,
  paywall_required boolean,
  trial_ends_at timestamptz,
  paywall_visible_from timestamptz,
  paywall_visible boolean,
  days_until_expiry integer
)
language sql
stable
security definer
set search_path = public
as $$
  with config as (
    select
      c.pro_access_key,
      c.default_trial_days,
      c.paywall_show_days_before_expiry
    from public.billing_config c
    where c.config_key = 'default'
    limit 1
  ),
  active_paid_grant as (
    select
      g.access_key,
      g.source_type,
      g.ends_at
    from public.user_access_grants g
  where g.user_id = auth.uid()
      and g.status = 'active'
      and g.starts_at <= now()
      and (g.ends_at is null or g.ends_at > now())
      and g.source_type not in ('app_trial', 'legacy_trial')
    order by
      case when g.ends_at is null then 0 else 1 end,
      g.ends_at desc,
      g.created_at asc
    limit 1
  ),
  active_trial_grant as (
    select
      g.access_key,
      g.source_type,
      g.ends_at,
      coalesce(
        (g.metadata ->> 'paywall_visible_from')::timestamptz,
        g.ends_at - make_interval(days => coalesce((select paywall_show_days_before_expiry from config), 3))
      ) as paywall_visible_from
    from public.user_access_grants g
    where g.user_id = auth.uid()
      and g.status = 'active'
      and g.starts_at <= now()
      and g.ends_at > now()
      and g.source_type in ('app_trial', 'legacy_trial')
    order by g.created_at asc
    limit 1
  ),
  effective_grant as (
    select
      p.access_key,
      p.source_type,
      p.ends_at
    from active_paid_grant p
    union all
    select
      t.access_key,
      t.source_type,
      t.ends_at
    from active_trial_grant t
    where not exists(select 1 from active_paid_grant)
    limit 1
  )
  select
    exists(select 1 from effective_grant) as has_access,
    (select access_key from effective_grant) as access_key,
    (select source_type from effective_grant) as source_type,
    (select ends_at from effective_grant) as active_until,
    (
      (
        exists(select 1 from active_trial_grant)
        and not exists(select 1 from active_paid_grant)
        and now() >= (select paywall_visible_from from active_trial_grant)
      )
      or (
        not exists(select 1 from active_paid_grant)
        and not exists(select 1 from active_trial_grant)
      )
    ) as paywall_required,
    (select ends_at from active_trial_grant) as trial_ends_at,
    (select paywall_visible_from from active_trial_grant) as paywall_visible_from,
    (
      exists(select 1 from active_trial_grant)
      and not exists(select 1 from active_paid_grant)
      and now() >= (select paywall_visible_from from active_trial_grant)
    ) as paywall_visible,
    case
      when (select ends_at from active_trial_grant) is null then null::integer
      else greatest(
        0,
        ceil(extract(epoch from ((select ends_at from active_trial_grant) - now())) / 86400.0)::integer
      )
    end as days_until_expiry;
$$;

grant execute on function public.get_billing_config()
to authenticated, service_role;

grant execute on function public.ensure_default_app_trial()
to authenticated, service_role;

grant execute on function public.get_my_access_state()
to authenticated, service_role;
