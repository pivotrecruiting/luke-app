-- Auth-related functions and trigger

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  avatar_url text;
  user_name text;
  default_role_id uuid;
begin
  avatar_url := coalesce(
    (new.raw_user_meta_data->>'picture'),
    (new.raw_user_meta_data->>'avatar_url')
  );

  user_name := coalesce(
    (new.raw_user_meta_data->>'name'),
    (new.raw_user_meta_data->>'full_name')
  );

  insert into public.users (id, name, avatar)
  values (
    new.id,
    user_name,
    case
      when avatar_url is not null then jsonb_build_object('url', avatar_url, 'provider', 'oauth')
      else null
    end
  )
  on conflict (id) do update
  set
    name = coalesce(excluded.name, public.users.name),
    avatar = coalesce(excluded.avatar, public.users.avatar),
    updated_at = now();

  select id into default_role_id
  from public.roles
  where name = 'user'
  limit 1;

  if default_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, default_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

-- Trigger on auth.users

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
