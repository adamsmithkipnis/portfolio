import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { CONTENT_TREE } from "../system/content/generated";
import type { ContentNode } from "../system/content/types";

// Case study bodies reference their images by public URL (/content/...). Nothing
// at build time checks those files exist, so a missing image would ship as a
// broken <img>. These tests make that a failing check instead.

const ROOT = process.cwd();

function bodies(node: ContentNode): { path: string; body: string }[] {
  const own = node.body ? [{ path: node.path, body: node.body }] : [];
  return [...own, ...(node.children ?? []).flatMap(bodies)];
}

function localImageUrls(body: string): string[] {
  const markdown = [...body.matchAll(/!\[[^\]]*\]\((\/content\/[^)\s]+)\)/g)].map((m) => m[1]);
  const html = [...body.matchAll(/src="(\/content\/[^"]+)"/g)].map((m) => m[1]);
  return [...markdown, ...html];
}

test("every image a case study references exists under public/", () => {
  const missing: string[] = [];
  for (const { path: nodePath, body } of bodies(CONTENT_TREE)) {
    for (const url of localImageUrls(body)) {
      if (!existsSync(path.join(ROOT, "public", decodeURI(url)))) {
        missing.push(`${nodePath}: ${url}`);
      }
    }
  }

  assert.deepEqual(
    missing,
    [],
    "Missing case study images. For content/work/earlier-work, run `npm run import:earlier-work-images`."
  );
});

test("the earlier-work image manifest only targets images the content uses", () => {
  const manifest: { from: string; to: string }[] = JSON.parse(
    readFileSync(path.join(ROOT, "scripts/earlier-work-images.json"), "utf8")
  );
  const referenced = new Set(
    bodies(CONTENT_TREE).flatMap(({ body }) => localImageUrls(body)).map((url) => `public${url}`)
  );

  for (const { to } of manifest) {
    assert.equal(referenced.has(to), true, `${to} is in the manifest but no case study uses it`);
  }
});
