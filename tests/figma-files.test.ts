import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { fitRect, hitTest, stepZoom, toPage, zoomAt } from "../lib/figma-camera";
import { FIGMA_FILES, formatEdited } from "../lib/figma-files";
import { CASE_STUDIES } from "../config/case-studies.mjs";

const ROOT = path.join(import.meta.dirname, "..");

test("every Figma page image exists and every layer sits inside its page", () => {
  for (const file of FIGMA_FILES) {
    assert.ok(file.pages.length > 0, `${file.slug} has no pages`);
    for (const page of file.pages) {
      assert.ok(existsSync(path.join(ROOT, "public", page.image)), `missing ${page.image}`);
      for (const layer of page.layers) {
        const where = `${file.slug}/${page.id}/${layer.name}`;
        assert.ok(layer.x >= 0 && layer.y >= 0, `${where} starts off the page`);
        assert.ok(layer.x + layer.w <= page.w + 1, `${where} runs past the right edge`);
        assert.ok(layer.y + layer.h <= page.h + 1, `${where} runs past the bottom edge`);
      }
    }
  }
});

test("Figma slugs are unique and case study links resolve", () => {
  const slugs = FIGMA_FILES.map((file) => file.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const file of FIGMA_FILES) {
    if (file.caseStudy) {
      assert.ok(file.caseStudy in CASE_STUDIES, `${file.slug} links to unknown case study ${file.caseStudy}`);
    }
  }
});

test("formatEdited reads month and year", () => {
  assert.equal(formatEdited("2026-09"), "Edited Sep 2026");
  assert.equal(formatEdited("2022"), "Edited 2022");
});

test("fitRect centers a rect at the largest zoom that fits", () => {
  const camera = fitRect({ width: 1000, height: 600 }, { x: 0, y: 0, w: 2000, h: 1000 }, 0, 4);
  assert.equal(camera.zoom, 0.5);
  assert.equal(camera.x, 0);
  assert.equal(camera.y, 50);
});

test("zoomAt keeps the point under the cursor still", () => {
  const before = { x: 10, y: 20, zoom: 0.5 };
  const point = { x: 300, y: 200 };
  const after = zoomAt(before, point, 2);
  const pageBefore = toPage(before, point);
  const pageAfter = toPage(after, point);
  assert.ok(Math.abs(pageBefore.x - pageAfter.x) < 1e-9);
  assert.ok(Math.abs(pageBefore.y - pageAfter.y) < 1e-9);
});

test("stepZoom moves to Figma's next zoom step", () => {
  const viewport = { width: 800, height: 600 };
  assert.equal(stepZoom({ x: 0, y: 0, zoom: 0.3 }, viewport, 1).zoom, 0.5);
  assert.equal(stepZoom({ x: 0, y: 0, zoom: 0.3 }, viewport, -1).zoom, 0.25);
});

test("hitTest prefers the smallest layer under the point", () => {
  const layers = [
    { x: 0, y: 0, w: 100, h: 100 },
    { x: 10, y: 10, w: 20, h: 20 },
  ];
  assert.equal(hitTest(layers, { x: 15, y: 15 }), 1);
  assert.equal(hitTest(layers, { x: 80, y: 80 }), 0);
  assert.equal(hitTest(layers, { x: 200, y: 200 }), -1);
});
