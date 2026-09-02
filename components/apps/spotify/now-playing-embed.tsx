"use client";

import { cn } from "@/lib/utils";

interface NowPlayingEmbedProps {
  /** From useSpotifyEmbed — the controller replaces this element with its iframe. */
  hostRef: React.RefObject<HTMLDivElement>;
  hasPlayed: boolean;
  failed: boolean;
  isMobileView: boolean;
}

/**
 * Sits where macOS Spotify puts its now-playing bar, but the player inside is
 * Spotify's real embed rather than a reproduction. That is deliberate: it is
 * what makes actual playback possible, and Spotify's Developer Terms require
 * their player to be visible and unmodified. The iframe is built by
 * createController — never hand-write it, since dropping attributes like
 * allow="encrypted-media" forces the embed into preview-only mode.
 */
export function NowPlayingEmbed({
  hostRef,
  hasPlayed,
  failed,
  isMobileView,
}: NowPlayingEmbedProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-muted-foreground/20",
        isMobileView ? "bg-background" : "bg-muted"
      )}
    >
      <div className="relative min-h-[80px]">
        <div ref={hostRef} className="w-full" />

        {!hasPlayed && !failed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">
              Select a song to start playing
            </p>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <p className="text-sm text-muted-foreground text-center">
              Spotify&rsquo;s player could not be loaded. A content blocker or an
              offline connection will do this.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
