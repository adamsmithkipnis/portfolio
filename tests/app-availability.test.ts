import assert from "node:assert/strict";
import test from "node:test";
import { isAppDiscoverable } from "../lib/app-availability";

test("an app hidden from both the Dock and Finder is not discoverable", () => {
  assert.equal(isAppDiscoverable("photos"), false);
});

test("an app off the Dock but still in Finder stays discoverable", () => {
  assert.equal(isAppDiscoverable("weather"), true);
  assert.equal(isAppDiscoverable("notes"), true);
});

test("an unknown app id is not discoverable", () => {
  assert.equal(isAppDiscoverable("nope"), false);
});
