"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  formatAddedDate,
  formatDuration,
  formatTotalDuration,
  playlistHeaderHue,
  totalPlaylistDuration,
} from "@/lib/spotify/format";
import type { SpotifyPlaylist } from "@/lib/spotify/types";
import { Clock, ExternalLink, ListMusic, Pause, Play } from "lucide-react";

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
  const hue = playlistHeaderHue(playlist.id);

  // Spotify sheds table columns as the window narrows. The window is resizable
  // independently of the viewport, so measure the pane rather than the screen.
  const containerRef = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setPaneWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const showAlbum = !isMobileView && paneWidth >= 640;
  const showAddedDate = !isMobileView && paneWidth >= 800;

  return (
    <div ref={containerRef} className="h-full">
      <ScrollArea className="h-full">
        {/* Colour wash behind the header, the way Spotify tints from cover art */}
        <div
          style={{
            background: `linear-gradient(180deg, hsl(${hue} 42% 32%) 0%, hsl(${hue} 30% 18%) 40%, var(--spotify-surface) 100%)`,
          }}
        >
          <div className={cn("px-6 pt-6 pb-4", isMobileView && "px-4")}>
            <div
              className={cn(
                "flex gap-6 items-end",
                isMobileView && "flex-col items-center text-center",
              )}
            >
              <div
                className={cn(
                  "relative flex-shrink-0 overflow-hidden shadow-2xl bg-[var(--spotify-surface-raised)]",
                  isMobileView ? "w-40 h-40" : "w-[192px] h-[192px]",
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
                    <ListMusic className="w-10 h-10 text-[var(--spotify-text-subdued)]" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end min-w-0 gap-2">
                <p className="text-xs font-semibold text-[var(--spotify-text)]">
                  Public Playlist
                </p>
                <h1
                  className={cn(
                    "font-extrabold tracking-tight text-[var(--spotify-text)] break-words leading-[1.05]",
                    isMobileView ? "text-3xl" : "text-5xl",
                  )}
                >
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="text-sm text-[var(--spotify-text-subdued)] line-clamp-2">
                    {playlist.description}
                  </p>
                )}
                <p className="text-sm text-[var(--spotify-text)]">
                  {playlist.owner && (
                    <span className="font-semibold">{playlist.owner}</span>
                  )}
                  <span className="text-[var(--spotify-text-subdued)]">
                    {playlist.owner ? " · " : ""}
                    {playlist.tracks.length} songs,{" "}
                    {formatTotalDuration(totalDuration)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("px-6 pb-6", isMobileView && "px-4")}>
          <div className="flex items-center gap-6 py-4">
            <button
              onClick={() => firstTrackUri && onTrackPlay(firstTrackUri, 0)}
              disabled={!firstTrackUri}
              aria-label={`Play ${playlist.name}`}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--spotify-green)] text-black transition-transform can-hover:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>

            <a
              href={playlist.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--spotify-text-subdued)] transition-colors can-hover:hover:text-[var(--spotify-text)]"
            >
              <ExternalLink className="w-5 h-5" />
              Open in Spotify
            </a>
          </div>

          {!isMobileView && (
            <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--spotify-divider)] text-[13px] text-[var(--spotify-text-subdued)]">
              <span className="w-4 text-right">#</span>
              <span className="w-10" />
              <span className="w-0 flex-1">Title</span>
              {showAlbum && <span className="w-[150px] shrink-0">Album</span>}
              {showAddedDate && (
                <span className="w-[110px] shrink-0">Date added</span>
              )}
              <span className="w-12 shrink-0 flex justify-end">
                <Clock className="w-4 h-4" />
              </span>
            </div>
          )}

          <div className="mt-2">
            {playlist.tracks.map((track, index) => {
              // Match on index too: a playlist can list the same track more than
              // once, and only the row that was clicked should light up.
              const isCurrentTrack =
                playingUri === track.uri && playingIndex === index;
              const isPlaying = isCurrentTrack && !isPaused;

              return (
                <div
                  key={`${track.id}-${index}`}
                  onClick={() => onTrackPlay(track.uri, index)}
                  className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer group can-hover:hover:bg-[var(--spotify-surface-hover)]"
                >
                  <span
                    className={cn(
                      "w-4 text-right text-sm tabular-nums",
                      isCurrentTrack
                        ? "text-[var(--spotify-green)]"
                        : "text-[var(--spotify-text-subdued)]",
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <>
                        <span className="can-hover:group-hover:hidden">
                          {index + 1}
                        </span>
                        <Play className="w-4 h-4 fill-current hidden can-hover:group-hover:block text-[var(--spotify-text)]" />
                      </>
                    )}
                  </span>

                  <div className="relative w-10 h-10 rounded-[4px] overflow-hidden bg-[var(--spotify-surface-raised)] flex-shrink-0">
                    {track.albumArt && (
                      <Image
                        src={track.albumArt}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>

                  <div className="w-0 flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-[15px] truncate",
                        isCurrentTrack
                          ? "text-[var(--spotify-green)]"
                          : "text-[var(--spotify-text)]",
                      )}
                    >
                      {track.name}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-[var(--spotify-text-subdued)]">
                      {track.explicit && (
                        <span
                          aria-label="Explicit"
                          title="Explicit"
                          className="shrink-0 rounded-[2px] bg-[var(--spotify-text-subdued)] px-1 text-[9px] font-bold leading-[14px] text-black"
                        >
                          E
                        </span>
                      )}
                      <span className="truncate">{track.artists}</span>
                    </p>
                  </div>

                  {showAlbum && (
                    <span className="w-[150px] shrink-0 text-[13px] text-[var(--spotify-text-subdued)] truncate">
                      {track.album}
                    </span>
                  )}
                  {showAddedDate && (
                    <span className="w-[110px] shrink-0 text-[13px] text-[var(--spotify-text-subdued)] truncate">
                      {formatAddedDate(track.addedAt)}
                    </span>
                  )}

                  <span className="w-12 shrink-0 text-right text-[13px] text-[var(--spotify-text-subdued)] tabular-nums">
                    {formatDuration(track.durationMs)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
