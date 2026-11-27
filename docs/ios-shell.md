# iOS shell

phones get a simulated iOS, held to the HIG the way the desktop is held to
Tahoe. this doc is the plan of record and the rules that keep the simulation
from fighting the visitor's real phone.

**status: phase 0.** nothing a visitor sees has changed. a phone on `/` still
gets the archived site, and app routes still open `components/mobile/mobile-shell.tsx`.

## the gesture model

the visitor's OS and browser own the physical screen edges. a page cannot
intercept a swipe that starts there, and should not try. so:

> **never fight a real edge gesture. move ours inside the viewport, or make the
> real one do the right thing.**

| simulated gesture | what really owns it | what we do |
|---|---|---|
| swipe up from the bottom (home, switcher) | OS home gesture, browser toolbar | the simulated home indicator sits *inside* the viewport, in a strip the shell owns (`touch-action: none`). a touch that starts in the strip is ours; one from the physical edge stays the OS's. apps pad with `--ios-safe-bottom`, as real apps respect the safe area |
| edge swipe back | Safari / Android back | **align, don't block.** every app open and in-app push writes a history entry (`pushUrl` in `lib/set-url.ts`), so the visitor's real back swipe *is* the simulated back. a transition caused by `popstate` is instant, because the browser already animated it; a tap on the back chevron animates |
| pull down from the top (Notification Center, Control Center) | pull-to-refresh, the real status bar | the start zone is our simulated status bar, inside the viewport. the body never scrolls (`h-dvh`, `overscroll-behavior: none`) |
| pull down on Home (Spotlight) | pull-to-refresh | as above, plus the Search pill above the dock as a tap target |
| pinch, double-tap, long-press | page zoom, the text callout | `touch-action: manipulation` on the shell root; `-webkit-touch-callout: none` and `select-none` on chrome |
| any gesture over Safari's iframe | the iframe swallows touches | gesture strips are shell-owned and sit outside the iframe |

rules that follow from it:

- **every gesture has a tap equivalent.** tap the home indicator for the
  switcher, the status bar clock for Notification Center, its right cluster for
  Control Center, a card to open it. this is also the accessibility path.
- **the landing teaches the model.** a visitor with no deep link arrives in the
  App Switcher with Safari centred (`createInitialSceneState`).
- **recognition is pure.** `lib/ios/gestures.ts` classifies pointer samples and
  is tested without a DOM. its thresholds are hand-seeded and tuned by feel;
  none is a measured iOS value.

### the phase 0 spike

`/ios-spike` (unlinked, `noindex`) is a throwaway page that tests exactly the
table above on a real phone. open it on the deploy preview, work down the
checklist, tap **Copy results**, and paste the JSON back. the log line that
matters is `POINTERCANCEL`: it means the browser or OS took a touch away from
one of our strips.

run it in each of: iOS Safari, iOS Chrome, Android Chrome with gesture
navigation, Android Chrome with three-button navigation.

if the bottom strip is unreliable anywhere, the fallback is to inset the
simulated screen as a rounded "device within the device", so no simulated edge
touches a physical one.

delete `app/ios-spike/` and `components/ios/spike/` once the table is confirmed.

## architecture

a second shell beside `components/desktop/`. the layer rule holds: shell → apps
→ system.

| path | purpose |
|---|---|
| `lib/ios/scene-state.ts` | scene state machine: mode (`locked`, `home`, `app`, `switcher`), the open-app stack, the pulled-down panel. the phone-side `lib/window-context.tsx` |
| `lib/ios/gestures.ts` | pure gesture recognition |
| `components/ios/` | the shell: home screen, dock, status bar, home indicator, app scene, switcher, lock screen, control center, notification center, spotlight, quick look *(not built yet)* |
| `components/ios/ui/` | primitives apps reskin with: navigation bar, tab bar, grouped list, sheet, action sheet, segmented control, switch, search field. import nothing from apps or the shell *(not built yet)* |
| `design-tokens/extract-tokens-ios.swift` | UIKit extraction, run in the simulator |

- the shell sets `data-shell="ios"`. iOS tokens are scoped to it, and the
  `ios:` Tailwind variant keys on it, next to `desktop:`.
- app placement on the Home Screen and dock will live in `lib/app-config.ts`
  (`ios.*`), never in a hardcoded id list.
- apps still never import each other. the shell answers `onOpenApp`,
  `onOpenPreviewFile` and `onOpenTextFile`; on iOS the last two present a Quick
  Look sheet.
- apps read the shell's `--ios-safe-*` variables, not `env(safe-area-inset-*)`:
  the safe area that matters is the simulated one.

## apps

| macOS | iOS | notes |
|---|---|---|
| Safari | Safari | bottom address bar around `BrowserFrame`. first |
| Finder | Files | files open in Quick Look, which also makes the resume reachable |
| Notes, Claude, Messages, Settings, Calendar, Spotify | same | reskin each mobile branch with the primitives |
| Weather | Weather | enable on mobile |
| Terminal, TextEdit, Preview | none | hidden on iOS; Preview's renderer backs Quick Look |
| Figma, Photos | deferred | hidden, as today |

## phases

0. **spike + tokens** — the gesture spike on real devices; the UIKit extractor
   and build pipeline; iOS icon artwork and wallpaper. *in progress*
1. **shell core** — scene provider, Home Screen, dock, status bar, home
   indicator, launch animation, primitives, Safari, Files, Quick Look. reachable
   on app routes only
2. **switcher + switch-over** — App Switcher, history alignment, the `/` rewrite
   in `next.config.mjs` pointed at the shell, `MobileShell` removed
3. **remaining apps**, one at a time
4. **system layer** — Lock Screen, Control Center, Notification Center, Spotlight

## open

- iPads count as mobile today and will get the iPhone layout on a wider grid.
- Android visitors get the same simulation, with Inter as the font fallback.
- the app icons in `public/` have the macOS shape and shadow baked in. iOS needs
  full-bleed artwork, masked in CSS.
- interruptible, finger-tracked springs (switcher cards, launch zoom) need a
  motion library; the plan is `motion`, imported only under `components/ios/`.
