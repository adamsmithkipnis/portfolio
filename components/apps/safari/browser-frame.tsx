"use client";

import { useEffect, useRef, type WheelEvent } from "react";

interface BrowserFrameProps {
  /** Path to display. Changing it navigates the frame. */
  src: string;
  /** Called with the path the frame actually settled on, after each load. */
  onNavigate: (path: string) => void;
}

/**
 * The framed archive.
 *
 * Framed rather than composed as components so the archived site's palette and
 * type cannot mix with the macOS tokens in either direction. It is same-origin,
 * so unlike the live Squarespace site — which sends X-Frame-Options: SAMEORIGIN
 * — there is nothing to work around, and we can read back where the frame went.
 *
 * The sandbox is here for one thing: without allow-top-navigation, the frame
 * cannot navigate the whole desktop away. It is not a security boundary —
 * allow-same-origin and allow-scripts together let same-origin content out of
 * it — but both are needed, the former to read the current path and the latter
 * for the YouTube embeds, which inherit these flags. Storage access on user
 * activation is granted for the same reason: the player asks for it on play.
 */
export function BrowserFrame({ src, onNavigate }: BrowserFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  // The frame is uncontrolled after mount. Rendering src={src} made React
  // rewrite the attribute whenever history changed, and assigning an iframe
  // src navigates even when the value is identical — so every link click
  // loaded the page once for the click and again for the history entry it
  // produced. Holding the mount value still keeps React off the attribute.
  const initialSrc = useRef(src);
  // Where the frame actually is, per its own load event, which is the only
  // thing that can tell a page we asked for from a page a link went to.
  const loadedPath = useRef(src);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const report = () => {
      try {
        const path = frame.contentWindow?.location.pathname;
        if (path) {
          loadedPath.current = path;
          onNavigate(path);
        }
      } catch {
        // A cross-origin document would throw. Nothing here should be, but a
        // stray navigation should not take the app down with it.
      }
    };
    frame.addEventListener("load", report);
    return () => frame.removeEventListener("load", report);
  }, [onNavigate]);

  // Drive the frame only towards a page it is not already showing. A path that
  // matches came from the frame itself — the toolbar catching up with a link
  // click — and re-asserting it would just reload what is on screen.
  useEffect(() => {
    const frame = ref.current;
    if (!frame || src === loadedPath.current) return;
    loadedPath.current = src;
    frame.src = src;
  }, [src]);

  // While the window is in the background, the shell makes the frame inert so
  // the first click lands on the window and brings it forward (see the iframe
  // rule in `components/desktop/window.tsx`). That also stops wheel events
  // reaching the page, so the site could not be scrolled until it was clicked.
  // macOS scrolls whatever window is under the cursor, focused or not — so
  // hand the wheel through. An inert frame lets the event fall onto this
  // wrapper; an interactive one swallows it first, so this never double-scrolls.
  const forwardWheel = (event: WheelEvent<HTMLDivElement>) => {
    const target = ref.current?.contentWindow;
    if (!target) return;
    const unit = wheelDeltaUnit(event.deltaMode, target);
    try {
      target.scrollBy(event.deltaX * unit, event.deltaY * unit);
    } catch {
      // Cross-origin content would throw. Nothing here should be, but a
      // stray navigation should not take the app down with it.
    }
  };

  return (
    // The frame stays a flex child rather than being absolutely positioned:
    // Chrome loses track of an absolutely positioned frame's scroller when its
    // containing block is resized by hand, and the page stops responding to
    // the wheel until the next layout change. As a flex child it survives.
    <div className="flex flex-1 min-h-0 flex-col" onWheel={forwardWheel}>
      <iframe
        ref={ref}
        src={initialSrc.current}
        title="smithkipnis.com"
        className="flex-1 w-full border-0 bg-background"
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation allow-storage-access-by-user-activation"
      />
    </div>
  );
}

/** Pixels per unit of wheel delta: trackpads and most mice report pixels, some mice lines. */
function wheelDeltaUnit(deltaMode: number, frame: Window): number {
  if (deltaMode === 1) return 16; // DOM_DELTA_LINE
  if (deltaMode === 2) return frame.innerHeight; // DOM_DELTA_PAGE
  return 1; // DOM_DELTA_PIXEL
}
