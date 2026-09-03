"use client";

import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatTotalDuration, totalPlaylistDuration } from "@/lib/spotify/format";
import type { SpotifyAudiobook, SpotifyPlaylist } from "@/lib/spotify/types";
import { BookAudio, ListMusic, Play } from "lucide-react";

interface HomeViewProps {
  playlists: SpotifyPlaylist[];
  audiobooks: SpotifyAudiobook[];
  onPlaylistSelect: (id: string) => void;
  onAudiobookSelect: (id: string) => void;
  isMobileView: boolean;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeView({
  playlists,
  audiobooks,
  onPlaylistSelect,
  onAudiobookSelect,
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
        <h1 className="text-3xl font-extrabold tracking-tight mb-5 text-[var(--spotify-text)]">
          {greeting()}
        </h1>

        {/* Quick-access tiles, the grid Spotify puts at the top of Home. */}
        <div
          className={cn(
            "grid gap-2 mb-8",
            isMobileView ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-4"
          )}
        >
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => onPlaylistSelect(playlist.id)}
              className="group flex items-center gap-3 h-[64px] rounded-md overflow-hidden text-left bg-[var(--spotify-surface-raised)] transition-colors can-hover:hover:bg-[var(--spotify-surface-hover)]"
            >
              <div className="relative w-16 h-16 shrink-0 bg-[var(--spotify-surface)]">
                {playlist.coverArt ? (
                  <Image
                    src={playlist.coverArt}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListMusic className="w-5 h-5 text-[var(--spotify-text-subdued)]" />
                  </div>
                )}
              </div>

              <span className="flex-1 min-w-0 pr-2 text-[15px] font-bold leading-tight text-[var(--spotify-text)] line-clamp-2">
                {playlist.name}
              </span>

              <span className="shrink-0 mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--spotify-green)] text-black opacity-0 translate-y-1 transition-all can-hover:group-hover:opacity-100 can-hover:group-hover:translate-y-0">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--spotify-text)]">
            Your playlists
          </h2>
          <span className="text-[13px] text-[var(--spotify-text-subdued)]">
            {playlists.length}{" "}
            {playlists.length === 1 ? "playlist" : "playlists"}
          </span>
        </div>

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
                {playlist.tracks.length} songs ·{" "}
                {formatTotalDuration(totalPlaylistDuration(playlist.tracks))}
              </p>
            </button>
          ))}
        </div>

        {audiobooks.length > 0 && (
          <>
            <div className="flex items-baseline justify-between mt-8 mb-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--spotify-text)]">
                Audiobooks
              </h2>
              <span className="text-[13px] text-[var(--spotify-text-subdued)]">
                {audiobooks.length} books
              </span>
            </div>

            <div
              className={cn(
                "grid gap-4",
                isMobileView
                  ? "grid-cols-2"
                  : "grid-cols-[repeat(auto-fill,minmax(160px,1fr))]"
              )}
            >
              {audiobooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => onAudiobookSelect(book.id)}
                  className="text-left group rounded-lg p-3 transition-colors bg-[var(--spotify-surface-raised)] can-hover:hover:bg-[var(--spotify-surface-hover)]"
                >
                  <div className="relative aspect-square w-full rounded-[4px] overflow-hidden bg-[var(--spotify-surface)] mb-3 shadow-lg">
                    {book.coverArt ? (
                      <Image
                        src={book.coverArt}
                        alt={book.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookAudio className="w-8 h-8 text-[var(--spotify-text-subdued)]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[15px] font-semibold truncate text-[var(--spotify-text)]">
                    {book.name}
                  </p>
                  <p className="text-[13px] text-[var(--spotify-text-subdued)] truncate">
                    {book.author || "Audiobook"}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
