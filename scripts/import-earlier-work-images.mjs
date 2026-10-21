/**
 * Imports the images for content/work/earlier-work from the recovered Semplice export.
 *
 * The case studies under content/work/earlier-work were recovered from the old
 * Semplice (WordPress) site. Their Markdown is in the repo; their images came out
 * of the site backup into a local folder (smithkipnis-case-studies/images/<project>/),
 * which this script converts to WebP and copies into public/content/.
 *
 * Usage:
 *   npm run import:earlier-work-images                         # ~/Downloads/smithkipnis-case-studies/images
 *   npm run import:earlier-work-images -- /path/to/images      # somewhere else
 *
 * scripts/earlier-work-images.json maps each source file to its target. Lossy WebP at
 * quality 85 with no downscaling, matching scripts/optimize-archive-images.mjs.
 * Safe to re-run: it re-encodes from the originals and overwrites the targets.
 * tests/content-assets.test.ts fails until every referenced image is present.
 */

import sharp from "sharp";
import { mkdir, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "scripts/earlier-work-images.json");
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
  let converted = 0;
  let inputBytes = 0;
  let outputBytes = 0;
  const missing = [];

  for (const { from, to } of manifest) {
    const source = path.join(sourceDir, from);
    if (!(await exists(source))) {
      missing.push(from);
      continue;
    }

    const target = path.join(ROOT, to);
    await mkdir(path.dirname(target), { recursive: true });
    const info = await sharp(source).webp({ quality: QUALITY }).toFile(target);

    inputBytes += (await stat(source)).size;
    outputBytes += info.size;
    converted += 1;
  }

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  console.log(
    `earlier-work images: ${converted}/${manifest.length} converted (${mb(inputBytes)}MB -> ${mb(outputBytes)}MB)`
  );

  if (missing.length > 0) {
    console.error(`Missing from ${sourceDir}:`);
    for (const file of missing) console.error(`  ${file}`);
    process.exit(1);
  }
}

main();
