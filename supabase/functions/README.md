# Supabase Edge Functions

## Delete account

Deploy the account deletion function after applying database migrations:

```bash
supabase functions deploy delete-account
```

The function verifies the caller's access token with Supabase Auth and deletes only the authenticated user. It never accepts a user ID from the browser. Deleting `auth.users` cascades through account-owned profile, progress, challenge, XP and team records.

The Edge Function requires the project-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY` and server-only `SUPABASE_SERVICE_ROLE_KEY` environment variables. If the service-role key is not injected automatically by the Supabase project, set it with the Supabase CLI secrets command. Never commit it or add it to Vercel's `NEXT_PUBLIC_` variables.

Password recovery is handled by Supabase Auth. Add the deployed CyberBreach account route to Authentication → URL Configuration → Redirect URLs. For the main CollabCircle mount, include the full `/cybersecurity/account` path.

## CYRO learning assistant

Deploy the authenticated CYRO proxy:

```bash
supabase functions deploy cyro-assistant
supabase secrets set CYRO_OLLAMA_URL=https://YOUR-REACHABLE-OLLAMA-HOST/api/chat CYRO_OLLAMA_MODEL=llama3.1:8b
# Optional, only if the Ollama-compatible endpoint requires bearer authentication:
supabase secrets set CYRO_OLLAMA_API_KEY=YOUR_SERVER_SIDE_TOKEN
```

CYRO calls the Ollama `/api/chat` endpoint from the Edge Function. The Ollama service must be reachable over HTTPS from Supabase; a developer's localhost URL will not work for the deployed product. Do not expose Ollama directly to the browser or commit endpoint credentials. Keep Ollama bound to a private network or protected gateway with authentication and rate limits.

The Edge Function verifies the Supabase access token, validates message shape and length, applies a short timeout, and keeps the model endpoint and optional token server-side. It does not execute tools or commands. Configure per-user rate limiting and request monitoring at the gateway before broad public rollout.


## CYRO adaptive teaching modes

The floating assistant offers four explicit teaching modes: `explain`, `hint`, `quiz`, and `next-step`. The frontend sends a fixed mode identifier, and the Edge Function maps it to server-side teaching instructions. Hint mode is instructed to provide a single incremental hint without revealing flags or complete solutions. Quiz mode asks one question and waits for the learner's response.


## CYRO module-aware teaching and progressive hints

The Edge Function derives module context from an allow-listed route prefix; it does not trust a client-supplied module label. Current contexts cover Academy, CTF Arena, Cyber Labs, Security Operations, Progression, AI Security Research and Community.

Hint mode accepts a numeric level from 1 to 3 and clamps it server-side. The prompt directs the model to move from concept identification (level 1), to narrower evidence/reasoning (level 2), to the next operation (level 3), without returning flags or complete solutions. This is model guidance, not a formal guarantee; keep challenge flags and solutions server-side and validate any scored submission independently.
