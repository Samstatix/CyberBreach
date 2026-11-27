# CyberBreach Release and Integration Checklist

## Product completeness
- [ ] All six CTF categories have reviewed medium, hard and expert challenges.
- [ ] Every challenge has three progressive hints and a reproducible solve path.
- [ ] Flag verification and first-solve scoring run in the trusted database function.
- [ ] Full walkthroughs are inaccessible before a solve.
- [ ] Academy progress is separate from competitive scoring.
- [ ] Eleven skill trees display completion across lessons, CTF challenges and Operations missions.
- [ ] XP, levels, ranks and achievements are calculated from trusted progress records.
- [ ] Correct Operations mission answers award 100 XP once and incorrect answers can be retried.
- [ ] All four Linux browser-lab tasks require their matching evidence command and award 50 XP once each.
- [ ] Completing all four Linux tasks unlocks the Linux Investigator achievement.
- [ ] Competitive leaderboard points exclude Academy and Operations XP.
- [ ] Public leaderboard visibility is opt-in and reversible.
- [ ] Browser simulations cannot reach the host operating system.
- [ ] External lab links use official provider pages.
- [ ] Operations and AI research content has been reviewed.

## Supabase setup
- [ ] Apply migrations `202611270001` through `202611270006` in filename order and run the seed after migrations.
- [ ] Verify RLS on every user-facing table.
- [ ] Verify challenge secrets and solutions cannot be selected by anon/authenticated roles.
- [ ] Verify a user cannot submit for another user or write their own score.
- [ ] Verify rate limiting and duplicate-solve behavior.
- [ ] Verify leaderboard opt-in and opt-out.
- [ ] Verify mission and lab-task answer keys are private and completion records are user-owned.
- [ ] Verify Academy and Operations XP cannot be written directly by browser clients.
- [ ] Verify `get_player_progress` returns only the authenticated user's records.
- [ ] Configure email confirmation and password policies.

## Frontend validation
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Test direct navigation and refresh on nested routes.
- [ ] Test mobile, keyboard and screen-reader navigation.
- [ ] Test no-Supabase browse mode and configured account mode.
- [ ] Verify no flags, service keys or private walkthroughs appear in built assets.

## Later Next.js/Vercel integration
- [ ] Copy the feature source from this repository only after review.
- [ ] Import generated namespaced CSS in the Next.js root layout.
- [ ] Mount the module at `/cybersecurity` with the matching basename.
- [ ] Configure only public Supabase variables in the browser environment.
- [ ] Apply migrations and seed the intended Supabase project.
- [ ] Verify Vercel preview routes, auth redirects, CSS isolation and scoring.
- [ ] Keep the main website's existing routes and deployments unchanged until approved.

## Hosted labs
- [ ] Provider architecture and threat model approved.
- [ ] No privileged containers, host mounts or public Docker socket.
- [ ] Default-deny network egress and strict resource limits.
- [ ] Session expiry, abuse limits and automatic teardown.
- [ ] Logging and incident-response process established.
- [ ] Independent security review completed before public activation.
