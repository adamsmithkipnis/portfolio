# Content Model

How portfolio content is authored, stored, and surfaced through Finder.

**Design goal:** adding case study #7 two years from now should be *drop in a
folder*. No component edits, no registry updates, no schema migration.

---

## Storage split

| Content | Where | Why |
|---|---|---|
| Case studies | MDX in repo (`content/`) | Change rarely; version control is a feature; directory tree maps to Finder tree |
| Essays / notes | Supabase | Written casually and often; already built in the fork |
| Assets | `public/content/` | Served statically, referenced by path |

---

## Directory structure

The filesystem **is** the information architecture. What's on disk is what
Finder renders — no separate manifest to keep in sync.

```
content/
├── work/
│   ├── design-system-foundation/
│   │   ├── index.mdx              ← frontmatter = project metadata
│   │   ├── 01-problem.mdx
│   │   ├── 02-approach.mdx
│   │   ├── 03-outcome.mdx
│   │   └── artifacts/
│   │       ├── system-overview.png
│   │       └── component-audit.pdf
│   │
│   └── onboarding-redesign/
│       ├── index.mdx
│       ├── 01-research.mdx
│       ├── 02-concepts.mdx
│       └── artifacts/
│
├── writing/
│   └── on-hiring-designers.mdx
│
└── Resume.pdf
```

Two conventions do real work:

- **Numeric prefixes** (`01-`, `02-`) give narrative sequence for free. Finder
  sorts by name; you get a reading order without building a stepper.
- **`index.mdx`** holds project-level metadata in frontmatter and renders as the
  folder's overview. Its frontmatter is what Get Info displays.

Display names strip the prefix and slug: `01-problem.mdx` → **"Problem"**.

---

## Frontmatter schema

### Project (`index.mdx`)

```yaml
---
title: Design System Foundation
role: Lead Product Designer
org: Acme Corp
year: 2024
duration: 8 months
team: 6 designers, 12 engineers
tags: [Design Systems, Figma, React]
summary: A multi-brand system serving 8 product teams.
outcomes:
  - label: Design-to-dev handoff time
    value: "−40%"
  - label: Components shipped
    value: "200+"
featured: true
confidential: false
---
```

### Section (`01-problem.mdx`)

```yaml
---
title: Problem
---
```

Sections stay deliberately thin — sequence comes from the filename, everything
else is inherited from the parent project.

---

## Types

```ts
// system/content/types.ts

export interface Outcome {
  label: string;
  value: string;
}

export interface ProjectMeta {
  title: string;
  role: string;
  org: string;
  year: number;
  duration?: string;
  team?: string;
  tags: string[];
  summary: string;
  outcomes?: Outcome[];
  featured?: boolean;
  /** Redacts org name and artifacts in the UI. */
  confidential?: boolean;
}

export type NodeKind = 'folder' | 'document' | 'image' | 'pdf';

export interface ContentNode {
  /** Path segment, e.g. "01-problem" */
  slug: string;
  /** Display name with prefix stripped, e.g. "Problem" */
  name: string;
  /** Route path, e.g. "/finder/work/design-system-foundation" */
  path: string;
  kind: NodeKind;
  /** Present on project folders only — drives Get Info. */
  meta?: ProjectMeta;
  children?: ContentNode[];
  /** Bytes; real for assets, derived from word count for MDX. */
  size: number;
  modified: string;
}
```

---

## Loader

One filesystem walk at build time produces the tree Finder renders.

```ts
// system/content/loader.ts
export function buildContentTree(root = 'content'): ContentNode { … }
```

Rules:

- Directories become `folder` nodes; a directory containing `index.mdx` is a
  **project** and carries `meta`
- `index.mdx` is consumed as metadata, not listed as a child
- Files sort by filename (so numeric prefixes order correctly)
- `modified` comes from frontmatter `year` where present, else file mtime

Because it's a walk, **adding a project is creating a folder.** Nothing else
changes.

---

## Finder surface mapping

| Finder affordance | Backed by | Why it earns its place |
|---|---|---|
| **Column view** | Tree depth | Scan the whole body of work and read one thing without losing place |
| **Quick Look** (spacebar) | `ContentNode` preview | Browse fast, go deep on demand — the single best interaction here |
| **Get Info** (⌘I) | `ProjectMeta` | Role, duration, team, outcomes — what a hiring manager wants, without cluttering the case study |
| **Tags** | `meta.tags` | One project, multiple lenses, no duplicate pages |
| **Sort by date** | `meta.year` | Recency signal for free |

### Get Info panel

