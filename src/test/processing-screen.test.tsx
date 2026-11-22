import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/lib/i18n";
import { ProcessingScreen } from "@/components/pocketmind/PocketMindApp";
import { buildDemoDocument } from "@/data/sampleTender";

afterEach(cleanup);

function baseProps(overrides: Partial<Parameters<typeof ProcessingScreen>[0]> = {}) {
  const sample = buildDemoDocument();
  return {
    document: sample,
    file: null,
    choice: "local" as const,
    cloudConsent: false,
    showExternalOcrPrompt: false,
    externalOcrAvailability: "disabled" as const,
    externalOcrConsent: false,
    hasExtractedText: false,
    firebaseConfigured: false,
    cloudResponseReceived: false,
    isAnalyzing: false,
    progressDetail: "",
    onOpenResults: vi.fn(),
    errorMessage: "",
    onDeviceTimeout: false,
    inputRef: createRef<HTMLInputElement>(),
    onFileChange: vi.fn(),
    onDrop: vi.fn(),
    onSelectChoice: vi.fn(),
    onCloudConsentChange: vi.fn(),
    onExternalOcrConsentChange: vi.fn(),
    onExternalOcr: vi.fn(),
    onAnalyzeExtractedText: vi.fn(),
    onExtractTextOnly: vi.fn(),
    onCheckExternalOcr: vi.fn(),
    onRunAnalysis: vi.fn(),
    onOpenDemo: vi.fn(),
    onClearError: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<Parameters<typeof ProcessingScreen>[0]> = {}) {
  render(
    <LocaleProvider>
      <ProcessingScreen {...baseProps(overrides)} />
    </LocaleProvider>,
  );
}

describe("ProcessingScreen layout and behaviour", () => {
  it("renders file drop zone before confirm bar in the DOM", () => {
    renderScreen();
    const fileDrop = document.querySelector(".pm-file-drop");
    const confirmBar = document.querySelector(".pm-confirm-bar");
    expect(fileDrop).not.toBeNull();
    expect(confirmBar).not.toBeNull();
    // compareDocumentPosition: DOCUMENT_POSITION_FOLLOWING = 4 means fileDrop comes before confirmBar
    const position = fileDrop!.compareDocumentPosition(confirmBar!);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders exactly one pm-file-drop and one pm-confirm-bar", () => {
    renderScreen();
    expect(document.querySelectorAll(".pm-file-drop")).toHaveLength(1);
    expect(document.querySelectorAll(".pm-confirm-bar")).toHaveLength(1);
  });

  it("disables confirm button when no file is selected in local mode", () => {
    const sample = buildDemoDocument();
    // Use an upload document with no extracted text so hasQuestionText is false
    const emptyDoc = { ...sample, id: "upload-empty", source: "upload" as const, pages: [] };
    renderScreen({ choice: "local", file: null, document: emptyDoc });
    const btn = screen.getByRole("button", { name: /confirm and continue/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText("Add a document to continue.")).toBeInTheDocument();
  });

  it("enables confirm button in demo mode without a file", () => {
    renderScreen({ choice: "demo", file: null });
    const btn = screen.getByRole("button", { name: /confirm and continue/i });
    expect(btn).not.toBeDisabled();
  });

  it("enables confirm button when a file is present in local mode", () => {
    const file = new File(["content"], "tender.pdf", { type: "application/pdf" });
    const sample = buildDemoDocument();
    const uploadDoc = { ...sample, id: "upload-1", source: "upload" as const };
    renderScreen({ choice: "local", file, document: uploadDoc });
    const btn = screen.getByRole("button", { name: /confirm and continue/i });
    expect(btn).not.toBeDisabled();
  });

  it("renders only one h1 heading on the processing screen", () => {
    renderScreen();
    // ProcessingScreen owns its own pm-setup-header h1; the topbar h1 is suppressed
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/choose how your document is processed/i);
  });

  it("applies dimmed class to file drop zone in demo mode", () => {
    renderScreen({ choice: "demo" });
    const fileDrop = document.querySelector(".pm-file-drop");
    expect(fileDrop).toHaveClass("pm-file-drop--dimmed");
  });

  it("does not apply dimmed class in local mode", () => {
    renderScreen({ choice: "local" });
    const fileDrop = document.querySelector(".pm-file-drop");
    expect(fileDrop).not.toHaveClass("pm-file-drop--dimmed");
  });
});
