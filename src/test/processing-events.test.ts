import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createTenderModel: vi.fn() }));
vi.mock("@/lib/services/firebaseAi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/firebaseAi")>()),
  createTenderModel: mocks.createTenderModel,
}));

import { analyzeTender, type AnalysisProgressEvent } from "@/lib/services/tenderAnalysis";

const validResponse = JSON.stringify({
  summary: "Test",
  requirements: [],
  deadlines: [],
  specifications: [],
  risks: [],
  missing: [],
  inconsistencies: [],
});

function model(response: string, source: string) {
  return {
    initializeDeviceModel: async (progress: (value: number) => void) => progress(0.5),
    generateContent: vi.fn().mockResolvedValue({
      response: { inferenceSource: source, text: () => response },
    }),
  };
}

beforeEach(() => mocks.createTenderModel.mockReset());

describe("analysis activity events", () => {
  it("reports actual initialization, response source, validation and evidence checks in order", async () => {
    mocks.createTenderModel.mockReturnValue({ model: model(validResponse, "on_device") });
    const events: AnalysisProgressEvent[] = [];
    await analyzeTender(
      ["Selectable text"],
      "local",
      () => {},
      () => {},
      {
        onEvent: (event) => events.push(event),
      },
    );
    expect(events).toEqual([
      { type: "initializing" },
      { type: "model-download", percent: 50 },
      { type: "model-ready" },
      { type: "request-started", section: 1, total: 1 },
      { type: "response", source: "ON_DEVICE" },
      { type: "output-validated", section: 1, total: 1 },
      { type: "checking-evidence" },
    ]);
  });

  it("never reports validation or evidence checks after malformed output", async () => {
    mocks.createTenderModel.mockReturnValue({ model: model("not JSON", "in_cloud") });
    const events: AnalysisProgressEvent[] = [];
    await expect(
      analyzeTender(
        ["Selectable text"],
        "cloud",
        () => {},
        () => {},
        {
          onEvent: (event) => events.push(event),
        },
      ),
    ).rejects.toThrow();
    expect(events).toContainEqual({ type: "response", source: "IN_CLOUD" });
    expect(events.some((event) => event.type === "output-validated")).toBe(false);
    expect(events.some((event) => event.type === "checking-evidence")).toBe(false);
  });

  it("reports the hybrid cloud retry before the cloud response, not before failure", async () => {
    const hybridModel = model(validResponse, "on_device");
    hybridModel.generateContent.mockRejectedValue(new Error("Local request failed"));
    const cloudModel = model(validResponse, "in_cloud");
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model: preference === "cloud" ? cloudModel : hybridModel,
    }));
    const events: AnalysisProgressEvent[] = [];
    await analyzeTender(
      ["Selectable text"],
      "hybrid",
      () => {},
      () => {},
      {
        onEvent: (event) => events.push(event),
      },
    );
    expect(events.findIndex((event) => event.type === "cloud-retry")).toBeGreaterThan(
      events.findIndex((event) => event.type === "request-started"),
    );
    expect(events.findIndex((event) => event.type === "response")).toBeGreaterThan(
      events.findIndex((event) => event.type === "cloud-retry"),
    );
    expect(events).toContainEqual({ type: "response", source: "IN_CLOUD" });
  });
});
