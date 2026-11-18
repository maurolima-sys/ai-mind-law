import type { DocumentRecord, Review, WorkspaceActivity } from "../types";
import { humanReviewStatus } from "./compliance";

export interface WorkspaceMetrics {
  documentCount: number;
  requirementCount: number;
  criticalRiskCount: number;
  pendingReviewCount: number;
}

export interface WorkspaceMetricsBySource {
  upload: WorkspaceMetrics;
  demo: WorkspaceMetrics;
}

function summarizeDocuments(
  documents: DocumentRecord[],
  reviews: Record<string, Review>,
): WorkspaceMetrics {
  const requirements = documents.flatMap((document) => document.analysis?.requirements ?? []);
  const criticalRiskCount = documents.reduce(
    (count, document) =>
      count + (document.analysis?.risks.filter((risk) => risk.severity === "Critical").length ?? 0),
    0,
  );

  return {
    documentCount: documents.length,
    requirementCount: requirements.length,
    criticalRiskCount,
    pendingReviewCount: requirements.filter(
      (requirement) => humanReviewStatus(reviews[requirement.id]) === "pending",
    ).length,
  };
}

export function summarizeWorkspaceBySource(
  documents: DocumentRecord[],
  reviews: Record<string, Review>,
): WorkspaceMetricsBySource {
  return {
    upload: summarizeDocuments(
      documents.filter((document) => document.source === "upload"),
      reviews,
    ),
    demo: summarizeDocuments(
      documents.filter((document) => document.source === "demo"),
      reviews,
    ),
  };
}

export function getUploadedDocumentActivities(
  documents: DocumentRecord[],
  activities: WorkspaceActivity[],
): WorkspaceActivity[] {
  const uploadedDocumentIds = new Set(
    documents.filter((document) => document.source === "upload").map((document) => document.id),
  );
  return activities.filter((activity) => uploadedDocumentIds.has(activity.documentId));
}
