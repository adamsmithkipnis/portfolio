import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

import {
  ARCHIVE_ANALYTICS_PATH,
  buildArchiveAnalyticsScript,
  type ArchiveAnalyticsConfig,
} from "../lib/archive-analytics";

/**
 * Phones are served the archived site, not the desktop, so these static pages
 * are the only place mobile web can be measured. A page that drops the tag
 * goes dark on mobile without anything else noticing.
 */

const ARCHIVE = path.join(process.cwd(), "public/archive/smithkipnis");

const FULL: ArchiveAnalyticsConfig = {
  enabled: true,
  posthogKey: "phc_test",
  umami: { websiteId: "umami-id", scriptSrc: "https://cloud.umami.is/script.js" },
  vercel: true,
};

function archivePages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return archivePages(full);
    return name === "index.html" ? [full] : [];
  });
}

type FakeScript = { src?: string; attributes: Record<string, string> };
type FakeWindow = {
  top?: unknown;
  self?: unknown;
  posthog?: { _i: [string, Record<string, unknown>][] };
  va?: (...args: unknown[]) => void;
  vaq?: unknown[][];
};

function run(script: string, { framed = false } = {}) {
  const appended: FakeScript[] = [];
  const window: FakeWindow = {};
  window.self = window;
  window.top = framed ? {} : window;
  const document = {
    createElement: () => {
      const node: FakeScript & { setAttribute: (k: string, v: string) => void } = {
        attributes: {},
        setAttribute(name, value) {
          node.attributes[name] = value;
        },
      };
      return node;
    },
    head: { appendChild: (node: FakeScript) => appended.push(node) },
  };
  vm.runInNewContext(script, { window, document, URL });
  return { window, appended, srcs: appended.map((node) => node.src) };
}

test("every archive page loads the analytics script", () => {
  const pages = archivePages(ARCHIVE);
  assert.ok(pages.length > 0);
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    assert.ok(
      html.includes(`<script src="${ARCHIVE_ANALYTICS_PATH}" defer></script>`),
      `${path.relative(process.cwd(), page)} is missing the analytics script`
    );
  }
});

test("a dev build, or one with nothing configured, sends nothing", () => {
  for (const config of [
    { ...FULL, enabled: false },
    { enabled: true, vercel: false },
  ]) {
    const { window, appended } = run(buildArchiveAnalyticsScript(config));
    assert.equal(window.posthog, undefined);
    assert.equal(window.va, undefined);
    assert.equal(appended.length, 0);
  }
});

test("each service loads only when it is configured", () => {
  assert.deepEqual(
    run(buildArchiveAnalyticsScript({ enabled: true, posthogKey: "phc_test", vercel: false })).srcs,
    ["https://us-assets.i.posthog.com/static/array.js"]
  );
  assert.deepEqual(
    run(
      buildArchiveAnalyticsScript({
        enabled: true,
        umami: { websiteId: undefined, scriptSrc: "https://cloud.umami.is/script.js" },
        vercel: true,
      })
    ).srcs,
    ["/_vercel/insights/script.js"]
  );
});

test("a top-level page queues PostHog init with the shared replay settings", () => {
  const { window } = run(buildArchiveAnalyticsScript(FULL));

  const [[key, options]] = window.posthog!._i;
  assert.equal(key, "phc_test");
  assert.equal(options.person_profiles, "never");
  assert.equal(options.ui_host, "https://us.posthog.com");
  assert.equal(options.capture_pageview, true);
  // the object comes from the vm realm, so compare by value, not prototype.
  assert.deepEqual(JSON.parse(JSON.stringify(options.session_recording)), {
    maskAllInputs: true,
    maskTextSelector: "[data-ph-mask], [data-ph-mask] *",
  });

  const beforeSend = options.before_send as (event: unknown) => {
    properties: Record<string, string>;
  };
  const event = beforeSend({
    properties: {
      $current_url: "https://smithkipnis.com/website?email=a@b.c#top",
      $referrer: "$direct",
    },
  });
  assert.equal(event.properties.$current_url, "https://smithkipnis.com/website");
  assert.equal(event.properties.$referrer, "$direct");
});

test("a top-level page loads umami and Vercel the way the layout does", () => {
  const { window, appended } = run(buildArchiveAnalyticsScript(FULL));

  const umami = appended.find((node) => node.src === "https://cloud.umami.is/script.js");
  assert.deepEqual({ ...umami?.attributes }, { "data-website-id": "umami-id" });

  const vercel = appended.find((node) => node.src === "/_vercel/insights/script.js");
  assert.ok(vercel);
  window.va!("event", { name: "queued" });
  assert.equal(window.vaq!.length, 1);
});

test("inside the desktop's Safari frame it stands down", () => {
  const { window, appended } = run(buildArchiveAnalyticsScript(FULL), {
    framed: true,
  });
  assert.equal(window.posthog, undefined);
  assert.equal(window.va, undefined);
  assert.equal(appended.length, 0);
});
