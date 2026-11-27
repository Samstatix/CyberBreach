-- CyberBreach community teams.
-- Team membership and invite codes are managed only through trusted RPC functions.
-- Public rankings reveal aggregate CTF results only for teams that opt in.

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (length(trim(name)) between 3 and 40),
  description text not null default '' check (length(description) <= 280),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code_hash text not null check (invite_code_hash ~ '^[0-9a-f]{64}$'),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (user_id)
);

create index if not exists team_members_team_joined_idx
  on public.team_members (team_id, joined_at);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
revoke all on public.teams, public.team_members from anon, authenticated;

-- Create a team and return its invite code once. Only the SHA-256 digest is stored.
create or replace function public.create_community_team(
  p_name text,
  p_description text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_name text;
  v_description text;
  v_base_slug text;
  v_slug text;
  v_invite_code text;
  v_team_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Sign in before creating a team' using errcode = '28000';
  end if;

  v_name := trim(coalesce(p_name, ''));
  v_description := trim(coalesce(p_description, ''));

  if length(v_name) < 3 or length(v_name) > 40 then
    raise exception 'Team name must be between 3 and 40 characters' using errcode = '22023';
  end if;
  if length(v_description) > 280 then
    raise exception 'Team description must be 280 characters or fewer' using errcode = '22023';
  end if;

  if exists (select 1 from public.team_members where user_id = v_user_id) then
    raise exception 'You are already a member of a team. Leave it before creating another.' using errcode = '23505';
  end if;

  v_base_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
  if v_base_slug = '' then v_base_slug := 'team'; end if;
  v_slug := left(v_base_slug, 32) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  v_invite_code := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.teams (slug, name, description, owner_id, invite_code_hash)
  values (
    v_slug,
    v_name,
    v_description,
    v_user_id,
    encode(extensions.digest(v_invite_code, 'sha256'), 'hex')
  )
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, v_user_id, 'owner');

  return jsonb_build_object(
    'team_id', v_team_id,
    'slug', v_slug,
    'name', v_name,
    'invite_code', v_invite_code
  );
end;
$$;

-- Join using a high-entropy invitation code. A user can belong to one team at a time.
create or replace function public.join_community_team(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_team_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Sign in before joining a team' using errcode = '28000';
  end if;

  if p_invite_code is null or length(trim(p_invite_code)) <> 48 then
    raise exception 'Enter a valid team invitation code' using errcode = '22023';
  end if;

  select team.id into v_team_id
  from public.teams as team
  where team.invite_code_hash = encode(extensions.digest(trim(p_invite_code), 'sha256'), 'hex');

  if v_team_id is null then
    raise exception 'Invitation code is invalid or has been rotated' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.team_members where user_id = v_user_id and team_id = v_team_id) then
    return public.get_my_community_team();
  end if;

  if exists (select 1 from public.team_members where user_id = v_user_id) then
    raise exception 'You already belong to a team. Leave your current team first.' using errcode = '23505';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, v_user_id, 'member');

  return public.get_my_community_team();
end;
$$;

-- Return only the signed-in user's team and the names of its members. No emails or invite hashes.
create or replace function public.get_my_community_team()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_team jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select jsonb_build_object(
    'team_id', team.id,
    'slug', team.slug,
    'name', team.name,
    'description', team.description,
    'is_public', team.is_public,
    'role', mine.role,
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'username', profile.username,
          'display_name', profile.display_name,
          'role', member.role,
          'joined_at', member.joined_at
        )
        order by case when member.role = 'owner' then 0 else 1 end, member.joined_at
      )
      from public.team_members as member
      join public.profiles as profile on profile.id = member.user_id
      where member.team_id = team.id
    ), '[]'::jsonb)
  )
  into v_team
  from public.team_members as mine
  join public.teams as team on team.id = mine.team_id
  where mine.user_id = v_user_id;

  return v_team;
end;
$$;

