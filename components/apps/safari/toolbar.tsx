"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { WindowControls } from "@/components/window-controls";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { resolveOmniboxTarget } from "@/lib/safari-url";
import { cn } from "@/lib/utils";

/** What the start page is showing, displayed as the current address. */
const CURRENT_SITE = "smithkipnis.com";

interface ToolbarProps {
  isMobileView: boolean;
  isDesktop?: boolean;
}

/**
 * Safari's toolbar, doubling as the window's drag handle — so it keeps
 * `select-none` and every control stops mousedown from propagating, or
 * clicking a button would start a window drag.
 *
 * Back and forward render permanently disabled. That isn't dead chrome: the
 * app only ever shows the start page, so disabled is their true state, the
 * same as a freshly opened Safari window. The address bar, by contrast, is
 * fully real — it opens whatever you type in a new tab.
 */
export function Toolbar({ isMobileView, isDesktop = false }: ToolbarProps) {
  const nav = useWindowNavBehavior({ isDesktop, isMobile: isMobileView });
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(CURRENT_SITE);

  // Escape reverts to the current page and leaves the field, the way Safari
  // does — and the blur matters beyond fidelity, since it hands single-key
  // shortcuts back to the shell.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setQuery(CURRENT_SITE);
        el.blur();
      }
    };
    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, []);

  const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

  const submit = () => {
    const target = resolveOmniboxTarget(query);
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
        "shrink-0 flex items-center gap-2 px-4 select-none border-b border-muted-foreground/20",
        isMobileView ? "h-14 bg-background" : "h-14 bg-muted"
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

      {!isMobileView && (
        <div className="flex items-center gap-1 ml-2" onMouseDown={stopDrag}>
          <NavArrow label="Go back" icon={<ChevronLeft size={18} />} />
          <NavArrow label="Go forward" icon={<ChevronRight size={18} />} />
        </div>
      )}

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
            onFocus={(e) => e.currentTarget.select()}
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

/**
 * History arrows. Always disabled — the start page has nowhere to go back to.
 */
function NavArrow({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <span
      role="button"
      aria-label={label}
      aria-disabled="true"
      className="p-1.5 rounded-md text-muted-foreground/40 cursor-default"
    >
      {icon}
    </span>
  );
}