```
┌─ Design System Foundation ─────────┐
│ Kind      Case Study               │
│ Role      Lead Product Designer    │
│ Org       Acme Corp                │
│ Year      2024                     │
│ Duration  8 months                 │
│ Team      6 designers, 12 eng      │
│                                    │
│ Outcomes                           │
│   Handoff time          −40%       │
│   Components shipped    200+       │
│                                    │
│ Tags  Design Systems · Figma       │
└────────────────────────────────────┘
```

A familiar gesture, repurposed to surface exactly the metadata that belongs
*near* the work rather than *inside* it.

---

## Routing

Content paths map directly to URLs:

```
/finder                                          root
/finder/work                                     folder
/finder/work/design-system-foundation            project (Get Info state)
/finder/work/design-system-foundation/01-problem section
```

Every case study is deep-linkable — put a specific URL in a job application and
the visitor lands on the work, skipping the desktop entirely. **This is the
escape hatch that makes the whole metaphor safe.**

---

## Confidential work

`confidential: true` redacts the org name (→ "Fortune 500 retailer") and hides
`artifacts/`. Lets you show process and outcomes for work under NDA without
hand-maintaining a separate sanitized copy.

---

## Implementation notes

Shipped August 2026. Where the build differs from the design above, this section wins.

### Markdown, not full MDX

Sections are `.mdx` files but the body is parsed as **Markdown**, not compiled MDX
— rendered by `react-markdown` + `remark-gfm` + `rehype-raw`, all already in the
tree for Notes. No MDX toolchain was added.

The one thing MDX was wanted for — embedding video — is served by a single custom
tag that `rehype-raw` turns into a real element node and `case-study-body.tsx`
maps to a component:

```html
<video-embed platform="youtube" id="aqz-KE-bpKQ" title="Prototype walkthrough"></video-embed>
<video-embed platform="vimeo" id="76979871" title="Concept reel"></video-embed>
```

Embeds are **click-to-load**: nothing is requested from YouTube or Vimeo until the
viewer presses play, so a case study with four videos does not pull four players.
YouTube uses `youtube-nocookie.com`. If a section ever needs arbitrary JSX, that's
the point to revisit real MDX.

### Frontmatter is a small YAML subset

`scripts/build-content.mjs` parses frontmatter itself rather than pulling in a YAML
dependency. Supported: scalars, inline arrays (`tags: [a, b]`), and lists of flat
objects (`outcomes:` → `- label:` / `value:`). That covers `ProjectMeta` exactly.
Anything richer belongs in the body.

### Build-time walk, bundled tree

Finder is a client component and cannot touch the filesystem, so the walk runs at
build time and its result is bundled:

```bash
npm run content   # also runs automatically via predev and prebuild
```

| File | Role |
|---|---|
| `scripts/build-content.mjs` | walks `content/`, emits the tree |
| `system/content/generated.ts` | **generated — do not edit** |
| `system/content/types.ts` | `ContentNode`, `ProjectMeta` |
| `lib/content-files.ts` | mounts the tree into Finder's paths |

### Mounted at ~/Work

`content/work/` is what Finder shows under **Work** in the sidebar; the folder
appears only when there is at least one project. Reading order comes from numeric
filename prefixes, so content children are *not* re-sorted alphabetically the way
the rest of the virtual filesystem is.

Other top-level content folders (`writing/`, loose assets) get their own mounts
when they're needed.

### Sections open in Preview windows

Double-clicking a section opens it in its own **Preview window**, the same way a
PDF does — `PreviewFileType` gained a `case-study` member alongside `image` and
`pdf`, and `PreviewWindow` renders `ContentDetail` for it. Windows cascade, so
several sections can sit open side by side, and each is titled with the section's
display name ("Approach"), not its slug.

Selecting (single click) a project or section in **column view** still previews it
in the detail pane: Get Info metadata for a project — role, org, year, duration,
team, outcomes, tags — and the rendered body for a section. Browse in the column,
open a window when you want to keep something around.

Where no window manager exists (mobile, standalone Finder), opening a section
falls back to rendering it in place inside Finder, since there is nowhere to put
a window.

Two gotchas worth remembering, both fixed:

- `<video-embed>` alone on a line gets wrapped in a `<p>`, so the embed root must
  be a block-displayed `<span>`. A `<div>` there is invalid HTML and React throws
  a hydration error.
- Finder clears its selection on background click, so the detail pane must stop
  click propagation or interacting with a video or link closes what you're reading.

### Not yet built

Quick Look (spacebar), tag filtering, sort-by-date, and the `confidential: true`
redaction are specified above but unimplemented. `artifacts/` folders render as
ordinary files. Deep-link routes (`/finder/work/<project>/<section>`) resolve to
the Finder shell but do not yet restore the selected path.
