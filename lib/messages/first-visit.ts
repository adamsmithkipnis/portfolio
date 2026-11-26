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
 * The banner announces the newest seeded thread with the last thing someone
 * else said in it, flattened to one line the way Messages does for any
 * notification. The banner clamps to two lines with an ellipsis, as macOS does
 * for a long message.
 */
export function buildFirstVisitNotification(): MessagesNotificationPayload | null {
  const thread = initialConversations[0];
  const last = thread?.messages.filter((m) => m.sender !== "me" && m.sender !== "system").at(-1);
  if (!thread || !last) return null;
  return {
    id: FIRST_VISIT_NOTIFICATION_ID,
    conversationId: thread.id,
    sender: last.sender,
    title: thread.name ?? last.sender,
    body: last.content.trim().replace(/\s+/g, " "),
    type: "message",
    durationMs: FIRST_VISIT_BANNER_MS,
  };
}
