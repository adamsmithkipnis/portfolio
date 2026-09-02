"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Library, ListMusic } from "lucide-react";
import type { SpotifyPlaylist, SpotifyView } from "@/lib/spotify/types";

interface SidebarProps {
  children: React.ReactNode;
  playlists: SpotifyPlaylist[];
  activeView: SpotifyView;
  selectedPlaylistId: string | null;
  onViewSelect: (view: SpotifyView, playlistId?: string) => void;
  isMobileView: boolean;
  onScroll?: (isScrolled: boolean) => void;
}

export function Sidebar({
  children,
  playlists,
  activeView,
  selectedPlaylistId,
  onViewSelect,
  isMobileView,
  onScroll,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--spotify-base)]">
      {children}

      <button
        onClick={() => onViewSelect("home")}
        className={cn(
          "flex items-center gap-4 px-5 py-2 text-sm font-bold transition-colors",
          activeView === "home"
            ? "text-[var(--spotify-text)]"
            : "text-[var(--spotify-text-subdued)] can-hover:hover:text-[var(--spotify-text)]"
        )}
      >
        <Home className="w-6 h-6" />
        Home
      </button>

      <div className="flex items-center gap-4 px-5 pt-3 pb-2 text-sm font-bold text-[var(--spotify-text-subdued)]">
        <Library className="w-6 h-6" />
        Your Library
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full"
          onScrollCapture={(e) => {
            const target = e.target as HTMLElement;
            onScroll?.(target.scrollTop > 0);
          }}
        >
          <div className={cn("px-2 pb-2", isMobileView ? "w-full" : "w-[264px]")}>
            {playlists.map((playlist) => {
              const isActive =
                activeView === "playlist" && selectedPlaylistId === playlist.id;

              return (
                <button
                  key={playlist.id}
                  onClick={() => onViewSelect("playlist", playlist.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                    isActive
                      ? "bg-[var(--spotify-surface-hover)]"
                      : "can-hover:hover:bg-[var(--spotify-surface-raised)]"
                  )}
                >
                  <div className="relative w-12 h-12 rounded-[4px] overflow-hidden bg-[var(--spotify-surface-raised)] flex-shrink-0">
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

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[15px] truncate",
                        isActive
                          ? "text-[var(--spotify-green)]"
                          : "text-[var(--spotify-text)]"
                      )}
                    >
                      {playlist.name}
                    </p>
                    <p className="text-[13px] text-[var(--spotify-text-subdued)] truncate">
                      Playlist{playlist.owner ? ` · ${playlist.owner}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
