-- Run this script as the Supabase database owner after migrations 001-008.
-- It checks structural permissions and competitive ranking policy, not live user journeys.

do $$
declare
  v_definition text;
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.teams'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.teams';
  end if;

  if not exists (
    select 1 from pg_class
    where oid = 'public.team_members'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.team_members';
  end if;

  if has_table_privilege('anon', 'public.teams', 'SELECT')
     or has_table_privilege('authenticated', 'public.teams', 'SELECT') then
    raise exception 'Browser roles must not read public.teams directly';
  end if;

  if has_table_privilege('anon', 'public.team_members', 'SELECT')
     or has_table_privilege('authenticated', 'public.team_members', 'SELECT') then
    raise exception 'Browser roles must not read public.team_members directly';
  end if;

  if has_function_privilege('anon', 'public.create_community_team(text,text)', 'EXECUTE') then
    raise exception 'Anonymous users must not create teams';
  end if;

  if not has_function_privilege('authenticated', 'public.create_community_team(text,text)', 'EXECUTE') then
    raise exception 'Authenticated users must be able to create teams through the RPC';
  end if;

  if has_function_privilege('anon', 'public.get_my_community_team()', 'EXECUTE') then
    raise exception 'Anonymous users must not read private team membership';
  end if;

  if not has_function_privilege('anon', 'public.get_public_team_leaderboard(integer)', 'EXECUTE') then
    raise exception 'The opt-in public team leaderboard must be readable by anonymous users';
  end if;

  v_definition := pg_get_functiondef('public.get_public_team_leaderboard(integer)'::regprocedure);
  if position('challenge_solve' in v_definition) = 0 then
    raise exception 'Public team rankings must count verified CTF solve events only';
  end if;

  if position('team.is_public = true' in v_definition) = 0 then
    raise exception 'Public team rankings must exclude private teams';
  end if;
end;
$$;

select 'Community team structural checks passed.' as result;
