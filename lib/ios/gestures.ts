/**
 * Gesture recognition for the iOS shell, as pure functions over pointer
 * samples so it runs under `node --test` with no DOM.
 *
 * The shell's gestures start in strips the shell owns *inside* the viewport
 * (the simulated home indicator and status bar), never on the physical screen
 * edge, which belongs to the visitor's real OS and browser. See
 * docs/ios-shell.md.
 *
 * Every threshold here is hand-seeded and tuned by feel against a real iPhone.
 * None of them is a measured or published iOS value.
 */

export interface GestureSample {
  x: number;
  y: number;
  /** Milliseconds, from any monotonic clock (`event.timeStamp`). */
  t: number;
}

export type HomeGestureResult = "home" | "switcher" | "tap" | "cancel";
export type PullDownResult = "open" | "tap" | "cancel";
export type TopEdgeTarget = "notification-center" | "control-center";

export const GESTURE_TUNING = {
  /** Movement under this is a tap, not a drag. */
  tapSlopPx: 8,
  tapMaxMs: 300,
  /** Samples older than this are ignored when measuring release velocity. */
  velocityWindowMs: 100,
  /** Upward release speed that sends the app home whatever the distance. */
  flickVelocityPxPerMs: 0.5,
  /** Shorter drags than this snap back. */
  minTravelPx: 24,
  /** Slow drags past this fraction of the viewport go home, not to the switcher. */
  homeTravelFraction: 0.4,
  /** A pull-down opens its panel past this fraction of the viewport. */
  pullOpenFraction: 0.18,
  /** The Control Center corner, as a fraction of the status bar's width. */
  controlCenterFraction: 1 / 3,
} as const;

/** px/ms along y over the last `velocityWindowMs`; positive is downward. */
export function releaseVelocityY(samples: readonly GestureSample[]): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  let first = last;
  for (let i = samples.length - 2; i >= 0; i--) {
    if (last.t - samples[i].t > GESTURE_TUNING.velocityWindowMs) break;
    first = samples[i];
  }
  const dt = last.t - first.t;
  return dt > 0 ? (last.y - first.y) / dt : 0;
}

function isTap(samples: readonly GestureSample[]): boolean {
  const first = samples[0];
  const last = samples[samples.length - 1];
  const moved = samples.some(
    (s) => Math.hypot(s.x - first.x, s.y - first.y) > GESTURE_TUNING.tapSlopPx
  );
  return !moved && last.t - first.t <= GESTURE_TUNING.tapMaxMs;
}

/**
 * What a drag that began on the home indicator means once the finger lifts.
 *
 * A fast upward flick goes home. A slower drag goes to the App Switcher,
 * unless it travelled most of the way up the screen, which also goes home.
 * Anything short, or moving back down at release, snaps back to the app.
 */
export function resolveHomeGesture(
  samples: readonly GestureSample[],
  viewportHeight: number
): HomeGestureResult {
  if (samples.length === 0) return "cancel";
  if (isTap(samples)) return "tap";

  const travelUp = samples[0].y - samples[samples.length - 1].y;
  const velocityUp = -releaseVelocityY(samples);

  if (velocityUp <= -GESTURE_TUNING.flickVelocityPxPerMs) return "cancel";
  if (travelUp < GESTURE_TUNING.minTravelPx) return "cancel";
  if (velocityUp >= GESTURE_TUNING.flickVelocityPxPerMs) return "home";
  if (travelUp >= viewportHeight * GESTURE_TUNING.homeTravelFraction) return "home";
  return "switcher";
}

/** How far up the home gesture has dragged, 0 at rest to 1 at the top. */
export function homeGestureProgress(
  samples: readonly GestureSample[],
  viewportHeight: number
): number {
  if (samples.length === 0 || viewportHeight <= 0) return 0;
  const travelUp = samples[0].y - samples[samples.length - 1].y;
  return Math.min(1, Math.max(0, travelUp / viewportHeight));
}

/** Which panel a drag from the status bar opens: the right corner is Control Center. */
export function topEdgeTarget(startX: number, width: number): TopEdgeTarget {
  return startX >= width * (1 - GESTURE_TUNING.controlCenterFraction)
    ? "control-center"
    : "notification-center";
}

/** What a downward drag (status bar panels, Spotlight) means once the finger lifts. */
export function resolvePullDown(
  samples: readonly GestureSample[],
  viewportHeight: number
): PullDownResult {
  if (samples.length === 0) return "cancel";
  if (isTap(samples)) return "tap";

  const travelDown = samples[samples.length - 1].y - samples[0].y;
  const velocityDown = releaseVelocityY(samples);

  if (velocityDown <= -GESTURE_TUNING.flickVelocityPxPerMs) return "cancel";
  if (travelDown < GESTURE_TUNING.minTravelPx) return "cancel";
  if (velocityDown >= GESTURE_TUNING.flickVelocityPxPerMs) return "open";
  return travelDown >= viewportHeight * GESTURE_TUNING.pullOpenFraction ? "open" : "cancel";
}
