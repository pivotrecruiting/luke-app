-- Validate workshop codes before signup completes

create or replace function public.validate_workshop_code(input_code text)
returns table (
  status text,
  access_key text,
  trial_days integer,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(btrim(coalesce(input_code, '')));
  current_timestamp_utc timestamptz := now();
  code_row public.workshop_codes%rowtype;
  redemption_count integer := 0;
begin
  if normalized_code = '' then
    return query
    select 'invalid', null::text, null::integer, 'Workshop code is missing.';
    return;
  end if;

  select *
  into code_row
  from public.workshop_codes
  where code = normalized_code
  limit 1;

  if not found then
    return query
    select 'invalid', null::text, null::integer, 'Workshop code is invalid.';
    return;
  end if;

  if not code_row.active then
    return query
    select 'inactive', code_row.entitlement_key, code_row.trial_days, 'Workshop code is inactive.';
    return;
  end if;

  if code_row.starts_at is not null and current_timestamp_utc < code_row.starts_at then
    return query
    select 'inactive', code_row.entitlement_key, code_row.trial_days, 'Workshop code is not active yet.';
    return;
  end if;

  if code_row.ends_at is not null and current_timestamp_utc > code_row.ends_at then
    return query
    select 'expired', code_row.entitlement_key, code_row.trial_days, 'Workshop code has expired.';
    return;
  end if;

  if code_row.max_redemptions is not null then
    select count(*)
    into redemption_count
    from public.workshop_code_redemptions
    where workshop_code_id = code_row.id
      and request_status in ('redeemed', 'sync_pending', 'sync_failed');

    if redemption_count >= code_row.max_redemptions then
      return query
      select 'limit_reached', code_row.entitlement_key, code_row.trial_days, 'Workshop code redemption limit reached.';
      return;
    end if;
  end if;

  return query
  select 'valid', code_row.entitlement_key, code_row.trial_days, 'Workshop code is valid.';
end;
$$;

grant execute on function public.validate_workshop_code(text)
to anon, authenticated, service_role;
