# DB Requests (SQL) – Screens & Aggregations

Hinweis: Alle Queries sind auf `:user_id` parametriert und gehen vom MVP mit **einheitlicher Waehrung pro User** aus.
Optional: `:currency` aus `user_financial_profiles` verwenden.

## 0) Basis: User + Default Currency

```sql
select u.id,
       u.name,
       u.status,
       u.avatar,
       p.currency,
       p.initial_savings_cents
from public.users u
left join public.user_financial_profiles p on p.user_id = u.id
where u.id = :user_id;
```

## 1) Home Screen

### 1.1 Monats-Summen (Income / Fixed / Variable / Balance)

```sql
with month_range as (
  select date_trunc('month', now()) as start_at,
         (date_trunc('month', now()) + interval '1 month') as end_at
),
monthly_income as (
  select coalesce(sum(amount_cents), 0) as income_cents
  from public.income_sources
  where user_id = :user_id
),
monthly_fixed as (
  select coalesce(sum(amount_cents), 0) as fixed_cents
  from public.fixed_expenses
  where user_id = :user_id
),
monthly_variable as (
  select coalesce(sum(amount_cents), 0) as variable_cents
  from public.transactions t
  join month_range m on t.transaction_at >= m.start_at and t.transaction_at < m.end_at
  where t.user_id = :user_id and t.type = 'expense'
)
select income_cents,
       fixed_cents,
       variable_cents,
       (income_cents - fixed_cents - variable_cents) as balance_cents
from monthly_income, monthly_fixed, monthly_variable;
```

### 1.2 Weekly Spending (Mon-Sun)

```sql
with week_range as (
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
spend as (
  select date(t.transaction_at) as day,
         sum(t.amount_cents) as amount_cents
  from public.transactions t
  join week_range w on t.transaction_at >= w.start_at and t.transaction_at < w.end_at
  where t.user_id = :user_id and t.type = 'expense'
  group by 1
)
select d.day,
       coalesce(s.amount_cents, 0) as amount_cents
from days d
left join spend s on s.day = d.day
order by d.day;
```

### 1.3 Letzte Transaktionen

```sql
select id, type, amount_cents, currency, name, category_name,
       transaction_at, budget_id, budget_category_id, income_category_id
from public.transactions
where user_id = :user_id
order by transaction_at desc
limit :limit;
```

## 2) Income Screen (Recurring)

```sql
select id, name, amount_cents, currency, frequency
from public.income_sources
where user_id = :user_id
order by created_at desc;
```

## 3) Expenses Screen (Fixed)

```sql
select id, name, amount_cents, currency, frequency
from public.fixed_expenses
where user_id = :user_id
order by created_at desc;
```

## 4) Add Screen (Insert Transaction)

### 4.1 Insert Income Transaction

```sql
insert into public.transactions (
  user_id, type, amount_cents, currency, name, income_category_id, category_name, transaction_at, source
) values (
  :user_id, 'income', :amount_cents, :currency, :name, :income_category_id, :category_name, :transaction_at, 'manual'
);
```

### 4.2 Insert Expense Transaction

```sql
insert into public.transactions (
  user_id, type, amount_cents, currency, name, budget_category_id, budget_id, category_name, transaction_at, source
) values (
  :user_id, 'expense', :amount_cents, :currency, :name, :budget_category_id, :budget_id, :category_name, :transaction_at, 'manual'
);
```

## 5) Insights (Kategorien + Trend)

### 5.1 Kategorien-Ausgaben in Zeitraum

```sql
select
  coalesce(bc.name, t.category_name) as category_name,
  coalesce(bc.color, '#7B8CDE') as color,
  sum(t.amount_cents) as amount_cents
from public.transactions t
left join public.budget_categories bc on t.budget_category_id = bc.id
where t.user_id = :user_id
  and t.type = 'expense'
  and t.transaction_at >= :start_at
  and t.transaction_at < :end_at
group by 1, 2
order by amount_cents desc;
```

### 5.2 Monthly Trend (letzte 6 Monate)

```sql
with months as (
  select generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  ) as month_start
),
agg as (
  select date_trunc('month', transaction_at) as month_start,
         sum(amount_cents) as amount_cents
  from public.transactions
  where user_id = :user_id and type = 'expense'
  group by 1
)
select m.month_start,
       coalesce(a.amount_cents, 0) as amount_cents
from months m
left join agg a on a.month_start = m.month_start
order by m.month_start;
```

## 6) Budgets

### 6.1 Budget Liste + Current (aktueller Monat)

```sql
with month_range as (
  select date_trunc('month', now()) as start_at,
         (date_trunc('month', now()) + interval '1 month') as end_at
),
spent as (
  select budget_id, sum(amount_cents) as spent_cents
  from public.transactions t
  join month_range m on t.transaction_at >= m.start_at and t.transaction_at < m.end_at
  where t.user_id = :user_id and t.type = 'expense' and t.budget_id is not null
  group by budget_id
)
select b.id, b.name, b.limit_amount_cents, b.currency,
       bc.icon, bc.color,
       coalesce(s.spent_cents, 0) as spent_cents
from public.budgets b
join public.budget_categories bc on b.category_id = bc.id
left join spent s on s.budget_id = b.id
where b.user_id = :user_id and b.is_active = true
order by b.created_at desc;
```

### 6.2 Budget Detail – Transaktionen

```sql
select id, name, amount_cents, currency, transaction_at
from public.transactions
where user_id = :user_id
  and type = 'expense'
  and budget_id = :budget_id
order by transaction_at desc;
```

## 7) Goals

### 7.1 Goals Liste + Current/Remaining

```sql
with agg as (
  select goal_id, sum(amount_cents) as total_cents
  from public.goal_contributions
  where user_id = :user_id
  group by goal_id
)
select g.id, g.name, g.icon, g.target_amount_cents,
       coalesce(a.total_cents, 0) as current_cents,
       greatest(g.target_amount_cents - coalesce(a.total_cents, 0), 0) as remaining_cents
from public.goals g
left join agg a on a.goal_id = g.id
where g.user_id = :user_id
order by g.created_at desc;
```

### 7.2 Goal Detail – Contributions

```sql
select id, amount_cents, currency, contribution_type, contribution_at, note
from public.goal_contributions
where user_id = :user_id and goal_id = :goal_id
order by contribution_at desc;
```

## 8) Profile / Settings / XP

### 8.1 Settings

```sql
select language, theme, daily_reminder_enabled, weekly_report_enabled, monthly_reminder_enabled,
       timezone, reminder_time
from public.user_settings
where user_id = :user_id;
```

### 8.2 Level / XP

```sql
select up.xp_total, up.current_streak, up.longest_streak,
       l.level_number, l.name, l.emoji, l.xp_required
from public.user_progress up
left join public.levels l on up.current_level_id = l.id
where up.user_id = :user_id;
```

## 9) Entitlements

```sql
select entitlement_key, status, starts_at, ends_at
from public.entitlements
where user_id = :user_id and status = 'active';
```

