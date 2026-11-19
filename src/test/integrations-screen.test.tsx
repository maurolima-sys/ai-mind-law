import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IntegrationsScreen } from "@/components/pocketmind/IntegrationsScreen";
import { LocaleProvider } from "@/lib/i18n";
import type { DiagnosticRecord } from "@/lib/services/aiDiagnostics";
import { runFirebaseInferenceDiagnostic } from "@/lib/services/aiDiagnostics";

const available = (service: DiagnosticRecord["service"]): DiagnosticRecord => ({
  id: `availability-${service}`,
  service,
  operation: "availability",
  outcome: "configured",
  observedAt: "2026-11-18T00:00:00.000Z",
  latencyMs: 4,
  message: "Configuration present",
});

vi.mock("@/lib/services/firebaseAi", () => ({
  isFirebaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/services/aiDiagnostics", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/services/aiDiagnostics")>();
  return {
    ...original,
    runLlamaParseAvailabilityDiagnostic: vi.fn(async () => available("llamaparse")),
    runElevenLabsAvailabilityDiagnostic: vi.fn(async () => available("elevenlabs")),
    runFirebaseInferenceDiagnostic: vi.fn(async (mode) => ({
      id: "firebase-result",
      service: "firebase-ai",
      operation: "inference",
      outcome: "success",
      observedAt: "2026-11-18T00:00:01.000Z",
      latencyMs: 120,
      message: "A real Firebase response was observed.",
      mode,
      source: mode === "local" ? "on-device" : "cloud",
      appCheck: mode === "local" ? "not-applicable" : "accepted",
    })),
  };
});

describe("IntegrationsScreen", () => {
  it("requires explicit consent before a cloud diagnostic", async () => {
    const onInference = vi.fn();
    render(
      <LocaleProvider>
        <IntegrationsScreen defaultMode="local" onInference={onInference} />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Cloud AI" }));
    const runButton = screen.getByRole("button", { name: "Run real inference test" });
    expect(runButton).toBeDisabled();

    fireEvent.click(
      screen.getByLabelText(
        "I explicitly allow this fixed diagnostic text to be sent to the cloud for this test.",
      ),
    );
    fireEvent.click(runButton);

    await waitFor(() => expect(runFirebaseInferenceDiagnostic).toHaveBeenCalledWith("cloud"));
    await waitFor(() => expect(onInference).toHaveBeenCalledWith("IN_CLOUD"));
  });

  it("states the current MCP security boundary without offering a fake connection", () => {
    render(
      <LocaleProvider>
        <IntegrationsScreen defaultMode="local" onInference={vi.fn()} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Not implemented")).toBeInTheDocument();
    expect(
      screen.getByText("A hosted MCP server cannot read this browser's IndexedDB"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /connect/i })).not.toBeInTheDocument();
  });
});
