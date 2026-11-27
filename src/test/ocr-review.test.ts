import { describe, expect, it } from "vitest";

import { markUnpaginatedEvidenceUnverified } from "@/lib/services/ocrEvidence";
import {
  MIN_SPARSE_RATIO,
  MIN_ADEQUATE_PAGE_CHARACTERS,
  classifyPageText,
  mergeOcrPageText,
  pagesAnalysedWithoutOcr,
  pagesWithInsufficientText,
  pagesNeedingExternalOcr,
  shouldOfferExternalOcr,
} from "@/lib/services/ocrNormalize";
import type { Analysis } from "@/lib/types";
import {
  scannedDemoCharacterCounts,
  utilityOfficeRfpCharacterCounts,
} from "@/test/fixtures/ocr-page-measurements";

function pageTextWithCharacterCount(count: number): string {
  const phrase =
    "The contractor shall provide required documentation and supporting evidence for review. ";
  const raw = phrase.repeat(Math.ceil(count / phrase.length)).slice(0, count);
  const trimmed = raw.trimEnd();
  return trimmed + (raw.length - trimmed.length > 0 ? "x" : "");
}

describe("external OCR review safeguards", () => {
  it("flags sparse pages without sending well-extracted documents to OCR", () => {
    const digitalPages = Array.from(
      { length: 56 },
      (_, index) =>
        `SECTION ${index + 1} SUBMITTAL REQUIREMENTS. `.repeat(20) +
        "The contractor shall provide complete documentation, references, qualifications, and a signed proposal form before the stated deadline. ".repeat(
          8,
        ),
    );

    expect(shouldOfferExternalOcr([])).toBe(true);
    expect(shouldOfferExternalOcr(["Only a short fragment."])).toBe(true);
    expect(pagesNeedingExternalOcr(digitalPages)).toEqual([]);

    // One sparse page out of 56 is ~1.8 % — below the MIN_SPARSE_RATIO threshold.
    // The flow should NOT trigger OCR for a single table-of-contents or cover page.
    digitalPages[16] = "";
    expect(pagesNeedingExternalOcr(digitalPages)).toEqual([]);

    // A single-page document that is sparse (< 12 words) exceeds the threshold (100 %).
    expect(shouldOfferExternalOcr(["A".repeat(120)])).toBe(true);

    // 4 empty pages out of 5 = 80 % sparse — above threshold.
    expect(shouldOfferExternalOcr(["A".repeat(80), "", "", "", ""])).toBe(true);
  });

  it("only triggers OCR when sparse pages meet or exceed MIN_SPARSE_RATIO", () => {
    const richPage = "SECTION SUBMITTAL REQUIREMENTS. ".repeat(60);
    const sparsePage = pageTextWithCharacterCount(MIN_ADEQUATE_PAGE_CHARACTERS - 1);

    // Exactly at threshold: 3 sparse out of 10 = 30 %.
    const atThreshold = Array.from({ length: 10 }, (_, i) => (i < 3 ? sparsePage : richPage));
    expect(pagesNeedingExternalOcr(atThreshold)).toEqual([1, 2, 3]);

    // Just below threshold: 2 sparse out of 10 = 20 %.
    const belowThreshold = Array.from({ length: 10 }, (_, i) => (i < 2 ? sparsePage : richPage));
    expect(pagesNeedingExternalOcr(belowThreshold)).toEqual([]);

    // Verify MIN_SPARSE_RATIO is the documented 0.3.
    expect(MIN_SPARSE_RATIO).toBe(0.3);
  });

  it("classifies the measured utility RFP without triggering full-document OCR", () => {
    const pages = utilityOfficeRfpCharacterCounts.map(pageTextWithCharacterCount);

    expect(utilityOfficeRfpCharacterCounts).toHaveLength(17);
    expect(pagesWithInsufficientText(pages)).toEqual([1, 3]);
    expect(pagesNeedingExternalOcr(pages)).toEqual([]);
    expect(classifyPageText("").kind).toBe("empty");
    expect(classifyPageText(pageTextWithCharacterCount(484)).kind).toBe("sparse");
    expect(classifyPageText(pageTextWithCharacterCount(4104)).kind).toBe("adequate");
    expect(classifyPageText(pageTextWithCharacterCount(1507)).kind).toBe("adequate");
  });

  it("keeps real scanned-demo PDFs eligible for OCR", () => {
    const pages = scannedDemoCharacterCounts.map(pageTextWithCharacterCount);

    expect(pagesWithInsufficientText(pages)).toEqual([1, 2, 3]);
    expect(pagesNeedingExternalOcr(pages)).toEqual([1, 2, 3]);
    expect(shouldOfferExternalOcr(pages)).toBe(true);
  });

  it("classifies immediately below, at, and above the measured-page threshold", () => {
    expect(MIN_ADEQUATE_PAGE_CHARACTERS).toBe(1500);
    expect(classifyPageText(pageTextWithCharacterCount(1499)).kind).toBe("sparse");
    expect(classifyPageText(pageTextWithCharacterCount(1500)).kind).toBe("adequate");
    expect(classifyPageText(pageTextWithCharacterCount(1501)).kind).toBe("adequate");
  });

  it("gives empty pages more OCR weight while retaining sparse-page warnings", () => {
    const adequate = pageTextWithCharacterCount(1500);
    const sparse = pageTextWithCharacterCount(1499);
    const below = ["", adequate, ...Array(8).fill(adequate)];
    const at = ["", sparse, ...Array(8).fill(adequate)];
    const above = ["", sparse, "", ...Array(7).fill(adequate)];

    expect(pagesWithInsufficientText(below)).toEqual([1]);
    expect(pagesAnalysedWithoutOcr(below, ["pdfjs", "pdfjs"])).toEqual([1]);
    expect(pagesAnalysedWithoutOcr(at, ["ocr", "pdfjs"])).toEqual([2]);
    expect(pagesNeedingExternalOcr(below)).toEqual([]);
    expect(pagesNeedingExternalOcr(at)).toEqual([1, 2]);
    expect(pagesNeedingExternalOcr(above)).toEqual([1, 2, 3]);
    expect(pagesNeedingExternalOcr(Array(10).fill(sparse))).toEqual(
      Array.from({ length: 10 }, (_, index) => index + 1),
    );
    expect(pagesNeedingExternalOcr(Array(10).fill(""))).toHaveLength(10);
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
