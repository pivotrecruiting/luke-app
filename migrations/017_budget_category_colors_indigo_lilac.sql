-- Budget category colors: palette anchored at #4A3AFF, #C5D2FD, #962DFF, #E0C6FD;
-- remaining keys use nearby tints in the same indigo / lilac family.

update public.budget_categories as bc
set color = v.color
from (
  values
    ('lebensmittel', '#4A3AFF'),
    ('essen-trinken', '#5C4DFF'),
    ('feiern', '#962DFF'),
    ('shoppen', '#C5D2FD'),
    ('sprit', '#6B5CFF'),
    ('auswaerts', '#E0C6FD'),
    ('freizeit', '#D4B8FF'),
    ('events', '#7A5FFF'),
    ('mobilitaet', '#B8A9FF'),
    ('coffee', '#E8DDFD'),
    ('sonstiges', '#AC8CFF')
) as v (key, color)
where bc.key = v.key;
