"use client";

import { useCallback, useRef, useState } from "react";

/** Where the browser opens: the archived smithkipnis.com home page. */
export const START_PAGE_PATH = "/website";

/** The host shown in the address bar. The archive stands in for this site. */
export const ARCHIVE_HOST = "smithkipnis.com";

/**
 * Session history for the framed archive.
 *
 * The frame keeps its own history, but it is not usable from here: reading or
 * driving it means fighting the iframe's back-forward cache, and it also holds
 * entries we never created. Keeping our own stack means back and forward mean
 * exactly what the toolbar says they mean.
 *
 * `visited` is called when the frame finishes loading a page. A path that
 * differs from the current entry can only have come from a link click, so it
 * pushes — and, like a real browser, discards any forward entries.
 */
export function useArchiveHistory() {
  const [entries, setEntries] = useState<string[]>([START_PAGE_PATH]);
  const [index, setIndex] = useState(0);
  // Set while we drive the frame ourselves, so the resulting load is not
  // mistaken for the user following a link.
  const navigatingRef = useRef(false);

  const current = entries[index];

  const visited = useCallback(
    (path: string) => {
      if (navigatingRef.current) {
        navigatingRef.current = false;
        return;
      }
      setEntries((prev) => {
        if (prev[index] === path) return prev;
        const next = prev.slice(0, index + 1);
        next.push(path);
        setIndex(next.length - 1);
        return next;
      });
    },
    [index]
  );

  const back = useCallback(() => {
    if (index === 0) return;
    navigatingRef.current = true;
    setIndex(index - 1);
  }, [index]);

  const forward = useCallback(() => {
    if (index >= entries.length - 1) return;
    navigatingRef.current = true;
    setIndex(index + 1);
  }, [index, entries.length]);

  const go = useCallback(
    (path: string) => {
      if (path === current) return;
      navigatingRef.current = true;
      setEntries((prev) => {
        const next = prev.slice(0, index + 1);
        next.push(path);
        setIndex(next.length - 1);
        return next;
      });
    },
    [current, index]
  );

  return {
    current,
    canGoBack: index > 0,
    canGoForward: index < entries.length - 1,
    back,
    forward,
    go,
    visited,
  };
}

/** "/website" → "smithkipnis.com"; "/website/casestudies" → "smithkipnis.com/casestudies". */
export function addressFor(path: string): string {
  const rest = path.replace(/^\/website/, "");
  return `${ARCHIVE_HOST}${rest}`;
}
