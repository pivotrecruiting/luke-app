-- Add vault transaction history and month anchor for monthly balance rollover.

alter table public.user_financial_profiles
  add column if not exists balance_anchor_month date;

update public.user_financial_profiles
set balance_anchor_month = date_trunc('month', now())::date
where balance_anchor_month is null;

create table if not exists public.vault_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  amount_cents integer not null check (amount_cents <> 0),
  currency public.currency_code not null,
  entry_type text not null check (entry_type in ('monthly_rollover', 'manual_deposit', 'goal_deposit')),
  note text null,
  goal_id uuid null references public.goals (id) on delete set null,
  rollover_month date null,
  transaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      entry_type = 'monthly_rollover'
      and rollover_month is not null
    )
    or (
      entry_type <> 'monthly_rollover'
      and rollover_month is null
    )
  )
);

create index if not exists vault_transactions_user_time_idx
  on public.vault_transactions (user_id, transaction_at desc);

create unique index if not exists vault_transactions_monthly_rollover_unique_idx
  on public.vault_transactions (user_id, entry_type, rollover_month)
  where entry_type = 'monthly_rollover';

alter table public.vault_transactions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vault_transactions'
      and policyname = 'vault_transactions_access'
  ) then
    create policy vault_transactions_access
      on public.vault_transactions
      for all
      using (
        auth.role() = 'service_role'
        or user_id = auth.uid()
        or public.has_role('admin')
      )
      with check (
        auth.role() = 'service_role'
        or user_id = auth.uid()
        or public.has_role('admin')
      );
  end if;
end
$$;
