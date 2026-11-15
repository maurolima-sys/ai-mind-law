import type { Evidence } from "../types";

export const normalize = (s: string) => s.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, " ").trim();

/** An excerpt is verified only if it literally appears (whitespace/case-insensitive) on the cited page. */
export function verifyEvidence(pages: string[], page: number | null | undefined, excerpt: string | null | undefined): Evidence {
  const p = typeof page === "number" && page >= 1 && page <= pages.length ? page : null;
  const ex = excerpt && excerpt.trim() ? excerpt.trim() : null;
  if (p === null || ex === null) return { page: p, excerpt: ex, verified: false };
  return { page: p, excerpt: ex, verified: normalize(pages[p - 1]).includes(normalize(ex)) };
}

/** Unverified evidence caps confidence at 0.3 so it is flagged for review. */
export function scoreConfidence(raw: number, evidence: Evidence): number {
  const c = Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 0.5));
  return evidence.verified ? c : Math.min(c, 0.3);
}

export function confidenceLabel(c: number): "High" | "Medium" | "Low" {
  return c >= 0.75 ? "High" : c >= 0.5 ? "Medium" : "Low";
}

export const needsReview = (e: Evidence, confidence = 1) => !e.verified || confidence < 0.5;
