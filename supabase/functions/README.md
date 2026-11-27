# Supabase Edge Functions

## Delete account

Deploy the account deletion function after applying database migrations:

```bash
supabase functions deploy delete-account
```

The function verifies the caller's access token with Supabase Auth and deletes only the authenticated user. It never accepts a user ID from the browser. Deleting `auth.users` cascades through account-owned profile, progress, challenge, XP and team records.

The Edge Function requires the project-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY` and server-only `SUPABASE_SERVICE_ROLE_KEY` environment variables. If the service-role key is not injected automatically by the Supabase project, set it with the Supabase CLI secrets command. Never commit it or add it to Vercel's `NEXT_PUBLIC_` variables.

Password recovery is handled by Supabase Auth. Add the deployed CyberBreach account route to Authentication → URL Configuration → Redirect URLs. For the main CollabCircle mount, include the full `/cybersecurity/account` path.
