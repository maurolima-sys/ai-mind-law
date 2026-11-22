import type {
  DocumentRecord,
  EvidenceMatch,
  ProjectDocumentLink,
  ProjectRecord,
  RequirementEvidenceLink,
  Review,
  SupportingEvidenceDocument,
  WorkspaceActivity,
} from "@/lib/types";

const DATABASE_NAME = "pocketmind-local-workspace";
const DATABASE_VERSION = 2;
const DOCUMENTS = "documents";
const DOCUMENT_FILES = "document-files";
const EVIDENCE_DOCUMENTS = "evidence-documents";
const EVIDENCE_FILES = "evidence-files";
const WORKSPACE_STATE = "workspace-state";
const PROJECTS = "projects";
const PROJECT_DOCUMENT_LINKS = "project-document-links";

type StoredFile = {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
};

export interface LocalWorkspaceState {
  reviews: Record<string, Review>;
  evidenceMatches: EvidenceMatch[];
  evidenceLinks: RequirementEvidenceLink[];
  activities: WorkspaceActivity[];
}

export interface LoadedLocalWorkspace extends LocalWorkspaceState {
  documents: DocumentRecord[];
  filesByDocumentId: Record<string, File>;
  evidenceDocuments: SupportingEvidenceDocument[];
  filesByEvidenceId: Record<string, File>;
  projects: ProjectRecord[];
  projectDocumentLinks: ProjectDocumentLink[];
}

const emptyState = (): LocalWorkspaceState => ({
  reviews: {},
  evidenceMatches: [],
  evidenceLinks: [],
  activities: [],
});

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support local document storage."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DOCUMENTS)) {
        database.createObjectStore(DOCUMENTS, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(DOCUMENT_FILES)) {
        database.createObjectStore(DOCUMENT_FILES, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(EVIDENCE_DOCUMENTS)) {
        database.createObjectStore(EVIDENCE_DOCUMENTS, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(EVIDENCE_FILES)) {
        database.createObjectStore(EVIDENCE_FILES, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(WORKSPACE_STATE)) {
        database.createObjectStore(WORKSPACE_STATE, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(PROJECTS)) {
        database.createObjectStore(PROJECTS, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(PROJECT_DOCUMENT_LINKS)) {
        database.createObjectStore(PROJECT_DOCUMENT_LINKS, { keyPath: "id" });
      }
      const links = request.transaction!.objectStore(PROJECT_DOCUMENT_LINKS);
      if (!links.indexNames.contains("projectId")) {
        links.createIndex("projectId", "projectId");
      }
      if (!links.indexNames.contains("documentId")) {
        links.createIndex("documentId", "documentId");
      }
      if (!links.indexNames.contains("project-document-unique")) {
        links.createIndex("project-document-unique", ["projectId", "documentId"], {
          unique: true,
        });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Local storage could not be opened."));
    request.onblocked = () =>
      reject(new Error("Close other PocketMind tabs to update local storage."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Local storage transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Local storage transaction was cancelled."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage request failed."));
  });
}

function getAllRecords<T>(store: IDBObjectStore): Promise<T[]> {
  return requestResult(store.getAll() as IDBRequest<T[]>);
}

function getRecord<T>(store: IDBObjectStore, key: IDBValidKey): Promise<T | undefined> {
  return requestResult(store.get(key) as IDBRequest<T | undefined>);
}

function toFile(stored: StoredFile): File {
  return new File([stored.blob], stored.name, {
    type: stored.type,
    lastModified: stored.lastModified,
  });
}

export async function loadLocalWorkspace(): Promise<LoadedLocalWorkspace> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(
      [
        DOCUMENTS,
        DOCUMENT_FILES,
        EVIDENCE_DOCUMENTS,
        EVIDENCE_FILES,
        WORKSPACE_STATE,
        PROJECTS,
        PROJECT_DOCUMENT_LINKS,
      ],
      "readonly",
    );
    const done = transactionDone(transaction);
    const documentsRequest = getAllRecords<DocumentRecord>(transaction.objectStore(DOCUMENTS));
    const filesRequest = getAllRecords<StoredFile>(transaction.objectStore(DOCUMENT_FILES));
    const evidenceRequest = getAllRecords<SupportingEvidenceDocument>(
      transaction.objectStore(EVIDENCE_DOCUMENTS),
    );
    const evidenceFilesRequest = getAllRecords<StoredFile>(transaction.objectStore(EVIDENCE_FILES));
    const projectsRequest = getAllRecords<ProjectRecord>(transaction.objectStore(PROJECTS));
    const projectLinksRequest = getAllRecords<ProjectDocumentLink>(
      transaction.objectStore(PROJECT_DOCUMENT_LINKS),
    );
    const stateRequest = getRecord<{
      key: string;
      value: LocalWorkspaceState;
    }>(transaction.objectStore(WORKSPACE_STATE), "workspace");
    const [
      documents,
      files,
      evidenceDocuments,
      evidenceFiles,
      projects,
      projectDocumentLinks,
      storedState,
    ] = await Promise.all([
      documentsRequest,
      filesRequest,
      evidenceRequest,
      evidenceFilesRequest,
      projectsRequest,
      projectLinksRequest,
      stateRequest,
    ]);
    await done;

    return {
      documents,
      filesByDocumentId: Object.fromEntries(files.map((item) => [item.id, toFile(item)])),
      evidenceDocuments,
      filesByEvidenceId: Object.fromEntries(evidenceFiles.map((item) => [item.id, toFile(item)])),
      projects,
      projectDocumentLinks,
      ...(storedState?.value ?? emptyState()),
    };
  } finally {
    database.close();
  }
}

export async function saveDocumentRecord(document: DocumentRecord): Promise<void> {
  if (document.source === "demo") return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DOCUMENTS, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(DOCUMENTS).put(document);
    await done;
  } finally {
    database.close();
  }
}

