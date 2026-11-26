import assert from "node:assert/strict";
import { test } from "node:test";
import { getAiDisclosure } from "../lib/messages/ai-disclosure";

test("a thread with a living persona opens with the AI line", () => {
  assert.equal(getAiDisclosure(["Will Guidara"]), "AI simulation · not the real Will Guidara");
});

test("a group thread names only its living members", () => {
  assert.equal(
    getAiDisclosure(["Chuck Yeager", "Matty Matheson", "Will Guidara"]),
    "AI simulation · not the real Matty Matheson or Will Guidara"
  );
});

test("historical figures and visitor-typed names carry no line", () => {
  assert.equal(getAiDisclosure(["Socrates", "Alan Turing"]), null);
  assert.equal(getAiDisclosure(["Somebody Else"]), null);
});
