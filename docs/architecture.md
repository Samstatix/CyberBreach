# CyberBreach — Target Architecture

**Status:** Proposed for Milestone 1  
**Repository:** `Samstatix/CyberBreach`  
**Baseline:** `main` at `b09d67fec33fdda362441318e9746163ce3390e9`  
**Working branch:** `milestone-1/react-foundation`

## 1. Product shape

CyberBreach is a cybersecurity learning and practical challenge platform, not only a CTF scoreboard. The product is organized around five experiences:

1. **Cyber Academy** — structured courses, learning paths, lessons, guided exercises and knowledge checks.
2. **CTF Arena** — independent challenge categories: Web Exploitation; Cryptography; Reverse Engineering; Binary Exploitation (Pwn); Forensics and Network Forensics; OSINT & Misc.
3. **Cyber Labs** — isolated, hands-on environments and scenario-based exercises.
4. **Community & Competition** — teams, events, leaderboards and competitions.
5. **AI Security Research** — LLM and agent security, adversarial ML and related learning/research challenges.

A shared platform layer provides identity, profiles, progression, achievements, notifications and audit records. Academy, Operations and CTF remain distinct learning/practice/competition modes where that distinction makes sense; they should not be hard-coded as three copies of each challenge.

## 2. Architecture principles

- Preserve the current dark visual identity, cyan accent and operational tone; evolve the interface rather than replacing it without reason.
- Build by domain and feature, with explicit boundaries between UI, application services and persistence.
- Keep challenge definitions portable and independent of the React UI.
- Never trust the browser for scores, XP, flags, answer keys, time limits or completion state.
- Treat user-submitted code and lab workloads as hostile.
- Start with a maintainable modular monolith; split services only when scale or isolation requirements justify it.
- Keep the first milestone focused on the frontend foundation. Do not introduce authentication, a database or execution infrastructure before their interfaces and threat model are agreed.

## 3. Recommended stack

### Frontend

- **React + Vite + TypeScript**
- React Router for URL routing and nested layouts
- TanStack Query for server-state caching once APIs exist
- CSS variables/design tokens retained from the existing project; CSS Modules or feature-scoped styles for component isolation
- Vitest + React Testing Library for unit/component tests
- Playwright for end-to-end journeys

This is a client application with an authenticated workspace and interactive tools; server-side rendering is not currently a product requirement. Vite is therefore the simpler fit than Next.js for the first release.

### Backend recommendation

Use **Supabase as the managed platform foundation** for the first production iteration:

- PostgreSQL as the canonical relational data store
- Supabase Auth for identity and sessions
- Row Level Security for user-owned records and tenant boundaries
- Supabase Storage for avatars, course media and permitted user uploads
- Database migrations kept in version control

Add a small **TypeScript API service (Fastify)** for trusted application operations that should not be exposed as direct client writes: challenge attempts, flag validation, scoring, XP awards, competition rules and administrative workflows. The service uses a restricted database role and validates authorization on every operation.

Supabase is not the challenge execution sandbox. For interactive labs or code execution, use a separate worker/orchestrator that creates short-lived isolated workloads. Start with no execution feature until its security design is reviewed.

### Supporting infrastructure (when needed)

- Redis for rate limits, ephemeral sessions and job coordination if measured demand requires it.
- A queue for asynchronous grading, report generation and lab lifecycle events.
- Container isolation for lab workloads, with strict CPU/memory/time quotas, no privileged containers, no host Docker socket, read-only base filesystems where possible, per-task identities, and default-deny network egress. Evaluate stronger isolation (gVisor or microVMs) before running untrusted code at scale.
- Observability: structured logs, error reporting, metrics and security audit events.

Avoid adding Redis, queues, Kubernetes or microservices in Milestone 1. They are not prerequisites for the React foundation.

## 4. High-level system view

```text
Browser
  |
  v
React + Vite + TypeScript
  |-- Supabase Auth (session / identity)
  |-- Read permitted data under PostgreSQL RLS
  |
  +---- HTTPS ----> Fastify API (trusted operations)
                       |-- authorization and validation
                       |-- challenge attempt lifecycle
                       |-- flag verification and scoring
                       |-- progression / achievements
                       |
                       +----> PostgreSQL (Supabase)
                       |
                       +----> Queue (later)
                                  |
                                  v
                           Isolated lab workers
                           (separate security boundary)
```

The browser may display challenge content and collect a submission, but it must not contain authoritative answer keys or the secret used to validate a flag.

