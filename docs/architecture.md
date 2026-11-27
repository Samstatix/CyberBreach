# CyberBreach — Product and Integration Architecture

**Status:** Active implementation architecture  
**Repository:** `Samstatix/CyberBreach`  
**Current baseline:** `milestone-5/linux-lab-path`  
**Hardening branch:** `milestone-6/platform-hardening`  
**Integration target:** a future route inside the main CollabCircle Next.js/Vercel website. This repository remains the only development source of truth.

## Product boundary
CyberBreach is a cybersecurity learning and practical challenge product, not merely a CTF scoreboard:
1. Cyber Academy — courses, lessons, guided exercises and progress.
2. CTF Arena — six categories and server-scored medium, hard and expert challenges.
3. Cyber Labs — browser simulations, fictional incident-response missions and external or separately hosted isolated labs.
4. Community — opt-in leaderboard and community safety principles.
5. AI Security Research — LLM, agent and adversarial AI security learning.

Player progression is a cross-platform system connecting learning, challenges and incident-response missions; it is not a separate product pillar.

The product is free to access. No premium-only learning or paid competitive advantage is planned.

## Confirmed architecture

### Frontend
- React 18 + TypeScript.
- Vite for standalone development and quality checks.
- React Router for internal feature navigation.
- Feature-oriented source tree under `apps/web/src/features`.
- Shared dark navy/cyan design tokens.
- Mountable `CyberBreachModule` component accepting a router basename.
- CSS prefix build emits `dist/cyberbreach.integration.css`, scoped under `.cyberbreach-root`.

The main CollabCircle site uses Next.js. The integration guide mounts the same client-side module under a Next.js catch-all route. The main site is not modified during CyberBreach development.

### Platform services
Supabase provides Auth and PostgreSQL. RLS protects user-owned data; SQL functions handle trusted operations requiring atomicity or private data access. The browser receives only the public project URL and publishable/anon key. Never expose a service-role key or database password to public frontend variables.

### Scoring boundary
- Browser code contains challenge prompts, fictional evidence and progressive hints only.
- Expected flag digests live in `challenge_secrets`, which browser roles cannot read.
- A SECURITY DEFINER database function verifies flags using `auth.uid()`, rate-limits attempts and awards first-solve XP transactionally.
- Full walkthroughs live in `challenge_solutions`; an RPC returns them only after the authenticated user solves the challenge.
- The leaderboard is opt-in and returns aggregate public fields only.


### Player progression and achievements
- `academy_lesson_catalog` allow-lists published lessons and fixed rewards. `complete_academy_lesson` awards 25 personal XP once per lesson.
- `operations_mission_catalog` stores private answer keys and fixed rewards. `complete_operations_mission` verifies the selected response and awards 100 personal XP once per mission.
- First-time verified CTF solves award the challenge's published points as XP through the existing trusted scoring function.
- `xp_ledger` is the append-only personal XP ledger. The level curve uses cumulative thresholds; ranks progress from Recruit to Elite.
- `achievement_catalog` defines badges and `user_achievements` stores append-only unlocks computed by trusted database functions.
- `get_player_progress` returns the signed-in user's XP, level, rank, lesson completions, challenge solves, mission completions and unlocked achievements.
- The public leaderboard deliberately counts only `challenge_solve` ledger events. Academy and Operations XP do not affect competitive rankings.

### Labs boundary
Browser simulations use synthetic data and allow-listed client-side commands. They are not real shells. Real labs are reached through specialist training providers or a future reviewed hosted-lab portal. The optional portal URL is a launch link only; it does not provision a session. Do not place Docker, privileged containers, a host Docker socket or arbitrary shell execution inside Vercel functions.

A future CyberBreach-hosted lab service must be a separate security boundary with disposable workloads, CPU/memory/process/time limits, no privileged mode, no host mounts, default-deny network egress, session expiry, abuse controls and automated teardown. It must be reviewed before public activation.

## Repository structure
```text
CyberBreach/
├── apps/web/src/
│   ├── app/                 # Feature route tree
│   ├── components/          # Shared application shell
│   ├── features/            # academy, auth, community, ctf, labs, operations, progression, research
│   ├── integration/         # Next.js mount adapter and guide
│   ├── lib/                 # Supabase and runtime configuration
│   └── styles/              # Tokens and feature styles
├── docs/                    # Architecture, policy and decisions
├── scripts/                 # Repository maintenance scripts
└── supabase/
    ├── migrations/           # Ordered SQL migrations
    └── seed.sql              # Categories and original challenge catalogue
```

## Current data model
- `profiles`: Auth-linked username, display name, role and leaderboard opt-in.
- `academy_lesson_catalog`: allow-listed lessons and fixed Academy XP rewards.
- `academy_lesson_progress`: user-owned lesson completion, separate from competitive CTF score.
- `achievement_catalog` and `user_achievements`: public badge definitions and private per-user unlocks.
- `operations_mission_catalog`: private correct-answer keys and fixed mission XP rewards.
- `operations_mission_completions`: user-owned, server-verified incident-response mission completions.
- `challenge_categories`: six agreed CTF disciplines.
- `challenges`: published metadata, evidence, difficulty, points, prerequisites and hints.
- `challenge_secrets`: private SHA-256 flag digests and release versions.
- `challenge_attempts`: outcome-only records; plaintext submissions are not stored.
- `challenge_solves`: one row per user/challenge first solve.
- `xp_ledger`: append-only personal XP ledger with uniqueness constraints; leaderboard queries filter to verified CTF solve events.
- `challenge_solutions`: private walkthrough and defensive explanation, revealed after solve.

## Security requirements
1. Keep RLS enabled on every browser-accessible table.
2. Never let the browser write scores, solve records, flag digests or walkthroughs.
3. Use authenticated identity from the verified Supabase JWT, never a user-supplied user ID.
4. Keep scoring atomic, rate-limited and idempotent.
5. Keep public leaderboard visibility disabled until a user opts in.
6. Award Academy and Operations XP only through allow-listed, idempotent database functions.
7. Keep private mission answer keys and user completion records inaccessible to other users.
8. Do not collect personal data for OSINT challenges; use fictional subjects and records.
9. Keep challenge scope limited to supplied artifacts or explicitly authorized environments.
10. Do not run untrusted code in the browser, Vercel function or shared production host.
11. Keep service credentials in trusted secret storage only.
12. Review every real lab before public release.

## External learning references
TryHackMe, Hack The Box Academy, PortSwigger, OWASP and MITRE are used as learning and methodology references, not sources to copy proprietary course text, flags, walkthroughs or challenge assets.

## Integration into the main Vercel site
The source stays here until integration is explicitly scheduled. Later:
1. Copy `apps/web/src` into the main site's feature directory.
2. Use `CyberBreachModule` inside `app/cybersecurity/[[...path]]/page.tsx` with basename `/cybersecurity`.
3. Import the generated namespaced CSS in the main root layout.
4. Install module dependencies if missing.
5. Configure public Supabase environment variables.
6. Apply migrations and seed the chosen Supabase project.
7. Verify auth redirects, nested routes, CSS isolation, RLS and scoring in preview.

See `apps/web/src/integration/README.md` for exact steps.
