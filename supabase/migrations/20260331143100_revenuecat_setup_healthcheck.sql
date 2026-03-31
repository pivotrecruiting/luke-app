create or replace function public.get_revenuecat_setup_status()
returns table (
  has_billing_config boolean,
  active_billing_products integer,
  ios_mapping_count integer,
  android_mapping_count integer,
  missing_product_keys text[],
  missing_ios_product_keys text[],
  missing_android_product_keys text[]
)
language sql
stable
security definer
set search_path = public
as $$
  with expected_products as (
    select unnest(array['monthly', 'yearly', 'lifetime']) as product_key
  ),
  active_products as (
    select bp.product_key
    from public.billing_products bp
    where bp.active = true
  ),
  ios_mappings as (
    select bp.product_key
    from public.billing_product_store_mappings m
    join public.billing_products bp
      on bp.id = m.billing_product_id
    where m.active = true
      and m.platform = 'ios'
  ),
  android_mappings as (
    select bp.product_key
    from public.billing_product_store_mappings m
    join public.billing_products bp
      on bp.id = m.billing_product_id
    where m.active = true
      and m.platform = 'android'
  )
  select
    exists(
      select 1
      from public.billing_config
      where config_key = 'default'
    ) as has_billing_config,
    (select count(*)::integer from active_products) as active_billing_products,
    (select count(*)::integer from ios_mappings) as ios_mapping_count,
    (select count(*)::integer from android_mappings) as android_mapping_count,
    coalesce((
      select array_agg(ep.product_key order by ep.product_key)
      from expected_products ep
      where not exists (
        select 1
        from active_products ap
        where ap.product_key = ep.product_key
      )
    ), '{}'::text[]) as missing_product_keys,
    coalesce((
      select array_agg(ep.product_key order by ep.product_key)
      from expected_products ep
      where not exists (
        select 1
        from ios_mappings im
        where im.product_key = ep.product_key
      )
    ), '{}'::text[]) as missing_ios_product_keys,
    coalesce((
      select array_agg(ep.product_key order by ep.product_key)
      from expected_products ep
      where not exists (
        select 1
        from android_mappings am
        where am.product_key = ep.product_key
      )
    ), '{}'::text[]) as missing_android_product_keys;
$$;

grant execute on function public.get_revenuecat_setup_status()
to authenticated, service_role;
