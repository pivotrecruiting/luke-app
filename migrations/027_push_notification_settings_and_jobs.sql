-- Push notification settings, tokens, campaigns, jobs, and secure RPCs.

alter table public.user_settings
  add column if not exists push_notifications_enabled boolean not null default false,
  add column if not exists trial_ending_push_enabled boolean not null default true,
  add column if not exists weekly_report_day smallint null check (weekly_report_day between 1 and 7),
  add column if not exists monthly_reminder_day smallint null check (monthly_reminder_day between 1 and 31);

update public.user_settings
set
  weekly_report_day = coalesce(weekly_report_day, 1),
  monthly_reminder_day = coalesce(monthly_reminder_day, 1),
  updated_at = now()
where weekly_report_day is null
   or monthly_reminder_day is null;

alter table public.user_settings
  alter column weekly_report_day set default 1,
  alter column monthly_reminder_day set default 1;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null check (btrim(provider) <> ''),
  token text not null unique check (btrim(token) <> ''),
  platform text not null check (platform in ('ios', 'android')),
  device_id text null,
  app_build text null,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx
  on public.push_tokens (user_id);

create index if not exists push_tokens_active_user_idx
  on public.push_tokens (user_id)
  where is_active = true;

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at
before update on public.push_tokens
for each row execute function public.set_updated_at();

create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (btrim(key) <> ''),
  channel text not null default 'push' check (channel = 'push'),
  is_enabled boolean not null default true,
  default_title_key text null,
  default_body_key text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_campaigns_set_updated_at on public.notification_campaigns;
create trigger notification_campaigns_set_updated_at
before update on public.notification_campaigns
for each row execute function public.set_updated_at();

insert into public.notification_campaigns (
  key,
  channel,
  is_enabled,
  default_title_key,
  default_body_key
)
values
  ('daily_habit', 'push', true, 'notifications.daily_habit.title', 'notifications.daily_habit.body'),
  ('weekly_wrap_up', 'push', true, 'notifications.weekly_wrap_up.title', 'notifications.weekly_wrap_up.body'),
  ('monthly_check', 'push', true, 'notifications.monthly_check.title', 'notifications.monthly_check.body'),
  ('trial_ending', 'push', true, 'notifications.trial_ending.title', 'notifications.trial_ending.body')
on conflict (key) do update
set
  channel = excluded.channel,
  is_enabled = excluded.is_enabled,
  default_title_key = excluded.default_title_key,
  default_body_key = excluded.default_body_key,
  updated_at = now();

create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  campaign_id uuid not null references public.notification_campaigns (id) on delete restrict,
  scheduled_for timestamptz not null,
  status text not null check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  dedupe_key text not null unique check (btrim(dedupe_key) <> ''),
  payload jsonb not null default '{}'::jsonb,
  error_message text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_jobs_status_scheduled_for_idx
  on public.notification_jobs (status, scheduled_for);

create index if not exists notification_jobs_user_campaign_idx
  on public.notification_jobs (user_id, campaign_id);

drop trigger if exists notification_jobs_set_updated_at on public.notification_jobs;
create trigger notification_jobs_set_updated_at
before update on public.notification_jobs
for each row execute function public.set_updated_at();

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_job_id uuid not null references public.notification_jobs (id) on delete cascade,
  push_token_id uuid not null references public.push_tokens (id) on delete cascade,
  provider_message_id text null,
  status text not null check (status in ('pending', 'sent', 'failed', 'invalid_token')),
  provider_response jsonb null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (notification_job_id, push_token_id)
);

create index if not exists notification_deliveries_job_idx
  on public.notification_deliveries (notification_job_id);

create index if not exists notification_deliveries_token_idx
  on public.notification_deliveries (push_token_id);

