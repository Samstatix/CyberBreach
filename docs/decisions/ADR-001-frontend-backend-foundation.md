# ADR-001: React module, managed platform services and later Next.js integration

**Status:** Accepted  
**Date:** 2026-11-26, updated 2026-11-27

## Context
CyberBreach is a standalone cybersecurity learning and challenge product that will later be integrated into the main CollabCircle Next.js/Vercel website. Development must remain isolated in `Samstatix/CyberBreach` until the module is reviewed and ready to mount.

## Decisions
- Build the UI with React, TypeScript and Vite for standalone development and tests.
- Keep feature code mountable through `CyberBreachModule`, which accepts a React Router basename.
- Generate a CSS bundle namespaced under `.cyberbreach-root` for later use inside the main Next.js site.
- Use Supabase Auth and PostgreSQL with RLS for accounts and user-owned progress.
- Keep CTF scoring, flag verification and private walkthrough access in trusted SQL functions.
- Use external specialist lab providers for real isolated practice until a separate hosted-lab service passes a security review.
- Keep all code, migrations, content and documentation in the CyberBreach repository.

## Consequences
- CyberBreach can run and be tested independently without changing the main Vercel site.
- The same React module can later be mounted under a Next.js catch-all route.
- CSS is built as a namespaced integration artifact to reduce style collisions.
- Public browser configuration contains only Supabase URL and publishable/anon key.
- A portal URL is only a launch link; it does not provision a hosted lab.

## Rejected alternatives
- Modifying the main CollabCircle repository during feature development: rejected to preserve isolation.
- Putting trusted scoring or flag secrets in React: rejected because browser bundles are inspectable.
- Running arbitrary code or Docker workloads inside Vercel: rejected because it crosses an unsafe execution boundary.
- Copying proprietary TryHackMe or Hack The Box material: rejected for licensing and content-integrity reasons.
