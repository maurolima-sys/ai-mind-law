import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { ProcessingMonitor } from "@/components/pocketmind/ProcessingMonitor";
import { useAnalysisRun } from "@/lib/analysisRunContext";
import { useT } from "@/lib/i18n";
import { loadPreferences } from "@/lib/preferences";

export const Route = createFileRoute("/processing/run")({
  head: () => ({
    meta: [{ title: "Processing — PocketMind AI" }],
  }),
  component: ProcessingRunPage,
});

function ProcessingRunPage() {
  const t = useT();
  const navigate = useNavigate();
  const { run, abortController, setRunStatus, clearRun } = useAnalysisRun();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const sectionSoundEnabled = loadPreferences().sectionSoundEnabled;

  // Redirect to / if there is no run — defer one tick so React can flush
  // the startRun state update before this effect evaluates.
  useEffect(() => {
    if (run) return;
    const id = setTimeout(() => {
      void navigate({ to: "/" });
    }, 50);
    return () => clearTimeout(id);
  }, [run, navigate]);

  if (!run) return null;

  function handleCancelRequest() {
    setShowCancelDialog(true);
  }

  function handleCancelConfirm() {
    abortController?.abort();
    setRunStatus(run!.documentId, "cancelled", undefined, t("monitor_cancelled_message"));
    setShowCancelDialog(false);
  }

  function handleCancelDismiss() {
    setShowCancelDialog(false);
    cancelTriggerRef.current?.focus();
  }

  function handleOpenResults() {
    const docId = run!.documentId;
    clearRun();
    void navigate({ to: "/analysis/$docId", params: { docId } });
  }

  const monitorStatus =
    run.status === "cancelled"
      ? ("failed" as const)
      : (run.status as "running" | "waiting" | "failed" | "completed");

  return (
    <div className="pm-run-page">
      <header className="pm-run-header">
        <Link to="/" className="pm-run-header-brand">
          PocketMind AI
        </Link>
        <span className="pm-run-header-sep" aria-hidden="true">
          ·
        </span>
        <Link to="/processing" className="pm-run-back" aria-label={t("monitor_back_to_processing")}>
          ← {t("monitor_back_to_processing")}
        </Link>
      </header>

      <main className="pm-run-main" aria-labelledby="pm-monitor-title">
        <ProcessingMonitor
          monitor={{
            documentId: run.documentId,
            documentName: run.documentName,
            status: monitorStatus,
            events: run.events,
            ...(run.startedAt !== undefined ? { startedAt: run.startedAt } : {}),
            ...(run.result ? { result: run.result } : {}),
          }}
          onOpenResults={handleOpenResults}
          sectionSoundEnabled={sectionSoundEnabled}
          {...(run.status === "running" || run.status === "waiting"
            ? { onCancel: handleCancelRequest }
            : {})}
        />
      </main>

      {showCancelDialog && (
        <div
          className="pm-cancel-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pm-cancel-title"
        >
          <div className="pm-cancel-dialog">
            <h2 id="pm-cancel-title">{t("monitor_cancel_title")}</h2>
            <p>{t("monitor_cancel_body")}</p>
            <div className="pm-cancel-dialog-actions">
              <button
                type="button"
                className="pm-button pm-button--outline"
                onClick={handleCancelDismiss}
              >
                {t("monitor_cancel_dismiss")}
              </button>
              <button
                type="button"
                className="pm-button pm-button--primary"
                style={{ background: "var(--pm-red, #dc2626)" }}
                onClick={handleCancelConfirm}
              >
                {t("monitor_cancel_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
