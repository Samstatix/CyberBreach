# CyberBreach Phase 30 — Release Readiness

This checklist defines the evidence required before declaring CyberBreach production-ready. A checked item must be supported by a real deployment, test run or reviewed configuration; code existing in GitHub is not proof that a hosted service is configured.

## 1. Repository and integration

- [ ] Review and merge the Phase 20–30 pull requests in dependency order.
- [ ] Confirm the release candidate is on the protected production branch.
- [ ] Confirm the root Vite build succeeds and `apps/web/dist/cyberbreach.integration.css` is generated.
- [ ] Test the reusable `apps/web/src/integration/CyberBreachModule.tsx` in a clean host application.
- [ ] Verify Vercel build output, SPA route rewrites, asset paths and refresh/deep-link navigation.
- [ ] Verify mobile, tablet, desktop, keyboard navigation and reduced-motion behaviour.

## 2. Supabase deployment

- [ ] Apply every migration in order, including `202611280011_cyro_learning_preferences.sql`, `202611280012_cyro_learning_activity.sql` and `202611280013_cyro_rate_limits.sql`.
- [ ] Run the SQL verification scripts and inspect RLS policies, grants, SECURITY DEFINER search paths and function execute privileges.
- [ ] Confirm user-owned progress, preferences and learning activity cannot be read or changed by another account.
- [ ] Confirm challenge secrets, lab task secrets, private content and plaintext flags are not exposed through REST, RPC responses, seed files or frontend bundles.
- [ ] Verify account deletion cascades only the authenticated user's data.
- [ ] Configure Auth site URL, production redirect URLs, email delivery and password recovery.

## 3. CYRO / Ollama

- [ ] Deploy `cyro-assistant` after migrations.
- [ ] Set `CYBERBREACH_ALLOWED_ORIGIN` to the exact production origin.
- [ ] Set `CYRO_OLLAMA_URL` to a reachable HTTPS Ollama-compatible endpoint.
- [ ] Set `CYRO_OLLAMA_MODEL` to a model that is actually pulled and tested on the server.
- [ ] Set optional `CYRO_OLLAMA_API_KEY`, `CYRO_TIMEOUT_MS` and `CYRO_MAX_TOKENS` as appropriate.
- [ ] Verify Ollama is not exposed directly to the browser or an unauthenticated public network.
- [ ] Test cold starts, model unavailable, malformed responses, timeouts, concurrent users and resource exhaustion.
- [ ] Verify the database-enforced CYRO per-user limits (20 requests/minute and 200 requests/hour) after migration 013. Add gateway-level abuse monitoring and alerting before public scale; the database limits do not replace monitoring.
- [ ] Test prompt injection, cross-user data isolation, hint leakage, challenge flag extraction attempts and refusal behaviour.

## 4. Product acceptance

- [ ] Test registration, login, logout, password reset and account deletion.
- [ ] Test Academy lesson completion and progress sync.
- [ ] Test all six browser labs and guided exercises on desktop and mobile.
- [ ] Test CTF submissions against server-side verification; confirm flags and scoring authority remain server-side.
- [ ] Test team membership, competition registration, scoring and leaderboard boundaries.
- [ ] Test CYRO on Academy, CTF, Labs, Operations, Progression, Research and Community routes.
- [ ] Verify learner preferences and saved practice activity are private and removable with account deletion.
- [ ] Verify no UI claims that the informal six-question self-check certifies skill or proves mastery.

## 5. Required CI evidence

Run from the repository root:

```bash
npm ci
npm run security:scan
npm run security:test
npm run typecheck
npm test
npm run build
```

All required checks must pass on the exact release commit. Review dependency audit output and resolve or formally accept high/critical findings before release.

## 6. Release decision

Release is blocked if any of the following remain unknown: production Supabase migration state, RLS verification, private challenge-content handling, CYRO origin configuration, reachable Ollama endpoint, rate limiting, or end-to-end smoke-test results.

A successful GitHub Actions run validates the checks in that workflow only. It does not prove the external Supabase project, Vercel deployment, Ollama host, email provider or host-site integration is configured and working.

**Release status: NOT YET CERTIFIED.** Complete this checklist against the actual production environment and record the release commit and deployment URLs before announcing launch.
