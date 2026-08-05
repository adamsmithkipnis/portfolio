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
