import type { ClaudeChat, ClaudeMessage } from "./types";

/**
 * Visitor chats are durable content, so they live in localStorage (see the
 * storage tiers in docs/design-system.md). Which chat is open is view state
 * and lives in sessionStorage via lib/sidebar-persistence.ts.
 */
export const CLAUDE_CHATS_STORAGE_KEY = "claudeChats";
export const CLAUDE_MAX_STORED_CHATS = 30;
const TITLE_MAX_CHARS = 60;

type StorageArea = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageArea | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isMessage(value: unknown): value is ClaudeMessage {
  if (!value || typeof value !== "object") return false;
  const m = value as Partial<ClaudeMessage>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    typeof m.createdAt === "number"
  );
}

function isChat(value: unknown): value is ClaudeChat {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<ClaudeChat>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.createdAt === "number" &&
    typeof c.updatedAt === "number" &&
    Array.isArray(c.messages) &&
    c.messages.every(isMessage)
  );
}

export function loadClaudeChats(storage: StorageArea | null = defaultStorage()): ClaudeChat[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(CLAUDE_CHATS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChat).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveClaudeChats(
  chats: ClaudeChat[],
  storage: StorageArea | null = defaultStorage()
): void {
  if (!storage) return;
  const kept = [...chats]
    .filter((chat) => chat.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, CLAUDE_MAX_STORED_CHATS);
  try {
    storage.setItem(CLAUDE_CHATS_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Storage full or unavailable: the chat still works for this session.
  }
}

/** A chat's title is its first question, trimmed to one line. */
export function titleFromFirstMessage(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= TITLE_MAX_CHARS) return oneLine || "New chat";
  return `${oneLine.slice(0, TITLE_MAX_CHARS - 1).trimEnd()}…`;
}
