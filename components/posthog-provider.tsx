"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { analyticsEnabled } from "@/lib/analytics";
import type { CaptureResult } from "posthog-js";

// absent key = posthog never initializes, which is what local dev and forks get.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// query strings carry nothing this site needs to measure, and they are where a
// stray ?email=... would end up. drop them before the event leaves the browser
// rather than trusting the far end to ignore them.
function stripQueryStrings(event: CaptureResult | null): CaptureResult | null {
  if (!event?.properties) return event;

  for (const key of ["$current_url", "$referrer"] as const) {
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

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!posthogKey || !analyticsEnabled || posthog.__loaded) return;

    posthog.init(posthogKey, {
      api_host: posthogHost,
      // the desktop moves between routes client-side, so the history api is the
      // only thing that marks a "pageview" here. this also keeps us off
      // useSearchParams, which would force every static route to render dynamically.
      capture_pageview: "history_change",
      // anonymous visitors never get person profiles — nobody logs in here.
      person_profiles: "never",
      before_send: stripQueryStrings,
      session_recording: {
        maskAllInputs: true,
        // Messages composes in a tiptap contenteditable, which is not an <input>
        // and so is untouched by maskAllInputs. mask the whole app instead:
        // what visitors type at the AI personas is their words, not our metric.
        maskTextSelector: "[data-ph-mask], [data-ph-mask] *",
      },
    });
  }, []);

  return <>{children}</>;
}
