"use client";

import App from "./app";

interface SpotifyAppProps {
  isMobile?: boolean;
}

export function SpotifyApp({ isMobile = false }: SpotifyAppProps) {
  return (
    <div className="h-full w-full overflow-hidden">
      <App isDesktop={!isMobile} />
    </div>
  );
}
