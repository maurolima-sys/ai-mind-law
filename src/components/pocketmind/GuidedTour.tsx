import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  X,
} from "lucide-react";

type TourScreen = "overview" | "analysis" | "compliance" | "processing";

interface TourStep {
  screen: TourScreen;
  /** CSS selector for the element to spotlight. null = centered modal. */
  target: string | null;
  title: string;
  body: string;
}

const TOUR_KEY = "pocketmind.tour.completed";

const STEPS: TourStep[] = [
  {
    screen: "overview",
    target: null,
    title: "Welcome to PocketMind AI",
    body: "Turn complex tender PDFs into reviewable findings — with a link to the source page for each one. This short tour walks the full flow in about 90 seconds, using the preloaded sample tender. No setup needed.",
  },
  {
    screen: "overview",
    target: ".pm-navigation",
    title: "Four areas, one workspace",
    body: "Move between Dashboard, Document analysis, Compliance matrix, and Processing & privacy from this sidebar.",
  },
  {
    screen: "overview",
    target: ".pm-metrics-grid",
    title: "Your workspace at a glance",
    body: "Documents in the session, requirements extracted, critical risks flagged for review, and pending reviews.",
  },
  {
    screen: "overview",
    target: ".pm-recent-panel",
    title: "The sample tender is ready",
    body: "NB-2026-114 Smart LED Street Lighting is preloaded and labeled illustrative — no Firebase setup needed to explore it.",
  },
  {
    screen: "processing",
    target: ".pm-processing-options",
    title: "Choose how it's processed",
    body: "On-device, Cloud, Hybrid, or Sample data. Cloud and hybrid need your explicit consent. The tour uses Sample data — no upload, no model call.",
  },
  {
    screen: "analysis",
    target: ".pm-findings-panel",
    title: "Findings, beside their source",
    body: "Requirements, deadlines, specifications, risks, and missing information — each quotes its excerpt. Click the Page link to jump to the source. Green means verified against the text.",
  },
  {
    screen: "analysis",
    target: ".pm-source-panel",
    title: "Verify against the original",
    body: "The source page sits beside the findings so you can confirm every excerpt yourself. AI findings are suggestions — verify before you rely on them.",
  },
  {
    screen: "compliance",
    target: ".pm-matrix-panel",
    title: "Track every requirement",
    body: "Filter by category, inspect the evidence, set a review status (Pending → Reviewed → Satisfied, or Unclear), add notes, and export to CSV.",
  },
  {
    screen: "overview",
    target: ".pm-privacy-note",
    title: "Privacy by choice. Decisions stay yours.",
    body: "PDF text is extracted in your browser; cloud use is always your explicit choice. When you're ready, choose Sample data and Explore sample analysis to try the full flow yourself.",
  },
];

interface GuidedTourProps {
  active: boolean;
  screen: TourScreen;
  onNavigate: (screen: TourScreen) => void;
  onEnd: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
}

