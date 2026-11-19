import {
  Archive,
  ArrowLeft,
  FileText,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Unlink,
} from "lucide-react";
import { useState } from "react";

import { ProjectDocumentPicker } from "@/components/pocketmind/ProjectDocumentPicker";
import { ProjectForm } from "@/components/pocketmind/ProjectForm";
import { useT } from "@/lib/i18n";
import { formatBytes } from "@/lib/services/documentProcessing";
import { buildProjectOverview, type ProjectDraft } from "@/lib/services/projects";
import type {
  DocumentRecord,
  ProjectDocumentLink,
  ProjectRecord,
  Review,
  WorkspaceActivity,
} from "@/lib/types";

function roleKey(role: ProjectDocumentLink["role"]) {
  return `projects_role_${role.replaceAll("-", "_")}` as
    | "projects_role_tender"
    | "projects_role_terms_of_reference"
    | "projects_role_annex"
    | "projects_role_certificate"
    | "projects_role_evidence"
    | "projects_role_other";
}

export function ProjectDetailScreen({
  project,
  documents,
  links,
  reviews,
  activities,
  onBack,
  onUpdate,
  onArchive,
  onDelete,
  onAddLink,
  onRemoveLink,
  onOpenDocument,
}: {
  project: ProjectRecord;
  documents: DocumentRecord[];
  links: ProjectDocumentLink[];
  reviews: Record<string, Review>;
  activities: WorkspaceActivity[];
  onBack: () => void;
  onUpdate: (project: ProjectRecord, draft: ProjectDraft) => Promise<void>;
  onArchive: (project: ProjectRecord) => Promise<void>;
  onDelete: (project: ProjectRecord) => Promise<void>;
  onAddLink: (link: ProjectDocumentLink) => Promise<void>;
  onRemoveLink: (link: ProjectDocumentLink) => Promise<void>;
  onOpenDocument: (documentId: string) => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [addingDocument, setAddingDocument] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const overview = buildProjectOverview(project, documents, links, reviews, activities);

  async function archiveProject() {
    setBusy(true);
    setError("");
    try {
      await onArchive(project);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("projects_save_error"));
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject() {
    setBusy(true);
    setError("");
    try {
      await onDelete(project);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("projects_delete_error"));
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(link: ProjectDocumentLink) {
    setBusy(true);
    setError("");
    try {
      await onRemoveLink(link);
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : t("projects_link_remove_error"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pm-project-detail">
      <div className="pm-project-detail-toolbar">
        <button type="button" className="pm-link-button" onClick={onBack}>
          <ArrowLeft size={15} aria-hidden="true" />
          {t("projects_back")}
        </button>
        <div>
          <button
            type="button"
            className="pm-button pm-button--outline"
            onClick={() => setEditing((current) => !current)}
          >
            <Pencil size={14} aria-hidden="true" />
            {t("projects_edit")}
          </button>
          <button
            type="button"
            className="pm-button pm-button--outline"
            onClick={() => void archiveProject()}
            disabled={busy}
          >
            <Archive size={14} aria-hidden="true" />
            {project.status === "archived" ? t("projects_restore") : t("projects_archive")}
          </button>
        </div>
      </div>

      {editing && (
        <ProjectForm
          project={project}
          onCancel={() => setEditing(false)}
          onSave={async (draft) => {
            await onUpdate(project, draft);
            setEditing(false);
          }}
        />
      )}

      <section className="pm-project-detail-summary">
        <div>
          <span className="pm-project-status">
            {project.status === "active"
              ? t("projects_status_active")
              : t("projects_status_archived")}
          </span>
          <h2>{project.name}</h2>
          <p>{project.description || t("projects_no_description")}</p>
        </div>
        <div className="pm-project-privacy">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>{t("projects_local_privacy")}</span>
        </div>
      </section>

      <div className="pm-project-metrics">
        <article>
          <FileText size={17} aria-hidden="true" />
          <strong>{overview.metrics.documentCount}</strong>
          <span>{t("projects_metric_documents")}</span>
        </article>
        <article>
          <FileText size={17} aria-hidden="true" />
          <strong>{overview.metrics.requirementCount}</strong>
          <span>{t("projects_metric_requirements")}</span>
        </article>
        <article>
          <FileText size={17} aria-hidden="true" />
          <strong>{overview.metrics.criticalRiskCount}</strong>
          <span>{t("projects_metric_critical")}</span>
        </article>
        <article>
          <FileText size={17} aria-hidden="true" />
          <strong>{overview.metrics.pendingReviewCount}</strong>
          <span>{t("projects_metric_pending")}</span>
        </article>
      </div>

      {overview.documentIssues.length > 0 && (
        <div className="pm-project-warning" role="alert">
          {t("projects_broken_links", { count: overview.documentIssues.length })}
        </div>
      )}
      {error && (
        <div className="pm-project-warning" role="alert">
          {error}
        </div>
      )}

      <section className="pm-panel pm-project-documents-panel">
        <div className="pm-panel-heading">
          <div>
            <h2>{t("projects_documents_title")}</h2>
            <p>{t("projects_documents_detail")}</p>
          </div>
          <button
            type="button"
            className="pm-button pm-button--primary"
            onClick={() => setAddingDocument(true)}
          >
            <Plus size={15} aria-hidden="true" />
            {t("projects_add_document")}
          </button>
        </div>

        {addingDocument && (
          <ProjectDocumentPicker
            projectId={project.id}
            documents={documents}
            links={links}
            onCancel={() => setAddingDocument(false)}
            onAdd={async (link) => {
              await onAddLink(link);
              setAddingDocument(false);
            }}
          />
        )}

        {overview.documents.length ? (
          <div
            className="pm-table-wrap pm-project-table-wrap"
            role="region"
            tabIndex={0}
            aria-labelledby="project-documents-caption"
          >
            <table className="pm-table pm-project-documents-table">
              <caption id="project-documents-caption" className="sr-only">
                {t("projects_documents_title")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("projects_col_document")}</th>
                  <th scope="col">{t("projects_col_role")}</th>
                  <th scope="col">{t("projects_col_status")}</th>
                  <th scope="col">{t("projects_col_size")}</th>
                  <th scope="col">{t("projects_col_action")}</th>
                </tr>
              </thead>
              <tbody>
                {overview.documents.map(({ document, link }) => (
                  <tr key={link.id}>
                    <th scope="row">{document.name}</th>
                    <td>{t(roleKey(link.role))}</td>
                    <td>{document.analysis ? t("status_analyzed") : t("status_not_analyzed")}</td>
                    <td>{formatBytes(document.size)}</td>
                    <td>
                      <div className="pm-project-row-actions">
                        <button
                          type="button"
                          className="pm-link-button"
                          onClick={() => onOpenDocument(document.id)}
                        >
                          {t("projects_open_document")}
                        </button>
                        <button
                          type="button"
                          className="pm-icon-button"
                          onClick={() => void removeLink(link)}
                          aria-label={t("projects_remove_document", { name: document.name })}
                          disabled={busy}
                        >
                          <Unlink size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pm-project-empty-documents">
            <FileText size={22} aria-hidden="true" />
            <strong>{t("projects_no_documents_title")}</strong>
            <p>{t("projects_no_documents_detail")}</p>
          </div>
        )}
      </section>

      <section className="pm-project-danger">
        <div>
          <h2>{t("projects_delete_title")}</h2>
          <p>{t("projects_delete_detail")}</p>
        </div>
        {confirmDelete ? (
          <div className="pm-project-delete-confirm">
            <strong>{t("projects_delete_confirm")}</strong>
            <button
              type="button"
              className="pm-button pm-button--danger"
              onClick={() => void deleteProject()}
              disabled={busy}
            >
              <Trash2 size={14} aria-hidden="true" />
              {t("projects_delete")}
            </button>
            <button
              type="button"
              className="pm-button pm-button--outline"
              onClick={() => setConfirmDelete(false)}
            >
              {t("projects_cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="pm-button pm-button--danger-outline"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t("projects_delete")}
          </button>
        )}
      </section>
    </div>
  );
}
