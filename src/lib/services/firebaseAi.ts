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
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    },
    ...(responseConstraint ? { onDeviceParams: { promptOptions: { responseConstraint } } } : {}),
  });
  return { model, appCheck };
}
