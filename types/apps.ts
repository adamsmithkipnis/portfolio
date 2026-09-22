import { Position, Size } from "./window";

export interface AppMobilePolicy {
  supported?: boolean; // defaults to true
  shellFallbackAppId?: string; // fallback app when unsupported on mobile
  directRouteRedirectTo?: string; // defaults to "/"
  showInFinderApplications?: boolean; // defaults to true
}

export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  provenance: {
    agent: string;
    circa: string;
  };
  accentColor: string;
  defaultPosition: Position;
  defaultSize: Size;
  minSize: Size;
  menuBarTitle: string;
  showOnDockByDefault?: boolean; // defaults to true if not specified
  /**
   * The dock draws this app with a live component rather than its `icon`, the
   * way macOS Calendar shows the current date. The icon file is still used
   * everywhere else — Finder, the About dialog — so it stays in the registry.
   * This only tells the dock not to draw it, and tells the preloads in
   * app/page.tsx not to fetch an image the dock will never render.
   */
  drawsOwnDockIcon?: boolean; // defaults to false
  showInFinderApplications?: boolean; // defaults to true if not specified
  mobile?: AppMobilePolicy;
  multiWindow?: boolean; // defaults to false - allows multiple windows per app
  cascadeOffset?: number; // offset for cascading new windows (default 30)
}
