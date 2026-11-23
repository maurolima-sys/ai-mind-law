import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PAGES = 5;
const MAX_RESPONSE_BYTES = 1_000_000;

// Private/loopback CIDR ranges blocked to prevent SSRF
const BLOCKED_HOSTNAMES =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|0\.0\.0\.0)/i;

// ─── Input schema ─────────────────────────────────────────────────────────────

const activityCodeSchema = z.object({
  system: z.string().max(50),
  code: z.string().max(30),
  description: z.string().max(200),
});

const inputSchema = z.object({
  consent: z.literal(true),
  description: z.string().trim().min(10).max(500),
  jurisdiction: z.string().trim().min(2).max(150),
  country: z.string().regex(/^[A-Za-z]{2}$/),
  activityCodes: z.array(activityCodeSchema).max(10).optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiscoveryCandidate {
  id: string;
  title: string;
  issuer: string;
  sourceUrl: string;
  pdfUrl: string;
  pages: number;
  relevanceScore: number;
  publishedDate: string | null;
  description: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw.slice(0, 80)}`);
  }
  if (url.protocol !== "https:") throw new Error("Only HTTPS URLs are allowed.");
  if (url.username || url.password) throw new Error("URLs with credentials are not allowed.");
  if (BLOCKED_HOSTNAMES.test(url.hostname)) throw new Error("URL resolves to a private address.");
  return url;
}

/** Count PDF pages by scanning for /Count in the cross-reference table area. */
function countPdfPages(buffer: Uint8Array): number {
  // Scan last 4 KB for /Count <n> pattern — fast heuristic, not a full parser
  const tail = buffer.slice(Math.max(0, buffer.length - 4096));
  const text = new TextDecoder("latin1").decode(tail);
  const matches = [...text.matchAll(/\/Count\s+(\d+)/g)];
  if (!matches.length) {
    // Fall back to scanning the full buffer (small PDFs)
    const full = new TextDecoder("latin1").decode(buffer);
    const allMatches = [...full.matchAll(/\/Count\s+(\d+)/g)];
    if (!allMatches.length) return 0;
    return Math.max(...allMatches.map((m) => parseInt(m[1] ?? "0", 10)));
  }
  return Math.max(...matches.map((m) => parseInt(m[1] ?? "0", 10)));
}

async function fetchAndValidatePdf(
  pdfUrl: string,
): Promise<{ pages: number; valid: boolean; reason?: string }> {
  const url = assertSafeUrl(pdfUrl);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "application/pdf,*/*" },
    });
  } catch (err) {
    return { pages: 0, valid: false, reason: String(err) };
  }

  if (!response.ok) return { pages: 0, valid: false, reason: `HTTP ${response.status}` };

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
    return { pages: 0, valid: false, reason: `Unexpected content-type: ${contentType}` };
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_PDF_BYTES) {
    return { pages: 0, valid: false, reason: "File too large" };
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  if (buffer.byteLength > MAX_PDF_BYTES)
    return { pages: 0, valid: false, reason: "File too large" };

  // Verify PDF magic bytes
  const magic = new TextDecoder("latin1").decode(buffer.slice(0, 5));
  if (magic !== "%PDF-") return { pages: 0, valid: false, reason: "Not a valid PDF" };

  const pages = countPdfPages(buffer);
  if (pages > MAX_PAGES) return { pages, valid: false, reason: `Too many pages (${pages})` };
  if (pages === 0) return { pages: 0, valid: false, reason: "Could not determine page count" };

  return { pages, valid: true };
}

// ─── Firecrawl response schema ────────────────────────────────────────────────

const firecrawlResultSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      web: z
        .array(
          z
            .object({
              url: z.string().optional(),
              title: z.string().nullish(),
              description: z.string().nullish(),
              summary: z.string().nullish(),
              publishedDate: z.string().nullish(),
              metadata: z
                .object({
                  publishedDate: z.string().nullish(),
                  author: z.string().nullish(),
                  siteName: z.string().nullish(),
                })
                .passthrough()
                .optional(),
            })
            .passthrough(),
        )
        .optional(),
    })
    .passthrough(),
});

// ─── Server function ──────────────────────────────────────────────────────────

export const discoverDocuments = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<DiscoveryCandidate[]> => {
    const apiKey = process.env["FIRECRAWL_API_KEY"];
    if (!apiKey)
      throw new Error("Smart Document Discovery requires FIRECRAWL_API_KEY on the server.");

    // Build a query that targets official sources and PDF files
    const langTerms =
      data.country.toUpperCase() === "BR"
        ? "edital licitação concurso público filetype:pdf"
        : data.country.toUpperCase() === "PT"
          ? "concurso público edital filetype:pdf"
          : "request for proposal tender procurement filetype:pdf";

    const activityContext =
      data.activityCodes && data.activityCodes.length > 0
        ? data.activityCodes.map((a) => a.description).join(" ")
        : "";

    const query =
      `${data.jurisdiction} ${data.description} ${activityContext} ${langTerms} site:.gov OR site:.gov.br OR site:.europa.eu`
        .replace(/\s+/g, " ")
        .trim();

    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 10,
        country: data.country.toUpperCase(),
        scrapeOptions: { formats: [{ type: "summary" }] },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl search failed [${response.status}]. Try again.`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      throw new Error("Search returned too much content. Narrow the description.");
    }
    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
      throw new Error("Search returned too much content. Narrow the description.");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error("Search returned invalid JSON.");
    }

    const parsed = firecrawlResultSchema.safeParse(payload);
    if (!parsed.success || !parsed.data.data.web?.length) return [];

    // Filter to results that look like PDF links
    const pdfCandidates = parsed.data.data.web.filter((r) => {
      if (!r.url) return false;
      const lower = r.url.toLowerCase();
      return lower.endsWith(".pdf") || lower.includes(".pdf?") || lower.includes("/pdf/");
    });

    // Validate each PDF candidate in parallel (capped at 5)
    const toValidate = pdfCandidates.slice(0, 5);
    const validationResults = await Promise.allSettled(
      toValidate.map(async (result, index) => {
        const pdfUrl = result.url!;

        let safeUrl: URL;
        try {
          safeUrl = assertSafeUrl(pdfUrl);
        } catch {
          return null;
        }

        const validation = await fetchAndValidatePdf(safeUrl.toString());
        if (!validation.valid) return null;

        const publishedDate = result.publishedDate ?? result.metadata?.publishedDate ?? null;

        const issuer =
          result.metadata?.siteName?.trim() ||
          result.metadata?.author?.trim() ||
          (() => {
            try {
              return new URL(pdfUrl).hostname.replace(/^www\./, "");
            } catch {
              return "Unknown issuer";
            }
          })();

        const candidate: DiscoveryCandidate = {
          id: `disc-${Date.now()}-${index}`,
          title: (result.title?.trim() || pdfUrl.split("/").pop() || "Untitled document").slice(
            0,
            200,
          ),
          issuer: issuer.slice(0, 150),
          sourceUrl: pdfUrl.slice(0, 2048),
          pdfUrl: pdfUrl.slice(0, 2048),
          pages: validation.pages,
          relevanceScore: Math.max(0, 100 - index * 15),
          publishedDate: publishedDate?.slice(0, 80) ?? null,
          description: (result.description?.trim() ?? result.summary?.trim() ?? "").slice(0, 400),
        };
        return candidate;
      }),
    );

    return validationResults
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((c): c is DiscoveryCandidate => c !== null);
  });
