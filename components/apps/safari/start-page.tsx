"use client";

import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BOOKMARK_SECTIONS, type Bookmark } from "@/config/bookmarks";
import { displayHost, monogram } from "@/lib/safari-url";
import { cn } from "@/lib/utils";

interface StartPageProps {
  isMobileView: boolean;
}

/**
 * Safari's Favorites grid, and the entire point of the app: every tile is a
 * real anchor to a real site. Nothing here is simulated, so there is no page
 * renderer, no iframe, and no proxy to maintain — the links simply leave.
 */
export function StartPage({ isMobileView }: StartPageProps) {
  return (
    <ScrollArea className="flex-1 bg-background">
      <div className={cn("mx-auto w-full max-w-[900px]", isMobileView ? "p-5" : "p-8")}>
        {BOOKMARK_SECTIONS.map((section) => (
          <section key={section.title} className="mb-8 last:mb-0">
            <h2 className="text-sm font-semibold text-foreground mb-4">{section.title}</h2>
            <div
              className={cn(
                "grid gap-x-4 gap-y-6",
                isMobileView
                  ? "grid-cols-[repeat(auto-fill,minmax(84px,1fr))]"
                  : "grid-cols-[repeat(auto-fill,minmax(104px,1fr))]"
              )}
            >
              {section.bookmarks.map((bookmark) => (
                <BookmarkTile key={bookmark.url} bookmark={bookmark} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </ScrollArea>
  );
}

/**
 * A plain anchor, deliberately — not a click handler. That keeps cmd-click,
 * middle-click, and "Copy Link" working the way they do in a real browser.
 */
function BookmarkTile({ bookmark }: { bookmark: Bookmark }) {
  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-2 text-center focus:outline-none"
    >
      <div
        className={cn(
          "w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center",
          "border border-muted-foreground/20 bg-muted",
          "transition-transform can-hover:group-hover:scale-105",
          "group-focus-visible:ring-2 group-focus-visible:ring-[#0A7CFF]"
        )}
        style={bookmark.icon ? undefined : { backgroundColor: bookmark.tint ?? "#0A7CFF" }}
      >
        {bookmark.icon ? (
          <Image
            src={bookmark.icon}
            alt=""
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-semibold text-white">{monogram(bookmark.title)}</span>
        )}
      </div>
      <div className="w-full min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{bookmark.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{displayHost(bookmark.url)}</p>
      </div>
    </a>
  );
}
