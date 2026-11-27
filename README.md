# CyberBreach

**A free cybersecurity learning, practice, research and competition platform by CollabCircle.**

CyberBreach is a self-contained React feature module developed in this repository so it can later be mounted inside the main CollabCircle Next.js/Vercel website. This repository is the source of truth; the main website is not changed during CyberBreach development.

## Product scope
- **Cyber Academy:** beginner-friendly lessons, worked examples, glossaries, knowledge checks and local/account-synced progress with fixed XP rewards.
- **Player progression:** ten skill trees, XP levels, operator ranks and unlockable achievements. Personal XP is separate from the competitive CTF leaderboard.
- **CTF Arena:** 18 original challenges across Web Exploitation, Cryptography, Reverse Engineering, Binary Exploitation, Forensics and Network Forensics, and OSINT & Misc. Every category has medium, hard and expert work.
- **Cyber Labs:** browser simulations plus links to real isolated environments operated by TryHackMe, Hack The Box Academy, PortSwigger and OverTheWire. A reviewed hosted-lab portal can be connected later.
- **Operations:** interactive fictional incident-response scenarios.
- **Community:** opt-in public CTF leaderboard and safety principles.
- **AI Security Research:** LLM/agent security topics and official research references.

## Product decisions
- Audience: everyone, from complete beginners to experienced practitioners.
- Access: CyberBreach learning and challenges are free; no paid challenge advantages or premium-only learning tiers.
- Labs: both browser simulations and real isolated environments. Real hosted lab execution is not enabled by exposing a shell from the web app.
- Frontend: React + Vite + TypeScript, packaged as a mountable React module.
- Platform services: Supabase Auth, PostgreSQL, Row Level Security and trusted database functions for scoring/progression.

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

## Database setup
1. Create a Supabase project.
2. Apply every SQL migration in `supabase/migrations` in filename order.
3. Run `supabase/seed.sql` after migrations to add the six categories and 18 original challenges.
4. Migration `202611270003_progression_system.sql` adds the lesson allow-list, server-awarded Academy XP, achievements and the player progression RPC.
5. Configure email confirmation and password policy in Supabase Auth.
6. Keep the service-role key out of browser/Vercel public variables.

The browser uses only the Supabase publishable/anon key. Challenge flags are stored as SHA-256 digests in a private table. The database verifies submissions, rate-limits attempts and awards first-solve points atomically. Full walkthroughs are returned only after the authenticated learner solves that challenge.

## Vercel integration later
Follow [the Next.js integration guide](apps/web/src/integration/README.md). The integration is intentionally not deployed or copied into the main CollabCircle repository from this branch.

## Security boundaries
- All challenge artifacts and incident scenarios are fictional and self-authored.
- No real third-party target is part of a CyberBreach challenge.
- No arbitrary code execution or public shell is exposed by the browser app.
- External lab providers run their own isolated environments and access rules.
- A future hosted-lab provider must be separately reviewed, disposable, network-restricted and resource-limited.
- Never commit secrets, API keys, private challenge data or real user evidence.

See [the external research policy](docs/external-research-policy.md).
