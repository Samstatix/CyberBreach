-- CyberBreach platform core
-- This migration establishes identity, public challenge metadata, private flag hashes,
-- user-owned learning progress and server-authoritative challenge scoring.
--
-- IMPORTANT:
--   * Never put plaintext flags in this migration, seed files or frontend bundles.
--   * Challenge secrets are written only by a trusted administrator/server workflow.
--   * Browser clients can read published challenge metadata but cannot write scores.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Keep profile roles server-controlled. Public learning does not require an account;
-- accounts are needed for synchronized progress and scored CTF submissions.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  role text not null default 'learner'
    check (role in ('learner', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A profile is created automatically when Supabase Auth creates a user.
-- A collision in a requested username falls back to a deterministic user handle.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'username', ''),
      '[^a-z0-9_]+',
      '_',
      'g'
    )
  );
  v_username := trim(both '_' from v_username);

  if length(v_username) < 3 then
    v_username := 'user_' || left(new.id::text, 8);
  end if;

  v_username := left(v_username, 24);

  if exists (select 1 from public.profiles p where p.username = v_username) then
    v_username := 'user_' || left(new.id::text, 8);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    v_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), v_username)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.challenge_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.challenge_categories(id),
  slug text not null unique,
  title text not null,
  summary text not null,
  description_md text not null,
  difficulty text not null check (difficulty in ('medium', 'hard', 'expert')),
  points integer not null check (points between 1 and 5000),
  estimated_minutes integer not null default 45 check (estimated_minutes > 0),
  tags text[] not null default '{}',
  prerequisites text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Store only a SHA-256 digest of each expected flag. This table is intentionally
-- unreadable by anon/authenticated clients; the SECURITY DEFINER submission RPC
-- is the only client-facing path that can consult it.
create table if not exists public.challenge_secrets (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  release_version integer not null default 1 check (release_version > 0),
  flag_hash text not null check (flag_hash ~ '^[0-9a-f]{64}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (challenge_id, release_version)
);

-- Record outcomes only. Never persist submitted plaintext flags.
create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  is_correct boolean not null,
  submitted_at timestamptz not null default now()
);

create index if not exists challenge_attempts_user_challenge_time_idx
  on public.challenge_attempts (user_id, challenge_id, submitted_at desc);

create table if not exists public.challenge_solves (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  solved_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

create table if not exists public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  reference_id uuid not null,
  points integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, reference_id)
);

-- Learning progress is not competitive scoring. Learners may mark their own
-- lessons complete; the platform never trusts this table for CTF points.
create table if not exists public.academy_lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists challenges_category_status_idx
  on public.challenges (category_id, status, difficulty);

-- Enable RLS on every table exposed through the Supabase API.
alter table public.profiles enable row level security;
alter table public.challenge_categories enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_secrets enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.challenge_solves enable row level security;
alter table public.xp_ledger enable row level security;
alter table public.academy_lesson_progress enable row level security;

-- Profiles: users can read their own account record and update only public fields.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Categories are public; only published challenge metadata is public.
drop policy if exists "challenge_categories_read_all" on public.challenge_categories;
create policy "challenge_categories_read_all"
  on public.challenge_categories for select to anon, authenticated
  using (true);

drop policy if exists "challenges_read_published" on public.challenges;
create policy "challenges_read_published"
  on public.challenges for select to anon, authenticated
  using (status = 'published');

-- Users can inspect their own attempts, solves and XP history only.
drop policy if exists "challenge_attempts_read_own" on public.challenge_attempts;
create policy "challenge_attempts_read_own"
  on public.challenge_attempts for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "challenge_solves_read_own" on public.challenge_solves;
create policy "challenge_solves_read_own"
  on public.challenge_solves for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "xp_ledger_read_own" on public.xp_ledger;
create policy "xp_ledger_read_own"
  on public.xp_ledger for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "academy_progress_read_own" on public.academy_lesson_progress;
create policy "academy_progress_read_own"
  on public.academy_lesson_progress for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "academy_progress_insert_own" on public.academy_lesson_progress;
create policy "academy_progress_insert_own"
  on public.academy_lesson_progress for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "academy_progress_update_own" on public.academy_lesson_progress;
