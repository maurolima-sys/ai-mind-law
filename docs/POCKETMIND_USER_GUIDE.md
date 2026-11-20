# PocketMind AI — User Guide

> **Understand complex documents. Extract what matters. Stay in control.**

### A practical guide for procurement teams reviewing tender PDFs

---

### About this guide

This guide walks a first-time user through PocketMind AI — from opening the app to exporting a reviewed compliance matrix. It is written for procurement professionals, consultants, and tender-review teams who may never have used the platform before. Every screen name, button label, and status shown here is the exact text you will see in the application.

> **Read this first — demo vs. live analysis.**
> PocketMind AI ships with a fictional sample tender — _NB-2026-114 Smart LED Street Lighting Tender (sample).pdf_ — and prepared findings you can explore with no setup. All sample content is clearly labeled **“DEMO DATA — Illustrative analysis, not extracted from a real procurement document.”**
> Live AI analysis of your own PDFs requires a Firebase project with App Check configured. Until that is set up and a real model response is received, the status badge reads **“Firebase configured · not yet verified.”** Treat the walkthrough in this guide as an illustration of the workflow; the same steps apply once Firebase is verified.

### What you need

- A desktop web browser. On-device inference specifically requires a supported desktop **Chrome** version; cloud and hybrid modes work in any modern browser once Firebase is configured.
- A tender PDF with selectable text, up to **20 MB**. Scanned PDFs can use optional external OCR (Chapter 3).
- For live analysis: a Firebase project with Firebase AI Logic and App Check enabled (see `README.md` → “Firebase setup for live analysis”).

### Visual identity — for anyone reformatting this guide

Brand colors are navy/blue on white; typography uses **Manrope** for body and **Sora** for display headings. Keep screenshots real, the tone enterprise SaaS — professional but plain-spoken. Real captures belong at each `Figure` callout below; the reference visuals shipped in `public/` are illustrative placeholders to replace.

---

## 1. Welcome to PocketMind AI

PocketMind AI helps procurement teams turn complex tender PDFs into structured findings — requirements, deadlines, specifications, risks, and missing information — that a person can review against the source document.

**The problem it solves.** A tender can run to dozens of pages. The obligations that matter — eligibility, qualifications, technical specs, deadlines, risks — are buried in prose. Reviewers read, re-read, cross-reference, and still miss things. PocketMind AI reads the extracted text, organizes what it finds into a reviewable workspace, and keeps a link from every finding back to the page it came from.

**Who it's for.** Procurement teams, consultants, and anyone who reviews public or private tenders and needs to verify requirements, deadlines, risks, and supporting evidence.

**How it works, in one line.** PDF text is extracted in your browser; you choose whether an AI model may process that text (on-device, in the cloud, or hybrid), and every result is shown beside its source page for your review.

**The four screens.** Everything happens across four areas, available from the left sidebar:

- **Dashboard** — your workspace at a glance.
- **Document analysis** — findings beside their source pages.
- **Compliance matrix** — requirements tracked against evidence and your review status.
- **Processing & privacy** — how your document is processed, and your consent controls.

---

## 2. Understanding the Dashboard

Open the app and you land on the **Dashboard** — _“Your document intelligence workspace: Turn complex tenders into reviewable findings, with source evidence attached.”_

> **Figure 2.1** — _Dashboard overview._ Place a capture of the four metric cards, the **Recent tender documents** table, the **Upload a tender** tile, and the **Review queue**. Reference visual: `public/pocketmind-dashboard.jpg`.

**The four metric cards** (top row, labeled “Workspace summary”):

1. **Documents in workspace** — count of files in this browser session. Detail: _“Files in this browser session.”_
2. **Sample requirements** (when the sample is selected) or **Requirements extracted** — the requirement count, with a detail line: _“Illustrative prepared findings”_ (demo), _“AI findings from fictional text”_ (demo + AI), or _“{n} with source-verified excerpts”_ (real upload).
3. **Critical risks** — findings with severity _Critical_. Detail: _“Flagged for human review.”_
4. **Pending reviews** — requirements still awaiting your decision. Detail: _“Requirements awaiting a decision.”_

