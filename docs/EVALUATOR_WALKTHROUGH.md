# Evaluator Walkthrough — PocketMind AI
### #BuildHybridAI 2026 · Web (Chrome) · Firebase AI Logic

> This guide is written for hackathon judges. It covers what to look at, in what order, and what to expect at each step. The hosted demo opens without an account or installation; live inference depends on Firebase, App Check, and browser/model availability.

---

## 1. What the judges are scoring

| Criterion | Weight | What to look for in PocketMind AI |
|---|---|---|
| Technological Implementation | 25 % | Firebase AI Logic hybrid inference called at runtime; App Check configured; model fallback chain; on-device vs cloud source reported |
| Design | 25 % | Complete document-review workflow, not a demo prompt box; consent-gated cloud; source-linked findings |
| Potential Impact | 25 % | Concrete professional problem (tender review); compliance matrix; CSV/JSON export |
| Quality of the Idea | 25 % | Processing mode as a product feature; inference source surfaced to the user; privacy-by-choice architecture |

---

## 2. Quick-start

1. Open **https://ai-mind-law.vercel.app/** in **desktop Chrome** (required for on-device inference).
2. The dashboard loads with a fictional sample tender already selected — no upload needed.
3. Open **Settings**, select **Cloud AI**, and click **Save changes**.
4. Open **Processing**, read and accept the cloud consent checkbox.
5. Click **Confirm and continue →** to analyze the selected fictional sample.
6. Watch the progress status. On success, the analysis shows the inference source and the status reports **Cloud response received this session · connection not guaranteed**. A configured badge alone does not prove a successful live analysis.
7. Inspect the findings in **Analysis**, then open **Compliance matrix** to see the review workflow.

> **Production test, 2026-11-20:** the hosted page identified build `v0.4.0 · ed19ed4` (2026-11-19 23:54 UTC), matching remote `main` at the time. For the fictional sample in Cloud AI mode, `exchangeRecaptchaEnterpriseToken` returned HTTP 200; `gemini-3.8-flash` returned HTTP 500 and the `gemini-3.5-flash` fallback returned HTTP 200. The analysis completed and the UI reported `Cloud (IN_CLOUD)`, its normalized SDK source; the raw SDK value was not captured. This single run does not guarantee future availability.

> **Historical report (2026-11-19).** A prior run reported `processingSource: cloud-fallback` and `gemini-3.5-flash-lite` for fictional sample text; a later attempt returned HTTP 401. The 2026-11-20 test above is a separate, more recent observation, not a guarantee of continued availability.

---

## 3. Verifying Firebase AI Logic is called at runtime

The requirement is that Firebase AI Logic is **imported and actually called**, not just named in the README.

| Where to look | What you will find |
|---|---|
| `src/lib/services/firebaseAi.ts` | `getGenerativeModel` called with `InferenceMode.PREFER_ON_DEVICE` / `ONLY_IN_CLOUD` / `ONLY_ON_DEVICE` |
| `src/lib/services/tenderAnalysis.ts` | `generateWithModelFallback` orchestrates chunked analysis; calls `model.generateContent` |
| `src/lib/services/documentQa.ts` | Same hybrid path for follow-up questions |
| Browser DevTools → Network | App Check token exchange and requests to `firebasevertexai.googleapis.com` during cloud analysis |
| UI after analysis | Inference source badge: **on-device**, **cloud**, or **cloud-fallback** |

`initializeAppCheck` runs before model calls, using the debug provider only in local development and `ReCaptchaEnterpriseProvider` in production. The 2026-11-20 production test observed a successful reCAPTCHA Enterprise exchange and completed cloud analysis; Firebase Console settings were not independently inspected.

---

## 4. Exploring hybrid inference modes

Select the default mode in **Settings**, then navigate to **Processing**:

### Cloud AI
- Sends extracted text to Gemini via Firebase AI Logic.
- Requires explicit consent checkbox — cloud processing is never silent.
- Badge after analysis: **cloud** or **cloud-fallback**.
- Model fallback chain: `gemini-3.5-flash` → `gemini-3.8-flash` → `gemini-3.5-flash-lite`, after retryable errors or timeouts, with one bounded attempt per model. Cloud attempts are limited to 30 seconds each and a 100-second total budget per section. Hybrid mode makes one 30-second on-device-first pass before the cloud fallback. The production test above used the earlier model order.

### On-device only
- Uses Chrome's Prompt API; the exact on-device model depends on Chrome and the device.
- Requires a supported desktop Chrome version and an available on-device model. First-time setup reports model-download progress when Firebase provides it.
- The app analyzes shorter text sections locally. If a section times out, it explains that no text was sent to the cloud and offers a separate Cloud AI choice; cloud processing still requires explicit consent.
- Badge: **on-device**.

### Hybrid (on-device first)
- Tries on-device first; falls back to cloud if the model is unavailable or times out.
- Badge: **on-device**, **cloud-fallback**, or **mixed** depending on what Firebase AI Logic reports.
- This is the non-obvious product feature: the inference source is surfaced to the user because it matters for document privacy.

### Sample data (Demo)
- The **Sample data** card does not call Firebase. It loads the pre-written fictional Northbridge analysis.
- The badge in the interface is **Demo data** (`inference_demo_label`). The sample record itself carries `DEMO_LABEL`: “DEMO DATA — Illustrative analysis, not extracted from a real procurement document.”
- **Confirm and continue →** on the Processing screen runs a live analysis of the selected fictional sample in the chosen mode. A live result can still be fictional sample content; the displayed file name is not proof that a real procurement PDF was analysed.
- Dashboard metrics keep uploaded documents and the demonstration sample apart. The library lists uploaded documents only.

---

## 5. Document analysis screen

After running analysis, open **Analysis**:

