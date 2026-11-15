import {
  AlertCircle,
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Cloud,
  FileCheck2,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Table2,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { buildDemoDocument, DEMO_DOC_ID, DEMO_LABEL } from "@/data/sampleTender";
import { complianceCsv, downloadText } from "@/lib/services/csv";
import { formatBytes, validatePdf, extractPdfText } from "@/lib/services/documentProcessing";
import { isFirebaseConfigured } from "@/lib/services/firebaseAi";
import { analyzeTender } from "@/lib/services/tenderAnalysis";
import {
  CATEGORIES,
  STATUSES,
  type Analysis,
  type DocumentRecord,
  type Evidence,
  type Review,
  type ReviewStatus,
} from "@/lib/types";

type Screen = "overview" | "analysis" | "compliance" | "processing";
type ProcessingChoice = "demo" | "local" | "hybrid";
type FindingKind = "Requirement" | "Deadline" | "Specification" | "Risk" | "Missing information";

type Finding = {
  id: string;
  kind: FindingKind;
  title: string;
  description: string;
  page: number | null;
  excerpt: string | null;
  verified: boolean;
  confidence?: number;
  severity?: string;
  mandatory?: boolean;
};

const navigation: Array<{ id: Screen; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "analysis", label: "Document analysis", icon: FileText },
  { id: "compliance", label: "Compliance matrix", icon: Table2 },
  { id: "processing", label: "Processing & privacy", icon: ShieldCheck },
];

const screenCopy: Record<Screen, { title: string; subtitle: string }> = {
  overview: {
    title: "Your document intelligence workspace",
    subtitle: "Turn complex tenders into reviewable findings, with source evidence attached.",
  },
  analysis: {
    title: "Document analysis",
    subtitle: "Review extracted findings beside their source pages.",
  },
  compliance: {
    title: "Compliance matrix",
    subtitle: "Track each requirement against evidence and your team's review status.",
  },
  processing: {
    title: "Choose how your document is processed",
    subtitle: "Your file is read in this browser. You control whether AI may use cloud fallback.",
  },
};

function modeLabel(mode: Analysis["mode"] | undefined) {
  if (mode === "local") return "On-device";
  if (mode === "cloud") return "Cloud";
  if (mode === "hybrid") return "Hybrid";
  if (mode === "demo") return "Illustrative demo";
  return "Not analyzed";
}

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "purple";
  children: ReactNode;
}) {
  return <span className={`pm-badge pm-badge--${tone}`}>{children}</span>;
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  tone: "blue" | "purple" | "amber" | "green";
}) {
  return (
    <article className="pm-metric">
      <div className={`pm-metric-icon pm-metric-icon--${tone}`}>
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="pm-metric-copy">
        <span className="pm-metric-value">{value}</span>
        <span className="pm-metric-label">{label}</span>
        <span className="pm-metric-detail">{detail}</span>
      </div>
    </article>
  );
}

function findAnalysisItems(analysis: Analysis): Finding[] {
  return [
    ...analysis.requirements.map((item) => ({
      id: item.id,
      kind: "Requirement" as const,
      title: item.description,
      description: `${item.category} · ${item.mandatory ? "Mandatory" : "Optional"}`,
      page: item.evidence.page,
      excerpt: item.evidence.excerpt,
      verified: item.evidence.verified,
      confidence: item.confidence,
      mandatory: item.mandatory,
    })),
    ...analysis.deadlines.map((item) => ({
      id: item.id,
      kind: "Deadline" as const,
      title: item.description,
      description: item.date ?? "Date not specified",
      page: item.evidence.page,
      excerpt: item.evidence.excerpt,
      verified: item.evidence.verified,
    })),
    ...analysis.specifications.map((item) => ({
      id: item.id,
      kind: "Specification" as const,
      title: item.item,
      description: [item.quantity, item.unit, item.details].filter(Boolean).join(" · "),
      page: item.evidence.page,
      excerpt: item.evidence.excerpt,
      verified: item.evidence.verified,
    })),
    ...analysis.risks.map((item) => ({
      id: item.id,
      kind: "Risk" as const,
      title: item.title,
      description: item.explanation,
      page: item.evidence.page,
      excerpt: item.evidence.excerpt,
      verified: item.evidence.verified,
      severity: item.severity,
    })),
    ...analysis.missing.map((item, index) => ({
      id: `missing-${index}`,
      kind: "Missing information" as const,
      title: item,
      description: "Referenced or expected information was not found in the analyzed text.",
      page: null,
      excerpt: null,
      verified: false,
    })),
    ...analysis.inconsistencies.map((item, index) => ({
      id: `inconsistency-${index}`,
      kind: "Missing information" as const,
      title: "Potential inconsistency",
      description: item,
      page: null,
      excerpt: null,
      verified: false,
    })),
  ];
}

function modeSourceTone(
  mode: Analysis["mode"] | undefined,
): "green" | "blue" | "amber" | "purple" | "neutral" {
  if (mode === "local") return "green";
  if (mode === "cloud") return "blue";
  if (mode === "hybrid") return "purple";
  if (mode === "demo") return "amber";
  return "neutral";
}

function EvidenceStatus({ evidence }: { evidence: Evidence }) {
  return evidence.verified ? (
    <Badge tone="green">
      <Check size={12} /> Source verified
    </Badge>
  ) : (
    <Badge tone="amber">
      <AlertCircle size={12} /> Verify source
    </Badge>
  );
}

