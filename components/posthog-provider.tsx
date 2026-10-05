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

    posthog.init(posthogKey, {
      ...sharedPosthogOptions,
      // the desktop moves between routes client-side, so the history api is the
      // only thing that marks a "pageview" here. this also keeps us off
      // useSearchParams, which would force every static route to render dynamically.
      capture_pageview: "history_change",
      before_send: stripQueryStrings,
    });
  }, []);

  return <>{children}</>;
}
