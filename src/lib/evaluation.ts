import { z } from "zod";

export type EvaluationCategory = "Frontend" | "Backend" | "Hackathon Readiness";

export interface EvaluationCriterion {
  id: string;
  category: EvaluationCategory;
  section: string;
  title: string;
  description: string;
  critical?: boolean;
}

export const EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: "dashboard",
    category: "Frontend",
    section: "Workflow",
    title: "Dashboard and document workflow",
    description: "Verify the fictional sample and the complete document review journey.",
  },
  {
    id: "analysis",
    category: "Frontend",
    section: "Workflow",
    title: "Document analysis and source evidence",
    description: "Verify findings, source excerpts, and source verification labels.",
  },
  {
    id: "matrix",
    category: "Frontend",
    section: "Workflow",
    title: "Compliance matrix review",
    description: "Verify the matrix, review states, notes, and CSV export.",
  },
  {
    id: "qa-ui",
    category: "Frontend",
    section: "Workflow",
    title: "Document Q&A",
    description: "Verify questions, answers, and citation labels in the analysis screen.",
  },
  {
    id: "mode",
    category: "Frontend",
    section: "Privacy",
    title: "Processing mode selection",
    description: "Verify demo, on-device, cloud, and hybrid selection.",
  },
  {
    id: "consent",
    category: "Frontend",
    section: "Privacy",
    title: "Cloud consent",
    description: "Verify explicit consent is required before cloud processing.",
  },
  {
    id: "source",
    category: "Frontend",
    section: "Privacy",
    title: "Inference source reporting",
    description: "Verify the observed source is accurately displayed after inference.",
  },
  {
    id: "responsive",
    category: "Frontend",
    section: "Experience",
    title: "Responsive layout",
    description: "Test desktop, tablet, and mobile layouts.",
  },
  {
    id: "accessibility",
    category: "Frontend",
    section: "Experience",
    title: "Keyboard and screen reader access",
    description: "Verify keyboard navigation, focus, and accessible names.",
  },
  {
    id: "languages",
    category: "Frontend",
    section: "Experience",
    title: "English, Portuguese, and Spanish",
    description: "Review translations and long strings, including small screens.",
  },
  {
    id: "firebase-runtime",
    category: "Backend",
    section: "Inference",
    title: "Firebase AI Logic runtime integration",
    description: "Demonstrate an actual SDK inference call, not configuration alone.",
  },
  {
    id: "on-device",
    category: "Backend",
    section: "Inference",
    title: "On-device inference",
    description: "Retest a complete Chrome on-device analysis after the reported timeout.",
    critical: true,
  },
  {
    id: "cloud",
    category: "Backend",
    section: "Inference",
    title: "Cloud inference",
    description:
      "Production Cloud analysis verified 2026-11-19: cloud-fallback, gemini-3.5-flash-lite, full structured output, all excerpts verified:true. Input was the fictional sample text. Evidence: docs/Riverside Civic Centre - Construction Tender-analysis.json.",
    critical: true,
  },
  {
    id: "hybrid",
    category: "Backend",
    section: "Inference",
    title: "Hybrid fallback",
    description: "Verify on-device-first behaviour, consent, fallback, and source reporting.",
  },
  {
    id: "app-check-init",
    category: "Backend",
    section: "Security",
    title: "App Check initialization",
    description: "Verify the configured provider initializes before model calls.",
  },
  {
    id: "app-check-production",
    category: "Backend",
    section: "Security",
    title: "Production App Check acceptance",
    description:
      "Verified 2026-11-19: limited-use App Check token accepted in production. exchangeRecaptchaEnterpriseToken → generateContent → 200. Fix: useLimitedUseAppCheckTokens:true in getAI(). Evidence: commit ef4a84d.",
    critical: true,
  },
  {
    id: "response-schema",
    category: "Backend",
    section: "Validation",
    title: "Structured response schema",
    description: "Verify structured output is constrained and accepted in a real cloud analysis.",
  },
  {
    id: "zod",
    category: "Backend",
    section: "Validation",
    title: "Zod validation",
    description: "Verify valid and invalid responses are handled correctly.",
  },
  {
    id: "fallback",
    category: "Backend",
    section: "Inference",
    title: "Model fallback and retry",
    description: "Verify fallback and retry behaviour against observed or reproducible tests.",
  },
  {
    id: "pdf",
    category: "Backend",
    section: "Documents",
    title: "Local PDF.js extraction",
    description: "Verify text extraction remains local before explicit cloud consent.",
  },
  {
    id: "ocr",
    category: "Backend",
    section: "Documents",
    title: "LlamaParse scanned PDF OCR",
    description: "Verify the full OCR workflow with a scanned PDF and separate document consent.",
    critical: true,
  },
  {
    id: "qa-inference",
    category: "Backend",
    section: "Inference",
    title: "Q&A inference path",
    description: "Verify follow-up questions use the selected inference path.",
  },
  {
    id: "persistence",
    category: "Backend",
    section: "Storage",
    title: "Local workspace persistence",
    description: "Verify document integrity, isolation, persistence, and recovery.",
  },
  {
    id: "implementation",
    category: "Hackathon Readiness",
    section: "Scoring",
    title: "Technological implementation evidence",
    description: "Gather reproducible evidence for Firebase AI Logic and source reporting.",
  },
  {
    id: "design",
    category: "Hackathon Readiness",
    section: "Scoring",
    title: "Design and usability",
    description: "Verify the evaluator can complete the demonstrated workflow.",
  },
  {
    id: "impact",
    category: "Hackathon Readiness",
    section: "Scoring",
    title: "Potential impact",
    description: "Document the procurement problem and evidence of the workflow's value.",
  },
  {
    id: "idea",
    category: "Hackathon Readiness",
    section: "Scoring",
    title: "Quality of the idea",
    description: "Explain and demonstrate privacy-by-choice and source transparency.",
  },
  {
    id: "repository",
    category: "Hackathon Readiness",
    section: "Submission",
    title: "Public GitHub repository",
    description:
      "Verified: https://github.com/maurolima-sys/ai-mind-law is public and accessible without authentication.",
  },
  {
    id: "license",
    category: "Hackathon Readiness",
    section: "Submission",
    title: "Apache 2.0 licence",
    description:
      "Verified: LICENSE file present at repository root, Apache 2.0, correct copyright header.",
  },
  {
    id: "hosted",
    category: "Hackathon Readiness",
    section: "Submission",
    title: "Hosted demo",
    description:
      "Verified: https://ai-mind-law.vercel.app/ loads without authentication. Dashboard, Processing, Analysis, and Compliance matrix screens confirmed reachable. Cloud AI analysis completed in production 2026-11-19.",
  },
  {
    id: "walkthrough",
    category: "Hackathon Readiness",
    section: "Documentation",
    title: "Evaluator walkthrough accuracy",
    description:
      "Updated 2026-11-19: walkthrough reflects production Cloud AI verification, correct fallback chain order (gemini-3.8-flash first), App Check confirmed, test count updated to 107. Evidence: docs/EVALUATOR_WALKTHROUGH.md commit 1e3c477.",
  },
  {
    id: "matrix-doc",
    category: "Hackathon Readiness",
    section: "Documentation",
    title: "Reconcile matrix status names",
    description: "Compare the guide's review statuses with the actual interface.",
  },
  {
    id: "test-count",
    category: "Hackathon Readiness",
    section: "Documentation",
    title: "Reconcile test counts",
    description:
      "Verified: 107 tests across 29 test files (npm test). Walkthrough updated from '11 tests' to '107 tests (29 files)'. Evidence: commit 1e3c477.",
  },
  {
    id: "ci-triggers",
    category: "Hackathon Readiness",
    section: "Documentation",
    title: "Reconcile CI triggers",
    description: "Verify the actual push and pull request triggers before updating the guide.",
  },
  {
    id: "secrets-audit",
    category: "Hackathon Readiness",
    section: "Documentation",
    title: "Review environment files and secrets",
    description:
      "Verified: .env.local has zero Git history (git log -- .env.local returns empty). .env committed in c9eb502 contains only public Firebase client config. No secrets in Git history. Debug token read via build-time define only in dev builds (commit 78bbab8).",
    critical: true,
  },
  {
    id: "video",
    category: "Hackathon Readiness",
    section: "Submission",
    title: "Demo video",
    description: "Prepare and verify the English demonstration video and submission requirements.",
  },
  {
    id: "submission",
    category: "Hackathon Readiness",
    section: "Submission",
    title: "Final submission checklist",
    description: "Verify all submission requirements and supporting evidence.",
  },
];

