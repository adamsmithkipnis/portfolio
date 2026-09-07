import assert from "node:assert/strict";
import test from "node:test";
import { getNotePreviewText } from "../lib/notes/note-utils";

test("keeps hyphens inside words", () => {
  // The bug a reviewer saw on the live site: "Adam SmithKipnis", "AInative".
  assert.equal(
    getNotePreviewText("My name is Adam Smith-Kipnis and I'm an AI-native product design leader"),
    "My name is Adam Smith-Kipnis and I'm an AI-native product design leader"
  );
  assert.equal(getNotePreviewText("I can own 0-1 AI product development"), "I can own 0-1 AI product development");
});

test("strips list markers, headings, quotes, and rules", () => {
  assert.equal(
    getNotePreviewText("## concerts\n\n- YUNGBLUD\n- Jesse Welles\n\n> a quote\n\n---\n\n1. first"),
    "concerts YUNGBLUD Jesse Welles a quote first"
  );
});

test("strips inline emphasis and code but keeps snake_case", () => {
  assert.equal(getNotePreviewText("**bold** and _italic_ and `code` and ~~gone~~ and snake_case"), "bold and italic and code and gone and snake_case");
});

test("links keep their text, images and checkboxes go", () => {
  assert.equal(
    getNotePreviewText("[The UNKLESounds project](https://example.com) ![alt](x.png) [x] done [ ] todo"),
    "The UNKLESounds project done todo"
  );
});
