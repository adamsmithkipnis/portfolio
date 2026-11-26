/**
 * Shapes shared by the Claude app's client and its route.
 *
 * An action is something the model asked the desktop to do. The route only
 * emits actions it has validated against known content, so the client can act
 * on them without re-checking where a path came from.
 */

export type ClaudeAction =
  | { type: "open_case_study"; slug: string; title: string; archivePath: string }
  | { type: "open_site_page"; title: string; path: string }
  | { type: "artifact"; id: string; title: string; markdown: string };

export type ClaudeRole = "user" | "assistant";

export interface ClaudeMessage {
  id: string;
  role: ClaudeRole;
  content: string;
  actions?: ClaudeAction[];
  createdAt: number;
  /** Set when the reply failed or was cut short; the text says why. */
  error?: boolean;
}

export interface ClaudeChat {
  id: string;
  title: string;
  messages: ClaudeMessage[];
  createdAt: number;
  updatedAt: number;
}

/** A pinned, read-only conversation Adam wrote from his own work. */
export interface ClaudeExampleChat extends ClaudeChat {
  /** One line under the title saying what the example shows. */
  note: string;
}

/**
 * The route streams newline-delimited JSON, one event per line.
 * `text` events append to the reply; `action` events arrive after the text.
 */
export type ClaudeStreamEvent =
  | { type: "text"; delta: string }
  | { type: "action"; action: ClaudeAction }
  | { type: "error"; reason: ClaudeErrorReason; retryAfterSeconds?: number }
  | { type: "done" };

export type ClaudeErrorReason =
  | "rate_limited"
  | "quota_exceeded"
  | "payload_too_large"
  | "upstream_unavailable"
  | "invalid_request"
  | "empty_reply";
