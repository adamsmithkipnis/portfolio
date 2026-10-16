/**
 * Whether a drag or resize should be considered over, given what a pointer
 * event reports. Embedded content and out-of-viewport releases can swallow
 * `mouseup`, so any move that reports no pressed buttons — or a pointer that
 * was cancelled or lost — ends the gesture rather than leaving the window
 * stuck "interacting" (which keeps its iframes inert).
 */
export function shouldEndInteraction(
  active: boolean,
  event: { type: string; buttons?: number },
): boolean {
  if (!active) return false;
  switch (event.type) {
    case "mouseup":
    case "pointerup":
    case "pointercancel":
    case "lostpointercapture":
    case "contextmenu":
    case "blur":
    case "visibilitychange":
      return true;
    case "mousemove":
    case "pointermove":
      return event.buttons === 0;
    default:
      return false;
  }
}
