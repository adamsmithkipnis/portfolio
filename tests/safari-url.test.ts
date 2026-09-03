import assert from "node:assert/strict";
import test from "node:test";
import {
  displayHost,
  monogram,
  monogramTextColor,
  resolveOmniboxTarget,
} from "@/lib/safari-url";

test("passes through absolute http(s) URLs", () => {
  assert.equal(resolveOmniboxTarget("https://example.com/"), "https://example.com/");
  assert.equal(resolveOmniboxTarget("http://example.com/"), "http://example.com/");
});

test("adds https to a bare hostname", () => {
  assert.equal(resolveOmniboxTarget("example.com"), "https://example.com/");
  assert.equal(
    resolveOmniboxTarget("sub.example.co.uk/path"),
    "https://sub.example.co.uk/path"
  );
});

test("treats plain text as a search", () => {
  const target = resolveOmniboxTarget("hello world");
  assert.equal(target, "https://duckduckgo.com/?q=hello%20world");
});

test("never returns a non-http(s) scheme", () => {
  // The resolved value goes straight into window.open, so a script URL must
  // come back as a search, not as something navigable.
  for (const hostile of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "vbscript:msgbox(1)",
  ]) {
    const target = resolveOmniboxTarget(hostile);
    assert.ok(target, `${hostile} should resolve to something`);
    assert.ok(
      target.startsWith("https://duckduckgo.com/?q="),
      `${hostile} should be searched, got ${target}`
    );
  }
});

test("returns null for empty input", () => {
  assert.equal(resolveOmniboxTarget(""), null);
  assert.equal(resolveOmniboxTarget("   "), null);
});

test("does not mistake a decimal for a hostname", () => {
  const target = resolveOmniboxTarget("2.5");
  assert.ok(target?.startsWith("https://duckduckgo.com/?q="));
});

test("displayHost strips www", () => {
  assert.equal(displayHost("https://www.example.com/a/b"), "example.com");
  assert.equal(displayHost("https://github.com/adamsmithkipnis"), "github.com");
});

test("monogram takes the first letter, uppercased", () => {
  assert.equal(monogram("GitHub"), "G");
  assert.equal(monogram("smithkipnis.com"), "S");
  assert.equal(monogram(""), "?");
});

test("monogram text flips to black on light tints", () => {
  // The real reason this exists: IMDb yellow with white text is unreadable.
  assert.equal(monogramTextColor("#F5C518"), "#000000");
  assert.equal(monogramTextColor("#C0C0C0"), "#000000");
  assert.equal(monogramTextColor("#FFFFFF"), "#000000");
});

test("monogram text stays white on dark tints", () => {
  assert.equal(monogramTextColor("#24292F"), "#FFFFFF");
  assert.equal(monogramTextColor("#000000"), "#FFFFFF");
  assert.equal(monogramTextColor("#0A66C2"), "#FFFFFF");
  assert.equal(monogramTextColor("#1D4ED8"), "#FFFFFF");
});

test("monogram text handles shorthand hex and bad input", () => {
  assert.equal(monogramTextColor("#fff"), "#000000");
  assert.equal(monogramTextColor("#000"), "#FFFFFF");
  // No tint, or something that isn't a hex color, falls back to white on the
  // component's default blue.
  assert.equal(monogramTextColor(undefined), "#FFFFFF");
  assert.equal(monogramTextColor("rebeccapurple"), "#FFFFFF");
});

test("every configured bookmark is an https url with a legible monogram", async () => {
  const { BOOKMARK_SECTIONS } = await import("@/config/bookmarks");
  for (const section of BOOKMARK_SECTIONS) {
    for (const bookmark of section.bookmarks) {
      assert.ok(
        bookmark.url.startsWith("https://"),
        `${bookmark.title} should be https, got ${bookmark.url}`
      );
      assert.doesNotThrow(() => new URL(bookmark.url), `${bookmark.title} should parse`);
      assert.ok(monogram(bookmark.title) !== "?", `${bookmark.title} should yield a monogram`);
    }
  }
});
