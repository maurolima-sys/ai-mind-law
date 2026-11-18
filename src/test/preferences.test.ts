import { beforeEach, describe, expect, it } from "vitest";

import {
  LEGACY_LOCALE_STORAGE_KEY,
  LEGACY_TOUR_MUTE_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  defaultPreferences,
  loadPreferences,
  parsePreferences,
  saveLocalePreference,
  savePreferences,
} from "@/lib/preferences";

describe("PocketMind preferences", () => {
  beforeEach(() => localStorage.clear());

  it("persists a complete versioned preference record", () => {
    const preferences = {
      ...defaultPreferences("local"),
      locale: "pt" as const,
      defaultProcessingMode: "hybrid" as const,
      tourNarrationEnabled: false,
      voiceInputEnabled: false,
      answerSpeechEnabled: false,
    };

    savePreferences(preferences);

    expect(loadPreferences("cloud")).toEqual(preferences);
    expect(localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY)).toBe("pt");
    expect(localStorage.getItem(LEGACY_TOUR_MUTE_STORAGE_KEY)).toBe("1");
  });

  it("migrates supported legacy locale and narration settings", () => {
    localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, "es");
    localStorage.setItem(LEGACY_TOUR_MUTE_STORAGE_KEY, "1");

    expect(loadPreferences("hybrid")).toMatchObject({
      locale: "es",
      defaultProcessingMode: "hybrid",
      tourNarrationEnabled: false,
    });
  });

  it("keeps the configured processing fallback when only the locale changes", () => {
    saveLocalePreference("pt");

    expect(localStorage.getItem(PREFERENCES_STORAGE_KEY)).toBeNull();
    expect(loadPreferences("hybrid")).toMatchObject({
      locale: "pt",
      defaultProcessingMode: "hybrid",
    });
  });

  it("repairs malformed and partially invalid records without throwing", () => {
    expect(parsePreferences("{not json", "local")).toEqual(defaultPreferences("local"));

    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        version: 0,
        locale: "invalid",
        defaultProcessingMode: "demo",
        tourNarrationEnabled: "yes",
        voiceInputEnabled: false,
      }),
    );

    expect(loadPreferences("cloud")).toEqual({
      version: 1,
      locale: "en",
      defaultProcessingMode: "cloud",
      tourNarrationEnabled: true,
      voiceInputEnabled: false,
      answerSpeechEnabled: true,
    });
  });
});
