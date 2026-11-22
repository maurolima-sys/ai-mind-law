import type { DocumentFormat } from "@/lib/types";

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 5_000;
const MAX_EXPANDED_OFFICE_BYTES = 100 * 1024 * 1024;
const MAX_EXTRACTED_CHARACTERS = 2_000_000;
const MAX_SEGMENT_CHARACTERS = 8_000;

export function getDocumentFormat(fileName: string): DocumentFormat | null {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "pdf" || extension === "docx" || extension === "xlsx") return extension;
  return null;
}

export type FileValidationError = "invalid_format" | "empty" | "too_large";

export function validateDocumentFile(file: File): FileValidationError | null {
  const format = getDocumentFormat(file.name);
  if (!format) return "invalid_format";
  if (file.size === 0) return "empty";
  if (file.size > MAX_FILE_BYTES) return "too_large";
  return null;
}

function assertSignature(bytes: Uint8Array, format: DocumentFormat) {
  const isPdf = format === "pdf" && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  const isZipOffice =
    (format === "docx" || format === "xlsx") && bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (!isPdf && !isZipOffice) {
    throw new Error(`The file contents do not match the .${format} extension.`);
  }
}

async function validateOfficeArchive(file: File) {
  const tailSize = Math.min(file.size, 65_557);
  const tailStart = file.size - tailSize;
  const tail = new DataView(await file.slice(tailStart).arrayBuffer());
  let endOffset = -1;

  for (let offset = tail.byteLength - 22; offset >= 0; offset--) {
    if (tail.getUint32(offset, true) !== 0x06054b50) continue;
    const commentLength = tail.getUint16(offset + 20, true);
    if (offset + 22 + commentLength === tail.byteLength) {
      endOffset = offset;
      break;
    }
  }

  if (endOffset < 0) throw new Error("The Office file is not a valid ZIP archive.");
  const entries = tail.getUint16(endOffset + 10, true);
  const directorySize = tail.getUint32(endOffset + 12, true);
  const directoryOffset = tail.getUint32(endOffset + 16, true);

  if (entries === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) {
    throw new Error("Office files using ZIP64 are not supported.");
  }
  if (entries > MAX_ARCHIVE_ENTRIES) {
    throw new Error("The Office file contains too many internal entries.");
  }
  if (directoryOffset + directorySize > file.size) {
    throw new Error("The Office file has an invalid ZIP directory.");
  }

  const directory = new DataView(
    await file.slice(directoryOffset, directoryOffset + directorySize).arrayBuffer(),
  );
  let offset = 0;
  let expandedSize = 0;
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > directory.byteLength || directory.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("The Office file has a malformed ZIP directory.");
    }
    const uncompressedSize = directory.getUint32(offset + 24, true);
    const nameLength = directory.getUint16(offset + 28, true);
    const extraLength = directory.getUint16(offset + 30, true);
    const commentLength = directory.getUint16(offset + 32, true);
    if (uncompressedSize === 0xffffffff) {
      throw new Error("Office files using ZIP64 are not supported.");
    }
    expandedSize += uncompressedSize;
    if (expandedSize > MAX_EXPANDED_OFFICE_BYTES) {
      throw new Error("The expanded Office file exceeds the 100 MB safety limit.");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (offset > directory.byteLength)
    throw new Error("The Office file has a malformed ZIP directory.");
}

