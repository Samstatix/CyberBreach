-- CYRO learning activity history. This records completed practice activities only.
-- It is separate from CTF scoring, XP and formal assessments.
create table if not exists public.cyro_learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('guided_lab_completed')),
  activity_id text not null check (activity_id in ('web','crypto','reverse','memory','forensics','osint')),
  completed_at timestamptz not null default now(),
  unique (user_id, activity_type, activity_id)
);
alter table public.cyro_learning_activity enable row level security;
drop policy if exists "cyro_learning_activity_read_own" on public.cyro_learning_activity;
create policy "cyro_learning_activity_read_own" on public.cyro_learning_activity
  for select to authenticated using (user_id = auth.uid());
revoke all on public.cyro_learning_activity from anon, authenticated;
grant select on public.cyro_learning_activity to authenticated;

create or replace function public.record_cyro_learning_activity(p_activity_type text, p_activity_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_activity_type <> 'guided_lab_completed'
     or p_activity_id not in ('web','crypto','reverse','memory','forensics','osint') then
    raise exception 'Unsupported learning activity' using errcode = '22023';
  end if;
  insert into public.cyro_learning_activity (user_id, activity_type, activity_id)
  values (v_user_id, p_activity_type, p_activity_id)
  on conflict (user_id, activity_type, activity_id) do nothing;
  get diagnostics v_inserted = row_count;
  return jsonb_build_object('recorded', v_inserted = 1, 'activity_type', p_activity_type, 'activity_id', p_activity_id);
end;
$$;
revoke all on function public.record_cyro_learning_activity(text,text) from public, anon;
grant execute on function public.record_cyro_learning_activity(text,text) to authenticated;
