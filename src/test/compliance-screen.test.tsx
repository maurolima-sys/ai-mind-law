import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ComplianceScreen } from "@/components/pocketmind/PocketMindApp";
import { LocaleProvider } from "@/lib/i18n";
import type { Analysis, DocumentRecord, Review } from "@/lib/types";

it("keeps evidence verification, assessment, and human review independent", () => {
  const analysis: Analysis = {
    mode: "local",
    engine: "test",
    summary: "",
    requirements: [
      {
        id: "r1",
        description: "Test requirement",
        category: "Legal",
        mandatory: true,
        confidence: 1,
        evidence: { page: 1, excerpt: "source", verified: true },
      },
    ],
    deadlines: [],
    specifications: [],
    risks: [],
    missing: [],
    inconsistencies: [],
    generatedAt: "2026-01-01",
  };
  const document: DocumentRecord = {
    id: "doc",
    name: "test.pdf",
    source: "upload",
    size: 1,
    pages: ["source"],
    addedAt: "2026-01-01",
    analysis,
  };
  function Harness() {
    const [reviews, setReviews] = useState<Record<string, Review>>({});
    return (
      <LocaleProvider>
        <ComplianceScreen
          analysis={analysis}
          document={document}
          reviews={reviews}
          search=""
          selectedRequirement={analysis.requirements[0]}
          selectedRequirementId="r1"
          onSelectRequirement={vi.fn()}
          onUpdateReview={(id, patch) =>
            setReviews((current) => ({
              ...current,
              [id]: { status: "pending", notes: "", ...current[id], ...patch },
            }))
          }
          onExport={vi.fn()}
          onOpenProcessing={vi.fn()}
        />
      </LocaleProvider>
    );
  }
  render(<Harness />);
  const row = screen.getByRole("row", { name: /Test requirement/i });
  expect(within(row).getByText("Verified")).toBeTruthy();
  const assessment = within(row).getByLabelText(
    "Compliance assessment for Test requirement",
  ) as HTMLSelectElement;
  const review = within(row).getByLabelText(
    "Review status for Test requirement",
  ) as HTMLSelectElement;
  expect(assessment.value).toBe("not-assessed");
  expect(review.value).toBe("pending");
  fireEvent.change(assessment, { target: { value: "non-compliant" } });
  expect(review.value).toBe("pending");
  fireEvent.change(review, { target: { value: "approved" } });
  expect(assessment.value).toBe("non-compliant");
  expect(within(row).getByText("Verified")).toBeTruthy();
});
