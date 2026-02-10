-- Seed mock data for a specific user

DO $$
DECLARE
  v_user_id uuid := 'a79fda77-6b3b-452d-aed3-77216117652c';
  v_has_auth_user boolean;

  v_level_id uuid;
  v_budget_cat_food uuid;
  v_budget_cat_mob uuid;
  v_budget_cat_coffee uuid;
  v_income_cat_salary uuid;

  v_goal_id uuid := 'b3ad2aa1-3d06-4050-a4b1-cd2eca1749a9';
  v_budget_food_id uuid := '46503dab-1e66-4962-8d2d-426fa6d3267a';
  v_budget_mob_id uuid := 'af38284f-6867-43b8-aec4-b35bc568195e';

  v_tx_salary_id uuid := '8d122404-243b-452d-a5f8-c3ae9a608f1c';
  v_tx_rent_id uuid := '681ed038-7a00-432f-889e-570ebc1f6538';
  v_tx_groceries_id uuid := '477db946-c719-40c6-ad3b-fe332d5b24aa';
  v_tx_gas_id uuid := 'ce2ed0a2-e9fa-474c-b34d-33431e8aa3dd';
  v_tx_coffee_id uuid := 'aafccc74-7c1b-41b0-b691-10ef694435e6';
  v_tx_goal_deposit_id uuid := 'b8ddb638-b856-4aaf-b5fa-eee9738518bc';

  v_goal_contrib_id uuid := 'fac7af4a-5437-4de8-84e7-b9a5976a1db5';

  v_xp_event_1 uuid := '13c03554-8bfe-49ba-98a4-aeae9513ea8a';
  v_xp_event_2 uuid := '78b2955c-16b6-4516-8341-932ef0cdd1b0';
  v_xp_event_3 uuid := '9d768b4d-102a-4407-a2a5-f133c1f8b02b';

  v_fixed_rent_id uuid := 'c4eb2dee-b884-4cf0-9bd5-3c1ce0cdc8aa';
  v_fixed_sub_id uuid := '1a2f315b-34f8-4d00-8fa3-0ad7a51b3b22';

  v_income_source_id uuid := 'fe26b09c-33dd-4308-9a7a-62dd706e1186';
