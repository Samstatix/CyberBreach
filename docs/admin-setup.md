# CyberBreach moderator and admin setup

Competition event creation is restricted to accounts whose profile role is `moderator` or `admin`. Roles are never assigned by the frontend.

## Promote the Cybersecurity Director account

1. Create the account normally through CyberBreach at `/account`.
2. Confirm the email address if email confirmation is enabled.
3. In Supabase Dashboard, open **Authentication → Users** and locate the account.
4. Copy that user's Auth UUID.
5. In **SQL Editor**, run the following statement after replacing the placeholder with the exact UUID:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = 'REPLACE_WITH_AUTH_USER_UUID';
```

6. Confirm exactly one row was updated, then reload CyberBreach and open **Community → Events**. The Moderator Console should now be visible.

For a moderator who can schedule and cancel events but should not receive full administrator status, use `role = 'moderator'`.

To remove event-management privileges, restore the learner role:

```sql
update public.profiles
set role = 'learner', updated_at = now()
where id = 'REPLACE_WITH_AUTH_USER_UUID';
```

## Security notes

- Never grant moderator/admin roles from browser code or a user-editable form.
- The database checks the profile role inside every create, publish, cancel and moderator-list RPC.
- The profile update grants intentionally do not include the `role` column.
- Keep the Supabase service-role key in trusted server-side secret storage only.


## Provision rotated private challenge content

Migration \`202611270010_security_competition_hardening.sql\` removes answer columns from public catalogs, disables all previously active CTF flags and deletes the old walkthrough rows. This is deliberate: the previous answer material was committed to public Git history and must not remain usable for competitive play.

1. Apply migrations \`202611270001\` through \`202611270010\` in order.
2. Run \`supabase/seed.sql\` to create public challenge/category metadata.
3. Copy \`supabase/private-content.example.json\` to \`supabase/private-content.json\`. The latter path is ignored by Git.
4. Replace every placeholder with newly rotated content. Include every published challenge, all active Operations missions and all active browser-lab tasks. Use CTF release versions 2 or higher and flags of at least 24 bytes. Operations and lab answers are bcrypt-hashed by the database and must fit within 72 UTF-8 bytes.
5. From a trusted local administrator shell, set \`SUPABASE_URL\` and \`SUPABASE_SERVICE_ROLE_KEY\`, then run \`npm run private:load\`.
6. Confirm the loader reports the expected counts. It validates that the private file exactly covers the published challenge, active mission and active task catalogs.

The loader writes CTF flag digests and walkthroughs to private tables. It calls service-role-only database functions to bcrypt-hash Operations and lab answers. It never prints answer values.

**Never** put the service-role key in a \`VITE_\` variable, browser build, Vercel public environment variable, source file, or committed private-content file. Keep \`supabase/private-content.json\` and any alternate private-content file outside Git. The service-role key is deployment administration material, not an application setting.

Until the private loader has been run successfully, CTF submissions, Operations mission checks, Linux lab checks and walkthrough retrieval will fail closed because no active answer material is provisioned.
