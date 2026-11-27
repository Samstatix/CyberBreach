-- CyberBreach learning-path expansion and browser-lab submission hardening.
-- Adds the first dedicated Reverse Engineering, Binary Exploitation and OSINT lessons.
-- Lab answers remain private in the database and attempts are rate-limited.

insert into public.academy_lesson_catalog (lesson_id, course_id, title, xp_reward) values
  ('reverse-static-inspection', 'reverse-engineering-foundations', 'Read a program without running it', 25),
  ('reverse-control-flow', 'reverse-engineering-foundations', 'Follow the program decisions', 25),
  ('pwn-memory-layout', 'binary-exploitation-foundations', 'How a program uses memory', 25),
  ('pwn-memory-protections', 'binary-exploitation-foundations', 'Why memory protections matter', 25),
  ('osint-scope-and-ethics', 'osint-foundations', 'Start with a safe research scope', 25),
  ('osint-source-verification', 'osint-foundations', 'Verify before you believe', 25)
on conflict (lesson_id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  xp_reward = excluded.xp_reward,
  is_active = true;

-- Keep the public leaderboard strictly limited to verified CTF challenge points.
-- Academy, Operations and browser-lab XP contribute to personal progression only.
create or replace function public.get_public_leaderboard(p_limit integer default 25)
returns table (
  position integer,
  username text,
  display_name text,
  points bigint,
  solves bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with points_by_user as (
    select ledger.user_id, sum(ledger.points)::bigint as total_points
    from public.xp_ledger as ledger
    where ledger.event_type = 'challenge_solve'
    group by ledger.user_id
  ),
  solves_by_user as (
    select solves.user_id, count(*)::bigint as total_solves, min(solves.solved_at) as first_solve
    from public.challenge_solves as solves
    group by solves.user_id
  ),
  ranked as (
    select
      profile.username,
      profile.display_name,
      coalesce(points_by_user.total_points, 0)::bigint as total_points,
      coalesce(solves_by_user.total_solves, 0)::bigint as total_solves,
      solves_by_user.first_solve
    from public.profiles as profile
    left join points_by_user on points_by_user.user_id = profile.id
    left join solves_by_user on solves_by_user.user_id = profile.id
    where profile.show_on_leaderboard = true
  )
  select
    row_number() over (
      order by ranked.total_points desc, ranked.total_solves desc, ranked.first_solve asc nulls last
    )::integer,
    ranked.username,
    ranked.display_name,
    ranked.total_points,
    ranked.total_solves
  from ranked
  order by ranked.total_points desc, ranked.total_solves desc, ranked.first_solve asc nulls last
  limit least(greatest(coalesce(p_limit, 25), 1), 100);
$$;

revoke all on function public.get_public_leaderboard(integer) from public;
grant execute on function public.get_public_leaderboard(integer) to anon, authenticated;

-- Keep a private audit trail of answer outcomes without storing submitted answers.
create table if not exists public.lab_task_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null references public.lab_task_catalog(task_id) on delete cascade,
  is_correct boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists lab_task_attempts_user_task_time_idx
  on public.lab_task_attempts (user_id, task_id, attempted_at desc);

alter table public.lab_task_attempts enable row level security;
revoke all on public.lab_task_attempts from anon, authenticated;

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
     or p_answer is null or length(p_answer) = 0 or length(p_answer) > 256 then
    raise exception 'A valid task and answer are required' using errcode = '22023';
  end if;

  -- Serialize attempts for this user/task so concurrent requests cannot bypass
  -- the per-minute limit.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':lab:' || p_task_id, 0)
  );

  select task.answer_hash, task.xp_reward
    into v_answer_hash, v_reward
  from public.lab_task_catalog as task
  where task.task_id = p_task_id and task.is_active = true;

  if not found then
    raise exception 'Lab task is not available' using errcode = 'P0002';
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

  v_is_correct :=
    encode(extensions.digest(lower(trim(p_answer)), 'sha256'), 'hex') = v_answer_hash;

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

comment on table public.lab_task_attempts is
  'Private timestamped lab-task answer outcomes used for per-user rate limiting; plaintext answers are never stored.';
comment on function public.complete_lab_task(text, text) is
  'Verifies a browser-lab task, rate-limits attempts to ten per user/task/minute and awards fixed XP once.';
comment on function public.get_public_leaderboard(integer) is
  'Returns only verified CTF challenge-solve points; learning and practice XP are excluded.';