export const statusSchema = z.enum(["pending", "in_progress", "verified", "blocked"]);
export type EvaluationStatus = z.infer<typeof statusSchema>;
const timestampSchema = z.string().datetime();
const recordSchema = z
  .object({
    status: statusSchema,
    evidence: z.string().max(5000),
    reference: z.string().max(2000),
    notes: z.string().max(5000),
    verifier: z.string().max(200),
    updatedAt: timestampSchema.nullable(),
    verifiedAt: timestampSchema.nullable(),
  })
  .strict()
  .refine(
    (record) =>
      record.status !== "verified" ||
      (record.evidence.trim().length > 0 && record.verifiedAt !== null),
    "Verified criteria require evidence and a verification timestamp.",
  );
export type EvaluationRecord = z.infer<typeof recordSchema>;
const historySchema = z
  .object({
    criterionId: z.string(),
    previousStatus: statusSchema,
    newStatus: statusSchema,
    timestamp: timestampSchema,
    notes: z.string().max(5000),
  })
  .strict();
const stateSchema = z
  .object({
    version: z.literal(1),
    records: z.record(recordSchema),
    history: z.array(historySchema),
  })
  .strict();
export type EvaluationState = z.infer<typeof stateSchema>;

export const EVALUATION_STORAGE_PREFIX = "pocketmind.evaluation.v1";
export const emptyRecord = (): EvaluationRecord => ({
  status: "pending",
  evidence: "",
  reference: "",
  notes: "",
  verifier: "",
  updatedAt: null,
  verifiedAt: null,
});
export const emptyEvaluation = (): EvaluationState => ({ version: 1, records: {}, history: [] });
export const evaluationStorageKey = (userId: string) => `${EVALUATION_STORAGE_PREFIX}.${userId}`;
export const evaluationEnabled = (flag: string | undefined, development: boolean) =>
  flag === "true" || (flag === undefined && development);

