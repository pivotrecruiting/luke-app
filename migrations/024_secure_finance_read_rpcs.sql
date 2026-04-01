-- Server-authoritative read layer for security-critical finance flows.

create or replace function public.ensure_my_user_row()
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

  insert into public.users (id)
  values (current_user_id)
  on conflict (id) do nothing;
end;
$$;

create or replace function public.ensure_my_onboarding_row(
  input_onboarding_version text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_onboarding_version text :=
    coalesce(nullif(btrim(input_onboarding_version), ''), 'v1');
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_user_row();

  insert into public.user_onboarding (user_id, onboarding_version)
  values (current_user_id, resolved_onboarding_version)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.is_active_in_month(
  month_start date,
  month_end date,
  source_start_date date,
  source_end_date date
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(source_start_date <= month_end, true)
    and coalesce(source_end_date >= month_start, true);
$$;

create or replace function public.build_monthly_occurrence_at(
  month_start date,
  source_start_date date
)
returns timestamptz
language sql
stable
set search_path = public
as $$
  with last_day as (
    select extract(day from (month_start + interval '1 month - 1 day'))::int as day
  ),
  target_day as (
    select greatest(
      1,
      least(
        coalesce(extract(day from source_start_date)::int, 1),
        (select day from last_day)
      )
    ) as day
  )
  select (
    month_start::timestamp
    + make_interval(days => (select day from target_day) - 1)
    + interval '12 hours'
  )::timestamptz;
$$;

create or replace function public.ensure_my_recurring_transactions_for_month(
  reference_at timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_month_start date := date_trunc('month', reference_at)::date;
  current_month_end date :=
    (date_trunc('month', reference_at) + interval '1 month - 1 day')::date;
  current_month_start_ts timestamptz := date_trunc('month', reference_at);
  next_month_start_ts timestamptz :=
    date_trunc('month', reference_at) + interval '1 month';
  preferred_currency public.currency_code := 'EUR'::public.currency_code;
  inserted_income_count integer := 0;
  inserted_expense_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(
    (
      select fp.currency
      from public.user_financial_profiles fp
      where fp.user_id = current_user_id
      limit 1
    ),
    'EUR'::public.currency_code
  )
  into preferred_currency;

  with inserted_income as (
    insert into public.transactions (
      user_id,
      type,
      amount_cents,
      currency,
      name,
      category_name,
      income_category_id,
      transaction_at,
      source
    )
    select
      current_user_id,
      'income'::public.transaction_type,
      source.amount_cents,
      coalesce(source.currency, preferred_currency),
      source.name,
      source.name,
      (
        select ic.id
        from public.income_categories ic
        where lower(btrim(ic.name)) = lower(btrim(source.name))
        limit 1
      ),
      public.build_monthly_occurrence_at(current_month_start, source.start_date),
      'recurring'
    from public.income_sources source
    where source.user_id = current_user_id
      and source.amount_cents > 0
      and public.is_active_in_month(
        current_month_start,
        current_month_end,
        source.start_date,
        source.end_date
      )
      and not exists (
        select 1
        from public.transactions tx
        where tx.user_id = current_user_id
          and tx.source = 'recurring'
          and tx.type = 'income'
          and lower(btrim(tx.name)) = lower(btrim(source.name))
          and tx.transaction_at >= current_month_start_ts
          and tx.transaction_at < next_month_start_ts
      )
    returning id
  )
  select count(*)
  into inserted_income_count
  from inserted_income;

  with inserted_expense as (
    insert into public.transactions (
      user_id,
      type,
      amount_cents,
      currency,
      name,
      category_name,
      transaction_at,
      source
    )
    select
      current_user_id,
      'expense'::public.transaction_type,
      source.amount_cents,
      coalesce(source.currency, preferred_currency),
      source.name,
      source.name,
      public.build_monthly_occurrence_at(current_month_start, source.start_date),
      'recurring'
    from public.fixed_expenses source
    where source.user_id = current_user_id
      and source.amount_cents > 0
      and public.is_active_in_month(
        current_month_start,
        current_month_end,
        source.start_date,
        source.end_date
      )
      and not exists (
        select 1
        from public.transactions tx
        where tx.user_id = current_user_id
          and tx.source = 'recurring'
          and tx.type = 'expense'
          and lower(btrim(tx.name)) = lower(btrim(source.name))
          and tx.transaction_at >= current_month_start_ts
          and tx.transaction_at < next_month_start_ts
      )
    returning id
  )
  select count(*)
  into inserted_expense_count
  from inserted_expense;

  return inserted_income_count + inserted_expense_count;
end;
$$;

create or replace function public.get_my_monthly_balance_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  payload jsonb;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_user_row();
  perform public.sync_my_monthly_balance_snapshots();

  select jsonb_build_object(
    'balanceAnchorMonth',
    (
      select fp.balance_anchor_month
      from public.user_financial_profiles fp
      where fp.user_id = current_user_id
      limit 1
    ),
    'vaultTransactions',
    coalesce(
      (
        select jsonb_agg(to_jsonb(vt) order by vt.transaction_at desc)
        from (
          select
            id,
            user_id,
            amount_cents,
            currency,
            entry_type,
            note,
            goal_id,
            rollover_month,
            transaction_at
          from public.vault_transactions
          where user_id = current_user_id
        ) vt
      ),
      '[]'::jsonb
    ),
    'monthlyBalanceSnapshots',
    coalesce(
      (
        select jsonb_agg(to_jsonb(snapshot) order by snapshot.month_start asc)
        from (
          select
            id,
            user_id,
            month_start,
            amount_cents,
            currency,
            snapshot_at
          from public.monthly_balance_snapshots
          where user_id = current_user_id
        ) snapshot
      ),
      '[]'::jsonb
    )
  )
  into payload;

  return payload;
end;
$$;

create or replace function public.get_my_app_data(
  input_onboarding_version text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  payload jsonb;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_onboarding_row(input_onboarding_version);
  perform public.ensure_my_recurring_transactions_for_month();
  perform public.sync_my_monthly_balance_snapshots();

  select jsonb_build_object(
    'userName',
    (
      select nullif(btrim(u.name), '')
      from public.users u
      where u.id = current_user_id
      limit 1
    ),
    'onboarding',
    coalesce(
      (
        select to_jsonb(onboarding_row)
        from (
          select
            completed_at,
            onboarding_version,
            started_at,
            skipped_steps
          from public.user_onboarding
          where user_id = current_user_id
          limit 1
        ) onboarding_row
      ),
      'null'::jsonb
    ),
    'profile',
    coalesce(
      (
        select to_jsonb(profile_row)
        from (
          select
            currency,
            initial_savings_cents,
            balance_anchor_month
          from public.user_financial_profiles
          where user_id = current_user_id
          limit 1
        ) profile_row
      ),
      'null'::jsonb
    ),
    'incomeSources',
    coalesce(
      (
        select jsonb_agg(to_jsonb(source_row) order by source_row.name asc)
        from (
          select
            id,
            name,
            amount_cents,
            currency,
            start_date,
            end_date
          from public.income_sources
          where user_id = current_user_id
        ) source_row
      ),
      '[]'::jsonb
    ),
    'fixedExpenses',
    coalesce(
      (
        select jsonb_agg(to_jsonb(expense_row) order by expense_row.name asc)
        from (
          select
            id,
            name,
            amount_cents,
            currency,
            start_date,
            end_date
          from public.fixed_expenses
          where user_id = current_user_id
        ) expense_row
      ),
      '[]'::jsonb
    ),
    'goals',
    coalesce(
      (
        select jsonb_agg(to_jsonb(goal_row))
        from (
          select
            id,
            name,
            icon,
            target_amount_cents,
            monthly_contribution_cents
          from public.goals
          where user_id = current_user_id
          order by created_at asc
        ) goal_row
      ),
      '[]'::jsonb
    ),
    'goalContributions',
    coalesce(
      (
        select jsonb_agg(to_jsonb(contribution_row) order by contribution_row.contribution_at desc)
        from (
          select
            id,
            goal_id,
            amount_cents,
            contribution_type,
            contribution_at,
            transaction_id
          from public.goal_contributions
          where user_id = current_user_id
        ) contribution_row
      ),
      '[]'::jsonb
    ),
    'budgetCategories',
    coalesce(
      (
        select jsonb_agg(to_jsonb(category_row) order by category_row.name asc)
        from (
          select
            id,
            key,
            name,
            icon,
            color
          from public.budget_categories
          where active = true
        ) category_row
      ),
      '[]'::jsonb
    ),
    'incomeCategories',
    coalesce(
      (
        select jsonb_agg(to_jsonb(category_row) order by category_row.name asc)
        from (
          select
            id,
            key,
            name,
            icon
          from public.income_categories
          where active = true
        ) category_row
      ),
      '[]'::jsonb
    ),
    'budgets',
    coalesce(
      (
        select jsonb_agg(to_jsonb(budget_row))
        from (
          select
            id,
            name,
            category_id,
            limit_amount_cents
          from public.budgets
          where user_id = current_user_id
          order by created_at asc
        ) budget_row
      ),
      '[]'::jsonb
    ),
    'transactions',
    coalesce(
      (
        select jsonb_agg(to_jsonb(tx_row) order by tx_row.transaction_at desc)
        from (
          select
            id,
            type,
            amount_cents,
            name,
            category_name,
            budget_id,
            budget_category_id,
            transaction_at,
            source
          from public.transactions
          where user_id = current_user_id
        ) tx_row
      ),
      '[]'::jsonb
    ),
    'vaultTransactions',
    coalesce(
      (
        select jsonb_agg(to_jsonb(vt_row) order by vt_row.transaction_at desc)
        from (
          select
            id,
            user_id,
            amount_cents,
            currency,
            entry_type,
            note,
            goal_id,
            rollover_month,
            transaction_at
          from public.vault_transactions
          where user_id = current_user_id
        ) vt_row
      ),
      '[]'::jsonb
    ),
    'monthlyBalanceSnapshots',
    coalesce(
      (
        select jsonb_agg(to_jsonb(snapshot_row) order by snapshot_row.month_start asc)
        from (
          select
            id,
            user_id,
            month_start,
            amount_cents,
            currency,
            snapshot_at
          from public.monthly_balance_snapshots
          where user_id = current_user_id
        ) snapshot_row
      ),
      '[]'::jsonb
    )
  )
  into payload;

  return payload;
end;
$$;

revoke all on function public.ensure_my_user_row() from public;
grant execute on function public.ensure_my_user_row() to authenticated;

revoke all on function public.ensure_my_onboarding_row(text) from public;
grant execute on function public.ensure_my_onboarding_row(text) to authenticated;

revoke all on function public.ensure_my_recurring_transactions_for_month(timestamptz) from public;
grant execute on function public.ensure_my_recurring_transactions_for_month(timestamptz) to authenticated;

revoke all on function public.get_my_monthly_balance_state() from public;
grant execute on function public.get_my_monthly_balance_state() to authenticated;

revoke all on function public.get_my_app_data(text) from public;
grant execute on function public.get_my_app_data(text) to authenticated;
