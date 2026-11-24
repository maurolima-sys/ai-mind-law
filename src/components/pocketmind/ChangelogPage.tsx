import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  GitCommitHorizontal,
  Globe,
  Map,
  Mic,
  Package,
  Puzzle,
  ScrollText,
  Shield,
  Sparkles,
  Volume2,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// ─── data ────────────────────────────────────────────────────────────────────

type ChangeKind = "added" | "changed" | "fixed" | "removed" | "security" | "note";

interface ChangeItem {
  kind: ChangeKind;
  text: ReactNode;
}

interface Release {
  version: string;
  label: string;
  date: string;
  commit?: string;
  status: "unreleased" | "latest" | "stable";
  summary: string;
  icon: LucideIcon;
  iconColor: string;
  changes: ChangeItem[];
}

const RELEASES: Release[] = [
  {
    version: "0.5.0",
    label: "Mistral Voxtral TTS narration",
    date: "2026-11-24",
    commit: "69735db",
    status: "latest",
    summary:
      "Tour narration upgraded from browser speechSynthesis to Mistral Voxtral TTS (voxtral-mini-tts-latest, voice en_paul_neutral) via a real server function. speechSynthesis retained as automatic fallback. LlamaParse OCR rewritten to call LlamaCloud API directly. MISTRAL_API_KEY and LLAMACLOUD_API_KEY synced to Vercel as server-side secrets. dotenv added as dev dependency.",
    icon: Volume2,
    iconColor: "var(--pm-blue)",
    changes: [
      {
        kind: "added",
        text: "tourNarration.functions.ts rewritten as a real TanStack Start server function. Calls POST /v1/audio/speech on api.mistral.ai with model voxtral-mini-tts-latest and voice en_paul_neutral. Returns { audio_data: base64 mp3 }. Client plays via new Audio(data:audio/mp3;base64,...). Falls back to browser speechSynthesis on any error.",
      },
      {
        kind: "added",
        text: "MISTRAL_API_KEY and LLAMACLOUD_API_KEY added to Vercel Production and Preview as Secret type via Vercel CLI. Neither key is exposed to the browser bundle.",
      },
      {
        kind: "changed",
        text: "ocr.functions.ts rewritten to call LlamaCloud API directly (api.cloud.llamaindex.ai). Flow: upload → parse job → poll checking body.job.status === COMPLETED → result in poll body. Removed LOVABLE_API_KEY dependency. LLAMACLOUD_API_KEY is the sole credential.",
      },
      {
        kind: "changed",
        text: "aiDiagnostics.ts: ElevenLabs diagnostic messages updated to reflect Mistral Voxtral TTS with browser speech fallback. runElevenLabsDiagnostic now reports the actual source used (Mistral Voxtral TTS or browser speech synthesis).",
      },
      {
        kind: "changed",
        text: "IntegrationsScreen.tsx: ElevenLabs card title now uses t('integrations_eleven_title') i18n key. EN: Tour narration / PT: Narração do tour / ES: Narración del tour.",
      },
      {
        kind: "added",
        text: "dotenv added as dev dependency for use in Node scripts that read .env.local (pre-push-check.mjs, Vercel sync scripts).",
      },
      {
        kind: "fixed",
        text: "GuidedTour.tsx: prettier formatting fixed — stopAudio inline body and Volume2/VolumeX ternary JSX. Unused eslint-disable directive removed.",
      },
      {
        kind: "fixed",
        text: "ocr.functions.ts: inline type annotation expanded to multi-line to satisfy prettier.",
      },
      {
        kind: "added",
        text: "scripts/set-vercel-vars.ps1: LLAMACLOUD_API_KEY and MISTRAL_API_KEY entries added to the sync manifest.",
      },
    ],
  },
  {
    version: "0.4.9",
    label: "On-device inference verified",
    date: "2026-11-23",
    commit: "da88078",
    status: "stable",
    summary:
      "First confirmed end-to-end on-device analysis: SEDA-Vinyl-Siding-Facia-RFP.pdf (4 pages) completed 3/3 sections with ON_DEVICE inference — zero cloud fallback, 18 findings. Root cause chain resolved across 4 commits: Zod enum case, sourceIndex as string, empty fields, prose-prefixed JSON, .min(1) on text fields, .positive() rejecting 0, null confidence. Evaluation criteria descriptions and video storyboard updated.",
    icon: BrainCircuit,
    iconColor: "var(--pm-green)",
    changes: [
      {
        kind: "fixed",
        text: "tenderAnalysisSchema.ts: all strict validators removed for on-device tolerance. description/item/details/title/explanation use .default(''); sourceIndex uses .min(0).catch(1); confidence accepts null → 0.5; all category/severity/kind enums normalised case-insensitively with fallbacks; mandatory accepts string or boolean; excerpt defaults ''.",
      },
      {
        kind: "fixed",
        text: "tenderAnalysis.ts: parseTenderResponse extracts JSON robustly — checks for code fences first, then uses indexOf('{') / lastIndexOf('}') to handle prose-prefixed responses from on-device models.",
      },
      {
        kind: "fixed",
        text: "processing-provenance.test.tsx: zoom test timeout increased from 15 s to 25 s to prevent load-dependent failures.",
      },
      {
        kind: "note",
        text: "2026-11-23 verified: SEDA-Vinyl-Siding-Facia-RFP.pdf (4 pages, 851 KB) — 3/3 sections ON_DEVICE, 18 findings, zero cloud fallback. Exported JSON preserved as SEDA-Vinyl-Siding-Facia-RFP-analysis.json. Larger documents (10+ pages) and production deployment remain unverified.",
      },
      {
        kind: "added",
        text: "docs/POCKETMIND_VIDEO_STORYBOARD.md: replaced 5-minute sample-data storyboard with 3-minute on-device evidence-first hackathon cut. Scenes cover upload, mode selection, live progress, inference source badge, findings, compliance matrix, and JSON export.",
      },
      {
        kind: "changed",
        text: "evaluation.ts: criterion descriptions updated — on-device now records verified 2026-11-23 result; test-count updated to 149 tests / 31 files; walkthrough description synced to commit 61c5e07.",
      },
      {
        kind: "changed",
        text: "docs/EVALUATOR_WALKTHROUGH.md: section 4 On-device bullet and section 10 verification table updated with confirmed 2026-11-23 result.",
      },
    ],
  },
  {
    version: "0.4.8",
    label: "Evaluation workspace seed",
    date: "2026-11-23",
    commit: "93f88ff",
    status: "stable",
    summary:
      "evaluation-seed-v3.json generated with all 37 criterion IDs, validated against the app's own Zod schema (37 records, schema OK). Video storyboard replaced with 3-minute on-device evidence-first cut.",
    icon: ScrollText,
    iconColor: "var(--pm-blue)",
    changes: [
      {
        kind: "added",
        text: "docs/evaluation-seed-v3.json: complete snapshot with all 37 criterion IDs matching evaluation.ts. 29 verified, 5 in_progress, 3 pending. Validated with node -e parseEvaluation before commit.",
      },
      {
        kind: "changed",
        text: "docs/POCKETMIND_VIDEO_STORYBOARD.md: 5-minute sample-data storyboard replaced with 3-minute on-device evidence-first hackathon cut (commit 93f88ff).",
      },
    ],
  },
  {
    version: "0.4.6",
    label: "Firebase reliability",
    date: "2026-11-23",
    commit: "a8a8861",
    status: "stable",
    summary:
      "Restored gemini-3.8-flash as the primary model, raised cloud timeouts to 30 s / 100 s, added a defensive fallback for unrecognised inferenceSource values, and fixed .env.local encoding (UTF-16 → UTF-8) so the App Check debug token is read correctly in local dev.",
    icon: Shield,
    iconColor: "var(--pm-amber)",
    changes: [
      {
        kind: "fixed",
        text: "gemini-3.8-flash restored as PRIMARY_GEMINI_MODEL; gemini-3.5-flash demoted to secondary. The chain had been accidentally inverted.",
      },
      {
        kind: "fixed",
        text: "Cloud generation timeout raised from 15 s → 30 s; total budget from 55 s → 100 s. Retry delays increased to 3 s / 6 s with jitter.",
      },
      {
        kind: "fixed",
        text: "requireInferenceSource now logs a warning and returns IN_CLOUD for unrecognised SDK enum values instead of throwing and discarding a valid analysis response.",
      },
      {
        kind: "fixed",
        text: ".env.local was stored as UTF-16 LE without BOM; Vite reads env files as UTF-8, so FIREBASE_APPCHECK_DEBUG_TOKEN was silently ignored. File rewritten as UTF-8 without BOM.",
      },
      {
        kind: "added",
        text: "scripts/vercel-deploy.mjs — Node ESM script that syncs required env vars to Vercel (upsert) and triggers a production deploy via Vercel CLI without exposing values in shell output.",
      },
    ],
  },
  {
    version: "0.4.5",
    label: "Company Profile & Smart Discovery",
    date: "2026-11-22",
    commit: "34e89ae",
    status: "stable",
    summary:
      "Country-aware Company Profile form with jurisdiction card, Smart Document Discovery connected to company context, sample RFP served from own origin, and DESIGN.md visual system reference.",
    icon: Globe,
    iconColor: "var(--pm-blue)",
    changes: [
      {
        kind: "added",
        text: "CompanyProfileSection: country <select> over SUPPORTED_COUNTRIES (BR, PT, GB, US, ES, MX, CA). Dynamic jurisdiction card with 4 rows + optional secondary ID. CA province sub-selector.",
      },
      {
        kind: "added",
        text: "companyProfile.ts: SubJurisdiction, JurisdictionInfo interfaces; SUPPORTED_COUNTRIES array; getJurisdictionInfo(country) helper.",
      },
      {
        kind: "changed",
        text: "DEMO_RFP_URL changed to /request_for_proposal.pdf (own origin). .gitignore updated with !public/*.pdf exception to track the sample asset.",
      },
      {
        kind: "added",
        text: "DESIGN.md at repo root: full visual system reference — tokens, typography, spacing, motion rules, slop watchlist.",
      },
      {
        kind: "added",
        text: "Jurisdiction card CSS: .pm-cp-jurisdiction-card, .pm-cp-jurisdiction-row, .pm-cp-jurisdiction-label, .pm-cp-jurisdiction-value, .pm-cp-jurisdiction-value--muted.",
      },
    ],
  },
  {
    version: "0.4.4",
    label: "Settings polish & CI gate",
    date: "2026-11-22",
    commit: "94e2a4d",
    status: "stable",
    summary:
      "Settings screen accessibility pass: label/hint contrast, accordion touch area, responsive fields, outline Save button. CI now runs tsc --noEmit as a mandatory gate.",
    icon: Wrench,
    iconColor: "var(--pm-purple)",
    changes: [
      { kind: "fixed", text: "Settings: improved label/hint contrast ratios for WCAG AA." },
      { kind: "fixed", text: "Accordion touch area enlarged to 44 px minimum." },
      { kind: "fixed", text: "Profile fields responsive on small screens." },
      {
        kind: "fixed",
        text: "Save profile button uses outline variant to distinguish from primary actions.",
      },
      {
        kind: "added",
        text: "CI: tsc --noEmit gate added to GitHub Actions workflow. Discovery files added to targeted ESLint step.",
      },
    ],
  },
  {
    version: "0.4.3",
    label: "Smart Discovery & Projects",
    date: "2026-11-21",
    commit: "3ce64f3",
    status: "stable",
    summary:
      "Smart Document Discovery searches external sources via Firecrawl, validates PDF candidates server-side, and surfaces them in a candidate UI. Company Profile pre-fills discovery context. Projects screen organises documents into local dossiês.",
    icon: Puzzle,
    iconColor: "var(--pm-green)",
    changes: [
      {
        kind: "added",
        text: "Smart Document Discovery: Firecrawl search, backend PDF validation, candidate card UI with source badges.",
      },
      {
        kind: "added",
        text: "Company Profile connected to Smart Discovery — pre-fills country, jurisdiction, and activity codes as search context.",
      },
      {
        kind: "added",
        text: "Company Profile: international identity fields, registration numbers, and activity codes in Settings.",
      },
      {
        kind: "added",
        text: "Dashboard hero CTA with sample RFP from Supabase — guided demo entry for judges.",
      },
      {
        kind: "added",
        text: "Projects screen: organise uploaded documents into local projects with multiple document roles. Records stay in IndexedDB.",
      },
    ],
  },
  {
    version: "0.4.2",
    label: "Processing monitor & observability",
    date: "2026-11-21",
    commit: "5cac563",
    status: "stable",
    summary:
      "ProcessingMonitor modal with radar UI, SectionTrace and ExecutionReport in exported JSON, reduced cloud timeouts (15 s / 55 s at the time), and inference observability per section.",
    icon: CheckCircle2,
    iconColor: "var(--pm-blue)",
    changes: [
      {
        kind: "added",
        text: "ProcessingMonitor: createPortal modal with focus trap, minimise pill, radar animation, and accessibility fixes.",
      },
      {
        kind: "added",
        text: "SectionTrace and ExecutionReport added to successful analysis exports. Fields: section, source, attempts, durationMs, timedOut, error.",
      },
      {
        kind: "added",
        text: "Inference observability: per-section source reported in monitor and exported JSON. Mixed-source analyses labelled hybrid.",
      },
      {
        kind: "changed",
        text: "ProcessingScreen extracted to dedicated route with modal monitor and i18n.",
      },
      {
        kind: "fixed",
        text: "Typed file validation errors with EN/PT/ES messages. Upload-before-confirm flow; confirm disabled without file.",
      },
      {
        kind: "security",
        text: "Pre-parse size guard and array-length limits before Zod (GHSA-mrhx-c7xc-m3w5). npm audit fix applied; Zod array bounds enforced.",
      },
    ],
  },
  {
    version: "0.4.1",
    label: "Integrations, diagnostics & risks",
    date: "2026-11-20",
    commit: "3c5a639",
    status: "stable",
    summary:
      "Integrations screen with Firebase AI, LlamaParse, and ElevenLabs diagnostics. Risks screen aggregates risks from saved analyses with severity/document filters and CSV export. AI diagnostics distinguish configured-only checks from observed calls.",
    icon: Zap,
    iconColor: "var(--pm-amber)",
    changes: [
      {
        kind: "added",
        text: "Integrations screen: Firebase AI inference diagnostic, LlamaParse availability check, ElevenLabs speech diagnostic. Bounded metadata-only history in localStorage.",
      },
      {
        kind: "added",
        text: "Risks screen: aggregate risks from all saved analyses, severity and document filters, human response notes, CSV export.",
      },
      {
        kind: "added",
        text: "Settings screen with preferences service: default inference mode, guided-tour narration, Q&A voice controls, local-data deletion. Versioned localStorage record.",
      },
      {
        kind: "added",
        text: "AI diagnostics explicitly report App Check outcomes rather than inferring from configuration. MCP shown as not implemented.",
      },
      {
        kind: "fixed",
        text: "Inference source reported per operation (analysis, Q&A, evidence comparison). Cloud shown as connected only after a real response.",
      },
      {
        kind: "fixed",
        text: "Compliance screen: evidence and assessment states separated. Older unclear values labelled as previous status.",
      },
    ],
  },
  {
    version: "0.4.0",
    label: "Production Cloud AI verified",
    date: "2026-11-20",
    commit: "ed19ed4",
    status: "stable",
    summary:
      "On 2026-11-20, production build ed19ed4 completed a Cloud AI analysis of the fictional sample: App Check HTTP 200, gemini-3.8-flash HTTP 500, then gemini-3.5-flash HTTP 200. UI reported Cloud (IN_CLOUD). Login, evaluation workspace, and Supabase auth added.",
    icon: Globe,
    iconColor: "var(--pm-purple)",
    changes: [
      {
        kind: "note",
        text: "2026-11-20 production test: exchangeRecaptchaEnterpriseToken HTTP 200, gemini-3.8-flash HTTP 500, gemini-3.5-flash HTTP 200. Analysis completed, UI showed Cloud (IN_CLOUD). Single run — not an availability guarantee.",
      },
      {
        kind: "added",
        text: "Login route with Supabase auth, useAuth hook, and evaluation route guard.",
      },
      {
        kind: "added",
        text: "Evaluation Workspace route and panel with import/export, seed JSON with verified evidence, and criterion descriptions.",
      },
      {
        kind: "fixed",
        text: "Limited-use App Check tokens for Firebase AI Logic — resolves 401 on generateContent.",
      },
      {
        kind: "fixed",
        text: "Debug token read via loadEnv in vite.config.ts — process.env does not load .env.local.",
      },
      {
        kind: "fixed",
        text: "Debug token removed from production bundle — build-time define instead of VITE_* variable.",
      },
      {
        kind: "fixed",
        text: "/login and /evaluation routes: auth moved to client-side useEffect; beforeLoad was running on server causing 404.",
      },
    ],
  },
  {
    version: "0.3.2",
    label: "App Check & model chain",
    date: "2026-11-19",
    commit: "4f88d44",
    status: "stable",
    summary:
      "Multi-model fallback chain (3.8 → 3.7 → 3.6 → 3.5-flash-lite) with per-model retry and exponential backoff. App Check uses ReCaptchaEnterpriseProvider in all envs. DOCX/XLSX support and evidence comparison added.",
    icon: Shield,
    iconColor: "var(--pm-amber)",
    changes: [
      {
        kind: "added",
        text: "Multi-model fallback chain: gemini-3.8-flash → gemini-3.7-flash → gemini-3.6-flash → gemini-3.5-flash-lite. Retry with exponential backoff for HTTP 429/500/502/503.",
      },
      {
        kind: "fixed",
        text: "App Check uses ReCaptchaEnterpriseProvider in all environments. Debug bypass via window.FIREBASE_APPCHECK_DEBUG_TOKEN only in DEV.",
      },
      {
        kind: "added",
        text: "DOCX and XLSX support via Mammoth and ExcelJS. Evidence comparison: attach bidder evidence to requirements and compare with selected inference mode.",
      },
      {
        kind: "fixed",
        text: "App Check 401 detected and shown as actionable recovery message in EN/PT/ES. isInvalidFirebaseAppCheckTokenError helper added.",
      },
      {
        kind: "fixed",
        text: "On-device timeout recovery: smaller chunks, 120 s budget, explicit Cloud AI switch.",
      },
      {
        kind: "fixed",
        text: "VITE_FIREBASE_PROJECT_ID trimmed to prevent %20 in Firebase AI Logic URLs.",
      },
    ],
  },
  {
    version: "0.3.1",
    label: "Hybrid fallback & on-device fixes",
    date: "2026-11-18",
    commit: "d2b0356",
    status: "stable",
    summary:
      "Generation timeout increased from 20 s to 60 s and budget from 60 s to 180 s for on-device latency. Hybrid mode pre-selects correctly. responseConstraint removed from on-device params.",
    icon: Wrench,
    iconColor: "var(--pm-purple)",
    changes: [
      {
        kind: "fixed",
        text: "GENERATION_TIMEOUT_MS 20 s → 60 s; TOTAL_GENERATION_BUDGET_MS 60 s → 180 s. On-device Chrome Prompt API is significantly slower than cloud.",
      },
      {
        kind: "fixed",
        text: "processingChoice pre-selects hybrid if Firebase configured, local otherwise. Was initialised as demo causing QA panel to show preference = null.",
      },
      {
        kind: "fixed",
        text: "responseConstraint and onDeviceParams removed from createTenderModel. Chrome Prompt API does not support JSON schema constraint or responseMimeType.",
      },
      {
        kind: "fixed",
        text: "On-device plain-text QA responses: relaxed Zod schema, fallback wraps raw text as answer field.",
      },
      {
        kind: "fixed",
        text: "SSR hydration mismatch: LocaleProvider initialises to en, syncs from localStorage in useEffect.",
      },
      {
        kind: "fixed",
        text: "Hybrid analysis retried in cloud after device session failure.",
      },
    ],
  },
  {
    version: "0.3.0",
    label: "Guided Tour & ElevenLabs narration",
    date: "2026-11-16",
    commit: "548965a",
    status: "stable",
    summary:
      "9-step guided tour with spotlight, keyboard navigation, and focus management. ElevenLabs TTS narration per step via server function. Auto-launches on first visit.",
    icon: Map,
    iconColor: "var(--pm-blue)",
    changes: [
      {
        kind: "added",
        text: "GuidedTour.tsx: 9-step onboarding overlay. Spotlight with OKLCH overlay, smooth CSS transitions. Dismissed state in localStorage. Keyboard navigation (← →, Enter, Escape). aria-modal dialog semantics. Replayable via Take a tour in sidebar.",
      },
      {
        kind: "added",
        text: "ElevenLabs narration: server function tourNarration.functions.ts, per-step cache, mute button. Availability check in Integrations screen.",
      },
      {
        kind: "added",
        text: "Auto-launch guided tour on first visit. Build version, commit hash, and UTC timestamp in sidebar footer.",
      },
      {
        kind: "added",
        text: "ChangelogPage route at /changelog with Keep a Changelog format.",
      },
      {
        kind: "added",
        text: "GitHub repo link in sidebar build info — discoverable by judges without login.",
      },
    ],
  },
  {
    version: "0.2.0",
    label: "Document Q&A & OCR",
    date: "2026-11-16",
    commit: "0b6945d",
    status: "stable",
    summary:
      "Ask questions about any tender document and get structured answers separating facts from hypotheses. Optional LlamaParse OCR for scanned PDFs. Optional Firecrawl external legal research.",
    icon: Mic,
    iconColor: "var(--pm-green)",
    changes: [
      {
        kind: "added",
        text: "DocumentQaPanel.tsx: answers structured as stated facts / working hypotheses / still-to-verify. Cited excerpts verified against extracted page text. Page citations withheld when pagination is unverified.",
      },
      {
        kind: "added",
        text: "Browser speech input via Web Speech API. Transcript not sent to AI until user submits. Per-answer TTS via browser speech synthesis.",
      },
      {
        kind: "added",
        text: "Firecrawl external legal research (server-side only, legalResearch.functions.ts). Off by default; separate consent. Sends only question + jurisdiction + country code — never the PDF.",
      },
      {
        kind: "added",
        text: "LlamaParse OCR: optional path for scanned/sparse PDFs. Per-document consent independent of Firebase cloud consent. Unverified citations flagged for human review.",
      },
      {
        kind: "added",
        text: "Suggested questions dropdown in DocumentQaPanel (EN/PT/ES, 6 questions, keyboard accessible).",
      },
      {
        kind: "added",
        text: "Unit tests: ocr-review.test.ts, document-qa.test.ts, ocr-normalize.test.ts.",
      },
    ],
  },
  {
    version: "0.1.0",
    label: "Core product",
    date: "2026-11-15",
    commit: "ab25e1a",
    status: "stable",
    summary:
      "Full four-screen application — Dashboard, Document analysis, Compliance matrix, and Processing & privacy — with Firebase AI Logic hybrid inference, in-browser PDF extraction, source verification, and CSV/JSON export.",
    icon: Zap,
    iconColor: "var(--pm-amber)",
    changes: [
      {
        kind: "added",
        text: "Four-screen SPA: Dashboard, Document analysis, Compliance matrix, Processing & privacy.",
      },
      {
        kind: "added",
        text: "Firebase AI Logic: PREFER_ON_DEVICE for hybrid, ONLY_ON_DEVICE for local, ONLY_IN_CLOUD for cloud. Actual inference source surfaced after every analysis. App Check with ReCaptchaEnterpriseProvider.",
      },
      {
        kind: "added",
        text: "In-browser PDF extraction via PDF.js. One string per page. 20 MB limit enforced before extraction.",
      },
      {
        kind: "added",
        text: "Tender analysis: requirements, deadlines, specifications, risks, missing information, inconsistencies. Citations verified against extracted page text.",
      },
      {
        kind: "added",
        text: "Compliance matrix: per-requirement review tracking (pending / reviewed / satisfied / unclear), review notes, Export CSV.",
      },
      {
        kind: "added",
        text: "Multilingual UI — EN / PT / ES. i18n system with LocaleProvider, useLocale(), and t() hooks. Locale persisted to localStorage.",
      },
      {
        kind: "added",
        text: "Sample tender: fictional City of Northbridge NB-2026-114 (6 pages, 5 deliberate risks). DEMO_LABEL applied throughout UI.",
      },
      {
        kind: "added",
        text: "Design system: Manrope + DM Sans, navy/blue/white OKLCH color tokens. Apache License 2.0.",
      },
    ],
  },
  {
    version: "0.0.1",
    label: "Scaffold",
    date: "2026-11-13",
    commit: "2842fbf",
    status: "stable",
    summary: "TanStack Start TypeScript template. Amazon Q memory bank initialised.",
    icon: Package,
    iconColor: "var(--pm-muted)",
    changes: [
      { kind: "added", text: "TanStack Start TypeScript project scaffold." },
      {
        kind: "added",
        text: "Amazon Q memory bank: guidelines, structure, tech, product, issues-log, localization.",
      },
    ],
  },
];

