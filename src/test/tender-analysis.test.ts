import { afterEach, describe, expect, it, vi } from "vitest";

import {
  chunkTenderText,
  parseTenderResponse,
  requireInferenceSource,
  resolveProcessingSource,
  type InferenceSource,
} from "@/lib/services/tenderAnalysis";
import { InferenceSource as FirebaseInferenceSource } from "firebase/ai";
import {
  DEVICE_MODEL_INIT_TIMEOUT_MS,
  initializeDeviceModelWithTimeout,
} from "@/lib/services/firebaseAi";
import { analysisProcessingSource, hasCloudResponse } from "@/lib/services/inferenceSource";
import { buildDemoDocument } from "@/data/sampleTender";

describe("parseTenderResponse", () => {
  it("accepts a complete JSON response wrapped in a code fence", () => {
    const response = {
      summary: "One tender requirement was identified.",
      requirements: [],
      deadlines: [],
      specifications: [],
      risks: [],
      missing: [],
      inconsistencies: [],
    };

    expect(parseTenderResponse(`\`\`\`json\n${JSON.stringify(response)}\n\`\`\``)).toEqual(
      response,
    );
  });

  it("surfaces malformed or incomplete model output", () => {
    expect(() => parseTenderResponse("not JSON")).toThrow(
      "The AI response could not be parsed as structured analysis",
    );
    expect(() => parseTenderResponse('{"summary":"incomplete"}')).toThrow(
      "The AI response did not match the required analysis format",
    );
  });

  it("reports the path of a nested field that violates the response schema", () => {
    const response = {
      summary: "One tender requirement was identified.",
      requirements: [
        {
          description: "Submit a signed declaration.",
          category: "Administrative",
          mandatory: true,
          confidence: 0.85,
          sourceIndex: 1,
          excerpt: null,
        },
      ],
      deadlines: [],
      specifications: [],
      risks: [],
      missing: [],
      inconsistencies: [],
    };

    expect(() => parseTenderResponse(JSON.stringify(response))).toThrow(
      "requirements[0].excerpt: Expected string, received null",
    );
  });

  it("normalizes null specification notes while preserving nullable quantities", () => {
    const response = {
      summary: "One specification was identified.",
      requirements: [],
      deadlines: [],
      specifications: [
        {
          item: "Safety helmet",
          quantity: null,
          unit: null,
          details: "Comply with the listed safety standard.",
          notes: null,
          sourceIndex: 1,
          excerpt: "Safety helmet complying with the listed standard",
        },
      ],
      risks: [],
      missing: [],
      inconsistencies: [],
    };

    expect(parseTenderResponse(JSON.stringify(response)).specifications[0]).toMatchObject({
      quantity: null,
      unit: null,
      notes: "",
    });
  });

  it("normalizes numeric strings and numeric quantities to the public analysis types", () => {
    const response = {
      summary: "One requirement and specification were identified.",
      requirements: [
        {
          description: "Submit three reports.",
          category: "Documentation",
          mandatory: true,
          confidence: "0.85",
          sourceIndex: 1,
          excerpt: "Submit three reports.",
        },
      ],
      deadlines: [],
      specifications: [
        {
          item: "Reports",
          quantity: 3,
          unit: 1,
          details: "Submit reports.",
          notes: "",
          sourceIndex: 1,
          excerpt: "Submit three reports.",
        },
      ],
      risks: [],
      missing: [],
      inconsistencies: [],
    };

    const parsed = parseTenderResponse(JSON.stringify(response));
    expect(parsed.requirements[0]?.confidence).toBe(0.85);
    expect(parsed.specifications[0]).toMatchObject({ quantity: "3", unit: "1" });
  });

  it("keeps local-sized text chunks within the configured limit without losing source text", () => {
    const chunks = chunkTenderText(["abcdefghij"], ["Page 4"], 4);

    expect(chunks.flatMap((chunk) => chunk.pages.map((page) => page.text)).join("")).toBe(
      "abcdefghij",
    );
    expect(
      chunks.every((chunk) => chunk.pages.reduce((size, page) => size + page.text.length, 0) <= 4),
    ).toBe(true);
    expect(chunks.flatMap((chunk) => chunk.pages.map((page) => page.sourceIndex))).toEqual([
      1, 1, 1,
    ]);
  });
});

