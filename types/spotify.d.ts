// Types for Spotify's Embed IFrame API.
// Script: https://open.spotify.com/embed/iframe-api/v1
// Docs:   https://developer.spotify.com/documentation/embeds/references/iframe-api

export interface SpotifyPlaybackUpdate {
  playingURI: string;
  isPaused: boolean;
  isBuffering: boolean;
  duration: number; // milliseconds
  position: number; // milliseconds
}

export interface SpotifyPlaybackStarted {
  playingURI: string;
}

export interface SpotifyEmbedController {
  loadUri(uri: string, preferVideo?: boolean, startAt?: number): void;
  loadEntity(uriOrUrl: string, preferVideo?: boolean, startAt?: number): void;
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  restart(): void;
  seek(seconds: number): void;
  destroy(): void;
  addListener(event: "ready", cb: () => void): void;
  addListener(event: "playback_started", cb: (e: SpotifyPlaybackStarted) => void): void;
  addListener(event: "playback_update", cb: (e: { data: SpotifyPlaybackUpdate }) => void): void;
}

export interface SpotifyEmbedControllerOptions {
  uri?: string;
  width?: string | number;
  height?: string | number;
}

export interface SpotifyIframeApi {
  createController(
    element: HTMLElement,
    options: SpotifyEmbedControllerOptions,
    callback: (controller: SpotifyEmbedController) => void
  ): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
  }
}
