import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RiskScreen } from "@/components/pocketmind/RiskScreen";
import { LocaleProvider } from "@/lib/i18n";
import type { Analysis, DocumentRecord, Risk } from "@/lib/types";

function documentWithRisk(id: string, risk: Risk): DocumentRecord {
  const analysis: Analysis = {
    mode: "local",
    engine: "test",
    summary: "Test analysis",
    requirements: [],
    deadlines: [],
    specifications: [],
    risks: [risk],
    missing: [],
    inconsistencies: [],
    generatedAt: "2026-01-01T00:00:00.000Z",
  };

  return {
    id,
    name: `${id}.pdf`,
    size: 12,
    source: "upload",
    format: "pdf",
    pages: ["Source page one", "Source page two"],
    addedAt: "2026-01-01T00:00:00.000Z",
    analysis,
  };
}

function makeRisk(id: string, severity: Risk["severity"], title: string): Risk {
  return {
    id,
    title,
    severity,
    kind: "detected",
    explanation: `${title} explanation`,
    evidence: {
      page: 2,
      excerpt: `${title} source excerpt`,
      verified: true,
    },
  };
}

describe("RiskScreen", () => {
  it("filters risks by severity and opens the cited source", () => {
    const onOpenSource = vi.fn();
    const risks = [
      documentWithRisk("critical-tender", makeRisk("critical", "Critical", "Critical risk")),
      documentWithRisk("medium-tender", makeRisk("medium", "Medium", "Medium risk")),
    ];

    render(
      <LocaleProvider>
        <RiskScreen
          documents={risks}
          reviews={{}}
          search=""
          storageError=""
          onOpenProcessing={vi.fn()}
          onOpenSource={onOpenSource}
          onSaveMitigation={vi.fn()}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Critical/i }));

    expect(screen.getByText("Critical risk")).toBeTruthy();
    expect(screen.queryByText("Medium risk")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));

    expect(onOpenSource).toHaveBeenCalledWith("critical-tender", 2, "Critical risk source excerpt");
  });

  it("saves a human-authored mitigation note through the supplied local handler", () => {
    const onSaveMitigation = vi.fn();
    const document = documentWithRisk("tender", makeRisk("risk-1", "High", "High risk"));

    render(
      <LocaleProvider>
        <RiskScreen
          documents={[document]}
          reviews={{}}
          search=""
          storageError=""
          onOpenProcessing={vi.fn()}
          onOpenSource={vi.fn()}
          onSaveMitigation={onSaveMitigation}
        />
      </LocaleProvider>,
    );

    fireEvent.change(screen.getByLabelText("Mitigation / response plan"), {
      target: { value: "Confirm the schedule with the project team." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));

    expect(onSaveMitigation).toHaveBeenCalledWith(
      "tender",
      "risk-1",
      "Confirm the schedule with the project team.",
    );
  });
});
