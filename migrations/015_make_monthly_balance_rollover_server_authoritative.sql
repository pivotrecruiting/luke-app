-- Make monthly rollover state server-authoritative and derive closed-month snapshots from immutable rollovers.

create or replace function public.get_monthly_live_balance_cents(
  target_user_id uuid,
  target_month_start date,
  reporting_timezone text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  with tx as (
    select
      coalesce(sum(
        case
          when t.type = 'income' then t.amount_cents
          else -t.amount_cents
        end
      ), 0)::bigint as amount_cents
    from public.transactions t
    where t.user_id = target_user_id
      and date_trunc('month', t.transaction_at at time zone reporting_timezone)::date = target_month_start
  ),
  manual_deposits as (
    select
      coalesce(sum(vt.amount_cents), 0)::bigint as amount_cents
    from public.vault_transactions vt
    where vt.user_id = target_user_id
      and vt.entry_type = 'manual_deposit'
      and date_trunc('month', vt.transaction_at at time zone reporting_timezone)::date = target_month_start
  )
  select tx.amount_cents - manual_deposits.amount_cents
  from tx, manual_deposits;
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
  anchor_month_start date;
  preferred_currency public.currency_code;
  month_cursor date;
  closing_amount_cents bigint;
  snapshot_amount_cents bigint;
  rollover_timestamp timestamptz;
begin
  if target_user_id is null then
    return;
  end if;

  reporting_timezone := public.get_user_reporting_timezone(target_user_id);
  current_month_start := date_trunc('month', reference_at at time zone reporting_timezone)::date;

  insert into public.user_financial_profiles (
    user_id,
    currency,
    balance_anchor_month
  )
  values (
    target_user_id,
    'EUR'::public.currency_code,
    current_month_start
  )
  on conflict (user_id)
  do update
  set
    currency = coalesce(public.user_financial_profiles.currency, excluded.currency),
    balance_anchor_month = coalesce(
      public.user_financial_profiles.balance_anchor_month,
      excluded.balance_anchor_month
    ),
    updated_at = now()
  returning
    coalesce(currency, 'EUR'::public.currency_code),
    balance_anchor_month
  into preferred_currency, anchor_month_start;

  anchor_month_start := coalesce(anchor_month_start, current_month_start);
  month_cursor := anchor_month_start;

  while month_cursor < current_month_start loop
    closing_amount_cents := public.get_monthly_live_balance_cents(
      target_user_id,
      month_cursor,
      reporting_timezone
    );

    rollover_timestamp := (
      (month_cursor + interval '1 month')::timestamp
      at time zone reporting_timezone
    );

    if closing_amount_cents <> 0 then
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
        target_user_id,
        closing_amount_cents::integer,
        preferred_currency,
        'monthly_rollover',
        format('Monatsabschluss %s', month_cursor),
        null,
        month_cursor,
        rollover_timestamp
      )
      on conflict (user_id, entry_type, rollover_month)
      where (entry_type = 'monthly_rollover')
      do nothing;
    end if;

    select coalesce(
      (
        select vt.amount_cents::bigint
        from public.vault_transactions vt
        where vt.user_id = target_user_id
          and vt.entry_type = 'monthly_rollover'
          and vt.rollover_month = month_cursor
        limit 1
      ),
      closing_amount_cents
    )
    into snapshot_amount_cents;

    insert into public.monthly_balance_snapshots (
      user_id,
      month_start,
      amount_cents,
      currency,
      snapshot_at
    )
    values (
      target_user_id,
      month_cursor,
      snapshot_amount_cents::integer,
      preferred_currency,
      now()
    )
    on conflict (user_id, month_start)
    do update
    set
      amount_cents = excluded.amount_cents,
      currency = excluded.currency,
      snapshot_at = excluded.snapshot_at,
      updated_at = now();

    month_cursor := (month_cursor + interval '1 month')::date;
  end loop;

  update public.user_financial_profiles
  set
    balance_anchor_month = current_month_start,
    updated_at = now()
  where user_id = target_user_id
    and balance_anchor_month is distinct from current_month_start;
end;
$$;

insert into public.monthly_balance_snapshots (
  user_id,
  month_start,
  amount_cents,
  currency,
  snapshot_at
)
select
  vt.user_id,
  vt.rollover_month,
  vt.amount_cents,
  vt.currency,
  vt.transaction_at
from public.vault_transactions vt
where vt.entry_type = 'monthly_rollover'
  and vt.rollover_month is not null
on conflict (user_id, month_start)
do update
set
  amount_cents = excluded.amount_cents,
  currency = excluded.currency,
  snapshot_at = excluded.snapshot_at,
  updated_at = now();
