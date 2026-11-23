import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  type AI,
  type GenerativeModel,
  type Schema,
} from "firebase/ai";
import type { InferencePreference } from "@/lib/types";
import { TENDER_ANALYSIS_RESPONSE_SCHEMA } from "@/lib/services/tenderAnalysisSchema";
import { loadByokConfig, hashByokConfig, type ByokFirebaseConfig } from "@/lib/byokConfig";

export const PRIMARY_GEMINI_MODEL = "gemini-3.5-flash";
export const SECONDARY_GEMINI_MODEL = "gemini-3.8-flash";
export const TERTIARY_GEMINI_MODEL = "gemini-3.5-flash-lite";

export const GEMINI_MODEL_FALLBACK_CHAIN = [
  PRIMARY_GEMINI_MODEL,
  SECONDARY_GEMINI_MODEL,
  TERTIARY_GEMINI_MODEL,
] as const;

export type GeminiModelName = (typeof GEMINI_MODEL_FALLBACK_CHAIN)[number];

// 401 is included: App Check limited-use token rejection is transient — a fresh
// token is requested on the next attempt with a different model instance.
const RETRYABLE_STATUS_CODES = new Set([401, 429, 500, 502, 503]);
const TIMEOUT_ERROR_CODE = "TIMEOUT";
const GENERATION_TIMEOUT_MS = 30_000;
export const ON_DEVICE_GENERATION_TIMEOUT_MS = 180_000;
const TOTAL_GENERATION_BUDGET_MS = 100_000;
const RETRY_STEPS = [
  { modelName: PRIMARY_GEMINI_MODEL, delayMs: 0, jitterMs: 0 },
  { modelName: SECONDARY_GEMINI_MODEL, delayMs: 3_000, jitterMs: 1_000 },
  { modelName: TERTIARY_GEMINI_MODEL, delayMs: 6_000, jitterMs: 2_000 },
] as const;

export const DEVICE_MODEL_INIT_TIMEOUT_MS = 60_000;
const DEVICE_MODEL_INIT_TIMEOUT_CODE = "DEVICE_MODEL_INIT_TIMEOUT";
const ON_DEVICE_GENERATION_TIMEOUT_CODE = "ON_DEVICE_GENERATION_TIMEOUT";

export const TOTAL_MODEL_ATTEMPTS = RETRY_STEPS.length;

export type OnDeviceTimeoutStage = "initialization" | "generation";

export function getOnDeviceTimeoutStage(error: unknown): OnDeviceTimeoutStage | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  if (error.code === DEVICE_MODEL_INIT_TIMEOUT_CODE) return "initialization";
  if (error.code === ON_DEVICE_GENERATION_TIMEOUT_CODE) return "generation";
  return undefined;
}

export async function initializeDeviceModelWithTimeout(
  initialize: (onProgress: (progress: number) => void) => Promise<void>,
  onProgress: (progress: number) => void,
  options: { maxDurationMs?: number } = {},
): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let maxTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let active = true;
  let rejectTimeout!: (error: Error) => void;
  const maxDurationMs = options.maxDurationMs;
  const timeout = new Promise<never>((_, reject) => {
    rejectTimeout = reject;
  });
  const maxDuration =
    maxDurationMs !== undefined
      ? new Promise<never>((_, reject) => {
          maxTimeoutId = setTimeout(() => {
            reject(
              Object.assign(
                new Error(
                  `On-device model initialisation exceeded ${maxDurationMs / 1000} seconds.`,
                ),
                { code: DEVICE_MODEL_INIT_TIMEOUT_CODE },
              ),
            );
          }, maxDurationMs);
        })
      : new Promise<never>(() => {});
  const resetTimeout = () => {
    if (!active) return;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      rejectTimeout(
        Object.assign(
          new Error(
            `On-device model initialisation timed out after ${DEVICE_MODEL_INIT_TIMEOUT_MS / 1000} seconds.`,
          ),
          { code: DEVICE_MODEL_INIT_TIMEOUT_CODE },
        ),
      );
    }, DEVICE_MODEL_INIT_TIMEOUT_MS);
  };

  try {
    resetTimeout();
    const initialization = initialize((progress) => {
      if (!active) return;
      onProgress(progress);
      resetTimeout();
    });
    await Promise.race([initialization, timeout, maxDuration]);
  } finally {
    active = false;
    if (timeoutId) clearTimeout(timeoutId);
    if (maxTimeoutId) clearTimeout(maxTimeoutId);
  }
}

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

