# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Teams in procurement and tendering who review PDF tender documents and need to verify requirements, deadlines, risks, and supporting evidence.

## Product Purpose

PocketMind AI helps procurement teams turn complex tender PDFs into structured findings that people can review against the source document.

## Positioning

The intended workflow combines local PDF text extraction with Firebase AI Logic hybrid inference, preferring on-device text processing where supported and allowing cloud fallback, with processing mode made visible to the user.

## Operating Context

Users upload or select a tender PDF, review extracted requirements, dates, specifications, risks, and missing information, then verify each finding against a source page and track compliance status.

## Capabilities and Constraints

- The target platform is Web in Chrome. Firebase AI Logic's web on-device inference requires a supported desktop Chrome version and browser model availability; other environments may use cloud fallback.
- PDFs are preprocessed into text in the browser before model analysis; the hybrid on-device API does not directly process PDF files as multimodal input.
- Firebase AI Logic requires Firebase App Check. Firebase project configuration and App Check setup are deployment prerequisites; debug tokens must not be committed or shipped in production.
- The app supports a fictional demo mode, PDF text extraction, on-device-only analysis, and consent-gated hybrid inference through Firebase AI Logic with cloud fallback.
- Analysis results display the inference source reported by Firebase AI Logic, and cited excerpts are checked against extracted page text.
- Review statuses and notes are held in the current browser session; persistent accounts and cloud document storage are not implemented.
- Scanned-image OCR is not implemented.
- Sample tender details are fictional and must remain clearly labeled as illustrative.
- AI findings require human review and verifiable evidence; the product must not imply that generated procurement analysis is authoritative legal advice.

## Brand Commitments

- Product name: PocketMind AI.
- The provided dashboard, document-analysis, compliance-matrix, and hybrid-processing screenshots are visual references for the requested application.
- Make data-processing mode and cloud consent understandable to users.

## Evidence on Hand

- Fictional sample tender and explicitly simulated analysis: `src/data/sampleTender.ts`.
- Browser-side PDF text extraction utility: `src/lib/services/documentProcessing.ts`.
- Firebase AI Logic and App Check runtime integration: `src/lib/services/firebaseAi.ts` and `src/lib/services/tenderAnalysis.ts`.
- User-provided visual references: `public/pocketmind-dashboard.jpg`, `public/pocketmind-analysis.jpg`, `public/pocketmind-compliance.jpg`, and `public/pocketmind-hybrid-processing.jpg`.
- No real tender documents, production Firebase configuration, App Check registration, or verified live AI analysis are present in the repository.

## Product Principles

- Clearly distinguish live model output from illustrative demo content.
- Preserve traceable links between findings and source evidence.
- Keep users in control of whether document text can be processed in the cloud.
- Treat AI results as reviewable suggestions, not final decisions.
