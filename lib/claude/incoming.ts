import { CLAUDE_MAX_MESSAGE_CHARS } from "./model";
import { ARTIFACT_MAX_MARKDOWN_CHARS } from "./tools";

export const MAX_INCOMING_MESSAGES = 80;
/** Assistant turns can carry an artifact's worth of text back as context. */
const MAX_ASSISTANT_MESSAGE_CHARS = ARTIFACT_MAX_MARKDOWN_CHARS;

type IncomingMessage = { role: "user" | "assistant"; content: string };

/** Validate the thread. Returns null if any message is malformed or too long. */
export function parseIncomingMessages(raw: unknown): IncomingMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_INCOMING_MESSAGES) return null;
  const messages: IncomingMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const cap = role === "user" ? CLAUDE_MAX_MESSAGE_CHARS : MAX_ASSISTANT_MESSAGE_CHARS;
    if (content.length > cap) return null;
    if (content.trim().length === 0) continue;
    messages.push({ role, content });
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

