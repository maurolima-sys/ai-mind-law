# PocketMind AI — First complete prototype

## What you'll get

A polished, light-themed document intelligence app (navy text, indigo accent, green/amber/red status colors) with a sidebar, header, and these working pages:

- **Dashboard** (`/`) — "Your document intelligence workspace", 4 summary cards (labelled demo data), recent documents, activity, critical findings, upload quick action.
- **My Documents** — list of the demo tender plus any PDFs you upload this session; upload page with drag & drop, file name/size, remove, size limit (20 MB, PDF only).
- **Processing mode selector** before analysis: Local (text extracted in the browser, nothing sent), Cloud AI (consent dialog before anything is sent), Demo (sample data, clearly marked). The chosen mode shows throughout.
- **Document Analysis** — split screen: left shows extracted text by page with page navigation, search and evidence highlighting; right has tabs Overview, Requirements, Deadlines, Specifications, Risks, Chat. "View source" jumps to the referenced page; missing evidence shows "Evidence not available" and is flagged for review.
- **Compliance Matrix** — filterable/searchable table, change status (pending/reviewed/satisfied/unclear), reviewer notes, CSV export.
- **Saved Insights**, **Settings** (default mode, privacy & processing explanation stating exactly what is and isn't implemented).
- **Demo tender** (fictional municipal procurement) with summary, 10 requirements, 4 deadlines, 5 specifications, 4 risks, all bannered "DEMO DATA — Illustrative analysis, not extracted from a real procurement document."

## Honesty rules built in

- Local mode does real PDF text extraction in the browser; it then runs simple rule-based detection (dates, "shall/must", quantities) and labels results "rule-based, needs review" — no claim of local AI.
- Cloud AI mode is real (Lovable AI, no account needed) and only sends text after explicit consent. Citations are only shown when the quoted excerpt actually exists on the cited page; otherwise flagged.
- Chat: demo answers in Demo mode; real AI answers with verified page refs in Cloud mode.
- No login or database. Review status, notes and preferences saved in the browser.
- A clean service layer leaves room to swap in Firebase AI Logic later; the app won't claim it's connected.

## Technical details

- Routes: `index`, `documents`, `upload`, `analysis.$docId`, `compliance`, `insights`, `settings`; shared shell (shadcn Sidebar, collapsible icon mode) in `__root.tsx`; each route with own head().
- `src/lib/services/`: `documentProcessing.ts` (pdfjs-dist, client-only dynamic import, per-page text), `analysisService.ts` (interface `AnalysisProvider` with `demo`, `localRules`, `cloud` implementations; `firebase` stub), `evidence.ts` (verifies excerpt ∈ page text, confidence scoring), `csv.ts`.
- `src/data/sampleTender.ts` for demo content; Zustand-free store using React context + localStorage for reviews/preferences.
- Cloud: `createServerFn` calling Lovable AI Gateway (`openai/gpt-6-astra`, Responses API, strict JSON schema output, streamed); `LOVABLE_API_KEY` provisioned server-side. Handles 402/429 with clear messages.
- Fonts: distinctive pairing (e.g. Sora + Manrope) via `<link>`; oklch tokens in `styles.css`.
- Vitest tests for evidence verification (fabricated excerpt → flagged) and CSV export columns.
