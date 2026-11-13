import {
  ADAM_AI_CONVERSATION_ID,
  ADAM_AI_NAME,
  ADAM_AI_OPENING_MESSAGE,
} from "@/lib/messages/adam-ai";
import { initialConversations } from "@/data/messages/initial-conversations";
import type { MessagesNotificationPayload } from "@/types/messages/notification";

/**
 * The first-visit nudge: Messages opens behind Safari, and a while later a
 * notification says what is in it. The Dock badge is the only other hint that
 * the desktop holds more than Safari, and phones never see the desktop at all.
 */
export const FIRST_VISIT_STORAGE_KEY = "portfolioFirstVisitNudgeShown";
export const FIRST_VISIT_DELAY_MS = 30_000;
/** A touch over macOS's ~5s banner, since the visitor is not expecting it. */
export const FIRST_VISIT_BANNER_MS = 6_000;

export const FIRST_VISIT_NOTIFICATION_ID = "first-visit-nudge";

/** True when this browser has never been shown the nudge. */
export function shouldShowFirstVisitNudge(storage: Pick<Storage, "getItem"> | null): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(FIRST_VISIT_STORAGE_KEY) === null;
  } catch {
    // Storage unavailable: skip rather than nudge on every page load.
    return false;
  }
}

export function markFirstVisitNudgeShown(storage: Pick<Storage, "setItem"> | null): void {
  try {
    storage?.setItem(FIRST_VISIT_STORAGE_KEY, "1");
  } catch {
    // Best effort.
  }
}

/**
 * The banner announces the seeded AI-Adam thread with its opening message,
 * flattened to one line the way Messages does for any notification. The banner
 * clamps to two lines with an ellipsis, as macOS does for a long message.
 */
export function buildFirstVisitNotification(): MessagesNotificationPayload | null {
  if (!initialConversations.some((c) => c.id === ADAM_AI_CONVERSATION_ID)) return null;
  return {
    id: FIRST_VISIT_NOTIFICATION_ID,
    conversationId: ADAM_AI_CONVERSATION_ID,
    sender: ADAM_AI_NAME,
    title: ADAM_AI_NAME,
    body: ADAM_AI_OPENING_MESSAGE.trim().replace(/\s+/g, " "),
    type: "message",
    durationMs: FIRST_VISIT_BANNER_MS,
  };
}

/**
 * Until the banner fires, the AI-Adam thread stays out of the Messages list
 * and the unread count, so the thread and the banner appear together. The
 * flag lives in sessionStorage: it only matters for the tab that is waiting
 * on the nudge, and a closed tab that never saw the banner should start over.
 */
export const ADAM_THREAD_PENDING_KEY = "portfolioAdamThreadPending";
/** Fired on window when the pending thread is revealed. */
export const ADAM_THREAD_REVEALED_EVENT = "portfolio:adam-thread-revealed";

export function setAdamThreadPending(): void {
  try {
    window.sessionStorage.setItem(ADAM_THREAD_PENDING_KEY, "1");
  } catch {
    // Best effort.
  }
}

export function isAdamThreadPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(ADAM_THREAD_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Ids of seeded conversations that should not show yet. */
export function getHiddenSeedIds(): string[] {
  return isAdamThreadPending() ? [ADAM_AI_CONVERSATION_ID] : [];
}

/** Reveals the thread; the open Messages app adds it on this event. */
export function revealAdamThread(): void {
  try {
    window.sessionStorage.removeItem(ADAM_THREAD_PENDING_KEY);
  } catch {
    // Best effort.
  }
  window.dispatchEvent(new Event(ADAM_THREAD_REVEALED_EVENT));
}
