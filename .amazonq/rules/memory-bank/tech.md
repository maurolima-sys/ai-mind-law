# PocketMind AI — Technology Stack

## Runtime

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | ^19.2.0 |
| Language | TypeScript | ^5.8.3 (strict mode) |
| Router | TanStack Router (file-based) | 1.170.41 |
| Meta-framework | TanStack Start (Nitro SSR) | 1.168.60 |
| Build tool | Vite | 8.3.8 |
| CSS | Tailwind CSS v4 | ^4.2.1 |
| Package manager | Bun (dev) / npm (Vercel CI) | latest |

## AI & Firebase

| Library | Purpose |
|---------|---------|
| `firebase` ^13.3.0 | Firebase AI Logic (Gemini), App Check |
| `firebase/ai` | `getGenerativeModel`, `InferenceMode`, hybrid inference |
| `firebase/app-check` | `ReCaptchaEnterpriseProvider`, limited-use tokens |

**Gemini model chain:** `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`

**Inference modes (Firebase `InferenceMode`):**
- `ONLY_ON_DEVICE` — local preference
- `ONLY_IN_CLOUD` — cloud preference
- `PREFER_ON_DEVICE` — hybrid preference

## Document Processing (browser-side)

| Library | Format |
|---------|--------|
| `pdfjs-dist` ^6.5.438 | PDF text extraction with page numbers |
| `mammoth` ^1.13.0 | DOCX → plain text |
| `exceljs` ^4.4.0 | XLSX → text with sheet/row labels |

## UI Components

- **shadcn/ui** — full component set in `src/components/ui/` (Radix UI primitives)
- **Radix UI** — accordion, dialog, dropdown, select, tabs, tooltip, etc.
- **lucide-react** ^0.575.0 — icons
- **sonner** ^2.0.7 — toast notifications
- **recharts** ^2.15.4 — charts
- **react-resizable-panels** ^4.6.5 — resizable layout panels
- **embla-carousel-react** ^8.6.0 — carousels
- **vaul** ^1.1.2 — drawer
- **cmdk** ^1.1.1 — command palette
- **react-day-picker** ^9.14.0 — date picker

## Forms & Validation

- `react-hook-form` ^7.71.2 + `@hookform/resolvers` ^5.2.2
- `zod` ^3.25.76 — schema validation and Firebase response schema

## State & Data

- **React Context** — `analysisRunContext.tsx` for analysis progress
- **IndexedDB** — all workspace data via `localWorkspace.ts` (no ORM)
- **localStorage** — preferences (versioned), layout state, BYOK config
- **TanStack Query** ^5.101.1 — available but used minimally
- **Supabase JS** ^2.119.2 — client present, integration is roadmap-only

## Routing

TanStack Router with file-based routing. Route tree auto-generated in `src/routeTree.gen.ts` — never edit manually. Uses `useNavigate`, `useLocation`, `Link` from `@tanstack/react-router`.

## Server

- **Nitro** (via TanStack Start) — server functions with `.functions.ts` suffix
- Server functions: `discoverDocuments.functions.ts`, `legalResearch.functions.ts`, `ocr.functions.ts`, `tourNarration.functions.ts`
- `FIRECRAWL_API_KEY` must be server-side env var — never `VITE_*`

## Testing

| Tool | Role |
|------|------|
| Vitest ^4.1.12 | Test runner |
| jsdom ^20.0.3 | DOM environment |
| @testing-library/react ^16.0.0 | Component testing |
| @testing-library/jest-dom ^7.0.1 | DOM matchers |
| fake-indexeddb ^6.2.8 | IndexedDB mock |

Test files: `src/test/*.{test,spec}.{ts,tsx}`
Setup file: `src/test/setup.ts`
Pool: `vmThreads`

## Linting & Formatting

- ESLint 9 (flat config) with `typescript-eslint`, `react-hooks`, `react-refresh`, `prettier`
- Prettier ^3.3.3 — formatting enforced via ESLint plugin
- CI lints a targeted subset of files (not all source files)
- `@typescript-eslint/no-unused-vars` is OFF

## Build & Deploy

| Target | Tool |
|--------|------|
| Local dev | `bun run dev` (Vite dev server) |
| Production build | `bun run build` / `npm run build` |
| Deployment | Vercel (framework: TanStack Start) |
| Edge runtime | Cloudflare Workers (Nitro target) |

**`vercel.json`:** `framework: "tanstack-start"` — do not set `outputDirectory`.

**Build-time defines (vite.config.ts):**
- `__APP_VERSION__` — `"0.4.0"`
- `__BUILD_TIME__` — ISO timestamp
- `__COMMIT_HASH__` — short git SHA (or `VERCEL_GIT_COMMIT_SHA`)
- `__APPCHECK_DEBUG_TOKEN__` — dev only, never in production bundle

## Environment Variables

| Variable | Side | Purpose |
|----------|------|---------|
| `VITE_FIREBASE_API_KEY` | Client | Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client | Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | Client | Firebase config |
| `VITE_FIREBASE_APP_ID` | Client | Firebase config |
| `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` | Client | App Check (prod) |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | Dev only | App Check debug bypass |
| `FIRECRAWL_API_KEY` | Server only | Firecrawl legal research |

**Never put `FIRECRAWL_API_KEY` in a `VITE_*` variable.**
**Never commit `.env.local` or debug tokens.**

## TypeScript Configuration

- Target: `ES2022`
- Module resolution: `Bundler`
- Strict mode: ON
- `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`: ON
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`: ON
- Path alias: `@/*` → `./src/*`
- `noEmit: true` (Vite handles transpilation)

## CI Pipeline (GitHub Actions)

1. `bun install --frozen-lockfile`
2. `tsc --noEmit` — mandatory TypeScript gate
3. `bun run test` — full Vitest suite
4. `bunx eslint [targeted files]` — targeted lint
5. `bun run build` — production build

## Pre-push Gate (`scripts/pre-push-check.mjs`)

Triggered by `git-exe` command. Checks: branch=main, remote sync, secret scan, whitespace, lint, TypeScript, tests, npm audit (baseline: 10 high / 0 critical), production build. Blocks on any failure. Never runs `npm audit fix --force` or `git push --force`.

## Key Constraints

- `pdfjs-dist`, `@tanstack/router-core`, `seroval` excluded from Vite `optimizeDeps`
- No `ssr.external` or `resolve.external` — Worker has no runtime module resolution
- No compression plugins — hosting compresses at the edge
- `rolldown` overridden to `1.2.1`, `js-yaml` to `4.3.2`, `seroval` to `1.8.2`