## 5. Proposed repository structure

Migrate incrementally. Do not delete the existing implementation until equivalent routes and challenge behavior have been ported and verified.

```text
CyberBreach/
├── apps/
│   ├── web/                    # React/Vite browser application
│   └── api/                    # Fastify trusted application API (later milestone)
├── packages/
│   ├── domain/                 # Shared types and domain rules (no UI dependencies)
│   ├── challenge-contracts/    # Challenge metadata and submission contracts
│   └── ui/                     # Shared UI primitives (only when reuse exists)
├── supabase/
│   ├── migrations/
│   └── seed/
├── docs/
│   ├── architecture.md
│   └── decisions/
├── tests/
│   └── e2e/
├── package.json               # Workspace root (introduced in M1)
└── README.md
```

Inside `apps/web/src`:

```text
src/
├── app/                        # App bootstrap, providers and route tree
├── components/                 # Shared layout and reusable primitives
├── features/
│   ├── dashboard/
│   ├── academy/
│   ├── operations/
│   ├── ctf/
│   │   ├── categories/
│   │   └── challenge/
│   ├── labs/
│   ├── community/
│   └── ai-security/
├── lib/                         # API client, config, utilities
├── styles/                      # Tokens, reset and global styles
└── types/
```

## 6. Domain boundaries

- **Identity:** users, profiles, roles and sessions.
- **Learning:** courses, modules, lessons, enrollments and lesson progress.
- **Challenges:** challenge metadata, categories, difficulty, releases, attempts and submissions.
- **Scoring:** server-authoritative points, XP, streaks, achievements and leaderboard snapshots.
- **Labs:** provisioned environments, leases, resource quotas and teardown state.
- **Competition:** events, teams, memberships, rules and standings.
- **Community:** posts, comments, moderation and reports.
- **AI Security Research:** curated learning content and challenge types; execution still follows the same isolated lab boundary.

Keep category taxonomy as data/configuration, not six separate application implementations.

## 7. Core data model (initial proposal)

- `profiles` — user-facing profile fields and role reference.
- `courses`, `course_modules`, `lessons` — Academy content hierarchy.
- `enrollments`, `lesson_progress` — learner progress.
- `challenge_categories`, `challenges` — public challenge metadata and category.
- `challenge_releases` — versioned challenge configuration; secrets are never exposed to clients.
- `challenge_attempts`, `challenge_submissions` — server-recorded attempts and outcomes.
- `xp_ledger`, `achievements`, `user_achievements` — auditable progression.
- `competitions`, `teams`, `team_memberships` — competition participation.
- `lab_instances` — lifecycle metadata only; secrets and runtime credentials remain outside client-readable tables.
- `audit_events` — security-sensitive administrative and scoring actions.

Use UUID primary keys, timestamps, foreign keys, explicit constraints and RLS policies. XP should be ledger-based rather than a client-editable counter. Define retention and privacy rules before collecting telemetry.

## 8. Security baseline

1. No secrets, flag answers, private challenge tests or scoring authority in frontend bundles.
2. RLS enabled on all user-accessible Supabase tables; test policies for cross-user access.
3. Fastify validates input schemas, user identity, ownership, role and rate limits.
4. Score and XP changes are transactional, idempotent and auditable.
5. Challenge submissions are rate-limited and protected against replay where relevant.
6. Admin actions require explicit roles and produce audit events.
7. Untrusted code runs only in isolated, short-lived workers with constrained resources and network access.
8. Secrets live in server-side secret management/environment configuration, never in Git or Vite-exposed variables.
9. Apply dependency scanning, secret scanning, static analysis and automated tests in CI.
10. Use fictional/simulated content for training exercises unless a lab has an explicit, authorized target.

## 9. Milestone 1 — React foundation

**Branch:** `milestone-1/react-foundation`

### In scope

- Introduce a Vite + React + TypeScript workspace without overwriting the existing root application.
- Create the `apps/web` application shell and route structure.
- Port the current dark design tokens and evolve them into a consistent theme.
- Implement responsive global layout: sidebar, topbar, page container and navigation.
- Create route placeholders for Overview, Academy, Operations, CTF Arena, Cyber Labs, Community and AI Security Research.
- Preserve a path to port the existing Phishing Hunter challenge after the shell is stable.
- Add formatting, linting, type checking and basic component tests.
- Document local setup and environment variable conventions.

### Out of scope

