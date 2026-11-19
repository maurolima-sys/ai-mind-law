import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProcessingMonitor, type MonitorState } from "@/components/pocketmind/ProcessingMonitor";
import { buildDemoDocument } from "@/data/sampleTender";
import { LocaleProvider } from "@/lib/i18n";

const initial: MonitorState = {
  documentId: "test",
  documentName: "example.pdf",
  status: "running",
  events: [{ type: "document-selected" }, { type: "text-page", completed: 2, total: 6 }],
};

afterEach(cleanup);

function show(monitor: MonitorState, open = vi.fn()) {
  render(
    <LocaleProvider>
      <ProcessingMonitor monitor={monitor} onOpenResults={open} />
    </LocaleProvider>,
  );
  return open;
}

describe("processing monitor", () => {
  it("shows measured page progress, and pauses only the animation", () => {
    show(initial);
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("value", "2");
    expect(progress).toHaveAttribute("max", "6");
    fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));
    expect(screen.getByRole("button", { name: "Resume animation" })).toBeInTheDocument();
    expect(progress).toHaveAttribute("value", "2");
  });

  it("does not claim a cloud response before one was reported", () => {
    show({
      ...initial,
      events: [{ type: "initializing" }, { type: "model-unavailable" }, { type: "cloud-retry" }],
    });
    expect(
      within(screen.getByRole("list", { name: "Live processing activity" })).getByText(
        /retrying with Cloud AI under your hybrid policy/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Firebase reported a cloud inference response"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("Processing — duration unknown")).toBeInTheDocument();
  });

  it("shows real counts and opens results only after completion", () => {
    const result = buildDemoDocument().analysis;
    if (!result) throw new Error("Sample analysis missing");
    const open = show({ ...initial, status: "completed", result });
    const region = screen.getByRole("region", { name: "Processing intelligence monitor" });
    const total =
      result.requirements.length +
      result.deadlines.length +
      result.specifications.length +
      result.risks.length +
      result.missing.length +
      result.inconsistencies.length;
    expect(within(region).getByText(`${total} findings returned`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View analysis results" }));
    expect(open).toHaveBeenCalledOnce();
  });

  it("shows an OCR decision as waiting, not a successful analysis", () => {
    show({ ...initial, status: "waiting", events: [{ type: "ocr-waiting" }] });
    expect(screen.getByText("Action needed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View analysis results" })).not.toBeInTheDocument();
  });
});
