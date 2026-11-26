"use client";

import { ExternalLink, FileText } from "lucide-react";
import type { ClaudeAction } from "@/lib/claude/types";

interface ActionChipProps {
  action: ClaudeAction;
  onRun: (action: ClaudeAction) => void;
}

function describe(action: ClaudeAction): { label: string; detail: string } {
  switch (action.type) {
    case "open_case_study":
      return { label: action.title, detail: "Opened in Safari" };
    case "open_site_page":
      return { label: action.title, detail: "Opened in Safari" };
    case "artifact":
      return { label: action.title, detail: "Document · click to open" };
  }
}

/**
 * The visible trace of something Claude did on the desktop. Clicking it does
 * the same thing again, so a closed window or panel is one click away.
 */
export function ActionChip({ action, onRun }: ActionChipProps) {
  const { label, detail } = describe(action);
  const Icon = action.type === "artifact" ? FileText : ExternalLink;
  return (
    <button
      type="button"
      onClick={() => onRun(action)}
      className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-[var(--claude-border)] bg-[var(--claude-surface)] px-3 py-2.5 text-left can-hover:hover:bg-[var(--claude-hover)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--claude-hover)] text-[var(--claude-text-subdued)]">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-[var(--claude-text)]">{label}</span>
        <span className="block truncate text-xs text-[var(--claude-text-subdued)]">{detail}</span>
      </span>
    </button>
  );
}
