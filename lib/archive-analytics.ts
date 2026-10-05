import {
  posthogHost,
  sharedPosthogOptions,
  stripQueryStrings,
} from "@/lib/posthog-config";

/** Where the archive pages load the loader from; see `app/archive-analytics.js`. */
export const ARCHIVE_ANALYTICS_PATH = "/archive-analytics.js";

/** The path Vercel serves Web Analytics from on its own deployments. */
const VERCEL_SCRIPT_SRC = "/_vercel/insights/script.js";

export type ArchiveAnalyticsConfig = {
  /** Production build, or NEXT_PUBLIC_ANALYTICS_DEBUG=1. */
  enabled: boolean;
  posthogKey?: string;
  umami?: { websiteId?: string; scriptSrc: string };
  /** Only a production build: `/_vercel/insights` exists on Vercel deploys alone. */
  vercel: boolean;
};

/**
 * The script the archived site's static pages load. They are plain HTML outside
 * the Next app, so nothing in `app/layout.tsx` runs on them — no PostHog, umami
 * or Vercel Analytics — and they are what every phone gets for `/`. Without
 * this, mobile web is invisible to all three.
 *
 * Each service starts the way the layout starts it, from the same env:
 *
 * - PostHog is its own snippet reduced to the one call made here: queue an
 *   `init` on a stub, then let `array.js` from PostHog's assets host replay it.
 *   Loading async from there, instead of inlining the ~290KB bundle, keeps it
 *   off the archive's first paint.
 * - umami is the same tag the layout renders, and counts the page on load.
 * - Vercel is what `@vercel/analytics` injects: a command queue, then its
 *   script, which counts the page on load.
 *
 * All of it stands down inside a frame. The desktop's Safari window frames
 * these same pages, same-origin, and the desktop's own PostHog recording
 * already captures them — a second instance there would split one visit into
 * two sessions. umami and Vercel stand down with it, so desktop numbers stay
 * exactly what they were.
 */
export function buildArchiveAnalyticsScript({
  enabled,
  posthogKey,
  umami,
  vercel,
}: ArchiveAnalyticsConfig): string {
  const parts: string[] = [];

  if (enabled && posthogKey) {
    const options = { ...sharedPosthogOptions, capture_pageview: true };
    const assetsHost = posthogHost.replace(
      ".i.posthog.com",
      "-assets.i.posthog.com"
    );
    parts.push(`  if (!window.posthog) {
    var options = ${JSON.stringify(options)};
    options.before_send = ${stripQueryStrings.toString()};
    var stub = [];
    stub.people = [];
    stub._i = [[${JSON.stringify(posthogKey)}, options]];
    window.posthog = stub;
    load(${JSON.stringify(`${assetsHost}/static/array.js`)}, { crossorigin: "anonymous" });
  }`);
  }

  if (enabled && umami?.websiteId) {
    parts.push(
      `  load(${JSON.stringify(umami.scriptSrc)}, { "data-website-id": ${JSON.stringify(umami.websiteId)} });`
    );
  }

  if (enabled && vercel) {
    parts.push(`  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  load(${JSON.stringify(VERCEL_SCRIPT_SRC)}, { "data-sdkn": "@vercel/analytics" });`);
  }

  if (parts.length === 0) {
    return "/* analytics disabled for this build */\n";
  }

  return `(function () {
  if (window.top !== window.self) return;
  function load(src, attributes) {
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    for (var name in attributes) script.setAttribute(name, attributes[name]);
    document.head.appendChild(script);
  }
${parts.join("\n")}
})();
`;
}
