import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FALLBACK_GEMINI_MODEL,
  GEMINI_MODEL_FALLBACK_CHAIN,
  generateWithModelFallback,
  getFirebaseAiHttpStatus,
  isRetryableFirebaseAiError,
  PRIMARY_GEMINI_MODEL,
  SECONDARY_GEMINI_MODEL,
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

  it("retries the primary model, then walks the documented fallback chain", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];

    const request = generateWithModelFallback("cloud", async (modelName) => {
      calls.push(modelName);
      if (modelName !== FALLBACK_GEMINI_MODEL) {
        throw { customErrorData: { status: 500 } };
      }
      return "completed";
    });

    await vi.runAllTimersAsync();
    await expect(request).resolves.toEqual({
      result: "completed",
      modelName: FALLBACK_GEMINI_MODEL,
    });
    expect(calls).toEqual([
      PRIMARY_GEMINI_MODEL,
      PRIMARY_GEMINI_MODEL,
      SECONDARY_GEMINI_MODEL,
      FALLBACK_GEMINI_MODEL,
    ]);
    expect([...new Set(calls)]).toEqual([...GEMINI_MODEL_FALLBACK_CHAIN]);
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

  it("advances to the next model after a request timeout", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const retryUpdates: Array<{ modelName: string; status?: number }> = [];

    const request = generateWithModelFallback(
      "cloud",
      (modelName, signal) => {
        calls.push(modelName);
        if (calls.length > 2) return Promise.resolve("completed");
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            const error = Object.assign(new Error("aborted"), { name: "AbortError" });
            reject(error);
          });
        });
      },
      { onRetry: ({ modelName, status }) => retryUpdates.push({ modelName, status }) },
    );

    await vi.runAllTimersAsync();
    await expect(request).resolves.toEqual({
      result: "completed",
      modelName: SECONDARY_GEMINI_MODEL,
    });
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL, PRIMARY_GEMINI_MODEL, SECONDARY_GEMINI_MODEL]);
    expect(retryUpdates).toEqual([
      { modelName: PRIMARY_GEMINI_MODEL, status: undefined },
      { modelName: SECONDARY_GEMINI_MODEL, status: undefined },
    ]);
  });
});