**Recent tender documents** (left panel). A table of files in the session with columns _Document, Pages, Processing, Status_, and an open action. The **Processing** badge shows how each document was processed — _On-device / Cloud / Cloud fallback / Hybrid / Demo mode_. The **Status** badge shows _Prepared sample_ (demo), _AI-analysed sample_ (demo + AI), _Analyzed_ (real upload analyzed), or _Not analyzed_. Click any row to open it. The footer shows _“Showing {n} of {m} documents”_ with an _“Open current analysis”_ link. With no search match: _“No matching documents — Try a different search term.”_

**Upload a tender** (right tile). A clear entry point: _“Extract text locally, with optional external OCR for scanned PDFs.”_ The **Choose processing mode** button takes you straight to Processing & privacy. Small print: _“PDF only · maximum 20 MB · optional external OCR for scanned PDFs.”_

**Review queue** (right panel). _“Findings that need human attention.”_ Pending requirements are listed as buttons that jump to analysis. Each shows either _“Source verified · page {n}”_ or _“Evidence needs verification.”_ When nothing is pending: _“All requirements are reviewed.”_ With no analysis yet: _“Analyze a document to create a review queue.”_

> The top bar carries a global search — _“Search documents, requirements, risks…”_ — that filters the current screen, and a **Firebase status badge** on the right: one of _Firebase setup required / Firebase AI Logic: Connected / Firebase configured · not yet verified_. The primary **Add a document** button on each screen's heading routes you to Processing & privacy.

---

## 3. Uploading a Tender

You add a document from the **Processing & privacy** screen — every “Add a document” button routes you there.

**The drop zone** reads _“Drop a tender PDF here, or select a file from your device”_ with a **Choose PDF** button. The constraint line: _“PDF only · maximum 20 MB · scanned PDFs may use optional external OCR.”_ After choosing a file you see its name, size, and _“stored in this browser session,”_ plus a **Replace** button.

**What happens on upload:**

1. **Validation.** PDF-only, 20 MB max. Picking another type: _“Only PDF files are supported.”_ Too large: _“File exceeds the 20 MB limit.”_
2. **In-browser text extraction.** PocketMind AI uses PDF.js to read selectable text _in your browser_ — the file is not uploaded anywhere for this step. Progress reads _“Reading PDF text in this browser”_ and _“Extracting text from page {n} of {total}.”_
3. **Scanned-PDF detection.** If the PDF has almost no selectable text (under ~100 characters, or very sparse across pages), the app shows _“This looks like a scanned PDF.”_ and offers optional **LlamaParse** external OCR — a _separate_, per-document consent (see Chapter 4). You can also choose _“Analyze the text available in this browser”_ to proceed with whatever text was found.

**Processing intelligence monitor.** When extraction or analysis starts, the monitor shows observed activity, including page extraction, model preparation, requests, reported inference sources, structured-response validation, and source checks. The progress bar appears only when the current operation reports measurable page, model-download, or validated-section progress; it is not an overall completion percentage. Otherwise the monitor reports that the duration is unknown. In hybrid mode, a retry or potential fallback is shown without claiming a cloud response until Firebase reports one. If OCR requires a decision, processing waits for your choice and separate consent. Errors appear near the monitor. When an AI analysis completes, its actual finding counts and a **View analysis results** button are shown before opening results. The radar animation can be paused without stopping processing.

> **Tip.** If you only want the extracted text without running the AI, the footer offers **Extract text only** (or **Ask about this PDF** once text exists). This lets you read and ask questions before committing to a full analysis.

> Error and empty states you may see: _“Choose a PDF before extracting text.”_ · _“The selected PDF is no longer available. Choose it again to continue.”_ · _“Text extraction could not be completed.”_ · _“This PDF has no selectable text to analyze. Use external OCR if enabled.”_

---

## 4. Choosing the Processing Mode

This is the most important decision in the workflow. On **Processing & privacy** you choose one of four modes. Each is a card; select one before running analysis. Your choice is held for the session and _resets when the page is reloaded._

> **Figure 4.1** — _Processing & privacy screen._ Place a capture of the four mode cards and the consent area. Reference visual: `public/pocketmind-hybrid-processing.jpg`.

**1. On-device only** — badge _PRIVATE_

> “PDF text is extracted in your browser. Firebase AI Logic asks Chrome's on-device model to analyze it. If that model is unavailable, the request fails instead of moving to cloud.”

- No cloud fallback
- Requires supported desktop Chrome
- Firebase App Check still applies
- The latest reported sample timed out during local generation. The app now uses shorter prompts and 3,000-character sections, with up to 120 seconds per on-device section. This has not yet been retested in Chrome.