export async function saveDocumentBundle(document: DocumentRecord, file: File): Promise<void> {
  if (document.source === "demo") return;
  const database = await openDatabase();
  try {
    const transaction = database.transaction([DOCUMENTS, DOCUMENT_FILES], "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(DOCUMENTS).put(document);
    transaction.objectStore(DOCUMENT_FILES).put({
      id: document.id,
      blob: file,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
    } satisfies StoredFile);
    await done;
  } finally {
    database.close();
  }
}

export async function saveDocumentFile(documentId: string, file: File): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DOCUMENT_FILES, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(DOCUMENT_FILES).put({
      id: documentId,
      blob: file,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
    } satisfies StoredFile);
    await done;
  } finally {
    database.close();
  }
}

export async function saveEvidenceDocument(
  evidence: SupportingEvidenceDocument,
  file: File,
): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([EVIDENCE_DOCUMENTS, EVIDENCE_FILES], "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(EVIDENCE_DOCUMENTS).put(evidence);
    transaction.objectStore(EVIDENCE_FILES).put({
      id: evidence.id,
      blob: file,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
    } satisfies StoredFile);
    await done;
  } finally {
    database.close();
  }
}

export async function deleteEvidenceDocument(evidenceId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([EVIDENCE_DOCUMENTS, EVIDENCE_FILES], "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(EVIDENCE_DOCUMENTS).delete(evidenceId);
    transaction.objectStore(EVIDENCE_FILES).delete(evidenceId);
    await done;
  } finally {
    database.close();
  }
}

export async function saveLocalWorkspaceState(state: LocalWorkspaceState): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(WORKSPACE_STATE, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(WORKSPACE_STATE).put({ key: "workspace", value: state });
    await done;
  } finally {
    database.close();
  }
}

export async function saveProjectRecord(project: ProjectRecord): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PROJECTS, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(PROJECTS).put(project);
    await done;
  } finally {
    database.close();
  }
}

