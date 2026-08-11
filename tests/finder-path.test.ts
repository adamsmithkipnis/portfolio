import assert from "node:assert/strict";
import test from "node:test";
import { getFinderPathSegments } from "../lib/finder-path";
import { getContentChildren, WORK_DIR } from "../lib/content-files";

test("builds clickable segments from the Finder section root", () => {
  assert.deepEqual(
    getFinderPathSegments("/Users/adamsmithkipnis/Projects/adamsmithkipnis/components/apps/finder"),
    [
      { label: "Projects", path: "/Users/adamsmithkipnis/Projects" },
      { label: "adamsmithkipnis", path: "/Users/adamsmithkipnis/Projects/adamsmithkipnis" },
      { label: "components", path: "/Users/adamsmithkipnis/Projects/adamsmithkipnis/components" },
      { label: "apps", path: "/Users/adamsmithkipnis/Projects/adamsmithkipnis/components/apps" },
      { label: "finder", path: "/Users/adamsmithkipnis/Projects/adamsmithkipnis/components/apps/finder" },
    ]
  );
});

test("keeps local and virtual roots concise", () => {
  assert.deepEqual(getFinderPathSegments("/Users/adamsmithkipnis/Documents"), [
    { label: "Documents", path: "/Users/adamsmithkipnis/Documents" },
  ]);
  assert.deepEqual(getFinderPathSegments("trash/unused-assets"), [
    { label: "Trash", path: "trash" },
    { label: "unused-assets", path: "trash/unused-assets" },
  ]);
});

test("roots content paths at Work", () => {
  assert.deepEqual(getFinderPathSegments(WORK_DIR), [{ label: "Work", path: WORK_DIR }]);
});

test("labels content segments with display names rather than slugs", () => {
  const project = getContentChildren(WORK_DIR).find((child) => child.type === "dir");
  if (!project) return; // no case studies checked in yet

  const segments = getFinderPathSegments(project.path);
  assert.deepEqual(segments[0], { label: "Work", path: WORK_DIR });
  assert.deepEqual(segments.at(-1), { label: project.name, path: project.path });

  const section = getContentChildren(project.path).find((child) => child.type === "file");
  if (!section) return;

  const deep = getFinderPathSegments(section.path);
  assert.deepEqual(deep.map((segment) => segment.path), [WORK_DIR, project.path, section.path]);
  // The ordering prefix lives in the slug and must not reach the breadcrumb
  assert.deepEqual(deep.at(-1), { label: section.name, path: section.path });
  for (const segment of deep) {
    assert.doesNotMatch(segment.label, /^\d+-/);
  }
});