describe("resolveProcessingSource", () => {
  const sourceSet = (...sources: InferenceSource[]) => new Set(sources);

  it("reports direct cloud inference separately from cloud fallback", () => {
    expect(resolveProcessingSource(sourceSet("IN_CLOUD"), "cloud")).toBe("cloud");
    expect(resolveProcessingSource(sourceSet("IN_CLOUD"), "hybrid")).toBe("cloud-fallback");
  });

  it("reports on-device and mixed-source analyses from Firebase's response sources", () => {
    expect(resolveProcessingSource(sourceSet("ON_DEVICE"), "hybrid")).toBe("on-device");
    expect(resolveProcessingSource(sourceSet("ON_DEVICE", "IN_CLOUD"), "hybrid")).toBe("hybrid");
  });

  it("rejects an empty source set instead of inventing cloud inference", () => {
    expect(() => resolveProcessingSource(sourceSet(), "cloud")).toThrow(
      "Firebase AI Logic did not report an inference source.",
    );
  });
});

describe("inference reporting", () => {
  it("only records a cloud response when IN_CLOUD was reported", () => {
    expect(hasCloudResponse(false, "ON_DEVICE")).toBe(false);
    expect(hasCloudResponse(false, "IN_CLOUD")).toBe(true);
    expect(hasCloudResponse(true, "ON_DEVICE")).toBe(true);
  });

  it("does not infer legacy sources from their selected modes", () => {
    const sample = buildDemoDocument().analysis;
    if (!sample) throw new Error("Demo analysis is missing");
    expect(analysisProcessingSource({ ...sample, mode: "local" })).toBeUndefined();
    expect(analysisProcessingSource({ ...sample, mode: "cloud" })).toBeUndefined();
    expect(analysisProcessingSource({ ...sample, mode: "hybrid" })).toBeUndefined();
    expect(analysisProcessingSource(sample)).toBe("demo");
    expect(
      analysisProcessingSource({ ...sample, mode: "local", processingSource: "on-device" }),
    ).toBe("on-device");
  });
});

describe("requireInferenceSource", () => {
  it("normalizes the Firebase SDK's source values for analysis reporting", () => {
    expect(requireInferenceSource(FirebaseInferenceSource.ON_DEVICE)).toBe("ON_DEVICE");
    expect(requireInferenceSource(FirebaseInferenceSource.IN_CLOUD)).toBe("IN_CLOUD");
    expect(() => requireInferenceSource(undefined)).toThrow(
      "Firebase AI Logic returned a result without reporting its inference source.",
    );
  });
});

describe("on-device model initialization timeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects when device-model initialization never settles", async () => {
    vi.useFakeTimers();
    const initialization = initializeDeviceModelWithTimeout(
      () => new Promise<void>(() => {}),
      () => {},
    );
    const rejection = expect(initialization).rejects.toThrow(
      "On-device model initialisation timed out after 60 seconds.",
    );

    await vi.advanceTimersByTimeAsync(DEVICE_MODEL_INIT_TIMEOUT_MS);
    await rejection;
  });

  it("keeps initialization alive while the SDK reports model-download progress", async () => {
    vi.useFakeTimers();
    let reportProgress: ((progress: number) => void) | undefined;
    const initialization = initializeDeviceModelWithTimeout(
      (onProgress) => {
        reportProgress = onProgress;
        return new Promise<void>(() => {});
      },
      () => {},
    );
    const rejection = expect(initialization).rejects.toThrow(
      `On-device model initialisation timed out after ${DEVICE_MODEL_INIT_TIMEOUT_MS / 1000} seconds.`,
    );

    await vi.advanceTimersByTimeAsync(DEVICE_MODEL_INIT_TIMEOUT_MS - 1_000);
    reportProgress?.(0.5);
    await vi.advanceTimersByTimeAsync(DEVICE_MODEL_INIT_TIMEOUT_MS - 1_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await rejection;
  });
});
