# macOS Tahoe Portfolio — Plan

A professional portfolio site presented as a macOS Tahoe desktop environment.
Forked from [alanagoyal/alanagoyal](https://github.com/alanagoyal/alanagoyal) (MIT).

**Owner:** Adam Smith-Kipnis
**Status:** Steps 0–2 complete (pending a by-eye pass over every app)
**Last updated:** 2026-08-05

---

## Goals

1. **Visual fidelity to macOS Tahoe** — the differentiator, and the hardest part
2. **Sustainable content updates** — add a case study without touching component code
3. **Per-app URLs** — `/notes`, `/finder`, `/messages` are deep-linkable and shareable
4. **AI chat experience** — Messages app with Claude-backed personas

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| **Base** | Modify the fork, don't rebuild | 3 of 4 goals already shipped there; ~1,662 commits of polish |
| **Hosting** | Vercel | "Low-maintenance" rules out self-managed VPS. Preview deploys per branch are decisive for visual iteration |
| **Domain** | Stays at DreamHost | Point DNS at Vercel. DreamHost *shared* hosting can't run Node — VPS would be required, and that's the high-maintenance path |
| **Upstream** | Sync once, then hard-fork | Merging has a shelf life; restructuring + re-skin ends it. Cherry-pick security fixes only |
| **AI provider** | Braintrust proxy → Claude Haiku 4.5 | Already wired; observability is useful for tuning personas. ~$0.0017/message |
| **Model for dev** | Claude Opus 5 | Same 1M context as Fable at half the cost; strongest for agentic coding |
| **Component workbench** | `/dev/gallery` route, **not** Storybook | ~15–20 primitives, one consumer. Storybook's value scales with things we don't have. Revisit if we need a11y auditing or visual regression |
| **Design tokens** | Extracted from the OS via AppKit | See `design-tokens/README.md`. Screenshots lose semantic alpha and miss version drift |

---

## Architecture

Three layers. **Dependencies point downward only** — never up, never sideways.

```
┌──────────────────────────────────────────┐
│  shell/     desktop, dock, menubar,      │
│             window manager, routing      │
├──────────────────────────────────────────┤
│  apps/      notes, messages, finder,     │
│             terminal (self-contained)    │
├──────────────────────────────────────────┤
│  system/    tokens + primitives          │
│             (Tahoe design system)        │
└──────────────────────────────────────────┘
```

- **`system/`** knows about nothing else. Tokens, `Window`, `TrafficLights`,
  `Toolbar`, `Sidebar`, `ContextMenu`, `Button`.
- **`apps/`** consumes `system/`. Each app exports an `AppManifest`. No app
  imports another app.
- **`shell/`** consumes both. Reads the app registry; knows no app's internals.

Enforced with `eslint-plugin-boundaries`.

### App manifest

Adding an app = drop a folder + register it. Dock, router, and window manager
all read from the registry.

```ts
export const notesApp: AppManifest = {
  id: 'notes',
  name: 'Notes',
  icon: '/icons/notes.png',
  route: '/notes',
  defaultSize: { width: 900, height: 620 },
  minSize: { width: 480, height: 360 },
  component: lazy(() => import('./Notes')),
};
```

---

## Phases

### Step 0 — Prerequisites ✅
- [x] `brew install node` — Node 26.6.0 / npm 11.18.0 via Homebrew.
      Note this is the **current** channel, not LTS. If native modules ever
      fail to build, drop to `brew install node@22` or pin with `fnm`
- [x] Verify `node build-tokens.mjs` runs clean — first successful run:
      41 colors × 2 schemes · 14 materials · 11 type styles.
      Outputs are gitignored build artifacts, regenerate freely

### Step 1 — Repo setup ✅
- [x] Clone fork to `~/Documents/Claude/portfolio`
- [x] `git remote add upstream …` && merge **once** && `git tag baseline-upstream`
      (tag is on `origin`, pointing at `4409b6d`)
- [x] Move `design-tokens/` and `docs/` into the repo

### Step 2 — Baseline
- [x] Own Supabase project — **`portfolio`**, ref `wqnsmwgehthxoeqfgwyw`,
      us-west-1, free tier. Both migrations applied (`notes`, `photos`),
      RLS enabled on both. `.env.local` written and gitignored
- [x] `npm install` — clean on Node 26; `sharp` (libvips 8.17.3) loads, so
      Next's image pipeline is intact despite npm's `allow-scripts` warning
- [x] `npm run dev` starts clean — Next 16.1.1 / Turbopack, ready in 2.4s.
      `/`, `/notes`, `/finder`, `/messages` all 200; Supabase REST answers
      200 with the anon key
- [ ] **Confirm every app works by eye in a browser** — HTTP 200 only proves
      the route renders, not that the app behaves. Do this before Step 3

**Not yet configured** (deliberately, all blank in `.env.local`):
`SUPABASE_SERVICE_ROLE_KEY` and `PHOTOS_UPLOAD_API_KEY` (only used by
`app/api/photos/upload/route.ts`, which Step 3 deletes) and
`BRAINTRUST_API_KEY` (Messages AI won't reply until it's set — Step 4).

### Step 2b — Dependency audit ← only after the baseline is confirmed green
Inherited from the fork, not introduced here: **42 vulnerabilities
(11 low, 14 moderate, 16 high, 1 critical)**. Mostly transitive; the two
direct ones are `lodash` and **`next` itself** — the latter is what matters,
since it serves every request on a public site.

- [ ] `npm audit fix` (plain) first, then re-run the baseline
- [ ] Review what's left individually. **Do not run `npm audit fix --force`
      casually** — it will bump `next` across a major version and break the app
- [ ] Re-confirm every app still works before moving on

Sequenced *after* the baseline deliberately: fixing it earlier means debugging
dependency churn and an unverified fork at the same time, with no known-good
state to diff against.

### Step 3 — Prune & rebrand
- [ ] Cut Photos (removes the OpenAI dependency entirely), Weather, Music, Preview
- [ ] Rebrand iTerm → native macOS Terminal (icon, chrome, prompt, route)
- [ ] Keep: Notes, Messages, Finder, Terminal

### Step 4 — Guardrails on `/api/chat` ⛔ before any public deploy
- [ ] Rate limit per IP (Upstash)
- [ ] Cap conversation history (~10 turns)
- [ ] Cap `max_tokens` (~300)
- [ ] Hard spend cap in the Anthropic console
- [ ] Point Braintrust at Haiku 4.5

### Step 5 — Layer restructure
- [ ] Reorganize into `system/` `apps/` `shell/`
- [ ] App manifest + registry
- [ ] `eslint-plugin-boundaries` rules
- [ ] `/dev/gallery` with variant-driven auto-enumeration

### Step 6 — Tahoe design system ← the long one
- [ ] Wire `tokens.css` + `tailwind.tokens.js`
- [ ] Calibrate blur against real window screenshots (see `design-tokens/README.md`)
- [ ] MenuBar → Dock → Window chrome → app interiors

### Step 7 — Content
- [ ] Case studies into Finder
- [ ] Essays into Notes
- [ ] Messages personas
- [ ] Front door + resume escape hatch

---

## Open Questions

- **Mobile strategy.** A macOS simulator on a phone is awkward, and hiring
  managers *will* open it on a phone. Responsive linear fallback, or
  desktop-only with content still reachable? **Biggest practical risk to the
  project.**
- **Which fifth app**, if any, beyond Notes/Messages/Finder/Terminal
- **Case study content model** — MDX in repo vs. Supabase (leaning MDX; they
  change rarely and version control is a feature)

---

## Cost

| Service | Tier |
|---|---|
| Vercel, Supabase, GitHub, Upstash | Free |
| Braintrust | Free tier |
| Anthropic | ~$0.0017/message, bounded by spend cap |

Realistic: a few dollars a month, dominated by chat volume.