export function isInvalidFirebaseAppCheckTokenError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as {
    customErrorData?: { message?: unknown };
    message?: unknown;
    cause?: unknown;
  };
  const matches = [candidate.message, candidate.customErrorData?.message].some(
    (message) =>
      typeof message === "string" && /firebase app check token is invalid/i.test(message),
  );
  if (matches) return true;
  return candidate.cause ? isInvalidFirebaseAppCheckTokenError(candidate.cause) : false;
}

export function isAppCheckError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; message?: unknown; cause?: unknown };
  if (typeof candidate.code === "string" && /appCheck|recaptcha/i.test(candidate.code)) return true;
  if (
    typeof candidate.message === "string" &&
    /appCheck.*recaptcha|recaptcha.*error|app.check/i.test(candidate.message)
  )
    return true;
  return candidate.cause ? isAppCheckError(candidate.cause) : false;
}

export function isRetryableFirebaseAiError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === TIMEOUT_ERROR_CODE
  ) {
    return true;
  }
  const status = getFirebaseAiHttpStatus(error);
  return status !== undefined && RETRYABLE_STATUS_CODES.has(status);
}

export function geminiModelLabel(modelName: string): string {
  switch (modelName) {
    case PRIMARY_GEMINI_MODEL:
      return "Gemini 3.5 Flash";
    case SECONDARY_GEMINI_MODEL:
      return "Gemini 3.8 Flash";
    case TERTIARY_GEMINI_MODEL:
      return "Gemini 3.5 Flash-Lite";
    default:
      return modelName;
  }
}

export async function generateWithModelFallback<T>(
  preference: InferencePreference,
  generate: (modelName: GeminiModelName, signal?: AbortSignal) => Promise<T>,
  options: {
    onRetry?: (update: { modelName: GeminiModelName; status?: number; attempt: number }) => void;
    localTimeoutMs?: number;
  } = {},
): Promise<{ result: T; modelName: GeminiModelName }> {
  if (preference === "local") {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        const localTimeoutMs = options.localTimeoutMs ?? ON_DEVICE_GENERATION_TIMEOUT_MS;
        timeoutId = setTimeout(() => {
          const timeoutError = Object.assign(
            new Error(`On-device inference timed out after ${localTimeoutMs / 1000} seconds.`),
            { code: ON_DEVICE_GENERATION_TIMEOUT_CODE },
          );
          reject(timeoutError);
          controller.abort(timeoutError);
        }, options.localTimeoutMs ?? ON_DEVICE_GENERATION_TIMEOUT_MS);
      });
      const result = await Promise.race([
        generate(PRIMARY_GEMINI_MODEL, controller.signal),
        timeout,
      ]);
      return { result, modelName: PRIMARY_GEMINI_MODEL };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
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
    const remainingAttempts = RETRY_STEPS.length - index;
    const availableAttemptBudget = deadline - Date.now() - futureDelayBudget;
    const timeoutMs = Math.min(
      GENERATION_TIMEOUT_MS,
      Math.floor(availableAttemptBudget / remainingAttempts),
    );
    if (timeoutMs <= 0) break;

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const timeoutError = new Error(
            `Firebase AI Logic request timed out after ${Math.ceil(timeoutMs / 1000)} seconds.`,
          );
          Object.assign(timeoutError, { code: TIMEOUT_ERROR_CODE });
          reject(timeoutError);
          controller.abort();
        }, timeoutMs);
      });
      const result = await Promise.race([generate(step.modelName, controller.signal), timeout]);
      return { result, modelName: step.modelName };
    } catch (error) {
      lastError = error;
      const nextStep = RETRY_STEPS[index + 1];
      if (!nextStep || !isRetryableFirebaseAiError(error)) break;
      const status = getFirebaseAiHttpStatus(error);
      options.onRetry?.({
        modelName: nextStep.modelName,
        ...(status === undefined ? {} : { status }),
        attempt: index + 2,
      });
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
  /** Hash of the config used to create this runtime — used to detect stale singletons. */
  configHash: string;
};

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
  // Injected by vite.config.ts define — present only in dev builds.
  const __APPCHECK_DEBUG_TOKEN__: string | undefined;
}

const runtimeWindowKey = "__pocketMindFirebaseRuntime";
const byokRuntimeWindowKey = "__pocketMindByokFirebaseRuntime";

/** Sentinel hash used for the default (PocketMind) runtime. */
const DEFAULT_CONFIG_HASH = "__pocketmind_default__";

