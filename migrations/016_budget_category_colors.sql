-- Canonical hex colors per budget category (public.budget_categories.color).
-- The column exists since 001_core_schema.sql; this migration keeps repo and DB aligned
-- and is safe to apply on any environment (idempotent updates).

update public.budget_categories as bc
set color = v.color
from (
  values
    ('lebensmittel', '#F59E0B'),
    ('essen-trinken', '#EF4444'),
    ('feiern', '#8B5CF6'),
    ('shoppen', '#EC4899'),
    ('sprit', '#6366F1'),
    ('auswaerts', '#10B981'),
    ('freizeit', '#F97316'),
    ('events', '#3B82F6'),
    ('mobilitaet', '#14B8A6'),
    ('coffee', '#78350F'),
    ('sonstiges', '#6B7280')
) as v (key, color)
where bc.key = v.key;
