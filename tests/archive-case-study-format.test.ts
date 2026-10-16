import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * House format shared by the long-form case studies: one title, STAR sections
 * as h3, sub-sections as real h4s, and run-in "Label:" text only in the
 * At-a-glance and Result blocks.
 */

const DIR = path.join(process.cwd(), "public/archive/smithkipnis/casestudies");
const PAGES = ["grace-providence", "wilson-x", "invoca-workflow-agent"];
const read = (p: string) => fs.readFileSync(path.join(DIR, p, "index.html"), "utf8");
const main = (html: string) => html.slice(html.indexOf('<main class="wrap cs">'), html.indexOf("</main>"));

for (const page of PAGES) {
  test(`${page} follows the house format`, () => {
    const html = main(read(page));

    assert.equal((html.match(/<h2 class="cs-h2">/g) ?? []).length, 1, "one h2: the title");
    assert.match(html, /<strong>Role<\/strong>/);
    assert.match(html, /<strong>Client<\/strong>/);
    assert.match(html, /<strong>Timeline<\/strong>/);
    assert.doesNotMatch(html, /<strong>Year<\/strong>/);

    const h3s = [...html.matchAll(/<h3 class="cs-h3">([^<]*)<\/h3>/g)].map((m) => m[1]);
    assert.equal(h3s[0], "Situation");
    assert.equal(h3s[1], "Task");
    assert.match(h3s[2], /^Actions/);
    assert.match(h3s[h3s.length - 1], /^(Result|Impact)$/);

    assert.doesNotMatch(html, /<p class="cs-p"><strong>[^<]+<\/strong><\/p>/, "no strong-only pseudo-headings");
    assert.doesNotMatch(html, /<strong>[^<]*: <\/strong>/, "colon sits inside strong with no trailing space");
  });
}

test("the Wilson awards are a list", () => {
  assert.match(read("wilson-x"), /<h4 class="cs-h4">Awards<\/h4>[\s\S]*?<ul class="cs-list">(\s*<li>[^\n]*<\/li>){6}\s*<\/ul>/);
});
