import { Schema } from "firebase/ai";
import { z } from "zod";

export const evidenceMatchResponseSchema = z.object({
  assessment: z.enum(["supports", "contradicts", "insufficient"]),
  confidence: z
    .union([z.number(), z.string()])
    .transform((value) => (typeof value === "string" ? Number.parseFloat(value) : value))
    .pipe(z.number().min(0).max(1)),
  explanation: z.string().min(1),
  sourceIndex: z.number().int().positive(),
  excerpt: z.string().min(1),
});

export const EVIDENCE_MATCH_RESPONSE_SCHEMA = Schema.object({
  properties: {
    assessment: Schema.enumString({ enum: ["supports", "contradicts", "insufficient"] }),
    confidence: Schema.number(),
    explanation: Schema.string(),
    sourceIndex: Schema.integer(),
    excerpt: Schema.string(),
  },
});
