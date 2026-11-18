import { describe, expect, it } from "vitest";

import { complianceCsv, risksCsv } from "@/lib/services/csv";
import type { TranslationKey } from "@/lib/i18n/en";
import type { Requirement, Risk } from "@/lib/types";

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

  describe("risksCsv", () => {
    it("exports risks with source and local response while escaping formula-like values", () => {
      const t = (key: TranslationKey) => key;
      const risk: Risk = {
        id: "risk-1",
        title: "=1+1",
        severity: "Critical",
        kind: "detected",
        explanation: 'A "quoted" explanation',
        evidence: {
          page: 2,
          excerpt: "Verified excerpt",
          verified: true,
        },
      };

      const csv = risksCsv(
        [
          {
            documentName: "Tender.pdf",
            isDemo: false,
            risk,
            mitigation: "+Review with legal",
          },
        ],
        t,
      );

      expect(csv).toContain("risk_csv_document,risk_csv_severity");
      expect(csv).toContain(`Tender.pdf,Critical,detected,'=1+1,"A ""quoted"" explanation"`);
      expect(csv).toContain(`'+Review with legal,Verified excerpt,2,csv_yes,csv_no`);
    });
  });
});
