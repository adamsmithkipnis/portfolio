/**
 * The case studies, and how the site frames them.
 *
 * The same three projects read differently depending on the role being
 * applied for, so the framing sentence and the running order are switched
 * from one value here rather than by rewriting pages. `scripts/build-archive.mjs`
 * regenerates the index and the previous/next links from this file, and
 * `tests/archive-generated.test.ts` fails if what is on disk has drifted.
 *
 * Card copy is the author's, quoted exactly. Do not paraphrase it here.
 */

/** Which framing the built site ships with. One of the keys in FRAMING. */
export const SITE_MODE = "management";

export const FRAMING = {
  management:
    "Three projects: one I managed, one I led, one I started myself, the most recent as an IC by circumstance rather than choice.",
  ic:
    "Fifteen years designing products where the technology is genuinely hard: conversational AI, agentic systems, connected hardware. Three projects, hands on the work in all three.",
};

/**
 * Running order per mode. Management leads with the team, IC leads with the
 * most recent hands-on work. Drives the index and the pager both, so a case
 * study's neighbours always match the order a visitor was just reading in.
 */
export const ORDER = {
  management: ["grace-providence", "wilson-x", "invoca-workflow-agent"],
  ic: ["invoca-workflow-agent", "wilson-x", "grace-providence"],
};

export const CASE_STUDIES = {
  "invoca-workflow-agent": {
    title: "Invoca Workflow Agent",
    role: "Senior UX Designer",
    years: "2026",
    image: "/archive/smithkipnis/img/workflowagent.webp",
    alt: "The Invoca campaign management table with the assistant docked beside it, answering a question about what the Payout column means.",
    summary:
      "Users struggled to understand how to use Invoca and were pasting call transcripts into ChatGPT because our platform couldn't answer questions about itself. I designed and built an in-platform agent that knows who you are, where you are, and what's on your screen, then convinced the company to care.",
    tags: ["Agentic AI", "RAG", "Enterprise SaaS", "Self-initiated"],
  },
  "grace-providence": {
    title: "Grace & Providence Apps",
    role: "Head of Design / Product Design Manager",
    years: "2021–2023",
    image: "/archive/smithkipnis/img/gracesplashimage.webp",
    alt: "A hand holding a phone showing the Grace assistant returning a nearby urgent care clinic with its address and wait time.",
    summary:
      "A 1% open-rate click-bot serving 2.6 million patients, in an industry with almost no appetite for AI risk. I rebuilt it as a real conversational assistant, got clinical sign-off on every flow, and managed a five-person team responsible for multiple mobile apps and an SSO product.",
    tags: ["Conversational AI", "Healthcare", "Design Systems", "Team leadership"],
  },
  "wilson-x": {
    title: "Wilson X Connected Basketball",
    role: "UX Lead & Production Lead",
    years: "2014–2015",
    image: "/archive/smithkipnis/img/wilsonx-sketch-360x360.webp",
    alt: "The Wilson X Connected Basketball, a leather ball printed with the Wilson X mark.",
    summary:
      "The first shot-detecting basketball, and an app you have to operate while holding a ball. I designed an audio-first gesture interface, then built the development process the agency didn't have.",
    tags: ["Connected hardware", "Audio-first UX", "Games", "Cannes Lion"],
  },
};
