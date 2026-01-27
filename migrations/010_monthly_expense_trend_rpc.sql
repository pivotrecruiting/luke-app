create or replace function public.get_monthly_expense_trend(
  target_user_id uuid,
  months_back int default 6
)
returns table(month_start date, amount_cents bigint)
language sql
security definer
set search_path = public
as $$
  with bounds as (
    select
      date_trunc('month', now())::date as current_month,
      greatest(months_back, 1) as months_back
  ),
  months as (
    select generate_series(
      (select current_month from bounds) - ((select months_back from bounds) - 1) * interval '1 month',
      (select current_month from bounds),
      interval '1 month'
    )::date as month_start
  ),
  tx as (
    select
      date_trunc('month', t.transaction_at)::date as month_start,
      sum(t.amount_cents) as amount_cents
    from public.transactions t
    where t.user_id = target_user_id
      and t.user_id = auth.uid()
      and t.type = 'expense'
      and t.transaction_at >= (select min(month_start) from months)
      and t.transaction_at < (select max(month_start) + interval '1 month' from months)
    group by 1
  ),
  fixed as (
    select
      m.month_start,
      sum(f.amount_cents) as amount_cents
    from months m
    join public.fixed_expenses f
      on f.user_id = target_user_id
     and f.user_id = auth.uid()
     and (f.start_date is null or f.start_date <= m.month_start)
     and (f.end_date is null or f.end_date >= m.month_start)
    group by 1
  )
  select
    m.month_start,
    coalesce(tx.amount_cents, 0) + coalesce(fixed.amount_cents, 0) as amount_cents
  from months m
  left join tx on tx.month_start = m.month_start
  left join fixed on fixed.month_start = m.month_start
  order by m.month_start;
$$;

revoke all on function public.get_monthly_expense_trend(uuid, int) from public;
grant execute on function public.get_monthly_expense_trend(uuid, int) to authenticated;
