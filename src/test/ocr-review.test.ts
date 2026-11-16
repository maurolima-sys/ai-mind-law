import { describe, expect, it } from "vitest";

import { markUnpaginatedEvidenceUnverified } from "@/lib/services/ocrEvidence";
import { shouldOfferExternalOcr } from "@/lib/services/ocrNormalize";
import type { Analysis } from "@/lib/types";

describe("external OCR review safeguards", () => {
  it("offers external OCR for missing or very sparse selectable text", () => {
    expect(shouldOfferExternalOcr([])).toBe(true);
    expect(shouldOfferExternalOcr(["Only a short fragment."])).toBe(true);
    expect(shouldOfferExternalOcr(["A".repeat(120)])).toBe(false);
    expect(shouldOfferExternalOcr(["A".repeat(80), "", "", "", ""])).toBe(true);
  });

  it("removes unconfirmed page citations and flags every finding for review", () => {
    const analysis: Analysis = {
      mode: "local",
      processingSource: "on-device",
      engine: "test",
      summary: "Test",
      requirements: [
        {
          id: "r1",
          description: "Requirement",
          category: "Legal",
          mandatory: true,
          confidence: 0.9,
          evidence: { page: 1, excerpt: "quoted text", verified: true },
        },
      ],
      deadlines: [
        {
          id: "d1",
          description: "Deadline",
          date: null,
          relatedRequirement: null,
          evidence: { page: 1, excerpt: "quoted text", verified: true },
        },
      ],
      specifications: [
        {
          id: "s1",
          item: "Item",
          quantity: null,
          unit: null,
          details: "Details",
          notes: "",
          evidence: { page: 1, excerpt: "quoted text", verified: true },
        },
      ],
      risks: [
        {
          id: "k1",
          title: "Risk",
          severity: "Low",
          kind: "suggestion",
          explanation: "Explanation",
          evidence: { page: 1, excerpt: "quoted text", verified: true },
        },
      ],
      missing: [],
      inconsistencies: [],
      generatedAt: "2026-01-01T00:00:00.000Z",
    };

    const result = markUnpaginatedEvidenceUnverified(analysis);
    const evidence = [
      ...result.requirements.map((requirement) => requirement.evidence),
      ...result.deadlines.map((deadline) => deadline.evidence),
      ...result.specifications.map((specification) => specification.evidence),
      ...result.risks.map((risk) => risk.evidence),
    ];

    expect(evidence).toHaveLength(4);
    for (const item of evidence) {
      expect(item).toEqual({ page: null, excerpt: "quoted text", verified: false });
    }
    expect(result.requirements[0]?.confidence).toBe(0.3);
  });
});
