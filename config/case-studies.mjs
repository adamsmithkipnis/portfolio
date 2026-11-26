/**
 * The case studies, and how the site frames them.
 *
 * The same projects read differently depending on the role being
 * applied for, so the framing sentence and the running order are switched
 * from one value here rather than by rewriting pages. `scripts/build-archive.mjs`
 * regenerates the index and the previous/next links from this file, and
 * `tests/archive-generated.test.ts` fails if what is on disk has drifted.
 *
 * Each study also carries the structured top of its page — the numbers, the
 * at-a-glance answers, and any awards — so the index cards and the page can
 * never disagree about them. The narrative below that block is hand-authored
 * in the page itself.
 *
 * Card copy is the author's, quoted exactly. Do not paraphrase it here.
 */

/** Which framing the built site ships with. One of the keys in FRAMING. */
export const SITE_MODE = "management";

export const FRAMING = {
  management:
    "Four projects across design leadership, production leadership, hardware interaction design, and self-initiated AI product strategy.",
  ic:
    "Products where the technology is genuinely hard: conversational AI, agentic systems, connected hardware. Four projects, hands on the work in all four.",
};

/**
 * Running order per mode. Management leads with the team, IC leads with the
 * most recent hands-on work. Drives the index and the pager both, so a case
 * study's neighbours always match the order a visitor was just reading in.
 */
export const ORDER = {
  management: ["grace-providence", "wilson-x", "gear-iconx", "invoca-workflow-agent"],
  ic: ["invoca-workflow-agent", "gear-iconx", "wilson-x", "grace-providence"],
};

/**
 * The one line under the home page's headline saying what role this site is
 * making the case for. One per mode, never a blend: a reader hiring a manager
 * and a reader hiring a designer are looking for different things. The words
 * are the author's; an empty string leaves the line off the page.
 */
export const ROLE_LINE = {
  management:
    "I’m looking to manage a team again: hiring and growing talent, setting the bar for craft, and shipping great products.",
  ic: "",
};

