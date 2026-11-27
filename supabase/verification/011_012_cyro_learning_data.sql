-- Run as the Supabase database owner after migrations 011 and 012.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'public.cyro_learning_preferences',
    'public.cyro_learning_activity'
  ] loop
    if not exists (
      select 1 from pg_class
      where oid = v_table::regclass and relrowsecurity
    ) then
      raise exception 'RLS is not enabled on %', v_table;
    end if;
    if has_table_privilege('anon', v_table, 'SELECT')
       or has_table_privilege('anon', v_table, 'INSERT')
       or has_table_privilege('anon', v_table, 'UPDATE')
       or has_table_privilege('anon', v_table, 'DELETE') then
      raise exception 'Anonymous access must be revoked on %', v_table;
    end if;
  end loop;

  if not has_table_privilege('authenticated', 'public.cyro_learning_preferences', 'SELECT')
     or not has_table_privilege('authenticated', 'public.cyro_learning_preferences', 'INSERT')
     or not has_table_privilege('authenticated', 'public.cyro_learning_preferences', 'UPDATE')
     or not has_table_privilege('authenticated', 'public.cyro_learning_preferences', 'DELETE') then
    raise exception 'Learners must be able to manage only their preference rows under RLS';
  end if;

  if not has_table_privilege('authenticated', 'public.cyro_learning_activity', 'SELECT')
     or has_table_privilege('authenticated', 'public.cyro_learning_activity', 'INSERT')
     or has_table_privilege('authenticated', 'public.cyro_learning_activity', 'UPDATE')
     or has_table_privilege('authenticated', 'public.cyro_learning_activity', 'DELETE') then
    raise exception 'Learning activity must be read-only to authenticated browser clients';
  end if;

  if has_function_privilege('anon', 'public.record_cyro_learning_activity(text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.record_cyro_learning_activity(text,text)', 'EXECUTE') then
    raise exception 'Learning activity recorder must be authenticated-only';
  end if;
end;
$$;
select 'CYRO learner-data RLS and privilege checks passed.' as result;
