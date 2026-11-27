/**
 * Scene state for the iOS shell: the phone-side counterpart of the window
 * state machine in lib/window-context.tsx.
 *
 * A phone shows one thing at a time, so there are no positions or sizes here:
 * just which mode the phone is in, which apps are open (most recent first, the
 * order the App Switcher shows them), and which system panel is pulled over
 * the top. The reducer is pure; the provider that persists it lives with the
 * shell.
 */

export type IOSMode = "locked" | "home" | "app" | "switcher";
export type IOSOverlay = "notification-center" | "control-center" | "spotlight";

export interface IOSSceneState {
  mode: IOSMode;
  /** Open apps, most recently used first. `stack[0]` is frontmost in `app` mode. */
  stack: string[];
  overlay: IOSOverlay | null;
  /** Where unlocking returns to. */
  modeBeforeLock: Exclude<IOSMode, "locked">;
  homePage: number;
}

export type IOSSceneAction =
  | { type: "OPEN_APP"; appId: string }
  | { type: "GO_HOME" }
  | { type: "OPEN_SWITCHER" }
  | { type: "CLOSE_APP"; appId: string }
  | { type: "LOCK" }
  | { type: "UNLOCK" }
  | { type: "OPEN_OVERLAY"; overlay: IOSOverlay }
  | { type: "CLOSE_OVERLAY" }
  | { type: "SET_HOME_PAGE"; page: number };

export const IOS_SCENE_STORAGE_KEY = "ios-scene-state";

export interface InitialSceneOptions {
  /** Apps already "open" on arrival, most recent first, so the switcher has cards. */
  seedStack?: readonly string[];
  /** A deep-linked app (`/notes`), opened in front of the seed stack. */
  appId?: string;
}

/**
 * A visitor with no deep link lands in the App Switcher, which shows what is
 * open and how the phone is navigated. A deep link opens its app directly.
 */
export function createInitialSceneState({
  seedStack = [],
  appId,
}: InitialSceneOptions = {}): IOSSceneState {
  const stack = dedupe(appId ? [appId, ...seedStack] : [...seedStack]);
  return {
    mode: appId ? "app" : stack.length > 0 ? "switcher" : "home",
    stack,
    overlay: null,
    modeBeforeLock: "home",
    homePage: 0,
  };
}

export function getActiveAppId(state: IOSSceneState): string | null {
  return state.mode === "app" ? (state.stack[0] ?? null) : null;
}

function dedupe(ids: readonly string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

export function iosSceneReducer(state: IOSSceneState, action: IOSSceneAction): IOSSceneState {
  switch (action.type) {
    case "OPEN_APP":
      if (state.mode === "locked") return state;
      return {
        ...state,
        mode: "app",
        overlay: null,
        stack: [action.appId, ...state.stack.filter((id) => id !== action.appId)],
      };

    case "GO_HOME":
      if (state.mode === "locked") return state;
      return { ...state, mode: "home", overlay: null };

    case "OPEN_SWITCHER":
      // With nothing open the real switcher is empty and falls back to Home.
      if (state.mode === "locked") return state;
      return { ...state, mode: state.stack.length > 0 ? "switcher" : "home", overlay: null };

    case "CLOSE_APP": {
      if (!state.stack.includes(action.appId)) return state;
      const stack = state.stack.filter((id) => id !== action.appId);
      const wasFrontmost = state.mode === "app" && state.stack[0] === action.appId;
      const emptiedSwitcher = state.mode === "switcher" && stack.length === 0;
      return { ...state, stack, mode: wasFrontmost || emptiedSwitcher ? "home" : state.mode };
    }

    case "LOCK":
      if (state.mode === "locked") return state;
      return { ...state, mode: "locked", overlay: null, modeBeforeLock: state.mode };

    case "UNLOCK":
      if (state.mode !== "locked") return state;
      return { ...state, mode: state.modeBeforeLock, overlay: null };

    case "OPEN_OVERLAY":
      // Spotlight is pulled down from the Home Screen only.
      if (action.overlay === "spotlight" && state.mode !== "home") return state;
      return { ...state, overlay: action.overlay };

    case "CLOSE_OVERLAY":
      return state.overlay === null ? state : { ...state, overlay: null };

    case "SET_HOME_PAGE":
      return { ...state, homePage: Math.max(0, Math.floor(action.page)) };
  }
}

const MODES: readonly IOSMode[] = ["locked", "home", "app", "switcher"];

export function serializeSceneState(state: IOSSceneState): string {
  // Panels are momentary; a reload should not come back with one pulled down.
  return JSON.stringify({ ...state, overlay: null });
}

/**
 * Read back a persisted scene, dropping apps the registry no longer offers on
 * iOS. Returns null for anything that is not a scene, so the caller falls back
 * to a fresh one.
 */
export function parseSceneState(
  raw: string | null | undefined,
  validAppIds: readonly string[]
): IOSSceneState | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const value = parsed as Record<string, unknown>;
  if (!MODES.includes(value.mode as IOSMode) || !Array.isArray(value.stack)) return null;

  const stack = dedupe(
    value.stack.filter((id): id is string => typeof id === "string" && validAppIds.includes(id))
  );
  const modeBeforeLock =
    value.modeBeforeLock === "app" || value.modeBeforeLock === "switcher"
      ? value.modeBeforeLock
      : "home";
  const needsApp = (mode: IOSMode) => mode === "app" || mode === "switcher";
  const mode = value.mode as IOSMode;

  return {
    mode: needsApp(mode) && stack.length === 0 ? "home" : mode,
    stack,
    overlay: null,
    modeBeforeLock: needsApp(modeBeforeLock) && stack.length === 0 ? "home" : modeBeforeLock,
    homePage:
      typeof value.homePage === "number" && Number.isFinite(value.homePage)
        ? Math.max(0, Math.floor(value.homePage))
        : 0,
  };
}
