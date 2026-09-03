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

export type SpotifyView = "home" | "playlist";
