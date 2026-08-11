"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type VideoPlatform = "youtube" | "vimeo";

interface VideoEmbedProps {
  platform: VideoPlatform;
  id: string;
  title?: string;
  className?: string;
}

function embedUrl(platform: VideoPlatform, id: string): string {
  // Autoplay is safe here: the iframe only mounts after an explicit click.
  return platform === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1`;
}

export function VideoEmbed({ platform, id, title, className }: VideoEmbedProps) {
  const [activated, setActivated] = useState(false);
  const label = title || `${platform === "youtube" ? "YouTube" : "Vimeo"} video`;

  // A lone <video-embed> on its own line gets wrapped in a <p> by the markdown
  // parser, so the root must be phrasing content — a block-displayed <span>,
  // never a <div>, or React throws a hydration error.
  return (
    <span
      className={cn(
        "relative my-6 block w-full overflow-hidden rounded-xl bg-zinc-900 aspect-video",
        className
      )}
    >
      {activated ? (
        <iframe
          src={embedUrl(platform, id)}
          title={label}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActivated(true)}
          // Nothing is requested from YouTube or Vimeo until this is clicked.
          className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 text-white transition-colors can-hover:hover:bg-zinc-800"
          aria-label={`Play ${label}`}
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-transform can-hover:group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="px-6 text-center text-sm font-medium">{label}</span>
          <span className="text-xs text-white/60">
            {platform === "youtube" ? "YouTube" : "Vimeo"}
          </span>
        </button>
      )}
    </span>
  );
}
