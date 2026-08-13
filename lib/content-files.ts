// Bridges the build-time content tree (system/content/generated.ts) into the
// paths Finder browses. Content lives at ~/Work; the folder structure under
// content/ is reproduced verbatim, so adding a project is still creating a folder.

import { CONTENT_TREE } from "@/system/content/generated";
import type { ContentNode } from "@/system/content/types";

export const HOME_DIR = "/Users/adamsmithkipnis";
export const WORK_DIR = `${HOME_DIR}/Work`;

export interface ContentFinderItem {
  name: string;
  type: "file" | "dir";
  path: string;
}

// content/work/ is what ~/Work shows; other top-level content folders (writing/,
// loose assets) get their own mounts when they're needed.
const WORK_ROOT = (CONTENT_TREE.children ?? []).find((child) => child.slug === "work") ?? null;

// Flattened by Finder path, so a lookup is a map hit rather than a tree walk
const NODES_BY_PATH = new Map<string, ContentNode>();

function indexNode(node: ContentNode, finderPath: string): void {
  NODES_BY_PATH.set(finderPath, node);
  for (const child of node.children ?? []) {
    indexNode(child, `${finderPath}/${child.slug}`);
  }
}

for (const child of WORK_ROOT?.children ?? []) {
  indexNode(child, `${WORK_DIR}/${child.slug}`);
}

export function getContentNode(path: string): ContentNode | null {
  return NODES_BY_PATH.get(path) ?? null;
}

export function isContentPath(path: string): boolean {
  return path === WORK_DIR || path.startsWith(`${WORK_DIR}/`);
}

/** Children of a content directory, in Finder's item shape. Empty for leaves. */
export function getContentChildren(path: string): ContentFinderItem[] {
  const children =
    path === WORK_DIR ? (WORK_ROOT?.children ?? []) : (getContentNode(path)?.children ?? []);

  return children.map((child) => ({
    name: child.name,
    type: child.kind === "folder" ? ("dir" as const) : ("file" as const),
    path: `${path}/${child.slug}`,
  }));
}

/** True when the tree has any content at all — used to hide an empty Work folder. */
export function hasContent(): boolean {
  return (WORK_ROOT?.children ?? []).length > 0;
}

/** Every content directory path, so Finder search can index case studies. */
export function getContentDirectoryPaths(): string[] {
  const paths = hasContent() ? [WORK_DIR] : [];
  for (const [path, node] of NODES_BY_PATH) {
    if (node.kind === "folder") paths.push(path);
  }
  return paths;
}
