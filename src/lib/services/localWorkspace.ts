import type {
  DocumentRecord,
  EvidenceMatch,
  RequirementEvidenceLink,
  Review,
  SupportingEvidenceDocument,
  WorkspaceActivity,
} from "@/lib/types";

const DATABASE_NAME = "pocketmind-local-workspace";
const DATABASE_VERSION = 1;
const DOCUMENTS = "documents";
const DOCUMENT_FILES = "document-files";
const EVIDENCE_DOCUMENTS = "evidence-documents";
const EVIDENCE_FILES = "evidence-files";
const WORKSPACE_STATE = "workspace-state";

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
      [DOCUMENTS, DOCUMENT_FILES, EVIDENCE_DOCUMENTS, EVIDENCE_FILES, WORKSPACE_STATE],
      "readonly",
    );
    const done = transactionDone(transaction);
    const documentsRequest = getAllRecords<DocumentRecord>(transaction.objectStore(DOCUMENTS));
    const filesRequest = getAllRecords<StoredFile>(transaction.objectStore(DOCUMENT_FILES));
    const evidenceRequest = getAllRecords<SupportingEvidenceDocument>(
      transaction.objectStore(EVIDENCE_DOCUMENTS),
    );
    const evidenceFilesRequest = getAllRecords<StoredFile>(transaction.objectStore(EVIDENCE_FILES));
    const stateRequest = getRecord<{
      key: string;
      value: LocalWorkspaceState;
    }>(transaction.objectStore(WORKSPACE_STATE), "workspace");
    const [documents, files, evidenceDocuments, evidenceFiles, storedState] = await Promise.all([
      documentsRequest,
      filesRequest,
      evidenceRequest,
      evidenceFilesRequest,
      stateRequest,
    ]);
    await done;

    return {
      documents,
      filesByDocumentId: Object.fromEntries(files.map((item) => [item.id, toFile(item)])),
      evidenceDocuments,
      filesByEvidenceId: Object.fromEntries(evidenceFiles.map((item) => [item.id, toFile(item)])),
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

export async function clearLocalWorkspace(): Promise<void> {
  const database = await openDatabase();
  try {
    const stores = [DOCUMENTS, DOCUMENT_FILES, EVIDENCE_DOCUMENTS, EVIDENCE_FILES, WORKSPACE_STATE];
    const transaction = database.transaction(stores, "readwrite");
    const done = transactionDone(transaction);
    for (const store of stores) transaction.objectStore(store).clear();
    await done;
  } finally {
    database.close();
  }
}
