"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLAUDE_MAX_MESSAGE_CHARS } from "@/lib/claude/model";

interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  /** The model that answered last, e.g. "Sonnet 5.5". */
  modelLabel: string;
  autoFocus?: boolean;
  placeholder?: string;
}

const MAX_TEXTAREA_HEIGHT = 200;

export function Composer({ onSend, onStop, isStreaming, modelLabel, autoFocus, placeholder }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // Grow with the text, up to a cap, like the real composer.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isStreaming;

  const submit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      // Blur so the global `q` shortcut can close the app.
      (document.activeElement as HTMLElement | null)?.blur();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--claude-border)] bg-[var(--claude-surface)] px-3 pt-3 pb-2 shadow-sm focus-within:border-[var(--claude-text-subdued)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, CLAUDE_MAX_MESSAGE_CHARS))}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder={placeholder ?? "Ask about Adam's work"}
        aria-label="Message Claude"
        className="block w-full resize-none bg-transparent px-1 text-[15px] leading-6 text-[var(--claude-text)] placeholder:text-[var(--claude-text-subdued)] focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="px-1 text-xs text-[var(--claude-text-subdued)]">{modelLabel}</span>
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop response"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--claude-text)] text-[var(--claude-base)]"
          >
            <Square size={12} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-opacity",
              "bg-[var(--claude-accent)] text-[var(--claude-accent-text)]",
              !canSend && "opacity-40"
            )}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
