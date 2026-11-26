"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import {
  type Camera,
  type Rect,
  fitRect,
  hitTest,
  stepZoom,
  toPage,
  zoomAt,
} from "@/lib/figma-camera";
import type { FigmaPage } from "@/lib/figma-files";

export interface FigmaCanvasHandle {
  zoomToFit: () => void;
  zoomToLayer: (index: number) => void;
  zoomTo100: () => void;
  zoomStep: (direction: 1 | -1) => void;
}

interface FigmaCanvasProps {
  page: FigmaPage;
  background: string;
  selectedLayer: number | null;
  onSelectLayer: (index: number | null) => void;
  onZoomChange: (zoom: number) => void;
}

/** Pointer travel, in px, before a press becomes a pan instead of a click. */
const DRAG_THRESHOLD = 3;

function pageRect(page: FigmaPage): Rect {
  return { x: 0, y: 0, w: page.w, h: page.h };
}

/**
 * The page canvas: one exported page image under a camera, with Figma's
 * hover and selection outlines drawn in screen space so they stay one pixel
 * wide at any zoom.
 *
 * Drag pans (visitors don't need marquee select), a click selects the layer
 * under the pointer, scroll pans, and ⌘/ctrl-scroll or a pinch zooms at the
 * pointer, as in Figma.
 */