export const CASE_STUDIES = {
  "invoca-workflow-agent": {
    title: "Invoca Workflow Agent",
    role: "Senior UX Designer",
    years: "2026",
    client: "Invoca",
    image: "/archive/smithkipnis/img/workflowagent.webp",
    alt: "The Invoca campaign management table with the assistant docked beside it, answering a question about what the Payout column means.",
    summary:
      "Users were pasting call transcripts into ChatGPT because Invoca couldn't answer questions about itself. I built an in-platform agent that knows who you are, where you are, and what's on your screen; it outperformed shipped products on internal QA and shaped the company's in-platform AI direction.",
    tags: ["Agentic AI", "RAG", "Enterprise SaaS", "Self-initiated"],
    metrics: [
      { value: "100+", label: "unique sessions a day on the internal QA platform" },
      { value: "3 days", label: "core build, with one engineer" },
      { value: "1 of 3", label: "passion projects selected for the all-hands" },
      { value: "Impact Award", label: "peer-nominated" },
    ],
    glance: {
      problem:
        "Users were pasting call transcripts into ChatGPT and Gemini because Invoca couldn't answer questions about itself. For healthcare customers that meant PHI and PII exposure, and for Invoca it meant zero telemetry on what users were trying to do.",
      did:
        "Researched it through lunch interviews and two years of mined customer calls, framed the problem and pitched the roadmap, designed the interaction model and context architecture, and built the knowledge base and the agent with one engineer.",
      outcome:
        "Over 100 unique sessions a day on the internal QA platform, more than the shipped SMS and Voice Agents. Deployed to QA behind a feature flag, selected for an all-hands presentation, and the concept shaped how Invoca approached AI agents afterward, including Nico, launched in June 2026.",
    },
    awards: [],
  },
  "grace-providence": {
    title: "Grace & Providence Apps",
    role: "Head of Design / Product Design Manager",
    years: "2021–2023",
    client: "Providence Digital Innovation Group",
    image: "/archive/smithkipnis/img/gracesplashimage.webp",
    alt: "A hand holding a phone showing the Grace assistant returning a nearby urgent care clinic with its address and wait time.",
    summary:
      "Transformed a simple clickbot into a conversational agent serving 2.6 million patients, in an industry with almost no appetite for AI risk. I got clinical sign-off on every flow and managed a five-person team responsible for multiple mobile apps, a core design system, and an SSO product.",
    tags: ["Conversational AI", "Healthcare", "Design Systems", "Product Design Management", "Team leadership"],
    metrics: [
      { value: "2.6M", label: "patients served across MyChart in seven states" },
      { value: "1% → 8%", label: "open rate" },
      { value: "13% → 30%", label: "return rate" },
      { value: "800 → 150K", label: "monthly active users" },
    ],
    glance: {
      problem:
        "Grace was a decision-tree click-bot with a 1% open rate, serving only 800 monthly active users, in a health system with almost no appetite for AI risk.",
      did:
        "Rebuilt it as a conversational assistant, authored the voice, escalation and design systems behind it, got clinical sign-off on every flow, and managed a five-person team across multiple mobile apps, a core design system, and an SSO product.",
      outcome:
        "Open rate 1% to 8%, return rate 13% to 30%, and monthly active users 800 to 150,000, serving 2.6 million patients across MyChart in seven states. Inconsistencies between iOS and Android down by roughly 95%, and a patent application for contextual shortcuts. Grace and the partner cards are still live in 2026.",
    },
    awards: [],
  },
  "gear-iconx": {
    title: "Samsung Gear IconX",
    role: "Senior Interaction Designer",
    years: "2014–2016",
    client: "Samsung",
    image: "/archive/smithkipnis/img/gear-iconx/cover.webp",
    alt: "A Samsung Gear IconX earbud in a listener's ear, a fingertip tapping its touch surface.",
    summary:
      "As a Senior Interaction Designer working on Samsung's Gear Icon X earbud headphones, I created prototypes, defined touch based interactions, developed the audio UI, and created specifications for lighting feedback.",
    tags: ["Connected hardware", "Audio UI", "Interaction prototyping", "Human factors"],
    metrics: [
      { value: "16", label: "functional prototypes in one hackathon week" },
      { value: "<$500", label: "total hackathon budget" },
      { value: "Aug 2016", label: "shipped, a new product category for hearables" },
      { value: "Galaxy Buds", label: "the line IconX paved the way for" },
    ],
    glance: {
      problem:
        "People working out mostly listen to music and track progress, but Samsung's headphones still needed a phone or laptop to play anything.",
      did:
        "Prototyped the touch and audio interactions, developed the audio UI, specified the lighting feedback, and ran the ear-fit studies behind the industrial design.",
      outcome:
        "Samsung shipped the Gear IconX in August 2016, creating a new product category for hearables and paving the way for Galaxy Buds.",
    },
    awards: [],
  },
  "wilson-x": {
    title: "Wilson X Connected Basketball",
    role: "UX Lead & Production Lead",
    years: "2014–2015",
    client: "Wilson Sporting Goods, via Phenomenon",
    image: "/archive/smithkipnis/img/wilsonx-sketch-360x360.webp",
    alt: "The Wilson X Connected Basketball, a leather ball printed with the Wilson X mark.",
    summary:
      "The first shot-detecting basketball, and an app you have to operate while holding a ball. I designed an audio-first gesture interface, then built the development process the agency didn't have.",
    tags: ["Connected hardware", "Audio-first UX", "Games", "Cannes Lion"],
    metrics: [
      { value: "6", label: "awards, including a Cannes Lion" },
      { value: "2", label: "platforms shipped, iOS and Android" },
      { value: "~7 months", label: "on site in Los Angeles" },
      { value: "Engadget", label: "exclusive at launch" },
    ],
    glance: {
      problem:
        "The first shot-detecting basketball needed an app you could operate with both hands on the ball, built by an agency with no software development process.",
      did:
        "Designed the audio-first Kinetic UI, directed the voice and sound design and tested it live with youth athletes, found and closed the project's COPPA exposure, and built the development process the engagement was missing.",
      outcome:
        "Shipped on iOS and Android, launched with an Engadget exclusive, and won a Cannes Lion, two One Show Gold Pencils, two Clios and a Webby. I was made Production Lead partway through.",
    },
    /** `logo` is optional: a path under /archive/smithkipnis/img/awards/ once the marks are in. */
    awards: [
      { year: "2016", org: "Cannes Lions", tier: "Silver", category: "Digital Craft: Innovative Use of Technology" },
      { year: "2016", org: "The One Show", tier: "Gold Pencil", category: "Use of Technology / Consumer Product and Mobile Integration" },
      { year: "2016", org: "The One Show", tier: "Gold Pencil", category: "Mobile UX/UI Innovation" },
      { year: "2016", org: "Clio Sports", tier: "Silver", category: "Innovation" },
      { year: "2016", org: "Clio Sports", tier: "Bronze", category: "Packaging Design" },
      { year: "2016", org: "The Webby Awards", tier: "People's Voice", category: "Connected Product" },
    ],
  },
};

/**
 * Earlier work: nineteen older projects recovered from the original Semplice
 * (WordPress) portfolio. They sit below the featured case studies on the
 * index as a compact grid, and in Finder under Work › Earlier Work.
 *
 * Order is the Semplice site's running order. Grace, Wilson X and Gear IconX
 * were on that site too and appear above as featured case studies instead.
 *
 * Only what each original page stated is recorded: `org`, `role` and `years`
 * are left out where the page didn't say. `summary` is the page's own first
 * sentence, quoted exactly, and is used for link previews and Finder's card.
 * `image` is the project's thumbnail from the Semplice site, imported by
 * `npm run import:earlier-work-images`. Page bodies are hand-maintained HTML in
 * public/archive/smithkipnis/casestudies/<slug>/; `scripts/build-archive.mjs`
 * regenerates their head tags and previous/next links from this list.
 */
