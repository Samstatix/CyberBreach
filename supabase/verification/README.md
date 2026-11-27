# Supabase verification scripts

Run these scripts in the Supabase SQL Editor as the database owner after applying the numbered migrations in order.

- `008_community_teams.sql` checks RLS, direct table privileges, RPC grants and the CTF-only public team ranking rule.

These scripts are structural smoke checks. They do not replace testing with separate anon and authenticated users, invite rotation, team joining/leaving, account deletion and visibility changes in a staging project.
