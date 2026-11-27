-- Run as the Supabase database owner after migrations 001-010.
-- Structural checks for private answer storage, server-only loading, submission
-- controls and team competition integrity. Run after private content loading too.

do $$
declare
  v_table text;
  v_definition text;
begin
  foreach v_table in array array[
    'public.challenge_secrets',
    'public.challenge_solutions',
    'public.operations_mission_secrets',
    'public.lab_task_secrets',
    'public.operations_mission_attempts',
    'public.lab_task_attempts',
    'public.operations_mission_catalog',
    'public.lab_task_catalog'
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

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'operations_mission_catalog' and column_name = 'correct_option_id')
        or (table_name = 'lab_task_catalog' and column_name = 'answer_hash')
        or (table_name = 'operations_mission_completions' and column_name = 'answer_id')
      )
  ) then
    raise exception 'A legacy answer column remains in a public catalog/completion table';
  end if;

  if has_function_privilege('anon', 'public.set_private_operation_answer(text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.set_private_operation_answer(text,text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.set_private_operation_answer(text,text)', 'EXECUTE') then
    raise exception 'Operations private-answer setter must be service-role-only';
  end if;

  if has_function_privilege('anon', 'public.set_private_lab_task_answer(text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.set_private_lab_task_answer(text,text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.set_private_lab_task_answer(text,text)', 'EXECUTE') then
    raise exception 'Lab private-answer setter must be service-role-only';
  end if;

  if has_function_privilege('anon', 'public.complete_operations_mission(text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.complete_operations_mission(text,text)', 'EXECUTE') then
    raise exception 'Operations answer checking must be authenticated-only';
  end if;

  if has_function_privilege('anon', 'public.complete_lab_task(text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.complete_lab_task(text,text)', 'EXECUTE') then
    raise exception 'Lab answer checking must be authenticated-only';
  end if;

  if has_function_privilege('anon', 'public.get_challenge_solution(uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.get_challenge_solution(uuid)', 'EXECUTE') then
    raise exception 'Challenge walkthrough retrieval must be authenticated-only';
  end if;

  v_definition := lower(pg_get_functiondef('public.complete_operations_mission(text,text)'::regprocedure));
  if position('crypt(' in v_definition) = 0
     or position('operations_mission_attempts' in v_definition) = 0
     or position('pg_advisory_xact_lock' in v_definition) = 0 then
    raise exception 'Operations answer checking must use bcrypt, attempt logging and per-user locking';
  end if;

  v_definition := lower(pg_get_functiondef('public.complete_lab_task(text,text)'::regprocedure));
  if position('crypt(' in v_definition) = 0
     or position('lab_task_attempts' in v_definition) = 0
     or position('pg_advisory_xact_lock' in v_definition) = 0 then
    raise exception 'Lab answer checking must use bcrypt, attempt logging and per-user locking';
  end if;

  v_definition := lower(pg_get_functiondef('public.get_competition_event_leaderboard(uuid,integer)'::regprocedure));
  if position('challenge_attempts' in v_definition) = 0
     or position('is_correct = true' in v_definition) = 0
     or position('submitted_at >= event.starts_at' in v_definition) = 0
     or position('competition_event_team_members' in v_definition) = 0
     or position('group by registration.id, attempt.challenge_id' in v_definition) = 0 then
    raise exception 'Competition scoring must use verified event-window attempts and deduplicate team challenge credit';
  end if;

  v_definition := lower(pg_get_functiondef('public.register_for_competition_event(uuid,uuid)'::regprocedure));
  if position('for update' in v_definition) = 0
     or position('v_snapshot_count' in v_definition) = 0 then
    raise exception 'Team event registration must lock the team and validate its roster snapshot';
  end if;

  v_definition := lower(pg_get_functiondef('public.join_community_team(text)'::regprocedure));
  if position('for update' in v_definition) = 0 then
    raise exception 'Team join must serialize against competition roster snapshots';
  end if;

  v_definition := lower(pg_get_functiondef('public.leave_community_team(uuid)'::regprocedure));
  if position('for update' in v_definition) = 0 then
    raise exception 'Team leave must serialize against competition roster snapshots';
  end if;
end;
$$;

select 'Security and competition hardening structural checks passed.' as result;
