/**
 * Tools the Claude app's model may call, and the server-side checks that turn
 * a tool call into an action the desktop can safely perform.
 *
 * Every argument is matched against known content: a slug must name a real
 * case study, a page id must name a real site page. Anything else is dropped,
 * so the model can never steer Safari to an arbitrary address.
 */

import { getOpenableSitePage, getPortfolioProject, OPENABLE_SITE_PAGES, PORTFOLIO_PROJECTS } from "./portfolio-facts";
import type { ClaudeAction } from "./types";

export const ARTIFACT_MAX_TITLE_CHARS = 120;
export const ARTIFACT_MAX_MARKDOWN_CHARS = 6000;

export function buildClaudeTools() {
  return [
    {
      type: "function" as const,
      function: {
        name: "open_case_study",
        description: "Open one of Adam's case studies in Safari on the visitor's desktop.",
        parameters: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              enum: PORTFOLIO_PROJECTS.map((p) => p.slug),
              description: "The case study slug from the facts.",
            },
          },
          required: ["slug"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "open_site_page",
        description: "Open a page of Adam's site, such as the case study index, in Safari.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", enum: OPENABLE_SITE_PAGES.map((p) => p.id) },
          },
          required: ["id"],
          additionalProperties: false,
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "create_artifact",
        description:
          "Show a self-contained Markdown document in the artifact panel, for something the visitor asked to keep or share.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "A short title." },
            markdown: { type: "string", description: "The document, in Markdown." },
          },
          required: ["title", "markdown"],
          additionalProperties: false,
        },
      },
    },
  ];
}

function parseArgs(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Turn one tool call into a validated action, or null if it names anything
 * the site does not have. `makeId` is injected so tests are deterministic.
 */
export function toClaudeAction(
  name: string,
  rawArguments: string | undefined,
  makeId: () => string = () => crypto.randomUUID()
): ClaudeAction | null {
  const args = parseArgs(rawArguments);
  if (!args) return null;

  if (name === "open_case_study") {
    const project = typeof args.slug === "string" ? getPortfolioProject(args.slug) : null;
    if (!project) return null;
    return {
      type: "open_case_study",
      slug: project.slug,
      title: project.title,
      archivePath: project.archivePath,
    };
  }

  if (name === "open_site_page") {
    const page = typeof args.id === "string" ? getOpenableSitePage(args.id) : null;
    if (!page) return null;
    return { type: "open_site_page", title: page.title, path: page.path };
  }

  if (name === "create_artifact") {
    const title = typeof args.title === "string" ? args.title.trim() : "";
    const markdown = typeof args.markdown === "string" ? args.markdown.trim() : "";
    if (!title || !markdown) return null;
    return {
      type: "artifact",
      id: makeId(),
      title: title.slice(0, ARTIFACT_MAX_TITLE_CHARS),
      markdown: markdown.slice(0, ARTIFACT_MAX_MARKDOWN_CHARS),
    };
  }

  return null;
}
