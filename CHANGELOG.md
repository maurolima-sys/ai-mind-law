# Changelog

All notable changes to PocketMind AI are documented here.  
Format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — i18n EN / PT / ES

Working tree — not yet committed.

### Added
- `src/lib/i18n/` — translation system with `en.ts` (200+ keys, source of truth), `pt.ts`, `es.ts`, and `index.tsx` (`LocaleProvider`, `useLocale()`, `useT()`, `interpolate()`).
- `src/components/pocketmind/LanguageSelector.tsx` — flag + `<select>` dropdown in the topbar; locale persisted to `localStorage` under key `pocketmind.locale`.
- `.pm-lang-selector` CSS appended to `src/styles.css`.

### Changed
- `src/routes/__root.tsx` — `<Outlet />` wrapped with `<LocaleProvider>`.
- `src/components/pocketmind/PocketMindApp.tsx` — all ~180 hardcoded strings replaced with `t()` calls across `PocketMindApp`, `OverviewScreen`, `AnalysisScreen`, `EmptyAnalysis`, `ComplianceScreen`, `ProcessingScreen`, and `EvidenceStatus`.
- `src/components/pocketmind/DocumentQaPanel.tsx` — all UI strings localised; browser API error messages kept in English.
- `src/components/pocketmind/GuidedTour.tsx` — tour steps refactored to `titleKey`/`bodyKey` string keys; all badge and button labels localised.
- `src/lib/services/csv.ts` — accepts `t: TFn` third argument; column headers and cell values (`Mandatory`/`Optional`, `Yes`/`No`, `Evidence not available`) now localised.
- `.amazonq/rules/memory-bank/localization.md` — confirmed policy (EN default, AI response follows question language, v1 = EN + PT + ES), full text audit, implementation rules.
- `README.md` — updated for hackathon submission.

### Not changed by design
- AI prompts in `tenderAnalysis.ts` and `documentQa.ts` remain in English (technical model instructions, not UI copy).
- `documentQa.ts` already instructs the model to reply in the question's language — Layer 3 handled automatically.
- `src/data/sampleTender.ts` fictional content stays in English for v1.

---

## [0.3.0] — 2026-11-16 · commit `7657c0a`

### Added
- `src/components/pocketmind/GuidedTour.tsx` — 9-step interactive onboarding tour (344 lines) covering Dashboard, Document analysis, Compliance matrix, and Processing & privacy screens.
- Tour CSS styles added to `src/styles.css` (236 lines).

---

## [0.2.0] — 2026-11-16 · commit `0b6945d`

### Added
- `src/components/pocketmind/DocumentQaPanel.tsx` — document Q&A panel (588 lines): follow-up questions over extracted PDF text using Firebase AI Logic hybrid inference; answers structured into document facts, working hypotheses, and unresolved questions; citations verified against extracted page text; browser speech input (Web Speech API) and optional text-to-speech.
- `src/lib/services/documentQa.ts` — `buildQuestionPrompt` (compact + full variants); instructs model to reply in the question's language; page-citation verification against extracted text.
- `src/lib/services/legalResearch.ts` + `legalResearch.functions.ts` — optional Firecrawl external legal research path (server-side only); sends only question + jurisdiction, never the PDF; requires separate per-session consent.
- `src/test/document-qa.test.ts` — 94-line test suite for Q&A service.
- `src/test/tender-analysis.test.ts` — additional tender analysis tests.
- `docs/POCKETMIND_POWERPOINT.md`, `docs/POCKETMIND_USER_GUIDE.md`, `docs/POCKETMIND_VIDEO_STORYBOARD.md` — submission documentation.
- `.amazonq/rules/memory-bank/localization.md` — initial localization memory bank.

### Changed
- `src/components/pocketmind/PocketMindApp.tsx` — integrated Q&A panel; UI updates (+227 lines).
- `src/lib/services/firebaseAi.ts` — minor adjustments for Q&A inference path.
- `src/lib/services/tenderAnalysis.ts` — minor updates.
- `src/styles.css` — Q&A panel styles (+371 lines).
- `.env.example` — added `FIRECRAWL_API_KEY` server-side variable.

