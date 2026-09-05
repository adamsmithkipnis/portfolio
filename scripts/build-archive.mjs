/**
 * Regenerates the parts of the archived site that follow from
 * `config/case-studies.mjs`: the case study index, and the previous/next
 * links on each case study.
 *
 * Everything else in those pages is hand-authored and left alone. The
 * generated regions are fenced by comment markers, and only what sits between
 * a matching pair is replaced, so editing around them is safe.
 *
 * Run by `npm run archive`, which predev and prebuild both call.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CASE_STUDIES,
  FRAMING,
  ORDER,
  SITE_MODE,
} from "../config/case-studies.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASE_STUDY_DIR = path.join(
  ROOT,
  "public/archive/smithkipnis/casestudies"
);
const BASE = "/website/casestudies";

/** Text into HTML. Card copy carries ampersands and quotes. */
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Replaces the text between `<!-- name:start -->` and `<!-- name:end -->`.
 * Throws when the markers are missing or out of order, so a page that has
 * lost its fence fails the build instead of silently going stale.
 */
function replaceRegion(html, name, body, file) {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);

  if (from === -1 || to === -1) {
    throw new Error(`${file}: missing ${start} / ${end}`);
  }
  if (to < from) {
    throw new Error(`${file}: ${end} appears before ${start}`);
  }

  return html.slice(0, from + start.length) + body + html.slice(to);
}

function orderedSlugs() {
  const slugs = ORDER[SITE_MODE];
  if (!slugs) {
    throw new Error(
      `SITE_MODE "${SITE_MODE}" has no order; expected one of ${Object.keys(ORDER).join(", ")}`
    );
  }
  const known = Object.keys(CASE_STUDIES);
  const missing = known.filter((slug) => !slugs.includes(slug));
  if (missing.length) {
    throw new Error(`case studies missing from the ${SITE_MODE} order: ${missing.join(", ")}`);
  }
  return slugs;
}

function renderCard(slug) {
  const study = CASE_STUDIES[slug];
  const tags = study.tags
    .map((tag) => `        <li>${escapeHtml(tag)}</li>`)
    .join("\n");

  return `    <a class="cs-card" href="${BASE}/${slug}">
      <img src="${study.image}" alt="${escapeHtml(study.alt)}" loading="lazy" />
      <h2 class="cs-card-title">${escapeHtml(study.title)}</h2>
      <p class="cs-card-meta">${escapeHtml(study.role)} &middot; ${escapeHtml(study.years)}</p>
      <p class="cs-card-summary">${escapeHtml(study.summary)}</p>
      <ul class="cs-tags">
${tags}
      </ul>
    </a>`;
}

export function renderIndex() {
  const cards = orderedSlugs().map(renderCard).join("\n\n");
  return `
  <h1 class="cs-index-h1">Case Studies</h1>
  <p class="cs-index-framing">${escapeHtml(FRAMING[SITE_MODE])}</p>

  <div class="cs-cards">
${cards}
  </div>
`;
}

export function renderPager(slug) {
  const slugs = orderedSlugs();
  const at = slugs.indexOf(slug);
  const links = [];

  if (at > 0) {
    const previous = slugs[at - 1];
    links.push(
      `    <a class="cs-prev-link" href="${BASE}/${previous}"><span>Previous</span>${escapeHtml(CASE_STUDIES[previous].title)}</a>`
    );
  }
  if (at !== -1 && at < slugs.length - 1) {
    const next = slugs[at + 1];
    links.push(
      `    <a class="cs-next-link" href="${BASE}/${next}"><span>Next</span>${escapeHtml(CASE_STUDIES[next].title)}</a>`
    );
  }

  return `\n${links.join("\n")}\n  `;
}

/** The files this script owns, as { file, contents } after regeneration. */
export async function buildArchive() {
  const results = [];

  const indexPath = path.join(CASE_STUDY_DIR, "index.html");
  const indexHtml = await readFile(indexPath, "utf8");
  results.push({
    file: indexPath,
    contents: replaceRegion(indexHtml, "generated:index", renderIndex(), indexPath),
  });

  for (const slug of Object.keys(CASE_STUDIES)) {
    const pagePath = path.join(CASE_STUDY_DIR, slug, "index.html");
    const html = await readFile(pagePath, "utf8");
    results.push({
      file: pagePath,
      contents: replaceRegion(html, "generated:pager", renderPager(slug), pagePath),
    });
  }

  return results;
}

/**
 * Writes the regenerated files, reporting how many actually changed.
 *
 * Kept out of the module body: the tests import this file, and a top-level
 * await here fails to transpile under the test runner's loader.
 */
async function main() {
  const results = await buildArchive();
  let changed = 0;
  for (const { file, contents } of results) {
    const before = await readFile(file, "utf8");
    if (before !== contents) {
      await writeFile(file, contents);
      changed += 1;
    }
  }
  console.log(
    `archive: ${SITE_MODE} mode, ${results.length} files checked, ${changed} rewritten`
  );
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
