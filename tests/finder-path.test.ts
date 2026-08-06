import assert from "node:assert/strict";
import test from "node:test";
import { getFinderPathSegments } from "../lib/finder-path";

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
