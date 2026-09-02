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
          <ListMusic className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
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
        <h1 className="text-2xl font-bold mb-1">Good afternoon</h1>
        <p className="text-sm text-muted-foreground mb-6">
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
              className="text-left group"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted mb-2 shadow-sm">
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
                    <ListMusic className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium truncate">{playlist.name}</p>
              <p className="text-xs text-muted-foreground truncate">
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
