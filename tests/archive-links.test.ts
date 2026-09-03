import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * The archived site is displayed inside Safari's frame, and its links come in
 * two kinds that must not be confused:
 *
 *   - Anything leaving the archive needs target="_blank", or the destination
 *     loads into the small box instead of a real browser tab.
 *   - Links between archived pages must NOT have it, or browsing the archive
 *     would spawn a tab per click and Safari's back button would never mean
 *     anything.
 *
 * These are hand-edited and generated HTML with no build step to catch a
 * mistake, so both directions are asserted here.
 */

const ROOT = path.join(process.cwd(), "public/archive/smithkipnis");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return entry.endsWith(".html") ? [full] : [];
  });
}

const pages = htmlFiles(ROOT).map((file) => ({
  name: path.relative(ROOT, file),
  html: readFileSync(file, "utf8"),
}));

const anchorsOf = (html: string) => html.match(/<a\s[^>]*>/g) ?? [];
const hrefOf = (a: string) => a.match(/href="([^"]*)"/)?.[1] ?? "";

test("every archived page is present", () => {
  const names = pages.map((p) => p.name).sort();
  assert.deepEqual(names, [
    "casestudies/index.html",
    "casestudies/invoca-workflow-agent/index.html",
    "casestudies/project-one-f5w4d-3fh8d/index.html",
    "casestudies/project-six-sz8wl-rlpf8/index.html",
    "index.html",
  ]);
});

test("links that leave the archive open in a new tab", () => {
  const offenders: string[] = [];
  for (const page of pages) {
    for (const a of anchorsOf(page.html)) {
      const href = hrefOf(a);
      const leaves = /^(https?:|mailto:)/.test(href);
      if (leaves && !a.includes('target="_blank"')) offenders.push(`${page.name}: ${a}`);
    }
  }
  assert.deepEqual(offenders, [], `these would load inside the frame:\n${offenders.join("\n")}`);
});

test("links between archived pages stay in the frame", () => {
  const offenders: string[] = [];
  for (const page of pages) {
    for (const a of anchorsOf(page.html)) {
      const href = hrefOf(a);
      if (href.startsWith("/website") && a.includes('target="_blank"')) {
        offenders.push(`${page.name}: ${a}`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `these would spawn a tab instead of browsing:\n${offenders.join("\n")}`
  );
});

test("external links carry rel=noopener", () => {
  const offenders: string[] = [];
  for (const page of pages) {
    for (const a of anchorsOf(page.html)) {
      if (/href="https?:/.test(a) && !a.includes("noopener")) offenders.push(`${page.name}: ${a}`);
    }
  }
  assert.deepEqual(offenders, [], `missing rel=noopener:\n${offenders.join("\n")}`);
});

test("internal hrefs point at pages that exist", () => {
  const known = new Set(
    pages.map((p) => "/website/" + p.name.replace(/\/?index\.html$/, "")).map((u) => u.replace(/\/$/, ""))
  );
  const broken: string[] = [];
  for (const page of pages) {
    for (const a of anchorsOf(page.html)) {
      const href = hrefOf(a);
      if (href.startsWith("/website") && !known.has(href.replace(/\/$/, ""))) {
        broken.push(`${page.name} -> ${href}`);
      }
    }
  }
  assert.deepEqual(broken, [], `dead internal links:\n${broken.join("\n")}`);
});

test("assets resolve absolutely, since pages are served under /website", () => {
  const relative: string[] = [];
  for (const page of pages) {
    for (const s of page.html.match(/src="([^"]+)"/g) ?? []) {
      if (!/src="(\/|https?:)/.test(s)) relative.push(`${page.name}: ${s}`);
    }
  }
  assert.deepEqual(relative, [], `relative asset paths:\n${relative.join("\n")}`);
});