function splitIntoSegments(entries: Array<{ label: string; text: string }>): {
  pages: string[];
  sourceLocations: string[];
} {
  const pages: string[] = [];
  const sourceLocations: string[] = [];
  let currentText = "";
  let currentLabels: string[] = [];
  let totalCharacters = 0;

  const flush = () => {
    if (!currentText) return;
    const firstLabel = currentLabels[0];
    const lastLabel = currentLabels.at(-1);
    if (!firstLabel || !lastLabel) {
      throw new Error("Document source locations could not be determined.");
    }
    pages.push(currentText);
    sourceLocations.push(currentLabels.length === 1 ? firstLabel : `${firstLabel}–${lastLabel}`);
    currentText = "";
    currentLabels = [];
  };

  for (const entry of entries) {
    const text = entry.text.trim();
    if (!text) continue;
    totalCharacters += text.length;
    if (totalCharacters > MAX_EXTRACTED_CHARACTERS) {
      throw new Error("Extracted text exceeds the 2 million character safety limit.");
    }
    for (let offset = 0; offset < text.length; offset += MAX_SEGMENT_CHARACTERS) {
      const fragment = text.slice(offset, offset + MAX_SEGMENT_CHARACTERS);
      if (currentText && currentText.length + fragment.length + 1 > MAX_SEGMENT_CHARACTERS) flush();
      currentText = currentText ? `${currentText}\n${fragment}` : fragment;
      if (currentLabels.at(-1) !== entry.label) currentLabels.push(entry.label);
    }
  }
  flush();

  if (pages.length === 0) throw new Error("No readable text was found in this document.");
  return { pages, sourceLocations };
}

/** Extract one string per PDF page. Call only from the browser. */
export async function extractPdfText(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  assertSignature(new Uint8Array(await file.slice(0, 5).arrayBuffer()), "pdf");
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await loadingTask.promise;
  try {
    if (doc.numPages > 2_000) throw new Error("PDFs with more than 2,000 pages are not supported.");
    const pages: string[] = [];
    let totalCharacters = 0;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        if (typeof item.str === "string") text += item.str + (item.hasEOL ? "\n" : " ");
      }
      const pageText = text
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      totalCharacters += pageText.length;
      if (totalCharacters > MAX_EXTRACTED_CHARACTERS) {
        throw new Error("Extracted text exceeds the 2 million character safety limit.");
      }
      pages.push(pageText);
      onProgress?.(i, doc.numPages);
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}

export async function extractDocxText(file: File) {
  assertSignature(new Uint8Array(await file.slice(0, 4).arrayBuffer()), "docx");
  await validateOfficeArchive(file);
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  const paragraphs = value
    .split(/\r?\n/)
    .map((text) => text.trim())
    .filter(Boolean);
  return splitIntoSegments(
    paragraphs.map((text, index) => ({ label: `Paragraph ${index + 1}`, text })),
  );
}

function spreadsheetCellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record["formula"] === "string") return `Formula: ${record["formula"]}`;
  if (Array.isArray(record["richText"])) {
    return record["richText"]
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part ? String(part["text"]) : "",
      )
      .join("");
  }
  if (typeof record["text"] === "string") return record["text"];
  if (typeof record["error"] === "string") return `Error value: ${record["error"]}`;
  return "";
}

export async function extractXlsxText(file: File) {
  assertSignature(new Uint8Array(await file.slice(0, 4).arrayBuffer()), "xlsx");
  await validateOfficeArchive(file);
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  if (workbook.worksheets.length > 200) {
    throw new Error("Workbooks with more than 200 worksheets are not supported.");
  }

  const entries: Array<{ label: string; text: string }> = [];
  for (const worksheet of workbook.worksheets) {
    const rows: Array<{ number: number; text: string }> = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
        const value = spreadsheetCellText(cell.value);
        if (value) values.push(`Column ${columnNumber}: ${value}`);
      });
      if (values.length > 0) rows.push({ number: rowNumber, text: values.join(" | ") });
    });

    for (let index = 0; index < rows.length; index += 20) {
      const group = rows.slice(index, index + 20);
      const firstRow = group[0];
      const lastRow = group.at(-1);
      if (!firstRow || !lastRow) continue;
      entries.push({
        label: `Sheet "${worksheet.name}", rows ${firstRow.number}–${lastRow.number}`,
        text: group.map((row) => `Row ${row.number}: ${row.text}`).join("\n"),
      });
    }
  }

  return splitIntoSegments(entries);
}

export const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1048576).toFixed(1)} MB`;
