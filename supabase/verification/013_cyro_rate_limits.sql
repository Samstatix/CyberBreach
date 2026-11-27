-- Run as the Supabase database owner after migration 013.
do $$
declare
  v_definition text;
begin
  if not exists (
    select 1 from pg_class
    where oid = 'public.cyro_rate_limits'::regclass and relrowsecurity
  ) then
    raise exception 'CYRO rate-limit table must have RLS enabled';
  end if;

  if has_table_privilege('anon', 'public.cyro_rate_limits', 'SELECT')
     or has_table_privilege('authenticated', 'public.cyro_rate_limits', 'SELECT')
     or has_table_privilege('authenticated', 'public.cyro_rate_limits', 'INSERT')
     or has_table_privilege('authenticated', 'public.cyro_rate_limits', 'UPDATE')
     or has_table_privilege('authenticated', 'public.cyro_rate_limits', 'DELETE') then
    raise exception 'Browser roles must not access CYRO rate-limit counters directly';
  end if;

  if has_function_privilege('anon', 'public.consume_cyro_rate_limit()', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.consume_cyro_rate_limit()', 'EXECUTE') then
    raise exception 'CYRO rate-limit RPC must be authenticated-only';
  end if;

  v_definition := lower(pg_get_functiondef('public.consume_cyro_rate_limit()'::regprocedure));
  if position('auth.uid()' in v_definition) = 0
     or position('minute_request_count' in v_definition) = 0
     or position('hour_request_count' in v_definition) = 0 then
    raise exception 'CYRO rate limiter must derive identity and enforce both fixed windows';
  end if;
end;
$$;
select 'CYRO rate-limit structural checks passed.' as result;
