import type { Analysis, ProcessingSource } from "@/lib/types";

export type InferenceSource = "ON_DEVICE" | "IN_CLOUD";

export function analysisProcessingSource(analysis: Analysis): ProcessingSource | undefined {
  return analysis.processingSource ?? (analysis.mode === "demo" ? "demo" : undefined);
}

export function hasCloudResponse(previous: boolean, source: InferenceSource): boolean {
  return previous || source === "IN_CLOUD";
}

export const processingSourceKeys = {
  "on-device": "mode_on_device",
  cloud: "mode_cloud",
  "cloud-fallback": "mode_cloud_fallback",
  hybrid: "mode_hybrid",
  demo: "mode_demo",
} as const;
