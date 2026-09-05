import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { CASE_STUDIES, FRAMING, ORDER, SITE_MODE } from "../config/case-studies.mjs";
import { buildArchive } from "../scripts/build-archive.mjs";

/**
 * The generated regions are committed, because the archive is served as static
 * files. That only stays honest if a config edit without a rebuild fails here
 * rather than shipping a page that disagrees with the config.
 */

test("the committed pages match what the generator produces", async () => {
  const results = (await buildArchive()) as { file: string; contents: string }[];
  assert.ok(results.length > 0, "generator produced nothing");

  for (const { file, contents } of results) {
    const onDisk = await readFile(file, "utf8");
    assert.equal(
      onDisk,
      contents,
      `${path.basename(path.dirname(file))}/${path.basename(file)} is stale — run \`npm run archive\``
    );
  }
});

test("the shipped mode has a framing line and an order", () => {
  assert.ok(FRAMING[SITE_MODE], `no framing for mode "${SITE_MODE}"`);
  assert.ok(ORDER[SITE_MODE], `no order for mode "${SITE_MODE}"`);
});

test("every mode orders every case study exactly once", () => {
  const slugs = Object.keys(CASE_STUDIES).sort();
  for (const [mode, order] of Object.entries(ORDER) as [string, string[]][]) {
    assert.deepEqual([...order].sort(), slugs, `${mode} order does not cover the case studies`);
    assert.equal(new Set(order).size, order.length, `${mode} order repeats a case study`);
  }
});

test("management leads with the team and IC leads with the most recent work", () => {
  assert.equal(ORDER.management[0], "grace-providence");
  assert.equal(ORDER.ic[0], "invoca-workflow-agent");
});
