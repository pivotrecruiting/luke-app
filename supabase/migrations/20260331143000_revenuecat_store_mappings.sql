-- iOS-only RevenueCat store mappings for the current rollout.
-- Android will be added later in a separate migration.

do $$
declare
  ios_monthly_product_id text := 'monthly_1';
  ios_yearly_product_id text := 'yearly_1';
  ios_lifetime_product_id text := 'lifetime_1';
  monthly_billing_product_id uuid;
  yearly_billing_product_id uuid;
  lifetime_billing_product_id uuid;
begin
  if ios_monthly_product_id like '__FILL_%'
    or ios_yearly_product_id like '__FILL_%'
    or ios_lifetime_product_id like '__FILL_%'
  then
    raise exception 'Replace all __FILL_*__ placeholders in supabase/migrations/20260331143000_revenuecat_store_mappings.sql before running it.';
  end if;

  select id
  into monthly_billing_product_id
  from public.billing_products
  where product_key = 'monthly'
  limit 1;

  select id
  into yearly_billing_product_id
  from public.billing_products
  where product_key = 'yearly'
  limit 1;

  select id
  into lifetime_billing_product_id
  from public.billing_products
  where product_key = 'lifetime'
  limit 1;

  if monthly_billing_product_id is null
    or yearly_billing_product_id is null
    or lifetime_billing_product_id is null
  then
    raise exception 'billing_products must contain monthly, yearly, and lifetime rows before this migration runs.';
  end if;

  insert into public.billing_product_store_mappings (
    billing_product_id,
    platform,
    store_product_id,
    revenuecat_entitlement_id,
    revenuecat_offering_id,
    revenuecat_package_identifier,
    active,
    metadata
  )
  values
    (
      monthly_billing_product_id,
      'ios',
      ios_monthly_product_id,
      'pro',
      'default',
      '$rc_monthly',
      true,
      '{"created_by":"supabase_migration","product_key":"monthly"}'::jsonb
    ),
    (
      yearly_billing_product_id,
      'ios',
      ios_yearly_product_id,
      'pro',
      'default',
      '$rc_annual',
      true,
      '{"created_by":"supabase_migration","product_key":"yearly"}'::jsonb
    ),
    (
      lifetime_billing_product_id,
      'ios',
      ios_lifetime_product_id,
      'pro',
      'default',
      '$rc_lifetime',
      true,
      '{"created_by":"supabase_migration","product_key":"lifetime"}'::jsonb
    )
  on conflict (billing_product_id, platform) do update
  set
    store_product_id = excluded.store_product_id,
    revenuecat_entitlement_id = excluded.revenuecat_entitlement_id,
    revenuecat_offering_id = excluded.revenuecat_offering_id,
    revenuecat_package_identifier = excluded.revenuecat_package_identifier,
    active = excluded.active,
    metadata = public.billing_product_store_mappings.metadata || excluded.metadata,
    updated_at = now();
end;
$$;
