import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EvaluationWorkspace } from "@/components/pocketmind/EvaluationWorkspace";
import {
  EVALUATION_CRITERIA,
  emptyEvaluation,
  evaluationEnabled,
  evaluationStorageKey,
  evaluationSummary,
  parseEvaluation,
  updateEvaluation,
} from "@/lib/evaluation";

const userId = "test-user";
const storageKey = evaluationStorageKey(userId);

function renderWorkspace() {
  return render(<EvaluationWorkspace userId={userId} onSignOut={vi.fn()} />);
}

function openCriterion(title: string) {
  fireEvent.click(screen.getByText(title, { selector: "span" }));
  return within(screen.getByRole("form", { name: `Update ${title}` }));
}

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("evaluation workspace", () => {
  it("renders all areas and initially has no verified criteria", () => {
    renderWorkspace();
    expect(screen.getByRole("heading", { name: "Evaluation workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Frontend" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backend" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hackathon Readiness" })).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(evaluationSummary(emptyEvaluation()).total).toBe(EVALUATION_CRITERIA.length);
  });

  it("requires evidence, persists verification and records status history", () => {
    const view = renderWorkspace();
    let form = openCriterion("Cloud inference");
    fireEvent.change(form.getByLabelText("Status"), { target: { value: "verified" } });
    fireEvent.change(form.getByLabelText(/Evidence description/), { target: { value: "  " } });
    fireEvent.click(form.getByRole("button", { name: "Save changes" }));
    expect(form.getByRole("alert")).toHaveTextContent("concrete evidence");
    expect(localStorage.getItem(storageKey)).toBeNull();
    fireEvent.change(form.getByLabelText(/Evidence description/), {
      target: { value: "Production test succeeded with structured output." },
    });
    fireEvent.change(form.getByLabelText("Verification notes"), {
      target: { value: "Checked manually" },
    });
    fireEvent.click(form.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Changes saved in this browser.")).toBeInTheDocument();
    expect(screen.getByText(/Pending → Verified/)).toBeInTheDocument();
    view.unmount();
    renderWorkspace();
    form = openCriterion("Cloud inference");
    expect(form.getByLabelText("Status")).toHaveValue("verified");
    expect(form.getByLabelText(/Evidence description/)).toHaveValue(
      "Production test succeeded with structured output.",
    );
    expect(evaluationSummary(parseEvaluation(localStorage.getItem(storageKey))).verified).toBe(1);
  });

  it("preserves invalid data until reset is confirmed", () => {
    localStorage.setItem(storageKey, "{broken");
    renderWorkspace();
    expect(screen.getByRole("alert")).toHaveTextContent("invalid");
    expect(localStorage.getItem(storageKey)).toBe("{broken");
    fireEvent.click(screen.getByRole("button", { name: "Reset evaluation" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(localStorage.getItem(storageKey)).toBe("{broken");
    fireEvent.click(screen.getByRole("button", { name: "Reset evaluation" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm reset" }));
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects unsupported versions and verified records without evidence", () => {
    expect(() =>
      parseEvaluation(JSON.stringify({ version: 2, records: {}, history: [] })),
    ).toThrow();
    expect(() =>
      updateEvaluation(emptyEvaluation(), "cloud", {
        status: "verified",
        evidence: "  ",
        reference: "",
        notes: "",
        verifier: "",
      }),
    ).toThrow(/evidence/);
  });

  it("does not overwrite changes made in another tab", () => {
    renderWorkspace();
    localStorage.setItem(storageKey, JSON.stringify(emptyEvaluation()));
    const form = openCriterion("Cloud inference");
    fireEvent.change(form.getByLabelText("Status"), { target: { value: "blocked" } });
    fireEvent.click(form.getByRole("button", { name: "Save changes" }));
    expect(form.getByRole("alert")).toHaveTextContent("another tab");
  });

  it("only enables production with an explicit true flag", () => {
    expect(evaluationEnabled(undefined, false)).toBe(false);
    expect(evaluationEnabled("false", true)).toBe(false);
    expect(evaluationEnabled(undefined, true)).toBe(true);
    expect(evaluationEnabled("true", false)).toBe(true);
  });
});
