-- Server-authoritative XP RPCs for medium-risk client manipulation paths.

create or replace function public.get_xp_profile_timezone(
  input_user_id uuid
)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    nullif(
      (
        select btrim(settings.timezone)
        from public.user_settings settings
        where settings.user_id = input_user_id
        limit 1
      ),
      ''
    ),
    'UTC'
  );
$$;

create or replace function public.resolve_level_id_for_xp(
  input_xp_total integer
)
returns uuid
language sql
stable
set search_path = public
as $$
  select levels.id
  from public.levels
  where levels.xp_required <= greatest(input_xp_total, 0)
  order by levels.xp_required desc
  limit 1;
$$;

create or replace function public.get_xp_multiplier_for_event(
  input_event_type_id uuid,
  input_timezone text,
  input_reference_at timestamptz default now()
)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(
    max(
      case
        when rules.active = false then 1
        when rules.starts_at is not null and input_reference_at < rules.starts_at then 1
        when rules.ends_at is not null and input_reference_at > rules.ends_at then 1
        when coalesce(rules.conditions->>'type', '') = 'day_of_month'
          and extract(day from timezone(input_timezone, input_reference_at))::int =
            coalesce(nullif(rules.conditions->>'day', '')::integer, -1)
          then greatest(rules.multiplier, 1)
        when coalesce(rules.conditions->>'type', '') = '' then greatest(rules.multiplier, 1)
        else 1
      end
    ),
    1
  )
  from public.xp_event_rules rules
  where rules.event_type_id = input_event_type_id
    and rules.active = true;
$$;

create or replace function public.get_or_create_my_user_progress()
returns public.user_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  initial_level_id uuid;
  progress_row public.user_progress;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_my_user_row();

  select levels.id
  into initial_level_id
  from public.levels
  order by levels.xp_required asc
  limit 1;

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
    current_user_id,
    0,
    initial_level_id,
    0,
    0,
    null,
    null
  )
  on conflict (user_id) do nothing;

  select *
  into progress_row
  from public.user_progress
  where user_id = current_user_id
  limit 1;

  if progress_row.id is null then
    raise exception 'No user progress found';
  end if;

  return progress_row;
end;
$$;

create or replace function public.get_my_xp_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  progress_row public.user_progress;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  progress_row := public.get_or_create_my_user_progress();

  return jsonb_build_object(
    'levels',
    coalesce(
      (
        select jsonb_agg(to_jsonb(level_row) order by level_row.xp_required asc)
        from (
          select
            id,
            level_number,
            name,
            description,
            emoji,
            xp_required
          from public.levels
        ) level_row
      ),
      '[]'::jsonb
    ),
    'eventTypes',
    coalesce(
      (
        select jsonb_agg(to_jsonb(event_type_row) order by event_type_row.created_at asc)
        from (
          select
            id,
            key,
            label,
            base_xp,
            active,
            max_per_user,
            cooldown_hours
          from public.xp_event_types
          where active = true
        ) event_type_row
      ),
      '[]'::jsonb
    ),
    'eventRules',
    coalesce(
      (
        select jsonb_agg(to_jsonb(rule_row) order by rule_row.created_at asc)
        from (
          select
            id,
            event_type_id,
            rule_key,
            multiplier,
            conditions,
            active,
            starts_at,
            ends_at
          from public.xp_event_rules
          where active = true
        ) rule_row
      ),
      '[]'::jsonb
    ),
    'userProgress',
    to_jsonb(progress_row)
  );
end;
$$;

