"use client";

import App from "./app";

interface ClaudeAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  /**
   * Supplied by the shell. Claude asks the desktop to open other apps through
   * this, never by importing them (see layer discipline in AGENTS.md).
   */
  onOpenApp?: (appId: string, target?: string) => void;
}

export function ClaudeApp({ isMobile = false, inShell = false, onOpenApp }: ClaudeAppProps) {
  return (
    // data-ph-mask keeps visitor-typed chat out of posthog session replay.
    <div className="claude-app h-full w-full overflow-hidden" data-ph-mask>
      <App isDesktop={!isMobile} inShell={inShell} onOpenApp={onOpenApp} />
    </div>
  );
}
