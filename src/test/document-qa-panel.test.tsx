import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentQaPanel } from "@/components/pocketmind/DocumentQaPanel";
import { LocaleProvider } from "@/lib/i18n";
import { answerDocumentQuestion } from "@/lib/services/documentQa";

vi.mock("@/lib/services/documentQa", () => ({
  answerDocumentQuestion: vi.fn(),
}));

vi.mock("@/lib/services/legalResearch.functions", () => ({
  checkLegalResearchAvailability: vi.fn().mockResolvedValue(false),
  searchLegalSources: vi.fn(),
}));

describe("DocumentQaPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables sending a drafted question and explains when an AI mode must be selected", () => {
    const props = {
      documentName: "sample.pdf",
      pages: ["Extracted document text"],
      format: "pdf" as const,
      sourceLocations: ["Page 1"],
      preference: null,
      cloudConsent: false,
      paginationVerified: true,
      onOpenProcessing: vi.fn(),
      onSelectPage: vi.fn(),
      onModelResponse: vi.fn(),
      onDraftChange: vi.fn(),
    };
    const { rerender } = render(
      <LocaleProvider>
        <DocumentQaPanel {...props} draft="" />
      </LocaleProvider>,
    );

    const sendButton = screen.getByRole("button", { name: "Send question" });
    expect(sendButton).toBeDisabled();
    expect(screen.getByRole("log", { name: "Answer" })).toHaveTextContent(
      "Your answer will appear here",
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Ask a question about this document" }), {
      target: { value: "What does this document require?" },
    });
    expect(props.onDraftChange).toHaveBeenCalledWith("What does this document require?");
    rerender(
      <LocaleProvider>
        <DocumentQaPanel {...props} draft="What does this document require?" />
      </LocaleProvider>,
    );

    expect(sendButton).toBeEnabled();
    fireEvent.click(sendButton);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose an AI processing mode before asking.",
    );
  });

  it("renders a successful answer in the transcript", async () => {
    vi.mocked(answerDocumentQuestion).mockResolvedValue({
      answer: "The document requires a valid contractor licence.",
      hypotheses: [],
      unresolvedQuestions: [],
      citations: [],
      researchSources: [],
      citedResearchSourceIds: [],
      engine: "Firebase AI Logic · on-device",
      inferenceSource: "ON_DEVICE",
    });

    render(
      <LocaleProvider>
        <DocumentQaPanel
          documentName="sample.pdf"
          pages={["Applicants must hold a valid contractor licence."]}
          format="pdf"
          sourceLocations={["Page 1"]}
          draft="What licence is required?"
          onDraftChange={vi.fn()}
          preference="local"
          cloudConsent={false}
          paginationVerified
          onOpenProcessing={vi.fn()}
          onSelectPage={vi.fn()}
          onModelResponse={vi.fn()}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Send question" }));

    expect(
      await screen.findByText("The document requires a valid contractor licence."),
    ).toBeInTheDocument();
    expect(screen.getByRole("log", { name: "Answer" })).toHaveTextContent(
      "The document requires a valid contractor licence.",
    );
    expect(screen.getByRole("log", { name: "Answer" }).textContent).toContain("ON_DEVICE");
  });
});
