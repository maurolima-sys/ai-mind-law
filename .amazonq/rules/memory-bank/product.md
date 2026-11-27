# PocketMind AI — Product Overview

## Purpose

PocketMind AI turns procurement/tender documents into a structured, human-reviewable workspace. It extracts text locally in the browser, runs AI analysis via Firebase AI Logic (Gemini), and surfaces a compliance matrix with source-verified findings.

**Live demo:** https://ai-mind-law.vercel.app/
**Hackathon:** #BuildHybridAI 2026 submission

## Core Value Proposition

Tender documents run to dozens of pages of dense prose. PocketMind AI:
- Extracts text from PDF/DOCX/XLSX locally in the browser (no upload to cloud)
- Runs hybrid AI inference: on-device first, cloud fallback, with explicit user consent
- Surfaces requirements, deadlines, specifications, and risks with source-verified excerpts
- Provides a compliance matrix for human review, notes, and CSV/JSON export

## Key Features

### Document Processing
- Upload PDF, DOCX, XLSX up to 50 MB
- Local text extraction: PDF.js (PDFs), Mammoth (DOCX), ExcelJS (XLSX)
- Optional LlamaParse OCR for scanned/sparse PDFs (requires separate per-document consent)
- Page-level text retention with source labels

### AI Inference (Firebase AI Logic)
- Three modes: Cloud-only, On-device-only, Hybrid (on-device-first with cloud fallback)
- Model fallback chain: `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`
- App Check with reCAPTCHA Enterprise (production) / debug token (dev)
- Explicit cloud consent required before any cloud path is used
- Reports actual inference source (ON_DEVICE / IN_CLOUD / CLOUD_FALLBACK) per section
- BYOK (Bring Your Own Key) Firebase config support

### Compliance Workspace
- Compliance matrix with per-requirement review tracking (pending/reviewed/satisfied/unclear)
- Source verification: excerpts checked against extracted text
- Bidder evidence attachment and AI-powered comparison
- Human review states: assessment (compliant/partially/non-compliant) + notes
- CSV and JSON export

### Document Q&A
- Follow-up questions about extracted document text
- Separates stated facts, working hypotheses, and unresolved questions
- Citations verified against extracted text
- Optional browser speech input/output
- Optional Firecrawl external legal research (server-side only, separate consent)

### Local Persistence
- All data in IndexedDB (not encrypted, not synced)
- Documents, analyses, evidence, projects, review state, activity log
- Projects: organize documents with roles (tender, annex, evidence, etc.)

### Integrations & Diagnostics
- Firebase AI Logic connectivity check
- LlamaParse availability check
- ElevenLabs narration diagnostics
- App Check outcome reporting

## Target Users

Procurement and tendering teams, consultants, and anyone reviewing public or private tenders.

## Workflow

Upload → Choose processing mode → Analyze → Verify findings → Attach evidence → Compare → Track review → Export

## Screens / Navigation

Dashboard · Documents · Analysis · Compliance matrix · Risks · Projects · Processing · Settings · Integrations

## What Is NOT Implemented

- User accounts or authentication
- Shared workspaces / team collaboration
- Cloud document storage
- Data encryption
- MCP bridge to IndexedDB
- Supabase integration (roadmap only)

## Sample Data

A fictional tender ("NB-2026-114 Smart LED Street Lighting") is bundled as prepared demo data. Loading sample data does NOT call Firebase — it uses pre-built analysis results.

## Build Info

- Version: `v0.4.0`
- Last hackathon-stable tag: `hackathon-stable` (commit `1d99a29`)
- Production: https://ai-mind-law.vercel.app/
- License: Apache 2.0
