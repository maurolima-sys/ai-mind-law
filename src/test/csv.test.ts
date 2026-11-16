import { describe, expect, it } from "vitest";

import { complianceCsv } from "@/lib/services/csv";
import type { Requirement } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n/en";

// Minimal t() that returns the key — sufficient to test CSV escaping logic.
const t = (key: TranslationKey) => key;

describe("complianceCsv", () => {
  it("exports model-provided formula-like text as a literal value", () => {
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
