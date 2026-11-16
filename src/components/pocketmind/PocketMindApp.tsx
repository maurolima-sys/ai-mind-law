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
  Compass,
  FileCheck2,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Search,
  ScrollText,
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
import { buildLabel } from "@/lib/buildInfo";
import { DocumentQaPanel } from "@/components/pocketmind/DocumentQaPanel";
import { GuidedTour, hasSeenTour } from "@/components/pocketmind/GuidedTour";
import { LanguageSelector } from "@/components/pocketmind/LanguageSelector";
import { complianceCsv, downloadText } from "@/lib/services/csv";
import { useT } from "@/lib/i18n";
import { formatBytes, validatePdf, extractPdfText } from "@/lib/services/documentProcessing";
import { isExternalOcrAvailable, runExternalOcr } from "@/lib/services/externalOcr";
import { isFirebaseConfigured } from "@/lib/services/firebaseAi";
import { markUnpaginatedEvidenceUnverified } from "@/lib/services/ocrEvidence";
import { shouldOfferExternalOcr } from "@/lib/services/ocrNormalize";
import { analyzeTender } from "@/lib/services/tenderAnalysis";
import { Link } from "@tanstack/react-router";
import {
  CATEGORIES,
  STATUSES,
  type Analysis,
  type DocumentRecord,
  type Evidence,
  type Review,
  type ReviewStatus,
  type InferencePreference,
  type ProcessingSource,
} from "@/lib/types";

type Screen = "overview" | "analysis" | "compliance" | "processing";
type ProcessingChoice = "demo" | InferencePreference;
type DocumentTextSource = "pdfjs" | "llamaparse";
type ExternalOcrAvailability = "checking" | "enabled" | "disabled" | "error";
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

const NAVIGATION_IDS: Array<{ id: Screen; icon: LucideIcon }> = [
  { id: "overview", icon: LayoutDashboard },
  { id: "analysis", icon: FileText },
  { id: "compliance", icon: Table2 },
  { id: "processing", icon: ShieldCheck },
];

function getProcessingSource(analysis: Analysis): ProcessingSource {
  if (analysis.processingSource) return analysis.processingSource;
  return analysis.mode === "local" ? "on-device" : analysis.mode;
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
      description: item.date ?? t("finding_date_not_specified"),
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
  source: Analysis["processingSource"] | undefined,
): "green" | "blue" | "amber" | "purple" | "neutral" {
  if (source === "on-device") return "green";
  if (source === "cloud") return "blue";
  if (source === "cloud-fallback") return "amber";
  if (source === "hybrid") return "purple";
  if (source === "demo") return "amber";
  return "neutral";
}

type TFn = ReturnType<typeof useT>;

function modeLabel(source: Analysis["processingSource"] | undefined, t: TFn): string {
  if (source === "on-device") return t("mode_on_device");
  if (source === "cloud") return t("mode_cloud");
  if (source === "cloud-fallback") return t("mode_cloud_fallback");
  if (source === "hybrid") return t("mode_hybrid");
  if (source === "demo") return t("mode_demo");
  return t("mode_not_analyzed");
}

function EvidenceStatus({ evidence }: { evidence: Evidence }) {
  const t = useT();
  return evidence.verified ? (
    <Badge tone="green">
      <Check size={12} /> {t("finding_source_verified")}
    </Badge>
  ) : (
    <Badge tone="amber">
      <AlertCircle size={12} /> {t("finding_verify_source")}
    </Badge>
  );
}

