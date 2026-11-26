import { spokenName } from "@/lib/spotify/format";

/** A name as written for the eye, and as `spokenName` puts it for a screen reader. */
export function SpokenName({ name }: { name: string }) {
  const spoken = spokenName(name);
  if (spoken === name) return <>{name}</>;
  return (
    <>
      <span aria-hidden="true">{name}</span>
      <span className="sr-only">{spoken}</span>
    </>
  );
}
