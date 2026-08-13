import assert from "node:assert/strict";
import test from "node:test";
import { displayName, parseFrontmatter, parseScalar } from "../scripts/frontmatter.mjs";

test("reads scalars, coercing booleans and numbers but not version-like strings", () => {
  const { data } = parseFrontmatter(
    ["---", "title: Design System Foundation", "year: 2024", "featured: true", "confidential: false", 'summary: "Quoted, with a comma"', "version: 1.2.3", "---", "body"].join("\n")
  );

  assert.equal(data.title, "Design System Foundation");
  assert.equal(data.year, 2024);
  assert.equal(data.featured, true);
  assert.equal(data.confidential, false);
  assert.equal(data.summary, "Quoted, with a comma");
  // Two dots is not a number — must stay a string rather than becoming NaN
  assert.equal(data.version, "1.2.3");
});

test("reads inline arrays and drops empty entries", () => {
  const { data } = parseFrontmatter(["---", "tags: [Design Systems, Figma, React]", "empty: []", "---", ""].join("\n"));

  assert.deepEqual(data.tags, ["Design Systems", "Figma", "React"]);
  assert.deepEqual(data.empty, []);
});

test("reads a list of objects, attaching indented keys to the current entry", () => {
  const { data } = parseFrontmatter(
    ["---", "outcomes:", "  - label: Handoff time", '    value: "-40%"', "  - label: Components shipped", '    value: "200+"', "---", ""].join("\n")
  );

  assert.deepEqual(data.outcomes, [
    { label: "Handoff time", value: "-40%" },
    { label: "Components shipped", value: "200+" },
  ]);
});

test("separates the body from the frontmatter block", () => {
  const { body } = parseFrontmatter(["---", "title: Problem", "---", "First line.", "", "Second line."].join("\n"));

  assert.equal(body, "First line.\n\nSecond line.");
});

test("treats a document without frontmatter as all body", () => {
  const { data, body } = parseFrontmatter("Just prose, no delimiters.");

  assert.deepEqual(data, {});
  assert.equal(body, "Just prose, no delimiters.");
});

test("ignores comments and blank lines", () => {
  const { data } = parseFrontmatter(["---", "# a comment", "", "title: Approach", "---", ""].join("\n"));

  assert.deepEqual(data, { title: "Approach" });
});

test("strips the ordering prefix when deriving display names", () => {
  assert.equal(displayName("01-problem"), "Problem");
  assert.equal(displayName("02-approach"), "Approach");
  assert.equal(displayName("design-system-foundation"), "Design System Foundation");
  // Only a leading numeric prefix is stripped, not digits elsewhere
  assert.equal(displayName("web-3-strategy"), "Web 3 Strategy");
});

test("leaves non-numeric scalars untouched", () => {
  assert.equal(parseScalar("  spaced  "), "spaced");
  assert.equal(parseScalar("-40%"), "-40%");
  assert.equal(parseScalar("-40"), -40);
});
