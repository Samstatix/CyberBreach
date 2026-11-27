-- CyberBreach Phase 12: private answer storage and competition integrity.
--
-- This migration intentionally invalidates answer material that was previously
-- committed to the public repository. Re-provision fresh answers through the
-- trusted scripts/load-private-content.mjs workflow after applying migrations.
--
-- Do not put answer values, hashes, walkthroughs or private seed data in Git.

create table if not exists public.operations_mission_secrets (
  mission_id text primary key references public.operations_mission_catalog(mission_id) on delete cascade,
  correct_option_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_task_secrets (
  task_id text primary key references public.lab_task_catalog(task_id) on delete cascade,
  answer_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.operations_mission_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null references public.operations_mission_catalog(mission_id) on delete cascade,
  is_correct boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists operations_mission_attempts_user_mission_time_idx
  on public.operations_mission_attempts (user_id, mission_id, attempted_at desc);

create table if not exists public.lab_task_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.lab_task_catalog(task_id) on delete cascade,
  is_correct boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists lab_task_attempts_user_task_time_idx
  on public.lab_task_attempts (user_id, task_id, attempted_at desc);

alter table public.operations_mission_secrets enable row level security;
alter table public.lab_task_secrets enable row level security;
alter table public.operations_mission_attempts enable row level security;
alter table public.lab_task_attempts enable row level security;
alter table public.challenge_secrets enable row level security;
alter table public.challenge_solutions enable row level security;

revoke all on public.operations_mission_secrets from public, anon, authenticated;
revoke all on public.lab_task_secrets from public, anon, authenticated;
revoke all on public.operations_mission_attempts from public, anon, authenticated;
revoke all on public.lab_task_attempts from public, anon, authenticated;
revoke all on public.challenge_secrets from public, anon, authenticated;
revoke all on public.challenge_solutions from public, anon, authenticated;

-- Drop legacy answer columns rather than carrying publicly exposed keys forward.
-- Existing installations have already applied the older migrations; fresh
-- installations use the sanitized migration definitions and skip these blocks.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'operations_mission_catalog'
      and column_name = 'correct_option_id'
  ) then
    alter table public.operations_mission_catalog drop column correct_option_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lab_task_catalog'
      and column_name = 'answer_hash'
  ) then
    alter table public.lab_task_catalog drop column answer_hash;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'operations_mission_completions'
      and column_name = 'answer_id'
  ) then
    alter table public.operations_mission_completions drop column answer_id;
  end if;
end;
$$;

-- All old CTF hashes and walkthroughs must be considered compromised because
-- their source values appeared in public Git history. Disable them and require
-- fresh private content before competitive scoring is re-enabled.
update public.challenge_secrets set is_active = false where is_active = true;
delete from public.challenge_solutions;

