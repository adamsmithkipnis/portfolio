import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * The archived site is displayed inside Safari's frame, so a link without
 * target="_blank" loads its destination into that small box instead of leaving
 * the desktop — which defeats the point of the app. The page is hand-edited
 * HTML with no build step to catch this, so it is asserted here.
 */

const PAGE = path.join(process.cwd(), "public/archive/smithkipnis/index.html");
const html = readFileSync(PAGE, "utf8");

const anchors = html.match(/<a\s[^>]*>/g) ?? [];

test("the archived page actually has links", () => {
  // Guards against the regex silently matching nothing if the markup changes.
  assert.ok(anchors.length > 15, `expected many anchors, found ${anchors.length}`);
});

test("every anchor opens in a new tab", () => {
  const offenders = anchors.filter((a) => !a.includes('target="_blank"'));
  assert.deepEqual(
    offenders,
    [],
    `these would load inside the frame:\n${offenders.join("\n")}`
  );
});

test("every external anchor carries rel=noopener", () => {
  const offenders = anchors.filter(
    (a) => /href="https?:/.test(a) && !a.includes("noopener")
  );
    assert.deepEqual(offenders, [], `missing rel=noopener:\n${offenders.join("\n")}`);
});

test("a base target backs up the explicit attributes", () => {
  // Catches a link added later that forgets the attribute.
  assert.match(html, /<base\s+target="_blank"/);
});

test("assets resolve absolutely, since the page is served at /website", () => {
  // A relative src would resolve against "/" under the rewrite and 404.
  const srcs = html.match(/src="([^"]+)"/g) ?? [];
  const relative = srcs.filter((s) => !/src="(\/|https?:)/.test(s));
  assert.deepEqual(relative, [], `relative asset paths:\n${relative.join("\n")}`);
});