export const EARLIER_WORK = [
  {
    slug: "wells-fargo-conversational-ai",
    title: "Wells Fargo Conversational AI",
    org: "Wells Fargo",
    years: "2018–2021",
    summary:
      "From 2018 to 2021, I worked at Wells Fargo, designing product concepts for conversational AI, internal tools for conversation designers, conversation analytics and machine learning.",
  },
  {
    slug: "hololens",
    title: "Hololens",
    role: "Audio Lead, LXP Studio",
    org: "Microsoft",
    summary:
      "As the Audio Lead for LXP Studio at Microsoft, I was part of the team that created the very first experiences for Hololens, Microsoft's mixed-reality headset.",
  },
  {
    slug: "gear-fit-2-pro",
    title: "Gear Fit 2 Pro",
    org: "Samsung",
    summary:
      "Sometimes, the best way to improve a product isn't through prototyping or pixel-perfect screen design.",
  },
  {
    slug: "kinect-adventures",
    title: "Kinect Adventures",
    role: "Audio Lead",
    summary:
      "I was the first fully dedicated Audio Designer brought on to Project Natal, later known as Kinect.",
  },
  { slug: "samsung-home-hub", title: "Samsung Home Hub", org: "Samsung" },
  {
    slug: "hackcouture-cloud-hoodie",
    title: "HackCouture Cloud Hoodie",
    org: "HackCouture",
    summary:
      "I brought the HackCouture team to Las Vegas to compete in another AT&T Hackathon.",
  },
  {
    slug: "hackcouture-gauntlet",
    title: "HackCouture Gauntlet",
    org: "HackCouture",
    summary:
      "I formed and led the team that took first place in the Seattle Interactive Conference AT&T wearable computing hackathon with the creation of our gesture detecting fabric glove and air guitar app.",
  },
  { slug: "family-hub-refrigerator", title: "Family Hub Refrigerator" },
  {
    slug: "kinect-fun-labs",
    title: "Kinect Fun Labs",
    years: "3 months",
    summary:
      "Kinect Fun Labs was a 3 month effort to create a new set of lightweight experiences to showcase Kinect's capabilities.",
  },
  {
    slug: "kinect-star-wars",
    title: "Kinect Star Wars",
    summary: "Kinect Star wars was one of the most complex projects I've ever worked on.",
  },
  {
    slug: "grooviks-cube",
    title: "Grooviks Cube",
    summary:
      "I designed the sounds and behavior of sounds for the \"Groovik's Cube\", a giant (15 feet x 15 feet), interactive, light-based, Rubik's Cube for the Burning Man art festival.",
  },
  {
    slug: "m-a-g",
    title: "M.A.G.",
    role: "Audio Lead",
    org: "Zipper Interactive",
    summary: "While at Zipper interactive, I was the Audio Lead for MAG Massive Action Game.",
  },
  {
    slug: "transformers-re-edit",
    title: "Transformers Re-Edit",
    summary:
      "I re-edited this video to showcase some of my recording, editing and sound design abilities.",
  },
  {
    slug: "hackcouture-rfid-rings",
    title: "HackCouture RFID Rings",
    org: "HackCouture",
    summary:
      "I remixed these rings from Maxsu on Thingiverse, 3D printed them and used them to explore associating identity with wearable technology.",
  },
  {
    slug: "guild-wars-2",
    title: "Guild Wars 2",
    org: "ArenaNet",
    years: "Summer 2009",
    summary:
      "In the summer of 2009, I worked with ArenaNet's Audio department to build out their Sound Library.",
  },
  {
    slug: "100-clickthrough-campaign",
    title: "100% Clickthrough Campaign",
    years: "August 2013",
    summary:
      "In August of 2013, I did a privacy research project where I successfully targeted a Facebook ad at only one user.",
  },
  {
    slug: "hackcouture-qr-code-watchface",
    title: "HackCouture QR Code Watchface",
    org: "HackCouture",
    summary:
      "As an exploration into how we might create some unique branding for Hackcouture and share links from wearable technology, I created a scannable QR code watchface for a pebble watch.",
  },
  {
    slug: "destroy-all-humans-path-of-the-furon",
    title: "Destroy All Humans Path Of The Furon",
    org: "CrankyPants Games",
    summary:
      "I spent a year and a half working on Path Of The Furon with a fantastic team from CrankyPants Games, later known as Sandblast Games.",
  },
  {
    slug: "evil-dead-regeneration",
    title: "Evil Dead: Regeneration",
    summary:
      "In addition to being accountable for the audio of the XBox version of ED:R, and doing lots of content creation and implementation, I also did the Cinematic Audio Post-production for a number of Evil Dead Regeneration videos.",
  },
].map((project) => ({
  ...project,
  image: `/archive/smithkipnis/img/earlier-work/covers/${project.slug}.webp`,
  alt: project.title,
}));
