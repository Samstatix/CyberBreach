# CyberBreach Final Repository Handoff Plan

## Owner's delivery requirements

- Keep the GitHub repository public during active development.
- Continue development on named milestone branches.
- Do not merge incomplete or unverified work into `main`.
- Once the platform is complete, consolidate all approved work into `main`.
- Make the complete source repository downloadable from `main`.
- The project owner will change repository visibility to private after the final handoff.

## Development workflow

1. Use a milestone branch for each coherent feature set or hardening phase.
2. Preserve earlier completed work; use the latest verified milestone as the next branch base.
3. Run type-checking, tests and production build after meaningful changes.
4. Validate Supabase migrations in filename order and test authorization boundaries in a staging project.
5. Update README, architecture notes, setup instructions and release checklist as features change.
6. Keep the CollabCircle production website untouched until a separately approved integration step.

## Final consolidation gate

Do not merge milestone work into `main` until all of the following are true:

- [ ] The agreed product scope is implemented and reviewed.
- [ ] All main user journeys work: sign-up/sign-in, Academy, progression, CTF, Labs, Operations, Community and AI Security Research.
- [ ] TypeScript type-check passes.
- [ ] Automated tests pass.
- [ ] Production build passes.
- [ ] Responsive layout, keyboard navigation and error/empty/loading states are reviewed.
- [ ] Supabase migrations apply cleanly in order to a fresh staging project.
- [ ] RLS, scoring, reward idempotency, account ownership and account deletion are tested.
- [ ] No service-role key, real credential or private deployment secret is present in source or build output.
- [ ] Publicly exposed challenge answers and flags have been rotated; trusted answer material is separated from public application code before competitive launch.
- [ ] Environment variable documentation and `.env.example` are complete, with placeholders only.
- [ ] README and integration instructions accurately describe the finished product.
- [ ] The final release checklist is complete, with any intentionally deferred items clearly disclosed.

## Main-branch consolidation

After the gate is satisfied:

1. Compare each completed milestone branch against the intended final base.
2. Merge the reviewed, tested work into `main` in dependency order.
3. Resolve conflicts without dropping previously completed functionality.
4. Run the full CI suite against the resulting `main` commit.
5. Inspect the final repository tree and confirm that application source, tests, SQL migrations, seed/deployment instructions, docs, assets and configuration templates are present.
6. Tag the final handoff release and record its commit SHA.
7. Confirm that GitHub's `main` branch is the complete download-ready project.

## Owner's privacy change

After receiving and reviewing the complete `main` branch, the owner may change the repository visibility to private in GitHub repository settings.

Changing visibility does not undo public exposure that happened earlier. Treat answer material and credentials committed while public as compromised, and rotate or replace them as appropriate. Do not rely on a later visibility change as a substitute for secret removal or answer rotation.

## Download handoff

The final handoff message should include:

- A link to the repository's `main` branch.
- The final release tag and commit SHA.
- The passing CI result.
- Setup instructions for local development.
- Supabase migration and environment setup instructions.
- A short list of anything not deployed or not verified against a live service.
