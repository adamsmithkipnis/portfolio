"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { siteConfig } from "@/config/site";
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
  // A playlist name is arbitrary user text and can be pathological — decorative
  // Unicode with stacked combining marks renders many times taller than normal
  // type, and unbounded it buries the cover art and pushes Play below the fold.
  // The heading keeps its full size and clamps to three lines, which is what
  // Spotify itself does. The hard clip matters as much as the clamp: combining
  // marks paint outside their line box, and line-clamp alone does not contain
  // them.
  // Display type is set tight, which is right for ordinary names. Names built
  // from stacked combining marks are much taller than their font size, so at
  // 1.05 the rows collide and the clip shears the glyphs. Give those names room
  // to breathe instead, which is how the real client renders this one.
  const combiningMarks = (playlist.name.match(/\p{M}/gu) ?? []).length;
  const titleLeading =
    combiningMarks > 20 ? "leading-[1.25]" : "leading-[1.05]";

  // Only badge the owner when the playlist is this site owner’s own — the
  // headshot would be wrong on somebody else’s playlist.
  const isOwnPlaylist =
    playlist.owner.trim().toLowerCase() ===
    siteConfig.name.trim().toLowerCase();

  const totalDuration = totalPlaylistDuration(playlist.tracks);
  const firstTrackUri = playlist.tracks[0]?.uri;
  const hue = playlistHeaderHue(playlist.id);

  // Spotify sheds table columns as the window narrows. The window is resizable
  // independently of the viewport, so measure the pane rather than the screen.
  const [paneWidth, setPaneWidth] = useState(0);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const readPaneWidth = useCallback(() => {
    const el = paneRef.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width;
    setPaneWidth((current) =>
      Math.abs(current - width) > 0.5 ? width : current,
    );
  }, []);

  // Measured two ways on purpose. A ResizeObserver mounted once in an effect
  // ended up watching a node React had replaced, so it stopped reporting and
  // every width-dependent choice froze at whatever the pane happened to
  // measure first. A callback ref re-attaches whenever the node changes, and
  // the window listener covers the case where the pane is resized by the
  // window manager without the observer firing.
  const measurePane = useCallback(
    (el: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      paneRef.current = el;
      if (!el) return;
      const observer = new ResizeObserver(() => readPaneWidth());
      observer.observe(el);
      observerRef.current = observer;
      readPaneWidth();
    },
    [readPaneWidth],
  );

  useEffect(() => {
    window.addEventListener("resize", readPaneWidth);
    const raf = requestAnimationFrame(readPaneWidth);
    return () => {
      window.removeEventListener("resize", readPaneWidth);
      cancelAnimationFrame(raf);
      observerRef.current?.disconnect();
    };
  }, [readPaneWidth]);

  // The desktop window resizes independently of the browser window, so poll
  // cheaply while it is being dragged rather than trusting a single signal.
  useEffect(() => {
    const id = window.setInterval(readPaneWidth, 250);
    return () => window.clearInterval(id);
  }, [readPaneWidth]);

  const showAlbum = !isMobileView && paneWidth >= 640;
  const showAddedDate = !isMobileView && paneWidth >= 800;

  // The real client sizes this heading inversely to the name: a short one fills
  // the header as display type, a long one steps down until it fits. Measured
  // against the desktop app, "Dog" sits near 96px while a 993-codepoint name
  // sits near 48px — about 2.3x, taken relative to the artwork. A length ladder
  // approximates their fit-to-width behaviour without measuring glyphs, and
  // drops a step on a narrow pane so a short name does not swamp a small window.
  // The real client shrinks this heading until the name fits rather than
  // wrapping it, so a narrow window gets small type on one line instead of a
  // broken word. Sizing by character count alone could not do that: it never
  // saw how much width was actually available, so at the minimum window a
  // 14-character name still rendered at 48px and broke into a widow.
  //
  // Fit is estimated from an average advance width rather than measured, which
  // is cheap and stable; the clamp and clip below cover an underestimate.
  // Slightly pessimistic on purpose: a name fitted onto one line cannot leave a
  // widow, so the estimate errs small rather than risking a wrap.
  const AVERAGE_GLYPH_EM = 0.62;
  const FIT_SAFETY = 0.97;
  /**
   * The real client steps this heading through a handful of discrete sizes
   * rather than scaling it continuously, which is why resizing its window shows
   * distinct states instead of type that creeps a pixel at a time. Fitting
   * picks the step; these are the steps.
   */
  const TITLE_STEPS_PX = [24, 32, 48, 72, 96] as const;
  const MAX_TITLE_PX = TITLE_STEPS_PX[TITLE_STEPS_PX.length - 1];
  const MIN_TITLE_PX = TITLE_STEPS_PX[0];

  /** Largest step that still fits, so a snap can never cause a wrap. */
  const snapToStep = (px: number) =>
    TITLE_STEPS_PX.reduce(
      (best, step) => (step <= px ? step : best),
      TITLE_STEPS_PX[0] as number,
    );
  /** Past this a name cannot fit at any readable size, so stop fitting it. */
  const FITTABLE_LENGTH = 30;

  const titleLength = [...playlist.name].length;

  // The artwork shrinks too, or at the minimum window it leaves the heading
  // almost no room. These mirror the real client stepping its art down.
  const artClass = isMobileView
    ? "w-40 h-40"
    : paneWidth === 0 || paneWidth >= 720
      ? "w-[232px] h-[232px]"
      : paneWidth >= 560
        ? "w-[192px] h-[192px]"
        : paneWidth >= 460
          ? "w-[160px] h-[160px]"
          : "w-[120px] h-[120px]";

  const artPx = isMobileView
    ? 160
    : paneWidth === 0 || paneWidth >= 720
      ? 232
      : paneWidth >= 560
        ? 192
        : paneWidth >= 460
          ? 160
          : 120;

  // pane minus the artwork, the gap beside it and the section padding
  const textWidthPx = Math.max(120, (paneWidth || 900) - artPx - 24 - 48);

  const titlePx =
    titleLength <= FITTABLE_LENGTH
      ? snapToStep(
          Math.min(
            MAX_TITLE_PX,
            Math.max(
              MIN_TITLE_PX,
              (textWidthPx * FIT_SAFETY) / (titleLength * AVERAGE_GLYPH_EM),
            ),
          ),
        )
      : // Too long to fit at a readable size: hold a display minimum and let the
        // clamp and clip contain it.
        paneWidth > 0 && paneWidth < 600
        ? 32
        : 48;

  return (
    <div ref={measurePane} className="h-full">
      <ScrollArea className="h-full">
        {/* Colour wash behind the header, the way Spotify tints from cover art */}
        <div
          style={{
            background: `linear-gradient(180deg, hsl(${hue} 20% 28%) 0%, hsl(${hue} 14% 17%) 40%, var(--spotify-surface) 100%)`,
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
                  artClass,
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

              <div className="flex w-0 flex-1 flex-col justify-end gap-2">
                <p className="text-xs font-semibold text-[var(--spotify-text)]">
                  Public Playlist
                </p>
                <h1
                  title={playlist.name}
                  style={{ fontSize: `${titlePx}px` }}
                  className={cn(
                    "font-extrabold tracking-tight text-[var(--spotify-text)] break-words overflow-hidden",
                    titleLeading,
                    titleLength <= FITTABLE_LENGTH
                      ? "line-clamp-2"
                      : "line-clamp-3",
                  )}
                >
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="text-sm text-[var(--spotify-text-subdued)] line-clamp-2">
                    {playlist.description}
                  </p>
                )}
                {/* Wraps between the name and the counts, never inside either:
                    at the minimum window the hyphen in a surname was being used
                    as a break opportunity. */}
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--spotify-text)]">
                  {isOwnPlaylist && (
                    <span className="relative inline-block h-6 w-6 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src="/headshot.jpg"
                        alt=""
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </span>
                  )}
                  {playlist.owner && (
                    <span className="font-semibold whitespace-nowrap">
                      {playlist.owner}
                    </span>
                  )}
                  <span className="whitespace-nowrap text-[var(--spotify-text-subdued)]">
                    {playlist.owner ? "· " : ""}
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
