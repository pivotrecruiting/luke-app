-- Seed workshop codes for local development and testing

insert into public.workshop_codes (
  code,
  entitlement_key,
  trial_days,
  max_redemptions,
  requires_revenuecat_sync,
  active,
  metadata
)
values
  (
    'WORKSHOP-7D',
    'pro',
    7,
    null,
    true,
    true,
    jsonb_build_object(
      'label', 'Workshop Trial 7 Days',
      'seed_source', '020_seed_workshop_codes'
    )
  ),
  (
    'WORKSHOP-14D',
    'pro',
    14,
    null,
    true,
    true,
    jsonb_build_object(
      'label', 'Workshop Trial 14 Days',
      'seed_source', '020_seed_workshop_codes'
    )
  ),
  (
    'WORKSHOP-21D',
    'pro',
    21,
    null,
    true,
    true,
    jsonb_build_object(
      'label', 'Workshop Trial 21 Days',
      'seed_source', '020_seed_workshop_codes'
    )
  )
on conflict (code) do update
set
  entitlement_key = excluded.entitlement_key,
  trial_days = excluded.trial_days,
  max_redemptions = excluded.max_redemptions,
  requires_revenuecat_sync = excluded.requires_revenuecat_sync,
  active = excluded.active,
  metadata = excluded.metadata,
  updated_at = now();
