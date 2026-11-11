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

/** The thread the banner opens: an existing, unread persona group chat. */
const FIRST_VISIT_CONVERSATION_NAME = "The City";

/**
 * Written in the site owner's own voice, never as a persona, so nothing here
 * puts words in a real person's mouth. Change the copy here only.
 */
export const FIRST_VISIT_SENDER = "Adam Smith-Kipnis";
/** Two banner lines (~80 characters) hold all of it; the banner clamps at two. */
export const FIRST_VISIT_BODY =
  "Behind this window: a group chat of AI personas I built. Ask them something.";

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

/** The banner payload, or null if the seeded thread it opens no longer exists. */
export function buildFirstVisitNotification(): MessagesNotificationPayload | null {
  const conversation = initialConversations.find(
    (c) => c.name === FIRST_VISIT_CONVERSATION_NAME
  );
  if (!conversation) return null;
  return {
    id: FIRST_VISIT_NOTIFICATION_ID,
    conversationId: conversation.id,
    sender: FIRST_VISIT_SENDER,
    title: FIRST_VISIT_SENDER,
    body: FIRST_VISIT_BODY,
    type: "message",
    durationMs: FIRST_VISIT_BANNER_MS,
  };
}
