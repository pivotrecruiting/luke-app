-- Notification queueing, claiming, and cron-backed generation infrastructure.

revoke all on function public.ensure_my_notification_settings_row() from public;
revoke all on function public.get_my_notification_settings() from public;
revoke all on function public.update_my_notification_settings(boolean, boolean, boolean, boolean, boolean, text, text, smallint, smallint) from public;
revoke all on function public.register_my_push_token(text, text, text, text, text) from public;
revoke all on function public.deactivate_my_push_token(text) from public;

grant execute on function public.ensure_my_notification_settings_row() to authenticated, service_role;
grant execute on function public.get_my_notification_settings() to authenticated, service_role;
grant execute on function public.update_my_notification_settings(boolean, boolean, boolean, boolean, boolean, text, text, smallint, smallint) to authenticated, service_role;
grant execute on function public.register_my_push_token(text, text, text, text, text) to authenticated, service_role;
grant execute on function public.deactivate_my_push_token(text) to authenticated, service_role;

create or replace function public.format_notification_amount(
  input_amount_cents bigint,
  input_currency public.currency_code
)
returns text
language sql
stable
set search_path = public
as $$
  select
    replace(to_char((greatest(input_amount_cents, 0)::numeric / 100.0), 'FM999999990.00'), '.', ',')
    || ' '
    || input_currency::text;
$$;

