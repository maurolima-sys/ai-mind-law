import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Cloud, Laptop, Loader2, ArrowRight } from "lucide-react";

import { useT } from "@/lib/i18n";
import type { AnalysisProgressEvent } from "@/lib/services/tenderAnalysis";
import type { Analysis } from "@/lib/types";
import "./ProcessingMonitor.css";

// ─── Types (re-exported so PocketMindApp can import from here) ────────────────

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

/** @deprecated Use AnalysisRun from analysisRunContext instead. Kept for PocketMindApp compat. */
export type MonitorState = {
  documentId: string;
  documentName: string;
  status: "running" | "waiting" | "failed" | "completed";
  events: MonitorEvent[];
  result?: Analysis;
  autoOpen?: boolean;
  startedAt?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type EventTone = "success" | "warning" | "active" | "neutral";

function eventTone(event: MonitorEvent): EventTone {
  switch (event.type) {
    case "output-validated":
    case "text-completed":
    case "ocr-completed":
    case "response":
    case "checking-evidence":
      return "success";
    case "retry":
    case "quota-daily":
    case "cloud-retry":
    case "local-retry":
    case "model-unavailable":
      return "warning";
    case "request-started":
    case "initializing":
    case "model-download":
    case "model-ready":
      return "active";
    default:
      return "neutral";
  }
}

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
    case "quota-daily":
      return t("monitor_quota_daily", {
        exhaustedModel: event.exhaustedModel,
        nextModel: event.nextModel,
      });
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

// ─── Section sound ────────────────────────────────────────────────────────────

function playValidationBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => void ctx.close();
  } catch {
    // AudioContext unavailable — silent fallback
  }
}

