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

  it("falls back to initialized local processing in hybrid mode when cloud processing fails", async () => {
    const hybridModel = model(validResponse, "on_device");
    hybridModel.generateContent.mockRejectedValue(new Error("Hybrid request failed"));
    const cloudModel = model(validResponse, "in_cloud");
    cloudModel.generateContent.mockRejectedValue(new Error("Cloud unavailable"));
    const localModel = model(validResponse, "on_device");
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model:
        preference === "cloud" ? cloudModel : preference === "local" ? localModel : hybridModel,
    }));
    const events: AnalysisProgressEvent[] = [];
    const result = await analyzeTender(
      ["x".repeat(6500)],
      "hybrid",
      () => {},
      () => {},
      {
        onEvent: (event) => events.push(event),
      },
    );

    expect(result.processingSource).toBe("on-device");
    expect(localModel.generateContent).toHaveBeenCalledTimes(3);
    const input = localModel.generateContent.mock.calls.map(([prompt]) => String(prompt));
    const sections = input.map((prompt) =>
      prompt.split("SOURCE TEXT:\n")[1]!.replace(/^--- SOURCE INDEX 1 · Page 1 ---\n/, ""),
    );
    expect(sections.every((section) => section.length <= 3000)).toBe(true);
    expect(sections.join("")).toBe("x".repeat(6500));
    expect(events).toContainEqual({ type: "local-retry" });
    expect(events.filter((event) => event.type === "response")).toHaveLength(3);
  });

  it("does not use cloud processing when local-only processing fails", async () => {
    const localModel = model(validResponse, "on_device");
    localModel.generateContent.mockRejectedValue(new Error("Local unavailable"));
    mocks.createTenderModel.mockReturnValue({ model: localModel });

    await expect(analyzeTender(["text"], "local", () => {})).rejects.toThrow("Local unavailable");
    expect(mocks.createTenderModel.mock.calls.every(([preference]) => preference === "local")).toBe(
      true,
    );
  });

  it("uses the cloud after an invalid hybrid response and reports both actual sources", async () => {
    const hybridModel = model("invalid JSON", "on_device");
    const cloudModel = model(validResponse, "in_cloud");
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model: preference === "cloud" ? cloudModel : hybridModel,
    }));
    const onInference = vi.fn();

    const result = await analyzeTender(["text"], "hybrid", () => {}, onInference);
    expect(onInference.mock.calls).toEqual([["ON_DEVICE"], ["IN_CLOUD"]]);
    expect(result.processingSource).toBe("hybrid");
  });

  it("uses the local fallback if the cloud returns invalid structured output", async () => {
    const hybridModel = model(validResponse, "on_device");
    hybridModel.generateContent.mockRejectedValue(new Error("Hybrid request failed"));
    const cloudModel = model("invalid JSON", "in_cloud");
    const localModel = model(validResponse, "on_device");
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model:
        preference === "cloud" ? cloudModel : preference === "local" ? localModel : hybridModel,
    }));
    const onInference = vi.fn();

    const result = await analyzeTender(["text"], "hybrid", () => {}, onInference);
    expect(result.processingSource).toBe("hybrid");
    expect(onInference.mock.calls).toEqual([["IN_CLOUD"], ["ON_DEVICE"]]);
  });

  it("does not use local processing when cloud-only processing fails", async () => {
    const cloudModel = model(validResponse, "in_cloud");
    cloudModel.generateContent.mockRejectedValue(new Error("Cloud unavailable"));
    mocks.createTenderModel.mockReturnValue({ model: cloudModel });

    await expect(analyzeTender(["text"], "cloud", () => {})).rejects.toThrow("Cloud unavailable");
    expect(mocks.createTenderModel.mock.calls.every(([preference]) => preference === "cloud")).toBe(
      true,
    );
  });

  it("reports both failures when the cloud and local fallback are unavailable", async () => {
    const hybridModel = model(validResponse, "on_device");
    hybridModel.generateContent.mockRejectedValue(new Error("Hybrid request failed"));
    const cloudModel = model(validResponse, "in_cloud");
    cloudModel.generateContent.mockRejectedValue(new Error("Cloud unavailable"));
    const localModel = model(validResponse, "on_device");
    localModel.initializeDeviceModel = vi.fn().mockRejectedValue(new Error("Local unavailable"));
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model:
        preference === "cloud" ? cloudModel : preference === "local" ? localModel : hybridModel,
    }));

    await expect(analyzeTender(["text"], "hybrid", () => {})).rejects.toThrow(
      /Cloud unavailable.*Local unavailable/,
    );
    expect(localModel.generateContent).not.toHaveBeenCalled();
  });
});
