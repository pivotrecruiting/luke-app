# Initialer DB-Schema Draft (MVP)

Hinweis: Basis-Tabellen sind vorgegeben und nicht Teil dieses Drafts:
- `public.users` (FK auf `auth.users`)
- `public.roles`
- `public.user_roles`
- Trigger-Funktion: erzeugt/aktualisiert `public.users`, weist Rolle `client` zu

## Optional: Enums (schlank, MVP)

```sql
create type public.currency_code as enum ('EUR', 'USD', 'CHF');
create type public.transaction_type as enum ('income', 'expense');
create type public.contribution_type as enum ('deposit', 'repayment');
```

## Tabellen (neue Modelle)

```sql
-- Onboarding Status
create table public.user_onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  onboarding_version text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  skipped_steps jsonb null
);

-- Motivationen (Lookup)
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

-- Financial Profile (Default Currency + Initial Savings)
create table public.user_financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  initial_savings_cents integer not null default 0,
  currency public.currency_code not null default 'EUR',
  as_of_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recurring Income Sources (monatlich)
create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  frequency text not null default 'monthly',
  currency public.currency_code not null default 'EUR',
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recurring Fixed Expenses (monatlich)
create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  frequency text not null default 'monthly',
  currency public.currency_code not null default 'EUR',
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Budget Categories (Lookup)
create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  icon text null,
  color text null,
  active boolean not null default true
);

-- Budgets
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category_id uuid not null references public.budget_categories (id),
  name text not null,
  limit_amount_cents integer not null check (limit_amount_cents >= 0),
  period text not null default 'monthly',
  currency public.currency_code not null default 'EUR',
  start_date date null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Income Categories (Lookup)
create table public.income_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  icon text null,
  active boolean not null default true
);

-- Transactions (variable income/expense)
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
  -- optionaler Constraint spaeter:
  -- check (
  --   (type = 'income' and income_category_id is not null)
  --   or
  --   (type = 'expense' and (budget_category_id is not null or category_name is not null))
  -- )
);

create index transactions_user_time_idx on public.transactions (user_id, transaction_at);
create index transactions_user_type_idx on public.transactions (user_id, type);
create index transactions_budget_idx on public.transactions (budget_id);
create index transactions_budget_category_idx on public.transactions (budget_category_id);

-- Goals
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

-- Goal Contributions (Einzahlungen/Rueckzahlungen)
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
```

## Ableitungen (Views/Queries statt Persistenz)

- `budget_current` = Summe `transactions.amount_cents` pro `budget_id` in aktuellem Monat
- `goal_current` = Summe `goal_contributions.amount_cents` pro `goal_id`
- `goal_remaining` = `target_amount_cents - goal_current`

## Offene ToDos (spaeter)

- RLS Policies fuer alle neuen Tabellen (Nutzerduerfen nur eigene Daten sehen)
- Optional: `currencies` Lookup statt Enum
- Optional: `fx_rates` falls Multi-Currency pro Eintrag spaeter genutzt wird

