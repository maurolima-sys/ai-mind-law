import "fake-indexeddb/auto";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalysisCompletenessWarning } from "@/components/pocketmind/AnalysisCompletenessWarning";
import { LocaleProvider } from "@/lib/i18n";
import { loadLocalWorkspace, saveDocumentRecord } from "@/lib/services/localWorkspace";
import type { DocumentRecord } from "@/lib/types";

const DATABASE_NAME = "pocketmind-local-workspace";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

beforeEach(async () => {
  await requestResult(indexedDB.deleteDatabase(DATABASE_NAME));
});

describe("analysis completeness warning", () => {
  it("shows the saved affected page numbers and opens OCR options on request", () => {
    const onReviewOcr = vi.fn();
    const persistedAnalysis = { limitations: { insufficientTextPages: [1, 3, 16, 17] } };

    render(
      <LocaleProvider>
        <AnalysisCompletenessWarning
          pages={persistedAnalysis.limitations.insufficientTextPages}
          onReviewOcr={onReviewOcr}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("4 pages");
    expect(screen.getByText("Affected pages: 1, 3, 16, 17")).toBeInTheDocument();
    expect(screen.getByText(/Findings may be incomplete/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review OCR options" }));
    expect(onReviewOcr).toHaveBeenCalledOnce();
  });

  it("renders nothing when OCR covered every page with insufficient selectable text", () => {
    render(
      <LocaleProvider>
        <AnalysisCompletenessWarning pages={[]} onReviewOcr={vi.fn()} />
      </LocaleProvider>,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the limitation in the local workspace record for later visits and exports", async () => {
    const document: DocumentRecord = {
      id: "upload-limited-analysis",
      name: "tender.pdf",
      size: 100,
      source: "upload",
      format: "pdf",
      pages: ["short cover", "adequate page"],
      addedAt: "2026-11-27T00:00:00.000Z",
      analysis: {
        mode: "local",
        engine: "test",
        summary: "Analysis with a known text limitation",
        requirements: [],
        deadlines: [],
        specifications: [],
        risks: [],
        missing: [],
        inconsistencies: [],
        generatedAt: "2026-11-27T00:00:00.000Z",
        limitations: { insufficientTextPages: [1] },
      },
    };

    await saveDocumentRecord(document);
    const restored = await loadLocalWorkspace();

    expect(
      restored.documents.find((item) => item.id === document.id)?.analysis?.limitations,
    ).toEqual({ insufficientTextPages: [1] });
  });
});
