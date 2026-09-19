"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ds";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/**
 * Reads a note or past paper without leaving the app.
 *
 * Every file used to go straight to the phone's own PDF viewer: a download, a
 * storage hit on a device that often has 2GB free, and an app switch, every
 * single time a student wanted to check one page of a paper. Downloading is
 * still here — it is what you do to keep a copy — but it is no longer the only
 * way to look at something.
 *
 * ## Why pdf.js rather than an iframe
 *
 * Chrome on Android does not render a PDF inside an iframe; it downloads it.
 * An iframe viewer would therefore work on the owner's laptop and do nothing
 * at all for the students this is built for. pdf.js renders to a canvas, which
 * works everywhere, and it is imported dynamically so its ~350KB arrives only
 * when a student actually taps Read — never on the dashboard, never on a page
 * that merely lists files.
 *
 * ## One page at a time
 *
 * Rendering the whole document would hold every page's bitmap in memory at
 * once; a 40-page marking scheme at phone DPI is enough to have Chrome kill
 * the tab on a low-end device. One canvas, re-drawn on navigation, costs one
 * page of memory regardless of how long the paper is.
 *
 * The bytes come from `/api/content/{id}/view`, which streams them through the
 * server and honours Range requests. Nothing here ever sees a Storage URL.
 */

type Status =
  | { phase: "loading" }
  | { phase: "ready"; pages: number }
  | { phase: "error"; message: string };

/** The last page read, per document. A convenience, so it lives in the browser. */
function rememberedPage(contentId: string): number {
  try {
    const raw = window.localStorage.getItem(`ict.read.${contentId}`);
    const page = raw ? Number(raw) : 1;
    return Number.isFinite(page) && page >= 1 ? page : 1;
  } catch {
    // Private windows, blocked site data, thumbnail capture. Page one is
    // always a correct answer.
    return 1;
  }
}

function rememberPage(contentId: string, page: number): void {
  try {
    window.localStorage.setItem(`ict.read.${contentId}`, String(page));
  } catch {
    /* Not worth telling anyone about. */
  }
}

export function DocumentViewer({
  contentId,
  title,
  onClose,
  onDownload,
  labels,
}: {
  contentId: string;
  title: string;
  onClose: () => void;
  onDownload: () => void;
  labels: { page: string; of: string; download: string; close: string; failed: string };
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  // Held so the worker and every in-flight range request can be torn down on
  // close; `destroy` lives on the loading task, not on the document.
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null);
  // Cancels a render that is still running when the student pages on quickly.
  const renderRef = useRef<RenderTask | null>(null);
  const [status, setStatus] = useState<Status>({ phase: "loading" });
  const [page, setPage] = useState(1);

  // Load the document once. The import is inside the effect so pdf.js is
  // fetched when the reader opens and not a moment sooner.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const task = pdfjs.getDocument({
          url: `/api/content/${contentId}/view`,
          // The route is same-origin and cookie-authenticated; pdf.js does not
          // send credentials on its range requests without this.
          withCredentials: true,
        });
        taskRef.current = task;
        const doc = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }
        docRef.current = doc;
        const start = Math.min(rememberedPage(contentId), doc.numPages);
        setPage(start);
        setStatus({ phase: "ready", pages: doc.numPages });
      } catch (err) {
        if (cancelled) return;
        console.error("[reader] could not open document", err);
        setStatus({ phase: "error", message: labels.failed });
      }
    })();

    return () => {
      cancelled = true;
      renderRef.current?.cancel();
      void taskRef.current?.destroy();
      taskRef.current = null;
      docRef.current = null;
    };
  }, [contentId, labels.failed]);

  // Draw whichever page is current, at the width actually available.
  const draw = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    renderRef.current?.cancel();

    const pdfPage = await doc.getPage(page);
    const unscaled = pdfPage.getViewport({ scale: 1 });
    const available = canvas.parentElement?.clientWidth ?? unscaled.width;
    // Cap the backing store at 2x. A cheap phone reports a 3x ratio and a
    // 3x-scaled A4 canvas is 25 megapixels, which is where tabs get killed.
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const scale = (available / unscaled.width) * ratio;
    const viewport = pdfPage.getViewport({ scale });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    const context = canvas.getContext("2d");
    if (!context) return;

    const task = pdfPage.render({ canvas, canvasContext: context, viewport });
    renderRef.current = task;
    try {
      await task.promise;
    } catch {
      // A cancelled render is the normal result of paging on quickly.
    }
  }, [page]);

  useEffect(() => {
    if (status.phase !== "ready") return;
    void draw();
    rememberPage(contentId, page);
  }, [status.phase, page, draw, contentId]);

  // Re-draw on resize, so rotating the phone does not leave a blurry page.
  useEffect(() => {
    if (status.phase !== "ready") return;
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => void draw());
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, [status.phase, draw]);

  // Escape closes, arrows page. A paper is read with two thumbs on a phone and
  // two arrow keys on the laptop the owner tests with.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (status.phase !== "ready") return;
      if (event.key === "ArrowRight") setPage((p) => Math.min(p + 1, status.pages));
      if (event.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, status]);

  const pages = status.phase === "ready" ? status.pages : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="ict-app fixed inset-0 z-[60] flex flex-col bg-ict-ink-900"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-ict-line px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ict-fg">{title}</p>
        <Button variant="ghost" size="sm" arrow="none" onClick={onDownload}>
          <Icon name="download" className="!text-base" />
          <span className="sr-only sm:not-sr-only">{labels.download}</span>
        </Button>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="grid size-9 shrink-0 place-items-center rounded-full text-ict-fg-soft transition-colors duration-[120ms] ease-ict hover:bg-ict-surface-hover hover:text-ict-fg"
        >
          <Icon name="close" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto max-w-3xl">
          {status.phase === "error" ? (
            <p className="rounded-ict-md border border-ict-line bg-ict-surface-card p-4 text-sm text-ict-fg">
              {status.message}
            </p>
          ) : (
            <>
              {status.phase === "loading" ? (
                <p className="py-10 text-center text-sm text-ict-fg-soft">…</p>
              ) : null}
              {/* Kept mounted while loading so the canvas ref exists the moment
                  the document resolves. */}
              <canvas ref={canvasRef} className="block w-full rounded-ict-md bg-white" />
            </>
          )}
        </div>
      </div>

      {status.phase === "ready" && pages > 1 ? (
        <footer className="flex shrink-0 items-center justify-center gap-4 border-t border-ict-line px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="grid size-9 place-items-center rounded-full text-ict-fg-soft transition-colors duration-[120ms] ease-ict hover:bg-ict-surface-hover hover:text-ict-fg disabled:opacity-40"
          >
            <Icon name="chevron_left" />
          </button>
          <span className="text-sm tabular-nums text-ict-fg-soft">
            {labels.page} {page} {labels.of} {pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, pages))}
            disabled={page >= pages}
            aria-label="Next page"
            className="grid size-9 place-items-center rounded-full text-ict-fg-soft transition-colors duration-[120ms] ease-ict hover:bg-ict-surface-hover hover:text-ict-fg disabled:opacity-40"
          >
            <Icon name="chevron_right" />
          </button>
        </footer>
      ) : null}
    </div>
  );
}
