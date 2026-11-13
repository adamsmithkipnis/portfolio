/**
 * Whether the third-party analytics scripts should run at all.
 *
 * Vercel's SDK disables itself outside production builds on its own; umami and
 * posthog do not, and without this a `npm run dev` session files localhost
 * pageviews and session recordings against the real site's numbers.
 *
 * Set NEXT_PUBLIC_ANALYTICS_DEBUG=1 in .env.local to send from dev on purpose,
 * which is the only honest way to check that a key still works.
 */
export const analyticsEnabled =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1";

// umami cloud by default; set the host var only when self-hosting.
// absent id = no script, which is what local dev and forks get.
export const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
export const umamiScriptSrc =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "https://cloud.umami.is/script.js";

/**
 * Custom PostHog events: how a visitor finds the Messages work, and whether
 * they use it. The names are the whole contract with the dashboards, so they
 * live in one place. No payload carries message text.
 */
export type AnalyticsEvent =
  | "app_opened"
  | "dock_badge_clicked"
  | "first_visit_nudge_shown"
  | "first_visit_nudge_clicked"
  | "messages_first_send"
  | "chat_429";

const MESSAGES_FIRST_SEND_KEY = "analyticsMessagesFirstSendCaptured";

/** Fire-and-forget; a no-op wherever analytics are off (dev, forks, no key). */
export function captureEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined" || !analyticsEnabled) return;
  void import("posthog-js")
    .then(({ default: posthog }) => {
      if (posthog.__loaded) posthog.capture(event, properties);
    })
    .catch(() => {});
}

/** `messages_first_send`: once per browser, the first message a visitor sends. */
export function captureMessagesFirstSend(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(MESSAGES_FIRST_SEND_KEY)) return;
    window.localStorage.setItem(MESSAGES_FIRST_SEND_KEY, "1");
  } catch {
    return;
  }
  captureEvent("messages_first_send");
}
