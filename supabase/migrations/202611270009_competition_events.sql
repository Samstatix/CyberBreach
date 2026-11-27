-- CyberBreach scheduled competitions and event registrations.
-- Event creation is moderator/admin-only. Participants and scores are derived
-- from verified challenge_solves, never from browser-submitted point totals.

create table if not exists public.competition_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 4 and 80),
  description text not null default '' check (length(description) <= 1200),
  event_type text not null check (event_type in ('individual', 'team')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_team_size integer not null default 1 check (max_team_size between 1 and 8),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((event_type = 'individual' and max_team_size = 1) or (event_type = 'team' and max_team_size between 2 and 8))
);

create table if not exists public.competition_event_challenges (
  event_id uuid not null references public.competition_events(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete restrict,
  primary key (event_id, challenge_id)
);

create table if not exists public.competition_event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.competition_events(id) on delete cascade,
  participant_type text not null check (participant_type in ('individual', 'team')),
  participant_id uuid not null,
  participant_name_snapshot text not null check (length(trim(participant_name_snapshot)) between 1 and 80),
  registered_by uuid not null references auth.users(id) on delete cascade,
  registered_at timestamptz not null default now(),
  unique (event_id, participant_type, participant_id)
);

-- Team membership is snapshotted at registration so later team changes do not
-- rewrite a competition roster or retroactively move event scores.
create table if not exists public.competition_event_team_members (
  registration_id uuid not null references public.competition_event_registrations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (registration_id, user_id)
);

create index if not exists competition_events_public_schedule_idx
  on public.competition_events (status, starts_at, ends_at);
create index if not exists competition_event_registrations_event_idx
  on public.competition_event_registrations (event_id, registered_at);
create index if not exists competition_event_team_members_user_idx
  on public.competition_event_team_members (user_id);

alter table public.competition_events enable row level security;
alter table public.competition_event_challenges enable row level security;
alter table public.competition_event_registrations enable row level security;
alter table public.competition_event_team_members enable row level security;
revoke all on public.competition_events, public.competition_event_challenges,
  public.competition_event_registrations, public.competition_event_team_members
from anon, authenticated;

create or replace function public.create_competition_event(
  p_title text,
  p_slug text,
  p_description text,
  p_event_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_max_team_size integer,
  p_challenge_slugs text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_event_id uuid;
  v_inserted integer;
  v_team_size integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = v_user_id and role in ('admin', 'moderator')
  ) then
    raise exception 'Only CyberBreach moderators can schedule competitions' using errcode = '42501';
  end if;

  if length(trim(coalesce(p_title, ''))) not between 4 and 80
     or p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or length(coalesce(p_description, '')) > 1200 then
    raise exception 'Enter a valid title, slug and description' using errcode = '22023';
  end if;

  if p_event_type is null or p_event_type not in ('individual', 'team') then
    raise exception 'Event type must be individual or team' using errcode = '22023';
  end if;

  if p_starts_at is null or p_ends_at is null
     or p_starts_at <= now()
     or p_ends_at <= p_starts_at
     or p_ends_at > p_starts_at + interval '14 days' then
    raise exception 'Events must start in the future and last no more than 14 days' using errcode = '22023';
  end if;

  v_team_size := case when p_event_type = 'individual' then 1 else coalesce(p_max_team_size, 4) end;
  if p_event_type = 'team' and v_team_size not between 2 and 8 then
    raise exception 'Team events must allow between 2 and 8 members' using errcode = '22023';
  end if;

  if p_challenge_slugs is null or cardinality(p_challenge_slugs) < 1
     or cardinality(p_challenge_slugs) > 30 then
    raise exception 'Select between 1 and 30 published challenges' using errcode = '22023';
  end if;

  insert into public.competition_events (
    slug, title, description, event_type, starts_at, ends_at,
    max_team_size, status, created_by
  ) values (
    lower(trim(p_slug)),
    trim(p_title),
    trim(coalesce(p_description, '')),
    p_event_type,
    p_starts_at,
    p_ends_at,
    v_team_size,
    'draft',
    v_user_id
  )
  returning id into v_event_id;

  insert into public.competition_event_challenges (event_id, challenge_id)
  select v_event_id, challenge.id
  from public.challenges as challenge
  where challenge.slug = any(p_challenge_slugs)
    and challenge.status = 'published';

  get diagnostics v_inserted = row_count;
  if v_inserted <> cardinality(p_challenge_slugs) then
    raise exception 'One or more challenge slugs are invalid, duplicated or unpublished' using errcode = '22023';
  end if;

  return v_event_id;
