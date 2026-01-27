-- XP event types and rules for configurable XP logic (Option A: app evaluates rules)

create table public.xp_event_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  base_xp integer not null check (base_xp >= 0),
  active boolean not null default true,
  max_per_user integer null,
  cooldown_hours integer null,
  created_at timestamptz not null default now()
);

create table public.xp_event_rules (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.xp_event_types (id) on delete cascade,
  rule_key text not null,
  multiplier numeric not null default 1 check (multiplier > 0),
  conditions jsonb not null,
  active boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  created_at timestamptz not null default now(),
  unique (event_type_id, rule_key)
);

create index xp_event_rules_event_type_idx on public.xp_event_rules (event_type_id);

alter table public.xp_events
  add column event_type_id uuid null references public.xp_event_types (id),
  add column base_xp integer null,
  add column applied_multiplier numeric not null default 1;

create index xp_events_event_type_idx on public.xp_events (event_type_id);

update public.xp_events
set base_xp = xp_delta
where base_xp is null;

update public.xp_events
set applied_multiplier = 1
where applied_multiplier is null;

-- Seed XP event types (idempotent)
insert into public.xp_event_types (key, label, base_xp, max_per_user, cooldown_hours)
values
  ('snap_created', 'Eintrag erstellt', 25, null, null),
  ('first_snap_tutorial', 'Erster Snap (Tutorial)', 100, 1, null),
  ('daily_login', 'Täglicher Login', 5, null, 24),
  ('streak_7_bonus', '7-Tage-Streak Bonus', 150, null, null),
  ('goal_reached', 'Sparziel erreicht', 200, null, null)
on conflict (key) do nothing;

update public.xp_events e
set event_type_id = t.id
from public.xp_event_types t
where e.event_type = t.key
  and e.event_type_id is null;

-- Seed XP rule: Payday double XP for snaps (1st of month)
insert into public.xp_event_rules (event_type_id, rule_key, multiplier, conditions)
select id, 'payday_double_snap', 2, jsonb_build_object('type', 'day_of_month', 'day', 1)
from public.xp_event_types
where key = 'snap_created'
on conflict (event_type_id, rule_key) do nothing;

-- RLS
alter table public.xp_event_types enable row level security;
alter table public.xp_event_rules enable row level security;

create policy xp_event_types_select
  on public.xp_event_types
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy xp_event_types_manage
  on public.xp_event_types
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

create policy xp_event_rules_select
  on public.xp_event_rules
  for select
  using (auth.role() in ('authenticated', 'service_role'));

create policy xp_event_rules_manage
  on public.xp_event_rules
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));
