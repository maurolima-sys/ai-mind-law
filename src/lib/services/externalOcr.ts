import { extractWithLlamaParse } from "@/lib/services/ocr.functions";
import type { NormalizedOcr } from "@/lib/services/ocrNormalize";

async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Sends the PDF to LlamaParse via the server. Caller must have explicit OCR consent. */
export async function runExternalOcr(file: File, consent: boolean): Promise<NormalizedOcr> {
  if (!consent) throw new Error("Allow external text extraction before sending this PDF to LlamaParse.");
  return extractWithLlamaParse({ data: { consent: true, fileName: file.name, base64: await toBase64(file) } });
}
