import type {
  ComplianceAssessment,
  DocumentRecord,
  Evidence,
  EvidenceVerification,
  HumanReviewStatus,
  Review,
} from "../types";
import { normalize } from "./evidence";

export function humanReviewStatus(review?: Review): HumanReviewStatus {
  return (
    review?.humanReview ?? (review?.status && review.status !== "pending" ? "reviewed" : "pending")
  );
}

export function complianceAssessment(review?: Review): ComplianceAssessment {
  return review?.assessment ?? (review?.status === "satisfied" ? "compliant" : "not-assessed");
}

export function evidenceVerification(
  evidence: Evidence,
  document?: DocumentRecord,
): EvidenceVerification {
  if (evidence.verified) return "verified";
  if (!document || !evidence.excerpt?.trim() || document.paginationVerified === false) {
    return "unverified";
  }
  const index = evidence.sourceIndex ?? evidence.page;
  if (!index || !Number.isInteger(index) || index < 1 || index > document.pages.length) {
    return "unverified";
  }
  const text = document.pages[index - 1];
  if (!text?.trim() || normalize(text).includes(normalize(evidence.excerpt))) return "unverified";
  return "not-found";
}

export const assessmentKeys = {
  "not-assessed": "compliance_assessment_not_assessed",
  compliant: "compliance_assessment_compliant",
  "partially-compliant": "compliance_assessment_partial",
  "non-compliant": "compliance_assessment_noncompliant",
} as const;

export const humanReviewKeys = {
  pending: "compliance_status_pending",
  reviewed: "compliance_status_reviewed",
  approved: "compliance_status_approved",
} as const;

export const evidenceVerificationKeys = {
  verified: "compliance_verified",
  "not-found": "compliance_evidence_not_found",
  unverified: "compliance_evidence_unverified",
} as const;
