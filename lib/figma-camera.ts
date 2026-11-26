/**
 * Camera math for the Figma app's canvas.
 *
 * A camera maps page pixels to viewport pixels: screen = page * zoom + offset.
 * Kept pure so it can be tested without a DOM.
 */

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Size {
  width: number;
  height: number;
}

export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 4;

/** Figma's zoom steps for the + / − shortcuts. */
const ZOOM_STEPS = [0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 4];

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Centers `rect` in the viewport, as large as fits with `padding` on each side. */
export function fitRect(viewport: Size, rect: Rect, padding = 48, maxZoom = 1): Camera {
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const zoom = clampZoom(
    Math.min(availableWidth / Math.max(1, rect.w), availableHeight / Math.max(1, rect.h), maxZoom)
  );
  return {
    zoom,
    x: viewport.width / 2 - (rect.x + rect.w / 2) * zoom,
    y: viewport.height / 2 - (rect.y + rect.h / 2) * zoom,
  };
}

/** Zooms by `factor`, keeping the page point under `point` (viewport px) still. */
export function zoomAt(camera: Camera, point: { x: number; y: number }, factor: number): Camera {
  const zoom = clampZoom(camera.zoom * factor);
  const ratio = zoom / camera.zoom;
  return {
    zoom,
    x: point.x - (point.x - camera.x) * ratio,
    y: point.y - (point.y - camera.y) * ratio,
  };
}

/** Next step up or down from the current zoom, about the viewport center. */
export function stepZoom(camera: Camera, viewport: Size, direction: 1 | -1): Camera {
  const current = camera.zoom;
  const next =
    direction > 0
      ? ZOOM_STEPS.find((step) => step > current + 1e-6) ?? MAX_ZOOM
      : [...ZOOM_STEPS].reverse().find((step) => step < current - 1e-6) ?? MIN_ZOOM;
  return zoomAt(camera, { x: viewport.width / 2, y: viewport.height / 2 }, next / current);
}

/** Converts a viewport point to page coordinates. */
export function toPage(camera: Camera, point: { x: number; y: number }): { x: number; y: number } {
  return { x: (point.x - camera.x) / camera.zoom, y: (point.y - camera.y) / camera.zoom };
}

/**
 * The topmost layer under a page point. Layers are listed back to front, and
 * a smaller layer drawn inside a bigger one should win, so ties go to the
 * smallest area.
 */
export function hitTest<T extends Rect>(layers: T[], point: { x: number; y: number }): number {
  let best = -1;
  let bestArea = Infinity;
  layers.forEach((layer, index) => {
    const inside =
      point.x >= layer.x && point.x <= layer.x + layer.w && point.y >= layer.y && point.y <= layer.y + layer.h;
    const area = layer.w * layer.h;
    if (inside && area <= bestArea) {
      best = index;
      bestArea = area;
    }
  });
  return best;
}
