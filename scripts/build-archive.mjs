/**
 * Regenerates the parts of the archived site that follow from
 * `config/case-studies.mjs`: the case study index, the previous/next links on
 * each case study, the description and link-preview tags in each page's head
 * (the scrape left one of those as a label glued to its value).
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
  EARLIER_WORK,
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
/** Absolute origin for link previews; mirrors `siteConfig.url` in config/site.ts. */
const SITE_URL = "https://smithkipnis.com";
const SITE_NAME = "Adam Smith-Kipnis";

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

/** "Wells Fargo · 2018–2021", from whichever of the two the page stated. */
function earlierMeta(project) {
  return [project.org, project.years].filter(Boolean).map(escapeHtml).join(" &middot; ");
}

function renderEarlierCard(project) {
  const meta = earlierMeta(project);
  return `      <a class="cs-mini" href="${BASE}/${project.slug}">
        <img src="${project.image}" alt="" loading="lazy" />
        <span class="cs-mini-title">${escapeHtml(project.title)}</span>${
          meta ? `\n        <span class="cs-mini-meta">${meta}</span>` : ""
        }
      </a>`;
}

/**
 * Earlier work sits below the featured three: a compact grid of thumbnails
 * and titles, so twenty older projects read as depth rather than competing
 * with the three the framing line introduces.
 */
export function renderEarlierWork() {
  return `
  <section class="cs-earlier" aria-labelledby="earlier-work">
    <h2 class="cs-earlier-h2" id="earlier-work">Earlier Work</h2>
    <div class="cs-mini-grid">
${EARLIER_WORK.map(renderEarlierCard).join("\n")}
    </div>
  </section>
`;
}

export function renderIndex() {
  const cards = orderedSlugs().map(renderCard).join("\n\n");
  return `
  <h1 class="cs-index-h1">Case Studies</h1>
  <p class="cs-index-framing">${escapeHtml(FRAMING[SITE_MODE])}</p>

  <div class="cs-cards">
${cards}
  </div>
${renderEarlierWork()}`;
}

/**
 * Description and Open Graph tags. The page's own <title> stays hand-authored;
 * this only adds what a search result or a pasted link needs to look right.
 */
function renderHeadTags({ title, description, image, url }) {
  // Two earlier-work pages are a single video with no text, so there is no
  // sentence of the author's to use. Better no description than an invented one.
  const describe = description
    ? `\n<meta name="description" content="${escapeHtml(description)}" />`
    : "";
  const ogDescribe = description
    ? `\n<meta property="og:description" content="${escapeHtml(description)}" />`
    : "";
  return `${describe}
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${escapeHtml(title)}" />${ogDescribe}
<meta property="og:image" content="${SITE_URL}${image}" />
<meta property="og:url" content="${SITE_URL}${url}" />
<meta name="twitter:card" content="summary_large_image" />
`;
}

export function renderIndexHead() {
  const [first] = orderedSlugs();
  return renderHeadTags({
    title: `Case Studies — ${SITE_NAME}`,
    description: FRAMING[SITE_MODE],
    image: CASE_STUDIES[first].image,
    url: BASE,
  });
}

export function renderCaseStudyHead(slug) {
  const study = CASE_STUDIES[slug];
  return renderHeadTags({
    title: `${study.title} — ${SITE_NAME}`,
    description: study.summary,
    image: study.image,
    url: `${BASE}/${slug}`,
  });
}

export function renderEarlierHead(project) {
  return renderHeadTags({
    title: `${project.title} — ${SITE_NAME}`,
    description: project.summary,
    image: project.image,
    url: `${BASE}/${project.slug}`,
  });
}

/**
 * Previous/next within one running order. The featured three page among
 * themselves, and so do the earlier projects, so a reader moving through
 * either set stays in it.
 */
function renderPagerIn(slugs, titleOf, slug) {
  const at = slugs.indexOf(slug);
  const links = [];

  if (at > 0) {
    const previous = slugs[at - 1];
    links.push(
      `    <a class="cs-prev-link" href="${BASE}/${previous}"><span>Previous</span>${escapeHtml(titleOf(previous))}</a>`
    );
  }
  if (at !== -1 && at < slugs.length - 1) {
    const next = slugs[at + 1];
    links.push(
      `    <a class="cs-next-link" href="${BASE}/${next}"><span>Next</span>${escapeHtml(titleOf(next))}</a>`
    );
  }

  return `\n${links.join("\n")}\n  `;
}

export function renderPager(slug) {
  return renderPagerIn(orderedSlugs(), (s) => CASE_STUDIES[s].title, slug);
}

export function renderEarlierPager(slug) {
  const titles = new Map(EARLIER_WORK.map((project) => [project.slug, project.title]));
  return renderPagerIn([...titles.keys()], (s) => titles.get(s), slug);
}

/** The files this script owns, as { file, contents } after regeneration. */
export async function buildArchive() {
  const results = [];

  const indexPath = path.join(CASE_STUDY_DIR, "index.html");
  let indexHtml = await readFile(indexPath, "utf8");
  indexHtml = replaceRegion(indexHtml, "generated:head", renderIndexHead(), indexPath);
  indexHtml = replaceRegion(indexHtml, "generated:index", renderIndex(), indexPath);
  results.push({ file: indexPath, contents: indexHtml });

  for (const slug of Object.keys(CASE_STUDIES)) {
    const pagePath = path.join(CASE_STUDY_DIR, slug, "index.html");
    let html = await readFile(pagePath, "utf8");
    html = replaceRegion(html, "generated:head", renderCaseStudyHead(slug), pagePath);
    html = replaceRegion(html, "generated:pager", renderPager(slug), pagePath);
    results.push({ file: pagePath, contents: html });
  }

  for (const project of EARLIER_WORK) {
    const pagePath = path.join(CASE_STUDY_DIR, project.slug, "index.html");
    let html = await readFile(pagePath, "utf8");
    html = replaceRegion(html, "generated:head", renderEarlierHead(project), pagePath);
    html = replaceRegion(html, "generated:pager", renderEarlierPager(project.slug), pagePath);
    results.push({ file: pagePath, contents: html });
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
