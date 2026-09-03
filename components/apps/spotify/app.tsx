"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { loadSpotifyState, saveSpotifyState } from "@/lib/sidebar-persistence";
import { useSpotifyEmbed } from "@/lib/spotify/use-spotify-embed";
import { SPOTIFY_PLAYLISTS } from "@/lib/spotify/data";
import { findPlaylistById } from "@/lib/spotify/format";
import type { SpotifyView } from "@/lib/spotify/types";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { NowPlayingEmbed } from "./now-playing-embed";
import { HomeView, PlaylistView, SearchView } from "./content-views";

interface AppProps {
  isDesktop?: boolean;
}

/** One entry in the back/forward stack. */
interface SpotifyLocation {
  view: SpotifyView;
  playlistId: string | null;
}

// Load once outside the component so the initial render already has the
// restored view rather than flashing the default.
const getInitialLocation = (): SpotifyLocation => {
  const saved = loadSpotifyState();
  return { view: saved.view, playlistId: saved.playlistId };
};

export default function App({ isDesktop = false }: AppProps) {
  const [initialLocation] = useState(getInitialLocation);
  const [history, setHistory] = useState<SpotifyLocation[]>([initialLocation]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [query, setQuery] = useState("");

  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [showContent, setShowContent] = useState(
    initialLocation.view !== "home"
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();
  const inShell = !!(isDesktop && windowFocus);

  const { hostRef, state, failed, playTrack, togglePlay } = useSpotifyEmbed();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const location = history[historyIndex] ?? initialLocation;
  const { view: activeView, playlistId: selectedPlaylistId } = location;

  const handleTrackPlay = useCallback(
    (uri: string, index: number) => {
      setPlayingIndex(index);
      playTrack(uri);
    },
    [playTrack]
  );

  // Mobile layout is determined by shell context, not viewport width
  useEffect(() => {
    setIsMobileView(!isDesktop);
    setIsLayoutInitialized(true);
  }, [isDesktop]);

  useEffect(() => {
    saveSpotifyState(activeView, selectedPlaylistId);
  }, [activeView, selectedPlaylistId]);

  /** Pushes a location, discarding anything ahead of the current entry. */
  const navigate = useCallback(
    (next: SpotifyLocation) => {
      setHistory((current) => {
        const trimmed = current.slice(0, historyIndex + 1);
        const last = trimmed[trimmed.length - 1];
        if (last && last.view === next.view && last.playlistId === next.playlistId) {
          return trimmed;
        }
        return [...trimmed, next];
      });
      setHistoryIndex((current) => {
        const last = history[current];
        if (last && last.view === next.view && last.playlistId === next.playlistId) {
          return current;
        }
        return current + 1;
      });
      setShowContent(true);
    },
    [history, historyIndex]
  );

  const handleViewSelect = useCallback(
    (view: SpotifyView, playlistId?: string) => {
      setQuery("");
      navigate({
        view,
        playlistId: view === "playlist" && playlistId ? playlistId : null,
      });
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
    () => findPlaylistById(SPOTIFY_PLAYLISTS, selectedPlaylistId),
    [selectedPlaylistId]
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
          query={query}
          playingUri={state.playingUri}
          isPaused={state.isPaused}
          onTrackPlay={handleTrackPlay}
          onPlaylistSelect={(id) => handleViewSelect("playlist", id)}
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
        onPlaylistSelect={(id) => handleViewSelect("playlist", id)}
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
            activeView={isSearching ? "home" : activeView}
            selectedPlaylistId={isSearching ? null : selectedPlaylistId}
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