**2. Cloud AI** — badge _GEMINI_

> “Send extracted PDF text to Google's cloud through Firebase AI Logic. This mode uses cloud inference only and does not fall back to on-device processing.”

- Direct cloud inference
- Requires your explicit consent
- Firebase App Check required

**3. Hybrid inference** — badge _ON-DEVICE FIRST_

> Firebase AI Logic tries the available on-device model first. If unavailable, the SDK may send extracted text to Gemini in Google's cloud. The cloud model order is Gemini 3.5 Flash, Gemini 3.8 Flash, then Gemini 3.5 Flash-Lite after transient errors; the primary model is retried once before switching.

- Actual source shown after analysis
- Cloud use requires your consent
- App Check required

Cloud attempts are limited to 60 seconds each, with a 180-second total budget per text section. On-device-only mode never uses this cloud retry chain.

**4. Sample data** — badge _DEMO_

> “View the fictional Northbridge street-lighting tender and its prepared analysis. No upload or model call occurs in this mode.”

- No Firebase setup needed
- No real document processed
- Sample clearly labeled

**Consent.** For **Cloud AI** and **Hybrid inference**, a checkbox appears:

- Cloud: _“I explicitly allow cloud AI processing for this session.”_ — _“Extracted text from this PDF will be sent to Gemini through Firebase AI Logic. This setting resets when the page is reloaded.”_
- Hybrid: _“I explicitly allow cloud fallback for this session.”_ — _“If the on-device model is unavailable, extracted text from this PDF may be sent to Google's Gemini service through Firebase AI Logic. This setting resets when the page is reloaded.”_

Without consent, the run button stays disabled and you'll see _“Enable cloud consent above to continue.”_ Forcing it returns _“Explicitly allow cloud processing, or choose on-device only.”_

**Per-document OCR consent (separate).** When a scanned PDF is detected and external OCR is enabled, you see a _distinct_ checkbox: _“I consent to sending this PDF to LlamaParse for external OCR.”_ — _“This consent is separate from Firebase cloud consent. The PDF is sent to LlamaParse even when on-device inference is selected.”_ Then **Extract with LlamaParse**. Missing that consent: _“Explicitly allow external text extraction for this PDF before continuing.”_ If OCR is not configured you'll see _“External OCR is not enabled”_ with a prompt to link the LlamaParse connector in Lovable.

The processing status distinguishes the mode for the next analysis from the selected document's text origin and the source of its displayed analysis. A failed AI attempt does not replace an earlier result: the status identifies that result as belonging to an earlier run. Attempt status is session-only. Fictional sample content can be used either with a prepared demo analysis or with a real AI analysis; the content and analysis sources are reported separately.

**The action button** at the bottom depends on your selection:

- _Sample data_ mode → **Explore sample analysis** (opens the prepared demo).
- A real mode on the sample document → **Analyze fictional sample** (runs Firebase AI over the fictional text — still labeled demo).
- A real mode on your upload → **Analyze PDF**.
- While running → **Processing…**

A process strip at the bottom reminds you of the journey: _Choose PDF → Process text → Verify findings → Human review_ (“Decisions stay yours”).

---

## 5. Understanding Document Analysis

After analysis, **Document analysis** opens — _“Review extracted findings beside their source pages.”_

> **Figure 5.1** — _Document analysis._ Place a capture of the document toolbar, filter chips, the two-column source/findings layout, and the evidence link. Reference visual: `public/pocketmind-analysis.jpg`.

**The document toolbar** shows the file name, a subtitle (_“Fictional sample · {n} pages · {size}”_ or _“PDF document · …”_), a processing-source badge (_On-device / Cloud / Cloud fallback / Hybrid / Demo mode_), and — on the right — the **Export JSON** button. If text came from LlamaParse you'll see an amber _“Text: external OCR (LlamaParse)”_ badge.

**Demo & warning banners.** With the sample selected you'll see an inline notice: _“This prepared analysis is simulated and illustrative; it was not generated from the sample text.”_ (demo mode) or _“This AI analysis uses fictional sample text, not a real procurement document.”_ (AI on the sample). If LlamaParse didn't return page numbers: _“LlamaParse did not provide page numbers. Citations cannot be page-verified; findings are flagged for human review.”_

