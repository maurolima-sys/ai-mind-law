import { beforeEach, describe, expect, it, vi } from "vitest";
import { InferenceSource } from "firebase/ai";

import { buildDemoDocument } from "@/data/sampleTender";
import { answerDocumentQuestion } from "@/lib/services/documentQa";
import { compareEvidenceToRequirement } from "@/lib/services/evidenceComparison";
import { analyzeTender, MAX_CHUNK_CHARACTERS } from "@/lib/services/tenderAnalysis";

const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@/lib/services/firebaseAi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/firebaseAi")>();
  return {
    ...actual,
    createTenderModel: () => ({ model: {} }),
    initializeDeviceModelWithTimeout: vi.fn().mockResolvedValue(undefined),
    generateWithModelFallback: mocks.generate,
  };
});

const analysisJson = JSON.stringify({
  summary: "Document summary",
  requirements: [],
  deadlines: [],
  specifications: [],
  risks: [],
  missing: [],
  inconsistencies: [],
});

function response(source: string | undefined, text: string) {
  return {
    result: { response: { inferenceSource: source, text: () => text } },
    modelName: "gemini-3.5-flash-lite",
  };
}

describe("inference source reporting per operation", () => {
  beforeEach(() => mocks.generate.mockReset());

  it("reports mixed analysis sources only when different sections actually report them", async () => {
    // One chunk: on-device fails (non-retryable) → cloud fallback succeeds → IN_CLOUD.
    // resolveProcessingSource with only IN_CLOUD and preference=hybrid → cloud-fallback, not hybrid.
    // Mixed sources (hybrid) require ON_DEVICE + IN_CLOUD across different sections;
    // that path is covered by resolveProcessingSource unit tests.
    mocks.generate
      .mockRejectedValueOnce(new Error("on-device failed"))
      .mockResolvedValueOnce(response(InferenceSource.IN_CLOUD, analysisJson));
    const onInference = vi.fn();
    const result = await analyzeTender(["text"], "hybrid", vi.fn(), onInference);
    expect(result.processingSource).toBe("cloud-fallback");
    expect(onInference).toHaveBeenCalledWith("IN_CLOUD");
  });

  it("reports a cloud response even if its structured output is rejected", async () => {
    mocks.generate.mockResolvedValue(response(InferenceSource.IN_CLOUD, "invalid JSON"));
    const onInference = vi.fn();
    await expect(analyzeTender(["text"], "cloud", vi.fn(), onInference)).rejects.toThrow();
    expect(onInference).toHaveBeenCalledWith("IN_CLOUD");
  });

  it("does not report a response with an absent or unknown SDK source", async () => {
    for (const source of [undefined, "OTHER"]) {
      mocks.generate.mockResolvedValue(response(source, analysisJson));
      const onInference = vi.fn();
      await expect(analyzeTender(["text"], "cloud", vi.fn(), onInference)).rejects.toThrow(
        "without reporting its inference source",
      );
      expect(onInference).not.toHaveBeenCalled();
    }
  });

  it("keeps the source of each document answer and evidence comparison", async () => {
    mocks.generate.mockResolvedValueOnce(
      response(InferenceSource.ON_DEVICE, JSON.stringify({ answer: "Answer" })),
    );
    const onAnswer = vi.fn();
    const answer = await answerDocumentQuestion("What is required?", ["Document text"], "local", {
      onInference: onAnswer,
    });
    expect(answer.inferenceSource).toBe("ON_DEVICE");
    expect(onAnswer).toHaveBeenCalledWith("ON_DEVICE");

    mocks.generate.mockResolvedValueOnce(
      response(
        InferenceSource.IN_CLOUD,
        JSON.stringify({
          assessment: "insufficient",
          confidence: 0.5,
          explanation: "Not enough evidence.",
          sourceIndex: 1,
          excerpt: "Document text",
        }),
      ),
    );
    const requirement = buildDemoDocument().analysis?.requirements[0];
    if (!requirement) throw new Error("Demo requirement is missing");
    const onComparison = vi.fn();
    const match = await compareEvidenceToRequirement(requirement, ["Document text"], {
      format: "pdf",
      sourceLocations: ["Page 1"],
      preference: "hybrid",
      onInference: onComparison,
    });
    expect(match.processingSource).toBe("cloud-fallback");
    expect(onComparison).toHaveBeenCalledWith("IN_CLOUD");
  });
});
