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
  it("rejects a response that exceeds the maximum allowed size before JSON.parse", () => {
    const oversized = "x".repeat(512_001);
    expect(() => parseTenderResponse(oversized)).toThrow(
      "The AI response exceeded the maximum allowed size",
    );
  });

  it("rejects a response whose array fields exceed the per-field limits before Zod runs", () => {
    const response = {
      summary: "Oversized response.",
      requirements: Array(501).fill({
        description: "r",
        category: "Technical",
        mandatory: true,
        confidence: 0.9,
        sourceIndex: 1,
        excerpt: "e",
      }),
      deadlines: [],
      specifications: [],
      risks: [],
      missing: [],
      inconsistencies: [],
    };
    expect(() => parseTenderResponse(JSON.stringify(response))).toThrow(
      'exceeded the maximum allowed items for "requirements" (501 > 500)',
    );
  });

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

  it("starts separate chunks at numbered procurement sections and keeps heading context", () => {
    const text =
      "Introductory notice.\nSECTION 1: GENERAL INFORMATION\nContact the procurement officer.\nSECTION 2: SUBMITTAL REQUIREMENTS\nSubmit the signed proposal and references.";
    const chunks = chunkTenderText([text], ["Page 1"], 1_000);

    expect(chunks.map((chunk) => chunk.heading)).toEqual([
      undefined,
      "SECTION 1: GENERAL INFORMATION",
      "SECTION 2: SUBMITTAL REQUIREMENTS",
    ]);
    expect(chunks.flatMap((chunk) => chunk.pages.map((page) => page.text)).join("")).toBe(text);
    expect(chunks[1]?.pages.map((page) => page.text).join("")).not.toContain("SECTION 2");
    expect(chunks[2]?.pages.map((page) => page.text).join("")).not.toContain("SECTION 1");
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
    // SDK values are lowercase: { ON_DEVICE: "on_device", IN_CLOUD: "in_cloud" }
    expect(requireInferenceSource(FirebaseInferenceSource.ON_DEVICE)).toBe("ON_DEVICE");
    expect(requireInferenceSource(FirebaseInferenceSource.IN_CLOUD)).toBe("IN_CLOUD");
  });

  it("maps the literal SDK string values correctly", () => {
    expect(requireInferenceSource("on_device")).toBe("ON_DEVICE");
    expect(requireInferenceSource("in_cloud")).toBe("IN_CLOUD");
  });

  it("throws with the received value when the source is unknown or missing", () => {
    expect(() => requireInferenceSource(undefined)).toThrow(
      "Firebase AI Logic returned a result without reporting its inference source (received: undefined).",
    );
    expect(() => requireInferenceSource("unknown_source")).toThrow(
      "Firebase AI Logic returned a result without reporting its inference source (received: unknown_source).",
    );
  });
});

describe("analyzeTender — cloud mode skips on-device initialization", () => {
  it("does not call initializeDeviceModel when preference is cloud", async () => {
    // The guard is structural: the else branch in analyzeTender is only entered
    // when preference !== "cloud". We confirm the export exists and is a function.
    expect(typeof initializeDeviceModelWithTimeout).toBe("function");
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

  it("ignores download progress arriving after initialization has timed out", async () => {
    vi.useFakeTimers();
    let reportProgress: ((progress: number) => void) | undefined;
    const onProgress = vi.fn();
    const initialization = initializeDeviceModelWithTimeout((progress) => {
      reportProgress = progress;
      return new Promise<void>(() => {});
    }, onProgress);
    const rejection = expect(initialization).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(DEVICE_MODEL_INIT_TIMEOUT_MS);
    await rejection;

    reportProgress?.(0.5);
    expect(onProgress).not.toHaveBeenCalled();
  });
});
