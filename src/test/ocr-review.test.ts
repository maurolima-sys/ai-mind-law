import { describe, expect, it } from "vitest";

import { markUnpaginatedEvidenceUnverified } from "@/lib/services/ocrEvidence";
import {
  mergeOcrPageText,
  pagesNeedingExternalOcr,
  shouldOfferExternalOcr,
} from "@/lib/services/ocrNormalize";
import type { Analysis } from "@/lib/types";

describe("external OCR review safeguards", () => {
  it("flags sparse pages without sending well-extracted documents to OCR", () => {
    const digitalPages = Array.from(
      { length: 56 },
      (_, index) =>
        `SECTION ${index + 1} SUBMITTAL REQUIREMENTS. The contractor shall provide complete documentation, references, qualifications, and a signed proposal form before the stated deadline.`,
    );

    expect(shouldOfferExternalOcr([])).toBe(true);
    expect(shouldOfferExternalOcr(["Only a short fragment."])).toBe(true);
    expect(pagesNeedingExternalOcr(digitalPages)).toEqual([]);
    digitalPages[16] = "";
    expect(pagesNeedingExternalOcr(digitalPages)).toEqual([17]);
    expect(shouldOfferExternalOcr(["A".repeat(120)])).toBe(true);
    expect(shouldOfferExternalOcr(["A".repeat(80), "", "", "", ""])).toBe(true);
  });

  it("merges OCR only into its matching original page and keeps native text", () => {
    expect(
      mergeOcrPageText(["Native page 1", "", "Native page 3"], ["", "Scanned page 2"]),
    ).toEqual(["Native page 1", "Scanned page 2", "Native page 3"]);
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
