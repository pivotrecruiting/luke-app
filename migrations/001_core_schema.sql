-- Core domain schema (MVP)
-- Assumes public.users already exists (managed by auth trigger)

create extension if not exists "pgcrypto";

create type public.currency_code as enum ('EUR', 'USD', 'CHF');
create type public.transaction_type as enum ('income', 'expense');
create type public.contribution_type as enum ('deposit', 'repayment');

create table public.user_onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  onboarding_version text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  skipped_steps jsonb null
);

create table public.motivation_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  active boolean not null default true
);

create table public.user_motivations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  motivation_id uuid not null references public.motivation_types (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, motivation_id)
);

create table public.user_financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  initial_savings_cents integer not null default 0,
  currency public.currency_code not null default 'EUR',
  as_of_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  frequency text not null default 'monthly' check (frequency = 'monthly'),
  currency public.currency_code not null default 'EUR',
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index income_sources_user_idx on public.income_sources (user_id);

create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  frequency text not null default 'monthly' check (frequency = 'monthly'),
  currency public.currency_code not null default 'EUR',
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fixed_expenses_user_idx on public.fixed_expenses (user_id);

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  icon text null,
  color text null,
  active boolean not null default true
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category_id uuid not null references public.budget_categories (id),
  name text not null,
  limit_amount_cents integer not null check (limit_amount_cents >= 0),
  period text not null default 'monthly' check (period = 'monthly'),
  currency public.currency_code not null default 'EUR',
  start_date date null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index budgets_user_idx on public.budgets (user_id);

create table public.income_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  icon text null,
  active boolean not null default true
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type public.transaction_type not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency public.currency_code not null,
  name text not null,
  category_name text null,
  income_category_id uuid null references public.income_categories (id),
  budget_category_id uuid null references public.budget_categories (id),
  budget_id uuid null references public.budgets (id),
  transaction_at timestamptz not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_time_idx on public.transactions (user_id, transaction_at);
create index transactions_user_type_idx on public.transactions (user_id, type);
create index transactions_budget_idx on public.transactions (budget_id);
create index transactions_budget_category_idx on public.transactions (budget_category_id);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  icon text null,
  target_amount_cents integer not null check (target_amount_cents >= 0),
  monthly_contribution_cents integer null,
  status text not null default 'active',
  created_in_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency public.currency_code not null,
  contribution_type public.contribution_type not null,
  contribution_at timestamptz not null,
  transaction_id uuid null references public.transactions (id) on delete set null,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goal_contributions_user_time_idx on public.goal_contributions (user_id, contribution_at);
create index goal_contributions_goal_time_idx on public.goal_contributions (goal_id, contribution_at);
