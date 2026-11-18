import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  Bell,
  BrainCircuit,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Cloud,
  Compass,
  Copy,
  Crown,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Laptop,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  MoreHorizontal,
  RotateCw,
  Search,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Table2,
  Upload,
  Users,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from "react";

import {
  buildDemoDocument,
  DEFAULT_COMPLIANCE_ITEMS,
  DEMO_DOC_ID,
  DEMO_LABEL,
  type ComplianceMatrixItem,
} from "@/data/sampleTender";
import { buildLabel } from "@/lib/buildInfo";
import { DocumentQaPanel } from "@/components/pocketmind/DocumentQaPanel";
import { EvidenceComparisonPanel } from "@/components/pocketmind/EvidenceComparisonPanel";
import { GuidedTour } from "@/components/pocketmind/GuidedTour";
import { LanguageSelector } from "@/components/pocketmind/LanguageSelector";
import { LocalWorkspaceLibrary } from "@/components/pocketmind/LocalWorkspaceLibrary";
import { RiskScreen } from "@/components/pocketmind/RiskScreen";
import { SettingsScreen } from "@/components/pocketmind/SettingsScreen";
import { SourceDocumentViewer } from "@/components/pocketmind/SourceDocumentViewer";
import { complianceCsv, downloadText } from "@/lib/services/csv";
import {
  analysisProcessingSource,
  hasCloudResponse,
  processingSourceKeys,
  type InferenceSource,
} from "@/lib/services/inferenceSource";
import {
  assessmentKeys,
  complianceAssessment,
  evidenceVerification,
  evidenceVerificationKeys,
  humanReviewKeys,
  humanReviewStatus,
} from "@/lib/services/compliance";
import { useLocale, useT } from "@/lib/i18n";
import {
  extractDocxText,
  extractPdfText,
  extractXlsxText,
  formatBytes,
  getDocumentFormat,
  validateDocumentFile,
} from "@/lib/services/documentProcessing";
import {
  clearLocalWorkspace,
  deleteEvidenceDocument,
  loadLocalWorkspace,
  saveDocumentBundle,
  saveDocumentRecord,
  saveEvidenceDocument,
  saveLocalWorkspaceState,
} from "@/lib/services/localWorkspace";
import { riskReviewKey } from "@/lib/services/riskReview";
import {
  getUploadedDocumentActivities,
  summarizeWorkspaceBySource,
} from "@/lib/services/workspaceMetrics";
import { compareEvidenceToRequirement } from "@/lib/services/evidenceComparison";
import { isExternalOcrAvailable, runExternalOcr } from "@/lib/services/externalOcr";
import {
  getOnDeviceTimeoutStage,
  isFirebaseConfigured,
  isInvalidFirebaseAppCheckTokenError,
} from "@/lib/services/firebaseAi";
import { markUnpaginatedEvidenceUnverified } from "@/lib/services/ocrEvidence";
import { shouldOfferExternalOcr } from "@/lib/services/ocrNormalize";
import { analyzeTender } from "@/lib/services/tenderAnalysis";
import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type PocketMindPreferences,
} from "@/lib/preferences";
import { Link } from "@tanstack/react-router";
import {
  CATEGORIES,
  type Analysis,
  type DocumentRecord,
  type DocumentFormat,
  type DocumentTextSource,
  type EvidenceMatch,
  type Evidence,
  type RequirementEvidenceLink,
  type Review,
  type SupportingEvidenceDocument,
  type InferencePreference,
  type WorkspaceActivity,
} from "@/lib/types";

type Screen =
  "overview" | "library" | "analysis" | "compliance" | "processing" | "risks" | "settings";
type ProcessingChoice = "demo" | InferencePreference;
type ExternalOcrAvailability = "checking" | "enabled" | "disabled" | "error";
type FindingKind = "Requirement" | "Deadline" | "Specification" | "Risk" | "Missing information";

type Finding = {
  id: string;
  kind: FindingKind;
  title: string;
  description: string;
  page: number | null;
  sourceIndex: number | null;
  sourceLocation: string | null;
  excerpt: string | null;
  verified: boolean;
  confidence?: number;
  severity?: string;
  mandatory?: boolean;
};

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

