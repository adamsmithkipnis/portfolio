# Figma app

A Figma lookalike inside the desktop that shows real work from Adam's Figma
account: canvases visitors can pan and zoom, design narration, and (later)
clickable prototypes.

**Status:** Phase 1 built (two files); Phases 2–3 planned
**Last updated:** 2026-11-25

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Rendering** | Lookalike Figma chrome; pages are static exports | Embedding figma.com drops a foreign UI into a Tahoe window, is slow, can hit sign-in walls, and requires every file to be publicly shared |
| **Content source** | One exported image per page + a manifest, **committed to the repo** | No runtime Figma API, no token in the client, no rate limits |
| **Granularity** | Whole pages, not single frames | One image keeps the original layout exactly; layers are rectangles over it. Frame-level exports can come later if zoomed-in sharpness matters |
| **Comments** | Adam's own design narration only | Repo rule: never fabricate quotes attributed to real people. No fake teammates in comment threads |
| **Mobile** | Not supported; falls back to Finder (like Preview) | A pan/zoom canvas between two panels doesn't fit 375px |
| **Name and icon** | "Figma", with the Figma mark on a dark tile | Same trade-off Spotify already made (decided 2026-11-25) |
| **NDA** | Invoca, Providence and Grace files cleared to publish | Adam confirmed 2026-11-25 |
| **Window size** | Fixed 1100×700, not `fillDesktop` | `tests/window-fit.test.ts` deliberately limits viewport-sized defaults to Safari and Finder |

---

## Content model

```
config/figma/
├── window-management.json     ← manifest
└── grace-design-system.json
public/figma/
├── window-management/notes.png, solution.png, exploration.png   ← one image per page, named by page id
└── grace-design-system/cover.png, colors.png, …
```

Manifests live in `config/`, not `content/`, so the Finder content walk
(`scripts/build-content.mjs`) doesn't mount them. `lib/figma-files.ts` imports
each one and defines the types.

```jsonc
{
  "slug": "window-management",
  "title": "Feature - Window Management",
  "kind": "design",                     // or "slides": the layer list reads "Slides"
  "fileKey": "LpNQkR3RwV27AuQs5JoHE9",  // for re-exports; never linked
  "edited": "2026-07",                  // "Edited Jul 2026" in Recents
  "caseStudy": "grace-providence",      // optional: slug in config/case-studies.mjs
  "background": "#1e1e1e",              // canvas color around the page
  "pages": [
    {
      "id": "notes", "name": "Notes",
      "image": "/figma/window-management/notes.png", "w": 4810, "h": 3880,
      "layers": [
        { "name": "Problem description", "x": 28, "y": 2393, "w": 898, "h": 417,
          "note": "One line of rationale, shown in the details panel" }
      ]
    }
  ]
}
```

Layer rectangles are in **page-image pixels**, with the origin at the image's
top-left. A page export covers the bounding box of the page's top-level nodes,
so a node at Figma `(x, y)` sits at `(x − minX, y − minY)`. The first layer of
the first page is the Recents thumbnail.

`tests/figma-files.test.ts` checks that every image exists, every layer fits
inside its page, slugs are unique, and every `caseStudy` slug exists.

### Exporting

v1 was exported with the Figma MCP server, not a script:

1. `get_metadata` on the file (no node id) lists its pages; on a page id it
   lists top-level frames with positions
2. `get_screenshot` on a **page id** with a large `maxDimension` (12000) returns
   the whole page at 1×. A Slides file's page `0:1` comes back as one strip of
   slides, 1920×1080 each, at x = 240 + i × 2160, y = 240
3. Images go to `public/figma/<slug>/`, layers into the manifest

Re-exporting is a deliberate act: what ships in the repo is public. Notes are
hand-written, so a re-export must keep them.

---

## App structure

```
components/apps/figma/
├── figma-app.tsx      ← state, title bar, Recents grid, layers + details panels
└── figma-canvas.tsx   ← pan/zoom viewport, hover and selection outlines
lib/figma-camera.ts    ← pure camera math (fit, zoom at point, steps, hit test)
lib/figma-files.ts     ← manifests + types
```

- Registered in `lib/app-config.ts` (`mobile.supported: false`,
  `shellFallbackAppId: "finder"`), routed at `/figma` (`lib/shell-routing.ts`,
  `app/(desktop)/figma/`), rendered in `components/desktop/desktop.tsx`
