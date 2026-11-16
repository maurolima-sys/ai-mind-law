import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  type AI,
  type GenerativeModel,
} from "firebase/ai";
import type { InferencePreference } from "@/lib/types";

export const PRIMARY_GEMINI_MODEL = "gemini-3.8-flash";
export const SECONDARY_GEMINI_MODEL = "gemini-3.7-flash";
export const TERTIARY_GEMINI_MODEL = "gemini-3.6-flash";
export const FALLBACK_GEMINI_MODEL = "gemini-3.5-flash-lite";

export const GEMINI_MODEL_FALLBACK_CHAIN = [
  PRIMARY_GEMINI_MODEL,
  SECONDARY_GEMINI_MODEL,
  TERTIARY_GEMINI_MODEL,
  FALLBACK_GEMINI_MODEL,
] as const;

export type GeminiModelName = (typeof GEMINI_MODEL_FALLBACK_CHAIN)[number];

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503]);
const GENERATION_TIMEOUT_MS = 20_000;
const TOTAL_GENERATION_BUDGET_MS = 60_000;
const RETRY_STEPS = [
  { modelName: PRIMARY_GEMINI_MODEL, delayMs: 0, jitterMs: 0 },
  { modelName: PRIMARY_GEMINI_MODEL, delayMs: 2_000, jitterMs: 1_000 },
  { modelName: SECONDARY_GEMINI_MODEL, delayMs: 5_000, jitterMs: 2_000 },
  { modelName: TERTIARY_GEMINI_MODEL, delayMs: 8_000, jitterMs: 3_000 },
  { modelName: FALLBACK_GEMINI_MODEL, delayMs: 12_000, jitterMs: 4_000 },
] as const;

export const TOTAL_MODEL_ATTEMPTS = RETRY_STEPS.length;

export function getFirebaseAiHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as {
    customErrorData?: { status?: unknown };
    message?: unknown;
    cause?: unknown;
  };
  if (typeof candidate.customErrorData?.status === "number") {
    return candidate.customErrorData.status;
  }
  if (typeof candidate.message === "string") {
    const match = candidate.message.match(/\[(\d{3})(?:\s|])/);
    if (match) return Number(match[1]);
  }
  return candidate.cause ? getFirebaseAiHttpStatus(candidate.cause) : undefined;
}

export function isRetryableFirebaseAiError(error: unknown): boolean {
  const status = getFirebaseAiHttpStatus(error);
  return status !== undefined && RETRYABLE_STATUS_CODES.has(status);
}

export function geminiModelLabel(modelName: string): string {
  switch (modelName) {
    case PRIMARY_GEMINI_MODEL:
      return "Gemini 3.8 Flash";
    case SECONDARY_GEMINI_MODEL:
      return "Gemini 3.7 Flash";
    case TERTIARY_GEMINI_MODEL:
      return "Gemini 3.6 Flash";
    case FALLBACK_GEMINI_MODEL:
      return "Gemini 3.5 Flash-Lite";
    default:
      return modelName;
  }
}

export async function generateWithModelFallback<T>(
  preference: InferencePreference,
  generate: (modelName: GeminiModelName, signal?: AbortSignal) => Promise<T>,
  options: {
    onRetry?: (update: { modelName: GeminiModelName; status: number; attempt: number }) => void;
  } = {},
): Promise<{ result: T; modelName: GeminiModelName }> {
  if (preference === "local") {
    return { result: await generate(PRIMARY_GEMINI_MODEL), modelName: PRIMARY_GEMINI_MODEL };
  }

  const deadline = Date.now() + TOTAL_GENERATION_BUDGET_MS;
  let lastError: unknown;

  for (const [index, step] of RETRY_STEPS.entries()) {
    if (index > 0) {
      const delay = step.delayMs + Math.floor(Math.random() * step.jitterMs);
      const remaining = deadline - Date.now();
      if (remaining <= delay) break;
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }

    const futureDelayBudget = RETRY_STEPS.slice(index + 1).reduce(
      (total, nextStep) => total + nextStep.delayMs + nextStep.jitterMs,
      0,
    );
    const timeoutMs = Math.min(GENERATION_TIMEOUT_MS, deadline - Date.now() - futureDelayBudget);
    if (timeoutMs <= 0) break;

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(
            new Error(
              `Firebase AI Logic request timed out after ${Math.ceil(timeoutMs / 1000)} seconds.`,
            ),
          );
        }, timeoutMs);
      });
      const result = await Promise.race([generate(step.modelName, controller.signal), timeout]);
      return { result, modelName: step.modelName };
    } catch (error) {
      lastError = error;
      const status = getFirebaseAiHttpStatus(error);
      const nextStep = RETRY_STEPS[index + 1];
      if (!nextStep || status === undefined || !RETRYABLE_STATUS_CODES.has(status)) break;
      options.onRetry?.({ modelName: nextStep.modelName, status, attempt: index + 2 });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  if (isRetryableFirebaseAiError(lastError)) {
    const detail =
      lastError instanceof Error ? lastError.message : "The model returned a transient error.";
    const attemptedModels = [
      ...new Set(RETRY_STEPS.map((step) => geminiModelLabel(step.modelName))),
    ].join(", ");
    throw new Error(
      `Gemini remained temporarily unavailable after trying ${attemptedModels}. Please try again shortly. (${detail})`,
    );
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Firebase AI Logic could not complete the request.");
}

type FirebaseRuntime = {
  app: FirebaseApp;
  appCheck: AppCheck;
  ai: AI;
};

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
}

