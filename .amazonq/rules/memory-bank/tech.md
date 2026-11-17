# Tech — PocketMind AI

## Core Stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | ^5.8.3 |
| Runtime | React | ^19.2.0 |
| Framework | TanStack Start | 1.168.60 |
| Router | TanStack Router | 1.170.41 |
| Build | Vite | 8.1.5 |
| Server | Nitro (via TanStack Start) | 3.0.x-beta |
| CSS | Tailwind CSS | ^4.2.1 |
| UI Primitives | Radix UI + shadcn/ui | various |
| AI | Firebase AI Logic (`firebase/ai`) | ^13.3.0 |
| Validation | Zod | ^3.25.76 |
| PDF | pdfjs-dist | ^6.5.438 |
| Testing | Vitest + jsdom | ^4.1.10 |
| Package Manager | npm or Bun | — |
| Deployment | Vercel | — |

## Development Commands

```sh
# Install
npm install        # or: bun install

# Dev server
npm run dev        # or: bun run dev

# Build
npm run build

# Preview production build
npm run preview

# Tests
npm test           # vitest run (single pass)
npm run test:watch # vitest (watch mode)

# Lint
npm run lint       # eslint .

# Format
npm run format     # prettier --write .
```

## TypeScript Configuration

- Target: `ES2022`
- Module resolution: `Bundler`
- Strict mode: enabled
- Path alias: `@/*` → `./src/*`
- Notable strict flags enabled:
  - `noFallthroughCasesInSwitch`
  - `noImplicitOverride`
  - `noImplicitReturns`
  - `noPropertyAccessFromIndexSignature`
  - `noUncheckedIndexedAccess`
  - `exactOptionalPropertyTypes`
  - `noUncheckedSideEffectImports`

## Vite Configuration

Managed via `@lovable.dev/vite-tanstack-config`. Do NOT manually add:
- TanStack devtools, `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`
- Nitro (build-only, cloudflare default target)
- `VITE_*` env injection, `@` path alias, React/TanStack dedupe

Custom additions in `vite.config.ts`:
- `__APP_VERSION__` → `"0.4.0"`
- `__BUILD_TIME__` → ISO timestamp at build
- `__COMMIT_HASH__` → short git hash via `execSync`

## Environment Variables

### Client-side (`VITE_*` — safe to expose)
| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app config |
| `VITE_FIREBASE_APP_ID` | Firebase web app config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web app config |
| `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` | App Check (production only) |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | App Check debug token (dev only, never commit) |

### Server-side only (never `VITE_*`)
| Variable | Purpose |
|---|---|
| `FIRECRAWL_API_KEY` | Optional Firecrawl legal research |
| `ELEVENLABS_API_KEY` | Optional tour narration TTS |

## Firebase AI Logic

- SDK: `firebase/ai` (part of `firebase` ^13.3.0)
- Backend: `GoogleAIBackend`
- Inference modes: `ONLY_ON_DEVICE`, `ONLY_IN_CLOUD`, `PREFER_ON_DEVICE`
- On-device: Chrome's Prompt API (desktop Chrome only, hardware-dependent)
- App Check: `ReCaptchaV3Provider` (dev debug) / `ReCaptchaEnterpriseProvider` (production)
- Firebase runtime cached on `window.__pocketMindFirebaseRuntime` (singleton)

### Model Fallback Chain
```
gemini-3.8-flash (attempt 1, delay 0ms)
gemini-3.8-flash (attempt 2, delay 3s + jitter)
gemini-3.7-flash (attempt 3, delay 6s + jitter)
gemini-3.6-flash (attempt 4, delay 10s + jitter)
gemini-3.5-flash-lite (attempt 5, delay 15s + jitter)
```
- Retryable HTTP codes: 429, 500, 502, 503
- Generation timeout: 60,000 ms per attempt
- Total budget: 180,000 ms

## Testing

- Framework: Vitest with jsdom environment
- Setup file: `src/test/setup.ts`
- Test files: `src/test/*.test.{ts,tsx}`
- Globals enabled (no explicit `import { describe, it, expect }` needed)
- Path alias `@` resolved in `vitest.config.ts`

Test files:
- `app-routing.test.tsx` — route rendering
- `csv.test.ts` — CSV export
- `document-qa-panel.test.tsx` — Q&A panel component
- `document-qa.test.ts` — Q&A service logic
- `model-fallback.test.ts` — Firebase AI retry/fallback logic
- `ocr-normalize.test.ts` — OCR normalization
- `ocr-review.test.ts` — OCR evidence review
- `tender-analysis.test.ts` — tender analysis parsing

## Deployment

- Platform: Vercel
- Framework: `tanstack-start` (set in `vercel.json`)
- Live URL: https://ai-mind-law.vercel.app/
- Env sync script: `scripts/set-vercel-vars.ps1` (reads `.env`, syncs via Vercel CLI)

## Key Dependencies

| Package | Role |
|---|---|
| `@tanstack/react-query` | Server state / async data fetching |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `react-resizable-panels` | Resizable panel layout |
| `class-variance-authority` + `clsx` + `tailwind-merge` | Conditional class utilities |
| `date-fns` | Date formatting |
| `recharts` | Charts (if used) |
| `zod` | Runtime schema validation |
| `pdfjs-dist` | In-browser PDF text extraction |
| `@ai-sdk/openai` + `ai` | AI SDK (Vercel AI SDK, used alongside Firebase) |
