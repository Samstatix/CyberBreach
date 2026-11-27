-- CyberBreach progression system.
-- Adds trusted Academy XP, unlockable achievements and a unified player snapshot.
-- Competitive leaderboard points remain limited to verified CTF solves.

create table if not exists public.academy_lesson_catalog (
  lesson_id text primary key,
  course_id text not null,
  title text not null,
  xp_reward integer not null default 25 check (xp_reward between 1 and 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.academy_lesson_catalog (lesson_id, course_id, title, xp_reward) values
  ('web-request-response', 'web-security-foundations', 'How a website talks', 25),
  ('web-cookies-sessions', 'web-security-foundations', 'Cookies and sessions', 25),
  ('web-object-authorization', 'web-security-foundations', 'Who is allowed to see this?', 25),
  ('crypto-encoding-encryption', 'cryptography-foundations', 'Encoding is not encryption', 25),
  ('crypto-hash-integrity', 'cryptography-foundations', 'Hashes and integrity', 25),
  ('crypto-public-key', 'cryptography-foundations', 'Public and private keys', 25),
  ('forensics-evidence-preservation', 'digital-forensics-foundations', 'Preserve before you investigate', 25),
  ('forensics-log-timeline', 'digital-forensics-foundations', 'Build a timeline from logs', 25),
  ('forensics-packet-basics', 'digital-forensics-foundations', 'Read a network packet', 25),
  ('ai-prompt-injection', 'ai-security-foundations', 'Prompt injection in plain language', 25),
  ('ai-tool-permissions', 'ai-security-foundations', 'Give AI tools only what they need', 25),
  ('ai-retrieval-data-protection', 'ai-security-foundations', 'Protect data in retrieval systems', 25),
  ('security-goals', 'cybersecurity-fundamentals', 'What are we protecting?', 25),
  ('threats-vulnerabilities-risk', 'cybersecurity-fundamentals', 'Threats, vulnerabilities and risk', 25),
  ('defense-in-depth', 'cybersecurity-fundamentals', 'Defense in depth and least privilege', 25),
  ('ip-ports-protocols', 'networking-essentials', 'IP addresses, ports and protocols', 25),
  ('dns-and-http', 'networking-essentials', 'DNS and HTTP: opening a website', 25),
  ('linux-filesystem', 'linux-foundations', 'Files, folders and navigation', 25),
  ('linux-permissions', 'linux-foundations', 'Users and file permissions', 25)
on conflict (lesson_id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  xp_reward = excluded.xp_reward,
  is_active = true;

create table if not exists public.achievement_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text not null default 'award',
  created_at timestamptz not null default now()
);

insert into public.achievement_catalog (slug, title, description, icon) values
  ('first-lesson', 'First Steps', 'Complete your first Cyber Academy lesson.', 'book-open'),
  ('academy-five', 'Curious Mind', 'Complete five Cyber Academy lessons.', 'graduation-cap'),
  ('academy-fifteen', 'Dedicated Learner', 'Complete fifteen Cyber Academy lessons.', 'library'),
  ('first-solve', 'First Blood', 'Solve your first CTF challenge.', 'flag'),
  ('five-solves', 'Problem Solver', 'Solve five CTF challenges.', 'target'),
  ('ten-solves', 'Threat Hunter', 'Solve ten CTF challenges.', 'crosshair'),
  ('all-rounder', 'All-Round Operator', 'Complete five Academy lessons and solve three CTF challenges.', 'shield-check'),
  ('centurion', 'Centurion', 'Earn 1,000 total experience points.', 'award'),
  ('full-clear', 'Arena Finisher', 'Solve all eighteen launch CTF challenges.', 'trophy')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon;

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievement_catalog(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create index if not exists user_achievements_user_unlocked_idx
  on public.user_achievements (user_id, unlocked_at desc);

alter table public.academy_lesson_catalog enable row level security;
alter table public.achievement_catalog enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "academy_lesson_catalog_read_all" on public.academy_lesson_catalog;
create policy "academy_lesson_catalog_read_all"
  on public.academy_lesson_catalog for select to anon, authenticated using (is_active);

drop policy if exists "achievement_catalog_read_all" on public.achievement_catalog;
create policy "achievement_catalog_read_all"
  on public.achievement_catalog for select to anon, authenticated using (true);

drop policy if exists "user_achievements_read_own" on public.user_achievements;
create policy "user_achievements_read_own"
  on public.user_achievements for select to authenticated using (user_id = auth.uid());

-- Academy completion must pass through the allow-listed RPC. This prevents
-- arbitrary lesson IDs being inserted directly and keeps XP awards idempotent.
drop policy if exists "academy_progress_insert_own" on public.academy_lesson_progress;
drop policy if exists "academy_progress_update_own" on public.academy_lesson_progress;
revoke insert, update, delete on public.academy_lesson_progress from anon, authenticated;
grant select on public.academy_lesson_progress to authenticated;

revoke all on public.academy_lesson_catalog, public.achievement_catalog, public.user_achievements from anon, authenticated;
grant select on public.academy_lesson_catalog, public.achievement_catalog to anon, authenticated;
grant select on public.user_achievements to authenticated;

create or replace function public.sync_user_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lessons integer;
  v_solves integer;
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
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

revoke all on function public.sync_user_achievements(uuid) from public, anon, authenticated;

create or replace function public.handle_xp_ledger_achievement_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_user_achievements(new.user_id);
  return new;
end;
$$;

revoke all on function public.handle_xp_ledger_achievement_sync() from public, anon, authenticated;

drop trigger if exists xp_ledger_achievement_sync on public.xp_ledger;
create trigger xp_ledger_achievement_sync
  after insert on public.xp_ledger
  for each row execute function public.handle_xp_ledger_achievement_sync();

create or replace function public.complete_academy_lesson(p_lesson_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reward integer;
  v_inserted integer;
  v_total_xp bigint;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_lesson_id is null or length(p_lesson_id) > 120 then
    raise exception 'A valid lesson ID is required' using errcode = '22023';
  end if;

  select lesson.xp_reward
    into v_reward
  from public.academy_lesson_catalog as lesson
  where lesson.lesson_id = p_lesson_id
    and lesson.is_active = true;

  if not found then
    raise exception 'Lesson is not part of the published curriculum' using errcode = '22023';
  end if;

  insert into public.academy_lesson_progress (user_id, lesson_id)
  values (v_user_id, p_lesson_id)
  on conflict (user_id, lesson_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    insert into public.xp_ledger (user_id, event_type, reference_id, points)
    values (
      v_user_id,
      'academy_lesson_complete',
      (
        substr(md5('academy:' || p_lesson_id), 1, 8) || '-' ||
        substr(md5('academy:' || p_lesson_id), 9, 4) || '-' ||
        substr(md5('academy:' || p_lesson_id), 13, 4) || '-' ||
        substr(md5('academy:' || p_lesson_id), 17, 4) || '-' ||
        substr(md5('academy:' || p_lesson_id), 21, 12)
      )::uuid,
      v_reward
    )
    on conflict (user_id, event_type, reference_id) do nothing;
  end if;

  perform public.sync_user_achievements(v_user_id);

  select coalesce(sum(points), 0)::bigint
    into v_total_xp
  from public.xp_ledger
  where user_id = v_user_id;

  return jsonb_build_object(
    'lesson_id', p_lesson_id,
    'completed', true,
    'xp_awarded', case when v_inserted > 0 then v_reward else 0 end,
    'total_xp', v_total_xp
  );
end;
$$;

revoke all on function public.complete_academy_lesson(text) from public, anon;
grant execute on function public.complete_academy_lesson(text) to authenticated;

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
  v_achievements jsonb;
  v_completed_lessons jsonb;
  v_solved_challenges jsonb;
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
    'achievements_unlocked', jsonb_array_length(v_achievements),
    'completed_lesson_ids', v_completed_lessons,
    'solved_challenge_slugs', v_solved_challenges,
    'achievements', v_achievements
  );
end;
$$;

revoke all on function public.get_player_progress() from public, anon;
grant execute on function public.get_player_progress() to authenticated;

-- The public leaderboard remains a competitive CTF ranking. Academy XP helps
-- personal progression but does not inflate competitive challenge points.
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
    row_number() over (order by ranked.total_points desc, ranked.total_solves desc, ranked.first_solve asc nulls last)::integer,
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

comment on table public.academy_lesson_catalog is
  'Allow-listed Academy lesson identifiers and fixed XP rewards used by the trusted completion function.';
comment on table public.achievement_catalog is
  'Public definitions for platform achievements; unlock state is stored privately per user.';
comment on table public.user_achievements is
  'Append-only achievement unlocks. Users can read only their own records.';
comment on function public.complete_academy_lesson(text) is
  'Idempotently records a catalogued Academy lesson and awards its fixed XP server-side.';
comment on function public.get_player_progress() is
  'Returns a signed-in learner progress snapshot, including XP, level, rank, skills and achievements.';
