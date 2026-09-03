"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/spotify/format";
import type { SpotifyAudiobook, SpotifyPlaylist } from "@/lib/spotify/types";
import { BookAudio, ListMusic, Pause, Play } from "lucide-react";

const MAX_TRACK_RESULTS = 60;

interface SearchViewProps {
  playlists: SpotifyPlaylist[];
  audiobooks: SpotifyAudiobook[];
  query: string;
  playingUri: string | null;
  isPaused: boolean;
  onTrackPlay: (uri: string, index: number) => void;
  onPlaylistSelect: (id: string) => void;
  onAudiobookSelect: (id: string) => void;
  isMobileView: boolean;
}

export function SearchView({
  playlists,
  audiobooks,
  query,
  playingUri,
  isPaused,
  onTrackPlay,
  onPlaylistSelect,
  onAudiobookSelect,
  isMobileView,
}: SearchViewProps) {
  const needle = query.trim().toLowerCase();

  const matchedBooks = useMemo(() => {
    if (!needle) return [];
    return audiobooks.filter(
      (book) =>
        book.name.toLowerCase().includes(needle) ||
        book.author.toLowerCase().includes(needle)
    );
  }, [needle, audiobooks]);

  const { matchedPlaylists, matchedTracks, totalTrackMatches } = useMemo(() => {
    if (!needle) {
      return { matchedPlaylists: [], matchedTracks: [], totalTrackMatches: 0 };
    }

    const playlistHits = playlists.filter((playlist) =>
      playlist.name.toLowerCase().includes(needle)
    );

    const trackHits: {
      key: string;
      uri: string;
      name: string;
      artists: string;
      albumArt: string;
      durationMs: number;
      explicit: boolean;
      playlistName: string;
      indexInPlaylist: number;
    }[] = [];

    for (const playlist of playlists) {
      playlist.tracks.forEach((track, index) => {
        if (
          track.name.toLowerCase().includes(needle) ||
          track.artists.toLowerCase().includes(needle)
        ) {
          trackHits.push({
            key: `${playlist.id}-${track.id}-${index}`,
            uri: track.uri,
            name: track.name,
            artists: track.artists,
            albumArt: track.albumArt,
            durationMs: track.durationMs,
            explicit: track.explicit,
            playlistName: playlist.name,
            indexInPlaylist: index,
          });
        }
      });
    }

    return {
      matchedPlaylists: playlistHits,
      matchedTracks: trackHits.slice(0, MAX_TRACK_RESULTS),
      totalTrackMatches: trackHits.length,
    };
  }, [needle, playlists]);

  const hasResults =
    matchedPlaylists.length > 0 ||
    matchedTracks.length > 0 ||
    matchedBooks.length > 0;

  return (
    <ScrollArea className="h-full">
      <div className={cn("px-6 py-6", isMobileView && "px-4")}>
        {!hasResults ? (
          <div className="py-16 text-center">
            <p className="text-lg font-bold text-[var(--spotify-text)]">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
            <p className="mt-2 text-sm text-[var(--spotify-text-subdued)]">
              Try a different song, artist, or playlist name.
            </p>
          </div>
        ) : (
          <>
            {matchedPlaylists.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-[var(--spotify-text)]">
                  Playlists
                </h2>
                <div
                  className={cn(
                    "grid gap-4",
                    isMobileView
                      ? "grid-cols-2"
                      : "grid-cols-[repeat(auto-fill,minmax(160px,1fr))]"
                  )}
                >
                  {matchedPlaylists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => onPlaylistSelect(playlist.id)}
                      className="text-left group rounded-lg p-3 transition-colors bg-[var(--spotify-surface-raised)] can-hover:hover:bg-[var(--spotify-surface-hover)]"
                    >
                      <div className="relative aspect-square w-full rounded-[4px] overflow-hidden bg-[var(--spotify-surface)] mb-3 shadow-lg">
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
                            <ListMusic className="w-8 h-8 text-[var(--spotify-text-subdued)]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[15px] font-semibold truncate text-[var(--spotify-text)]">
                        {playlist.name}
                      </p>
                      <p className="text-[13px] text-[var(--spotify-text-subdued)] truncate">
                        {playlist.tracks.length} songs
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {matchedBooks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-[var(--spotify-text)]">
                  Audiobooks
                </h2>
                <div
                  className={cn(
                    "grid gap-4",
                    isMobileView
                      ? "grid-cols-2"
                      : "grid-cols-[repeat(auto-fill,minmax(160px,1fr))]"
                  )}
                >
                  {matchedBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => onAudiobookSelect(book.id)}
                      className="text-left group rounded-lg p-3 transition-colors bg-[var(--spotify-surface-raised)] can-hover:hover:bg-[var(--spotify-surface-hover)]"
                    >
                      <div className="relative aspect-square w-full rounded-[4px] overflow-hidden bg-[var(--spotify-surface)] mb-3 shadow-lg">
                        {book.coverArt ? (
                          <Image
                            src={book.coverArt}
                            alt=""
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
              </section>
            )}

            {matchedTracks.length > 0 && (
              <section>
                <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-[var(--spotify-text)]">
                  Songs
                </h2>
                <div>
                  {matchedTracks.map((track) => {
                    const isCurrentTrack = playingUri === track.uri;
                    const isPlaying = isCurrentTrack && !isPaused;

                    return (
                      <div
                        key={track.key}
                        onClick={() =>
                          onTrackPlay(track.uri, track.indexInPlaylist)
                        }
                        className="flex items-center gap-4 px-4 py-2 rounded-md cursor-pointer group can-hover:hover:bg-[var(--spotify-surface-hover)]"
                      >
                        <span
                          className={cn(
                            "w-4 flex justify-center",
                            isCurrentTrack
                              ? "text-[var(--spotify-green)]"
                              : "text-[var(--spotify-text-subdued)]"
                          )}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current opacity-0 can-hover:group-hover:opacity-100" />
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
                                : "text-[var(--spotify-text)]"
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

                        {!isMobileView && (
                          <span className="w-[150px] shrink-0 text-[13px] text-[var(--spotify-text-subdued)] truncate">
                            {track.playlistName}
                          </span>
                        )}

                        <span className="w-12 shrink-0 text-right text-[13px] text-[var(--spotify-text-subdued)] tabular-nums">
                          {formatDuration(track.durationMs)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {totalTrackMatches > matchedTracks.length && (
                  <p className="mt-4 px-4 text-[13px] text-[var(--spotify-text-subdued)]">
                    Showing {matchedTracks.length} of {totalTrackMatches} matching
                    songs. Keep typing to narrow it down.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