const runtimeWindowKey = "__pocketMindFirebaseRuntime";

function firebaseConfiguration() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_APP_ID,
  } = import.meta.env;
  const config = {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    appId: VITE_FIREBASE_APP_ID,
    projectId: VITE_FIREBASE_PROJECT_ID,
  };

  const missing = Object.entries({
    VITE_FIREBASE_API_KEY: config.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
    VITE_FIREBASE_PROJECT_ID: config.projectId,
    VITE_FIREBASE_APP_ID: config.appId,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured. Add these values to .env.local: ${missing.join(", ")}.`,
    );
  }

  return config;
}

export function isFirebaseConfigured() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_APP_ID,
  } = import.meta.env;
  const appCheckSiteKey = import.meta.env["VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"];
  return Boolean(
    VITE_FIREBASE_API_KEY &&
    VITE_FIREBASE_AUTH_DOMAIN &&
    VITE_FIREBASE_APP_ID &&
    VITE_FIREBASE_PROJECT_ID &&
    (import.meta.env.DEV || appCheckSiteKey),
  );
}

function getFirebaseRuntime(): FirebaseRuntime {
  if (typeof window === "undefined") {
    throw new Error("Firebase AI can only be initialized in the browser.");
  }

  const runtimeHost = window as Window & { [runtimeWindowKey]?: FirebaseRuntime };
  if (runtimeHost[runtimeWindowKey]) {
    return runtimeHost[runtimeWindowKey];
  }

  const app = getApps().some((candidate) => candidate.name === "[DEFAULT]")
    ? getApp()
    : initializeApp(firebaseConfiguration());

  let appCheck: AppCheck;
  if (import.meta.env.DEV) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("debug"),
      isTokenAutoRefreshEnabled: true,
    });
  } else {
    const siteKey = import.meta.env["VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"];
    if (!siteKey) {
      throw new Error(
        "Firebase App Check is not configured. Set VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY for this deployment.",
      );
    }
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  const runtime = {
    app,
    appCheck,
    ai: getAI(app, { backend: new GoogleAIBackend() }),
  };
  runtimeHost[runtimeWindowKey] = runtime;
  return runtime;
}

export function createTenderModel(
  preference: InferencePreference,
  responseConstraint?: object,
  modelName: GeminiModelName = PRIMARY_GEMINI_MODEL,
): {
  model: GenerativeModel;
  appCheck: AppCheck;
} {
  const { ai, appCheck } = getFirebaseRuntime();
  const mode =
    preference === "local"
      ? InferenceMode.ONLY_ON_DEVICE
      : preference === "cloud"
        ? InferenceMode.ONLY_IN_CLOUD
        : InferenceMode.PREFER_ON_DEVICE;
  const model = getGenerativeModel(ai, {
    mode,
    inCloudParams: {
      model: modelName,
      generationConfig: { responseMimeType: "application/json" },
    },
    ...(responseConstraint ? { onDeviceParams: { promptOptions: { responseConstraint } } } : {}),
  });
  return { model, appCheck };
}
