import "fake-indexeddb/auto";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildDemoDocument } from "@/data/sampleTender";
import { LocaleProvider } from "@/lib/i18n";
import { clearLocalWorkspace } from "@/lib/services/localWorkspace";
import { PocketMindApp, ProcessingScreen } from "@/components/pocketmind/PocketMindApp";

const mocks = vi.hoisted(() => ({ analyzeTender: vi.fn() }));
vi.mock("@/lib/buildInfo", () => ({ buildLabel: () => "test build" }));
vi.mock("@/lib/services/tenderAnalysis", () => ({ analyzeTender: mocks.analyzeTender }));
vi.mock("@/lib/services/firebaseAi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/firebaseAi")>()),
  isFirebaseConfigured: () => false,
}));
vi.mock("@/lib/services/localWorkspace", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/localWorkspace")>()),
  loadLocalWorkspace: vi.fn().mockResolvedValue({
    documents: [],
    filesByDocumentId: {},
    evidenceDocuments: [],
    filesByEvidenceId: {},
    projects: [],
    projectDocumentLinks: [],
    reviews: {},
    evidenceMatches: [],
    evidenceLinks: [],
    activities: [],
  }),
}));

beforeEach(async () => {
  localStorage.clear();
  await clearLocalWorkspace();
  mocks.analyzeTender.mockReset();
});
afterEach(cleanup);

function renderApp() {
  const root = createRootRoute({
    component: () => (
      <LocaleProvider>
        <PocketMindApp />
      </LocaleProvider>
    ),
  });
  const router = createRouter({ routeTree: root, history: createMemoryHistory() });
  render(<RouterProvider router={router} />);
}

