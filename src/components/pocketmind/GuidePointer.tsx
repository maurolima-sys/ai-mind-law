import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MousePointerClick } from "lucide-react";

import { useT } from "@/lib/i18n";

/**
 * Visual guide that highlights the next button the user should click:
 * a pulsing ring over the target element and a distinct cursor icon with a
 * short hint label anchored to its corner. Purely visual (pointer-events
 * none) so real clicks and keyboard focus keep working.
 *
 * The target is found with a CSS selector, usually `[data-guide="..."]`.
 * When rendered inside a native <dialog> (top layer), pass
 * renderInPortal={false} so the pointer is layered above the dialog content.
 */
export function GuidePointer({
  targetSelector,
  renderInPortal = true,
}: {
  targetSelector: string | null;
  renderInPortal?: boolean;
}) {
  const t = useT();
  const [rect, setRect] = useState<GuideRect | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      setRect(null);
      return;
    }
    const measure = () => {
      const element = document.querySelector(targetSelector);
      if (!element) {
        setRect(null);
        return;
      }
      const target = element.getBoundingClientRect();
      // Hidden or zero-size targets (e.g. jsdom) get no pointer.
      if (target.width < 2 && target.height < 2) {
        setRect(null);
        return;
      }
      setRect((previous) =>
        previous && sameRect(previous, target)
          ? previous
          : {
              left: target.left,
              top: target.top,
              width: target.width,
              height: target.height,
            },
      );
    };
    measure();
    const frame = requestAnimationFrame(measure);
    const poll = window.setInterval(measure, 300);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(poll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [targetSelector]);

  if (!rect) return null;

  // Anchor the cursor icon at the bottom-right corner of the target; when the
  // target is close to the top edge flip the hint label below the cursor.
  const cursorLeft = rect.left + rect.width - 10;
  const cursorTop = rect.top + rect.height - 10;
  const hintBelow = rect.top < 96;
  const cursorClass = `pm-guide-cursor${hintBelow ? " is-hint-below" : ""}`;

  const content = (
    <div className="pm-guide-layer" aria-hidden="true">
      <div
        className="pm-guide-ring"
        style={{
          left: rect.left - 5,
          top: rect.top - 5,
          width: rect.width + 10,
          height: rect.height + 10,
        }}
      />
      <div className={cursorClass} style={{ left: cursorLeft, top: cursorTop }}>
        <MousePointerClick size={24} strokeWidth={2} />
        <span className="pm-guide-cursor-hint">{t("guide_next_step")}</span>
      </div>
    </div>
  );

  return renderInPortal ? createPortal(content, window.document.body) : content;
}

interface GuideRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function sameRect(a: GuideRect, b: GuideRect): boolean {
  return (
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}
