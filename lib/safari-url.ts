/**
 * Address-bar input handling for the Safari app.
 *
 * The address bar is real: whatever a visitor types is turned into an
 * off-site URL and opened in a new tab. That makes this a trust boundary —
 * the resolved target is fed straight to an anchor's `href`, so only http
 * and https may ever come back out. `javascript:`, `data:`, and friends are
 * treated as search text, never as navigation.
 */

/** Where non-URL input goes. Safari ships Google; DuckDuckGo doesn't profile visitors. */
const SEARCH_URL = "https://duckduckgo.com/?q=";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function parseAsUrl(candidate: string): URL | null {
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

/**
 * A bare hostname like "example.com" or "sub.example.co.uk/path" — something a
 * person clearly means as an address rather than a search. Requires a dot, no
 * whitespace, and a plausible TLD, so "hello world" and "2.5" stay searches.
 */
function looksLikeHostname(input: string): boolean {
  if (/\s/.test(input)) return false;
  const host = input.split(/[/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(host);
}

/**
 * Resolve address-bar text to an absolute http(s) URL, or null when there is
 * nothing to open. Never returns a non-http(s) scheme.
 */
export function resolveOmniboxTarget(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const explicit = parseAsUrl(trimmed);
  if (explicit) {
    // A parseable URL with a scheme we refuse (javascript:, data:, file:...)
    // falls through to search rather than opening.
    return ALLOWED_PROTOCOLS.has(explicit.protocol) ? explicit.href : searchFor(trimmed);
  }

  if (looksLikeHostname(trimmed)) {
    const withScheme = parseAsUrl(`https://${trimmed}`);
    if (withScheme && ALLOWED_PROTOCOLS.has(withScheme.protocol)) return withScheme.href;
  }

  return searchFor(trimmed);
}

function searchFor(query: string): string {
  return `${SEARCH_URL}${encodeURIComponent(query)}`;
}

/** Hostname without "www.", for display under a bookmark tile. */
export function displayHost(url: string): string {
  const parsed = parseAsUrl(url);
  if (!parsed) return url;
  return parsed.host.replace(/^www\./, "");
}

/** First letter of a bookmark title, for the fallback monogram tile. */
export function monogram(title: string): string {
  const first = title.trim().replace(/^https?:\/\//, "").charAt(0);
  return first ? first.toUpperCase() : "?";
}
