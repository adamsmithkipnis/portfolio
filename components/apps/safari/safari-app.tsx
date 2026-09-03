"use client";

import { Toolbar } from "./toolbar";
import { StartPage } from "./start-page";

interface SafariAppProps {
  isMobile?: boolean;
  inShell?: boolean;
}

/**
 * A browser that only ever shows its start page. The favorites are real
 * anchors to real sites, so linking somewhere external costs a config entry
 * rather than a simulated page — and nothing here tries to render the open
 * web (most sites refuse framing anyway).
 */
export function SafariApp({ isMobile = false, inShell = false }: SafariAppProps) {
  const isMobileView = isMobile;

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      <Toolbar isMobileView={isMobileView} isDesktop={inShell && !isMobileView} />
      <StartPage isMobileView={isMobileView} />
    </div>
  );
}
