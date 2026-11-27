# CyberBreach

**A free cybersecurity learning, practice, research and competition platform by CollabCircle.**

CyberBreach is a self-contained React feature module developed in this repository so it can later be mounted inside the main CollabCircle Next.js/Vercel website. This repository is the source of truth; the main website is not changed during CyberBreach development.

## Current development baseline

The active implementation baseline is `milestone-11-competitions`. Completed development phases include platform hardening, expanded Academy learning paths, community teams, account security and six interactive practice rooms. The main CollabCircle website remains untouched. The GitHub repository will remain public during development, as requested by the project owner. The `main` branch is reserved for the complete, tested handoff and will not receive unfinished milestone work.

## Product scope
- **Cyber Academy:** beginner-friendly lessons, worked examples, glossaries, knowledge checks and local/account-synced progress with fixed XP rewards.
- **Player progression:** eleven skill trees, XP levels, operator ranks and unlockable achievements. Personal XP is separate from the competitive CTF leaderboard.
- **CTF Arena:** 18 original challenges across Web Exploitation, Cryptography, Reverse Engineering, Binary Exploitation, Forensics and Network Forensics, and OSINT & Misc. Every category has medium, hard and expert work.
- **Cyber Labs:** six safe interactive practice rooms, the Linux evidence simulator, incident-response missions and links to real isolated environments operated by TryHackMe, Hack The Box Academy, PortSwigger and OverTheWire. A reviewed hosted-lab portal can be connected later.
- **Community:** team creation, invitation-based membership, private-by-default team workspaces, opt-in individual/team CTF leaderboards and moderator-managed scheduled competitions.
- **AI Security Research:** LLM/agent security topics and official research references.

CyberBreach is organized around five primary areas: Cyber Academy, CTF Arena, Cyber Labs (including Operations missions), Community and AI Security Research. Player progression connects activity across all five areas.

## Product decisions
- Audience: everyone, from complete beginners to experienced practitioners.
- Access: CyberBreach learning and challenges are free; no paid challenge advantages or premium-only learning tiers.
- Labs: both browser simulations and real isolated environments. Real hosted lab execution is not enabled by exposing a shell from the web app.
- Frontend: React + Vite + TypeScript, packaged as a mountable React module.
- Platform services: Supabase Auth, PostgreSQL, Row Level Security and trusted database functions for scoring/progression.

## Player progression

- Completing a catalogued Academy lesson awards 25 personal XP.
- A first-time verified CTF solve awards the challenge's published points as XP.
- A correctly completed incident-response mission awards 100 personal XP once per mission.
- A verified browser-lab investigation awards 50 personal XP once per task.
- Levels use cumulative thresholds: 250 XP for Level 2, 750 total XP for Level 3, and progressively larger thresholds after that.
- Ranks progress from Recruit through Trainee, Analyst, Specialist, Operator, Senior Operator and Elite.
- Achievements are unlocked by trusted database functions after the relevant learning, mission or solve milestones.
- Guest progress is stored locally; signed-in progress is synchronized through Supabase.
- The public leaderboard counts verified CTF solve points only. Academy, mission and browser-lab XP do not change competitive rankings.

## Run locally
Requirements: Node.js 20+ and npm 10+.

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to enable accounts, synchronized progress, flag scoring and the public leaderboard. The application remains browseable without Supabase configuration.

```bash
npm run typecheck
npm test
npm run build
```

The build also emits `apps/web/dist/cyberbreach.integration.css` for a later namespaced Next.js mount.

## Expanded Academy learning paths

Cyber Academy now includes 10 courses and 25 lessons, including dedicated beginner-first paths for Reverse Engineering, Binary Exploitation and OSINT. These explain unfamiliar terms, use worked examples and finish with short knowledge checks. The three new paths are also connected to their matching specialization skill trees.

## Account security and privacy

The Account page supports profile editing, password recovery and account deletion. Password recovery redirects to the current CyberBreach route; add the deployed `/account` URL (including the `/cybersecurity` prefix when mounted in CollabCircle) to Supabase Auth's allowed redirect URLs. Deploy the `delete-account` Edge Function from `supabase/functions/delete-account`; it verifies the caller JWT and deletes only that authenticated user. Supabase foreign-key cascades remove profile, CTF, XP, learning and team records.

## Community teams

Authenticated learners can create or join one team at a time using a high-entropy invitation code. Only its SHA-256 digest is stored. Team owners can rotate invitations, dissolve the team and opt into public team rankings. Team members see display names and usernames, never member email addresses. Public team rankings include aggregate verified CTF points only.