BEGIN
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id)
    INTO v_has_auth_user;

  IF NOT v_has_auth_user THEN
    RAISE NOTICE 'Seed skipped: auth.users not found for %', v_user_id;
    RETURN;
  END IF;

  INSERT INTO public.users (id, name, status, created_at, updated_at)
  VALUES (v_user_id, 'Mia Muster', 'published', '2025-12-15T09:00:00Z', now())
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        updated_at = now();

  SELECT id INTO v_level_id
  FROM public.levels
  WHERE level_number = 2;

  SELECT id INTO v_budget_cat_food
  FROM public.budget_categories
  WHERE key = 'lebensmittel';

  SELECT id INTO v_budget_cat_mob
  FROM public.budget_categories
  WHERE key = 'mobilitaet';

  SELECT id INTO v_budget_cat_coffee
  FROM public.budget_categories
  WHERE key = 'coffee';

  SELECT id INTO v_income_cat_salary
  FROM public.income_categories
  WHERE key = 'gehalt';

  IF v_budget_cat_food IS NULL OR v_budget_cat_mob IS NULL OR v_budget_cat_coffee IS NULL THEN
    RAISE EXCEPTION 'Missing budget_categories keys (lebensmittel, mobilitaet, coffee)';
  END IF;

  IF v_income_cat_salary IS NULL THEN
    RAISE EXCEPTION 'Missing income_categories key (gehalt)';
  END IF;

  INSERT INTO public.user_financial_profiles (
    user_id,
    initial_savings_cents,
    currency,
    as_of_date,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    245000,
    'EUR',
    '2026-01-01',
    '2026-01-01T08:00:00Z',
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET initial_savings_cents = EXCLUDED.initial_savings_cents,
        currency = EXCLUDED.currency,
        as_of_date = EXCLUDED.as_of_date,
        updated_at = now();

  INSERT INTO public.user_progress (
    user_id,
    xp_total,
    current_level_id,
    current_streak,
    longest_streak,
    last_login_at,
    last_streak_date,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    230,
    v_level_id,
    4,
    7,
    '2026-01-26T19:30:00Z',
    '2026-01-26',
    '2026-01-01T08:00:00Z',
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET xp_total = EXCLUDED.xp_total,
        current_level_id = EXCLUDED.current_level_id,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_login_at = EXCLUDED.last_login_at,
        last_streak_date = EXCLUDED.last_streak_date,
        updated_at = now();

  INSERT INTO public.income_sources (
    id,
    user_id,
    name,
    amount_cents,
    frequency,
    currency,
    start_date,
    created_at,
    updated_at
  )
  VALUES (
    v_income_source_id,
    v_user_id,
    'Gehalt (Netto)',
    280000,
    'monthly',
    'EUR',
    '2025-11-01',
    '2026-01-01T08:05:00Z',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.fixed_expenses (
    id,
    user_id,
    name,
    amount_cents,
    frequency,
    currency,
    start_date,
    created_at,
    updated_at
  )
  VALUES
    (
      v_fixed_rent_id,
      v_user_id,
      'Miete',
      95000,
      'monthly',
      'EUR',
      '2025-10-01',
      '2026-01-01T08:10:00Z',
      now()
    ),
    (
      v_fixed_sub_id,
      v_user_id,
      'Streaming Abo',
      1299,
      'monthly',
      'EUR',
      '2025-09-15',
      '2026-01-01T08:10:00Z',
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.budgets (
    id,
    user_id,
    category_id,
    name,
    limit_amount_cents,
    period,
    currency,
    start_date,
    is_active,
    created_at,
    updated_at
  )
  VALUES
    (
      v_budget_food_id,
      v_user_id,
      v_budget_cat_food,
      'Lebensmittel Monat',
      32000,
      'monthly',
      'EUR',
      '2026-01-01',
      true,
      '2026-01-01T08:15:00Z',
      now()
    ),
    (
      v_budget_mob_id,
      v_user_id,
      v_budget_cat_mob,
      'Mobilität',
      18000,
      'monthly',
      'EUR',
      '2026-01-01',
      true,
      '2026-01-01T08:15:00Z',
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.transactions (
    id,
    user_id,
    type,
    amount_cents,
    currency,
    name,
    category_name,
    income_category_id,
    budget_category_id,
    budget_id,
    transaction_at,
    source,
    created_at,
    updated_at
  )
  VALUES
    (
      v_tx_salary_id,
      v_user_id,
      'income',
      280000,
      'EUR',
      'Gehalt Januar',
      'Gehalt',
      v_income_cat_salary,
      null,
      null,
      '2026-01-02T08:00:00Z',
      'manual',
      '2026-01-02T08:01:00Z',
      now()
    ),
    (
      v_tx_rent_id,
      v_user_id,
      'expense',
      95000,
      'EUR',
      'Miete Januar',
      'Wohnen',
      null,
      null,
      null,
      '2026-01-03T09:00:00Z',
      'manual',
      '2026-01-03T09:01:00Z',
      now()
    ),
    (
      v_tx_groceries_id,
      v_user_id,
      'expense',
      7850,
      'EUR',
      'Edeka Einkauf',
      'Lebensmittel',
      null,
      v_budget_cat_food,
      v_budget_food_id,
      '2026-01-05T17:20:00Z',
      'manual',
      '2026-01-05T17:21:00Z',
      now()
    ),
    (
      v_tx_gas_id,
      v_user_id,
      'expense',
      6200,
      'EUR',
      'Tanken',
      'Mobilität',
      null,
      v_budget_cat_mob,
      v_budget_mob_id,
      '2026-01-09T18:10:00Z',
      'manual',
      '2026-01-09T18:11:00Z',
      now()
    ),
    (
      v_tx_coffee_id,
      v_user_id,
      'expense',
      450,
      'EUR',
      'Coffee 2 Go',
      'Coffee 2 go',
      null,
      v_budget_cat_coffee,
      null,
      '2026-01-12T08:35:00Z',
      'manual',
      '2026-01-12T08:36:00Z',
      now()
    ),
    (
      v_tx_goal_deposit_id,
      v_user_id,
      'expense',
      15000,
      'EUR',
      'Sparziel Einzahlung',
      'Sparziel',
      null,
      null,
      null,
      '2026-01-15T19:00:00Z',
      'manual',
      '2026-01-15T19:01:00Z',
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.goals (
    id,
    user_id,
    name,
    icon,
    target_amount_cents,
    monthly_contribution_cents,
    status,
    created_in_onboarding,
    created_at,
    updated_at
  )
  VALUES (
    v_goal_id,
    v_user_id,
    'Notgroschen',
    'shield',
    150000,
    15000,
    'active',
    false,
    '2026-01-01T08:20:00Z',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.goal_contributions (
    id,
    goal_id,
    user_id,
    amount_cents,
    currency,
    contribution_type,
    contribution_at,
    transaction_id,
    note,
    created_at,
    updated_at
  )
  VALUES (
    v_goal_contrib_id,
    v_goal_id,
    v_user_id,
    15000,
    'EUR',
    'deposit',
    '2026-01-15T19:00:00Z',
    v_tx_goal_deposit_id,
    'Erster Monatsbeitrag',
    '2026-01-15T19:02:00Z',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.xp_events (
    id,
    user_id,
    event_type,
    xp_delta,
    source_type,
    source_id,
    meta,
    created_at,
    event_type_id,
    base_xp,
    applied_multiplier
  )
  VALUES
    (
      v_xp_event_1,
      v_user_id,
      'daily_login',
      5,
      'app',
      null,
      jsonb_build_object('day', '2026-01-24'),
      '2026-01-24T07:00:00Z',
      (select id from public.xp_event_types where key = 'daily_login'),
      5,
      1
    ),
    (
      v_xp_event_2,
      v_user_id,
      'snap_created',
      25,
      'transaction',
      v_tx_groceries_id,
      jsonb_build_object('transaction_id', v_tx_groceries_id),
      '2026-01-05T17:22:00Z',
      (select id from public.xp_event_types where key = 'snap_created'),
      25,
      1
    ),
    (
      v_xp_event_3,
      v_user_id,
      'goal_reached',
      200,
      'goal',
      v_goal_id,
      jsonb_build_object('goal_id', v_goal_id),
      '2026-01-15T19:05:00Z',
      (select id from public.xp_event_types where key = 'goal_reached'),
      200,
      1
    )
  ON CONFLICT (id) DO NOTHING;
END $$;
