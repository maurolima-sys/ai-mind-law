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

  it("verifies exact source excerpts and hides page numbers without trusted pagination", () => {
    const citations = [
      { sourceIndex: 1, excerpt: "Faltas injustificadas atrasam a licença." },
      { sourceIndex: 3, excerpt: "This page does not exist." },
    ];

    expect(
      verifyQuestionCitations(["Faltas injustificadas atrasam a licença."], citations, {
        format: "pdf",
      }),
    ).toEqual([
      {
        page: 1,
        sourceIndex: 1,
        sourceLocation: "Page 1",
        excerpt: "Faltas injustificadas atrasam a licença.",
        verified: true,
      },
      {
        page: null,
        sourceIndex: null,
        sourceLocation: null,
        excerpt: "This page does not exist.",
        verified: false,
      },
    ]);
    expect(
      verifyQuestionCitations(["Faltas injustificadas atrasam a licença."], citations.slice(0, 1), {
        format: "pdf",
        paginationVerified: false,
      }),
    ).toEqual([
      {
        page: null,
        sourceIndex: 1,
        sourceLocation: "Page 1",
        excerpt: "Faltas injustificadas atrasam a licença.",
        verified: true,
      },
    ]);
  });

  it("verifies non-PDF source locations without claiming a page number", () => {
    expect(
      verifyQuestionCitations(
        ["Tenderer must provide a current licence."],
        [{ sourceIndex: 1, excerpt: "provide a current licence" }],
        { format: "docx", sourceLocations: ["Paragraph 12"] },
      ),
    ).toEqual([
      {
        page: null,
        sourceIndex: 1,
        sourceLocation: "Paragraph 12",
        excerpt: "provide a current licence",
        verified: true,
      },
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
