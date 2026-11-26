import type { ClaudeAction, ClaudeErrorReason, ClaudeMessage, ClaudeStreamEvent } from "./types";

export interface StreamHandlers {
  onText: (delta: string) => void;
  onAction: (action: ClaudeAction) => void;
  onError: (reason: ClaudeErrorReason, retryAfterSeconds?: number) => void;
}

/** Split newline-delimited JSON as it arrives, keeping any partial last line. */
export function parseStreamChunk(buffer: string): { events: ClaudeStreamEvent[]; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const events: ClaudeStreamEvent[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as ClaudeStreamEvent);
    } catch {
      // A malformed line is dropped rather than ending the reply.
    }
  }
  return { events, rest };
}

/** POST the visible thread to /api/claude and feed events to the handlers. */
export async function streamClaudeReply(
  messages: Pick<ClaudeMessage, "role" | "content">[],
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) return;
    void error;
    handlers.onError("upstream_unavailable");
    return;
  }

  if (!response.body) {
    handlers.onError(response.status === 429 ? "rate_limited" : "upstream_unavailable");
    return;
  }

  // Refusals (rate limit, bad request) arrive as an error event in the body.
  let sawError = false;
  const onError: StreamHandlers["onError"] = (reason, retryAfterSeconds) => {
    sawError = true;
    handlers.onError(reason, retryAfterSeconds);
  };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseStreamChunk(buffer);
      buffer = parsed.rest;
      for (const event of parsed.events) {
        if (event.type === "text") handlers.onText(event.delta);
        else if (event.type === "action") handlers.onAction(event.action);
        else if (event.type === "error") onError(event.reason, event.retryAfterSeconds);
      }
    }
  } catch {
    if (!signal?.aborted && !sawError) onError("upstream_unavailable");
    return;
  }
  if (!response.ok && !sawError) onError("upstream_unavailable");
}

export function describeStreamError(reason: ClaudeErrorReason, retryAfterSeconds?: number): string {
  switch (reason) {
    case "rate_limited":
      return retryAfterSeconds
        ? `That's a lot of questions at once. Try again in ${retryAfterSeconds} seconds.`
        : "That's a lot of questions at once. Try again in a moment.";
    case "quota_exceeded":
      return "The live demo has hit its usage limit for now. The example chats in the sidebar still work.";
    case "payload_too_large":
      return "That conversation got too long. Start a new chat to keep going.";
    case "invalid_request":
      return "Something about that message couldn't be sent. Try rephrasing it.";
    case "empty_reply":
      return "Claude didn't come back with an answer. Try asking another way.";
    default:
      return "Claude couldn't be reached just now. Try again in a moment.";
  }
}
