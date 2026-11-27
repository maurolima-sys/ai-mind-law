/**
 * processing-extraction-stall.test.tsx
 *
 * Regression tests for the "Confirm and continue does not advance" bug.
 *
 * Root cause: runAnalysis called pagesNeedingExternalOcr which flagged any single
 * sparse page (table, header, cover) and navigated back to /processing with no
 * visible feedback. Fix: (1) OCR only triggers when >= 30% of pages are sparse;
 * (2) the persistent OCR panel is the feedback — no transient toast needed.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/lib/i18n";
import { ProcessingScreen } from "@/components/pocketmind/PocketMindApp";
import { pagesNeedingExternalOcr } from "@/lib/services/ocrNormalize";
import { buildDemoDocument } from "@/data/sampleTender";
import type { DocumentRecord } from "@/lib/types";

afterEach(cleanup);

const uploadDoc = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
  ...buildDemoDocument(),
  id: "upload-test-1",
  name: "utility-office-rfp.pdf",
  source: "upload",
  format: "pdf",
  pages: [],
  sourceLocations: [],
  ...overrides,
});

function baseProps(overrides: Partial<Parameters<typeof ProcessingScreen>[0]> = {}) {
  return {
    document: uploadDoc(),
    file: new File(["content"], "utility-office-rfp.pdf", { type: "application/pdf" }),
    choice: "local" as const,
    cloudConsent: false,
    showExternalOcrPrompt: false,
    ocrPageNumbers: [],
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

describe("ProcessingScreen extraction states", () => {
  it("state 1: not extracted — confirm button enabled when file present, no OCR prompt", () => {
    renderScreen({ showExternalOcrPrompt: false });
    const btn = screen.getByRole("button", { name: /confirm and continue/i });
    expect(btn).not.toBeDisabled();
    expect(screen.queryByText(/pages have little or no selectable text/i)).not.toBeInTheDocument();
  });

  it("state 2: extracting — confirm button shows spinner and is disabled", () => {
    renderScreen({ isAnalyzing: true });
    const btn = screen.getByRole("button", { name: /processing\.\.\./i });
    expect(btn).toBeDisabled();
  });

  it("state 3: extraction failed — error banner is visible with the error message", () => {
    renderScreen({
      errorMessage: "Text extraction could not be completed. PDF worker failed.",
    });
    expect(screen.getByText(/Text extraction could not be completed/i)).toBeInTheDocument();
  });

  it("state 4: scanned PDF detected — OCR prompt section is visible", () => {
    renderScreen({
      showExternalOcrPrompt: true,
      ocrPageNumbers: [1, 3, 5],
      externalOcrAvailability: "disabled",
      hasExtractedText: true,
      document: uploadDoc({ source: "upload" }),
    });
    expect(screen.getByText(/3 pages have little or no selectable text/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /analyze the text available in this browser/i }),
    ).toBeInTheDocument();
  });

  it("state 5: ready — no OCR prompt, confirm button enabled", () => {
    renderScreen({
      showExternalOcrPrompt: false,
      document: uploadDoc({ pages: ["page one text"], sourceLocations: ["Page 1"] }),
    });
    const btn = screen.getByRole("button", { name: /confirm and continue/i });
    expect(btn).not.toBeDisabled();
    expect(screen.queryByText(/pages have little or no selectable text/i)).not.toBeInTheDocument();
  });

  it("state 4 without extracted text — OCR prompt shown but analyze-browser button hidden", () => {
    renderScreen({
      showExternalOcrPrompt: true,
      ocrPageNumbers: [2],
      externalOcrAvailability: "disabled",
      hasExtractedText: false,
      document: uploadDoc({ source: "upload" }),
    });
    expect(screen.getByText(/1 pages have little or no selectable text/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /analyze the text available in this browser/i }),
    ).not.toBeInTheDocument();
  });
});

describe("pagesNeedingExternalOcr — utility-office-rfp.pdf regression", () => {
  // Simulates a PDF like utility-office-rfp.pdf: mostly rich text pages with a
  // few short table/header pages. Before the 30% threshold fix, a single short
  // page triggered the OCR flow and stalled the Processing screen.
  const richPage =
    "SECTION SUBMITTAL REQUIREMENTS. The contractor shall provide complete documentation, references, qualifications, and a signed proposal form before the stated deadline. ".repeat(
      12,
    );

  it("does not trigger OCR for a PDF with only a few sparse pages (< 30%)", () => {
    // 2 sparse pages out of 10 = 20% — typical for a cover + TOC in a real RFP.
    const pages = Array.from({ length: 10 }, (_, i) => (i < 2 ? "Table of Contents" : richPage));
    expect(pagesNeedingExternalOcr(pages)).toEqual([]);
  });

  it("triggers OCR when the majority of pages are sparse (>= 30%)", () => {
    // 4 sparse pages out of 10 = 40% — genuinely scanned document.
    const pages = Array.from({ length: 10 }, (_, i) => (i < 4 ? "" : richPage));
    expect(pagesNeedingExternalOcr(pages)).toEqual([1, 2, 3, 4]);
  });
});
