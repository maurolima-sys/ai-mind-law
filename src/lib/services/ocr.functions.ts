import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { normalizeParseResult, type NormalizedOcr } from "@/lib/services/ocrNormalize";

const BASE_URL = "https://api.cloud.llamaindex.ai";
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
  Boolean(process.env["LLAMACLOUD_API_KEY"]),
);

async function failure(res: Response, step: string): Promise<never> {
  const body = (await res.text()).slice(0, 500);
  console.error(`LlamaParse ${step} failed [${res.status}]`);
  throw new Error(`External OCR ${step} failed [${res.status}]: ${body}`);
}

export const extractWithLlamaParse = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<NormalizedOcr> => {
    const apiKey = process.env["LLAMACLOUD_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "External OCR is not enabled: LLAMACLOUD_API_KEY is not configured on the server.",
      );
    }

    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_BYTES) throw new Error("File exceeds the 20 MB limit.");
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
      throw new Error("Only PDF files are supported.");

    const authHeaders = { Authorization: `Bearer ${apiKey}` };

    // 1. Upload file
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "application/pdf" }), data.fileName);
    form.append("purpose", "parse");
    const upRes = await fetch(`${BASE_URL}/api/v1/beta/files`, {
      method: "POST",
      headers: authHeaders,
      body: form,
    });
    if (!upRes.ok) await failure(upRes, "upload");
    const { id: fileId } = (await upRes.json()) as { id?: string };
    if (!fileId) throw new Error("External OCR upload returned no file id.");

    // 2. Start parse job
    const parseRes = await fetch(`${BASE_URL}/api/v2/parse`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, tier: "fast", version: "latest" }),
    });
    if (!parseRes.ok) await failure(parseRes, "parse start");
    const { id: jobId } = (await parseRes.json()) as { id?: string };
    if (!jobId) throw new Error("External OCR parse returned no job id.");

    // 3. Poll until complete
    try {
      const deadline = Date.now() + 120_000;
      let delay = 3000;
      for (;;) {
        if (Date.now() > deadline) throw new Error("External OCR timed out after 2 minutes.");
        await sleep(delay);
        const poll = await fetch(`${BASE_URL}/api/v2/parse/${jobId}`, { headers: authHeaders });
        if (poll.status === 429 || poll.status >= 500) {
          delay = Math.min(delay * 2, 15_000);
          continue;
        }
        if (!poll.ok) await failure(poll, "status check");
        const body = (await poll.json()) as {
          job?: { status?: string };
          markdown?: unknown;
          text?: unknown;
        };
        const status = body.job?.status;
        if (status === "COMPLETED") {
          const out = normalizeParseResult(body);
          if (!out.pages.some((p) => p.trim())) throw new Error("External OCR returned no text.");
          return out;
        }
        if (status === "ERROR" || status === "CANCELLED") {
          throw new Error(`External OCR job ${(status as string).toLowerCase()}.`);
        }
        delay = 3000;
      }
      // unreachable — loop exits via return or throw
      throw new Error("External OCR timed out.");
    } finally {
      // Clean up uploaded file
      fetch(`${BASE_URL}/api/v1/beta/files/${fileId}`, {
        method: "DELETE",
        headers: authHeaders,
      }).catch(() => {});
    }
  });
