"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ARCHIVE_ROOT, archivePathFor } from "@/lib/archive-site";

/** Where the browser opens: the archived smithkipnis.com home page. */
export const START_PAGE_PATH = ARCHIVE_ROOT;

/**
 * A page another app asked Safari to show, such as a case study opened from
 * Finder. `id` makes each request distinct, so opening the same page twice
 * still navigates the second time.
 */
export interface ArchivePageRequest {
  path: string;
  id: number;
}

/** Only archived pages can load in the frame; anything else opens the start page. */
function resolveRequest(request: ArchivePageRequest | undefined): string {
  if (!request) return START_PAGE_PATH;
  return archivePathFor(request.path) ?? START_PAGE_PATH;
}

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
export function useArchiveHistory(request?: ArchivePageRequest) {
  const [entries, setEntries] = useState<string[]>([resolveRequest(request)]);
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

  // A request that arrives while the browser is already open browses to it,
  // the way a link opened from another app lands in a running Safari. The
  // first request is consumed by the initial state above.
  const handledRequestId = useRef(request?.id);
  useEffect(() => {
    if (!request || request.id === handledRequestId.current) return;
    handledRequestId.current = request.id;
    go(resolveRequest(request));
  }, [request, go]);

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
