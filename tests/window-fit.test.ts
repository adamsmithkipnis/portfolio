import assert from "node:assert/strict";
import test from "node:test";

import { APPS } from "../lib/app-config";
import {
  DOCK_HEIGHT,
  MENU_BAR_HEIGHT,
  fitToDesktop,
  repairSquashedHeight,
} from "../lib/window-fit";

const safari = APPS.find((app) => app.id === "safari");
if (!safari) throw new Error("safari app config is missing");

const preset = { position: safari.defaultPosition, size: safari.defaultSize };

test("a tall desktop leaves the preset alone", () => {
  const fitted = fitToDesktop(preset.position, preset.size, 900, safari.minSize);
  assert.deepEqual(fitted.size, safari.defaultSize);
  assert.equal(fitted.position.y, safari.defaultPosition.y);
});

test("a short desktop trims the window but not below the app minimum", () => {
  const fitted = fitToDesktop(preset.position, preset.size, 600, safari.minSize);
  assert.ok(fitted.size.height < safari.defaultSize.height);
  assert.ok(fitted.size.height >= safari.minSize!.height);
});

test("a viewport too short for the minimum still yields a usable window", () => {
  // This is the regression: the old fit floored at one pixel, so the window
  // opened invisibly and the app read as an icon that does nothing.
  const fitted = fitToDesktop(preset.position, preset.size, 240, safari.minSize);
  assert.equal(fitted.size.height, safari.minSize!.height);
  assert.ok(fitted.position.y >= MENU_BAR_HEIGHT);
});

test("an unmeasured viewport passes the preset through untouched", () => {
  for (const viewportHeight of [0, -1]) {
    const fitted = fitToDesktop(
      preset.position,
      preset.size,
      viewportHeight,
      safari.minSize
    );
    assert.deepEqual(fitted.size, safari.defaultSize, `height ${viewportHeight}`);
    assert.deepEqual(fitted.position, safari.defaultPosition);
  }
});

test("every app survives a viewport shorter than its own minimum", () => {
  for (const app of APPS) {
    if (!app.minSize) continue;
    const fitted = fitToDesktop(
      app.defaultPosition,
      app.defaultSize,
      DOCK_HEIGHT + MENU_BAR_HEIGHT,
      app.minSize
    );
    assert.equal(fitted.size.height, app.minSize.height, app.id);
  }
});

test("a window stored below the minimum grows back on restore", () => {
  const squashed = { width: 1000, height: 120 };
  const repaired = repairSquashedHeight(
    { x: 190, y: 28 },
    squashed,
    900,
    safari.defaultSize,
    safari.minSize
  );
  assert.equal(repaired.size.height, safari.defaultSize.height);
  assert.equal(repaired.size.width, squashed.width, "width is left alone");
});

test("restore does not touch a window the visitor sized themselves", () => {
  const chosen = { width: 700, height: 500 };
  const repaired = repairSquashedHeight(
    { x: 40, y: 60 },
    chosen,
    900,
    safari.defaultSize,
    safari.minSize
  );
  assert.deepEqual(repaired.size, chosen);
  assert.deepEqual(repaired.position, { x: 40, y: 60 });
});
