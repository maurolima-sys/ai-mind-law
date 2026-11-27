import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  FileSearch,
  History,
  LoaderCircle,
  Mic2,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLocale } from "@/lib/i18n";
import type { InferenceSource } from "@/lib/services/inferenceSource";
import {
  appendDiagnosticRecord,
  clearDiagnosticHistory,
  loadDiagnosticHistory,
  runElevenLabsAvailabilityDiagnostic,
  runElevenLabsDiagnostic,
  runFirebaseInferenceDiagnostic,
  runLlamaParseAvailabilityDiagnostic,
  type DiagnosticOutcome,
  type DiagnosticRecord,
  type DiagnosticService,
} from "@/lib/services/aiDiagnostics";
import { isFirebaseConfigured } from "@/lib/services/firebaseAi";
import type { InferencePreference } from "@/lib/types";

type RunningService = DiagnosticService | null;
type AvailabilityState = DiagnosticRecord | null;

export function IntegrationsScreen({
  defaultMode,
  onInference,
}: {
  defaultMode: InferencePreference;
  onInference: (source: InferenceSource) => void;
}) {
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<InferencePreference>(defaultMode);
  const [cloudConsent, setCloudConsent] = useState(false);
  const [running, setRunning] = useState<RunningService>(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [history, setHistory] = useState<DiagnosticRecord[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [latestFirebase, setLatestFirebase] = useState<DiagnosticRecord | null>(null);
  const [llamaAvailability, setLlamaAvailability] = useState<AvailabilityState>(null);
  const [elevenAvailability, setElevenAvailability] = useState<AvailabilityState>(null);

  useEffect(() => {
    try {
      const saved = loadDiagnosticHistory();
      setHistory(saved);
      setLatestFirebase(saved.find((item) => item.service === "firebase-ai") ?? null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : t("integrations_history_error"));
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      runLlamaParseAvailabilityDiagnostic(),
      runElevenLabsAvailabilityDiagnostic(),
    ]).then(([llama, eleven]) => {
      if (!active) return;
      setLlamaAvailability(llama);
      setElevenAvailability(eleven);
    });
    return () => {
      active = false;
    };
  }, []);

  const latestAppCheck = latestFirebase?.appCheck;
  const needsCloudConsent = mode === "cloud" || mode === "hybrid";
  const firebaseConfigured = isFirebaseConfigured();

  function storeResult(result: DiagnosticRecord) {
    setHistoryError("");
    try {
      setHistory(appendDiagnosticRecord(result));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : t("integrations_history_error"));
    }
    if (result.source) onInference(result.source === "on-device" ? "ON_DEVICE" : "IN_CLOUD");
  }

  async function runFirebase() {
    if (!firebaseConfigured || (needsCloudConsent && !cloudConsent)) return;
    setRunning("firebase-ai");
    setLatestFirebase(null);
    setElapsedSecs(0);
    elapsedRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
    try {
      const result = await runFirebaseInferenceDiagnostic(mode);
      setLatestFirebase(result);
      storeResult(result);
      // Consent is cleared after each test — it is valid for one execution only.
      setCloudConsent(false);
    } finally {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      setRunning(null);
    }
  }

  async function refreshLlama() {
    setRunning("llamaparse");
    try {
      const result = await runLlamaParseAvailabilityDiagnostic();
      setLlamaAvailability(result);
      storeResult(result);
    } finally {
      setRunning(null);
    }
  }

  async function testElevenLabs() {
    setRunning("elevenlabs");
    try {
      const result = await runElevenLabsDiagnostic(locale);
      setElevenAvailability(result);
      storeResult(result);
    } finally {
      setRunning(null);
    }
  }

  function clearHistory() {
    try {
      clearDiagnosticHistory();
      setHistory([]);
      setLatestFirebase(null);
      setHistoryError("");
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : t("integrations_history_error"));
    }
  }

  const statusLabel = (outcome: DiagnosticOutcome | undefined) =>
    outcome === "success"
      ? t("integrations_status_success")
      : outcome === "failure"
        ? t("integrations_status_failure")
        : outcome === "timeout"
          ? t("integrations_status_timeout")
          : outcome === "configured"
            ? t("integrations_status_configured")
            : outcome === "not-configured"
              ? t("integrations_status_not_configured")
              : t("integrations_status_not_tested");

  const serviceLabels = useMemo(
    () => ({
      "firebase-ai": "Firebase AI Logic",
      llamaparse: "LlamaParse",
      elevenlabs: "ElevenLabs",
    }),
    [],
  );
  const operationLabel = (item: DiagnosticRecord) =>
    item.operation === "inference"
      ? t("integrations_operation_inference")
      : item.operation === "availability"
        ? t("integrations_operation_availability")
        : t("integrations_operation_speech");

  return (
    <div className="pm-integrations-screen">
      <div className="pm-integrations-notice" role="note">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <strong>{t("integrations_observable_title")}</strong>
          <p>{t("integrations_observable_detail")}</p>
        </div>
      </div>

      <section className="pm-integrations-grid" aria-label={t("integrations_ai_title")}>
        <article className="pm-panel pm-integration-card">
          <div className="pm-integration-card-head">
            <span className="pm-integration-icon">
              <Cloud size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>{t("integrations_firebase_title")}</h2>
              <p>{t("integrations_firebase_detail")}</p>
            </div>
            <span
              className={`pm-integration-status is-${firebaseConfigured ? "configured" : "not-configured"}`}
            >
              {firebaseConfigured
                ? t("integrations_status_configured")
                : t("integrations_status_not_configured")}
            </span>
          </div>

          <fieldset className="pm-integration-modes">
            <legend>{t("integrations_firebase_mode")}</legend>
            {(["local", "cloud", "hybrid"] as const).map((candidate) => (
              <label key={candidate}>
                <input
                  type="radio"
                  name="firebase-diagnostic-mode"
                  value={candidate}
                  checked={mode === candidate}
                  onChange={() => {
                    setMode(candidate);
                    setCloudConsent(false);
                  }}
                  disabled={running === "firebase-ai"}
                />
                <span>
                  {candidate === "local"
                    ? t("settings_mode_local")
                    : candidate === "cloud"
                      ? t("settings_mode_cloud")
                      : t("settings_mode_hybrid")}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="pm-integration-observation">
            <span>{t("integrations_app_check_label")}</span>
            <strong>
              {latestAppCheck === "accepted"
                ? t("integrations_app_check_accepted")
                : latestAppCheck === "rejected"
                  ? t("integrations_app_check_rejected")
                  : latestAppCheck === "not-applicable"
                    ? t("integrations_app_check_not_applicable")
                    : t("integrations_app_check_unknown")}
            </strong>
          </div>

          {needsCloudConsent && (
            <label className="pm-integration-consent">
              <input
                type="checkbox"
                checked={cloudConsent}
                onChange={(event) => setCloudConsent(event.currentTarget.checked)}
                disabled={running === "firebase-ai"}
              />
              <span>
                {t("integrations_firebase_consent")}
                <small style={{ display: "block", marginTop: 2, opacity: 0.75 }}>
                  {t("integrations_consent_single_use")}
                </small>
              </span>
            </label>
          )}

          <p className="pm-integration-footnote">
            <AlertCircle size={14} aria-hidden="true" />
            {t("integrations_firebase_sample_note")}
          </p>

          {latestFirebase && (
            <div
              className={`pm-integration-result is-${latestFirebase.outcome}`}
              role={
                latestFirebase.outcome === "failure" || latestFirebase.outcome === "timeout"
                  ? "alert"
                  : "status"
              }
            >
              {latestFirebase.outcome === "success" ? (
                <CheckCircle2 size={15} aria-hidden="true" />
              ) : latestFirebase.outcome === "timeout" ? (
                <Timer size={15} aria-hidden="true" />
              ) : latestFirebase.outcome === "failure" && latestFirebase.appCheck === "rejected" ? (
                <ShieldX size={15} aria-hidden="true" />
              ) : (
                <AlertCircle size={15} aria-hidden="true" />
              )}
              <span>
                {latestFirebase.message}
                {latestFirebase.httpStatus !== undefined && (
                  <> · HTTP {latestFirebase.httpStatus}</>
                )}
                {latestFirebase.outcome !== "timeout" && <> · {latestFirebase.latencyMs} ms</>}
              </span>
            </div>
          )}

          <button
            type="button"
            className="pm-button pm-button--primary"
            onClick={() => void runFirebase()}
            disabled={
              running === "firebase-ai" ||
              !firebaseConfigured ||
              (needsCloudConsent && !cloudConsent)
            }
          >
            {running === "firebase-ai" ? (
              <LoaderCircle size={15} className="pm-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={15} aria-hidden="true" />
            )}
            {t("integrations_firebase_run")}
          </button>
          {running === "firebase-ai" && (
            <div className="pm-integration-running" role="status" aria-live="polite">
              <Clock size={13} aria-hidden="true" />
              <span>
                {t("integrations_running_elapsed", { secs: elapsedSecs })}
                {needsCloudConsent && <> · {t("integrations_timeout_hint")}</>}
              </span>
              <progress
                className="pm-integration-progress"
                aria-label={t("integrations_firebase_run")}
              />
            </div>
          )}
        </article>

        <article className="pm-panel pm-integration-card">
          <div className="pm-integration-card-head">
            <span className="pm-integration-icon">
              <FileSearch size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>LlamaParse</h2>
              <p>{t("integrations_llama_detail")}</p>
            </div>
            <span className={`pm-integration-status is-${llamaAvailability?.outcome ?? "pending"}`}>
              {statusLabel(llamaAvailability?.outcome)}
            </span>
          </div>
          <p className="pm-integration-body-copy">
            {llamaAvailability?.message ?? t("integrations_checking")}
          </p>
          <div className="pm-integration-callout">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>{t("integrations_llama_consent_note")}</span>
          </div>
          <button
            type="button"
            className="pm-button pm-button--outline"
            onClick={() => void refreshLlama()}
            disabled={running === "llamaparse"}
          >
            {running === "llamaparse" ? (
              <LoaderCircle size={15} className="pm-spin" aria-hidden="true" />
            ) : (
              <RefreshCw size={15} aria-hidden="true" />
            )}
            {t("integrations_check_configuration")}
          </button>
        </article>

        <article className="pm-panel pm-integration-card">
          <div className="pm-integration-card-head">
            <span className="pm-integration-icon">
              <Mic2 size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>{t("integrations_eleven_title")}</h2>
              <p>{t("integrations_eleven_detail")}</p>
            </div>
            <span
              className={`pm-integration-status is-${elevenAvailability?.outcome ?? "pending"}`}
            >
              {statusLabel(elevenAvailability?.outcome)}
            </span>
          </div>
          <p className="pm-integration-body-copy">
            {elevenAvailability?.message ?? t("integrations_checking")}
          </p>
          <p className="pm-integration-footnote">
            <AlertCircle size={14} aria-hidden="true" />
            {t("integrations_eleven_test_note")}
          </p>
          <button
            type="button"
            className="pm-button pm-button--outline"
            onClick={() => void testElevenLabs()}
            disabled={running === "elevenlabs" || elevenAvailability?.outcome === "not-configured"}
          >
            {running === "elevenlabs" ? (
              <LoaderCircle size={15} className="pm-spin" aria-hidden="true" />
            ) : (
              <Mic2 size={15} aria-hidden="true" />
            )}
            {t("integrations_eleven_run")}
          </button>
        </article>
      </section>

      <section className="pm-panel pm-integrations-mcp">
        <div className="pm-panel-heading">
          <div>
            <h2>{t("integrations_mcp_title")}</h2>
            <p>{t("integrations_mcp_detail")}</p>
          </div>
          <span className="pm-integration-status is-not-configured">
            {t("integrations_mcp_not_implemented")}
          </span>
        </div>
        <div className="pm-mcp-layout">
          <div className="pm-mcp-message">
            <PlugZap size={22} aria-hidden="true" />
            <strong>{t("integrations_mcp_boundary_title")}</strong>
            <p>{t("integrations_mcp_boundary_detail")}</p>
          </div>
          <ol>
            <li>{t("integrations_mcp_requirement_auth")}</li>
            <li>{t("integrations_mcp_requirement_readonly")}</li>
            <li>{t("integrations_mcp_requirement_bridge")}</li>
            <li>{t("integrations_mcp_requirement_audit")}</li>
          </ol>
        </div>
      </section>

      <section className="pm-panel pm-integration-history">
        <div className="pm-panel-heading">
          <div>
            <h2>{t("integrations_history_title")}</h2>
            <p>{t("integrations_history_detail")}</p>
          </div>
          <button
            type="button"
            className="pm-button pm-button--outline"
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t("integrations_history_clear")}
          </button>
        </div>
        {historyError && (
          <p className="pm-integration-history-error" role="alert">
            {historyError}
          </p>
        )}
        {history.length > 0 ? (
          <div
            className="pm-table-wrap pm-integration-history-wrap"
            role="region"
            tabIndex={0}
            aria-labelledby="diagnostic-history-caption"
          >
            <table className="pm-table pm-integration-history-table">
              <caption id="diagnostic-history-caption" className="sr-only">
                {t("integrations_history_title")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("integrations_history_time")}</th>
                  <th scope="col">{t("integrations_history_service")}</th>
                  <th scope="col">{t("integrations_history_operation")}</th>
                  <th scope="col">{t("integrations_history_source")}</th>
                  <th scope="col">{t("integrations_history_result")}</th>
                  <th scope="col">{t("integrations_history_latency")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.observedAt).toLocaleString(locale)}</td>
                    <th scope="row">{serviceLabels[item.service]}</th>
                    <td>{operationLabel(item)}</td>
                    <td>
                      {item.source
                        ? t(
                            item.source === "on-device"
                              ? "integrations_source_device"
                              : "integrations_source_cloud",
                          )
                        : "—"}
                    </td>
                    <td>
                      <span className={`pm-integration-status is-${item.outcome}`}>
                        {statusLabel(item.outcome)}
                      </span>
                    </td>
                    <td>{item.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pm-integration-history-empty">
            <History size={22} aria-hidden="true" />
            <strong>{t("integrations_history_empty")}</strong>
            <p>{t("integrations_history_empty_detail")}</p>
          </div>
        )}
        <p className="pm-integration-history-note">
          <Database size={13} aria-hidden="true" />
          {t("integrations_history_local_note")}
        </p>
      </section>
    </div>
  );
}
