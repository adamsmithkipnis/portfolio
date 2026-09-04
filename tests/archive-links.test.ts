import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { ARCHIVE_PATHS } from "@/lib/archive-site";

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

test("ARCHIVE_PATHS matches the pages actually on disk", () => {
  // The address bar routes on ARCHIVE_PATHS, so a page added without listing
  // it there would exist but be unreachable by typing its address.
  const onDisk = pages
    .map((p) => "/website/" + p.name.replace(/\/?index\.html$/, ""))
    .map((u) => u.replace(/\/$/, ""))
    .sort();
  assert.deepEqual([...ARCHIVE_PATHS].sort(), onDisk);
});

test("every page offers a way into the case studies", () => {
  // The original links to them from nowhere; the archive adds a header link.
  for (const page of pages) {
    assert.match(
      page.html,
      /href="\/website\/casestudies"/,
      `${page.name} has no route to the case studies`
    );
  }
});

/**
 * The embeds have been lost twice: once because the fetched markup stores them
 * as escaped HTML in an attribute rather than an iframe, and once because a
 * video was hosted on Squarespace rather than YouTube. Pin the expected set.
 */
const EXPECTED_VIDEOS: Record<string, string[]> = {
  "casestudies/invoca-workflow-agent/index.html": ["OLVHsXg_M8M", "enlXyoJ2T08"],
  "casestudies/project-one-f5w4d-3fh8d/index.html": ["P5DYWmvUo0c", "SNXDSbrib0g", "4GUX88ot5LM"],
  "casestudies/project-six-sz8wl-rlpf8/index.html": ["bC2qMDS8g9Q", "F-Abz-lDYFU"],
};

test("each case study embeds exactly the videos it should", () => {
  for (const [name, want] of Object.entries(EXPECTED_VIDEOS)) {
    const page = pages.find((p) => p.name === name);
    assert.ok(page, `missing page ${name}`);
    const found = [...page.html.matchAll(/youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]+)/g)].map(
      (m) => m[1]
    );
    assert.deepEqual(found, want, `${name} embeds the wrong videos`);
  }
});

test("embeds use the privacy-preserving host and reserve their space", () => {
  for (const page of pages) {
    for (const frame of page.html.match(/<iframe[^>]*youtube[^>]*>/g) ?? []) {
      assert.match(frame, /youtube-nocookie\.com/, `${page.name}: not the nocookie host`);
      assert.match(frame, /allowfullscreen/, `${page.name}: embed cannot go fullscreen`);
      assert.match(frame, /allow="[^"]*encrypted-media/, `${page.name}: incomplete allow list`);
    }
    const embeds = (page.html.match(/youtube-nocookie/g) ?? []).length;
    const boxes = (page.html.match(/class="cs-video/g) ?? []).length;
    assert.equal(boxes, embeds, `${page.name}: every embed needs a sized container`);
  }
});
