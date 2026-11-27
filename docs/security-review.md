# CyberBreach Security Review — Phase 12

**Review date:** 27 November 2026  
**Review scope:** consolidated \`main\` plus \`phase-12/security-and-platform-hardening\`  
**Status:** Hardening changes are implemented in source. Not cleared for competitive public launch until migration 010 is applied, fresh private content is loaded, and the staging verification suite passes.

## Historical public exposure

The repository was public while earlier commits contained:
- CTF flag hashes and complete challenge walkthroughs in \`supabase/seed.sql\`.
- Plaintext correct option identifiers in the Operations migration.
- Fast SHA-256 hashes of short browser-lab answers in the lab migrations.

Database RLS did not protect material committed to Git. Public commit history, forks, archives and caches may retain those values. Removing them from the current source tree cannot retract copies. Treat every old flag, answer and walkthrough as compromised. Rotate all competitive content before hosting real competitions. Changing repository visibility later is not a substitute for rotation.

## Current source-tree controls

- \`supabase/seed.sql\` now seeds only public challenge/category metadata; it no longer inserts challenge secrets or walkthroughs.
- Operations mission and lab task catalogs contain metadata and fixed rewards, not answer values.
- Private Operations and lab answer hashes live in separate RLS-protected tables with no browser-role table privileges.
- The trusted private-content loader provisions new CTF flag digests and walkthroughs and calls service-role-only functions to bcrypt-hash Operations and lab answers.
- CTF release versions must be 2 or higher and flags must be at least 24 bytes. Short Operations/lab answers are bcrypt-hashed; inputs are capped at bcrypt's 72-byte limit.
- The loader refuses placeholders, missing entries, duplicate IDs and content that does not exactly match the active database catalogs.
- CI runs \`scripts/check-public-secret-leaks.mjs\` to catch common answer-material regressions in public migrations, seeds and frontend source.

Migration \`202611270010_security_competition_hardening.sql\` disables all previously active CTF hashes, deletes the old challenge walkthrough rows, drops legacy Operations/lab answer columns and removes stored submitted Operations answer IDs. This is intentionally fail-closed: load rotated private content before enabling scored use.

## Submission controls

- CTF flag verification remains in the trusted database RPC, with per-user/per-challenge advisory locking, a ten-attempt-per-minute limit and atomic first-solve scoring.
- Operations and lab answers are verified using bcrypt hashes held in private tables.
- Operations and lab submissions use per-user/per-task advisory locks and ten-attempt-per-minute limits.
- Plaintext Operations/lab submissions are not stored in attempt or completion records.
- Browser roles cannot write XP, solve records, or private answer tables directly.

## Team and competition integrity

Migration \`202611270010_security_competition_hardening.sql\`:
- Locks the team row during membership joins/leaves and team-event registration, so membership changes serialize with roster snapshots.
- Checks the number of roster rows inserted against the locked roster count; a mismatch aborts registration.
- Uses correct flag attempts within the scheduled event window, rather than only first-ever global solves. A participant who solved a challenge before an event can re-submit during the event for event credit.
- Deduplicates team event scoring by registration and challenge, so multiple teammates solving the same challenge awards the team once for that challenge.
- Continues to derive scores from database-verified attempts; no client-submitted point totals are accepted.

Team tables remain inaccessible to browser roles directly. Team visibility and public rankings remain opt-in. Run verification scripts \`008_community_teams.sql\`, \`009_competition_events.sql\` and \`010_security_hardening.sql\` against staging.

## Account and role controls

The \`delete-account\` Edge Function verifies the caller's Supabase JWT and derives the account ID from the verified user object. It does not accept a user ID from the browser. The service-role client is used only inside the function after verification. Deleting the Auth user relies on foreign-key cascades to remove account-owned records. The function is not operational until deployed and its server-only service-role environment variable is configured.

Moderator/admin roles remain server-controlled. Profile update grants do not include the role column. Competition management RPCs verify the signed-in user's profile role.

## Required staging verification

- Apply migrations 001–010 in order to a fresh Supabase staging project.
- Run the public metadata seed, then load newly rotated private content using the administrator loader.
- Run verification SQL 008, 009 and 010.
- Test RLS with anon, authenticated and service-role contexts.
- Test missing private content fails closed.
- Test wrong and correct answers, bcrypt verification, rate limits and duplicate reward idempotency.
- Test team registration against simultaneous join/leave attempts and confirm roster snapshots are stable.
- Test two or more teammates solving the same challenge and confirm one team award per challenge.
- Test pre-solved challenges can be re-submitted during the event and are counted only inside the event window.
- Test account deletion, profile role protection and all main user journeys.
- Run typecheck, automated tests, production build, and source secret scanning.
- Inspect the built frontend to ensure no service-role key, private answer or walkthrough is included.

## Scope and limitations

No live Supabase project, production credentials or Vercel deployment were available during this repository review. CI covers the web typecheck, tests, build and source scan; it does not apply migrations to a live database or prove RLS behavior. The changes therefore remain unverified against a real Supabase instance until the staging checks above are run.
