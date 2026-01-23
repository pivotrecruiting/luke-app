-- Base user/roles tables (aligned with Supabase auth.users)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('draft', 'published', 'archived');
  end if;
end $$;

create table public.users (
  id uuid not null,
  created_at timestamptz not null default now(),
  name text null,
  updated_at timestamptz null,
  status public.user_status not null default 'published',
  avatar jsonb null,
  constraint users_pkey primary key (id),
  constraint users_id_fkey foreign key (id) references auth.users (id) on delete cascade
);

create table public.roles (
  id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text null,
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name)
);

create table public.user_roles (
  id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null,
  role_id uuid not null,
  constraint user_roles_pkey primary key (id),
  constraint user_roles_user_id_role_id_key unique (user_id, role_id),
  constraint user_roles_role_id_fkey foreign key (role_id) references public.roles (id) on delete cascade,
  constraint user_roles_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade
);

insert into public.roles (name)
values ('admin'), ('user')
on conflict (name) do nothing;
