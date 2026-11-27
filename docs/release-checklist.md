# CyberBreach Release and Integration Checklist

## Product completeness
- [ ] All six CTF categories have reviewed medium, hard and expert challenges.
- [ ] Every challenge has three progressive hints and a reproducible solve path.
- [ ] Flag verification and first-solve scoring run in the trusted database function.
- [ ] Full walkthroughs are inaccessible before a solve.
- [ ] Academy progress is separate from competitive scoring.
- [ ] Eleven skill trees display completion across lessons, CTF challenges and Operations missions.
- [ ] Cyber Academy includes the Reverse Engineering, Binary Exploitation and OSINT foundation paths.
- [ ] XP, levels, ranks and achievements are calculated from trusted progress records.
- [ ] Correct Operations mission answers award 100 XP once and incorrect answers can be retried.
- [ ] All four Linux browser-lab tasks require their matching evidence command and award 50 XP once each.
- [ ] Linux browser-lab submissions are rate-limited per user and task.
- [ ] Completing all four Linux tasks unlocks the Linux Investigator achievement.
- [ ] Competitive leaderboard points exclude Academy and Operations XP.
- [ ] Public leaderboard visibility is opt-in and reversible.
- [ ] Team membership is limited to one team per account and invitation codes are stored only as hashes.
- [ ] Team invitation rotation invalidates previous codes.
- [ ] Team member views expose usernames/display names only, never emails.
- [ ] Team owners alone can dissolve teams or change public visibility.
- [ ] Users can leave a team, and owners can dissolve their team.
- [ ] Public team leaderboard excludes all non-CTF XP.
- [ ] Public team rankings count verified CTF points only and require owner opt-in.
- [ ] Browser simulations cannot reach the host operating system.
- [ ] Six workbench modules use synthetic data only and make no external target requests.
- [ ] Web authorization simulator distinguishes vulnerable and secure server-side object checks.
- [ ] Crypto workbench labels Base64 as encoding, not encryption.
- [ ] Memory visualizer does not execute or write to real process memory.
- [ ] Forensics and OSINT exercises use fictional records and documentation-only IP ranges.
- [ ] External lab links use official provider pages.
- [ ] Operations and AI research content has been reviewed.

## Source repository security
- [ ] Follow the temporary public-repository decision documented in `docs/security-review.md`.
- [ ] Rotate all challenge flags and mission/lab answer keys that were committed while the repository was public.
- [ ] Move trusted answer material into a separately access-controlled deployment process before competitive public launch.
- [ ] Keep private deployment material out of public source, build artifacts and browser bundles.
- [ ] Complete the final handoff checklist in `docs/final-handoff-plan.md` before merging milestone work into `main`.

## Supabase setup
- [ ] Apply migrations `202611270001` through `202611270008` in filename order and run the seed after migrations.
- [ ] Verify RLS on every user-facing table.
- [ ] Verify challenge secrets and solutions cannot be selected by anon/authenticated roles.
- [ ] Verify a user cannot submit for another user or write their own score.
- [ ] Verify rate limiting and duplicate-solve behavior.
- [ ] Verify leaderboard opt-in and opt-out.
- [ ] Verify the public leaderboard counts only `challenge_solve` ledger events, excluding Academy, Operations and lab XP.
- [ ] Verify mission and lab-task answer keys are private and completion records are user-owned.
- [ ] Verify Academy and Operations XP cannot be written directly by browser clients.
- [ ] Verify `get_player_progress` returns only the authenticated user's records.
- [ ] Configure email confirmation, password recovery redirect URLs and password policies.
- [ ] Deploy the JWT-verified `delete-account` Edge Function with server-only service-role credentials.
- [ ] Verify account deletion removes profile, CTF, Academy, XP, lab and team records.
- [ ] Verify a caller cannot delete another account by changing request data.
- [ ] Verify profile edits cannot change the user's role or other protected fields.

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
