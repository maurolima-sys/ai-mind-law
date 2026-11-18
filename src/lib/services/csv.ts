import type { DocumentRecord, Requirement, Review, Risk } from "../types";
import type { TranslationKey } from "../i18n/en";

type TFn = (key: TranslationKey) => string;

export interface RiskCsvEntry {
  documentName: string;
  source: DocumentRecord["source"];
  risk: Risk;
  mitigation: string;
}

const esc = (v: string) => {
  const safe = /^\s*[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function complianceCsv(
  reqs: Requirement[],
  reviews: Record<string, Review | undefined>,
  t: TFn,
): string {
  const columns = [
    t("csv_col_requirement"),
    t("csv_col_category"),
    t("csv_col_mandatory"),
    t("csv_col_evidence"),
    t("csv_col_page"),
    t("csv_col_evidence_verified"),
    t("csv_col_review_status"),
    t("csv_col_notes"),
  ];
  const rows = reqs.map((r) => {
    const rv = reviews[r.id];
    return [
      r.description,
      r.category,
      r.mandatory ? t("csv_mandatory") : t("csv_optional"),
      r.evidence.excerpt ?? t("csv_evidence_na"),
      r.evidence.page?.toString() ?? "",
      r.evidence.verified ? t("csv_yes") : t("csv_no"),
      rv?.status ?? "pending",
      rv?.notes ?? "",
    ]
      .map(esc)
      .join(",");
  });
  return [columns.join(","), ...rows].join("\n");
}

export function risksCsv(entries: RiskCsvEntry[], t: TFn): string {
  const columns = [
    t("risk_csv_document"),
    t("risk_csv_severity"),
    t("risk_csv_type"),
    t("risk_csv_title"),
    t("risk_csv_explanation"),
    t("risk_csv_action_plan"),
    t("risk_csv_evidence"),
    t("risk_csv_source"),
    t("csv_col_evidence_verified"),
    t("risk_csv_origin"),
  ];
  const rows = entries.map(({ documentName, source, risk, mitigation }) =>
    [
      documentName,
      risk.severity,
      risk.kind,
      risk.title,
      risk.explanation,
      mitigation,
      risk.evidence.excerpt ?? "",
      risk.evidence.sourceLocation ?? risk.evidence.page?.toString() ?? "",
      risk.evidence.verified ? t("csv_yes") : t("csv_no"),
      t(source === "demo" ? "data_origin_demo" : "data_origin_upload"),
    ]
      .map(esc)
      .join(","),
  );
  return [columns.join(","), ...rows].join("\n");
}

export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
