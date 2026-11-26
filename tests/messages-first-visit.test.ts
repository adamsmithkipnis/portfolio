import assert from "node:assert/strict";
import test from "node:test";
import { initialConversations } from "../data/messages/initial-conversations";
import {
  FIRST_VISIT_STORAGE_KEY,
  buildFirstVisitNotification,
  markFirstVisitNudgeShown,
  shouldShowFirstVisitNudge,
} from "../lib/messages/first-visit";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

test("nudges once per browser", () => {
  const storage = memoryStorage();
  assert.equal(shouldShowFirstVisitNudge(storage), true);
  markFirstVisitNudgeShown(storage);
  assert.equal(storage.getItem(FIRST_VISIT_STORAGE_KEY), "1");
  assert.equal(shouldShowFirstVisitNudge(storage), false);
});

test("no storage means no nudge", () => {
  assert.equal(shouldShowFirstVisitNudge(null), false);
  assert.equal(
    shouldShowFirstVisitNudge({
      getItem: () => {
        throw new Error("blocked");
      },
    }),
    false
  );
});

test("the banner opens a seeded conversation", () => {
  const notification = buildFirstVisitNotification();
  assert.ok(notification);
  assert.ok(initialConversations.some((c) => c.id === notification.conversationId));
});

test("the banner quotes the last thing someone else said in that thread", () => {
  const notification = buildFirstVisitNotification();
  assert.ok(notification);
  const thread = initialConversations.find((c) => c.id === notification.conversationId)!;
  const last = thread.messages.filter((m) => m.sender !== "me" && m.sender !== "system").at(-1)!;
  assert.equal(notification.sender, last.sender);
  assert.ok(!notification.body.includes("\n"), "flattened to one line");
});
