"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaudeAction } from "@/lib/claude/types";
import { ClaudeMarkdown } from "./markdown";

type Artifact = Extract<ClaudeAction, { type: "artifact" }>;

interface ArtifactPaneProps {
  artifact: Artifact;
  onClose: () => void;
  isMobile: boolean;
}

export function ArtifactPane({ artifact, onClose, isMobile }: ArtifactPaneProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be refused; the text is still selectable.
    }
  };

  return (
    <aside
      aria-label={artifact.title}
      className={cn(
        "flex h-full min-w-0 flex-col bg-[var(--claude-surface)]",
        isMobile
          ? "absolute inset-0 z-10"
          : "w-[52%] max-w-[640px] shrink-0 border-l border-[var(--claude-border)]"
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--claude-border)] px-4 py-2.5 select-none">
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--claude-text)]">
          {artifact.title}
        </h2>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy as Markdown"
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-[var(--claude-text-subdued)] can-hover:hover:bg-[var(--claude-hover)]"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close document"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--claude-text-subdued)] can-hover:hover:bg-[var(--claude-hover)]"
        >
          <X size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <ClaudeMarkdown>{artifact.markdown}</ClaudeMarkdown>
      </div>
    </aside>
  );
}
