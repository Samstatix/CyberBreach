# Integrating CyberBreach into CollabCircle (Next.js / Vercel)

CyberBreach remains developed and versioned in this repository. The main CollabCircle website is not modified by this project.

## What is ready
- A mountable React module: `src/integration/CyberBreachModule.tsx`.
- A route-aware React Router mount using a configurable basename.
- A CSS build that prefixes CyberBreach selectors under `.cyberbreach-root`.
- Runtime configuration that accepts Vite variables or Next.js public variables.
- Supabase Auth and database calls that remain in the CyberBreach feature boundary.

## Later integration steps
1. Copy `apps/web/src` into the main website at `src/features/cyberbreach`. Keep the internal relative folder structure intact.
2. Copy the generated `apps/web/dist/cyberbreach.integration.css` into the main website's styles directory.
3. Install `react-router-dom`, `@supabase/supabase-js` and `lucide-react` if they are not already installed. React and React DOM are supplied by Next.js.
4. Add a client page at `app/cybersecurity/[[...path]]/page.tsx`:

```tsx
"use client";
import { CyberBreachModule } from "@/features/cyberbreach/integration/CyberBreachModule";
export default function CybersecurityPage(){return <CyberBreachModule basename="/cybersecurity"/>;}
```

5. Import the generated CSS from the main App Router root layout:
```tsx
import "@/styles/cyberbreach.integration.css";
```
6. Configure Vercel variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and optionally `NEXT_PUBLIC_CYBERBREACH_LAB_PORTAL_URL`.
7. Apply SQL migrations `202611270001` through `202611270008` in filename order and run `supabase/seed.sql` after migrations.
8. Deploy `supabase/functions/delete-account` and configure the server-only `SUPABASE_SERVICE_ROLE_KEY` in Supabase Edge Function secrets.
9. Add the exact CyberBreach account recovery URL to Supabase Auth's allowed redirect URLs.

## Build the isolated CSS bundle
From the repository root:
```bash
npm install
npm run build
```
The build emits `apps/web/dist/cyberbreach.integration.css`. It scopes selectors under `.cyberbreach-root`.

## Important boundaries
- Never copy `.env` files, Supabase service-role keys or lab-provider secrets into the browser application.
- The public Supabase key is safe only when RLS is correctly configured.
- Do not deploy a Docker socket, privileged container or arbitrary shell runner inside the Vercel app.
- Real hosted labs require a separate reviewed isolation provider. The optional portal URL is only a launch link; it does not provision a lab by itself.
- External TryHackMe, Hack The Box and PortSwigger links use their own account/access rules.
- Keep this repository as the source of truth until the integration has been reviewed and accepted.
