# Supabase verification scripts

Run these scripts in the Supabase SQL Editor as the database owner after applying the numbered migrations in order.

- `008_community_teams.sql` checks team-table RLS, direct table privileges, RPC grants and the CTF-only public team ranking rule.
- `009_competition_events.sql` checks event-table RLS, moderator-only event management, protected profile roles and verified event-scoring logic.
- `010_security_hardening.sql` checks private answer-table RLS and grants, removal of legacy answer columns, service-role-only answer provisioning, authenticated answer checking, bcrypt verification, attempt logging, per-user locking, event-window scoring, team-score deduplication and roster snapshot locking.

Run scripts 008–010 after migrations 001–010 and after loading newly rotated private challenge content. Run script 013 after migration 013 has been applied. These scripts are structural smoke checks: they inspect database definitions and privileges but do not replace live tests with separate anon and authenticated users, concurrency tests, account deletion tests or end-to-end staging journeys.

Do not run these scripts against production as a substitute for a reviewed release procedure. Validate migrations and verification SQL in a disposable or staging Supabase project first.


- `011_012_cyro_learning_data.sql` checks private learner-preference and activity history RLS, anonymous denial, read/write privileges and authenticated-only activity recording.\n- `013_cyro_rate_limits.sql` checks the private CYRO rate-limit table, direct table privileges, authenticated-only RPC grants, identity derivation and both request windows.
