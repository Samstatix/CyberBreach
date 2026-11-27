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
