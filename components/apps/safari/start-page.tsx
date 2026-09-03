"use client";

/** The archived smithkipnis.com, served from our own origin. */
export const START_PAGE_PATH = "/website";

/**
 * The start page: the recreated smithkipnis.com in a frame.
 *
 * Framed rather than composed as components on purpose. The page is meant to
 * read as a different website, so its palette and type must not mix with the
 * macOS design tokens — an iframe seals both directions. It is same-origin, so
 * unlike the live Squarespace site (which sends X-Frame-Options: SAMEORIGIN)
 * there is nothing to work around.
 *
 * Links inside the frame carry target="_blank" so they escape it instead of
 * loading the whole site into this little box.
 */
export function StartPage() {
  return (
    <iframe
      src={START_PAGE_PATH}
      title="smithkipnis.com"
      className="flex-1 w-full border-0 bg-background"
      // No allow-popups needed: the page only navigates, it never scripts.
      // Same-origin so the frame can load our own assets.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  );
}
