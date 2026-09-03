/**
 * Safari's Favorites grid.
 *
 * This is the whole content model for the browser app: adding a link is
 * editing this file, never a component. Every entry becomes a real anchor
 * pointing off-site, so `url` must be an absolute http(s) URL.
 *
 * `tint` is brand color, not theme color — it colors the monogram tile for a
 * bookmark with no bundled icon, the same way `accentColor` works in
 * `lib/app-config.ts`. Sites whose icon lives in `public/` set `icon` instead.
 */

export interface Bookmark {
  /** Tile label. Keep it short — it truncates to one line. */
  title: string;
  /** Absolute http(s) URL. Opens in a new tab, outside the desktop. */
  url: string;
  /** Optional image in `public/` (e.g. "/safari.png"). Falls back to a monogram. */
  icon?: string;
  /** Brand color for the monogram tile. Ignored when `icon` is set. */
  tint?: string;
}

export interface BookmarkSection {
  title: string;
  bookmarks: Bookmark[];
}

export const BOOKMARK_SECTIONS: BookmarkSection[] = [
  {
    title: "Favorites",
    bookmarks: [
      {
        title: "smithkipnis.com",
        url: "https://smithkipnis.com",
        tint: "#0A7CFF",
      },
      {
        title: "GitHub",
        url: "https://github.com/adamsmithkipnis",
        tint: "#24292F",
      },
      {
        title: "X",
        url: "https://x.com/AdamSmithKipnis",
        tint: "#000000",
      },
    ],
  },
];

/** Flat list, for consumers that don't care about grouping. */
export const ALL_BOOKMARKS: Bookmark[] = BOOKMARK_SECTIONS.flatMap(
  (section) => section.bookmarks
);
