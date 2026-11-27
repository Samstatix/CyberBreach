-- CYRO learner-controlled teaching preferences.
-- Store only explicit learning settings, never chat transcripts or inferred sensitive traits.
create table if not exists public.cyro_learning_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  teaching_level text not null default 'beginner'
    check (teaching_level in ('beginner', 'intermediate', 'advanced')),
  preferred_language text not null default 'auto'
    check (preferred_language in ('auto', 'en', 'bn')),
  updated_at timestamptz not null default now()
);

alter table public.cyro_learning_preferences enable row level security;

drop policy if exists "cyro_preferences_read_own" on public.cyro_learning_preferences;
create policy "cyro_preferences_read_own"
  on public.cyro_learning_preferences
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "cyro_preferences_insert_own" on public.cyro_learning_preferences;
create policy "cyro_preferences_insert_own"
  on public.cyro_learning_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "cyro_preferences_update_own" on public.cyro_learning_preferences;
create policy "cyro_preferences_update_own"
  on public.cyro_learning_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "cyro_preferences_delete_own" on public.cyro_learning_preferences;
create policy "cyro_preferences_delete_own"
  on public.cyro_learning_preferences
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.cyro_learning_preferences to authenticated;
revoke all on public.cyro_learning_preferences from anon;
