# ADR-001: Frontend and backend foundation

- **Status:** Accepted for Milestone 1 planning
- **Date:** 2026-11-27
- **Branch:** `milestone-1/react-foundation`

## Context

The existing CyberBreach prototype is a small vanilla JavaScript application with a hash router, custom CSS, and a phishing email training challenge. The intended product spans Academy, CTF Arena, Cyber Labs, Community & Competition, and AI Security Research. The current prototype has no backend, authentication, database, or trusted challenge validation.

## Decision

1. Adopt **React + Vite + TypeScript** for the browser application.
2. Keep the current dark operational visual identity and evolve its tokens/components.
3. Use **Supabase (PostgreSQL, Auth, Storage, RLS)** as the initial managed identity/data foundation.
4. Add a **Fastify TypeScript API** for trusted server-side workflows such as submissions, flag checks, scoring and XP ledger writes.
5. Keep any execution of untrusted code in a separate isolated worker boundary. Do not use Supabase Edge Functions or the browser as an arbitrary code execution sandbox.
6. Start as a modular monolith and defer Redis, queues, Kubernetes and service splitting until required.

## Consequences

- The initial frontend migration can happen independently of backend provisioning.
- PostgreSQL RLS and API authorization must both be designed and tested.
- Client-visible challenge metadata must be separated from private validation material.
- The project incurs a modest migration cost now in exchange for clearer feature boundaries and safer server-authoritative scoring.
- The current vanilla app remains available during migration and is not deleted in the first milestone.

## Alternatives considered

- **Continue vanilla JavaScript:** lowest short-term migration cost, but increasingly difficult to maintain as independent product areas and complex state grow.
- **Next.js:** capable, but server-side rendering is not currently a requirement; Vite keeps the frontend shell simpler.
- **Custom backend immediately:** offers control but adds deployment and operations overhead before the first product workflows are validated.
- **Supabase-only client writes:** unsuitable for secret-bearing challenge validation and authoritative score/XP operations.


## Confirmed product constraints

The product owner has confirmed that CyberBreach must serve complete beginners through experienced professionals, provide both browser simulations and real isolated labs, and remain free to access.

Consequences:
- Do not introduce premium-only learning paths, paid challenge categories or pay-to-win scoring.
- Use fair-use capacity controls and lab leases to protect shared infrastructure; communicate these limits clearly.
- Provide plain-language teaching, progressive hints and accessible UI while retaining medium-to-expert scored challenges.
- Treat browser simulations as explicitly simulated; use isolated disposable infrastructure for tasks requiring real systems.
- Do not launch public arbitrary-code execution until isolation, abuse controls, cleanup, capacity and incident response have been reviewed.
