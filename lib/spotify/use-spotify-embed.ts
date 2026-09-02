"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SpotifyEmbedController,
  SpotifyIframeApi,
  SpotifyPlaybackUpdate,
} from "@/types/spotify";

const IFRAME_API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

/**
 * `window.onSpotifyIframeApiReady` is a single global that Spotify invokes once,
 * when the script finishes loading. A component mounting after that point would
 * never see it, so the API object is cached in a module-scope promise and every
 * consumer awaits the same one.
 */
let apiPromise: Promise<SpotifyIframeApi> | null = null;

function loadIframeApi(): Promise<SpotifyIframeApi> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<SpotifyIframeApi>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Spotify IFrame API requires a browser"));
      return;
    }

    window.onSpotifyIframeApiReady = (api) => resolve(api);

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${IFRAME_API_SRC}"]`
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = IFRAME_API_SRC;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load the Spotify IFrame API"));
    document.body.appendChild(script);
  });

  return apiPromise;
}

export interface SpotifyEmbedState {
  playingUri: string | null;
  isPaused: boolean;
  isBuffering: boolean;
  positionMs: number;
  durationMs: number;
}

const INITIAL_STATE: SpotifyEmbedState = {
  playingUri: null,
  isPaused: true,
  isBuffering: false,
  positionMs: 0,
  durationMs: 0,
};

interface UseSpotifyEmbedOptions {
  /** Loaded into the embed on mount so the bar is not blank before first play. */
  initialUri?: string;
  height?: number;
}

export interface UseSpotifyEmbedResult {
  /** Attach to the element the controller replaces with its iframe. */
  hostRef: React.RefObject<HTMLDivElement>;
  state: SpotifyEmbedState;
  isReady: boolean;
  failed: boolean;
  playTrack: (uri: string) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
}

export function useSpotifyEmbed({
  initialUri,
  height = 80,
}: UseSpotifyEmbedOptions = {}): UseSpotifyEmbedResult {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const pendingPlayRef = useRef(false);
  const queuedUriRef = useRef<string | null>(null);

  const [state, setState] = useState<SpotifyEmbedState>(INITIAL_STATE);
  const [isReady, setIsReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadIframeApi()
      .then((api) => {
        if (cancelled || !hostRef.current) return;

        api.createController(
          hostRef.current,
          { uri: initialUri ?? "", width: "100%", height },
          (controller) => {
            if (cancelled) {
              controller.destroy();
              return;
            }
            controllerRef.current = controller;

            controller.addListener("ready", () => {
              setIsReady(true);
              // loadUri() and an immediate play() can race; if the play did not
              // take, this is the reliable moment to retry it.
              if (pendingPlayRef.current) controller.play();
            });

            controller.addListener("playback_update", (event) => {
              const data: SpotifyPlaybackUpdate = event.data;
              if (!data.isPaused) pendingPlayRef.current = false;
              setState({
                playingUri: data.playingURI || null,
                isPaused: data.isPaused,
                isBuffering: data.isBuffering,
                positionMs: data.position,
                durationMs: data.duration,
              });
            });

            // A track clicked before the controller existed still plays.
            const queued = queuedUriRef.current;
            if (queued) {
              queuedUriRef.current = null;
              pendingPlayRef.current = true;
              controller.loadUri(queued);
              controller.play();
            }
          }
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
    // Deliberately mount-only: re-creating the controller would restart playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTrack = useCallback(
    (uri: string) => {
      const controller = controllerRef.current;
      if (!controller) {
        queuedUriRef.current = uri;
        return;
      }
      if (state.playingUri === uri) {
        controller.togglePlay();
        return;
      }
      pendingPlayRef.current = true;
      controller.loadUri(uri);
      controller.play();
    },
    [state.playingUri]
  );

  const togglePlay = useCallback(() => {
    controllerRef.current?.togglePlay();
  }, []);

  const seek = useCallback((seconds: number) => {
    controllerRef.current?.seek(seconds);
  }, []);

  return { hostRef, state, isReady, failed, playTrack, togglePlay, seek };
}
