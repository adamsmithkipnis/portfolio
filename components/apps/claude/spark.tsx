import { cn } from "@/lib/utils";

/** The spark mark beside Claude's greeting and while a reply streams. */
export function ClaudeSpark({ className }: { className?: string }) {
  const rays = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5];
  return (
    <svg viewBox="-12 -12 24 24" aria-hidden className={cn("text-[var(--claude-accent)]", className)}>
      {rays.map((angle) => (
        <line
          key={angle}
          x1="0"
          y1="-10"
          x2="0"
          y2="10"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          transform={`rotate(${angle})`}
        />
      ))}
    </svg>
  );
}