export function GuidedTour({
  active,
  screen,
  onNavigate,
  onEnd,
  returnFocusRef,
}: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [popover, setPopover] = useState<{ left: number; top: number } | null>(null);
  const [modalMode, setModalMode] = useState(true);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* ignore */
    }
    onEnd();
  }, [onEnd]);

  const next = useCallback(() => {
    setStep((prev) => {
      if (prev >= STEPS.length - 1) {
        finish();
        return prev;
      }
      return prev + 1;
    });
  }, [finish]);

  const back = useCallback(() => setStep((prev) => Math.max(0, prev - 1)), []);

  // Reset to the first step whenever the tour is (re)opened.
  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  // Keyboard controls.
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, back, finish]);

  const measure = useCallback(() => {
    const current = STEPS[step];
    if (!current) return;
    const targetEl = current.target ? document.querySelector<HTMLElement>(current.target) : null;

    if (!current.target || !targetEl) {
      setSpotlight(null);
      setModalMode(true);
      setPopover(null);
      return;
    }

    targetEl.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    const measureAfterScroll = () => {
      const target = targetEl.getBoundingClientRect();
      const pad = 6;
      setSpotlight({
        left: target.left - pad,
        top: target.top - pad,
        width: target.width + pad * 2,
        height: target.height + pad * 2,
      });
      setModalMode(false);

      const pop = popoverRef.current?.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 14;
      const gap = 14;
      const pw = pop?.width ?? 340;
      const ph = pop?.height ?? 200;

      let left: number;
      let top: number;

      // Sidebar / left-edge targets read better to the right.
      if (target.left < vw * 0.28 && target.right + gap + pw < vw - margin) {
        left = target.right + gap;
        top = clamp(target.top, margin, vh - ph - margin);
      } else {
        const below = target.bottom + gap;
        top = below + ph < vh - margin ? below : target.top - ph - gap;
        left = clamp(target.left, margin, vw - pw - margin);
        top = clamp(top, margin, vh - ph - margin);
      }
      setPopover({ left, top });
    };

    const raf = requestAnimationFrame(measureAfterScroll);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  // Drive navigation + measurement on step / screen change.
  useLayoutEffect(() => {
    if (!active) return;
    const current = STEPS[step];
    if (!current) return;
    if (current.screen !== screen) {
      onNavigate(current.screen);
      return; // re-runs when screen updates
    }
    const cleanup = measure();
    return cleanup;
  }, [active, step, screen, onNavigate, measure]);

  // Re-measure on resize / scroll.
  useEffect(() => {
    if (!active) return;
    const handler = () => measure();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [active, measure]);

  // Focus the primary action when a step appears.
  useEffect(() => {
    if (active) primaryBtnRef.current?.focus();
  }, [active, step, popover, modalMode]);

  // Restore focus when the tour closes.
  useEffect(() => {
    if (active) return;
    returnFocusRef?.current?.focus?.();
  }, [active, returnFocusRef]);

  if (!active) return null;

  const current = STEPS[step];
  const isWelcome = step === 0;
  const isLast = step === STEPS.length - 1;

  const popoverStyle: React.CSSProperties = modalMode
    ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
    : { left: popover?.left ?? -9999, top: popover?.top ?? -9999 };

  return (
    <div className="pm-tour-overlay" aria-hidden={false}>
      <div
        className={`pm-tour-spotlight${modalMode ? " is-modal" : ""}`}
        style={
          spotlight
            ? {
                left: spotlight.left,
                top: spotlight.top,
                width: spotlight.width,
                height: spotlight.height,
              }
            : undefined
        }
      />
      <div
        className={`pm-tour-popover${modalMode ? " is-modal" : ""}`}
        ref={popoverRef}
        style={popoverStyle}
        role="dialog"
        aria-modal="false"
        aria-labelledby="pm-tour-title"
      >
        <div className="pm-tour-head">
          <span className="pm-tour-badge">
            {isWelcome ? <Sparkles size={14} /> : <Compass size={14} />}
            {isWelcome ? "Welcome" : `Step ${step} of ${STEPS.length - 1}`}
          </span>
          <button
            type="button"
            className="pm-tour-close"
            onClick={finish}
            aria-label="Close tour"
          >
            <X size={16} />
          </button>
        </div>
        <strong id="pm-tour-title" className="pm-tour-title">
          {current.title}
        </strong>
        <p className="pm-tour-body">{current.body}</p>
        <div className="pm-tour-foot">
          <button type="button" className="pm-tour-skip" onClick={finish}>
            {isLast ? "Back to app" : "Skip tour"}
          </button>
          <div className="pm-tour-progress">
            {!isWelcome && (
              <button
                type="button"
                className="pm-tour-back"
                onClick={back}
                disabled={step === 0}
                aria-label="Previous step"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button
              ref={primaryBtnRef}
              type="button"
              className="pm-tour-next"
              onClick={next}
            >
              {isWelcome ? (
                "Start tour"
              ) : isLast ? (
                <>
                  <Check size={15} /> Done
                </>
              ) : (
                <>
                  Next <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
