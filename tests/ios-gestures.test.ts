import assert from "node:assert/strict";
import test from "node:test";

import {
  type GestureSample,
  homeGestureProgress,
  isHomeGesturePaused,
  releaseVelocityY,
  resolveHomeGesture,
  resolvePullDown,
  topEdgeTarget,
} from "../lib/ios/gestures";

const VIEWPORT = 800;

/** A straight vertical drag from `fromY` to `toY` over `ms`, sampled every 10ms. */
function drag(fromY: number, toY: number, ms: number): GestureSample[] {
  const steps = Math.max(1, Math.round(ms / 10));
  return Array.from({ length: steps + 1 }, (_, i) => ({
    x: 200,
    y: fromY + ((toY - fromY) * i) / steps,
    t: (ms * i) / steps,
  }));
}

/** Hold still at the end of a drag, as a finger pausing before it lifts. */
function thenHold(samples: GestureSample[], ms: number): GestureSample[] {
  const last = samples[samples.length - 1];
  return [...samples, { ...last, t: last.t + ms / 2 }, { ...last, t: last.t + ms }];
}

test("a touch that does not move is a tap", () => {
  assert.equal(resolveHomeGesture([{ x: 200, y: 790, t: 0 }, { x: 201, y: 789, t: 80 }]), "tap");
  assert.equal(resolvePullDown([{ x: 20, y: 10, t: 0 }, { x: 20, y: 12, t: 90 }], VIEWPORT), "tap");
});

test("a long press without movement is not a tap", () => {
  assert.equal(resolveHomeGesture([{ x: 200, y: 790, t: 0 }, { x: 200, y: 790, t: 900 }]), "cancel");
});

test("a fast upward flick goes home even when short", () => {
  assert.equal(resolveHomeGesture(drag(790, 690, 100)), "home");
});

test("a slow short drag that pauses opens the switcher", () => {
  assert.equal(resolveHomeGesture(thenHold(drag(790, 600, 600), 200)), "switcher");
});

test("a slow drag most of the way up still opens the switcher", () => {
  assert.equal(resolveHomeGesture(thenHold(drag(790, 150, 1500), 200)), "switcher");
});

test("lifting without a pause while still moving up goes home", () => {
  assert.equal(resolveHomeGesture(drag(790, 400, 500)), "home");
});

test("a pause registers mid-drag once the finger has been still long enough", () => {
  const moving = drag(790, 500, 400);
  const end = moving[moving.length - 1].t;
  assert.equal(isHomeGesturePaused(moving, end), false);
  assert.equal(isHomeGesturePaused(moving, end + 100), false);
  assert.equal(isHomeGesturePaused(moving, end + 200), true);
});

test("a finger resting on the indicator without dragging up has not paused", () => {
  assert.equal(isHomeGesturePaused([{ x: 200, y: 790, t: 0 }], 2000), false);
  assert.equal(isHomeGesturePaused([], 2000), false);
});

test("jitter within the slop does not reset a pause", () => {
  const moving = drag(790, 500, 400);
  const end = moving[moving.length - 1];
  const jitter = [...moving, { x: end.x + 2, y: end.y - 3, t: end.t + 120 }];
  assert.equal(isHomeGesturePaused(jitter, end.t + 200), true);
});

test("a drag too short to mean anything snaps back", () => {
  assert.equal(resolveHomeGesture(thenHold(drag(790, 775, 400), 200)), "cancel");
});

test("dragging up then flicking back down cancels", () => {
  const up = drag(790, 500, 400);
  const down = drag(500, 620, 100).map((s) => ({ ...s, t: s.t + 400 }));
  assert.equal(resolveHomeGesture([...up, ...down.slice(1)]), "cancel");
});

test("release velocity only looks at the end of the drag", () => {
  const samples = thenHold(drag(790, 400, 200), 300);
  assert.equal(releaseVelocityY(samples), 0);
  assert.ok(releaseVelocityY(drag(790, 690, 100)) < -0.5);
});

test("progress follows the finger and is clamped", () => {
  assert.equal(homeGestureProgress(drag(800, 400, 300), VIEWPORT), 0.5);
  assert.equal(homeGestureProgress(drag(700, 780, 300), VIEWPORT), 0);
  assert.equal(homeGestureProgress([], VIEWPORT), 0);
});

test("the right corner of the status bar is Control Center", () => {
  assert.equal(topEdgeTarget(20, 390), "notification-center");
  assert.equal(topEdgeTarget(195, 390), "notification-center");
  assert.equal(topEdgeTarget(300, 390), "control-center");
});

test("a pull-down opens past its threshold or on a flick, and cancels otherwise", () => {
  assert.equal(resolvePullDown(thenHold(drag(10, 200, 500), 200), VIEWPORT), "open");
  assert.equal(resolvePullDown(drag(10, 90, 100), VIEWPORT), "open");
  assert.equal(resolvePullDown(thenHold(drag(10, 80, 500), 200), VIEWPORT), "cancel");
  assert.equal(resolvePullDown(drag(200, 100, 100), VIEWPORT), "cancel");
});
