import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { CASE_STUDIES } from "../config/case-studies.mjs";

/**
 * Every case study opens the same way — one title, a one-line dek, then the
 * generated numbers and at-a-glance answers — and its sections run in a fixed
 * order, so a reader can scan the three the same way and a page cannot drift
 * back to bold paragraphs standing in for headings.
 *
 * Two arcs for now. Invoca follows its slide deck section for section; the
 * other two keep a lighter spine until they are brought onto the same arc.
 */

const DIR = path.join(process.cwd(), "public/archive/smithkipnis/casestudies");

const DECK_ARC = [
  "Context",
  "Discovery",
  "Problem",
  "My role",
  "Interaction model",
  "The agent",
  "Context engineering",
  "Knowledge base",
  "What we built",
  "The vision I pitched",
  "Trust & buy-in",
  "Challenges",
  "Impact",
  "Learnings",
];
const LIGHT_SPINE = ["My thinking", "What I did", "Result", "Context"];

const EXPECTED_H2: Record<string, string[]> = {
  "invoca-workflow-agent": DECK_ARC,
  "grace-providence": LIGHT_SPINE,
  "wilson-x": LIGHT_SPINE,
};

interface Study {
  metrics: { value: string; label: string }[];
  glance: { problem: string; did: string; outcome: string };
  awards: { logo?: string }[];
}

const studies = CASE_STUDIES as unknown as Record<string, Study>;
// Gear IconX joined the featured set after this spine was written; it is
// pinned here once it is brought onto the light spine.
const pages = Object.keys(EXPECTED_H2).map((slug) => ({
  slug,
  study: studies[slug],
  html: readFileSync(path.join(DIR, slug, "index.html"), "utf8"),
}));

const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
const headings = (html: string) =>
  [...html.matchAll(/<h2 class="cs-h2">([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]));
const count = (html: string, needle: string) => html.split(needle).length - 1;

test("every pinned section order names a real case study", () => {
  for (const slug of Object.keys(EXPECTED_H2)) assert.ok(studies[slug], `${slug}: not in CASE_STUDIES`);
});

test("one title, and the dek directly under it", () => {
  for (const { slug, html } of pages) {
    assert.equal(count(html, '<h1 class="cs-h1">'), 1, `${slug}: expected exactly one h1`);
    assert.match(
      html,
      /<h1 class="cs-h1">[\s\S]*?<\/h1>\s*<p class="cs-p cs-dek">/,
      `${slug}: the dek does not follow the title`
    );
    assert.equal(count(html, "<h2 class=\"cs-h2\">"), EXPECTED_H2[slug].length, `${slug}: h2 count`);
  }
});

test("the numbers and the at-a-glance answers are generated", () => {
  for (const { slug, html, study } of pages) {
    assert.ok(html.includes("<!-- generated:summary:start -->"), `${slug}: no summary fence`);
    assert.match(html, /class="cs-metrics\b/, `${slug}: no metrics strip`);
    assert.ok(html.includes('class="cs-glance"'), `${slug}: no at-a-glance block`);
    assert.ok(
      study.metrics.length >= 3 && study.metrics.length <= 4,
      `${slug}: ${study.metrics.length} metrics; the strip is built for three or four`
    );
    for (const key of ["problem", "did", "outcome"] as const) {
      assert.ok(study.glance[key].length > 0, `${slug}: glance.${key} is empty`);
    }
  }
});

test("sections run in the expected order", () => {
  for (const { slug, html } of pages) {
    assert.deepEqual(headings(html), EXPECTED_H2[slug], `${slug}: section order`);
  }
});

test("no bold paragraph stands in for a heading", () => {
  for (const { slug, html } of pages) {
    const fakes = html.match(/<p class="cs-p"><strong>[^<]*<\/strong><\/p>/g) ?? [];
    assert.deepEqual(fakes, [], `${slug}: use an h3 instead:\n${fakes.join("\n")}`);
    assert.doesNotMatch(html, /<h3 class="cs-h3">Actions and Outcomes/, `${slug}: old STAR heading`);
  }
});

test("each page separates my part from the team's, once", () => {
  for (const { slug, html } of pages) {
    assert.equal(count(html, 'class="cs-roles"'), 1, `${slug}: expected one roles block`);
  }
});

test("a quote with a cite carries a source link", () => {
  for (const { slug, html } of pages) {
    for (const quote of html.match(/<blockquote class="cs-quote">[\s\S]*?<\/blockquote>/g) ?? []) {
      if (quote.includes("<cite")) {
        assert.match(quote, /<cite[\s\S]*?href="https:\/\//, `${slug}: cite without a source`);
      }
    }
  }
});

test("awards render when configured, and only then", () => {
  for (const { slug, html, study } of pages) {
    const fenced = html.includes("<!-- generated:awards:start -->");
    if (study.awards.length === 0) {
      assert.equal(fenced, false, `${slug}: awards fence with nothing to fill it`);
      continue;
    }
    assert.ok(fenced, `${slug}: lists awards but has no fence for them`);
    assert.equal(count(html, 'class="cs-award"'), study.awards.length, `${slug}: award count`);
    for (const award of study.awards) {
      if (!award.logo) continue;
      assert.ok(existsSync(path.join(process.cwd(), "public", award.logo)), `${slug}: missing logo ${award.logo}`);
    }
  }
});

test("interview-only material stays out of the archive", () => {
  for (const { slug, html } of pages) {
    assert.doesNotMatch(html, /toast/i, `${slug}: the deck's Toast IQ lines are not for the site`);
  }
});