function firebaseConfiguration() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_APP_ID,
  } = import.meta.env;
  const config = {
    apiKey: VITE_FIREBASE_API_KEY?.trim(),
    authDomain: VITE_FIREBASE_AUTH_DOMAIN?.trim(),
    appId: VITE_FIREBASE_APP_ID?.trim(),
    projectId: VITE_FIREBASE_PROJECT_ID?.trim(),
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

// ─── BYOK runtime initializer ─────────────────────────────────────────────────

function initByokRuntime(config: ByokFirebaseConfig): FirebaseRuntime {
  const configHash = hashByokConfig(config);
  // Use a named Firebase app to avoid colliding with the default PocketMind app.
  const appName = `byok-${configHash.slice(0, 8)}`;
  const app = getApps().some((a) => a.name === appName)
    ? getApp(appName)
    : initializeApp(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          appId: config.appId,
        },
        appName,
      );

  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });

  return {
    app,
    appCheck,
    ai: getAI(app, {
      backend: new GoogleAIBackend(),
      useLimitedUseAppCheckTokens: true,
    }),
    configHash,
  };
}

export function isFirebaseConfigured() {
  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_APP_ID,
  } = import.meta.env;
  const appCheckSiteKey = import.meta.env["VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"]?.trim();
  return Boolean(
    VITE_FIREBASE_API_KEY?.trim() &&
    VITE_FIREBASE_AUTH_DOMAIN?.trim() &&
    VITE_FIREBASE_APP_ID?.trim() &&
    VITE_FIREBASE_PROJECT_ID?.trim() &&
    (import.meta.env.DEV || appCheckSiteKey),
  );
}

type RuntimeHost = Window & {
  [runtimeWindowKey]?: FirebaseRuntime;
  [byokRuntimeWindowKey]?: FirebaseRuntime;
};

/**
 * Returns the active Firebase runtime.
 *
 * Priority:
 *   1. If a complete BYOK config is saved in localStorage, use (or create) the
 *      BYOK runtime. If the saved config changed since the last call, the old
 *      singleton is discarded and a new one is created — preventing stale
 *      runtimes from being reused across provider switches.
 *   2. Otherwise, fall back to the default PocketMind runtime.
 *
 * Operations already in flight hold a reference to the runtime object they
 * started with, so switching providers mid-analysis does not affect them.
 */
function getFirebaseRuntime(): FirebaseRuntime {
  if (typeof window === "undefined") {
    throw new Error("Firebase AI can only be initialized in the browser.");
  }

  const host = window as RuntimeHost;

  // ── BYOK path ────────────────────────────────────────────────────────────────
  const byokConfig = loadByokConfig();
  if (byokConfig) {
    const newHash = hashByokConfig(byokConfig);
    const existing = host[byokRuntimeWindowKey];
    if (existing && existing.configHash === newHash) {
      return existing;
    }
    // Config changed or first use — create a fresh runtime.
    const runtime = initByokRuntime(byokConfig);
    host[byokRuntimeWindowKey] = runtime;
    return runtime;
  }

  // ── Default PocketMind path ───────────────────────────────────────────────────
  const existing = host[runtimeWindowKey];
  if (existing && existing.configHash === DEFAULT_CONFIG_HASH) {
    return existing;
  }

  const app = getApps().some((candidate) => candidate.name === "[DEFAULT]")
    ? getApp()
    : initializeApp(firebaseConfiguration());

  const siteKey = import.meta.env["VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY"]?.trim();
  if (!siteKey) {
    throw new Error(
      "Firebase App Check is not configured. Set VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY for this deployment.",
    );
  }

  // Setting window.FIREBASE_APPCHECK_DEBUG_TOKEN before initializeAppCheck
  // activates the App Check debug bypass — the reCAPTCHA call is skipped
  // and the registered debug token is used instead.
  // __APPCHECK_DEBUG_TOKEN__ is a build-time define injected only in dev builds;
  // it is never present in the production bundle.
  if (import.meta.env.DEV) {
    const debugToken =
      typeof __APPCHECK_DEBUG_TOKEN__ !== "undefined" ? __APPCHECK_DEBUG_TOKEN__ : undefined;
    if (debugToken) {
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }
  }

  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  const runtime: FirebaseRuntime = {
    app,
    appCheck,
    ai: getAI(app, {
      backend: new GoogleAIBackend(),
      useLimitedUseAppCheckTokens: true,
    }),
    configHash: DEFAULT_CONFIG_HASH,
  };
  host[runtimeWindowKey] = runtime;
  return runtime;
}

export function createTenderModel(
  preference: InferencePreference,
  modelName: GeminiModelName = PRIMARY_GEMINI_MODEL,
  responseSchema: Schema = TENDER_ANALYSIS_RESPONSE_SCHEMA,
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
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    },
    // responseConstraint is not passed to on-device — Chrome's Prompt API ignores it
    // and some versions throw on unknown fields. The parser handles free-form output.
  });
  return { model, appCheck };
}
