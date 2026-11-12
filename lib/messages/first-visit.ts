import {
  ADAM_AI_CONVERSATION_ID,
  ADAM_AI_NAME,
  ADAM_AI_BANNER_TEXT,
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
 * The banner announces the opening line of the seeded AI-Adam thread, from
 * the same constants, so what pops up is how the thread starts. The sender
 * carries the "(AI)" label.
 */
export function buildFirstVisitNotification(): MessagesNotificationPayload | null {
  if (!initialConversations.some((c) => c.id === ADAM_AI_CONVERSATION_ID)) return null;
  return {
    id: FIRST_VISIT_NOTIFICATION_ID,
    conversationId: ADAM_AI_CONVERSATION_ID,
    sender: ADAM_AI_NAME,
    title: ADAM_AI_NAME,
    body: ADAM_AI_BANNER_TEXT,
    type: "message",
    durationMs: FIRST_VISIT_BANNER_MS,
  };
}
