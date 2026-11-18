import { describe, expect, it } from "vitest";

import {
  getUploadedDocumentActivities,
  summarizeWorkspaceBySource,
} from "@/lib/services/workspaceMetrics";
import type { Analysis, DocumentRecord, Requirement, Risk, WorkspaceActivity } from "@/lib/types";

function makeDocument(
  id: string,
  source: DocumentRecord["source"],
  requirements: Requirement[] = [],
  risks: Risk[] = [],
): DocumentRecord {
  const analysis: Analysis = {
    mode: source === "demo" ? "demo" : "local",
    engine: "test",
    summary: "Test analysis",
    requirements,
    deadlines: [],
    specifications: [],
    risks,
    missing: [],
    inconsistencies: [],
    generatedAt: "2026-01-01T00:00:00.000Z",
  };

  return {
    id,
    name: `${id}.pdf`,
    size: 0,
    source,
    pages: [],
    addedAt: "2026-01-01T00:00:00.000Z",
    analysis,
  };
}

function makeRequirement(id: string): Requirement {
  return {
    id,
    description: `Requirement ${id}`,
    category: "Legal",
    mandatory: true,
    confidence: 1,
    evidence: { page: 1, excerpt: "Evidence", verified: true },
  };
}

function makeRisk(id: string, severity: Risk["severity"]): Risk {
  return {
    id,
    title: `Risk ${id}`,
    severity,
    kind: "detected",
    explanation: "Test risk",
    evidence: { page: 1, excerpt: "Evidence", verified: true },
  };
}

describe("summarizeWorkspaceBySource", () => {
  it("calculates uploaded and demo metrics independently without placeholder counts", () => {
    const metrics = summarizeWorkspaceBySource(
      [
        makeDocument(
          "upload-analyzed",
          "upload",
          [makeRequirement("upload-r1")],
          [makeRisk("upload-risk", "Critical")],
        ),
        makeDocument("upload-pending", "upload"),
        makeDocument(
          "demo",
          "demo",
          [makeRequirement("demo-r1"), makeRequirement("demo-r2")],
          [makeRisk("demo-risk", "Critical")],
        ),
      ],
      { "upload-r1": { status: "reviewed", notes: "" } },
    );

    expect(metrics.upload).toEqual({
      documentCount: 2,
      requirementCount: 1,
      criticalRiskCount: 1,
      pendingReviewCount: 0,
    });
    expect(metrics.demo).toEqual({
      documentCount: 1,
      requirementCount: 2,
      criticalRiskCount: 1,
      pendingReviewCount: 2,
    });
  });

  it("shows activity only for uploaded documents without deleting stored entries", () => {
    const documents = [makeDocument("uploaded", "upload"), makeDocument("demo", "demo")];
    const activities: WorkspaceActivity[] = [
      {
        id: "upload-action",
        type: "document-added",
        documentId: "uploaded",
        at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "demo-action",
        type: "analysis-completed",
        documentId: "demo",
        at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "legacy-sample-action",
        type: "document-added",
        documentId: "doc-1",
        at: "2026-01-01T00:00:00.000Z",
      },
    ];

    expect(getUploadedDocumentActivities(documents, activities).map(({ id }) => id)).toEqual([
      "upload-action",
    ]);
    expect(activities).toHaveLength(3);
  });
});