**Analysis run** block reports what produced the findings: _Firebase AI Logic_ (_“Not used”_ for demo, or _“Connected · response received”_), the _Model_, the _Evidence mode_ (_“Page-linked excerpts · checked against extracted text”_), and whether _Demo data_ is Yes/No.

**Document summary.** A one-paragraph summary of the tender, with the engine and date.

**Filter chips.** Filter findings by type with counts: _All findings · Requirements · Deadlines · Specifications · Risks · Missing & inconsistencies_.

**The two-column body:**

- **Source document** (left). The extracted page text with prev/next page controls and _“Page {n} of {total}”_. If pagination is unavailable: _“Page numbers unavailable.”_ Empty pages show _“No text is available for this page.”_ A reminder sits below: _“Extracted text may need manual verification against the original PDF.”_
- **Findings** (right). Each finding card has a kind badge (_Requirement / Deadline / Specification / Risk / Missing information_), an optional confidence (_“{n}% confidence”_), and for risks a severity badge (_Critical / High / Medium / Low_). Below the title and description is the **evidence**: a blockquote of the cited excerpt, a **Page {n}** link (click to jump the source panel to that page) or _“No source page”_, and an evidence status badge:
  - green **Source verified** — the excerpt was found on that page in the extracted text.
  - amber **Verify source** — the excerpt could not be confirmed against the page text.

The findings header carries a badge — _“Illustrative”_ (demo) or _“AI-generated · review required”_ — and a standing note: _“AI findings are suggestions. Verify every cited passage before relying on it.”_

> **The key habit:** when you read a finding, click its **Page {n}** link and read the source text yourself. That is the whole point of the product — never rely on a finding you haven't seen in the document.

---

## 6. Working with the Compliance Matrix

The **Compliance matrix** — _“Track each requirement against evidence and your team's review status.”_ — is where requirements become an actionable checklist.

> **Figure 6.1** — _Compliance matrix._ Place a capture of the toolbar, the six-column matrix table, and the **Source evidence** side panel with review notes. Reference visual: `public/pocketmind-compliance.jpg`.

**Toolbar:**

- **Search.** Use the top-bar search (the matrix shows _“Search from the workspace bar…”_ as a hint). It matches requirement text, category, and evidence excerpts.
- **Category filter.** _All categories_ or one of seven: _Technical, Administrative, Legal, Financial, Eligibility, Documentation, Delivery_.
- **Review status filter.** _All statuses · Pending · Reviewed · Satisfied · Unclear_.
- **Export CSV** button.

**Summary line** above the table: _“{n} requirements · {n} with verified evidence · {n} shown.”_

**The table** has six columns:

| Column        | What it shows                                                  |
| ------------- | -------------------------------------------------------------- |
| Requirement   | The requirement text (click to inspect its evidence)           |
| Category      | A badge — one of the seven categories                          |
| Mandatory     | _Yes_ (red) or _No_                                            |
| Evidence      | _Verified_ / _Check excerpt_ / _Not provided_                  |
| Page          | The source page number, or —                                   |
| Review status | An inline selector: _Pending / Reviewed / Satisfied / Unclear_ |

**Source evidence** (right panel). Select a requirement to see its description, category and page badges, the excerpt as a blockquote (or _“No source excerpt was returned. Verify this requirement manually.”_), the evidence status, and a **Review notes** box (_“Add a note for your review…”_).

**Updating a review.** Change the **Review status** dropdown on any row, and type into **Review notes**. Both are held _“in this browser session only”_ — they are not yet persisted to the cloud, so export before you close the tab.

**Exporting:**

- **Export CSV** (Compliance matrix) downloads `pocketmind-compliance.csv` with columns: _Requirement, Category, Mandatory, Evidence, Page, Evidence verified, Review status, Notes_.
- **Export JSON** (Document analysis toolbar) downloads `{document-name}-analysis.json` containing the full `{ document, analysis }` object.

> Open a finding's source page, confirm the excerpt, then set the review status. _Pending → Satisfied_ once you've confirmed the obligation is met in your submission; _Unclear_ when the document leaves it ambiguous; _Reviewed_ when you've checked it but it needs a follow-up decision.

---

## 7. Asking Questions About a Document

Below the analysis — and available before a full run — the **“Ask this document”** panel lets you ask follow-up questions and _“review every answer against its sources.”_

**How to use it:**

1. Type in _“Ask a question about this document…”_ (up to 1500 characters).
2. Optionally click **Use microphone** to dictate — _“Your browser may use its own speech service. Nothing is sent to AI until you submit.”_ Toggle to **Stop listening**.
3. Click **Send question**.

