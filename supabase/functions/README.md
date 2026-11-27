# CyberBreach

**A browser-based cybersecurity learning, practice, and competition platform by CollabCircle.**

CyberBreach helps people move from cybersecurity fundamentals to practical, hands-on skills through guided learning paths, interactive browser labs, original Capture the Flag (CTF) challenges, incident-response scenarios, team activities, and scheduled competitions.

The project is developed in this repository as an independent React application and a reusable module for a future integration with the main CollabCircle website. This repository remains the source of truth; work here does not modify the main CollabCircle website.

> **For learners:** CyberBreach is designed to be used in a modern web browser. Learners do not need to install Node.js, npm, Python, Docker, a terminal, or any development tools. Open the deployed website, create an account or sign in, and start learning. Development tools described below are only for contributors, maintainers, and deployment builds.

## What learners can do

- **Cyber Academy** — follow beginner-friendly and advanced courses with explanations, worked examples, glossaries, knowledge checks, and progress tracking.
- **CTF Arena** — solve original challenges across Web Exploitation, Cryptography, Reverse Engineering, Binary Exploitation, Forensics and Network Forensics, and OSINT & Misc.
- **Cyber Labs** — practise in safe, interactive browser simulations, a simulated Linux evidence terminal, and guided technical exercises.
- **Incident Response Operations** — investigate fictional security incidents, interpret evidence, and choose proportionate defensive actions.
- **Progression** — earn personal XP, advance through levels and operator ranks, unlock achievements, and develop skills across eleven skill trees.
- **Community and Teams** — create or join a team, collaborate in private team spaces, and opt into team rankings.
- **Competitions** — register for scheduled individual or team CTF events and compete using verified challenge solves.
- **CYRO learning assistant** — ask beginner-friendly questions from any platform page, request simpler explanations, examples and quick knowledge checks. CYRO is served through an authenticated Supabase Edge Function connected to a privately hosted Ollama-compatible model endpoint.\n- **AI Security Research** — explore security topics involving AI systems, LLMs, and agents through curated learning and research references.

CyberBreach is intended for a broad audience, from people with no prior cybersecurity experience to experienced learners. Learning content and challenges are designed to be free, without paid challenge advantages or premium-only learning tiers.

## Browser-only learner experience

The deployed product is a web application:

1. Visit the CyberBreach website in Chrome, Firefox, Edge, Safari, or another modern browser.
2. Register or sign in.
3. Learn, practise, solve challenges, track progress, join teams, and participate in competitions through the website.

There is no learner-side installation process. React and TypeScript are used to build the website; Vite and Node.js are build/development tools and are not required on a learner's device.

Some exercises are intentionally simulated in the browser. Real operating-system access, arbitrary command execution, and hosted penetration-testing environments are not exposed by the frontend. Any future real hosted-lab capability must run in separately reviewed, isolated, disposable infrastructure with strict network and resource controls.

## Product and technical architecture

- **Frontend:** React 18, TypeScript, Vite, React Router, and namespaced CSS.
- **Application entry point:** `apps/web/index.html`, which loads `apps/web/src/main.tsx`.
- **Reusable integration module:** `apps/web/src/integration/CyberBreachModule.tsx`.
- **Backend services:** Supabase Auth, PostgreSQL, Row Level Security (RLS), and trusted database functions.
- **Deployment target:** static web hosting such as Vercel, with Supabase providing authentication and data services.
- **Repository structure:** the active application lives in `apps/web`; SQL migrations, seed data, security checks, private-content tooling, and project documentation live at the repository root.

The repository root is not a second frontend. The active HTML document is `apps/web/index.html`. The former standalone HTML/CSS/JavaScript prototype has been removed to avoid two competing application entry points.

## Run and build the application (contributors only)

These steps are for developers working on CyberBreach. They are not required for ordinary learners.

Requirements:
- Node.js 20 or newer
- npm 10 or newer

From the repository root:

```bash
npm install
cp .env.example .env
npm run dev
```

The Vite development server prints a local URL. Open that URL in a browser.

Set the following public frontend variables in `.env` to enable Supabase-backed accounts and data:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

