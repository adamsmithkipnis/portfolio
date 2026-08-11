// Copies pdf.js's worker into public/ so the PDF viewer serves it from our own
// origin instead of a CDN.
//
// This runs on every build because the worker and the library must be the same
// version — a stale copy in public/ fails at runtime with a version-mismatch
// error that looks nothing like "you upgraded pdfjs-dist".

import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINATION = join(ROOT, "public", "pdf.worker.min.mjs");

const source = join(dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs");

mkdirSync(dirname(DESTINATION), { recursive: true });
copyFileSync(source, DESTINATION);

const { version } = require("pdfjs-dist/package.json");
console.log(`pdf worker: v${version} -> ${relative(ROOT, DESTINATION)}`);
