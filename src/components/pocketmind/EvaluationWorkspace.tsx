import { useState, type FormEvent } from "react";
import {
  EVALUATION_CRITERIA,
  emptyEvaluation,
  emptyRecord,
  evaluationStorageKey,
  evaluationSummary,
  parseEvaluation,
  updateEvaluation,
  type EvaluationCategory,
  type EvaluationCriterion,
  type EvaluationRecord,
  type EvaluationState,
  type EvaluationStatus,
} from "@/lib/evaluation";

const categories: EvaluationCategory[] = ["Frontend", "Backend", "Hackathon Readiness"];
const labels: Record<EvaluationStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  verified: "Verified",
  blocked: "Blocked",
};

function readStorage(key: string): { state: EvaluationState; raw: string | null; error: string } {
  try {
    const raw = localStorage.getItem(key);
    return { state: parseEvaluation(raw), raw, error: "" };
  } catch (error) {
    return {
      state: emptyEvaluation(),
      raw: null,
      error: error instanceof Error ? error.message : "Unable to read local evaluation data.",
    };
  }
}

export function EvaluationWorkspace({
  userId,
  email,
  onSignOut,
  signOutError,
  signOutPending,
}: {
  userId: string;
  email?: string | undefined;
  onSignOut: () => void;
  signOutError?: string;
  signOutPending?: boolean;
}) {
  const key = evaluationStorageKey(userId);
  const [storage, setStorage] = useState(() => readStorage(key));
  const [message, setMessage] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const summary = evaluationSummary(storage.state);
  const critical = EVALUATION_CRITERIA.filter(
    (criterion) => criterion.critical && storage.state.records[criterion.id]?.status !== "verified",
  );

  function save(
    criterionId: string,
    values: Pick<EvaluationRecord, "status" | "evidence" | "reference" | "notes" | "verifier">,
  ) {
    try {
      if (storage.error)
        throw new Error(
          "Stored data could not be loaded. Reset it or resolve the storage problem before saving.",
        );
      if (localStorage.getItem(key) !== storage.raw) {
        throw new Error("Evaluation data changed in another tab. Reload this page before saving.");
      }
      const state = updateEvaluation(storage.state, criterionId, values);
      const raw = JSON.stringify(state);
      localStorage.setItem(key, raw);
      setStorage({ state, raw, error: "" });
      setMessage("Changes saved in this browser.");
      return "";
    } catch (error) {
      return error instanceof Error ? error.message : "Unable to save evaluation data.";
    }
  }

  function reset() {
    try {
      localStorage.removeItem(key);
      setStorage({ state: emptyEvaluation(), raw: null, error: "" });
      setResetPending(false);
      setMessage("Evaluation data was reset in this browser.");
    } catch {
      setMessage("Could not reset evaluation data. Check browser storage permissions.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#263b62]">
      <header className="border-b border-[#e2e8f1] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <p className="text-sm font-bold text-[#2857df]">PocketMind AI</p>
            <p className="mt-1 text-sm text-[#52647e]">
              Internal evaluation workspace · #BuildHybridAI 2026
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {email && <span className="break-all text-[#52647e]">Signed in as {email}</span>}
            <button
              type="button"
              onClick={onSignOut}
              disabled={signOutPending}
              className="min-h-11 rounded-lg border border-[#cbd5e1] px-4 font-semibold hover:bg-[#edf3ff] disabled:opacity-50"
            >
              {signOutPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
        {signOutError && (
          <p role="alert" className="mx-auto max-w-7xl px-5 pb-4 text-sm text-red-700 sm:px-8">
            {signOutError}
          </p>
        )}
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <nav aria-label="Evaluation sections" className="mb-8 flex flex-wrap gap-2">
          {[
            { title: "Overview", href: "#overview" },
            ...categories.map((category) => ({
              title: category,
              href: `#${category.toLowerCase().replaceAll(" ", "-")}`,
            })),
            { title: "Activity", href: "#activity" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-[#234077] hover:bg-[#e8eefb]"
            >
              {item.title}
            </a>
          ))}
        </nav>
        <main>
          <section id="overview">
            <h1 className="text-3xl font-bold text-[#132449]">Evaluation workspace</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#52647e]">
              Track evidence, not implementation claims. Verification is recorded manually and
              requires a description of the observed result.
            </p>
            <div className="mt-6 rounded-xl border border-[#c8d6ef] bg-[#edf3ff] px-5 py-4 text-sm leading-6 text-[#234077]">
              Local to this browser and account; not encrypted or shared. Anyone with access to this
              browser profile can inspect its storage. Do not enter credentials, tender documents,
              or extracted text.
            </div>
            {storage.error && (
              <p role="alert" className="mt-4 rounded-lg bg-[#fff0ef] p-4 text-sm text-[#8d2731]">
                {storage.error} Existing data has not been overwritten.
              </p>
            )}
            <p role="status" className="mt-2 text-sm text-[#234077]">
              {message}
            </p>
            {!storage.error && (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  {[
                    ["Progress", `${summary.percentage}%`],
                    ["Total criteria", summary.total],
                    ["Verified", summary.verified],
                    ["In progress", summary.inProgress],
                    ["Blocked", summary.blocked],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[#e2e8f1] bg-white p-4">
                      <p className="text-sm text-[#52647e]">{label}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-[#132449]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-xl border border-[#e2e8f1] bg-white p-5">
                  <h2 className="text-lg font-bold text-[#132449]">Critical outstanding checks</h2>
                  {critical.length ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {critical.map((criterion) => (
                        <li key={criterion.id}>
                          <a
                            className="font-semibold text-[#234cae] underline underline-offset-2"
                            href={`#criterion-${criterion.id}`}
                          >
                            {criterion.title}
                          </a>
                          {" · "}
                          {labels[storage.state.records[criterion.id]?.status ?? "pending"]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm">
                      All critical checks have recorded verification evidence.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          {!storage.error && (
            <>
              {categories.map((category) => (
                <section
                  id={category.toLowerCase().replaceAll(" ", "-")}
                  key={category}
                  className="mt-12"
                >
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <h2 className="text-xl font-bold text-[#132449]">{category}</h2>
                    <p className="text-sm text-[#52647e]">
                      Open a criterion to record evidence and update its status.
                    </p>
                  </div>
                  <div className="divide-y divide-[#e2e8f1] rounded-xl border border-[#e2e8f1] bg-white">
                    {EVALUATION_CRITERIA.filter((criterion) => criterion.category === category).map(
                      (criterion) => {
                        const record = storage.state.records[criterion.id] ?? emptyRecord();
                        return (
                          <CriterionEditor
                            key={`${criterion.id}:${record.updatedAt ?? "initial"}`}
                            criterion={criterion}
                            record={record}
                            onSave={save}
                          />
                        );
                      },
                    )}
                  </div>
                </section>
              ))}
              <section id="activity" className="mt-12">
                <h2 className="text-xl font-bold text-[#132449]">Activity history</h2>
                {storage.state.history.length === 0 ? (
                  <p className="mt-3 text-sm text-[#52647e]">No status changes recorded yet.</p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {[...storage.state.history].reverse().map((entry, index) => (
                      <li
                        key={`${entry.timestamp}-${index}`}
                        className="rounded-lg border border-[#e2e8f1] bg-white p-4 text-sm"
                      >
                        <strong>
                          {EVALUATION_CRITERIA.find((item) => item.id === entry.criterionId)
                            ?.title ?? entry.criterionId}
                        </strong>
                        {" · "}
                        {labels[entry.previousStatus]} → {labels[entry.newStatus]}
                        <p className="mt-1 text-[#52647e]">
                          <time dateTime={entry.timestamp}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </time>
                          {entry.notes && ` · ${entry.notes}`}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
          <section className="mt-12 border-t border-[#e2e8f1] pt-6">
            <h2 className="text-lg font-bold text-[#132449]">Reset local evaluation</h2>
            <p className="mt-2 text-sm text-[#52647e]">
              This removes this account's evaluation records and activity from this browser only.
            </p>
            {!resetPending ? (
              <button
                type="button"
                onClick={() => setResetPending(true)}
                className="mt-4 min-h-11 rounded-lg border border-[#bc6870] px-4 text-sm font-semibold text-[#8d2731]"
              >
                Reset evaluation
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="w-full text-sm font-semibold text-[#8d2731]">
                  Permanently remove local evaluation records and history?
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-11 rounded-lg bg-[#9e343e] px-4 text-sm font-semibold text-white"
                >
                  Confirm reset
                </button>
                <button
                  type="button"
                  onClick={() => setResetPending(false)}
                  className="min-h-11 rounded-lg border border-[#cbd5e1] px-4 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function CriterionEditor({
  criterion,
  record,
  onSave,
}: {
  criterion: EvaluationCriterion;
  record: EvaluationRecord;
  onSave: (
    id: string,
    values: Pick<EvaluationRecord, "status" | "evidence" | "reference" | "notes" | "verifier">,
  ) => string;
}) {
  const [draft, setDraft] = useState(record);
  const [error, setError] = useState("");
  const prefix = `criterion-${criterion.id}`;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(onSave(criterion.id, draft));
  }
  return (
    <details id={prefix} className="group px-5 py-4">
      <summary className="cursor-pointer list-none rounded-md">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <span className="block text-xs font-semibold text-[#52647e]">
              {criterion.section}
              {criterion.critical ? " · Critical" : ""}
            </span>
            <span className="mt-1 block font-semibold text-[#132449]">{criterion.title}</span>
          </span>
          <span className="rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#234077]">
            {labels[record.status]}
          </span>
        </span>
        <span className="mt-2 block text-sm leading-6 text-[#52647e]">{criterion.description}</span>
      </summary>
      <form
        aria-label={`Update ${criterion.title}`}
        onSubmit={submit}
        className="mt-5 grid gap-4 border-t border-[#e2e8f1] pt-5"
      >
        <label className="grid gap-1 text-sm font-semibold">
          Status
          <select
            name="status"
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value as EvaluationStatus })
            }
            className="min-h-12 rounded-lg border border-[#8795ad] bg-white px-3 font-normal"
          >
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Evidence description {draft.status === "verified" && "(required)"}
          <textarea
            name="evidence"
            maxLength={5000}
            required={draft.status === "verified"}
            aria-invalid={error.includes("evidence") || undefined}
            aria-describedby={error.includes("evidence") ? `${prefix}-error` : undefined}
            value={draft.evidence}
            onChange={(event) => setDraft({ ...draft, evidence: event.target.value })}
            className="min-h-24 rounded-lg border border-[#8795ad] px-3 py-2 font-normal"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Evidence URL or repository path
          <input
            name="reference"
            maxLength={2000}
            value={draft.reference}
            onChange={(event) => setDraft({ ...draft, reference: event.target.value })}
            className="min-h-12 rounded-lg border border-[#8795ad] px-3 font-normal"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Verified by
          <input
            name="verifier"
            maxLength={200}
            value={draft.verifier}
            onChange={(event) => setDraft({ ...draft, verifier: event.target.value })}
            className="min-h-12 rounded-lg border border-[#8795ad] px-3 font-normal"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Verification notes
          <textarea
            name="notes"
            maxLength={5000}
            value={draft.notes}
            onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            className="min-h-20 rounded-lg border border-[#8795ad] px-3 py-2 font-normal"
          />
        </label>
        {record.updatedAt && (
          <p className="text-sm text-[#52647e]">
            Last updated:{" "}
            <time dateTime={record.updatedAt}>{new Date(record.updatedAt).toLocaleString()}</time>
            {record.verifiedAt && (
              <>
                {" "}
                · Verified:{" "}
                <time dateTime={record.verifiedAt}>
                  {new Date(record.verifiedAt).toLocaleString()}
                </time>
              </>
            )}
          </p>
        )}
        {error && (
          <p id={`${prefix}-error`} role="alert" className="text-sm text-[#8d2731]">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="min-h-12 w-fit rounded-lg bg-[#2857df] px-5 text-sm font-semibold text-white hover:bg-[#1d46c5]"
        >
          Save changes
        </button>
      </form>
    </details>
  );
}
