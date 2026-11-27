export type ProcessingMode = "demo" | "local" | "cloud" | "hybrid";
export type InferencePreference = "local" | "cloud" | "hybrid";
export type ProcessingSource = "demo" | "on-device" | "cloud" | "cloud-fallback" | "hybrid";
export type DocumentFormat = "pdf" | "docx" | "xlsx";
export type DocumentTextSource = "pdfjs" | "llamaparse" | "browser";
export type PageExtractionMethod = "pdfjs" | "ocr" | "browser" | "none";
export type ReviewStatus = "pending" | "reviewed" | "satisfied" | "unclear";
export type HumanReviewStatus = "pending" | "reviewed" | "approved";
export type ComplianceAssessment =
  "not-assessed" | "compliant" | "partially-compliant" | "non-compliant";
export type EvidenceVerification = "verified" | "not-found" | "unverified";
export type EvidenceAssessment = "supports" | "contradicts" | "insufficient";
export type WorkspaceActivityType =
  | "document-added"
  | "analysis-completed"
  | "evidence-added"
  | "evidence-linked"
  | "evidence-compared"
  | "review-updated";
export type ProjectStatus = "active" | "archived";
export type ProjectDocumentRole =
  "tender" | "terms-of-reference" | "annex" | "certificate" | "evidence" | "other";
export type Category =
  | "Technical"
  | "Administrative"
  | "Legal"
  | "Financial"
  | "Eligibility"
  | "Documentation"
  | "Delivery"
  | "Information Security"
  | "Business Continuity"
  | "Service Management"
  | "Supply Chain"
  | "Legal & Regulatory"
  | "Environmental"
  | "Commercial";
export type Severity = "Critical" | "High" | "Medium" | "Low";

export const CATEGORIES: Category[] = [
  "Technical",
  "Administrative",
  "Legal",
  "Financial",
  "Eligibility",
  "Documentation",
  "Delivery",
  "Information Security",
  "Business Continuity",
  "Service Management",
  "Supply Chain",
  "Legal & Regulatory",
  "Environmental",
  "Commercial",
];
export const STATUSES: ReviewStatus[] = ["pending", "reviewed", "satisfied", "unclear"];
export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

/** page is 1-based for PDFs; sourceIndex and sourceLocation support non-page formats. */
export interface Evidence {
  page: number | null;
  excerpt: string | null;
  verified: boolean;
  sourceIndex?: number | null;
  sourceLocation?: string | null;
}

export interface Requirement {
  id: string;
  description: string;
  category: Category;
  mandatory: boolean;
  evidence: Evidence;
  confidence: number;
}
export interface Deadline {
  id: string;
  description: string;
  date: string | null;
  relatedRequirement: string | null;
  evidence: Evidence;
}
export interface Specification {
  id: string;
  item: string;
  quantity: string | null;
  unit: string | null;
  details: string;
  notes: string;
  evidence: Evidence;
}
export interface Risk {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  kind: "detected" | "suggestion";
  evidence: Evidence;
}

export type SectionInferenceSource = "ON_DEVICE" | "IN_CLOUD" | "CLOUD_FALLBACK";

export interface SectionTrace {
  section: number;
  total: number;
  source: SectionInferenceSource;
  attempts: number;
  durationMs: number;
  timedOut: boolean;
  error?: string;
}

export interface ExecutionReport {
  totalSections: number;
  completedSections: number;
  onDeviceSections: number;
  cloudSections: number;
  cloudFallbackSections: number;
  totalDurationMs: number;
  sections: SectionTrace[];
}

export interface Analysis {
  mode: ProcessingMode;
  processingSource?: ProcessingSource;
  engine: string;
  model?: string;
  summary: string;
  requirements: Requirement[];
  deadlines: Deadline[];
  specifications: Specification[];
  risks: Risk[];
  missing: string[];
  inconsistencies: string[];
  generatedAt: string;
  executionReport?: ExecutionReport;
  limitations?: {
    /** 1-based PDF pages analysed without OCR despite insufficient selectable text. */
    insufficientTextPages: number[];
  };
}

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  source: "demo" | "upload";
  format?: DocumentFormat;
  project?: string;
  analysedOn?: string;
  status?: "Analysed" | "Processing" | "Pending";
  pages: string[];
  sourceLocations?: string[];
  pageExtractionMethods?: PageExtractionMethod[];
  textSource?: DocumentTextSource;
  paginationVerified?: boolean;
  addedAt: string;
  analysis?: Analysis;
}

export interface SupportingEvidenceDocument {
  id: string;
  tenderDocumentId: string;
  name: string;
  size: number;
  format: DocumentFormat;
  pages: string[];
  sourceLocations: string[];
  addedAt: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocumentLink {
  id: string;
  projectId: string;
  documentId: string;
  role: ProjectDocumentRole;
  order: number;
  addedAt: string;
}

export interface EvidenceMatch {
  id: string;
  tenderDocumentId: string;
  requirementId: string;
  evidenceDocumentId: string;
  assessment: EvidenceAssessment;
  confidence: number;
  explanation: string;
  evidence: Evidence;
  processingSource: ProcessingSource;
  model: string;
  generatedAt: string;
}

export interface RequirementEvidenceLink {
  id: string;
  tenderDocumentId: string;
  requirementId: string;
  evidenceDocumentId: string;
  createdAt: string;
}

export interface DiscoveryCandidate {
  id: string;
  title: string;
  issuer: string;
  sourceUrl: string;
  pdfUrl: string;
  pages: number;
  relevanceScore: number;
  publishedDate: string | null;
  description: string;
}

export interface WorkspaceActivity {
  id: string;
  type: WorkspaceActivityType;
  documentId: string;
  documentName?: string;
  title?: string;
  timeAgo?: string;
  tone?: "blue" | "purple" | "orange" | "green";
  relatedDocumentId?: string;
  requirementId?: string;
  at: string;
}

export interface Review {
  status: ReviewStatus;
  notes: string;
  humanReview?: HumanReviewStatus;
  assessment?: ComplianceAssessment;
}
export interface ChatCitation {
  page: number | null;
  sourceIndex?: number | null;
  sourceLocation?: string | null;
  excerpt: string;
  verified: boolean;
}
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  engine?: string;
}
