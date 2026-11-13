import assert from "node:assert/strict";
import test from "node:test";
import { initialContacts } from "../data/messages/initial-contacts";
import { ADAM_AI_CONVERSATION_ID, ADAM_AI_NAME } from "../lib/messages/adam-ai";
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

test("with no AI-Adam thread seeded, there is no banner to show", () => {
  // The thread is removed for now; the nudge no-ops until it is seeded again.
  assert.equal(initialConversations.some((c) => c.id === ADAM_AI_CONVERSATION_ID), false);
  assert.equal(buildFirstVisitNotification(), null);
  assert.equal(initialContacts.some((c) => c.name === ADAM_AI_NAME), false);
});
