import { Schema } from "firebase/ai";
import { z } from "zod";

const findingSchema = z.object({
  description: z.string().min(1),
  category: z.enum([
    "Technical",
    "Administrative",
    "Legal",
    "Financial",
    "Eligibility",
    "Documentation",
    "Delivery",
  ]),
  mandatory: z.boolean(),
  confidence: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v))
    .pipe(z.number().min(0).max(1)),
  page: z.number().int().positive(),
  excerpt: z.string().min(1),
});

const deadlineSchema = z.object({
  description: z.string().min(1),
  date: z.string().nullable(),
  relatedRequirement: z.string().nullable(),
  page: z.number().int().positive(),
  excerpt: z.string().min(1),
});

const specificationSchema = z.object({
  item: z.string().min(1),
  quantity: z
    .union([z.string(), z.number()])
    .nullable()
    .transform((v) => (v === null ? null : String(v))),
  unit: z
    .union([z.string(), z.number()])
    .nullable()
    .transform((v) => (v === null ? null : String(v))),
  details: z.string().min(1),
  notes: z
    .string()
    .nullable()
    .transform((v) => v ?? ""),
  page: z.number().int().positive(),
  excerpt: z.string().min(1),
});

const riskSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(["Critical", "High", "Medium", "Low"]),
  kind: z.enum(["detected", "suggestion"]),
  explanation: z.string().min(1),
  page: z.number().int().positive(),
  excerpt: z.string().min(1),
});

export const chunkResponseSchema = z.object({
  summary: z.string().min(1),
  requirements: z.array(findingSchema),
  deadlines: z.array(deadlineSchema),
  specifications: z.array(specificationSchema),
  risks: z.array(riskSchema),
  missing: z.array(z.string()),
  inconsistencies: z.array(z.string()),
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
          page: Schema.integer(),
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
          page: Schema.integer(),
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
          page: Schema.integer(),
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
          page: Schema.integer(),
          excerpt: Schema.string(),
        },
      }),
    }),
    missing: Schema.array({ items: Schema.string() }),
    inconsistencies: Schema.array({ items: Schema.string() }),
  },
});
