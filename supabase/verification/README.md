# Supabase verification scripts

Run these scripts in the Supabase SQL Editor as the database owner after applying the numbered migrations in order.

- `008_community_teams.sql` checks RLS, direct table privileges, RPC grants and the CTF-only public team ranking rule.
- `009_competition_events.sql` checks event-table RLS, moderator-only event management, protected profile roles and verified event-scoring logic.

These scripts are structural smoke checks. They do not replace testing with separate anon and authenticated users, invite rotation, team joining/leaving, account deletion and visibility changes in a staging project.
