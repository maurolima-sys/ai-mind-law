# Engineering — PocketMind AI

Regression-safety protocol for a one-person codebase that ships to production on every merge.

## The core rule: bug → test → fix

Every bug fix starts with a test that reproduces the failure. The test must fail before the fix and pass after. This is not optional. It is the only reliable way to prevent the same bug from returning silently.

The hydration race (`a7d27bb`, `8776243`) and the `ReferenceError` that reached production (`1d99a29`) both lacked a test at the time they were introduced. The tests added after the fact now protect those paths. The goal is to reach that state *before* the bug ships.

## Branch discipline

- Every change goes on a `fix/…` or `feat/…` branch.
- Open a PR, let CI run, check the Vercel preview URL, then merge.
- `main` is protected: CI must be green before merge. Enable this in GitHub → Settings → Branches → Branch protection rules → Require status checks.
- Never push directly to `main`. Never force-push.

The Lovable sync and Vercel deploy both read from `main`. A broken `main` is a broken production deploy.

## CI gate (`.github/workflows/ci.yml`)

The gate runs on every PR and every push to `main`:

1. `bunx tsc --noEmit` — TypeScript must compile clean.
2. `bun run test` — all tests must pass.
3. `bunx eslint [targeted files]` — lint on the integration layer.
4. `bun run build` — production build must succeed.

If any step fails, the PR cannot merge. Do not merge with a red CI.

## What to test

### Unit tests (`src/test/`)

Cover the logic that is hardest to verify by eye:

- State derivations: `selectedDocument`, `workspaceReady`, `processingChoice`.
- Service functions: analysis parsing, evidence verification, CSV export, model fallback.
- Edge cases: id not found after hydration, empty pages array, malformed AI response.

Pattern: write the test in `src/test/`, run `bunx vitest run src/test/your-file.test.ts`, confirm it fails, apply the fix, confirm it passes.

### Smoke flows (manual, in the Vercel preview)

Before merging any PR that touches a user-facing flow, walk through it:

| Flow | Steps |
|------|-------|
| Upload | Add PDF → text extracted → document appears in library |
| Processing | Upload → Processing screen shows the upload (not Riverside) → choose mode → Confirm |
| Analysis | Run analysis → findings appear with source excerpts |
| Deep link | F5 on `/processing?doc=upload-xxx` → same document, not Riverside |
| Not found | Navigate to `/processing?doc=invented-id` → "Document not found" message |
| Q&A | Ask a question about extracted text → answer with citations |
| Compliance | Open matrix → review status persists after page reload |

Add a row to this table when a new flow is introduced.

## Commit discipline

- One cause per commit. If a second `fix:` on the same flow is needed, stop and find the root cause before the third.
- Prefix: `fix:`, `feat:`, `docs:`, `chore:`, `test:`.
- Update `CHANGELOG.md` in the same commit as the code change. Include the short commit hash once it is known (amend before push if needed).
- Never commit `.env*` files, document text, or debug tokens.

## Rollback

The tag `hackathon-stable` (`1d99a29`) is the last independently verified stable build. If a production deploy breaks and the cause is not immediately clear, promote the previous Vercel deployment from the dashboard rather than fixing forward under pressure.

Keep a stable tag on `main` after each verified milestone. Tag format: `v0.x.y` or a descriptive name like `hackathon-stable`.

## When to refactor

The `selectedDocument` derivation, `workspaceReady` flag, and `selectedDocumentIdRef` are spread across `PocketMindApp.tsx`. A small state machine (`loading → ready → found | not-found`) would make this explicit and reduce the surface for hydration bugs. Refactor only after the unit tests for those paths are in place — otherwise the refactor becomes another source of regression.

Refactoring is not a priority before the demo video is recorded.

## Checklist before every merge

See `.github/pull_request_template.md`. The short version:

1. Test written (or confirmed existing) for the changed path.
2. `bunx tsc --noEmit && bun run test && bun run build` all green.
3. Vercel preview URL tested for the affected flow.
4. CHANGELOG updated.
5. No secrets in the diff.
