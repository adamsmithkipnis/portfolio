import assert from "node:assert/strict";
import test from "node:test";

import {
  type IOSSceneAction,
  type IOSSceneState,
  createInitialSceneState,
  getActiveAppId,
  iosSceneReducer,
  parseSceneState,
  serializeSceneState,
} from "../lib/ios/scene-state";

const SEED = ["safari", "notes", "claude"];
const VALID = ["safari", "notes", "claude", "finder", "messages"];

function run(state: IOSSceneState, ...actions: IOSSceneAction[]): IOSSceneState {
  return actions.reduce(iosSceneReducer, state);
}

test("a visitor with no deep link lands in the switcher with Safari in front", () => {
  const state = createInitialSceneState({ seedStack: SEED });
  assert.equal(state.mode, "switcher");
  assert.equal(state.stack[0], "safari");
  assert.equal(getActiveAppId(state), null);
});

test("a deep link opens its app in front of the seeded apps, without duplicating it", () => {
  const state = createInitialSceneState({ seedStack: SEED, appId: "notes" });
  assert.equal(state.mode, "app");
  assert.deepEqual(state.stack, ["notes", "safari", "claude"]);
  assert.equal(getActiveAppId(state), "notes");
});

test("with nothing seeded the phone starts on the Home Screen", () => {
  assert.equal(createInitialSceneState().mode, "home");
});

test("opening an app moves it to the front of the stack", () => {
  const state = run(createInitialSceneState({ seedStack: SEED }), { type: "OPEN_APP", appId: "claude" });
  assert.deepEqual(state.stack, ["claude", "safari", "notes"]);
  assert.equal(getActiveAppId(state), "claude");
});

test("going home keeps the app open", () => {
  const state = run(createInitialSceneState({ seedStack: SEED, appId: "notes" }), { type: "GO_HOME" });
  assert.equal(state.mode, "home");
  assert.ok(state.stack.includes("notes"));
});

test("closing the last card leaves the switcher for Home", () => {
  let state = createInitialSceneState({ seedStack: ["safari"] });
  state = run(state, { type: "CLOSE_APP", appId: "safari" });
  assert.equal(state.mode, "home");
  assert.deepEqual(state.stack, []);
});

test("closing one of several cards stays in the switcher", () => {
  const state = run(createInitialSceneState({ seedStack: SEED }), { type: "CLOSE_APP", appId: "notes" });
  assert.equal(state.mode, "switcher");
  assert.deepEqual(state.stack, ["safari", "claude"]);
});

test("the switcher with nothing open falls back to Home", () => {
  const state = run(createInitialSceneState(), { type: "OPEN_SWITCHER" });
  assert.equal(state.mode, "home");
});

test("locking remembers where to return and blocks navigation meanwhile", () => {
  const open = createInitialSceneState({ seedStack: SEED, appId: "notes" });
  const locked = run(open, { type: "LOCK" });
  assert.equal(locked.mode, "locked");
  assert.equal(run(locked, { type: "OPEN_APP", appId: "safari" }), locked);
  assert.equal(run(locked, { type: "GO_HOME" }), locked);
  const unlocked = run(locked, { type: "UNLOCK" });
  assert.equal(unlocked.mode, "app");
  assert.equal(getActiveAppId(unlocked), "notes");
});

test("Spotlight opens from Home only; the other panels open anywhere", () => {
  const inApp = createInitialSceneState({ seedStack: SEED, appId: "notes" });
  assert.equal(run(inApp, { type: "OPEN_OVERLAY", overlay: "spotlight" }).overlay, null);
  assert.equal(run(inApp, { type: "OPEN_OVERLAY", overlay: "control-center" }).overlay, "control-center");
  const home = run(inApp, { type: "GO_HOME" });
  assert.equal(run(home, { type: "OPEN_OVERLAY", overlay: "spotlight" }).overlay, "spotlight");
});

test("navigating away dismisses an open panel", () => {
  const state = run(
    createInitialSceneState({ seedStack: SEED, appId: "notes" }),
    { type: "OPEN_OVERLAY", overlay: "notification-center" },
    { type: "GO_HOME" }
  );
  assert.equal(state.overlay, null);
});

test("a persisted scene round-trips without its panel", () => {
  const state = run(
    createInitialSceneState({ seedStack: SEED, appId: "notes" }),
    { type: "OPEN_OVERLAY", overlay: "control-center" }
  );
  assert.deepEqual(parseSceneState(serializeSceneState(state), VALID), { ...state, overlay: null });
});

test("parsing drops unknown apps and repairs a mode left with nothing to show", () => {
  const raw = JSON.stringify({ mode: "app", stack: ["gone", 7], modeBeforeLock: "switcher", homePage: -3 });
  assert.deepEqual(parseSceneState(raw, VALID), {
    mode: "home",
    stack: [],
    overlay: null,
    modeBeforeLock: "home",
    homePage: 0,
  });
});

test("parsing rejects anything that is not a scene", () => {
  for (const raw of [null, "", "not json", "[]", '{"mode":"desktop","stack":[]}', '{"mode":"home"}']) {
    assert.equal(parseSceneState(raw, VALID), null);
  }
});
