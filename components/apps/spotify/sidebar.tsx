"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, ListMusic } from "lucide-react";
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
    <div
      className={cn(
        "flex flex-col h-full",
        isMobileView ? "bg-background" : "bg-muted"
      )}
    >
      {children}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full"
          onScrollCapture={(e) => {
            const target = e.target as HTMLElement;
            onScroll?.(target.scrollTop > 0);
          }}
        >
          <div className={cn("px-2 py-2", isMobileView ? "w-full" : "w-[220px]")}>
            <div className="mb-4">
              <SidebarItem
                icon={<Home className="w-4 h-4" />}
                label="Home"
                isActive={activeView === "home"}
                onClick={() => onViewSelect("home")}
                isMobileView={isMobileView}
              />
            </div>

            {playlists.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground px-3 py-1 font-semibold uppercase tracking-wide">
                  Playlists
                </p>
                {playlists.map((playlist) => (
                  <SidebarItem
                    key={playlist.id}
                    icon={<ListMusic className="w-4 h-4" />}
                    label={playlist.name}
                    isActive={
                      activeView === "playlist" && selectedPlaylistId === playlist.id
                    }
                    onClick={() => onViewSelect("playlist", playlist.id)}
                    isMobileView={isMobileView}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  isActive,
  onClick,
  isMobileView,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isMobileView: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
        isActive && !isMobileView
          ? "bg-[#0A7CFF] text-white"
          : "text-foreground",
        isMobileView && "py-3"
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
