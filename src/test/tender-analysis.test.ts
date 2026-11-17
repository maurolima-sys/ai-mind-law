import { describe, expect, it } from "vitest";

import {
  parseTenderResponse,
  requireInferenceSource,
  resolveProcessingSource,
  type InferenceSource,
} from "@/lib/services/tenderAnalysis";
import { InferenceSource as FirebaseInferenceSource } from "firebase/ai";

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
          page: 1,
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
          page: 1,
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