create or replace function public.leave_community_team(p_team_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  delete from public.team_members
  where team_id = p_team_id and user_id = auth.uid() and role = 'member';
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise exception 'Team owners must dissolve the team or transfer ownership before leaving' using errcode = '42501';
  end if;

  return true;
end;
$$;

create or replace function public.dissolve_community_team(p_team_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  delete from public.teams
  where id = p_team_id and owner_id = auth.uid();
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise exception 'Only the team owner can dissolve this team' using errcode = '42501';
  end if;

  return true;
end;
$$;

create or replace function public.rotate_community_team_invite(p_team_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invite_code text;
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_invite_code := encode(extensions.gen_random_bytes(24), 'hex');
  update public.teams
  set invite_code_hash = encode(extensions.digest(v_invite_code, 'sha256'), 'hex'),
      updated_at = now()
  where id = p_team_id and owner_id = auth.uid();

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Only the team owner can rotate this invitation' using errcode = '42501';
  end if;

  return v_invite_code;
end;
$$;

create or replace function public.set_community_team_visibility(
  p_team_id uuid,
  p_is_public boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.teams
  set is_public = coalesce(p_is_public, false), updated_at = now()
  where id = p_team_id and owner_id = auth.uid();

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Only the team owner can change team visibility' using errcode = '42501';
  end if;

  return true;
end;
$$;

-- Public ranking is opt-in and counts verified CTF points only, never Academy or practice XP.
create or replace function public.get_public_team_leaderboard(p_limit integer default 25)
returns table (
  position integer,
  team_slug text,
  team_name text,
  member_count bigint,
  points bigint,
  solves bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with team_points as (
    select member.team_id, sum(ledger.points)::bigint as total_points
    from public.team_members as member
    join public.xp_ledger as ledger
      on ledger.user_id = member.user_id
     and ledger.event_type = 'challenge_solve'
    group by member.team_id
  ),
  team_solves as (
    select member.team_id, count(solve.challenge_id)::bigint as total_solves
    from public.team_members as member
    join public.challenge_solves as solve on solve.user_id = member.user_id
    group by member.team_id
  ),
  ranked as (
    select
      team.slug,
      team.name,
      count(member.user_id)::bigint as members,
      coalesce(team_points.total_points, 0)::bigint as points,
      coalesce(team_solves.total_solves, 0)::bigint as solves
    from public.teams as team
    left join public.team_members as member on member.team_id = team.id
    left join team_points on team_points.team_id = team.id
    left join team_solves on team_solves.team_id = team.id
    where team.is_public = true
    group by team.id, team.slug, team.name, team_points.total_points, team_solves.total_solves
  )
  select
    row_number() over (order by ranked.points desc, ranked.solves desc, ranked.slug)::integer,
    ranked.slug,
    ranked.name,
    ranked.members,
    ranked.points,
    ranked.solves
  from ranked
  order by ranked.points desc, ranked.solves desc, ranked.slug
  limit least(greatest(coalesce(p_limit, 25), 1), 100);
$$;

revoke all on function public.create_community_team(text, text) from public, anon;
revoke all on function public.join_community_team(text) from public, anon;
revoke all on function public.get_my_community_team() from public, anon;
revoke all on function public.leave_community_team(uuid) from public, anon;
revoke all on function public.dissolve_community_team(uuid) from public, anon;
revoke all on function public.rotate_community_team_invite(uuid) from public, anon;
revoke all on function public.set_community_team_visibility(uuid, boolean) from public, anon;
revoke all on function public.get_public_team_leaderboard(integer) from public;

grant execute on function public.create_community_team(text, text) to authenticated;
grant execute on function public.join_community_team(text) to authenticated;
grant execute on function public.get_my_community_team() to authenticated;
grant execute on function public.leave_community_team(uuid) to authenticated;
grant execute on function public.dissolve_community_team(uuid) to authenticated;
grant execute on function public.rotate_community_team_invite(uuid) to authenticated;
grant execute on function public.set_community_team_visibility(uuid, boolean) to authenticated;
grant execute on function public.get_public_team_leaderboard(integer) to anon, authenticated;

comment on table public.teams is
  'Community teams. Public ranking is opt-in; invite codes are stored only as hashes.';
comment on table public.team_members is
  'Private team membership. Membership changes are available only through authenticated RPC functions.';
comment on function public.get_my_community_team() is
  'Returns the current user team and member display names without exposing emails or invitation hashes.';
comment on function public.get_public_team_leaderboard(integer) is
  'Returns aggregate CTF-only team rankings for teams that explicitly opted into public visibility.';
