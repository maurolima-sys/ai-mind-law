import "fake-indexeddb/auto";

import { Blob as NodeBlob } from "node:buffer";
import { beforeEach, describe, expect, it } from "vitest";

import {
  deleteProjectRecord,
  loadLocalWorkspace,
  saveDocumentBundle,
  saveProjectDocumentLink,
  saveProjectRecord,
} from "@/lib/services/localWorkspace";
import type { DocumentRecord, ProjectDocumentLink, ProjectRecord } from "@/lib/types";

const DATABASE_NAME = "pocketmind-local-workspace";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function removeDatabase() {
  await requestResult(indexedDB.deleteDatabase(DATABASE_NAME));
}

async function createVersionOneWorkspace() {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const upgrade = request.result;
      for (const name of ["documents", "document-files", "evidence-documents", "evidence-files"]) {
        upgrade.createObjectStore(name, { keyPath: "id" });
      }
      upgrade.createObjectStore("workspace-state", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const document: DocumentRecord = {
    id: "upload-v1",
    name: "legacy.pdf",
    size: 12,
    source: "upload",
    format: "pdf",
    pages: ["The deadline is 30 days."],
    sourceLocations: ["Page 1"],
    paginationVerified: true,
    addedAt: "2026-11-18T00:00:00.000Z",
    analysis: {
      mode: "local",
      processingSource: "on-device",
      engine: "Local model",
      summary: "Legacy analysis",
      requirements: [],
      deadlines: [],
      specifications: [],
      risks: [],
      missing: [],
      inconsistencies: [],
      generatedAt: "2026-11-18T00:01:00.000Z",
    },
  };

  const transaction = database.transaction(
    ["documents", "document-files", "workspace-state"],
    "readwrite",
  );
  const done = transactionDone(transaction);
  transaction.objectStore("documents").put(document);
  transaction.objectStore("document-files").put({
    id: document.id,
    blob: new NodeBlob(["legacy file"], { type: "application/pdf" }),
    name: document.name,
    type: "application/pdf",
    lastModified: 1,
  });
  transaction.objectStore("workspace-state").put({
    key: "workspace",
    value: {
      reviews: { legacy: { status: "reviewed", notes: "kept" } },
      evidenceMatches: [],
      evidenceLinks: [],
      activities: [],
    },
  });
  await done;
  database.close();
}

describe("local workspace IndexedDB migration", () => {
  beforeEach(async () => {
    await removeDatabase();
  });

  it("preserves v1 documents, files, analyses, and workspace state while adding v2 stores", async () => {
    await createVersionOneWorkspace();

    const workspace = await loadLocalWorkspace();

    expect(workspace.documents).toHaveLength(1);
    expect(workspace.documents[0]).toMatchObject({
      id: "upload-v1",
      analysis: { summary: "Legacy analysis" },
    });
    expect(workspace.filesByDocumentId["upload-v1"]?.name).toBe("legacy.pdf");
    expect(workspace.filesByDocumentId["upload-v1"]).toBeDefined();
    expect(workspace.reviews["legacy"]).toEqual({ status: "reviewed", notes: "kept" });
    expect(workspace.projects).toEqual([]);
    expect(workspace.projectDocumentLinks).toEqual([]);

    const database = await requestResult(indexedDB.open(DATABASE_NAME, 2));
    expect([...database.objectStoreNames]).toEqual(
      expect.arrayContaining([
        "documents",
        "document-files",
        "evidence-documents",
        "evidence-files",
        "workspace-state",
        "projects",
        "project-document-links",
      ]),
    );
    const storedFile = await requestResult(
      database
        .transaction("document-files", "readonly")
        .objectStore("document-files")
        .get("upload-v1"),
    );
    expect((storedFile.blob as Blob).size).toBe(11);
    database.close();
  });

  it("deduplicates project-document links without duplicating documents or blobs", async () => {
    const document: DocumentRecord = {
      id: "upload-project",
      name: "tender.pdf",
      size: 6,
      source: "upload",
      format: "pdf",
      pages: ["Tender text"],
      addedAt: "2026-11-18T00:00:00.000Z",
    };
    const project: ProjectRecord = {
      id: "project-1",
      name: "Northbridge",
      description: "",
      status: "active",
      createdAt: "2026-11-18T00:00:00.000Z",
      updatedAt: "2026-11-18T00:00:00.000Z",
    };
    await saveDocumentBundle(
      document,
      new File(["tender"], document.name, { type: "application/pdf" }),
    );
    await saveProjectRecord(project);

    const firstLink: ProjectDocumentLink = {
      id: "link-1",
      projectId: project.id,
      documentId: document.id,
      role: "tender",
      order: 0,
      addedAt: "2026-11-18T00:02:00.000Z",
    };
    const saved = await saveProjectDocumentLink(firstLink);
    const updated = await saveProjectDocumentLink({
      ...firstLink,
      id: "link-duplicate",
      role: "annex",
      order: 1,
      addedAt: "2026-11-18T00:03:00.000Z",
    });

    const workspace = await loadLocalWorkspace();
    expect(saved.id).toBe("link-1");
    expect(updated.id).toBe("link-1");
    expect(updated.addedAt).toBe(firstLink.addedAt);
    expect(workspace.projectDocumentLinks).toEqual([
      expect.objectContaining({
        id: "link-1",
        role: "annex",
        order: 1,
      }),
    ]);
    expect(workspace.documents).toHaveLength(1);
    expect(Object.keys(workspace.filesByDocumentId)).toEqual([document.id]);
  });

  it("rejects orphan links and removes only links when a project is deleted", async () => {
    await expect(
      saveProjectDocumentLink({
        id: "orphan",
        projectId: "missing-project",
        documentId: "missing-document",
        role: "other",
        order: 0,
        addedAt: "2026-11-18T00:00:00.000Z",
      }),
    ).rejects.toThrow("The selected project no longer exists");

    const project: ProjectRecord = {
      id: "project-delete",
      name: "Delete metadata only",
      description: "",
      status: "active",
      createdAt: "2026-11-18T00:00:00.000Z",
      updatedAt: "2026-11-18T00:00:00.000Z",
    };
    await saveProjectRecord(project);
    await expect(
      saveProjectDocumentLink({
        id: "missing-document-link",
        projectId: project.id,
        documentId: "missing-document",
        role: "other",
        order: 0,
        addedAt: "2026-11-18T00:00:00.000Z",
      }),
    ).rejects.toThrow("The selected document no longer exists");

    const document: DocumentRecord = {
      id: "upload-retained",
      name: "retained.docx",
      size: 8,
      source: "upload",
      format: "docx",
      pages: ["Retained"],
      addedAt: "2026-11-18T00:00:00.000Z",
    };
    await saveDocumentBundle(
      document,
      new File(["retained"], document.name, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );
    await saveProjectDocumentLink({
      id: "link-retained",
      projectId: project.id,
      documentId: document.id,
      role: "other",
      order: 0,
      addedAt: "2026-11-18T00:00:00.000Z",
    });

    await deleteProjectRecord(project.id);

    const workspace = await loadLocalWorkspace();
    expect(workspace.projects).toEqual([]);
    expect(workspace.projectDocumentLinks).toEqual([]);
    expect(workspace.documents.map((item) => item.id)).toEqual([document.id]);
    expect(workspace.filesByDocumentId[document.id]?.name).toBe(document.name);
  });
});