export const FigmaCanvas = forwardRef<FigmaCanvasHandle, FigmaCanvasProps>(function FigmaCanvas(
  { page, background, selectedLayer, onSelectLayer, onZoomChange },
  ref
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [panning, setPanning] = useState(false);
  const pressRef = useRef<{ x: number; y: number; camera: Camera; moved: boolean; id: number } | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  const applyCamera = useCallback(
    (next: Camera, animate = false) => {
      cameraRef.current = next;
      setCamera(next);
      onZoomChange(next.zoom);
      if (animationTimerRef.current) window.clearTimeout(animationTimerRef.current);
      setAnimating(animate);
      if (animate) {
        animationTimerRef.current = window.setTimeout(() => setAnimating(false), 260);
      }
    },
    [onZoomChange]
  );

  const viewportSize = useCallback(() => {
    const element = viewportRef.current;
    return { width: element?.clientWidth ?? 800, height: element?.clientHeight ?? 600 };
  }, []);

  const zoomToFit = useCallback(
    (animate = true) => applyCamera(fitRect(viewportSize(), pageRect(page), 48, 1), animate),
    [applyCamera, page, viewportSize]
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomToFit: () => zoomToFit(true),
      zoomToLayer: (index: number) => {
        const layer = page.layers[index];
        if (layer) applyCamera(fitRect(viewportSize(), layer, 64, 2), true);
      },
      zoomTo100: () => {
        const current = cameraRef.current;
        if (!current) return;
        const size = viewportSize();
        applyCamera(zoomAt(current, { x: size.width / 2, y: size.height / 2 }, 1 / current.zoom), true);
      },
      zoomStep: (direction: 1 | -1) => {
        const current = cameraRef.current;
        if (current) applyCamera(stepZoom(current, viewportSize(), direction), true);
      },
    }),
    [applyCamera, page, viewportSize, zoomToFit]
  );

  // A new page opens fit to the window, without animating in from the old one.
  useLayoutEffect(() => {
    zoomToFit(false);
    setHoveredLayer(null);
  }, [page, zoomToFit]);

  // Wheel has to be a non-passive listener to stop the page itself scrolling.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = cameraRef.current;
      if (!current) return;
      const bounds = element.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        applyCamera(zoomAt(current, point, Math.exp(-event.deltaY * 0.01)));
      } else {
        const scale = event.deltaMode === 1 ? 16 : 1;
        applyCamera({
          ...current,
          x: current.x - event.deltaX * scale,
          y: current.y - event.deltaY * scale,
        });
      }
    };
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [applyCamera]);

  // Keep the page centered on the same point as the window resizes.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    let last = { width: element.clientWidth, height: element.clientHeight };
    const observer = new ResizeObserver(() => {
      const current = cameraRef.current;
      const next = { width: element.clientWidth, height: element.clientHeight };
      if (current) {
        applyCamera({
          ...current,
          x: current.x + (next.width - last.width) / 2,
          y: current.y + (next.height - last.height) / 2,
        });
      }
      last = next;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [applyCamera]);

  useEffect(
    () => () => {
      if (animationTimerRef.current) window.clearTimeout(animationTimerRef.current);
    },
    []
  );

  const layerAt = useCallback(
    (clientX: number, clientY: number) => {
      const element = viewportRef.current;
      const current = cameraRef.current;
      if (!element || !current) return -1;
      const bounds = element.getBoundingClientRect();
      return hitTest(page.layers, toPage(current, { x: clientX - bounds.left, y: clientY - bounds.top }));
    },
    [page.layers]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    const current = cameraRef.current;
    if (!current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pressRef.current = { x: event.clientX, y: event.clientY, camera: current, moved: false, id: event.pointerId };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (press && press.id === event.pointerId) {
      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;
      if (!press.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        press.moved = true;
        setPanning(true);
        setHoveredLayer(null);
      }
      if (press.moved) {
        applyCamera({ ...press.camera, x: press.camera.x + dx, y: press.camera.y + dy });
      }
      return;
    }
    if (event.pointerType === "mouse") {
      const index = layerAt(event.clientX, event.clientY);
      setHoveredLayer(index >= 0 ? index : null);
    }
  };

  const endPress = (event: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press || press.id !== event.pointerId) return;
    pressRef.current = null;
    setPanning(false);
    if (!press.moved && event.type === "pointerup") {
      const index = layerAt(event.clientX, event.clientY);
      onSelectLayer(index >= 0 ? index : null);
    }
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const index = layerAt(event.clientX, event.clientY);
    if (index >= 0) {
      onSelectLayer(index);
      const layer = page.layers[index];
      applyCamera(fitRect(viewportSize(), layer, 64, 2), true);
    }
  };

  const outline = (index: number | null) => {
    if (index === null || !camera) return null;
    const layer = page.layers[index];
    if (!layer) return null;
    return {
      left: camera.x + layer.x * camera.zoom,
      top: camera.y + layer.y * camera.zoom,
      width: layer.w * camera.zoom,
      height: layer.h * camera.zoom,
      layer,
    };
  };

  const selected = outline(selectedLayer);
  const hovered = hoveredLayer !== selectedLayer ? outline(hoveredLayer) : null;
  const transition = animating ? "transform 240ms cubic-bezier(0.2, 0, 0, 1)" : undefined;
  const outlineTransition = animating
    ? "left 240ms cubic-bezier(0.2, 0, 0, 1), top 240ms cubic-bezier(0.2, 0, 0, 1), width 240ms cubic-bezier(0.2, 0, 0, 1), height 240ms cubic-bezier(0.2, 0, 0, 1)"
    : undefined;

  return (
    <div
      ref={viewportRef}
      className="relative flex-1 min-w-0 overflow-hidden select-none touch-none"
      style={{ background, cursor: panning ? "grabbing" : "default" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={() => setHoveredLayer(null)}
      onDoubleClick={handleDoubleClick}
      data-figma-canvas="true"
    >
      {camera && (
        // eslint-disable-next-line @next/next/no-img-element -- a page export this large is served as-is; next/image would resize it
        <img
          key={page.image}
          src={page.image}
          alt={`${page.name} page`}
          width={page.w}
          height={page.h}
          draggable={false}
          className="absolute left-0 top-0 max-w-none pointer-events-none"
          style={{
            width: page.w,
            height: page.h,
            transformOrigin: "0 0",
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transition,
          }}
        />
      )}

      {hovered && (
        <div
          className="absolute pointer-events-none border border-blue-500"
          style={{ left: hovered.left, top: hovered.top, width: hovered.width, height: hovered.height }}
        />
      )}

      {selected && (
        <div
          className="absolute pointer-events-none border-2 border-blue-500"
          style={{
            left: selected.left - 1,
            top: selected.top - 1,
            width: selected.width + 2,
            height: selected.height + 2,
            transition: outlineTransition,
          }}
        >
          <div className="absolute -top-5 left-0 text-[11px] leading-4 text-blue-500 whitespace-nowrap">
            {selected.layer.name}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 rounded bg-blue-500 px-1 text-[11px] leading-4 text-white whitespace-nowrap tabular-nums">
            {Math.round(selected.layer.w)} × {Math.round(selected.layer.h)}
          </div>
        </div>
      )}
    </div>
  );
});
