import type { ClaudeExampleChat } from "@/lib/claude/types";

/**
 * Pinned example chats: how Adam actually works with Claude.
 *
 * THESE ARE PLACEHOLDERS. Adam replaces each one with a real session from his
 * own work, lightly edited. Do not fill them with invented conversations: the
 * sidebar labels them "Examples from Adam's work", so they have to be true.
 *
 * While `EXAMPLE_CHATS_READY` is false the sidebar hides the Examples group,
 * so placeholder text never ships to visitors.
 */
export const EXAMPLE_CHATS_READY = false;

const placeholder = (id: string, title: string, note: string): ClaudeExampleChat => ({
  id: `example-${id}`,
  title,
  note,
  createdAt: 0,
  updatedAt: 0,
  messages: [
    {
      id: `example-${id}-1`,
      role: "user",
      content: "[Adam's real prompt goes here.]",
      createdAt: 0,
    },
    {
      id: `example-${id}-2`,
      role: "assistant",
      content: "[Claude's real reply goes here, lightly edited.]",
      createdAt: 0,
    },
  ],
});

export const EXAMPLE_CHATS: ClaudeExampleChat[] = [
  placeholder("research", "[Research synthesis example]", "[What this example shows]"),
  placeholder("writing", "[Case study writing example]", "[What this example shows]"),
  placeholder("design", "[Design critique example]", "[What this example shows]"),
];