export function PocketMindApp() {
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => [buildDemoDocument()]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(DEMO_DOC_ID);
  const [screen, setScreen] = useState<Screen>("overview");
  const [search, setSearch] = useState("");
  const [filesByDocumentId, setFilesByDocumentId] = useState<Record<string, File>>({});
  const [processingChoice, setProcessingChoice] = useState<ProcessingChoice>("demo");
  const [cloudConsent, setCloudConsent] = useState(false);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressDetail, setProgressDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [activeFinding, setActiveFinding] = useState("all");
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? documents[0];
  const file = filesByDocumentId[selectedDocumentId] ?? null;
  const analysis = selectedDocument?.analysis;
  const firebaseConfigured = isFirebaseConfigured();
  const allFindings = useMemo(() => (analysis ? findAnalysisItems(analysis) : []), [analysis]);
  const visibleFindings = allFindings.filter((finding) => {
    const matchesTab =
      activeFinding === "all" || finding.kind.toLowerCase().startsWith(activeFinding);
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [finding.title, finding.description, finding.excerpt ?? ""].some((value) =>
        value.toLowerCase().includes(query),
      );
    return matchesTab && matchesSearch;
  });
  const requirements = analysis?.requirements ?? [];
  const pendingReviews = requirements.filter(
    (requirement) => (reviews[requirement.id]?.status ?? "pending") === "pending",
  ).length;
  const selectedRequirement =
    requirements.find((requirement) => requirement.id === selectedRequirementId) ?? requirements[0];
  const currentPageText = selectedDocument?.pages[activePage - 1] ?? "";
  const currentScreenCopy = screenCopy[screen];

  function addPdf(selectedFile: File | undefined) {
    if (!selectedFile) return;
    const validationError = validatePdf(selectedFile);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const id = `upload-${Date.now()}`;
    const newDocument: DocumentRecord = {
      id,
      name: selectedFile.name,
      size: selectedFile.size,
      source: "upload",
      pages: [],
      addedAt: new Date().toISOString(),
    };
    setDocuments((current) => [newDocument, ...current.filter((document) => document.id !== id)]);
    setSelectedDocumentId(id);
    setFilesByDocumentId((current) => ({ ...current, [id]: selectedFile }));
    setActivePage(1);
    setProcessingChoice("local");
    setCloudConsent(false);
    setErrorMessage("");
    setScreen("processing");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addPdf(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addPdf(event.dataTransfer.files[0]);
  }

  function openDemo() {
    setSelectedDocumentId(DEMO_DOC_ID);
    setErrorMessage("");
    setScreen("analysis");
  }

  function updateReview(id: string, patch: Partial<Review>) {
    setReviews((current) => ({
      ...current,
      [id]: { status: current[id]?.status ?? "pending", notes: current[id]?.notes ?? "", ...patch },
    }));
  }

  async function runAnalysis() {
    if (!file || !selectedDocument) {
      setErrorMessage("Choose a PDF before starting an analysis.");
      return;
    }
    if (processingChoice === "demo") {
      setErrorMessage(
        "Demo mode uses only the fictional sample tender. Choose on-device or hybrid processing to analyze your PDF.",
      );
      return;
    }
    if (processingChoice === "hybrid" && !cloudConsent) {
      setErrorMessage("Allow cloud fallback explicitly, or choose on-device only.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    setProgressDetail("Reading PDF text in this browser");
    try {
      const pages = await extractPdfText(file, (completed, total) => {
        setProgressDetail(`Extracting text from page ${completed} of ${total}`);
      });
      if (!pages.some((page) => page.trim())) {
        throw new Error(
          "No selectable text was found in this PDF. Scanned-document OCR is not available yet.",
        );
      }

      const result = await analyzeTender(pages, processingChoice === "hybrid", ({ detail }) => {
        setProgressDetail(detail);
      });
      const updatedDocument: DocumentRecord = {
        ...selectedDocument,
        pages,
        analysis: result,
      };
      setDocuments((current) =>
        current.map((document) =>
          document.id === updatedDocument.id ? updatedDocument : document,
        ),
      );
      setActivePage(1);
      setSelectedRequirementId(null);
      setActiveFinding("all");
      setScreen("analysis");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(`Analysis could not be completed. ${detail}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function exportAnalysis() {
    if (!analysis || !selectedDocument) return;
    downloadText(
      `${selectedDocument.name.replace(/\.pdf$/i, "")}-analysis.json`,
      JSON.stringify({ document: selectedDocument.name, analysis }, null, 2),
      "application/json;charset=utf-8",
    );
  }

  if (!selectedDocument) {
    return (
      <main className="pm-empty-analysis">
        The workspace has no selected document. Refresh the page to restore the sample workspace.
      </main>
    );
  }

  return (
    <div className="pm-app">
      <aside className="pm-sidebar">
        <div className="pm-brand">
          <div className="pm-brand-mark">
            <BrainCircuit size={21} strokeWidth={2.2} />
          </div>
          <div>
            <span className="pm-brand-name">PocketMind AI</span>
            <span className="pm-brand-tagline">Tender intelligence</span>
          </div>
        </div>

        <div className="pm-side-caption">Workspace</div>
        <nav className="pm-navigation" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`pm-nav-item${screen === id ? " is-active" : ""}`}
              aria-current={screen === id ? "page" : undefined}
              onClick={() => setScreen(id)}
            >
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="pm-sidebar-spacer" />
        <div className="pm-privacy-note">
          <Shield size={21} strokeWidth={1.8} />
          <div>
            <strong>Privacy by choice</strong>
            <span>Cloud use is always explicit.</span>
          </div>
        </div>
        <div className="pm-workspace-user">
          <div className="pm-avatar">PM</div>
          <div>
            <strong>Procurement workspace</strong>
            <span>Local browser session</span>
          </div>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </aside>

      <div className="pm-main">
        <header className="pm-topbar">
          <div className="pm-mobile-brand">
            <div className="pm-brand-mark">
              <BrainCircuit size={19} />
            </div>
            <span>PocketMind AI</span>
          </div>
          <label className="pm-search">
            <Search size={17} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search documents, requirements, risks..."
              aria-label="Search current workspace"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </label>
          <div className="pm-topbar-right">
            <Badge tone={firebaseConfigured ? "green" : "amber"}>
              <span className="pm-status-dot" />
              {firebaseConfigured ? "Client config present" : "Demo workspace"}
            </Badge>
            <div className="pm-avatar pm-avatar--small">PM</div>
          </div>
        </header>

        <main className="pm-content">
          <div className="pm-page-heading">
            <div>
              <h1>{currentScreenCopy.title}</h1>
              <p>{currentScreenCopy.subtitle}</p>
            </div>
            {screen !== "processing" && (
              <button
                className="pm-button pm-button--primary"
                type="button"
                onClick={() => setScreen("processing")}
              >
                <Upload size={16} /> Add a document
              </button>
            )}
          </div>

          {selectedDocument?.source === "demo" && screen !== "processing" && (
            <div className="pm-demo-banner" role="note">
              <Sparkles size={17} />
              <div>
                <strong>Illustrative sample</strong>
                <span>{DEMO_LABEL}</span>
              </div>
              <button
                type="button"
                onClick={() => setScreen("processing")}
                aria-label="Open processing options"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          )}

          {screen === "overview" && (
            <OverviewScreen
              documents={documents}
              selectedDocument={selectedDocument}
              analysis={analysis}
              pendingReviews={pendingReviews}
              reviews={reviews}
              search={search}
              onOpenAnalysis={() => setScreen("analysis")}
              onOpenProcessing={() => setScreen("processing")}
              onSelectDocument={(id) => {
                setSelectedDocumentId(id);
                setActivePage(1);
                setActiveFinding("all");
                const nextDocument = documents.find((document) => document.id === id);
                setScreen(id === DEMO_DOC_ID || nextDocument?.analysis ? "analysis" : "processing");
              }}
            />
          )}
          {screen === "analysis" && (
            <AnalysisScreen
              document={selectedDocument}
              analysis={analysis}
              findings={visibleFindings}
              totalFindings={allFindings.length}
              activeFinding={activeFinding}
              activePage={activePage}
              pageText={currentPageText}
              search={search}
              onSelectFilter={setActiveFinding}
              onSelectPage={setActivePage}
              onOpenProcessing={() => setScreen("processing")}
              onExport={exportAnalysis}
            />
          )}
          {screen === "compliance" && (
            <ComplianceScreen
              analysis={analysis}
              reviews={reviews}
              search={search}
              selectedRequirement={selectedRequirement}
              selectedRequirementId={selectedRequirementId}
              onSelectRequirement={setSelectedRequirementId}
              onUpdateReview={updateReview}
              onExport={() => {
                if (!analysis) return;
                downloadText(
                  "pocketmind-compliance.csv",
                  complianceCsv(analysis.requirements, reviews),
                );
              }}
              onOpenProcessing={() => setScreen("processing")}
            />
          )}
          {screen === "processing" && (
            <ProcessingScreen
              document={selectedDocument}
              file={file}
              choice={processingChoice}
              cloudConsent={cloudConsent}
              firebaseConfigured={firebaseConfigured}
              isAnalyzing={isAnalyzing}
              progressDetail={progressDetail}
              errorMessage={errorMessage}
              inputRef={fileInputRef}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onSelectChoice={(choice) => {
                setProcessingChoice(choice);
                setErrorMessage("");
              }}
              onCloudConsentChange={(checked) => {
                setCloudConsent(checked);
                setErrorMessage("");
              }}
              onRunAnalysis={runAnalysis}
              onOpenDemo={openDemo}
              onClearError={() => setErrorMessage("")}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewScreen({
  documents,
  selectedDocument,
  analysis,
  pendingReviews,
  reviews,
  search,
  onOpenAnalysis,
  onOpenProcessing,
  onSelectDocument,
}: {
  documents: DocumentRecord[];
  selectedDocument: DocumentRecord;
  analysis: Analysis | undefined;
  pendingReviews: number;
  reviews: Record<string, Review>;
  search: string;
  onOpenAnalysis: () => void;
  onOpenProcessing: () => void;
  onSelectDocument: (id: string) => void;
}) {
  const filteredDocuments = documents.filter((document) =>
    document.name.toLowerCase().includes(search.toLowerCase()),
  );
  const criticalRisks = analysis?.risks.filter((risk) => risk.severity === "Critical").length ?? 0;
  const verifiedRequirements =
    analysis?.requirements.filter((requirement) => requirement.evidence.verified).length ?? 0;

  return (
    <div className="pm-screen">
      <section className="pm-metrics-grid" aria-label="Workspace summary">
        <Metric
          icon={FileText}
          label="Documents in workspace"
          value={documents.length}
          detail="Files in this browser session"
          tone="blue"
        />
        <Metric
          icon={ClipboardCheck}
          label={
            analysis?.mode === "demo" ? "Prepared sample requirements" : "Requirements extracted"
          }
          value={analysis?.requirements.length ?? 0}
          detail={
            analysis?.mode === "demo"
              ? "Illustrative prepared findings"
              : `${verifiedRequirements} with source-verified excerpts`
          }
          tone="purple"
        />
        <Metric
          icon={AlertCircle}
          label="Critical risks"
          value={criticalRisks}
          detail="Flagged for human review"
          tone="amber"
        />
        <Metric
          icon={CheckCircle2}
          label="Pending reviews"
          value={pendingReviews}
          detail="Requirements awaiting a decision"
          tone="green"
        />
      </section>

      <div className="pm-overview-grid">
        <section className="pm-panel pm-recent-panel">
          <div className="pm-panel-heading">
            <div>
              <h2>Recent tender documents</h2>
              <p>Files currently available in this browser session.</p>
            </div>
            <button className="pm-link-button" type="button" onClick={onOpenProcessing}>
              Add document <ArrowRight size={15} />
            </button>
          </div>
          {filteredDocuments.length > 0 ? (
            <div className="pm-table-wrap">
              <table className="pm-table pm-documents-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Pages</th>
                    <th>Processing</th>
                    <th>Status</th>
                    <th aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr
                      key={document.id}
                      onClick={() => onSelectDocument(document.id)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          onSelectDocument(document.id);
                      }}
                    >
                      <td>
                        <div className="pm-file-cell">
                          <span className="pm-file-icon">
                            <FileText size={17} />
                          </span>
                          <span>
                            <strong>{document.name}</strong>
                            <small>{formatBytes(document.size)}</small>
                          </span>
                        </div>
                      </td>
                      <td>{document.pages.length || "—"}</td>
                      <td>
                        <Badge
                          tone={
                            document.analysis?.mode === "local"
                              ? "green"
                              : document.analysis?.mode === "demo"
                                ? "amber"
                                : "blue"
                          }
                        >
                          {modeLabel(document.analysis?.mode)}
                        </Badge>
                      </td>
                      <td>
                        {document.analysis ? (
                          <Badge tone={document.analysis.mode === "demo" ? "amber" : "green"}>
                            {document.analysis.mode === "demo" ? "Sample analysis" : "Analyzed"}
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Not analyzed</Badge>
                        )}
                      </td>
                      <td>
                        <button
                          className="pm-icon-button"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectDocument(document.id);
                          }}
                          aria-label={`Open ${document.name}`}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="pm-empty-state">
              <Search size={22} />
              <strong>No matching documents</strong>
              <span>Try a different search term.</span>
            </div>
          )}
          <div className="pm-panel-foot">
            <span>
              Showing {filteredDocuments.length} of {documents.length} documents
            </span>
            <button className="pm-text-button" type="button" onClick={onOpenAnalysis}>
              Open current analysis
            </button>
          </div>
        </section>

        <aside className="pm-overview-side">
          <button className="pm-upload-tile" type="button" onClick={onOpenProcessing}>
            <span className="pm-upload-tile-icon">
              <Upload size={23} />
            </span>
            <strong>Upload a tender</strong>
            <span>Extract selectable text from a PDF in your browser.</span>
            <span className="pm-button pm-button--primary">
              Choose processing mode <ArrowRight size={16} />
            </span>
            <small>PDF only · maximum 20 MB · OCR not available</small>
          </button>

          <section className="pm-panel pm-review-panel">
            <div className="pm-panel-heading">
              <div>
                <h2>Review queue</h2>
                <p>Findings that need human attention.</p>
              </div>
              <span className="pm-count-bubble">{pendingReviews}</span>
            </div>
            {analysis?.requirements.length ? (
              <div className="pm-review-list">
                {analysis.requirements
                  .filter((item) => (reviews[item.id]?.status ?? "pending") === "pending")
                  .slice(0, 4)
                  .map((item) => (
                    <button
                      type="button"
                      className="pm-review-item"
                      key={item.id}
                      onClick={onOpenAnalysis}
                    >
                      <span className="pm-review-icon">
                        <FileCheck2 size={16} />
                      </span>
                      <span>
                        <strong>{item.description}</strong>
                        <small>
                          {item.evidence.verified
                            ? `Source verified · page ${item.evidence.page}`
                            : "Evidence needs verification"}
                        </small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                {pendingReviews === 0 && (
                  <div className="pm-empty-inline">
                    <CheckCircle2 size={17} /> All requirements are reviewed.
                  </div>
                )}
              </div>
            ) : (
              <div className="pm-empty-inline">Analyze a document to create a review queue.</div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function AnalysisScreen({
  document,
  analysis,
  findings,
  totalFindings,
  activeFinding,
  activePage,
  pageText,
  search,
  onSelectFilter,
  onSelectPage,
  onOpenProcessing,
  onExport,
}: {
  document: DocumentRecord;
  analysis: Analysis | undefined;
  findings: Finding[];
  totalFindings: number;
  activeFinding: string;
  activePage: number;
  pageText: string;
  search: string;
  onSelectFilter: (filter: string) => void;
  onSelectPage: (page: number) => void;
  onOpenProcessing: () => void;
  onExport: () => void;
}) {
  const filterOptions = [
    { id: "all", label: "All findings", count: totalFindings },
    { id: "requirement", label: "Requirements", count: analysis?.requirements.length ?? 0 },
    { id: "deadline", label: "Deadlines", count: analysis?.deadlines.length ?? 0 },
    { id: "specification", label: "Specifications", count: analysis?.specifications.length ?? 0 },
    { id: "risk", label: "Risks", count: analysis?.risks.length ?? 0 },
    {
      id: "missing",
      label: "Missing & inconsistencies",
      count: (analysis?.missing.length ?? 0) + (analysis?.inconsistencies.length ?? 0),
    },
  ];

  if (!analysis) {
    return <EmptyAnalysis onOpenProcessing={onOpenProcessing} />;
  }

  return (
    <div className="pm-analysis-screen">
      <div className="pm-document-toolbar">
        <div className="pm-document-title">
          <span className="pm-file-icon pm-file-icon--large">
            <FileText size={20} />
          </span>
          <div>
            <h2>{document.name}</h2>
            <span>
              {document.source === "demo" ? "Fictional sample" : "PDF document"} ·{" "}
              {document.pages.length} pages · {formatBytes(document.size)}
            </span>
          </div>
          <Badge tone={analysis.mode === "demo" ? "amber" : modeSourceTone(analysis.mode)}>
            {modeLabel(analysis.mode)}
          </Badge>
        </div>
        <button className="pm-button pm-button--dark" type="button" onClick={onExport}>
          <ArrowDownToLine size={16} /> Export JSON
        </button>
      </div>

      {analysis.mode === "demo" && (
        <div className="pm-inline-warning">
          <Sparkles size={16} />
          <span>
            This prepared analysis is simulated and illustrative; it was not generated from the
            sample PDF.
          </span>
        </div>
      )}

      <section className="pm-summary-strip">
        <div className="pm-summary-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <strong>Document summary</strong>
          <p>{analysis.summary}</p>
        </div>
        <div className="pm-summary-meta">
          <span>{analysis.engine}</span>
          <small>{new Date(analysis.generatedAt).toLocaleDateString()}</small>
        </div>
      </section>

      <div className="pm-filter-row" aria-label="Filter findings">
        {filterOptions.map((option) => (
          <button
            type="button"
            aria-pressed={activeFinding === option.id}
            className={`pm-filter-chip${activeFinding === option.id ? " is-selected" : ""}`}
            key={option.id}
            onClick={() => onSelectFilter(option.id)}
          >
            {option.label}
            <span>{option.count}</span>
          </button>
        ))}
      </div>

      <div className="pm-analysis-layout">
        <section className="pm-panel pm-source-panel">
          <div className="pm-panel-heading pm-source-heading">
            <div>
              <h2>Source document</h2>
              <p>Page text extracted in this browser.</p>
            </div>
            <div className="pm-page-controls">
              <button
                type="button"
                className="pm-icon-button"
                aria-label="Previous page"
                disabled={activePage <= 1}
                onClick={() => onSelectPage(activePage - 1)}
              >
                <ChevronLeft size={17} />
              </button>
              <span>
                Page <strong>{activePage}</strong> of {document.pages.length}
              </span>
              <button
                type="button"
                className="pm-icon-button"
                aria-label="Next page"
                disabled={activePage >= document.pages.length}
                onClick={() => onSelectPage(activePage + 1)}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <div className="pm-source-page">
            <div className="pm-source-page-head">
              <span>{document.name}</span>
              <span>Page {activePage}</span>
            </div>
            <pre>{pageText || "No text is available for this page."}</pre>
            <div className="pm-source-disclaimer">
              Extracted text may need manual verification against the original PDF.
            </div>
          </div>
        </section>

        <section className="pm-findings-panel">
          <div className="pm-findings-heading">
            <div>
              <h2>Findings</h2>
              <p>
                {findings.length} shown · {totalFindings} total
              </p>
            </div>
            <Badge tone={analysis.mode === "demo" ? "amber" : "blue"}>
              {analysis.mode === "demo" ? "Illustrative" : "AI-generated · review required"}
            </Badge>
          </div>
          <div className="pm-findings-list">
            {findings.length ? (
              findings.map((finding) => (
                <article
                  className={`pm-finding pm-finding--${finding.kind.toLowerCase().replaceAll(" ", "-")}`}
                  key={finding.id}
                >
                  <div className="pm-finding-top">
                    <Badge
                      tone={
                        finding.kind === "Risk"
                          ? finding.severity === "Critical" || finding.severity === "High"
                            ? "red"
                            : "amber"
                          : finding.kind === "Missing information"
                            ? "amber"
                            : "blue"
                      }
                    >
                      {finding.kind}
                    </Badge>
                    {finding.confidence !== undefined && (
                      <span className="pm-confidence">
                        {Math.round(finding.confidence * 100)}% confidence
                      </span>
                    )}
                    {finding.severity && (
                      <Badge
                        tone={
                          finding.severity === "Critical" || finding.severity === "High"
                            ? "red"
                            : "amber"
                        }
                      >
                        {finding.severity}
                      </Badge>
                    )}
                  </div>
                  <h3>{finding.title}</h3>
                  <p>{finding.description}</p>
                  <div className="pm-finding-evidence">
                    {finding.excerpt && <blockquote>“{finding.excerpt}”</blockquote>}
                    <div className="pm-finding-meta">
                      {finding.page !== null ? (
                        <button
                          className="pm-page-link"
                          type="button"
                          onClick={() => {
                            if (finding.page !== null) onSelectPage(finding.page);
                          }}
                        >
                          <FileText size={14} /> Page {finding.page}
                        </button>
                      ) : (
                        <span className="pm-muted-label">No source page</span>
                      )}
                      <EvidenceStatus
                        evidence={{
                          page: finding.page,
                          excerpt: finding.excerpt,
                          verified: finding.verified,
                        }}
                      />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="pm-empty-state">
                <Filter size={22} />
                <strong>
                  {search ? "No findings match your search" : "No findings in this category"}
                </strong>
                <span>Change the filter or search a different term.</span>
              </div>
            )}
          </div>
          <div className="pm-human-review-note">
            <CircleHelp size={16} />
            <span>
              AI findings are suggestions. Verify every cited passage before relying on it.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function EmptyAnalysis({ onOpenProcessing }: { onOpenProcessing: () => void }) {
  return (
    <section className="pm-panel pm-empty-analysis">
      <div className="pm-empty-illustration">
        <FilePlus2 size={30} />
      </div>
      <h2>No analysis for this document yet</h2>
      <p>Choose an on-device or hybrid processing mode to extract findings from a PDF.</p>
      <button className="pm-button pm-button--primary" type="button" onClick={onOpenProcessing}>
        Open processing options <ArrowRight size={16} />
      </button>
    </section>
  );
}

function ComplianceScreen({
  analysis,
  reviews,
  search,
  selectedRequirement,
  selectedRequirementId,
  onSelectRequirement,
  onUpdateReview,
  onExport,
  onOpenProcessing,
}: {
  analysis: Analysis | undefined;
  reviews: Record<string, Review>;
  search: string;
  selectedRequirement: Analysis["requirements"][number] | undefined;
  selectedRequirementId: string | null;
  onSelectRequirement: (id: string) => void;
  onUpdateReview: (id: string, patch: Partial<Review>) => void;
  onExport: () => void;
  onOpenProcessing: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const requirements = analysis?.requirements ?? [];
  const filteredRequirements = requirements.filter((requirement) => {
    const review = reviews[requirement.id]?.status ?? "pending";
    const matchesCategory = categoryFilter === "all" || requirement.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || review === statusFilter;
    const matchesSearch =
      !search ||
      [requirement.description, requirement.category, requirement.evidence.excerpt ?? ""].some(
        (value) => value.toLowerCase().includes(search.toLowerCase()),
      );
    return matchesCategory && matchesStatus && matchesSearch;
  });

  if (!analysis) return <EmptyAnalysis onOpenProcessing={onOpenProcessing} />;

  return (
    <div className="pm-compliance-screen">
      {analysis.mode === "demo" && (
        <div className="pm-inline-warning">
          <Sparkles size={16} />
          <span>Sample requirements and review results are fictional and illustrative.</span>
        </div>
      )}
      <div className="pm-compliance-toolbar">
        <label className="pm-table-search">
          <Search size={16} />{" "}
          <span aria-label="Search requirements">
            {search || "Search from the workspace bar..."}
          </span>
        </label>
        <label className="pm-select-wrap">
          <span className="sr-only">Category filter</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.currentTarget.value)}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </label>
        <label className="pm-select-wrap">
          <span className="sr-only">Review status filter</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="satisfied">Satisfied</option>
            <option value="unclear">Unclear</option>
          </select>
          <ChevronDown size={15} />
        </label>
        <button
          className="pm-button pm-button--primary pm-export-button"
          type="button"
          onClick={onExport}
        >
          <ArrowDownToLine size={16} /> Export CSV
        </button>
      </div>

      <div className="pm-compliance-layout">
        <section className="pm-panel pm-matrix-panel">
          <div className="pm-matrix-summary">
            <span>
              <strong>{requirements.length}</strong> requirements
            </span>
            <span>
              <strong>{requirements.filter((item) => item.evidence.verified).length}</strong> with
              verified evidence
            </span>
            <span>
              <strong>{filteredRequirements.length}</strong> shown
            </span>
          </div>
          {filteredRequirements.length ? (
            <div className="pm-table-wrap">
              <table className="pm-table pm-matrix-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Category</th>
                    <th>Mandatory</th>
                    <th>Evidence</th>
                    <th>Page</th>
                    <th>Review status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((requirement) => {
                    const review = reviews[requirement.id] ?? {
                      status: "pending" as ReviewStatus,
                      notes: "",
                    };
                    return (
                      <tr
                        key={requirement.id}
                        className={selectedRequirementId === requirement.id ? "is-selected" : ""}
                      >
                        <td>
                          <button
                            className="pm-requirement-select"
                            type="button"
                            onClick={() => onSelectRequirement(requirement.id)}
                          >
                            {requirement.description}
                          </button>
                        </td>
                        <td>
                          <Badge tone="purple">{requirement.category}</Badge>
                        </td>
                        <td>
                          <Badge tone={requirement.mandatory ? "red" : "neutral"}>
                            {requirement.mandatory ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td>
                          {requirement.evidence.excerpt ? (
                            <span
                              className={
                                requirement.evidence.verified
                                  ? "pm-verified-text"
                                  : "pm-unverified-text"
                              }
                            >
                              {requirement.evidence.verified ? "Verified" : "Check excerpt"}
                            </span>
                          ) : (
                            <span className="pm-muted-label">Not provided</span>
                          )}
                        </td>
                        <td>{requirement.evidence.page ?? "—"}</td>
                        <td>
                          <label className="pm-status-select">
                            <span className="sr-only">
                              Review status for {requirement.description}
                            </span>
                            <select
                              value={review.status}
                              onChange={(event) => {
                                const status = STATUSES.find(
                                  (candidate) => candidate === event.currentTarget.value,
                                );
                                if (status) onUpdateReview(requirement.id, { status });
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="satisfied">Satisfied</option>
                              <option value="unclear">Unclear</option>
                            </select>
                            <ChevronDown size={14} />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="pm-empty-state">
              <Search size={21} />
              <strong>No requirements match these filters</strong>
              <span>Adjust the filters or search terms.</span>
            </div>
          )}
          <div className="pm-panel-foot">
            <span>Review status is held in this browser session only.</span>
            <span>
              {filteredRequirements.length} of {requirements.length}
            </span>
          </div>
        </section>

        <aside className="pm-panel pm-evidence-panel">
          <div className="pm-panel-heading">
            <div>
              <h2>Source evidence</h2>
              <p>Selected requirement</p>
            </div>
            <FileCheck2 size={18} />
          </div>
          {selectedRequirement ? (
            <div className="pm-evidence-detail">
              <strong>{selectedRequirement.description}</strong>
              <div className="pm-evidence-meta">
                <Badge tone="purple">{selectedRequirement.category}</Badge>
                {selectedRequirement.evidence.page && (
                  <Badge tone="blue">Page {selectedRequirement.evidence.page}</Badge>
                )}
              </div>
              {selectedRequirement.evidence.excerpt ? (
                <blockquote>“{selectedRequirement.evidence.excerpt}”</blockquote>
              ) : (
                <div className="pm-evidence-missing">
                  No source excerpt was returned. Verify this requirement manually.
                </div>
              )}
              <EvidenceStatus evidence={selectedRequirement.evidence} />
              <label className="pm-notes-label">
                Review notes
                <textarea
                  value={reviews[selectedRequirement.id]?.notes ?? ""}
                  onChange={(event) =>
                    onUpdateReview(selectedRequirement.id, { notes: event.currentTarget.value })
                  }
                  placeholder="Add a note for your review..."
                  rows={4}
                />
              </label>
            </div>
          ) : (
            <div className="pm-empty-inline">Select a requirement to inspect its evidence.</div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ProcessingScreen({
  document,
  file,
  choice,
  cloudConsent,
  firebaseConfigured,
  isAnalyzing,
  progressDetail,
  errorMessage,
  inputRef,
  onFileChange,
  onDrop,
  onSelectChoice,
  onCloudConsentChange,
  onRunAnalysis,
  onOpenDemo,
  onClearError,
}: {
  document: DocumentRecord;
  file: File | null;
  choice: ProcessingChoice;
  cloudConsent: boolean;
  firebaseConfigured: boolean;
  isAnalyzing: boolean;
  progressDetail: string;
  errorMessage: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onSelectChoice: (choice: ProcessingChoice) => void;
  onCloudConsentChange: (checked: boolean) => void;
  onRunAnalysis: () => void;
  onOpenDemo: () => void;
  onClearError: () => void;
}) {
  return (
    <div className="pm-processing-screen">
      <div className="pm-processing-topline">
        <span>Processing options</span>
        <span className="pm-steps">
          <i className="is-current" />
          <i />
          <i />
        </span>
        <span>01 / 03</span>
      </div>
      <div className="pm-processing-options">
        <button
          type="button"
          className={`pm-mode-card${choice === "local" ? " is-selected" : ""}`}
          onClick={() => onSelectChoice("local")}
        >
          <span className="pm-mode-card-top">
            <span className="pm-radio-indicator" />
            On-device only<Badge tone="green">PRIVATE</Badge>
          </span>
          <span className="pm-mode-illustration pm-mode-illustration--local">
            <LockKeyhole size={32} />
          </span>
          <strong>Keep inference on this device</strong>
          <span className="pm-mode-description">
            PDF text is extracted in your browser. Firebase AI Logic asks Chrome's on-device model
            to analyze it. If that model is unavailable, the request fails instead of moving to
            cloud.
          </span>
          <span className="pm-mode-points">
            <span>
              <CheckCircle2 size={15} /> No cloud fallback
            </span>
            <span>
              <CheckCircle2 size={15} /> Requires supported desktop Chrome
            </span>
            <span>
              <CheckCircle2 size={15} /> Firebase App Check still applies
            </span>
          </span>
        </button>

        <button
          type="button"
          className={`pm-mode-card${choice === "hybrid" ? " is-selected" : ""}`}
          onClick={() => onSelectChoice("hybrid")}
        >
          <span className="pm-mode-card-top">
            <span className="pm-radio-indicator" />
            Hybrid inference<Badge tone="blue">ON-DEVICE FIRST</Badge>
          </span>
          <span className="pm-mode-illustration pm-mode-illustration--hybrid">
            <Cloud size={34} />
            <Sparkles size={18} />
          </span>
          <strong>Prefer on-device, allow fallback</strong>
          <span className="pm-mode-description">
            Firebase AI Logic uses the available on-device model first. If unavailable, it may send
            extracted text to Gemini 3.8 Flash in Google's cloud.
          </span>
          <span className="pm-mode-points">
            <span>
              <CheckCircle2 size={15} /> Actual source shown after analysis
            </span>
            <span>
              <CheckCircle2 size={15} /> Cloud use requires your consent
            </span>
            <span>
              <CheckCircle2 size={15} /> App Check required
            </span>
          </span>
        </button>

        <button
          type="button"
          className={`pm-mode-card${choice === "demo" ? " is-selected" : ""}`}
          onClick={() => onSelectChoice("demo")}
        >
          <span className="pm-mode-card-top">
            <span className="pm-radio-indicator" />
            Sample data<Badge tone="amber">DEMO</Badge>
          </span>
          <span className="pm-mode-illustration pm-mode-illustration--demo">
            <FileText size={35} />
          </span>
          <strong>Explore prepared findings</strong>
          <span className="pm-mode-description">
            View the fictional Northbridge street-lighting tender and its prepared analysis. No
            upload or model call occurs in this mode.
          </span>
          <span className="pm-mode-points">
            <span>
              <CheckCircle2 size={15} /> No Firebase setup needed
            </span>
            <span>
              <CheckCircle2 size={15} /> No real document processed
            </span>
            <span>
              <CheckCircle2 size={15} /> Sample clearly labeled
            </span>
          </span>
        </button>
      </div>

      {choice === "hybrid" && (
        <label className="pm-cloud-consent">
          <input
            type="checkbox"
            checked={cloudConsent}
            onChange={(event) => onCloudConsentChange(event.currentTarget.checked)}
          />
          <span className="pm-consent-check">
            <Check size={14} />
          </span>
          <span>
            <strong>I explicitly allow cloud fallback for this session.</strong>
            <small>
              If the on-device model is unavailable, extracted text from this PDF may be sent to
              Google's Gemini service through Firebase AI Logic. This setting resets when the page
              is reloaded.
            </small>
          </span>
        </label>
      )}

      <div className="pm-file-drop" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <input
          ref={inputRef}
          className="pm-visually-hidden"
          type="file"
          accept="application/pdf,.pdf"
          onChange={onFileChange}
          aria-label="Choose a PDF document"
        />
        {file ? (
          <div className="pm-chosen-file">
            <span className="pm-file-icon pm-file-icon--large">
              <FileText size={21} />
            </span>
            <div>
              <strong>{file.name}</strong>
              <span>{formatBytes(file.size)} · PDF · stored in this browser session</span>
            </div>
            <button
              className="pm-button pm-button--outline"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <FolderOpen size={15} /> Replace
            </button>
          </div>
        ) : (
          <div className="pm-drop-empty">
            <span className="pm-drop-icon">
              <Upload size={22} />
            </span>
            <strong>Drop a tender PDF here</strong>
            <span>or select a file from your device</span>
            <button
              className="pm-button pm-button--outline"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <FolderOpen size={15} /> Choose PDF
            </button>
            <small>PDF only · maximum 20 MB · selectable text required</small>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="pm-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button type="button" onClick={onClearError} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="pm-progress-status" role="status">
          <LoaderCircle size={17} className="pm-spin" />
          <span>{progressDetail || "Preparing analysis..."}</span>
        </div>
      )}

      {!firebaseConfigured && choice !== "demo" && (
        <div className="pm-setup-notice">
          <AlertCircle size={18} />
          <div>
            <strong>Firebase setup is needed for live analysis.</strong>
            <span>
              Configure a Firebase web app, enable Firebase AI Logic, and set App Check before
              analyzing real documents. Follow the setup steps in README.md.
            </span>
          </div>
        </div>
      )}

      <div className="pm-processing-footer">
        <div>
          <span className="pm-footer-label">Selected mode</span>
          <Badge tone={choice === "demo" ? "amber" : choice === "local" ? "green" : "blue"}>
            {choice === "demo"
              ? "Sample data"
              : choice === "local"
                ? "On-device only"
                : "Hybrid · consent required"}
          </Badge>
        </div>
        <div>
          <span className="pm-footer-label">Source reporting</span>
          <span className="pm-footer-value">
            <ShieldCheck size={17} /> Actual inference source appears with the results
          </span>
        </div>
        <div className="pm-footer-actions">
          {choice === "demo" ? (
            <button type="button" className="pm-button pm-button--primary" onClick={onOpenDemo}>
              Explore sample analysis <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="pm-button pm-button--primary"
              onClick={onRunAnalysis}
              disabled={isAnalyzing || !file || (choice === "hybrid" && !cloudConsent)}
            >
              {isAnalyzing ? (
                <>
                  <LoaderCircle size={16} className="pm-spin" /> Processing...
                </>
              ) : (
                <>
                  Analyze PDF <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
          <span>
            {choice === "demo"
              ? "No real document is processed."
              : choice === "local"
                ? "No cloud fallback will be used."
                : cloudConsent
                  ? "Cloud fallback consent is enabled for this session."
                  : "Enable cloud consent above to continue."}
          </span>
        </div>
      </div>

      <section className="pm-process-flow">
        <div>
          <h2>From document to reviewable findings</h2>
          <p>Every finding links back to a source excerpt so a person can verify it.</p>
        </div>
        <div className="pm-flow-steps">
          <div>
            <span>
              <FilePlus2 size={18} />
            </span>
            <strong>Choose PDF</strong>
            <small>File stays in browser</small>
          </div>
          <ArrowRight size={17} />
          <div>
            <span>
              <BrainCircuit size={18} />
            </span>
            <strong>Process text</strong>
            <small>Selected mode applies</small>
          </div>
          <ArrowRight size={17} />
          <div>
            <span>
              <ClipboardCheck size={18} />
            </span>
            <strong>Verify findings</strong>
            <small>Source excerpts checked</small>
          </div>
          <ArrowRight size={17} />
          <div>
            <span>
              <BadgeCheck size={18} />
            </span>
            <strong>Human review</strong>
            <small>Decisions stay yours</small>
          </div>
        </div>
      </section>
      {document.source === "demo" && (
        <p className="pm-current-sample">
          <Sparkles size={14} /> Current workspace document: {document.name}
        </p>
      )}
    </div>
  );
}
