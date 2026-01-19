-- RPC functions for fast dashboard/insights reads

create or replace function public.rpc_home_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with month_range as (
  select date_trunc('month', now()) as start_at,
         date_trunc('month', now()) + interval '1 month' as end_at
),
monthly_income as (
  select coalesce(sum(amount_cents), 0) as income_cents
  from public.income_sources
  where user_id = auth.uid()
),
monthly_fixed as (
  select coalesce(sum(amount_cents), 0) as fixed_cents
  from public.fixed_expenses
  where user_id = auth.uid()
),
monthly_variable as (
  select coalesce(sum(amount_cents), 0) as variable_cents
  from public.transactions t
  join month_range m on t.transaction_at >= m.start_at and t.transaction_at < m.end_at
  where t.user_id = auth.uid() and t.type = 'expense'
),
week_range as (
  select date_trunc('week', now()) as start_at,
         date_trunc('week', now()) + interval '7 days' as end_at
),
days as (
  select generate_series(
    (select start_at from week_range),
    (select end_at from week_range) - interval '1 day',
    interval '1 day'
  )::date as day
),
weekly_spend as (
  select date(t.transaction_at) as day,
         sum(t.amount_cents) as amount_cents
  from public.transactions t
  join week_range w on t.transaction_at >= w.start_at and t.transaction_at < w.end_at
  where t.user_id = auth.uid() and t.type = 'expense'
  group by 1
),
weekly_rows as (
  select d.day,
         extract(isodow from d.day)::int - 1 as day_index,
         coalesce(s.amount_cents, 0) as amount_cents
  from days d
  left join weekly_spend s on s.day = d.day
  order by d.day
),
recent_transactions as (
  select jsonb_agg(t order by t.transaction_at desc) as items
  from (
    select id,
           type,
           amount_cents,
           currency,
           name,
           category_name,
           income_category_id,
           budget_category_id,
           budget_id,
           transaction_at
    from public.transactions
    where user_id = auth.uid()
    order by transaction_at desc
    limit 10
  ) t
),
weekly_json as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'day', day,
        'day_index', day_index,
        'amount_cents', amount_cents
      )
      order by day
    ),
    '[]'::jsonb
  ) as items
  from weekly_rows
)
select jsonb_build_object(
  'summary', jsonb_build_object(
    'income_cents', (select income_cents from monthly_income),
    'fixed_cents', (select fixed_cents from monthly_fixed),
    'variable_cents', (select variable_cents from monthly_variable),
    'balance_cents',
      (select income_cents from monthly_income)
      - (select fixed_cents from monthly_fixed)
      - (select variable_cents from monthly_variable)
  ),
  'weekly_spending', (select items from weekly_json),
  'recent_transactions', coalesce((select items from recent_transactions), '[]'::jsonb)
);
$$;

create or replace function public.rpc_insights_categories(
  start_at timestamptz,
  end_at timestamptz
)
returns table (
  category_name text,
  color text,
  amount_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
select
  coalesce(bc.name, t.category_name) as category_name,
  coalesce(bc.color, '#7B8CDE') as color,
  sum(t.amount_cents)::bigint as amount_cents
from public.transactions t
left join public.budget_categories bc on t.budget_category_id = bc.id
where t.user_id = auth.uid()
  and t.type = 'expense'
  and t.transaction_at >= start_at
  and t.transaction_at < end_at
group by 1, 2
order by amount_cents desc;
$$;

create or replace function public.rpc_insights_trend(
  months integer default 6
)
returns table (
  month_start date,
  amount_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
with params as (
  select greatest(months, 1) as months
),
month_series as (
  select generate_series(
    date_trunc('month', now()) - ((select months from params) - 1) * interval '1 month',
    date_trunc('month', now()),
    interval '1 month'
  ) as month_start
),
agg as (
  select date_trunc('month', transaction_at) as month_start,
         sum(amount_cents) as amount_cents
  from public.transactions
  where user_id = auth.uid() and type = 'expense'
  group by 1
)
select m.month_start::date,
       coalesce(a.amount_cents, 0)::bigint as amount_cents
from month_series m
left join agg a on a.month_start = m.month_start
order by m.month_start;
$$;
