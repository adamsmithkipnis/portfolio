"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { loadSpotifyState, saveSpotifyState } from "@/lib/sidebar-persistence";
import { useSpotifyEmbed } from "@/lib/spotify/use-spotify-embed";
import { SPOTIFY_AUDIOBOOKS, SPOTIFY_PLAYLISTS } from "@/lib/spotify/data";
import { findAudiobookById, findPlaylistById } from "@/lib/spotify/format";
import type { LibraryFilter, SpotifyView } from "@/lib/spotify/types";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { NowPlayingEmbed } from "./now-playing-embed";
import { AudiobookView, HomeView, PlaylistView, SearchView } from "./content-views";

interface AppProps {
  isDesktop?: boolean;
}

/** One entry in the back/forward stack. */
interface SpotifyLocation {
  view: SpotifyView;
  /** Playlist or audiobook id, depending on `view`. */
  itemId: string | null;
}

// Load once outside the component so the initial render already has the
// restored view rather than flashing the default.
const getInitialLocation = (): SpotifyLocation => {
  const saved = loadSpotifyState();
  return { view: saved.view, itemId: saved.playlistId };
};

export default function App({ isDesktop = false }: AppProps) {
  const [initialLocation] = useState(getInitialLocation);
  const [history, setHistory] = useState<SpotifyLocation[]>([initialLocation]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");

  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [showContent, setShowContent] = useState(
    initialLocation.view !== "home"
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();
  const inShell = !!(isDesktop && windowFocus);

  const { hostRef, state, requestedUri, failed, playTrack, togglePlay } =
    useSpotifyEmbed();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const location = history[historyIndex] ?? initialLocation;
  const { view: activeView, itemId: selectedItemId } = location;

  const handleTrackPlay = useCallback(
    (uri: string, index: number) => {
      setPlayingIndex(index);
      playTrack(uri);
    },
    [playTrack]
  );

  /** Starts a playlist from its first track, without navigating to it. */
  const handlePlaylistPlay = useCallback(
    (playlistId: string) => {
      const playlist = findPlaylistById(SPOTIFY_PLAYLISTS, playlistId);
      const firstUri = playlist?.tracks[0]?.uri;
      if (!firstUri) return;
      setPlayingIndex(0);
      playTrack(firstUri);
    },
    [playTrack]
  );

  // Mobile layout is determined by shell context, not viewport width
  useEffect(() => {
    setIsMobileView(!isDesktop);
    setIsLayoutInitialized(true);
  }, [isDesktop]);

  useEffect(() => {
    saveSpotifyState(activeView, selectedItemId);
  }, [activeView, selectedItemId]);

  /** Pushes a location, discarding anything ahead of the current entry. */
  const navigate = useCallback(
    (next: SpotifyLocation) => {
      setHistory((current) => {
        const trimmed = current.slice(0, historyIndex + 1);
        const last = trimmed[trimmed.length - 1];
        if (last && last.view === next.view && last.itemId === next.itemId) {
          return trimmed;
        }
        return [...trimmed, next];
      });
      setHistoryIndex((current) => {
        const last = history[current];
        if (last && last.view === next.view && last.itemId === next.itemId) {
          return current;
        }
        return current + 1;
      });
      setShowContent(true);
    },
    [history, historyIndex]
  );

  const handleViewSelect = useCallback(
    (view: SpotifyView, itemId?: string) => {
      setQuery("");
      navigate({ view, itemId: view === "home" ? null : (itemId ?? null) });
    },
    [navigate]
  );

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const goBack = useCallback(() => {
    setQuery("");
    setHistoryIndex((i) => Math.max(0, i - 1));
  }, []);
  const goForward = useCallback(() => {
    setQuery("");
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1));
  }, [history.length]);

  // Space toggles playback, matching the real client.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inShell && windowFocus && !windowFocus.isFocused) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inShell, windowFocus, togglePlay]);

  const selectedPlaylist = useMemo(
    () => findPlaylistById(SPOTIFY_PLAYLISTS, selectedItemId),
    [selectedItemId]
  );
  const selectedAudiobook = useMemo(
    () => findAudiobookById(SPOTIFY_AUDIOBOOKS, selectedItemId),
    [selectedItemId]
  );

  const isSearching = query.trim().length > 0;

  if (!isLayoutInitialized) {
    return <div className="spotify-app h-full bg-[var(--spotify-base)]" />;
  }

  const showSidebar = !isMobileView || !showContent;
  const showMainContent = !isMobileView || showContent;

  const renderContent = () => {
    if (isSearching) {
      return (
        <SearchView
          playlists={SPOTIFY_PLAYLISTS}
          audiobooks={SPOTIFY_AUDIOBOOKS}
          query={query}
          playingUri={state.playingUri}
          isPaused={state.isPaused}
          onTrackPlay={handleTrackPlay}
          onPlaylistSelect={(id) => handleViewSelect("playlist", id)}
          onAudiobookSelect={(id) => handleViewSelect("audiobook", id)}
          isMobileView={isMobileView}
        />
      );
    }

    if (activeView === "audiobook" && selectedAudiobook) {
      return (
        <AudiobookView
          audiobook={selectedAudiobook}
          playingUri={requestedUri}
          isPaused={state.isPaused}
          onPlay={(uri) => handleTrackPlay(uri, -1)}
          isMobileView={isMobileView}
        />
      );
    }

    if (activeView === "playlist" && selectedPlaylist) {
      return (
        <PlaylistView
          playlist={selectedPlaylist}
          playingUri={state.playingUri}
          playingIndex={playingIndex}
          isPaused={state.isPaused}
          onTrackPlay={handleTrackPlay}
          isMobileView={isMobileView}
        />
      );
    }

    return (
      <HomeView
        playlists={SPOTIFY_PLAYLISTS}
        audiobooks={SPOTIFY_AUDIOBOOKS}
        onPlaylistSelect={(id) => handleViewSelect("playlist", id)}
        onPlaylistPlay={handlePlaylistPlay}
        onAudiobookSelect={(id) => handleViewSelect("audiobook", id)}
        isMobileView={isMobileView}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      data-app="spotify"
      tabIndex={-1}
      onMouseDown={() => containerRef.current?.focus()}
      className="spotify-app h-full flex flex-col bg-[var(--spotify-base)] text-[var(--spotify-text)] outline-none overflow-hidden"
    >
      <TopBar
        isMobileView={isMobileView}
        isDesktop={isDesktop}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
        onHome={() => handleViewSelect("home")}
        isHome={activeView === "home" && !isSearching}
        query={query}
        onQueryChange={setQuery}
      />

      {/* Sidebar and content are separate rounded cards floating on the black
          base, with a gutter between them — Spotify's structural signature. */}
      <main
        className={cn(
          "flex-1 flex min-h-0 overflow-hidden px-2 pb-2",
          !isMobileView && "gap-2"
        )}
      >
        <div
          className={cn(
            "h-full flex-shrink-0 overflow-hidden rounded-lg",
            showSidebar
              ? isMobileView
                ? "block w-full"
                : "block w-[264px]"
              : "hidden"
          )}
        >
          <Sidebar
            playlists={SPOTIFY_PLAYLISTS}
            audiobooks={SPOTIFY_AUDIOBOOKS}
            activeView={isSearching ? "home" : activeView}
            selectedItemId={isSearching ? null : selectedItemId}
            filter={filter}
            onFilterChange={setFilter}
            onViewSelect={handleViewSelect}
            isMobileView={isMobileView}
          />
        </div>

        <div
          className={cn(
            "flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative rounded-lg bg-[var(--spotify-surface)]",
            showMainContent ? "block" : "hidden"
          )}
        >
          {renderContent()}
        </div>
      </main>

      <NowPlayingEmbed
        hostRef={hostRef}
        hasPlayed={state.playingUri !== null}
        failed={failed}
      />
    </div>
  );
}
