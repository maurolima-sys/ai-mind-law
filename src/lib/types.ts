export type ProcessingMode = "demo" | "local" | "cloud" | "hybrid";
export type InferencePreference = "local" | "cloud" | "hybrid";
export type ProcessingSource = "demo" | "on-device" | "cloud" | "cloud-fallback" | "hybrid";
export type ReviewStatus = "pending" | "reviewed" | "satisfied" | "unclear";
export type Category =
  | "Technical"
  | "Administrative"
  | "Legal"
  | "Financial"
  | "Eligibility"
  | "Documentation"
  | "Delivery";
export type Severity = "Critical" | "High" | "Medium" | "Low";

export const CATEGORIES: Category[] = [
  "Technical",
  "Administrative",
  "Legal",
  "Financial",
  "Eligibility",
  "Documentation",
  "Delivery",
];
export const STATUSES: ReviewStatus[] = ["pending", "reviewed", "satisfied", "unclear"];
export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

/** page is 1-based; null when unknown. verified = excerpt was found on that page. */
export interface Evidence {
  page: number | null;
  excerpt: string | null;
  verified: boolean;
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
}

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  source: "demo" | "upload";
  pages: string[];
  addedAt: string;
  analysis?: Analysis;
}

export interface Review {
  status: ReviewStatus;
  notes: string;
}
export interface ChatCitation {
  page: number;
  excerpt: string;
  verified: boolean;
}
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  engine?: string;
}
