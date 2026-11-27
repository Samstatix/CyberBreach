# CyberBreach Security Review — Release Blockers

**Review scope:** repository state on `milestone-5/linux-lab-path`  
**Review date:** 27 November 2026  
**Status:** Development may continue; competitive public launch is not cleared.

## Critical: answer material is present in a public source repository

The GitHub repository is currently public. Database Row Level Security protects private tables from browser/API reads, but it cannot protect values committed to a public Git repository.

The current source contains assessment material that must not be public while the corresponding challenges are competitive:

- `supabase/seed.sql` inserts full CTF walkthroughs and defensive solutions into `challenge_solutions`.
- `supabase/migrations/202611270004_operations_missions.sql` includes the correct option identifiers for incident-response missions.
- `supabase/migrations/202611270005_lab_practice_tasks.sql` and `202611270006_linux_lab_path.sql` include hashes for short, low-entropy lab answers. These hashes can be recovered by offline guessing.

RLS and SECURITY DEFINER functions protect the live Supabase API. They do not protect source files, Git history, forks, archives or cached copies.

## Required release decision

Before enabling competitive public use, choose one of these deployment models:

1. **Private source repository:** restrict repository access and keep trusted seed material in the private repository. This reduces casual answer exposure, but does not retract any copies already made while the repository was public.
2. **Public application source with private deployment material:** keep only non-secret schema and public challenge metadata in the public repository. Move answer keys, solution inserts and other trusted seed data into a separately access-controlled deployment repository or secret-managed release process.

After choosing the model, rotate all CTF flags and replace exposed mission/lab answer keys before the first public competition. Treat previously committed answers as compromised even if repository visibility changes.

## Additional production checks

- Apply migrations to a dedicated staging Supabase project and verify them in filename order.
- Test RLS with anon, authenticated and service-role contexts.
- Verify all SECURITY DEFINER functions have a fixed safe search path and execute grants only for intended roles.
- Test idempotency for Academy, Operations, browser-lab and CTF rewards.
- Verify guest-only local progress never contributes to the public CTF leaderboard.
- Confirm account deletion cascades through progress, solves, attempts, achievements and profile data.
- Run dependency and secret scanning before creating a production release.
- Complete the release checklist in `docs/release-checklist.md`.

## Scope note

This review does not claim that a live Supabase project has been configured or tested. No production credentials or deployment environment were available during this repository review.