create or replace function public.queue_due_notification_jobs(
  input_reference_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  default_reminder_time constant time := '19:00'::time;
  schedule_window interval := interval '10 minutes';
  daily_count integer := 0;
  weekly_count integer := 0;
  monthly_count integer := 0;
  trial_count integer := 0;
begin
  with eligible_users as (
    select
      us.user_id,
      coalesce(nullif(btrim(us.timezone), ''), 'UTC') as timezone_name,
      coalesce(us.reminder_time, default_reminder_time) as reminder_time,
      coalesce(us.weekly_report_day, 1) as weekly_report_day,
      coalesce(us.monthly_reminder_day, 1) as monthly_reminder_day,
      us.daily_reminder_enabled,
      us.weekly_report_enabled,
      us.monthly_reminder_enabled,
      us.trial_ending_push_enabled,
      coalesce(fp.currency, 'EUR'::public.currency_code) as currency_code,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC')) as local_ts,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC'))::date as local_date
    from public.user_settings us
    left join public.user_financial_profiles fp
      on fp.user_id = us.user_id
    where us.push_notifications_enabled = true
      and exists (
        select 1
        from public.push_tokens pt
        where pt.user_id = us.user_id
          and pt.is_active = true
      )
  ),
  due_daily as (
    select
      eu.user_id,
      eu.timezone_name,
      eu.local_date,
      ((eu.local_date::timestamp + eu.reminder_time) at time zone eu.timezone_name) as scheduled_for
    from eligible_users eu
    where eu.daily_reminder_enabled = true
      and date_trunc('minute', eu.local_ts) >= (eu.local_date::timestamp + eu.reminder_time)
      and date_trunc('minute', eu.local_ts) < (eu.local_date::timestamp + eu.reminder_time + schedule_window)
  ),
  inserted as (
    insert into public.notification_jobs (
      user_id,
      campaign_id,
      scheduled_for,
      status,
      dedupe_key,
      payload
    )
    select
      dd.user_id,
      campaigns.id,
      dd.scheduled_for,
      'pending',
      'daily_habit:' || dd.user_id::text || ':' || dd.local_date::text,
      jsonb_build_object(
        'title', 'Geld ausgegeben heute?',
        'body', 'Nutze den Backtap! Dauert nur 3 Sekunden.',
        'deeplink', 'luke://add'
      )
    from due_daily dd
    cross join (
      select id
      from public.notification_campaigns
      where key = 'daily_habit'
      limit 1
    ) campaigns
    on conflict (dedupe_key) do nothing
    returning id
  )
  select count(*) into daily_count from inserted;

  with eligible_users as (
    select
      us.user_id,
      coalesce(nullif(btrim(us.timezone), ''), 'UTC') as timezone_name,
      coalesce(us.reminder_time, default_reminder_time) as reminder_time,
      coalesce(us.weekly_report_day, 1) as weekly_report_day,
      us.weekly_report_enabled,
      coalesce(fp.currency, 'EUR'::public.currency_code) as currency_code,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC')) as local_ts,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC'))::date as local_date
    from public.user_settings us
    left join public.user_financial_profiles fp
      on fp.user_id = us.user_id
    where us.push_notifications_enabled = true
      and us.weekly_report_enabled = true
      and exists (
        select 1
        from public.push_tokens pt
        where pt.user_id = us.user_id
          and pt.is_active = true
      )
  ),
  due_weekly as (
    select
      eu.user_id,
      eu.timezone_name,
      eu.currency_code,
      eu.local_ts,
      eu.local_date,
      date_trunc('week', eu.local_ts)::date as current_week_start,
      (date_trunc('week', eu.local_ts) - interval '1 week')::date as previous_week_start,
      ((eu.local_date::timestamp + eu.reminder_time) at time zone eu.timezone_name) as scheduled_for
    from eligible_users eu
    where extract(isodow from eu.local_ts)::int = eu.weekly_report_day
      and date_trunc('minute', eu.local_ts) >= (eu.local_date::timestamp + eu.reminder_time)
      and date_trunc('minute', eu.local_ts) < (eu.local_date::timestamp + eu.reminder_time + schedule_window)
  ),
  weekly_amounts as (
    select
      dw.user_id,
      dw.timezone_name,
      dw.currency_code,
      dw.scheduled_for,
      dw.previous_week_start,
      coalesce(sum(t.amount_cents), 0)::bigint as amount_cents
    from due_weekly dw
    left join public.transactions t
      on t.user_id = dw.user_id
      and t.type = 'expense'
      and (t.transaction_at at time zone dw.timezone_name) >= dw.previous_week_start::timestamp
      and (t.transaction_at at time zone dw.timezone_name) < dw.current_week_start::timestamp
    group by
      dw.user_id,
      dw.timezone_name,
      dw.currency_code,
      dw.scheduled_for,
      dw.previous_week_start
    having coalesce(sum(t.amount_cents), 0) > 0
  ),
  inserted as (
    insert into public.notification_jobs (
      user_id,
      campaign_id,
      scheduled_for,
      status,
      dedupe_key,
      payload
    )
    select
      wa.user_id,
      campaigns.id,
      wa.scheduled_for,
      'pending',
      'weekly_wrap_up:' || wa.user_id::text || ':' || wa.previous_week_start::text,
      jsonb_build_object(
        'title', 'Weekly Recap: ' || public.format_notification_amount(wa.amount_cents, wa.currency_code) || ' weg!',
        'body', 'Weisst du noch wofuer? Check deine Top-Ausgaben.',
        'deeplink', 'luke://insights'
      )
    from weekly_amounts wa
    cross join (
      select id
      from public.notification_campaigns
      where key = 'weekly_wrap_up'
      limit 1
    ) campaigns
    on conflict (dedupe_key) do nothing
    returning id
  )
  select count(*) into weekly_count from inserted;

  with eligible_users as (
    select
      us.user_id,
      coalesce(nullif(btrim(us.timezone), ''), 'UTC') as timezone_name,
      coalesce(us.reminder_time, default_reminder_time) as reminder_time,
      coalesce(us.monthly_reminder_day, 1) as monthly_reminder_day,
      us.monthly_reminder_enabled,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC')) as local_ts,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC'))::date as local_date
    from public.user_settings us
    where us.push_notifications_enabled = true
      and us.monthly_reminder_enabled = true
      and exists (
        select 1
        from public.push_tokens pt
        where pt.user_id = us.user_id
          and pt.is_active = true
      )
  ),
  due_monthly as (
    select
      eu.user_id,
      eu.timezone_name,
      eu.local_date,
      ((eu.local_date::timestamp + eu.reminder_time) at time zone eu.timezone_name) as scheduled_for
    from eligible_users eu
    where extract(day from eu.local_ts)::int = eu.monthly_reminder_day
      and date_trunc('minute', eu.local_ts) >= (eu.local_date::timestamp + eu.reminder_time)
      and date_trunc('minute', eu.local_ts) < (eu.local_date::timestamp + eu.reminder_time + schedule_window)
  ),
  inserted as (
    insert into public.notification_jobs (
      user_id,
      campaign_id,
      scheduled_for,
      status,
      dedupe_key,
      payload
    )
    select
      dm.user_id,
      campaigns.id,
      dm.scheduled_for,
      'pending',
      'monthly_check:' || dm.user_id::text || ':' || to_char(dm.local_date, 'YYYY-MM'),
      jsonb_build_object(
        'title', 'Wake up! It''s the 1st of the month!',
        'body', 'Fixkosten-Check. Alles ueberwiesen?',
        'deeplink', 'luke://home'
      )
    from due_monthly dm
    cross join (
      select id
      from public.notification_campaigns
      where key = 'monthly_check'
      limit 1
    ) campaigns
    on conflict (dedupe_key) do nothing
    returning id
  )
  select count(*) into monthly_count from inserted;

  with eligible_users as (
    select
      us.user_id,
      coalesce(nullif(btrim(us.timezone), ''), 'UTC') as timezone_name,
      coalesce(us.reminder_time, default_reminder_time) as reminder_time,
      us.trial_ending_push_enabled,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC')) as local_ts,
      (input_reference_at at time zone coalesce(nullif(btrim(us.timezone), ''), 'UTC'))::date as local_date
    from public.user_settings us
    where us.push_notifications_enabled = true
      and us.trial_ending_push_enabled = true
      and exists (
        select 1
        from public.push_tokens pt
        where pt.user_id = us.user_id
          and pt.is_active = true
      )
  ),
  config as (
    select paywall_show_days_before_expiry
    from public.billing_config
    where config_key = 'default'
    limit 1
  ),
  active_trial_grants as (
    select
      eu.user_id,
      eu.timezone_name,
      eu.local_ts,
      eu.local_date,
      eu.reminder_time,
      g.ends_at,
      coalesce(
        (g.metadata ->> 'paywall_visible_from')::timestamptz,
        g.ends_at - make_interval(days => (select paywall_show_days_before_expiry from config))
      ) as paywall_visible_from
    from eligible_users eu
    join public.user_access_grants g
      on g.user_id = eu.user_id
    where g.status = 'active'
      and g.starts_at <= input_reference_at
      and g.ends_at is not null
      and g.ends_at > input_reference_at
      and g.source_type in ('app_trial', 'legacy_trial')
      and not exists (
        select 1
        from public.user_access_grants paid
        where paid.user_id = eu.user_id
          and paid.status = 'active'
          and paid.starts_at <= input_reference_at
          and (paid.ends_at is null or paid.ends_at > input_reference_at)
          and paid.source_type not in ('app_trial', 'legacy_trial')
      )
  ),
  due_trial as (
    select
      atg.user_id,
      atg.timezone_name,
      atg.local_ts,
      atg.local_date,
      atg.ends_at,
      ((atg.local_date::timestamp + atg.reminder_time) at time zone atg.timezone_name) as scheduled_for
    from active_trial_grants atg
    cross join config
    where (atg.ends_at at time zone atg.timezone_name)::date =
      atg.local_date + (select paywall_show_days_before_expiry from config)
      and date_trunc('minute', atg.local_ts) >= (atg.local_date::timestamp + atg.reminder_time)
      and date_trunc('minute', atg.local_ts) < (atg.local_date::timestamp + atg.reminder_time + schedule_window)
  ),
  inserted as (
    insert into public.notification_jobs (
      user_id,
      campaign_id,
      scheduled_for,
      status,
      dedupe_key,
      payload
    )
    select
      dt.user_id,
      campaigns.id,
      dt.scheduled_for,
      'pending',
      'trial_ending:' || dt.user_id::text || ':' || (dt.ends_at at time zone dt.timezone_name)::date::text,
      jsonb_build_object(
        'title', 'Dein Trial endet in 3 Tagen!',
        'body', 'Upgrade jetzt, damit dein Zugang aktiv bleibt.',
        'deeplink', 'luke://paywall'
      )
    from due_trial dt
    cross join (
      select id
      from public.notification_campaigns
      where key = 'trial_ending'
      limit 1
    ) campaigns
    on conflict (dedupe_key) do nothing
    returning id
  )
  select count(*) into trial_count from inserted;

  return jsonb_build_object(
    'dailyHabit', daily_count,
    'weeklyWrapUp', weekly_count,
    'monthlyCheck', monthly_count,
    'trialEnding', trial_count,
    'total', daily_count + weekly_count + monthly_count + trial_count
  );
