import { AlertTriangle } from "lucide-react";

import { useT } from "@/lib/i18n";

export function AnalysisCompletenessWarning({
  pages,
  onReviewOcr,
}: {
  pages: number[];
  onReviewOcr: () => void;
}) {
  const t = useT();
  if (pages.length === 0) return null;

  return (
    <div className="pm-inline-warning pm-completeness-warning" role="status">
      <AlertTriangle size={16} aria-hidden="true" />
      <div>
        <strong>{t("analysis_incomplete_title", { count: pages.length })}</strong>
        <p>{t("analysis_incomplete_desc")}</p>
        <p>{t("analysis_incomplete_pages", { pages: pages.join(", ") })}</p>
        <button type="button" className="pm-button pm-button--outline" onClick={onReviewOcr}>
          {t("analysis_incomplete_ocr_action")}
        </button>
      </div>
    </div>
  );
}
