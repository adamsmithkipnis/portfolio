import assert from "node:assert/strict";
import test from "node:test";
import { initialContacts } from "../data/messages/initial-contacts";
import { ADAM_AI_NAME } from "../lib/messages/adam-ai";
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

test("the banner is from the labeled AI, and the thread holds that message", () => {
  const notification = buildFirstVisitNotification();
  assert.ok(notification);
  assert.match(notification.sender, /\(AI\)$/);
  const thread = initialConversations.find((c) => c.id === notification.conversationId)!;
  assert.ok(thread.messages[0].content.startsWith(notification.body));
  assert.equal(thread.messages[0].sender, notification.sender);
  assert.ok(notification.body.length <= 80, "must fit the banner's two lines");
});

test("the AI persona has a prompt, so the chat route can answer as it", () => {
  const contact = initialContacts.find((c) => c.name === ADAM_AI_NAME);
  assert.ok(contact?.prompt?.includes("AI"));
});
