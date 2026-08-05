# Tahoe Design Tokens

Extracts macOS Tahoe's design language directly from the running OS via AppKit,
rather than approximating it from screenshots or third-party Figma libraries.

Generated against **macOS 26.5.2 (Build 25F84)**.

## Why

Screenshot-sampling gives you *composited* values and loses structure. The OS
reports `labelColor` as black at **0.85 alpha**; a screenshot gives you the
flat result of that alpha over whatever was behind it. Extraction preserves the
semantics.

It also catches version drift. Tahoe's `systemRed` is `#FF383C` — most published
references still list the older `#FF3B30`.

## Usage

```bash
# 1. Extract from the OS  (requires macOS + Command Line Tools)
swift extract-tokens.swift > tokens.json

# 2. Generate CSS + Tailwind  (requires Node 20+)
node build-tokens.mjs
```

Outputs:

| File | Contents |
|---|---|
| `tokens.json` | Raw extraction — the source of truth |
| `tokens.css` | CSS custom properties, light + dark + `data-theme` overrides |
| `tailwind.tokens.js` | Tailwind theme extension |

Wire the Tailwind config up once:

```ts
// tailwind.config.ts
import tahoe from "./design-tokens/tailwind.tokens.js";
export default { theme: { extend: tahoe } };
```

Re-run both steps after any macOS update to pick up changes.

## What is and isn't extracted

**Exact** — queried from AppKit:

- 43 semantic colors × light/dark (backgrounds, labels, controls, separators,
  full system palette), with alpha preserved
- Type ramp: 11 styles with size, resolved weight, line height, ascender/descender
- Control metrics: push button and text field heights across all four
  `NSControl.ControlSize` values
- Material **tint layers** × light/dark

**Not extracted** — must be calibrated by eye:

- **Blur radius.** `NSVisualEffectView`'s backdrop blur is composited by the
  window server, not drawn by the view, so offscreen capture returns only the
  tint layer. The radii in `build-tokens.mjs` (`BLUR_SEED`) are hand-seeded
  starting points, not measurements.
- **Corner radii.** Not exposed by any public API.

## Calibrating blur

The goal is to make this a *measured* comparison rather than eyeballing.

1. Open a real Tahoe window with the material you're matching — Finder's
   sidebar, a menu, a popover — over a **known, high-contrast background**
   (a solid color desktop image works; a gradient is better for judging falloff).
2. Screenshot it: `⌘⇧4`, then space, then click the window.
3. Recreate the same background in your Storybook story, apply
   `.tahoe-glass` with the material's extracted tint, and put the two side by
   side at 100% zoom.
4. Adjust `--glass-blur` until the falloff matches. Update `BLUR_SEED` in
   `build-tokens.mjs` and regenerate.

Matching against a captured target beats adjusting against memory. The tint is
already correct from extraction, so blur is the only free variable.

## Font licensing — important

**Do not embed the SF font files.** Apple's license covers system font use in
apps and mockups but **not** web font embedding.

The generated `--font-sans` uses `-apple-system`, which resolves to the local
system font on Apple devices — perfect fidelity, zero bytes downloaded, no
licensing exposure. Non-Apple visitors fall back to Inter.

## Files

```
extract-tokens.swift   Queries AppKit, emits JSON
build-tokens.mjs       JSON -> CSS + Tailwind
tokens.json            Generated (commit it — it's the reference)
tokens.css             Generated
tailwind.tokens.js     Generated
```
