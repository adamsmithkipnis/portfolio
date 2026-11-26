/**
 * The Figma app's files.
 *
 * Each file is a manifest in `config/figma/<slug>.json` plus one image per page
 * in `public/figma/<slug>/`. The images are exports of whole pages from the real
 * files; layer rectangles are in that image's pixel space, so the canvas never
 * has to know where the page sat on Figma's own canvas. See docs/figma-app.md.
 *
 * Adding a file: export its pages, write its manifest, add it to FIGMA_FILES.
 */

import graceDesignSystem from "@/config/figma/grace-design-system.json";
import windowManagement from "@/config/figma/window-management.json";

export interface FigmaLayer {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** One line of design rationale, shown in the details panel. */
  note?: string;
}

export interface FigmaPage {
  id: string;
  name: string;
  /** Served path of the page export. */
  image: string;
  w: number;
  h: number;
  layers: FigmaLayer[];
}

export interface FigmaFile {
  slug: string;
  title: string;
  kind: "design" | "slides";
  /** Figma's key for the source file. Kept for re-exports, never linked. */
  fileKey: string;
  /** Last edited, as `YYYY` or `YYYY-MM`. */
  edited: string;
  /** Archived case study slug (config/case-studies.mjs), opened in Safari. */
  caseStudy?: string;
  /** Canvas color around the page, taken from the file. */
  background: string;
  pages: FigmaPage[];
}

export const FIGMA_FILES: FigmaFile[] = [
  windowManagement as FigmaFile,
  graceDesignSystem as FigmaFile,
];

export function getFigmaFile(slug: string | null | undefined): FigmaFile | null {
  if (!slug) return null;
  return FIGMA_FILES.find((file) => file.slug === slug) ?? null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-09` → "Edited Sep 2026"; `2022` → "Edited 2022". */
export function formatEdited(edited: string): string {
  const [year, month] = edited.split("-");
  const monthIndex = Number(month) - 1;
  if (!month || Number.isNaN(monthIndex) || !MONTHS[monthIndex]) return `Edited ${year}`;
  return `Edited ${MONTHS[monthIndex]} ${year}`;
}
