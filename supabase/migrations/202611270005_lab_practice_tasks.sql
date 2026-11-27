-- CyberBreach browser-lab progression.
-- The simulated Linux authentication-log exercise awards a one-time reward.
-- Answer verification and XP writes remain server-authoritative for accounts.

create table if not exists public.lab_task_catalog (
  task_id text primary key,
  title text not null,
  answer_hash text not null,
  xp_reward integer not null default 50 check (xp_reward between 1 and 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.lab_task_catalog (task_id, title, answer_hash, xp_reward) values
  ('linux-auth-source', 'Linux authentication log investigation', '1a17a4b9dec75a663e54e523037f05b0e5a5e13d023247a6b0f9774cc80829a2', 50)
on conflict (task_id) do update set
  title = excluded.title,
  answer_hash = excluded.answer_hash,
  xp_reward = excluded.xp_reward,
  is_active = true;

create table if not exists public.lab_task_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.lab_task_catalog(task_id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create index if not exists lab_task_completions_user_time_idx
  on public.lab_task_completions (user_id, completed_at desc);

alter table public.lab_task_catalog enable row level security;
alter table public.lab_task_completions enable row level security;

drop policy if exists "lab_task_completions_read_own" on public.lab_task_completions;
create policy "lab_task_completions_read_own"
  on public.lab_task_completions for select to authenticated
  using (user_id = auth.uid());

revoke all on public.lab_task_catalog, public.lab_task_completions from anon, authenticated;
grant select on public.lab_task_completions to authenticated;

insert into public.achievement_catalog (slug, title, description, icon) values
  ('first-lab', 'Hands-On Analyst', 'Complete your first browser-based Cyber Labs investigation.', 'terminal')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon;

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
  v_lab_tasks integer;
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

  select count(*)::integer
    into v_lab_tasks
  from public.lab_task_completions
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
    or (achievement.slug = 'first-lab' and v_lab_tasks >= 1)
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

revoke all on function public.sync_user_achievements(uuid) from public, anon, authenticated;

create or replace function public.complete_lab_task(p_task_id text, p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_answer_hash text;
  v_reward integer;
  v_inserted integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_task_id is null or length(p_task_id) > 100
     or p_answer is null or length(p_answer) > 256 then
    raise exception 'A valid task and answer are required' using errcode = '22023';
  end if;

  select task.answer_hash, task.xp_reward
    into v_answer_hash, v_reward
  from public.lab_task_catalog as task
  where task.task_id = p_task_id
    and task.is_active = true;

  if not found then
    raise exception 'Lab task is not available' using errcode = 'P0002';
  end if;

  if encode(extensions.digest(lower(trim(p_answer)), 'sha256'), 'hex') <> v_answer_hash then
    return jsonb_build_object(
      'correct', false,
      'completed', false,
      'already_completed', false,
      'xp_awarded', 0,
      'message', 'That finding does not match the evidence. Review the authentication log and try again.'
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
  v_lab_tasks integer;
  v_achievements jsonb;
  v_completed_lessons jsonb;
  v_solved_challenges jsonb;
  v_completed_missions jsonb;
  v_completed_lab_tasks jsonb;
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

  select count(*)::integer
    into v_lab_tasks
  from public.lab_task_completions
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

  select coalesce(jsonb_agg(task.task_id order by completion.completed_at), '[]'::jsonb)
    into v_completed_lab_tasks
  from public.lab_task_completions as completion
  join public.lab_task_catalog as task on task.task_id = completion.task_id
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
    'lab_tasks_completed', v_lab_tasks,
    'achievements_unlocked', jsonb_array_length(v_achievements),
    'completed_lesson_ids', v_completed_lessons,
    'solved_challenge_slugs', v_solved_challenges,
    'completed_mission_ids', v_completed_missions,
    'completed_lab_task_ids', v_completed_lab_tasks,
    'achievements', v_achievements
  );
end;
$$;

revoke all on function public.get_player_progress() from public, anon;
grant execute on function public.get_player_progress() to authenticated;

comment on table public.lab_task_catalog is
  'Private answer hashes and fixed XP rewards for original browser-lab tasks.';
comment on table public.lab_task_completions is
  'Verified browser-lab task completions, readable only by the owning learner.';
comment on function public.complete_lab_task(text, text) is
  'Verifies a lab task answer and awards fixed XP once per authenticated learner.';
