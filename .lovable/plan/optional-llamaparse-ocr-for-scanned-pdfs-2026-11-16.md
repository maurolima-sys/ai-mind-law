# Optional LlamaParse OCR for scanned PDFs

Add an opt-in way to read scanned PDFs with LlamaParse. The current flow stays the default: browser PDF reading, then Firebase AI Logic, then evidence checks and human review.

## What changes for the user

- Selectable-text PDFs work the same as before. LlamaParse is never called for them.
- If a PDF has little or no text, the app shows a panel instead of the current dead-end error: "This looks like a scanned PDF. You can send it for external text extraction (LlamaParse)."
- A **separate consent checkbox** explains that the file will be uploaded to an external service. This applies even when on-device inference is selected. It is separate from the existing Firebase cloud consent.
- After extraction, the text goes through the same Firebase analysis and evidence verification.
- A badge on the document shows "Text: external OCR (LlamaParse)" next to the real inference source (on-device / cloud / hybrid).
- If page numbers can't be confirmed (no per-page output), a warning banner says citations can't be verified, and findings stay flagged for review.
- Errors (connector missing, upload failed, timeout, empty result) are shown clearly. Nothing falls back silently.
- Demo never calls LlamaParse or Firebase. DEMO_LABEL stays limited to demo mode.

## Connector

- Link the LlamaParse Platform connector, using the "Managed by Lovable" connection (parse/extract only). If it isn't linked, the OCR option shows "External OCR is not enabled" and I report that it is still needed.
- The key stays on the server only: no VITE_ variables, no logging.

## Technical details

- New `src/lib/services/ocr.functions.ts`: `createServerFn` POST takes the PDF as base64 (20 MB cap, PDF checks) plus a `consent: true` literal (Zod). It reads `LOVABLE_API_KEY` and `LLAMACLOUD_API_KEY` from process.env inside the handler, uploads to `/api/v2/parse/upload` through the connector gateway, polls `/api/v2/parse/{id}` every 3 s (bounded at ~120 s, stops on 4xx, backs off on 429/5xx), then fetches `?expand=items` (falling back to markdown). It returns `{ pages: string[], paginated: boolean }` and deletes the job afterwards. The provider status and body are surfaced on errors.
- Page normalization: use per-page items when present (index = page number). Otherwise return a single page with `paginated: false`. Pages are never made up.
- New `src/lib/services/externalOcr.ts` (client helper): converts the file to base64, calls the server function, and maps errors to readable messages.
- `PocketMindApp.tsx`: replace the "No selectable text" throw with a scanned-PDF state, an OCR consent checkbox, an "Extract with LlamaParse" button, a text-source badge, and an unverified-pagination warning. Then call the existing `analyzeTender(pages, …)`.
- Text source and pagination flags are kept in component state. `types.ts`, `sampleTender.ts`, `firebaseAi.ts`, `start.ts`, `vercel.json` and the existing tests stay unchanged.
- Add a new test file for page normalization and the consent requirement. Run existing tests and lint.
- Record a rule in AGENTS.md: external OCR runs only through the server function plus the connector, behind its own consent.

## Runtime validation left for you

- Upload a small scanned PDF (1–2 pages) with consent on. Check the extracted text, the page badges, and that Firebase analysis runs.
