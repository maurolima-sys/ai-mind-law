# PRODUCT.md — PocketMind AI

> Impeccable context file. Read before any design or UI work.

## What it is

PocketMind AI is a **procurement document intelligence workspace** for the browser. It extracts text from PDF, DOCX, and XLSX files locally, then — under explicit user consent — sends it to Firebase AI Logic for analysis in cloud-only, on-device-only, or hybrid mode. The output is a structured compliance matrix with source-verified findings, review tracking, and CSV/JSON export.

Hackathon: **#BuildHybridAI 2026** — Web (Chrome) · Firebase AI Logic hybrid inference.

## Audience

- Procurement and tendering teams reviewing public or private tenders
- Bid consultants who need to track compliance across dozens of requirements
- Anyone who reads dense legal/commercial documents and needs to surface obligations fast

**Mental model of the user**: a careful professional who distrusts AI output by default. They want to see the source. They want to know _where_ the AI found something, not just _what_ it found. Privacy matters — they may be reviewing sensitive commercial documents.

## Voice

- **Direct, precise, low-noise.** No buzzwords. No "supercharge", "empower", "streamline".
- **Transparent about uncertainty.** The UI always surfaces inference source, verification status, and confidence. Never hides limitations.
- **Professional, not corporate.** Warm enough to be usable, serious enough to be trusted.
- **Multilingual-ready.** EN primary, PT and ES supported. Translations must not alter evidence or dates.

## Anti-references (what this is NOT)

- Not a consumer AI chat app (no bubbly gradients, no "magic" language)
- Not a SaaS marketing site (no hero sections with floating screenshots)
- Not a developer tool (no monospace-heavy, terminal-aesthetic UI)
- Not a generic dashboard template (no cardocalypse, no side-tab accent borders)

## Design register

**Product Mode** — density, semantic states, repeatable components. This is a workspace tool, not a landing page.

## Core UX principles

1. **Source first**: every AI finding links to a verifiable excerpt. The UI must make verification easy, not buried.
2. **Consent visible**: cloud processing requires explicit consent. The processing mode must always be surfaced.
3. **Human in the loop**: review states (pending / reviewed / satisfied / unclear) are first-class UI elements.
4. **Local by default**: data stays in the browser. Cloud is opt-in. The UI must communicate this without anxiety.
