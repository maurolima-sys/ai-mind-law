import type { InferencePreference } from "@/lib/types";

export type PreferenceLocale = "en" | "pt" | "es";
export type AiProvider = "pocketmind" | "byok-firebase";

export interface PocketMindPreferences {
  version: 1;
  locale: PreferenceLocale;
  defaultProcessingMode: InferencePreference;
  tourNarrationEnabled: boolean;
  voiceInputEnabled: boolean;
  answerSpeechEnabled: boolean;
  sectionSoundEnabled: boolean;
  aiProvider: AiProvider;
}

export const PREFERENCES_STORAGE_KEY = "pocketmind.preferences";
export const LEGACY_LOCALE_STORAGE_KEY = "pocketmind.locale";
export const LEGACY_TOUR_MUTE_STORAGE_KEY = "pocketmind.tour.muted";

export function defaultPreferences(
  fallbackProcessingMode: InferencePreference = "local",
): PocketMindPreferences {
  return {
    version: 1,
    locale: "en",
    defaultProcessingMode: fallbackProcessingMode,
    tourNarrationEnabled: true,
    voiceInputEnabled: true,
    answerSpeechEnabled: true,
    sectionSoundEnabled: true,
    aiProvider: "pocketmind",
  };
}

function isLocale(value: unknown): value is PreferenceLocale {
  return value === "en" || value === "pt" || value === "es";
}

function isProcessingMode(value: unknown): value is InferencePreference {
  return value === "local" || value === "cloud" || value === "hybrid";
}

function isAiProvider(value: unknown): value is AiProvider {
  return value === "pocketmind" || value === "byok-firebase";
}

export function parsePreferences(
  value: string | null,
  fallbackProcessingMode: InferencePreference = "local",
): PocketMindPreferences {
  const defaults = defaultPreferences(fallbackProcessingMode);
  if (!value) return defaults;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return defaults;
  }
  if (!parsed || typeof parsed !== "object") return defaults;

  const candidate = parsed as Partial<PocketMindPreferences>;
  return {
    ...defaults,
    version: 1,
    locale: isLocale(candidate.locale) ? candidate.locale : defaults.locale,
    defaultProcessingMode: isProcessingMode(candidate.defaultProcessingMode)
      ? candidate.defaultProcessingMode
      : defaults.defaultProcessingMode,
    tourNarrationEnabled:
      typeof candidate.tourNarrationEnabled === "boolean"
        ? candidate.tourNarrationEnabled
        : defaults.tourNarrationEnabled,
    voiceInputEnabled:
      typeof candidate.voiceInputEnabled === "boolean"
        ? candidate.voiceInputEnabled
        : defaults.voiceInputEnabled,
    answerSpeechEnabled:
      typeof candidate.answerSpeechEnabled === "boolean"
        ? candidate.answerSpeechEnabled
        : defaults.answerSpeechEnabled,
    sectionSoundEnabled:
      typeof candidate.sectionSoundEnabled === "boolean"
        ? candidate.sectionSoundEnabled
        : defaults.sectionSoundEnabled,
    aiProvider: isAiProvider(candidate.aiProvider) ? candidate.aiProvider : defaults.aiProvider,
  };
}

export function loadPreferences(
  fallbackProcessingMode: InferencePreference = "local",
): PocketMindPreferences {
  const defaults = defaultPreferences(fallbackProcessingMode);
  if (typeof localStorage === "undefined") return defaults;

  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
  const preferences = parsePreferences(stored, fallbackProcessingMode);
  if (stored) return preferences;

  const legacyLocale = localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
  const legacyMuted = localStorage.getItem(LEGACY_TOUR_MUTE_STORAGE_KEY);
  return {
    ...preferences,
    locale: isLocale(legacyLocale) ? legacyLocale : preferences.locale,
    tourNarrationEnabled: legacyMuted === "1" ? false : preferences.tourNarrationEnabled,
  };
}

export function savePreferences(preferences: PocketMindPreferences): void {
  const normalized = parsePreferences(
    JSON.stringify(preferences),
    preferences.defaultProcessingMode,
  );
  localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, normalized.locale);
  localStorage.setItem(LEGACY_TOUR_MUTE_STORAGE_KEY, normalized.tourNarrationEnabled ? "0" : "1");
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
}

export function saveLocalePreference(locale: PreferenceLocale): void {
  if (!localStorage.getItem(PREFERENCES_STORAGE_KEY)) {
    localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, locale);
    return;
  }

  savePreferences({ ...loadPreferences(), locale });
}
