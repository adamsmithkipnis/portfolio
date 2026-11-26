"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, FileText, Frame, Home, Minus, Plus, Presentation, X } from "lucide-react";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell } from "@/components/window-nav-shell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FigmaCanvas, type FigmaCanvasHandle } from "@/components/apps/figma/figma-canvas";
import { FIGMA_FILES, type FigmaFile, formatEdited, getFigmaFile } from "@/lib/figma-files";
import { loadFigmaState, saveFigmaState } from "@/lib/sidebar-persistence";
import { useWindowFocus } from "@/lib/window-focus-context";
import { WORK_LINKS, EARLIER_WORK_LINKS } from "@/lib/work-links";
import { cn } from "@/lib/utils";

interface FigmaAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  /** Hands an archived page to Safari. Supplied by the desktop shell. */
  onOpenApp?: (appId: string, target?: string) => void;
}

function caseStudyFor(file: FigmaFile) {
  if (!file.caseStudy) return null;
  return [...WORK_LINKS, ...EARLIER_WORK_LINKS].find((link) => link.slug === file.caseStudy) ?? null;
}

function FileIcon({ file, className }: { file: FigmaFile; className?: string }) {
  const Icon = file.kind === "slides" ? Presentation : FileText;
  return <Icon className={className} size={14} aria-hidden="true" />;
}

/** The file browser: Figma's Recents grid. */
function RecentsGrid({ onOpen }: { onOpen: (slug: string) => void }) {
  return (
    <ScrollArea className="flex-1 min-h-0 bg-background" bottomMargin="0">
      <div className="px-6 py-5">
        <h1 className="text-lg font-semibold">Recents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Working files from my Figma account, exported page by page. Drag to pan, pinch or ⌘-scroll to zoom.
        </p>
        <div className="mt-5 grid gap-5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {FIGMA_FILES.map((file) => {
            const cover = file.pages[0];
            const coverLayer = cover.layers[0] ?? { x: 0, y: 0, w: cover.w, h: cover.h };
            return (
              <button
                key={file.slug}
                type="button"
                onClick={() => onOpen(file.slug)}
                className="group text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-lg border border-muted-foreground/20 can-hover:group-hover:border-blue-500"
                  style={{ background: file.background }}
                >
                  <CoverThumbnail image={cover.image} pageWidth={cover.w} pageHeight={cover.h} rect={coverLayer} />
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <FileIcon file={file} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{file.title}</div>
                    <div className="text-xs text-muted-foreground">{formatEdited(file.edited)}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

/** Crops a page image to one layer, scaled to cover the card. */
function CoverThumbnail({
  image,
  pageWidth,
  pageHeight,
  rect,
}: {
  image: string;
  pageWidth: number;
  pageHeight: number;
  rect: { x: number; y: number; w: number; h: number };
}) {
  const cardRatio = 4 / 3;
  const width = rect.w / rect.h > cardRatio ? (rect.h * cardRatio) : rect.w;
  const height = width / cardRatio;
  // Anchor to the layer's top-left: covers and title slides read from there.
  const left = rect.x;
  const top = rect.y;
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: `${(pageWidth / width) * 100}% ${(pageHeight / height) * 100}%`,
        backgroundPosition: `${pageWidth === width ? 0 : (left / (pageWidth - width)) * 100}% ${
          pageHeight === height ? 0 : (top / (pageHeight - height)) * 100
        }%`,
      }}
    />
  );
}

function formatZoom(zoom: number): string {
  const percent = zoom * 100;
  return `${percent < 10 ? percent.toFixed(1) : Math.round(percent)}%`;
}

