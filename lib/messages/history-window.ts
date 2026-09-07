import type { Message } from "@/types/messages";

/**
 * How much of a thread the model sees.
 *
 * Messages are the unit that matters to the prompt (cadence and turn-taking are
 * counted in messages), and characters bound the tokens. The oldest turns drop
 * first on both counts, so a long thread forgets its beginning rather than
 * refusing to continue. The route applies this; the client applies it too so a
 * long thread never trips the request body cap on the way in.
 */
export const CHAT_HISTORY_WINDOW = 40;
export const CHAT_HISTORY_MAX_CHARS = 12_000;

export function trimConversationHistory(
  messages: Message[],
  window = CHAT_HISTORY_WINDOW,
  maxChars = CHAT_HISTORY_MAX_CHARS
): Message[] {
  let recent = messages.length > window ? messages.slice(-window) : messages.slice();

  let total = recent.reduce((sum, message) => sum + message.content.length, 0);
  let start = 0;
  while (total > maxChars && start < recent.length - 1) {
    total -= recent[start].content.length;
    start += 1;
  }
  if (start > 0) recent = recent.slice(start);

  return recent;
}
