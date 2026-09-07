import assert from "node:assert/strict";
import test from "node:test";
import { initialConversations } from "../data/messages/initial-conversations";
import { countUnread } from "../lib/messages/unread-count";

const seededTotal = initialConversations.reduce((sum, c) => sum + c.unreadCount, 0);

test("with nothing stored, the badge is the seeded total", () => {
  assert.ok(seededTotal > 0, "seeds should carry some unread messages");
  assert.equal(countUnread({ saved: null, deletedInitial: null }), seededTotal);
});

test("a read conversation in storage lowers the count", () => {
  const first = initialConversations.find((c) => c.unreadCount > 0)!;
  const saved = initialConversations.map((c) => (c.id === first.id ? { ...c, unreadCount: 0 } : c));
  assert.equal(countUnread({ saved, deletedInitial: null }), seededTotal - first.unreadCount);
});

test("a deleted seed no longer counts, and a user thread does", () => {
  const first = initialConversations.find((c) => c.unreadCount > 0)!;
  const userThread = { ...first, id: "user-made", unreadCount: 4 };
  const count = countUnread({ saved: [...initialConversations, userThread], deletedInitial: [first.id] });
  assert.equal(count, seededTotal - first.unreadCount + 4);
});

test("garbage in storage falls back to the seeds", () => {
  assert.equal(countUnread({ saved: "nope", deletedInitial: 42 }), seededTotal);
});
