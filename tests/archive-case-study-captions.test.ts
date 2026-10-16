import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

/**
 * A caption belongs to the image above it. With the same gap either side it
 * reads as a label for whichever image the eye lands on, so the stylesheet
 * ties it to its image and the pages keep to the one shape the rule matches:
 * a single italic-only paragraph straight after the image.
 */

const ROOT = path.join(process.cwd(), "public/archive/smithkipnis");
const SLUGS = ["grace-providence", "wilson-x", "invoca-workflow-agent"];
const CSS = readFileSync(path.join(ROOT, "site.css"), "utf8");

const page = (slug: string) =>
  readFileSync(path.join(ROOT, "casestudies", slug, "index.html"), "utf8");

test("the stylesheet closes the gap under an image and opens it after the caption", () => {
  const tie = CSS.match(/\.cs-img:has\(\+ \.cs-p > em:only-child\)\s*\{\s*margin-bottom:\s*([\d.]+)em/);
  const cap = CSS.match(/\.cs-img \+ \.cs-p:has\(> em:only-child\)\s*\{[^}]*margin:\s*0 0 ([\d.]+)em/);
  assert.ok(tie, "image directly above a caption needs a tight bottom margin");
  assert.ok(cap, "caption needs its own bottom margin");
  assert.ok(Number(cap[1]) > Number(tie[1]), "space after the caption must exceed the gap above it");
});

const afterImage = /<img class="cs-img[^>]*>\s*<p class="cs-p">([\s\S]*?)<\/p>(\s*<p class="cs-p">([\s\S]*?)<\/p>)?/g;

for (const slug of SLUGS) {
  test(`${slug}: a caption is one paragraph`, () => {
    for (const m of page(slug).matchAll(afterImage)) {
      const first = m[1].trim();
      assert.ok(
        !(first.startsWith("<em>") && m[3]?.trim().startsWith("<em>")),
        `caption split across two paragraphs: ${first.slice(0, 40)}`
      );
    }
  });

  test(`${slug}: a short line under an image is an italic caption`, () => {
    for (const m of page(slug).matchAll(afterImage)) {
      const text = m[1].trim();
      const short = text.length <= 80 && !/[.!?]$/.test(text);
      if (short) assert.ok(/^<em>[\s\S]*<\/em>$/.test(text), `not italic: ${text}`);
    }
  });
}
