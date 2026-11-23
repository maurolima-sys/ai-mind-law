# PocketMind AI — PowerPoint Deck (Slide Content)

**12 slides · English · for clients, partners, demos, and training**
Drop each block into PowerPoint, Google Slides, or Keynote. Visual identity: navy/blue on white; titles in **Sora**, body in **Manrope**; one idea per slide; screenshots at full bleed where noted.

> **Demo caveat for every live session:** sample findings are illustrative — _“DEMO DATA — Illustrative analysis, not extracted from a real procurement document.”_ Live AI analysis needs a verified Firebase project with App Check. State this on Slide 5 and again on Slide 12.

---

## Slide 1 — Title

**Visual:** Navy background, white wordmark. Subtle tender-PDF texture behind the logo.
**Title:** PocketMind AI
**Subtitle:** Understand complex documents. Extract what matters. Stay in control.
**Footer:** Tender intelligence for procurement teams
**Speaker notes:** One line to open — “We turn complex tender PDFs into reviewable findings, with a link back to the source page for every one of them.”

---

## Slide 2 — The problem

**Visual:** Stacked pages of a dense tender, with key obligations highlighted.
**Title:** Tenders bury their obligations in pages of prose
**Bullets:**

- Eligibility, qualifications, specs, deadlines, risks — scattered across dozens of pages
- Reviewers re-read, cross-reference, and still miss things
- Decisions get made on incomplete reading
  **Speaker notes:** “A single tender can run to dozens of pages. The obligations that decide whether you can bid — and bid well — are buried in prose. Reviewers read, re-read, cross-reference, and still miss things.”

---

## Slide 3 — What PocketMind AI does

**Visual:** Simple flow diagram: PDF → in-browser text → AI mode you choose → findings linked to source pages.
**Title:** From PDF to reviewable findings — with sources attached
**Bullets:**

- Text extracted in your browser
- You choose: on-device, cloud, or hybrid AI
- Every finding links back to its source page
  **Speaker notes:** “PDF text is extracted locally. You decide whether an AI model may process it. Everything it finds stays linked to the page it came from — so you can verify it yourself.”

---

## Slide 4 — Who it's for

**Visual:** Three simple icons — procurement team, consultant, reviewer.
**Title:** Built for people who review tenders
**Bullets:**

- Procurement and tendering teams
- Consultants advising on public and private bids
- Reviewers verifying requirements, deadlines, and risk
  **Speaker notes:** “Anyone who needs to verify requirements, deadlines, risks, and supporting evidence against the source document.”

---

## Slide 5 — The four screens

**Visual:** Four labelled thumbnails: Dashboard, Document analysis, Compliance matrix, Processing & privacy. Reference: `public/pocketmind-dashboard.jpg` etc.
**Title:** One workspace, four areas
**Bullets:**

- **Dashboard** — your workspace at a glance
- **Document analysis** — findings beside their source pages
- **Compliance matrix** — requirements vs. evidence and review status
- **Processing & privacy** — how your document is processed, and your consent
  **Speaker notes:** “Everything happens across these four screens, in the left sidebar.” _(Demo caveat: note that the sample shown is illustrative.)_

---

## Slide 6 — The key decision: processing mode

**Visual:** Four mode cards as they appear in the app. Reference: `public/pocketmind-hybrid-processing.jpg`.
**Title:** You choose how your document is processed
**Bullets:**

- **On-device only** — stays in your browser; no cloud (needs supported Chrome)
- **Cloud AI** — extracted text to Gemini via Firebase AI Logic; your explicit consent
- **Hybrid** — on-device first, cloud fallback; consent required
- **Sample data** — explore the fictional tender; no setup, no model call
  **Speaker notes:** “This is the most important screen. Cloud and hybrid need explicit consent — and it resets every reload. Cloud use is always your choice.”

---

## Slide 7 — Document analysis

**Visual:** Screenshot of findings panel with a Page link and a green “Source verified” badge. Reference: `public/pocketmind-analysis.jpg`.
**Title:** Findings, beside their source pages
**Bullets:**

- Summary, requirements, deadlines, specifications, risks, missing information
- Each finding quotes its excerpt and links to the page it came from
- Green “Source verified” — excerpt confirmed in extracted text; amber “Verify source” — check it yourself
  **Speaker notes:** “Click a finding's Page link and the source jumps to that page. The habit that makes this product work: never rely on a finding you haven't seen in the document.”

---

## Slide 8 — Compliance matrix

**Visual:** Screenshot of the matrix table and Source evidence panel. Reference: `public/pocketmind-compliance.jpg`.
**Title:** Turn requirements into a checklist
**Bullets:**

- Filter by category (Technical, Legal, Financial, Eligibility, …) and review status
- Inspect each requirement's evidence and source page
- Set review status: Pending → Reviewed → Satisfied, or Unclear
- Add review notes; export to CSV
  **Speaker notes:** “This is where requirements become an actionable checklist your team can track.” Note: review status and notes are session-only — export before closing.

---

## Slide 9 — Ask this document

**Visual:** Q&A panel showing an answer with “Working hypotheses”, “Still to verify”, and a page-linked citation.
**Title:** Ask follow-up questions — and see what's a fact
**Bullets:**

- Answers separate **what the PDF says** from **working hypotheses** and **points still to verify**
- Every quote links back to its page
- Optional external research (Firecrawl) — sends only your question and jurisdiction, never the PDF
  **Speaker notes:** “You never mistake a guess for a fact. The model labels its inferences and its open questions, and cites the page for each.”

---

## Slide 10 — Export & integrate

**Visual:** Two file icons — CSV and JSON.
**Title:** Take it to your tools
**Bullets:**

- **Compliance matrix → CSV** — one row per requirement, with review status and notes
- **Document analysis → JSON** — full document and analysis object
- Drops into Excel, Google Sheets, or your procurement system
  **Speaker notes:** “Two exports cover both the reviewer and downstream systems.”

---

## Slide 11 — Privacy & human review

**Visual:** The sidebar line “Privacy by choice. Cloud use is always explicit.” and the process strip “Human review — Decisions stay yours.”
**Title:** Privacy by choice. Decisions stay yours.
**Bullets:**

- PDF text extracted in your browser; cloud use is always explicit and resets on reload
- LlamaParse OCR is a separate, per-document consent
- AI findings are suggestions — verify every cited passage before relying on it
  **Speaker notes:** “The product's value is that every finding links to a source page you can check yourself. PocketMind AI does not provide legal advice — it's a first pass that a qualified person confirms.”

---

## Slide 12 — Get started

**Visual:** Call-to-action card. Wordmark.
**Title:** Try it now — no setup
**Bullets:**

- Open the app — the sample tender is preloaded
- Choose **Sample data** → Explore sample analysis
- Walk the full flow: run → verify evidence → track compliance → export
- Live AI on your own PDFs: configure Firebase + App Check (see README)
  **Speaker notes:** _(Demo caveat again.)_ “Everything you saw today is illustrative sample data. The same workflow applies to your own tenders once Firebase is verified. Try it now with the sample — no setup required.”

---

## Build notes

- 12 slides fits the 10–14 target.
- For a 14-slide variant, split Slide 7 into “7a Findings & filters” and “7b Evidence verification”, and add a “Walkthrough recap” slide before Slide 12 (condensed Scenes 4–8 of the video storyboard).
- Speaker-note timings: ~25–35s per slide lands the deck at ~6 minutes — pace to the audience.
