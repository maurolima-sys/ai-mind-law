import { AlertCircle, ArrowRight, Database, FilePlus2, Trash2 } from "lucide-react";
import { useState } from "react";

import { formatBytes } from "@/lib/services/documentProcessing";
import type { DocumentRecord, SupportingEvidenceDocument } from "@/lib/types";
import { useT } from "@/lib/i18n";

export function LocalWorkspaceLibrary({
  documents,
  evidenceDocuments,
  storageError,
  onAddDocument,
  onOpenDocument,
  onClearWorkspace,
}: {
  documents: DocumentRecord[];
  evidenceDocuments: SupportingEvidenceDocument[];
  storageError: string;
  onAddDocument: () => void;
  onOpenDocument: (documentId: string) => void;
  onClearWorkspace: () => void;
}) {
  const t = useT();
  const [confirmClear, setConfirmClear] = useState(false);
  const uploadedDocuments = documents.filter((document) => document.source === "upload");
  const storageSize =
    uploadedDocuments.reduce((total, document) => total + document.size, 0) +
    evidenceDocuments.reduce((total, document) => total + document.size, 0);

  return (
    <div className="pm-library-screen">
      <section className="pm-library-privacy">
        <Database size={19} aria-hidden="true" />
        <div>
          <strong>{t("library_privacy_title")}</strong>
          <p>{t("library_privacy_detail")}</p>
        </div>
        <span>{formatBytes(storageSize)}</span>
      </section>

      {storageError && (
        <div className="pm-error-banner" role="alert">
          <AlertCircle size={17} />
          <span>{storageError}</span>
        </div>
      )}

      <section className="pm-panel pm-library-panel">
        <div className="pm-panel-heading">
          <div>
            <h2>{t("library_documents_title")}</h2>
            <p>{t("library_documents_detail", { count: uploadedDocuments.length })}</p>
          </div>
          <button className="pm-button pm-button--primary" type="button" onClick={onAddDocument}>
            <FilePlus2 size={16} /> {t("btn_add_document")}
          </button>
        </div>
        {uploadedDocuments.length ? (
          <div
            className="pm-table-wrap pm-library-table-wrap"
            tabIndex={0}
            role="region"
            aria-label={t("library_documents_table")}
          >
            <table className="pm-table pm-library-table">
              <caption className="sr-only">{t("library_documents_table")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("table_col_document")}</th>
                  <th scope="col">{t("library_col_format")}</th>
                  <th scope="col">{t("library_col_sources")}</th>
                  <th scope="col">{t("table_col_status")}</th>
                  <th scope="col">{t("library_col_action")}</th>
                </tr>
              </thead>
              <tbody>
                {uploadedDocuments.map((document) => (
                  <tr key={document.id}>
                    <th scope="row">
                      <span className="pm-library-file">
                        <strong>{document.name}</strong>
                        <small>{formatBytes(document.size)}</small>
                      </span>
                    </th>
                    <td>{(document.format ?? "pdf").toUpperCase()}</td>
                    <td>
                      {document.sourceLocations?.length
                        ? t("library_source_count", { count: document.sourceLocations.length })
                        : t("library_not_extracted")}
                    </td>
                    <td>{document.analysis ? t("status_analyzed") : t("status_not_analyzed")}</td>
                    <td>
                      <button
                        className="pm-link-button"
                        type="button"
                        onClick={() => onOpenDocument(document.id)}
                      >
                        {t("library_open_document")} <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pm-library-empty">
            <FilePlus2 size={22} />
            <strong>{t("library_empty_title")}</strong>
            <p>{t("library_empty_detail")}</p>
            <button className="pm-button pm-button--outline" type="button" onClick={onAddDocument}>
              {t("btn_add_document")}
            </button>
          </div>
        )}
      </section>

      <section className="pm-panel pm-library-panel">
        <div className="pm-panel-heading">
          <div>
            <h2>{t("library_evidence_title")}</h2>
            <p>{t("library_evidence_detail", { count: evidenceDocuments.length })}</p>
          </div>
        </div>
        {evidenceDocuments.length ? (
          <ul className="pm-library-evidence-list">
            {evidenceDocuments.map((document) => (
              <li key={document.id}>
                <span>
                  <strong>{document.name}</strong>
                  <small>
                    {document.format.toUpperCase()} · {formatBytes(document.size)} ·{" "}
                    {t("library_source_count", { count: document.sourceLocations.length })}
                  </small>
                </span>
                <span>{documents.find((item) => item.id === document.tenderDocumentId)?.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pm-library-empty-inline">{t("library_evidence_empty")}</p>
        )}
      </section>

      <section className="pm-library-delete">
        <div>
          <h2>{t("library_delete_title")}</h2>
          <p>{t("library_delete_detail")}</p>
        </div>
        {!confirmClear ? (
          <button
            className="pm-button pm-button--danger-outline"
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={uploadedDocuments.length === 0 && evidenceDocuments.length === 0}
          >
            <Trash2 size={15} /> {t("library_delete_action")}
          </button>
        ) : (
          <div className="pm-library-confirm" role="alert">
            <strong>{t("library_delete_confirm")}</strong>
            <button
              className="pm-button pm-button--danger"
              type="button"
              onClick={() => {
                onClearWorkspace();
                setConfirmClear(false);
              }}
            >
              {t("library_delete_confirm_action")}
            </button>
            <button
              className="pm-button pm-button--outline"
              type="button"
              onClick={() => setConfirmClear(false)}
            >
              {t("library_delete_cancel")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
