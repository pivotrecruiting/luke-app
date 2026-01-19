-- Seed mock data for a specific user (Dennis Schaible)
-- Replace REPLACE_WITH_EMAIL with the auth user's email before running.

create extension if not exists "pgcrypto";

do $$
declare
  v_email text := 'dennis@dev-works.io';
  v_user_id uuid;
  v_currency public.currency_code := 'EUR';
  v_level_id uuid;
  v_food_cat uuid;
  v_out_cat uuid;
  v_freizeit_cat uuid;
  v_shop_cat uuid;
  v_income_gehalt uuid;
  v_income_nebenjob uuid;
  v_budget_food uuid;
  v_budget_out uuid;
  v_budget_freizeit uuid;
  v_budget_shop uuid;
  v_goal_id uuid;
begin
  if v_email = 'REPLACE_WITH_EMAIL' then
    raise exception 'Replace v_email placeholder with your auth email before running this migration.';
  end if;

  select id into v_user_id
  from auth.users
  where email = v_email
  limit 1;

  if v_user_id is null then
    raise exception 'auth.users not found for email %, create via Supabase Auth first.', v_email;
  end if;

  insert into public.users (id, name, status)
  values (v_user_id, 'Dennis Schaible', 'published')
  on conflict (id) do update
  set name = excluded.name,
      updated_at = now();

  insert into public.user_onboarding (user_id, onboarding_version, started_at, completed_at, skipped_steps)
  values (v_user_id, 'v1', now() - interval '2 days', now() - interval '1 day', '[]'::jsonb)
  on conflict (user_id) do update
  set onboarding_version = excluded.onboarding_version,
      completed_at = excluded.completed_at,
      skipped_steps = excluded.skipped_steps;

  insert into public.user_financial_profiles (user_id, initial_savings_cents, currency)
  values (v_user_id, 150000, v_currency)
  on conflict (user_id) do update
  set initial_savings_cents = excluded.initial_savings_cents,
      currency = excluded.currency,
      updated_at = now();

  insert into public.user_settings (
    user_id,
    language,
    theme,
    daily_reminder_enabled,
    weekly_report_enabled,
    monthly_reminder_enabled,
    timezone,
    reminder_time
  )
  values (
    v_user_id,
    'de',
    'system',
    true,
    true,
    false,
    'Europe/Vienna',
    '08:30'
  )
  on conflict (user_id) do update
  set language = excluded.language,
      theme = excluded.theme,
      daily_reminder_enabled = excluded.daily_reminder_enabled,
      weekly_report_enabled = excluded.weekly_report_enabled,
      monthly_reminder_enabled = excluded.monthly_reminder_enabled,
      timezone = excluded.timezone,
      reminder_time = excluded.reminder_time,
      updated_at = now();

  select id into v_level_id from public.levels where level_number = 2;

  if v_level_id is null then
    raise exception 'levels not seeded; run migrations/003_user_settings_levels.sql first.';
  end if;

  insert into public.user_progress (
    user_id,
    xp_total,
    current_level_id,
    current_streak,
    longest_streak,
    last_login_at,
    last_streak_date
  )
  values (
    v_user_id,
    650,
    v_level_id,
    3,
    5,
    now(),
    current_date
  )
  on conflict (user_id) do update
  set xp_total = excluded.xp_total,
      current_level_id = excluded.current_level_id,
      current_streak = excluded.current_streak,
      longest_streak = excluded.longest_streak,
      last_login_at = excluded.last_login_at,
      last_streak_date = excluded.last_streak_date,
      updated_at = now();

  if not exists (select 1 from public.income_sources where user_id = v_user_id) then
    insert into public.income_sources (user_id, name, amount_cents, currency)
    values
      (v_user_id, 'Gehalt', 320000, v_currency),
      (v_user_id, 'Nebenjob', 40000, v_currency);
  end if;

  if not exists (select 1 from public.fixed_expenses where user_id = v_user_id) then
    insert into public.fixed_expenses (user_id, name, amount_cents, currency)
    values
      (v_user_id, 'Miete', 90000, v_currency),
      (v_user_id, 'Netflix', 1599, v_currency),
      (v_user_id, 'Handy', 3000, v_currency),
      (v_user_id, 'Spotify', 999, v_currency);
  end if;

  select id into v_food_cat from public.budget_categories where key = 'lebensmittel';
  select id into v_out_cat from public.budget_categories where key = 'auswaerts';
  select id into v_freizeit_cat from public.budget_categories where key = 'freizeit';
  select id into v_shop_cat from public.budget_categories where key = 'shoppen';

  if v_food_cat is null or v_out_cat is null or v_freizeit_cat is null or v_shop_cat is null then
    raise exception 'budget_categories not seeded; run migrations/004_seed_lookups.sql first.';
  end if;

  if not exists (select 1 from public.budgets where user_id = v_user_id) then
    insert into public.budgets (user_id, category_id, name, limit_amount_cents, currency)
    values
      (v_user_id, v_food_cat, 'Lebensmittel', 35000, v_currency),
      (v_user_id, v_out_cat, 'Auswärts', 12000, v_currency),
      (v_user_id, v_freizeit_cat, 'Freizeit', 10000, v_currency),
      (v_user_id, v_shop_cat, 'Shoppen', 15000, v_currency);

    select id into v_budget_food from public.budgets where user_id = v_user_id and category_id = v_food_cat limit 1;
    select id into v_budget_out from public.budgets where user_id = v_user_id and category_id = v_out_cat limit 1;
    select id into v_budget_freizeit from public.budgets where user_id = v_user_id and category_id = v_freizeit_cat limit 1;
    select id into v_budget_shop from public.budgets where user_id = v_user_id and category_id = v_shop_cat limit 1;
  else
    select id into v_budget_food from public.budgets where user_id = v_user_id and category_id = v_food_cat limit 1;
    select id into v_budget_out from public.budgets where user_id = v_user_id and category_id = v_out_cat limit 1;
    select id into v_budget_freizeit from public.budgets where user_id = v_user_id and category_id = v_freizeit_cat limit 1;
    select id into v_budget_shop from public.budgets where user_id = v_user_id and category_id = v_shop_cat limit 1;
  end if;

  select id into v_income_gehalt from public.income_categories where key = 'gehalt';
  select id into v_income_nebenjob from public.income_categories where key = 'nebenjob';

  if v_income_gehalt is null then
    raise exception 'income_categories not seeded; run migrations/004_seed_lookups.sql first.';
  end if;

  if not exists (select 1 from public.transactions where user_id = v_user_id) then
    insert into public.transactions (
      user_id, type, amount_cents, currency, name,
      income_category_id, budget_category_id, budget_id, category_name,
      transaction_at, source
    )
    values
      (v_user_id, 'income', 320000, v_currency, 'Gehalt', v_income_gehalt, null, null, null, now() - interval '1 day', 'manual'),
      (v_user_id, 'income', 12000, v_currency, 'Nebenjob', v_income_nebenjob, null, null, null, now() - interval '5 days', 'manual'),
      (v_user_id, 'expense', 5200, v_currency, 'REWE Einkauf', null, v_food_cat, v_budget_food, 'Lebensmittel', now() - interval '2 days', 'manual'),
      (v_user_id, 'expense', 1800, v_currency, 'Coffee to go', null, v_food_cat, v_budget_food, 'Coffee 2 go', now() - interval '3 days', 'manual'),
      (v_user_id, 'expense', 2400, v_currency, 'Kino', null, v_freizeit_cat, v_budget_freizeit, 'Freizeit', now() - interval '6 days', 'manual'),
      (v_user_id, 'expense', 6500, v_currency, 'Restaurant', null, v_out_cat, v_budget_out, 'Auswärts', now() - interval '8 days', 'manual'),
      (v_user_id, 'expense', 12000, v_currency, 'Sneakers', null, v_shop_cat, v_budget_shop, 'Shoppen', now() - interval '12 days', 'manual');
  end if;

  if not exists (select 1 from public.goals where user_id = v_user_id) then
    insert into public.goals (user_id, name, icon, target_amount_cents, monthly_contribution_cents, created_in_onboarding)
    values (v_user_id, 'Urlaub', '🏖️', 150000, 20000, true)
    returning id into v_goal_id;
  else
    select id into v_goal_id from public.goals where user_id = v_user_id limit 1;
  end if;

  if v_goal_id is not null and not exists (select 1 from public.goal_contributions where user_id = v_user_id and goal_id = v_goal_id) then
    insert into public.goal_contributions (
      goal_id, user_id, amount_cents, currency, contribution_type, contribution_at, note
    )
    values
      (v_goal_id, v_user_id, 50000, v_currency, 'deposit', now() - interval '10 days', 'Startbetrag'),
      (v_goal_id, v_user_id, 25000, v_currency, 'deposit', now() - interval '3 days', 'Monatsrate');
  end if;
end $$;
