import { describe, expect, it } from "vitest";

import { selectRelevantPages, verifyQuestionCitations } from "@/lib/services/documentQa";
import { normalizeLegalResearchResults } from "@/lib/services/legalResearch";

describe("selectRelevantPages", () => {
  it("prioritizes pages that match Portuguese question terms and respects the context limit", () => {
    const pages = [
      "The tender submission deadline is 30 June.",
      "As faltas injustificadas retardarão a concessão da licença em um mês por falta.",
      "The supplier must provide audited financial statements.",
    ];

    expect(selectRelevantPages(pages, "Uma falta injustificada perde o quinquênio?", 1000)).toEqual(
      [
        {
          page: 2,
          text: "As faltas injustificadas retardarão a concessão da licença em um mês por falta.",
        },
      ],
    );
    expect(selectRelevantPages(["123456789"], "unmatched term", 4)).toEqual([
      { page: 1, text: "1234" },
    ]);
  });

  it("only verifies exact page excerpts and hides page numbers without trusted pagination", () => {
    const citations = [
      { page: 1, excerpt: "Faltas injustificadas atrasam a licença." },
      { page: 3, excerpt: "This page does not exist." },
    ];

    expect(
      verifyQuestionCitations(["Faltas injustificadas atrasam a licença."], citations, true),
    ).toEqual([
      { page: 1, excerpt: "Faltas injustificadas atrasam a licença.", verified: true },
      { page: null, excerpt: "This page does not exist.", verified: false },
    ]);
    expect(
      verifyQuestionCitations(
        ["Faltas injustificadas atrasam a licença."],
        citations.slice(0, 1),
        false,
      ),
    ).toEqual([
      { page: null, excerpt: "Faltas injustificadas atrasam a licença.", verified: false },
    ]);
  });
});

describe("normalizeLegalResearchResults", () => {
  it("keeps secure links, bounds returned content, and assigns stable citation IDs", () => {
    const longContent = "x".repeat(3001);
    const result = normalizeLegalResearchResults({
      success: true,
      data: {
        web: [
          {
            url: "javascript:alert(1)",
            title: "Unsafe",
          },
          {
            url: "http://example.gov/test",
            title: "Unencrypted",
          },
          {
            url: "https://legislacao.example.gov/test",
            title: "Law text",
            description: "Official result",
            markdown: longContent,
            metadata: { publishedDate: "2025-01-02" },
          },
        ],
      },
    });

    expect(result).toEqual([
      {
        id: "R1",
        title: "Law text",
        url: "https://legislacao.example.gov/test",
        description: "Official result",
        content: "x".repeat(3000),
        publishedDate: "2025-01-02",
      },
    ]);
  });

  it("surfaces malformed Firecrawl responses", () => {
    expect(() => normalizeLegalResearchResults({ success: false })).toThrow(
      "External legal research returned an invalid response.",
    );
  });
});
