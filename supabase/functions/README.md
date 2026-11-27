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


## CYRO learner preferences

Migration `202611280011_cyro_learning_preferences.sql` creates a private, per-user preferences table with row-level security. Learners can select Beginner, Intermediate or Advanced teaching level and Auto, English or Bengali response language in the CYRO panel. The Edge Function reads only the authenticated user's row and uses these values as style preferences, not as verified evidence of competence.

The table stores settings only, not chat transcripts or inferred personal traits. Users can clear their row from the database/account settings workflow; a dedicated in-product reset control can be added in a later UI increment.


## CYRO lesson grounding (Phase 20)

On an Academy lesson route, the widget supplies the lesson's approved course title, lesson title, summary, objectives, teaching blocks, glossary and worked example. It deliberately excludes the knowledge-check question, options, correct answer and feedback. The Edge Function validates and bounds every field before including the context in the model prompt. The prompt marks this context as untrusted reference data and instructs the model not to follow embedded instructions.

The lesson context is explanatory grounding, not a source of secrets or scoring authority. The authoritative quiz answer remains in the Academy's existing lesson implementation and is not sent to CYRO.


## CYRO learning intelligence (Phase 21)

For authenticated requests, the Edge Function reads the caller's own `academy_lesson_progress` rows and active `academy_lesson_catalog` entries through the caller-scoped Supabase client. It passes a bounded list of completed lesson titles and available next lessons to CYRO for recommendations. This is progress-aware guidance, not a mastery score: lesson completion does not prove understanding, and missing completions must not be described as weaknesses. A future diagnostic assessment must record learner responses through a trusted scoring flow before CYRO can make evidence-based skill-gap claims.


## CYRO diagnostic self-check (Phase 22)

The widget includes an optional six-question, one-question-at-a-time self-check covering networking, Linux, web security, cryptography, digital forensics and AI security. Scoring runs in the browser and the aggregate category outcome is sent as user-provided conversational context to CYRO for cautious feedback. Results are not persisted, are not server-verified, and must never be presented as certification, a formal skill rating or proof of mastery. The prompt explicitly asks CYRO to explain the limitations of this small sample. Do not use these self-check results for competitive rankings, access control, hiring or other consequential decisions.


## CYRO revision planning (Phase 23)

The self-check can map a missed sample question to the first available lesson in the matching Academy course, when that course exists. These are optional revision starting points, not diagnoses or learner labels. Results remain ephemeral in the widget and are not written to learner records. The user may dismiss the self-check and continue using CYRO normally.


## CYRO adaptive teaching (Phase 24)

The Edge Function checks recent user messages for repeated, explicit confusion phrases. When more than one such signal is present, the system prompt asks the model to change teaching strategy rather than repeat the same explanation: use a different analogy, define fewer terms, show one small example, and ask a gentle comprehension question. This is a lightweight conversational heuristic, not a reliable assessment of emotion, ability or comprehension. Learners can always request a different explanation directly.


## CYRO specialist curriculum (Phase 27)

CYRO has server-authored teaching notes for Academy, CTF Arena, Cyber Labs, Security Operations, Learning Progression, AI Security Research, Community and the platform overview. Notes reinforce prerequisite sequencing, domain-specific safe methodology and common conceptual distinctions. They are instructional guidance, not a substitute for reviewed course material or challenge-specific server-side access controls.


## CYRO Edge Function origin configuration (Phase 28)

Set the Supabase secret `CYRO_ALLOWED_ORIGIN` to the exact browser origin that hosts CyberBreach (scheme and host, no path), for example the production Vercel domain assigned to this project. If a custom domain and preview domain both need access, deploy separate environments or extend the allow-list implementation deliberately; do not restore wildcard CORS. Browser requests with a missing or mismatched configured origin are rejected. Server-to-server calls without an Origin header remain possible and must still authenticate.

The function rejects declared or parsed JSON request bodies larger than 32 KiB, in addition to existing per-message limits. Configure the exact production origin before browser rollout. This origin check is not a substitute for authentication, per-user rate limiting, abuse monitoring or gateway-level request controls.


## CYRO Ollama runtime controls (Phase 29)

Optional server-side settings:
- `CYRO_TIMEOUT_MS`: request timeout, clamped to 10–60 seconds (default 45 seconds).
- `CYRO_MAX_TOKENS`: response token budget, clamped to 100–800 (default 500).
- `CYRO_OLLAMA_MODEL`: validated model identifier.
- `CYRO_OLLAMA_URL`: must be a valid HTTPS URL reachable from the Supabase Edge Function runtime.
- `CYRO_OLLAMA_API_KEY`: optional server-side bearer token.

The function rejects invalid/non-HTTPS endpoint configuration, bounds the timeout and output budget, and returns a controlled error when the model endpoint responds with malformed JSON or an empty reply. It does not automatically switch models: fallback should be explicitly configured and tested rather than silently changing model behaviour. Test cold starts, concurrent load, model availability, latency and cost before public release.
