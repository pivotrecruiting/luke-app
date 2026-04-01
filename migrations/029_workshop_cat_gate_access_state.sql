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
  days_until_expiry integer,
  had_workshop_access boolean
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
  ),
  workshop_history as (
    select exists(
      select 1
      from public.workshop_code_redemptions r
      where r.user_id = auth.uid()
    ) as had_workshop_access
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
    end as days_until_expiry,
    (select had_workshop_access from workshop_history) as had_workshop_access;
$$;

grant execute on function public.get_my_access_state()
to authenticated, service_role;
