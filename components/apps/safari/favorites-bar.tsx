"use client";

import { SITE_PAGES } from "@/config/bookmarks";
import { cn } from "@/lib/utils";

interface FavoritesBarProps {
  isMobileView: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  /** Current archive path, so the active page can be marked. */
  path: string;
  /** Load an archive page into the frame. */
  onNavigate: (path: string) => void;
}

/**
 * Safari's Favorites Bar: the thin strip under the toolbar.
 *
 * Only the site's own pages live here, and every one of them browses inside
 * the frame. Links that leave for a real tab used to sit beside them and
 * looked identical, which read as a bug: peers that behave differently.
 *
 * The bar is part of the window chrome, so it is a drag handle: a press on it
 * activates a background window and starts the move in one gesture, the same
 * as the toolbar above it. The page buttons stop propagation so a press on
 * one is a click, not a drag.
 */
export function FavoritesBar({
  isMobileView,
  onDragStart,
  path,
  onNavigate,
}: FavoritesBarProps) {
  return (
    <div
      data-window-drag-handle="true"
      onMouseDown={onDragStart}
      className={cn(
        "shrink-0 flex items-center gap-1 px-3 h-9 select-none",
        "border-b border-muted-foreground/20 overflow-x-auto",
        // The bar is chrome, not content: hide the scrollbar the way Safari does.
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        isMobileView ? "bg-background" : "bg-muted"
      )}
    >
      {SITE_PAGES.map((page) => {
        const active = page.path === path;
        return (
          <button
            key={page.path}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onNavigate(page.path)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 px-2 py-1 rounded-md text-xs whitespace-nowrap",
              "can-hover:hover:bg-foreground/10",
              active ? "text-foreground font-medium" : "text-foreground/80"
            )}
          >
            {page.title}
          </button>
        );
      })}
    </div>
  );
}