export async function saveProjectDocumentLink(
  link: ProjectDocumentLink,
): Promise<ProjectDocumentLink> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(
      [DOCUMENTS, PROJECTS, PROJECT_DOCUMENT_LINKS],
      "readwrite",
    );
    const done = transactionDone(transaction);
    const store = transaction.objectStore(PROJECT_DOCUMENT_LINKS);
    const projectRequest = transaction.objectStore(PROJECTS).get(link.projectId) as IDBRequest<
      ProjectRecord | undefined
    >;
    const documentRequest = transaction.objectStore(DOCUMENTS).get(link.documentId) as IDBRequest<
      DocumentRecord | undefined
    >;
    const existingRequest = store
      .index("project-document-unique")
      .get([link.projectId, link.documentId]) as IDBRequest<ProjectDocumentLink | undefined>;
    const [project, document, existing] = await Promise.all([
      requestResult(projectRequest),
      requestResult(documentRequest),
      requestResult(existingRequest),
    ]);
    if (!project) {
      transaction.abort();
      await done.catch(() => undefined);
      throw new Error("The selected project no longer exists in this browser.");
    }
    if (!document) {
      transaction.abort();
      await done.catch(() => undefined);
      throw new Error("The selected document no longer exists in this browser.");
    }
    const saved = existing
      ? {
          ...link,
          id: existing.id,
          addedAt: existing.addedAt,
        }
      : link;
    store.put(saved);
    await done;
    return saved;
  } finally {
    database.close();
  }
}

export async function deleteProjectDocumentLink(linkId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(PROJECT_DOCUMENT_LINKS, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(PROJECT_DOCUMENT_LINKS).delete(linkId);
    await done;
  } finally {
    database.close();
  }
}

export async function deleteProjectRecord(projectId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([PROJECTS, PROJECT_DOCUMENT_LINKS], "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(PROJECTS).delete(projectId);
    const links = transaction
      .objectStore(PROJECT_DOCUMENT_LINKS)
      .index("projectId")
      .openCursor(IDBKeyRange.only(projectId));
    links.onsuccess = () => {
      const cursor = links.result;
      if (!cursor) return;
      cursor.delete();
      cursor.continue();
    };
    await done;
  } finally {
    database.close();
  }
}

export async function deleteDocumentRecord(documentId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const stores = [
      DOCUMENTS,
      DOCUMENT_FILES,
      WORKSPACE_STATE,
      PROJECT_DOCUMENT_LINKS,
    ];
    const transaction = database.transaction(stores, "readwrite");
    const done = transactionDone(transaction);

    transaction.objectStore(DOCUMENTS).delete(documentId);
    transaction.objectStore(DOCUMENT_FILES).delete(documentId);

    // Remove project-document links for this document
    const linkCursor = transaction
      .objectStore(PROJECT_DOCUMENT_LINKS)
      .index("documentId")
      .openCursor(IDBKeyRange.only(documentId));
    linkCursor.onsuccess = () => {
      const cursor = linkCursor.result;
      if (!cursor) return;
      cursor.delete();
      cursor.continue();
    };

    // Patch workspace state: remove reviews, evidenceLinks, evidenceMatches, activities for this document
    const stateStore = transaction.objectStore(WORKSPACE_STATE);
    const stateRequest = stateStore.get("workspace") as IDBRequest<
      { key: string; value: LocalWorkspaceState } | undefined
    >;
    stateRequest.onsuccess = () => {
      const record = stateRequest.result;
      if (!record) return;
      const state = record.value;
      const reviews: Record<string, Review> = {};
      for (const [key, value] of Object.entries(state.reviews)) {
        if (!key.startsWith(documentId)) reviews[key] = value;
      }
      stateStore.put({
        key: "workspace",
        value: {
          reviews,
          evidenceMatches: state.evidenceMatches.filter(
            (item) => item.tenderDocumentId !== documentId,
          ),
          evidenceLinks: state.evidenceLinks.filter(
            (item) => item.tenderDocumentId !== documentId,
          ),
          activities: state.activities.filter(
            (item) => item.documentId !== documentId && item.relatedDocumentId !== documentId,
          ),
        } satisfies LocalWorkspaceState,
      });
    };

    await done;
  } finally {
    database.close();
  }
}

export async function clearLocalWorkspace(): Promise<void> {
  const database = await openDatabase();
  try {
    const stores = [
      DOCUMENTS,
      DOCUMENT_FILES,
      EVIDENCE_DOCUMENTS,
      EVIDENCE_FILES,
      WORKSPACE_STATE,
      PROJECTS,
      PROJECT_DOCUMENT_LINKS,
    ];
    const transaction = database.transaction(stores, "readwrite");
    const done = transactionDone(transaction);
    for (const store of stores) transaction.objectStore(store).clear();
    await done;
  } finally {
    database.close();
  }
}
