import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EvidenceComparisonPanel } from "@/components/pocketmind/EvidenceComparisonPanel";
import { buildDemoDocument } from "@/data/sampleTender";
import { LocaleProvider } from "@/lib/i18n";
import type { EvidenceMatch } from "@/lib/types";

describe("EvidenceComparisonPanel", () => {
  it("shows the recorded inference source of each comparison", () => {
    const requirement = buildDemoDocument().analysis?.requirements[0];
    if (!requirement) throw new Error("Demo requirement is missing");
    const match: EvidenceMatch = {
      id: "match",
      tenderDocumentId: "tender",
      requirementId: requirement.id,
      evidenceDocumentId: "evidence",
      assessment: "insufficient",
      confidence: 0.5,
      explanation: "Needs review",
      evidence: { page: null, excerpt: null, verified: false },
      processingSource: "cloud-fallback",
      model: "Gemini",
      generatedAt: "2026-01-01",
    };
    render(
      <LocaleProvider>
        <EvidenceComparisonPanel
          tenderDocumentId="tender"
          requirements={[requirement]}
          selectedRequirementId={requirement.id}
          evidenceDocuments={[]}
          links={[]}
          matches={[match]}
          selectedEvidenceId="evidence"
          preference="hybrid"
          cloudConsent
          isComparing={false}
          isAddingEvidence={false}
          progress=""
          error=""
          demo={false}
          onSelectEvidence={vi.fn()}
          onSelectRequirement={vi.fn()}
          onUpload={vi.fn()}
          onLink={vi.fn()}
          onUnlink={vi.fn()}
          onCompare={vi.fn()}
          onCloudConsentChange={vi.fn()}
        />
      </LocaleProvider>,
    );
    expect(screen.getByText(/Cloud \(IN_CLOUD; hybrid selected\)/).textContent).toContain(
      "IN_CLOUD",
    );
  });
});
