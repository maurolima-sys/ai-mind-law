## What changed and why

<!-- One paragraph. Link the issue or describe the root cause. -->

## Checklist

- [ ] Bug fix: added or updated a regression test first, confirmed it failed before the fix, and confirmed it passes now (explain any exception below)
- [ ] Feature: tests cover the happy path and the main failure path
- [ ] `bunx tsc --noEmit` passes
- [ ] `bun run test` passes
- [ ] `bun run build` succeeds
- [ ] CI is green; this PR will not merge with failing required checks
- [ ] Tested manually in the Vercel preview URL for this branch
- [ ] The affected user flow was walked through end-to-end (upload → processing → result, or the specific flow changed)
- [ ] CHANGELOG.md updated with the commit hash and a one-line description
- [ ] No secrets, `.env*` files, or document text in the diff

## Flows affected

<!-- Tick every flow this PR touches. -->

- [ ] Upload (PDF / DOCX / XLSX)
- [ ] Processing screen / mode selection
- [ ] Analysis (on-device / cloud / hybrid)
- [ ] Compliance matrix
- [ ] Document Q&A
- [ ] Evidence comparison
- [ ] Projects / Library
- [ ] Settings / Integrations
- [ ] Deep link (`?doc=`, `?screen=`)
- [ ] None of the above (docs / config / tooling only)
