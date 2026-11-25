export interface NormalizedOcr {
  pages: string[];
  /** true only when the provider returned explicit per-page output with page numbers. */
  paginated: boolean;
}

export function pagesNeedingExternalOcr(pages: string[]): number[] {
  return pages.flatMap((page, index) => (needsExternalOcr(page) ? [index + 1] : []));
}

function needsExternalOcr(page: string): boolean {
  const text = page
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return true;

  const words = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (text.length < 80 || words.length < 12) return true;

  const replacementCharacters = (text.match(/\uFFFD/g) ?? []).length;
  if (replacementCharacters > 3) return true;

  const letters = (text.match(/[\p{L}]/gu) ?? []).length;
  return letters / Math.max(text.length, 1) < 0.35;
}

export function shouldOfferExternalOcr(pages: string[]): boolean {
  return pages.length === 0 || pagesNeedingExternalOcr(pages).length > 0;
}

export function mergeOcrPageText(nativePages: string[], ocrPages: string[]): string[] {
  return nativePages.map((nativeText, index) => {
    const ocrText = ocrPages[index]?.trim();
    if (!ocrText) return nativeText;
    if (!nativeText.trim()) return ocrText;

    const normalizedNative = nativeText.replace(/\s+/g, " ").trim();
    const normalizedOcr = ocrText.replace(/\s+/g, " ").trim();
    if (normalizedNative.includes(normalizedOcr)) return nativeText;
    if (normalizedOcr.includes(normalizedNative)) return ocrText;
    return `${nativeText.trim()}\n${ocrText}`;
  });
}

type PageLike = {
  page_number?: unknown;
  page?: unknown;
  text?: unknown;
  markdown?: unknown;
  md?: unknown;
};

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
    const paged = fromPageArray(
      (c as { pages?: unknown } | undefined)?.pages ?? (Array.isArray(c) ? c : undefined),
    );
    if (paged && paged.pages.some((p) => p)) return paged;
  }
  for (const c of [r["text"], r["markdown"]]) {
    if (typeof c === "string" && c.trim()) return { pages: [c.trim()], paginated: false };
  }
  return { pages: [], paginated: false };
}
