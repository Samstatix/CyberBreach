-- Expand the Linux Foundations browser lab into a four-task progression path.
-- All answers remain private in the lab-task catalog and are checked by complete_lab_task.

insert into public.lab_task_catalog (task_id, title, xp_reward) values
  ('linux-listening-ports', 'Identify listening network services', 50),
  ('linux-default-gateway', 'Find the default network gateway', 50),
  ('linux-current-user', 'Identify the current Linux user', 50)
on conflict (task_id) do update set
  title = excluded.title,
  xp_reward = excluded.xp_reward,
  is_active = true;

insert into public.achievement_catalog (slug, title, description, icon) values
  ('linux-investigator', 'Linux Investigator', 'Complete all four Linux Foundations browser-lab investigations.', 'terminal')
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
    or (achievement.slug = 'linux-investigator' and v_lab_tasks >= 4)
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

revoke all on function public.sync_user_achievements(uuid) from public, anon, authenticated;

comment on function public.sync_user_achievements(uuid) is
  'Refreshes immutable achievement unlocks across Academy, CTF, Operations and browser-lab progress.';
