import { describe, expect, it } from "vitest";

import {
  getDocumentFormat,
  MAX_FILE_BYTES,
  validateDocumentFile,
} from "@/lib/services/documentProcessing";

describe("document format validation", () => {
  it("recognizes the supported extensions without case sensitivity", () => {
    expect(getDocumentFormat("tender.PDF")).toBe("pdf");
    expect(getDocumentFormat("bidder.docx")).toBe("docx");
    expect(getDocumentFormat("schedule.xlsx")).toBe("xlsx");
    expect(getDocumentFormat("notes.doc")).toBeNull();
  });

  it("accepts non-empty files through 50 MB and rejects unsupported, empty, and oversized files", () => {
    const supported = new File(["text"], "tender.docx");
    const empty = new File([], "empty.pdf");
    const unsupported = new File(["text"], "notes.doc");
    const atLimit = new File([], "limit.pdf");
    const oversized = new File([], "large.xlsx");
    Object.defineProperty(atLimit, "size", { value: MAX_FILE_BYTES });
    Object.defineProperty(oversized, "size", { value: MAX_FILE_BYTES + 1 });

    expect(validateDocumentFile(supported)).toBeNull();
    expect(validateDocumentFile(atLimit)).toBeNull();
    expect(validateDocumentFile(empty)).toBe("empty");
    expect(validateDocumentFile(unsupported)).toBe("invalid_format");
    expect(validateDocumentFile(oversized)).toBe("too_large");
  });
});
