"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useWindowFocus } from "@/lib/window-focus-context";
import { loadSpotifyState, saveSpotifyState } from "@/lib/sidebar-persistence";
import { useSpotifyEmbed } from "@/lib/spotify/use-spotify-embed";
import { SPOTIFY_PLAYLISTS } from "@/lib/spotify/data";
import { findPlaylistById } from "@/lib/spotify/format";
import type { SpotifyView } from "@/lib/spotify/types";
import { Sidebar } from "./sidebar";
import { Nav } from "./nav";
import { NowPlayingEmbed } from "./now-playing-embed";
import { HomeView, PlaylistView } from "./content-views";

interface AppProps {
  isDesktop?: boolean;
}

// Load once outside the component so the initial render already has the
// restored view rather than flashing the default.
const getInitialState = () => {
  const saved = loadSpotifyState();
  return {
    view: saved.view,
    playlistId: saved.playlistId,
    showContent: saved.view !== "home",
  };
};

export default function App({ isDesktop = false }: AppProps) {
  const [initialState] = useState(getInitialState);
  const [activeView, setActiveView] = useState<SpotifyView>(initialState.view);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    initialState.playlistId
  );
  const [isMobileView, setIsMobileView] = useState(false);
  const [isLayoutInitialized, setIsLayoutInitialized] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showContent, setShowContent] = useState(initialState.showContent);

  const containerRef = useRef<HTMLDivElement>(null);
  const windowFocus = useWindowFocus();
  const inShell = !!(isDesktop && windowFocus);

  const { hostRef, state, failed, playTrack, togglePlay } = useSpotifyEmbed();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

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

  const handleViewSelect = useCallback((view: SpotifyView, playlistId?: string) => {
    setActiveView(view);
    setSelectedPlaylistId(view === "playlist" && playlistId ? playlistId : null);
    setShowContent(true);
  }, []);

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

  const selectedPlaylist = findPlaylistById(SPOTIFY_PLAYLISTS, selectedPlaylistId);

  if (!isLayoutInitialized) {
    return <div className="h-full bg-background" />;
  }

  const showSidebar = !isMobileView || !showContent;
  const showMainContent = !isMobileView || showContent;

  const renderContent = () => {
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
      className="spotify-app h-full flex flex-col bg-background text-foreground outline-none overflow-hidden"
    >
      <main className="flex-1 flex min-h-0 overflow-hidden">
        <div
          className={cn(
            "h-full flex-shrink-0 overflow-hidden",
            showSidebar
              ? isMobileView
                ? "block w-full"
                : "block w-[220px] border-r dark:border-foreground/20"
              : "hidden"
          )}
        >
          <Sidebar
            playlists={SPOTIFY_PLAYLISTS}
            activeView={activeView}
            selectedPlaylistId={selectedPlaylistId}
            onViewSelect={handleViewSelect}
            isMobileView={isMobileView}
            onScroll={setIsScrolled}
          >
            <Nav
              isMobileView={isMobileView}
              isScrolled={isScrolled}
              isDesktop={isDesktop}
            />
          </Sidebar>
        </div>

        <div
          className={cn(
            "flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative",
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
        isMobileView={isMobileView}
      />
    </div>
  );
}
