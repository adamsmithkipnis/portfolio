/**
 * Resizes the app icons the dock draws.
 *
 * They arrived as 512x512 PNGs — Spotify at 1024 — and the dock draws them at
 * 48. All eight together weighed 1,159KB to fill 48px slots, which was most of
 * the 1,542KiB Lighthouse wanted back on the desktop, and it made the dock icon
 * an expensive thing to be the page's largest contentful paint.
 *
 * 256 is the ceiling that matters: the dock scales to 1.6 and magnifies to 1.4,
 * so an icon tops out near 107 CSS px, which is 215 device px on a 2x display.
 * That leaves room at the sizes anyone actually runs, and keeping it tight
 * matters because these are preloaded — see app/page.tsx.
 *
 * Palette PNG rather than full colour: 113KB against 325KB, and compared at 1:1
 * on the gear icon, the one with the most gradient to lose, the two are
 * indistinguishable. Staying PNG keeps every path in the registry as it was.
 *
 * Idempotent: anything already at or under the target is left alone, so a
 * second run does nothing and repeat runs cannot soften an icon by degrees.
 *
 * Run by hand after adding an app icon; not wired into the build.
 */

import sharp from "sharp";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = 256;

/**
 * The registry is the source of truth for app icons, and Trash is the one the
 * dock draws without an app behind it. Read rather than imported because the
 * registry is TypeScript and this is a plain node script.
 */
async function iconPaths() {
  const registry = await readFile(path.join(ROOT, "lib/app-config.ts"), "utf8");
  const found = new Set(["/trash.png"]);
  for (const [, icon] of registry.matchAll(/^\s*icon:\s*"([^"]+\.png)"/gm)) {
    found.add(icon);
  }
  return [...found].sort();
}

let before = 0;
let after = 0;
let skipped = 0;

for (const icon of await iconPaths()) {
  const file = path.join(ROOT, "public", icon.replace(/^\//, ""));

  let size;
  try {
    ({ size } = await stat(file));
  } catch {
    console.log(`  ${icon} — no such file, skipped`);
    continue;
  }
  before += size;

  const { width = 0 } = await sharp(file).metadata();
  if (width <= TARGET) {
    after += size;
    skipped += 1;
    continue;
  }

  const resized = await sharp(file)
    .resize(TARGET, TARGET, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  await writeFile(file, resized);
  after += resized.length;
  console.log(
    `  ${icon.padEnd(18)} ${String(width).padStart(4)}px ${(size / 1024).toFixed(0).padStart(5)}KB -> ` +
      `${TARGET}px ${(resized.length / 1024).toFixed(0).padStart(4)}KB`
  );
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)}KB`;
console.log(
  `\n${skipped} already at or under ${TARGET}px. ${kb(before)} -> ${kb(after)} ` +
    `(${(100 - (after / before) * 100).toFixed(0)}% smaller)`
);
