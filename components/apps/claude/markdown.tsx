"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Markdown for model output. Deliberately no rehype-raw: the model's text is
 * untrusted, so raw HTML in it renders as text, never as elements. Links open
 * in a new tab and never in the frame.
 */
export function ClaudeMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <ReactMarkdown
      className={cn(
        "text-[15px] leading-relaxed text-[var(--claude-text)]",
        "[&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0",
        "[&_h1]:mb-2 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:font-semibold",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-1",
        "[&_strong]:font-semibold",
        "[&_a]:underline [&_a]:underline-offset-2",
        "[&_code]:rounded [&_code]:bg-[var(--claude-hover)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--claude-hover)] [&_pre]:p-3",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--claude-border)] [&_blockquote]:pl-3",
        "[&_hr]:my-4 [&_hr]:border-[var(--claude-border)]",
        "[&_table]:my-3 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:border-[var(--claude-border)] [&_th]:py-1 [&_th]:text-left [&_td]:py-1",
        className
      )}
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children: linkChildren }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {linkChildren}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
