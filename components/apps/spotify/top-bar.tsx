"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { WindowControls } from "@/components/window-controls";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { ChevronLeft, ChevronRight, Home, Search, X } from "lucide-react";

interface TopBarProps {
  isMobileView: boolean;
  isDesktop?: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  isHome: boolean;
  query: string;
  onQueryChange: (value: string) => void;
}

/**
 * Spans the full window width above both columns, the way Spotify's does.
 *
 * The bar doubles as the window's drag handle, so it keeps `onDragStart` and
 * `select-none`, and every control stops mousedown from propagating — without
 * that, clicking a button would start dragging the window.
 *
 * Only controls that actually do something live here. Spotify also shows
 * notifications and a friends button; those would be dead chrome, so they are
 * omitted. The avatar stays because it is identity, not a control — it is
 * rendered as a plain image rather than a button so it never suggests a menu
 * that does not exist.
 */
export function TopBar({
  isMobileView,
  isDesktop = false,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onHome,
  isHome,
  query,
  onQueryChange,
}: TopBarProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });
  const inputRef = useRef<HTMLInputElement>(null);

  // Escape leaves the field so the shell's single-key shortcuts work again.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        el.blur();
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, []);

  const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onMouseDown={nav.onDragStart}
      data-window-drag-handle="true"
      className="shrink-0 flex items-center gap-2 px-4 h-16 bg-[var(--spotify-base)] select-none"
    >
      <div onMouseDown={stopDrag}>
        <WindowControls
          inShell={nav.inShell}
          showWhenNotInShell={!isDesktop}
          className="p-2"
          onClose={nav.onClose}
          onMinimize={nav.onMinimize}
          onToggleMaximize={nav.onToggleMaximize}
          isMaximized={nav.isMaximized}
          closeLabel={nav.closeLabel}
        />
      </div>

      {!isMobileView && (
        <div className="flex items-center gap-1" onMouseDown={stopDrag}>
          <NavArrow label="Go back" disabled={!canGoBack} onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </NavArrow>
          <NavArrow
            label="Go forward"
            disabled={!canGoForward}
            onClick={onForward}
          >
            <ChevronRight className="w-5 h-5" />
          </NavArrow>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onHome}
          onMouseDown={stopDrag}
          aria-label="Home"
          className={cn(
            "shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--spotify-surface-raised)] transition-colors can-hover:hover:bg-[var(--spotify-surface-hover)]",
            isHome
              ? "text-[var(--spotify-text)]"
              : "text-[var(--spotify-text-subdued)]"
          )}
        >
          <Home className="w-5 h-5" />
        </button>

        <div
          onMouseDown={stopDrag}
          className="flex items-center gap-2 h-10 w-full max-w-[360px] px-4 rounded-full bg-[var(--spotify-surface-raised)] focus-within:bg-[var(--spotify-surface-hover)] transition-colors"
        >
          <Search className="w-4 h-4 shrink-0 text-[var(--spotify-text-subdued)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="What do you want to play?"
            aria-label="Search your playlists"
            className="flex-1 min-w-0 bg-transparent text-sm text-[var(--spotify-text)] placeholder:text-[var(--spotify-text-subdued)] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="shrink-0 text-[var(--spotify-text-subdued)] transition-colors can-hover:hover:text-[var(--spotify-text)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fixed width balances the traffic lights and arrows on the left, so
          the search pill stays optically centred. */}
      {!isMobileView && (
        <div className="relative group w-[104px] shrink-0 flex justify-end">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--spotify-surface-raised)] transition-colors can-hover:group-hover:bg-[var(--spotify-surface-hover)]">
            <span className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image
                src="/headshot.jpg"
                alt="Adam Smith-Kipnis"
                fill
                className="object-cover"
                sizes="32px"
              />
            </span>
          </span>

          {/* The dock has its own tooltip, but it lives in the shell layer and
              apps must not reach upward into it, so this is a local one. */}
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-md bg-[var(--spotify-surface-hover)] px-3 py-1.5 text-[13px] font-medium text-[var(--spotify-text)] shadow-lg opacity-0 transition-opacity can-hover:group-hover:opacity-100"
          >
            Adam Smith-Kipnis
          </span>
        </div>
      )}
    </div>
  );
}

function NavArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
        disabled
          ? "text-[var(--spotify-text-subdued)] opacity-40 cursor-default"
          : "text-[var(--spotify-text-subdued)] can-hover:hover:text-[var(--spotify-text)]"
      )}
    >
      {children}
    </button>
  );
}
