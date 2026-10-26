"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { analyticsEnabled } from "@/lib/analytics";
import {
  posthogKey,
  sharedPosthogOptions,
  stripQueryStrings,
} from "@/lib/posthog-config";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!posthogKey || !analyticsEnabled || posthog.__loaded) return;
    const key = posthogKey;

    // the replay recorder ships in our own bundle rather than being fetched as
    // /static/lazy-recorder.js. a.smithkipnis.com already gets it past blockers
    // that match posthog's domains, but not past the ones that match the file
    // name, and those were the sessions still arriving with no replay. a hashed
    // chunk on our own origin has nothing for them to match. it registers itself
    // on window, and posthog skips the fetch when it finds it there, so it has
    // to land before init. a dynamic import keeps it off the first paint.
    import("posthog-js/dist/posthog-recorder")
      .catch(() => {
        // posthog falls back to fetching it, which is what it did before
      })
      .finally(() => {
        if (posthog.__loaded) return;
        posthog.init(key, {
          ...sharedPosthogOptions,
          // the desktop moves between routes client-side, so the history api is
          // the only thing that marks a "pageview" here. this also keeps us off
          // useSearchParams, which would force every static route to render
          // dynamically.
          capture_pageview: "history_change",
          before_send: stripQueryStrings,
        });
      });
  }, []);

  return <>{children}</>;
}