- **Findings panel** (left): filter by Requirements, Deadlines, Specifications, Risks, Missing & inconsistencies.
- **Source panel** (right): extracted page text. Every finding card shows a **Source verified** or **Verify source** badge — the app checks each AI-cited excerpt against the extracted text.
- **Confidence score**: shown per requirement (0–100 %).
- **Export JSON**: top-right toolbar — downloads the full analysis object.

---

## 6. Compliance matrix screen

Open **Compliance matrix**:

- Lists every extracted requirement with category, mandatory flag, evidence excerpt, and page number.
- Three states are independent. A verified quotation does not mean the requirement is met or approved.
  - **Evidence verification:** Verified, Unverified, or Not found.
  - **Compliance assessment:** Not assessed, Compliant, Partially compliant, or Non-compliant.
  - **Review status:** Pending, Reviewed, or Approved.
- Older rows saved as “unclear” stay visible as **Previous status: unclear**. They are not a current review-status option.
- Add review notes per requirement.
- **Export CSV**: downloads evidence verification, assessment, review status, and notes.
- Those fields are stored locally in this browser (IndexedDB), not in a cloud document store.

---

## 7. Document Q&A

In **Analysis**, the Q&A panel is available after text extraction:

- Ask a follow-up question about the document in any language (EN, PT, ES).
- The answer separates **stated facts**, **working hypotheses**, and **unresolved questions**.
- Each citation is checked against extracted page text and labelled **Verified** or **Verify against the PDF**.
- Uses the same hybrid inference path as the main analysis.
- Optional: enable **Include external research (Firecrawl)** for legal source search (requires server-side `FIRECRAWL_API_KEY` — not configured in the public demo).

---

## 8. Privacy and consent model

This is the core product differentiator:

- PDF text is extracted **locally in the browser** with PDF.js — the file never leaves the device unless the user explicitly consents.
- Cloud inference requires a **visible consent checkbox** on the Processing screen. The checkbox cannot be bypassed.
- The inference source reported by Firebase AI Logic (`on-device`, `cloud`, `cloud-fallback`) is shown in the UI after every analysis — users know where their document was processed.
- `FIRECRAWL_API_KEY` is server-side only — never in a `VITE_*` variable.

---

## 9. Repository structure (for code review)

```
src/lib/services/
  firebaseAi.ts          ← Firebase init, App Check, model creation, retry/fallback
  tenderAnalysis.ts      ← chunking, prompts, analysis orchestration
  tenderAnalysisSchema.ts ← Zod schemas + Firebase responseSchema for cloud
  documentQa.ts          ← Q&A prompt building and response parsing
  evidence.ts            ← excerpt verification against extracted pages
```

Key implementation details:
- `generateWithModelFallback()` — retry with exponential backoff; timeout errors advance the model chain.
- `TENDER_ANALYSIS_RESPONSE_SCHEMA` — Firebase `Schema` object passed as `responseSchema` for cloud calls, constraining the model output before it reaches Zod validation.
- `parseTenderResponse()` — Zod `.safeParse()` with field-path error reporting (e.g. `requirements[0].excerpt`).
- On-device path: no `responseConstraint` (Chrome Prompt API does not support it); Zod coerces numeric `quantity`/`unit` fields to string.

---

## 10. What is not yet verified

The submission is honest about its current state:

| Item | Status |
|---|---|
| Cloud AI analysis with structured-output validation passing end-to-end | Successful fictional-sample analysis on 2026-11-20 in build `ed19ed4`, with `gemini-3.5-flash` and UI source `Cloud (IN_CLOUD)`. Individual citations were not independently reviewed; availability can change. |
| On-device inference (Chrome Prompt API) | On 2026-11-20 an integrated browser initialized the model but the fictional sample failed with “The input is too large”; no cloud generation request was observed. Successful analysis on supported desktop Chrome and hardware remains unverified. On-device-only does not fall back to cloud. |
| LlamaParse OCR with a real scanned PDF | Not yet tested end-to-end |
| App Check in production | On 2026-11-20, `exchangeRecaptchaEnterpriseToken` and the successful fallback `generateContent` both returned HTTP 200. Console enforcement and configuration were not independently inspected. |
| Responsive layout with PT/ES longer strings on small screens | Not yet validated |

The **Cloud response received this session · connection not guaranteed** status confirms that a cloud response arrived in that session. A successful structured-output analysis (findings displayed) confirms validation passed.

---

## 11. Running locally (optional)

```sh
git clone https://github.com/maurolima-sys/ai-mind-law
cd ai-mind-law
cp .env.example .env.local
# Fill in Firebase web config and App Check debug token
npm install
npm run dev
```

Open in desktop Chrome. Register the App Check debug token (printed in the browser console) in Firebase Console → App Check → Debug tokens.

```sh
npm test       # 107 tests (29 files)
npm run lint
npm run build
```

CI runs automatically on every push via `.github/workflows/ci.yml`.

---

## 12. Submission checklist

| Requirement | Status |
|---|---|
| Firebase AI Logic imported and called at runtime | ✅ `firebaseAi.ts` |
| App Check initialized | ✅ `initializeAppCheck` before model calls; production token exchange and fallback generation returned HTTP 200 on 2026-11-20. Console settings were not independently inspected. |
| Web (Chrome) platform | ✅ |
| Public GitHub repository | ✅ https://github.com/maurolima-sys/ai-mind-law |
| Open source license | ✅ Apache 2.0 (`LICENSE`) |
| Hosted demo | ✅ https://ai-mind-law.vercel.app/ |
| Demo video (YouTube, ≤ 3 min, English) | ⏳ To be submitted |
| Built / significantly updated during submission period | ✅ See commit history from `ab25e1a` onward |
| No production secrets in repository | ✅ `.env` is gitignored; no keys committed |

---
