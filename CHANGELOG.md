# Changelog

All notable changes to PocketMind AI are documented here.  
Format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

The application has identified itself as 0.4.0 in historical observations. The current deployment commit has not been independently rechecked.

### Changed
- `ae14f7b` — updated Vite, Vitest and TypeScript ESLint, and added `js-yaml` and `seroval` overrides. No new dependency audit is claimed here.
- `5cac563` — added an optional execution report to successful analysis exports and changed Cloud limits from 30 seconds per attempt / 100 seconds per section to a maximum of 15 seconds / 55 seconds, with shorter retry delays. Real-browser comparisons of latency and success rate remain pending.
- The execution report is not a complete audit trail: failed or split attempts can be omitted; `timedOut` does not reliably record prior timeouts; failures do not return a report; total duration excludes extraction, model initialization and evidence verification. It does not record consent. Exports contain document-derived findings and may include error messages; review them before sharing.
- `34ccf9c` — consent gate on Processing screen now shows a warning toast and scrolls to the consent checkbox instead of silently disabling the Confirm button. i18n keys added in EN/PT/ES.
- `ProcessingMonitor` converted from an inline section to a `createPortal` modal overlay rendered above all screens. The modal has `role="dialog"`, `aria-modal="true"`, a focus trap (Tab/Shift+Tab), and returns focus to the Confirm button on close. Esc closes only when analysis is completed or failed; it is ignored while running. A minimise button (−) hides the overlay and shows a persistent pill in the bottom-right corner; the analysis continues running. Auto-navigation after completion was removed — the user clicks **View results** explicitly. i18n keys `monitor_minimise`, `monitor_reopen`, and `monitor_close` added in EN/PT/ES.

### Verification — 2026-11-21
- A local desktop Chrome hybrid run on a real 17-page PDF produced a `hybrid` JSON analysis with 45 requirements, 17 deadlines, 18 specifications and 13 risks. Of 93 evidence references, 84 were marked verified and 9 unverified.
- The monitor reported locally validated sections 1 and 4 and Cloud fallback for sections 2, 3 and 5. The raw SDK source values, complete section history, durations, attempt counts and consent state were not independently captured. This run preceded the execution-report instrumentation and does not prove a complete on-device-only run or production deployment.

### Verification — 2026-11-20
- Production build `ed19ed4` completed a fictional-sample Cloud AI analysis: reCAPTCHA Enterprise token exchange HTTP 200, primary `gemini-3.8-flash` HTTP 500, fallback `gemini-3.5-flash` HTTP 200, UI source `Cloud (IN_CLOUD)`. The raw SDK value was not captured.
- An on-device-only attempt initialized the model but failed with “The input is too large”; no Firebase AI generation request was observed. At that date, successful complete on-device-only and hybrid analyses were unverified. LlamaParse OCR with a real scanned PDF remains unverified.

## [0.4.0] — 2026-11-19 · commit `ed19ed4`

### Fixed
- Firebase runtime indicators now distinguish a cloud response received in the session from configuration and on-device inference. Analysis, Q&A and evidence comparisons show the source reported by the SDK; legacy analyses without a recorded source remain unknown.
- `f715a2a` — repaired corrupted UTF-8 literals in the interface and English translations.
- `c65bee6` — separated uploaded and demonstration document metrics and activity; risk filters, counts and CSV identify each origin. The local library continues to show uploaded documents only.

### Changed
- Compliance now separates source verification, human compliance assessment and review state in the matrix and CSV. Existing reviews and notes remain available; old “unclear” statuses are identified explicitly.
- The sidebar build label, `vite.config.ts`, and this changelog use the same version: 0.4.0, commit `ed19ed4`.

### Limitations
- A production Cloud AI analysis of the fictional sample completed on 2026-11-19 (`processingSource: cloud-fallback`, model `gemini-3.5-flash-lite`). A later attempt returned HTTP 401; see the dated 2026-11-20 verification above for the more recent result. Selecting a processing mode does not guarantee cloud availability.
- On-device-only inference still needs a successful live test on supported desktop Chrome. An earlier sample timed out; the 2026-11-20 attempt failed because the input was too large. Neither attempt demonstrated cloud fallback.
- LlamaParse OCR with a real scanned PDF has not been tested end to end.
- This is a local browser workspace, not a multiuser service; AI output requires human review.

### Earlier changes in this release — i18n EN / PT / ES

### Added
- `src/lib/i18n/` — translation system with `en.ts` (200+ keys, source of truth), `pt.ts`, `es.ts`, and `index.tsx` (`LocaleProvider`, `useLocale()`, `useT()`, `interpolate()`).
- `src/components/pocketmind/LanguageSelector.tsx` — flag + `<select>` dropdown in the topbar; locale persisted to `localStorage` under key `pocketmind.locale`.
- `.pm-lang-selector` CSS appended to `src/styles.css`.

- **Changelog page** — `src/routes/changelog.tsx` + `src/components/pocketmind/ChangelogPage.tsx`. Full timeline at `/changelog` with kind pills (Added/Changed/Fixed/Note), status badges (Unreleased/Latest/Stable), commit links, and responsive layout. `routeTree.gen.ts` updated to register the route. Accessible via a **What's new** link in the sidebar of the main app.

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
  - App Check integration for calls; debug provider for development. Enforcement depends on Firebase configuration.
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

[Unreleased]: https://github.com/maurolima-sys/ai-mind-law/compare/ed19ed4...HEAD
[0.4.0]: https://github.com/maurolima-sys/ai-mind-law/commit/ed19ed4b694d3efeb7934ded026ad3b37540e882
[0.3.0]: https://github.com/maurofranklima/ai-mind-law/commit/7657c0a
[0.2.0]: https://github.com/maurofranklima/ai-mind-law/commit/0b6945d
[0.1.1]: https://github.com/maurofranklima/ai-mind-law/commit/dbfeaa5
[0.1.0]: https://github.com/maurofranklima/ai-mind-law/commit/ab25e1a
[0.0.1]: https://github.com/maurofranklima/ai-mind-law/commit/2842fbf
