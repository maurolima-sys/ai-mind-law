import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FALLBACK_GEMINI_MODEL,
  generateWithModelFallback,
  getFirebaseAiHttpStatus,
  isRetryableFirebaseAiError,
  PRIMARY_GEMINI_MODEL,
} from "@/lib/services/firebaseAi";

afterEach(() => {
  vi.useRealTimers();
});

describe("Firebase AI retry policy", () => {
  it("extracts Firebase SDK status metadata and retries only transient statuses", () => {
    expect(getFirebaseAiHttpStatus({ customErrorData: { status: 500 } })).toBe(500);
    expect(getFirebaseAiHttpStatus(new Error("Error fetching request: [502 Bad Gateway]"))).toBe(
      502,
    );
    expect(isRetryableFirebaseAiError({ customErrorData: { status: 503 } })).toBe(true);
    expect(isRetryableFirebaseAiError({ customErrorData: { status: 403 } })).toBe(false);
    expect(isRetryableFirebaseAiError(new Error("Network request failed"))).toBe(false);
  });

  it("retries the primary model, then switches to the documented fallback", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];

    const request = generateWithModelFallback("cloud", async (modelName) => {
      calls.push(modelName);
      if (modelName === PRIMARY_GEMINI_MODEL) {
        throw { customErrorData: { status: 500 } };
      }
      return "completed";
    });

    await vi.runAllTimersAsync();
    await expect(request).resolves.toEqual({
      result: "completed",
      modelName: FALLBACK_GEMINI_MODEL,
    });
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL, PRIMARY_GEMINI_MODEL, FALLBACK_GEMINI_MODEL]);
  });

  it("does not switch models for permanent errors or local-only requests", async () => {
    const cloudCalls: string[] = [];
    const notFound = new Error("Error fetching request: [404 Not Found]");
    await expect(
      generateWithModelFallback("cloud", async (modelName) => {
        cloudCalls.push(modelName);
        throw notFound;
      }),
    ).rejects.toBe(notFound);
    expect(cloudCalls).toEqual([PRIMARY_GEMINI_MODEL]);

    const localCalls: string[] = [];
    const localFailure = new Error("Error fetching request: [503 Service Unavailable]");
    await expect(
      generateWithModelFallback("local", async (modelName) => {
        localCalls.push(modelName);
        throw localFailure;
      }),
    ).rejects.toBe(localFailure);
    expect(localCalls).toEqual([PRIMARY_GEMINI_MODEL]);
  });
});