export function parseEvaluation(raw: string | null): EvaluationState {
  if (raw === null) return emptyEvaluation();
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "Evaluation data is invalid. Reset it only if you accept losing the stored data.",
    );
  }
  const result = stateSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      "Evaluation data is invalid or from an unsupported version. It has not been overwritten.",
    );
  }
  return result.data;
}

export function updateEvaluation(
  state: EvaluationState,
  criterionId: string,
  values: Pick<EvaluationRecord, "status" | "evidence" | "reference" | "notes" | "verifier">,
  timestamp = new Date().toISOString(),
): EvaluationState {
  if (!EVALUATION_CRITERIA.some((criterion) => criterion.id === criterionId)) {
    throw new Error("Unknown evaluation criterion.");
  }
  if (values.status === "verified" && !values.evidence.trim()) {
    throw new Error("Describe the concrete evidence before marking this criterion verified.");
  }
  const previous = state.records[criterionId] ?? emptyRecord();
  const record = recordSchema.parse({
    ...values,
    updatedAt: timestamp,
    verifiedAt:
      values.status === "verified"
        ? previous.status === "verified"
          ? previous.verifiedAt
          : timestamp
        : null,
  });
  return {
    ...state,
    records: { ...state.records, [criterionId]: record },
    history:
      previous.status === record.status
        ? state.history
        : [
            ...state.history,
            {
              criterionId,
              previousStatus: previous.status,
              newStatus: record.status,
              timestamp,
              notes: record.notes,
            },
          ],
  };
}

export function evaluationSummary(state: EvaluationState) {
  const statuses = EVALUATION_CRITERIA.map(
    (criterion) => state.records[criterion.id]?.status ?? "pending",
  );
  const count = (status: EvaluationStatus) => statuses.filter((value) => value === status).length;
  const verified = count("verified");
  return {
    total: statuses.length,
    verified,
    inProgress: count("in_progress"),
    blocked: count("blocked"),
    percentage: statuses.length ? Math.round((verified / statuses.length) * 100) : 0,
  };
}
