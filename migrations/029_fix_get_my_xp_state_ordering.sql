-- Fix get_my_xp_state ordering to avoid referencing columns that are not selected.

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
        select jsonb_agg(to_jsonb(event_type_row) order by event_type_row.key asc)
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
        select jsonb_agg(to_jsonb(rule_row) order by rule_row.rule_key asc)
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
