"use client";

import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  formatDuration,
  formatTotalDuration,
  totalPlaylistDuration,
} from "@/lib/spotify/format";
import type { SpotifyPlaylist } from "@/lib/spotify/types";
import { ExternalLink, ListMusic, Pause, Play } from "lucide-react";

interface PlaylistViewProps {
  playlist: SpotifyPlaylist;
  playingUri: string | null;
  /** Row index of the playing track. A playlist may list the same track twice. */
  playingIndex: number | null;
  isPaused: boolean;
  onTrackPlay: (uri: string, index: number) => void;
  isMobileView: boolean;
}

export function PlaylistView({
  playlist,
  playingUri,
  playingIndex,
  isPaused,
  onTrackPlay,
  isMobileView,
}: PlaylistViewProps) {
  const totalDuration = totalPlaylistDuration(playlist.tracks);
  const firstTrackUri = playlist.tracks[0]?.uri;

  return (
    <ScrollArea className="h-full">
      <div className={cn("p-6", isMobileView && "p-4")}>
        <div
          className={cn(
            "flex gap-6 mb-6",
            isMobileView && "flex-col items-center text-center"
          )}
        >
          <div
            className={cn(
              "relative flex-shrink-0 rounded-lg overflow-hidden shadow-xl bg-muted",
              isMobileView ? "w-48 h-48" : "w-56 h-56"
            )}
          >
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
                <ListMusic className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Playlist
            </p>
            <h1 className="text-2xl font-bold mb-2 break-words">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {playlist.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {playlist.owner && `${playlist.owner} · `}
              {playlist.tracks.length} songs, {formatTotalDuration(totalDuration)}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => firstTrackUri && onTrackPlay(firstTrackUri, 0)}
                disabled={!firstTrackUri}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A7CFF] text-white text-sm font-medium transition-opacity can-hover:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="w-4 h-4" />
                Play
              </button>
              <a
                href={playlist.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors can-hover:hover:text-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Spotify
              </a>
            </div>
          </div>
        </div>

        <div>
          {!isMobileView && (
            <div className="flex items-center gap-3 px-2 py-2 border-b border-muted-foreground/20 text-xs text-muted-foreground uppercase tracking-wide">
              <span className="w-5 text-center">#</span>
              <span className="w-10" />
              <span className="w-0 flex-1">Title</span>
              <span className="w-[150px]">Album</span>
              <span className="w-12 text-right">Time</span>
            </div>
          )}

          <div className="space-y-1 mt-1">
            {playlist.tracks.map((track, index) => {
              // Match on index too: a playlist can list the same track more
              // than once, and only the row that was clicked should light up.
              const isCurrentTrack =
                playingUri === track.uri && playingIndex === index;
              const isPlaying = isCurrentTrack && !isPaused;

              return (
                <div
                  key={`${track.id}-${index}`}
                  onClick={() => onTrackPlay(track.uri, index)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors group overflow-hidden",
                    isCurrentTrack
                      ? "bg-[#0A7CFF]/10"
                      : "can-hover:hover:bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "w-5 text-center text-sm",
                      isCurrentTrack ? "text-[#0A7CFF]" : "text-muted-foreground"
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 mx-auto" />
                    ) : (
                      <>
                        <span className="can-hover:group-hover:hidden">
                          {index + 1}
                        </span>
                        <Play className="w-4 h-4 mx-auto hidden can-hover:group-hover:block" />
                      </>
                    )}
                  </span>

                  <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {track.albumArt && (
                      <Image
                        src={track.albumArt}
                        alt={track.album}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>

                  <div className="w-0 flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        isCurrentTrack && "text-[#0A7CFF] font-medium"
                      )}
                    >
                      {track.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artists}
                    </p>
                  </div>

                  {!isMobileView && (
                    <span className="w-[150px] shrink-0 text-xs text-muted-foreground truncate">
                      {track.album}
                    </span>
                  )}

                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {formatDuration(track.durationMs)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
