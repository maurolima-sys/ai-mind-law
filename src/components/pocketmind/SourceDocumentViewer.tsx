import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";

import { normalize } from "@/lib/services/evidence";
import type { DocumentFormat } from "@/lib/types";
import { useT } from "@/lib/i18n";

type Highlight = { left: number; top: number; width: number; height: number };

export function SourceDocumentViewer({
  file,
  format,
  name,
  pageText,
  pageNumber,
  pageCount,
  sourceLocation,
  excerpt,
  zoom = 100,
}: {
  file: Blob | null;
  format: DocumentFormat;
  name: string;
  pageText: string;
  pageNumber: number;
  pageCount: number;
  sourceLocation: string;
  excerpt: string | null;
  zoom?: number;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    if (format !== "pdf" || !file || !canvasRef.current) {
      setHighlights([]);
      setRenderError("");
      setIsRendering(false);
      return;
    }

    let active = true;
    const sourceFile = file;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let renderTask: RenderTask | undefined;
    setIsRendering(true);
    setRenderError("");
    setHighlights([]);

    async function renderPage() {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const data = new Uint8Array(await sourceFile.arrayBuffer());
        loadingTask = pdfjs.getDocument({ data });
        const document = await loadingTask.promise;
        if (!active) return;
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) throw new Error("The browser could not create a PDF canvas.");

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await renderTask.promise;
        if (!active || !excerpt) return;

        const content = await page.getTextContent();
        const excerptText = normalize(excerpt);
        const boxes: Highlight[] = [];
        for (const item of content.items) {
          if (!("str" in item) || typeof item.str !== "string") continue;
          const itemText = normalize(item.str);
          if (!itemText || !excerptText.includes(itemText)) continue;
          const transform = item.transform;
          const [left, baseline] = viewport.convertToViewportPoint(transform[4], transform[5]);
          const height = Math.max(4, item.height * viewport.scale);
          boxes.push({
            left,
            top: baseline - height,
            width: Math.max(2, item.width * viewport.scale),
            height,
          });
        }
        if (active) setHighlights(boxes);
      } catch (error) {
        if (active) {
          const detail = error instanceof Error ? error.message : "PDF rendering failed.";
          setRenderError(detail);
        }
      } finally {
        if (active) setIsRendering(false);
      }
    }

    void renderPage();
    return () => {
      active = false;
      renderTask?.cancel();
      if (loadingTask) void loadingTask.destroy();
    };
  }, [excerpt, file, format, pageNumber]);

  return (
    <figure className="pm-source-page">
      <figcaption className="pm-source-page-head">
        <span>{name}</span>
        <span>
          {format === "pdf"
            ? t("source_page_of", { page: pageNumber, total: pageCount })
            : sourceLocation}
        </span>
      </figcaption>
      {excerpt && (
        <blockquote className="pm-source-highlight-quote">
          <mark>{excerpt}</mark>
        </blockquote>
      )}
      {format === "pdf" && file ? (
        <div className="pm-pdf-canvas-scroll" aria-label={t("source_page_rendering_region")}>
          <div className="pm-pdf-canvas-wrap" style={{ zoom: zoom / 100 }}>
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={t("source_rendered_page", { page: pageNumber })}
            />
            {highlights.map((highlight, index) => (
              <span
                className="pm-pdf-highlight"
                key={`${highlight.left}-${highlight.top}-${index}`}
                style={{
                  left: `${highlight.left}px`,
                  top: `${highlight.top}px`,
                  width: `${highlight.width}px`,
                  height: `${highlight.height}px`,
                }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      ) : (
        <pre className="pm-source-text" style={{ fontSize: `${(13 * zoom) / 100}px` }}>
          {pageText || t("source_no_text")}
        </pre>
      )}
      {isRendering && (
        <div className="pm-pdf-render-status" role="status">
          <LoaderCircle size={15} className="pm-spin" /> {t("source_rendering")}
        </div>
      )}
      {renderError && (
        <div className="pm-pdf-render-error" role="status">
          <AlertCircle size={15} />
          <span>{t("source_render_error", { detail: renderError })}</span>
        </div>
      )}
      <div className="pm-source-disclaimer">{t("source_disclaimer")}</div>
    </figure>
  );
}