function useSectionSound(events: MonitorEvent[], soundEnabled: boolean) {
  const playedRef = useRef(new Set<string>());
  const unlockedRef = useRef(false);

  // Unlock AudioContext on the first user gesture that starts the analysis
  useEffect(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
  }, []);

  useEffect(() => {
    if (!soundEnabled) return;
    const last = events[events.length - 1];
    if (last?.type !== "output-validated") return;
    const key = `${last.section}/${last.total}`;
    if (playedRef.current.has(key)) return;
    playedRef.current.add(key);
    playValidationBeep();
  }, [events, soundEnabled]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProcessingMonitor({
  monitor,
  onOpenResults,
  onCancel,
  sectionSoundEnabled = true,
}: {
  monitor: MonitorState;
  onOpenResults: () => void;
  onCancel?: () => void;
  sectionSoundEnabled?: boolean;
}) {
  const t = useT();
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const latest = monitor.events[monitor.events.length - 1];
  const canClose = monitor.status !== "running" && monitor.status !== "waiting";

  useSectionSound(monitor.events, sectionSoundEnabled);

  // Tick elapsed time every second while running
  useEffect(() => {
    if (monitor.status !== "running" && monitor.status !== "waiting") {
      if (monitor.startedAt) setElapsed(Math.floor((Date.now() - monitor.startedAt) / 1000));
      return;
    }
    const origin = monitor.startedAt ?? Date.now();
    setElapsed(Math.floor((Date.now() - origin) / 1000));
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - origin) / 1000)), 1000);
    return () => clearInterval(id);
  }, [monitor.status, monitor.startedAt]);

  const elapsedLabel = (() => {
    const m = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const s = (elapsed % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  })();

  // Move focus to heading on mount
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Auto-scroll event list to bottom as new events arrive
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [monitor.events.length]);

  // Deterministic progress: 0–20 text, 20–40 init, 40–95 sections, 95–100 evidence
  const sectionEvent = [...monitor.events].reverse().find((e) => e.type === "output-validated") as
    Extract<MonitorEvent, { type: "output-validated" }> | undefined;
  const totalSections = sectionEvent?.total ?? 0;
  const completedSections = sectionEvent?.section ?? 0;
  const hasText = monitor.events.some(
    (e) => e.type === "text-completed" || e.type === "text-reused",
  );
  const hasInit = monitor.events.some(
    (e) => e.type === "model-ready" || e.type === "cloud-retry" || e.type === "request-started",
  );
  const hasEvidence = monitor.events.some((e) => e.type === "checking-evidence");
  const determinedPct =
    monitor.status === "completed"
      ? 100
      : hasEvidence
        ? 97
        : totalSections > 0
          ? 40 + Math.round((completedSections / totalSections) * 55)
          : hasInit
            ? 35
            : hasText
              ? 20
              : 5;

  // Current inference source label for radar badge
  const lastResponse = [...monitor.events].reverse().find((e) => e.type === "response") as
    Extract<MonitorEvent, { type: "response" }> | undefined;
  const inferenceSourceLabel =
    lastResponse?.source === "ON_DEVICE"
      ? "On-device"
      : lastResponse?.source === "IN_CLOUD"
        ? "Cloud"
        : monitor.events.some((e) => e.type === "cloud-retry" || e.type === "quota-daily")
          ? "Cloud fallback"
          : monitor.events.some((e) => e.type === "initializing" || e.type === "model-ready")
            ? "On-device"
            : null;

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
    <section className="pm-monitor" aria-label={t("monitor_title")}>
      <div className="pm-monitor-visual">
        <div
          className={`pm-monitor-radar${paused || monitor.status !== "running" ? " is-paused" : ""}`}
          aria-hidden="true"
        >
          <div className="pm-monitor-sweep" />
          <div className="pm-monitor-center" />
        </div>
        {inferenceSourceLabel && (
          <div className="pm-monitor-source-badge">
            {inferenceSourceLabel === "On-device" ? (
              <Laptop size={12} aria-hidden="true" />
            ) : (
              <Cloud size={12} aria-hidden="true" />
            )}
            {inferenceSourceLabel}
          </div>
        )}
        {monitor.status === "running" && (
          <button type="button" className="pm-monitor-motion" onClick={() => setPaused(!paused)}>
            {t(paused ? "monitor_resume_motion" : "monitor_pause_motion")}
          </button>
        )}
      </div>
      <div className="pm-monitor-content">
        <div className="pm-monitor-heading">
          <div>
            <h1 id="pm-monitor-title" ref={headingRef} tabIndex={-1} style={{ outline: "none" }}>
              {t("monitor_title")}
            </h1>
            <p className="pm-monitor-document">{monitor.documentName}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className={`pm-monitor-state is-${monitor.status}`}>{statusLabel}</span>
            {monitor.startedAt ? (
              <p className="pm-monitor-elapsed" aria-live="off">
                {elapsedLabel}
              </p>
            ) : monitor.status === "running" ? (
              <p className="pm-monitor-elapsed">{t("monitor_indeterminate")}</p>
            ) : null}
          </div>
        </div>

        {/* Deterministic progress bar */}
        <div className="pm-monitor-det-bar" aria-hidden="true">
          <div
            className={`pm-monitor-det-fill${monitor.status === "running" ? " is-active" : ""}`}
            style={{ width: `${determinedPct}%` }}
          />
        </div>
        <h2>{t("monitor_activity")}</h2>
        <ol
          ref={listRef}
          className="pm-monitor-events"
          aria-label={t("monitor_activity")}
          aria-live="polite"
          aria-atomic="false"
        >
          {monitor.events.map((event, index) => {
            const isLatest = index === monitor.events.length - 1;
            const tone = eventTone(event);
            return (
              <li key={index} className={`${isLatest ? "is-latest" : ""} tone-${tone}`}>
                <span className={`pm-monitor-dot pm-monitor-dot--${tone}`} aria-hidden="true">
                  {tone === "success" && <CheckCircle2 size={10} />}
                  {tone === "warning" && <AlertTriangle size={10} />}
                  {tone === "active" && isLatest && <Loader2 size={10} className="pm-spin" />}
                </span>
                <span>{eventMessage(event, t)}</span>
              </li>
            );
          })}
        </ol>
        <p className="pm-monitor-announcement pm-visually-hidden" role="status">
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
            ) : latest?.type === "request-started" ||
              latest?.type === "model-download" ||
              latest?.type === "text-page" ||
              latest?.type === "output-validated" ? (
              <progress aria-label={t("monitor_running")} />
            ) : null}
          </div>
        )}
        {monitor.status === "running" && onCancel && (
          <div className="pm-monitor-actions">
            <button type="button" className="pm-button pm-button--ghost-cancel" onClick={onCancel}>
              {t("monitor_cancel")}
            </button>
          </div>
        )}
        {counts && (
          <div className="pm-monitor-results">
            {/* Completion banner */}
            <div className="pm-monitor-completion-banner">
              <CheckCircle2 size={18} className="pm-monitor-completion-icon" aria-hidden="true" />
              <span>
                {t("monitor_findings", {
                  count: counts.reduce((total, item) => total + item.count, 0),
                })}
                {inferenceSourceLabel ? ` · ${inferenceSourceLabel}` : ""}
              </span>
            </div>
            <ul>
              {counts.map((item) => (
                <li key={item.label}>
                  <strong>{item.count}</strong> {item.label}
                </li>
              ))}
            </ul>
            <button type="button" className="pm-button pm-monitor-cta" onClick={onOpenResults}>
              {t("monitor_view_results")} <ArrowRight size={16} aria-hidden="true" />
            </button>
            <div className="pm-monitor-next-steps">
              <strong>{t("monitor_next_steps_title")}</strong>
              <ol>
                <li>{t("monitor_next_steps_findings")}</li>
                <li>{t("monitor_next_steps_compliance")}</li>
                <li>{t("monitor_next_steps_risks")}</li>
                <li>{t("monitor_next_steps_export")}</li>
              </ol>
            </div>
          </div>
        )}
        {canClose && !counts && (
          <div className="pm-monitor-actions">
            <button
              type="button"
              className="pm-button pm-button--ghost-cancel"
              onClick={onOpenResults}
            >
              {t("monitor_back_to_processing")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
