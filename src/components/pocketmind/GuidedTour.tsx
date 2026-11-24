import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { useLocale } from "@/lib/i18n";
import {
  checkTourNarrationAvailability,
  stopTourNarration,
  synthesiseTourStep,
} from "@/lib/services/tourNarration.functions";

// ─── types & constants ────────────────────────────────────────────────────────

type TourScreen = "overview" | "library" | "analysis" | "compliance" | "processing" | "risks";

interface TourStep {
  screen: TourScreen;
  /** CSS selector for the element to spotlight. null = centred modal. */
  target: string | null;
  titleKey: string;
  bodyKey: string;
}

const TOUR_KEY = "pocketmind.tour.completed";
const NARRATION_MUTE_KEY = "pocketmind.tour.muted";

const STEPS: TourStep[] = [
  { screen: "overview", target: null, titleKey: "tour_step0_title", bodyKey: "tour_step0_body" },
  {
    screen: "overview",
    target: ".pm-navigation",
    titleKey: "tour_step1_title",
    bodyKey: "tour_step1_body",
  },
  {
    screen: "library",
    target: ".pm-library-panel",
    titleKey: "tour_library_title",
    bodyKey: "tour_library_body",
  },
  {
    screen: "overview",
    target: ".pm-metrics-grid",
    titleKey: "tour_step2_title",
    bodyKey: "tour_step2_body",
  },
  {
    screen: "overview",
    target: ".pm-recent-panel",
    titleKey: "tour_step3_title",
    bodyKey: "tour_step3_body",
  },
  {
    screen: "processing",
    target: ".pm-processing-options",
    titleKey: "tour_step4_title",
    bodyKey: "tour_step4_body",
  },
  {
    screen: "analysis",
    target: ".pm-findings-panel",
    titleKey: "tour_step5_title",
    bodyKey: "tour_step5_body",
  },
  {
    screen: "analysis",
    target: ".pm-source-panel",
    titleKey: "tour_step6_title",
    bodyKey: "tour_step6_body",
  },
  {
    screen: "compliance",
    target: ".pm-matrix-panel",
    titleKey: "tour_step7_title",
    bodyKey: "tour_step7_body",
  },
  {
    screen: "overview",
    target: ".pm-privacy-note",
    titleKey: "tour_step8_title",
    bodyKey: "tour_step8_body",
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

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

/** Build the narration text for a step: title. body. */
function stepText(title: string, body: string): string {
  return `${title}. ${body}`;
}

// ─── narration hook ───────────────────────────────────────────────────────────

type NarrationStatus = "idle" | "loading" | "playing" | "error";

/**
 * Manages browser speechSynthesis narration for the guided tour.
 *
 * - Checks availability once on mount (synchronous browser API check).
 * - Speaks each step via speechSynthesis; no caching needed (no network cost).
 * - Respects mute preference persisted to localStorage.
 */
function useNarration(active: boolean, locale: "en" | "pt" | "es", narrationEnabled: boolean) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NARRATION_MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [status, setStatus] = useState<NarrationStatus>("idle");

  // Check availability once when the tour opens.
  useEffect(() => {
    if (!active || !narrationEnabled || available !== null) return;
    checkTourNarrationAvailability()
      .then((ok) => setAvailable(ok))
      .catch(() => setAvailable(false));
  }, [active, available, narrationEnabled]);

  useEffect(() => {
    if (narrationEnabled) return;
    stopAudio();
    setAvailable(null);
  }, [narrationEnabled]);

  useEffect(() => {
    if (active) return;
    stopAudio();
    setStatus("idle");
  }, [active]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAudio() {
    stopTourNarration();
    setStatus("idle");
  }

  function toggleMute() {
    if (!narrationEnabled) return;
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(NARRATION_MUTE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (next) stopAudio();
  }

  async function playStep(stepIndex: number, title: string, body: string) {
    if (!narrationEnabled || !available || muted) return;
    stopAudio();
    setStatus("loading");
    try {
      const text = stepText(title, body);
      await synthesiseTourStep({ data: { text, locale } });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
    // stepIndex unused — speechSynthesis has no caching cost
    void stepIndex;
  }

  return { available, muted, status, toggleMute, playStep, stopAudio };
}

// ─── geometry ─────────────────────────────────────────────────────────────────

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// ─── component ────────────────────────────────────────────────────────────────

interface GuidedTourProps {
  active: boolean;
  screen: TourScreen;
  narrationEnabled?: boolean;
  onNavigate: (screen: TourScreen) => void;
  onEnd: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

export function GuidedTour({
  active,
  screen,
  narrationEnabled = true,
  onNavigate,
  onEnd,
  returnFocusRef,
}: GuidedTourProps) {
  const { locale, t } = useLocale();
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [popover, setPopover] = useState<{ left: number; top: number } | null>(null);
  const [modalMode, setModalMode] = useState(true);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);

  const narration = useNarration(active, locale, narrationEnabled);

  // ── lifecycle ────────────────────────────────────────────────────────────────

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* ignore */
    }
    narration.stopAudio();
    onEnd();
  }, [onEnd, narration]);

  const next = useCallback(() => {
    setStep((prev) => {
      if (prev >= STEPS.length - 1) {
        finish();
        return prev;
      }
      return prev + 1;
    });
  }, [finish]);

  const back = useCallback(() => {
    setStep((prev) => Math.max(0, prev - 1));
  }, []);

  // Reset to step 0 when the tour opens.
  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  // Keyboard navigation.
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

  // ── spotlight measurement ────────────────────────────────────────────────────

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

      // Sidebar / left-edge targets — open popover to the right.
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

  // Navigate + measure on step / screen change; play narration when step lands.
  useLayoutEffect(() => {
    if (!active) return;
    const current = STEPS[step];
    if (!current) return;
    if (current.screen !== screen) {
      onNavigate(current.screen);
      return;
    }
    const cleanup = measure();

    // Fire narration after the popover is positioned (next tick).
    const title = t(current.titleKey as Parameters<typeof t>[0]);
    const body = t(current.bodyKey as Parameters<typeof t>[0]);
    const tid = setTimeout(() => {
      void narration.playStep(step, title, body);
    }, 80);

    return () => {
      cleanup?.();
      clearTimeout(tid);
    };
    // narration.playStep is stable (defined inside useNarration with no deps that change per render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, screen, onNavigate, measure, t]);

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

  // Focus primary action when popover appears.
  useEffect(() => {
    if (active) primaryBtnRef.current?.focus();
  }, [active, step, popover, modalMode]);

  // Restore focus when the tour closes.
  useEffect(() => {
    if (active) return;
    returnFocusRef?.current?.focus?.();
  }, [active, returnFocusRef]);

  // ── render ───────────────────────────────────────────────────────────────────

  if (!active) return null;

  const current = STEPS[step];
  if (!current) return null;
  const isWelcome = step === 0;
  const isLast = step === STEPS.length - 1;

  const popoverStyle: React.CSSProperties = modalMode
    ? { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
    : { left: popover?.left ?? -9999, top: popover?.top ?? -9999 };

  const showNarrationBtn = narrationEnabled && narration.available === true;

  return (
    <div className="pm-tour-overlay" aria-hidden={false}>
      {/* ── spotlight ── */}
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

      {/* ── popover ── */}
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
            {isWelcome
              ? t("tour_badge_welcome")
              : t("tour_badge_step", { step, total: STEPS.length - 1 })}
          </span>

          <div className="pm-tour-head-actions">
            {/* Narration mute / unmute button */}
            {showNarrationBtn && (
              <button
                type="button"
                className={`pm-tour-audio-btn${narration.muted ? " is-muted" : ""}`}
                onClick={narration.toggleMute}
                aria-label={narration.muted ? "Unmute narration" : "Mute narration"}
                title={narration.muted ? "Unmute narration" : "Mute narration"}
              >
                {narration.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}

            <button
              type="button"
              className="pm-tour-close"
              onClick={finish}
              aria-label={t("tour_close")}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <strong id="pm-tour-title" className="pm-tour-title">
          {t(current.titleKey as Parameters<typeof t>[0])}
        </strong>
        <p className="pm-tour-body">{t(current.bodyKey as Parameters<typeof t>[0])}</p>

        <div className="pm-tour-foot">
          <button type="button" className="pm-tour-skip" onClick={finish}>
            {isLast ? t("tour_back_to_app") : t("tour_skip")}
          </button>

          <div className="pm-tour-progress">
            {!isWelcome && (
              <button
                type="button"
                className="pm-tour-back"
                onClick={back}
                disabled={step === 0}
                aria-label={t("tour_prev")}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button ref={primaryBtnRef} type="button" className="pm-tour-next" onClick={next}>
              {isWelcome ? (
                t("tour_start")
              ) : isLast ? (
                <>
                  <Check size={15} /> {t("tour_done")}
                </>
              ) : (
                <>
                  {t("tour_next")} <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
