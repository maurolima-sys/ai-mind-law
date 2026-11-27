# PocketMind AI — Project Structure

## Root Layout

```
ai-mind-law/
├── src/                    # Main application source
├── scripts/                # Dev/ops scripts (pre-push gate, Vercel sync, etc.)
├── docs/                   # Analysis samples, guides, reference PDFs, tenders
├── public/                 # Static assets (favicons, mockup images, sample PDF)
├── ai-mind-law/            # next-forge monorepo scaffold (NOT the running app)
├── supabase/               # Supabase project link (roadmap, not implemented)
├── .amazonq/rules/         # Amazon Q rules and memory bank
├── .agents/skills/         # Firebase/Lovable agent skill definitions
├── .github/workflows/      # CI (TypeScript gate, tests, build, ESLint)
└── [config files]          # package.json, tsconfig, vite.config, vercel.json, etc.
```

> **Note:** The `ai-mind-law/` subdirectory is a next-forge monorepo template scaffold used as a reference. The actual running application lives entirely in `src/`.

## Source Tree (`src/`)

```
src/
├── components/
│   ├── pocketmind/         # All application screens and panels
│   └── ui/                 # shadcn/ui primitives (accordion, button, dialog, etc.)
├── data/
│   └── sampleTender.ts     # Bundled fictional tender + prepared analysis
├── hooks/
│   └── use-mobile.tsx      # Responsive breakpoint hook
├── lib/
│   ├── i18n/               # Translations: en.ts, pt.ts, es.ts + index.tsx provider
│   ├── services/           # All business logic and external integrations
│   ├── analysisRunContext.tsx  # React context for active analysis run state
│   ├── types.ts            # All shared TypeScript types and interfaces
│   ├── preferences.ts      # User preferences (localStorage, versioned)
│   ├── layoutPreferences.ts # Sidebar/panel expand state (localStorage)
│   ├── buildInfo.ts        # Version/commit hash constants
│   ├── byokConfig.ts       # BYOK Firebase config (localStorage)
│   ├── utils.ts            # cn() and general utilities
│   └── ...                 # auth, evaluation, error-capture, etc.
├── routes/                 # TanStack Router file-based routes
├── test/                   # Vitest test suite
├── router.tsx              # Router creation
├── routeTree.gen.ts        # Auto-generated route tree (do not edit manually)
├── server.ts               # Nitro server entry
├── start.ts                # TanStack Start entry
└── styles.css              # Global CSS (Tailwind v4 + custom pm-* classes)
```

## Key Components (`src/components/pocketmind/`)

| File | Role |
|------|------|
| `PocketMindApp.tsx` | Root shell: sidebar, topbar, screen routing, workspace state, upload flow |
| `ProcessingMonitor.tsx` | Real-time analysis progress monitor with event log |
| `DocumentQaPanel.tsx` | Chat interface for document Q&A with citations |
| `EvidenceComparisonPanel.tsx` | Bidder evidence attachment and AI comparison |
| `SmartDiscoveryPanel.tsx` | Tender discovery from external sources |
| `LocalWorkspaceLibrary.tsx` | Document library (IndexedDB-backed) |
| `SourceDocumentViewer.tsx` | Side-by-side source text viewer with pagination |
| `IntegrationsScreen.tsx` | Firebase/LlamaParse/ElevenLabs diagnostics |
| `SettingsScreen.tsx` | Language, inference mode, data management |
| `ProjectsScreen.tsx` | Local project organization |
| `RiskScreen.tsx` | Risk register with filters and CSV export |
| `GuidedTour.tsx` | Onboarding tour with optional narration |
| `UploadDocumentModal.tsx` | File upload with format validation |

## Services (`src/lib/services/`)

| File | Role |
|------|------|
| `firebaseAi.ts` | Firebase init, App Check, model creation, fallback chain, quota circuit breaker |
| `tenderAnalysis.ts` | Main analysis orchestration (hybrid/cloud/local paths) |
| `tenderAnalysisSchema.ts` | Zod schema + Firebase response schema for analysis output |
| `documentProcessing.ts` | PDF.js, Mammoth, ExcelJS text extraction |
| `localWorkspace.ts` | IndexedDB CRUD for all workspace entities |
| `inferenceSource.ts` | Inference source classification and display helpers |
| `compliance.ts` | Compliance assessment and review state helpers |
| `documentQa.ts` | Document Q&A prompt building and response parsing |
| `evidenceComparison.ts` | Evidence-to-requirement AI comparison |
| `evidenceComparisonSchema.ts` | Zod schema for evidence comparison output |
| `externalOcr.ts` | LlamaParse OCR availability check and execution |
| `ocrNormalize.ts` | OCR page text merging and normalization |
| `ocrEvidence.ts` | Mark unpaginated OCR evidence as unverified |
| `csv.ts` | Compliance matrix CSV export |
| `workspaceMetrics.ts` | Dashboard metrics aggregation |
| `projects.ts` | Project record creation/update helpers |
| `riskReview.ts` | Risk review state key helpers |
| `legalResearch.ts` | Firecrawl legal research (server-side function) |
| `aiDiagnostics.ts` | Firebase/LlamaParse/ElevenLabs connectivity diagnostics |
| `supabase.ts` | Supabase client (roadmap, minimal) |

## Routes (`src/routes/`)

TanStack Router file-based routing. Auto-generated `routeTree.gen.ts` — never edit manually.

| Route | Screen |
|-------|--------|
| `/` | Dashboard (OverviewScreen) |
| `/documents` | Document library |
| `/analysis` | Analysis screen |
| `/analysis/$docId` | Analysis for specific document |
| `/compliance` | Compliance matrix |
| `/processing` | Processing & privacy |
| `/risks` | Risk register |
| `/projects` | Projects |
| `/settings` | Settings |
| `/integrations` | Integrations & diagnostics |
| `/monitor` | Processing monitor |
| `/evaluation` | Evaluator workspace |
| `/login` | Login (stub) |
| `/changelog` | Changelog |

## i18n (`src/lib/i18n/`)

- `index.tsx`: `LocaleProvider`, `useLocale()`, `useT()` hooks
- `en.ts`, `pt.ts`, `es.ts`: Translation key maps
- Default locale: `"en"` (SSR-safe; synced from localStorage in `useEffect`)
- AI prompts remain in English regardless of UI locale

## Data Flow

```
User uploads PDF/DOCX/XLSX
  → documentProcessing.ts (local extraction, browser only)
  → saveDocumentBundle() → IndexedDB
  → User selects processing mode + gives consent
  → tenderAnalysis.ts (hybrid/cloud/local)
      → firebaseAi.ts (model creation, App Check, fallback chain)
      → Firebase AI Logic (Gemini)
  → Analysis saved to IndexedDB
  → PocketMindApp.tsx renders findings
  → User reviews, adds evidence, exports
```

## Architectural Patterns

- **Single-page shell:** `PocketMindApp.tsx` owns all workspace state; screens are rendered as children
- **Service layer:** All business logic in `src/lib/services/` — no logic in route files
- **Type-first:** All shared types in `src/lib/types.ts`; Zod schemas in `*Schema.ts` files
- **Context for cross-cutting state:** `analysisRunContext.tsx` for active analysis progress
- **localStorage for preferences:** versioned, with migration; never for sensitive data
- **IndexedDB for workspace data:** via `localWorkspace.ts` service; not encrypted
- **Server functions:** `.functions.ts` suffix for Nitro/TanStack Start server-side functions
