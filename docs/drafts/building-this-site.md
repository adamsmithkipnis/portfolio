# Draft: How I built this site

> **Status: draft for Adam's review, section by section. Not published anywhere.**
> Every number below is traced to a file or commit (sources at the end).
> `[ADAM: …]` marks a place that needs your own words or a decision.
> Placement once approved: outside the featured four, as a personal project.

---

## Title and dek

**This site is the work sample**

*A macOS Tahoe desktop in the browser, built on an open-source fork in sixteen
weeks, with the operating system measured rather than eyeballed.*

**Role** Designer and builder, working with Claude Code as a pair
**Client** Myself
**Timeline** August – November 2026

`[ADAM: is "working with Claude Code as a pair" how you want to describe it?
Every commit is co-authored, so the page should say something.]`

## Metrics (pick 3–4)

| Value | Label |
|---|---|
| 41 | system colors read from macOS, in light and dark |
| 158 | commits across 55 pull requests in 16 weeks |
| 3 | rounds of outside critique that changed the build |
| 1 | value the OS would not give up (blur) |
| 30 / min | rate limit on the public AI chat, per visitor |

## At a glance

**Problem** A portfolio of screenshots asks a hiring manager to take craft on
trust. I wanted the site itself to be the evidence, without the wrapper hiding
the case studies.

**What I did** Forked an open-source macOS desktop, extracted Tahoe's colors,
type and control sizes straight from the OS, added an AI chat with guardrails,
and reshaped the first impression three times on reviewers' feedback.

**Outcome** A working desktop with deep-linkable apps, four case studies one
click from the landing page, and a token pipeline that re-runs after any macOS
update. The tokens are extracted and committed; wiring them through the UI is
the next step.

## My thinking

- **Fork, don't rebuild.** An existing open-source desktop already shipped three
  of my four goals (per-app URLs, an AI Messages app, a content pipeline) with
  about 1,662 commits of polish behind it. I synced once, tagged the baseline,
  and hard-forked. Rebuilding would have spent the whole budget reaching parity.
- **Two brands, on purpose.** The desktop follows Apple's design language. The
  site inside Safari is mine: its own navy, amber highlighter and type. Showing
  both is the point. One demonstrates working inside someone else's guidelines,
  the other is my own voice, and the browser frame keeps their styles from
  leaking into each other.
- **Tools sized to the problem.** No Storybook for fifteen-odd components with
  one consumer. No CMS for four case studies. Each decision is written down
  with its reason in the project plan, so I could change my mind later and know
  what I was trading.

`[ADAM: anything here that isn't how you actually thought about it?]`

## What I did

- **Asked the OS instead of a screenshot.** A screenshot gives you a color
  after it has been blended with whatever sat behind it. A short Swift script
  asks AppKit for the semantic values directly. Two things that only show up
  this way: the system label is black at 0.847 alpha, not the 0.85 the
  documentation rounds to, and Tahoe's red is `#FF383C` where most published
  references still list `#FF3B30`.
- **Checked the API against itself.** The font descriptor reports the smallest
  caption style at weight 0. It actually resolves to SF Medium. The script
  trusts the resolved PostScript name over the reported weight.
- **Labelled what can't be measured.** Window blur is composited by the window
  server, so no view can report its radius, and corner radii have no public
  API. Those values are hand-seeded and marked as such in the code, with a
  written procedure for calibrating them against a real window. I would rather
  ship a labelled estimate than a number that pretends to be measured.
- **Treated licensing as a design constraint.** Apple's fonts can't be embedded
  on the web. The site asks for the system font by name: Apple devices get the
  real thing with nothing downloaded, everyone else gets Inter.
- **Put guardrails on the public AI chat.** Messages runs real model calls from
  a public page, which is the only real cost risk in the project. It has
  per-visitor and per-IP rate limits (30 and 120 a minute), a sliding history
  window (40 messages or 12,000 characters), a 300-token reply cap, and an
  evaluation that scores each persona for staying in voice.
- **Let critique change the front door.** Two reviewers said the same thing:
  the shell is memorable and it hides the work. Both had landed in Notes and
  had to hunt for the case studies. Safari now opens first on the portfolio,
  phones skip the desktop entirely, and each case study leads with its role,
  numbers and a three-line summary.
- **Kept the docs honest for the agents reading them.** An AI pair reads the
  project docs before every change, so a confident wrong sentence there does
  more damage than a gap. I audited them and corrected four stale claims,
  including a lint rule the docs said was enforced and wasn't installed.

## Result

- A desktop with Safari, Finder, Messages, Notes, Spotify and Terminal, each at
  its own URL, with the portfolio one click from the landing page.
- A token pipeline of two commands: extract from the OS, generate CSS and
  Tailwind. Re-run after any macOS update.
- 158 commits and 55 pull requests between August 5 and November 25, 2026, with
  tests and a build check on every pull request.

**What's next, plainly.** The tokens are extracted and committed but the UI
doesn't consume them yet; the desktop's look today comes from the fork's own
styles plus Tahoe wallpapers. Wiring the tokens through the menu bar, dock and
window chrome, and calibrating blur against real windows, is the next phase.
The layer boundary between shell, apps and system is a convention reviewers
uphold, not yet a lint rule.

`[ADAM: this section is the candid part you asked for. Too candid, or right?]`

## Context

- Forked from [alanagoyal/alanagoyal](https://github.com/alanagoyal/alanagoyal)
  (MIT). The window manager, app routing and much of the original polish are
  upstream's work.
- Next.js, React, Tailwind, Supabase, hosted on Vercel.
- Built with Claude Code; commits are co-authored.

---

## Sources (for review, not for the page)

| Claim | Source |
|---|---|
| 41 colors, 11 type styles, 14 materials | `docs/PLAN.md` Step 0; `design-tokens/extract-tokens.swift` |
| Label 0.847 alpha, red `#FF383C` | `design-tokens/tokens.json`; `design-tokens/README.md`; commit `a878348` |
| Caption weight 0 vs Medium | `design-tokens/extract-tokens.swift` ≈159–162 |
| Blur and radii not extractable | `design-tokens/README.md`; `BLUR_SEED` in `build-tokens.mjs` |
| ~1,662 upstream commits, 3 of 4 goals | `docs/PLAN.md` decisions table |
| Rate limits, history window, token cap | `docs/PLAN.md` Step 4; `app/api/chat/route.ts` |
| Persona eval | commit `0fa46ae` |
| "memorable and it hides the work" | commits `5091731`, `b19e00f` |
| Four stale doc claims | commit `2ba043f` (#20) |
| 158 commits, PRs #1–#55, Aug 5 – Nov 25 | `git log baseline-upstream..HEAD` |
| Tokens not yet wired | `docs/PLAN.md` Step 6 (unchecked); no import of `tokens.css` in `app/`, `components/`, `tailwind.config.ts` |

## Things I noticed while sourcing this

- `design-tokens/README.md` says 43 colors; the script and the plan say 41.
- `README.md` still describes the site as "macos sierra 10.12 themed".
- `docs/PLAN.md` "Last updated" still reads 2026-08-05.
- Text-field heights come back as 24 at every control size, which looks like an
  artifact of how they're measured. I left that number out of the draft.
