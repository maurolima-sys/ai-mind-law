import { describe, expect, it } from "vitest";
import { normalizeParseResult } from "@/lib/services/ocrNormalize";
import { runExternalOcr } from "@/lib/services/externalOcr";

describe("LlamaParse page normalization", () => {
  it("keeps provider page numbers, leaving gaps empty", () => {
    const r = normalizeParseResult({
      text: {
        pages: [
          { page_number: 1, text: "A" },
          { page_number: 3, text: "C" },
        ],
      },
    });
    expect(r).toEqual({ pages: ["A", "", "C"], paginated: true });
  });
  it("marks unpaginated text as unverified single page", () => {
    expect(normalizeParseResult({ markdown: "whole doc" })).toEqual({
      pages: ["whole doc"],
      paginated: false,
    });
  });
  it("returns no pages for empty results", () => {
    expect(normalizeParseResult({})).toEqual({ pages: [], paginated: false });
  });
});

describe("external OCR consent", () => {
  it("refuses to send without consent", async () => {
    await expect(runExternalOcr(new File(["%PDF-"], "a.pdf"), false, [2])).rejects.toThrow(
      /Allow external/,
    );
  });
});
