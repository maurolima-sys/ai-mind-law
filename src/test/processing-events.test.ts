import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createTenderModel: vi.fn() }));
vi.mock("@/lib/services/firebaseAi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/firebaseAi")>()),
  createTenderModel: mocks.createTenderModel,
}));

import {
  analyzeTender,
  chunkTenderText,
  ON_DEVICE_CHUNK_CHARACTERS,
  type AnalysisProgressEvent,
} from "@/lib/services/tenderAnalysis";

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
  it("preserves Unicode characters at the local section boundary", () => {
    const text = `${"x".repeat(3999)}😀end`;
    const chunks = chunkTenderText([text], ["Page 1"], ON_DEVICE_CHUNK_CHARACTERS);
    const sections = chunks.flatMap((chunk) => chunk.pages.map((page) => page.text));

    expect(sections.join("")).toBe(text);
    expect(
      sections.every(
        (section) =>
          !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(section),
      ),
    ).toBe(true);
    expect(sections.every((section) => section.length <= ON_DEVICE_CHUNK_CHARACTERS)).toBe(true);
  });

  it("analyzes a large hybrid document locally in bounded sections before considering cloud", async () => {
    const localModel = model(validResponse, "on_device");
    localModel.generateContent.mockImplementation(async (prompt: string) => {
      const source = prompt.split("SOURCE TEXT:\n")[1] ?? "";
      if (source.replace(/^--- SOURCE INDEX 1 · Page 1 ---\n/, "").length > 4000) {
        throw new Error("The input is too large");
      }
      return { response: { inferenceSource: "on_device", text: () => validResponse } };
    });
    const cloudModel = model(validResponse, "in_cloud");
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model: preference === "cloud" ? cloudModel : localModel,
    }));

    const result = await analyzeTender(["x".repeat(6500)], "hybrid", () => {});

    expect(result.processingSource).toBe("on-device");
    expect(cloudModel.generateContent).not.toHaveBeenCalled();
  });

  it("waits for a progressing hybrid model download longer than 30 seconds", async () => {
    vi.useFakeTimers();
    try {
      const localModel = model(validResponse, "on_device");
      let finishDownload: (() => void) | undefined;
      localModel.initializeDeviceModel = (progress) =>
        new Promise<void>((resolve) => {
          progress(0.1);
          setTimeout(() => progress(0.5), 20_000);
          finishDownload = resolve;
        });
      const cloudModel = model(validResponse, "in_cloud");
      mocks.createTenderModel.mockImplementation((preference: string) => ({
        model: preference === "cloud" ? cloudModel : localModel,
      }));

      const analysis = analyzeTender(["text"], "hybrid", () => {});
      await vi.advanceTimersByTimeAsync(35_000);
      finishDownload?.();
      const result = await analysis;

      expect(result.processingSource).toBe("on-device");
      expect(cloudModel.generateContent).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("allows hybrid local generation to continue beyond 30 seconds", async () => {
    vi.useFakeTimers();
    try {
      const localModel = model(validResponse, "on_device");
      localModel.generateContent.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({ response: { inferenceSource: "on_device", text: () => validResponse } }),
              35_000,
            );
          }),
      );
      const cloudModel = model(validResponse, "in_cloud");
      mocks.createTenderModel.mockImplementation((preference: string) => ({
        model: preference === "cloud" ? cloudModel : localModel,
      }));

      const analysis = analyzeTender(["text"], "hybrid", () => {});
      await vi.advanceTimersByTimeAsync(35_000);
      expect((await analysis).processingSource).toBe("on-device");
      expect(cloudModel.generateContent).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(["local", "hybrid"] as const)(
    "retries an oversized %s section locally without losing source text",
    async (preference) => {
      const localModel = model(validResponse, "on_device");
      const accepted: string[] = [];
      localModel.generateContent.mockImplementation(async (prompt: string) => {
        const source = (prompt.split("SOURCE TEXT:\n")[1] ?? "").replace(
          /^--- SOURCE INDEX 1 · Page 1 ---\n/,
          "",
        );
        if (source.length > 1000) throw new Error("The input is too large");
        accepted.push(source);
        return { response: { inferenceSource: "on_device", text: () => validResponse } };
      });
      mocks.createTenderModel.mockReturnValue({ model: localModel });
      const text = "a".repeat(1500) + "b".repeat(1500);

      const result = await analyzeTender([text], preference, () => {});

      expect(result.processingSource).toBe("on-device");
      expect(accepted.join("")).toBe(text);
      expect(mocks.createTenderModel.mock.calls.every(([mode]) => mode === "local")).toBe(true);
    },
  );

  it("surfaces an oversized input error when a local section cannot be split further", async () => {
    const localModel = model(validResponse, "on_device");
    localModel.generateContent.mockRejectedValue(new Error("The input is too large"));
    mocks.createTenderModel.mockReturnValue({ model: localModel });

    await expect(analyzeTender(["short text"], "local", () => {})).rejects.toThrow(
      "The input is too large",
    );
    expect(localModel.generateContent).toHaveBeenCalledTimes(1);
  });

  it("preserves Unicode and page references when splitting an oversized multi-page section", async () => {
    const localModel = model(validResponse, "on_device");
    const accepted = new Map<number, string>();
    localModel.generateContent.mockImplementation(async (prompt: string) => {
      const source = prompt.split("SOURCE TEXT:\n")[1] ?? "";
      if (source.length > 2200) throw new Error("The input is too large");
      for (const match of source.matchAll(
        /--- SOURCE INDEX (\d+) · Page (\d+) ---\n([\s\S]*?)(?=\n\n--- SOURCE INDEX \d+ · Page \d+ ---\n|$)/g,
      )) {
        if (match[1] === undefined || match[2] === undefined || match[3] === undefined) {
          throw new Error("Missing source reference or text");
        }
        expect(match[1]).toBe(match[2]);
        expect(
          /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(match[3]),
        ).toBe(false);
        const index = Number(match[1]);
        accepted.set(index, (accepted.get(index) ?? "") + match[3]);
      }
      return { response: { inferenceSource: "on_device", text: () => validResponse } };
    });
    mocks.createTenderModel.mockReturnValue({ model: localModel });
    const pages = [`${"a".repeat(1499)}😀${"a".repeat(499)}`, "b".repeat(1000)];

    await analyzeTender(pages, "local", () => {});

    expect(accepted.get(1)).toBe(pages[0]);
    expect(accepted.get(2)).toBe(pages[1]);
  });

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

  it("reuses the initialized on-device model on smaller sections if cloud processing fails", async () => {
    const localModel = model(validResponse, "on_device");
    localModel.generateContent.mockRejectedValueOnce(new Error("On-device request failed"));
    const cloudModel = model(validResponse, "in_cloud");
    cloudModel.generateContent.mockRejectedValue(new Error("Cloud unavailable"));
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model: preference === "cloud" ? cloudModel : localModel,
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
    expect(localModel.generateContent).toHaveBeenCalledTimes(5);
    const input = localModel.generateContent.mock.calls.map(([prompt]) => String(prompt));
    const sections = input.map((prompt) =>
      prompt.split("SOURCE TEXT:\n")[1]!.replace(/^--- SOURCE INDEX 1 · Page 1 ---\n/, ""),
    );
    expect(sections[0]).toBe("x".repeat(2000));
    expect(sections.slice(1).every((section) => section.length <= ON_DEVICE_CHUNK_CHARACTERS)).toBe(
      true,
    );
    expect(sections.slice(1).join("")).toBe("x".repeat(6500));
    expect(events).toContainEqual({ type: "local-retry" });
    expect(events.filter((event) => event.type === "response")).toHaveLength(4);
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
    const localModel = model(validResponse, "on_device");
    localModel.generateContent.mockRejectedValueOnce(new Error("On-device request failed"));
    const cloudModel = model("invalid JSON", "in_cloud");
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model: preference === "cloud" ? cloudModel : localModel,
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

  it("reports both failures when device initialization and cloud fallback fail", async () => {
    const cloudModel = model(validResponse, "in_cloud");
    cloudModel.generateContent.mockRejectedValue(new Error("Cloud unavailable"));
    const localModel = model(validResponse, "on_device");
    localModel.initializeDeviceModel = vi.fn().mockRejectedValue(new Error("Local unavailable"));
    mocks.createTenderModel.mockImplementation((preference: string) => ({
      model: preference === "cloud" ? cloudModel : localModel,
    }));

    await expect(analyzeTender(["text"], "hybrid", () => {})).rejects.toThrow(
      /Local unavailable.*Cloud unavailable/,
    );
    expect(localModel.generateContent).not.toHaveBeenCalled();
  });
});
