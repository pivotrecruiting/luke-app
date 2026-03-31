-- Replace legacy Stripe billing tables with a RevenueCat-oriented product catalog

do $$
declare
  has_rows boolean;
begin
  if to_regclass('public.billing_customers') is not null then
    execute 'select exists(select 1 from public.billing_customers limit 1)' into has_rows;
    if has_rows then
      raise exception 'Legacy table public.billing_customers still contains data. Migration aborted.';
    end if;
  end if;

  if to_regclass('public.subscriptions') is not null then
    execute 'select exists(select 1 from public.subscriptions limit 1)' into has_rows;
    if has_rows then
      raise exception 'Legacy table public.subscriptions still contains data. Migration aborted.';
    end if;
  end if;

  if to_regclass('public.purchases') is not null then
    execute 'select exists(select 1 from public.purchases limit 1)' into has_rows;
    if has_rows then
      raise exception 'Legacy table public.purchases still contains data. Migration aborted.';
    end if;
  end if;

  if to_regclass('public.entitlements') is not null then
    execute 'select exists(select 1 from public.entitlements limit 1)' into has_rows;
    if has_rows then
      raise exception 'Legacy table public.entitlements still contains data. Migration aborted.';
    end if;
  end if;

  if to_regclass('public.payment_events') is not null then
    execute 'select exists(select 1 from public.payment_events limit 1)' into has_rows;
    if has_rows then
      raise exception 'Legacy table public.payment_events still contains data. Migration aborted.';
    end if;
  end if;

  if to_regclass('public.trial_codes') is not null then
    execute 'select exists(select 1 from public.trial_codes limit 1)' into has_rows;
    if has_rows then
      raise exception 'Legacy table public.trial_codes still contains data. Migration aborted.';
    end if;
  end if;

  if to_regclass('public.trial_redemptions') is not null then
    execute 'select exists(select 1 from public.trial_redemptions limit 1)' into has_rows;
    if has_rows then
      raise exception 'Legacy table public.trial_redemptions still contains data. Migration aborted.';
    end if;
  end if;
end;
$$;

create table if not exists public.billing_products (
  id uuid primary key default gen_random_uuid(),
  product_key text not null unique,
  display_name text not null,
  entitlement_key text not null default 'pro',
  product_type text not null check (product_type in ('subscription', 'one_time')),
  billing_interval text not null check (billing_interval in ('monthly', 'yearly', 'lifetime')),
  price_amount_cents integer not null check (price_amount_cents >= 0),
  currency public.currency_code not null,
  sort_order integer not null default 100,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_products_key_normalized check (product_key = lower(btrim(product_key)) and btrim(product_key) <> '')
);

drop trigger if exists billing_products_set_updated_at on public.billing_products;
create trigger billing_products_set_updated_at
before update on public.billing_products
for each row execute function public.set_updated_at();

alter table public.billing_products enable row level security;

drop policy if exists billing_products_select on public.billing_products;
create policy billing_products_select
  on public.billing_products
  for select
  using (auth.role() in ('authenticated', 'service_role'));

drop policy if exists billing_products_manage on public.billing_products;
create policy billing_products_manage
  on public.billing_products
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

create table if not exists public.billing_product_store_mappings (
  id uuid primary key default gen_random_uuid(),
  billing_product_id uuid not null references public.billing_products (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  store_product_id text not null,
  revenuecat_entitlement_id text not null default 'pro',
  revenuecat_offering_id text not null default 'default',
  revenuecat_package_identifier text not null check (
    revenuecat_package_identifier in ('$rc_monthly', '$rc_annual', '$rc_lifetime', '$rc_custom')
  ),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, store_product_id),
  unique (billing_product_id, platform)
);

drop trigger if exists billing_product_store_mappings_set_updated_at on public.billing_product_store_mappings;
create trigger billing_product_store_mappings_set_updated_at
before update on public.billing_product_store_mappings
for each row execute function public.set_updated_at();

alter table public.billing_product_store_mappings enable row level security;

drop policy if exists billing_product_store_mappings_select on public.billing_product_store_mappings;
create policy billing_product_store_mappings_select
  on public.billing_product_store_mappings
  for select
  using (auth.role() in ('authenticated', 'service_role'));

drop policy if exists billing_product_store_mappings_manage on public.billing_product_store_mappings;
create policy billing_product_store_mappings_manage
  on public.billing_product_store_mappings
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

do $$
begin
  if to_regclass('public.subscription_plans') is not null then
    insert into public.billing_products (
      product_key,
      display_name,
      entitlement_key,
      product_type,
      billing_interval,
      price_amount_cents,
      currency,
      sort_order,
      active,
      metadata
    )
    select
      sp.code,
      sp.name,
      'pro',
      case
        when sp.billing_interval = 'one_time' then 'one_time'
        else 'subscription'
      end,
      case
        when sp.billing_interval = 'one_time' then 'lifetime'
        else sp.billing_interval
      end,
      sp.price_amount_cents,
      sp.currency,
      case
        when sp.code = 'monthly' then 10
        when sp.code = 'yearly' then 20
        when sp.code = 'lifetime' then 30
        else 100
      end,
      sp.active,
      jsonb_strip_nulls(
        jsonb_build_object(
          'migrated_from', 'subscription_plans',
          'legacy_stripe_product_id', nullif(sp.stripe_product_id, ''),
          'legacy_stripe_price_id', nullif(sp.stripe_price_id, '')
        )
      )
    from public.subscription_plans sp
    on conflict (product_key) do update
    set
      display_name = excluded.display_name,
      entitlement_key = excluded.entitlement_key,
      product_type = excluded.product_type,
      billing_interval = excluded.billing_interval,
      price_amount_cents = excluded.price_amount_cents,
      currency = excluded.currency,
      sort_order = excluded.sort_order,
      active = excluded.active,
      metadata = public.billing_products.metadata || excluded.metadata,
      updated_at = now();
  else
    insert into public.billing_products (
      product_key,
      display_name,
      entitlement_key,
      product_type,
      billing_interval,
      price_amount_cents,
      currency,
      sort_order,
      active,
      metadata
    )
    values
      ('monthly', 'Monthly Pro', 'pro', 'subscription', 'monthly', 299, 'EUR', 10, true, '{"seeded_by":"023_replace_legacy_stripe_billing"}'::jsonb),
      ('yearly', 'Yearly Pro', 'pro', 'subscription', 'yearly', 2999, 'EUR', 20, true, '{"seeded_by":"023_replace_legacy_stripe_billing"}'::jsonb),
      ('lifetime', 'Lifetime Pro', 'pro', 'one_time', 'lifetime', 8999, 'EUR', 30, true, '{"seeded_by":"023_replace_legacy_stripe_billing"}'::jsonb)
    on conflict (product_key) do update
    set
      display_name = excluded.display_name,
      entitlement_key = excluded.entitlement_key,
      product_type = excluded.product_type,
      billing_interval = excluded.billing_interval,
      price_amount_cents = excluded.price_amount_cents,
      currency = excluded.currency,
      sort_order = excluded.sort_order,
      active = excluded.active,
      metadata = public.billing_products.metadata || excluded.metadata,
      updated_at = now();
  end if;
end;
$$;

drop table if exists public.billing_customers cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.purchases cascade;
drop table if exists public.entitlements cascade;
drop table if exists public.payment_events cascade;
drop table if exists public.trial_redemptions cascade;
drop table if exists public.trial_codes cascade;
drop table if exists public.subscription_plans cascade;