- Authentication and account creation.
- Database schema and production persistence.
- Live flag validation or scoring.
- Running untrusted code or provisioning labs.
- Full migration/removal of the vanilla JavaScript application.
- Production deployment.

### Acceptance criteria

- Existing `main` remains unchanged.
- The new app runs locally with documented commands.
- TypeScript strict mode passes.
- Navigation works and supports direct URL refresh.
- Layout is usable on desktop and mobile.
- Existing CSS tokens and visual identity are recognizably retained.
- No credentials or secret values are committed.
- Automated checks pass before the milestone is considered complete.

## 10. Migration strategy

1. Establish the React shell alongside the existing app.
2. Port shared layout and navigation.
3. Port the overview and mode pages.
4. Port Phishing Hunter behind a typed challenge interface; retain its training content but move answer authority out of the browser before it is treated as a real CTF.
5. Add API and persistence in later milestones.
6. Remove the legacy entry point only after parity is verified and a rollback path exists.

## 11. Open decisions before backend implementation

- Whether public profiles and community content are enabled at launch.
- Whether competitions are team-based, individual, or both.
- Whether the first labs are browser-simulated or provisioned isolated environments.
- Data retention, moderation and abuse-reporting requirements.
- Expected initial concurrency and geographic hosting constraints.

These decisions do not block Milestone 1.


## 12. Confirmed product decisions — audience, labs and access

The product owner has confirmed:

- **Audience:** everyone, from complete beginners to experienced practitioners.
- **Lab model:** both browser-based simulations and real isolated environments.
- **Access model:** free access; do not design premium-only learning or challenge gates.

### Learning accessibility

- Assume no prior knowledge in introductory learning paths; define technical vocabulary before relying on it.
- Use a plain-language explanation first, then accurate professional terminology and deeper technical detail.
- Support keyboard navigation, readable contrast, responsive layouts, captions/transcripts for instructional media and clear error messages.
- Separate learning progress from competitive ranking.
- Provide optional progressive hints and post-challenge explanations.
- Avoid shaming language, including labels that imply a learner is unintelligent.
- "Everyone" is an accessibility and skill-range goal, not a reason to ignore age-appropriate privacy, moderation or account safeguards.

### Free access and sustainable operation

- No premium-only content, paywalled challenge categories or paid XP advantages.
- Prefer open standards, open-source components and self-authored learning material.
- Use quotas, scheduled shutdown, idle timeouts and transparent fair-use limits for costly real labs. These are operational safety/capacity controls, not paid tiers.
- Make it clear when a real lab has a time limit, resource quota or queue.
- Do not promise unlimited concurrent virtual machines; capacity depends on infrastructure funding and measured demand.
- Community competitions should not offer paid competitive advantages.

### Two lab modes

1. **Browser simulations:** lightweight, low-risk interactive exercises for packet inspection demonstrations, log analysis, command-line learning, protocol concepts and guided scenarios. Clearly label simulated behavior; never imply a simulation is a real shell or network.
2. **Isolated real labs:** disposable containers or VMs for tasks that require real operating systems, vulnerable applications, tools or network services. Provision through a separate orchestrator and worker boundary.

Real labs must use per-instance identities, short leases, strict CPU/memory/disk/time quotas, no privileged containers, no host socket mounts, default-deny egress, controlled ingress, secrets isolation, logging, cleanup verification and reset capability. Evaluate stronger isolation such as gVisor or microVMs before multi-user public execution. A browser simulation is the fallback when safe isolation or capacity is unavailable.

### Revised lab lifecycle

```text
Learner requests a lab
  -> policy and capacity check
  -> provision isolated disposable instance
  -> issue short-lived access credential
  -> learner interacts through controlled gateway
  -> monitor resource/time/network policy
  -> stop, destroy and verify cleanup
  -> record minimal completion metadata
```

Never expose host infrastructure credentials or unrestricted network access to the learner. The lab worker must not share trust boundaries with the main web/API service or production database.

### Revised rollout

- M1: frontend foundation and accessible navigation.
- M2: Academy content model and first plain-language learning path.
- M3: CTF category pages, challenge metadata and server-authoritative attempt contract.
- M4: browser simulation framework.
- M5: trusted API, identity, database and scoring.
- M6: isolated real-lab proof of concept after threat-model review and operational budget/capacity assessment.
- M7: community, competitions and research experiences.

This sequence keeps both lab modes in the product vision while preventing unsafe execution infrastructure from being rushed into the first release.
