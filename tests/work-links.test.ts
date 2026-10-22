import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { CASE_STUDIES, EARLIER_WORK, ORDER, SITE_MODE } from "../config/case-studies.mjs";
import { hasContent, WORK_DIR } from "../lib/content-files";
import {
  EARLIER_WORK_DIR,
  EARLIER_WORK_LINKS,
  getWorkFolderItems,
  getWorkLink,
  hasWorkItems,
  WORK_LINKS,
} from "../lib/work-links";
import { getLocalFinderFiles, HOME_DIR } from "../lib/file-route-utils";

test("Work lists every case study, in the shipped order", () => {
  assert.deepEqual(
    WORK_LINKS.map((link) => link.slug),
    ORDER[SITE_MODE as keyof typeof ORDER]
  );
  assert.equal(WORK_LINKS.length, Object.keys(CASE_STUDIES).length);
});

test("Work is non-empty even when no MDX project is checked in", () => {
  // The regression this guards: the Finder sidebar gated on MDX content alone,
  // so Work vanished once the placeholder project was removed, taking the
  // published case studies with it.
  assert.equal(hasContent(), false, "content/work is expected to be empty");
  assert.equal(hasWorkItems(), true);
});

test("the Home listing shows Work whenever the sidebar would", () => {
  const home = getLocalFinderFiles(HOME_DIR).map((item) => item.name);
  assert.equal(home.includes("Work"), hasWorkItems());
});

test("each link resolves back to its case study and archive page", () => {
  for (const link of WORK_LINKS) {
    assert.equal(getWorkLink(link.path)?.slug, link.slug);
    assert.equal(link.archivePath, `/website/casestudies/${link.slug}`);
    assert.ok(link.name.endsWith(".webloc"));
  }
});

test("Work holds the featured links, then one Earlier Work folder", () => {
  const items = getWorkFolderItems(WORK_DIR) ?? [];
  assert.deepEqual(
    items.map((item) => item.type),
    [...WORK_LINKS.map(() => "webloc"), "dir"]
  );
  assert.equal(items.at(-1)?.path, EARLIER_WORK_DIR);
  assert.equal(items.at(-1)?.name, "Earlier Work");
});

test("Earlier Work lists every earlier project flat, in order, as Safari links", () => {
  const items = getWorkFolderItems(EARLIER_WORK_DIR) ?? [];
  assert.deepEqual(
    items.map((item) => item.displayName),
    EARLIER_WORK.map((project) => project.title)
  );
  for (const item of items) {
    assert.equal(item.type, "webloc", `${item.name} should be a web location, not a folder`);
    assert.equal(path.posix.dirname(item.path), EARLIER_WORK_DIR, `${item.name} should not sit in a subfolder`);
  }
});

test("earlier links resolve to their archive pages", () => {
  for (const link of EARLIER_WORK_LINKS) {
    assert.equal(getWorkLink(link.path)?.slug, link.slug);
    assert.equal(link.archivePath, `/website/casestudies/${link.slug}`);
  }
});

test("other folders are not web-location folders", () => {
  assert.equal(getWorkFolderItems(`${HOME_DIR}/Desktop`), null);
});
