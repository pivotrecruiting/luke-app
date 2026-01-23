-- User settings, levels, XP, streaks

create type public.language_code as enum ('de', 'en');
create type public.theme_preference as enum ('system', 'light', 'dark');

create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  language public.language_code not null default 'de',
  theme public.theme_preference not null default 'system',
  daily_reminder_enabled boolean not null default false,
  weekly_report_enabled boolean not null default false,
  monthly_reminder_enabled boolean not null default false,
  timezone text null,
  reminder_time time null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  level_number integer not null unique,
  name text not null,
  emoji text not null,
  xp_required integer not null check (xp_required >= 0)
);

insert into public.levels (level_number, name, emoji, xp_required)
values
  (1, 'Sparfuchs', '🦊', 0),
  (2, 'Aktiv', '✨', 500),
  (3, 'Pro', '💎', 1500),
  (4, 'Elite', '🛡️', 3500),
  (5, 'Icon', '👑', 7500);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  xp_total integer not null default 0 check (xp_total >= 0),
  current_level_id uuid null references public.levels (id),
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_login_at timestamptz null,
  last_streak_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  event_type text not null,
  xp_delta integer not null,
  source_type text null,
  source_id uuid null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

create index xp_events_user_time_idx on public.xp_events (user_id, created_at);
