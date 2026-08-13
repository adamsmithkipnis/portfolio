"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import { VideoEmbed, type VideoPlatform } from "./video-embed";

interface CaseStudyBodyProps {
  body: string;
  className?: string;
}

interface RawElementProps {
  node?: { properties?: Record<string, unknown> };
}

// react-markdown's Components type only knows HTML tags, so the custom
// <video-embed> entry is declared separately and widened on the way in.
const CUSTOM_COMPONENTS = {
  "video-embed": ({ node }: RawElementProps) => {
    const properties = node?.properties ?? {};
    const id = String(properties.id ?? "");
    if (!id) return null;
    const platform: VideoPlatform = properties.platform === "vimeo" ? "vimeo" : "youtube";
    return (
      <VideoEmbed
        platform={platform}
        id={id}
        title={properties.title ? String(properties.title) : undefined}
      />
    );
  },
} as React.ComponentProps<typeof ReactMarkdown>["components"];

// Section bodies are authored as Markdown with one custom tag, <video-embed>.
// rehype-raw turns it into a real element node so it can be mapped to a component
// instead of being rendered as literal text.
export function CaseStudyBody({ body, className }: CaseStudyBodyProps) {
  return (
    <ReactMarkdown
      className={cn(
        "max-w-2xl text-sm leading-relaxed",
        "[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-base [&_h2]:font-semibold",
        "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold",
        "[&_p]:my-3",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-1",
        "[&_a]:text-blue-500 [&_a]:underline-offset-2 can-hover:[&_a:hover]:underline",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
        "[&_img]:my-4 [&_img]:rounded-lg",
        "[&_hr]:my-8 [&_hr]:border-border",
        className
      )}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={CUSTOM_COMPONENTS}
    >
      {body}
    </ReactMarkdown>
  );
}
