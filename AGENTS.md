# AGENTS.md

macos desktop environment on the web. next.js, react, tailwind, supabase.

this file captures the patterns and conventions that matter most when working in this codebase. it should grow as new patterns emerge and stay trimmed as old ones become obvious.

## how to work in this repo

1. read `docs/design-system.md` before touching any UI — it defines colors, tokens, sidebar patterns, and has a checklist for new apps
2. run `npm run check` after making changes — it runs lint, Node tests, typecheck, and the production build

## key files

| path | purpose |
|------|---------|
| `lib/app-config.ts` | app registry (all apps defined here) |
| `lib/content-files.ts` | mounts the build-time case study tree into Finder's paths |
| `system/content/generated.ts` | **generated** content tree — run `npm run content` |
| `lib/window-context.tsx` | window state machine (open/close/focus/minimize/drag/resize) |
| `lib/sidebar-persistence.ts` | view state persistence + `clearAppState()` |
| `lib/desktop/z-index.ts` | z-index layers: windows 1-50, dock 60, menu bar 70, fullscreen 80, overlays 90-100 |
| `components/desktop/` | desktop shell (dock, menu bar, window, notification center) |
| `components/apps/` | all app implementations |

## living docs

read before building, update when you ship:

| file | update when |
|------|-------------|
| `AGENTS.md` | new patterns or conventions emerge |
| `docs/design-system.md` | new UI components or design tokens added |
| `docs/document-apps.md` | TextEdit/Preview launch behavior or empty-state UX changes |
| `docs/weather-scenes.md` | weather scene architecture, shared renderer behavior, or effect tuning changes |
| `README.md` | new apps added or architecture changes |

## conventions

- **state persistence**: sessionStorage for per-tab view/runtime state and the complete desktop window layout; localStorage for durable user content, preferences, and anonymous identity. window close clears app view state via `clearAppState()` automatically
- **window management**: `useWindowManager()` for operations, `useWindowFocus()` for focus state
- **desktop vs mobile**: use `isMobileView` / `isDesktop` prop, never raw viewport queries
- **hover states**: gate hover-only styles with Tailwind's `can-hover:` variant so touch devices never get sticky hover treatments
- **menu system**: menus are mutually exclusive via `openMenu` state in `menu-bar.tsx`. panel-style menus follow the `status-menus.tsx` pattern. use `useClickOutside()` for dismissal
- **app discoverability + availability**: define Dock, Finder, and mobile support policy in `lib/app-config.ts` (`showOnDockByDefault`, `showInFinderApplications`, and `mobile.*`). avoid hardcoded app-id allow/deny lists in app components
- **case study content**: `content/work/<project>/` is the source of truth — adding a project is creating a folder, never a registry edit. `npm run content` regenerates the bundled tree (`predev`/`prebuild` do it for you). case study sections open in Preview windows (`PreviewFileType` includes `case-study`); column view previews them on selection. see `docs/CONTENT-MODEL.md`
- **finder + document apps**: Finder is multi-window on desktop. keep per-window Finder browsing state inside the Finder window/app pair, and keep TextEdit/Preview launch roots aligned with `components/desktop/desktop.tsx`, route files, and `docs/document-apps.md`
- **weather scenes**: weather visuals are shared between the weather app and notification center. use `components/apps/weather/weather-scene-effects.tsx` for scene rendering and `lib/weather.ts` for palettes/effect selection instead of duplicating scene markup

---

# fork-specific conventions

this is a fork of [alanagoyal/alanagoyal](https://github.com/alanagoyal/alanagoyal) (MIT),
being reworked into a personal portfolio with macOS Tahoe visual fidelity.
everything above is upstream's; everything below is ours.

**read `docs/PLAN.md` for phases and decisions before starting work.**

## design tokens — non-negotiable

colors, type, and control metrics are **extracted from macOS via AppKit**, not
hand-authored. see `design-tokens/README.md`.

- **never hardcode a color.** use `var(--color-*)` or the tailwind token
- **never edit `design-tokens/tokens.css` or `tailwind.tokens.js`** — they're
  generated. change `extract-tokens.swift` or `build-tokens.mjs` and regenerate
- labels are semantic alpha over black/white (`rgb(0 0 0 / 0.85)`), not opaque
  hex. preserve that — it's how the OS composites
- **blur radii are hand-seeded, not extracted.** `NSVisualEffectView`'s backdrop
  blur is composited by the window server and can't be read programmatically.
  tune visually; never present the seed values as measured

```bash
cd design-tokens && swift extract-tokens.swift > tokens.json   # re-extract from OS
cd design-tokens && node build-tokens.mjs                      # regenerate CSS + tailwind
```

## fonts — licensing

**never embed the SF font files.** apple's license permits system font use in
apps and mockups but not web embedding. use `-apple-system` (already in
`--font-sans`); apple devices resolve to the real system font, everyone else
falls back to Inter.

## layer discipline

dependencies point **downward only**: shell → apps → system.

- design primitives import nothing from apps or the desktop shell
- **no app imports another app**
- the shell reads the app registry (`lib/app-config.ts`); it never reaches into
  an app's internals

if a change requires violating this, the change is wrong — fix the boundary.

## platform seam (for a future iOS shell)

keep app **content** separate from app **chrome**. content components render
data and own state; platform wrappers supply the frame. this is what makes
adding an iOS shell later a new chrome layer rather than a rewrite.

## upstream

synced once at tag `baseline-upstream`. **do not bulk-merge upstream** — the
re-skin and pruning make merges conflict-heavy and low-value. cherry-pick
security fixes and bug fixes in unmodified logic only:

```bash
git fetch upstream && git log --oneline HEAD..upstream/main
git cherry-pick <sha>
```

keep `LICENSE.md` and the attribution in `README.md`.

## AI chat

messages runs through the braintrust proxy to claude haiku 4.5.

`/api/chat` **must** keep: per-IP rate limiting, history cap (~10 turns), and a
`max_tokens` cap (~300). it's a public endpoint — an unguarded one is the only
real cost risk in this project.

if a persona speaks as a real person it must be clearly labeled AI. **never
fabricate quotes or testimonials attributed to real people.**

## content

case studies are MDX under `content/`; the filesystem is the information
architecture. see `docs/CONTENT-MODEL.md`. adding a project = creating a folder.
