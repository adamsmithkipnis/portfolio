import assert from "node:assert/strict";
import test from "node:test";

import nextConfig, { MOBILE_REWRITE_CONDITIONS } from "../next.config.mjs";
import { isMobileBySignals } from "../lib/device-detection";

/**
 * Phones get the archived site for `/` through header-conditioned rewrites in
 * next.config.mjs, which cannot import lib/device-detection.ts. These hold the
 * two to the same answer for every request a phone or a desktop really sends.
 */

type Condition = { type: string; key: string; value: string };

// How Next (and Vercel) apply a `has` header condition: the whole header,
// anchored, case-sensitive. See matchHas in next/dist/shared/lib/router/utils.
function matches(conditions: Condition[], headers: Record<string, string>) {
  return conditions.every((condition) => {
    const value = headers[condition.key];
    return value !== undefined && new RegExp(`^${condition.value}$`).test(value);
  });
}

function rewritesToArchive(headers: Record<string, string>) {
  return (MOBILE_REWRITE_CONDITIONS as Condition[][]).some((conditions) =>
    matches(conditions, headers)
  );
}

const USER_AGENTS: Record<string, string> = {
  "iPhone Safari":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  "iPhone Chrome":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1",
  "iPad Safari":
    "Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  "iPadOS reporting as a Mac":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  "Android Chrome":
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
  "Android Firefox": "Mozilla/5.0 (Android 15; Mobile; rv:141.0) Gecko/141.0 Firefox/141.0",
  "Samsung Internet":
    "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36",
  "Opera Mini": "Opera/9.80 (J2ME/MIDP; Opera Mini/9.80 (S60; SymbOS; Opera Mobi/23.348; U; en) Presto/2.5.25 Version/10.54",
  "Googlebot smartphone":
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mac Safari":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  "Mac Chrome":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  "Windows Edge":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
  "Linux Firefox": "Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0",
  "Googlebot desktop":
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/138.0.0.0 Safari/537.36",
  "no user agent": "",
};

const PHONES = new Set([
  "iPhone Safari",
  "iPhone Chrome",
  "iPad Safari",
  "iPadOS reporting as a Mac",
  "Android Chrome",
  "Android Firefox",
  "Samsung Internet",
  "Opera Mini",
  "Googlebot smartphone",
]);

for (const [name, userAgent] of Object.entries(USER_AGENTS)) {
  test(`${name}: the rewrite agrees with isMobileBySignals`, () => {
    const expected = isMobileBySignals({ userAgent });
    assert.equal(expected, PHONES.has(name), "fixture out of step with isMobileBySignals");
    assert.equal(rewritesToArchive({ "user-agent": userAgent }), expected);
  });
}

test("the mobile client hint alone sends a request to the archive", () => {
  const headers = { "sec-ch-ua-mobile": "?1", "user-agent": USER_AGENTS["Mac Chrome"] };
  assert.equal(isMobileBySignals({ clientHintMobile: true, userAgent: headers["user-agent"] }), true);
  assert.equal(rewritesToArchive(headers), true);
});

test("a desktop client hint does not", () => {
  const headers = { "sec-ch-ua-mobile": "?0", "user-agent": USER_AGENTS["Windows Edge"] };
  assert.equal(rewritesToArchive(headers), false);
});

test("only the root is rewritten, before the filesystem, to the archive's index", async () => {
  const rewrites = await nextConfig.rewrites!();
  assert.ok(!Array.isArray(rewrites));
  const beforeFiles = rewrites.beforeFiles ?? [];
  assert.equal(beforeFiles.length, MOBILE_REWRITE_CONDITIONS.length);
  for (const rewrite of beforeFiles) {
    assert.equal(rewrite.source, "/");
    assert.equal(rewrite.destination, "/archive/smithkipnis/index.html");
  }
});
