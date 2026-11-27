-- CyberBreach incident-response mission progression.
-- Correct mission answers are verified by a trusted database function.
-- Browser clients cannot write mission completions or XP directly.

create table if not exists public.operations_mission_catalog (
  mission_id text primary key,
  title text not null,
  xp_reward integer not null default 100 check (xp_reward between 1 and 1000),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.operations_mission_catalog (mission_id, title, xp_reward) values
  ('auth-burst', 'Unusual account activity', 100),
  ('dns-burst', 'Unexpected outbound DNS', 100),
  ('priv-change', 'Unexpected privileged change', 100)
on conflict (mission_id) do update set
  title = excluded.title,
  xp_reward = excluded.xp_reward,
  is_active = true;

-- Private answer digests are provisioned by scripts/load-private-content.mjs.
create table if not exists public.operations_mission_secrets (
  mission_id text primary key references public.operations_mission_catalog(mission_id) on delete cascade,
  correct_option_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.operations_mission_secrets enable row level security;
revoke all on public.operations_mission_secrets from public, anon, authenticated;

create table if not exists public.operations_mission_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null references public.operations_mission_catalog(mission_id) on delete cascade,
  is_correct boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists operations_mission_attempts_user_mission_time_idx
  on public.operations_mission_attempts (user_id, mission_id, attempted_at desc);

alter table public.operations_mission_attempts enable row level security;
revoke all on public.operations_mission_attempts from public, anon, authenticated;

create table if not exists public.operations_mission_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null references public.operations_mission_catalog(mission_id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create index if not exists operations_mission_completions_user_time_idx
  on public.operations_mission_completions (user_id, completed_at desc);

alter table public.operations_mission_catalog enable row level security;
alter table public.operations_mission_completions enable row level security;

drop policy if exists "operations_mission_completions_read_own" on public.operations_mission_completions;
create policy "operations_mission_completions_read_own"
  on public.operations_mission_completions for select to authenticated
  using (user_id = auth.uid());

revoke all on public.operations_mission_catalog, public.operations_mission_completions from anon, authenticated;
grant select on public.operations_mission_completions to authenticated;

insert into public.achievement_catalog (slug, title, description, icon) values
  ('first-operation', 'First Response', 'Complete your first incident-response mission.', 'shield-check'),
  ('three-operations', 'Incident Handler', 'Complete all three launch incident-response missions.', 'activity')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon;

-- Refresh all achievement conditions after any new XP award or progress query.
create or replace function public.sync_user_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lessons integer;
  v_solves integer;
  v_missions integer;
  v_total_xp bigint;
begin
  if p_user_id is null then
    return;
  end if;

  select count(*)::integer
    into v_lessons
  from public.academy_lesson_progress as progress
  join public.academy_lesson_catalog as lesson
    on lesson.lesson_id = progress.lesson_id
   and lesson.is_active = true
  where progress.user_id = p_user_id;

  select count(*)::integer
    into v_solves
  from public.challenge_solves
  where user_id = p_user_id;

  select count(*)::integer
    into v_missions
  from public.operations_mission_completions
  where user_id = p_user_id;

  select coalesce(sum(points), 0)::bigint
    into v_total_xp
  from public.xp_ledger
  where user_id = p_user_id;

  insert into public.user_achievements (user_id, achievement_id)
  select p_user_id, achievement.id
  from public.achievement_catalog as achievement
  where
    (achievement.slug = 'first-lesson' and v_lessons >= 1)
    or (achievement.slug = 'academy-five' and v_lessons >= 5)
    or (achievement.slug = 'academy-fifteen' and v_lessons >= 15)
    or (achievement.slug = 'first-solve' and v_solves >= 1)
    or (achievement.slug = 'five-solves' and v_solves >= 5)
    or (achievement.slug = 'ten-solves' and v_solves >= 10)
    or (achievement.slug = 'all-rounder' and v_lessons >= 5 and v_solves >= 3)
    or (achievement.slug = 'centurion' and v_total_xp >= 1000)
    or (achievement.slug = 'full-clear' and v_solves >= 18)
    or (achievement.slug = 'first-operation' and v_missions >= 1)
    or (achievement.slug = 'three-operations' and v_missions >= 3)
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

revoke all on function public.sync_user_achievements(uuid) from public, anon, authenticated;

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
     or p_answer_id is null or length(btrim(p_answer_id)) = 0 or length(p_answer_id) > 120 then
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

-- Extend the player snapshot so skill trees and the Operations page can show
-- account-synchronized incident-response completions.
create or replace function public.get_player_progress()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_total_xp bigint;
  v_level integer;
  v_current_level_floor bigint;
  v_next_level_floor bigint;
  v_level_progress numeric;
  v_rank text;
  v_lessons integer;
  v_solves integer;
  v_missions integer;
  v_achievements jsonb;
  v_completed_lessons jsonb;
  v_solved_challenges jsonb;
  v_completed_missions jsonb;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  perform public.sync_user_achievements(v_user_id);

  select coalesce(sum(points), 0)::bigint
    into v_total_xp
  from public.xp_ledger
  where user_id = v_user_id;

  v_level := floor((sqrt(1 + (8 * v_total_xp::numeric / 250)) - 1) / 2)::integer + 1;
  v_current_level_floor := (250::numeric * (v_level - 1) * v_level / 2)::bigint;
  v_next_level_floor := (250::numeric * v_level * (v_level + 1) / 2)::bigint;
  v_level_progress := least(100, greatest(0, round(
    100 * (v_total_xp - v_current_level_floor)::numeric /
    nullif(v_next_level_floor - v_current_level_floor, 0), 1
  )));

  v_rank := case
    when v_level >= 20 then 'Elite'
    when v_level >= 15 then 'Senior Operator'
    when v_level >= 10 then 'Operator'
    when v_level >= 7 then 'Specialist'
    when v_level >= 4 then 'Analyst'
    when v_level >= 2 then 'Trainee'
    else 'Recruit'
  end;

  select count(*)::integer
    into v_lessons
  from public.academy_lesson_progress as progress
  join public.academy_lesson_catalog as lesson
    on lesson.lesson_id = progress.lesson_id
   and lesson.is_active = true
  where progress.user_id = v_user_id;

  select count(*)::integer
    into v_solves
  from public.challenge_solves
  where user_id = v_user_id;

  select count(*)::integer
    into v_missions
  from public.operations_mission_completions
  where user_id = v_user_id;

  select coalesce(jsonb_agg(progress.lesson_id order by progress.completed_at), '[]'::jsonb)
    into v_completed_lessons
  from public.academy_lesson_progress as progress
  join public.academy_lesson_catalog as lesson
    on lesson.lesson_id = progress.lesson_id
   and lesson.is_active = true
  where progress.user_id = v_user_id;

  select coalesce(jsonb_agg(challenge.slug order by challenge.slug), '[]'::jsonb)
    into v_solved_challenges
  from public.challenge_solves as solved
  join public.challenges as challenge on challenge.id = solved.challenge_id
  where solved.user_id = v_user_id;

  select coalesce(jsonb_agg(mission.mission_id order by completion.completed_at), '[]'::jsonb)
    into v_completed_missions
  from public.operations_mission_completions as completion
  join public.operations_mission_catalog as mission on mission.mission_id = completion.mission_id
  where completion.user_id = v_user_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'slug', catalog.slug,
      'title', catalog.title,
      'description', catalog.description,
      'icon', catalog.icon,
      'unlocked_at', unlocked.unlocked_at
    ) order by unlocked.unlocked_at desc
  ), '[]'::jsonb)
    into v_achievements
  from public.user_achievements as unlocked
  join public.achievement_catalog as catalog on catalog.id = unlocked.achievement_id
  where unlocked.user_id = v_user_id;

  return jsonb_build_object(
    'total_xp', v_total_xp,
    'level', v_level,
    'rank', v_rank,
    'xp_into_level', greatest(v_total_xp - v_current_level_floor, 0),
    'xp_for_next_level', v_next_level_floor - v_current_level_floor,
    'xp_to_next_level', greatest(v_next_level_floor - v_total_xp, 0),
    'level_progress', v_level_progress,
    'lessons_completed', v_lessons,
    'challenges_solved', v_solves,
    'missions_completed', v_missions,
    'achievements_unlocked', jsonb_array_length(v_achievements),
    'completed_lesson_ids', v_completed_lessons,
    'solved_challenge_slugs', v_solved_challenges,
    'completed_mission_ids', v_completed_missions,
    'achievements', v_achievements
  );
end;
$$;

revoke all on function public.get_player_progress() from public, anon;
grant execute on function public.get_player_progress() to authenticated;

comment on table public.operations_mission_catalog is
  'Private answer keys and fixed XP rewards for original incident-response missions.';
comment on table public.operations_mission_completions is
  'Verified incident-response mission completions, readable only by the owning learner.';
comment on function public.complete_operations_mission(text, text) is
  'Verifies a mission answer and awards fixed XP once per authenticated learner.';
