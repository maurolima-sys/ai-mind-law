import { answerDocumentQuestion } from "@/lib/services/documentQa";
import { isExternalOcrAvailable } from "@/lib/services/externalOcr";
import {
  getFirebaseAiHttpStatus,
  isFirebaseConfigured,
  isInvalidFirebaseAppCheckTokenError,
} from "@/lib/services/firebaseAi";
import {
  checkTourNarrationAvailability,
  synthesiseTourStep,
} from "@/lib/services/tourNarration.functions";
import type { PreferenceLocale } from "@/lib/preferences";
import type { InferencePreference } from "@/lib/types";

export const DIAGNOSTIC_HISTORY_KEY = "pocketmind.integration-diagnostics";
const MAX_HISTORY_ITEMS = 20;
const FIREBASE_DIAGNOSTIC_TEXT =
  "The fictional Northbridge project has a delivery deadline of 30 days.";
const FIREBASE_DIAGNOSTIC_QUESTION = "What delivery deadline is stated?";

export type DiagnosticService = "firebase-ai" | "llamaparse" | "elevenlabs";
export type DiagnosticOutcome = "success" | "failure" | "configured" | "not-configured";
export type AppCheckObservation = "accepted" | "rejected" | "unknown" | "not-applicable";
export type DiagnosticSource = "on-device" | "cloud";

export interface DiagnosticRecord {
  id: string;
  service: DiagnosticService;
  outcome: DiagnosticOutcome;
  observedAt: string;
  latencyMs: number;
  message: string;
  operation: "inference" | "availability" | "speech";
  source?: DiagnosticSource;
  mode?: InferencePreference;
  engine?: string;
  httpStatus?: number;
  appCheck?: AppCheckObservation;
}

function elapsed(startedAt: number): number {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "The diagnostic operation failed.";
  return message.replace(/\s+/g, " ").slice(0, 400);
}

function record(
  service: DiagnosticService,
  operation: DiagnosticRecord["operation"],
  outcome: DiagnosticOutcome,
  startedAt: number,
  message: string,
  extra: Partial<DiagnosticRecord> = {},
): DiagnosticRecord {
  return {
    id: `diagnostic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    service,
    operation,
    outcome,
    observedAt: new Date().toISOString(),
    latencyMs: elapsed(startedAt),
    message,
    ...extra,
  };
}

export async function runFirebaseInferenceDiagnostic(
  mode: InferencePreference,
): Promise<DiagnosticRecord> {
  const startedAt = performance.now();
  if (!isFirebaseConfigured()) {
    return record(
      "firebase-ai",
      "inference",
      "not-configured",
      startedAt,
      "Firebase AI Logic is not configured for this deployment.",
      { mode, appCheck: mode === "local" ? "not-applicable" : "unknown" },
    );
  }

  try {
    const answer = await answerDocumentQuestion(
      FIREBASE_DIAGNOSTIC_QUESTION,
      [FIREBASE_DIAGNOSTIC_TEXT],
      mode,
      {
        format: "pdf",
        sourceLocations: ["Prepared public demo text"],
        paginationVerified: false,
      },
    );
    const source = answer.inferenceSource === "ON_DEVICE" ? "on-device" : "cloud";
    return record(
      "firebase-ai",
      "inference",
      "success",
      startedAt,
      "A real Firebase AI Logic response and inference source were observed.",
      {
        mode,
        source,
        engine: answer.engine,
        appCheck: source === "cloud" ? "accepted" : "not-applicable",
      },
    );
  } catch (error) {
    const appCheckRejected = isInvalidFirebaseAppCheckTokenError(error);
    const httpStatus = getFirebaseAiHttpStatus(error);
    return record(
      "firebase-ai",
      "inference",
      "failure",
      startedAt,
      appCheckRejected
        ? "Firebase rejected the App Check token; no model response was observed."
        : errorMessage(error),
      {
        mode,
        ...(httpStatus === undefined ? {} : { httpStatus }),
        appCheck: mode === "local" ? "not-applicable" : appCheckRejected ? "rejected" : "unknown",
      },
    );
  }
}

export async function runLlamaParseAvailabilityDiagnostic(): Promise<DiagnosticRecord> {
  const startedAt = performance.now();
  try {
    const available = await isExternalOcrAvailable();
    return record(
      "llamaparse",
      "availability",
      available ? "configured" : "not-configured",
      startedAt,
      available
        ? "Server configuration is present. No PDF was uploaded or processed."
        : "The LlamaParse connector is not enabled for this deployment.",
    );
  } catch (error) {
    return record("llamaparse", "availability", "failure", startedAt, errorMessage(error));
  }
}

export async function runElevenLabsDiagnostic(locale: PreferenceLocale): Promise<DiagnosticRecord> {
  const startedAt = performance.now();
  try {
    const available = await checkTourNarrationAvailability();
    if (!available) {
      return record(
        "elevenlabs",
        "speech",
        "not-configured",
        startedAt,
        "Tour narration is not supported in this environment.",
      );
    }
    const narrationText =
      locale === "pt"
        ? "O diagnóstico de voz do PocketMind foi concluído."
        : locale === "es"
          ? "El diagnóstico de voz de PocketMind se ha completado."
          : "The PocketMind voice diagnostic has completed.";
    const result = await synthesiseTourStep({ data: { text: narrationText, locale } });
    const source = result.audioBase64 ? "Mistral Voxtral TTS" : "browser speech synthesis";
    return record(
      "elevenlabs",
      "speech",
      "success",
      startedAt,
      `Tour narration completed via ${source}.`,
    );
  } catch (error) {
    return record("elevenlabs", "speech", "failure", startedAt, errorMessage(error));
  }
}

export async function runElevenLabsAvailabilityDiagnostic(): Promise<DiagnosticRecord> {
  const startedAt = performance.now();
  try {
    const available = await checkTourNarrationAvailability();
    return record(
      "elevenlabs",
      "availability",
      available ? "configured" : "not-configured",
      startedAt,
      available
        ? "Tour narration is available (Mistral Voxtral TTS with browser speech fallback)."
        : "Tour narration is not supported in this environment.",
    );
  } catch (error) {
    return record("elevenlabs", "availability", "failure", startedAt, errorMessage(error));
  }
}

function isDiagnosticRecord(value: unknown): value is DiagnosticRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DiagnosticRecord>;
  return (
    typeof item.id === "string" &&
    (item.service === "firebase-ai" ||
      item.service === "llamaparse" ||
      item.service === "elevenlabs") &&
    (item.outcome === "success" ||
      item.outcome === "failure" ||
      item.outcome === "configured" ||
      item.outcome === "not-configured") &&
    typeof item.observedAt === "string" &&
    typeof item.latencyMs === "number" &&
    typeof item.message === "string" &&
    (item.operation === "inference" ||
      item.operation === "availability" ||
      item.operation === "speech")
  );
}

export function loadDiagnosticHistory(): DiagnosticRecord[] {
  if (typeof localStorage === "undefined") return [];
  const stored = localStorage.getItem(DIAGNOSTIC_HISTORY_KEY);
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isDiagnosticRecord)) {
    throw new Error("Saved diagnostic history is invalid.");
  }
  return parsed.slice(0, MAX_HISTORY_ITEMS);
}

export function appendDiagnosticRecord(item: DiagnosticRecord): DiagnosticRecord[] {
  const history = [item, ...loadDiagnosticHistory()].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(DIAGNOSTIC_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearDiagnosticHistory(): void {
  localStorage.removeItem(DIAGNOSTIC_HISTORY_KEY);
}
