// Shape of the baked Spotify metadata in `data.ts`.
//
// This file describes text only — names, art URLs, durations, and the Spotify
// URIs that `loadUri()` accepts. No audio is stored or served by this repo;
// playback happens inside Spotify's own embed, which streams from Spotify.

export interface SpotifyTrack {
  id: string;
  uri: string; // spotify:track:… — what the embed controller receives
  name: string;
  artists: string;
  album: string;
  albumArt: string; // i.scdn.co URL
  durationMs: number;
  explicit: boolean;
  addedAt: string; // ISO timestamp of when it was added to the playlist
  externalUrl: string; // open.spotify.com link — required by Spotify's terms
}

export interface SpotifyPlaylist {
  id: string;
  uri: string;
  name: string;
  description: string;
  coverArt: string;
  externalUrl: string;
  owner: string;
  tracks: SpotifyTrack[];
}

/**
 * Audiobooks are Spotify "shows". Only the show itself embeds — individual
 * chapter (episode) URIs return "Page not available" — and logged-out visitors
 * get a sample rather than the book, so no chapter list is stored: listing
 * chapters nobody can play would be dead UI.
 */
export interface SpotifyAudiobook {
  id: string;
  uri: string; // spotify:show:…
  name: string;
  author: string;
  narrator: string;
  description: string;
  coverArt: string;
  totalChapters: number;
  explicit: boolean;
  externalUrl: string;
}

export type SpotifyView = "home" | "playlist" | "audiobook";

export type LibraryFilter = "all" | "playlists" | "audiobooks";
