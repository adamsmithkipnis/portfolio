import assert from "node:assert/strict";
import test from "node:test";
import {
  getContentChildren,
  getContentDirectoryPaths,
  getContentNode,
  hasContent,
  isContentPath,
  WORK_DIR,
} from "../lib/content-files";

// Assertions are deliberately about invariants rather than specific projects, so these
// keep passing once the example-project placeholder is replaced with real case studies.

test("recognises the Work mount and everything beneath it", () => {
  assert.equal(isContentPath(WORK_DIR), true);
  assert.equal(isContentPath(`${WORK_DIR}/anything`), true);
  assert.equal(isContentPath(`${WORK_DIR}/a/b/c`), true);
});

test("does not claim sibling paths that merely share the prefix", () => {
  assert.equal(isContentPath("/Users/adamsmithkipnis/Desktop"), false);
  assert.equal(isContentPath("/Users/adamsmithkipnis/Documents"), false);
  // The boundary that matters: Workshop must not read as Work/...
  assert.equal(isContentPath("/Users/adamsmithkipnis/Workshop"), false);
  assert.equal(isContentPath("recents"), false);
  assert.equal(isContentPath(""), false);
});

test("returns no children for paths outside the mount", () => {
  assert.deepEqual(getContentChildren("/Users/adamsmithkipnis/Desktop"), []);
  assert.deepEqual(getContentChildren("recents"), []);
});

test("returns null for unknown content paths", () => {
  assert.equal(getContentNode(`${WORK_DIR}/does-not-exist`), null);
  assert.equal(getContentNode("/Users/adamsmithkipnis/Desktop"), null);
});

test("every directory path reported for search is a content path", () => {
  for (const path of getContentDirectoryPaths()) {
    assert.equal(isContentPath(path), true, `${path} should be a content path`);
  }
});

test("the Work root is listed for search exactly when content exists", () => {
  assert.equal(getContentDirectoryPaths().includes(WORK_DIR), hasContent());
});

test("children are addressed by appending a segment to their parent", () => {
  const walk = (directory: string) => {
    for (const child of getContentChildren(directory)) {
      assert.equal(
        child.path.startsWith(`${directory}/`),
        true,
        `${child.path} should sit under ${directory}`
      );
      // Exactly one new segment per level — no slashes smuggled into a slug
      assert.equal(child.path.slice(directory.length + 1).includes("/"), false);
      assert.equal(child.type === "dir" || child.type === "file", true);
      if (child.type === "dir") walk(child.path);
    }
  };

  walk(WORK_DIR);
});

test("child display names drop the ordering prefix", () => {
  const walk = (directory: string) => {
    for (const child of getContentChildren(directory)) {
      assert.doesNotMatch(child.name, /^\d+-/, `${child.name} still carries its prefix`);
      assert.notEqual(child.name.trim(), "");
      if (child.type === "dir") walk(child.path);
    }
  };

  walk(WORK_DIR);
});

test("every listed child resolves back to a node whose kind matches its type", () => {
  const walk = (directory: string) => {
    for (const child of getContentChildren(directory)) {
      const node = getContentNode(child.path);
      assert.ok(node, `${child.path} should resolve to a node`);
      assert.equal(node.kind === "folder", child.type === "dir");
      if (child.type === "dir") walk(child.path);
    }
  };

  walk(WORK_DIR);
});

test("the Work root itself is a mount point, not an indexed node", () => {
  // getContentChildren special-cases it; nothing should depend on it resolving
  assert.equal(getContentNode(WORK_DIR), null);
  assert.equal(getContentChildren(WORK_DIR).length > 0, hasContent());
});
