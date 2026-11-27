# Integrating CyberBreach into CollabCircle (Next.js / Vercel)

CyberBreach is an independently developed browser application in this repository. Its own Vercel deployment is a complete website: learners visit a URL and use the product in their browser. They do not install Node.js, npm, Python, Docker, or local tooling.

The main CollabCircle website is not modified by this repository. Integration is a separate future step.

## What is available

- Active standalone Vite application: `apps/web/index.html` and `apps/web/src/main.tsx`.
- Reusable React module: `src/integration/CyberBreachModule.tsx`.
- Route-aware React Router mount with a configurable basename.
- CSS build that scopes selectors under `.cyberbreach-root`.
- Supabase Auth and database integration.
- Vite-compatible and Next.js public environment configuration.

## Standalone browser deployment

The repository-root `vercel.json` builds the `@cyberbreach/web` workspace and deploys `apps/web/dist`. Vercel uses Node.js during installation/build only. Visitors receive the built static application and use it in a browser.

## Later Next.js integration

1. Copy `apps/web/src` into the main website at `src/features/cyberbreach`, preserving the internal relative folder structure.
2. Build CyberBreach's namespaced stylesheet and copy `apps/web/dist/cyberbreach.integration.css` into the main website's styles directory.
3. Install `react-router-dom`, `@supabase/supabase-js`, and `lucide-react` if they are not already present. React and React DOM are supplied by Next.js.
4. Add a client page at `app/cybersecurity/[[...path]]/page.tsx`:

```tsx
"use client";
import { CyberBreachModule } from "@/features/cyberbreach/integration/CyberBreachModule";

export default function CybersecurityPage() {
  return <CyberBreachModule basename="/cybersecurity" />;
}
```

5. Import the generated CSS from the main App Router root layout:

```tsx
import "@/styles/cyberbreach.integration.css";
```

6. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `NEXT_PUBLIC_CYBERBREACH_LAB_PORTAL_URL`.
7. Apply all SQL migrations in filename order, including the Phase 12 security migration, and follow the private-content provisioning process in the root README.
8. Deploy the `delete-account` Edge Function and configure the server-only `SUPABASE_SERVICE_ROLE_KEY` in Supabase Edge Function secrets.
9. Add the exact account recovery URL (including the `/cybersecurity` prefix) to Supabase Auth's allowed redirect URLs.

## Build the isolated CSS bundle

For maintainers, from the repository root:

```bash
npm install
npm run build
```

The build emits `apps/web/dist/cyberbreach.integration.css` and scopes selectors under `.cyberbreach-root`. These commands are development/integration tasks, not learner requirements.

## Security boundaries

- Never copy `.env` files, Supabase service-role keys, private answer files, or lab-provider secrets into the browser application.
- The Supabase publishable/anon key is intended for browser use only with correctly configured RLS and grants.
- Do not deploy a Docker socket, privileged container, or arbitrary shell runner inside the Vercel app.
- A lab portal URL is only a launch link; it does not provision or isolate a lab.
- Real hosted labs require a separately reviewed isolation provider with strict network and resource controls.
- Keep this repository as the source of truth until the integration has been reviewed and accepted.