- "Read the case study" resolves the slug through `lib/work-links.ts` and calls
  the shell's `onOpenApp("safari", archivePath)`, the same way Finder opens a
  `.webloc`. No import from `components/apps/safari`
- The open file and page persist in `sessionStorage` (`figma-state`);
  `clearAppState("figma")` clears it when the window closes
- Panels use the same Tailwind classes as the other apps (`bg-muted`,
  `bg-blue-500` selection). The page canvas color comes from the file, as data

### Canvas interactions

| Input | Action |
|---|---|
| Drag | Pan (visitors don't need marquee select) |
| Two-finger scroll / wheel | Pan |
| ⌘ or ctrl + scroll / pinch | Zoom at the pointer, 2%–400% |
| Click a frame | Select it; the layer list and details panel follow |
| Click a layer row, or double-click a frame | Select and zoom to it |
| ⇧1 / ⇧0 / ⇧2 | Fit page / 100% / zoom to selection |
| + / − | Figma's zoom steps |
| Esc | Deselect |

One `<img>` per page under a CSS transform. Outlines are drawn in screen space,
so they stay crisp at any zoom.

---

## Phases

### Phase 1 — Browser + canvas ✅
Files: **Feature - Window Management** (Notes, Solution, Exploration pages),
**(Redesign) Grace Design System** (Cover, Colors, Buttons, Chat Bubbles, FAB,
Mockups).

- [x] NDA check: all three cleared
- [x] Manifests and page exports for the two files
- [x] App registration, icon, routes, window chrome
- [x] Recents grid → open file → canvas with layers + details panels
- [x] Pan/zoom/select, fit on open
- [x] "Read the case study" → Safari (`grace-providence`)
- [ ] **Invoca Copilot — Case Study**: pulled from v1 on 2026-11-25. The Figma
      Slides deck still says HubSpot (the vendor was ThoughtSpot), has two
      "Toast IQ" lines that never go on the site, and slide 5 is an unfilled
      NotebookLM screenshot placeholder. The text is baked into the slide
      images, so the fix is in Figma, then a re-export (key
      `co1SPG0Mny08gGhrzepmph`, page `0:1`, `caseStudy: "invoca-workflow-agent"`,
      `kind: "slides"`, background `#e5e5e5`)
- [ ] Adam to review and rewrite the layer notes (the current ones are drafted from text in the files)
- [ ] Window Management › Solution includes a "Meeting notes: 6-22-23" text block, readable when zoomed in; decide whether it stays
- [ ] **macOS 26** easter egg: held back. It's Apple's community UI kit, not Adam's
      work, and Apple's design-resources license doesn't allow redistributing it.
      Alternative: a page from Adam's own work that uses it, or this site's own
      design tokens
- [ ] By-eye pass at multiple window sizes and in dark mode

### Phase 2 — Narration + more files
Files: **CEP Design System**, **Staris AI**, **Storybooth**, **Workflow Agent**
(check whether Workflow Agent belongs with the Invoca file, since the archived
case study is `invoca-workflow-agent`).

- [ ] Comment pins on canvas; click to open a single-author bubble
- [ ] Comments toggle in the toolbar (on by default, so the story is visible)
- [ ] Optional inspect tab: show the frame's colors and type mapped to our
      extracted tokens where they match

### Phase 3 — Prototype mode
Files: **Feature - MyChart Launch Options**, **Feature - Grace FAB & Menu**.

- [ ] ▶ button enters presentation view: one frame fills the window
- [ ] Hotspots from the file's prototype connections, exported with the frames
- [ ] Hotspot hint flash on misclick (as in Figma); Esc exits
- [ ] Simple transitions only (instant / dissolve / slide)

---

## Open questions

- **Dock placement.** Figma is on the Dock by default for now. Keep it there, or
  make it discoverable only via Finder → Applications and the case studies?
- **Image weight.** The public folder is ~12 MB, mostly Grace Mockups (5 MB) and
  Window Management Solution (3.3 MB). Each page loads only when opened, but a
  low-res-first image for zoomed-out views would help on slow connections.
  `ffmpeg` here has no WebP encoder; `cwebp` would cut these sizes a lot.
