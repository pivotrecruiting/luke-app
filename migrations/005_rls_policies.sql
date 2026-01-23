-- Enable RLS and define policies

-- users
alter table public.users enable row level security;

create policy users_select_own
  on public.users
  for select
  using (auth.role() = 'service_role' or id = auth.uid() or public.has_role('admin'));

create policy users_update_own
  on public.users
  for update
  using (auth.role() = 'service_role' or id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or id = auth.uid() or public.has_role('admin'));

create policy users_insert_own
  on public.users
  for insert
  with check (auth.role() = 'service_role' or id = auth.uid());

create policy users_delete_service
  on public.users
  for delete
  using (auth.role() = 'service_role');

-- roles (avoid has_role recursion)
alter table public.roles enable row level security;

create policy roles_select
  on public.roles
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy roles_manage_service
  on public.roles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- user_roles (avoid has_role recursion)
alter table public.user_roles enable row level security;

create policy user_roles_select_own
  on public.user_roles
  for select
  using (auth.role() = 'service_role' or user_id = auth.uid());

create policy user_roles_manage_service
  on public.user_roles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- user_onboarding
alter table public.user_onboarding enable row level security;

create policy user_onboarding_access
  on public.user_onboarding
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- motivation_types (lookup)
alter table public.motivation_types enable row level security;

create policy motivation_types_select
  on public.motivation_types
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy motivation_types_manage
  on public.motivation_types
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

-- user_motivations
alter table public.user_motivations enable row level security;

create policy user_motivations_access
  on public.user_motivations
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- user_financial_profiles
alter table public.user_financial_profiles enable row level security;

create policy user_financial_profiles_access
  on public.user_financial_profiles
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- income_sources
alter table public.income_sources enable row level security;

create policy income_sources_access
  on public.income_sources
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- fixed_expenses
alter table public.fixed_expenses enable row level security;

create policy fixed_expenses_access
  on public.fixed_expenses
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- budget_categories (lookup)
alter table public.budget_categories enable row level security;

create policy budget_categories_select
  on public.budget_categories
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy budget_categories_manage
  on public.budget_categories
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

-- budgets
alter table public.budgets enable row level security;

create policy budgets_access
  on public.budgets
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- income_categories (lookup)
alter table public.income_categories enable row level security;

create policy income_categories_select
  on public.income_categories
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy income_categories_manage
  on public.income_categories
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

-- transactions
alter table public.transactions enable row level security;

create policy transactions_access
  on public.transactions
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- goals
alter table public.goals enable row level security;

create policy goals_access
  on public.goals
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- goal_contributions
alter table public.goal_contributions enable row level security;

create policy goal_contributions_access
  on public.goal_contributions
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- billing_customers
alter table public.billing_customers enable row level security;

create policy billing_customers_access
  on public.billing_customers
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- subscription_plans (lookup)
alter table public.subscription_plans enable row level security;

create policy subscription_plans_select
  on public.subscription_plans
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy subscription_plans_manage
  on public.subscription_plans
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

-- trial_codes (admin/service only)
alter table public.trial_codes enable row level security;

create policy trial_codes_manage
  on public.trial_codes
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

-- subscriptions
alter table public.subscriptions enable row level security;

create policy subscriptions_access
  on public.subscriptions
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- purchases
alter table public.purchases enable row level security;

create policy purchases_access
  on public.purchases
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- entitlements
alter table public.entitlements enable row level security;

create policy entitlements_access
  on public.entitlements
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- payment_events (admin/service only)
alter table public.payment_events enable row level security;

create policy payment_events_manage
  on public.payment_events
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

-- trial_redemptions
alter table public.trial_redemptions enable row level security;

create policy trial_redemptions_access
  on public.trial_redemptions
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- user_settings
alter table public.user_settings enable row level security;

create policy user_settings_access
  on public.user_settings
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- levels (lookup)
alter table public.levels enable row level security;

create policy levels_select
  on public.levels
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy levels_manage
  on public.levels
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

-- user_progress
alter table public.user_progress enable row level security;

create policy user_progress_access
  on public.user_progress
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

-- xp_events
alter table public.xp_events enable row level security;

create policy xp_events_access
  on public.xp_events
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));
