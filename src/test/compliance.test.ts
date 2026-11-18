import { describe, expect, it } from "vitest";

import {
  complianceAssessment,
  evidenceVerification,
  humanReviewStatus,
} from "@/lib/services/compliance";
import { complianceCsv } from "@/lib/services/csv";
import { summarizeWorkspaceBySource } from "@/lib/services/workspaceMetrics";
import type { TranslationKey } from "@/lib/i18n/en";
import type { DocumentRecord, Evidence, Requirement } from "@/lib/types";

const evidence: Evidence = { page: 1, excerpt: "quoted text", verified: false };
const document: DocumentRecord = {
  id: "doc",
  name: "test.pdf",
  source: "upload",
  size: 1,
  format: "pdf",
  pages: ["Different source text"],
  paginationVerified: true,
  addedAt: "2026-01-01",
};

describe("compliance dimensions", () => {
  it("distinguishes verified, missing matches, and unverifiable evidence", () => {
    expect(evidenceVerification({ ...evidence, verified: true }, document)).toBe("verified");
    expect(evidenceVerification(evidence, document)).toBe("not-found");
    expect(evidenceVerification({ ...evidence, excerpt: null }, document)).toBe("unverified");
    expect(evidenceVerification(evidence, { ...document, paginationVerified: false })).toBe(
      "unverified",
    );
    expect(evidenceVerification(evidence, { ...document, pages: ["quoted text"] })).toBe(
      "unverified",
    );
    expect(evidenceVerification({ ...evidence, page: 2 }, document)).toBe("unverified");
  });

  it("preserves legacy values without inventing approvals and allows independent overrides", () => {
    expect(complianceAssessment({ status: "satisfied", notes: "saved" })).toBe("compliant");
    expect(humanReviewStatus({ status: "satisfied", notes: "saved" })).toBe("reviewed");
    expect(complianceAssessment({ status: "unclear", notes: "saved" })).toBe("not-assessed");
    expect(humanReviewStatus({ status: "pending", notes: "", humanReview: "approved" })).toBe(
      "approved",
    );
    expect(
      complianceAssessment({ status: "satisfied", notes: "", assessment: "non-compliant" }),
    ).toBe("non-compliant");
  });

  it("exports each independent status and counts pending human reviews", () => {
    const requirement: Requirement = {
      id: "r1",
      description: "Requirement",
      category: "Legal",
      mandatory: true,
      confidence: 1,
      evidence: { ...evidence, verified: true },
    };
    const reviews = {
      r1: {
        status: "pending" as const,
        notes: "note",
        assessment: "non-compliant" as const,
        humanReview: "pending" as const,
      },
    };
    const t = (key: TranslationKey) => key;
    const csv = complianceCsv([requirement], reviews, t, document);
    expect(csv).toContain(
      "compliance_col_evidence_verification,compliance_col_assessment,csv_col_review_status",
    );
    expect(csv).toContain(
      "compliance_verified,compliance_assessment_noncompliant,compliance_status_pending,,note",
    );
    expect(
      complianceCsv([requirement], { r1: { status: "unclear", notes: "saved" } }, t, document),
    ).toContain("compliance_status_reviewed,compliance_status_unclear,saved");
    const analyzed = {
      ...document,
      analysis: {
        mode: "local" as const,
        engine: "test",
        summary: "",
        requirements: [requirement],
        deadlines: [],
        specifications: [],
        risks: [],
        missing: [],
        inconsistencies: [],
        generatedAt: "2026-01-01",
      },
    };
    expect(summarizeWorkspaceBySource([analyzed], reviews).upload.pendingReviewCount).toBe(1);
    expect(
      summarizeWorkspaceBySource([analyzed], {
        r1: { ...reviews.r1, humanReview: "approved" },
      }).upload.pendingReviewCount,
    ).toBe(0);
  });
});