---

## [0.1.1] — 2026-11-16 · commit `dbfeaa5`

### Added
- `src/lib/services/ocrEvidence.ts` — evidence normalization for LlamaParse OCR output; marks citations as unverified when page mapping is absent.
- `src/test/ocr-review.test.ts` — 80-line OCR review test suite.

### Changed
- `src/components/pocketmind/PocketMindApp.tsx` — LlamaParse OCR consent flow, scanned-PDF detection, per-document OCR consent gate, fallback to browser-extracted text (+403 lines net).
- `src/lib/services/externalOcr.ts` + `ocr.functions.ts` + `ocrNormalize.ts` — OCR pipeline refinements.
- `src/styles.css` — OCR panel styles (+46 lines).

---

## [0.1.0] — 2026-11-15 · commits `ab25e1a` + `1d460c7` + `cef81c9`

Core product — all four screens, Firebase AI Logic hybrid inference, compliance matrix, CSV export.

### Added
- `src/components/pocketmind/PocketMindApp.tsx` — full four-screen application (1 674 lines): Dashboard (OverviewScreen), Document analysis (AnalysisScreen), Compliance matrix (ComplianceScreen), Processing & privacy (ProcessingScreen).
- `src/lib/services/firebaseAi.ts` — Firebase AI Logic integration (112 lines):
  - `getGenerativeModel` with `InferenceMode.PREFER_ON_DEVICE` (hybrid on-device-first).
  - `InferenceMode.ONLY_ON_DEVICE` and `InferenceMode.ONLY_IN_CLOUD` for explicit mode selection.
  - App Check enforced for all calls; debug provider for development.
  - Actual inference source (`on-device`, `cloud`, `cloud-fallback`) surfaced to the user after every analysis.
- `src/lib/services/tenderAnalysis.ts` — `buildPrompt` and analysis pipeline (297 lines): chunked text processing, evidence verification against extracted page text, progress reporting.
- `src/lib/services/csv.ts` — compliance matrix CSV export.
- `src/lib/types.ts` — full domain type system: `Analysis`, `Requirement`, `Evidence`, `ProcessingMode`, `InferenceSource`, `ReviewStatus`, etc.
- `src/routes/index.tsx` — `/` route renders `PocketMindApp`.
- `src/styles.css` — complete design system (2 137 lines): Tailwind CSS v4 variables, all screen layouts, finding cards, compliance table, processing mode cards.
- `src/test/csv.test.ts` + `src/test/tender-analysis.test.ts` — initial test suites.
- `src/data/sampleTender.ts` — fictional Northbridge tender with pre-written illustrative analysis (explicitly labeled `DEMO_LABEL`; not generated from a real document).
- `src/lib/services/evidence.ts` — evidence extraction helpers.
- `.env.example` — Firebase web configuration and App Check site key template.
- `PRODUCT.md` — product brief.

### Changed
- `README.md` — full Firebase setup guide, App Check instructions, development commands.

---

## [0.0.1] — 2026-11-15 · commit `2842fbf`

### Added
- TanStack Start + TanStack Router scaffold (`tanstack_start_ts_current-4293eb87cdb8`).
- Vite 8 + Nitro + Tailwind CSS v4 + shadcn/ui baseline.
- `src/test/setup.ts` — Vitest + `@testing-library/jest-dom` setup.
- `src/routes/__root.tsx`, `src/router.tsx`, `src/server.ts`, `src/start.ts` — framework entry points.

---

[Unreleased]: https://github.com/maurofranklima/ai-mind-law/compare/HEAD...HEAD
[0.3.0]: https://github.com/maurofranklima/ai-mind-law/commit/7657c0a
[0.2.0]: https://github.com/maurofranklima/ai-mind-law/commit/0b6945d
[0.1.1]: https://github.com/maurofranklima/ai-mind-law/commit/dbfeaa5
[0.1.0]: https://github.com/maurofranklima/ai-mind-law/commit/ab25e1a
[0.0.1]: https://github.com/maurofranklima/ai-mind-law/commit/2842fbf