export function PocketMindApp() {
  const t = useT();
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => [buildDemoDocument()]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(DEMO_DOC_ID);
  const [screen, setScreen] = useState<Screen>("overview");
  const [search, setSearch] = useState("");
  const [filesByDocumentId, setFilesByDocumentId] = useState<Record<string, File>>({});
  const [processingChoice, setProcessingChoice] = useState<ProcessingChoice>("demo");
  const [cloudConsent, setCloudConsent] = useState(false);
  const [externalOcrConsentDocumentId, setExternalOcrConsentDocumentId] = useState<string | null>(
    null,
  );
  const [scannedDocumentId, setScannedDocumentId] = useState<string | null>(null);
  const [externalOcrAvailability, setExternalOcrAvailability] =
    useState<ExternalOcrAvailability>("checking");
  const [scannedTextByDocumentId, setScannedTextByDocumentId] = useState<Record<string, string[]>>(
    {},
  );
  const [documentTextSources, setDocumentTextSources] = useState<
    Record<string, DocumentTextSource>
  >({});
  const [documentPagination, setDocumentPagination] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [progressDetail, setProgressDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [activeFinding, setActiveFinding] = useState("all");
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [tourActive, setTourActive] = useState(() => !hasSeenTour());
  const tourButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? documents[0];
  const file = filesByDocumentId[selectedDocumentId] ?? null;
  const analysis = selectedDocument?.analysis;
  const firebaseConfigured = isFirebaseConfigured();
  const firebaseStatusLabel = !firebaseConfigured
    ? t("firebase_not_configured")
    : firebaseConnected
      ? t("firebase_connected")
      : t("firebase_configured");
  const firebaseStatusTone = !firebaseConfigured
    ? "amber"
    : firebaseConnected
      ? "green"
      : "neutral";
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
  const screenTitles: Record<Screen, { title: string; subtitle: string }> = {
    overview: { title: t("screen_overview_title"), subtitle: t("screen_overview_subtitle") },
    analysis: { title: t("screen_analysis_title"), subtitle: t("screen_analysis_subtitle") },
    compliance: { title: t("screen_compliance_title"), subtitle: t("screen_compliance_subtitle") },
    processing: { title: t("screen_processing_title"), subtitle: t("screen_processing_subtitle") },
  };
  const currentScreenCopy = screenTitles[screen];
  const navigation = [
    { id: "overview" as Screen, label: t("nav_dashboard"), icon: LayoutDashboard },
    { id: "analysis" as Screen, label: t("nav_analysis"), icon: FileText },
    { id: "compliance" as Screen, label: t("nav_compliance"), icon: Table2 },
    { id: "processing" as Screen, label: t("nav_processing"), icon: ShieldCheck },
  ];

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
    setExternalOcrConsentDocumentId(null);
    setScannedDocumentId(null);
    setExternalOcrAvailability("checking");
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

  async function extractTextOnly() {
    if (!selectedDocument || selectedDocument.source !== "upload") {
      setErrorMessage("Choose a PDF before extracting text.");
      return;
    }
    if (selectedDocument.pages.some((page) => page.trim())) {
      setScreen("analysis");
      return;
    }
    if (!file) {
      setErrorMessage("The selected PDF is no longer available. Choose it again to continue.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      const pages = await extractPdfText(file, (completed, total) => {
        setProgressDetail(`Extracting text from page ${completed} of ${total}`);
      });
      setDocuments((current) =>
        current.map((document) =>
          document.id === selectedDocument.id ? { ...document, pages } : document,
        ),
      );
      setDocumentTextSources((current) => ({ ...current, [selectedDocument.id]: "pdfjs" }));
      setDocumentPagination((current) => ({ ...current, [selectedDocument.id]: true }));
      setActivePage(1);

      if (shouldOfferExternalOcr(pages)) {
        setScannedDocumentId(selectedDocument.id);
        setScannedTextByDocumentId((current) => ({ ...current, [selectedDocument.id]: pages }));
        setExternalOcrConsentDocumentId(null);
        void checkExternalOcrStatus();
        return;
      }

      setScreen("analysis");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(`Text extraction could not be completed. ${detail}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function openDemo() {
    setSelectedDocumentId(DEMO_DOC_ID);
    setCloudConsent(false);
    setErrorMessage("");
    setScreen("analysis");
  }

  function updateReview(id: string, patch: Partial<Review>) {
    setReviews((current) => ({
      ...current,
      [id]: { status: current[id]?.status ?? "pending", notes: current[id]?.notes ?? "", ...patch },
    }));
  }

  async function checkExternalOcrStatus() {
    setExternalOcrAvailability("checking");
    try {
      setExternalOcrAvailability((await isExternalOcrAvailable()) ? "enabled" : "disabled");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown status check error.";
      setExternalOcrAvailability("error");
      setErrorMessage(`External OCR availability could not be checked. ${detail}`);
    }
  }

  async function analyzePages(pages: string[], textSource: DocumentTextSource, paginated: boolean) {
    if (!selectedDocument) {
      throw new Error("Choose a document before starting an analysis.");
    }
    if (processingChoice === "demo") {
      throw new Error("Demo mode never runs external OCR or Firebase AI analysis.");
    }
    const result = await analyzeTender(
      pages,
      processingChoice,
      ({ detail }) => setProgressDetail(detail),
      () => setFirebaseConnected(true),
    );
    const analysis = paginated ? result : markUnpaginatedEvidenceUnverified(result);
    const updatedDocument: DocumentRecord = {
      ...selectedDocument,
      pages,
      analysis,
    };
    setDocuments((current) =>
      current.map((document) => (document.id === updatedDocument.id ? updatedDocument : document)),
    );
    setDocumentTextSources((current) => ({ ...current, [updatedDocument.id]: textSource }));
    setDocumentPagination((current) => ({ ...current, [updatedDocument.id]: paginated }));
    setScannedDocumentId(null);
    setActivePage(1);
    setSelectedRequirementId(null);
    setActiveFinding("all");
    setScreen("analysis");
  }

  async function runAnalysis() {
    if (!selectedDocument || (!file && selectedDocument.source !== "demo")) {
      setErrorMessage("Choose a PDF before starting an analysis.");
      return;
    }
    if (processingChoice === "demo") {
      setErrorMessage(
        "Demo mode uses only the fictional sample tender. Choose on-device, cloud, or hybrid processing to analyze your PDF.",
      );
      return;
    }
    if ((processingChoice === "cloud" || processingChoice === "hybrid") && !cloudConsent) {
      setErrorMessage("Explicitly allow cloud processing, or choose on-device only.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      let pages: string[];
      let textSource: DocumentTextSource = "pdfjs";
      let paginated = true;
      if (selectedDocument.source === "demo") {
        pages = selectedDocument.pages;
        setProgressDetail("Using fictional sample text; no real PDF is uploaded.");
      } else {
        if (!file) {
          throw new Error("The selected PDF is no longer available. Choose it again to continue.");
        }
        if (
          documentTextSources[selectedDocument.id] === "llamaparse" &&
          selectedDocument.pages.length > 0
        ) {
          pages = selectedDocument.pages;
          textSource = "llamaparse";
          paginated = documentPagination[selectedDocument.id] ?? true;
        } else {
          setProgressDetail("Reading PDF text in this browser");
          pages = await extractPdfText(file, (completed, total) => {
            setProgressDetail(`Extracting text from page ${completed} of ${total}`);
          });
        }
      }
      if (
        selectedDocument.source === "upload" &&
        textSource === "pdfjs" &&
        shouldOfferExternalOcr(pages)
      ) {
        setScannedDocumentId(selectedDocument.id);
        setScannedTextByDocumentId((current) => ({ ...current, [selectedDocument.id]: pages }));
        setExternalOcrConsentDocumentId(null);
        void checkExternalOcrStatus();
        return;
      }
      if (selectedDocument.source === "upload") {
        setDocuments((current) =>
          current.map((document) =>
            document.id === selectedDocument.id ? { ...document, pages } : document,
          ),
        );
        setDocumentTextSources((current) => ({ ...current, [selectedDocument.id]: textSource }));
        setDocumentPagination((current) => ({ ...current, [selectedDocument.id]: paginated }));
      }
      await analyzePages(pages, textSource, paginated);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(`Analysis could not be completed. ${detail}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function analyzeExtractedTextAnyway() {
    if (!selectedDocument || processingChoice === "demo") {
      setErrorMessage("Choose an AI processing mode before analyzing extracted text.");
      return;
    }
    if ((processingChoice === "cloud" || processingChoice === "hybrid") && !cloudConsent) {
      setErrorMessage("Explicitly allow Firebase cloud processing, or choose on-device only.");
      return;
    }
    const pages = scannedTextByDocumentId[selectedDocument.id];
    if (!pages?.some((page) => page.trim())) {
      setErrorMessage("This PDF has no selectable text to analyze. Use external OCR if enabled.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      setProgressDetail("Analyzing the text extracted in this browser");
      await analyzePages(pages, "pdfjs", true);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(`Analysis could not be completed. ${detail}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function runLlamaParseOcr() {
    if (!selectedDocument || selectedDocument.source !== "upload" || !file) {
      setErrorMessage("Choose a PDF before starting external text extraction.");
      return;
    }
    if (processingChoice === "demo") {
      setErrorMessage("Demo mode never sends documents to external OCR.");
      return;
    }
    if (externalOcrConsentDocumentId !== selectedDocument.id) {
      setErrorMessage("Explicitly allow external text extraction for this PDF before continuing.");
      return;
    }
    if (externalOcrAvailability !== "enabled") {
      setErrorMessage("External OCR is not enabled for this project.");
      return;
    }
    if ((processingChoice === "cloud" || processingChoice === "hybrid") && !cloudConsent) {
      setErrorMessage("Explicitly allow Firebase cloud processing, or choose on-device only.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      setProgressDetail("Sending the PDF to LlamaParse for external text extraction");
      const result = await runExternalOcr(file, true);
      if (!result.pages.some((page) => page.trim())) {
        throw new Error("LlamaParse returned no text for this PDF.");
      }
      setDocuments((current) =>
        current.map((document) =>
          document.id === selectedDocument.id ? { ...document, pages: result.pages } : document,
        ),
      );
      setDocumentTextSources((current) => ({ ...current, [selectedDocument.id]: "llamaparse" }));
      setDocumentPagination((current) => ({
        ...current,
        [selectedDocument.id]: result.paginated,
      }));
      setProgressDetail("Analyzing extracted text with Firebase AI Logic");
      await analyzePages(result.pages, "llamaparse", result.paginated);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(`External text extraction could not be completed. ${detail}`);
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

        <div className="pm-side-caption">{t("sidebar_workspace")}</div>
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
            <strong>{t("sidebar_privacy_title")}</strong>
            <span>{t("sidebar_privacy_note")}</span>
          </div>
        </div>
        <Link to="/changelog" className="pm-changelog-link">
          <ScrollText size={15} aria-hidden="true" />
          <span>What's new</span>
        </Link>
        <button
          ref={tourButtonRef}
          type="button"
          className="pm-tour-replay"
          onClick={() => setTourActive(true)}
        >
          <Compass size={15} aria-hidden="true" />
          Take a tour
        </button>
        <div className="pm-workspace-user">
          <div className="pm-avatar">PM</div>
          <div>
            <strong>{t("sidebar_user_workspace")}</strong>
            <span>{t("sidebar_user_session")}</span>
          </div>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
        <div className="pm-build-info" title={buildLabel()}>
          {buildLabel()}
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
              placeholder={t("search_placeholder")}
              aria-label={t("search_aria")}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label={t("search_clear")}>
                <X size={15} />
              </button>
            )}
          </label>
          <div className="pm-topbar-right">
            <LanguageSelector />
            <Badge tone={firebaseStatusTone}>
              <span className="pm-status-dot" />
              {firebaseStatusLabel}
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
                <Upload size={16} /> {t("btn_add_document")}
              </button>
            )}
          </div>

          {selectedDocument?.source === "demo" &&
            selectedDocument.analysis?.mode === "demo" &&
            screen !== "processing" && (
              <div className="pm-demo-banner" role="note">
                <Sparkles size={17} />
                <div>
                  <strong>{t("demo_banner_title")}</strong>
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
                setCloudConsent(false);
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
              preference={processingChoice === "demo" ? null : processingChoice}
              cloudConsent={cloudConsent}
              textSource={documentTextSources[selectedDocument.id] ?? null}
              paginationVerified={documentPagination[selectedDocument.id] ?? true}
              onSelectFilter={setActiveFinding}
              onSelectPage={setActivePage}
              onOpenProcessing={() => setScreen("processing")}
              onModelResponse={() => setFirebaseConnected(true)}
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
                  complianceCsv(analysis.requirements, reviews, t),
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
              showExternalOcrPrompt={scannedDocumentId === selectedDocument.id}
              externalOcrAvailability={externalOcrAvailability}
              externalOcrConsent={externalOcrConsentDocumentId === selectedDocument.id}
              hasExtractedText={Boolean(
                scannedTextByDocumentId[selectedDocument.id]?.some((page) => page.trim()),
              )}
              firebaseConfigured={firebaseConfigured}
              firebaseConnected={firebaseConnected}
              isAnalyzing={isAnalyzing}
              progressDetail={progressDetail}
              errorMessage={errorMessage}
              inputRef={fileInputRef}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onSelectChoice={(choice) => {
                setProcessingChoice(choice);
                if (choice === "demo" || choice === "local") setCloudConsent(false);
                if (choice === "demo") setExternalOcrConsentDocumentId(null);
                setErrorMessage("");
              }}
              onCloudConsentChange={(checked) => {
                setCloudConsent(checked);
                setErrorMessage("");
              }}
              onExternalOcrConsentChange={(checked) => {
                setExternalOcrConsentDocumentId(checked ? selectedDocument.id : null);
                setErrorMessage("");
              }}
              onExternalOcr={runLlamaParseOcr}
              onAnalyzeExtractedText={analyzeExtractedTextAnyway}
              onExtractTextOnly={extractTextOnly}
              onCheckExternalOcr={() => void checkExternalOcrStatus()}
              onRunAnalysis={runAnalysis}
              onOpenDemo={openDemo}
              onClearError={() => setErrorMessage("")}
            />
          )}
        </main>
      </div>
      <GuidedTour
        active={tourActive}
        screen={screen}
        onNavigate={(s) => setScreen(s)}
        onEnd={() => setTourActive(false)}
        returnFocusRef={tourButtonRef}
      />
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
  const t = useT();
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
          label={t("metric_docs_label")}
          value={documents.length}
          detail={t("metric_docs_detail")}
          tone="blue"
        />
        <Metric
          icon={ClipboardCheck}
          label={
            selectedDocument.source === "demo" ? t("metric_reqs_label_sample") : t("metric_reqs_label_real")
          }
          value={analysis?.requirements.length ?? 0}
          detail={
            selectedDocument.source === "demo"
              ? analysis?.mode === "demo"
                ? t("metric_reqs_detail_demo")
                : t("metric_reqs_detail_ai")
              : t("metric_reqs_detail_verified", { count: verifiedRequirements })
          }
          tone="purple"
        />
        <Metric
          icon={AlertCircle}
          label={t("metric_risks_label")}
          value={criticalRisks}
          detail={t("metric_risks_detail")}
          tone="amber"
        />
        <Metric
          icon={CheckCircle2}
          label={t("metric_pending_label")}
          value={pendingReviews}
          detail={t("metric_pending_detail")}
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
                    <th>{t("table_col_document")}</th>
                    <th>{t("table_col_pages")}</th>
                    <th>{t("table_col_processing")}</th>
                    <th>{t("table_col_status")}</th>
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
                          tone={modeSourceTone(
                            document.analysis ? getProcessingSource(document.analysis) : undefined,
                          )}
                        >
                          {modeLabel(
                            document.analysis ? getProcessingSource(document.analysis) : undefined,
                            t,
                          )}
                        </Badge>
                      </td>
                      <td>
                        {document.analysis ? (
                          <Badge tone={document.source === "demo" ? "amber" : "green"}>
                            {document.source === "demo"
                              ? document.analysis.mode === "demo"
                                ? t("status_prepared_sample")
                                : t("status_ai_analysed")
                              : t("status_analyzed")}
                          </Badge>
                        ) : (
                          <Badge tone="neutral">{t("status_not_analyzed")}</Badge>
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
              <strong>{t("docs_empty_title")}</strong>
              <span>{t("docs_empty_detail")}</span>
            </div>
          )}
          <div className="pm-panel-foot">
            <span>
              {t("docs_showing", { shown: filteredDocuments.length, total: documents.length })}
            </span>
            <button className="pm-text-button" type="button" onClick={onOpenAnalysis}>
              {t("docs_open_analysis")}
            </button>
          </div>
        </section>

        <aside className="pm-overview-side">
          <button className="pm-upload-tile" type="button" onClick={onOpenProcessing}>
            <span className="pm-upload-tile-icon">
              <Upload size={23} />
            </span>
            <strong>{t("upload_tile_title")}</strong>
            <span>{t("upload_tile_detail")}</span>
            <span className="pm-button pm-button--primary">
              {t("upload_tile_cta")} <ArrowRight size={16} />
            </span>
            <small>{t("upload_tile_note")}</small>
          </button>

          <section className="pm-panel pm-review-panel">
            <div className="pm-panel-heading">
              <div>
                <h2>{t("review_queue_title")}</h2>
                <p>{t("review_queue_subtitle")}</p>
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
                            ? t("review_source_verified", { page: item.evidence.page ?? "" })
                            : t("review_evidence_needs")}
                        </small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                {pendingReviews === 0 && (
                  <div className="pm-empty-inline">
                    <CheckCircle2 size={17} /> {t("review_all_done")}
                  </div>
                )}
              </div>
            ) : (
              <div className="pm-empty-inline">{t("review_empty")}</div>
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
  preference,
  cloudConsent,
  textSource,
  paginationVerified,
  onSelectFilter,
  onSelectPage,
  onOpenProcessing,
  onModelResponse,
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
  preference: InferencePreference | null;
  cloudConsent: boolean;
  textSource: DocumentTextSource | null;
  paginationVerified: boolean;
  onSelectFilter: (filter: string) => void;
  onSelectPage: (page: number) => void;
  onOpenProcessing: () => void;
  onModelResponse: () => void;
  onExport: () => void;
}) {
  const t = useT();
  const filterOptions = [
    { id: "all", label: t("filter_all"), count: totalFindings },
    { id: "requirement", label: t("filter_requirements"), count: analysis?.requirements.length ?? 0 },
    { id: "deadline", label: t("filter_deadlines"), count: analysis?.deadlines.length ?? 0 },
    { id: "specification", label: t("filter_specifications"), count: analysis?.specifications.length ?? 0 },
    { id: "risk", label: t("filter_risks"), count: analysis?.risks.length ?? 0 },
    {
      id: "missing",
      label: t("filter_missing"),
      count: (analysis?.missing.length ?? 0) + (analysis?.inconsistencies.length ?? 0),
    },
  ];

  if (!analysis) {
    if (document.pages.some((page) => page.trim())) {
      return (
        <div className="pm-analysis-screen">
          <div className="pm-page-heading">
            <div>
              <h1>{t("pre_analysis_title")}</h1>
              <p>{t("pre_analysis_subtitle")}</p>
            </div>
            <button
              className="pm-button pm-button--primary"
              type="button"
              onClick={onOpenProcessing}
            >
              {t("pre_analysis_cta")} <ArrowRight size={16} />
            </button>
          </div>
          <div className="pm-analysis-layout">
            <section className="pm-panel pm-source-panel">
              <div className="pm-panel-heading pm-source-heading">
                <div>
                  <h2>{t("source_panel_title")}</h2>
                  <p>
                    {textSource === "llamaparse"
                      ? paginationVerified
                        ? t("source_llamaparse_paginated")
                        : t("source_llamaparse_unpaginated")
                      : t("source_pdfjs")}
                  </p>
                </div>
                <div className="pm-page-controls">
                  {paginationVerified ? (
                    <>
                      <button
                        type="button"
                        className="pm-icon-button"
                        aria-label={t("source_prev_page")}
                        disabled={activePage <= 1}
                        onClick={() => onSelectPage(activePage - 1)}
                      >
                        <ChevronLeft size={17} />
                      </button>
                      <span>
                        {t("source_page_of", { page: activePage, total: document.pages.length })}
                      </span>
                      <button
                        type="button"
                        className="pm-icon-button"
                        aria-label={t("source_next_page")}
                        disabled={activePage >= document.pages.length}
                        onClick={() => onSelectPage(activePage + 1)}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </>
                  ) : (
                    <span>{t("source_no_page_numbers")}</span>
                  )}
                </div>
              </div>
              <div className="pm-source-page">
                <div className="pm-source-page-head">
                  <span>{document.name}</span>
                  <span>
                    {paginationVerified ? t("source_page_of", { page: activePage, total: document.pages.length }) : t("source_pagination_unavailable")}
                  </span>
                </div>
                <pre>{pageText || t("source_no_text")}</pre>
                <div className="pm-source-disclaimer">{t("source_disclaimer")}</div>
              </div>
            </section>
            <DocumentQaPanel
              key={document.id}
              documentName={document.name}
              pages={document.pages}
              preference={preference}
              cloudConsent={cloudConsent}
              paginationVerified={paginationVerified}
              onOpenProcessing={onOpenProcessing}
              onSelectPage={onSelectPage}
              onModelResponse={onModelResponse}
            />
          </div>
        </div>
      );
    }
    return <EmptyAnalysis onOpenProcessing={onOpenProcessing} />;
  }
  const processingSource = getProcessingSource(analysis);

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
              {document.source === "demo" ? t("toolbar_fictional_sample") : t("toolbar_pdf_document")} ·{" "}
              {paginationVerified ? `${document.pages.length} ${t("toolbar_pages")}` : t("toolbar_pagination_unverified")} ·{" "}
              {formatBytes(document.size)}
            </span>
          </div>
          <Badge tone={modeSourceTone(processingSource)}>{modeLabel(processingSource, t)}</Badge>
          {textSource === "llamaparse" && (
            <Badge tone="amber">{t("toolbar_llamaparse_badge")}</Badge>
          )}
        </div>
        <button className="pm-button pm-button--dark" type="button" onClick={onExport}>
          <ArrowDownToLine size={16} /> {t("toolbar_export_json")}
        </button>
      </div>

      {document.source === "demo" && (
        <div className="pm-inline-warning">
          <Sparkles size={16} />
          <span>
            {analysis.mode === "demo"
              ? t("warning_demo_prepared")
              : t("warning_demo_ai")}
          </span>
        </div>
      )}

      {textSource === "llamaparse" && !paginationVerified && (
        <div className="pm-inline-warning" role="status">
          <AlertCircle size={16} />
          <span>{t("warning_llamaparse_no_pages")}</span>
        </div>
      )}

      <section className="pm-inference-report" aria-label="Analysis run status">
        <div className="pm-inference-report-heading">
          <strong>{t("inference_title")}</strong>
          <Badge tone={modeSourceTone(processingSource)}>
            {t("inference_processing_source")} {modeLabel(processingSource, t)}
          </Badge>
        </div>
        <dl>
          <div>
            <dt>{t("inference_firebase_label")}</dt>
            <dd>{analysis.mode === "demo" ? t("inference_firebase_not_used") : t("inference_firebase_connected")}</dd>
          </div>
          <div>
            <dt>{t("inference_model_label")}</dt>
            <dd>{analysis.model ?? analysis.engine}</dd>
          </div>
          <div>
            <dt>{t("inference_evidence_label")}</dt>
            <dd>{t("inference_evidence_value")}</dd>
          </div>
          <div>
            <dt>{t("inference_demo_label")}</dt>
            <dd>{document.source === "demo" ? t("inference_yes") : t("inference_no")}</dd>
          </div>
        </dl>
      </section>

      <section className="pm-summary-strip">
        <div className="pm-summary-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <strong>{t("summary_title")}</strong>
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
              <h2>{t("source_panel_title_full")}</h2>
              <p>
                {textSource === "llamaparse"
                  ? paginationVerified
                    ? t("source_llamaparse_full")
                    : t("source_llamaparse_unpaginated")
                  : t("source_pdfjs_full")}
              </p>
            </div>
            <div className="pm-page-controls">
              {paginationVerified ? (
                <>
                  <button
                    type="button"
                    className="pm-icon-button"
                    aria-label={t("source_prev_page")}
                    disabled={activePage <= 1}
                    onClick={() => onSelectPage(activePage - 1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <span>
                    {t("source_page_of", { page: activePage, total: document.pages.length })}
                  </span>
                  <button
                    type="button"
                    className="pm-icon-button"
                    aria-label={t("source_next_page")}
                    disabled={activePage >= document.pages.length}
                    onClick={() => onSelectPage(activePage + 1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </>
              ) : (
                <span>{t("source_no_page_numbers")}</span>
              )}
            </div>
          </div>
          <div className="pm-source-page">
            <div className="pm-source-page-head">
              <span>{document.name}</span>
              <span>{paginationVerified ? t("source_page_of", { page: activePage, total: document.pages.length }) : t("source_pagination_unavailable")}</span>
            </div>
            <pre>{pageText || t("source_no_text")}</pre>
            <div className="pm-source-disclaimer">{t("source_disclaimer")}</div>
          </div>
        </section>

        <section className="pm-findings-panel">
          <div className="pm-findings-heading">
            <div>
              <h2>{t("findings_title")}</h2>
              <p>{t("findings_count", { shown: findings.length, total: totalFindings })}</p>
            </div>
            <Badge tone={analysis.mode === "demo" ? "amber" : "blue"}>
              {analysis.mode === "demo" ? t("findings_illustrative") : t("findings_ai_generated")}
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
                        <span className="pm-muted-label">{t("finding_no_source_page")}</span>
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
                  {search ? t("findings_empty_search") : t("findings_empty_category")}
                </strong>
                <span>{t("findings_empty_hint")}</span>
              </div>
            )}
          </div>
          <div className="pm-human-review-note">
            <CircleHelp size={16} />
            <span>{t("findings_disclaimer")}</span>
          </div>
        </section>
      </div>

      <DocumentQaPanel
        key={document.id}
        documentName={document.name}
        pages={document.pages}
        preference={preference}
        cloudConsent={cloudConsent}
        paginationVerified={paginationVerified}
        onOpenProcessing={onOpenProcessing}
        onSelectPage={onSelectPage}
        onModelResponse={onModelResponse}
      />
    </div>
  );
}

function EmptyAnalysis({ onOpenProcessing }: { onOpenProcessing: () => void }) {
  const t = useT();
  return (
    <section className="pm-panel pm-empty-analysis">
      <div className="pm-empty-illustration">
        <FilePlus2 size={30} />
      </div>
      <h2>{t("empty_analysis_title")}</h2>
      <p>{t("empty_analysis_detail")}</p>
      <button className="pm-button pm-button--primary" type="button" onClick={onOpenProcessing}>
        {t("empty_analysis_cta")} <ArrowRight size={16} />
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
  const t = useT();
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
            {search || t("compliance_search_hint")}
          </span>
        </label>
        <label className="pm-select-wrap">
          <span className="sr-only">Category filter</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.currentTarget.value)}
          >
            <option value="all">{t("compliance_all_categories")}</option>
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
            <option value="all">{t("compliance_all_statuses")}</option>
            <option value="pending">{t("compliance_status_pending")}</option>
            <option value="reviewed">{t("compliance_status_reviewed")}</option>
            <option value="satisfied">{t("compliance_status_satisfied")}</option>
            <option value="unclear">{t("compliance_status_unclear")}</option>
          </select>
          <ChevronDown size={15} />
        </label>
        <button
          className="pm-button pm-button--primary pm-export-button"
          type="button"
          onClick={onExport}
        >
          <ArrowDownToLine size={16} /> {t("compliance_export_csv")}
        </button>
      </div>

      <div className="pm-compliance-layout">
        <section className="pm-panel pm-matrix-panel">
          <div className="pm-matrix-summary">
            <span>
              <strong>{requirements.length}</strong> {t("compliance_summary_reqs", { count: requirements.length })}
            </span>
            <span>
              <strong>{requirements.filter((item) => item.evidence.verified).length}</strong> {t("compliance_summary_verified")}
            </span>
            <span>
              <strong>{filteredRequirements.length}</strong> {t("compliance_summary_shown")}
            </span>
          </div>
          {filteredRequirements.length ? (
            <div className="pm-table-wrap">
              <table className="pm-table pm-matrix-table">
                <thead>
                  <tr>
                    <th>{t("compliance_col_requirement")}</th>
                    <th>{t("compliance_col_category")}</th>
                    <th>{t("compliance_col_mandatory")}</th>
                    <th>{t("compliance_col_evidence")}</th>
                    <th>{t("compliance_col_page")}</th>
                    <th>{t("compliance_col_review_status")}</th>
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
                            {requirement.mandatory ? t("compliance_mandatory_yes") : t("compliance_mandatory_no")}
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
                              {requirement.evidence.verified ? t("compliance_verified") : t("compliance_check_excerpt")}
                            </span>
                          ) : (
                            <span className="pm-muted-label">{t("compliance_not_provided")}</span>
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
                              <option value="pending">{t("compliance_status_pending")}</option>
                              <option value="reviewed">{t("compliance_status_reviewed")}</option>
                              <option value="satisfied">{t("compliance_status_satisfied")}</option>
                              <option value="unclear">{t("compliance_status_unclear")}</option>
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
              <strong>{t("compliance_empty_title")}</strong>
              <span>{t("compliance_empty_detail")}</span>
            </div>
          )}
          <div className="pm-panel-foot">
            <span>{t("compliance_footer_session")}</span>
            <span>
              {filteredRequirements.length} of {requirements.length}
            </span>
          </div>
        </section>

        <aside className="pm-panel pm-evidence-panel">
          <div className="pm-panel-heading">
            <div>
              <h2>{t("evidence_panel_title")}</h2>
              <p>{t("evidence_panel_subtitle")}</p>
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
                  {t("evidence_no_excerpt")}
                </div>
              )}
              <EvidenceStatus evidence={selectedRequirement.evidence} />
              <label className="pm-notes-label">
                {t("evidence_notes_label")}
                <textarea
                  value={reviews[selectedRequirement.id]?.notes ?? ""}
                  onChange={(event) =>
                    onUpdateReview(selectedRequirement.id, { notes: event.currentTarget.value })
                  }
                  placeholder={t("evidence_notes_placeholder")}
                  rows={4}
                />
              </label>
            </div>
          ) : (
            <div className="pm-empty-inline">{t("evidence_select_hint")}</div>
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
  showExternalOcrPrompt,
  externalOcrAvailability,
  externalOcrConsent,
  hasExtractedText,
  firebaseConfigured,
  firebaseConnected,
  isAnalyzing,
  progressDetail,
  errorMessage,
  inputRef,
  onFileChange,
  onDrop,
  onSelectChoice,
  onCloudConsentChange,
  onExternalOcrConsentChange,
  onExternalOcr,
  onAnalyzeExtractedText,
  onExtractTextOnly,
  onCheckExternalOcr,
  onRunAnalysis,
  onOpenDemo,
  onClearError,
}: {
  document: DocumentRecord;
  file: File | null;
  choice: ProcessingChoice;
  cloudConsent: boolean;
  showExternalOcrPrompt: boolean;
  externalOcrAvailability: ExternalOcrAvailability;
  externalOcrConsent: boolean;
  hasExtractedText: boolean;
  firebaseConfigured: boolean;
  firebaseConnected: boolean;
  isAnalyzing: boolean;
  progressDetail: string;
  errorMessage: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onSelectChoice: (choice: ProcessingChoice) => void;
  onCloudConsentChange: (checked: boolean) => void;
  onExternalOcrConsentChange: (checked: boolean) => void;
  onExternalOcr: () => void;
  onAnalyzeExtractedText: () => void;
  onExtractTextOnly: () => void;
  onCheckExternalOcr: () => void;
  onRunAnalysis: () => void;
  onOpenDemo: () => void;
  onClearError: () => void;
}) {
  const t = useT();
  const hasQuestionText = document.pages.some((page) => page.trim());

  return (
    <div className="pm-processing-screen">
      <div className="pm-processing-topline">
        <span>{t("processing_topline")}</span>
        <span className="pm-steps">
          <i className="is-current" />
          <i />
          <i />
        </span>
        <span>{t("processing_steps")}</span>
      </div>
      <div className="pm-processing-options">
        <button
          type="button"
          className={`pm-mode-card${choice === "local" ? " is-selected" : ""}`}
          onClick={() => onSelectChoice("local")}
        >
          <span className="pm-mode-card-top">
            <span className="pm-radio-indicator" />
            {t("mode_card_local_title")}<Badge tone="green">{t("mode_card_local_badge")}</Badge>
          </span>
          <span className="pm-mode-illustration pm-mode-illustration--local">
            <LockKeyhole size={32} />
          </span>
          <strong>{t("mode_card_local_heading")}</strong>
          <span className="pm-mode-description">{t("mode_card_local_desc")}</span>
          <span className="pm-mode-points">
            <span><CheckCircle2 size={15} /> {t("mode_card_local_p1")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_local_p2")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_local_p3")}</span>
          </span>
        </button>

        <button
          type="button"
          className={`pm-mode-card${choice === "cloud" ? " is-selected" : ""}`}
          onClick={() => onSelectChoice("cloud")}
        >
          <span className="pm-mode-card-top">
            <span className="pm-radio-indicator" />
            {t("mode_card_cloud_title")}<Badge tone="blue">{t("mode_card_cloud_badge")}</Badge>
          </span>
          <span className="pm-mode-illustration pm-mode-illustration--hybrid">
            <Cloud size={34} />
          </span>
          <strong>{t("mode_card_cloud_heading")}</strong>
          <span className="pm-mode-description">{t("mode_card_cloud_desc")}</span>
          <span className="pm-mode-points">
            <span><CheckCircle2 size={15} /> {t("mode_card_cloud_p1")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_cloud_p2")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_cloud_p3")}</span>
          </span>
        </button>

        <button
          type="button"
          className={`pm-mode-card${choice === "hybrid" ? " is-selected" : ""}`}
          onClick={() => onSelectChoice("hybrid")}
        >
          <span className="pm-mode-card-top">
            <span className="pm-radio-indicator" />
            {t("mode_card_hybrid_title")}<Badge tone="blue">{t("mode_card_hybrid_badge")}</Badge>
          </span>
          <span className="pm-mode-illustration pm-mode-illustration--hybrid">
            <Cloud size={34} />
            <Sparkles size={18} />
          </span>
          <strong>{t("mode_card_hybrid_heading")}</strong>
          <span className="pm-mode-description">{t("mode_card_hybrid_desc")}</span>
          <span className="pm-mode-points">
            <span><CheckCircle2 size={15} /> {t("mode_card_hybrid_p1")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_hybrid_p2")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_hybrid_p3")}</span>
          </span>
        </button>

        <button
          type="button"
          className={`pm-mode-card${choice === "demo" ? " is-selected" : ""}`}
          onClick={() => onSelectChoice("demo")}
        >
          <span className="pm-mode-card-top">
            <span className="pm-radio-indicator" />
            {t("mode_card_demo_title")}<Badge tone="amber">{t("mode_card_demo_badge")}</Badge>
          </span>
          <span className="pm-mode-illustration pm-mode-illustration--demo">
            <FileText size={35} />
          </span>
          <strong>{t("mode_card_demo_heading")}</strong>
          <span className="pm-mode-description">{t("mode_card_demo_desc")}</span>
          <span className="pm-mode-points">
            <span><CheckCircle2 size={15} /> {t("mode_card_demo_p1")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_demo_p2")}</span>
            <span><CheckCircle2 size={15} /> {t("mode_card_demo_p3")}</span>
          </span>
        </button>
      </div>

      {(choice === "cloud" || choice === "hybrid") && (
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
            <strong>
              {choice === "cloud"
                ? t("consent_cloud_title")
                : t("consent_hybrid_title")}
            </strong>
            <small>
              {choice === "cloud"
                ? t("consent_cloud_detail")
                : t("consent_hybrid_detail")}
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
          aria-label={t("file_input_aria")}
        />
        {file ? (
          <div className="pm-chosen-file">
            <span className="pm-file-icon pm-file-icon--large">
              <FileText size={21} />
            </span>
            <div>
              <strong>{file.name}</strong>
              <span>{formatBytes(file.size)} · PDF · {t("file_stored")}</span>
            </div>
            <button
              className="pm-button pm-button--outline"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <FolderOpen size={15} /> {t("file_replace")}
            </button>
          </div>
        ) : (
          <div className="pm-drop-empty">
            <span className="pm-drop-icon">
              <Upload size={22} />
            </span>
            <strong>{t("drop_title")}</strong>
            <span>{t("drop_or")}</span>
            <button
              className="pm-button pm-button--outline"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <FolderOpen size={15} /> {t("drop_choose")}
            </button>
            <small>{t("drop_note")}</small>
          </div>
        )}
      </div>

      {showExternalOcrPrompt && document.source === "upload" && choice !== "demo" && (
        <section className="pm-external-ocr-panel" aria-live="polite">
          <div className="pm-external-ocr-heading">
            <AlertCircle size={18} />
            <div>
              <strong>{t("ocr_scanned_title")}</strong>
              <p>{t("ocr_scanned_desc")}</p>
            </div>
          </div>
          {hasExtractedText && (
            <button
              className="pm-button pm-button--outline"
              type="button"
              onClick={onAnalyzeExtractedText}
              disabled={
                isAnalyzing || ((choice === "cloud" || choice === "hybrid") && !cloudConsent)
              }
            >
              Analyze the text available in this browser
            </button>
          )}
          {externalOcrAvailability === "checking" && (
            <div className="pm-external-ocr-status">
              <LoaderCircle size={15} className="pm-spin" />
              {t("ocr_checking")}
            </div>
          )}
          {externalOcrAvailability === "disabled" && (
            <div className="pm-external-ocr-status" role="status">
              <strong>{t("ocr_disabled_title")}</strong> {t("ocr_disabled_desc")}
              <button
                className="pm-button pm-button--outline"
                type="button"
                onClick={onCheckExternalOcr}
              >
                {t("ocr_check_again")}
              </button>
            </div>
          )}
          {externalOcrAvailability === "error" && (
            <div className="pm-external-ocr-status" role="status">
              {t("ocr_error")}
              <button
                className="pm-button pm-button--outline"
                type="button"
                onClick={onCheckExternalOcr}
              >
                {t("ocr_retry")}
              </button>
            </div>
          )}
          {externalOcrAvailability === "enabled" && (
            <>
              <label className="pm-cloud-consent pm-external-ocr-consent">
                <input
                  type="checkbox"
                  checked={externalOcrConsent}
                  onChange={(event) => onExternalOcrConsentChange(event.currentTarget.checked)}
                />
                <span className="pm-consent-check">
                  <Check size={14} />
                </span>
                <span>
                  <strong>{t("ocr_consent_title")}</strong>
                  <small>{t("ocr_consent_detail")}</small>
                </span>
              </label>
              <button
                className="pm-button pm-button--primary"
                type="button"
                onClick={onExternalOcr}
                disabled={
                  isAnalyzing ||
                  !externalOcrConsent ||
                  ((choice === "cloud" || choice === "hybrid") && !cloudConsent)
                }
              >
                {isAnalyzing ? (
                  <>
                    <LoaderCircle size={16} className="pm-spin" /> {t("ocr_extracting")}
                  </>
                ) : (
                  <>
                    {t("ocr_extract_btn")} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          )}
        </section>
      )}

      {errorMessage && (
        <div className="pm-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
          <button type="button" onClick={onClearError} aria-label={t("error_dismiss")}>
            <X size={16} />
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="pm-progress-status" role="status">
          <LoaderCircle size={17} className="pm-spin" />
          <span>{progressDetail || t("progress_default")}</span>
        </div>
      )}

      {!firebaseConfigured && choice !== "demo" && (
        <div className="pm-setup-notice">
          <AlertCircle size={18} />
          <div>
            <strong>{t("firebase_setup_title")}</strong>
            <span>{t("firebase_setup_desc")}</span>
          </div>
        </div>
      )}

      <section className="pm-runtime-status" aria-label="Firebase AI Logic status">
        <div>
          <span>{t("runtime_firebase_label")}</span>
          <strong>
            {!firebaseConfigured
              ? t("runtime_not_configured")
              : firebaseConnected
                ? t("runtime_connected")
                : t("runtime_configured_no_response")}
          </strong>
        </div>
        <div>
          <span>{t("runtime_processing_source")}</span>
          <strong>
            {document.analysis
              ? modeLabel(getProcessingSource(document.analysis), t)
              : document.source === "demo"
                ? t("runtime_demo_mode")
                : t("runtime_not_run")}
          </strong>
        </div>
        <div>
          <span>Demo data</span>
          <strong>{document.source === "demo" ? t("runtime_demo_data") : t("inference_no")}</strong>
        </div>
      </section>

      <div className="pm-processing-footer">
        <div>
          <span className="pm-footer-label">{t("footer_selected_mode")}</span>
          <Badge tone={choice === "demo" ? "amber" : choice === "local" ? "green" : "blue"}>
            {choice === "demo"
              ? t("footer_mode_demo")
              : choice === "local"
                ? t("footer_mode_local")
                : choice === "cloud"
                  ? t("footer_mode_cloud")
                  : t("footer_mode_hybrid")}
          </Badge>
        </div>
        <div>
          <span className="pm-footer-label">{t("footer_source_reporting")}</span>
          <span className="pm-footer-value">
            <ShieldCheck size={17} /> {t("footer_source_reporting_value")}
          </span>
        </div>
        <div className="pm-footer-actions">
          {choice === "demo" ? (
            <button type="button" className="pm-button pm-button--primary" onClick={onOpenDemo}>
              {t("btn_explore_sample")} <ArrowRight size={16} />
            </button>
          ) : (
            <>
              {document.source === "upload" && (
                <button
                  type="button"
                  className="pm-button pm-button--outline"
                  onClick={onExtractTextOnly}
                  disabled={isAnalyzing || (!file && !hasQuestionText)}
                >
                  <FileText size={16} />
                  {hasQuestionText ? t("btn_ask_pdf") : t("btn_extract_text")}
                </button>
              )}
              <button
                type="button"
                className="pm-button pm-button--primary"
                onClick={onRunAnalysis}
                disabled={
                  isAnalyzing ||
                  (!file && document.source !== "demo") ||
                  ((choice === "cloud" || choice === "hybrid") && !cloudConsent)
                }
              >
                {isAnalyzing ? (
                  <>
                    <LoaderCircle size={16} className="pm-spin" /> {t("btn_processing")}
                  </>
                ) : (
                  <>
                    {document.source === "demo" ? t("btn_analyze_sample") : t("btn_analyze_pdf")}{" "}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          )}
          <span>
            {choice === "demo"
              ? t("footer_status_demo")
              : choice === "local"
                ? t("footer_status_local")
                : choice === "cloud"
                  ? cloudConsent
                    ? t("footer_status_cloud_ok")
                    : t("footer_status_cloud_pending")
                  : cloudConsent
                    ? t("footer_status_hybrid_ok")
                    : t("footer_status_hybrid_pending")}
          </span>
        </div>
      </div>

      <section className="pm-process-flow">
        <div>
          <h2>{t("flow_title")}</h2>
          <p>{t("flow_subtitle")}</p>
        </div>
        <div className="pm-flow-steps">
          <div>
            <span>
              <FilePlus2 size={18} />
            </span>
            <strong>{t("flow_step1_title")}</strong>
            <small>{t("flow_step1_detail")}</small>
          </div>
          <ArrowRight size={17} />
          <div>
            <span>
              <BrainCircuit size={18} />
            </span>
            <strong>{t("flow_step2_title")}</strong>
            <small>{t("flow_step2_detail")}</small>
          </div>
          <ArrowRight size={17} />
          <div>
            <span>
              <ClipboardCheck size={18} />
            </span>
            <strong>{t("flow_step3_title")}</strong>
            <small>{t("flow_step3_detail")}</small>
          </div>
          <ArrowRight size={17} />
          <div>
            <span>
              <BadgeCheck size={18} />
            </span>
            <strong>{t("flow_step4_title")}</strong>
            <small>{t("flow_step4_detail")}</small>
          </div>
        </div>
      </section>
      {document.source === "demo" && (
        <p className="pm-current-sample">
          <Sparkles size={14} /> {t("flow_current_sample")} {document.name}
        </p>
      )}
    </div>
  );
}