create or replace function public.award_my_xp_event(
  input_event_key text,
  input_source_type text default null,
  input_source_id uuid default null,
  input_meta jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  timezone_name text;
  event_type_row public.xp_event_types;
  progress_row public.user_progress;
  event_count integer := 0;
  last_event_at timestamptz;
  applied_multiplier numeric := 1;
  base_xp integer := 0;
  xp_delta integer := 0;
  next_total integer := 0;
  next_level_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.get_or_create_my_user_progress();

  select *
  into event_type_row
  from public.xp_event_types
  where key = nullif(btrim(input_event_key), '')
    and active = true
  limit 1;

  if event_type_row.id is null then
    raise exception 'XP event type not found';
  end if;

  select *
  into progress_row
  from public.user_progress
  where user_id = current_user_id
  for update;

  if progress_row.id is null then
    raise exception 'No user progress found';
  end if;

  if coalesce(event_type_row.max_per_user, 0) > 0 then
    select count(*)
    into event_count
    from public.xp_events
    where user_id = current_user_id
      and (
        event_type_id = event_type_row.id
        or event_type = event_type_row.key
      );

    if event_count >= event_type_row.max_per_user then
      return jsonb_build_object(
        'awarded', false,
        'xpDelta', 0,
        'appliedMultiplier', 1,
        'baseXp', event_type_row.base_xp,
        'nextTotal', progress_row.xp_total,
        'nextLevelId', progress_row.current_level_id,
        'userProgress', to_jsonb(progress_row)
      );
    end if;
  end if;

  if coalesce(event_type_row.cooldown_hours, 0) > 0 then
    select events.created_at
    into last_event_at
    from public.xp_events events
    where events.user_id = current_user_id
      and (
        events.event_type_id = event_type_row.id
        or events.event_type = event_type_row.key
      )
    order by events.created_at desc
    limit 1;

    if last_event_at is not null
      and last_event_at > now() - make_interval(hours => event_type_row.cooldown_hours) then
      return jsonb_build_object(
        'awarded', false,
        'xpDelta', 0,
        'appliedMultiplier', 1,
        'baseXp', event_type_row.base_xp,
        'nextTotal', progress_row.xp_total,
        'nextLevelId', progress_row.current_level_id,
        'userProgress', to_jsonb(progress_row)
      );
    end if;
  end if;

  timezone_name := public.get_xp_profile_timezone(current_user_id);
  applied_multiplier := public.get_xp_multiplier_for_event(
    event_type_row.id,
    timezone_name,
    now()
  );
  base_xp := greatest(event_type_row.base_xp, 0);
  xp_delta := greatest(round(base_xp * applied_multiplier)::integer, 0);

  if xp_delta <= 0 then
    return jsonb_build_object(
      'awarded', false,
      'xpDelta', 0,
      'appliedMultiplier', applied_multiplier,
      'baseXp', base_xp,
      'nextTotal', progress_row.xp_total,
      'nextLevelId', progress_row.current_level_id,
      'userProgress', to_jsonb(progress_row)
    );
  end if;

  next_total := progress_row.xp_total + xp_delta;
  next_level_id := public.resolve_level_id_for_xp(next_total);

  insert into public.xp_events (
    user_id,
    event_type,
    event_type_id,
    base_xp,
    applied_multiplier,
    xp_delta,
    source_type,
    source_id,
    meta
  )
  values (
    current_user_id,
    event_type_row.key,
    event_type_row.id,
    base_xp,
    applied_multiplier,
    xp_delta,
    nullif(btrim(input_source_type), ''),
    input_source_id,
    input_meta
  );

  update public.user_progress
  set
    xp_total = next_total,
    current_level_id = coalesce(next_level_id, current_level_id),
    updated_at = now()
  where user_id = current_user_id
  returning *
  into progress_row;

  return jsonb_build_object(
    'awarded', true,
    'xpDelta', xp_delta,
    'appliedMultiplier', applied_multiplier,
    'baseXp', base_xp,
    'nextTotal', progress_row.xp_total,
    'nextLevelId', progress_row.current_level_id,
    'userProgress', to_jsonb(progress_row)
  );
end;
$$;

create or replace function public.apply_my_daily_login_xp()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  timezone_name text;
  today_key date;
  yesterday_key date;
  progress_row public.user_progress;
  daily_event_row public.xp_event_types;
  streak_bonus_event_row public.xp_event_types;
  next_streak integer := 0;
  next_longest integer := 0;
  daily_multiplier numeric := 1;
  daily_xp_delta integer := 0;
  bonus_multiplier numeric := 1;
  bonus_xp_delta integer := 0;
  total_xp_delta integer := 0;
  next_total integer := 0;
  next_level_id uuid;
  streak_variant text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.get_or_create_my_user_progress();

  timezone_name := public.get_xp_profile_timezone(current_user_id);
  today_key := timezone(timezone_name, now())::date;
  yesterday_key := today_key - 1;

  select *
  into progress_row
  from public.user_progress
  where user_id = current_user_id
  for update;

  if progress_row.id is null then
    raise exception 'No user progress found';
  end if;

  if progress_row.last_streak_date = today_key then
    return jsonb_build_object(
      'awarded', false,
      'xpDelta', 0,
      'streakCount', progress_row.current_streak,
      'streakVariant', null,
      'userProgress', to_jsonb(progress_row)
    );
  end if;

  select *
  into daily_event_row
  from public.xp_event_types
  where key = 'daily_login'
    and active = true
  limit 1;

  if daily_event_row.id is null then
    raise exception 'Daily login event type not found';
  end if;

  next_streak := case
    when progress_row.last_streak_date = yesterday_key then progress_row.current_streak + 1
    else 1
  end;
  next_longest := greatest(progress_row.longest_streak, next_streak);
  daily_multiplier := public.get_xp_multiplier_for_event(
    daily_event_row.id,
    timezone_name,
    now()
  );
  daily_xp_delta := greatest(
    round(greatest(daily_event_row.base_xp, 0) * daily_multiplier)::integer,
    0
  );
  total_xp_delta := daily_xp_delta;

  insert into public.xp_events (
    user_id,
    event_type,
    event_type_id,
    base_xp,
    applied_multiplier,
    xp_delta,
    source_type,
    source_id,
    meta
  )
  values (
    current_user_id,
    daily_event_row.key,
    daily_event_row.id,
    greatest(daily_event_row.base_xp, 0),
    daily_multiplier,
    daily_xp_delta,
    null,
    null,
    jsonb_build_object('date', today_key::text)
  );

  if mod(next_streak, 7) = 0 then
    select *
    into streak_bonus_event_row
    from public.xp_event_types
    where key = 'streak_7_bonus'
      and active = true
    limit 1;

    if streak_bonus_event_row.id is not null then
      bonus_multiplier := public.get_xp_multiplier_for_event(
        streak_bonus_event_row.id,
        timezone_name,
        now()
      );
      bonus_xp_delta := greatest(
        round(greatest(streak_bonus_event_row.base_xp, 0) * bonus_multiplier)::integer,
        0
      );
      total_xp_delta := total_xp_delta + bonus_xp_delta;

      insert into public.xp_events (
        user_id,
        event_type,
        event_type_id,
        base_xp,
        applied_multiplier,
        xp_delta,
        source_type,
        source_id,
        meta
      )
      values (
        current_user_id,
        streak_bonus_event_row.key,
        streak_bonus_event_row.id,
        greatest(streak_bonus_event_row.base_xp, 0),
        bonus_multiplier,
        bonus_xp_delta,
        null,
        null,
        jsonb_build_object('streak', next_streak)
      );
    end if;

    streak_variant := 'completed';
  else
    streak_variant := 'ongoing';
  end if;

  next_total := progress_row.xp_total + total_xp_delta;
  next_level_id := public.resolve_level_id_for_xp(next_total);

  update public.user_progress
  set
    xp_total = next_total,
    current_level_id = coalesce(next_level_id, current_level_id),
    current_streak = next_streak,
    longest_streak = next_longest,
    last_login_at = now(),
    last_streak_date = today_key,
    updated_at = now()
  where user_id = current_user_id
  returning *
  into progress_row;

  return jsonb_build_object(
    'awarded', true,
    'xpDelta', total_xp_delta,
    'streakCount', next_streak,
    'streakVariant', streak_variant,
    'userProgress', to_jsonb(progress_row)
  );
end;
$$;

revoke all on function public.get_or_create_my_user_progress() from public;
grant execute on function public.get_or_create_my_user_progress() to authenticated;

revoke all on function public.get_my_xp_state() from public;
grant execute on function public.get_my_xp_state() to authenticated;

revoke all on function public.award_my_xp_event(text, text, uuid, jsonb) from public;
grant execute on function public.award_my_xp_event(text, text, uuid, jsonb) to authenticated;

revoke all on function public.apply_my_daily_login_xp() from public;
grant execute on function public.apply_my_daily_login_xp() to authenticated;