**How answers are structured.** PocketMind separates three things so you don't mistake a guess for a fact:

- The main answer — **what the PDF says**.
- **Working hypotheses** — conditional inferences, clearly labeled.
- **Still to verify** — open questions the document doesn't resolve.

**Citations.** Under **Document evidence**, each cited excerpt shows a **Page {n}** link (or _“Page reference unavailable”_), the quoted text, and a status: _“Verified in extracted text”_ (green) or _“Verify against the PDF”_ (amber). Click a page link to jump to it.

**Read aloud.** On any assistant answer, the speaker icon (_“Read answer aloud”_) uses browser speech synthesis.

**External research (optional, off by default).** Tick **Include external research (Firecrawl)** to search outside sources. It needs _separate_ consent and fields: a **Research jurisdiction** (e.g. _“Brazil — State of Amazonas; Law 1,762/1986”_) and a **Country code** (e.g. _BR_). Only your question, country code, and jurisdiction are sent — _“The PDF is never sent to Firecrawl.”_ Results appear under **Search results · verify authority and current status**, marked _Cited in answer_ / _Not cited in answer_, with dates or _“Publication date not provided.”_ External results need human verification and are research support, not authority.

> If you haven't picked a mode, you'll see _“Choose on-device, cloud, or hybrid processing before asking.”_ Cloud/hybrid questions reuse your existing cloud consent; if it's missing, use **Review cloud consent**. When page mapping is unverified you'll see _“This document has no verified page mapping. Answers may quote extracted text, but page citations are withheld.”_

---

## 8. Exporting Results

Two exports cover both audiences — the reviewer and downstream tools.

- **Compliance matrix → CSV.** From the Compliance matrix, **Export CSV** produces `pocketmind-compliance.csv`: one row per requirement with category, mandatory flag, evidence excerpt, page, evidence-verified flag, review status, and your notes. Import it into Excel, Google Sheets, or your procurement system.
- **Document analysis → JSON.** From the Document analysis toolbar, **Export JSON** produces `{document-name}-analysis.json` with the full document and analysis object (summary, all findings, evidence, risks, missing items, inconsistencies). Use it for archival, integration, or re-import.

> Export before you leave. Reviews and notes live in the browser session; closing the tab clears them.

---

## 9. Privacy and Human Review

PocketMind AI is built on a simple promise, shown in the sidebar: **“Privacy by choice. Cloud use is always explicit.”**

**Where your data goes:**

- PDF text is always extracted **in your browser**. The file never leaves your device for that step.
- On-device inference keeps the text on your device (requires supported Chrome).
- Cloud and hybrid-fallback send **extracted text** (not the PDF file) to Google's Gemini through Firebase AI Logic — and only after you tick explicit consent for the session.
- LlamaParse external OCR sends the **PDF file** to LlamaParse, only after a separate per-document consent — independent of cloud consent.
- Document questions send extracted text under the same rules. Firecrawl external research sends only your question, country code, and jurisdiction — never the PDF.
- Consent and mode choice **reset when the page is reloaded**; nothing is remembered silently.

**Why human review is non-negotiable.** Throughout the app you'll see reminders that state the limit plainly:

- Findings header: _“AI-generated · review required.”_
- Findings footer: _“AI findings are suggestions. Verify every cited passage before relying on it.”_
- Source panel: _“Extracted text may need manual verification against the original PDF.”_
- Process strip: _“Human review — Decisions stay yours.”_
- Critical risks: _“Flagged for human review.”_

AI output is a reviewable suggestion, not a decision. The product's value is that every finding links to a source page you can check yourself. PocketMind AI does not provide legal advice; treat its output as a first pass that a qualified person confirms against the original document and the issuing authority.

---

## 10. Your First Analysis — Walkthrough (Sample Tender)

This walkthrough uses the built-in fictional tender so you can learn the full flow with no setup. Everything here is illustrative — the same steps apply to a real PDF once Firebase is verified.

**The sample:** _NB-2026-114 Smart LED Street Lighting Tender (sample).pdf_ — a fictional City of Northbridge tender for 1,250 smart LED luminaires. It contains eligibility, technical specs, delivery milestones, submission deadlines, contract conditions, and deliberately planted risks (a missing Annex D, an unconfirmed contract value, a tight early milestone).

