/**
 * Imports the Earlier Work thumbnails from the recovered Semplice export.
 *
 * The twenty earlier case studies (config/case-studies.mjs → EARLIER_WORK) use
 * the old site's 360x360 cover sketches as their thumbnails on the case study
 * index and in Finder. Those came out of the site backup into a local folder
 * (smithkipnis-case-studies/images/<project>/cover-*.png); this converts them
 * to WebP under public/archive/smithkipnis/img/earlier-work/covers/.
 *
 * Usage:
 *   npm run import:earlier-work-images                         # ~/Downloads/smithkipnis-case-studies/images
 *   npm run import:earlier-work-images -- /path/to/images      # somewhere else
 *
 * scripts/earlier-work-covers.json maps each source file to its target. Lossy
 * WebP at quality 85 with no downscaling, matching optimize-archive-images.mjs.
 * Safe to re-run. tests/archive-assets.test.ts fails while any is missing.
 */

import sharp from "sharp";
import { mkdir, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "scripts/earlier-work-covers.json");
const QUALITY = 85;

const sourceDir = path.resolve(
  process.argv[2] ?? path.join(os.homedir(), "Downloads/smithkipnis-case-studies/images")
);

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(sourceDir))) {
    console.error(`Image folder not found: ${sourceDir}`);
    console.error("Pass its path: npm run import:earlier-work-images -- /path/to/images");
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const missing = [];
  let converted = 0;

  for (const { from, to } of manifest) {
    const source = path.join(sourceDir, from);
    if (!(await exists(source))) {
      missing.push(from);
      continue;
    }
    const target = path.join(ROOT, to);
    await mkdir(path.dirname(target), { recursive: true });
    await sharp(source).webp({ quality: QUALITY }).toFile(target);
    converted += 1;
  }

  console.log(`earlier-work thumbnails: ${converted}/${manifest.length} converted`);
  if (missing.length > 0) {
    console.error(`Missing from ${sourceDir}:`);
    for (const file of missing) console.error(`  ${file}`);
    process.exit(1);
  }
}

main();
