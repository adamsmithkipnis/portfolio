"use client";

import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { Toolbar } from "./toolbar";
import { FavoritesBar } from "./favorites-bar";
import { BrowserFrame } from "./browser-frame";
import { useArchiveHistory } from "./use-archive-history";

interface SafariAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

/**
 * A browser over the archived smithkipnis.com.
 *
 * It really browses: links between archived pages load in the frame, back and
 * forward walk our own session history, and the address bar tracks wherever
 * you land. Links that leave the archive open a real browser tab instead —
 * nothing here renders the open web, since most sites refuse framing.
 */
export function SafariApp({ isMobile = false, inShell = false }: SafariAppProps) {
  const isMobileView = isMobile;
  const isDesktop = inShell && !isMobileView;
  const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });
  const history = useArchiveHistory();

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <Toolbar
        isMobileView={isMobileView}
        isDesktop={isDesktop}
        path={history.current}
        canGoBack={history.canGoBack}
        canGoForward={history.canGoForward}
        onBack={history.back}
        onForward={history.forward}
        onNavigate={history.go}
      />
      <FavoritesBar
        isMobileView={isMobileView}
        onDragStart={nav.onDragStart}
        path={history.current}
        onNavigate={history.go}
      />
      <BrowserFrame src={history.current} onNavigate={history.visited} />
    </div>
  );
}
