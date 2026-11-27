-- Run as the Supabase database owner after migrations 001-009.
-- Structural checks for event RLS, RPC grants, moderator gating and verified scoring.

do $$
declare
  v_definition text;
  v_table text;
begin
  foreach v_table in array array[
    'public.competition_events',
    'public.competition_event_challenges',
    'public.competition_event_registrations',
    'public.competition_event_team_members'
  ] loop
    if not exists (
      select 1 from pg_class
      where oid = v_table::regclass and relrowsecurity
    ) then
      raise exception 'RLS is not enabled on %', v_table;
    end if;
    if has_table_privilege('anon', v_table, 'SELECT')
       or has_table_privilege('authenticated', v_table, 'SELECT') then
      raise exception 'Browser roles must not read % directly', v_table;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.create_competition_event(text,text,text,text,timestamptz,timestamptz,integer,text[])', 'EXECUTE') then
    raise exception 'Anonymous users must not create competition events';
  end if;
  if not has_function_privilege('authenticated', 'public.create_competition_event(text,text,text,text,timestamptz,timestamptz,integer,text[])', 'EXECUTE') then
    raise exception 'Authenticated role must be able to call the protected event RPC';
  end if;
  if has_function_privilege('anon', 'public.get_moderator_competition_events(integer)', 'EXECUTE') then
    raise exception 'Anonymous users must not access moderator event management';
  end if;
  if not has_function_privilege('anon', 'public.get_public_competition_events(integer)', 'EXECUTE') then
    raise exception 'Public event schedule must be readable anonymously';
  end if;

  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') then
    raise exception 'Browser users must not be able to change their own moderator/admin role';
  end if;

  v_definition := pg_get_functiondef('public.get_competition_event_leaderboard(uuid,integer)'::regprocedure);
  if position('challenge_attempts' in v_definition) = 0
     or position('is_correct = true' in v_definition) = 0
     or position('submitted_at >= event.starts_at' in v_definition) = 0
     or position('competition_event_challenges' in v_definition) = 0
     or position('competition_event_team_members' in v_definition) = 0 then
    raise exception 'Event leaderboard must use correct attempts, roster snapshots, selected challenges and event timestamps';
  end if;
  if position('group by registration.id, attempt.challenge_id' in v_definition) = 0 then
    raise exception 'Event leaderboard must deduplicate a challenge within each participant/team registration';
  end if;

  v_definition := pg_get_functiondef('public.create_competition_event(text,text,text,text,timestamptz,timestamptz,integer,text[])'::regprocedure);
  if position('admin' in v_definition) = 0 or position('moderator' in v_definition) = 0 then
    raise exception 'Event creation must be restricted to moderator/admin roles';
  end if;
end;
$$;

select 'Competition event structural checks passed.' as result;
