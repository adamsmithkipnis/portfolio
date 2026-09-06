import assert from "node:assert/strict";
import test from "node:test";
import { getInitials } from "../lib/messages/initials";

test("two-word names take first and last initials", () => {
  assert.equal(getInitials("Jane Jacobs"), "JJ");
  assert.equal(getInitials("Dishwasher Pete"), "DP");
  assert.equal(getInitials("John Stuart Mill"), "JM");
});

test("a lowercase suffix is not a surname", () => {
  // The case that motivated this: a stage name, not a first and last name.
  assert.equal(getInitials("Fred again.."), "F");
});

test("single names, diacritics, and odd spacing", () => {
  assert.equal(getInitials("Liliʻuokalani"), "L");
  assert.equal(getInitials("Socrates"), "S");
  assert.equal(getInitials("  Grace   Hopper "), "GH");
  assert.equal(getInitials(""), "");
});
