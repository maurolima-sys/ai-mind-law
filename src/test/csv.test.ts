import { describe, expect, it } from "vitest";

import { complianceCsv } from "@/lib/services/csv";
import type { TranslationKey } from "@/lib/i18n/en";
import type { Requirement } from "@/lib/types";

// Minimal t() that returns the key — sufficient to test CSV escaping logic.
const t = (key: TranslationKey) => key;

describe("complianceCsv", () => {
  it("exports model-provided formula-like text as a literal value", () => {
    const t = (key: TranslationKey) => key;
    const requirements: Requirement[] = [
      {
        id: "r1",
        description: '=HYPERLINK("https://example.test","open")',
        category: "Legal",
        mandatory: true,
        confidence: 0.8,
        evidence: { page: 1, excerpt: "Formula-like source text", verified: true },
      },
    ];

    expect(complianceCsv(requirements, {}, t)).toContain(
      `"'=HYPERLINK(""https://example.test"",""open"")"`,
    );
  });
});
