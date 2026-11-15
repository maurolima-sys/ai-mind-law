import type { Requirement, Review } from "../types";

export const COMPLIANCE_COLUMNS = ["Requirement", "Category", "Mandatory", "Evidence", "Page", "Evidence verified", "Review status", "Notes"];

const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function complianceCsv(reqs: Requirement[], reviews: Record<string, Review | undefined>): string {
  const rows = reqs.map((r) => {
    const rv = reviews[r.id];
    return [r.description, r.category, r.mandatory ? "Mandatory" : "Optional", r.evidence.excerpt ?? "Evidence not available",
      r.evidence.page?.toString() ?? "", r.evidence.verified ? "Yes" : "No", rv?.status ?? "pending", rv?.notes ?? ""].map(esc).join(",");
  });
  return [COMPLIANCE_COLUMNS.join(","), ...rows].join("\n");
}

export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
