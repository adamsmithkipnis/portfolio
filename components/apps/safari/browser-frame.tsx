"use client";

import { useEffect, useRef } from "react";

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
 * The sandbox keeps the frame from navigating the top window away from the
 * desktop. It is not a security boundary: allow-same-origin and allow-scripts
 * together let same-origin content out of it, and both are needed here — the
 * former to read the current path, the latter for the YouTube embeds in the
 * case studies, which inherit this sandbox.
 */
export function BrowserFrame({ src, onNavigate }: BrowserFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const report = () => {
      try {
        const path = frame.contentWindow?.location.pathname;
        if (path) onNavigate(path);
      } catch {
        // A cross-origin document would throw. Nothing here should be, but a
        // stray navigation should not take the app down with it.
      }
    };
    frame.addEventListener("load", report);
    return () => frame.removeEventListener("load", report);
  }, [onNavigate]);

  return (
    <iframe
      ref={ref}
      src={src}
      title="smithkipnis.com"
      className="flex-1 w-full border-0 bg-background"
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation"
    />
  );
}
