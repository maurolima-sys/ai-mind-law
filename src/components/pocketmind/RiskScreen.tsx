import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Check,
  FileText,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useT } from "@/lib/i18n";
import { downloadText, risksCsv } from "@/lib/services/csv";
import { riskReviewKey } from "@/lib/services/riskReview";
import {
  SEVERITIES,
  type DocumentRecord,
  type Review,
  type Risk,
  type Severity,
} from "@/lib/types";

type SeverityFilter = Severity | "all";

type RiskRow = {
  document: DocumentRecord;
  risk: Risk;
  mitigation: string;
};

const severityKeys: Record<
  Severity,
  "risk_severity_critical" | "risk_severity_high" | "risk_severity_medium" | "risk_severity_low"
> = {
  Critical: "risk_severity_critical",
  High: "risk_severity_high",
  Medium: "risk_severity_medium",
  Low: "risk_severity_low",
};

const severityTones: Record<Severity, "red" | "amber" | "blue" | "neutral"> = {
  Critical: "red",
  High: "amber",
  Medium: "blue",
  Low: "neutral",
};

function RiskMitigationForm({
  documentId,
  risk,
  savedNote,
  onSave,
}: {
  documentId: string;
  risk: Risk;
  savedNote: string;
  onSave: (documentId: string, riskId: string, note: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState(savedNote);

  useEffect(() => setDraft(savedNote), [savedNote]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(documentId, risk.id, draft.trim());
  }

  return (
    <form className="pm-risk-response" onSubmit={handleSubmit}>
      <label htmlFor={`risk-note-${documentId}-${risk.id}`}>{t("risk_action_plan_label")}</label>
      <textarea
        id={`risk-note-${documentId}-${risk.id}`}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        placeholder={t("risk_action_plan_hint")}
        rows={2}
      />
      <div className="pm-risk-response-footer">
        <span>{t("risk_local_note")}</span>
        <button
          className="pm-button pm-button--outline"
          type="submit"
          disabled={draft.trim() === savedNote}
        >
          {t("risk_action_plan_save")}
        </button>
      </div>
    </form>
  );
}

export function RiskScreen({
  documents,
  reviews,
  search,
  storageError,
  onOpenProcessing,
  onOpenSource,
  onSaveMitigation,
}: {
  documents: DocumentRecord[];
  reviews: Record<string, Review>;
  search: string;
  storageError: string;
  onOpenProcessing: () => void;
  onOpenSource: (documentId: string, sourceIndex: number, excerpt: string | null) => void;
  onSaveMitigation: (documentId: string, riskId: string, note: string) => void;
}) {
  const t = useT();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [documentFilter, setDocumentFilter] = useState("all");

  const rows: RiskRow[] = documents.flatMap((document) =>
    (document.analysis?.risks ?? []).map((risk) => ({
      document,
      risk,
      mitigation: reviews[riskReviewKey(document.id, risk.id)]?.notes ?? "",
    })),
  );
  const documentRows = rows.filter(
    ({ document }) => documentFilter === "all" || document.id === documentFilter,
  );
  const query = search.trim().toLocaleLowerCase();
  const matchingRows = documentRows.filter(
    ({ document, risk, mitigation }) =>
      !query ||
      [document.name, risk.title, risk.explanation, risk.evidence.excerpt ?? "", mitigation].some(
        (value) => value.toLocaleLowerCase().includes(query),
      ),
  );
  const visibleRows =
    severityFilter === "all"
      ? matchingRows
      : matchingRows.filter(({ risk }) => risk.severity === severityFilter);
  const criticalCount = documentRows.filter(({ risk }) => risk.severity === "Critical").length;
  const highCount = documentRows.filter(({ risk }) => risk.severity === "High").length;
  const needsReviewCount = documentRows.filter(({ risk }) => !risk.evidence.verified).length;
  const analysedDocuments = documents.filter((document) => document.analysis);

  if (!rows.length) {
    const hasAnalysis = analysedDocuments.length > 0;
    return (
      <section className="pm-risk-empty">
        <ShieldAlert size={25} aria-hidden="true" />
        <h2>{t(hasAnalysis ? "risk_empty_title" : "risk_no_analyses_title")}</h2>
        <p>{t(hasAnalysis ? "risk_empty_detail" : "risk_no_analyses_detail")}</p>
        {!hasAnalysis && (
          <button className="pm-button pm-button--primary" type="button" onClick={onOpenProcessing}>
            {t("btn_add_document")}
          </button>
        )}
      </section>
    );
  }

  function exportRisks() {
    const rowsForExport = visibleRows.map(({ document, risk, mitigation }) => ({
      documentName: document.name,
      isDemo: document.source === "demo",
      risk,
      mitigation,
    }));
    downloadText("pocketmind-risks.csv", risksCsv(rowsForExport, t));
  }

  return (
    <div className="pm-risk-screen">
      {storageError && (
        <div className="pm-risk-storage-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{storageError}</span>
        </div>
      )}

      <div className="pm-risk-summary" aria-label={t("risk_summary_label")}>
        <div>
          <strong>{documentRows.length}</strong>
          <span>{t("risk_summary_total")}</span>
        </div>
        <div className="pm-risk-summary--critical">
          <strong>{criticalCount}</strong>
          <span>{t("risk_summary_critical")}</span>
        </div>
        <div className="pm-risk-summary--high">
          <strong>{highCount}</strong>
          <span>{t("risk_summary_high")}</span>
        </div>
        <div className="pm-risk-summary--review">
          <strong>{needsReviewCount}</strong>
          <span>{t("risk_summary_needs_review")}</span>
        </div>
      </div>

      <section className="pm-panel pm-risk-register" aria-labelledby="pm-risk-register-title">
        <div className="pm-risk-toolbar">
          <label className="pm-risk-document-filter">
            <span>{t("risk_document_filter")}</span>
            <select
              value={documentFilter}
              onChange={(event) => setDocumentFilter(event.currentTarget.value)}
            >
              <option value="all">{t("risk_all_documents")}</option>
              {analysedDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name}
                </option>
              ))}
            </select>
          </label>
          <div
            className="pm-risk-severity-filters"
            role="group"
            aria-label={t("risk_severity_filter")}
          >
            <button
              type="button"
              aria-pressed={severityFilter === "all"}
              className={severityFilter === "all" ? "is-selected" : ""}
              onClick={() => setSeverityFilter("all")}
            >
              {t("risk_filter_all")} <span>{matchingRows.length}</span>
            </button>
            {SEVERITIES.map((severity) => (
              <button
                key={severity}
                type="button"
                aria-pressed={severityFilter === severity}
                className={severityFilter === severity ? "is-selected" : ""}
                onClick={() => setSeverityFilter(severity)}
              >
                {t(severityKeys[severity])}
                <span>{matchingRows.filter(({ risk }) => risk.severity === severity).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pm-risk-list-heading">
          <div>
            <h2 id="pm-risk-register-title">{t("risk_register_title")}</h2>
            <p>
              {t("risk_results_count", { shown: visibleRows.length, total: matchingRows.length })}
            </p>
          </div>
          <button
            type="button"
            className="pm-button pm-button--outline"
            onClick={exportRisks}
            disabled={!visibleRows.length}
          >
            <ArrowDownToLine size={15} aria-hidden="true" />
            {t("risk_export_csv")}
          </button>
        </div>

        {visibleRows.length ? (
          <div className="pm-risk-list">
            {visibleRows.map(({ document, risk, mitigation }) => {
              const sourceIndex = risk.evidence.sourceIndex ?? risk.evidence.page ?? 0;
              const hasSource = sourceIndex > 0 && sourceIndex <= document.pages.length;
              return (
                <article className="pm-risk-item" key={`${document.id}:${risk.id}`}>
                  <div className="pm-risk-item-heading">
                    <span className={`pm-badge pm-badge--${severityTones[risk.severity]}`}>
                      <AlertTriangle size={13} aria-hidden="true" />
                      {t(severityKeys[risk.severity])}
                    </span>
                    <span className="pm-risk-kind">
                      {t(
                        risk.kind === "suggestion" ? "risk_kind_suggestion" : "risk_kind_detected",
                      )}
                    </span>
                    <span className="pm-risk-document-name">
                      <FileText size={13} aria-hidden="true" />
                      {document.name}
                    </span>
                    {document.source === "demo" && (
                      <span className="pm-badge pm-badge--amber">
                        {t("toolbar_fictional_sample")}
                      </span>
                    )}
                  </div>
                  <div className="pm-risk-content">
                    <div className="pm-risk-main">
                      <h3>{risk.title}</h3>
                      <p>{risk.explanation}</p>
                      {risk.evidence.excerpt ? (
                        <blockquote className="pm-risk-evidence">
                          <span>{t("risk_source_excerpt")}</span>
                          <p>{risk.evidence.excerpt}</p>
                        </blockquote>
                      ) : (
                        <p className="pm-risk-no-evidence">{t("risk_evidence_missing")}</p>
                      )}
                      <div className="pm-risk-evidence-footer">
                        {risk.evidence.verified ? (
                          <span className="pm-risk-evidence-status is-verified">
                            <Check size={14} aria-hidden="true" /> {t("finding_source_verified")}
                          </span>
                        ) : (
                          <span className="pm-risk-evidence-status">
                            <AlertCircle size={14} aria-hidden="true" />{" "}
                            {t("finding_verify_source")}
                          </span>
                        )}
                        {hasSource ? (
                          <button
                            type="button"
                            className="pm-link-button"
                            onClick={() =>
                              onOpenSource(document.id, sourceIndex, risk.evidence.excerpt)
                            }
                          >
                            <FileText size={14} aria-hidden="true" />
                            {risk.evidence.sourceLocation ??
                              t("risk_page_reference", { page: risk.evidence.page ?? sourceIndex })}
                          </button>
                        ) : (
                          <span className="pm-risk-source-unavailable">
                            {t("risk_source_unavailable")}
                          </span>
                        )}
                      </div>
                    </div>
                    <RiskMitigationForm
                      documentId={document.id}
                      risk={risk}
                      savedNote={mitigation}
                      onSave={onSaveMitigation}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="pm-risk-empty pm-risk-empty--compact">
            <Search size={20} aria-hidden="true" />
            <h3>{t("risk_no_matches_title")}</h3>
            <p>{t("risk_no_matches_detail")}</p>
          </div>
        )}
        <p className="pm-risk-disclaimer">{t("risk_review_disclaimer")}</p>
      </section>
    </div>
  );
}
