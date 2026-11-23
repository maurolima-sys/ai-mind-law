# Product — PocketMind AI

## Purpose & Value Proposition

PocketMind AI turns complex tender PDFs into a structured, human-reviewable workspace. It extracts text locally in the browser (PDF.js), then — under explicit user consent — sends it to Firebase AI Logic for analysis in cloud-only, on-device-only, or on-device-first hybrid mode.

Core problem solved: tender documents run to dozens of pages of dense prose. Obligations that decide bid eligibility, technical compliance, and commercial soundness are buried in that text. PocketMind AI reads the extracted text, organizes findings, verifies each excerpt against the cited page, and surfaces a compliance matrix the team can review, annotate, and export — without losing the link to the original document.

Hackathon: **#BuildHybridAI 2026** — Web (Chrome) · Firebase AI Logic hybrid inference.

Live deployment: **https://ai-mind-law.vercel.app/**

## Key Features

### Document Processing

- Upload PDFs up to 20 MB; text extracted locally in the browser with PDF.js
- Optional LlamaParse OCR for scanned/sparse PDFs (separate per-document consent required)
- Three AI processing modes: on-device only, cloud only, hybrid (on-device-first with cloud fallback)
- Demo mode with fictional sample tender (no Firebase required)

### Firebase AI Logic Integration

- Hybrid inference via `getGenerativeModel` with `InferenceMode.PREFER_ON_DEVICE`
- Actual inference source (`on-device`, `cloud`, `cloud-fallback`, `mixed`) surfaced to user after every analysis
- App Check enforced for all Firebase AI Logic calls
- Model fallback chain: `gemini-3.8-flash` → `gemini-3.7-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`
- Exponential backoff retry for HTTP 429/500/502/503

### Analysis Findings

- Five finding types: Requirements, Deadlines, Specifications, Risks, Missing/Inconsistencies
- Every finding links to a source page and excerpt, verified against extracted text
- Confidence scoring per requirement
- Severity levels: Critical, High, Medium, Low

### Compliance Matrix

- Per-requirement review tracking (pending / reviewed / satisfied / unclear)
- Review notes (browser session only — no persistent cloud storage)
- Export as CSV

### Document Q&A

- Follow-up questions about extracted PDF text using same hybrid inference path
- Answers separate: stated facts, working hypotheses, unresolved questions
- Exact-text-checked page citations
- Browser speech input (optional) and text-to-speech output
- Optional Firecrawl external legal research (server-side only, separate consent)

### Privacy & Consent

- Text extracted locally; cloud processing requires explicit consent
- Processing mode is a product feature, not an implementation detail
- Sensitive procurement documents may not leave the device
- `FIRECRAWL_API_KEY` server-side only — never in `VITE_*` variables

### Internationalization

- Interface languages: EN, PT, ES
- AI responses follow the question's language automatically
- Document evidence preserved in original language (never translated)

### Export & Sharing

- Export analysis as JSON
- Export compliance matrix as CSV
- No accounts, shared workspaces, or persistent cloud document storage (v1 scope)

## Target Users

- Procurement and tendering teams
- Bid consultants
- Anyone reviewing public or private tenders

## Workflow

1. Upload PDF → text extracted locally in browser
2. Choose processing mode (on-device / cloud / hybrid / demo)
3. Accept cloud consent if applicable
4. Run analysis → Firebase AI Logic processes extracted text
5. Review findings with source evidence linked to original pages
6. Track compliance status per requirement
7. Export CSV or JSON

## What Is NOT Implemented (v1)

- User accounts
- Shared workspaces
- Persistent cloud document storage
- Production App Check (reCAPTCHA Enterprise not yet configured for deployment)
- Real scanned-PDF OCR end-to-end test
