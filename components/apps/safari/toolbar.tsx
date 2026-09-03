"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { WindowControls } from "@/components/window-controls";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { resolveOmniboxTarget } from "@/lib/safari-url";
import { addressFor } from "./use-archive-history";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  isMobileView: boolean;
  isDesktop?: boolean;
  /** Current archive path, shown as the address. */
  path: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

/**
 * Safari's toolbar, doubling as the window's drag handle — so it keeps
 * `select-none` and every control stops mousedown from propagating, or
 * clicking a button would start a window drag.
 *
 * Back and forward are real now that the archive is several pages, and they
 * disable themselves at the ends of the history the way Safari's do. The
 * address bar shows wherever the frame currently is, and typing in it opens
 * the result in a new tab, since the frame only ever holds the archive.
 */
export function Toolbar({
  isMobileView,
  isDesktop = false,
  path,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: ToolbarProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });
  const inputRef = useRef<HTMLInputElement>(null);
  const address = addressFor(path);
  const [query, setQuery] = useState(address);
  const [editing, setEditing] = useState(false);

  // Follow the frame while the field is idle; leave it alone mid-edit so
  // navigation never overwrites what someone is typing.
  useEffect(() => {
    if (!editing) setQuery(address);
  }, [address, editing]);

  // Escape reverts to the current page and leaves the field — the blur matters
  // beyond fidelity, since it hands single-key shortcuts back to the shell.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setQuery(address);
        setEditing(false);
        el.blur();
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [address]);

  const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

  const submit = () => {
    const target = resolveOmniboxTarget(query);
    setEditing(false);
    if (!target) return;
    // Opened from a keydown, so this counts as a user gesture and isn't
    // blocked. noopener keeps the new tab from reaching back via window.opener.
    window.open(target, "_blank", "noopener,noreferrer");
    inputRef.current?.blur();
  };

  return (
    <div
      onMouseDown={nav.onDragStart}
      className={cn(
        "shrink-0 flex items-center gap-2 px-4 h-14 select-none",
        "border-b border-muted-foreground/20",
        isMobileView ? "bg-background" : "bg-muted"
      )}
    >
      {!isMobileView && (
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
      )}

      <div className="flex items-center gap-1 ml-2" onMouseDown={stopDrag}>
        <NavArrow label="Go back" onClick={onBack} enabled={canGoBack}>
          <ChevronLeft size={18} />
        </NavArrow>
        <NavArrow label="Go forward" onClick={onForward} enabled={canGoForward}>
          <ChevronRight size={18} />
        </NavArrow>
      </div>

      <div
        className={cn("flex-1 min-w-0 flex justify-center", !isMobileView && "px-2")}
        onMouseDown={stopDrag}
      >
        <div className="relative w-full max-w-[520px]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={14}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => {
              setEditing(true);
              e.currentTarget.select();
            }}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Search or enter website name"
            aria-label="Address and search"
            spellCheck={false}
            autoComplete="off"
            className={cn(
              "w-full h-7 pl-8 pr-3 rounded-lg text-sm text-center",
              "bg-background/80 text-foreground placeholder:text-muted-foreground",
              "border border-muted-foreground/20",
              "focus:outline-none focus:ring-2 focus:ring-[#0A7CFF]/40 focus:text-left"
            )}
          />
        </div>
      </div>

      {!isMobileView && <div className="w-[72px] shrink-0" />}
    </div>
  );
}

function NavArrow({
  label,
  onClick,
  enabled,
  children,
}: {
  label: string;
  onClick: () => void;
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={!enabled}
      onClick={enabled ? onClick : undefined}
      className={cn(
        "p-1.5 rounded-md",
        enabled
          ? "text-foreground/70 can-hover:hover:bg-foreground/10 cursor-pointer"
          : "text-muted-foreground/40 cursor-default"
      )}
    >
      {children}
    </button>
  );
}
