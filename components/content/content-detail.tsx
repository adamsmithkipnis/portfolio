"use client";

import { cn } from "@/lib/utils";
import type { ContentNode } from "@/system/content/types";
import { CaseStudyBody } from "./case-study-body";

interface ContentDetailProps {
  node: ContentNode;
  className?: string;
}

// Org is redacted rather than removed, so confidential work still reads as real work.
function displayOrg(node: ContentNode): string | undefined {
  const meta = node.meta;
  if (!meta) return undefined;
  return meta.confidential ? "Undisclosed (under NDA)" : meta.org;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{value}</span>
    </div>
  );
}

export function ContentDetail({ node, className }: ContentDetailProps) {
  const meta = node.meta;
  const org = displayOrg(node);

  return (
    <div
      className={cn("h-full overflow-y-auto px-6 py-5", className)}
      // Finder clears the selection when the background is clicked; without this,
      // playing a video or following a link would close the pane you're reading.
      onClick={(event) => event.stopPropagation()}
    >
      <h1 className="text-lg font-semibold">{node.name}</h1>

      {meta && (
        <>
          {meta.summary && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{meta.summary}</p>
          )}

          <div className="mt-4 max-w-md rounded-xl bg-muted/50 px-4 py-2">
            {meta.role && <MetaRow label="Role" value={meta.role} />}
            {org && <MetaRow label="Org" value={org} />}
            {meta.year !== undefined && <MetaRow label="Year" value={String(meta.year)} />}
            {meta.duration && <MetaRow label="Duration" value={meta.duration} />}
            {meta.team && <MetaRow label="Team" value={meta.team} />}
          </div>

          {meta.outcomes && meta.outcomes.length > 0 && (
            <div className="mt-4 max-w-md">
              <h2 className="mb-1.5 text-xs font-semibold text-muted-foreground">Outcomes</h2>
              <div className="rounded-xl bg-muted/50 px-4 py-2">
                {meta.outcomes.map((outcome) => (
                  <div
                    key={`${outcome.label}-${outcome.value}`}
                    className="flex items-baseline justify-between gap-3 py-1"
                  >
                    <span className="text-xs text-muted-foreground">{outcome.label}</span>
                    <span className="text-sm font-medium tabular-nums">{outcome.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meta.tags && meta.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {node.body && <CaseStudyBody body={node.body} className="mt-5" />}

      {!node.body && !meta && (
        <p className="mt-2 text-xs text-muted-foreground">
          {node.children?.length
            ? `${node.children.length} item${node.children.length === 1 ? "" : "s"}`
            : "Empty folder"}
        </p>
      )}
    </div>
  );
}
