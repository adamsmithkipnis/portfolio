// Walks content/ and emits system/content/generated.ts — the tree Finder renders.
//
// Finder is a client component and cannot touch the filesystem, so the walk runs
// at build time and its result is bundled. Run via `npm run content`; `prebuild`
// does it automatically.
//
// Frontmatter is a deliberately small YAML subset (see docs/CONTENT-MODEL.md):
//   key: scalar
//   key: [a, b, c]
//   key:
//     - label: x
//       value: y
// Anything richer belongs in the body, not the metadata.

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "content");
const OUT_FILE = join(ROOT, "system", "content", "generated.ts");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const WORDS_PER_BYTE = 6; // rough prose-to-bytes ratio for a plausible Finder size column

function parseScalar(raw) {
  const value = raw.trim().replace(/^["'](.*)["']$/s, "$1");
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value)) && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
}

function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };

  const data = {};
  const lines = match[1].split(/\r?\n/);
  let listKey = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    // "  - label: x" starts an object in a list; "    value: y" extends the last one
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && listKey) {
      const inner = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(listItem[1]);
      data[listKey].push(inner ? { [inner[1]]: parseScalar(inner[2]) } : parseScalar(listItem[1]));
      continue;
    }

    const indented = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (indented && listKey && data[listKey].length > 0) {
      const last = data[listKey][data[listKey].length - 1];
      if (last && typeof last === "object") {
        last[indented[1]] = parseScalar(indented[2]);
        continue;
      }
    }

    const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const [, key, rest] = pair;

    if (rest.trim() === "") {
      data[key] = [];
      listKey = key;
      continue;
    }

    listKey = null;
    const inlineList = /^\[(.*)\]$/.exec(rest.trim());
    data[key] = inlineList
      ? inlineList[1].split(",").map((entry) => parseScalar(entry)).filter((entry) => entry !== "")
      : parseScalar(rest);
  }

  return { data, body: source.slice(match[0].length) };
}

// "01-problem" -> "Problem"; "design-system-foundation" -> "Design System Foundation"
function displayName(slug) {
  return slug
    .replace(/^\d+-/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function kindFor(extension) {
  if (extension === ".pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  return "document";
}

function walk(absoluteDir, routePrefix) {
  const entries = readdirSync(absoluteDir)
    .filter((entry) => !entry.startsWith("."))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const children = [];

  for (const entry of entries) {
    const absolute = join(absoluteDir, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      children.push(buildFolder(absolute, entry, `${routePrefix}/${entry}`));
      continue;
    }

    if (entry === "index.mdx") continue; // consumed as the parent's metadata

    const extension = extname(entry).toLowerCase();
    const slug = entry.slice(0, -extension.length || undefined);
    const kind = kindFor(extension);
    const node = {
      slug,
      name: displayName(slug),
      path: `${routePrefix}/${slug}`,
      kind,
      size: stats.size,
      modified: stats.mtime.toISOString().slice(0, 10),
    };

    if (kind === "document") {
      const { data, body } = parseFrontmatter(readFileSync(absolute, "utf8"));
      if (typeof data.title === "string") node.name = data.title;
      node.body = body.trim();
      node.size = Math.round(body.trim().split(/\s+/).filter(Boolean).length * WORDS_PER_BYTE);
    } else {
      // Assets live in public/content/ mirroring their content/ path
      node.assetUrl = `/content${relative(CONTENT_DIR, absolute).split("\\").join("/").replace(/^/, "/")}`;
    }

    children.push(node);
  }

  return children;
}

function buildFolder(absoluteDir, slug, routePrefix) {
  const node = {
    slug,
    name: displayName(slug),
    path: routePrefix,
    kind: "folder",
    size: 0,
    modified: statSync(absoluteDir).mtime.toISOString().slice(0, 10),
  };

  const indexPath = join(absoluteDir, "index.mdx");
  if (existsSync(indexPath)) {
    const { data, body } = parseFrontmatter(readFileSync(indexPath, "utf8"));
    node.meta = data;
    if (typeof data.title === "string") node.name = data.title;
    if (typeof data.year === "number") node.modified = `${data.year}-01-01`;
    if (body.trim()) node.body = body.trim();
  }

  node.children = walk(absoluteDir, routePrefix);
  node.size = node.children.reduce((total, child) => total + child.size, 0);
  return node;
}

function main() {
  const tree = existsSync(CONTENT_DIR)
    ? { slug: "content", name: "Content", path: "/finder", kind: "folder", size: 0, modified: new Date().toISOString().slice(0, 10), children: walk(CONTENT_DIR, "/finder") }
    : { slug: "content", name: "Content", path: "/finder", kind: "folder", size: 0, modified: new Date().toISOString().slice(0, 10), children: [] };

  tree.size = (tree.children ?? []).reduce((total, child) => total + child.size, 0);

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(
    OUT_FILE,
    `// GENERATED by scripts/build-content.mjs — do not edit.\n` +
      `// Regenerate with \`npm run content\`.\n\n` +
      `import type { ContentNode } from "./types";\n\n` +
      `export const CONTENT_TREE: ContentNode = ${JSON.stringify(tree, null, 2)};\n`
  );

  const projects = (tree.children ?? []).flatMap((child) => child.children ?? []).filter((child) => child.meta);
  console.log(`content: ${projects.length} project(s) -> ${relative(ROOT, OUT_FILE)}`);
}

main();
