# Structure — PocketMind AI

## Directory Layout

```
ai-mind-law/
├── src/
│   ├── components/
│   │   ├── pocketmind/          # Application-level components
│   │   │   ├── PocketMindApp.tsx      # Root app shell: routing, state, sidebar, topbar
│   │   │   ├── DocumentQaPanel.tsx    # Q&A panel: questions, citations, research
│   │   │   ├── GuidedTour.tsx         # Onboarding tour (9 steps)
│   │   │   ├── LanguageSelector.tsx   # EN/PT/ES switcher
│   │   │   └── ChangelogPage.tsx      # Changelog display
│   │   └── ui/                  # shadcn/ui primitives (Radix-based)
│   ├── data/
│   │   └── sampleTender.ts      # Fictional sample tender + prepared analysis
│   ├── hooks/
│   │   └── use-mobile.tsx       # Responsive breakpoint hook
│   ├── lib/
│   │   ├── i18n/                # Internationalization
│   │   │   ├── index.tsx        # LocaleProvider, useLocale, t() hook
│   │   │   ├── en.ts            # English strings
│   │   │   ├── pt.ts            # Portuguese strings
│   │   │   └── es.ts            # Spanish strings
│   │   ├── services/            # Business logic and external integrations
│   │   │   ├── firebaseAi.ts         # Firebase init, App Check, model creation, retry/fallback
│   │   │   ├── tenderAnalysis.ts     # PDF chunking, prompt building, analysis orchestration
│   │   │   ├── documentQa.ts         # Q&A prompt building and response parsing
│   │   │   ├── evidence.ts           # Excerpt verification against extracted pages
│   │   │   ├── csv.ts                # Compliance matrix CSV export
│   │   │   ├── documentProcessing.ts # PDF.js text extraction
│   │   │   ├── externalOcr.ts        # LlamaParse OCR client
│   │   │   ├── legalResearch.ts      # Firecrawl legal research client
│   │   │   ├── legalResearch.functions.ts  # Server function: Firecrawl API call
│   │   │   ├── ocr.functions.ts      # Server function: LlamaParse API call
│   │   │   ├── ocrEvidence.ts        # OCR evidence verification
│   │   │   ├── ocrNormalize.ts       # OCR output normalization
│   │   │   └── tourNarration.functions.ts  # Server function: tour TTS
│   │   ├── types.ts             # All shared TypeScript types and interfaces
│   │   ├── utils.ts             # cn() and general utilities
│   │   ├── buildInfo.ts         # App version, build time, commit hash
│   │   ├── error-capture.ts     # Error boundary helpers
│   │   ├── error-page.ts        # Error page component
│   │   └── lovable-error-reporting.ts  # Lovable platform error reporting
│   ├── routes/
│   │   ├── __root.tsx           # TanStack Router root: HTML shell, providers, meta
│   │   ├── index.tsx            # Main app route (renders PocketMindApp)
│   │   └── changelog.tsx        # /changelog route
│   ├── router.tsx               # Router instance creation
│   ├── routeTree.gen.ts         # Auto-generated route tree (TanStack Router)
│   ├── server.ts                # Nitro server entry (H3 middleware, CSRF)
│   ├── start.ts                 # TanStack Start client entry
│   └── styles.css               # Global CSS (Tailwind v4 + CSS variables)
├── public/                      # Static assets (favicons, screenshots)
├── docs/                        # Project documentation (user guide, storyboard, etc.)
├── scripts/
│   └── set-vercel-vars.ps1      # Sync .env to Vercel via CLI
├── .amazonq/rules/memory-bank/  # Amazon Q memory bank
├── .lovable/                    # Lovable platform config
├── package.json
├── vite.config.ts               # Vite config via @lovable.dev/vite-tanstack-config
├── vitest.config.ts             # Vitest test config
├── tsconfig.json
├── vercel.json                  # Vercel deployment (framework: tanstack-start)
├── eslint.config.js
└── .prettierrc
```

## Core Components and Relationships

### State Management (PocketMindApp.tsx)

- Single root component holds all application state: `documents`, `activeDocumentId`, `processingChoice`, `cloudConsent`, `reviews`, `searchQuery`
- State flows down as props; no external state library (no Redux/Zustand)
- Four screens rendered conditionally: `OverviewScreen`, `AnalysisScreen`, `ComplianceScreen`, `ProcessingScreen`
- Navigation via `activeScreen` state (not URL-based within the app)

### Data Flow

```
PDF upload → documentProcessing.ts (PDF.js) → pages: string[]
                                             ↓
                              tenderAnalysis.ts (chunking + prompts)
                                             ↓
                              firebaseAi.ts (Firebase AI Logic SDK)
                                             ↓
                              evidence.ts (excerpt verification)
                                             ↓
                              Analysis object → stored in DocumentRecord
```

### Server Functions (TanStack Start / Nitro)

- `ocr.functions.ts` — LlamaParse OCR (server-side, never exposes API key to browser)
- `legalResearch.functions.ts` — Firecrawl search (server-side only)
- `tourNarration.functions.ts` — TTS for guided tour
- All server functions use `createServerFn` from `@tanstack/react-start`

### Routing (TanStack Router)

- File-based routing: `src/routes/`
- `__root.tsx` wraps everything in providers: `QueryClientProvider`, `LocaleProvider`, `RouterProvider`
- `routeTree.gen.ts` is auto-generated — never edit manually
- Only two routes: `/` (main app) and `/changelog`

### i18n Architecture

- `LocaleProvider` in `src/lib/i18n/index.tsx` wraps the app
- `useLocale()` hook returns `{ t, locale, setLocale }`
- `t(key)` looks up strings from `en.ts` / `pt.ts` / `es.ts`
- SSR-safe: initializes with `"en"`, syncs to `localStorage` in `useEffect`
- AI prompts remain in English (technical instructions to the model)

### Firebase AI Logic Integration

- `firebaseAi.ts` initializes Firebase app, App Check, and AI instance once (cached on `window.__pocketMindFirebaseRuntime`)
- `createTenderModel(preference, modelName)` returns a `GenerativeModel` with the correct `InferenceMode`
- `generateWithModelFallback()` handles retry with exponential backoff and model chain fallback
- `tenderAnalysis.ts` orchestrates chunking, prompting, and merging results across chunks

## Architectural Patterns

- **No global state library** — React `useState` + prop drilling in `PocketMindApp.tsx`
- **Server/client split** — API keys stay server-side via TanStack Start server functions
- **Zod validation** — all AI responses validated with Zod schemas before use
- **Evidence verification** — every AI citation checked against extracted page text via `evidence.ts`
- **Chunked processing** — large PDFs split into 8,000-character chunks, each analyzed independently then merged
- **Consent-gated cloud** — cloud inference path requires explicit boolean consent stored in component state
- **SSR-aware** — `LocaleProvider` and Firebase init guard against server-side execution