end;
$$;

create or replace function public.publish_competition_event(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ) then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;

  update public.competition_events
  set status = 'published', updated_at = now()
  where id = p_event_id
    and status = 'draft'
    and starts_at > now()
    and ends_at > starts_at
    and exists (select 1 from public.competition_event_challenges where event_id = p_event_id);

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Event cannot be published. Check its status, schedule and challenge list.' using errcode = '22023';
  end if;
  return true;
end;
$$;

create or replace function public.cancel_competition_event(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ) then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;

  update public.competition_events
  set status = 'cancelled', updated_at = now()
  where id = p_event_id and status <> 'cancelled';

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Event not found or already cancelled' using errcode = 'P0002';
  end if;
  return true;
end;
$$;

create or replace function public.get_public_competition_events(p_limit integer default 25)
returns table (
  event_id uuid,
  slug text,
  title text,
  description text,
  event_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  max_team_size integer,
  challenge_count bigint,
  registered_count bigint,
  is_registered boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    event.id,
    event.slug,
    event.title,
    event.description,
    event.event_type,
    event.starts_at,
    event.ends_at,
    event.max_team_size,
    (select count(*)::bigint from public.competition_event_challenges as ec where ec.event_id = event.id),
    (select count(*)::bigint from public.competition_event_registrations as registration where registration.event_id = event.id),
    case when auth.uid() is null then false else exists (
      select 1
      from public.competition_event_registrations as registration
      where registration.event_id = event.id
        and (
          (registration.participant_type = 'individual' and registration.participant_id = auth.uid())
          or exists (
            select 1 from public.competition_event_team_members as snapshot
            where snapshot.registration_id = registration.id and snapshot.user_id = auth.uid()
          )
        )
    ) end
  from public.competition_events as event
  where event.status = 'published'
    and event.ends_at >= now() - interval '90 days'
  order by event.starts_at asc
  limit least(greatest(coalesce(p_limit, 25), 1), 100);
$$;

create or replace function public.register_for_competition_event(
  p_event_id uuid,
  p_team_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_event public.competition_events%rowtype;
  v_participant_type text;
  v_participant_id uuid;
  v_participant_name text;
  v_registration_id uuid;
  v_member_count integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Sign in before registering' using errcode = '28000';
  end if;

  select * into v_event
  from public.competition_events
  where id = p_event_id and status = 'published'
  for update;

  if not found then
    raise exception 'Competition event is not available' using errcode = 'P0002';
  end if;

  if now() >= v_event.starts_at then
    raise exception 'Registration is closed after the event starts' using errcode = '22023';
  end if;

  if v_event.event_type = 'individual' then
    if p_team_id is not null then
      raise exception 'This event accepts individual registrations only' using errcode = '22023';
    end if;
    v_participant_type := 'individual';
    v_participant_id := v_user_id;
    select profile.display_name into v_participant_name
    from public.profiles as profile where profile.id = v_user_id;
  else
    if p_team_id is null then
      raise exception 'Choose your team before registering for this team event' using errcode = '22023';
    end if;

    select team.name into v_participant_name from public.teams as team
    where team.id = p_team_id and team.owner_id = v_user_id
    for update;
    if not found then
      raise exception 'Only the team owner can register a team' using errcode = '42501';
    end if;

    select count(*)::integer into v_member_count
    from public.team_members where team_id = p_team_id;

    if v_member_count < 2 or v_member_count > v_event.max_team_size then
      raise exception 'Team size does not meet this event requirements' using errcode = '22023';
    end if;

    v_participant_type := 'team';
    v_participant_id := p_team_id;
  end if;

  insert into public.competition_event_registrations (
    event_id, participant_type, participant_id, participant_name_snapshot, registered_by
  ) values (
    p_event_id, v_participant_type, v_participant_id, v_participant_name, v_user_id
  )
  on conflict (event_id, participant_type, participant_id) do nothing
  returning id into v_registration_id;

  if v_registration_id is null then
    return jsonb_build_object('registered', true, 'already_registered', true);
  end if;

  if v_participant_type = 'team' then
    insert into public.competition_event_team_members (registration_id, user_id)
    select v_registration_id, member.user_id
    from public.team_members as member
    where member.team_id = p_team_id;
  end if;

  return jsonb_build_object(
    'registered', true,
    'already_registered', false,
    'participant_type', v_participant_type
  );
end;
$$;

create or replace function public.get_competition_event_leaderboard(
  p_event_id uuid,
  p_limit integer default 25
)
returns table (
  position integer,
  participant_type text,
  participant_name text,
  points bigint,
  solves bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with selected_event as (
    select event.id, event.event_type, event.starts_at, event.ends_at
    from public.competition_events as event
    where event.id = p_event_id and event.status = 'published'
  ),
  individual_scores as (
    select
      registration.id as registration_id,
      'individual'::text as kind,
      registration.participant_name_snapshot as name,
      coalesce(sum(challenge.points), 0)::bigint as score,
      count(solve.challenge_id)::bigint as solve_count
    from public.competition_event_registrations as registration
    join selected_event as event on event.id = registration.event_id and event.event_type = 'individual'
    left join public.challenge_solves as solve
      on solve.user_id = registration.participant_id
     and solve.solved_at >= event.starts_at
     and solve.solved_at < event.ends_at
     and exists (
       select 1 from public.competition_event_challenges as ec
       where ec.event_id = event.id and ec.challenge_id = solve.challenge_id
     )
    left join public.challenges as challenge on challenge.id = solve.challenge_id
    where registration.participant_type = 'individual'
    group by registration.id, registration.participant_name_snapshot
  ),
  team_scores as (
    select
      registration.id as registration_id,
      'team'::text as kind,
      registration.participant_name_snapshot as name,
      coalesce(sum(challenge.points), 0)::bigint as score,
      count(solve.challenge_id)::bigint as solve_count
    from public.competition_event_registrations as registration
    join selected_event as event on event.id = registration.event_id and event.event_type = 'team'
    join public.competition_event_team_members as snapshot on snapshot.registration_id = registration.id
    left join public.challenge_solves as solve
      on solve.user_id = snapshot.user_id
     and solve.solved_at >= event.starts_at
     and solve.solved_at < event.ends_at
     and exists (
       select 1 from public.competition_event_challenges as ec
       where ec.event_id = event.id and ec.challenge_id = solve.challenge_id
     )
    left join public.challenges as challenge on challenge.id = solve.challenge_id
    where registration.participant_type = 'team'
    group by registration.id, registration.participant_name_snapshot
  ),
  all_scores as (
    select * from individual_scores
    union all
    select * from team_scores
  )
  select
    row_number() over (order by all_scores.score desc, all_scores.solve_count desc, all_scores.name)::integer,
    all_scores.kind,
    all_scores.name,
    all_scores.score,
    all_scores.solve_count
  from all_scores
  order by all_scores.score desc, all_scores.solve_count desc, all_scores.name
  limit least(greatest(coalesce(p_limit, 25), 1), 100);
$$;

create or replace function public.get_moderator_competition_events(p_limit integer default 50)
returns table (
  event_id uuid,
  slug text,
  title text,
  event_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  registered_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  ) then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;

  return query
  select
    event.id,
    event.slug,
    event.title,
    event.event_type,
    event.starts_at,
    event.ends_at,
    event.status,
    (select count(*)::bigint from public.competition_event_registrations as registration where registration.event_id = event.id)
  from public.competition_events as event
  order by event.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$;

revoke all on function public.create_competition_event(text, text, text, text, timestamptz, timestamptz, integer, text[]) from public, anon;
revoke all on function public.publish_competition_event(uuid) from public, anon;
revoke all on function public.cancel_competition_event(uuid) from public, anon;
revoke all on function public.get_public_competition_events(integer) from public;
revoke all on function public.get_moderator_competition_events(integer) from public, anon;
revoke all on function public.register_for_competition_event(uuid, uuid) from public, anon;
revoke all on function public.get_competition_event_leaderboard(uuid, integer) from public;

grant execute on function public.create_competition_event(text, text, text, text, timestamptz, timestamptz, integer, text[]) to authenticated;
grant execute on function public.publish_competition_event(uuid) to authenticated;
grant execute on function public.cancel_competition_event(uuid) to authenticated;
grant execute on function public.get_public_competition_events(integer) to anon, authenticated;
grant execute on function public.get_moderator_competition_events(integer) to authenticated;
grant execute on function public.register_for_competition_event(uuid, uuid) to authenticated;
grant execute on function public.get_competition_event_leaderboard(uuid, integer) to anon, authenticated;

comment on table public.competition_events is
  'Moderator-managed individual and team competitions with scheduled registration windows.';
comment on table public.competition_event_team_members is
  'Immutable-at-registration team roster snapshot used for event scoring.';
comment on function public.get_competition_event_leaderboard(uuid, integer) is
  'Ranks registered participants using verified challenge solves for event challenges during the scheduled event window.';
