"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookAudio, Library, ListMusic } from "lucide-react";
import type {
  LibraryFilter,
  SpotifyAudiobook,
  SpotifyPlaylist,
  SpotifyView,
} from "@/lib/spotify/types";

interface SidebarProps {
  playlists: SpotifyPlaylist[];
  audiobooks: SpotifyAudiobook[];
  activeView: SpotifyView;
  selectedItemId: string | null;
  filter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
  onViewSelect: (view: SpotifyView, itemId?: string) => void;
  isMobileView: boolean;
}

const FILTERS: { id: LibraryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "playlists", label: "Playlists" },
  { id: "audiobooks", label: "Audiobooks" },
];

export function Sidebar({
  playlists,
  audiobooks,
  activeView,
  selectedItemId,
  filter,
  onFilterChange,
  onViewSelect,
  isMobileView,
}: SidebarProps) {
  const showPlaylists = filter === "all" || filter === "playlists";
  const showAudiobooks = filter === "all" || filter === "audiobooks";

  return (
    <div className="flex flex-col h-full bg-[var(--spotify-surface)]">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 text-[var(--spotify-text-subdued)]">
        <Library className="w-6 h-6" />
        <span className="text-base font-bold">Your Library</span>
      </div>

      {/* These filter the list for real — the library now holds both kinds. */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={cn(
              "px-3 py-1 rounded-full text-[13px] transition-colors",
              filter === id
                ? "bg-[var(--spotify-text)] text-black font-medium"
                : "bg-[var(--spotify-surface-raised)] text-[var(--spotify-text)] can-hover:hover:bg-[var(--spotify-surface-hover)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className={cn("px-2 pb-2", isMobileView ? "w-full" : "w-[264px]")}>
            {showPlaylists &&
              playlists.map((playlist) => (
                <LibraryRow
                  key={playlist.id}
                  coverArt={playlist.coverArt}
                  title={playlist.name}
                  subtitle={`Playlist${playlist.owner ? ` · ${playlist.owner}` : ""}`}
                  fallbackIcon={
                    <ListMusic className="w-5 h-5 text-[var(--spotify-text-subdued)]" />
                  }
                  isActive={
                    activeView === "playlist" && selectedItemId === playlist.id
                  }
                  onClick={() => onViewSelect("playlist", playlist.id)}
                />
              ))}

            {showAudiobooks &&
              audiobooks.map((book) => (
                <LibraryRow
                  key={book.id}
                  coverArt={book.coverArt}
                  title={book.name}
                  subtitle={`Audiobook${book.author ? ` · ${book.author}` : ""}`}
                  fallbackIcon={
                    <BookAudio className="w-5 h-5 text-[var(--spotify-text-subdued)]" />
                  }
                  isActive={
                    activeView === "audiobook" && selectedItemId === book.id
                  }
                  onClick={() => onViewSelect("audiobook", book.id)}
                />
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function LibraryRow({
  coverArt,
  title,
  subtitle,
  fallbackIcon,
  isActive,
  onClick,
}: {
  coverArt: string;
  title: string;
  subtitle: string;
  fallbackIcon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
        isActive
          ? "bg-[var(--spotify-surface-hover)]"
          : "can-hover:hover:bg-[var(--spotify-surface-raised)]"
      )}
    >
      <div className="relative w-12 h-12 rounded-[4px] overflow-hidden bg-[var(--spotify-surface-raised)] flex-shrink-0">
        {coverArt ? (
          <Image src={coverArt} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {fallbackIcon}
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
          {title}
        </p>
        <p className="text-[13px] text-[var(--spotify-text-subdued)] truncate">
          {subtitle}
        </p>
      </div>
    </button>
  );
}
