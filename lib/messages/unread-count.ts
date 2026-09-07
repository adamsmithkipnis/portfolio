import { initialConversations } from "@/data/messages/initial-conversations";
import type { Conversation } from "@/types/messages";
import {
  CONVERSATIONS_STORAGE_KEY,
  DELETED_INITIAL_CONVERSATIONS_KEY,
} from "./storage-keys";

interface StoredState {
  saved: unknown;
  deletedInitial: unknown;
}

/**
 * Sum of unread messages the Messages app would show if it were open.
 *
 * The dock badge used to exist only while the Messages window was mounted,
 * because the app was the only thing that counted. With Safari alone on a
 * first visit that meant no badge at all, and the badge is the one hint on
 * the desktop that there is more to open. This reproduces the app's own
 * merge of seeded and saved conversations, minus everything about selecting
 * one, so the count is right before the app ever runs.
 */
export function countUnread(state: StoredState): number {
  const deleted = new Set<string>(
    Array.isArray(state.deletedInitial) ? state.deletedInitial.filter(isString) : []
  );
  const saved = Array.isArray(state.saved) ? state.saved.filter(isConversationLike) : null;

  const savedById = new Map<string, Conversation>();
  for (const conversation of saved ?? []) savedById.set(conversation.id, conversation);
  const initialIds = new Set(initialConversations.map((conversation) => conversation.id));

  let total = 0;
  for (const seed of initialConversations) {
    if (deleted.has(seed.id)) continue;
    total += (savedById.get(seed.id) ?? seed).unreadCount || 0;
  }
  for (const conversation of saved ?? []) {
    if (!initialIds.has(conversation.id)) total += conversation.unreadCount || 0;
  }
  return total;
}

/** The count from this browser's storage, or from the seeds when there is none. */
export function getStoredUnreadCount(): number {
  if (typeof window === "undefined") return 0;
  let saved: unknown = null;
  let deletedInitial: unknown = null;
  try {
    saved = parse(window.localStorage.getItem(CONVERSATIONS_STORAGE_KEY));
    deletedInitial = parse(window.localStorage.getItem(DELETED_INITIAL_CONVERSATIONS_KEY));
  } catch {
    // Storage can be unavailable (privacy modes); the seeds still count.
  }
  return countUnread({ saved, deletedInitial });
}

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isConversationLike(value: unknown): value is Conversation {
  return !!value && typeof value === "object" && typeof (value as Conversation).id === "string";
}
