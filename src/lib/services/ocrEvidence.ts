import type { Analysis, Evidence } from "@/lib/types";

function unverifiedEvidence(evidence: Evidence): Evidence {
  return { ...evidence, page: null, verified: false };
}

export function markUnpaginatedEvidenceUnverified(analysis: Analysis): Analysis {
  return {
    ...analysis,
    requirements: analysis.requirements.map((requirement) => ({
      ...requirement,
      confidence: Math.min(requirement.confidence, 0.3),
      evidence: unverifiedEvidence(requirement.evidence),
    })),
    deadlines: analysis.deadlines.map((deadline) => ({
      ...deadline,
      evidence: unverifiedEvidence(deadline.evidence),
    })),
    specifications: analysis.specifications.map((specification) => ({
      ...specification,
      evidence: unverifiedEvidence(specification.evidence),
    })),
    risks: analysis.risks.map((risk) => ({
      ...risk,
      evidence: unverifiedEvidence(risk.evidence),
    })),
  };
}
