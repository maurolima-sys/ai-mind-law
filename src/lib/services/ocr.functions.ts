import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { normalizeParseResult, type NormalizedOcr } from "@/lib/services/ocrNormalize";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/llamacloud";
const MAX_BYTES = 20 * 1024 * 1024;

const inputSchema = z.object({
  consent: z.literal(true),
  fileName: z.string().min(1).max(255),
  base64: z
    .string()
    .min(1)
    .max(Math.ceil((MAX_BYTES * 4) / 3) + 8),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const checkExternalOcrAvailability = createServerFn({ method: "GET" }).handler(async () =>
  Boolean(process.env["LOVABLE_API_KEY"] && process.env["LLAMACLOUD_API_KEY"]),
);

async function failure(res: Response, step: string): Promise<never> {
  const body = (await res.text()).slice(0, 500);
  console.error(`LlamaParse ${step} failed [${res.status}]`);
  throw new Error(`External OCR ${step} failed [${res.status}]: ${body}`);
}

export const extractWithLlamaParse = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<NormalizedOcr> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connKey = process.env["LLAMACLOUD_API_KEY"];
    if (!lovableKey || !connKey) {
      throw new Error(
        "External OCR is not enabled: the LlamaParse connector is not linked to this project.",
      );
    }
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_BYTES) throw new Error("File exceeds the 20 MB limit.");
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
      throw new Error("Only PDF files are supported.");

    const headers = { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey };
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "application/pdf" }), data.fileName);
    form.append("configuration", JSON.stringify({ tier: "fast", version: "latest" }));
    const up = await fetch(`${GATEWAY_URL}/api/v2/parse/upload`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!up.ok) await failure(up, "upload");
    const { id } = (await up.json()) as { id?: string };
    if (!id) throw new Error("External OCR upload returned no job id.");

    try {
      const deadline = Date.now() + 120_000;
      let delay = 3000;
      for (;;) {
        if (Date.now() > deadline) throw new Error("External OCR timed out after 2 minutes.");
        await sleep(delay);
        const poll = await fetch(`${GATEWAY_URL}/api/v2/parse/${id}`, { headers });
        if (poll.status === 429 || poll.status >= 500) {
          delay = Math.min(delay * 2, 15_000);
          continue;
        }
        if (!poll.ok) await failure(poll, "status check");
        const { job } = (await poll.json()) as { job?: { status?: string } };
        if (job?.status === "COMPLETED") break;
        if (job?.status === "FAILED" || job?.status === "CANCELLED") {
          throw new Error(`External OCR job ${job.status.toLowerCase()}.`);
        }
        delay = 3000;
      }
      const res = await fetch(`${GATEWAY_URL}/api/v2/parse/${id}?expand=text,markdown`, {
        headers,
      });
      if (!res.ok) await failure(res, "result fetch");
      const out = normalizeParseResult(await res.json());
      if (!out.pages.some((p) => p.trim())) throw new Error("External OCR returned no text.");
      return out;
    } finally {
      fetch(`${GATEWAY_URL}/api/v2/parse/${id}`, { method: "DELETE", headers }).catch(() => {});
    }
  });
