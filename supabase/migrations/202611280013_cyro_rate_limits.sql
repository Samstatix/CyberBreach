-- CYRO authenticated per-user rate limiting.
-- One row per account; counters reset atomically in fixed 60-second and 60-minute windows.
create table if not exists public.cyro_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  minute_window_started_at timestamptz not null default now(),
  minute_request_count integer not null default 0 check (minute_request_count >= 0),
  hour_window_started_at timestamptz not null default now(),
  hour_request_count integer not null default 0 check (hour_request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.cyro_rate_limits enable row level security;
revoke all on public.cyro_rate_limits from public, anon, authenticated;

create or replace function public.consume_cyro_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_minute_count integer;
  v_hour_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  insert into public.cyro_rate_limits (
    user_id, minute_window_started_at, minute_request_count,
    hour_window_started_at, hour_request_count, updated_at
  )
  values (v_user_id, pg_catalog.now(), 1, pg_catalog.now(), 1, pg_catalog.now())
  on conflict (user_id) do update set
    minute_window_started_at = case
      when public.cyro_rate_limits.minute_window_started_at <= pg_catalog.now() - interval '1 minute'
      then pg_catalog.now()
      else public.cyro_rate_limits.minute_window_started_at
    end,
    minute_request_count = case
      when public.cyro_rate_limits.minute_window_started_at <= pg_catalog.now() - interval '1 minute'
      then 1
      else public.cyro_rate_limits.minute_request_count + 1
    end,
    hour_window_started_at = case
      when public.cyro_rate_limits.hour_window_started_at <= pg_catalog.now() - interval '1 hour'
      then pg_catalog.now()
      else public.cyro_rate_limits.hour_window_started_at
    end,
    hour_request_count = case
      when public.cyro_rate_limits.hour_window_started_at <= pg_catalog.now() - interval '1 hour'
      then 1
      else public.cyro_rate_limits.hour_request_count + 1
    end,
    updated_at = pg_catalog.now()
  returning minute_request_count, hour_request_count
  into v_minute_count, v_hour_count;

  return v_minute_count <= 20 and v_hour_count <= 200;
end;
$$;

revoke all on function public.consume_cyro_rate_limit() from public, anon;
grant execute on function public.consume_cyro_rate_limit() to authenticated;