create policy "academy_progress_update_own"
  on public.academy_lesson_progress for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- The browser cannot read secret hashes or directly create attempts, solves or XP.
revoke all on public.challenge_secrets from anon, authenticated;
revoke insert, update, delete on public.challenge_attempts from anon, authenticated;
revoke insert, update, delete on public.challenge_solves from anon, authenticated;
revoke insert, update, delete on public.xp_ledger from anon, authenticated;

grant select on public.challenge_categories, public.challenges to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, bio, avatar_url) on public.profiles to authenticated;
grant select on public.challenge_attempts, public.challenge_solves, public.xp_ledger to authenticated;
grant select, insert on public.academy_lesson_progress to authenticated;
grant update (completed_at) on public.academy_lesson_progress to authenticated;

-- Atomic flag verification and first-solve scoring.
-- The user identity comes from the verified Supabase JWT (auth.uid()), never
-- from a user-supplied user_id. A per-user/per-challenge advisory lock serializes
-- concurrent attempts so the rate limit and first-solve award cannot race.
create or replace function public.submit_challenge_flag(
  p_challenge_id uuid,
  p_flag text
)
returns table (
  correct boolean,
  already_solved boolean,
  points_awarded integer,
  message text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
  v_expected_hash text;
  v_points integer;
  v_recent_attempts integer;
  v_is_correct boolean;
  v_inserted integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_flag is null or length(btrim(p_flag)) = 0 or length(p_flag) > 256 then
    raise exception 'Flag must contain between 1 and 256 characters' using errcode = '22023';
  end if;

  -- Serialize submissions from this user for this challenge before rate checking.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_challenge_id::text, 0)
  );

  select secret.flag_hash, challenge.points
    into v_expected_hash, v_points
  from public.challenges as challenge
  join public.challenge_secrets as secret
    on secret.challenge_id = challenge.id
   and secret.is_active = true
  where challenge.id = p_challenge_id
    and challenge.status = 'published'
  order by secret.release_version desc
  limit 1;

  if not found then
    raise exception 'Challenge is not available' using errcode = 'P0002';
  end if;

  select count(*)
    into v_recent_attempts
  from public.challenge_attempts
  where user_id = v_user_id
    and challenge_id = p_challenge_id
    and submitted_at > now() - interval '1 minute';

  if v_recent_attempts >= 10 then
    raise exception 'Too many submissions. Wait a minute and try again.' using errcode = 'P0001';
  end if;

  v_is_correct :=
    encode(digest(convert_to(btrim(p_flag), 'UTF8'), 'sha256'), 'hex') = v_expected_hash;

  insert into public.challenge_attempts (user_id, challenge_id, is_correct)
  values (v_user_id, p_challenge_id, v_is_correct);

  if not v_is_correct then
    return query
      select false, false, 0, 'Not quite. Review the evidence and try again.'::text;
    return;
  end if;

  insert into public.challenge_solves (user_id, challenge_id)
  values (v_user_id, p_challenge_id)
  on conflict (user_id, challenge_id) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    return query
      select true, true, 0, 'Already solved. No additional points were awarded.'::text;
    return;
  end if;

  insert into public.xp_ledger (user_id, event_type, reference_id, points)
  values (v_user_id, 'challenge_solve', p_challenge_id, v_points)
  on conflict (user_id, event_type, reference_id) do nothing;

  return query
    select true, false, v_points, 'Flag accepted. Challenge solved.'::text;
end;
$$;

revoke all on function public.submit_challenge_flag(uuid, text) from public, anon;
grant execute on function public.submit_challenge_flag(uuid, text) to authenticated;

comment on table public.challenge_secrets is
  'Private SHA-256 flag digests. Never expose this table to browser roles.';
comment on table public.xp_ledger is
  'Append-only record of awarded points; browser clients have read-only access to their own rows.';
comment on function public.submit_challenge_flag(uuid, text) is
  'Authenticated, rate-limited, atomic flag verification and first-solve XP award.';

-- Do not grant service-role keys to the browser. Supabase service role bypasses RLS
-- and must remain in trusted server-side secret storage.
