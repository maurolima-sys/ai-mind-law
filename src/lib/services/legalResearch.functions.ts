import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { normalizeLegalResearchResults } from "@/lib/services/legalResearch";

const inputSchema = z.object({
  consent: z.literal(true),
  question: z.string().trim().min(5).max(300),
  jurisdiction: z.string().trim().min(2).max(150),
  country: z.string().regex(/^[A-Za-z]{2}$/),
});

const MAX_RESPONSE_BYTES = 1_000_000;

export const checkLegalResearchAvailability = createServerFn({ method: "GET" }).handler(async () =>
  Boolean(process.env["FIRECRAWL_API_KEY"]),
);

export const searchLegalSources = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["FIRECRAWL_API_KEY"];
    if (!apiKey) {
      throw new Error("External legal research is not configured on the server.");
    }

    const legalTerms =
      data.country.toUpperCase() === "BR"
        ? "legislação jurisprudência"
        : "statute regulation case law";
    const query = `${data.jurisdiction} ${data.question} ${legalTerms}`;
    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 5,
        country: data.country.toUpperCase(),
        scrapeOptions: { formats: [{ type: "summary" }] },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      console.error(`Firecrawl legal research failed [${response.status}]`);
      throw new Error(`External legal research failed [${response.status}]. Try again.`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      throw new Error("External legal research returned too much content. Narrow the question.");
    }
    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
      throw new Error("External legal research returned too much content. Narrow the question.");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Invalid JSON response";
      throw new Error(`External legal research returned invalid JSON: ${detail}`);
    }
    return normalizeLegalResearchResults(payload);
  });
