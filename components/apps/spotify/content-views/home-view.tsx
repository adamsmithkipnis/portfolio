"use client";

import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatTotalDuration, totalPlaylistDuration } from "@/lib/spotify/format";
import type { SpotifyPlaylist } from "@/lib/spotify/types";
import { ListMusic } from "lucide-react";

interface HomeViewProps {
  playlists: SpotifyPlaylist[];
  onPlaylistSelect: (id: string) => void;
  isMobileView: boolean;
}

export function HomeView({
  playlists,
  onPlaylistSelect,
  isMobileView,
}: HomeViewProps) {
  if (playlists.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <ListMusic className="w-8 h-8 mx-auto mb-3 text-[var(--spotify-text-subdued)]" />
          <p className="text-sm text-[var(--spotify-text-subdued)]">
            No playlists yet. Add them to the PLAYLISTS array in
            scripts/fetch-spotify-playlists.mjs and run{" "}
            <code className="font-mono">npm run spotify:fetch</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className={cn("px-6 py-6", isMobileView && "px-4")}>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-[var(--spotify-text)]">
          Good afternoon
        </h1>
        <p className="text-sm text-[var(--spotify-text-subdued)] mb-6">
          {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
        </p>

        <div
          className={cn(
            "grid gap-4",
            isMobileView
              ? "grid-cols-2"
              : "grid-cols-[repeat(auto-fill,minmax(160px,1fr))]"
          )}
        >
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onPlaylistSelect(playlist.id)}
              className="text-left group rounded-lg p-3 transition-colors bg-[var(--spotify-surface-raised)] can-hover:hover:bg-[var(--spotify-surface-hover)]"
            >
              <div className="relative aspect-square w-full rounded-[4px] overflow-hidden bg-[var(--spotify-surface)] mb-3 shadow-lg">
                {playlist.coverArt ? (
                  <Image
                    src={playlist.coverArt}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListMusic className="w-8 h-8 text-[var(--spotify-text-subdued)]" />
                  </div>
                )}
              </div>
              <p className="text-[15px] font-semibold truncate text-[var(--spotify-text)]">
                {playlist.name}
              </p>
              <p className="text-[13px] text-[var(--spotify-text-subdued)] truncate">
                {playlist.tracks.length} songs &middot;{" "}
                {formatTotalDuration(totalPlaylistDuration(playlist.tracks))}
              </p>
            </button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
