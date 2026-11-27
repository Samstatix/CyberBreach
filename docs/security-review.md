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

## Repository visibility decision

The project owner has chosen to keep the repository **public during development** and plans to make it private after the complete project has been consolidated into `main`. Development should continue on milestone branches; unfinished work must not be merged into `main`.

This is an accepted temporary visibility decision, not a security remediation. Making the repository private later will not retract copies, forks, archives or cached history made while it was public. All answer material already committed must therefore be treated as compromised.

## Required before competitive public launch

- Rotate all CTF flags and replace exposed mission/lab answer keys.
- Move trusted answer material out of the public application source and into a separately access-controlled deployment process.
- Ensure private deployment material is not included in browser bundles or public build artifacts.

## Lab answer submission controls

Migration `202611270007_learning_paths_and_lab_hardening.sql` adds a private attempt log and a per-user/per-task limit of ten submissions per minute for browser-lab tasks. Submitted plaintext answers are not stored. Because this repository remains public during development, previously committed low-entropy lab answer hashes must still be treated as exposed; rate limiting does not repair offline disclosure.

## Community team security

Migration `202611270008_community_teams.sql` keeps team tables inaccessible to browser roles directly. Membership and invitation changes use authenticated SECURITY DEFINER RPC functions. Invitation codes are high-entropy, stored only as SHA-256 digests and shown to the owner once; owners can rotate them. Team visibility defaults to private. Public team rankings expose aggregate CTF-only results and no member email addresses. Run `supabase/verification/008_community_teams.sql` against staging after applying the migration.

## Account deletion and profile controls

The `delete-account` Edge Function verifies the caller's Supabase JWT and derives the account ID from the verified user object. It does not accept a user ID from the browser. The service-role client is used only inside the function after verification. Deleting the Auth user relies on foreign-key cascades to remove account-owned records. The function is not operational until deployed and its server-only service-role environment variable is configured.

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
