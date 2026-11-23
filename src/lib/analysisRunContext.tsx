import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { AnalysisProgressEvent } from "@/lib/services/tenderAnalysis";
import type { Analysis } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonitorEvent =
  | AnalysisProgressEvent
  | { type: "document-selected" }
  | { type: "text-started" }
  | { type: "text-page"; completed: number; total: number }
  | { type: "text-completed" }
  | { type: "text-reused" }
  | { type: "sample-text" }
  | { type: "ocr-started" }
  | { type: "ocr-completed" }
  | { type: "ocr-waiting" };

export type RunStatus = "idle" | "waiting" | "running" | "completed" | "failed" | "cancelled";

export type AnalysisRun = {
  documentId: string;
  documentName: string;
  status: RunStatus;
  events: MonitorEvent[];
  result?: Analysis;
  errorMessage?: string;
  startedAt?: number;
};

type AnalysisRunContextValue = {
  run: AnalysisRun | null;
  abortController: AbortController | null;
  startRun: (documentId: string, documentName: string) => AbortController;
  appendEvent: (documentId: string, event: MonitorEvent) => void;
  setRunStatus: (
    documentId: string,
    status: RunStatus,
    result?: Analysis,
    errorMessage?: string,
  ) => void;
  clearRun: () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AnalysisRunContext = createContext<AnalysisRunContextValue | null>(null);

export function AnalysisRunProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startRun = useCallback((documentId: string, documentName: string): AbortController => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRun({
      documentId,
      documentName,
      status: "running",
      events: [{ type: "document-selected" }],
      startedAt: Date.now(),
    });
    return controller;
  }, []);

  const appendEvent = useCallback((documentId: string, event: MonitorEvent) => {
    setRun((current) => {
      if (!current || current.documentId !== documentId) return current;
      const events = [...current.events];
      if (
        (event.type === "text-page" || event.type === "model-download") &&
        events[events.length - 1]?.type === event.type
      ) {
        events[events.length - 1] = event;
      } else {
        events.push(event);
      }
      return { ...current, events: events.slice(-30) };
    });
  }, []);

  const setRunStatus = useCallback(
    (documentId: string, status: RunStatus, result?: Analysis, errorMessage?: string) => {
      setRun((current) => {
        if (!current || current.documentId !== documentId) return current;
        return {
          ...current,
          status,
          ...(result ? { result } : {}),
          ...(errorMessage !== undefined ? { errorMessage } : {}),
        };
      });
    },
    [],
  );

  const clearRun = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRun(null);
  }, []);

  return (
    <AnalysisRunContext.Provider
      value={{
        run,
        abortController: abortRef.current,
        startRun,
        appendEvent,
        setRunStatus,
        clearRun,
      }}
    >
      {children}
    </AnalysisRunContext.Provider>
  );
}

export function useAnalysisRun(): AnalysisRunContextValue {
  const ctx = useContext(AnalysisRunContext);
  if (!ctx) throw new Error("useAnalysisRun must be used inside AnalysisRunProvider");
  return ctx;
}
