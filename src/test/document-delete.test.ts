import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  deleteDocumentRecord,
  loadLocalWorkspace,
  saveDocumentBundle,
  saveLocalWorkspaceState,
  saveProjectDocumentLink,
  saveProjectRecord,
} from "@/lib/services/localWorkspace";
import { createProjectRecord } from "@/lib/services/projects";
import type { DocumentRecord, ProjectDocumentLink, Review } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

const DATABASE_NAME = "pocketmind-local-workspace";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeDatabase() {
  await requestResult(indexedDB.deleteDatabase(DATABASE_NAME));
}

function makeDocument(id: string, source: DocumentRecord["source"] = "upload"): DocumentRecord {
  return {
    id,
    name: `${id}.pdf`,
    size: 1024,
    source,
    format: "pdf",
    pages: ["page text"],
    addedAt: new Date().toISOString(),
  };
}

function makeFile(name: string): File {
  return new File(["content"], name, { type: "application/pdf" });
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe("deleteDocumentRecord", () => {
  beforeEach(async () => {
    await removeDatabase();
  });

  it("removes an uploaded document and its file from the workspace", async () => {
    const doc = makeDocument("upload-001");
    await saveDocumentBundle(doc, makeFile(doc.name));

    await deleteDocumentRecord(doc.id);

    const workspace = await loadLocalWorkspace();
    expect(workspace.documents.find((d) => d.id === doc.id)).toBeUndefined();
    expect(workspace.filesByDocumentId[doc.id]).toBeUndefined();
  });

  it("does not affect a second document with the same file name", async () => {
    const docA = makeDocument("upload-A");
    const docB = makeDocument("upload-B");
    // Both have the same display name but different IDs
    docA.name = "tender.pdf";
    docB.name = "tender.pdf";

    await saveDocumentBundle(docA, makeFile(docA.name));
    await saveDocumentBundle(docB, makeFile(docB.name));

    await deleteDocumentRecord(docA.id);

    const workspace = await loadLocalWorkspace();
    expect(workspace.documents.find((d) => d.id === docA.id)).toBeUndefined();
    expect(workspace.documents.find((d) => d.id === docB.id)).toBeDefined();
    expect(workspace.filesByDocumentId[docB.id]).toBeDefined();
  });

  it("removes project-document links for the deleted document only", async () => {
    const docA = makeDocument("upload-link-A");
    const docB = makeDocument("upload-link-B");
    await saveDocumentBundle(docA, makeFile(docA.name));
    await saveDocumentBundle(docB, makeFile(docB.name));

    const project = createProjectRecord({ name: "Test Project", description: "" });
    await saveProjectRecord(project);

    const linkA: ProjectDocumentLink = {
      id: "link-A",
      projectId: project.id,
      documentId: docA.id,
      role: "tender",
      order: 0,
      addedAt: new Date().toISOString(),
    };
    const linkB: ProjectDocumentLink = {
      id: "link-B",
      projectId: project.id,
      documentId: docB.id,
      role: "annex",
      order: 1,
      addedAt: new Date().toISOString(),
    };
    await saveProjectDocumentLink(linkA);
    await saveProjectDocumentLink(linkB);

    await deleteDocumentRecord(docA.id);

    const workspace = await loadLocalWorkspace();
    expect(workspace.projectDocumentLinks.find((l) => l.id === "link-A")).toBeUndefined();
    expect(workspace.projectDocumentLinks.find((l) => l.id === "link-B")).toBeDefined();
  });

  it("removes reviews, evidenceLinks, evidenceMatches, and activities for the deleted document", async () => {
    const doc = makeDocument("upload-state");
    await saveDocumentBundle(doc, makeFile(doc.name));

    const reviews: Record<string, Review> = {
      [`${doc.id}-req-1`]: { status: "pending", notes: "check this" },
      "other-doc-req-1": { status: "reviewed", notes: "" },
    };
    await saveLocalWorkspaceState({
      reviews,
      evidenceMatches: [
        {
          id: "match-1",
          tenderDocumentId: doc.id,
          requirementId: "req-1",
          evidenceDocumentId: "ev-1",
          assessment: "supports",
          confidence: 0.9,
          explanation: "ok",
          evidence: { page: 1, excerpt: "text", verified: true },
          processingSource: "on-device",
          model: "gemini",
          generatedAt: new Date().toISOString(),
        },
        {
          id: "match-2",
          tenderDocumentId: "other-doc",
          requirementId: "req-2",
          evidenceDocumentId: "ev-2",
          assessment: "insufficient",
          confidence: 0.5,
          explanation: "unclear",
          evidence: { page: 2, excerpt: "other", verified: false },
          processingSource: "cloud",
          model: "gemini",
          generatedAt: new Date().toISOString(),
        },
      ],
      evidenceLinks: [
        {
          id: "elink-1",
          tenderDocumentId: doc.id,
          requirementId: "req-1",
          evidenceDocumentId: "ev-1",
          createdAt: new Date().toISOString(),
        },
        {
          id: "elink-2",
          tenderDocumentId: "other-doc",
          requirementId: "req-2",
          evidenceDocumentId: "ev-2",
          createdAt: new Date().toISOString(),
        },
      ],
      activities: [
        {
          id: "act-1",
          type: "document-added",
          documentId: doc.id,
          at: new Date().toISOString(),
        },
        {
          id: "act-2",
          type: "analysis-completed",
          documentId: "other-doc",
          at: new Date().toISOString(),
        },
        {
          id: "act-3",
          type: "evidence-added",
          documentId: "other-doc",
          relatedDocumentId: doc.id,
          at: new Date().toISOString(),
        },
      ],
    });

    await deleteDocumentRecord(doc.id);

    const workspace = await loadLocalWorkspace();

    // Reviews for deleted document are gone; other doc's review remains
    expect(Object.keys(workspace.reviews)).not.toContain(`${doc.id}-req-1`);
    expect(Object.keys(workspace.reviews)).toContain("other-doc-req-1");

    // Evidence matches for deleted document are gone
    expect(workspace.evidenceMatches.find((m) => m.id === "match-1")).toBeUndefined();
    expect(workspace.evidenceMatches.find((m) => m.id === "match-2")).toBeDefined();

    // Evidence links for deleted document are gone
    expect(workspace.evidenceLinks.find((l) => l.id === "elink-1")).toBeUndefined();
    expect(workspace.evidenceLinks.find((l) => l.id === "elink-2")).toBeDefined();

    // Activities referencing deleted document (as documentId or relatedDocumentId) are gone
    expect(workspace.activities.find((a) => a.id === "act-1")).toBeUndefined();
    expect(workspace.activities.find((a) => a.id === "act-2")).toBeDefined();
    expect(workspace.activities.find((a) => a.id === "act-3")).toBeUndefined();
  });

  it("does not persist demo documents and upload deletion does not affect other uploads", async () => {
    // saveDocumentBundle returns early for demo source — demo docs are never persisted
    const demo = makeDocument("demo-doc", "demo");
    const upload = makeDocument("upload-guard");
    await saveDocumentBundle(demo, makeFile(demo.name)); // no-op for demo
    await saveDocumentBundle(upload, makeFile(upload.name));

    await deleteDocumentRecord(upload.id);

    const workspace = await loadLocalWorkspace();
    expect(workspace.documents.find((d) => d.id === upload.id)).toBeUndefined();
    // demo was never persisted
    expect(workspace.documents.find((d) => d.id === demo.id)).toBeUndefined();
  });

  it("leaves the workspace unchanged when deleting a non-existent ID", async () => {
    const doc = makeDocument("upload-existing");
    await saveDocumentBundle(doc, makeFile(doc.name));

    // Deleting a non-existent ID should not throw and should not affect existing documents
    await expect(deleteDocumentRecord("non-existent-id")).resolves.toBeUndefined();

    const workspace = await loadLocalWorkspace();
    expect(workspace.documents.find((d) => d.id === doc.id)).toBeDefined();
  });
});
