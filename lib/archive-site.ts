/**
 * The archived smithkipnis.com: what exists, and how a typed address maps onto
 * it.
 *
 * Safari's address bar has to tell two cases apart. Typing an address that the
 * archive actually holds should browse to it inside the frame, the way it
 * would on the real site. Anything else — another site, a search, a page of
 * smithkipnis.com that was never archived — has to leave for a real tab,
 * because the frame can only serve what is in `public/archive/smithkipnis`.
 */

/** Host the archive stands in for. */
export const ARCHIVE_HOST = "smithkipnis.com";

/** Where the archive is served, and where the browser opens. */
export const ARCHIVE_ROOT = "/website";

/**
 * Every archived page. `tests/archive-links.test.ts` asserts this matches the
 * files on disk, so a page added without listing it here fails the build
 * rather than silently becoming unreachable from the address bar.
 */
export const ARCHIVE_PATHS = [
  ARCHIVE_ROOT,
  `${ARCHIVE_ROOT}/casestudies`,
  `${ARCHIVE_ROOT}/casestudies/invoca-workflow-agent`,
  `${ARCHIVE_ROOT}/casestudies/grace-providence`,
  `${ARCHIVE_ROOT}/casestudies/wilson-x`,
] as const;

/**
 * Case study addresses that were published before the slugs were readable.
 * They are the ones already out in the world, so typing one in the address bar
 * lands on the page it became, the same way `next.config.mjs` redirects them.
 */
export const LEGACY_ARCHIVE_PATHS: Readonly<Record<string, string>> = {
  [`${ARCHIVE_ROOT}/casestudies/project-one-f5w4d-3fh8d`]: `${ARCHIVE_ROOT}/casestudies/grace-providence`,
  [`${ARCHIVE_ROOT}/casestudies/project-six-sz8wl-rlpf8`]: `${ARCHIVE_ROOT}/casestudies/wilson-x`,
};

const KNOWN = new Set<string>(ARCHIVE_PATHS);

/** "/website/casestudies" → "smithkipnis.com/casestudies". */
export function addressFor(path: string): string {
  return `${ARCHIVE_HOST}${path.replace(ARCHIVE_ROOT, "")}`;
}

/**
 * Resolve address-bar text to an archived path, or null when it isn't one.
 *
 * Accepts what someone would actually type: with or without a scheme, with or
 * without "www.", with or without a trailing slash, and a bare path on the
 * assumption they mean this site. Returns null for any page the archive does
 * not hold, so the caller opens the live web instead of framing a 404.
 */
export function archivePathFor(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s) return null;

  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  // Reject anything carrying credentials, a port, a query or a fragment —
  // none of that addresses a static archived page.
  if (/[@:?#]/.test(s)) return null;

  let path: string;
  if (s.startsWith("/")) {
    path = s;
  } else {
    const slash = s.indexOf("/");
    const host = (slash === -1 ? s : s.slice(0, slash)).replace(/^www\./, "");
    if (host !== ARCHIVE_HOST) return null;
    path = slash === -1 ? "/" : s.slice(slash);
  }

  path = path.replace(/\/+$/, "");
  if (path === "" || path === "/") return ARCHIVE_ROOT;

  // Typed paths are relative to the site, not to our mount point, so accept
  // both "/casestudies" and the "/website/casestudies" the address bar shows.
  const candidate = path.startsWith(ARCHIVE_ROOT) ? path : `${ARCHIVE_ROOT}${path}`;
  if (KNOWN.has(candidate)) return candidate;
  return LEGACY_ARCHIVE_PATHS[candidate] ?? null;
}
