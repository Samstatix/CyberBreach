-- CyberBreach challenge walkthroughs and opt-in community leaderboard.
-- Apply after 202611270001_platform_core.sql.

alter table public.profiles
  add column if not exists show_on_leaderboard boolean not null default false;

alter table public.challenges
  add column if not exists hints jsonb not null default '[]'::jsonb;

-- Walkthroughs and defensive notes are private until the learner has solved the challenge.
create table if not exists public.challenge_solutions (
  challenge_id uuid primary key references public.challenges(id) on delete cascade,
  walkthrough_md text not null,
  defensive_notes_md text not null,
  reflection_question text not null,
  created_at timestamptz not null default now()
);

alter table public.challenge_solutions enable row level security;
revoke all on public.challenge_solutions from anon, authenticated;

create or replace function public.get_challenge_solution(p_challenge_id uuid)
returns table (
  walkthrough_md text,
  defensive_notes_md text,
  reflection_question text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.challenge_solves
    where user_id = auth.uid() and challenge_id = p_challenge_id
  ) then
    raise exception 'Solve this challenge before opening its walkthrough' using errcode = '42501';
  end if;

  return query
    select solution.walkthrough_md, solution.defensive_notes_md, solution.reflection_question
    from public.challenge_solutions as solution
    where solution.challenge_id = p_challenge_id;
end;
$$;

revoke all on function public.get_challenge_solution(uuid) from public, anon;
grant execute on function public.get_challenge_solution(uuid) to authenticated;

-- Public leaderboard is opt-in. The function returns only display names and
-- aggregates for profiles that explicitly enabled public ranking.
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
grant update (show_on_leaderboard) on public.profiles to authenticated;

comment on column public.profiles.show_on_leaderboard is
  'Explicit user opt-in controlling whether aggregate CTF results appear on the public leaderboard.';
comment on table public.challenge_solutions is
  'Private post-solve walkthroughs. Browser roles cannot select this table directly.';
comment on function public.get_challenge_solution(uuid) is
  'Returns a challenge walkthrough only to an authenticated user who has solved that challenge.';
comment on function public.get_public_leaderboard(integer) is
  'Returns aggregate scores only for users who explicitly opted into public leaderboard visibility.';