end;
$$;

create or replace function public.claim_pending_notification_jobs(
  input_limit integer default 100,
  input_reference_at timestamptz default now()
)
returns table (
  job_id uuid,
  user_id uuid,
  campaign_key text,
  payload jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate_jobs as (
    select j.id
    from public.notification_jobs j
    where j.status = 'pending'
      and j.scheduled_for <= input_reference_at
    order by j.scheduled_for asc, j.created_at asc
    limit greatest(1, least(coalesce(input_limit, 100), 500))
    for update skip locked
  ),
  claimed_jobs as (
    update public.notification_jobs j
    set
      status = 'processing',
      error_message = null,
      updated_at = now()
    where j.id in (select id from candidate_jobs)
    returning j.id, j.user_id, j.campaign_id, j.payload
  )
  select
    cj.id as job_id,
    cj.user_id,
    campaigns.key as campaign_key,
    cj.payload
  from claimed_jobs cj
  join public.notification_campaigns campaigns
    on campaigns.id = cj.campaign_id;
end;
$$;

revoke all on function public.queue_due_notification_jobs(timestamptz) from public;
revoke all on function public.claim_pending_notification_jobs(integer, timestamptz) from public;

grant execute on function public.queue_due_notification_jobs(timestamptz) to service_role;
grant execute on function public.claim_pending_notification_jobs(integer, timestamptz) to service_role;

do $$
begin
  begin
    create extension if not exists pg_cron with schema pg_catalog;
  exception
    when insufficient_privilege then
      raise notice 'pg_cron extension could not be enabled automatically.';
  end;

  begin
    create extension if not exists pg_net;
  exception
    when insufficient_privilege then
      raise notice 'pg_net extension could not be enabled automatically.';
  end;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'queue-due-notification-jobs-every-5-minutes',
      '*/5 * * * *',
      'select public.queue_due_notification_jobs(now());'
    );
  end if;

  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net')
     and exists (
       select 1
       from vault.decrypted_secrets
       where name = 'notification_dispatch_url'
     )
     and exists (
       select 1
       from vault.decrypted_secrets
       where name = 'notification_dispatch_auth_header'
     ) then
    perform cron.schedule(
      'dispatch-push-notifications-every-minute',
      '* * * * *',
      $inner$
      select
        net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'notification_dispatch_url'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', (select decrypted_secret from vault.decrypted_secrets where name = 'notification_dispatch_auth_header')
          ),
          body := jsonb_build_object('limit', 100),
          timeout_milliseconds := 10000
        ) as request_id;
      $inner$
    );
  else
    raise notice 'Notification dispatcher cron not scheduled automatically. Required vault secrets: notification_dispatch_url, notification_dispatch_auth_header.';
  end if;
end
$$;
