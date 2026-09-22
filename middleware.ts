import { NextResponse, type NextRequest } from "next/server";

import { isMobileBySignals } from "@/lib/device-detection";

/**
 * A phone gets the portfolio itself rather than the simulated desktop, which is
 * built for a desktop and on a phone spends screen on Safari chrome.
 *
 * This used to be a `redirect("/website")` inside `app/page.tsx`. Two costs:
 * reading headers there opted `/` out of static rendering for *everyone*, and a
 * phone paid a second round trip before the first byte of content — worth about
 * 1.1s of FCP on a throttled connection, which is most of what the field data
 * was complaining about. Rewriting at the edge serves the archive on the first
 * response, from the CDN, and leaves `/` static for desktop.
 *
 * A rewrite rather than a redirect, so the URL stays `smithkipnis.com` — the
 * archive's own links still move to `/website/...` once someone browses.
 *
 * Client hints and UA only: middleware has no viewport, so the pointer/touch
 * signals `isMobileBySignals` can weigh elsewhere are simply absent here. That
 * matches what `app/page.tsx` had access to before.
 */
export function middleware(request: NextRequest) {
  const isMobile = isMobileBySignals({
    clientHintMobile: request.headers.get("sec-ch-ua-mobile") === "?1",
    userAgent: request.headers.get("user-agent") ?? "",
  });

  if (!isMobile) {
    return NextResponse.next();
  }

  // `/website` is rewritten to the archive's index by next.config.js; going
  // through it keeps that mapping in one place.
  return NextResponse.rewrite(new URL("/website", request.url));
}

export const config = {
  // Only the root. Every other route, including the app routes a phone can
  // still reach on purpose (/safari, /finder), is left alone.
  matcher: "/",
};
