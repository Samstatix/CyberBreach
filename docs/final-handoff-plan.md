# CyberBreach Development and Final Handoff Plan

## Owner's delivery requirements

- Keep the GitHub repository public during active development, as requested.
- Milestones 1–11 have been consolidated into \`main\`.
- Use \`main\` as the current development baseline; create focused branches for subsequent phases.
- Merge reviewed, CI-passing work into \`main\` through pull requests.
- Keep the main CollabCircle website and its Vercel deployment untouched until a separately approved integration step.
- The owner may make the repository private when ready. This is a visibility decision, not a substitute for rotating previously exposed answer material.

## Development workflow

1. Create each new feature/hardening branch from the latest \`main\`.
2. Keep each branch focused on a coherent feature or reliability objective.
3. Run source secret scanning, TypeScript type-checking, automated tests and the production build.
4. Validate Supabase migrations in filename order against a fresh staging project.
5. Run the corresponding SQL verification scripts and test RLS/authorization boundaries.
6. Update README, architecture notes, setup instructions, security review and release checklist as behavior changes.
7. Open a pull request to \`main\`; review the diff and merge only after required checks pass.
8. Keep all service-role credentials and private challenge content outside Git and browser environments.

## Current hardening priorities

- Remove private answers and walkthroughs from public source files.
- Rotate every answer value exposed in public Git history.
- Verify private answer storage, administrator-only loading and server-side verification.
- Validate team roster snapshots, event registration concurrency and once-per-challenge team scoring.
- Expand automated regression coverage across authentication, Academy, progression, CTF, Labs, Operations, teams and competitions.
- Improve accessibility, responsive behavior, beginner guidance and learning-path breadth.

## Production-readiness gate

Consolidation into \`main\` is not production approval. Before a competitive public launch, all of the following must be complete:

- [ ] Every previously exposed CTF flag, Operations answer and lab answer has been rotated.
- [ ] Private challenge content is loaded from an ignored file using the administrator-only loader.
- [ ] No private answer material or service-role key appears in public source or browser build output.
- [ ] Migrations 001–010 apply cleanly to a fresh staging Supabase project.
- [ ] Verification SQL 008, 009 and 010 passes.
- [ ] RLS, role checks, answer submission, rate limits and XP idempotency are tested.
- [ ] Team registration and roster snapshots are tested under concurrent membership changes.
- [ ] Team event scoring counts each challenge once per registered team.
- [ ] All primary user journeys work: sign-up/sign-in, password recovery, account deletion, Academy, progression, CTF, all six practice rooms, Linux Labs, Operations, Community teams, scheduled competitions and AI Security Research.
- [ ] TypeScript type-check, automated tests, source secret scan and production build pass.
- [ ] Responsive layout, keyboard navigation and error/empty/loading states are reviewed.
- [ ] Environment variable documentation and integration instructions are complete.
- [ ] Any intentionally deferred features are disclosed in the release notes.

## Final handoff

When the production-readiness gate is complete:

1. Review the final \`main\` branch and repository tree.
2. Run the full CI suite against the exact release commit.
3. Create a release tag and record the commit SHA.
4. Confirm local setup, Supabase setup, private content loading and Vercel integration instructions.
5. Provide the owner with the \`main\` branch link, release tag, commit SHA, passing CI result and a list of anything not verified against a live service.

## Repository visibility and historical exposure

The repository was public while some answer material was committed. Removing those values from the current tree does not remove them from Git history, forks, archives or caches. Treat old values as compromised and rotate them. Making the repository private later does not reverse prior public exposure.

## Download handoff

The final handoff message should include:

- A link to the repository's \`main\` branch.
- The final release tag and commit SHA.
- The passing CI result.
- Setup instructions for local development.
- Supabase migration, staging verification and private-content loading instructions.
- A short list of anything not deployed or not verified against a live service.
