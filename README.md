# CyberBreach

**A free cybersecurity learning, practice, research and competition platform by CollabCircle.**

CyberBreach is designed for everyone: people starting from zero through experienced security practitioners. Lessons use plain language and step-by-step demonstrations; scored CTF challenges target medium, hard and expert reasoning.

## Product pillars

- **Cyber Academy** — structured learning paths and guided practice.
- **CTF Arena** — Web Exploitation; Cryptography; Reverse Engineering; Binary Exploitation (Pwn); Forensics and Network Forensics; OSINT & Misc.
- **Cyber Labs** — browser-based simulations and, after security review, disposable isolated real environments.
- **Community & Competition** — teams, events, leaderboards and achievements.
- **AI Security Research** — LLM and agent security, adversarial ML and related research exercises.

## Current development status

The active development branch is `milestone-1/react-foundation`. The React/Vite/TypeScript frontend foundation is being built alongside the original vanilla JavaScript prototype. The original root application remains in place while migration proceeds.

The Academy paths, CTF category guides and two-mode Labs information page are initial product scaffolding. They are not a claim that all courses, challenge content, authentication, scoring or live labs are already operational.

## Requirements

- Node.js 20 or later
- npm 10 or later

## Run the web application

From the repository root:

```bash
npm install
npm run dev
```

The Vite development server prints its local URL.

Build and type-check:

```bash
npm run typecheck
npm run build
```

## Architecture

See:
- [Platform architecture](docs/architecture.md)
- [Frontend/backend decision record](docs/decisions/ADR-001-frontend-backend-foundation.md)
- [Learning and challenge standard](docs/learning-and-challenge-standard.md)

## Learning quality

Each learning unit should explain why a concept matters, introduce it in plain language, teach the correct technical vocabulary, demonstrate it, provide guided practice and then offer independent assessment. Challenges are not simplified to beginner quizzes: medium, hard and expert tasks require real reasoning. Progressive hints and complete post-challenge explanations support learning.

## Safety

- Only use systems owned by CollabCircle or explicitly authorized for training.
- No public arbitrary-code execution is enabled by this frontend foundation.
- Real labs must be isolated, disposable, resource-limited and network-restricted.
- Never commit API keys, database secrets, challenge answers or private test data.
- Do not use the platform to target real third-party systems.

## Free access

The product is intended to remain free to access. Infrastructure fair-use limits, queueing and temporary lab leases may be necessary to protect shared capacity; they are operational limits, not paid tiers. No paid challenge advantage or premium-only learning category is part of the product direction.

## Brand

Retain CollabCircle's black, white and electric-blue identity. The current frontend uses a dark navy/charcoal base and cyan accents as an evolving implementation of that direction.