function findAnalysisItems(analysis: Analysis, t: TFn): Finding[] {
  return [
    ...analysis.requirements.map((item) => ({
      id: item.id,
      kind: "Requirement" as const,
      title: item.description,
      description: `${item.category} · ${item.mandatory ? t("finding_mandatory") : t("finding_optional")}`,
      page: item.evidence.page,
      sourceIndex: item.evidence.sourceIndex ?? item.evidence.page,
      sourceLocation: item.evidence.sourceLocation ?? null,
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
      sourceIndex: item.evidence.sourceIndex ?? item.evidence.page,
      sourceLocation: item.evidence.sourceLocation ?? null,
      excerpt: item.evidence.excerpt,
      verified: item.evidence.verified,
    })),
    ...analysis.specifications.map((item) => ({
      id: item.id,
      kind: "Specification" as const,
      title: item.item,
      description: [item.quantity, item.unit, item.details].filter(Boolean).join(" · "),
      page: item.evidence.page,
      sourceIndex: item.evidence.sourceIndex ?? item.evidence.page,
      sourceLocation: item.evidence.sourceLocation ?? null,
      excerpt: item.evidence.excerpt,
      verified: item.evidence.verified,
    })),
    ...analysis.risks.map((item) => ({
      id: item.id,
      kind: "Risk" as const,
      title: item.title,
      description: item.explanation,
      page: item.evidence.page,
      sourceIndex: item.evidence.sourceIndex ?? item.evidence.page,
      sourceLocation: item.evidence.sourceLocation ?? null,
      excerpt: item.evidence.excerpt,
      verified: item.evidence.verified,
      severity: item.severity,
    })),
    ...analysis.missing.map((item, index) => ({
      id: `missing-${index}`,
      kind: "Missing information" as const,
      title: item,
      description: t("finding_missing_desc"),
      page: null,
      sourceIndex: null,
      sourceLocation: null,
      excerpt: null,
      verified: false,
    })),
    ...analysis.inconsistencies.map((item, index) => ({
      id: `inconsistency-${index}`,
      kind: "Missing information" as const,
      title: t("finding_inconsistency_title"),
      description: item,
      page: null,
      sourceIndex: null,
      sourceLocation: null,
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
  return source ? t(processingSourceKeys[source]) : t("mode_source_unknown");
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
  const { locale, setLocale } = useLocale();
  const configuredDefaultMode = isFirebaseConfigured() ? "hybrid" : "local";
  const [preferences, setPreferences] = useState<PocketMindPreferences>(() =>
    defaultPreferences(configuredDefaultMode),
  );
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => [buildDemoDocument()]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(DEMO_DOC_ID);
  const [screen, setScreen] = useState<Screen>("overview");
  const [search, setSearch] = useState("");
  const [questionDraftsByDocumentId, setQuestionDraftsByDocumentId] = useState<
    Record<string, string>
  >({});
  const [filesByDocumentId, setFilesByDocumentId] = useState<Record<string, File>>({});
  const [evidenceDocuments, setEvidenceDocuments] = useState<SupportingEvidenceDocument[]>([]);
  const [filesByEvidenceId, setFilesByEvidenceId] = useState<Record<string, File>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<RequirementEvidenceLink[]>([]);
  const [evidenceMatches, setEvidenceMatches] = useState<EvidenceMatch[]>([]);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [evidenceCloudConsent, setEvidenceCloudConsent] = useState(false);
  const [isComparingEvidence, setIsComparingEvidence] = useState(false);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [evidenceComparisonProgress, setEvidenceComparisonProgress] = useState("");
  const [evidenceComparisonError, setEvidenceComparisonError] = useState("");
  const [processingChoice, setProcessingChoice] = useState<ProcessingChoice>(configuredDefaultMode);
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
  const [cloudResponseReceived, setCloudResponseReceived] = useState(false);
  const [progressDetail, setProgressDetail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [activeExcerpt, setActiveExcerpt] = useState<string | null>(null);
  const [activeFinding, setActiveFinding] = useState("all");
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [tourRequestedByUser, setTourRequestedByUser] = useState(false);
  const tourButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = loadPreferences(configuredDefaultMode);
      setPreferences(stored);
      setProcessingChoice(stored.defaultProcessingMode);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Browser preferences could not be loaded.";
      setPreferencesError(`Preferences could not be loaded. ${detail}`);
    }
  }, [configuredDefaultMode]);

  useEffect(() => {
    let active = true;
    void loadLocalWorkspace()
      .then((workspace) => {
        if (!active) return;
        const demo = buildDemoDocument();
        const savedDocs = workspace.documents.filter((document) => document.id !== DEMO_DOC_ID);
        setDocuments([demo, ...savedDocs]);
        setFilesByDocumentId(workspace.filesByDocumentId);
        setEvidenceDocuments(workspace.evidenceDocuments);
        setFilesByEvidenceId(workspace.filesByEvidenceId);
        setReviews(workspace.reviews);
        setEvidenceMatches(workspace.evidenceMatches);
        setEvidenceLinks(workspace.evidenceLinks);
        setActivities(workspace.activities);
      })
      .catch((error) => {
        if (!active) return;
        const detail =
          error instanceof Error ? error.message : "Local workspace could not be opened.";
        setWorkspaceError(`Local files could not be loaded. ${detail}`);
      })
      .finally(() => {
        if (active) setWorkspaceReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!workspaceReady || workspaceError) return;
    void Promise.all(
      documents
        .filter((document) => document.source === "upload")
        .map((document) => saveDocumentRecord(document)),
    ).catch((error: unknown) => {
      const detail = error instanceof Error ? error.message : "Local document storage failed.";
      setWorkspaceError(`Changes could not be saved to this browser. ${detail}`);
    });
  }, [documents, workspaceError, workspaceReady]);

  useEffect(() => {
    if (!workspaceReady || workspaceError) return;
    void saveLocalWorkspaceState({ reviews, evidenceLinks, evidenceMatches, activities }).catch(
      (error: unknown) => {
        const detail = error instanceof Error ? error.message : "Local workspace storage failed.";
        setWorkspaceError(`Review changes could not be saved to this browser. ${detail}`);
      },
    );
  }, [activities, evidenceLinks, evidenceMatches, reviews, workspaceError, workspaceReady]);

  useEffect(() => {
    if (tourActive && !tourRequestedByUser) {
      setTourActive(false);
    }
  }, [tourActive, tourRequestedByUser]);

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? documents[0];
  const file = filesByDocumentId[selectedDocumentId] ?? null;
  const analysis = selectedDocument?.analysis;
  const firebaseConfigured = isFirebaseConfigured();
  const firebaseStatusLabel = !firebaseConfigured
    ? t("firebase_not_configured")
    : cloudResponseReceived
      ? t("firebase_cloud_response_received")
      : t("firebase_configured");
  const firebaseStatusTone = !firebaseConfigured
    ? "amber"
    : cloudResponseReceived
      ? "green"
      : "neutral";
  const allFindings = useMemo(
    () => (analysis ? findAnalysisItems(analysis, t) : []),
    [analysis, t],
  );
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
  const selectedRequirement =
    requirements.find((requirement) => requirement.id === selectedRequirementId) ?? requirements[0];
  const currentPageText = selectedDocument?.pages[activePage - 1] ?? "";
  const documentFormat = selectedDocument?.format ?? "pdf";
  const sourceLocations =
    selectedDocument?.sourceLocations ??
    selectedDocument?.pages.map((_, index) =>
      documentFormat === "pdf" ? `Page ${index + 1}` : `Source segment ${index + 1}`,
    ) ??
    [];
  const currentSourceLocation = sourceLocations[activePage - 1] ?? `Source segment ${activePage}`;
  const screenTitles: Record<Screen, { title: string; subtitle: string }> = {
    overview: { title: t("screen_overview_title"), subtitle: t("screen_overview_subtitle") },
    library: { title: t("screen_library_title"), subtitle: t("screen_library_subtitle") },
    analysis: { title: t("screen_analysis_title"), subtitle: t("screen_analysis_subtitle") },
    compliance: { title: t("screen_compliance_title"), subtitle: t("screen_compliance_subtitle") },
    processing: { title: t("screen_processing_title"), subtitle: t("screen_processing_subtitle") },
    risks: { title: t("screen_risks_title"), subtitle: t("screen_risks_subtitle") },
    settings: {
      title: t("screen_settings_title"),
      subtitle: t("screen_settings_subtitle"),
    },
  };
  const currentScreenCopy = screenTitles[screen];
  const navigation = [
    { id: "overview" as Screen, label: t("nav_dashboard"), icon: LayoutDashboard },
    { id: "library" as Screen, label: t("nav_library"), icon: FolderOpen },
    { id: "analysis" as Screen, label: t("nav_analysis"), icon: FileText },
    { id: "compliance" as Screen, label: t("nav_compliance"), icon: Table2 },
    { id: "processing" as Screen, label: t("nav_processing"), icon: ShieldCheck },
  ];

  function recordActivity(
    type: WorkspaceActivity["type"],
    documentId: string,
    relatedDocumentId?: string,
    requirementId?: string,
  ) {
    const activity: WorkspaceActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      documentId,
      at: new Date().toISOString(),
      ...(relatedDocumentId ? { relatedDocumentId } : {}),
      ...(requirementId ? { requirementId } : {}),
    };
    setActivities((current) => [activity, ...current].slice(0, 200));
  }

  function recordInferenceResponse(source: InferenceSource) {
    setCloudResponseReceived((previous) => hasCloudResponse(previous, source));
  }

  async function addDocument(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (!workspaceReady || workspaceError) {
      setErrorMessage(
        workspaceError || "Local workspace storage is still loading. Try again shortly.",
      );
      return;
    }
    const validationError = validateDocumentFile(selectedFile);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const format = getDocumentFormat(selectedFile.name);
    if (!format) {
      setErrorMessage("Choose a PDF, DOCX, or XLSX file.");
      return;
    }
    const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newDocument: DocumentRecord = {
      id,
      name: selectedFile.name,
      size: selectedFile.size,
      source: "upload",
      format,
      pages: [],
      sourceLocations: [],
      addedAt: new Date().toISOString(),
    };
    try {
      await saveDocumentBundle(newDocument, selectedFile);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "The file could not be saved locally.";
      setErrorMessage(`The document was not added to the workspace. ${detail}`);
      return;
    }
    setDocuments((current) => [newDocument, ...current.filter((document) => document.id !== id)]);
    setSelectedDocumentId(id);
    setFilesByDocumentId((current) => ({ ...current, [id]: selectedFile }));
    setSelectedRequirementId(null);
    setSelectedEvidenceId("");
    setEvidenceCloudConsent(false);
    setActivePage(1);
    setActiveExcerpt(null);
    setProcessingChoice(preferences.defaultProcessingMode);
    setCloudConsent(false);
    setExternalOcrConsentDocumentId(null);
    setScannedDocumentId(null);
    setExternalOcrAvailability("checking");
    setErrorMessage("");
    setScreen("processing");
    recordActivity("document-added", id);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void addDocument(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void addDocument(event.dataTransfer.files[0]);
  }

  async function extractLocalDocument(fileToExtract: File, format: DocumentFormat) {
    if (format === "pdf") {
      const pages = await extractPdfText(fileToExtract, (completed, total) => {
        setProgressDetail(`Extracting text from page ${completed} of ${total}`);
      });
      return {
        pages,
        sourceLocations: pages.map((_, index) => `Page ${index + 1}`),
        textSource: "pdfjs" as const,
        paginationVerified: true,
      };
    }
    setProgressDetail(
      format === "docx"
        ? "Extracting DOCX text in this browser"
        : "Extracting XLSX text in this browser",
    );
    const extracted =
      format === "docx"
        ? await extractDocxText(fileToExtract)
        : await extractXlsxText(fileToExtract);
    return {
      ...extracted,
      textSource: "browser" as const,
      paginationVerified: false,
    };
  }

  async function extractTextOnly() {
    if (!selectedDocument || selectedDocument.source !== "upload") {
      setErrorMessage("Choose an uploaded document before extracting text.");
      return;
    }
    if (
      selectedDocument.pages.some((page) => page.trim()) &&
      selectedDocument.sourceLocations?.length
    ) {
      setScreen("analysis");
      return;
    }
    if (!file) {
      setErrorMessage("The selected file is no longer available in this browser.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      const extracted = await extractLocalDocument(file, selectedDocument.format ?? "pdf");
      const updatedDocument: DocumentRecord = {
        ...selectedDocument,
        pages: extracted.pages,
        sourceLocations: extracted.sourceLocations,
        textSource: extracted.textSource,
        paginationVerified: extracted.paginationVerified,
      };
      await saveDocumentRecord(updatedDocument);
      setDocuments((current) =>
        current.map((document) =>
          document.id === selectedDocument.id ? updatedDocument : document,
        ),
      );
      setDocumentTextSources((current) => ({
        ...current,
        [selectedDocument.id]: extracted.textSource,
      }));
      setDocumentPagination((current) => ({
        ...current,
        [selectedDocument.id]: extracted.paginationVerified,
      }));
      setActivePage(1);

      if (
        (selectedDocument.format ?? getDocumentFormat(selectedDocument.name)) === "pdf" &&
        shouldOfferExternalOcr(extracted.pages)
      ) {
        setScannedDocumentId(selectedDocument.id);
        setScannedTextByDocumentId((current) => ({
          ...current,
          [selectedDocument.id]: extracted.pages,
        }));
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
    setEvidenceCloudConsent(false);
    setErrorMessage("");
    setScreen("analysis");
  }

  function updateReview(id: string, patch: Partial<Review>) {
    const previous = reviews[id];
    setReviews((current) => ({
      ...current,
      [id]: { status: "pending", notes: "", ...current[id], ...patch },
    }));
    if (
      patch.humanReview &&
      patch.humanReview !== humanReviewStatus(previous) &&
      selectedDocument
    ) {
      recordActivity("review-updated", selectedDocument.id, undefined, id);
    }
  }

  async function addEvidenceFile(evidenceFile: File) {
    if (!selectedDocument || selectedDocument.source !== "upload" || !selectedDocument.analysis) {
      setEvidenceComparisonError("Analyze an uploaded tender before adding bidder evidence.");
      return;
    }
    const validationError = validateDocumentFile(evidenceFile);
    if (validationError) {
      setEvidenceComparisonError(validationError);
      return;
    }
    const format = getDocumentFormat(evidenceFile.name);
    if (!format) {
      setEvidenceComparisonError("Choose a PDF, DOCX, or XLSX evidence file.");
      return;
    }

    setIsAddingEvidence(true);
    setEvidenceComparisonError("");
    try {
      const extracted = await extractLocalDocument(evidenceFile, format);
      const evidenceId = `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const evidenceDocument: SupportingEvidenceDocument = {
        id: evidenceId,
        tenderDocumentId: selectedDocument.id,
        name: evidenceFile.name,
        size: evidenceFile.size,
        format,
        pages: extracted.pages,
        sourceLocations: extracted.sourceLocations,
        addedAt: new Date().toISOString(),
      };
      await saveEvidenceDocument(evidenceDocument, evidenceFile);
      setEvidenceDocuments((current) => [evidenceDocument, ...current]);
      setFilesByEvidenceId((current) => ({ ...current, [evidenceId]: evidenceFile }));
      setSelectedEvidenceId(evidenceId);
      setEvidenceCloudConsent(false);
      recordActivity("evidence-added", selectedDocument.id, evidenceId);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "The evidence file could not be saved.";
      setEvidenceComparisonError(`Evidence was not added to the local workspace. ${detail}`);
    } finally {
      setIsAddingEvidence(false);
    }
  }

  function linkEvidence(requirementId: string, evidenceDocumentId: string) {
    if (!selectedDocument || !selectedDocument.analysis) return;
    setEvidenceLinks((current) => {
      const alreadyLinked = current.some(
        (link) =>
          link.tenderDocumentId === selectedDocument.id &&
          link.requirementId === requirementId &&
          link.evidenceDocumentId === evidenceDocumentId,
      );
      if (alreadyLinked) return current;
      return [
        ...current,
        {
          id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tenderDocumentId: selectedDocument.id,
          requirementId,
          evidenceDocumentId,
          createdAt: new Date().toISOString(),
        },
      ];
    });
    recordActivity("evidence-linked", selectedDocument.id, evidenceDocumentId, requirementId);
  }

  function unlinkEvidence(linkId: string) {
    setEvidenceLinks((current) => current.filter((link) => link.id !== linkId));
  }

  async function compareEvidence(requirementId: string, evidenceDocumentId: string) {
    if (!selectedDocument?.analysis || selectedDocument.source !== "upload") {
      setEvidenceComparisonError("Analyze an uploaded tender before comparing bidder evidence.");
      return;
    }
    if (!processingChoice || processingChoice === "demo") {
      setEvidenceComparisonError("Choose on-device, cloud, or hybrid processing before comparing.");
      return;
    }
    if ((processingChoice === "cloud" || processingChoice === "hybrid") && !evidenceCloudConsent) {
      setEvidenceComparisonError(
        "Allow cloud processing for this evidence file before continuing.",
      );
      return;
    }
    const requirement = selectedDocument.analysis.requirements.find(
      (item) => item.id === requirementId,
    );
    const evidenceDocument = evidenceDocuments.find(
      (item) => item.id === evidenceDocumentId && item.tenderDocumentId === selectedDocument.id,
    );
    if (!requirement || !evidenceDocument) {
      setEvidenceComparisonError(
        "The selected requirement or evidence file is no longer available.",
      );
      return;
    }
    if (!filesByEvidenceId[evidenceDocument.id]) {
      setEvidenceComparisonError(
        "The selected evidence file is no longer available in this browser.",
      );
      return;
    }

    setIsComparingEvidence(true);
    setEvidenceComparisonError("");
    setEvidenceComparisonProgress("Preparing local evidence text");
    setEvidenceCloudConsent(false);
    try {
      const result = await compareEvidenceToRequirement(requirement, evidenceDocument.pages, {
        format: evidenceDocument.format,
        sourceLocations: evidenceDocument.sourceLocations,
        preference: processingChoice,
        onInference: recordInferenceResponse,
        onProgress: setEvidenceComparisonProgress,
      });
      const match: EvidenceMatch = {
        id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenderDocumentId: selectedDocument.id,
        requirementId,
        evidenceDocumentId,
        ...result,
        generatedAt: new Date().toISOString(),
      };
      setEvidenceMatches((current) => [
        match,
        ...current.filter(
          (item) =>
            item.tenderDocumentId !== selectedDocument.id ||
            item.requirementId !== requirementId ||
            item.evidenceDocumentId !== evidenceDocumentId,
        ),
      ]);
      recordActivity("evidence-compared", selectedDocument.id, evidenceDocumentId, requirementId);
      setEvidenceComparisonProgress("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Evidence comparison failed.";
      setEvidenceComparisonError(`Evidence could not be compared. ${detail}`);
      setEvidenceComparisonProgress("");
    } finally {
      setIsComparingEvidence(false);
    }
  }

  async function clearWorkspace() {
    try {
      await clearLocalWorkspace();
      const demo = buildDemoDocument();
      setDocuments([demo]);
      setSelectedDocumentId(DEMO_DOC_ID);
      setFilesByDocumentId({});
      setEvidenceDocuments([]);
      setFilesByEvidenceId({});
      setEvidenceLinks([]);
      setEvidenceMatches([]);
      setActivities([]);
      setReviews({});
      setQuestionDraftsByDocumentId({});
      setDocumentTextSources({});
      setDocumentPagination({});
      setScannedTextByDocumentId({});
      setSelectedRequirementId(null);
      setSelectedEvidenceId("");
      setEvidenceCloudConsent(false);
      setScreen("overview");
      setWorkspaceError("");
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Local workspace could not be cleared.";
      setWorkspaceError(`Local files could not be deleted. ${detail}`);
      throw error;
    }
  }

  function applyPreferences(next: PocketMindPreferences) {
    savePreferences(next);
    setPreferences(next);
    setPreferencesError("");
    setLocale(next.locale);
    setProcessingChoice(next.defaultProcessingMode);
    setCloudConsent(false);
    setEvidenceCloudConsent(false);
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

  async function analyzePages(
    pages: string[],
    textSource: DocumentTextSource,
    paginated: boolean,
    locations: string[],
  ) {
    if (!selectedDocument) {
      throw new Error("Choose a document before starting an analysis.");
    }
    if (processingChoice === "demo") {
      throw new Error("Demo mode never runs external OCR or Firebase AI analysis.");
    }
    const format = selectedDocument.format ?? getDocumentFormat(selectedDocument.name) ?? "pdf";
    const result = await analyzeTender(
      pages,
      processingChoice,
      ({ detail }) => setProgressDetail(detail),
      recordInferenceResponse,
      {
        format,
        sourceLocations: locations,
        paginationVerified: paginated,
        documentId: selectedDocument.id,
      },
    );
    const analysis =
      format === "pdf" && !paginated ? markUnpaginatedEvidenceUnverified(result) : result;
    const updatedDocument: DocumentRecord = {
      ...selectedDocument,
      pages,
      sourceLocations: locations,
      textSource,
      paginationVerified: paginated,
      analysis,
    };
    setDocuments((current) =>
      current.map((document) => (document.id === updatedDocument.id ? updatedDocument : document)),
    );
    setDocumentTextSources((current) => ({ ...current, [updatedDocument.id]: textSource }));
    setDocumentPagination((current) => ({ ...current, [updatedDocument.id]: paginated }));
    setScannedDocumentId(null);
    setActivePage(1);
    setActiveExcerpt(null);
    setSelectedRequirementId(null);
    setActiveFinding("all");
    setScreen("analysis");
    recordActivity("analysis-completed", selectedDocument.id);
  }

  function reportAnalysisError(error: unknown, prefix: string) {
    const timeoutStage = processingChoice === "local" ? getOnDeviceTimeoutStage(error) : undefined;
    if (timeoutStage === "initialization") {
      setErrorMessage(t("on_device_init_timeout_error"));
      return;
    }
    if (timeoutStage === "generation") {
      setErrorMessage(t("on_device_generation_timeout_error"));
      return;
    }
    if (isInvalidFirebaseAppCheckTokenError(error)) {
      setErrorMessage(t("firebase_app_check_token_error"));
      return;
    }
    const detail = error instanceof Error ? error.message : "An unexpected error occurred.";
    setErrorMessage(`${prefix} ${detail}`);
  }

  async function runAnalysis() {
    if (!selectedDocument || (!file && selectedDocument.source !== "demo")) {
      setErrorMessage("Choose an uploaded document before starting an analysis.");
      return;
    }
    if (processingChoice === "demo") {
      setErrorMessage(
        "Demo mode uses only the fictional sample tender. Choose on-device, cloud, or hybrid processing to analyze an uploaded document.",
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
      let locations: string[];
      let textSource: DocumentTextSource = "browser";
      let paginated = true;
      if (selectedDocument.source === "demo") {
        pages = selectedDocument.pages;
        locations =
          selectedDocument.sourceLocations ?? pages.map((_, index) => `Page ${index + 1}`);
        setProgressDetail("Using fictional sample text; no real PDF is uploaded.");
      } else {
        if (!file) {
          throw new Error("The selected file is no longer available in this browser.");
        }
        const format = selectedDocument.format ?? getDocumentFormat(file.name) ?? "pdf";
        const hasSavedText =
          selectedDocument.pages.some((page) => page.trim()) &&
          (selectedDocument.sourceLocations?.length ?? 0) > 0;
        textSource =
          selectedDocument.textSource ??
          documentTextSources[selectedDocument.id] ??
          (format === "pdf" ? "pdfjs" : "browser");
        paginated =
          selectedDocument.paginationVerified ?? documentPagination[selectedDocument.id] ?? true;
        if (hasSavedText) {
          pages = selectedDocument.pages;
          locations = selectedDocument.sourceLocations ?? [];
        } else {
          const extracted = await extractLocalDocument(file, format);
          pages = extracted.pages;
          locations = extracted.sourceLocations;
          textSource = extracted.textSource;
          paginated = extracted.paginationVerified;
        }
      }
      if (
        selectedDocument.source === "upload" &&
        (selectedDocument.format ?? getDocumentFormat(selectedDocument.name)) === "pdf" &&
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
        const updatedDocument: DocumentRecord = {
          ...selectedDocument,
          pages,
          sourceLocations: locations,
          textSource,
          paginationVerified: paginated,
        };
        await saveDocumentRecord(updatedDocument);
        setDocuments((current) =>
          current.map((document) =>
            document.id === selectedDocument.id ? updatedDocument : document,
          ),
        );
        setDocumentTextSources((current) => ({ ...current, [selectedDocument.id]: textSource }));
        setDocumentPagination((current) => ({ ...current, [selectedDocument.id]: paginated }));
      }
      await analyzePages(pages, textSource, paginated, locations);
    } catch (error) {
      reportAnalysisError(error, "Analysis could not be completed.");
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
      const sourceLocations = pages.map((_, index) => `Page ${index + 1}`);
      await analyzePages(pages, "pdfjs", true, sourceLocations);
    } catch (error) {
      reportAnalysisError(error, "Analysis could not be completed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function runLlamaParseOcr() {
    if (
      !selectedDocument ||
      selectedDocument.source !== "upload" ||
      (selectedDocument.format ?? getDocumentFormat(selectedDocument.name)) !== "pdf" ||
      !file
    ) {
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
          document.id === selectedDocument.id
            ? {
                ...document,
                pages: result.pages,
                sourceLocations: result.pages.map((_, index) =>
                  result.paginated ? `Page ${index + 1}` : `Extracted segment ${index + 1}`,
                ),
                textSource: "llamaparse",
                paginationVerified: result.paginated,
              }
            : document,
        ),
      );
      setDocumentTextSources((current) => ({ ...current, [selectedDocument.id]: "llamaparse" }));
      setDocumentPagination((current) => ({
        ...current,
        [selectedDocument.id]: result.paginated,
      }));
      setProgressDetail("Analyzing extracted text with Firebase AI Logic");
      const sourceLocations = result.pages.map((_, index) =>
        result.paginated ? `Page ${index + 1}` : `Extracted segment ${index + 1}`,
      );
      await analyzePages(result.pages, "llamaparse", result.paginated, sourceLocations);
    } catch (error) {
      reportAnalysisError(error, "External text extraction could not be completed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function exportAnalysis() {
    if (!analysis || !selectedDocument) return;
    downloadText(
      `${selectedDocument.name.replace(/\.(pdf|docx|xlsx)$/i, "")}-analysis.json`,
      JSON.stringify({ document: selectedDocument.name, analysis }, null, 2),
      "application/json;charset=utf-8",
    );
  }

  if (!selectedDocument) {
    return <main className="pm-empty-analysis">{t("workspace_no_document")}</main>;
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
          <button
            type="button"
            className={`pm-nav-item${screen === "risks" ? " is-active" : ""}`}
            aria-current={screen === "risks" ? "page" : undefined}
            onClick={() => setScreen("risks")}
          >
            <AlertTriangle size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{t("sidebar_nav_risks")}</span>
          </button>
          <button
            type="button"
            className="pm-nav-item pm-nav-item--disabled"
            disabled
            aria-disabled="true"
            title={t("nav_coming_soon")}
          >
            <Folder size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{t("sidebar_nav_projects")}</span>
            <span className="pm-nav-soon">{t("nav_coming_soon")}</span>
          </button>
          <button
            type="button"
            className="pm-nav-item pm-nav-item--disabled"
            disabled
            aria-disabled="true"
            title={t("nav_coming_soon")}
          >
            <Users size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{t("sidebar_nav_team")}</span>
            <span className="pm-nav-soon">{t("nav_coming_soon")}</span>
          </button>
          <button
            type="button"
            className="pm-nav-item pm-nav-item--disabled"
            disabled
            aria-disabled="true"
            title={t("nav_coming_soon")}
          >
            <BrainCircuit size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{t("sidebar_nav_integrations")}</span>
            <span className="pm-nav-soon">{t("nav_coming_soon")}</span>
          </button>
          <button
            type="button"
            className={`pm-nav-item${screen === "settings" ? " is-active" : ""}`}
            aria-current={screen === "settings" ? "page" : undefined}
            onClick={() => setScreen("settings")}
          >
            <Settings size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>{t("sidebar_nav_settings")}</span>
          </button>
        </nav>

        <div className="pm-pro-card">
          <div className="pm-pro-card-header">
            <Crown size={16} className="pm-crown-icon" />
            <strong>{t("sidebar_upgrade_title")}</strong>
          </div>
          <p>{t("sidebar_upgrade_desc")}</p>
          <button type="button" className="pm-pro-btn">
            {t("sidebar_view_plans")}
          </button>
        </div>

        <div className="pm-workspace-switcher">
          <div className="pm-avatar-ss">SS</div>
          <div className="pm-workspace-meta">
            <strong>{t("sidebar_workspace_name")}</strong>
            <span>Workspace</span>
          </div>
          <ChevronRight size={16} className="pm-switcher-arrow" />
        </div>

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
          <span>{t("sidebar_whats_new")}</span>
        </Link>
        <button
          ref={tourButtonRef}
          type="button"
          className="pm-tour-replay"
          onClick={() => {
            setTourRequestedByUser(true);
            setTourActive(true);
          }}
        >
          <Compass size={15} aria-hidden="true" />
          {t("sidebar_take_tour")}
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
          <a
            href="https://github.com/maurolima-sys/ai-mind-law"
            target="_blank"
            rel="noreferrer"
            className="pm-build-info-link"
          >
            GitHub ↗
          </a>
          <span>·</span>
          {buildLabel()}
        </div>
      </aside>

      <div className="pm-main">
        <header className="pm-topbar">
          <div className="pm-mobile-brand">
            <div className="pm-brand-mark">
              <BrainCircuit size={19} />
            </div>
            <span className="pm-mobile-brand-name">PocketMind AI</span>
          </div>
          <label className="pm-search">
            <Search size={17} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder={t("search_placeholder")}
              aria-label={t("search_aria")}
            />
            <kbd className="pm-kbd">⌘K</kbd>
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
            <button type="button" className="pm-icon-badge-btn" aria-label="Notifications">
              <Bell size={18} />
              <span className="pm-notif-dot" />
            </button>
            <div className="pm-user-pill">
              <div className="pm-avatar pm-avatar--small">P</div>
              <div className="pm-user-text">
                <strong>Jordan Diaz</strong>
                <small>Procurement Team</small>
              </div>
            </div>
          </div>
        </header>

        <main className="pm-content">
          <div className="pm-page-heading">
            <div>
              <h1>{currentScreenCopy.title}</h1>
              <p>{currentScreenCopy.subtitle}</p>
            </div>
            {screen !== "processing" && screen !== "settings" && (
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
                  aria-label={t("open_processing_aria")}
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            )}

          {screen === "overview" && (
            <OverviewScreen
              documents={documents}
              reviews={reviews}
              activities={activities}
              search={search}
              onOpenAnalysis={() => setScreen("analysis")}
              onOpenProcessing={() => setScreen("processing")}
              onSelectDocument={(id) => {
                setSelectedDocumentId(id);
                setCloudConsent(false);
                setEvidenceCloudConsent(false);
                setSelectedEvidenceId("");
                setSelectedRequirementId(null);
                setActiveExcerpt(null);
                setActivePage(1);
                setActiveFinding("all");
                const nextDocument = documents.find((document) => document.id === id);
                setScreen(id === DEMO_DOC_ID || nextDocument?.analysis ? "analysis" : "processing");
              }}
            />
          )}
          {screen === "library" && (
            <LocalWorkspaceLibrary
              documents={documents}
              evidenceDocuments={evidenceDocuments}
              storageError={workspaceError}
              onAddDocument={() => setScreen("processing")}
              onOpenDocument={(id) => {
                setSelectedDocumentId(id);
                setCloudConsent(false);
                setEvidenceCloudConsent(false);
                setSelectedEvidenceId("");
                setSelectedRequirementId(null);
                setActiveExcerpt(null);
                setActivePage(1);
                setScreen(
                  documents.find((document) => document.id === id)?.analysis
                    ? "analysis"
                    : "processing",
                );
              }}
              onClearWorkspace={() => void clearWorkspace().catch(() => undefined)}
            />
          )}
          {screen === "analysis" && (
            <AnalysisScreen
              document={selectedDocument}
              file={file}
              analysis={analysis}
              findings={visibleFindings}
              totalFindings={allFindings.length}
              activeFinding={activeFinding}
              activePage={activePage}
              pageText={currentPageText}
              sourceLocation={currentSourceLocation}
              activeExcerpt={activeExcerpt}
              sourceLocations={sourceLocations}
              search={search}
              questionDraft={questionDraftsByDocumentId[selectedDocument.id] ?? ""}
              onQuestionDraftChange={(draft) =>
                setQuestionDraftsByDocumentId((current) => ({
                  ...current,
                  [selectedDocument.id]: draft,
                }))
              }
              preference={processingChoice === "demo" ? null : processingChoice}
              cloudConsent={cloudConsent}
              textSource={
                documentTextSources[selectedDocument.id] ?? selectedDocument.textSource ?? null
              }
              paginationVerified={
                documentPagination[selectedDocument.id] ??
                selectedDocument.paginationVerified ??
                true
              }
              evidenceDocuments={evidenceDocuments}
              evidenceLinks={evidenceLinks}
              evidenceMatches={evidenceMatches}
              selectedEvidenceId={selectedEvidenceId}
              selectedRequirementId={selectedRequirementId ?? selectedRequirement?.id ?? ""}
              evidenceCloudConsent={evidenceCloudConsent}
              isAddingEvidence={isAddingEvidence}
              isComparingEvidence={isComparingEvidence}
              evidenceComparisonProgress={evidenceComparisonProgress}
              evidenceComparisonError={evidenceComparisonError}
              onSelectFilter={setActiveFinding}
              onSelectSource={(index, excerpt, requirementId) => {
                setActivePage(index);
                setActiveExcerpt(excerpt);
                if (requirementId) setSelectedRequirementId(requirementId);
              }}
              onSelectRequirement={(id) => {
                setSelectedRequirementId(id);
                setEvidenceComparisonError("");
              }}
              onSelectEvidence={(id) => {
                setSelectedEvidenceId(id);
                setEvidenceCloudConsent(false);
                setEvidenceComparisonError("");
                setEvidenceComparisonProgress("");
              }}
              onUploadEvidence={(evidenceFile) => void addEvidenceFile(evidenceFile)}
              onLinkEvidence={linkEvidence}
              onUnlinkEvidence={unlinkEvidence}
              onCompareEvidence={(requirementId, evidenceId) =>
                void compareEvidence(requirementId, evidenceId)
              }
              onEvidenceCloudConsentChange={(checked) => setEvidenceCloudConsent(checked)}
              onOpenProcessing={() => setScreen("processing")}
              onModelResponse={recordInferenceResponse}
              voiceInputEnabled={preferences.voiceInputEnabled}
              answerSpeechEnabled={preferences.answerSpeechEnabled}
              onExport={exportAnalysis}
            />
          )}
          {screen === "risks" && (
            <RiskScreen
              documents={documents}
              reviews={reviews}
              search={search}
              storageError={workspaceError}
              onOpenProcessing={() => setScreen("processing")}
              onOpenSource={(documentId, sourceIndex, excerpt) => {
                setSelectedDocumentId(documentId);
                setCloudConsent(false);
                setEvidenceCloudConsent(false);
                setSelectedEvidenceId("");
                setSelectedRequirementId(null);
                setActivePage(sourceIndex);
                setActiveExcerpt(excerpt);
                setActiveFinding("risk");
                setScreen("analysis");
              }}
              onSaveMitigation={(documentId, riskId, note) => {
                updateReview(riskReviewKey(documentId, riskId), { notes: note });
              }}
            />
          )}
          {screen === "compliance" && (
            <ComplianceScreen
              analysis={analysis}
              document={selectedDocument}
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
                  complianceCsv(analysis.requirements, reviews, t, selectedDocument),
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
              cloudResponseReceived={cloudResponseReceived}
              isAnalyzing={isAnalyzing}
              progressDetail={progressDetail}
              errorMessage={errorMessage}
              onDeviceTimeout={
                processingChoice === "local" &&
                (errorMessage === t("on_device_init_timeout_error") ||
                  errorMessage === t("on_device_generation_timeout_error"))
              }
              inputRef={fileInputRef}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onSelectChoice={(choice) => {
                setProcessingChoice(choice);
                if (choice === "demo" || choice === "local") setCloudConsent(false);
                setEvidenceCloudConsent(false);
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
          {screen === "settings" && (
            <SettingsScreen
              preferences={preferences}
              documentCount={documents.filter((document) => document.source === "upload").length}
              evidenceCount={evidenceDocuments.length}
              storageBytes={
                documents
                  .filter((document) => document.source === "upload")
                  .reduce((total, document) => total + document.size, 0) +
                evidenceDocuments.reduce((total, document) => total + document.size, 0)
              }
              storageError={[workspaceError, preferencesError].filter(Boolean).join(" ")}
              onSave={applyPreferences}
              onClearWorkspace={clearWorkspace}
            />
          )}
        </main>
      </div>
      <GuidedTour
        active={tourActive}
        screen={screen === "settings" ? "overview" : screen}
        narrationEnabled={preferences.tourNarrationEnabled}
        onNavigate={(s) => setScreen(s)}
        onEnd={() => {
          setTourRequestedByUser(false);
          setTourActive(false);
        }}
        returnFocusRef={tourButtonRef}
      />
    </div>
  );
}

function OverviewScreen({
  documents,
  reviews,
  activities,
  search,
  onOpenAnalysis,
  onOpenProcessing,
  onSelectDocument,
}: {
  documents: DocumentRecord[];
  reviews: Record<string, Review>;
  activities: WorkspaceActivity[];
  search: string;
  onOpenAnalysis: () => void;
  onOpenProcessing: () => void;
  onSelectDocument: (id: string) => void;
}) {
  const t = useT();
  const metrics = summarizeWorkspaceBySource(documents, reviews);
  const filteredDocuments = documents.filter((document) =>
    document.name.toLowerCase().includes(search.toLowerCase()),
  );
  const documentNames = new Map(documents.map((document) => [document.id, document.name]));
  const visibleActivities = getUploadedDocumentActivities(documents, activities).slice(0, 4);

  function activityDescription(activity: WorkspaceActivity) {
    const documentId =
      activity.type === "evidence-added" && activity.relatedDocumentId
        ? activity.relatedDocumentId
        : activity.documentId;
    const name = documentNames.get(documentId) ?? t("activity_unknown_document");
    switch (activity.type) {
      case "document-added":
        return t("activity_document_added", { name });
      case "analysis-completed":
        return t("activity_analysis_completed", { name });
      case "evidence-added":
        return t("activity_evidence_added", { name });
      case "evidence-linked":
        return t("activity_evidence_linked", { name });
      case "evidence-compared":
        return t("activity_evidence_compared", { name });
      case "review-updated":
        return t("activity_review_updated", { name });
    }
  }

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="pm-screen">
      <div className="pm-welcome-banner">
        <div>
          <span className="pm-welcome-badge">Welcome back</span>
          <h1 className="pm-welcome-title">{t("screen_overview_title")}</h1>
          <p className="pm-welcome-desc">{t("screen_overview_subtitle")}</p>
        </div>
        <div className="pm-welcome-meta">
          <time>{todayLabel}</time>
          <span>{t("overview_good_to_see")}</span>
        </div>
      </div>

      <section className="pm-kpi-grid" aria-label="Workspace summary">
        <div className="pm-kpi-card">
          <div className="pm-kpi-top">
            <span className="pm-kpi-label">{t("metric_docs_label")}</span>
            <div className="pm-kpi-icon-box pm-kpi-icon-box--blue">
              <FileText size={20} />
            </div>
          </div>
          <div className="pm-kpi-value-row">
            <span className="pm-kpi-value">{metrics.upload.documentCount}</span>
          </div>
          <span className="pm-kpi-sub">{t("metric_docs_detail")}</span>
          <span className="pm-kpi-demo-count">
            {t("metric_demo_count", { count: metrics.demo.documentCount })}
          </span>
        </div>

        <div className="pm-kpi-card">
          <div className="pm-kpi-top">
            <span className="pm-kpi-label">{t("metric_reqs_label_real")}</span>
            <div className="pm-kpi-icon-box pm-kpi-icon-box--purple">
              <ClipboardCheck size={20} />
            </div>
          </div>
          <div className="pm-kpi-value-row">
            <span className="pm-kpi-value">{metrics.upload.requirementCount}</span>
          </div>
          <span className="pm-kpi-sub">{t("metric_reqs_detail_real")}</span>
          <span className="pm-kpi-demo-count">
            {t("metric_demo_count", { count: metrics.demo.requirementCount })}
          </span>
        </div>

        <div className="pm-kpi-card">
          <div className="pm-kpi-top">
            <span className="pm-kpi-label">{t("metric_risks_label")}</span>
            <div className="pm-kpi-icon-box pm-kpi-icon-box--orange">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="pm-kpi-value-row">
            <span className="pm-kpi-value">{metrics.upload.criticalRiskCount}</span>
          </div>
          <span className="pm-kpi-sub">{t("metric_risks_detail")}</span>
          <span className="pm-kpi-demo-count">
            {t("metric_demo_count", { count: metrics.demo.criticalRiskCount })}
          </span>
        </div>

        <div className="pm-kpi-card">
          <div className="pm-kpi-top">
            <span className="pm-kpi-label">{t("metric_pending_label")}</span>
            <div className="pm-kpi-icon-box pm-kpi-icon-box--green">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="pm-kpi-value-row">
            <span className="pm-kpi-value">{metrics.upload.pendingReviewCount}</span>
          </div>
          <span className="pm-kpi-sub">{t("metric_pending_detail")}</span>
          <span className="pm-kpi-demo-count">
            {t("metric_demo_count", { count: metrics.demo.pendingReviewCount })}
          </span>
        </div>
      </section>

      <div className="pm-overview-grid">
        <section className="pm-panel pm-recent-panel">
          <div className="pm-panel-heading">
            <div>
              <h2>{t("overview_recent_title")}</h2>
              <p>{t("overview_recent_subtitle")}</p>
            </div>
            <button className="pm-link-button" type="button" onClick={onOpenProcessing}>
              {t("overview_view_all")} <ArrowRight size={15} />
            </button>
          </div>
          {filteredDocuments.length > 0 ? (
            <div className="pm-table-wrap">
              <table className="pm-table pm-documents-table">
                <thead>
                  <tr>
                    <th>{t("table_col_document")}</th>
                    <th>{t("overview_table_col_project")}</th>
                    <th>{t("overview_table_col_analysed_on")}</th>
                    <th>{t("table_col_status")}</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => {
                    const isPdf = (document.format ?? "pdf") === "pdf";
                    const isDocx = document.format === "docx";
                    const isXlsx = document.format === "xlsx";
                    const statusText =
                      document.source === "demo"
                        ? t("status_prepared_sample")
                        : document.status === "Processing"
                          ? t("status_processing")
                          : document.analysis
                            ? t("status_analyzed")
                            : t("status_not_analyzed");
                    return (
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
                          <div className="pm-doc-title-group">
                            <span
                              className={`pm-filetype-badge ${
                                isPdf
                                  ? "pm-filetype-badge--pdf"
                                  : isDocx
                                    ? "pm-filetype-badge--docx"
                                    : "pm-filetype-badge--xlsx"
                              }`}
                            >
                              {isPdf ? "PDF" : isDocx ? "W" : "X"}
                            </span>
                            <div className="pm-doc-name-col">
                              <strong>{document.name}</strong>
                              <span
                                className={`pm-badge pm-origin-badge ${
                                  document.source === "demo" ? "pm-badge--amber" : "pm-badge--blue"
                                }`}
                              >
                                {t(
                                  document.source === "demo"
                                    ? "data_origin_demo"
                                    : "data_origin_upload",
                                )}
                              </span>
                              <small>
                                {document.pages.length} {t("toolbar_pages")} ·{" "}
                                {formatBytes(document.size)}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="pm-muted-label">{document.project ?? "—"}</span>
                        </td>
                        <td>
                          <span className="pm-muted-label">
                            {document.source === "demo" ? "—" : (document.analysedOn ?? "—")}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`pm-status-dot-pill ${
                              document.source === "demo" || document.analysis
                                ? "pm-status-dot-pill--analysed"
                                : document.status === "Processing"
                                  ? "pm-status-dot-pill--processing"
                                  : "pm-status-dot-pill--pending"
                            }`}
                          >
                            <span className="pm-dot-indicator" />
                            {statusText}
                          </span>
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
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
          <div className="pm-quick-upload-card">
            <div className="pm-quick-upload-icon">
              <Upload size={26} />
            </div>
            <h3>{t("upload_tile_title")}</h3>
            <p>{t("upload_tile_detail")}</p>
            <button className="pm-upload-btn-main" type="button" onClick={onOpenProcessing}>
              {t("upload_tile_cta")}
            </button>
            <span className="pm-quick-upload-footer">{t("upload_supports")}</span>
          </div>

          <section className="pm-activity-feed-card">
            <div className="pm-activity-feed-header">
              <h3>{t("activity_title")}</h3>
              <button type="button" className="pm-link-button" onClick={onOpenAnalysis}>
                {t("overview_view_all")}
              </button>
            </div>
            <ul className="pm-feed-list">
              {visibleActivities.length ? (
                visibleActivities.map((activity) => {
                  const tone = activity.tone ?? "blue";
                  const docName =
                    activity.documentName ??
                    documentNames.get(activity.documentId) ??
                    t("activity_unknown_document");
                  const title = activity.title ?? activityDescription(activity);
                  const timeStr =
                    activity.timeAgo ??
                    new Date(activity.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  const FeedIcon =
                    activity.type === "analysis-completed"
                      ? BrainCircuit
                      : activity.type === "document-added"
                        ? FilePlus2
                        : activity.type === "evidence-added"
                          ? FileCheck2
                          : activity.type === "evidence-compared"
                            ? BadgeCheck
                            : activity.type === "review-updated"
                              ? ClipboardCheck
                              : FileText;
                  return (
                    <li key={activity.id} className="pm-feed-item">
                      <span className={`pm-feed-icon pm-feed-icon--${tone}`}>
                        <FeedIcon size={11} strokeWidth={2.2} />
                      </span>
                      <div className="pm-feed-content">
                        <strong>{title}</strong>
                        <span>{docName}</span>
                        <time>{timeStr}</time>
                      </div>
                    </li>
                  );
                })
              ) : (
                <li className="pm-feed-empty">{t("activity_empty")}</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AnalysisScreen({
  document,
  file,
  analysis,
  findings,
  totalFindings,
  activeFinding,
  activePage,
  pageText,
  sourceLocation,
  activeExcerpt,
  sourceLocations,
  search,
  questionDraft,
  onQuestionDraftChange,
  preference,
  cloudConsent,
  textSource,
  paginationVerified,
  evidenceDocuments,
  evidenceLinks,
  evidenceMatches,
  selectedEvidenceId,
  selectedRequirementId,
  evidenceCloudConsent,
  isAddingEvidence,
  isComparingEvidence,
  evidenceComparisonProgress,
  evidenceComparisonError,
  onSelectFilter,
  onSelectSource,
  onSelectRequirement,
  onSelectEvidence,
  onUploadEvidence,
  onLinkEvidence,
  onUnlinkEvidence,
  onCompareEvidence,
  onEvidenceCloudConsentChange,
  onOpenProcessing,
  onModelResponse,
  voiceInputEnabled,
  answerSpeechEnabled,
  onExport,
}: {
  document: DocumentRecord;
  file: File | null;
  analysis: Analysis | undefined;
  findings: Finding[];
  totalFindings: number;
  activeFinding: string;
  activePage: number;
  pageText: string;
  sourceLocation: string;
  activeExcerpt: string | null;
  sourceLocations: string[];
  search: string;
  questionDraft: string;
  onQuestionDraftChange: (draft: string) => void;
  preference: InferencePreference | null;
  cloudConsent: boolean;
  textSource: DocumentTextSource | null;
  paginationVerified: boolean;
  evidenceDocuments: SupportingEvidenceDocument[];
  evidenceLinks: RequirementEvidenceLink[];
  evidenceMatches: EvidenceMatch[];
  selectedEvidenceId: string;
  selectedRequirementId: string;
  evidenceCloudConsent: boolean;
  isAddingEvidence: boolean;
  isComparingEvidence: boolean;
  evidenceComparisonProgress: string;
  evidenceComparisonError: string;
  onSelectFilter: (filter: string) => void;
  onSelectSource: (index: number, excerpt: string | null, requirementId?: string) => void;
  onSelectRequirement: (id: string) => void;
  onSelectEvidence: (id: string) => void;
  onUploadEvidence: (file: File) => void;
  onLinkEvidence: (requirementId: string, evidenceDocumentId: string) => void;
  onUnlinkEvidence: (linkId: string) => void;
  onCompareEvidence: (requirementId: string, evidenceDocumentId: string) => void;
  onEvidenceCloudConsentChange: (checked: boolean) => void;
  onOpenProcessing: () => void;
  onModelResponse: (source: InferenceSource) => void;
  voiceInputEnabled: boolean;
  answerSpeechEnabled: boolean;
  onExport: () => void;
}) {
  const t = useT();
  const format = document.format ?? "pdf";
  const hasPdfPagination = format === "pdf" && paginationVerified;
  const canNavigateSources = document.pages.length > 1;
  const sourceFile = format === "pdf" && hasPdfPagination ? file : null;
  const filterOptions = [
    { id: "all", label: t("filter_all"), count: totalFindings },
    {
      id: "requirement",
      label: t("filter_requirements"),
      count: analysis?.requirements.length ?? 0,
    },
    { id: "deadline", label: t("filter_deadlines"), count: analysis?.deadlines.length ?? 0 },
    {
      id: "specification",
      label: t("filter_specifications"),
      count: analysis?.specifications.length ?? 0,
    },
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
          <div className="pm-analysis-layout">
            <section className="pm-panel pm-source-panel">
              <div className="pm-panel-heading pm-source-heading">
                <div>
                  <h2>{t("source_panel_title")}</h2>
                  <p>
                    {format !== "pdf"
                      ? t("source_office_document")
                      : textSource === "llamaparse"
                        ? paginationVerified
                          ? t("source_llamaparse_paginated")
                          : t("source_llamaparse_unpaginated")
                        : t("source_pdfjs")}
                  </p>
                </div>
                <div className="pm-page-controls">
                  {canNavigateSources && (
                    <button
                      type="button"
                      className="pm-icon-button"
                      aria-label={t("source_prev_page")}
                      disabled={activePage <= 1}
                      onClick={() => onSelectSource(activePage - 1, null)}
                    >
                      <ChevronLeft size={17} />
                    </button>
                  )}
                  <span>
                    {hasPdfPagination
                      ? t("source_page_of", { page: activePage, total: document.pages.length })
                      : sourceLocation}
                  </span>
                  {canNavigateSources && (
                    <button
                      type="button"
                      className="pm-icon-button"
                      aria-label={t("source_next_page")}
                      disabled={activePage >= document.pages.length}
                      onClick={() => onSelectSource(activePage + 1, null)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  )}
                </div>
              </div>
              <SourceDocumentViewer
                file={sourceFile}
                format={format}
                name={document.name}
                pageText={pageText}
                pageNumber={activePage}
                pageCount={document.pages.length}
                sourceLocation={sourceLocation}
                excerpt={activeExcerpt}
              />
            </section>
            <DocumentQaPanel
              key={document.id}
              documentName={document.name}
              pages={document.pages}
              format={format}
              sourceLocations={sourceLocations}
              draft={questionDraft}
              onDraftChange={onQuestionDraftChange}
              preference={preference}
              cloudConsent={cloudConsent}
              paginationVerified={hasPdfPagination}
              onOpenProcessing={onOpenProcessing}
              onSelectPage={(index, excerpt) => onSelectSource(index, excerpt ?? null)}
              onModelResponse={onModelResponse}
              voiceInputEnabled={voiceInputEnabled}
              answerSpeechEnabled={answerSpeechEnabled}
            />
          </div>
        </div>
      );
    }
    return <EmptyAnalysis onOpenProcessing={onOpenProcessing} />;
  }
  const processingSource = analysisProcessingSource(analysis);

  const [activeTab, setActiveTab] = useState<"analysis" | "summary" | "qa" | "compare">("analysis");
  return (
    <div className="pm-analysis-screen">
      {/* Document header */}
      <div className="pm-doc-subheader-aligned">
        <div className="pm-doc-sub-left">
          <span className="pm-file-icon pm-file-icon--large">
            <FileText size={20} />
          </span>
          <div>
            <h2>{document.name}</h2>
            <div className="pm-doc-sub-meta">
              <span>
                {document.source === "demo"
                  ? t("toolbar_fictional_sample")
                  : format === "pdf"
                    ? t("toolbar_pdf_document")
                    : format === "docx"
                      ? t("toolbar_docx_document")
                      : t("toolbar_xlsx_document")}
              </span>
              <span>·</span>
              <span>
                {hasPdfPagination
                  ? `${document.pages.length} ${t("toolbar_pages")}`
                  : `${document.pages.length} ${t("toolbar_source_sections")}`}
              </span>
              <span>·</span>
              <span>{formatBytes(document.size)}</span>
              <Badge tone={modeSourceTone(processingSource)}>
                {modeLabel(processingSource, t)}
              </Badge>
              {textSource === "llamaparse" && (
                <Badge tone="amber">{t("toolbar_llamaparse_badge")}</Badge>
              )}
            </div>
          </div>
        </div>
        <button className="pm-button pm-button--dark" type="button" onClick={onExport}>
          <ArrowDownToLine size={16} /> {t("toolbar_export_json")}
        </button>
      </div>

      {document.source === "demo" && (
        <div className="pm-inline-warning">
          <Sparkles size={16} />
          <span>
            {analysis.mode === "demo" ? t("warning_demo_prepared") : t("warning_demo_ai")}
          </span>
        </div>
      )}

      {textSource === "llamaparse" && !paginationVerified && (
        <div className="pm-inline-warning" role="status">
          <AlertCircle size={16} />
          <span>{t("warning_llamaparse_no_pages")}</span>
        </div>
      )}

      {/* Summary strip */}
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

      {/* Split-screen layout */}
      <div className="pm-analysis-layout">
        {/* Left: source viewer */}
        <section className="pm-panel pm-source-panel">
          {/* Viewer toolbar */}
          <div className="pm-viewer-toolbar">
            <div className="pm-toolbar-group">
              <button
                type="button"
                className="pm-toolbar-icon-btn"
                aria-label={t("source_prev_page")}
                disabled={activePage <= 1}
                onClick={() => onSelectSource(activePage - 1, null)}
              >
                <ChevronLeft size={15} />
              </button>
              <span className="pm-page-counter-pill">
                {hasPdfPagination
                  ? t("source_page_of", { page: activePage, total: document.pages.length })
                  : sourceLocation}
              </span>
              <button
                type="button"
                className="pm-toolbar-icon-btn"
                aria-label={t("source_next_page")}
                disabled={activePage >= document.pages.length}
                onClick={() => onSelectSource(activePage + 1, null)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="pm-toolbar-group">
              <button type="button" className="pm-toolbar-icon-btn" aria-label="Zoom out">
                <ZoomOut size={14} />
              </button>
              <span className="pm-zoom-pill">100%</span>
              <button type="button" className="pm-toolbar-icon-btn" aria-label="Zoom in">
                <ZoomIn size={14} />
              </button>
              <button type="button" className="pm-toolbar-icon-btn" aria-label="Expand">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
          <SourceDocumentViewer
            file={sourceFile}
            format={format}
            name={document.name}
            pageText={pageText}
            pageNumber={activePage}
            pageCount={document.pages.length}
            sourceLocation={sourceLocation}
            excerpt={activeExcerpt}
          />
          {/* Thumbnail strip */}
          {document.pages.length > 1 && (
            <div className="pm-thumbnail-strip">
              {document.pages.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`pm-thumb-box${activePage === idx + 1 ? " is-active" : ""}`}
                  onClick={() => onSelectSource(idx + 1, null)}
                  aria-label={`Page ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
              {document.pages.length > 8 && (
                <span className="pm-zoom-pill">+{document.pages.length - 8}</span>
              )}
            </div>
          )}
        </section>

        {/* Right: tabbed analysis panel */}
        <section className="pm-findings-panel">
          {/* Tabs */}
          <div className="pm-analysis-tabs-header">
            {(["analysis", "summary", "qa", "compare"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`pm-analysis-tab-btn${activeTab === tab ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "analysis" && <ScrollText size={14} />}
                {tab === "summary" && <Sparkles size={14} />}
                {tab === "qa" && <CircleHelp size={14} />}
                {tab === "compare" && <Table2 size={14} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "analysis" && (
            <>
              {/* Filter chips */}
              <div
                className="pm-filter-row"
                aria-label="Filter findings"
                style={{ padding: "10px 12px 0" }}
              >
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

              <div className="pm-findings-list">
                {findings.length ? (
                  findings.map((finding) => {
                    const conf = finding.confidence ?? 0;
                    const confTag = conf >= 0.8 ? "green" : conf >= 0.6 ? "yellow" : "orange";
                    return (
                      <article className="pm-finding-card-clean" key={finding.id}>
                        <div className="pm-finding-card-meta">
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
                          {finding.confidence !== undefined && (
                            <span className={`pm-confidence-tag pm-confidence-tag--${confTag}`}>
                              {Math.round(finding.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <h5>{finding.title}</h5>
                        {finding.excerpt && <blockquote>"{finding.excerpt}"</blockquote>}
                        <div className="pm-finding-meta" style={{ marginTop: "8px" }}>
                          {finding.sourceIndex !== null ? (
                            <button
                              className="pm-page-link"
                              type="button"
                              onClick={() => {
                                if (finding.sourceIndex !== null) {
                                  onSelectSource(
                                    finding.sourceIndex,
                                    finding.excerpt,
                                    finding.kind === "Requirement" ? finding.id : undefined,
                                  );
                                }
                              }}
                            >
                              <FileText size={13} />{" "}
                              {finding.page !== null
                                ? t("finding_page", { page: finding.page })
                                : (finding.sourceLocation ??
                                  `Source section ${finding.sourceIndex}`)}
                            </button>
                          ) : (
                            <span className="pm-muted-label">{t("finding_no_source_page")}</span>
                          )}
                          <EvidenceStatus
                            evidence={{
                              page: finding.page,
                              excerpt: finding.excerpt,
                              verified: finding.verified,
                              sourceIndex: finding.sourceIndex,
                              sourceLocation: finding.sourceLocation,
                            }}
                          />
                        </div>
                      </article>
                    );
                  })
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
            </>
          )}

          {activeTab === "summary" && (
            <div style={{ padding: "16px" }}>
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
                    <dd>
                      {processingSource === "demo"
                        ? t("inference_firebase_not_used")
                        : processingSource
                          ? t("inference_response_received")
                          : t("mode_source_unknown")}
                    </dd>
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
            </div>
          )}

          {activeTab === "qa" && (
            <DocumentQaPanel
              key={document.id}
              documentName={document.name}
              pages={document.pages}
              format={format}
              sourceLocations={sourceLocations}
              draft={questionDraft}
              onDraftChange={onQuestionDraftChange}
              preference={preference}
              cloudConsent={cloudConsent}
              paginationVerified={hasPdfPagination}
              onOpenProcessing={onOpenProcessing}
              onSelectPage={(index, excerpt) => onSelectSource(index, excerpt ?? null)}
              onModelResponse={onModelResponse}
              voiceInputEnabled={voiceInputEnabled}
              answerSpeechEnabled={answerSpeechEnabled}
            />
          )}

          {activeTab === "compare" && (
            <EvidenceComparisonPanel
              tenderDocumentId={document.id}
              requirements={analysis.requirements}
              selectedRequirementId={selectedRequirementId}
              evidenceDocuments={evidenceDocuments}
              links={evidenceLinks}
              matches={evidenceMatches}
              selectedEvidenceId={selectedEvidenceId}
              preference={preference}
              cloudConsent={evidenceCloudConsent}
              isAddingEvidence={isAddingEvidence}
              isComparing={isComparingEvidence}
              progress={evidenceComparisonProgress}
              error={evidenceComparisonError}
              demo={document.source === "demo"}
              onSelectRequirement={onSelectRequirement}
              onSelectEvidence={onSelectEvidence}
              onUpload={onUploadEvidence}
              onLink={onLinkEvidence}
              onUnlink={onUnlinkEvidence}
              onCompare={onCompareEvidence}
              onCloudConsentChange={onEvidenceCloudConsentChange}
            />
          )}
        </section>
      </div>
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

export function ComplianceScreen({
  analysis,
  document,
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
  document: DocumentRecord;
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
    const review = humanReviewStatus(reviews[requirement.id]);
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

  const verifiedCount = requirements.filter((r) => r.evidence.verified).length;
  const pendingCount = requirements.filter(
    (r) => humanReviewStatus(reviews[r.id]) === "pending",
  ).length;

  return (
    <div className="pm-compliance-screen">
      {/* Sub-header: breadcrumb + KPI pills */}
      <div className="pm-compliance-sub">
        <div className="pm-compliance-sub-left">
          <ClipboardCheck size={15} />
          <span>{t("compliance_col_requirement")}</span>
          <span style={{ color: "var(--pm-soft)" }}>·</span>
          <span>
            {requirements.length} {t("compliance_summary_reqs", { count: requirements.length })}
          </span>
        </div>
        <div className="pm-compliance-sub-right">
          <span className="pm-pill-in-review">
            <CheckCircle2 size={12} /> {verifiedCount} {t("compliance_summary_verified")}
          </span>
          {pendingCount > 0 && (
            <span className="pm-status-pill-score pm-status-pill-score--pending">
              {pendingCount} {t("compliance_status_pending")}
            </span>
          )}
        </div>
      </div>

      {analysis.mode === "demo" && (
        <div className="pm-inline-warning">
          <Sparkles size={16} />
          <span>{t("compliance_demo_inline")}</span>
        </div>
      )}
      <p className="pm-compliance-dimensions">{t("compliance_dimensions_detail")}</p>

      {/* Toolbar */}
      <div className="pm-compliance-toolbar">
        <label className="pm-table-search">
          <Search size={16} />
          <span aria-label="Search requirements">{search || t("compliance_search_hint")}</span>
        </label>
        <label className="pm-select-wrap">
          <span className="sr-only">{t("compliance_category_filter_sr")}</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.currentTarget.value)}>
            <option value="all">{t("compliance_all_categories")}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </label>
        <label className="pm-select-wrap">
          <span className="sr-only">{t("compliance_status_filter_sr")}</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.currentTarget.value)}>
            <option value="all">{t("compliance_all_statuses")}</option>
            <option value="pending">{t("compliance_status_pending")}</option>
            <option value="reviewed">{t("compliance_status_reviewed")}</option>
            <option value="approved">{t("compliance_status_approved")}</option>
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
        {/* Matrix table */}
        <section className="pm-panel pm-matrix-panel">
          <div className="pm-matrix-summary">
            <span>
              <strong>{requirements.length}</strong>{" "}
              {t("compliance_summary_reqs", { count: requirements.length })}
            </span>
            <span>
              <strong>{verifiedCount}</strong> {t("compliance_summary_verified")}
            </span>
            <span>
              <strong>{filteredRequirements.length}</strong> {t("compliance_summary_shown")}
            </span>
          </div>
          {filteredRequirements.length ? (
            <div
              className="pm-table-wrap"
              role="region"
              aria-label={t("screen_compliance_title")}
              tabIndex={0}
            >
              <table className="pm-table pm-matrix-table">
                <thead>
                  <tr>
                    <th>{t("compliance_col_requirement")}</th>
                    <th>{t("compliance_col_category")}</th>
                    <th>{t("compliance_col_mandatory")}</th>
                    <th>{t("compliance_col_evidence_verification")}</th>
                    <th>{t("compliance_col_page")}</th>
                    <th>{t("compliance_col_assessment")}</th>
                    <th>{t("compliance_col_review_status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequirements.map((req) => {
                    const review = reviews[req.id];
                    const verification = evidenceVerification(req.evidence, document);
                    return (
                      <tr
                        key={req.id}
                        className={selectedRequirementId === req.id ? "is-selected" : ""}
                      >
                        <td>
                          <button
                            className="pm-requirement-select"
                            type="button"
                            onClick={() => onSelectRequirement(req.id)}
                          >
                            {req.description}
                          </button>
                        </td>
                        <td>
                          <Badge tone="purple">{req.category}</Badge>
                        </td>
                        <td>
                          <Badge tone={req.mandatory ? "red" : "neutral"}>
                            {req.mandatory
                              ? t("compliance_mandatory_yes")
                              : t("compliance_mandatory_no")}
                          </Badge>
                        </td>
                        <td>
                          <span
                            className={
                              verification === "verified"
                                ? "pm-verified-text"
                                : "pm-unverified-text"
                            }
                          >
                            {t(evidenceVerificationKeys[verification])}
                          </span>
                        </td>
                        <td>{req.evidence.sourceLocation ?? req.evidence.page ?? "—"}</td>
                        <td>
                          <label className="pm-status-select">
                            <span className="sr-only">
                              {t("compliance_assessment_sr", { description: req.description })}
                            </span>
                            <select
                              value={complianceAssessment(review)}
                              onChange={(e) => {
                                const value = e.currentTarget.value;
                                if (
                                  value === "not-assessed" ||
                                  value === "compliant" ||
                                  value === "partially-compliant" ||
                                  value === "non-compliant"
                                ) {
                                  onUpdateReview(req.id, { assessment: value });
                                }
                              }}
                            >
                              {Object.entries(assessmentKeys).map(([value, key]) => (
                                <option key={value} value={value}>
                                  {t(key)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} />
                          </label>
                        </td>
                        <td>
                          <label className="pm-status-select">
                            <span className="sr-only">
                              {t("review_status_sr", { description: req.description })}
                            </span>
                            <select
                              value={humanReviewStatus(review)}
                              onChange={(e) => {
                                const value = e.currentTarget.value;
                                if (
                                  value === "pending" ||
                                  value === "reviewed" ||
                                  value === "approved"
                                ) {
                                  onUpdateReview(req.id, { humanReview: value });
                                }
                              }}
                            >
                              {Object.entries(humanReviewKeys).map(([value, key]) => (
                                <option key={value} value={value}>
                                  {t(key)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} />
                          </label>
                          {review?.status === "unclear" && (
                            <small>{t("compliance_legacy_unclear")}</small>
                          )}
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
              {filteredRequirements.length} {t("compliance_count_of")} {requirements.length}
            </span>
          </div>
        </section>

        {/* Right drawer */}
        <aside className="pm-source-drawer">
          <div className="pm-source-drawer-head">
            <h3>{t("evidence_panel_title")}</h3>
            <FileCheck2 size={16} />
          </div>
          {selectedRequirement ? (
            <>
              {/* Doc badge */}
              <div className="pm-drawer-doc-badge">
                <span style={{ fontWeight: 700, color: "var(--pm-ink)", fontSize: "0.8rem" }}>
                  {selectedRequirement.description.slice(0, 60)}
                  {selectedRequirement.description.length > 60 ? "…" : ""}
                </span>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <Badge tone="purple">{selectedRequirement.category}</Badge>
                  {selectedRequirement.evidence.page && (
                    <Badge tone="blue">
                      {t("evidence_page_badge", { page: selectedRequirement.evidence.page })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Certificate-style preview when verified */}
              {selectedRequirement.evidence.verified && (
                <div className="pm-cert-preview-card">
                  <div className="pm-cert-seal-icon">
                    <ShieldCheck size={28} />
                  </div>
                  <h5>{t("compliance_verified").toUpperCase()}</h5>
                  <p>{t("evidence_panel_subtitle")}</p>
                  <small>
                    {t("compliance_col_page")} {selectedRequirement.evidence.page ?? "—"}
                  </small>
                </div>
              )}

              {/* Extracted excerpt */}
              {selectedRequirement.evidence.excerpt ? (
                <div className="pm-extracted-ai-box">
                  <div className="pm-extracted-ai-header">
                    <span>{t("source_panel_title")}</span>
                    <EvidenceStatus evidence={selectedRequirement.evidence} />
                  </div>
                  <p>"{selectedRequirement.evidence.excerpt}"</p>
                </div>
              ) : (
                <div className="pm-evidence-missing">{t("evidence_no_excerpt")}</div>
              )}

              {/* Review notes */}
              <label className="pm-notes-label">
                {t("evidence_notes_label")}
                <textarea
                  value={reviews[selectedRequirement.id]?.notes ?? ""}
                  onChange={(e) =>
                    onUpdateReview(selectedRequirement.id, { notes: e.currentTarget.value })
                  }
                  placeholder={t("evidence_notes_placeholder")}
                  rows={4}
                />
              </label>
            </>
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
  cloudResponseReceived,
  isAnalyzing,
  progressDetail,
  errorMessage,
  onDeviceTimeout,
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
  cloudResponseReceived: boolean;
  isAnalyzing: boolean;
  progressDetail: string;
  errorMessage: string;
  onDeviceTimeout: boolean;
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
  const cloudConsentRef = useRef<HTMLInputElement>(null);
  const hasQuestionText = document.pages.some((page) => page.trim());

  return (
    <div className="pm-processing-screen">
      <div className="pm-setup-header">
        <span className="pm-setup-category">{t("processing_setup_badge")}</span>
        <h1>{t("processing_setup_title")}</h1>
        <p>{t("processing_setup_desc")}</p>
      </div>

      <div className="pm-decision-grid">
        {/* Card 1: Local processing */}
        <div
          role="button"
          tabIndex={0}
          className={`pm-decision-card${choice === "local" ? " is-active" : ""}`}
          onClick={() => onSelectChoice("local")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectChoice("local");
            }
          }}
        >
          <div className="pm-decision-top">
            <div className="pm-decision-title-row">
              <span className="pm-radio-circle">
                {choice === "local" && <span className="pm-radio-dot" />}
              </span>
              <span>{t("proc_card_local_title")}</span>
            </div>
            <Badge tone="blue">{t("proc_card_local_badge")}</Badge>
          </div>

          <div className="pm-decision-illustration">
            <div style={{ position: "relative", display: "inline-flex" }}>
              <Laptop size={64} strokeWidth={1.5} style={{ color: "#93c5fd" }} />
              <FileText
                size={24}
                strokeWidth={1.75}
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "20px",
                  color: "#2563eb",
                  background: "#ffffff",
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>

          <h4>{t("proc_card_local_heading")}</h4>
          <p>{t("proc_card_local_desc")}</p>

          <ul className="pm-decision-points">
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_local_p1")}</span>
            </li>
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_local_p2")}</span>
            </li>
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_local_p3")}</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Cloud AI processing */}
        <div
          role="button"
          tabIndex={0}
          className={`pm-decision-card${choice === "cloud" || choice === "hybrid" ? " is-active" : ""}`}
          onClick={() => onSelectChoice("cloud")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectChoice("cloud");
            }
          }}
        >
          <div className="pm-decision-top">
            <div className="pm-decision-title-row">
              <span className="pm-radio-circle">
                {(choice === "cloud" || choice === "hybrid") && <span className="pm-radio-dot" />}
              </span>
              <span>{t("proc_card_cloud_title")}</span>
            </div>
            <Badge tone="purple">{t("proc_card_cloud_badge")}</Badge>
          </div>

          <div className="pm-decision-illustration">
            <div style={{ position: "relative", display: "inline-flex" }}>
              <Cloud size={64} strokeWidth={1.5} style={{ color: "#c4b5fd" }} />
              <FileText
                size={24}
                strokeWidth={1.75}
                style={{
                  position: "absolute",
                  top: "18px",
                  left: "20px",
                  color: "#7c3aed",
                  background: "#ffffff",
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>

          <label
            className="pm-consent-switch-box"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <input
              ref={cloudConsentRef}
              type="checkbox"
              className="pm-visually-hidden"
              checked={cloudConsent}
              onChange={(e) => onCloudConsentChange(e.currentTarget.checked)}
            />
            <div className={`pm-switch-track${cloudConsent ? " is-checked" : ""}`}>
              <div className="pm-switch-thumb" />
            </div>
            <span>{t("proc_card_cloud_consent")}</span>
          </label>

          <div className="pm-amber-callout">
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{t("proc_card_cloud_warning")}</span>
          </div>

          <ul className="pm-decision-points">
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_cloud_p1")}</span>
            </li>
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_cloud_p2")}</span>
            </li>
            <li>
              <CircleHelp size={15} style={{ color: "#64748b" }} />
              <span>{t("proc_card_cloud_p3")}</span>
            </li>
          </ul>
        </div>

        {/* Card 3: Demo mode */}
        <div
          role="button"
          tabIndex={0}
          className={`pm-decision-card${choice === "demo" ? " is-active" : ""}`}
          onClick={() => onSelectChoice("demo")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectChoice("demo");
            }
          }}
        >
          <div className="pm-decision-top">
            <div className="pm-decision-title-row">
              <span className="pm-radio-circle">
                {choice === "demo" && <span className="pm-radio-dot" />}
              </span>
              <span>{t("proc_card_demo_title")}</span>
            </div>
            <Badge tone="neutral">{t("proc_card_demo_badge")}</Badge>
          </div>

          <div className="pm-decision-illustration">
            <div style={{ position: "relative", display: "inline-flex" }}>
              <FileText size={56} strokeWidth={1.5} style={{ color: "#94a3b8" }} />
              <FileText
                size={48}
                strokeWidth={1.5}
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "14px",
                  color: "#64748b",
                }}
              />
            </div>
          </div>

          <h4>{t("proc_card_demo_heading")}</h4>
          <p>{t("proc_card_demo_desc")}</p>

          <ul className="pm-decision-points">
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_demo_p1")}</span>
            </li>
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_demo_p2")}</span>
            </li>
            <li>
              <CheckCircle2 size={15} className="pm-check-green" />
              <span>{t("proc_card_demo_p3")}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Confirmation Bar */}
      <div className="pm-confirm-bar">
        <div className="pm-confirm-col">
          <span className="pm-confirm-label">{t("proc_confirm_mode_label")}</span>
          <div className="pm-confirm-status">
            {choice === "local" ? (
              <Laptop size={18} style={{ color: "#2563eb" }} />
            ) : choice === "demo" ? (
              <FileText size={18} style={{ color: "#2563eb" }} />
            ) : (
              <Cloud size={18} style={{ color: "#2563eb" }} />
            )}
            <Badge tone={choice === "demo" ? "neutral" : choice === "local" ? "blue" : "purple"}>
              {choice === "demo"
                ? t("proc_card_demo_title")
                : choice === "local"
                  ? t("proc_card_local_title")
                  : t("proc_card_cloud_title")}
            </Badge>
          </div>
        </div>

        <div className="pm-confirm-col">
          <span className="pm-confirm-label">{t("proc_confirm_privacy_label")}</span>
          <div className="pm-confirm-status">
            <ShieldCheck
              size={18}
              className={choice === "local" ? "pm-check-green" : "pm-icon-blue"}
            />
            <Badge tone={choice === "local" ? "green" : choice === "demo" ? "neutral" : "blue"}>
              {choice === "local"
                ? t("proc_confirm_privacy_on_device")
                : choice === "demo"
                  ? t("proc_confirm_privacy_simulated")
                  : t("proc_confirm_privacy_cloud")}
            </Badge>
            <span className="pm-confirm-subtext">
              {choice === "local"
                ? t("proc_confirm_privacy_stays")
                : choice === "demo"
                  ? t("proc_confirm_privacy_simulated_desc")
                  : t("proc_confirm_privacy_cloud_desc")}
            </span>
          </div>
        </div>

        <div className="pm-confirm-cta-col">
          <button
            type="button"
            className="pm-confirm-cta-btn"
            onClick={() => {
              if (choice === "demo") {
                onOpenDemo();
              } else if (file || hasQuestionText) {
                onRunAnalysis();
              } else {
                inputRef.current?.click();
              }
            }}
            disabled={isAnalyzing || ((choice === "cloud" || choice === "hybrid") && !cloudConsent)}
          >
            {isAnalyzing ? (
              <>
                <LoaderCircle size={16} className="pm-spin" /> {t("btn_processing")}
              </>
            ) : (
              <>{t("processing_confirm_btn")}</>
            )}
          </button>
          <span className="pm-confirm-subtext">{t("processing_confirm_sub")}</span>
        </div>
      </div>

      <div className="pm-file-drop" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <input
          ref={inputRef}
          className="pm-visually-hidden"
          type="file"
          accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
              <span>
                {formatBytes(file.size)} · {getDocumentFormat(file.name)?.toUpperCase()} ·{" "}
                {t("file_stored")}
              </span>
            </div>
            {document.source === "upload" && (
              <button
                className="pm-button pm-button--outline"
                type="button"
                onClick={onExtractTextOnly}
                disabled={isAnalyzing || (!file && !hasQuestionText)}
              >
                <FileText size={15} /> {hasQuestionText ? t("btn_ask_pdf") : t("btn_extract_text")}
              </button>
            )}
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
              {t("ocr_analyze_browser")}
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
          <div className="pm-error-content">
            <span>{errorMessage}</span>
            {onDeviceTimeout && (
              <button
                className="pm-button pm-button--outline pm-error-action"
                type="button"
                onClick={() => {
                  onSelectChoice("cloud");
                  requestAnimationFrame(() => cloudConsentRef.current?.focus());
                }}
              >
                {t("on_device_timeout_choose_cloud")}
              </button>
            )}
          </div>
          <button
            className="pm-error-dismiss"
            type="button"
            onClick={onClearError}
            aria-label={t("error_dismiss")}
          >
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

      <div className="pm-flow-footer-card">
        <div className="pm-flow-left">
          <h4>{t("flow_title")}</h4>
          <p>{t("flow_subtitle")}</p>
          <div className="pm-flow-steps-row">
            <div className="pm-flow-step-item">
              <span className="pm-flow-step-icon">
                <FilePlus2 size={16} />
              </span>
              <div>
                <strong>{t("proc_flow_step1_title")}</strong>
                <span>{t("proc_flow_step1_desc")}</span>
              </div>
            </div>
            <ArrowRight size={15} className="pm-flow-arrow" />
            <div className="pm-flow-step-item">
              <span className="pm-flow-step-icon">
                <BrainCircuit size={16} />
              </span>
              <div>
                <strong>{t("proc_flow_step2_title")}</strong>
                <span>{t("proc_flow_step2_desc")}</span>
              </div>
            </div>
            <ArrowRight size={15} className="pm-flow-arrow" />
            <div className="pm-flow-step-item">
              <span className="pm-flow-step-icon">
                <ClipboardCheck size={16} />
              </span>
              <div>
                <strong>{t("proc_flow_step3_title")}</strong>
                <span>{t("proc_flow_step3_desc")}</span>
              </div>
            </div>
            <ArrowRight size={15} className="pm-flow-arrow" />
            <div className="pm-flow-step-item">
              <span className="pm-flow-step-icon">
                <BadgeCheck size={16} />
              </span>
              <div>
                <strong>{t("proc_flow_step4_title")}</strong>
                <span>{t("proc_flow_step4_desc")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pm-sample-output-box">
          <div className="pm-sample-output-title">{t("proc_sample_output_title")}</div>
          <div className="pm-sample-row">
            <span>{t("proc_sample_invoice")}</span>
            <span className="pm-sample-badge pm-sample-badge--verified">
              {t("proc_sample_verified")}
            </span>
          </div>
          <div className="pm-sample-row">
            <span>{t("proc_sample_date")}</span>
            <span className="pm-sample-badge pm-sample-badge--verified">
              {t("proc_sample_verified")}
            </span>
          </div>
          <div className="pm-sample-row">
            <span>{t("proc_sample_amount")}</span>
            <span className="pm-sample-badge pm-sample-badge--uncertain">
              {t("proc_sample_uncertain")}
            </span>
          </div>
          <div className="pm-sample-row">
            <span>{t("proc_sample_vendor")}</span>
            <span className="pm-sample-badge pm-sample-badge--verified">
              {t("proc_sample_verified")}
            </span>
          </div>
        </div>
      </div>

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
              : cloudResponseReceived
                ? t("runtime_cloud_response_received")
                : t("runtime_configured_no_response")}
          </strong>
        </div>
        <div>
          <span>{t("runtime_processing_source")}</span>
          <strong>
            {document.analysis
              ? modeLabel(analysisProcessingSource(document.analysis), t)
              : document.source === "demo"
                ? t("runtime_demo_mode")
                : t("runtime_not_run")}
          </strong>
        </div>
        <div>
          <span>{t("runtime_demo_data_label")}</span>
          <strong>{document.source === "demo" ? t("runtime_demo_data") : t("inference_no")}</strong>
        </div>
      </section>
    </div>
  );
}
