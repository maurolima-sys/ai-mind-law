import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DIAGNOSTIC_HISTORY_KEY,
  appendDiagnosticRecord,
  loadDiagnosticHistory,
  runFirebaseInferenceDiagnostic,
  type DiagnosticRecord,
} from "@/lib/services/aiDiagnostics";
import { answerDocumentQuestion } from "@/lib/services/documentQa";

vi.mock("@/lib/services/documentQa", () => ({
  answerDocumentQuestion: vi.fn(),
}));

vi.mock("@/lib/services/externalOcr", () => ({
  isExternalOcrAvailable: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/services/tourNarration.functions", () => ({
  checkTourNarrationAvailability: vi.fn().mockResolvedValue(true),
  synthesiseTourStep: vi.fn().mockResolvedValue({ audioBase64: "audio" }),
}));

vi.mock("@/lib/services/firebaseAi", () => ({
  getFirebaseAiHttpStatus: vi.fn((error: unknown) => {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
    ) {
      return error.status;
    }
    return undefined;
  }),
  isFirebaseConfigured: vi.fn(() => true),
  isInvalidFirebaseAppCheckTokenError: vi.fn(
    (error: unknown) =>
      error instanceof Error && error.message.includes("app check token is invalid"),
  ),
}));

function diagnostic(id: string): DiagnosticRecord {
  return {
    id,
    service: "firebase-ai",
    operation: "inference",
    outcome: "success",
    observedAt: "2026-11-18T00:00:00.000Z",
    latencyMs: 12,
    message: "Observed",
    mode: "local",
    source: "on-device",
    appCheck: "not-applicable",
  };
}

describe("AI diagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("records the actual Firebase inference source without storing the test payload", async () => {
    vi.mocked(answerDocumentQuestion).mockResolvedValue({
      answer: "30 days.",
      hypotheses: [],
      unresolvedQuestions: [],
      citations: [],
      researchSources: [],
      citedResearchSourceIds: [],
      engine: "Firebase AI Logic · on-device",
      inferenceSource: "ON_DEVICE",
    });

    const result = await runFirebaseInferenceDiagnostic("local");

    expect(result).toMatchObject({
      service: "firebase-ai",
      outcome: "success",
      mode: "local",
      source: "on-device",
      appCheck: "not-applicable",
    });
    expect(JSON.stringify(result)).not.toContain("Northbridge");
  });

  it("classifies an invalid App Check token as a rejected cloud call", async () => {
    vi.mocked(answerDocumentQuestion).mockRejectedValue(
      Object.assign(new Error("Firebase app check token is invalid"), { status: 401 }),
    );

    const result = await runFirebaseInferenceDiagnostic("cloud");

    expect(result).toMatchObject({
      outcome: "failure",
      mode: "cloud",
      appCheck: "rejected",
      httpStatus: 401,
    });
  });

  it("stores only a bounded local diagnostic history", () => {
    for (let index = 0; index < 24; index += 1) {
      appendDiagnosticRecord(diagnostic(`item-${index}`));
    }

    const history = loadDiagnosticHistory();
    expect(history).toHaveLength(20);
    expect(history[0]?.id).toBe("item-23");
    expect(history.at(-1)?.id).toBe("item-4");
    expect(localStorage.getItem(DIAGNOSTIC_HISTORY_KEY)).not.toContain("audioBase64");
  });
});
