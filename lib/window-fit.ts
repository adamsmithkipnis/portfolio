/**
 * Window geometry: fitting an app's preset to the desktop, and repairing a
 * window an earlier fit had squashed.
 *
 * This is separate from `window-context` so the arithmetic can be tested
 * without React or a DOM. The bug it exists to prevent was invisible from the
 * outside: a window fitted against an unmeasured or very short viewport
 * collapsed towards a single pixel, that size was persisted, and the app then
 * looked like an icon that did nothing for the rest of the tab session.
 */

import { Position, Size } from "@/types/window";

export const MENU_BAR_HEIGHT = 28;
export const DOCK_HEIGHT = 80;
export const DEFAULT_WINDOW_DOCK_GAP = 12;

/** Vertical space a window can occupy between the menu bar and the dock. */
export function availableDesktopHeight(viewportHeight: number): number {
  return Math.max(
    1,
    viewportHeight - DOCK_HEIGHT - DEFAULT_WINDOW_DOCK_GAP - MENU_BAR_HEIGHT
  );
}

/**
 * Fits a preset to the desktop.
 *
 * A window may open shorter than its preset to make room for the dock, but
 * never shorter than the app says it needs: below that it is unusable, and on
 * a short viewport it collapses to nothing. Overflowing the dock is the better
 * failure, because the window can still be seen, moved and resized.
 *
 * `viewportHeight` of zero or less means the viewport has not been measured
 * yet, and the preset passes through untouched.
 */
export function fitToDesktop(
  position: Position,
  size: Size,
  viewportHeight: number,
  minSize?: Size
): { position: Position; size: Size } {
  if (viewportHeight <= 0) {
    return { position, size };
  }

  const availableBottom =
    viewportHeight - DOCK_HEIGHT - DEFAULT_WINDOW_DOCK_GAP;
  const availableHeight = availableDesktopHeight(viewportHeight);

  // Never below the app's own minimum, and never above the preset: an app that
  // asks for a smaller window than its minimum keeps the smaller number.
  const floor = Math.min(minSize?.height ?? 0, size.height);
  const height = Math.max(floor, Math.min(size.height, availableHeight));

  const y = Math.min(
    Math.max(position.y, MENU_BAR_HEIGHT),
    Math.max(MENU_BAR_HEIGHT, availableBottom - height)
  );

  return {
    position: { ...position, y },
    size: { ...size, height },
  };
}

/**
 * Grows back a restored window that an earlier fit had squashed below the
 * app's minimum.
 *
 * Fitted sizes are persisted, so a window opened on a short viewport stayed
 * short after the viewport grew, and one collapsed to a pixel never became
 * visible again. This only ever grows a window, and only up to what the app
 * asks for, so a size the visitor chose themselves is left alone.
 */
export function repairSquashedHeight(
  position: Position,
  size: Size,
  viewportHeight: number,
  appDefaultSize: Size,
  minSize?: Size
): { position: Position; size: Size } {
  const minHeight = minSize?.height;
  if (!minHeight || size.height >= minHeight) {
    return { position, size };
  }

  const fitted = fitToDesktop(
    position,
    { ...size, height: appDefaultSize.height },
    viewportHeight,
    minSize
  );

  return {
    position: fitted.position,
    size: { ...size, height: fitted.size.height },
  };
}
