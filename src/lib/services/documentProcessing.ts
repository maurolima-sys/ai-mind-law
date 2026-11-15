export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function validatePdf(file: File): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are supported.";
  if (file.size > MAX_FILE_BYTES) return "File exceeds the 20 MB limit.";
  return null;
}

/** Real in-browser text extraction with pdf.js. Returns one string per page. Call only from the browser. */
export async function extractPdfText(file: File, onProgress?: (done: number, total: number) => void): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
      if (typeof item.str === "string") text += item.str + (item.hasEOL ? "\n" : " ");
    }
    pages.push(text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim());
    onProgress?.(i, doc.numPages);
  }
  return pages;
}

export const formatBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);