The app can render in browse/demo mode without Supabase configuration, but authentication, synchronized progress, server-verified submissions, competitions, and CYRO require a correctly configured Supabase project. CYRO additionally requires the deployed `cyro-assistant` Edge Function and server-side `CYRO_OLLAMA_URL` / `CYRO_OLLAMA_MODEL` secrets; see `supabase/functions/README.md`.

Quality checks:

```bash
npm run security:scan
npm run typecheck
npm test
npm run build
```

The production build is generated in `apps/web/dist`. The build also emits `apps/web/dist/cyberbreach.integration.css` for the future CollabCircle Next.js integration.

## Release readiness\n\nBefore production release, complete the evidence-based checklist in [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md). A passing CI run does not certify external Supabase, Vercel or Ollama configuration.\n\n## Deploy as a browser website on Vercel

The repository includes a `vercel.json` configuration for deploying the active Vite application from the repository root.

1. Import `Samstatix/CyberBreach` into Vercel.
2. Keep the project root at the repository root (do not set it to the legacy prototype or a separate app).
3. Use the repository's Vercel configuration. It runs the workspace build and publishes `apps/web/dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables for the required deployment environments.
5. Deploy the site and configure the deployed URL in Supabase Auth's allowed redirect URLs, including the account recovery route.
6. Apply the database migrations and deploy the required Edge Function as described below before enabling authenticated production use.

The Vercel build uses Node.js as a build environment. Visitors only receive and use the built website in their browser. **Never add the Supabase service-role key or other server secrets to Vercel variables prefixed with `VITE_`.**

## Supabase setup