1. **Open PocketMind AI.** You land on the Dashboard with the sample already in your workspace. Notice the _“Illustrative sample”_ banner and the _Demo mode_ badges — your signal that what you see is prepared demo data.
2. **Open Processing & privacy.** From the sidebar (or the _Choose processing mode_ tile). You'll see the four mode cards and, at the bottom, _“Current workspace document: NB-2026-114 Smart LED Street Lighting Tender (sample).pdf.”_
3. **Pick a mode.** For this walkthrough leave it on **Sample data** — no Firebase needed. The footer shows _Selected mode: Sample data_ and _“No real document is processed.”_
4. **Run it.** Click **Explore sample analysis**. (When Firebase is configured you'd choose **Cloud AI**, consent, and click **Analyze fictional sample** to run a live model over the same text — still labeled demo.)
5. **Read the analysis.** You're now on Document analysis. Read the **Document summary**, then use the filter chips to jump between _Requirements, Deadlines, Specifications, Risks_, and _Missing & inconsistencies_.
6. **Verify an evidence link.** Open a requirement — for example the IP66 ingress rating — and click its **Page {n}** link. The left **Source document** panel jumps to that page; confirm the excerpt matches. The badge reads **Source verified**.
7. **Inspect a risk.** Under _Risks_, find _“Tight early installation milestone”_ (severity _Critical_). Click its page link — _400 luminaires within 90 days of award_ — and read it in context. This is exactly the kind of obligation a human must assess against supplier lead times.
8. **Open the Compliance matrix.** From the sidebar. Filter by **Eligibility** to see the licence, experience, and turnover requirements. Click a requirement; in the **Source evidence** panel read the excerpt and confirm the page. Set its **Review status** to _Reviewed_, and add a **Review note**.
9. **Export.** Click **Export CSV** on the Compliance matrix (downloads `pocketmind-compliance.csv`), and **Export JSON** on the Document analysis toolbar (downloads the full analysis).

You've now completed a full review pass: open → choose mode → run → read findings → verify evidence → track compliance → export. The identical flow applies to your own tender once Firebase and App Check are configured.

---

## 11. Quick Reference

**Status badges you'll see**

| Badge                                                   | Meaning                                            |
| ------------------------------------------------------- | -------------------------------------------------- |
| Firebase AI Logic: Connected                            | A real model response has been received            |
| Firebase configured · not yet verified                  | Config exists; no live response yet                |
| Firebase setup required                                 | No Firebase config present                         |
| On-device / Cloud / Cloud fallback / Hybrid / Demo mode | How a document was processed                       |
| Source verified                                         | Excerpt confirmed against the extracted page text  |
| Verify source                                           | Excerpt could not be confirmed — check it yourself |
| Illustrative / Prepared sample / AI-analysed sample     | Demo content labeling                              |
| AI-generated · review required                          | Findings need human review                         |

**Review statuses:** Pending → Reviewed → Satisfied, or Unclear.

**Categories:** Technical · Administrative · Legal · Financial · Eligibility · Documentation · Delivery.

**Limits & rules at a glance**

- PDF only, max 20 MB.
- Text extracted in-browser with PDF.js.
- Cloud/hybrid need explicit per-session consent; resets on reload.
- LlamaParse OCR is a separate per-document consent.
- Reviews and notes are session-only — export before closing.
- On-device mode needs supported desktop Chrome.

---

## 12. Troubleshooting

- _“Only PDF files are supported.”_ / _“File exceeds the 20 MB limit.”_ — use a PDF under 20 MB.
- _“This looks like a scanned PDF.”_ — the PDF has little selectable text. Enable external OCR (separate consent) or choose _“Analyze the text available in this browser.”_
- _“Enable cloud consent above to continue.”_ — tick the cloud/fallback consent checkbox, or switch to **On-device only**.
- _“Firebase setup is needed for live analysis.”_ — follow `README.md` → “Firebase setup for live analysis” (register a Firebase web app, enable AI Logic, enforce App Check). On-device inference needs supported desktop Chrome.
- _“LlamaParse did not provide page numbers.”_ — citations can't be page-verified; findings are flagged for human review.
- Reviews vanished after reload — expected; review status is session-only. Export CSV/JSON before closing the tab.

---

_PocketMind AI helps procurement teams turn complex tender PDFs into structured findings that people can review against the source document. AI findings are suggestions — verify every cited passage before relying on it._