drop trigger if exists notification_deliveries_set_updated_at on public.notification_deliveries;
create trigger notification_deliveries_set_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_access on public.push_tokens;
create policy push_tokens_access
  on public.push_tokens
  for all
  using (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'))
  with check (auth.role() = 'service_role' or user_id = auth.uid() or public.has_role('admin'));

alter table public.notification_campaigns enable row level security;

drop policy if exists notification_campaigns_select on public.notification_campaigns;
create policy notification_campaigns_select
  on public.notification_campaigns
  for select
  using (auth.role() = 'service_role' or public.has_role('admin'));

drop policy if exists notification_campaigns_manage on public.notification_campaigns;
create policy notification_campaigns_manage
  on public.notification_campaigns
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

alter table public.notification_jobs enable row level security;

drop policy if exists notification_jobs_manage on public.notification_jobs;
create policy notification_jobs_manage
  on public.notification_jobs
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

alter table public.notification_deliveries enable row level security;

drop policy if exists notification_deliveries_manage on public.notification_deliveries;
create policy notification_deliveries_manage
  on public.notification_deliveries
  for all
  using (auth.role() = 'service_role' or public.has_role('admin'))
  with check (auth.role() = 'service_role' or public.has_role('admin'));

create or replace function public.ensure_my_notification_settings_row()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_user_row();

  insert into public.user_settings (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.get_my_notification_settings()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  settings_row public.user_settings%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_notification_settings_row();

  select *
  into settings_row
  from public.user_settings
  where user_id = current_user_id;

  return jsonb_build_object(
    'pushNotificationsEnabled', settings_row.push_notifications_enabled,
    'dailyReminderEnabled', settings_row.daily_reminder_enabled,
    'weeklyReportEnabled', settings_row.weekly_report_enabled,
    'monthlyReminderEnabled', settings_row.monthly_reminder_enabled,
    'trialEndingPushEnabled', settings_row.trial_ending_push_enabled,
    'timezone', settings_row.timezone,
    'reminderTime', case when settings_row.reminder_time is null then null else to_char(settings_row.reminder_time, 'HH24:MI:SS') end,
    'weeklyReportDay', settings_row.weekly_report_day,
    'monthlyReminderDay', settings_row.monthly_reminder_day
  );
end;
$$;

create or replace function public.update_my_notification_settings(
  input_push_notifications_enabled boolean,
  input_daily_reminder_enabled boolean,
  input_weekly_report_enabled boolean,
  input_monthly_reminder_enabled boolean,
  input_trial_ending_push_enabled boolean,
  input_timezone text,
  input_reminder_time text,
  input_weekly_report_day smallint,
  input_monthly_reminder_day smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_timezone text := nullif(btrim(input_timezone), '');
  normalized_reminder_time time := case
    when input_reminder_time is null or btrim(input_reminder_time) = '' then null
    else input_reminder_time::time
  end;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if input_weekly_report_day is not null and (input_weekly_report_day < 1 or input_weekly_report_day > 7) then
    raise exception 'weekly_report_day must be between 1 and 7';
  end if;

  if input_monthly_reminder_day is not null and (input_monthly_reminder_day < 1 or input_monthly_reminder_day > 31) then
    raise exception 'monthly_reminder_day must be between 1 and 31';
  end if;

  perform public.ensure_my_notification_settings_row();

  update public.user_settings
  set
    push_notifications_enabled = input_push_notifications_enabled,
    daily_reminder_enabled = input_daily_reminder_enabled,
    weekly_report_enabled = input_weekly_report_enabled,
    monthly_reminder_enabled = input_monthly_reminder_enabled,
    trial_ending_push_enabled = input_trial_ending_push_enabled,
    timezone = normalized_timezone,
    reminder_time = normalized_reminder_time,
    weekly_report_day = input_weekly_report_day,
    monthly_reminder_day = input_monthly_reminder_day,
    updated_at = now()
  where user_id = current_user_id;

  return public.get_my_notification_settings();
end;
$$;

create or replace function public.register_my_push_token(
  input_provider text,
  input_token text,
  input_platform text,
  input_device_id text default null,
  input_app_build text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_provider text := nullif(btrim(input_provider), '');
  normalized_token text := nullif(btrim(input_token), '');
  normalized_platform text := lower(nullif(btrim(input_platform), ''));
  normalized_device_id text := nullif(btrim(input_device_id), '');
  normalized_app_build text := nullif(btrim(input_app_build), '');
  token_row public.push_tokens%rowtype;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if normalized_provider is null then
    raise exception 'provider is required';
  end if;

  if normalized_token is null then
    raise exception 'token is required';
  end if;

  if normalized_platform not in ('ios', 'android') then
    raise exception 'platform must be ios or android';
  end if;

  perform public.ensure_my_user_row();

  insert into public.push_tokens (
    user_id,
    provider,
    token,
    platform,
    device_id,
    app_build,
    is_active,
    last_seen_at
  )
  values (
    current_user_id,
    normalized_provider,
    normalized_token,
    normalized_platform,
    normalized_device_id,
    normalized_app_build,
    true,
    now()
  )
  on conflict (token) do update
  set
    user_id = excluded.user_id,
    provider = excluded.provider,
    platform = excluded.platform,
    device_id = excluded.device_id,
    app_build = excluded.app_build,
    is_active = true,
    last_seen_at = now(),
    updated_at = now()
  returning *
  into token_row;

  return jsonb_build_object(
    'id', token_row.id,
    'provider', token_row.provider,
    'platform', token_row.platform,
    'isActive', token_row.is_active,
    'lastSeenAt', token_row.last_seen_at
  );
end;
$$;

create or replace function public.deactivate_my_push_token(
  input_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_token text := nullif(btrim(input_token), '');
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if normalized_token is null then
    raise exception 'token is required';
  end if;

  update public.push_tokens
  set
    is_active = false,
    updated_at = now()
  where user_id = current_user_id
    and token = normalized_token;
end;
$$;
