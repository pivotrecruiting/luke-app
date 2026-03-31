-- Server-authoritative write layer for security-critical finance flows.

create or replace function public.update_my_user_name(
  input_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  trimmed_name text := nullif(btrim(input_name), '');
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_user_row();

  update public.users
  set
    name = trimmed_name,
    updated_at = now()
  where id = current_user_id;
end;
$$;

create or replace function public.upsert_my_user_currency(
  input_currency public.currency_code
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_financial_profiles (user_id, currency)
  values (current_user_id, input_currency)
  on conflict (user_id) do update
  set
    currency = excluded.currency,
    updated_at = now();
end;
$$;

create or replace function public.upsert_my_initial_savings(
  input_amount_cents integer,
  input_currency public.currency_code
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_financial_profiles (
    user_id,
    initial_savings_cents,
    currency
  )
  values (
    current_user_id,
    greatest(input_amount_cents, 0),
    input_currency
  )
  on conflict (user_id) do update
  set
    initial_savings_cents = excluded.initial_savings_cents,
    currency = excluded.currency,
    updated_at = now();
end;
$$;

create or replace function public.upsert_my_balance_anchor_month(
  input_balance_anchor_month text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.user_financial_profiles (
    user_id,
    balance_anchor_month
  )
  values (
    current_user_id,
    nullif(btrim(input_balance_anchor_month), '')
  )
  on conflict (user_id) do update
  set
    balance_anchor_month = excluded.balance_anchor_month,
    updated_at = now();
end;
$$;

create or replace function public.create_my_income_source(
  input_name text,
  input_amount_cents integer,
  input_currency public.currency_code
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_row jsonb;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.income_sources (
    user_id,
    name,
    amount_cents,
    currency
  )
  select
    current_user_id,
    nullif(btrim(input_name), ''),
    greatest(input_amount_cents, 0),
    input_currency
  returning jsonb_build_object(
    'id', id,
    'name', name,
    'amount_cents', amount_cents
  )
  into created_row;

  return created_row;
end;
$$;

create or replace function public.replace_my_income_sources(
  input_entries jsonb,
  input_currency public.currency_code
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  payload jsonb := coalesce(input_entries, '[]'::jsonb);
  result jsonb;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.income_sources
  where user_id = current_user_id;

  if jsonb_typeof(payload) <> 'array' or jsonb_array_length(payload) = 0 then
    return '[]'::jsonb;
  end if;

  with parsed as (
    select
      ordinality,
      nullif(btrim(value->>'name'), '') as name,
      greatest(coalesce((value->>'amount_cents')::integer, 0), 0) as amount_cents
    from jsonb_array_elements(payload) with ordinality as items(value, ordinality)
  ),
  inserted as (
    insert into public.income_sources (
      user_id,
      name,
      amount_cents,
      currency
    )
    select
      current_user_id,
      parsed.name,
      parsed.amount_cents,
      input_currency
    from parsed
    where parsed.name is not null
    returning id, name, amount_cents
  )
  select coalesce(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb)
  into result
  from inserted;

  return result;
end;
$$;

create or replace function public.update_my_income_source(
  input_id uuid,
  input_name text,
  input_amount_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.income_sources
  set
    name = nullif(btrim(input_name), ''),
    amount_cents = greatest(input_amount_cents, 0),
    updated_at = now()
  where id = input_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Income source not found';
  end if;
end;
$$;

create or replace function public.delete_my_income_source(
  input_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.income_sources
  where id = input_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Income source not found';
  end if;
end;
$$;

create or replace function public.create_my_fixed_expense(
  input_name text,
  input_amount_cents integer,
  input_currency public.currency_code
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_row jsonb;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.fixed_expenses (
    user_id,
    name,
    amount_cents,
    currency
  )
  select
    current_user_id,
    nullif(btrim(input_name), ''),
    greatest(input_amount_cents, 0),
    input_currency
  returning jsonb_build_object(
    'id', id,
    'name', name,
    'amount_cents', amount_cents
  )
  into created_row;

  return created_row;
end;
$$;

create or replace function public.replace_my_fixed_expenses(
  input_entries jsonb,
  input_currency public.currency_code
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  payload jsonb := coalesce(input_entries, '[]'::jsonb);
  result jsonb;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.fixed_expenses
  where user_id = current_user_id;

  if jsonb_typeof(payload) <> 'array' or jsonb_array_length(payload) = 0 then
    return '[]'::jsonb;
  end if;

  with parsed as (
    select
      ordinality,
      nullif(btrim(value->>'name'), '') as name,
      greatest(coalesce((value->>'amount_cents')::integer, 0), 0) as amount_cents
    from jsonb_array_elements(payload) with ordinality as items(value, ordinality)
  ),
  inserted as (
    insert into public.fixed_expenses (
      user_id,
      name,
      amount_cents,
      currency
    )
    select
      current_user_id,
      parsed.name,
      parsed.amount_cents,
      input_currency
    from parsed
    where parsed.name is not null
    returning id, name, amount_cents
  )
  select coalesce(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb)
  into result
  from inserted;

  return result;
end;
$$;

create or replace function public.update_my_fixed_expense(
  input_id uuid,
  input_name text,
  input_amount_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.fixed_expenses
  set
    name = nullif(btrim(input_name), ''),
    amount_cents = greatest(input_amount_cents, 0),
    updated_at = now()
  where id = input_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Fixed expense not found';
  end if;
end;
$$;

create or replace function public.delete_my_fixed_expense(
  input_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.fixed_expenses
  where id = input_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Fixed expense not found';
  end if;
end;
$$;

create or replace function public.create_my_goal(
  input_name text,
  input_icon text,
  input_target_amount_cents integer,
  input_monthly_contribution_cents integer default null,
  input_created_in_onboarding boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.goals (
    user_id,
    name,
    icon,
    target_amount_cents,
    monthly_contribution_cents,
    created_in_onboarding
  )
  values (
    current_user_id,
    nullif(btrim(input_name), ''),
    nullif(btrim(input_icon), ''),
    greatest(input_target_amount_cents, 0),
    case
      when input_monthly_contribution_cents is null then null
      else greatest(input_monthly_contribution_cents, 0)
    end,
    coalesce(input_created_in_onboarding, false)
  )
  returning id
  into created_id;

  return created_id;
end;
$$;

create or replace function public.update_my_goal(
  input_goal_id uuid,
  input_name text default null,
  input_icon text default null,
  input_target_amount_cents integer default null,
  input_monthly_contribution_cents integer default null,
  input_clear_monthly_contribution boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.goals
  set
    name = coalesce(nullif(btrim(input_name), ''), name),
    icon = case
      when input_icon is null then icon
      else nullif(btrim(input_icon), '')
    end,
    target_amount_cents = coalesce(greatest(input_target_amount_cents, 0), target_amount_cents),
    monthly_contribution_cents = case
      when input_clear_monthly_contribution then null
      when input_monthly_contribution_cents is null then monthly_contribution_cents
      else greatest(input_monthly_contribution_cents, 0)
    end,
    updated_at = now()
  where id = input_goal_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Goal not found';
  end if;
end;
$$;

create or replace function public.delete_my_goal(
  input_goal_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.goals
  where id = input_goal_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Goal not found';
  end if;
end;
$$;

create or replace function public.create_my_goal_contribution(
  input_goal_id uuid,
  input_amount_cents integer,
  input_currency public.currency_code,
  input_contribution_type public.contribution_type,
  input_contribution_at timestamptz,
  input_transaction_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.goals
    where id = input_goal_id
      and user_id = current_user_id
  ) then
    raise exception 'Goal not found';
  end if;

  if input_transaction_id is not null and not exists (
    select 1
    from public.transactions
    where id = input_transaction_id
      and user_id = current_user_id
  ) then
    raise exception 'Transaction not found';
  end if;

  insert into public.goal_contributions (
    goal_id,
    user_id,
    amount_cents,
    currency,
    contribution_type,
    contribution_at,
    transaction_id
  )
  values (
    input_goal_id,
    current_user_id,
    greatest(input_amount_cents, 0),
    input_currency,
    input_contribution_type,
    input_contribution_at,
    input_transaction_id
  )
  returning id
  into created_id;

  return created_id;
end;
$$;

create or replace function public.update_my_goal_contribution(
  input_id uuid,
  input_amount_cents integer,
  input_contribution_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.goal_contributions
  set
    amount_cents = greatest(input_amount_cents, 0),
    contribution_at = input_contribution_at,
    updated_at = now()
  where id = input_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Goal contribution not found';
  end if;
end;
$$;

create or replace function public.delete_my_goal_contribution(
  input_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.goal_contributions
  where id = input_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Goal contribution not found';
  end if;
end;
$$;

create or replace function public.create_my_budget(
  input_category_id uuid,
  input_name text,
  input_limit_amount_cents integer,
  input_period text,
  input_currency public.currency_code,
  input_is_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.budgets (
    user_id,
    category_id,
    name,
    limit_amount_cents,
    period,
    currency,
    is_active
  )
  values (
    current_user_id,
    input_category_id,
    nullif(btrim(input_name), ''),
    greatest(input_limit_amount_cents, 0),
    coalesce(nullif(btrim(input_period), ''), 'monthly'),
    input_currency,
    coalesce(input_is_active, true)
  )
  returning id
  into created_id;

  return created_id;
end;
$$;

create or replace function public.update_my_budget(
  input_budget_id uuid,
  input_name text default null,
  input_limit_amount_cents integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.budgets
  set
    name = coalesce(nullif(btrim(input_name), ''), name),
    limit_amount_cents = coalesce(greatest(input_limit_amount_cents, 0), limit_amount_cents),
    updated_at = now()
  where id = input_budget_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Budget not found';
  end if;
end;
$$;

create or replace function public.delete_my_budget(
  input_budget_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.budgets
  where id = input_budget_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Budget not found';
  end if;
end;
$$;

create or replace function public.create_my_transaction(
  input_type public.transaction_type,
  input_amount_cents integer,
  input_currency public.currency_code,
  input_name text,
  input_category_name text default null,
  input_budget_id uuid default null,
  input_budget_category_id uuid default null,
  input_income_category_id uuid default null,
  input_transaction_at timestamptz default now(),
  input_source text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if input_budget_id is not null and not exists (
    select 1
    from public.budgets
    where id = input_budget_id
      and user_id = current_user_id
  ) then
    raise exception 'Budget not found';
  end if;

  insert into public.transactions (
    user_id,
    type,
    amount_cents,
    currency,
    name,
    category_name,
    budget_id,
    budget_category_id,
    income_category_id,
    transaction_at,
    source
  )
  values (
    current_user_id,
    input_type,
    greatest(input_amount_cents, 0),
    input_currency,
    nullif(btrim(input_name), ''),
    nullif(btrim(input_category_name), ''),
    input_budget_id,
    input_budget_category_id,
    input_income_category_id,
    input_transaction_at,
    coalesce(nullif(btrim(input_source), ''), 'manual')
  )
  returning id
  into created_id;

  return created_id;
end;
$$;

create or replace function public.update_my_transaction(
  input_transaction_id uuid,
  input_amount_cents integer default null,
  input_category_name text default null,
  input_income_category_id uuid default null,
  input_budget_category_id uuid default null,
  input_clear_income_category_id boolean default false,
  input_clear_budget_category_id boolean default false,
  input_name text default null,
  input_transaction_at timestamptz default null,
  input_type public.transaction_type default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.transactions
  set
    amount_cents = coalesce(greatest(input_amount_cents, 0), amount_cents),
    category_name = case
      when input_category_name is null then category_name
      else nullif(btrim(input_category_name), '')
    end,
    income_category_id = case
      when input_clear_income_category_id then null
      when input_income_category_id is null then income_category_id
      else input_income_category_id
    end,
    budget_category_id = case
      when input_clear_budget_category_id then null
      when input_budget_category_id is null then budget_category_id
      else input_budget_category_id
    end,
    name = coalesce(nullif(btrim(input_name), ''), name),
    transaction_at = coalesce(input_transaction_at, transaction_at),
    type = coalesce(input_type, type),
    updated_at = now()
  where id = input_transaction_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Transaction not found';
  end if;
end;
$$;

create or replace function public.delete_my_transaction(
  input_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  affected_rows integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.transactions
  where id = input_transaction_id
    and user_id = current_user_id;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Transaction not found';
  end if;
end;
$$;

create or replace function public.delete_my_transactions_by_budget(
  input_budget_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.transactions
  where user_id = current_user_id
    and budget_id = input_budget_id;
end;
$$;

create or replace function public.create_my_vault_transaction(
  input_amount_cents integer,
  input_currency public.currency_code,
  input_entry_type text,
  input_note text default null,
  input_goal_id uuid default null,
  input_rollover_month text default null,
  input_transaction_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if input_goal_id is not null and not exists (
    select 1
    from public.goals
    where id = input_goal_id
      and user_id = current_user_id
  ) then
    raise exception 'Goal not found';
  end if;

  insert into public.vault_transactions (
    user_id,
    amount_cents,
    currency,
    entry_type,
    note,
    goal_id,
    rollover_month,
    transaction_at
  )
  values (
    current_user_id,
    input_amount_cents,
    input_currency,
    input_entry_type,
    nullif(btrim(input_note), ''),
    input_goal_id,
    nullif(btrim(input_rollover_month), ''),
    input_transaction_at
  )
  returning id
  into created_id;

  return created_id;
end;
$$;

create or replace function public.reset_my_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.monthly_balance_snapshots
  where user_id = current_user_id;

  delete from public.vault_transactions
  where user_id = current_user_id;

  delete from public.goal_contributions
  where user_id = current_user_id;

  delete from public.transactions
  where user_id = current_user_id;

  delete from public.goals
  where user_id = current_user_id;

  delete from public.budgets
  where user_id = current_user_id;

  delete from public.income_sources
  where user_id = current_user_id;

  delete from public.fixed_expenses
  where user_id = current_user_id;

  delete from public.user_financial_profiles
  where user_id = current_user_id;

  update public.user_onboarding
  set
    completed_at = null
  where user_id = current_user_id;
end;
$$;

create or replace function public.update_my_onboarding_complete(
  input_onboarding_version text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_onboarding_row(input_onboarding_version);

  update public.user_onboarding
  set
    onboarding_version = coalesce(nullif(btrim(input_onboarding_version), ''), onboarding_version),
    completed_at = now()
  where user_id = current_user_id;
end;
$$;

revoke all on function public.update_my_user_name(text) from public;
grant execute on function public.update_my_user_name(text) to authenticated;

revoke all on function public.upsert_my_user_currency(public.currency_code) from public;
grant execute on function public.upsert_my_user_currency(public.currency_code) to authenticated;

revoke all on function public.upsert_my_initial_savings(integer, public.currency_code) from public;
grant execute on function public.upsert_my_initial_savings(integer, public.currency_code) to authenticated;

revoke all on function public.upsert_my_balance_anchor_month(text) from public;
grant execute on function public.upsert_my_balance_anchor_month(text) to authenticated;

revoke all on function public.create_my_income_source(text, integer, public.currency_code) from public;
grant execute on function public.create_my_income_source(text, integer, public.currency_code) to authenticated;

revoke all on function public.replace_my_income_sources(jsonb, public.currency_code) from public;
grant execute on function public.replace_my_income_sources(jsonb, public.currency_code) to authenticated;

revoke all on function public.update_my_income_source(uuid, text, integer) from public;
grant execute on function public.update_my_income_source(uuid, text, integer) to authenticated;

revoke all on function public.delete_my_income_source(uuid) from public;
grant execute on function public.delete_my_income_source(uuid) to authenticated;

revoke all on function public.create_my_fixed_expense(text, integer, public.currency_code) from public;
grant execute on function public.create_my_fixed_expense(text, integer, public.currency_code) to authenticated;

revoke all on function public.replace_my_fixed_expenses(jsonb, public.currency_code) from public;
grant execute on function public.replace_my_fixed_expenses(jsonb, public.currency_code) to authenticated;

revoke all on function public.update_my_fixed_expense(uuid, text, integer) from public;
grant execute on function public.update_my_fixed_expense(uuid, text, integer) to authenticated;

revoke all on function public.delete_my_fixed_expense(uuid) from public;
grant execute on function public.delete_my_fixed_expense(uuid) to authenticated;

revoke all on function public.create_my_goal(text, text, integer, integer, boolean) from public;
grant execute on function public.create_my_goal(text, text, integer, integer, boolean) to authenticated;

revoke all on function public.update_my_goal(uuid, text, text, integer, integer, boolean) from public;
grant execute on function public.update_my_goal(uuid, text, text, integer, integer, boolean) to authenticated;

revoke all on function public.delete_my_goal(uuid) from public;
grant execute on function public.delete_my_goal(uuid) to authenticated;

revoke all on function public.create_my_goal_contribution(uuid, integer, public.currency_code, public.contribution_type, timestamptz, uuid) from public;
grant execute on function public.create_my_goal_contribution(uuid, integer, public.currency_code, public.contribution_type, timestamptz, uuid) to authenticated;

revoke all on function public.update_my_goal_contribution(uuid, integer, timestamptz) from public;
grant execute on function public.update_my_goal_contribution(uuid, integer, timestamptz) to authenticated;

revoke all on function public.delete_my_goal_contribution(uuid) from public;
grant execute on function public.delete_my_goal_contribution(uuid) to authenticated;

revoke all on function public.create_my_budget(uuid, text, integer, text, public.currency_code, boolean) from public;
grant execute on function public.create_my_budget(uuid, text, integer, text, public.currency_code, boolean) to authenticated;

revoke all on function public.update_my_budget(uuid, text, integer) from public;
grant execute on function public.update_my_budget(uuid, text, integer) to authenticated;

revoke all on function public.delete_my_budget(uuid) from public;
grant execute on function public.delete_my_budget(uuid) to authenticated;

revoke all on function public.create_my_transaction(public.transaction_type, integer, public.currency_code, text, text, uuid, uuid, uuid, timestamptz, text) from public;
grant execute on function public.create_my_transaction(public.transaction_type, integer, public.currency_code, text, text, uuid, uuid, uuid, timestamptz, text) to authenticated;

revoke all on function public.update_my_transaction(uuid, integer, text, uuid, uuid, boolean, boolean, text, timestamptz, public.transaction_type) from public;
grant execute on function public.update_my_transaction(uuid, integer, text, uuid, uuid, boolean, boolean, text, timestamptz, public.transaction_type) to authenticated;

revoke all on function public.delete_my_transaction(uuid) from public;
grant execute on function public.delete_my_transaction(uuid) to authenticated;

revoke all on function public.delete_my_transactions_by_budget(uuid) from public;
grant execute on function public.delete_my_transactions_by_budget(uuid) to authenticated;

revoke all on function public.create_my_vault_transaction(integer, public.currency_code, text, text, uuid, text, timestamptz) from public;
grant execute on function public.create_my_vault_transaction(integer, public.currency_code, text, text, uuid, text, timestamptz) to authenticated;

revoke all on function public.reset_my_user_data() from public;
grant execute on function public.reset_my_user_data() to authenticated;

revoke all on function public.update_my_onboarding_complete(text) from public;
grant execute on function public.update_my_onboarding_complete(text) to authenticated;
