# PocketMind AI — Video Tutorial Storyboard & Script

**Target length:** ≈ 5 minutes (5:00–5:20)
**Language:** English
**Audience:** Procurement professionals and first-time users
**Tone:** Professional but easy to follow — enterprise SaaS, plain-spoken
**Format:** Screen recording with voiceover narration and burned-in captions

---

## Production notes

- **Visual identity:** navy/blue on white; titles and lower-thirds in **Sora**, body text in **Manrope**. Match the app's own styling so the video feels native.
- **Recording:** record the running app in desktop Chrome. The walkthrough uses **Sample data** mode so no Firebase setup is required on camera. The sample tender *NB-2026-114 Smart LED Street Lighting Tender (sample).pdf* is preloaded.
- **Demo caveat (mandatory):** the narrator must say, and a lower-third must show, that sample results are illustrative and not from a real procurement document. A second, shorter version can be recorded later once Firebase App Check and live inference are verified — then replace the sample-mode sequence with a real PDF analysis.
- **Captions:** burn captions for every narration line. On-screen labels (button names, badges) appear as lower-thirds in navy.
- **Pacing:** one screen at a time; zoom/crop to the relevant region rather than showing the full app unless narrating navigation.
- **No music** under voiceover, or a low bed at −24 dB.

---

## Storyboard

### Scene 0 — Cold open / Title  (0:00–0:20)

| | |
|---|---|
| **On-screen** | Navy title card. Logo wordmark **PocketMind AI**. Tagline fades in: *“Understand complex documents. Extract what matters. Stay in control.”* Subtitle: *“A 5-minute walkthrough for procurement teams.”* |
| **Narration (VO)** | “Complex tenders bury their obligations in dozens of pages of prose. PocketMind AI turns a tender PDF into reviewable findings — with a link back to the source page for every one of them. In the next five minutes, you'll see the full workflow, start to export.” |
| **Caption** | *PocketMind AI — Understand complex documents. Extract what matters. Stay in control.* |

### Scene 1 — What it is, who it's for  (0:20–0:50)

| | |
|---|---|
| **On-screen** | Soft zoom on the app landing on the Dashboard. Sidebar visible: Dashboard · Document analysis · Compliance matrix · Processing & privacy. |
| **Narration (VO)** | “PocketMind AI is built for procurement teams, consultants, and anyone reviewing tenders. You upload a PDF, the text is extracted right in your browser, and you decide whether an AI model may process it — on-device, in the cloud, or a hybrid of both. Everything it finds stays linked to the page it came from.” |
| **Caption** | *For procurement teams reviewing tender PDFs* |

### Scene 2 — Dashboard overview  (0:50–1:25)

| | |
|---|---|
| **On-screen** | Dashboard. Pan across the four metric cards, then down to **Recent tender documents** and the **Review queue**. Hover the Firebase badge. |
| **Narration (VO)** | “This is your workspace. Four cards give you the headline: documents in the session, requirements extracted, critical risks flagged for human review, and pending reviews. Below, your recent documents — the sample tender's already here — and a review queue of findings that need your attention. The badge up top shows Firebase status; until a real model responds, it reads 'configured · not yet verified.'” |
| **Caption** | *Documents · Requirements · Critical risks · Pending reviews* |

### Scene 3 — Processing & privacy: the key decision  (1:25–2:10)

| | |
|---|---|
| **On-screen** | Click **Processing & privacy**. Reveal the four mode cards one by one as narrated. Stop on **Sample data**. Show the process strip at the bottom. |
| **Narration (VO)** | “This is the most important screen. You pick one of four modes. On-device only keeps inference in your browser — no cloud, but it needs a supported Chrome. Cloud AI sends extracted text to Gemini through Firebase AI Logic. Hybrid tries on-device first, with cloud fallback. And Sample data — what we'll use today — opens the prepared fictional tender with no setup and no model call.” |
| **Caption** | *On-device · Cloud AI · Hybrid · Sample data — your choice, your consent* |
| **On-screen (consent)** | Briefly click **Cloud AI** to reveal the consent checkbox, then click back to **Sample data**. |
| **Narration (VO)** | “For cloud or hybrid, you tick explicit consent — and it resets every time you reload. Cloud use is always your choice.” |
| **Caption** | *Cloud use is always explicit — resets on reload* |

### Scene 4 — Run the analysis  (2:10–2:35)

| | |
|---|---|
| **On-screen** | On **Sample data**, click **Explore sample analysis**. Transition into Document analysis. |
| **Narration (VO)** | “We'll run the sample. One click — Explore sample analysis — opens the prepared findings. Remember: this is illustrative demo data, not a real procurement document.” |
| **Caption** | *Sample data — Illustrative analysis, not a real procurement document* |

