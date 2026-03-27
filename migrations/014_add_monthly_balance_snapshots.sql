-- Persist immutable month-end balance snapshots for analytics and trend views.

create table if not exists public.monthly_balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  month_start date not null,
  amount_cents integer not null,
  currency public.currency_code not null,
  snapshot_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_start)
);

create index if not exists monthly_balance_snapshots_user_month_idx
  on public.monthly_balance_snapshots (user_id, month_start desc);

alter table public.monthly_balance_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'monthly_balance_snapshots'
      and policyname = 'monthly_balance_snapshots_access'
  ) then
    create policy monthly_balance_snapshots_access
      on public.monthly_balance_snapshots
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

create or replace function public.get_user_reporting_timezone(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(trim((
      select us.timezone
      from public.user_settings us
      where us.user_id = target_user_id
      limit 1
    )), ''),
    'UTC'
  );
$$;

create or replace function public.sync_monthly_balance_snapshots_for_user(
  target_user_id uuid,
  reference_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reporting_timezone text;
  current_month_start date;
  first_month_start date;
  preferred_currency public.currency_code;
begin
  if target_user_id is null then
    return;
  end if;

  reporting_timezone := public.get_user_reporting_timezone(target_user_id);
  current_month_start := date_trunc('month', reference_at at time zone reporting_timezone)::date;

  select coalesce(
    (
      select fp.currency
      from public.user_financial_profiles fp
      where fp.user_id = target_user_id
      limit 1
    ),
    'EUR'::public.currency_code
  )
  into preferred_currency;

  with activity_months as (
    select date_trunc('month', t.transaction_at at time zone reporting_timezone)::date as month_start
    from public.transactions t
    where t.user_id = target_user_id

    union

    select date_trunc('month', vt.transaction_at at time zone reporting_timezone)::date as month_start
    from public.vault_transactions vt
    where vt.user_id = target_user_id
      and vt.entry_type = 'manual_deposit'
  )
  select min(activity_months.month_start)
  into first_month_start
  from activity_months;

  if first_month_start is null or first_month_start >= current_month_start then
    return;
  end if;

  with months as (
    select generate_series(
      first_month_start::timestamp,
      (current_month_start - interval '1 month')::timestamp,
      interval '1 month'
    )::date as month_start
  ),
  tx as (
    select
      date_trunc('month', t.transaction_at at time zone reporting_timezone)::date as month_start,
      sum(
        case
          when t.type = 'income' then t.amount_cents
          else -t.amount_cents
        end
      )::bigint as amount_cents
    from public.transactions t
    where t.user_id = target_user_id
      and date_trunc('month', t.transaction_at at time zone reporting_timezone)::date >= first_month_start
      and date_trunc('month', t.transaction_at at time zone reporting_timezone)::date < current_month_start
    group by 1
  ),
  manual_deposits as (
    select
      date_trunc('month', vt.transaction_at at time zone reporting_timezone)::date as month_start,
      sum(vt.amount_cents)::bigint as amount_cents
    from public.vault_transactions vt
    where vt.user_id = target_user_id
      and vt.entry_type = 'manual_deposit'
      and date_trunc('month', vt.transaction_at at time zone reporting_timezone)::date >= first_month_start
      and date_trunc('month', vt.transaction_at at time zone reporting_timezone)::date < current_month_start
    group by 1
  )
  insert into public.monthly_balance_snapshots (
    user_id,
    month_start,
    amount_cents,
    currency,
    snapshot_at
  )
  select
    target_user_id,
    months.month_start,
    (coalesce(tx.amount_cents, 0) - coalesce(manual_deposits.amount_cents, 0))::integer,
    preferred_currency,
    now()
  from months
  left join tx
    on tx.month_start = months.month_start
  left join manual_deposits
    on manual_deposits.month_start = months.month_start
  on conflict (user_id, month_start)
  do update
  set
    amount_cents = excluded.amount_cents,
    currency = excluded.currency,
    snapshot_at = excluded.snapshot_at,
    updated_at = now();
end;
$$;

create or replace function public.sync_my_monthly_balance_snapshots(
  reference_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  perform public.sync_monthly_balance_snapshots_for_user(auth.uid(), reference_at);
end;
$$;

revoke all on function public.sync_my_monthly_balance_snapshots(timestamptz) from public;
grant execute on function public.sync_my_monthly_balance_snapshots(timestamptz) to authenticated;

create or replace function public.sync_all_monthly_balance_snapshots(
  reference_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_row record;
begin
  for user_row in
    select distinct scoped.user_id
    from (
      select fp.user_id
      from public.user_financial_profiles fp

      union

      select t.user_id
      from public.transactions t

      union

      select vt.user_id
      from public.vault_transactions vt
    ) scoped
  loop
    perform public.sync_monthly_balance_snapshots_for_user(
      user_row.user_id,
      reference_at
    );
  end loop;
end;
$$;

create or replace function public.get_monthly_balance_trend(
  months_back int default 12,
  reference_at timestamptz default now()
)
returns table(
  month_start date,
  amount_cents bigint,
  is_snapshot boolean,
  is_current_month boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  reporting_timezone text;
  current_month_start date;
  requested_months int;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  requested_months := greatest(months_back, 1);
  reporting_timezone := public.get_user_reporting_timezone(current_user_id);
  current_month_start := date_trunc('month', reference_at at time zone reporting_timezone)::date;

  perform public.sync_monthly_balance_snapshots_for_user(
    current_user_id,
    reference_at
  );

  return query
  with months as (
    select generate_series(
      (current_month_start - ((requested_months - 1) * interval '1 month'))::timestamp,
      current_month_start::timestamp,
      interval '1 month'
    )::date as month_start
  ),
  snapshot_rows as (
    select
      s.month_start,
      s.amount_cents::bigint as amount_cents
    from public.monthly_balance_snapshots s
    where s.user_id = current_user_id
      and s.month_start >= (
        current_month_start - ((requested_months - 1) * interval '1 month')
      )::date
      and s.month_start < current_month_start
  ),
  current_month_balance as (
    with tx as (
      select
        coalesce(sum(
          case
            when t.type = 'income' then t.amount_cents
            else -t.amount_cents
          end
        ), 0)::bigint as amount_cents
      from public.transactions t
      where t.user_id = current_user_id
        and date_trunc('month', t.transaction_at at time zone reporting_timezone)::date = current_month_start
    ),
    manual_deposits as (
      select
        coalesce(sum(vt.amount_cents), 0)::bigint as amount_cents
      from public.vault_transactions vt
      where vt.user_id = current_user_id
        and vt.entry_type = 'manual_deposit'
        and date_trunc('month', vt.transaction_at at time zone reporting_timezone)::date = current_month_start
    )
    select
      tx.amount_cents - manual_deposits.amount_cents as amount_cents
    from tx, manual_deposits
  )
  select
    months.month_start,
    case
      when months.month_start = current_month_start then (
        select current_month_balance.amount_cents
        from current_month_balance
      )
      else coalesce(snapshot_rows.amount_cents, 0)
    end as amount_cents,
    months.month_start < current_month_start as is_snapshot,
    months.month_start = current_month_start as is_current_month
  from months
  left join snapshot_rows
    on snapshot_rows.month_start = months.month_start
  order by months.month_start;
end;
$$;

revoke all on function public.get_monthly_balance_trend(int, timestamptz) from public;
grant execute on function public.get_monthly_balance_trend(int, timestamptz) to authenticated;

do $$
begin
  begin
    create extension if not exists pg_cron with schema pg_catalog;
  exception
    when insufficient_privilege then
      raise notice 'pg_cron extension could not be enabled automatically.';
  end;

  if exists (
    select 1
    from pg_extension
    where extname = 'pg_cron'
  ) then
    perform cron.schedule(
      'sync-monthly-balance-snapshots-quarter-hourly',
      '*/15 * * * *',
      'select public.sync_all_monthly_balance_snapshots(now());'
    );
  end if;
end
$$;
