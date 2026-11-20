import { useState } from "react";

import { useT } from "@/lib/i18n";
import type { AnalysisProgressEvent } from "@/lib/services/tenderAnalysis";
import type { Analysis } from "@/lib/types";
import "./ProcessingMonitor.css";

export type MonitorEvent =
  | AnalysisProgressEvent
  | { type: "document-selected" }
  | { type: "text-started" }
  | { type: "text-page"; completed: number; total: number }
  | { type: "text-completed" }
  | { type: "text-reused" }
  | { type: "sample-text" }
  | { type: "ocr-started" }
  | { type: "ocr-completed" }
  | { type: "ocr-waiting" };

export type MonitorState = {
  documentId: string;
  documentName: string;
  status: "running" | "waiting" | "failed" | "completed";
  events: MonitorEvent[];
  result?: Analysis;
  autoOpen?: boolean;
};

function eventMessage(event: MonitorEvent, t: ReturnType<typeof useT>) {
  switch (event.type) {
    case "document-selected":
      return t("monitor_document_selected");
    case "text-started":
      return t("monitor_text_started");
    case "text-page":
      return t("monitor_text_page", event);
    case "text-completed":
      return t("monitor_text_completed");
    case "text-reused":
      return t("monitor_text_reused");
    case "sample-text":
      return t("monitor_sample_text");
    case "ocr-started":
      return t("monitor_ocr_started");
    case "ocr-completed":
      return t("monitor_ocr_completed");
    case "ocr-waiting":
      return t("monitor_ocr_waiting");
    case "initializing":
      return t("monitor_initializing");
    case "model-download":
      return t("monitor_model_download", event);
    case "model-ready":
      return t("monitor_model_ready");
    case "model-unavailable":
      return t("monitor_model_unavailable");
    case "request-started":
      return t("monitor_request_started", event);
    case "retry":
      return t("monitor_retry", { model: event.model, attempt: event.attempt });
    case "cloud-retry":
      return t("monitor_cloud_retry");
    case "local-retry":
      return t("monitor_local_retry");
    case "response":
      return t(event.source === "IN_CLOUD" ? "monitor_response_cloud" : "monitor_response_local");
    case "output-validated":
      return t("monitor_output_validated", event);
    case "checking-evidence":
      return t("monitor_checking_evidence");
  }
}

export function ProcessingMonitor({
  monitor,
  onOpenResults,
}: {
  monitor: MonitorState;
  onOpenResults: () => void;
}) {
  const t = useT();
  const [paused, setPaused] = useState(false);
  const latest = monitor.events[monitor.events.length - 1];
  const progress =
    latest?.type === "text-page" && latest.total > 0
      ? { value: latest.completed, max: latest.total }
      : latest?.type === "model-download"
        ? { value: latest.percent, max: 100 }
        : latest?.type === "output-validated" && latest.total > 0
          ? { value: latest.section, max: latest.total }
          : null;
  const statusLabel = t(
    monitor.status === "running"
      ? "monitor_running"
      : monitor.status === "waiting"
        ? "monitor_waiting"
        : monitor.status === "failed"
          ? "monitor_failed"
          : "monitor_completed",
  );
  const result = monitor.result;
  const counts = result && [
    { label: t("monitor_requirements"), count: result.requirements.length },
    { label: t("monitor_deadlines"), count: result.deadlines.length },
    { label: t("monitor_specifications"), count: result.specifications.length },
    { label: t("monitor_risks"), count: result.risks.length },
    { label: t("monitor_missing"), count: result.missing.length },
    { label: t("monitor_inconsistencies"), count: result.inconsistencies.length },
  ];

  return (
    <section className="pm-monitor" aria-labelledby="pm-monitor-title">
      <div className="pm-monitor-visual">
        <div
          className={`pm-monitor-radar${paused || monitor.status !== "running" ? " is-paused" : ""}`}
          aria-hidden="true"
        >
          <div className="pm-monitor-sweep" />
          <div className="pm-monitor-center" />
        </div>
        {monitor.status === "running" && (
          <button type="button" className="pm-monitor-motion" onClick={() => setPaused(!paused)}>
            {t(paused ? "monitor_resume_motion" : "monitor_pause_motion")}
          </button>
        )}
      </div>
      <div className="pm-monitor-content">
        <div className="pm-monitor-heading">
          <div>
            <h2 id="pm-monitor-title">{t("monitor_title")}</h2>
            <p className="pm-monitor-document">{monitor.documentName}</p>
          </div>
          <span className={`pm-monitor-state is-${monitor.status}`}>{statusLabel}</span>
        </div>
        <h3>{t("monitor_activity")}</h3>
        <ol className="pm-monitor-events" aria-label={t("monitor_activity")}>
          {monitor.events.map((event, index) => (
            <li key={index} className={index === monitor.events.length - 1 ? "is-latest" : ""}>
              <span className="pm-monitor-dot" aria-hidden="true" />
              <span>{eventMessage(event, t)}</span>
            </li>
          ))}
        </ol>
        <p className="pm-monitor-announcement" role="status">
          {statusLabel}
          {latest ? ` · ${eventMessage(latest, t)}` : ""}
        </p>
        {monitor.status === "running" && (
          <div className="pm-monitor-progress">
            {progress && latest ? (
              <>
                <label htmlFor="pm-monitor-progress">{eventMessage(latest, t)}</label>
                <progress id="pm-monitor-progress" max={progress.max} value={progress.value} />
              </>
            ) : (
              <span>{t("monitor_indeterminate")}</span>
            )}
          </div>
        )}
        {counts && (
          <div className="pm-monitor-results">
            <p>
              {t("monitor_findings", {
                count: counts.reduce((total, item) => total + item.count, 0),
              })}
            </p>
            <ul>
              {counts.map((item) => (
                <li key={item.label}>
                  <strong>{item.count}</strong> {item.label}
                </li>
              ))}
            </ul>
            {monitor.autoOpen && <p>{t("monitor_opening_results")}</p>}
            <button type="button" className="pm-button" onClick={onOpenResults}>
              {t("monitor_view_results")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
