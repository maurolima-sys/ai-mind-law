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
    version: "0.4.0",
    label: "Current release",
    date: "2026-11-19",
    commit: "ed19ed4",
    status: "latest",
    summary:
      "Version 0.4.0 separates demo and uploaded documents and records evidence verification, assessment, and human review independently. A production Cloud AI sample succeeded on 20 November 2026; availability is not guaranteed.",
    icon: Globe,
    iconColor: "var(--pm-purple)",
    changes: [
      {
        kind: "added",
        text: (
          <>
            <strong>Multilingual UI — EN / PT / ES</strong>. i18n system in{" "}
            <code>src/lib/i18n/</code>: <code>en.ts</code> (200+ keys, source of truth),{" "}
            <code>pt.ts</code>, <code>es.ts</code>, and <code>index.tsx</code> with{" "}
            <code>LocaleProvider</code>, <code>useLocale()</code>, and <code>useT()</code> hooks.
            Locale persisted to <code>localStorage</code> (<code>pocketmind.locale</code>).{" "}
            <code>{"{{placeholder}}"}</code> interpolation supported.
          </>
        ),
      },
      {
        kind: "added",
        text: (
          <>
            <strong>Language selector</strong> — compact flag + <code>&lt;select&gt;</code> dropdown
            in the top bar (<code>LanguageSelector.tsx</code>).
          </>
        ),
      },
      {
        kind: "changed",
        text: (
          <>
            All UI strings localised across <code>PocketMindApp.tsx</code>,{" "}
            <code>DocumentQaPanel.tsx</code>, <code>GuidedTour.tsx</code>; CSV export column headers
            and cell values (<code>csv.ts</code> now accepts a <code>t</code> parameter).
          </>
        ),
      },
      {
        kind: "fixed",
        text: "Runtime indicators distinguish a cloud response received in the session from configuration and on-device inference. Analyses without a recorded source stay unknown.",
      },
      {
        kind: "fixed",
        text: "Uploaded and demonstration document metrics and activity are separate. Risk filters, counts, and CSV identify each origin. The local library lists uploaded documents only.",
      },
      {
        kind: "changed",
        text: "The compliance matrix and CSV keep evidence verification, compliance assessment, and human review as separate states. Older “unclear” values are labeled as a previous status.",
      },
      {
        kind: "note",
        text: "AI prompt instructions remain in English. documentQa.ts instructs the model to reply in the language of the question. Sample tender text stays in English for v1.",
      },
      {
        kind: "note",
        text: "Production Cloud AI completed once on 2026-11-19 (cloud-fallback, gemini-3.5-flash-lite) against the fictional sample. A later production attempt returned HTTP 401 (App Check token is invalid). That dated success does not mean cloud inference is available now.",
      },
      {
        kind: "note",
        text: "On 2026-11-20, production build ed19ed4 completed a fictional-sample Cloud AI analysis: App Check exchange HTTP 200, gemini-3.8-flash HTTP 500, then gemini-3.5-flash HTTP 200. The UI reported Cloud (IN_CLOUD). On-device analysis failed with input too large; a real scanned-PDF LlamaParse test remains pending.",
      },
    ],
  },
  {
    version: "0.3.0",
    label: "Guided Tour & Docs",
    date: "2026-11-16",
    commit: "7657c0a",
    status: "stable",
    summary:
      "In-app guided tour walks new users through the full workflow in 9 steps without leaving the app. Complete user-facing documentation suite.",
    icon: Map,
    iconColor: "var(--pm-blue)",
    changes: [
      {
        kind: "added",
        text: (
          <>
            <strong>Guided Tour</strong> (<code>GuidedTour.tsx</code>) — 9-step onboarding overlay.
            Spotlight highlights target elements with smooth CSS transitions. Dismissed state
            persisted to <code>localStorage</code> (<code>pocketmind.tour.completed</code>
            ). Keyboard navigation (← →, Enter, Escape). Focus management and{" "}
            <code>aria-modal</code> dialog semantics. Replayable via a <strong>Take a tour</strong>{" "}
            button in the sidebar.
          </>
        ),
      },
      {
        kind: "added",
        text: "236 lines of tour CSS — spotlight ring with OKLCH overlay, popover enter animation (pm-tour-pop / pm-tour-modal-pop), progress buttons, skip link, and sidebar replay button.",
      },
      {
        kind: "added",
        text: (
          <>
            <strong>User-facing documentation</strong>: <code>docs/POCKETMIND_USER_GUIDE.md</code>{" "}
            (12 chapters, verbatim app UI strings, full NB-2026-114 walkthrough),{" "}
            <code>docs/POCKETMIND_VIDEO_STORYBOARD.md</code> (10 scenes, narration script, recording
            checklist), <code>docs/POCKETMIND_POWERPOINT.md</code> (12-slide deck with speaker
            notes).
          </>
        ),
      },
      {
        kind: "added",
        text: "README.md hackathon abstract (#BuildHybridAI 2026): problem statement, Firebase AI Logic runtime usage with file references, non-obvious use case argument, audience, and submission-period scope.",
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
      "Ask questions about any tender document and get structured answers that separate facts from hypotheses. Optional LlamaParse OCR for scanned PDFs and optional Firecrawl external legal research.",
    icon: Mic,
    iconColor: "var(--pm-green)",
    changes: [
      {
        kind: "added",
        text: (
          <>
            <strong>Document Q&A panel</strong> (<code>DocumentQaPanel.tsx</code>, 588 lines).
            Answers structured as stated facts / working hypotheses / still-to-verify. Cited
            excerpts verified against extracted page text. Page citations withheld when pagination
            is unverified.
          </>
        ),
      },
      {
        kind: "added",
        text: "Browser speech input — dictation via Web Speech API (Use microphone / Stop listening). Transcript not sent to AI until the user submits.",
      },
      {
        kind: "added",
        text: "Per-answer text-to-speech via browser speech synthesis (Read answer aloud / Stop reading).",
      },
      {
        kind: "added",
        text: (
          <>
            <strong>Firecrawl external legal research</strong> (server-side only,{" "}
            <code>legalResearch.functions.ts</code>). Off by default; requires separate consent
            checkbox. Sends only question + jurisdiction + country code — never the PDF. Results
            labeled "verify authority and current status".
          </>
        ),
      },
      {
        kind: "added",
        text: (
          <>
            <code>documentQa.ts</code> — model prompt separates facts, conditional hypotheses, and
            unresolved questions in structured JSON response. <code>verifyQuestionCitations</code>{" "}
            checks every quoted excerpt.
          </>
        ),
      },
      {
        kind: "added",
        text: (
          <>
            <strong>LlamaParse OCR</strong> — optional path for scanned/sparse PDFs (&lt; 100
            extracted chars, or ≥ 5 pages averaging &lt; 20 chars/page). Per-document consent
            independent of Firebase cloud consent. Unverified citations flagged for human review.
          </>
        ),
      },
      {
        kind: "added",
        text: (
          <>
            Unit tests: <code>ocr-review.test.ts</code> (80 lines), <code>document-qa.test.ts</code>{" "}
            (94 lines).
          </>
        ),
      },
      {
        kind: "changed",
        text: (
          <>
            <code>PocketMindApp.tsx</code> +227 lines — scanned-PDF detection flow, external OCR
            consent UI, pre-analysis Q&A view, <code>externalOcrAvailability</code> state.
          </>
        ),
      },
      {
        kind: "changed",
        text: (
          <>
            <code>styles.css</code> +371 lines — Q&A panel, citations, research sources, speech
            input, pagination note, inline error, composer styles.
          </>
        ),
      },
    ],
  },
  {
    version: "0.1.1",
    label: "OCR evidence review",
    date: "2026-11-16",
    commit: "dbfeaa5",
    status: "stable",
    summary:
      "Optional LlamaParse OCR stays behind a per-document consent gate. Citations without a page mapping are marked unverified for human review.",
    icon: ScrollText,
    iconColor: "var(--pm-purple)",
    changes: [
      {
        kind: "added",
        text: "ocrEvidence.ts normalizes LlamaParse output and marks citations unverified when page mapping is absent. ocr-review.test.ts covers that review path.",
      },
      {
        kind: "changed",
        text: "Scanned-PDF detection and the external OCR consent gate live in the processing flow. If consent is withheld, analysis continues from browser-extracted text.",
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
      "Full four-screen application — Dashboard, Document analysis, Compliance matrix, and Processing & privacy — with Firebase AI Logic hybrid inference, in-browser PDF extraction, and CSV/JSON export.",
    icon: Zap,
    iconColor: "var(--pm-amber)",
    changes: [
      {
        kind: "added",
        text: "Four-screen SPA: Dashboard, Document analysis, Compliance matrix, Processing & privacy.",
      },
      {
        kind: "added",
        text: "Dashboard — four metric cards (Documents in workspace, Requirements extracted, Critical risks, Pending reviews), Recent tender documents table with processing/status badges, Upload a tender tile, Review queue.",
      },
      {
        kind: "added",
        text: "Document analysis — filter chips (All findings / Requirements / Deadlines / Specifications / Risks / Missing & inconsistencies), two-column source/findings layout, per-finding page link, Source verified / Verify source badge, Export JSON.",
      },
      {
        kind: "added",
        text: "Compliance matrix — six-column table, category and status filters, Source evidence side panel with Review notes textarea, Export CSV.",
      },
      {
        kind: "added",
        text: (
          <>
            Processing & privacy — four mode cards (On-device only <code>PRIVATE</code>, Cloud AI{" "}
            <code>GEMINI</code>, Hybrid inference <code>ON-DEVICE FIRST</code>, Sample data{" "}
            <code>DEMO</code>). Explicit cloud consent checkbox (session-scoped, resets on reload).
            Process flow strip.
          </>
        ),
      },
      {
        kind: "added",
        text: (
          <>
            <strong>Firebase AI Logic</strong> (<code>firebaseAi.ts</code>, 112 lines) —{" "}
            <code>InferenceMode.PREFER_ON_DEVICE</code> for hybrid mode; <code>ON_DEVICE_ONLY</code>{" "}
            and <code>DEFAULT</code> for the other modes. Actual inference source (
            <code>on-device</code>, <code>cloud</code>, <code>cloud-fallback</code>) surfaced to the
            user after every analysis. Firebase shown as connected only after a real model response
            is received.
          </>
        ),
      },
      {
        kind: "added",
        text: "App Check — debug provider for local development (token to browser console, not committed). Production requires reCAPTCHA Enterprise.",
      },
      {
        kind: "added",
        text: (
          <>
            <strong>Tender analysis</strong> (<code>tenderAnalysis.ts</code>, 297 lines) —
            structured JSON prompt; requirements, deadlines, specifications, risks, missing
            information, inconsistencies. Citations verified against extracted page text via{" "}
            <code>verifyEvidence</code>.
          </>
        ),
      },
      {
        kind: "added",
        text: (
          <>
            <strong>In-browser PDF extraction</strong> (<code>documentProcessing.ts</code>) —
            PDF.js, one string per page, 20 MB limit enforced before extraction.
          </>
        ),
      },
      {
        kind: "added",
        text: "Sample tender (sampleTender.ts) — fictional City of Northbridge NB-2026-114 (6 pages, 5 deliberate risks). DEMO_LABEL applied throughout UI.",
      },
      {
        kind: "added",
        text: "Design system — Manrope (body) + Sora (display), navy/blue/white OKLCH color tokens, 2137-line styles.css baseline.",
      },
      {
        kind: "added",
        text: "PRODUCT.md, Apache License 2.0, Vercel deployment configuration, unit tests for CSV and tender analysis.",
      },
    ],
  },
  {
    version: "0.0.1",
    label: "Scaffold",
    date: "2026-11-13",
    commit: "2842fbf",
    status: "stable",
    summary: "TanStack Start TypeScript template.",
    icon: Package,
    iconColor: "var(--pm-muted)",
    changes: [{ kind: "added", text: "TanStack Start TypeScript project scaffold." }],
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
