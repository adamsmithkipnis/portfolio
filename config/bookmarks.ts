/**
 * Safari's Favorites Bar.
 *
 * This is the whole content model for the browser app: adding a page is
 * editing this file, never a component. Every entry is a page of the archived
 * site, loaded into Safari's frame.
 *
 * Off-site links (GitHub, LinkedIn, and the rest) deliberately do not live
 * here. They used to, and they looked identical to these pages while opening
 * a real browser tab, which reads as a broken link. The archived site's own
 * footer carries them instead. Typing an outside address into the toolbar
 * still opens it in a real tab; that is the visitor's choice, not a peer link.
 */

export interface SitePage {
  title: string;
  /** Path under /website, loaded into the frame. */
  path: string;
}

/**
 * Pages of the archived site. The original links to its case studies from
 * nowhere, so without these the archive would only be reachable by typing a
 * URL.
 */
export const SITE_PAGES: SitePage[] = [
  { title: "Home", path: "/website" },
  { title: "Case Studies", path: "/website/casestudies" },
];
