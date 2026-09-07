import assert from "node:assert/strict";
import test from "node:test";
import { CASE_STUDIES, ORDER, SITE_MODE } from "../config/case-studies.mjs";
import { hasContent } from "../lib/content-files";
import { getWorkLink, hasWorkItems, WORK_LINKS } from "../lib/work-links";
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
