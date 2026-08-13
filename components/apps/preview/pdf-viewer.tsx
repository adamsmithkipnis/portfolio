"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getPdfProxyUrl } from "@/lib/preview-utils";

interface PdfViewerProps {
  fileUrl: string;
  fileName: string;
  focusOverlayActive?: boolean;
  onRequestFocus?: () => void;
  errorContentClassName?: string;
}

// Rendered with pdf.js rather than an <iframe>, because inline PDF display via
// <iframe> depends on the visitor's browser plugin — some Chromium builds render
// nothing, and browsers set to "download PDFs instead of opening them" show an
// empty pane. Canvas rendering behaves identically everywhere.
const PDF_WORKER_SRC = "/pdf.worker.min.mjs";
const RENDER_SCALE = 1.5; // crisp at typical window widths without ballooning memory

export function PdfViewer({
  fileUrl,
  fileName,
  focusOverlayActive = false,
  onRequestFocus,
  errorContentClassName,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const proxyUrl = getPdfProxyUrl(fileUrl);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    setFailed(false);
    container.replaceChildren();

    (async () => {
      try {
        // Dynamic so pdf.js stays out of the main bundle until a PDF is opened
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

        const document = await pdfjs.getDocument({ url: proxyUrl }).promise;
        if (cancelled) return;
        setPageCount(document.numPages);

        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber);
          if (cancelled) return;

          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = window.document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mx-auto mb-4 block h-auto w-full max-w-3xl rounded shadow-sm";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `${fileName}, page ${pageNumber} of ${document.numPages}`);
          container.appendChild(canvas);

          await page.render({ canvasContext: context, viewport }).promise;
          if (cancelled) return;
        }

        setLoading(false);
      } catch {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [proxyUrl, fileName, attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  if (failed) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
        <div className={cn("text-center", errorContentClassName)}>
          <svg className="w-16 h-16 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="font-medium">Unable to display PDF</p>
          <p className="text-sm mt-1 mb-3">The PDF viewer couldn&apos;t load this file</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={retry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Retry
            </button>
            <a
              href={proxyUrl}
              download={fileName}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors"
            >
              Open Original
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-zinc-100 dark:bg-zinc-900">
      {focusOverlayActive && onRequestFocus && (
        <div
          className="absolute inset-0 z-10"
          onMouseDown={(event) => {
            event.preventDefault();
            onRequestFocus();
          }}
          onClick={(event) => {
            event.preventDefault();
            onRequestFocus();
          }}
        />
      )}
      {loading && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            <span className="text-sm">Loading PDF...</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        data-page-count={pageCount}
        className="h-full w-full overflow-auto p-4"
      />
    </div>
  );
}
