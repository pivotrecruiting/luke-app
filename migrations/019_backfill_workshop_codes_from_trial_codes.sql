-- Backfill legacy trial codes into the new RevenueCat-ready workshop code model

insert into public.workshop_codes (
  code,
  entitlement_key,
  trial_days,
  max_redemptions,
  requires_revenuecat_sync,
  active,
  starts_at,
  ends_at,
  metadata
)
select
  tc.code,
  'pro',
  tc.trial_days,
  tc.max_redemptions,
  true,
  tc.active,
  tc.starts_at,
  tc.ends_at,
  jsonb_build_object(
    'migrated_from', 'trial_codes',
    'legacy_trial_code_id', tc.id
  )
from public.trial_codes tc
on conflict (code) do nothing;
