/**
 * What the Claude app is allowed to know about Adam.
 *
 * Everything here is read from `config/case-studies.mjs` (the same source the
 * archived site and Finder's ~/Work are built from) and from the app
 * registry's provenance fields. Nothing is written for the model by hand, so
 * the assistant cannot drift from what the site itself says.
 */

import {
  CASE_STUDIES,
  EARLIER_WORK,
  FRAMING,
  ORDER,
  ROLE_LINE,
  SITE_MODE,
} from "@/config/case-studies.mjs";
import { SITE_PAGES } from "@/config/bookmarks";
import { APPS } from "@/lib/app-config";

const ARCHIVE_ROOT = "/website";

export interface PortfolioProject {
  slug: string;
  title: string;
  featured: boolean;
  archivePath: string;
}

type CaseStudy = (typeof CASE_STUDIES)[keyof typeof CASE_STUDIES] & {
  awards?: Array<{ year: string; org: string; tier: string; category: string }>;
};
type EarlierProject = (typeof EARLIER_WORK)[number] & { role?: string; years?: string };

const featuredSlugs: string[] = [...ORDER[SITE_MODE]];

function caseStudy(slug: string): CaseStudy {
  return (CASE_STUDIES as Record<string, CaseStudy>)[slug];
}

/** Every project the assistant may open, featured first, in the site's order. */
export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  ...featuredSlugs.map((slug) => ({
    slug,
    title: caseStudy(slug).title,
    featured: true,
    archivePath: `${ARCHIVE_ROOT}/casestudies/${slug}`,
  })),
  ...(EARLIER_WORK as EarlierProject[]).map((project) => ({
    slug: project.slug,
    title: project.title,
    featured: false,
    archivePath: `${ARCHIVE_ROOT}/casestudies/${project.slug}`,
  })),
];

const PROJECTS_BY_SLUG = new Map(PORTFOLIO_PROJECTS.map((p) => [p.slug, p]));

export function getPortfolioProject(slug: string): PortfolioProject | null {
  return PROJECTS_BY_SLUG.get(slug) ?? null;
}

/** Site pages the assistant may open in Safari, keyed by a stable id. */
export const OPENABLE_SITE_PAGES = SITE_PAGES.map((page) => ({
  id: page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  title: page.title,
  path: page.path,
}));

export function getOpenableSitePage(id: string) {
  return OPENABLE_SITE_PAGES.find((page) => page.id === id) ?? null;
}

function formatFeatured(slug: string): string {
  const study = caseStudy(slug);
  const lines = [
    `### ${study.title} (slug: ${slug})`,
    `Role: ${study.role}. Years: ${study.years}. Client: ${study.client}.`,
    `Summary: ${study.summary}`,
    `Tags: ${study.tags.join(", ")}`,
  ];
  if (study.metrics?.length) {
    lines.push(
      `Metrics: ${study.metrics.map((m) => `${m.value} ${m.label}`).join("; ")}`
    );
  }
  if (study.glance) {
    lines.push(`Problem: ${study.glance.problem}`);
    lines.push(`What Adam did: ${study.glance.did}`);
    lines.push(`Outcome: ${study.glance.outcome}`);
  }
  if (study.awards?.length) {
    lines.push(
      `Awards: ${study.awards
        .map((a) => `${a.org} ${a.tier} (${a.category}, ${a.year})`)
        .join("; ")}`
    );
  }
  return lines.join("\n");
}

function formatEarlier(project: EarlierProject): string {
  const details = [project.role, project.org, project.years].filter(Boolean).join(", ");
  return `- ${project.title} (slug: ${project.slug})${details ? ` — ${details}` : ""}: ${project.summary}`;
}

/** Apps on this desktop that Adam built with Claude Code, from the registry. */
export function getAppsBuiltWithClaude(): string[] {
  return APPS.filter((app) => app.provenance.agent === "Claude Code").map((app) => app.name);
}

/** The facts block placed in the system prompt. */
export function buildPortfolioFacts(): string {
  const roleLine = ROLE_LINE[SITE_MODE];
  const claudeApps = getAppsBuiltWithClaude();
  return [
    `## How the site frames Adam's work`,
    FRAMING[SITE_MODE],
    roleLine ? `What Adam is looking for: ${roleLine}` : "",
    ``,
    `## Featured case studies`,
    ...featuredSlugs.map(formatFeatured),
    ``,
    `## Earlier work`,
    ...(EARLIER_WORK as EarlierProject[]).map(formatEarlier),
    ``,
    `## This site`,
    `This portfolio is a macOS desktop simulator in the browser, forked from an open-source project and reworked by Adam.`,
    claudeApps.length
      ? `Apps on this desktop that Adam built or rebuilt with Claude Code: ${claudeApps.join(", ")}.`
      : "",
    `Site pages that can be opened: ${OPENABLE_SITE_PAGES.map((p) => `${p.title} (id: ${p.id})`).join(", ")}.`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}
