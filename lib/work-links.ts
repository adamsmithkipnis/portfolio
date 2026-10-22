/**
 * ~/Work in Finder: the case studies, as web-location files.
 *
 * The case studies themselves live in the archived site, so Finder does not
 * hold a second copy of them. Each item here is what macOS would call a
 * `.webloc`: a file that stands for a page, and opens in Safari. The list,
 * the running order and the card copy all come from `config/case-studies.mjs`,
 * the same source the archive's index is built from, so the two never drift.
 *
 * MDX case studies under `content/work/` still mount beside these when they
 * exist (see `lib/content-files.ts`); this is the bridge for the ones that
 * were published as pages.
 */

import { CASE_STUDIES, EARLIER_WORK, ORDER, SITE_MODE } from "@/config/case-studies.mjs";
import { ARCHIVE_ROOT } from "@/lib/archive-site";
import { hasContent, WORK_DIR } from "@/lib/content-files";

export interface WorkLink {
  /** Case study slug, shared with the archive and its index. */
  slug: string;
  /** File name as Finder lists it, extension included. */
  name: string;
  /** Title, shown in place of the file name. */
  title: string;
  /** Finder path: `~/Work/<title>.webloc`, or under `~/Work/Earlier Work/`. */
  path: string;
  /** The archived page Safari opens. */
  archivePath: string;
  /**
   * Earlier-work entries record only what their original page stated, so any
   * of these can be absent there. The featured three always carry role,
   * years, summary and tags.
   */
  role?: string;
  org?: string;
  years?: string;
  summary?: string;
  tags: string[];
  image: string;
  alt: string;
}

/** The folder inside ~/Work holding the recovered Semplice projects. */
export const EARLIER_WORK_DIR = `${WORK_DIR}/Earlier Work`;

type CaseStudy = (typeof CASE_STUDIES)[keyof typeof CASE_STUDIES];

export const WORK_LINKS: WorkLink[] = ORDER[SITE_MODE].map((slug) => {
  const study = (CASE_STUDIES as Record<string, CaseStudy>)[slug];
  const name = `${study.title}.webloc`;
  return {
    slug,
    name,
    title: study.title,
    path: `${WORK_DIR}/${name}`,
    archivePath: `${ARCHIVE_ROOT}/casestudies/${slug}`,
    role: study.role,
    years: study.years,
    summary: study.summary,
    tags: study.tags,
    image: study.image,
    alt: study.alt,
  };
});

/** ~/Work/Earlier Work: the older projects, flat, in the old site's order. */
export const EARLIER_WORK_LINKS: WorkLink[] = EARLIER_WORK.map((project) => {
  const name = `${project.title}.webloc`;
  return {
    slug: project.slug,
    name,
    title: project.title,
    path: `${EARLIER_WORK_DIR}/${name}`,
    archivePath: `${ARCHIVE_ROOT}/casestudies/${project.slug}`,
    role: project.role,
    org: project.org,
    years: project.years,
    summary: project.summary,
    tags: [],
    image: project.image,
    alt: project.alt,
  };
});

const LINKS_BY_PATH = new Map(
  [...WORK_LINKS, ...EARLIER_WORK_LINKS].map((link) => [link.path, link])
);

export function getWorkLink(path: string): WorkLink | null {
  return LINKS_BY_PATH.get(path) ?? null;
}

/**
 * Whether ~/Work has anything in it.
 *
 * Two things can fill the folder: the published case studies above, and MDX
 * projects under `content/work/`. Asking only about the MDX, as the Finder
 * sidebar once did, hid the folder whenever `content/work` was empty — which
 * is exactly the state the archived case studies were added to cover.
 */
export interface WorkFolderItem {
  name: string;
  displayName?: string;
  type: "webloc" | "dir";
  path: string;
}

const asItem = (link: WorkLink): WorkFolderItem => ({
  name: link.name,
  displayName: link.title,
  type: "webloc",
  path: link.path,
});

/**
 * What Finder lists in a folder made of web locations, or null for any other
 * folder. ~/Work holds the featured studies then the Earlier Work folder;
 * Earlier Work holds its projects directly, with no subfolders.
 */
export function getWorkFolderItems(path: string): WorkFolderItem[] | null {
  if (path === WORK_DIR) {
    return [
      ...WORK_LINKS.map(asItem),
      ...(EARLIER_WORK_LINKS.length > 0
        ? [{ name: "Earlier Work", type: "dir" as const, path: EARLIER_WORK_DIR }]
        : []),
    ];
  }
  if (path === EARLIER_WORK_DIR) return EARLIER_WORK_LINKS.map(asItem);
  return null;
}

export function hasWorkItems(): boolean {
  return WORK_LINKS.length > 0 || hasContent();
}