export function FigmaApp({ isMobile = false, inShell = false, onOpenApp }: FigmaAppProps) {
  const windowFocus = useWindowFocus();
  const inDesktopShell = !!(inShell && windowFocus && !isMobile);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [restored, setRestored] = useState(false);
  const canvasRef = useRef<FigmaCanvasHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const file = getFigmaFile(openSlug);
  const page = useMemo(
    () => (file ? file.pages.find((candidate) => candidate.id === pageId) ?? file.pages[0] : null),
    [file, pageId]
  );
  const layer = page && selectedLayer !== null ? page.layers[selectedLayer] ?? null : null;
  const caseStudy = file ? caseStudyFor(file) : null;

  useEffect(() => {
    const saved = loadFigmaState();
    if (saved && getFigmaFile(saved.slug)) {
      setOpenSlug(saved.slug);
      setPageId(saved.pageId);
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) saveFigmaState(openSlug ? { slug: openSlug, pageId: page?.id ?? null } : null);
  }, [restored, openSlug, page?.id]);

  const openFile = useCallback((slug: string) => {
    setOpenSlug(slug);
    setPageId(null);
    setSelectedLayer(null);
  }, []);

  const closeFile = useCallback(() => {
    setOpenSlug(null);
    setPageId(null);
    setSelectedLayer(null);
  }, []);

  const selectPage = useCallback((id: string) => {
    setPageId(id);
    setSelectedLayer(null);
  }, []);

  const selectLayerFromList = useCallback((index: number) => {
    setSelectedLayer(index);
    canvasRef.current?.zoomToLayer(index);
  }, []);

  // Figma's view shortcuts, only while this window is focused.
  useEffect(() => {
    if (!file) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (inDesktopShell && !windowFocus?.isFocused) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (event.shiftKey && event.code === "Digit1") {
        event.preventDefault();
        canvas.zoomToFit();
      } else if (event.shiftKey && event.code === "Digit0") {
        event.preventDefault();
        canvas.zoomTo100();
      } else if (event.shiftKey && event.code === "Digit2" && selectedLayer !== null) {
        event.preventDefault();
        canvas.zoomToLayer(selectedLayer);
      } else if (!event.metaKey && !event.ctrlKey && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        canvas.zoomStep(1);
      } else if (!event.metaKey && !event.ctrlKey && event.key === "-") {
        event.preventDefault();
        canvas.zoomStep(-1);
      } else if (event.key === "Escape" && selectedLayer !== null) {
        event.preventDefault();
        setSelectedLayer(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, selectedLayer, inDesktopShell, windowFocus?.isFocused]);

  const openCaseStudy = () => {
    if (caseStudy && onOpenApp) onOpenApp("safari", caseStudy.archivePath);
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background text-foreground" data-app="figma">
      <WindowNavShell
        isMobile={false}
        className="border-b border-muted-foreground/20 py-1.5"
        onMouseDown={inDesktopShell ? windowFocus?.onDragStart : undefined}
        left={
          <div className="flex items-center gap-2">
            <WindowControls
              inShell={inDesktopShell}
              showWhenNotInShell={!isMobile}
              className="p-2"
              onClose={inDesktopShell ? windowFocus?.closeWindow : !isMobile ? () => window.close() : undefined}
              onMinimize={inDesktopShell ? windowFocus?.minimizeWindow : undefined}
              onToggleMaximize={inDesktopShell ? windowFocus?.toggleMaximize : undefined}
              isMaximized={windowFocus?.isMaximized ?? false}
              closeLabel={inDesktopShell ? "Close window" : "Close tab"}
            />
            <div className="flex items-center gap-1" onMouseDown={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={closeFile}
                aria-label="Home"
                aria-current={!file ? "page" : undefined}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground",
                  !file ? "bg-background text-foreground shadow-sm" : "can-hover:hover:bg-background/60"
                )}
              >
                <Home size={14} />
              </button>
              {file && (
                <div className="flex h-7 max-w-[280px] items-center gap-2 rounded-md bg-background pl-2.5 pr-1 shadow-sm">
                  <FileIcon file={file} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium">{file.title}</span>
                  <button
                    type="button"
                    onClick={closeFile}
                    aria-label={`Close ${file.title}`}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground can-hover:hover:bg-muted"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        }
        right={
          file ? (
            <div className="flex items-center gap-0.5 text-muted-foreground" onMouseDown={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => canvasRef.current?.zoomStep(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-md can-hover:hover:bg-background/60"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                aria-label="Zoom to fit"
                title="Zoom to fit (⇧1)"
                onClick={() => canvasRef.current?.zoomToFit()}
                className="h-7 min-w-[52px] rounded-md px-1.5 text-xs tabular-nums can-hover:hover:bg-background/60"
              >
                {formatZoom(zoom)}
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => canvasRef.current?.zoomStep(1)}
                className="flex h-7 w-7 items-center justify-center rounded-md can-hover:hover:bg-background/60"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : null
        }
      />

      {!file || !page ? (
        <RecentsGrid onOpen={openFile} />
      ) : (
        <div className="flex flex-1 min-h-0">
          <aside className="w-[220px] shrink-0 flex flex-col border-r border-muted-foreground/20 bg-muted">
            {file.pages.length > 1 && (
              <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground">Pages</div>
            )}
            {file.pages.length > 1 && (
              <ul className="px-1.5 pb-2 border-b border-muted-foreground/20">
                {file.pages.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => selectPage(candidate.id)}
                      className={cn(
                        "w-full truncate rounded-md px-2 py-1 text-left text-xs",
                        candidate.id === page.id ? "bg-blue-500 text-white" : "text-foreground"
                      )}
                    >
                      {candidate.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-3 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground">
              {file.kind === "slides" ? "Slides" : "Layers"}
            </div>
            <ScrollArea className="flex-1 min-h-0" bottomMargin="0">
              <ul className="px-1.5 pb-3">
                {page.layers.map((candidate, index) => (
                  <li key={`${candidate.name}-${index}`}>
                    <button
                      type="button"
                      onClick={() => selectLayerFromList(index)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs",
                        selectedLayer === index ? "bg-blue-500 text-white" : "text-foreground"
                      )}
                    >
                      <Frame
                        size={12}
                        className={cn("shrink-0", selectedLayer === index ? "text-white" : "text-muted-foreground")}
                        aria-hidden="true"
                      />
                      <span className="truncate">{candidate.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </aside>

          <FigmaCanvas
            ref={canvasRef}
            page={page}
            background={file.background}
            selectedLayer={selectedLayer}
            onSelectLayer={setSelectedLayer}
            onZoomChange={setZoom}
          />

          <aside className="w-[240px] shrink-0 border-l border-muted-foreground/20 bg-muted">
            <ScrollArea className="h-full" bottomMargin="0">
              {layer ? (
                <div className="p-3 text-xs">
                  <div className="text-[11px] font-semibold text-muted-foreground">Frame</div>
                  <div className="mt-1 text-sm font-medium break-words">{layer.name}</div>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 tabular-nums">
                    {(
                      [
                        ["X", layer.x],
                        ["Y", layer.y],
                        ["W", layer.w],
                        ["H", layer.h],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex items-center gap-2 rounded-md bg-background px-2 py-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span>{Math.round(value)}</span>
                      </div>
                    ))}
                  </div>
                  {layer.note && (
                    <>
                      <div className="mt-4 text-[11px] font-semibold text-muted-foreground">Note</div>
                      <p className="mt-1 leading-relaxed">{layer.note}</p>
                    </>
                  )}
                  <p className="mt-4 text-muted-foreground">⇧2 zooms to selection · Esc deselects</p>
                </div>
              ) : (
                <div className="p-3 text-xs">
                  <div className="text-[11px] font-semibold text-muted-foreground">File</div>
                  <div className="mt-1 text-sm font-medium break-words">{file.title}</div>
                  <div className="mt-1 text-muted-foreground">
                    {formatEdited(file.edited)} · {file.pages.length} {file.pages.length === 1 ? "page" : "pages"}
                  </div>
                  {caseStudy && onOpenApp && (
                    <button
                      type="button"
                      onClick={openCaseStudy}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white can-hover:hover:bg-blue-600"
                    >
                      Read the case study
                      <ExternalLink size={12} aria-hidden="true" />
                    </button>
                  )}
                  <div className="mt-5 text-[11px] font-semibold text-muted-foreground">Getting around</div>
                  <ul className="mt-1 space-y-1 leading-relaxed text-muted-foreground">
                    <li>Drag to pan, scroll to move</li>
                    <li>Pinch or ⌘-scroll to zoom</li>
                    <li>Click a frame to inspect it</li>
                    <li>⇧1 fits the page</li>
                  </ul>
                </div>
              )}
            </ScrollArea>
          </aside>
        </div>
      )}
    </div>
  );
}
