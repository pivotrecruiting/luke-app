-- Add "sonstiges" budget category for resolver fallback when unknown category names are used
insert into public.budget_categories (key, name, icon, color)
values ('sonstiges', 'Sonstiges', 'more-horizontal', '#6B7280')
on conflict (key) do nothing;
