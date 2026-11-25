import { describe, expect, it, vi } from "vitest";

import {
  GEMINI_MODEL_FALLBACK_CHAIN,
  generateWithModelFallback,
  getOnDeviceTimeoutStage,
  getFirebaseAiHttpStatus,
  isInvalidFirebaseAppCheckTokenError,
  isRetryableFirebaseAiError,
  geminiModelLabel,
  isDailyQuotaExhaustedError,
  isDailyQuotaExhaustedSession,
  markDailyQuotaExhausted,
  resetDailyQuotaExhaustedSession,
  ON_DEVICE_GENERATION_TIMEOUT_MS,
  PRIMARY_GEMINI_MODEL,
  SECONDARY_GEMINI_MODEL,
  TERTIARY_GEMINI_MODEL,
} from "@/lib/services/firebaseAi";

describe("Firebase AI retry policy", () => {
  afterEach(() => {
    vi.useRealTimers();
    resetDailyQuotaExhaustedSession();
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

  it("labels each chain model with its real version", () => {
    expect(geminiModelLabel(PRIMARY_GEMINI_MODEL)).toBe("Gemini 3.8 Flash");
    expect(geminiModelLabel(SECONDARY_GEMINI_MODEL)).toBe("Gemini 3.6 Flash");
    expect(geminiModelLabel(TERTIARY_GEMINI_MODEL)).toBe("Gemini 3.5 Flash-Lite");
  });

  it("walks the documented fallback chain after retryable failures", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    expect(GEMINI_MODEL_FALLBACK_CHAIN).toEqual([
      "gemini-3.8-flash",
      "gemini-3.6-flash",
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
    // One bounded attempt per model.
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL, SECONDARY_GEMINI_MODEL, TERTIARY_GEMINI_MODEL]);
    expect([...new Set(calls)]).toEqual([...GEMINI_MODEL_FALLBACK_CHAIN]);
  });

  it("starts with Gemini 3.8 Flash and switches models after a retryable failure", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const request = generateWithModelFallback("cloud", async (modelName) => {
      calls.push(modelName);
      if (calls.length === 1) throw { customErrorData: { status: 429 } };
      return "ok";
    });
    await vi.runAllTimersAsync();
    // The next model is used directly; the primary is not repeated.
    await expect(request).resolves.toMatchObject({ modelName: SECONDARY_GEMINI_MODEL });
    expect(calls[0]).toBe("gemini-3.8-flash");
    expect(calls[1]).toBe("gemini-3.6-flash");
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

  // ─── Ordem #5: daily quota circuit breaker ─────────────────────────────────
  // Fixture built from the real 429 body captured on 2026-11-25 (free-tier
  // daily quota, gemini-3.8-flash, limit 20), shaped the way @firebase/ai@3.1.0
  // makeRequest() constructs the AIError (message + customErrorData.status).

  const realDailyQuotaMessage =
    "Error fetching from https://firebasevertexai.googleapis.com/: [429 Too Many Requests] " +
    "You exceeded your current quota, please check your plan and billing details. " +
    "Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, " +
    "limit: 20, model: gemini-3.8-flash, description: Generate content requests per day limit " +
    "exceeded on Free Tier. Please retry in 16h59m52.655870729s.";

  function dailyQuotaErrorFixture(): Error {
    return Object.assign(new Error(realDailyQuotaMessage), {
      customErrorData: { status: 429, statusText: "", errorDetails: [] },
    });
  }

  it("identifies a daily quota 429 as non-retryable from the real captured body", () => {
    const dailyQuotaError = dailyQuotaErrorFixture();
    expect(isDailyQuotaExhaustedError(dailyQuotaError)).toBe(true);
    // Daily quota is not a transient error — never retried.
    expect(isRetryableFirebaseAiError(dailyQuotaError)).toBe(false);

    // A plain rate-limit 429 without a daily signal stays retryable.
    const rateLimitError = Object.assign(new Error("[429 Too Many Requests] rate limit exceeded"), {
      customErrorData: { status: 429 },
    });
    expect(isDailyQuotaExhaustedError(rateLimitError)).toBe(false);
    expect(isRetryableFirebaseAiError(rateLimitError)).toBe(true);
  });

  it("classifies conservatively: short RetryInfo or ambiguous 429s are per-minute", () => {
    // Short "retry in" duration — under 5 minutes — is a per-minute limit.
    const shortRetry = Object.assign(
      new Error("[429 Too Many Requests] rate limit exceeded. Please retry in 2m7s."),
      { customErrorData: { status: 429 } },
    );
    expect(isDailyQuotaExhaustedError(shortRetry)).toBe(false);
    expect(isRetryableFirebaseAiError(shortRetry)).toBe(true);

    // QuotaFailure structured details without a PerDay quota id — not daily.
    const minuteQuotaDetails = Object.assign(new Error("[429] quota exceeded"), {
      customErrorData: {
        status: 429,
        errorDetails: [
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [{ quota_id: "GenerateRequestsPerMinutePerProjectPerModel" }],
          },
        ],
      },
    });
    expect(isDailyQuotaExhaustedError(minuteQuotaDetails)).toBe(false);

    // PerDay quota id in structured details — daily, even without free text.
    const dayQuotaDetails = Object.assign(new Error("[429] quota exceeded"), {
      customErrorData: {
        status: 429,
        errorDetails: [
          {
            "@type": "type.googleapis.com/google.rpc.QuotaFailure",
            violations: [{ quota_id: "GenerateRequestsPerDayPerProjectPerModel" }],
          },
        ],
      },
    });
    expect(isDailyQuotaExhaustedError(dayQuotaDetails)).toBe(true);
    expect(isRetryableFirebaseAiError(dayQuotaDetails)).toBe(false);
  });

  it("advances to the next model immediately (no backoff) when the primary hits the daily quota, and marks it for the session", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const quotaUpdates: Array<{
      quotaExhausted?: string;
      quotaSkip?: boolean;
      modelName: string;
    }> = [];

    const request = generateWithModelFallback(
      "cloud",
      async (modelName) => {
        calls.push(modelName);
        if (modelName === PRIMARY_GEMINI_MODEL) throw dailyQuotaErrorFixture();
        return "completed";
      },
      {
        onRetry: ({ modelName, quotaExhausted, quotaSkip }) =>
          quotaUpdates.push({
            modelName,
            ...(quotaExhausted !== undefined ? { quotaExhausted } : {}),
            ...(quotaSkip !== undefined ? { quotaSkip } : {}),
          }),
      },
    );

    // No 3-second backoff: the secondary is attempted without waiting.
    await vi.advanceTimersByTimeAsync(0);
    await expect(request).resolves.toEqual({
      result: "completed",
      modelName: SECONDARY_GEMINI_MODEL,
    });
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL, SECONDARY_GEMINI_MODEL]);
    expect(quotaUpdates).toEqual([
      { modelName: SECONDARY_GEMINI_MODEL, quotaExhausted: PRIMARY_GEMINI_MODEL },
    ]);
    expect(isDailyQuotaExhaustedSession()).toBe(false);
  });

  it("skips a marked model without a request on the next call and expires the mark", async () => {
    vi.useFakeTimers();
    const dailyQuotaError = dailyQuotaErrorFixture();
    const firstCalls: string[] = [];
    await generateWithModelFallback("cloud", async (modelName) => {
      firstCalls.push(modelName);
      // Only the primary hits the daily quota; the secondary serves the call.
      if (modelName === PRIMARY_GEMINI_MODEL) throw dailyQuotaError;
      return "ok";
    });

    // Second analysis in the same session: primary is skipped with no request,
    // the chain starts at the secondary immediately.
    const secondCalls: string[] = [];
    const secondEvents: Array<{ quotaExhausted?: string; quotaSkip?: boolean }> = [];
    await generateWithModelFallback(
      "cloud",
      async (modelName) => {
        secondCalls.push(modelName);
        return "ok";
      },
      {
        onRetry: ({ quotaExhausted, quotaSkip }) =>
          secondEvents.push({
            ...(quotaExhausted !== undefined ? { quotaExhausted } : {}),
            ...(quotaSkip !== undefined ? { quotaSkip } : {}),
          }),
      },
    ).then(() => undefined);

    expect(secondCalls).toEqual([SECONDARY_GEMINI_MODEL]);
    expect(secondEvents).toEqual([{ quotaExhausted: PRIMARY_GEMINI_MODEL, quotaSkip: true }]);

    // After the mark expires, the primary is attempted again.
    resetDailyQuotaExhaustedSession();
    markDailyQuotaExhausted(PRIMARY_GEMINI_MODEL, 1_000);
    await vi.advanceTimersByTimeAsync(1_001);
    const thirdCalls: string[] = [];
    await generateWithModelFallback("cloud", async (modelName) => {
      thirdCalls.push(modelName);
      return "ok";
    });
    expect(thirdCalls).toEqual([PRIMARY_GEMINI_MODEL]);
  });

  it("gives the primary one fresh attempt when every model is marked, then reports the quota to the user", async () => {
    vi.useFakeTimers();
    for (const model of GEMINI_MODEL_FALLBACK_CHAIN) {
      markDailyQuotaExhausted(model, 60_000);
    }
    expect(isDailyQuotaExhaustedSession()).toBe(true);

    // All marked → the primary is tried once anyway.
    const calls: string[] = [];
    const request = generateWithModelFallback("cloud", async (modelName) => {
      calls.push(modelName);
      return "recovered";
    });
    await vi.runAllTimersAsync();
    await expect(request).resolves.toEqual({
      result: "recovered",
      modelName: PRIMARY_GEMINI_MODEL,
    });
    expect(calls).toEqual([PRIMARY_GEMINI_MODEL]);

    // All marked and the primary also fails with the daily 429 → one attempt
    // only, and a user-facing quota message (no chain walk, no raw body).
    resetDailyQuotaExhaustedSession();
    for (const model of GEMINI_MODEL_FALLBACK_CHAIN) {
      markDailyQuotaExhausted(model, 60_000);
    }
    const failingCalls: string[] = [];
    const failure = await generateWithModelFallback("cloud", async (modelName) => {
      failingCalls.push(modelName);
      throw dailyQuotaErrorFixture();
    }).catch((e: unknown) => e as Error);
    expect(failingCalls).toEqual([PRIMARY_GEMINI_MODEL]);
    expect((failure as Error).message).toMatch(/daily quota/i);
    expect((failure as Error).message).not.toMatch(/AIza|token/);
  });

  it("keeps chain order and per-attempt timeouts unchanged for transient failures", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const retryDelays: number[] = [];
    let lastCallTime = 0;
    const request = generateWithModelFallback("cloud", async (modelName) => {
      const now = Date.now();
      if (lastCallTime) retryDelays.push(now - lastCallTime);
      lastCallTime = now;
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
    // Chain order unchanged and the documented backoff (3s–4s) still applied.
    expect(calls).toEqual([...GEMINI_MODEL_FALLBACK_CHAIN]);
    expect(retryDelays[1]).toBeGreaterThanOrEqual(3_000);
    // The 401 App Check token is still treated as transient (unrelated change is forbidden).
    expect(isRetryableFirebaseAiError({ customErrorData: { status: 401 } })).toBe(true);
  });
});