// ─── sub-components ──────────────────────────────────────────────────────────

const KIND_META: Record<ChangeKind, { label: string; color: string; bg: string }> = {
  added: { label: "Added", color: "var(--pm-green)", bg: "var(--pm-green-pale)" },
  changed: { label: "Changed", color: "var(--pm-blue)", bg: "var(--pm-blue-pale)" },
  fixed: { label: "Fixed", color: "var(--pm-purple)", bg: "#f3f0ff" },
  removed: { label: "Removed", color: "var(--pm-red)", bg: "var(--pm-red-pale)" },
  security: { label: "Security", color: "var(--pm-amber)", bg: "var(--pm-amber-pale)" },
  note: { label: "Note", color: "var(--pm-muted)", bg: "#f5f7fb" },
};

const STATUS_META = {
  unreleased: { label: "Unreleased", bg: "var(--pm-amber-pale)", color: "var(--pm-amber)" },
  latest: { label: "Latest", bg: "var(--pm-blue-pale)", color: "var(--pm-blue)" },
  stable: { label: "Stable", bg: "var(--pm-green-pale)", color: "var(--pm-green)" },
};

function KindPill({ kind }: { kind: ChangeKind }) {
  const { label, color, bg } = KIND_META[kind];
  return (
    <span className="cl-pill" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function ReleaseCard({ release }: { release: Release }) {
  const Icon = release.icon;
  const status = STATUS_META[release.status];
  return (
    <article className="cl-release">
      <div className="cl-release-aside">
        <div className="cl-release-icon" style={{ color: release.iconColor }}>
          <Icon size={20} strokeWidth={2} />
        </div>
        {release.commit && (
          <a
            className="cl-commit-link"
            href={`https://github.com/maurolima-sys/ai-mind-law/commit/${release.commit}`}
            target="_blank"
            rel="noreferrer"
            title={`Commit ${release.commit}`}
          >
            <GitCommitHorizontal size={13} />
            <code>{release.commit.slice(0, 7)}</code>
          </a>
        )}
      </div>

      <div className="cl-release-body">
        <div className="cl-release-head">
          <div className="cl-release-title-row">
            <h2 className="cl-release-version">{release.version}</h2>
            <span className="cl-release-label">{release.label}</span>
            <span className="cl-status-pill" style={{ color: status.color, background: status.bg }}>
              {status.label}
            </span>
          </div>
          <time className="cl-release-date" dateTime={release.date}>
            {new Date(release.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </div>

        <p className="cl-release-summary">{release.summary}</p>

        <ul className="cl-change-list">
          {release.changes.map((change, i) => (
            <li key={i} className="cl-change-item">
              <KindPill kind={change.kind} />
              <span className="cl-change-text">{change.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function ChangelogPage() {
  return (
    <div className="cl-page">
      <header className="cl-header">
        <div className="cl-header-brand">
          <span className="cl-brand-mark">
            <BrainCircuit size={20} strokeWidth={2.2} />
          </span>
          <span className="cl-brand-name">PocketMind AI</span>
        </div>
        <Link to="/" className="cl-back-link">
          <ArrowLeft size={15} />
          Back to app
        </Link>
      </header>

      <main className="cl-main">
        <div className="cl-hero">
          <span className="cl-hero-icon">
            <ScrollText size={28} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="cl-hero-title">Changelog</h1>
            <p className="cl-hero-sub">
              Every version of PocketMind AI, what changed, and when. Format follows{" "}
              <a
                href="https://keepachangelog.com/en/1.1.0/"
                target="_blank"
                rel="noreferrer"
                className="cl-inline-link"
              >
                Keep a Changelog
              </a>
              .
            </p>
          </div>
        </div>

        <div className="cl-timeline">
          {RELEASES.map((release) => (
            <ReleaseCard key={release.version} release={release} />
          ))}
        </div>
      </main>

      <footer className="cl-footer">
        <Sparkles size={14} />
        <span>
          Built for{" "}
          <a
            href="https://firebasehybridaihackathon.devpost.com"
            target="_blank"
            rel="noreferrer"
            className="cl-inline-link"
          >
            #BuildHybridAI 2026
          </a>{" "}
          using Firebase AI Logic hybrid inference.
        </span>
      </footer>
    </div>
  );
}
