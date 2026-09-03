"use client";

import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { playlistHeaderHue } from "@/lib/spotify/format";
import type { SpotifyAudiobook } from "@/lib/spotify/types";
import { BookAudio, ExternalLink, Pause, Play } from "lucide-react";

interface AudiobookViewProps {
  audiobook: SpotifyAudiobook;
  playingUri: string | null;
  isPaused: boolean;
  onPlay: (uri: string) => void;
  isMobileView: boolean;
}

/**
 * Books are shown at book level, with no chapter list. Spotify only embeds the
 * show itself — individual chapter URIs return "Page not available" — so rows
 * per chapter would be listing things nobody could play. Playback loads the
 * show, which gives logged-out visitors Spotify's sample; the embed labels that
 * itself.
 */
export function AudiobookView({
  audiobook,
  playingUri,
  isPaused,
  onPlay,
  isMobileView,
}: AudiobookViewProps) {
  const hue = playlistHeaderHue(audiobook.id);
  const isCurrent = playingUri === audiobook.uri;
  const isPlaying = isCurrent && !isPaused;

  return (
    <ScrollArea className="h-full">
      <div
        style={{
          background: `linear-gradient(180deg, hsl(${hue} 42% 32%) 0%, hsl(${hue} 30% 18%) 40%, var(--spotify-surface) 100%)`,
        }}
      >
        <div className={cn("px-6 pt-6 pb-4", isMobileView && "px-4")}>
          <div
            className={cn(
              "flex gap-6 items-end",
              isMobileView && "flex-col items-center text-center"
            )}
          >
            <div
              className={cn(
                "relative flex-shrink-0 overflow-hidden shadow-2xl bg-[var(--spotify-surface-raised)]",
                isMobileView ? "w-40 h-40" : "w-[192px] h-[192px]"
              )}
            >
              {audiobook.coverArt ? (
                <Image
                  src={audiobook.coverArt}
                  alt={audiobook.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookAudio className="w-10 h-10 text-[var(--spotify-text-subdued)]" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end min-w-0 gap-2">
              <p className="text-xs font-semibold text-[var(--spotify-text)]">
                Audiobook
              </p>
              <h1
                className={cn(
                  "font-extrabold tracking-tight text-[var(--spotify-text)] break-words leading-[1.05]",
                  isMobileView ? "text-2xl" : "text-4xl"
                )}
              >
                {audiobook.name}
              </h1>
              <p className="text-sm text-[var(--spotify-text)]">
                {audiobook.author && (
                  <span className="font-semibold">{audiobook.author}</span>
                )}
                <span className="text-[var(--spotify-text-subdued)]">
                  {audiobook.author ? " · " : ""}
                  {audiobook.totalChapters} chapters
                  {audiobook.narrator && ` · Read by ${audiobook.narrator}`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("px-6 pb-6", isMobileView && "px-4")}>
        <div className="flex items-center gap-6 py-4">
          <button
            onClick={() => onPlay(audiobook.uri)}
            aria-label={`${isPlaying ? "Pause" : "Play"} ${audiobook.name}`}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--spotify-green)] text-black transition-transform can-hover:hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <a
            href={audiobook.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[var(--spotify-text-subdued)] transition-colors can-hover:hover:text-[var(--spotify-text)]"
          >
            <ExternalLink className="w-5 h-5" />
            Open in Spotify
          </a>
        </div>

        <p className="text-[13px] text-[var(--spotify-text-subdued)] mb-4">
          Spotify plays a sample here. Open it in Spotify to listen to the whole
          book.
        </p>

        {audiobook.description && (
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold mb-2 text-[var(--spotify-text)]">
              About
            </h2>
            <p className="text-sm leading-relaxed text-[var(--spotify-text-subdued)] whitespace-pre-line">
              {audiobook.description}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
