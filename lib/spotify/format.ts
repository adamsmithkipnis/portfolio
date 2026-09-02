import type { SpotifyPlaylist, SpotifyTrack } from "./types";

const TRACK_URI_PATTERN = /^spotify:track:[A-Za-z0-9]{22}$/;

/** `225000` → `"3:45"`. Negative and non-finite input collapses to "0:00". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Long form used for playlist totals: `"1 hr 12 min"` / `"12 min"`. */
export function formatTotalDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 min";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

export function isValidTrackUri(uri: string): boolean {
  return TRACK_URI_PATTERN.test(uri);
}

/** `"spotify:track:abc…"` → `"abc…"`. Returns null for anything malformed. */
export function trackIdFromUri(uri: string): string | null {
  if (!isValidTrackUri(uri)) return null;
  return uri.slice("spotify:track:".length);
}

export function totalPlaylistDuration(
  tracks: readonly Pick<SpotifyTrack, "durationMs">[]
): number {
  return tracks.reduce(
    (sum, track) => sum + (Number.isFinite(track.durationMs) ? track.durationMs : 0),
    0
  );
}

export function findPlaylistById(
  playlists: readonly SpotifyPlaylist[],
  id: string | null
): SpotifyPlaylist | null {
  if (!id) return null;
  return playlists.find((playlist) => playlist.id === id) ?? null;
}
