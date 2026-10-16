import assert from "node:assert/strict";
import test from "node:test";

import { shouldEndInteraction } from "../lib/window-interaction";

test("an idle window never reports an interaction end", () => {
  assert.equal(shouldEndInteraction(false, { type: "mouseup" }), false);
  assert.equal(shouldEndInteraction(false, { type: "mousemove", buttons: 0 }), false);
});

test("release, cancel, lost capture, blur and menus end the gesture", () => {
  for (const type of ["mouseup", "pointerup", "pointercancel", "lostpointercapture", "contextmenu", "blur", "visibilitychange"]) {
    assert.equal(shouldEndInteraction(true, { type }), true, type);
  }
});

test("a move with no button pressed ends the gesture, one with a button does not", () => {
  assert.equal(shouldEndInteraction(true, { type: "mousemove", buttons: 0 }), true);
  assert.equal(shouldEndInteraction(true, { type: "pointermove", buttons: 0 }), true);
  assert.equal(shouldEndInteraction(true, { type: "mousemove", buttons: 1 }), false);
});
