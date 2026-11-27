# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# PocketMind AI

Browser-based procurement/tender review workspace: extracts text from PDF/DOCX/XLSX locally, runs consent-gated Firebase AI Logic inference (cloud / on-device / hybrid), and produces a source-verified compliance matrix with CSV/JSON export. Live at ai-mind-law.vercel.app.

## Read first

- `AGENTS.md` — Lovable-managed rules (DB schema, generated files, secrets, AI gateway).
- `DESIGN.md` — the visual system, extracted from `src/styles.css`. Read before any CSS/component work.
- `PRODUCT.md` — product context, voice, UX principles.
- `src/routes/README.md` — file-based routing conventions and the `/evaluation` route guard.
- `README.md` — full feature/verification notes, incl. the cloud model fallback chain and timeouts.

## Commands

```sh
bun install                 # install deps (bun is the package manager; both bun.lock and package-lock.json are tracked, Vercel builds with npm)
bun run dev                 # dev server (Vite)
bun run build               # production build
bun run preview             # preview the production build
bun run test                # vitest, one run (jsdom; setup in src/test/setup.ts)
bun run test:watch          # watch mode
bunx vitest run src/test/csv.test.ts   # run a single test file
bun run lint                # eslint . (CI lints only a targeted file list; full local lint may report pre-existing formatting debt)
bun run format              # prettier --write .
```

Validate before every commit (also the CI gate, `.github/workflows/ci.yml`):

```sh
bunx tsc --noEmit && bun run test && bun run build
```

## Architecture

- **TanStack Start + TanStack Router (file-based).** Entry points: `src/start.ts` (request/server-function middleware — CSRF must stay on server functions), `src/server.ts` (server entry; never compress response bodies, hosting does it at the edge), `src/router.tsx`, shell `src/routes/__root.tsx` (keep `<Outlet />`). Routes in `src/routes/*.tsx` mostly render `PocketMindApp` with an `initialScreen` prop (e.g. `src/routes/documents.tsx` → `initialScreen="library"`); `src/routeTree.gen.ts` is generated — never edit by hand.
- **Components:** product screens in `src/components/pocketmind/` (`PocketMindApp.tsx` is the screen switcher: dashboard, library, analysis, compliance, risks, projects, processing, monitor, settings, integrations); generic primitives in `src/components/ui/`.
- **Logic:** `src/lib/services/`. Naming convention: `*.functions.ts` are TanStack Start **server functions** (server-only; LlamaParse OCR, Firecrawl research, tour narration, document discovery); plain modules are browser code. `localWorkspace.ts` is the IndexedDB layer (database `pocketmind-local-workspace`, version 2) holding documents, analyses, reviews, evidence, projects — local-only, not encrypted, not synced. Shared types in `src/lib/types.ts`; i18n in `src/lib/i18n/` (en/pt/es — translations must not alter evidence or dates); fictional sample in `src/data/sampleTender.ts`.
- **AI:** `src/lib/services/firebaseAi.ts` — Firebase AI Logic; cloud fallback chain `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite` (60s per attempt, 180s per section); schemas in `tenderAnalysisSchema.ts` / `evidenceComparisonSchema.ts` (zod). Supabase auth in `src/lib/services/supabase.ts`; the `/evaluation` route is a browser-local workspace gated by the Supabase session (`VITE_ENABLE_EVALUATION_DASHBOARD`, 404 in production by default).
- **Styling:** `src/styles.css` defines the `--pm-*` tokens + Tailwind 4 (`@theme inline`); components mix tokens with Tailwind utilities. Path alias `@/*` → `src/*`.
- **Tests:** `src/test/*.test.ts(x)`, vitest with jsdom + `fake-indexeddb`.

## Environment / secrets

- Copy `.env.example` to `.env.local` (never commit it). `VITE_FIREBASE_*` and the reCAPTCHA site key are public client config; `FIRECRAWL_API_KEY` / `ELEVENLABS_API_KEY` are server-only and must never be `VITE_*`.
- App Check debug token (`VITE_FIREBASE_APPCHECK_DEBUG_TOKEN`) is dev-only, injected via `define` only outside production builds — never commit or publish it. `LOVABLE_API_KEY` must never appear in browser code.

## Git

- Always work on a feature branch. Never commit directly to `main`.
- Never rewrite published history (no force push, rebase, amend, or squash on pushed commits) — the connected branch syncs to Lovable and Vercel publishes from `main`; keep branches in a working state.

## Off-limits (never touch)

- `supabase/migrations/` and `drizzle/` — schema changes go through Lovable only.
- Files with a generated-file header (e.g. `routeTree.gen.ts`).
- Secret values — do not put them in the repo.
- `vite.config.ts` already includes the `@lovable.dev/vite-tanstack-config` plugins — don't re-add them, don't set `ssr.external`/`resolve.external`, don't add compression.

## Privacy / logging

- LlamaParse OCR runs only through the server function and Lovable connector, after explicit per-document consent — never call the provider from browser code.
- Never log document text, credentials, or extracted content — only code, step, and inference source.

## Design (see DESIGN.md for the full spec)

- Fonts: Manrope (headings, 800) + DM Sans (body) only. No Inter, Geist, or Space Grotesk.
- Use `var(--pm-line)` for borders — never `var(--pm-border)` (not defined).
- Use `var(--pm-blue)` (#2857df) for the interactive accent — never raw `#2563eb`.
- No glassmorphism, no bounce easing, no layout animation (width/height).
- No cards inside cards. No side-tab accent borders. No purple/cyan gradients. Blue is the single accent; semantic colors are status-only.

## Stack

- Vite + React 19 + TypeScript + TanStack Start/Router + TanStack Query
- Supabase (auth + DB), Firebase AI Logic (hybrid inference + App Check), Vercel (hosting)
- Styles: CSS custom properties (`--pm-*` tokens) + Tailwind utility classes
- Package manager: `bun`
