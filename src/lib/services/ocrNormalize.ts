export interface NormalizedOcr {
  pages: string[];
  /** true only when the provider returned explicit per-page output with page numbers. */
  paginated: boolean;
}

type PageLike = { page_number?: unknown; page?: unknown; text?: unknown; markdown?: unknown; md?: unknown };

function pageText(p: PageLike): string {
  for (const key of ["text", "markdown", "md"] as const) {
    const v = p[key];
    if (typeof v === "string") return v;
  }
  return "";
}

function fromPageArray(list: unknown): NormalizedOcr | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const entries = list.filter((p): p is PageLike => !!p && typeof p === "object");
  const numbered = entries.every((p) => typeof (p.page_number ?? p.page) === "number");
  if (!numbered) return null;
  const max = Math.max(...entries.map((p) => Number(p.page_number ?? p.page)));
  if (!Number.isInteger(max) || max < 1 || max > 5000) return null;
  const pages = Array.from({ length: max }, () => "");
  for (const p of entries) {
    const n = Number(p.page_number ?? p.page);
    if (n >= 1) pages[n - 1] = [pages[n - 1], pageText(p)].filter(Boolean).join("\n");
  }
  return { pages: pages.map((t) => t.trim()), paginated: true };
}

/** Converts a LlamaParse v2 job result into pages without inventing page numbers or text. */
export function normalizeParseResult(result: unknown): NormalizedOcr {
  const r = (result ?? {}) as Record<string, unknown>;
  const candidates = [r["text"], r["markdown"], r["items"]];
  for (const c of candidates) {
    const paged = fromPageArray((c as { pages?: unknown } | undefined)?.pages ?? (Array.isArray(c) ? c : undefined));
    if (paged && paged.pages.some((p) => p)) return paged;
  }
  for (const c of [r["text"], r["markdown"]]) {
    if (typeof c === "string" && c.trim()) return { pages: [c.trim()], paginated: false };
  }
  return { pages: [], paginated: false };
}
