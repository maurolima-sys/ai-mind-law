export interface NormalizedOcr {
  pages: string[];
  /** true only when the provider returned explicit per-page output with page numbers. */
  paginated: boolean;
}

// Below 1,500 selectable characters, a page may be a cover, contents page,
// signature sheet, or incomplete extraction. Preserve it in a completeness
// warning; only offer OCR when enough weighted pages need it.
export const MIN_ADEQUATE_PAGE_CHARACTERS = 1500;
const MIN_SPARSE_RATIO = 0.3;

export type PageTextClassification = {
  kind: "empty" | "sparse" | "adequate";
  characterCount: number;
};

export function classifyPageText(page: string): PageTextClassification {
  const text = normalizePageText(page);
  if (!text) return { kind: "empty", characterCount: 0 };

  const words = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  const replacementCharacters = (text.match(/\uFFFD/g) ?? []).length;
  const letters = (text.match(/[\p{L}]/gu) ?? []).length;
  const poorTextQuality =
    words.length < 12 || replacementCharacters > 3 || letters / text.length < 0.35;
  return {
    kind: text.length < MIN_ADEQUATE_PAGE_CHARACTERS || poorTextQuality ? "sparse" : "adequate",
    characterCount: text.length,
  };
}

export function pagesWithInsufficientText(pages: string[]): number[] {
  return pages.flatMap((page, index) =>
    classifyPageText(page).kind === "adequate" ? [] : [index + 1],
  );
}

export function pagesAnalysedWithoutOcr(
  pages: string[],
  pageExtractionMethods: Array<string | undefined> = [],
): number[] {
  return pagesWithInsufficientText(pages).filter(
    (pageNumber) => pageExtractionMethods[pageNumber - 1] !== "ocr",
  );
}

export function pagesNeedingExternalOcr(pages: string[]): number[] {
  if (pages.length === 0) return [];
  const insufficient = pagesWithInsufficientText(pages);
  const weightedCount = insufficient.reduce(
    (weight, pageNumber) =>
      weight + (classifyPageText(pages[pageNumber - 1] ?? "").kind === "empty" ? 2 : 1),
    0,
  );
  return weightedCount / pages.length >= MIN_SPARSE_RATIO ? insufficient : [];
}

function normalizePageText(page: string): string {
  return page
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function shouldOfferExternalOcr(pages: string[]): boolean {
  return pages.length === 0 || pagesNeedingExternalOcr(pages).length > 0;
}

/** Exposed for tests only. */
export { MIN_SPARSE_RATIO };

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
