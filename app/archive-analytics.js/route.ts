import {
  analyticsEnabled,
  umamiScriptSrc,
  umamiWebsiteId,
} from "@/lib/analytics";
import { buildArchiveAnalyticsScript } from "@/lib/archive-analytics";
import { posthogKey } from "@/lib/posthog-config";

// built once with the deploy's env, then served from the CDN like any asset.
export const dynamic = "force-static";

export function GET() {
  return new Response(
    buildArchiveAnalyticsScript({
      enabled: analyticsEnabled,
      posthogKey,
      umami: { websiteId: umamiWebsiteId, scriptSrc: umamiScriptSrc },
      vercel: process.env.NODE_ENV === "production",
    }),
    { headers: { "content-type": "text/javascript; charset=utf-8" } }
  );
}
