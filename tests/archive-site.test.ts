import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHIVE_PATHS,
  ARCHIVE_ROOT,
  LEGACY_ARCHIVE_PATHS,
  addressFor,
  archivePathFor,
} from "@/lib/archive-site";

/**
 * The address bar routes on this: a match browses inside the frame, a null
 * leaves for a real browser tab. Getting it wrong either strands someone on a
 * framed 404 or ejects them from the desktop mid-browse.
 */

test("accepts the address the bar itself displays", () => {
  for (const path of ARCHIVE_PATHS) {
    assert.equal(archivePathFor(addressFor(path)), path, `round trip failed for ${path}`);
  }
});

test("accepts what a person would actually type", () => {
  const home = [
    "smithkipnis.com",
    "www.smithkipnis.com",
    "https://smithkipnis.com",
    "https://www.smithkipnis.com/",
    "SmithKipnis.com",
    "  smithkipnis.com  ",
    "/",
  ];
  for (const input of home) {
    assert.equal(archivePathFor(input), ARCHIVE_ROOT, `expected home for ${JSON.stringify(input)}`);
  }
});

test("accepts a deep page with or without scheme, www or trailing slash", () => {
  const want = `${ARCHIVE_ROOT}/casestudies/invoca-workflow-agent`;
  for (const input of [
    "smithkipnis.com/casestudies/invoca-workflow-agent",
    "https://www.smithkipnis.com/casestudies/invoca-workflow-agent/",
    "/casestudies/invoca-workflow-agent",
    "/website/casestudies/invoca-workflow-agent",
  ]) {
    assert.equal(archivePathFor(input), want, `failed for ${input}`);
  }
});

test("refuses pages of the site that were never archived", () => {
  // Framing these would show a 404 inside the browser; they belong in a tab.
  for (const input of [
    "smithkipnis.com/blog",
    "smithkipnis.com/casestudies/nope",
    "smithkipnis.com/cart",
  ]) {
    assert.equal(archivePathFor(input), null, `should not be archived: ${input}`);
  }
});

test("refuses other hosts, including lookalikes", () => {
  for (const input of [
    "example.com",
    "github.com/adamsmithkipnis",
    "notsmithkipnis.com",
    "smithkipnis.com.evil.test",
    "evil.test/smithkipnis.com",
  ]) {
    assert.equal(archivePathFor(input), null, `should not be archived: ${input}`);
  }
});

test("refuses anything carrying credentials, a port, a query or a fragment", () => {
  for (const input of [
    "user@smithkipnis.com",
    "smithkipnis.com:8080",
    "smithkipnis.com/casestudies?x=1",
    "smithkipnis.com/casestudies#top",
    "javascript:alert(1)",
  ]) {
    assert.equal(archivePathFor(input), null, `should not be archived: ${input}`);
  }
});

test("refuses empty input", () => {
  assert.equal(archivePathFor(""), null);
  assert.equal(archivePathFor("   "), null);
});

test("addressFor drops the mount point", () => {
  assert.equal(addressFor(ARCHIVE_ROOT), "smithkipnis.com");
  assert.equal(addressFor(`${ARCHIVE_ROOT}/casestudies`), "smithkipnis.com/casestudies");
});

test("a legacy case study address resolves to the page it became", () => {
  assert.equal(
    archivePathFor("smithkipnis.com/casestudies/project-one-f5w4d-3fh8d"),
    "/website/casestudies/grace-providence"
  );
  assert.equal(
    archivePathFor("https://www.smithkipnis.com/casestudies/project-six-sz8wl-rlpf8/"),
    "/website/casestudies/wilson-x"
  );
});

test("every legacy alias points at a page the archive actually holds", () => {
  const known = new Set<string>(ARCHIVE_PATHS);
  for (const [from, to] of Object.entries(LEGACY_ARCHIVE_PATHS)) {
    assert.ok(known.has(to), `${from} redirects to ${to}, which is not archived`);
    assert.ok(!known.has(from), `${from} is both archived and redirected`);
  }
});