-- These two RPCs are deployment-only entry points. The service-role key must
-- remain outside browser code and public Vercel variables.
create or replace function public.set_private_operation_answer(
  p_mission_id text,
  p_answer_id text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  if p_mission_id is null or length(p_mission_id) > 100
     or p_answer_id is null or length(btrim(p_answer_id)) = 0
     or octet_length(convert_to(lower(btrim(p_answer_id)), 'UTF8')) > 72 then
    raise exception 'A valid mission and answer are required' using errcode = '22023';
  end if;

  insert into public.operations_mission_secrets (mission_id, correct_option_hash, updated_at)
  values (
    p_mission_id,
    extensions.crypt(lower(btrim(p_answer_id)), extensions.gen_salt('bf', 12)),
    now()
  )
  on conflict (mission_id) do update
    set correct_option_hash = excluded.correct_option_hash,
        updated_at = excluded.updated_at;
end;
$$;

create or replace function public.set_private_lab_task_answer(
  p_task_id text,
  p_answer text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  if p_task_id is null or length(p_task_id) > 100
     or p_answer is null or length(btrim(p_answer)) = 0
     or octet_length(convert_to(lower(btrim(p_answer)), 'UTF8')) > 72 then
    raise exception 'A valid task and answer are required' using errcode = '22023';
  end if;

  insert into public.lab_task_secrets (task_id, answer_hash, updated_at)
  values (
    p_task_id,
    extensions.crypt(lower(btrim(p_answer)), extensions.gen_salt('bf', 12)),
    now()
  )
  on conflict (task_id) do update
    set answer_hash = excluded.answer_hash,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.set_private_operation_answer(text, text) from public, anon, authenticated;
revoke all on function public.set_private_lab_task_answer(text, text) from public, anon, authenticated;
grant execute on function public.set_private_operation_answer(text, text) to service_role;
grant execute on function public.set_private_lab_task_answer(text, text) to service_role;

-- Operation answer checks use bcrypt, private storage, an advisory lock and a
-- per-user/per-mission rate limit. Submitted answer text is never persisted.
create or replace function public.complete_operations_mission(
  p_mission_id text,
  p_answer_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_correct_hash text;
  v_reward integer;
  v_recent_attempts integer;
  v_is_correct boolean;
  v_inserted integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_mission_id is null or length(p_mission_id) > 100
     or p_answer_id is null or length(btrim(p_answer_id)) = 0
     or octet_length(convert_to(lower(btrim(p_answer_id)), 'UTF8')) > 72 then
    raise exception 'A valid mission and answer are required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':ops:' || p_mission_id, 0)
  );

  select secret.correct_option_hash, mission.xp_reward
    into v_correct_hash, v_reward
  from public.operations_mission_catalog as mission
  join public.operations_mission_secrets as secret
    on secret.mission_id = mission.mission_id
  where mission.mission_id = p_mission_id
    and mission.is_active = true;

  if not found then
    raise exception 'Mission answer is not configured' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.operations_mission_completions
    where user_id = v_user_id and mission_id = p_mission_id
  ) then
    return jsonb_build_object(
      'correct', true,
      'completed', true,
      'already_completed', true,
      'xp_awarded', 0,
      'message', 'Mission already completed.'
    );
  end if;

  select count(*)::integer
    into v_recent_attempts
  from public.operations_mission_attempts
  where user_id = v_user_id
    and mission_id = p_mission_id
    and attempted_at > now() - interval '1 minute';

  if v_recent_attempts >= 10 then
    raise exception 'Too many submissions. Wait a minute and try again.' using errcode = 'P0001';
  end if;

  v_is_correct := extensions.crypt(lower(btrim(p_answer_id)), v_correct_hash) = v_correct_hash;

  insert into public.operations_mission_attempts (user_id, mission_id, is_correct)
  values (v_user_id, p_mission_id, v_is_correct);

  if not v_is_correct then
    return jsonb_build_object(
      'correct', false,
      'completed', false,
      'already_completed', false,
      'xp_awarded', 0,
      'message', 'Not quite. Review the evidence and try another response.'
    );
  end if;

  insert into public.operations_mission_completions (user_id, mission_id)
  values (v_user_id, p_mission_id)
  on conflict (user_id, mission_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    insert into public.xp_ledger (user_id, event_type, reference_id, points)
    values (
      v_user_id,
      'operations_mission',
      (
        substr(md5('operation:' || p_mission_id), 1, 8) || '-' ||
        substr(md5('operation:' || p_mission_id), 9, 4) || '-' ||
        substr(md5('operation:' || p_mission_id), 13, 4) || '-' ||
        substr(md5('operation:' || p_mission_id), 17, 4) || '-' ||
        substr(md5('operation:' || p_mission_id), 21, 12)
      )::uuid,
      v_reward
    )
    on conflict (user_id, event_type, reference_id) do nothing;
  end if;

  perform public.sync_user_achievements(v_user_id);

  return jsonb_build_object(
    'correct', true,
    'completed', true,
    'already_completed', v_inserted = 0,
    'xp_awarded', case when v_inserted > 0 then v_reward else 0 end,
    'message', case when v_inserted > 0 then 'Mission completed. XP awarded.' else 'Mission already completed.' end
  );
end;
$$;

revoke all on function public.complete_operations_mission(text, text) from public, anon;
grant execute on function public.complete_operations_mission(text, text) to authenticated;

-- Lab answers use bcrypt rather than fast unsalted SHA-256, so short answers
-- cannot be cheaply recovered from a database dump.
create or replace function public.complete_lab_task(p_task_id text, p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_answer_hash text;
  v_reward integer;
  v_recent_attempts integer;
  v_is_correct boolean;
  v_inserted integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_task_id is null or length(p_task_id) > 100
     or p_answer is null or length(btrim(p_answer)) = 0
     or octet_length(convert_to(lower(btrim(p_answer)), 'UTF8')) > 72 then
    raise exception 'A valid task and answer are required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':lab:' || p_task_id, 0)
  );

  select secret.answer_hash, task.xp_reward
    into v_answer_hash, v_reward
  from public.lab_task_catalog as task
  join public.lab_task_secrets as secret on secret.task_id = task.task_id
  where task.task_id = p_task_id and task.is_active = true;

  if not found then
    raise exception 'Lab task answer is not configured' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.lab_task_completions
    where user_id = v_user_id and task_id = p_task_id
  ) then
    return jsonb_build_object(
      'correct', true,
      'completed', true,
      'already_completed', true,
      'xp_awarded', 0,
      'message', 'Lab task already completed.'
    );
  end if;

  select count(*)::integer
    into v_recent_attempts
  from public.lab_task_attempts
  where user_id = v_user_id
    and task_id = p_task_id
    and attempted_at > now() - interval '1 minute';

  if v_recent_attempts >= 10 then
    raise exception 'Too many submissions. Wait a minute and try again.' using errcode = 'P0001';
  end if;

  v_is_correct := extensions.crypt(lower(btrim(p_answer)), v_answer_hash) = v_answer_hash;

  insert into public.lab_task_attempts (user_id, task_id, is_correct)
  values (v_user_id, p_task_id, v_is_correct);

  if not v_is_correct then
    return jsonb_build_object(
      'correct', false,
      'completed', false,
      'already_completed', false,
      'xp_awarded', 0,
      'message', 'That finding does not match the evidence. Review the task and try again.'
    );
  end if;

  insert into public.lab_task_completions (user_id, task_id)
  values (v_user_id, p_task_id)
  on conflict (user_id, task_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    insert into public.xp_ledger (user_id, event_type, reference_id, points)
    values (
      v_user_id,
      'lab_task',
      (
        substr(md5('lab:' || p_task_id), 1, 8) || '-' ||
        substr(md5('lab:' || p_task_id), 9, 4) || '-' ||
        substr(md5('lab:' || p_task_id), 13, 4) || '-' ||
        substr(md5('lab:' || p_task_id), 17, 4) || '-' ||
        substr(md5('lab:' || p_task_id), 21, 12)
      )::uuid,
      v_reward
    )
    on conflict (user_id, event_type, reference_id) do nothing;
  end if;

  perform public.sync_user_achievements(v_user_id);

  return jsonb_build_object(
    'correct', true,
    'completed', true,
    'already_completed', v_inserted = 0,
    'xp_awarded', case when v_inserted > 0 then v_reward else 0 end,
    'message', case when v_inserted > 0 then 'Investigation complete. XP awarded.' else 'Lab task already completed.' end
  );
end;
$$;

revoke all on function public.complete_lab_task(text, text) from public, anon;
grant execute on function public.complete_lab_task(text, text) to authenticated;

-- Serialize membership mutations with competition registration. The registration
-- function also locks the team row before reading and snapshotting its roster.
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
  where team.invite_code_hash = encode(extensions.digest(trim(p_invite_code), 'sha256'), 'hex')
  for update;

  if v_team_id is null then
    raise exception 'Invitation code is invalid or has been rotated' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.team_members
    where user_id = v_user_id and team_id = v_team_id
  ) then
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

  perform 1 from public.teams where id = p_team_id for update;
  if not found then
    raise exception 'Team not found' using errcode = 'P0002';
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

-- Snapshotting the roster is now serialized against join/leave operations.
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
  v_snapshot_count integer;
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

    select team.name into v_participant_name
    from public.teams as team
    where team.id = p_team_id and team.owner_id = v_user_id
    for update;

    if not found then
      raise exception 'Only the team owner can register a team' using errcode = '42501';
    end if;

    select count(*)::integer into v_member_count
    from public.team_members
    where team_id = p_team_id;

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

    get diagnostics v_snapshot_count = row_count;
    if v_snapshot_count <> v_member_count then
      raise exception 'Team roster changed while registration was being recorded' using errcode = '40001';
    end if;
  end if;

  return jsonb_build_object(
    'registered', true,
    'already_registered', false,
    'participant_type', v_participant_type
  );
end;
$$;

-- Competition points are awarded once per challenge per participant/team. Correct
-- attempts are used rather than first-ever solves, so a learner who solved a
-- challenge before an event can re-submit its flag during the event for credit.
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
  individual_event_solves as (
    select registration.id as registration_id, attempt.challenge_id
    from public.competition_event_registrations as registration
    join selected_event as event
      on event.id = registration.event_id and event.event_type = 'individual'
    join public.challenge_attempts as attempt
      on attempt.user_id = registration.participant_id
     and attempt.is_correct = true
     and attempt.submitted_at >= event.starts_at
     and attempt.submitted_at < event.ends_at
    join public.competition_event_challenges as event_challenge
      on event_challenge.event_id = event.id
     and event_challenge.challenge_id = attempt.challenge_id
    where registration.participant_type = 'individual'
    group by registration.id, attempt.challenge_id
  ),
  individual_scores as (
    select
      registration.id as registration_id,
      'individual'::text as kind,
      registration.participant_name_snapshot as name,
      coalesce(sum(challenge.points), 0)::bigint as score,
      count(solved.challenge_id)::bigint as solve_count
    from public.competition_event_registrations as registration
    join selected_event as event
      on event.id = registration.event_id and event.event_type = 'individual'
    left join individual_event_solves as solved
      on solved.registration_id = registration.id
    left join public.challenges as challenge on challenge.id = solved.challenge_id
    where registration.participant_type = 'individual'
    group by registration.id, registration.participant_name_snapshot
  ),
  team_event_solves as (
    select registration.id as registration_id, attempt.challenge_id
    from public.competition_event_registrations as registration
    join selected_event as event
      on event.id = registration.event_id and event.event_type = 'team'
    join public.competition_event_team_members as snapshot
      on snapshot.registration_id = registration.id
    join public.challenge_attempts as attempt
      on attempt.user_id = snapshot.user_id
     and attempt.is_correct = true
     and attempt.submitted_at >= event.starts_at
     and attempt.submitted_at < event.ends_at
    join public.competition_event_challenges as event_challenge
      on event_challenge.event_id = event.id
     and event_challenge.challenge_id = attempt.challenge_id
    where registration.participant_type = 'team'
    group by registration.id, attempt.challenge_id
  ),
  team_scores as (
    select
      registration.id as registration_id,
      'team'::text as kind,
      registration.participant_name_snapshot as name,
      coalesce(sum(challenge.points), 0)::bigint as score,
      count(solved.challenge_id)::bigint as solve_count
    from public.competition_event_registrations as registration
    join selected_event as event
      on event.id = registration.event_id and event.event_type = 'team'
    left join team_event_solves as solved
      on solved.registration_id = registration.id
    left join public.challenges as challenge on challenge.id = solved.challenge_id
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

revoke all on function public.join_community_team(text) from public, anon;
revoke all on function public.leave_community_team(uuid) from public, anon;
revoke all on function public.register_for_competition_event(uuid, uuid) from public, anon;
revoke all on function public.get_competition_event_leaderboard(uuid, integer) from public;
grant execute on function public.join_community_team(text) to authenticated;
grant execute on function public.leave_community_team(uuid) to authenticated;
grant execute on function public.register_for_competition_event(uuid, uuid) to authenticated;
grant execute on function public.get_competition_event_leaderboard(uuid, integer) to anon, authenticated;

comment on table public.operations_mission_secrets is
  'Private bcrypt answer hashes for incident-response missions. Browser roles cannot read this table.';
comment on table public.lab_task_secrets is
  'Private bcrypt answer hashes for browser-lab tasks. Browser roles cannot read this table.';
comment on table public.operations_mission_attempts is
  'Private answer-attempt outcomes used for per-user mission rate limiting; submitted answer text is never stored.';
comment on function public.get_competition_event_leaderboard(uuid, integer) is
  'Ranks registered participants using correct flag attempts for selected challenges during the event window; team challenge credit is deduplicated across roster members.';