## Scheduled competitions

CyberBreach moderators can create and publish individual or team CTF events from the Community Events page. Each event selects published challenges, has a fixed start/end window and closes registration when it begins. Team registration is performed by the team owner and snapshots the roster at registration time. Event scores are calculated from verified challenge solves for the selected challenges during the event window; no client-submitted scores are accepted. Moderator/admin roles are provisioned through trusted database administration, never through the browser.

## Database setup
1. Create a Supabase project.
2. Apply every SQL migration in `supabase/migrations` in filename order.
3. Run `supabase/seed.sql` after migrations to add the six categories and 18 original challenges.
4. Migration `202611270003_progression_system.sql` adds the lesson allow-list, server-awarded Academy XP, achievements and the player progression RPC.
5. Migration `202611270004_operations_missions.sql` adds answer-verified incident-response missions, mission XP and completion tracking.
6. Migration `202611270005_lab_practice_tasks.sql` adds private answer verification and XP for browser-lab tasks.
7. Migration `202611270006_linux_lab_path.sql` expands the Linux task set and unlocks the Linux Investigator achievement.
8. Migration `202611270007_learning_paths_and_lab_hardening.sql` registers the new Academy lessons, rate-limits browser-lab submissions and keeps non-CTF XP out of competitive rankings.
9. Migration `202611270008_community_teams.sql` adds private teams, hashed invitation codes and opt-in CTF-only team rankings.
9. Migration `202611270009_competition_events.sql` adds moderator-managed event scheduling, individual/team registration, roster snapshots and verified event leaderboards.
10. Configure email confirmation, password recovery redirect URLs and password policy in Supabase Auth.
11. Deploy the `delete-account` Edge Function and ensure `SUPABASE_SERVICE_ROLE_KEY` is available only in the Edge Function secret environment. Never put it in Vercel public variables.

The browser uses only the Supabase publishable/anon key. Challenge flags are stored as SHA-256 digests in a private table. The database verifies submissions, rate-limits attempts and awards first-solve points atomically. Full walkthroughs are returned only after the authenticated learner solves that challenge.

## Multi-discipline browser workbench

Cyber Labs includes six synthetic practice rooms: Web authorization (IDOR/BOLA), cryptography encoding and Caesar shifts, reverse-engineering static inspection, a memory-boundary visualizer, authentication-log forensics and OSINT source verification. These are interactive teaching simulations only; they do not run code, contact real targets or award competitive CTF points. The Linux simulator remains a separate terminal-style practice environment.

## Browser lab task

The Linux Foundations simulator includes four evidence tasks. Open Cyber Labs and launch the Linux practice terminal. Inspect each evidence source using the cat, ss, ip route and whoami commands, then submit the corresponding finding. The four tasks cover authentication evidence, listening services, the default gateway and the current user. Each correct finding awards 50 personal XP once. The terminal and its evidence are synthetic; no host shell or network connection is used.

## Incident-response missions within Cyber Labs

Cyber Labs includes three original fictional incident-response missions:
- Unusual account activity
- Unexpected outbound DNS
- Unexpected privileged change

Each mission asks the learner to select a proportionate response based on the supplied evidence. A correct response earns 100 personal XP once per mission. Signed-in completions are verified and recorded by the `complete_operations_mission` database function; guest completions remain local to the browser. Mission XP contributes to operator ranks and achievements but is excluded from the competitive CTF leaderboard.

## Vercel integration later
Follow [the Next.js integration guide](apps/web/src/integration/README.md). The integration is intentionally not deployed or copied into the main CollabCircle repository from this branch.

## Final repository handoff

Development proceeds on milestone branches. After all product features, integrations, migrations, documentation and release checks are complete, the finished work will be consolidated into `main`. The owner can then download the complete repository and change its visibility to private. See [the final handoff plan](docs/final-handoff-plan.md).

## Security boundaries
- All challenge artifacts and incident scenarios are fictional and self-authored.
- No real third-party target is part of a CyberBreach challenge.
- No arbitrary code execution or public shell is exposed by the browser app.
- External lab providers run their own isolated environments and access rules.
- A future hosted-lab provider must be separately reviewed, disposable, network-restricted and resource-limited.
- Never commit secrets, API keys, private challenge data or real user evidence.

See [the external research policy](docs/external-research-policy.md).
