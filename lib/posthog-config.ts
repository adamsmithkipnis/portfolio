import type { CaptureResult, PostHogConfig } from "posthog-js";

/**
 * PostHog setup shared by the two places it starts: `PostHogProvider` for the
 * Next app, and `lib/archive-analytics.ts` for the archived site's static pages —
 * which is all a phone ever sees, since middleware rewrites `/` to the archive.
 */

// absent key = posthog never initializes, which is what local dev and forks get.
export const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
// where posthog's own app lives, which stops being where events go the moment
// api_host becomes a reverse proxy. the toolbar and the session replay player
// resolve against this, and both break if it is left to follow api_host.
export const posthogUiHost =
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com";

/**
 * Query strings carry nothing this site needs to measure, and they are where a
 * stray ?email=... would end up. drop them before the event leaves the browser
 * rather than trusting the far end to ignore them.
 *
 * Must stay self-contained (globals only, no imports or outer variables): the
 * archive script inlines it with `toString()`.
 */
export function stripQueryStrings(
  event: CaptureResult | null
): CaptureResult | null {
  if (!event || !event.properties) return event;

  for (const key of ["$current_url", "$referrer"]) {
    const value = event.properties[key];
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value);
      url.search = "";
      url.hash = "";
      event.properties[key] = url.toString();
    } catch {
      // not a parseable absolute url — leave it alone
    }
  }

  return event;
}

/** Everything but `before_send` and the pageview mode, which differ by page kind. */
export const sharedPosthogOptions = {
  api_host: posthogHost,
  ui_host: posthogUiHost,
  // anonymous visitors never get person profiles — nobody logs in here.
  person_profiles: "never",
  session_recording: {
    maskAllInputs: true,
    // Messages composes in a tiptap contenteditable, which is not an <input>
    // and so is untouched by maskAllInputs. mask the whole app instead:
    // what visitors type at the AI personas is their words, not our metric.
    maskTextSelector: "[data-ph-mask], [data-ph-mask] *",
  },
} satisfies Partial<PostHogConfig>;