describe("processing provenance", () => {
  it("zooms the source text and expands and restores the document viewer", async () => {
    renderApp();
    const navigation = await screen.findByRole("navigation", { name: "Main navigation" });
    fireEvent.click(within(navigation).getByRole("button", { name: "Analysis" }));
    const sourceText = screen.getByRole("figure").querySelector("pre");
    expect(sourceText).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("110%")).toBeInTheDocument();
    expect(sourceText).toHaveStyle({ fontSize: "14.3px" });
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(sourceText).toHaveStyle({ fontSize: "13px" });
    const zoomOut = screen.getByRole("button", { name: "Zoom out" });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    act(() => {
      for (let i = 0; i < 5; i++) fireEvent.click(zoomOut);
    });
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(zoomOut).toBeDisabled();
    act(() => {
      for (let i = 0; i < 15; i++) fireEvent.click(zoomIn);
    });
    expect(screen.getByText("200%")).toBeInTheDocument();
    expect(zoomIn).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getByRole("button", { name: "Show analysis panel" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(screen.getByRole("button", { name: "Hide analysis panel" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }, 15_000);

  it("collapses navigation and analysis without losing the question draft", async () => {
    renderApp();
    const navigation = await screen.findByRole("navigation", { name: "Main navigation" });
    fireEvent.click(within(navigation).getByRole("button", { name: "Analysis" }));
    fireEvent.click(screen.getByRole("button", { name: "Qa" }));
    const question = screen.getByRole("textbox", { name: "Ask a question about this document" });
    fireEvent.change(question, { target: { value: "A draft question" } });

    fireEvent.click(screen.getByRole("button", { name: "Hide analysis panel" }));
    expect(screen.getByRole("button", { name: "Show analysis panel" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(question).not.toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Show analysis panel" }));
    expect(screen.getByRole("textbox", { name: "Ask a question about this document" })).toHaveValue(
      "A draft question",
    );

    fireEvent.click(screen.getByRole("button", { name: "Collapse menu" }));
    expect(screen.getByRole("complementary", { name: "" })).toHaveClass("is-collapsed");
    fireEvent.click(screen.getByRole("button", { name: "Expand menu" }));
    expect(screen.getByRole("complementary", { name: "" })).not.toHaveClass("is-collapsed");
  });

  it("distinguishes a failed local attempt from the previously prepared sample analysis", async () => {
    mocks.analyzeTender.mockRejectedValue(
      Object.assign(new Error("timed out"), { code: "ON_DEVICE_GENERATION_TIMEOUT" }),
    );
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: /add a document/i }));
    const status = screen.getByRole("region", { name: "Firebase AI Logic status" });
    expect(within(status).getByText("Fictional sample document")).toBeInTheDocument();
    expect(within(status).getByText("Demo mode")).toBeInTheDocument();
    expect(within(status).getByText("No AI analysis attempted this session")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm and continue/i }));
    expect(await screen.findByText("Processing failed")).toBeInTheDocument();
    expect(
      await within(status).findByText("Failed · displayed analysis is from an earlier run"),
    ).toBeInTheDocument();
    expect(within(status).getByText("Demo mode")).toBeInTheDocument();
    expect(mocks.analyzeTender.mock.calls[0]?.[1]).toBe("local");

    fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(
      screen.getByText("Failed · displayed analysis is from an earlier run"),
    ).toBeInTheDocument();
  }, 15_000);

  it("reports real inference separately from fictional sample content", async () => {
    const sample = buildDemoDocument();
    if (!sample.analysis) throw new Error("Sample analysis missing");
    mocks.analyzeTender.mockResolvedValue({
      ...sample.analysis,
      mode: "local",
      processingSource: "on-device",
    });
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: /add a document/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm and continue/i }));
    fireEvent.click(await screen.findByRole("button", { name: "View analysis results" }));
    expect(await screen.findByText("On-device (ON_DEVICE)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Processing" }));
    const status = screen.getByRole("region", { name: "Firebase AI Logic status" });
    expect(within(status).getByText("Fictional sample document")).toBeInTheDocument();
    expect(within(status).getByText("On-device (ON_DEVICE)")).toBeInTheDocument();
    expect(within(status).getByText("Completed")).toBeInTheDocument();
    expect(within(status).queryByText("Demo mode")).not.toBeInTheDocument();
  }, 15_000);

  it("opens results automatically after displaying completion", async () => {
    const sample = buildDemoDocument();
    if (!sample.analysis) throw new Error("Sample analysis missing");
    mocks.analyzeTender.mockResolvedValue({
      ...sample.analysis,
      mode: "local",
      processingSource: "on-device",
    });
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: /add a document/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm and continue/i }));
    expect(
      await screen.findByRole("button", { name: "View analysis results" }),
    ).toBeInTheDocument();
    await waitFor(
      () =>
        expect(
          screen.queryByRole("region", { name: "Processing intelligence monitor" }),
        ).not.toBeInTheDocument(),
      { timeout: 6000 },
    );
    expect(
      screen.getByRole("heading", { name: "Document analysis", level: 1 }),
    ).toBeInTheDocument();
  }, 15_000);

  it("does not redirect when the user leaves processing before completion", async () => {
    const sample = buildDemoDocument();
    if (!sample.analysis) throw new Error("Sample analysis missing");
    const result = { ...sample.analysis, mode: "local", processingSource: "on-device" };
    let finish: (value: typeof result) => void = () => {
      throw new Error("Analysis was not started");
    };
    mocks.analyzeTender.mockImplementation(
      () =>
        new Promise<typeof result>((resolve) => {
          finish = resolve;
        }),
    );
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: /add a document/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm and continue/i }));
    await screen.findByRole("region", { name: "Processing intelligence monitor" });
    fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    await act(async () => finish(result));
    fireEvent.click(screen.getByRole("button", { name: "Processing" }));
    expect(
      await screen.findByRole("button", { name: "View analysis results" }),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 2700));
    expect(screen.getByRole("button", { name: "View analysis results" })).toBeInTheDocument();
  }, 15_000);

  it("reports uploaded content, external extraction and an earlier cloud result separately", () => {
    const sample = buildDemoDocument();
    if (!sample.analysis) throw new Error("Sample analysis missing");
    const document = {
      ...sample,
      id: "uploaded",
      name: "document.pdf",
      source: "upload" as const,
      textSource: "llamaparse" as const,
      analysis: { ...sample.analysis, mode: "cloud" as const, processingSource: "cloud" as const },
    };
    render(
      <LocaleProvider>
        <ProcessingScreen
          document={document}
          file={null}
          choice="hybrid"
          cloudConsent={false}
          showExternalOcrPrompt={false}
          externalOcrAvailability="disabled"
          externalOcrConsent={false}
          hasExtractedText={true}
          firebaseConfigured={true}
          cloudResponseReceived={false}
          analysisAttempt="failed"
          isAnalyzing={false}
          progressDetail=""
          onOpenResults={vi.fn()}
          errorMessage=""
          onDeviceTimeout={false}
          inputRef={createRef<HTMLInputElement>()}
          onFileChange={vi.fn()}
          onDrop={vi.fn()}
          onSelectChoice={vi.fn()}
          onCloudConsentChange={vi.fn()}
          onExternalOcrConsentChange={vi.fn()}
          onExternalOcr={vi.fn()}
          onAnalyzeExtractedText={vi.fn()}
          onExtractTextOnly={vi.fn()}
          onCheckExternalOcr={vi.fn()}
          onRunAnalysis={vi.fn()}
          onOpenDemo={vi.fn()}
          onClearError={vi.fn()}
        />
      </LocaleProvider>,
    );
    const status = screen.getByRole("region", { name: "Firebase AI Logic status" });
    expect(within(status).getByText("document.pdf")).toBeInTheDocument();
    expect(within(status).getByText("Uploaded document")).toBeInTheDocument();
    expect(within(status).getByText("External OCR · LlamaParse")).toBeInTheDocument();
    expect(within(status).getByText("Cloud (IN_CLOUD)")).toBeInTheDocument();
    expect(
      within(status).getByText("Failed · displayed analysis is from an earlier run"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mode for next analysis")).toBeInTheDocument();
    expect(screen.getAllByText("Hybrid · on-device first, cloud fallback")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /confirm and continue/i })).toBeDisabled();
  });
});
