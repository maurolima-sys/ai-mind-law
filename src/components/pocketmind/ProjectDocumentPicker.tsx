import { FilePlus2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { useT } from "@/lib/i18n";
import { formatBytes } from "@/lib/services/documentProcessing";
import type { DocumentRecord, ProjectDocumentLink, ProjectDocumentRole } from "@/lib/types";

const ROLES: ProjectDocumentRole[] = [
  "tender",
  "terms-of-reference",
  "annex",
  "certificate",
  "evidence",
  "other",
];

function roleKey(role: ProjectDocumentRole) {
  return `projects_role_${role.replaceAll("-", "_")}` as
    | "projects_role_tender"
    | "projects_role_terms_of_reference"
    | "projects_role_annex"
    | "projects_role_certificate"
    | "projects_role_evidence"
    | "projects_role_other";
}

export function ProjectDocumentPicker({
  projectId,
  documents,
  links,
  onAdd,
  onCancel,
}: {
  projectId: string;
  documents: DocumentRecord[];
  links: ProjectDocumentLink[];
  onAdd: (link: ProjectDocumentLink) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const availableDocuments = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.source === "upload" &&
          !links.some((link) => link.projectId === projectId && link.documentId === document.id),
      ),
    [documents, links, projectId],
  );
  const [documentId, setDocumentId] = useState(availableDocuments[0]?.id ?? "");
  const [role, setRole] = useState<ProjectDocumentRole>("tender");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const document = availableDocuments.find((item) => item.id === documentId);
    if (!document) {
      setError(t("projects_document_required"));
      return;
    }
    setSaving(true);
    setError("");
    const projectLinks = links.filter((link) => link.projectId === projectId);
    try {
      await onAdd({
        id:
          globalThis.crypto?.randomUUID?.() ??
          `project-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        projectId,
        documentId: document.id,
        role,
        order: projectLinks.length,
        addedAt: new Date().toISOString(),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("projects_link_save_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="pm-project-picker"
      onSubmit={(event) => void submit(event)}
      aria-labelledby="project-picker-title"
    >
      <div className="pm-project-picker-heading">
        <FilePlus2 size={18} aria-hidden="true" />
        <div>
          <h3 id="project-picker-title">{t("projects_add_document_title")}</h3>
          <p>{t("projects_add_document_detail")}</p>
        </div>
      </div>

      {availableDocuments.length ? (
        <>
          <div className="pm-project-form-field">
            <label htmlFor="project-document">{t("projects_document_label")}</label>
            <select
              id="project-document"
              name="project-document"
              value={documentId}
              onChange={(event) => {
                setDocumentId(event.currentTarget.value);
                setError("");
              }}
              required
            >
              {availableDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name} · {formatBytes(document.size)}
                </option>
              ))}
            </select>
          </div>
          <div className="pm-project-form-field">
            <label htmlFor="project-document-role">{t("projects_role_label")}</label>
            <select
              id="project-document-role"
              name="project-document-role"
              value={role}
              onChange={(event) => setRole(event.currentTarget.value as ProjectDocumentRole)}
            >
              {ROLES.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {t(roleKey(candidate))}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="pm-project-form-error" role="alert">
              {error}
            </p>
          )}
          <div className="pm-project-form-actions">
            <button type="button" className="pm-button pm-button--outline" onClick={onCancel}>
              {t("projects_cancel")}
            </button>
            <button type="submit" className="pm-button pm-button--primary" disabled={saving}>
              {saving ? t("projects_saving") : t("projects_add_document")}
            </button>
          </div>
        </>
      ) : (
        <div className="pm-project-picker-empty">
          <p>{t("projects_no_available_documents")}</p>
          <button type="button" className="pm-button pm-button--outline" onClick={onCancel}>
            {t("projects_close")}
          </button>
        </div>
      )}
    </form>
  );
}
