"use client";

import { useCallback, useEffect, useState } from "react";
import { getLocalFinderFiles, HOME_DIR, type LocalFinderItem } from "@/lib/file-route-utils";
import { TEXTEDIT_DOCUMENTS_CHANGED_EVENT } from "@/lib/file-storage";
import { getPreviewMetadataFromPath } from "@/lib/preview-utils";
import { DOCK_HEIGHT, MENU_BAR_HEIGHT } from "@/lib/use-window-behavior";
import { cn } from "@/lib/utils";

const DESKTOP_DIR = `${HOME_DIR}/Desktop`;

interface DesktopIconsProps {
  onOpenPreviewFile: (filePath: string, fileUrl: string, fileType: "image" | "pdf") => void;
  onOpenTextFile: (filePath: string) => void;
}

function fileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? (parts.pop() as string).toUpperCase() : "";
}

// A page glyph with the file's extension on its spine. Drawn rather than imported so
// it inherits the same treatment as every other on-wallpaper element.
function FileGlyph({ extension }: { extension: string }) {
  return (
    <svg viewBox="0 0 48 60" className="w-12 h-[60px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
      <path d="M4 3a2 2 0 0 1 2-2h24l14 14v42a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3z" fill="#fbfbfd" />
      <path d="M30 1l14 14H32a2 2 0 0 1-2-2V1z" fill="#d6d8dd" />
      {extension && (
        <text
          x="24"
          y="46"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="#6b7280"
          fontFamily="system-ui, sans-serif"
        >
          {extension}
        </text>
      )}
    </svg>
  );
}

export function DesktopIcons({ onOpenPreviewFile, onOpenTextFile }: DesktopIconsProps) {
  // Desktop contents merge static sample files with localStorage-backed documents, so
  // they can only be read after mount without desyncing hydration.
  const [items, setItems] = useState<LocalFinderItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setItems(getLocalFinderFiles(DESKTOP_DIR));
    refresh();
    window.addEventListener(TEXTEDIT_DOCUMENTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(TEXTEDIT_DOCUMENTS_CHANGED_EVENT, refresh);
  }, []);

  const openItem = useCallback(
    (item: LocalFinderItem) => {
      const previewMetadata = getPreviewMetadataFromPath(item.path);
      if (previewMetadata) {
        onOpenPreviewFile(item.path, previewMetadata.fileUrl, previewMetadata.fileType);
        return;
      }
      onOpenTextFile(item.path);
    },
    [onOpenPreviewFile, onOpenTextFile]
  );

  if (items.length === 0) return null;

  return (
    <div
      // Sits above the wallpaper but below every window, so dragging a window covers it.
      className="absolute right-0 flex flex-col flex-wrap-reverse content-start items-end gap-1 p-3 pointer-events-none"
      style={{ top: MENU_BAR_HEIGHT, bottom: DOCK_HEIGHT }}
      onClick={() => setSelectedPath(null)}
    >
      {items.map((item) => (
        <button
          key={item.path}
          type="button"
          className={cn(
            "pointer-events-auto flex w-24 flex-col items-center gap-1 rounded-lg px-1 py-1.5",
            "outline-none transition-colors",
            "focus-visible:ring-2 focus-visible:ring-white/70",
            selectedPath === item.path ? "bg-white/25" : "can-hover:hover:bg-white/10"
          )}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedPath(item.path);
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            openItem(item);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openItem(item);
            }
          }}
          aria-label={`Open ${item.name}`}
        >
          <FileGlyph extension={fileExtension(item.name)} />
          <span
            className={cn(
              "line-clamp-2 w-full break-words text-center text-[11px] leading-tight text-white",
              "[text-shadow:0_1px_2px_rgba(0,0,0,0.55)]"
            )}
          >
            {item.name}
          </span>
        </button>
      ))}
    </div>
  );
}
