/**
 * Re-encodes the archived site's *lossless* WebP images as lossy WebP.
 *
 * The scrape captured 34 of the 53 images as lossless WebP, which is why a
 * 360x360 sketch weighed 187KB and the archive as a whole weighed 12.4MB.
 * Lighthouse put the waste at 1,384KiB on a phone and 2,503KiB on a desktop —
 * the largest item in the audit after the root redirect.
 *
 * Only the lossless ones. The other 19 arrived lossy already and re-encoding
 * them buys 2% while spending a generation of quality, so they are left alone.
 * That split is also what makes this idempotent: once a file is lossy it is
 * skipped forever, so a second run is a no-op and repeat runs cannot stack
 * generation loss. The check reads the WebP container rather than guessing
 * from file size, because a lossless file that happens to compress well (a
 * flat-colour screenshot) looks small without being lossy.
 *
 * Quality 85, no downscaling: the case study column tops out at 812px, so the
 * 1500px captures are already about 2x and cropping them would cost real
 * detail on a portfolio. Checked at 1:1 against a flowchart screenshot — the
 * content most likely to show ringing — and the two were indistinguishable.
 *
 * Run by hand after adding images to the archive. Not wired into the build:
 * it would re-probe 53 files on every `npm run dev` to do nothing.
 */

import sharp from "sharp";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE_DIR = path.join(ROOT, "public/archive/smithkipnis");
const QUALITY = 85;

/**
 * True when the file's image data is stored losslessly.
 *
 * A WebP is either a bare `VP8 ` (lossy) / `VP8L` (lossless) chunk, or a
 * `VP8X` extended container — alpha and metadata force the extended form —
 * whose real image chunk sits after the 10-byte VP8X payload and any ALPH,
 * ICCP or EXIF chunks. So the extended case has to be walked, not sniffed:
 * searching the whole buffer for "VP8L" would hit the same four bytes
 * occurring by chance inside compressed pixel data.
 */
function isLossless(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return false;
  }

  const first = buffer.toString("ascii", 12, 16);
  if (first === "VP8L") return true;
  if (first !== "VP8X") return false;

  // Chunks are fourcc + little-endian size + payload, each padded to even.
  let offset = 12 + 8 + buffer.readUInt32LE(16);
  if (offset % 2) offset += 1;

  while (offset + 8 <= buffer.length) {
    const fourcc = buffer.toString("ascii", offset, offset + 4);
    if (fourcc === "VP8L") return true;
    if (fourcc === "VP8 ") return false;

    const size = buffer.readUInt32LE(offset + 4);
    offset += 8 + size + (size % 2);
  }

  return false;
}

async function webpFilesIn(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await webpFilesIn(full)));
    else if (entry.name.endsWith(".webp")) found.push(full);
  }
  return found;
}

const files = (await webpFilesIn(ARCHIVE_DIR)).sort();
let before = 0;
let after = 0;
let skipped = 0;

for (const file of files) {
  const original = await readFile(file);
  before += original.length;

  if (!isLossless(original)) {
    after += original.length;
    skipped += 1;
    continue;
  }

  const encoded = await sharp(original)
    .webp({ quality: QUALITY, effort: 6, alphaQuality: 100, smartSubsample: true })
    .toBuffer();

  // A file that would grow was already better off as it was.
  if (encoded.length >= original.length) {
    after += original.length;
    skipped += 1;
    continue;
  }

  await writeFile(file, encoded);
  after += encoded.length;
  console.log(
    `  ${path.relative(ARCHIVE_DIR, file).padEnd(46)}` +
      `${(original.length / 1024).toFixed(0).padStart(6)}KB ->${(encoded.length / 1024).toFixed(0).padStart(6)}KB`
  );
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
console.log(
  `\n${files.length} images, ${skipped} left as they were (already lossy). ` +
    `${mb(before)}MB -> ${mb(after)}MB (${(100 - (after / before) * 100).toFixed(0)}% smaller)`
);
