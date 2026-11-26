/**
 * The track waiting in the now-playing bar before a visitor has played
 * anything, so the bar shows a song rather than an empty prompt. It is the
 * first thing seen of Spotify on a first visit, where the window peeks out
 * from behind Safari. Must be a track in one of the playlists in
 * lib/spotify/data.ts; a test checks that.
 */
export const SPOTIFY_INITIAL_TRACK_URI = "spotify:track:2fra2QU35L5uh0F8OlSchm"; // The Veldt (8 Minute Edit) — deadmau5, Chris James
