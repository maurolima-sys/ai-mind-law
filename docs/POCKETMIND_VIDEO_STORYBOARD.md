# PocketMind AI — Video Storyboard (Hackathon Cut)

**Target length:** ≈ 3 minutes
**Language:** English
**Audience:** #BuildHybridAI 2026 judges
**Tone:** Direct, technical, evidence-first
**Format:** Screen recording with voiceover; no music under VO

---

## Production notes

- Record in **desktop Chrome** — required for on-device inference.
- Use **`SEDA-Vinyl-Siding-Facia-RFP.pdf`** (4 pages, 851 KB) — the verified on-device document.
- The on-device run is **live**, not sample data. Firebase is not called; no consent is required.
- Capture at 1920×1080, cursor highlighted. Zoom/crop to the relevant region.
- Burn captions for every VO line. Lower-thirds in navy for button/badge names.
- Record narration separately; sync in edit.
- **Mandatory lower-third at 1:00:** "On-device only — no data leaves this device"
- **Mandatory lower-third at 2:10:** "AI findings are suggestions — human review required"

---

## Storyboard

### Scene 0 — Title card (0:00–0:15)

| | |
|---|---|
| **On-screen** | Navy title card. Wordmark **PocketMind AI**. Tagline: _"Tender documents. Analyzed locally. Verified against the source."_ |
| **VO** | "Tender documents run to dozens of pages. PocketMind AI extracts what matters — on your device, without sending the file anywhere." |
| **Caption** | _PocketMind AI — Tender documents. Analyzed locally. Verified against the source._ |

---

### Scene 1 — Upload the PDF (0:15–0:35)

| | |
|---|---|
| **On-screen** | Processing screen. Drag `SEDA-Vinyl-Siding-Facia-RFP.pdf` onto the drop zone. Show the file name and page count appear. |
| **VO** | "We upload a real procurement PDF — four pages, 851 kilobytes. Text is extracted right here in the browser with PDF.js. The file never leaves the device." |
| **Caption** | _Text extracted locally — PDF.js, in-browser_ |

---

### Scene 2 — Select On-device only (0:35–1:00)

| | |
|---|---|
| **On-screen** | Click the **On-device only** card. The card highlights. No consent checkbox appears — none is needed. Click **Analyze PDF**. |
| **VO** | "We choose On-device only. No consent checkbox — because nothing goes to the cloud. Firebase AI Logic routes the request to Chrome's Prompt API." |
| **Caption** | _On-device only — Chrome Prompt API, no cloud consent required_ |
| **Lower-third** | "On-device only — no data leaves this device" |

---

### Scene 3 — Live analysis progress (1:00–1:30)

| | |
|---|---|
| **On-screen** | Full-screen progress modal. Show section progress: "Analyzing text section 1 of 3", "2 of 3", "3 of 3". Show "Verifying cited evidence". |
| **VO** | "The document is split into sections. Each section is analyzed by the on-device model — you can watch the progress in real time. Three sections, all local." |
| **Caption** | _3 sections · on-device model · no network requests to Firebase_ |

---

### Scene 4 — Results: inference source (1:30–1:55)

| | |
|---|---|
| **On-screen** | Modal closes. Analysis screen loads. Zoom to the inference source badge: **Firebase AI Logic · on-device**. Zoom to the section monitor showing 3/3 `ON_DEVICE`. |
| **VO** | "Analysis complete. The badge reads: Firebase AI Logic, on-device. Three sections, three on-device responses — zero cloud fallback. This is the inference source reported by the Firebase SDK, not a label we set ourselves." |
| **Caption** | _Firebase AI Logic · on-device · 3/3 sections · 0 cloud fallback_ |

---

### Scene 5 — Findings with source evidence (1:55–2:20)

| | |
|---|---|
| **On-screen** | Scroll through findings: requirements, deadlines, risks. Click one requirement — source panel jumps to the cited page. Highlight the **Source verified** badge. |
| **VO** | "Eighteen findings: requirements, deadlines, specifications, risks. Every finding quotes its excerpt and links to the source page. A green badge means the excerpt was verified against the extracted text — not just returned by the model." |
| **Caption** | _18 findings · source-verified excerpts · page-linked_ |
| **Lower-third** | "AI findings are suggestions — human review required" |

---

### Scene 6 — Compliance matrix (2:20–2:40)

| | |
|---|---|
| **On-screen** | Open **Compliance matrix**. Show requirements list with evidence and review status. Set one requirement to **Reviewed**, add a note. Click **Export CSV**. |
| **VO** | "The Compliance matrix turns findings into a checklist. Set review status, add notes, export CSV. Review state lives in this browser — export before you close the tab." |
| **Caption** | _Compliance matrix · review status · export CSV_ |

---

### Scene 7 — Export JSON + outro (2:40–3:00)

| | |
|---|---|
| **On-screen** | Back to Analysis. Click **Export JSON**. Show the downloaded file name: `SEDA-Vinyl-Siding-Facia-RFP-analysis.json`. Cut to title card. |
| **VO** | "Export the full analysis as JSON — including the execution report with section sources and timing. That's the complete workflow: upload, analyze on-device, verify evidence, track compliance, export. No account. No cloud. Your document stays yours." |
| **Caption** | _Export JSON · executionReport · section sources · no account required_ |

---

## Recording checklist

- [ ] Desktop Chrome, latest stable
- [ ] `SEDA-Vinyl-Siding-Facia-RFP.pdf` ready to drag-and-drop (do not pre-load)
- [ ] Settings → **On-device only** as default mode before recording
- [ ] Clear any prior analysis for this document before recording
- [ ] Confirm on-device model is available (run once before recording to avoid download progress on camera)
- [ ] Cursor highlighted in recording software
- [ ] Capture 1920×1080
- [ ] Mandatory lower-thirds at Scene 2 and Scene 5
- [ ] Export 1080p MP4 (H.264)
- [ ] Upload to YouTube as unlisted; add link to submission form

---

## What this video proves to judges

| Criterion | Evidence in video |
|---|---|
| Firebase AI Logic called at runtime | Scene 3: live progress modal; Scene 4: SDK-reported inference source badge |
| Hybrid inference (on-device path) | Scene 4: 3/3 `ON_DEVICE`, zero cloud fallback |
| App Check | Not visible in on-device path (no cloud call); reference README for production cloud test |
| Real document, not sample data | Scene 1: real PDF upload; Scene 4: file name in toolbar |
| Source verification | Scene 5: **Source verified** badge per finding |
| Complete workflow | Scenes 1–7: upload → analyze → verify → compliance → export |

---

## Second cut (optional, post-submission)

Once a larger document (10+ pages) completes on-device, re-record Scene 3 with that document to demonstrate scale. The current verified result (`SEDA-Vinyl-Siding-Facia-RFP.pdf`, 4 pages) is sufficient for submission.
