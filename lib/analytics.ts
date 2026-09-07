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
