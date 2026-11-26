# Figma app — plan

A Figma lookalike inside the desktop that shows real work from Adam's Figma
account: canvases visitors can pan and zoom, design narration, and (later)
clickable prototypes.

**Status:** planned, not started
**Last updated:** 2026-11-25

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Rendering** | Faux Figma chrome built on our tokens; frames are static exports | Embedding figma.com drops a foreign UI into a Tahoe window, is slow, can hit sign-in walls, and requires every file to be publicly shared |
| **Content source** | Exported PNG/WebP + a per-file manifest, **committed to the repo** | No runtime Figma API, no token in the client, no rate limits. Same "drop in a folder" rule as `content/work/` |
| **Escape hatch** | Each file may carry an `figmaUrl` → "Open in Figma" | For visitors who want the real file, only where it's actually shared |
| **Comments** | Adam's own design narration only | Repo rule: never fabricate quotes attributed to real people. No fake teammates in comment threads |
| **Mobile** | Not supported; falls back to Finder (like Preview) | Pan/zoom canvas plus three panels doesn't fit 375px |
| **Name and icon** | Open — decide deliberately (see Open questions) | Same trade-off Spotify already made |

---

## Content model

```
content/figma/
├── invoca-copilot/
│   ├── file.json          ← manifest (below)
│   ├── cover.webp         ← Recents grid thumbnail
│   └── frames/
│       ├── 1-2.webp       ← named by Figma node id
│       └── 1-9.webp
└── window-management/
    └── ...
```

`file.json`:

```jsonc
{
  "title": "Invoca Copilot — Case Study",
  "edited": "2026-09",              // display only
  "figmaUrl": null,                  // set only if the file is shared publicly
  "caseStudy": "invoca-workflow-agent", // optional: slug from config/case-studies.mjs, opens in Safari
  "pages": [
    {
      "name": "Explorations",
      "frames": [
        {
          "id": "1:2", "name": "Copilot panel — v1",
          "x": 0, "y": 0, "w": 1440, "h": 900,
          "image": "frames/1-2.webp",
          "note": "One sentence of rationale shown in the details panel",
          "links": [{ "from": { "x": 40, "y": 80, "w": 120, "h": 32 }, "to": "1:9" }] // phase 3
        }
      ],
      "comments": [{ "x": 320, "y": 140, "text": "Why we dropped the side rail" }] // phase 2
    }
  ]
}
```

Frame positions come from the file's real canvas coordinates, so the layout
reads like the original. Only frames listed in the manifest ship; whole pages
are never exported blindly.

### Export pipeline

A one-off script, `scripts/export-figma.mjs`, run by hand and **never in
`prebuild`**:

1. Reads `FIGMA_TOKEN` from `.env.local` (never committed, never shipped)
2. For each file in a small config list, fetches node metadata and renders the
   chosen frames (`GET /v1/images`, 2x, WebP after conversion)
3. Writes `file.json` skeletons and images; hand-written `note` and `comments`
   survive re-runs

Re-exporting is a deliberate act because what ships in the repo is public.

---

## App structure

```
components/apps/figma/
├── figma-app.tsx         ← content: owns state, no window chrome
├── figma-window.tsx      ← desktop chrome wrapper (platform seam)
├── recents-grid.tsx      ← home: file tiles
├── canvas.tsx            ← pan/zoom viewport, frames, selection, comment pins
├── layers-panel.tsx      ← pages + frames list (left)
├── details-panel.tsx     ← selected frame: size, note, "Open case study" (right)
└── use-canvas-camera.ts  ← transform math, gestures, zoom-to-fit
```

- Registered in `lib/app-config.ts` (`showOnDockByDefault` TBD, `mobile.supported: false`,
  `shellFallbackAppId: "finder"`)
- "Open case study" resolves the slug through `lib/work-links.ts` and calls the
  shell's `onOpenApp("safari", archivePath)`, the same way Finder opens a
  `.webloc` (`components/apps/finder/finder-app.tsx`). **No import from
  `components/apps/safari`**, which would break the layer rule
- View state (open file, page, camera, selection) goes in `sessionStorage`; add a
  `"figma"` case to `clearAppState()` in `lib/sidebar-persistence.ts`
- Follow the new-app checklist in `docs/design-system.md`. Panel colors use
  tokens; Figma's own dark UI is **not** copied hex-for-hex

### Canvas interactions

| Input | Action |
|---|---|
| Space + drag, or middle-drag | Pan |
| Trackpad two-finger scroll | Pan |
| ⌘ + scroll / pinch | Zoom at cursor (clamped ~5%–400%) |
| ⇧1 / ⇧0 | Zoom to fit / 100% |
| Click frame or layer row | Select; layers and canvas stay in sync |
| Double-click a layer row | Zoom to that frame |
| Esc | Deselect; then blur (so `q` quits, per checklist) |

Use CSS transforms on one layer and `<img loading="lazy">` per frame. No
canvas/WebGL renderer until frame counts prove it's needed.

---

## Phases

### Phase 1 — Browser + canvas (v1)
Files: **Invoca Copilot — Case Study**, **Feature - Window Management** (+ the
Exploration file as a second page), **(Redesign) Grace Design System**,
**macOS 26** easter egg.

- [ ] NDA check: confirm what can ship from Invoca and Grace (see Open questions)
- [ ] Export script + manifests for the four files
- [ ] App registration, icon, window chrome
- [ ] Recents grid → open file → canvas with layers + details panels
- [ ] Pan/zoom/select, zoom-to-fit on open
- [ ] "Open case study" → Safari on the archived page (`invoca-workflow-agent`;
      `grace-providence` for Grace)
- [ ] Design-system view for Grace: component frames grouped by component, variants in a row
- [ ] macOS 26 file framed as this desktop's "source file"
- [ ] `npm run check` green; by-eye pass at multiple window sizes

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
- [ ] Hotspots from `links`, taken from the file's prototype connections at export time
- [ ] Hotspot hint flash on misclick (as in Figma); Esc exits
- [ ] Simple transitions only (instant / dissolve / slide)

---

## Open questions

- **NDA / employer content.** Invoca, Providence (MyChart) and Grace are
  employer work. Decide per file: ship as-is, ship redacted frames, or keep only
  the case-study version. Invoca content must match the deck (canon).
- **Name and icon.** Call it "Figma" with Figma's icon (like Spotify), or a
  neutral name? Check Figma's brand guidelines before deciding.
- **Dock placement.** On the Dock by default, or discoverable via Finder →
  Applications and the case studies?
- **Image weight.** Budget per file (~2–4 MB?) and whether to add a
  low-res-first strategy for zoomed-out views.
