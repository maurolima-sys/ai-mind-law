# Product — AI Mind Law (PocketMind AI)

## Purpose
Prototype scaffold for procurement-document analysis. Intended to evolve into a working AI-powered legal/procurement assistant ("PocketMind AI") that can ingest tender PDFs, extract text, and surface compliance insights.

## Current State
- Homepage (`/`) renders a placeholder page — no working analysis workflow is exposed.
- A fictional sample tender with a pre-written simulated analysis lives in `src/data/sampleTender.ts` (explicitly illustrative, not real data).
- Browser-side PDF text extraction via PDF.js is wired in `src/lib/services/documentProcessing.ts` but not connected to the UI.
- No Firebase AI Logic, Gemini Nano, cloud-model inference, or OCR integration is present at runtime.

## Intended Features (planned, not yet implemented)
- Upload and parse procurement tender PDFs in the browser.
- AI-driven compliance analysis and risk flagging.
- Hybrid on-device / cloud inference (Gemini Nano + cloud model).
- Evidence extraction and CSV export of findings.
- Dashboard with charts for compliance scores and risk metrics.

## Target Users
Legal professionals, procurement officers, and compliance teams who need to quickly analyse tender documents for risks and obligations.

## Key Value Proposition
Reduce manual review time for procurement tenders by combining local PDF extraction with AI-powered analysis, keeping sensitive documents client-side where possible.
