# CLAUDE.md — PocketMind AI

Read AGENTS.md, DESIGN.md, and PRODUCT.md before any change. This file summarises the rules.

## Git

- Always work on a feature branch. Never commit directly to `main`.
- Never rewrite published history (no force push, rebase, amend, or squash on pushed commits).
- Validate before every commit: `bunx tsc --noEmit && bun run test && bun run build`
- The connected branch syncs to Lovable and Vercel publishes from `main` — keep branches in a working state.

## Off-limits (never touch)

- `supabase/migrations/` and `drizzle/` — schema changes go through Lovable only.
- Files with a generated-file header (e.g. `routeTree.gen.ts`).
- Secret values — do not put them in the repo.
- `LOVABLE_API_KEY` must never appear in browser code.

## Privacy / logging

- LlamaParse OCR runs only through the server function and Lovable connector, after explicit per-document consent.
- Never log document text, credentials, or extracted content — only code, step, and inference source.

## Design (see DESIGN.md for full spec)

- Fonts: Manrope (headings, 800) + DM Sans (body) only. No Inter, Geist, or Space Grotesk.
- Use `var(--pm-line)` for borders — never `var(--pm-border)` (not defined).
- Use `var(--pm-blue)` (#2857df) for interactive accent — never raw `#2563eb`.
- No glassmorphism, no bounce easing, no layout animation (width/height).
- No cards inside cards. No side-tab accent borders. No purple/cyan gradients.

## Stack

- Vite + React + TypeScript + TanStack Router
- Supabase (auth + DB), Firebase AI Logic (hybrid inference), Vercel (hosting)
- Styles: CSS custom properties (`--pm-*` tokens) + Tailwind utility classes
- Package manager: `bun`
