-- Seed lookup data for categories and subscription plans

-- Budget categories (from client/constants/budgetCategories.ts)
insert into public.budget_categories (key, name, icon, color)
values
  ('lebensmittel', 'Lebensmittel', 'shopping-cart', '#F59E0B'),
  ('essen-trinken', 'Essen & Trinken', 'coffee', '#EF4444'),
  ('feiern', 'Feiern', 'music', '#8B5CF6'),
  ('shoppen', 'Shoppen', 'shopping-bag', '#EC4899'),
  ('sprit', 'Sprit', 'truck', '#6366F1'),
  ('auswaerts', 'Auswärts', 'map-pin', '#10B981'),
  ('freizeit', 'Freizeit', 'sun', '#F97316'),
  ('events', 'Events', 'calendar', '#3B82F6'),
  ('mobilitaet', 'Mobilität', 'navigation', '#14B8A6'),
  ('coffee', 'Coffee 2 go', 'coffee', '#78350F')
on conflict (key) do nothing;

-- Income categories (from client/screens/AddScreen.tsx + IncomeScreen.tsx/InsightsScreen.tsx)
insert into public.income_categories (key, name, icon)
values
  ('gehalt', 'Gehalt', 'briefcase'),
  ('nebenjob', 'Nebenjob', 'clock'),
  ('freelance', 'Freelance', 'code'),
  ('mieteinnahmen', 'Mieteinnahmen', 'home'),
  ('dividenden', 'Dividenden', 'trending-up'),
  ('kindergeld', 'Kindergeld', 'users'),
  ('rente', 'Rente', 'award'),
  ('geschenke', 'Geschenke', 'gift'),
  ('investitionen', 'Investitionen', 'trending-up'),
  ('sonstiges', 'Sonstiges', 'more-horizontal')
on conflict (key) do nothing;

-- Subscription plans (Stripe IDs to be filled)
insert into public.subscription_plans (
  code,
  name,
  stripe_product_id,
  stripe_price_id,
  price_amount_cents,
  currency,
  billing_interval
)
values
  ('monthly', 'Monthly Pro', 'REPLACE_WITH_STRIPE_PRODUCT_ID', 'REPLACE_WITH_STRIPE_PRICE_ID_MONTHLY', 299, 'EUR', 'monthly'),
  ('yearly', 'Yearly Pro', 'REPLACE_WITH_STRIPE_PRODUCT_ID', 'REPLACE_WITH_STRIPE_PRICE_ID_YEARLY', 2999, 'EUR', 'yearly'),
  ('lifetime', 'Lifetime Pro', 'REPLACE_WITH_STRIPE_PRODUCT_ID', 'REPLACE_WITH_STRIPE_PRICE_ID_LIFETIME', 8999, 'EUR', 'one_time')
on conflict (code) do nothing;