### Scene 5 — Document analysis: findings + evidence  (2:35–3:25)

| | |
|---|---|
| **On-screen** | Document analysis. Point to **Document summary**, then click through filter chips (Requirements, Risks). On a requirement, click the **Page {n}** link — the left Source document panel jumps to that page. Highlight the green **Source verified** badge. Then open the *Tight early installation milestone* risk (Critical). |
| **Narration (VO)** | “Here are your findings, beside the source. A document summary up top, then filters for requirements, deadlines, specifications, risks, and missing information. Each finding quotes its excerpt and links to the page it came from — click it, and the source jumps to that exact page. A green badge means the excerpt was verified against the extracted text. This Critical risk — four hundred luminaires within ninety days of award — is exactly the kind of obligation a person must judge against supplier lead times.” |
| **Caption** | *Every finding links to its source page — verify before you rely on it* |

### Scene 6 — Compliance matrix  (3:25–4:05)

| | |
|---|---|
| **On-screen** | Click **Compliance matrix**. Filter by **Eligibility**. Click a requirement; the **Source evidence** panel shows the excerpt. Change **Review status** to *Reviewed*, type a **Review note**. |
| **Narration (VO)** | “The Compliance matrix turns requirements into a checklist. Filter by category — here, Eligibility — or by review status. Select a requirement to read its evidence, then set your review status: Pending, Reviewed, Satisfied, or Unclear, and add a note. One caution: review status and notes live only in this browser session — export before you close the tab.” |
| **Caption** | *Track each requirement against evidence and your review status* |

### Scene 7 — Ask this document  (4:05–4:30)

| | |
|---|---|
| **On-screen** | Back to Document analysis, scroll to the **Ask this document** panel. Type a question, send. Show the answer with **Working hypotheses**, **Still to verify**, and a **Document evidence** citation with a page link. |
| **Narration (VO)** | “You can also ask follow-up questions. Answers separate what the PDF actually says, from working hypotheses, from points still to verify — and every quote links back to its page.” |
| **Caption** | *Facts · Working hypotheses · Still to verify* |

### Scene 8 — Export  (4:30–4:50)

| | |
|---|---|
| **On-screen** | Compliance matrix → **Export CSV**. Document analysis → **Export JSON**. Show the two downloaded files. |
| **Narration (VO)** | “When you're done, export. The Compliance matrix gives you a CSV — one row per requirement with your review status and notes. And from Document analysis, a full JSON of the document and its findings. Both drop straight into Excel or your procurement system.” |
| **Caption** | *Export CSV — compliance matrix · Export JSON — full analysis* |

### Scene 9 — Privacy, human review & outro  (4:50–5:15)

| | |
|---|---|
| **On-screen** | Sidebar close-up: *“Privacy by choice. Cloud use is always explicit.”* Cut to the process strip: *Human review — Decisions stay yours.* End on title card with wordmark. |
| **Narration (VO)** | “That's the full pass: open, choose a mode, run, verify evidence against the source, track compliance, export. PDF text is extracted in your browser; cloud use is always your explicit choice. And AI findings are suggestions — decisions stay yours. Try it now with the sample tender, no setup required.” |
| **Caption** | *Privacy by choice · Decisions stay yours · Try it with the sample tender* |

---

## Recording checklist

- [ ] Desktop Chrome, app running, sample tender preloaded
- [ ] Mode set to **Sample data** (no Firebase needed for the demo cut)
- [ ] Capture at 1920×1080, cursor highlighted
- [ ] Record narration separately; sync in edit
- [ ] Burn captions for every VO line
- [ ] Lower-thirds in navy for every button/badge named on screen
- [ ] Include the demo caveat lower-third at Scenes 4 **and** 9
- [ ] Export 1080p MP4 (H.264) + captioned SRT sidecar
- [ ] **Second cut (later):** once Firebase App Check and live inference are verified, re-record Scenes 4–8 with a real uploaded PDF in Cloud AI mode, replacing the sample-mode sequence

## Reuse map (for the PowerPoint)

| Slide | Source scene |
|---|---|
| Cover | Scene 0 |
| Problem & audience | Scene 1 |
| The four screens | Scene 2 |
| Processing modes | Scene 3 |
| Analysis & evidence | Scenes 5 |
| Compliance matrix | Scene 6 |
| Document Q&A | Scene 7 |
| Privacy & human review | Scene 9 |
| Walkthrough recap | Scenes 4–8 condensed |
