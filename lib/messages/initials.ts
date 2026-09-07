/**
 * Initials for an avatar with no picture.
 *
 * The naive version took the first letter of every space-separated word, which
 * turned "Fred again.." into "Fa". Real names get two letters, first and last;
 * a stage name or a single name gets one. A trailing word only counts as a
 * surname when it is capitalized, so a lowercase suffix is left alone.
 */
export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word));
  if (words.length === 0) return "";

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1] : "";
  const lastInitial = last && /^\p{Lu}/u.test(last) ? last[0] : "";

  return `${first}${lastInitial}`.toUpperCase();
}
