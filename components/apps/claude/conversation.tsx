"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ClaudeAction, ClaudeMessage } from "@/lib/claude/types";
import { ActionChip } from "./action-chip";
import { ClaudeMarkdown } from "./markdown";
import { ClaudeSpark } from "./spark";

interface ConversationProps {
  messages: ClaudeMessage[];
  streamingMessageId: string | null;
  onRunAction: (action: ClaudeAction) => void;
}

export function Conversation({ messages, streamingMessageId, onRunAction }: ConversationProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastContent = messages[messages.length - 1]?.content;

  // Follow the reply as it streams in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, lastContent]);

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-6">
      {messages.map((message) => {
        const isStreaming = message.id === streamingMessageId;
        if (message.role === "user") {
          return (
            <div key={message.id} className="my-4 flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[var(--claude-user-bubble)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--claude-text)]">
                {message.content}
              </div>
            </div>
          );
        }
        return (
          <div key={message.id} className="my-5">
            {message.content ? (
              <ClaudeMarkdown
                className={cn(message.error && "text-[var(--claude-text-subdued)] italic")}
              >
                {message.content}
              </ClaudeMarkdown>
            ) : null}
            {message.actions?.length ? (
              <div className="mt-3 flex flex-col gap-2">
                {message.actions.map((action, index) => (
                  <ActionChip key={index} action={action} onRun={onRunAction} />
                ))}
              </div>
            ) : null}
            {isStreaming && (
              <div className="mt-3" aria-label="Claude is responding">
                <ClaudeSpark className="h-6 w-6 animate-spin [animation-duration:3s]" />
              </div>
            )}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
