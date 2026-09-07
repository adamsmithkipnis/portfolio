import assert from "node:assert/strict";
import test from "node:test";
import {
  CHAT_HISTORY_MAX_CHARS,
  CHAT_HISTORY_WINDOW,
  trimConversationHistory,
} from "../lib/messages/history-window";
import type { Message } from "../types/messages";

function message(index: number, content = `message ${index}`): Message {
  return { id: String(index), content, sender: index % 2 ? "me" : "Jane Jacobs", timestamp: "" };
}

test("a short thread passes through untouched", () => {
  const thread = Array.from({ length: 17 }, (_, i) => message(i));
  assert.deepEqual(trimConversationHistory(thread), thread);
});

test("a long thread keeps only the newest messages", () => {
  const thread = Array.from({ length: 100 }, (_, i) => message(i));
  const trimmed = trimConversationHistory(thread);
  assert.equal(trimmed.length, CHAT_HISTORY_WINDOW);
  assert.equal(trimmed[0].id, "60");
  assert.equal(trimmed.at(-1)?.id, "99");
});

test("oversized content drops the oldest turns until it fits", () => {
  const thread = Array.from({ length: 20 }, (_, i) => message(i, "x".repeat(1000)));
  const trimmed = trimConversationHistory(thread);
  const total = trimmed.reduce((sum, m) => sum + m.content.length, 0);
  assert.ok(total <= CHAT_HISTORY_MAX_CHARS);
  assert.equal(trimmed.at(-1)?.id, "19");
});

test("the newest message always survives, even alone", () => {
  const thread = [message(0, "x".repeat(50)), message(1, "y".repeat(CHAT_HISTORY_MAX_CHARS + 5))];
  const trimmed = trimConversationHistory(thread);
  assert.equal(trimmed.length, 1);
  assert.equal(trimmed[0].id, "1");
});