1. Create a Supabase project.
2. Apply every SQL migration in `supabase/migrations` in filename order, including migration `202611270010_security_competition_hardening.sql`.
3. Run `supabase/seed.sql` after migrations to create the public categories and challenge metadata. The public seed intentionally contains no challenge flags or walkthroughs.
4. Configure Supabase Auth email confirmation, password recovery redirect URLs, and password policy.
5. Deploy the `delete-account` Edge Function from `supabase/functions/delete-account`.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` exclusively in trusted administrator tooling or Supabase Edge Function secrets. It must never be exposed to browser code or public frontend environment variables.
7. Load fresh private answer content using the administrator-only process below.

### Private challenge and lab content

Previously committed answer material must be treated as compromised. The Phase 12 security migration disables old CTF flags and removes old walkthroughs. Fresh private content must be provisioned before CTF scoring and solution unlocks can operate as intended.

- Start from `supabase/private-content.example.json` and create your own `supabase/private-content.json`.
- The real private file is ignored by Git. Never commit it or share its contents.
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in a trusted administrator shell (not in a `VITE_` variable).
- Run `npm run private:load` from the repository root.
- The loader validates catalog IDs and content, requires replacement challenge flags, hashes CTF flags, and provisions bcrypt-protected Operations and lab answers through service-role-only database functions.
- Do not reuse any old flag, answer, hash, or walkthrough from public Git history.

The public-source security guard can be run with:

```bash
npm run security:scan
```

This guard is a useful CI control, not a substitute for reviewing database permissions, scanning Git history, rotating exposed credentials, and testing the deployed application.

## Security and competition integrity

CyberBreach uses a browser frontend backed by trusted server-side checks. The intended security boundaries are:

- Challenge flags, private walkthroughs, Operations answers, and lab answers are not delivered in public frontend catalogs.
- Challenge submissions are verified by trusted database functions; first-solve scoring is atomic and duplicate points are prevented.
- Operations and lab answers are stored as bcrypt hashes in private tables, with authenticated submissions, per-user attempt limits, and transaction-level concurrency protection.
- Team membership and competition roster snapshots are synchronized using database locks.
- Competition scoring is based on verified challenge solves within the event window and deduplicates team credit for the same challenge.
- Roles and privileged content loading are controlled outside the browser.
- RLS and explicit grants restrict access to private tables and trusted functions.

See [the security review](docs/security-review.md), [administrator setup](docs/admin-setup.md), and [the release checklist](docs/release-checklist.md). Run the SQL structural checks in `supabase/verification` against the configured Supabase database as part of deployment verification.

## Progression rules

- Completing an approved Academy lesson awards 25 personal XP.
- A first-time verified CTF solve awards the challenge's published points as XP.
- A correctly completed incident-response mission awards its configured personal XP once per mission.
- A verified browser-lab task awards its configured personal XP once per task.
- Personal learning XP contributes to progression, ranks, and achievements.
- Competitive leaderboards count verified CTF points only; Academy, Operations, and browser-lab XP do not change competitive rankings.
- Guest progress may be stored locally; signed-in progress is synchronized through Supabase.

## Repository layout

```text
.
├── .github/workflows/       # CI checks
├── apps/web/
│   ├── index.html           # Active Vite HTML entry point
│   └── src/
│       ├── app/             # Application composition and routing
│       ├── components/      # Shared interface components
│       ├── features/        # Academy, CTF, labs, teams, etc.
│       ├── integration/     # Reusable CollabCircle mount
│       └── main.tsx         # React bootstrap
├── docs/                    # Security, operations, release, handoff guides
├── scripts/                 # Security scan and private-content loader
├── supabase/
│   ├── functions/           # Edge Functions
│   ├── migrations/          # Ordered database migrations
│   ├── verification/        # Post-migration SQL checks
│   ├── private-content.example.json
│   └── seed.sql             # Public catalog metadata only
├── package.json             # Workspace and contributor scripts
└── vercel.json              # Browser app deployment configuration
```

## Integrate into CollabCircle later

CyberBreach is intentionally maintained as an independent project until the main CollabCircle website is ready for integration. Follow the [Next.js integration guide](apps/web/src/integration/README.md) when that work is approved. The guide explains the reusable React module, namespaced stylesheet, route mounting, environment variables, and backend setup.

## Safety boundaries

- Challenges and incident scenarios use fictional, self-authored training evidence or explicitly authorized environments.
- Browser simulations do not contact real targets or execute arbitrary commands on a visitor's device.
- No public shell, Docker socket, or privileged container runner is exposed by the web application.
- External lab providers operate their own isolated environments and access policies.
- Any future hosted lab service requires a separate security review, isolation model, network policy, resource limits, monitoring, and teardown process.

See [the external research policy](docs/external-research-policy.md).

## Project status

The `main` branch is the consolidated development baseline. Phase 12 adds security and platform-hardening work on top of milestones 1–11. A successful CI run validates the automated checks in that workflow; it does not, by itself, certify a live Supabase deployment or production readiness. Complete the deployment checklist and verify the configured backend before opening the platform to learners.

## License

No repository-wide open-source license is currently declared. Unless and until a license is added, the source is provided for project development and review and should not be assumed to be freely reusable or redistributable.


## Guided lab exercises (Phase 25)

Each of the six browser-simulated lab disciplines includes one short, unscored learning exercise with progressive hints and an explanation after a correct response. Exercises use synthetic scenarios and local browser logic only. They do not execute commands, access real systems, award CTF points or persist assessment results. They are teaching aids, not validated assessments.


## CYRO learning activity profile (Phase 26)

Signed-in learners can sync completion of the six guided browser-lab exercises. The database records only an allow-listed activity type and module ID, with one completion per learner and module. Reads are restricted by RLS to the owning account; writes go through an authenticated RPC that derives the user from `auth.uid()`. This history is separate from XP, CTF scores and diagnostic self-check answers. Apply migration `202611280012_cyro_learning_activity.sql` before enabling this sync. If the RPC is unavailable or the learner is signed out, the exercise remains usable locally and is not falsely reported as synced.


## Shared browser-origin policy

Both `cyro-assistant` and `delete-account` use the same exact-origin setting: `CYBERBREACH_ALLOWED_ORIGIN`. Set it to the production site origin (scheme and host only). Do not use wildcard CORS. Preview deployments should use a separate environment and explicit origin value rather than weakening the production allow-list. Requests without an Origin header are intended only for trusted server-to-server use and must still carry valid user authentication.
