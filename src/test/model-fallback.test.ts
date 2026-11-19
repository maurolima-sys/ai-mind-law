import { describe, expect, it, vi } from "vitest";

import {
  GEMINI_MODEL_FALLBACK_CHAIN,
  generateWithModelFallback,
  getOnDeviceTimeoutStage,
  getFirebaseAiHttpStatus,
  isInvalidFirebaseAppCheckTokenError,
  isRetryableFirebaseAiError,
  ON_DEVICE_GENERATION_TIMEOUT_MS,
  PRIMARY_GEMINI_MODEL,
  SECONDARY_GEMINI_MODEL,
  TERTIARY_GEMINI_MODEL,
} from "@/lib/services/firebaseAi";

describe("Firebase AI retry policy", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("extracts Firebase SDK status metadata and retries only transient statuses", () => {
    expect(getFirebaseAiHttpStatus({ customErrorData: { status: 500 } })).toBe(500);
    expect(getFirebaseAiHttpStatus(new Error("Error fetching request: [502 Bad Gateway]"))).toBe(
      502,
    );
    expect(isRetryableFirebaseAiError({ customErrorData: { status: 503 } })).toBe(true);
    expect(isRetryableFirebaseAiError({ customErrorData: { status: 403 } })).toBe(false);
    expect(isRetryableFirebaseAiError(new Error("Network request failed"))).toBe(false);
  });

  it("recognizes invalid App Check tokens without classifying unrelated 401s", () => {
    expect(
      isInvalidFirebaseAppCheckTokenError(
        new Error("[401] Firebase App Check token is invalid (AI/fetch-error)"),
      ),
    ).toBe(true);
    expect(
      isInvalidFirebaseAppCheckTokenError({
        cause: new Error("firebase app check token is invalid"),
      }),
    ).toBe(true);
    expect(isInvalidFirebaseAppCheckTokenError(new Error("[401] Unauthorized"))).toBe(false);
  });

  it("walks the documented fallback chain after retryable failures", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    expect(GEMINI_MODEL_FALLBACK_CHAIN).toEqual([
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
    ]);

    const request = generateWithModelFallback("cloud", async (modelName) => {
      calls.push(modelName);
      if (modelName !== TERTIARY_GEMINI_MODEL) {
        throw { customErrorData: { status: 500 } };
      }
      return "completed";
    });

    await vi.runAllTimersAsync();
    await expect(request).resolves.toEqual({
      result: "completed",
      modelName: TERTIARY_GEMINI_MODEL,
    });
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL, SECONDARY_GEMINI_MODEL, TERTIARY_GEMINI_MODEL]);
    expect([...new Set(calls)]).toEqual([...GEMINI_MODEL_FALLBACK_CHAIN]);
  });

  it("starts with the most capable model (gemini-3.8-flash) and degrades on failure", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const request = generateWithModelFallback("cloud", async (modelName) => {
      calls.push(modelName);
      if (calls.length === 1) throw { customErrorData: { status: 503 } };
      return "ok";
    });
    await vi.runAllTimersAsync();
    await expect(request).resolves.toMatchObject({ modelName: SECONDARY_GEMINI_MODEL });
    expect(calls[0]).toBe("gemini-3.8-flash");
    expect(calls[1]).toBe("gemini-3.5-flash");
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

  it("applies a timeout to local-only requests and rejects on expiry", async () => {
    vi.useFakeTimers();
    const request = generateWithModelFallback(
      "local",
      (_modelName, signal) =>
        new Promise((_, reject) => {
          signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const rejection = expect(request).rejects.toThrow(/timed out/);
    await vi.runAllTimersAsync();
    await rejection;
  });

  it("rejects local-only requests that ignore the abort signal", async () => {
    vi.useFakeTimers();
    const request = generateWithModelFallback("local", () => new Promise(() => {}));
    const errorResult = request.catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(ON_DEVICE_GENERATION_TIMEOUT_MS);
    const error = await errorResult;

    expect(getOnDeviceTimeoutStage(error)).toBe("generation");
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain(
        `On-device inference timed out after ${ON_DEVICE_GENERATION_TIMEOUT_MS / 1000} seconds.`,
      );
    }
  });

  it("does not fall back to cloud when local times out", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const request = generateWithModelFallback("local", (modelName, signal) => {
      calls.push(modelName);
      return new Promise((_, reject) => {
        signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });
    const rejection = expect(request).rejects.toThrow();
    await vi.runAllTimersAsync();
    await rejection;
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL]);
  });

  it("keeps advancing after request timeouts within the total budget", async () => {
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
      {
        onRetry: ({ modelName, status }) =>
          retryUpdates.push({ modelName, ...(status === undefined ? {} : { status }) }),
      },
    );

    await vi.runAllTimersAsync();
    await expect(request).resolves.toEqual({
      result: "completed",
      modelName: TERTIARY_GEMINI_MODEL,
    });
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL, SECONDARY_GEMINI_MODEL, TERTIARY_GEMINI_MODEL]);
    expect(retryUpdates).toEqual([
      { modelName: SECONDARY_GEMINI_MODEL, status: undefined },
      { modelName: TERTIARY_GEMINI_MODEL, status: undefined },
    ]);
  });
});
