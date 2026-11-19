import {
  resolveProjectDocuments,
  type ProjectDocumentEntry,
  type ProjectDocumentIssue,
  type ProjectDocumentOptions,
} from "@/lib/services/projectDocuments";
import { summarizeWorkspaceBySource, type WorkspaceMetrics } from "@/lib/services/workspaceMetrics";
import type {
  DocumentRecord,
  ProjectDocumentLink,
  ProjectRecord,
  Review,
  WorkspaceActivity,
} from "@/lib/types";

export interface ProjectDraft {
  name: string;
  description: string;
}

export interface ProjectOverview {
  project: ProjectRecord;
  documents: ProjectDocumentEntry[];
  documentIssues: ProjectDocumentIssue[];
  metrics: WorkspaceMetrics;
  activities: WorkspaceActivity[];
}

const MAX_PROJECT_NAME_LENGTH = 120;
const MAX_PROJECT_DESCRIPTION_LENGTH = 1_000;

export function validateProjectDraft(draft: ProjectDraft): string | null {
  const name = draft.name.trim();
  if (!name) return "Enter a project name.";
  if (name.length > MAX_PROJECT_NAME_LENGTH) {
    return `Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or fewer.`;
  }
  if (draft.description.trim().length > MAX_PROJECT_DESCRIPTION_LENGTH) {
    return `Project description must be ${MAX_PROJECT_DESCRIPTION_LENGTH} characters or fewer.`;
  }
  return null;
}

export function createProjectRecord(
  draft: ProjectDraft,
  options: { id?: string; now?: Date } = {},
): ProjectRecord {
  const error = validateProjectDraft(draft);
  if (error) throw new Error(error);
  const now = (options.now ?? new Date()).toISOString();
  return {
    id:
      options.id ??
      globalThis.crypto?.randomUUID?.() ??
      `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: draft.name.trim(),
    description: draft.description.trim(),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export function updateProjectRecord(
  project: ProjectRecord,
  patch: Partial<ProjectDraft & Pick<ProjectRecord, "status">>,
  now = new Date(),
): ProjectRecord {
  const candidate = {
    name: patch.name ?? project.name,
    description: patch.description ?? project.description,
  };
  const error = validateProjectDraft(candidate);
  if (error) throw new Error(error);
  return {
    ...project,
    ...candidate,
    name: candidate.name.trim(),
    description: candidate.description.trim(),
    status: patch.status ?? project.status,
    updatedAt: now.toISOString(),
  };
}

function totalMetrics(
  upload: WorkspaceMetrics,
  demo: WorkspaceMetrics,
  includeDemo: boolean,
): WorkspaceMetrics {
  if (!includeDemo) return upload;
  return {
    documentCount: upload.documentCount + demo.documentCount,
    requirementCount: upload.requirementCount + demo.requirementCount,
    criticalRiskCount: upload.criticalRiskCount + demo.criticalRiskCount,
    pendingReviewCount: upload.pendingReviewCount + demo.pendingReviewCount,
  };
}

export function buildProjectOverview(
  project: ProjectRecord,
  documents: readonly DocumentRecord[],
  links: readonly ProjectDocumentLink[],
  reviews: Record<string, Review>,
  activities: readonly WorkspaceActivity[],
  options: ProjectDocumentOptions = {},
): ProjectOverview {
  const resolution = resolveProjectDocuments(project.id, links, documents, options);
  const includedDocuments = resolution.entries.map(({ document }) => document);
  const metricsBySource = summarizeWorkspaceBySource(includedDocuments, reviews);
  const documentIds = new Set(includedDocuments.map((document) => document.id));

  return {
    project,
    documents: resolution.entries,
    documentIssues: resolution.issues,
    metrics: totalMetrics(
      metricsBySource.upload,
      metricsBySource.demo,
      options.includeDemo ?? false,
    ),
    activities: activities
      .filter(
        (activity) =>
          documentIds.has(activity.documentId) ||
          (activity.relatedDocumentId !== undefined && documentIds.has(activity.relatedDocumentId)),
      )
      .sort((left, right) => right.at.localeCompare(left.at)),
  };
}
