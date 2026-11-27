-- CyberBreach game progression: award learning XP on first lesson completion.
-- CTF XP remains server-authoritative through submit_challenge_flag().
-- Academy progress is user-owned; this trigger awards a one-time 25 XP event.

create or replace function public.award_academy_lesson_xp()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.xp_ledger (user_id, event_type, reference_id, points)
  values (new.user_id, 'academy_lesson', md5(new.lesson_id)::uuid, 25)
  on conflict (user_id, event_type, reference_id) do nothing;
  return new;
end;
$$;

drop trigger if exists academy_lesson_award_xp on public.academy_lesson_progress;
create trigger academy_lesson_award_xp
  after insert on public.academy_lesson_progress
  for each row execute function public.award_academy_lesson_xp();

revoke all on function public.award_academy_lesson_xp() from public, anon, authenticated;

comment on function public.award_academy_lesson_xp() is
  'Awards 25 XP once when an authenticated learner completes an Academy lesson.';

-- Backfill one-time XP for lessons completed before this migration.
insert into public.xp_ledger (user_id, event_type, reference_id, points)
select progress.user_id, 'academy_lesson', md5(progress.lesson_id)::uuid, 25
from public.academy_lesson_progress as progress
on conflict (user_id, event_type, reference_id) do nothing;
