import type { DocumentRecord, ProjectDocumentLink } from "@/lib/types";

export type ProjectDocumentIssueReason =
  "missing-document" | "duplicate-document" | "invalid-order" | "demo-excluded";

export interface ProjectDocumentIssue {
  link: ProjectDocumentLink;
  reason: ProjectDocumentIssueReason;
}

export interface ProjectDocumentEntry {
  document: DocumentRecord;
  link: ProjectDocumentLink;
}

export interface ProjectDocumentResolution {
  entries: ProjectDocumentEntry[];
  issues: ProjectDocumentIssue[];
}

export interface ProjectDocumentOptions {
  includeDemo?: boolean;
}

function compareLinks(
  left: ProjectDocumentLink,
  right: ProjectDocumentLink,
  documentsById: ReadonlyMap<string, DocumentRecord>,
): number {
  const byOrder = left.order - right.order;
  if (byOrder !== 0) return byOrder;
  const byAddedAt = left.addedAt.localeCompare(right.addedAt);
  if (byAddedAt !== 0) return byAddedAt;
  return (documentsById.get(left.documentId)?.name ?? "").localeCompare(
    documentsById.get(right.documentId)?.name ?? "",
  );
}

export function resolveProjectDocuments(
  projectId: string,
  links: readonly ProjectDocumentLink[],
  documents: readonly DocumentRecord[],
  options: ProjectDocumentOptions = {},
): ProjectDocumentResolution {
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const projectLinks = links.filter((link) => link.projectId === projectId);
  const seenDocumentIds = new Set<string>();
  const entries: ProjectDocumentEntry[] = [];
  const issues: ProjectDocumentIssue[] = [];

  for (const link of [...projectLinks].sort((left, right) =>
    compareLinks(left, right, documentsById),
  )) {
    const document = documentsById.get(link.documentId);
    if (!document) {
      issues.push({ link, reason: "missing-document" });
      continue;
    }
    if (!Number.isFinite(link.order) || link.order < 0) {
      issues.push({ link, reason: "invalid-order" });
      continue;
    }
    if (seenDocumentIds.has(link.documentId)) {
      issues.push({ link, reason: "duplicate-document" });
      continue;
    }
    if (!options.includeDemo && document.source === "demo") {
      issues.push({ link, reason: "demo-excluded" });
      continue;
    }

    seenDocumentIds.add(link.documentId);
    entries.push({ document, link });
  }

  return { entries, issues };
}

export function sortProjectDocuments(
  entries: readonly ProjectDocumentEntry[],
): ProjectDocumentEntry[] {
  return [...entries].sort((left, right) => {
    const byOrder = left.link.order - right.link.order;
    if (byOrder !== 0) return byOrder;
    const byAddedAt = left.link.addedAt.localeCompare(right.link.addedAt);
    if (byAddedAt !== 0) return byAddedAt;
    return left.document.name.localeCompare(right.document.name);
  });
}
