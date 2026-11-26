import { Schema } from "firebase/ai";
import { z } from "zod";

const findingSchema = z.object({
  description: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  category: z
    .string()
    .transform((v) => {
      const normalized = v.trim();
      const valid = [
        "Technical",
        "Administrative",
        "Legal",
        "Financial",
        "Eligibility",
        "Documentation",
        "Delivery",
      ];
      const match = valid.find((c) => c.toLowerCase() === normalized.toLowerCase());
      return match ?? "Technical";
    })
    .pipe(
      z.enum([
        "Technical",
        "Administrative",
        "Legal",
        "Financial",
        "Eligibility",
        "Documentation",
        "Delivery",
      ]),
    ),
  mandatory: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "string" ? v.toLowerCase() !== "false" && v !== "0" : v)),
  confidence: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => (v === null ? 0.5 : typeof v === "string" ? parseFloat(v) : v))
    .pipe(z.number().min(0).max(1).catch(0.5)),
  sourceIndex: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
    .pipe(z.number().int().min(0).catch(1)),
  excerpt: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
});

const deadlineSchema = z.object({
  description: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  date: z.string().nullable().default(null),
  relatedRequirement: z.string().nullable().default(null),
  sourceIndex: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
    .pipe(z.number().int().min(0).catch(1)),
  excerpt: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
});

const specificationSchema = z.object({
  item: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  quantity: z
    .union([z.string(), z.number()])
    .nullable()
    .default(null)
    .transform((v) => (v === null ? null : String(v))),
  unit: z
    .union([z.string(), z.number()])
    .nullable()
    .default(null)
    .transform((v) => (v === null ? null : String(v))),
  details: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  notes: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  sourceIndex: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
    .pipe(z.number().int().min(0).catch(1)),
  excerpt: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
});

const riskSchema = z.object({
  title: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  severity: z
    .string()
    .transform((v) => {
      const normalized = v.trim();
      const valid = ["Critical", "High", "Medium", "Low"];
      const match = valid.find((s) => s.toLowerCase() === normalized.toLowerCase());
      return match ?? "Medium";
    })
    .pipe(z.enum(["Critical", "High", "Medium", "Low"])),
  kind: z
    .string()
    .transform((v) => {
      const normalized = v.trim().toLowerCase();
      return normalized === "suggestion" ? "suggestion" : "detected";
    })
    .pipe(z.enum(["detected", "suggestion"])),
  explanation: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  sourceIndex: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
    .pipe(z.number().int().min(0).catch(1)),
  excerpt: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
});

// Array bounds guard against GHSA-mrhx-c7xc-m3w5 (Zod DoS via oversized constrained
// collections). Limits are set well above any realistic tender analysis output.
export const chunkResponseSchema = z.object({
  summary: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => v ?? ""),
  requirements: z.array(findingSchema).max(500),
  deadlines: z.array(deadlineSchema).max(500),
  specifications: z.array(specificationSchema).max(500),
  risks: z.array(riskSchema).max(200),
  missing: z.array(z.string()).max(200),
  inconsistencies: z.array(z.string()).max(200),
});

export const TENDER_ANALYSIS_RESPONSE_SCHEMA = Schema.object({
  properties: {
    summary: Schema.string(),
    requirements: Schema.array({
      items: Schema.object({
        properties: {
          description: Schema.string(),
          category: Schema.enumString({
            enum: [
              "Technical",
              "Administrative",
              "Legal",
              "Financial",
              "Eligibility",
              "Documentation",
              "Delivery",
            ],
          }),
          mandatory: Schema.boolean(),
          confidence: Schema.number(),
          sourceIndex: Schema.integer(),
          excerpt: Schema.string(),
        },
      }),
    }),
    deadlines: Schema.array({
      items: Schema.object({
        properties: {
          description: Schema.string(),
          date: Schema.string({ nullable: true }),
          relatedRequirement: Schema.string({ nullable: true }),
          sourceIndex: Schema.integer(),
          excerpt: Schema.string(),
        },
      }),
    }),
    specifications: Schema.array({
      items: Schema.object({
        properties: {
          item: Schema.string(),
          quantity: Schema.string({ nullable: true }),
          unit: Schema.string({ nullable: true }),
          details: Schema.string(),
          notes: Schema.string({ nullable: true }),
          sourceIndex: Schema.integer(),
          excerpt: Schema.string(),
        },
      }),
    }),
    risks: Schema.array({
      items: Schema.object({
        properties: {
          title: Schema.string(),
          severity: Schema.enumString({ enum: ["Critical", "High", "Medium", "Low"] }),
          kind: Schema.enumString({ enum: ["detected", "suggestion"] }),
          explanation: Schema.string(),
          sourceIndex: Schema.integer(),
          excerpt: Schema.string(),
        },
      }),
    }),
    missing: Schema.array({ items: Schema.string() }),
    inconsistencies: Schema.array({ items: Schema.string() }),
  },
});
