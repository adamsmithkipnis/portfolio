import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { CASE_STUDIES, EARLIER_WORK } from "@/config/case-studies.mjs";

/**
 * The archive is static HTML, so nothing at build time notices an image that
 * isn't there: it ships as a broken picture. These make that a failing check.
 *
 * The Earlier Work thumbnails come from the recovered Semplice export rather
 * than the repo; if this fails on them, run `npm run import:earlier-work-images`.
 */

const PUBLIC = path.join(process.cwd(), "public");
const ARCHIVE = path.join(PUBLIC, "archive/smithkipnis");

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return entry.endsWith(".html") ? [full] : [];
  });
}

const pages = htmlFiles(ARCHIVE).map((file) => ({
  name: path.relative(ARCHIVE, file),
  html: readFileSync(file, "utf8"),
}));

test("every archive image a page references exists", () => {
  const missing: string[] = [];
  for (const page of pages) {
    for (const [, src] of page.html.matchAll(/src="(\/archive\/[^"]+)"/g)) {
      if (!existsSync(path.join(PUBLIC, src))) missing.push(`${page.name}: ${src}`);
    }
  }
  assert.deepEqual(
    missing,
    [],
    `missing images — for earlier-work thumbnails run \`npm run import:earlier-work-images\`:\n${missing.join("\n")}`
  );
});

test("every case study's card image exists", () => {
  const images = [
    ...Object.values(CASE_STUDIES).map((study) => study.image),
    ...EARLIER_WORK.map((project) => project.image),
  ];
  const missing = images.filter((src) => !existsSync(path.join(PUBLIC, src)));
  assert.deepEqual(missing, [], "run `npm run import:earlier-work-images` for earlier-work thumbnails");
});

test("every landing page image links to its case study", () => {
  const home = pages.find((page) => page.name === "index.html");
  assert.ok(home, "missing the home page");
  const collage = home.html.slice(home.html.indexOf('<div class="collage">'));
  const tiles = collage.slice(0, collage.indexOf("</div>"));

  const images = tiles.match(/<img /g) ?? [];
  const links = [...tiles.matchAll(/<a class="tile" href="\/website\/casestudies\/([^"]+)"[^>]*><img /g)];
  assert.ok(images.length > 0, "collage has no images");
  assert.equal(links.length, images.length, "every collage image should be wrapped in a case study link");

  const known = new Set([...Object.keys(CASE_STUDIES), ...EARLIER_WORK.map((project) => project.slug)]);
  for (const [, slug] of links) assert.ok(known.has(slug), `collage links to unknown case study ${slug}`);
});
