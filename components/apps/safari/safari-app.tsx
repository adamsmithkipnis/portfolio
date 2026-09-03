"use client";

import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { Toolbar } from "./toolbar";
import { FavoritesBar } from "./favorites-bar";
import { StartPage } from "./start-page";

interface SafariAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

/**
 * A browser that only ever shows its start page — which is the archived
 * smithkipnis.com, framed from our own origin.
 *
 * Nothing here renders the open web. That is not a shortcut: most sites send
 * X-Frame-Options and refuse framing outright, the live Squarespace site
 * included. Links leave instead, which is the whole point of the app.
 */
export function SafariApp({ isMobile = false, inShell = false }: SafariAppProps) {
  const isMobileView = isMobile;
  const isDesktop = inShell && !isMobileView;
  const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <Toolbar isMobileView={isMobileView} isDesktop={isDesktop} />
      <FavoritesBar isMobileView={isMobileView} onDragStart={nav.onDragStart} />
      <StartPage />
    </div>
  );
}
