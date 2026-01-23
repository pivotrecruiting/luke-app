-- Billing schema (Stripe, MVP)

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  livemode boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  stripe_product_id text not null,
  stripe_price_id text not null unique,
  price_amount_cents integer not null check (price_amount_cents >= 0),
  currency public.currency_code not null,
  billing_interval text not null check (billing_interval in ('monthly', 'yearly', 'one_time')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.trial_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trial_days integer not null check (trial_days > 0),
  max_redemptions integer null,
  active boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz null,
  current_period_end timestamptz null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz null,
  trial_start timestamptz null,
  trial_end timestamptz null,
  trial_code_id uuid null references public.trial_codes (id) on delete set null,
  livemode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  stripe_price_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency public.currency_code not null,
  status text not null,
  livemode boolean not null default false,
  created_at timestamptz not null default now()
);

create index purchases_user_idx on public.purchases (user_id);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  entitlement_key text not null,
  status text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  created_at timestamptz not null default now()
);

create index entitlements_user_idx on public.entitlements (user_id);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  livemode boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.trial_redemptions (
  id uuid primary key default gen_random_uuid(),
  trial_code_id uuid not null references public.trial_codes (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  stripe_subscription_id text null,
  redeemed_at timestamptz not null default now(),
  unique (trial_code_id, user_id)
);
