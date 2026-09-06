"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { WorkLink } from "@/lib/work-links";

interface WorkLinkDetailProps {
  link: WorkLink;
  /** Open the case study in Safari; the same thing a double-click does. */
  onOpen: () => void;
  className?: string;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{value}</span>
    </div>
  );
}

/**
 * Finder's column-view pane for a case study link: the card from the archive's
 * index, plus a button to read it. Mirrors `ContentDetail`, which does the same
 * job for MDX case studies.
 */
export function WorkLinkDetail({ link, onOpen, className }: WorkLinkDetailProps) {
  return (
    <div
      className={cn("h-full overflow-y-auto px-6 py-5", className)}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="relative aspect-[16/10] w-full max-w-md overflow-hidden rounded-xl bg-muted">
        <Image src={link.image} alt={link.alt} fill className="object-cover" sizes="448px" />
      </div>

      <h1 className="mt-4 text-lg font-semibold">{link.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{link.summary}</p>

      <div className="mt-4 max-w-md rounded-xl bg-muted/50 px-4 py-2">
        <MetaRow label="Role" value={link.role} />
        <MetaRow label="Years" value={link.years} />
        <MetaRow label="Kind" value="Web Internet Location" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {link.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white can-hover:hover:bg-blue-600"
      >
        Open in Safari
      </button>
    </div>
  );
}
