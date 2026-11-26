"use client";

import { SquarePen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaudeChat, ClaudeExampleChat } from "@/lib/claude/types";

interface SidebarProps {
  isMobile: boolean;
  examples: ClaudeExampleChat[];
  chats: ClaudeChat[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  /** Window controls on desktop; nothing on mobile. */
  header: React.ReactNode;
  onHeaderMouseDown?: React.MouseEventHandler<HTMLDivElement>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-medium text-[var(--claude-text-subdued)] select-none">
      {children}
    </p>
  );
}

export function Sidebar({
  isMobile,
  examples,
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onDelete,
  header,
  onHeaderMouseDown,
}: SidebarProps) {
  const rowClass = (selected: boolean) =>
    cn(
      "group relative flex w-full items-center rounded-lg px-3 text-left text-sm text-[var(--claude-text)]",
      isMobile ? "py-3 text-base" : "py-1.5",
      selected && !isMobile && "bg-[var(--claude-selected)]"
    );

  return (
    <nav
      aria-label="Chats"
      className={cn(
        "flex h-full flex-col",
        isMobile ? "w-full bg-[var(--claude-base)]" : "w-[260px] shrink-0 bg-[var(--claude-sidebar)] border-r border-[var(--claude-border)]"
      )}
    >
      <div
        className="flex items-center justify-between px-4 py-2 select-none"
        onMouseDown={onHeaderMouseDown}
        data-window-drag-handle={onHeaderMouseDown ? "true" : undefined}
      >
        <div className="shrink-0">{header}</div>
        {isMobile && <span className="text-lg font-semibold text-[var(--claude-text)]">Claude</span>}
        <div className="w-4" />
      </div>

      <div className="px-2">
        <button
          type="button"
          onClick={onNewChat}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--claude-text)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--claude-accent)] text-[var(--claude-accent-text)]">
            <SquarePen size={13} />
          </span>
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {examples.length > 0 && (
          <>
            <SectionLabel>Examples from Adam&apos;s work</SectionLabel>
            {examples.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelect(chat.id)}
                className={rowClass(chat.id === activeChatId)}
              >
                <span className="min-w-0">
                  <span className="block truncate">{chat.title}</span>
                  <span className="block truncate text-xs text-[var(--claude-text-subdued)]">{chat.note}</span>
                </span>
              </button>
            ))}
          </>
        )}

        <SectionLabel>Recents</SectionLabel>
        {chats.length === 0 ? (
          <p className="px-3 py-1.5 text-sm text-[var(--claude-text-subdued)]">
            Your chats stay in this browser.
          </p>
        ) : (
          chats.map((chat) => (
            <div key={chat.id} className={rowClass(chat.id === activeChatId)}>
              <button
                type="button"
                onClick={() => onSelect(chat.id)}
                className="min-w-0 flex-1 truncate text-left"
              >
                {chat.title}
              </button>
              <button
                type="button"
                onClick={() => onDelete(chat.id)}
                aria-label={`Delete “${chat.title}”`}
                className={cn(
                  "ml-1 shrink-0 rounded p-0.5 text-[var(--claude-text-subdued)]",
                  isMobile ? "opacity-100" : "opacity-0 focus:opacity-100 can-hover:group-hover:opacity-100"
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </nav>
  );
}
