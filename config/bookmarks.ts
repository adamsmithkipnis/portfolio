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
        title: "GitHub",
        url: "https://github.com/adamsmithkipnis",
        tint: "#24292F",
      },
      {
        title: "Bluesky",
        url: "https://bsky.app/profile/adamsk.bsky.social",
        tint: "#0085FF",
      },
      {
        title: "Twitter",
        url: "https://x.com/AdamSmithKipnis",
        tint: "#000000",
      },
      {
        title: "LinkedIn",
        url: "https://www.linkedin.com/in/adamsmithkipnis",
        tint: "#0A66C2",
      },
      {
        title: "Patents",
        url: "https://patents.google.com/?inventor=smith-kipnis&num=100&patents=false",
        tint: "#4285F4",
      },
      {
        title: "Credits",
        url: "https://www.imdb.com/name/nm2224145/",
        tint: "#F5C518",
      },
      {
        title: "Minesweeper",
        url: "https://bsky.app/profile/playminesweeper.bsky.social",
        tint: "#C0C0C0",
      },
      {
        title: "Battleship Team Blue",
        url: "https://bsky.app/profile/battleshipblue.bsky.social",
        tint: "#1D4ED8",
      },
    ],
  },
];

/** Flat list, for consumers that don't care about grouping. */
export const ALL_BOOKMARKS: Bookmark[] = BOOKMARK_SECTIONS.flatMap(
  (section) => section.bookmarks
);
