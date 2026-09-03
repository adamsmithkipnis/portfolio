"use client";

import { BOOKMARK_SECTIONS, SITE_PAGES } from "@/config/bookmarks";
import { monogram, monogramTextColor } from "@/lib/safari-url";
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
 * Safari's Favorites Bar: the thin strip of bookmarks under the toolbar.
 *
 * The links moved here when the start page became the archived site — real
 * Safari puts them in exactly this position, so both can coexist without
 * competing for the same space.
 *
 * Plain anchors, like the tiles they replaced, so cmd-click and Copy Link
 * still behave. It scrolls horizontally rather than wrapping, because the bar
 * is a fixed-height strip in the real thing.
 */
export function FavoritesBar({
  isMobileView,
  onDragStart,
  path,
  onNavigate,
}: FavoritesBarProps) {
  const bookmarks = BOOKMARK_SECTIONS.flatMap((section) => section.bookmarks);

  return (
    <div
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

      {/* Separates the site's own pages, which browse in the frame, from
          bookmarks that leave for a real tab. */}
      <span aria-hidden="true" className="shrink-0 w-px h-4 bg-muted-foreground/25 mx-1" />

      {bookmarks.map((bookmark) => (
        <a
          key={bookmark.url}
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          title={bookmark.title}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md",
            "text-xs text-foreground/80 whitespace-nowrap no-underline",
            "can-hover:hover:bg-foreground/10"
          )}
        >
          <span
            aria-hidden="true"
            className="w-4 h-4 rounded-[4px] flex items-center justify-center text-[9px] font-semibold"
            style={{
              backgroundColor: bookmark.tint ?? "#0A7CFF",
              color: monogramTextColor(bookmark.tint),
            }}
          >
            {monogram(bookmark.title)}
          </span>
          {bookmark.title}
        </a>
      ))}
    </div>
  );
}
