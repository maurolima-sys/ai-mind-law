import { describe, expect, it } from "vitest";

import { resolveProjectDocuments } from "@/lib/services/projectDocuments";
import {
  buildProjectOverview,
  createProjectRecord,
  updateProjectRecord,
  validateProjectDraft,
} from "@/lib/services/projects";
import type {
  Analysis,
  DocumentRecord,
  ProjectDocumentLink,
  ProjectRecord,
  Review,
  WorkspaceActivity,
} from "@/lib/types";

const now = new Date("2026-11-18T12:00:00.000Z");

function analysis(requirements = 1, criticalRisks = 0): Analysis {
  return {
    mode: "local",
    processingSource: "on-device",
    engine: "Local model",
    summary: "Analysis",
    requirements: Array.from({ length: requirements }, (_, index) => ({
      id: `requirement-${index}`,
      description: `Requirement ${index}`,
      category: "Technical",
      mandatory: true,
      confidence: 1,
      evidence: { page: 1, excerpt: "source", verified: true },
    })),
    deadlines: [],
    specifications: [],
    risks: Array.from({ length: criticalRisks }, (_, index) => ({
      id: `risk-${index}`,
      title: `Risk ${index}`,
      severity: "Critical",
      explanation: "Review required",
      kind: "detected",
      evidence: { page: 1, excerpt: "source", verified: true },
    })),
    missing: [],
    inconsistencies: [],
    generatedAt: "2026-11-18T11:00:00.000Z",
  };
}

function document(
  id: string,
  source: DocumentRecord["source"] = "upload",
  documentAnalysis?: Analysis,
): DocumentRecord {
  return {
    id,
    name: `${id}.pdf`,
    size: 100,
    source,
    format: "pdf",
    pages: ["source"],
    addedAt: "2026-11-18T10:00:00.000Z",
    ...(documentAnalysis ? { analysis: documentAnalysis } : {}),
  };
}

function project(): ProjectRecord {
  return {
    id: "project-1",
    name: "Northbridge",
    description: "Multi-document review",
    status: "active",
    createdAt: "2026-11-18T10:00:00.000Z",
    updatedAt: "2026-11-18T10:00:00.000Z",
  };
}

function link(
  id: string,
  documentId: string,
  order: number,
  addedAt = "2026-11-18T10:00:00.000Z",
): ProjectDocumentLink {
  return {
    id,
    projectId: "project-1",
    documentId,
    role: "other",
    order,
    addedAt,
  };
}

describe("projectDocuments", () => {
  it("orders valid links, deduplicates documents, and reports broken associations", () => {
    const documents = [document("first"), document("second"), document("demo", "demo")];
    const resolution = resolveProjectDocuments(
      "project-1",
      [
        link("second-link", "second", 2),
        link("missing-link", "missing", 0),
        link("first-link", "first", 1),
        link("duplicate-link", "first", 3),
        link("invalid-order", "second", -1),
        link("demo-link", "demo", 4),
      ],
      documents,
    );

    expect(resolution.entries.map(({ document: item }) => item.id)).toEqual(["first", "second"]);
    expect(resolution.issues.map((issue) => issue.reason).sort()).toEqual([
      "demo-excluded",
      "duplicate-document",
      "invalid-order",
      "missing-document",
    ]);
  });

  it("can include demo documents only when explicitly requested", () => {
    const result = resolveProjectDocuments(
      "project-1",
      [link("demo", "demo", 0)],
      [document("demo", "demo")],
      { includeDemo: true },
    );

    expect(result.entries).toHaveLength(1);
    expect(result.issues).toEqual([]);
  });
});

describe("projects", () => {
  it("creates and updates normalized project metadata", () => {
    const created = createProjectRecord(
      { name: "  Northbridge  ", description: "  Tender review  " },
      { id: "project-new", now },
    );
    expect(created).toEqual({
      id: "project-new",
      name: "Northbridge",
      description: "Tender review",
      status: "active",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    const updated = updateProjectRecord(
      created,
      { status: "archived", name: "  Archived Northbridge " },
      new Date("2026-11-18T13:00:00.000Z"),
    );
    expect(updated).toMatchObject({
      name: "Archived Northbridge",
      status: "archived",
      createdAt: now.toISOString(),
      updatedAt: "2026-11-18T13:00:00.000Z",
    });
  });

  it("rejects blank names and empty projects still return zero metrics", () => {
    expect(validateProjectDraft({ name: " ", description: "" })).toBe("Enter a project name.");
    expect(() => createProjectRecord({ name: "", description: "" }, { now })).toThrow(
      "Enter a project name.",
    );

    const overview = buildProjectOverview(project(), [], [], {}, []);
    expect(overview.metrics).toEqual({
      documentCount: 0,
      requirementCount: 0,
      criticalRiskCount: 0,
      pendingReviewCount: 0,
    });
    expect(overview.documents).toEqual([]);
    expect(overview.activities).toEqual([]);
  });

  it("excludes demo analysis metrics by default and derives project-only activity", () => {
    const uploaded = document("uploaded", "upload", analysis(2, 1));
    const demo = document("demo", "demo", analysis(20, 10));
    const unrelated = document("unrelated", "upload", analysis(30, 20));
    const reviews: Record<string, Review> = {
      "requirement-0": { status: "pending", notes: "" },
      "requirement-1": { status: "reviewed", notes: "" },
    };
    const activities: WorkspaceActivity[] = [
      {
        id: "project-activity",
        type: "analysis-completed",
        documentId: uploaded.id,
        at: "2026-11-18T11:00:00.000Z",
      },
      {
        id: "demo-activity",
        type: "analysis-completed",
        documentId: demo.id,
        at: "2026-11-18T11:10:00.000Z",
      },
      {
        id: "unrelated-activity",
        type: "analysis-completed",
        documentId: unrelated.id,
        at: "2026-11-18T11:20:00.000Z",
      },
    ];

    const overview = buildProjectOverview(
      project(),
      [uploaded, demo, unrelated],
      [link("uploaded-link", uploaded.id, 0), link("demo-link", demo.id, 1)],
      reviews,
      activities,
    );

    expect(overview.metrics).toEqual({
      documentCount: 1,
      requirementCount: 2,
      criticalRiskCount: 1,
      pendingReviewCount: 1,
    });
    expect(overview.documents.map(({ document: item }) => item.id)).toEqual(["uploaded"]);
    expect(overview.activities.map((activity) => activity.id)).toEqual(["project-activity"]);
  });

  it("does not mutate global document or analysis records while aggregating", () => {
    const uploaded = document("uploaded", "upload", analysis(1, 0));
    const snapshot = structuredClone(uploaded);

    buildProjectOverview(project(), [uploaded], [link("link", uploaded.id, 0)], {}, []);

    expect(uploaded).toEqual(snapshot);
  });
});
